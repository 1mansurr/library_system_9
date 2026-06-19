package com.library.book.repository;

import com.library.book.entity.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookCopyRepository extends JpaRepository<BookCopy, UUID> {
    List<BookCopy> findByBook_BookId(UUID bookId);

    @Query("SELECT COUNT(c) FROM BookCopy c WHERE c.book.bookId = :bookId AND c.status = 'AVAILABLE'")
    long countAvailableByBookId(@Param("bookId") UUID bookId);

    @Query("SELECT COUNT(c) FROM BookCopy c WHERE c.book.bookId = :bookId")
    long countTotalByBookId(@Param("bookId") UUID bookId);
}
