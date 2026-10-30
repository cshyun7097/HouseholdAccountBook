package com.seunghyun.householdaccountbook.domain.account.controller;

import com.seunghyun.householdaccountbook.domain.account.dto.request.CreateAccountRequestDto;
import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/account/add")
    public ResponseEntity<?> createAccount(@AuthenticationPrincipal String id,
                                           @RequestBody CreateAccountRequestDto createDto) {
        accountService.createAccount(id, Account.builder()
                .accountNumber(createDto.getAccountNumber())
                .bankInfo(createDto.getBankInfo())
                .accountName(createDto.getAccountName())
                .balance(createDto.getBalance())
                .build());
        return ResponseEntity.ok("계좌 생성 완료");
    }
}
