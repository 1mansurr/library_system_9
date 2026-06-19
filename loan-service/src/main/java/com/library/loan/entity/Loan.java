package com.library.loan.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @Column(name = "loan_id")
    private UUID loanId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "copy_id", nullable = false)
    private UUID copyId;

    @Column(name = "borrow_date", nullable = false)
    private OffsetDateTime borrowDate;

    @Column(name = "due_date", nullable = false)
    private OffsetDateTime dueDate;

    @Column(name = "return_date")
    private OffsetDateTime returnDate;

    @Column(nullable = false)
    private String status;

    @Column(name = "fine_amount", precision = 10, scale = 2)
    private BigDecimal fineAmount;

    public UUID getLoanId() { return loanId; }
    public void setLoanId(UUID loanId) { this.loanId = loanId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getCopyId() { return copyId; }
    public void setCopyId(UUID copyId) { this.copyId = copyId; }
    public OffsetDateTime getBorrowDate() { return borrowDate; }
    public void setBorrowDate(OffsetDateTime borrowDate) { this.borrowDate = borrowDate; }
    public OffsetDateTime getDueDate() { return dueDate; }
    public void setDueDate(OffsetDateTime dueDate) { this.dueDate = dueDate; }
    public OffsetDateTime getReturnDate() { return returnDate; }
    public void setReturnDate(OffsetDateTime returnDate) { this.returnDate = returnDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getFineAmount() { return fineAmount; }
    public void setFineAmount(BigDecimal fineAmount) { this.fineAmount = fineAmount; }
}
