package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountBookServiceImpl implements AccountBookService {

    private static final int PAGE_SIZE = 20;
    // 최신 날짜순, 같은 날짜는 최근 등록순
    private static final Sort SORT = Sort.by(Sort.Direction.DESC, "date", "accountBookId");

    private final AccountBookRepository accountBookRepository;
    private final MemberRepository memberRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public void addAccountBook(String id, Long categoryId, Long accountId, AccountBook accountBook) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }

        // 본인 카테고리만 조회해서 남의 카테고리로 등록하는 것을 막는다
        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        // 본인 계좌만 조회해서 남의 계좌로 등록하는 것을 막는다
        Account account = accountRepository.findByAccountIdAndMember_Id(accountId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계좌입니다."));

        accountBook.setMember(member);
        accountBook.setCategory(category);
        accountBook.setAccount(account);
        accountBookRepository.save(accountBook);
        changeBalance(accountId, balanceEffect(accountBook.getType(), accountBook.getPrice()));
    }

    @Override
    public Page<AccountBook> getAccountBooks(String id, int page) {
        return accountBookRepository.findAllByMember_Id(id, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByAccount(String id, Long accountId, int page) {
        // 회원 조건을 같이 걸어서 남의 계좌 내역은 조회되지 않는다
        return accountBookRepository.findAllByMember_IdAndAccount_AccountId(id, accountId, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByDate(String id, LocalDate startDate, LocalDate endDate, int page) {
        return accountBookRepository.findAllByMember_IdAndDateBetween(id, startDate, endDate, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByAccountAndDate(String id, Long accountId, LocalDate startDate, LocalDate endDate, int page) {
        // 회원 조건을 같이 걸어서 남의 계좌 내역은 조회되지 않는다
        return accountBookRepository.findAllByMember_IdAndAccount_AccountIdAndDateBetween(id, accountId, startDate, endDate, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    @Transactional
    public void updateAccountBook(String id, Long accountBookId, Long categoryId, String content, Long price, AccountBookType type) {
        AccountBook accountBook = accountBookRepository.findByAccountBookIdAndMember_Id(accountBookId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가계부입니다."));

        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        // 기존 내역이 잔액에 준 영향과 수정 후 영향의 차이만큼만 반영한다
        long diff = balanceEffect(type, price) - balanceEffect(accountBook.getType(), accountBook.getPrice());
        if (diff != 0) {
            changeBalance(accountBook.getAccount().getAccountId(), diff);
        }

        accountBook.setCategory(category);
        accountBook.setContent(content);
        accountBook.setPrice(price);
        accountBook.setType(type);
    }

    @Override
    @Transactional
    public void deleteAccountBook(String id, Long accountBookId) {
        AccountBook accountBook = accountBookRepository.findByAccountBookIdAndMember_Id(accountBookId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가계부입니다."));

        // 추가할 때 반영한 만큼 되돌린다
        changeBalance(accountBook.getAccount().getAccountId(), -balanceEffect(accountBook.getType(), accountBook.getPrice()));
        accountBookRepository.delete(accountBook);
    }

    // 수입이면 더하고 지출이면 뺀다
    private long balanceEffect(AccountBookType type, Long price) {
        return type == AccountBookType.INCOME ? price : -price;
    }

    private void changeBalance(Long accountId, long amount) {
        if (accountRepository.changeBalance(accountId, amount) == 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
    }
}
