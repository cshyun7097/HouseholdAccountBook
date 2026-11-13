package com.seunghyun.householdaccountbook.domain.card.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardRequestDto {
    private String cardName;
    private String cardCompany;
}
