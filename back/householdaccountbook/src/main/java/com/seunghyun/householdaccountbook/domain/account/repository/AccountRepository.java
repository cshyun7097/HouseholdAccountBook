package com.seunghyun.householdaccountbook.domain.account.repository;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {

    boolean existsByAccountNumber(String accountNumber);
}
