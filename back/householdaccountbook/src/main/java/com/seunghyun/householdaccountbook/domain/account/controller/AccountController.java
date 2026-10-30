package com.seunghyun.householdaccountbook.domain.account.controller;

import com.seunghyun.householdaccountbook.domain.account.dto.request.CreateAccountRequestDto;
import com.seunghyun.householdaccountbook.domain.account.dto.request.UpdateBalanceRequestDto;
import com.seunghyun.householdaccountbook.domain.account.dto.response.AccountResponseDto;
import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/account/search")
    public ResponseEntity<?> getAccounts(@AuthenticationPrincipal String id) {
        List<AccountResponseDto> accounts = accountService.getAccounts(id).stream()
                .map(account -> AccountResponseDto.builder()
                        .accountId(account.getAccountId())
                        .accountNumber(account.getAccountNumber())
                        .bankInfo(account.getBankInfo())
                        .accountName(account.getAccountName())
                        .balance(account.getBalance())
                        .build())
                .toList();
        return ResponseEntity.ok(accounts);
    }

    @PatchMapping("/account/update-balance")
    public ResponseEntity<?> updateBalance(@AuthenticationPrincipal String id,
                                           @RequestBody UpdateBalanceRequestDto updateDto) {
        accountService.updateBalance(id, updateDto.getAccountId(), updateDto.getBalance());
        return ResponseEntity.ok("잔액 설정 완료");
    }
}
