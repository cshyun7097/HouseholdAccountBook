package com.seunghyun.householdaccountbook.domain.member.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Entity
@Getter
@Setter
@ToString
@Table(name = "Members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long memberId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String id;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private WithDrawalStatus withDrawalStatus;

    @Builder
    public Member(Long memberId, String name, String phoneNumber, String id, String password, WithDrawalStatus withDrawalStatus) {
        this.memberId = memberId;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.id = id;
        this.password = password;
        this.withDrawalStatus = withDrawalStatus;
    }

    public void updatePassword(String password) {
        this.password = PASSWORD_ENCODER.encode(password);
    }

    public boolean matchPassword(String password) {
        return PASSWORD_ENCODER.matches(password, this.password);
    }
}
