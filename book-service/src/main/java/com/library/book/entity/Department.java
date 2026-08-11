package com.library.book.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @Column(name = "department_id")
    private UUID departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Column(nullable = false)
    private String name;

    @Column(name = "shelf_prefix", nullable = false)
    private String shelfPrefix;

    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public College getCollege() { return college; }
    public void setCollege(College college) { this.college = college; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getShelfPrefix() { return shelfPrefix; }
    public void setShelfPrefix(String shelfPrefix) { this.shelfPrefix = shelfPrefix; }
}
