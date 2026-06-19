package com.library.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String full_name,
        @NotNull String member_type,
        String matric_no,
        String staff_id,
        String phone
) {}
