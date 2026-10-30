package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;

import java.util.List;

public interface AccountService {

    void createAccount(String id, Account account);

    List<Account> getAccounts(String id);

    void updateBalance(String id, Long accountId, Long balance);

    void deleteAccount(String id, Long accountId);
}
