package com.library.user.dto;

import java.util.UUID;

public record RegisterResponse(UUID user_id, String email, String card_number) {}
