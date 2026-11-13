package com.seunghyun.householdaccountbook.domain.card.entity;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString(exclude = "member")
@Table(name = "cards")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cardId;

    @Column(nullable = false)
    private String cardName;

    @Column(nullable = false)
    private String cardCompany;

    // 카드로 쓴 금액 중 아직 납부하지 않은 금액
    @Column(nullable = false)
    private Long debt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;

    @Builder
    public Card(Long cardId, String cardName, String cardCompany, Long debt, Member member) {
        this.cardId = cardId;
        this.cardName = cardName;
        this.cardCompany = cardCompany;
        this.debt = debt;
        this.member = member;
    }
}
