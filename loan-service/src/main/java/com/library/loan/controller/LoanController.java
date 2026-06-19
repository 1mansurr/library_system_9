package com.library.loan.controller;

import com.library.loan.dto.BorrowRequest;
import com.library.loan.dto.LoanResponse;
import com.library.loan.security.UserPrincipal;
import com.library.loan.service.LoanService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping
    public ResponseEntity<LoanResponse> borrow(@Valid @RequestBody BorrowRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal,
                                                HttpServletRequest httpRequest) {
        String rawToken = extractRawToken(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.borrow(principal.getUserId(), request, rawToken));
    }

    @PostMapping("/{loanId}/return")
    public ResponseEntity<LoanResponse> returnLoan(@PathVariable UUID loanId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        boolean isLibrarian = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LIBRARIAN"));
        return ResponseEntity.ok(loanService.returnLoan(loanId, principal.getUserId(), isLibrarian));
    }

    @GetMapping("/me")
    public ResponseEntity<List<LoanResponse>> myLoans(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(loanService.getMyLoans(principal.getUserId()));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<List<LoanResponse>> overdueLoans() {
        return ResponseEntity.ok(loanService.getOverdueLoans());
    }

    @GetMapping("/{loanId}")
    public ResponseEntity<LoanResponse> getLoan(@PathVariable UUID loanId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        boolean isLibrarian = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LIBRARIAN"));
        return ResponseEntity.ok(loanService.getLoan(loanId, principal.getUserId(), isLibrarian));
    }

    private String extractRawToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return "";
    }
}
