package com.library.book.repository;

import com.library.book.entity.CourseOfStudy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseOfStudyRepository extends JpaRepository<CourseOfStudy, UUID> {
    List<CourseOfStudy> findByDepartment_DepartmentId(UUID departmentId);
}
