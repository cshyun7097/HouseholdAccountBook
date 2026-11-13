package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.DashboardResponseDto;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public interface AccountBookService {

    // paymentType이 ACCOUNT면 accountId, CARD면 cardId를 쓴다
    void addAccountBook(String id, Long categoryId, Long accountId, Long cardId, AccountBook accountBook);

    Page<AccountBook> getAccountBooks(String id, int page);

    Page<AccountBook> getAccountBooksByAccount(String id, Long accountId, int page);

    Page<AccountBook> getAccountBooksByDate(String id, LocalDate startDate, LocalDate endDate, int page);

    Page<AccountBook> getAccountBooksByAccountAndDate(String id, Long accountId, LocalDate startDate, LocalDate endDate, int page);

    // accountId, startDate/endDate는 null이면 조건에서 뺀다
    Page<AccountBook> getAccountBooksByCategories(String id, List<Long> categoryIds, Long accountId, LocalDate startDate, LocalDate endDate, int page);

    void updateAccountBook(String id, Long accountBookId, Long categoryId, String content, Long price, AccountBookType type);

    void deleteAccountBook(String id, Long accountBookId);

    DashboardResponseDto getDashboard(String id, YearMonth month);
}
