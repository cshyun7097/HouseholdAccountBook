package com.seunghyun.householdaccountbook.domain.account.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBalanceRequestDto {
    private Long accountId;
    private Long balance;
}
