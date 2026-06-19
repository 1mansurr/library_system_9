package com.library.book.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @Column(name = "book_id")
    private UUID bookId;

    @Column(unique = true, nullable = false)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column
    private String category;

    @OneToMany(mappedBy = "book", fetch = FetchType.LAZY)
    private List<BookCopy> copies = new ArrayList<>();

    public UUID getBookId() { return bookId; }
    public void setBookId(UUID bookId) { this.bookId = bookId; }
    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<BookCopy> getCopies() { return copies; }
    public void setCopies(List<BookCopy> copies) { this.copies = copies; }
}
