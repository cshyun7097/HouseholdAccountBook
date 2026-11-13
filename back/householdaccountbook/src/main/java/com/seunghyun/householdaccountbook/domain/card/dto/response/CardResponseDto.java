package com.seunghyun.householdaccountbook.domain.card.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CardResponseDto {
    private Long cardId;
    private String cardName;
    private String cardCompany;
}
