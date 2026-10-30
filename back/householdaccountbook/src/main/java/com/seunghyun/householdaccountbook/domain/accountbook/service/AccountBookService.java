package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface AccountBookService {

    void addAccountBook(String id, Long categoryId, Long accountId, AccountBook accountBook);

    Page<AccountBook> getAccountBooks(String id, int page);

    Page<AccountBook> getAccountBooksByAccount(String id, Long accountId, int page);

    Page<AccountBook> getAccountBooksByDate(String id, LocalDate startDate, LocalDate endDate, int page);

    Page<AccountBook> getAccountBooksByAccountAndDate(String id, Long accountId, LocalDate startDate, LocalDate endDate, int page);

    void updateAccountBook(String id, Long accountBookId, Long categoryId, String content, Long price, AccountBookType type);

    void deleteAccountBook(String id, Long accountBookId);
}
