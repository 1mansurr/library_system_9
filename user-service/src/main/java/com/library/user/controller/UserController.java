package com.library.user.controller;

import com.library.user.dto.StatusUpdateRequest;
import com.library.user.dto.UserResponse;
import com.library.user.security.UserPrincipal;
import com.library.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUser(principal.getUserId()));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<UserResponse> updateStatus(@PathVariable UUID userId,
                                                      @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateStatus(userId, request));
    }
}
