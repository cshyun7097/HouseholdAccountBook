package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
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
    private final AccountBookRepository accountBookRepository;

    @Override
    @Transactional
    public void createAccount(String id, Account account) {
        if (isBlank(account.getAccountName()) || isBlank(account.getBankInfo())
                || isBlank(account.getAccountNumber()) || account.getBalance() == null) {
            throw new IllegalArgumentException("통장 정보를 모두 입력해주세요.");
        }
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
        if (balance == null) {
            throw new IllegalArgumentException("잔액을 입력해주세요.");
        }
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
        // 가계부가 통장을 참조하고 있어서 그대로 지우면 FK 오류가 난다. 내역을 함께 지우지 않도록 막는다
        if (accountBookRepository.existsByAccount_AccountId(accountId)) {
            throw new IllegalArgumentException("가계부 내역이 있는 통장은 삭제할 수 없습니다.");
        }
        accountRepository.delete(account);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
