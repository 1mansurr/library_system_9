package com.library.book.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.book.dto.*;
import com.library.book.service.BookService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookService bookService;
    
    @MockBean
    private com.library.book.security.JwtService jwtService;
    
    @MockBean
    private com.library.book.security.JwtAuthFilter jwtAuthFilter;
    
    @MockBean
    private com.library.book.security.ServiceTokenFilter serviceTokenFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listBooks_returnsOk() throws Exception {
        PagedBooks pagedBooks = new PagedBooks(List.of(), 0, 20, 0);
        when(bookService.listBooks(null, null, null, false, 0, 20)).thenReturn(pagedBooks);

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk());
    }

    @Test
    void addBook_invalidRequest_returnsBadRequest() throws Exception {
        BookRequest request = new BookRequest(null, null, null, null);

        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addBook_validRequest_returnsCreated() throws Exception {
        BookRequest request = new BookRequest("1234567890123", "Valid Book", "Author", null);
        
        BookSummary summary = new BookSummary(UUID.randomUUID(), "Valid Book", "Author", "1234567890123", null, null, null, null, 0, 0);
        when(bookService.addBook(any(BookRequest.class))).thenReturn(summary);

        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Valid Book"));
    }
}
