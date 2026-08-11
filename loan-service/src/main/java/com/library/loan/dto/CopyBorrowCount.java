package com.library.loan.dto;

import java.util.UUID;

public record CopyBorrowCount(UUID copy_id, Long borrow_count) {}
