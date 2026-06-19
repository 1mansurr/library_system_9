package com.library.book.dto;

import java.util.UUID;

public record BookSummary(
        UUID book_id,
        String title,
        String author,
        String isbn,
        String category,
        long available_copies,
        long total_copies
) {}
