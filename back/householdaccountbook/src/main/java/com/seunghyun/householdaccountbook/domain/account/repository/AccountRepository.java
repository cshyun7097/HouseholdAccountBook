package com.seunghyun.householdaccountbook.domain.account.repository;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findAllByMember_Id(String id);

    Optional<Account> findByAccountIdAndMember_Id(Long accountId, String id);
}
