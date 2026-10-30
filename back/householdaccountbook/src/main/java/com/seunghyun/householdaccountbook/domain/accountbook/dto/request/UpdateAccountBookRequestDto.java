package com.seunghyun.householdaccountbook.domain.accountbook.dto.request;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountBookRequestDto {
    private String content;
    private Long price;
    private AccountBookType type;
    private Long categoryId;
}
