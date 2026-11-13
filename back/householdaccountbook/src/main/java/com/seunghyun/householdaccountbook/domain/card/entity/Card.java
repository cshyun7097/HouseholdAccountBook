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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;

    @Builder
    public Card(Long cardId, String cardName, String cardCompany, Member member) {
        this.cardId = cardId;
        this.cardName = cardName;
        this.cardCompany = cardCompany;
        this.member = member;
    }
}
