package com.library.loan.repository;

import com.library.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<Loan, UUID> {

    List<Loan> findByUserId(UUID userId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.userId = :userId AND l.status = 'BORROWED'")
    long countActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT l FROM Loan l WHERE l.status = 'BORROWED' AND l.dueDate < :now")
    List<Loan> findOverdue(@Param("now") OffsetDateTime now);
}
