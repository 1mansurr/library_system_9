package com.library.book.dto;

import java.util.List;

public record PagedBooks(List<BookSummary> content, int page, int size, long total) {}
