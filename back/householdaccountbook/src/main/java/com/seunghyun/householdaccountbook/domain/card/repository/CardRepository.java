package com.seunghyun.householdaccountbook.domain.card.repository;

import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findAllByMember_Id(String id);

    Optional<Card> findByCardIdAndMember_Id(Long cardId, String id);
}
