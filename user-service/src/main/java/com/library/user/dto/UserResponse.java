package com.library.user.dto;

import java.util.UUID;

public record UserResponse(
        UUID user_id,
        String email,
        String role,
        String status,
        String full_name,
        String member_type,
        String card_number,
        String matric_no,
        String staff_id,
        String phone
) {}
