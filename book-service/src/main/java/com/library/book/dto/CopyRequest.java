package com.library.book.dto;

import jakarta.validation.constraints.NotBlank;

public record CopyRequest(@NotBlank String barcode, String location) {}
