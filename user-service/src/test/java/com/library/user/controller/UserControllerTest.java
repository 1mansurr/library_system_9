package com.library.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.user.dto.StatusUpdateRequest;
import com.library.user.dto.UserResponse;
import com.library.user.security.JwtAuthFilter;
import com.library.user.security.JwtService;
import com.library.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple controller unit tests
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;
    
    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getUser_returnsOk() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse response = new UserResponse(userId, "test@test.com", "STUDENT", "ACTIVE", "Test User", "STUDENT", "C123", "M123", null, "1234");
        when(userService.getUser(userId)).thenReturn(response);

        mockMvc.perform(get("/api/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    void updateStatus_invalidRequest_returnsBadRequest() throws Exception {
        UUID userId = UUID.randomUUID();
        StatusUpdateRequest request = new StatusUpdateRequest(null); // invalid

        mockMvc.perform(patch("/api/users/{userId}/status", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_validRequest_returnsOk() throws Exception {
        UUID userId = UUID.randomUUID();
        StatusUpdateRequest request = new StatusUpdateRequest("SUSPENDED");
        
        UserResponse response = new UserResponse(userId, "test@test.com", "STUDENT", "SUSPENDED", "Test User", "STUDENT", "C123", "M123", null, "1234");
        when(userService.updateStatus(eq(userId), any())).thenReturn(response);

        mockMvc.perform(patch("/api/users/{userId}/status", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }
}
