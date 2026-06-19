package com.library.loan.client;

import java.util.UUID;

public record UserDto(UUID user_id, String email, String role, String status, String full_name) {}
