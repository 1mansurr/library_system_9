package com.library.book.repository;

import com.library.book.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CollegeRepository extends JpaRepository<College, UUID> {
}
