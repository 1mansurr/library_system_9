package com.library.book.dto;

import java.util.UUID;

public record BookSummary(
        UUID book_id,
        String title,
        String author,
        String isbn,
        UUID course_id,
        String course_name,
        String department_name,
        String college_name,
        long available_copies,
        long total_copies
) {}
