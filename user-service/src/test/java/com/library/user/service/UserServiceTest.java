package com.library.user.service;

import com.library.user.dto.LoginRequest;
import com.library.user.dto.RegisterRequest;
import com.library.user.entity.User;
import com.library.user.entity.Profile;
import com.library.user.exception.ConflictException;
import com.library.user.exception.UnauthorizedException;
import com.library.user.repository.ProfileRepository;
import com.library.user.repository.UserRepository;
import com.library.user.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @Test
    void register_success() {
        RegisterRequest req = new RegisterRequest("test@test.com", "pass", "Test User", "STUDENT", "M123", null, null);
        when(userRepository.existsByEmail(req.email())).thenReturn(false);
        when(passwordEncoder.encode(req.password())).thenReturn("hashed");

        var response = userService.register(req);

        assertNotNull(response);
        assertEquals(req.email(), response.email());
        verify(userRepository, times(1)).save(any());
        verify(profileRepository, times(1)).save(any());
    }

    @Test
    void register_conflict() {
        RegisterRequest req = new RegisterRequest("test@test.com", "pass", "Test User", "STUDENT", "M123", null, null);
        when(userRepository.existsByEmail(req.email())).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_failure() {
        LoginRequest req = new LoginRequest("test@test.com", "wrong");
        User user = new User();
        user.setEmail("test@test.com");
        user.setPasswordHash("hashed");
        when(userRepository.findByEmail(req.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(req.password(), user.getPasswordHash())).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> userService.login(req));
    }
}
