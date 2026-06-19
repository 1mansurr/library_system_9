package com.library.book.repository;

import com.library.book.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID> {
    boolean existsByIsbn(String isbn);

    @Query("""
        SELECT DISTINCT b FROM Book b
        WHERE (:title = '' OR LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%')))
          AND (:author = '' OR LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%')))
          AND (:category = '' OR LOWER(b.category) LIKE LOWER(CONCAT('%', :category, '%')))
          AND (:availableOnly = false OR EXISTS (
                SELECT c FROM BookCopy c WHERE c.book = b AND c.status = 'AVAILABLE'))
        """)
    Page<Book> search(@Param("title") String title,
                      @Param("author") String author,
                      @Param("category") String category,
                      @Param("availableOnly") boolean availableOnly,
                      Pageable pageable);
}
