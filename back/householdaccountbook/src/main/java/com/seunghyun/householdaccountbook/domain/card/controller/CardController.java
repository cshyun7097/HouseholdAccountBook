package com.seunghyun.householdaccountbook.domain.card.controller;

import com.seunghyun.householdaccountbook.domain.card.dto.request.CreateCardRequestDto;
import com.seunghyun.householdaccountbook.domain.card.dto.request.PayCardRequestDto;
import com.seunghyun.householdaccountbook.domain.card.dto.response.CardResponseDto;
import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import com.seunghyun.householdaccountbook.domain.card.service.CardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/card/add")
    public ResponseEntity<?> createCard(@AuthenticationPrincipal String id,
                                        @RequestBody CreateCardRequestDto createDto) {
        cardService.createCard(id, Card.builder()
                .cardName(createDto.getCardName())
                .cardCompany(createDto.getCardCompany())
                .build());
        return ResponseEntity.ok("카드 등록 완료");
    }

    @GetMapping("/card/search")
    public ResponseEntity<?> getCards(@AuthenticationPrincipal String id) {
        List<CardResponseDto> cards = cardService.getCards(id).stream()
                .map(card -> CardResponseDto.builder()
                        .cardId(card.getCardId())
                        .cardName(card.getCardName())
                        .cardCompany(card.getCardCompany())
                        .debt(card.getDebt())
                        .build())
                .toList();
        return ResponseEntity.ok(cards);
    }

    @PatchMapping("/card/pay/{cardId}")
    public ResponseEntity<?> payCard(@AuthenticationPrincipal String id,
                                     @PathVariable Long cardId,
                                     @RequestBody PayCardRequestDto payDto) {
        cardService.payCard(id, cardId, payDto.getAccountId(), payDto.getAmount());
        return ResponseEntity.ok("납부 완료");
    }

    @DeleteMapping("/card/delete/{cardId}")
    public ResponseEntity<?> deleteCard(@AuthenticationPrincipal String id,
                                        @PathVariable Long cardId) {
        cardService.deleteCard(id, cardId);
        return ResponseEntity.ok("카드 삭제 완료");
    }
}
