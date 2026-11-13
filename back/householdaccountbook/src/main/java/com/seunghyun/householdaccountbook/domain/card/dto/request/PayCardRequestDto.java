package com.seunghyun.householdaccountbook.domain.card.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayCardRequestDto {
    private Long accountId; // 납부할 돈이 빠져나갈 통장
    private Long amount;
}
