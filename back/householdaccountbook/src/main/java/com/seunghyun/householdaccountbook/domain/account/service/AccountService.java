package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;

public interface AccountService {

    void createAccount(String id, Account account);
}
