package com.seunghyun.householdaccountbook.domain.card.repository;

import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findAllByMember_Id(String id);

    Optional<Card> findByCardIdAndMember_Id(Long cardId, String id);

    // DB에서 바로 계산해서 동시 요청에도 부채 변경이 유실되지 않게 한다 (환불이 더 크면 음수도 허용)
    @Modifying
    @Query("update Card c set c.debt = c.debt + :amount where c.cardId = :cardId")
    int addDebt(Long cardId, Long amount);

    // 부채보다 많이 내면 0건 반영된다
    @Modifying
    @Query("update Card c set c.debt = c.debt - :amount where c.cardId = :cardId and c.debt >= :amount")
    int payDebt(Long cardId, Long amount);
}
