package com.library.book.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CopyStatusRequest(
        @NotBlank @Pattern(regexp = "AVAILABLE|LOANED|LOST") String status
) {}
