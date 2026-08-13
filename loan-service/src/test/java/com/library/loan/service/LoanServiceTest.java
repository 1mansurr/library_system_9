package com.library.loan.service;

import com.library.loan.entity.Loan;
import com.library.loan.exception.ConflictException;
import com.library.loan.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;
    @Mock
    private RestClient userServiceClient;
    @Mock
    private RestClient bookServiceClient;

    private LoanService loanService;

    @BeforeEach
    void setUp() {
        loanService = new LoanService(loanRepository, userServiceClient, bookServiceClient, 
                14, BigDecimal.valueOf(0.50), 5, "token123");
    }

    @Test
    void getLoan_success() {
        UUID loanId = UUID.randomUUID();
        UUID callerId = UUID.randomUUID();
        Loan loan = new Loan();
        loan.setLoanId(loanId);
        loan.setUserId(callerId);
        loan.setStatus("BORROWED");
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));

        var response = loanService.getLoan(loanId, callerId, false);
        assertEquals(loanId, response.loan_id());
    }

    @Test
    void returnLoan_alreadyReturned() {
        UUID loanId = UUID.randomUUID();
        UUID callerId = UUID.randomUUID();
        Loan loan = new Loan();
        loan.setStatus("RETURNED");
        loan.setUserId(callerId);
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));

        assertThrows(ConflictException.class, () -> loanService.returnLoan(loanId, callerId, false));
    }
}
