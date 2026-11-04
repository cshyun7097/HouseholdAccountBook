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

    // 기존 회원은 이메일이 없어서 DB에서는 null을 허용한다 (가입 시에는 필수)
    private String email;

    // unique: 동시에 같은 아이디로 가입하는 경우까지 DB에서 막는다
    @Column(nullable = false, unique = true)
    private String id;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private WithDrawalStatus withDrawalStatus;

    @Builder
    public Member(Long memberId, String name, String phoneNumber, String email, String id, String password, WithDrawalStatus withDrawalStatus) {
        this.memberId = memberId;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.email = email;
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
