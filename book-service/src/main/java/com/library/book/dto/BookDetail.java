package com.library.book.dto;

import java.util.List;
import java.util.UUID;

public record BookDetail(
        UUID book_id,
        String isbn,
        String title,
        String author,
        String category,
        List<CopyDetail> copies
) {}
