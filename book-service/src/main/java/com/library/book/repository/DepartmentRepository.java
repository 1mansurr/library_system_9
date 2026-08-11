package com.library.book.repository;

import com.library.book.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByCollege_CollegeId(UUID collegeId);
}
