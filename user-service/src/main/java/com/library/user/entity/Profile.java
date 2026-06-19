package com.library.user.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @Column(name = "profile_id")
    private UUID profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "member_type", nullable = false)
    private String memberType;

    @Column(name = "matric_no", unique = true)
    private String matricNo;

    @Column(name = "staff_id", unique = true)
    private String staffId;

    @Column(name = "card_number", unique = true, nullable = false)
    private String cardNumber;

    @Column
    private String phone;

    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getMemberType() { return memberType; }
    public void setMemberType(String memberType) { this.memberType = memberType; }
    public String getMatricNo() { return matricNo; }
    public void setMatricNo(String matricNo) { this.matricNo = matricNo; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
