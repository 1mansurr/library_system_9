package com.library.book.service;

import com.library.book.dto.BookRequest;
import com.library.book.entity.Book;
import com.library.book.exception.ConflictException;
import com.library.book.repository.BookCopyRepository;
import com.library.book.repository.BookRepository;
import com.library.book.repository.CourseOfStudyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private BookCopyRepository bookCopyRepository;
    @Mock
    private CourseOfStudyRepository courseOfStudyRepository;

    private BookService bookService;

    @BeforeEach
    void setUp() {
        bookService = new BookService(bookRepository, bookCopyRepository, courseOfStudyRepository, 100);
    }

    @Test
    void addBook_success() {
        BookRequest req = new BookRequest("12345", "Test Book", "Author", null);
        when(bookRepository.existsByIsbn("12345")).thenReturn(false);
        when(bookRepository.save(any())).thenAnswer(i -> {
            Book b = i.getArgument(0);
            b.setBookId(java.util.UUID.randomUUID());
            return b;
        });
        when(bookCopyRepository.countAvailableByBookId(any())).thenReturn(0L);
        when(bookCopyRepository.countTotalByBookId(any())).thenReturn(0L);

        bookService.addBook(req);

        verify(bookRepository, times(1)).save(any());
    }

    @Test
    void addBook_conflict() {
        BookRequest req = new BookRequest("12345", "Test Book", "Author", null);
        when(bookRepository.existsByIsbn("12345")).thenReturn(true);

        assertThrows(ConflictException.class, () -> bookService.addBook(req));
        verify(bookRepository, never()).save(any());
    }
}
