package com.seunghyun.householdaccountbook.domain.account.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequestDto {
    private String accountNumber;
    private String bankInfo;
    private String accountName;
    private Long balance;
}
