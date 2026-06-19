package com.library.loan.service;

import com.library.loan.client.CopyDto;
import com.library.loan.client.CopyStatusRequest;
import com.library.loan.client.UserDto;
import com.library.loan.dto.BorrowRequest;
import com.library.loan.dto.LoanResponse;
import com.library.loan.entity.Loan;
import com.library.loan.exception.*;
import com.library.loan.repository.LoanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class LoanService {

    private static final Logger log = LoggerFactory.getLogger(LoanService.class);

    private final LoanRepository loanRepository;
    private final RestClient userServiceClient;
    private final RestClient bookServiceClient;
    private final int loanPeriodDays;
    private final BigDecimal dailyRate;
    private final int maxActiveLoans;
    private final String serviceToken;

    public LoanService(LoanRepository loanRepository,
                       @Qualifier("userServiceClient") RestClient userServiceClient,
                       @Qualifier("bookServiceClient") RestClient bookServiceClient,
                       @Value("${loan.period-days}") int loanPeriodDays,
                       @Value("${loan.daily-rate}") BigDecimal dailyRate,
                       @Value("${loan.max-active-per-user}") int maxActiveLoans,
                       @Value("${service.token}") String serviceToken) {
        this.loanRepository = loanRepository;
        this.userServiceClient = userServiceClient;
        this.bookServiceClient = bookServiceClient;
        this.loanPeriodDays = loanPeriodDays;
        this.dailyRate = dailyRate;
        this.maxActiveLoans = maxActiveLoans;
        this.serviceToken = serviceToken;
    }

    @Transactional
    public LoanResponse borrow(UUID userId, BorrowRequest request, String bearerToken) {
        UUID copyId = request.copy_id();
        String correlationId = UUID.randomUUID().toString();

        UserDto user = fetchUser(userId, bearerToken, correlationId);
        if (!"ACTIVE".equals(user.status())) {
            throw new ForbiddenException("User account is not active");
        }

        long activeCount = loanRepository.countActiveByUserId(userId);
        if (activeCount >= maxActiveLoans) {
            throw new ConflictException("User has reached the maximum active loan limit (" + maxActiveLoans + ")");
        }

        CopyDto copy = fetchCopy(copyId, bearerToken, correlationId);
        if (!"AVAILABLE".equals(copy.status())) {
            throw new ConflictException("Copy is not available for borrowing (status: " + copy.status() + ")");
        }

        updateCopyStatus(copyId, "LOANED", correlationId);

        Loan loan = new Loan();
        loan.setLoanId(UUID.randomUUID());
        loan.setUserId(userId);
        loan.setCopyId(copyId);
        OffsetDateTime now = OffsetDateTime.now();
        loan.setBorrowDate(now);
        loan.setDueDate(now.plusDays(loanPeriodDays));
        loan.setStatus("BORROWED");
        try {
            loanRepository.save(loan);
        } catch (Exception e) {
            log.error("[{}] Failed to persist loan, attempting to revert copy {} to AVAILABLE", correlationId, copyId, e);
            try {
                updateCopyStatus(copyId, "AVAILABLE", correlationId);
            } catch (Exception revertEx) {
                log.error("[{}] Failed to revert copy {} to AVAILABLE after loan save failure", correlationId, copyId, revertEx);
            }
            throw new ServiceUnavailableException("Failed to create loan record");
        }

        log.info("[{}] Loan {} created for user {} copy {}", correlationId, loan.getLoanId(), userId, copyId);
        return toLoanResponse(loan);
    }

    @Transactional
    public LoanResponse returnLoan(UUID loanId, UUID callerId, boolean isLibrarian) {
        String correlationId = UUID.randomUUID().toString();

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NotFoundException("Loan not found: " + loanId));

        if (!"BORROWED".equals(loan.getStatus())) {
            throw new ConflictException("Loan is not in BORROWED status");
        }

        if (!isLibrarian && !loan.getUserId().equals(callerId)) {
            throw new ForbiddenException("Not authorized to return this loan");
        }

        OffsetDateTime returnDate = OffsetDateTime.now();
        loan.setReturnDate(returnDate);

        long daysLate = ChronoUnit.DAYS.between(loan.getDueDate(), returnDate);
        if (daysLate < 0) daysLate = 0;
        // Use ceiling: if any fraction of a day is overdue, count it
        long secondsLate = ChronoUnit.SECONDS.between(loan.getDueDate(), returnDate);
        if (secondsLate > 0) {
            daysLate = (long) Math.ceil((double) secondsLate / 86400.0);
        }

        loan.setFineAmount(dailyRate.multiply(BigDecimal.valueOf(daysLate)).setScale(2, RoundingMode.HALF_UP));
        loan.setStatus("RETURNED");
        loanRepository.save(loan);

        updateCopyStatus(loan.getCopyId(), "AVAILABLE", correlationId);

        log.info("[{}] Loan {} returned, fine={}", correlationId, loanId, loan.getFineAmount());
        return toLoanResponse(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getMyLoans(UUID userId) {
        return loanRepository.findByUserId(userId).stream().map(this::toLoanResponse).toList();
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoan(UUID loanId, UUID callerId, boolean isLibrarian) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NotFoundException("Loan not found: " + loanId));
        if (!isLibrarian && !loan.getUserId().equals(callerId)) {
            throw new ForbiddenException("Not authorized to view this loan");
        }
        return toLoanResponse(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getOverdueLoans() {
        return loanRepository.findOverdue(OffsetDateTime.now()).stream().map(this::toLoanResponse).toList();
    }

    private UserDto fetchUser(UUID userId, String bearerToken, String correlationId) {
        try {
            return userServiceClient.get()
                    .uri("/api/users/{id}", userId)
                    .header("Authorization", "Bearer " + bearerToken)
                    .header("X-Correlation-Id", correlationId)
                    .retrieve()
                    .body(UserDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new NotFoundException("User not found: " + userId);
        } catch (RestClientException e) {
            log.error("[{}] Failed to reach user-service: {}", correlationId, e.getMessage());
            throw new ServiceUnavailableException("user-service unavailable");
        }
    }

    private CopyDto fetchCopy(UUID copyId, String bearerToken, String correlationId) {
        try {
            return bookServiceClient.get()
                    .uri("/api/copies/{id}", copyId)
                    .header("Authorization", "Bearer " + bearerToken)
                    .header("X-Correlation-Id", correlationId)
                    .retrieve()
                    .body(CopyDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new NotFoundException("Copy not found: " + copyId);
        } catch (RestClientException e) {
            log.error("[{}] Failed to reach book-service: {}", correlationId, e.getMessage());
            throw new ServiceUnavailableException("book-service unavailable");
        }
    }

    private void updateCopyStatus(UUID copyId, String status, String correlationId) {
        try {
            bookServiceClient.patch()
                    .uri("/api/copies/{id}/status", copyId)
                    .header("X-Service-Token", serviceToken)
                    .header("X-Correlation-Id", correlationId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new CopyStatusRequest(status))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("[{}] Failed to update copy {} status to {}: {}", correlationId, copyId, status, e.getMessage());
            throw new ServiceUnavailableException("book-service unavailable when updating copy status");
        }
    }

    private LoanResponse toLoanResponse(Loan loan) {
        OffsetDateTime now = OffsetDateTime.now();
        boolean isOverdue = "BORROWED".equals(loan.getStatus()) && loan.getDueDate().isBefore(now);

        BigDecimal currentFineEstimate = null;
        if ("BORROWED".equals(loan.getStatus()) && isOverdue) {
            long secondsLate = ChronoUnit.SECONDS.between(loan.getDueDate(), now);
            long daysLate = (long) Math.ceil((double) secondsLate / 86400.0);
            currentFineEstimate = dailyRate.multiply(BigDecimal.valueOf(daysLate)).setScale(2, RoundingMode.HALF_UP);
        }

        return new LoanResponse(
                loan.getLoanId(),
                loan.getUserId(),
                loan.getCopyId(),
                loan.getBorrowDate(),
                loan.getDueDate(),
                loan.getReturnDate(),
                loan.getStatus(),
                loan.getFineAmount(),
                isOverdue,
                currentFineEstimate
        );
    }
}
