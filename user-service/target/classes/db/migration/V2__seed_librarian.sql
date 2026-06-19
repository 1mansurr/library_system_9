-- password: librarian123 (BCrypt hash)
INSERT INTO users (user_id, email, password_hash, role, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'librarian@library.com',
    '$2a$10$FLKVoE5JDrqcrA/EBMDIPOl/tCgX/cOocKrnO89ipfB9T70pkvUHa',
    'LIBRARIAN',
    'ACTIVE'
);

INSERT INTO profiles (profile_id, user_id, full_name, member_type, card_number)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Head Librarian',
    'STAFF',
    'LIB-ADMIN1'
);
