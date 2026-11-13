package com.seunghyun.householdaccountbook.domain.card.service;

import com.seunghyun.householdaccountbook.domain.card.entity.Card;

import java.util.List;

public interface CardService {

    void createCard(String id, Card card);

    List<Card> getCards(String id);

    void deleteCard(String id, Long cardId);

    void payCard(String id, Long cardId, Long accountId, Long amount);
}
