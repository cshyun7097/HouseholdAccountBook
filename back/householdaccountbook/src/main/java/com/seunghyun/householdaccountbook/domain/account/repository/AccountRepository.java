package com.seunghyun.householdaccountbook.domain.account.repository;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findAllByMember_Id(String id);

    Optional<Account> findByAccountIdAndMember_Id(Long accountId, String id);

    // DB에서 바로 계산해서 동시 요청에도 잔액 변경이 유실되지 않게 하고, 마이너스가 되면 0건 반영된다
    @Modifying
    @Query("update Account a set a.balance = a.balance + :amount where a.accountId = :accountId and a.balance + :amount >= 0")
    int changeBalance(Long accountId, Long amount);
}
