package com.library.book.dto;

import java.util.UUID;

public record CopyDetail(UUID copy_id, String barcode, String status, String location) {}
