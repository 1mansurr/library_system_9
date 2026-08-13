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
        WHERE (
            (:hasTitle = false AND :hasAuthor = false)
            OR (:hasTitle = true AND LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%')))
            OR (:hasAuthor = true AND LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%')))
          )
          AND (:courseId IS NULL OR b.course.courseId = :courseId)
          AND (:availableOnly = false OR EXISTS (
                SELECT c FROM BookCopy c WHERE c.book = b AND c.status = 'AVAILABLE'))
        """)
    Page<Book> search(@Param("title") String title,
                      @Param("author") String author,
                      @Param("hasTitle") boolean hasTitle,
                      @Param("hasAuthor") boolean hasAuthor,
                      @Param("courseId") UUID courseId,
                      @Param("availableOnly") boolean availableOnly,
                      Pageable pageable);
}
