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
        if (account.getBalance() < 0) {
            throw new IllegalArgumentException("잔액은 0 이상이어야 합니다.");
        }
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }
        // Only the masked number is stored, so duplicates can't be detected (different accounts can share the first 5 digits).
        account.setAccountNumber(maskAccountNumber(account.getAccountNumber()));
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
        if (balance < 0) {
            throw new IllegalArgumentException("잔액은 0 이상이어야 합니다.");
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

    @Override
    @Transactional
    public void transfer(String id, Long fromAccountId, Long toAccountId, Long amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("이체 금액은 0보다 커야 합니다.");
        }
        if (fromAccountId == null || fromAccountId.equals(toAccountId)) {
            throw new IllegalArgumentException("서로 다른 통장을 선택해주세요.");
        }
        // 두 통장 모두 본인 것인지 확인해서 남의 계좌로/에서 옮기는 것을 막는다
        for (Long accountId : List.of(fromAccountId, toAccountId)) {
            accountRepository.findByAccountIdAndMember_Id(accountId, id)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계좌입니다."));
        }
        if (accountRepository.changeBalance(fromAccountId, -amount) == 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
        accountRepository.changeBalance(toAccountId, amount);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    // 앞 5글자만 남기고 나머지는 *로 가린다 (예: 1234567890 -> 12345*****)
    static String maskAccountNumber(String accountNumber) {
        String trimmed = accountNumber.trim();
        if (trimmed.length() <= 5) return trimmed;
        return trimmed.substring(0, 5) + "*".repeat(trimmed.length() - 5);
    }
}
