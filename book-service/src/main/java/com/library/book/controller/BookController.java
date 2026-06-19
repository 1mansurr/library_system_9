package com.library.book.controller;

import com.library.book.dto.*;
import com.library.book.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping("/books")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<BookSummary> addBook(@Valid @RequestBody BookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.addBook(request));
    }

    @GetMapping("/books")
    public ResponseEntity<PagedBooks> listBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(name = "available_only", defaultValue = "false") boolean availableOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookService.listBooks(title, author, category, availableOnly, page, size));
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<BookDetail> getBook(@PathVariable UUID bookId) {
        return ResponseEntity.ok(bookService.getBook(bookId));
    }

    @PostMapping("/books/{bookId}/copies")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<CopyDetail> addCopy(@PathVariable UUID bookId,
                                               @Valid @RequestBody CopyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.addCopy(bookId, request));
    }

    @GetMapping("/copies/{copyId}")
    public ResponseEntity<CopyDetail> getCopy(@PathVariable UUID copyId) {
        return ResponseEntity.ok(bookService.getCopy(copyId));
    }

    @PatchMapping("/copies/{copyId}/status")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<CopyDetail> updateCopyStatus(@PathVariable UUID copyId,
                                                        @Valid @RequestBody CopyStatusRequest request) {
        return ResponseEntity.ok(bookService.updateCopyStatus(copyId, request));
    }
}
