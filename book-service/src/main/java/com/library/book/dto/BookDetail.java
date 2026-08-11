package com.library.book.dto;

import java.util.List;
import java.util.UUID;

public record BookDetail(
        UUID book_id,
        String isbn,
        String title,
        String author,
        UUID course_id,
        String course_name,
        String department_name,
        String college_name,
        List<CopyDetail> copies
) {}
