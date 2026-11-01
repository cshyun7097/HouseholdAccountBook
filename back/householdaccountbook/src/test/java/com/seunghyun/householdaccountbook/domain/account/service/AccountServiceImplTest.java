package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock AccountRepository accountRepository;
    @Mock MemberRepository memberRepository;
    @Mock AccountBookRepository accountBookRepository;
    @InjectMocks AccountServiceImpl accountService;

    @Test
    void 통장_이름이_비어있으면_생성하지_않는다() {
        Account account = Account.builder().accountName(" ").bankInfo("국민").accountNumber("111").balance(0L).build();

        assertThrows(IllegalArgumentException.class, () -> accountService.createAccount("user", account));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void 잔액이_없으면_생성하지_않는다() {
        Account account = Account.builder().accountName("월급").bankInfo("국민").accountNumber("111").build();

        assertThrows(IllegalArgumentException.class, () -> accountService.createAccount("user", account));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void 가계부_내역이_있는_통장은_삭제하지_않는다() {
        Account account = Account.builder().accountId(1L).build();
        when(accountRepository.findByAccountIdAndMember_Id(1L, "user")).thenReturn(Optional.of(account));
        when(accountBookRepository.existsByAccount_AccountId(1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> accountService.deleteAccount("user", 1L));
        verify(accountRepository, never()).delete(any());
    }

    @Test
    void 가계부_내역이_없는_통장은_삭제한다() {
        Account account = Account.builder().accountId(1L).build();
        when(accountRepository.findByAccountIdAndMember_Id(1L, "user")).thenReturn(Optional.of(account));
        when(accountBookRepository.existsByAccount_AccountId(1L)).thenReturn(false);

        accountService.deleteAccount("user", 1L);

        verify(accountRepository).delete(account);
    }

    @Test
    void 잔액_수정값이_없으면_예외() {
        assertThrows(IllegalArgumentException.class, () -> accountService.updateBalance("user", 1L, null));
    }
}
