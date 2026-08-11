package com.library.book.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "colleges")
public class College {

    @Id
    @Column(name = "college_id")
    private UUID collegeId;

    @Column(nullable = false, unique = true)
    private String name;

    public UUID getCollegeId() { return collegeId; }
    public void setCollegeId(UUID collegeId) { this.collegeId = collegeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
