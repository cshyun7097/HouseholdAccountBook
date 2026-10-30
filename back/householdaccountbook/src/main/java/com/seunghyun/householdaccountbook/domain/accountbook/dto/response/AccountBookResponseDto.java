package com.seunghyun.householdaccountbook.domain.accountbook.dto.response;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class AccountBookResponseDto {
    private Long accountBookId;
    private String content;
    private Long price;
    private LocalDate date;
    private AccountBookType type;
    private Long categoryId;
    private String categoryName;
    private Long accountId;
}
