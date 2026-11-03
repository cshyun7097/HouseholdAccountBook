package com.seunghyun.householdaccountbook.domain.account.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequestDto {
    private Long fromAccountId;
    private Long toAccountId;
    private Long amount;
}
