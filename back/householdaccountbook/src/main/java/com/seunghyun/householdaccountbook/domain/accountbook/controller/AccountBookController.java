package com.seunghyun.householdaccountbook.domain.accountbook.controller;

import com.seunghyun.householdaccountbook.domain.accountbook.dto.request.AddAccountBookRequestDto;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.request.UpdateAccountBookRequestDto;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.AccountBookResponseDto;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.service.AccountBookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.web.PagedModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@Slf4j
@RequiredArgsConstructor
public class AccountBookController {

    private final AccountBookService accountBookService;

    @PostMapping("/accountbook/add")
    public ResponseEntity<?> addAccountBook(@AuthenticationPrincipal String id,
                                            @RequestBody AddAccountBookRequestDto addDto) {
        accountBookService.addAccountBook(id, addDto.getCategoryId(), addDto.getAccountId(), AccountBook.builder()
                .content(addDto.getContent())
                .price(addDto.getPrice())
                .date(LocalDate.now())
                .type(addDto.getType())
                .build());
        return ResponseEntity.ok("가계부 추가 완료");
    }

    @GetMapping("/accountbook/get")
    public ResponseEntity<?> getAccountBooks(@AuthenticationPrincipal String id,
                                             @RequestParam(defaultValue = "0") int page) {
        PagedModel<AccountBookResponseDto> accountBooks = new PagedModel<>(accountBookService.getAccountBooks(id, page)
                .map(this::toResponse));
        return ResponseEntity.ok(accountBooks);
    }

    @GetMapping("/accountbook/get/{accountId}")
    public ResponseEntity<?> getAccountBooksByAccount(@AuthenticationPrincipal String id,
                                                      @PathVariable Long accountId,
                                                      @RequestParam(defaultValue = "0") int page) {
        PagedModel<AccountBookResponseDto> accountBooks = new PagedModel<>(accountBookService.getAccountBooksByAccount(id, accountId, page)
                .map(this::toResponse));
        return ResponseEntity.ok(accountBooks);
    }

    @GetMapping("/accountbook/get/date")
    public ResponseEntity<?> getAccountBooksByDate(@AuthenticationPrincipal String id,
                                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                   @RequestParam(defaultValue = "0") int page) {
        PagedModel<AccountBookResponseDto> accountBooks = new PagedModel<>(accountBookService.getAccountBooksByDate(id, startDate, endDate, page)
                .map(this::toResponse));
        return ResponseEntity.ok(accountBooks);
    }

    @GetMapping("/accountbook/get/{accountId}/date")
    public ResponseEntity<?> getAccountBooksByAccountAndDate(@AuthenticationPrincipal String id,
                                                             @PathVariable Long accountId,
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                             @RequestParam(defaultValue = "0") int page) {
        PagedModel<AccountBookResponseDto> accountBooks = new PagedModel<>(accountBookService.getAccountBooksByAccountAndDate(id, accountId, startDate, endDate, page)
                .map(this::toResponse));
        return ResponseEntity.ok(accountBooks);
    }

    @PatchMapping("/accountbook/update/{accountBookId}")
    public ResponseEntity<?> updateAccountBook(@AuthenticationPrincipal String id,
                                               @PathVariable Long accountBookId,
                                               @RequestBody UpdateAccountBookRequestDto updateDto) {
        accountBookService.updateAccountBook(id, accountBookId, updateDto.getCategoryId(),
                updateDto.getContent(), updateDto.getPrice(), updateDto.getType());
        return ResponseEntity.ok("가계부 수정 완료");
    }

    @DeleteMapping("/accountbook/delete/{accountBookId}")
    public ResponseEntity<?> deleteAccountBook(@AuthenticationPrincipal String id,
                                               @PathVariable Long accountBookId) {
        accountBookService.deleteAccountBook(id, accountBookId);
        return ResponseEntity.ok("가계부 삭제 완료");
    }

    private AccountBookResponseDto toResponse(AccountBook accountBook) {
        return AccountBookResponseDto.builder()
                .accountBookId(accountBook.getAccountBookId())
                .content(accountBook.getContent())
                .price(accountBook.getPrice())
                .date(accountBook.getDate())
                .type(accountBook.getType())
                .categoryId(accountBook.getCategory().getCategoryId())
                .categoryName(accountBook.getCategory().getCategoryName())
                .accountId(accountBook.getAccount().getAccountId())
                .build();
    }
}
