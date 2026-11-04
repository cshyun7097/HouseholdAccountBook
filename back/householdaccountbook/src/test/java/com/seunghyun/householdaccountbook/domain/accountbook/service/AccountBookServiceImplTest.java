package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.CategoryTotal;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.DashboardResponseDto;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.MonthlyTotal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
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

        accountBookService.updateAccountBook("user", 1L, 2L, "점심", 1500L, AccountBookType.EXPENSE);

        verify(accountRepository).addBalance(10L, -500L);
    }

    @Test
    void 지출을_수입으로_바꾸면_두배만큼_더한다() {
        AccountBook accountBook = givenAccountBook(AccountBookType.EXPENSE, 1000);

        accountBookService.updateAccountBook("user", 1L, 2L, "환불", 1000L, AccountBookType.INCOME);

        assertEquals(AccountBookType.INCOME, accountBook.getType());
        verify(accountRepository).addBalance(10L, 2000L);
    }

    @Test
    void 금액이_같으면_잔액을_건드리지_않는다() {
        givenAccountBook(AccountBookType.INCOME, 1000);

        accountBookService.updateAccountBook("user", 1L, 2L, "이름만 수정", 1000L, AccountBookType.INCOME);

        verify(accountRepository, never()).addBalance(anyLong(), anyLong());
    }

    @Test
    void 수정값이_잘못되면_수정하지_않는다() {
        AccountBook accountBook = AccountBook.builder().price(1000L).type(AccountBookType.INCOME).build();
        lenient().when(accountBookRepository.findByAccountBookIdAndMember_Id(1L, "user")).thenReturn(Optional.of(accountBook));

        assertThrows(IllegalArgumentException.class, () -> accountBookService.updateAccountBook("user", 1L, 2L, "월급", null, AccountBookType.INCOME));
        assertThrows(IllegalArgumentException.class, () -> accountBookService.updateAccountBook("user", 1L, 2L, "월급", -500L, AccountBookType.INCOME));
        assertThrows(IllegalArgumentException.class, () -> accountBookService.updateAccountBook("user", 1L, 2L, " ", 500L, AccountBookType.INCOME));
        assertThrows(IllegalArgumentException.class, () -> accountBookService.updateAccountBook("user", 1L, 2L, "월급", 500L, null));
        assertEquals(1000L, accountBook.getPrice());
        verify(accountRepository, never()).addBalance(anyLong(), anyLong());
    }

    @Test
    void 수입_내역을_지우면_잔액에서_빼고_음수여도_지운다() {
        AccountBook accountBook = AccountBook.builder().accountBookId(1L).type(AccountBookType.INCOME).price(1000L)
                .account(Account.builder().accountId(10L).build()).build();
        when(accountBookRepository.findByAccountBookIdAndMember_Id(1L, "user")).thenReturn(Optional.of(accountBook));

        accountBookService.deleteAccountBook("user", 1L);

        verify(accountRepository).addBalance(10L, -1000L);
        verify(accountRepository, never()).changeBalance(anyLong(), anyLong());
        verify(accountBookRepository).delete(accountBook);
    }

    @Test
    void 금액이_0이하면_가계부를_추가하지_않는다() {
        AccountBook accountBook = AccountBook.builder().content("점심").price(-1000L).type(AccountBookType.EXPENSE).build();

        assertThrows(IllegalArgumentException.class, () -> accountBookService.addAccountBook("user", 2L, 10L, accountBook));
        verify(accountBookRepository, never()).save(any());
    }

    @Test
    void 대시보드는_최근_6개월을_빈_달까지_채워서_오래된_순으로_준다() {
        when(accountBookRepository.sumByMonthAndType("user", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 11, 30)))
                .thenReturn(List.of(
                        new MonthlyTotal(2026, 11, AccountBookType.EXPENSE, 9000L),
                        new MonthlyTotal(2026, 11, AccountBookType.INCOME, 50000L),
                        new MonthlyTotal(2026, 7, AccountBookType.EXPENSE, 3000L)));
        when(accountBookRepository.sumByCategory("user", AccountBookType.EXPENSE, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30)))
                .thenReturn(List.of(new CategoryTotal("식비", 9000L)));

        DashboardResponseDto dashboard = accountBookService.getDashboard("user", YearMonth.of(2026, 11));

        assertEquals(List.of(
                new DashboardResponseDto.MonthlySummary("2026-06", 0, 0),
                new DashboardResponseDto.MonthlySummary("2026-07", 0, 3000),
                new DashboardResponseDto.MonthlySummary("2026-08", 0, 0),
                new DashboardResponseDto.MonthlySummary("2026-09", 0, 0),
                new DashboardResponseDto.MonthlySummary("2026-10", 0, 0),
                new DashboardResponseDto.MonthlySummary("2026-11", 50000, 9000)), dashboard.getMonthly());
        assertEquals("2026-11", dashboard.getMonth());
        assertEquals(List.of(new CategoryTotal("식비", 9000L)), dashboard.getCategories());
    }

    @Test
    void 조회_기간은_한_달까지_허용한다() {
        accountBookService.getAccountBooksByDate("user", LocalDate.of(2026, 10, 15), LocalDate.of(2026, 11, 15), 0);
        accountBookService.getAccountBooksByDate("user", LocalDate.of(2026, 1, 31), LocalDate.of(2026, 2, 28), 0);

        verify(accountBookRepository, times(2)).findAllByMember_IdAndDateBetween(eq("user"), any(), any(), any());
    }

    @Test
    void 조회_기간이_한_달을_넘거나_거꾸로면_예외() {
        assertThrows(IllegalArgumentException.class,
                () -> accountBookService.getAccountBooksByDate("user", LocalDate.of(2026, 10, 15), LocalDate.of(2026, 11, 16), 0));
        assertThrows(IllegalArgumentException.class,
                () -> accountBookService.getAccountBooksByAccountAndDate("user", 1L, LocalDate.of(2026, 1, 31), LocalDate.of(2026, 3, 1), 0));
        assertThrows(IllegalArgumentException.class,
                () -> accountBookService.getAccountBooksByDate("user", LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 1), 0));
        verifyNoInteractions(accountBookRepository);
    }

    @Test
    void 카테고리를_선택하지_않으면_조회하지_않는다() {
        assertThrows(IllegalArgumentException.class,
                () -> accountBookService.getAccountBooksByCategories("user", List.of(), null, null, null, 0));
    }

    @Test
    void 카테고리_조회는_통장과_기간이_있으면_둘_다_조건에_건다() {
        LocalDate start = LocalDate.of(2026, 11, 1), end = LocalDate.of(2026, 11, 30);

        accountBookService.getAccountBooksByCategories("user", List.of(1L, 2L), 3L, start, end, 0);

        verify(accountBookRepository).findAllByMember_IdAndCategory_CategoryIdInAndAccount_AccountIdAndDateBetween(
                eq("user"), eq(List.of(1L, 2L)), eq(3L), eq(start), eq(end), any());
    }

    @Test
    void 카테고리_조회는_통장이_없으면_전체_통장에서_찾는다() {
        accountBookService.getAccountBooksByCategories("user", List.of(1L), null, null, null, 0);

        verify(accountBookRepository).findAllByMember_IdAndCategory_CategoryIdIn(eq("user"), eq(List.of(1L)), any());
    }

    @Test
    void 카테고리_조회는_기간이_1개월을_넘으면_막는다() {
        assertThrows(IllegalArgumentException.class, () -> accountBookService.getAccountBooksByCategories(
                "user", List.of(1L), null, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 1), 0));
    }
}
