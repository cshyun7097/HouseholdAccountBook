package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountBookServiceImplTest {

    @Mock AccountBookRepository accountBookRepository;
    @Mock MemberRepository memberRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock AccountRepository accountRepository;
    @InjectMocks AccountBookServiceImpl accountBookService;

    private AccountBook givenAccountBook(AccountBookType type, long price) {
        AccountBook accountBook = AccountBook.builder()
                .accountBookId(1L).type(type).price(price)
                .account(Account.builder().accountId(10L).build())
                .build();
        when(accountBookRepository.findByAccountBookIdAndMember_Id(1L, "user")).thenReturn(Optional.of(accountBook));
        when(categoryRepository.findByCategoryIdAndMember_Id(2L, "user"))
                .thenReturn(Optional.of(Category.builder().categoryId(2L).build()));
        return accountBook;
    }

    @Test
    void 지출_금액을_늘리면_차액만큼_뺀다() {
        givenAccountBook(AccountBookType.EXPENSE, 1000);
        when(accountRepository.changeBalance(10L, -500L)).thenReturn(1);

        accountBookService.updateAccountBook("user", 1L, 2L, "점심", 1500L, AccountBookType.EXPENSE);

        verify(accountRepository).changeBalance(10L, -500L);
    }

    @Test
    void 지출을_수입으로_바꾸면_두배만큼_더한다() {
        AccountBook accountBook = givenAccountBook(AccountBookType.EXPENSE, 1000);
        when(accountRepository.changeBalance(10L, 2000L)).thenReturn(1);

        accountBookService.updateAccountBook("user", 1L, 2L, "환불", 1000L, AccountBookType.INCOME);

        assertEquals(AccountBookType.INCOME, accountBook.getType());
    }

    @Test
    void 금액이_같으면_잔액을_건드리지_않는다() {
        givenAccountBook(AccountBookType.INCOME, 1000);

        accountBookService.updateAccountBook("user", 1L, 2L, "이름만 수정", 1000L, AccountBookType.INCOME);

        verify(accountRepository, never()).changeBalance(anyLong(), anyLong());
    }

    @Test
    void 잔액이_부족하면_수정하지_않는다() {
        AccountBook accountBook = givenAccountBook(AccountBookType.INCOME, 1000);
        when(accountRepository.changeBalance(10L, -1000L)).thenReturn(0);

        assertThrows(IllegalArgumentException.class, () ->
                accountBookService.updateAccountBook("user", 1L, 2L, "월급", 0L, AccountBookType.INCOME));
        assertEquals(1000L, accountBook.getPrice());
    }
}
