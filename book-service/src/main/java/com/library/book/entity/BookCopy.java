package com.library.book.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "book_copies")
public class BookCopy {

    @Id
    @Column(name = "copy_id")
    private UUID copyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(unique = true, nullable = false)
    private String barcode;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    @Column
    private String location;

    public UUID getCopyId() { return copyId; }
    public void setCopyId(UUID copyId) { this.copyId = copyId; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
