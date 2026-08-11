package com.library.book.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record BookRequest(
        @NotBlank String isbn,
        @NotBlank String title,
        @NotBlank String author,
        UUID course_id
) {}
