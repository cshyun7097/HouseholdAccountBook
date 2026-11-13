package com.seunghyun.householdaccountbook.domain.accountbook.dto.request;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.PaymentType;
import lombok.*;

import java.time.LocalDate;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddAccountBookRequestDto {
    private String content;
    private Long price;
    private AccountBookType type;
    private Long categoryId;
    private PaymentType paymentType;
    private Long accountId; // paymentType이 ACCOUNT일 때
    private Long cardId; // paymentType이 CARD일 때
    private LocalDate date; // 없으면 오늘
}
