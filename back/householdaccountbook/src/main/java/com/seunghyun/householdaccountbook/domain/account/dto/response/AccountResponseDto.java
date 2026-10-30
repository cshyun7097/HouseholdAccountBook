package com.seunghyun.householdaccountbook.domain.account.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountResponseDto {
    private Long accountId;
    private String accountNumber;
    private String bankInfo;
    private String accountName;
    private Long balance;
}
