package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public void createAccount(String id, Account account) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }
        if (accountRepository.existsByAccountNumber(account.getAccountNumber())) {
            throw new IllegalArgumentException("이미 존재하는 계좌번호입니다.");
        }

        account.setMember(member);
        accountRepository.save(account);
    }

    @Override
    public List<Account> getAccounts(String id) {
        return accountRepository.findAllByMember_Id(id);
    }

    @Override
    @Transactional
    public void updateBalance(String id, Long accountId, Long balance) {
        // 본인 계좌만 조회해서 남의 계좌 잔액 변경을 막는다
        Account account = accountRepository.findByAccountIdAndMember_Id(accountId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계좌입니다."));
        account.setBalance(balance);
    }

    @Override
    @Transactional
    public void deleteAccount(String id, Long accountId) {
        Account account = accountRepository.findByAccountIdAndMember_Id(accountId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계좌입니다."));
        accountRepository.delete(account);
    }
}
