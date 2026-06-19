package com.library.loan.client;

import java.util.UUID;

public record CopyDto(UUID copy_id, String barcode, String status, String location) {}
