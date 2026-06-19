package com.library.user.dto;

import java.util.UUID;

public record LoginResponse(
        String token,
        UUID user_id,
        String role,
        String member_type,
        String full_name
) {}
