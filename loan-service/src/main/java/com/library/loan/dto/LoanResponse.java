package com.library.loan.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LoanResponse(
        UUID loan_id,
        UUID user_id,
        UUID copy_id,
        OffsetDateTime borrow_date,
        OffsetDateTime due_date,
        OffsetDateTime return_date,
        String status,
        BigDecimal fine_amount,
        boolean is_overdue,
        BigDecimal current_fine_estimate
) {}
