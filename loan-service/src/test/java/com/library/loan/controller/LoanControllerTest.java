package com.library.loan.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.loan.dto.BorrowRequest;
import com.library.loan.dto.LoanResponse;
import com.library.loan.security.JwtService;
import com.library.loan.security.UserPrincipal;
import com.library.loan.service.LoanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LoanController.class)
@AutoConfigureMockMvc
class LoanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LoanService loanService;
    
    @MockBean
    private JwtService jwtService;
    
    @MockBean
    private com.library.loan.security.JwtAuthFilter jwtAuthFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @org.junit.jupiter.api.BeforeEach
    void setUp() throws Exception {
        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletRequest req = invocation.getArgument(0);
            jakarta.servlet.http.HttpServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }

    @Test
    void borrow_invalidRequest_returnsBadRequest() throws Exception {
        BorrowRequest request = new BorrowRequest(null);

        mockMvc.perform(post("/api/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
                .with(user("test")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void borrow_validRequest_returnsCreated() throws Exception {
        UUID copyId = UUID.randomUUID();
        BorrowRequest request = new BorrowRequest(copyId);

        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId, "STUDENT");
        
        LoanResponse response = new LoanResponse(UUID.randomUUID(), userId, copyId, OffsetDateTime.now(), OffsetDateTime.now().plusDays(14), null, "ACTIVE", BigDecimal.ZERO, false, BigDecimal.ZERO);
        
        when(loanService.borrow(eq(userId), any(BorrowRequest.class), anyString())).thenReturn(response);

        mockMvc.perform(post("/api/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", "Bearer fake-token")
                .with(csrf())
                .with(user(principal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
