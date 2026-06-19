package com.library.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record StatusUpdateRequest(
        @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status
) {}
