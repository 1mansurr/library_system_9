package com.library.user.service;

import com.library.user.dto.*;
import com.library.user.entity.Profile;
import com.library.user.entity.User;
import com.library.user.exception.ConflictException;
import com.library.user.exception.NotFoundException;
import com.library.user.exception.UnauthorizedException;
import com.library.user.repository.ProfileRepository;
import com.library.user.repository.UserRepository;
import com.library.user.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       ProfileRepository profileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered");
        }

        String memberType = request.member_type();
        if ("STUDENT".equals(memberType) && (request.matric_no() == null || request.matric_no().isBlank())) {
            throw new IllegalArgumentException("matric_no is required for STUDENT members");
        }
        if ("STAFF".equals(memberType) && (request.staff_id() == null || request.staff_id().isBlank())) {
            throw new IllegalArgumentException("staff_id is required for STAFF members");
        }

        String role = switch (memberType) {
            case "STUDENT" -> "STUDENT";
            case "STAFF" -> "STAFF";
            case "EXTERNAL" -> "EXTERNAL";
            default -> throw new IllegalArgumentException("Invalid member_type: " + memberType);
        };

        User user = new User();
        user.setUserId(UUID.randomUUID());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setStatus("ACTIVE");
        userRepository.save(user);

        Profile profile = new Profile();
        profile.setProfileId(UUID.randomUUID());
        profile.setUser(user);
        profile.setFullName(request.full_name());
        profile.setMemberType(memberType);
        profile.setMatricNo(request.matric_no());
        profile.setStaffId(request.staff_id());
        profile.setCardNumber(generateCardNumber());
        profile.setPhone(request.phone());
        profileRepository.save(profile);

        log.info("Registered user {} with role {}", user.getUserId(), role);
        return new RegisterResponse(user.getUserId(), user.getEmail(), profile.getCardNumber());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        Profile profile = profileRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        String token = jwtService.generateToken(user.getUserId(), user.getRole(), profile.getMemberType());
        return new LoginResponse(token, user.getUserId(), user.getRole(), profile.getMemberType(), profile.getFullName());
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        Profile profile = profileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NotFoundException("Profile not found for user: " + userId));

        return toUserResponse(user, profile);
    }

    @Transactional
    public UserResponse updateStatus(UUID userId, StatusUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        user.setStatus(request.status());
        userRepository.save(user);

        Profile profile = profileRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NotFoundException("Profile not found for user: " + userId));

        log.info("User {} status updated to {}", userId, request.status());
        return toUserResponse(user, profile);
    }

    private UserResponse toUserResponse(User user, Profile profile) {
        return new UserResponse(
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                profile.getFullName(),
                profile.getMemberType(),
                profile.getCardNumber(),
                profile.getMatricNo(),
                profile.getStaffId(),
                profile.getPhone()
        );
    }

    private String generateCardNumber() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("LIB-");
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString();
    }
}
