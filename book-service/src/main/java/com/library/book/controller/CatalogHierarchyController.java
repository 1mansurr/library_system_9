package com.library.book.controller;

import com.library.book.dto.CollegeSummary;
import com.library.book.dto.CourseSummary;
import com.library.book.dto.DepartmentSummary;
import com.library.book.repository.CollegeRepository;
import com.library.book.repository.CourseOfStudyRepository;
import com.library.book.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CatalogHierarchyController {

    private final CollegeRepository collegeRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseOfStudyRepository courseOfStudyRepository;

    public CatalogHierarchyController(CollegeRepository collegeRepository,
                                       DepartmentRepository departmentRepository,
                                       CourseOfStudyRepository courseOfStudyRepository) {
        this.collegeRepository = collegeRepository;
        this.departmentRepository = departmentRepository;
        this.courseOfStudyRepository = courseOfStudyRepository;
    }

    @GetMapping("/colleges")
    public ResponseEntity<List<CollegeSummary>> listColleges() {
        return ResponseEntity.ok(collegeRepository.findAll().stream()
                .map(c -> new CollegeSummary(c.getCollegeId(), c.getName()))
                .toList());
    }

    @GetMapping("/colleges/{collegeId}/departments")
    public ResponseEntity<List<DepartmentSummary>> listDepartments(@PathVariable UUID collegeId) {
        return ResponseEntity.ok(departmentRepository.findByCollege_CollegeId(collegeId).stream()
                .map(d -> new DepartmentSummary(d.getDepartmentId(), d.getName()))
                .toList());
    }

    @GetMapping("/departments/{departmentId}/courses")
    public ResponseEntity<List<CourseSummary>> listCourses(@PathVariable UUID departmentId) {
        return ResponseEntity.ok(courseOfStudyRepository.findByDepartment_DepartmentId(departmentId).stream()
                .map(c -> new CourseSummary(c.getCourseId(), c.getName()))
                .toList());
    }
}
