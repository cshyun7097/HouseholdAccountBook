package com.seunghyun.householdaccountbook.domain.accountbook.entity;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@ToString(exclude = {"member", "category", "account", "card"})
@Table(name = "account_book")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AccountBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountBookId;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountBookType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryId", nullable = false)
    private Category category;

    // 결제수단이 ACCOUNT면 account, CARD면 card 중 하나만 채워진다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountId")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cardId")
    private Card card;

    @Builder
    public AccountBook(Long accountBookId, String content, Long price, LocalDate date, AccountBookType type, PaymentType paymentType, Member member, Category category, Account account, Card card) {
        this.accountBookId = accountBookId;
        this.content = content;
        this.price = price;
        this.date = date;
        this.type = type;
        this.paymentType = paymentType;
        this.member = member;
        this.category = category;
        this.account = account;
        this.card = card;
    }
}
