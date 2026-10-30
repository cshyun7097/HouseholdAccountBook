package com.seunghyun.householdaccountbook.domain.category.entity;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString(exclude = "member")
@Table(name = "category")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    @Column(nullable = false)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private Member member;

    @Builder
    public Category(Long categoryId, String categoryName, Member member) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.member = member;
    }
}
