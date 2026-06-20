package com.library.book.service;

import com.library.book.dto.*;
import com.library.book.entity.Book;
import com.library.book.entity.BookCopy;
import com.library.book.exception.ConflictException;
import com.library.book.exception.NotFoundException;
import com.library.book.repository.BookCopyRepository;
import com.library.book.repository.BookRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BookService {

    private static final Logger log = LoggerFactory.getLogger(BookService.class);

    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;

    public BookService(BookRepository bookRepository, BookCopyRepository bookCopyRepository) {
        this.bookRepository = bookRepository;
        this.bookCopyRepository = bookCopyRepository;
    }

    @Transactional
    public BookSummary addBook(BookRequest request) {
        if (bookRepository.existsByIsbn(request.isbn())) {
            throw new ConflictException("ISBN already exists: " + request.isbn());
        }
        Book book = new Book();
        book.setBookId(UUID.randomUUID());
        book.setIsbn(request.isbn());
        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setCategory(request.category());
        bookRepository.save(book);
        log.info("Added book {} ({})", book.getBookId(), book.getTitle());
        return toSummary(book);
    }

    @Transactional(readOnly = true)
    public PagedBooks listBooks(String title, String author, String category, boolean availableOnly, int page, int size) {
        Page<Book> result = bookRepository.search(
                title == null || title.isBlank() ? "" : title,
                author == null || author.isBlank() ? "" : author,
                category == null || category.isBlank() ? "" : category,
                availableOnly,
                PageRequest.of(page, size)
        );

        List<BookSummary> summaries = result.getContent().stream().map(this::toSummary).toList();
        return new PagedBooks(summaries, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public BookDetail getBook(UUID bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("Book not found: " + bookId));
        List<CopyDetail> copies = bookCopyRepository.findByBook_BookId(bookId).stream()
                .map(c -> new CopyDetail(c.getCopyId(), c.getBarcode(), c.getStatus(), c.getLocation(),
                        book.getBookId(), book.getTitle(), book.getAuthor()))
                .toList();
        return new BookDetail(book.getBookId(), book.getIsbn(), book.getTitle(),
                book.getAuthor(), book.getCategory(), copies);
    }

    @Transactional
    public CopyDetail addCopy(UUID bookId, CopyRequest request) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("Book not found: " + bookId));
        BookCopy copy = new BookCopy();
        copy.setCopyId(UUID.randomUUID());
        copy.setBook(book);
        copy.setBarcode(request.barcode());
        copy.setLocation(request.location());
        copy.setStatus("AVAILABLE");
        bookCopyRepository.save(copy);
        log.info("Added copy {} for book {}", copy.getCopyId(), bookId);
        return new CopyDetail(copy.getCopyId(), copy.getBarcode(), copy.getStatus(), copy.getLocation(),
                book.getBookId(), book.getTitle(), book.getAuthor());
    }

    @Transactional(readOnly = true)
    public CopyDetail getCopy(UUID copyId) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new NotFoundException("Copy not found: " + copyId));
        Book book = copy.getBook();
        return new CopyDetail(copy.getCopyId(), copy.getBarcode(), copy.getStatus(), copy.getLocation(),
                book.getBookId(), book.getTitle(), book.getAuthor());
    }

    @Transactional
    public CopyDetail updateCopyStatus(UUID copyId, CopyStatusRequest request) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new NotFoundException("Copy not found: " + copyId));
        copy.setStatus(request.status());
        bookCopyRepository.save(copy);
        log.info("Copy {} status updated to {}", copyId, request.status());
        Book book = copy.getBook();
        return new CopyDetail(copy.getCopyId(), copy.getBarcode(), copy.getStatus(), copy.getLocation(),
                book.getBookId(), book.getTitle(), book.getAuthor());
    }

    private BookSummary toSummary(Book book) {
        long available = bookCopyRepository.countAvailableByBookId(book.getBookId());
        long total = bookCopyRepository.countTotalByBookId(book.getBookId());
        return new BookSummary(book.getBookId(), book.getTitle(), book.getAuthor(),
                book.getIsbn(), book.getCategory(), available, total);
    }
}
