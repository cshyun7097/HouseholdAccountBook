package com.seunghyun.householdaccountbook.domain.account.entity;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString(exclude = "member")
@Table(name = "accounts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @Column(nullable = false, unique = true)
    private String accountNumber;

    @Column(nullable = false)
    private String bankInfo;

    @Column(nullable = false)
    private String accountName;

    @Column(nullable = false)
    private Long balance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;

    @Builder
    public Account(Long accountId, String accountNumber, String bankInfo, String accountName, Long balance, Member member) {
        this.accountId = accountId;
        this.accountNumber = accountNumber;
        this.bankInfo = bankInfo;
        this.accountName = accountName;
        this.balance = balance;
        this.member = member;
    }
}
