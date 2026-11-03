package com.seunghyun.householdaccountbook.domain.account.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
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
    void 계좌번호는_앞_5자리만_남기고_가려서_저장한다() {
        Member member = Member.builder().id("user").withDrawalStatus(WithDrawalStatus.ACTIVE).build();
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));
        Account account = Account.builder().accountName("월급").bankInfo("국민").accountNumber("1234567890").balance(0L).build();

        accountService.createAccount("user", account);

        assertEquals("12345*****", account.getAccountNumber());
        verify(accountRepository).save(account);
        assertEquals("123", AccountServiceImpl.maskAccountNumber("123"));
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

    @Test
    void 이체하면_보내는_통장에서_빼고_받는_통장에_더한다() {
        when(accountRepository.findByAccountIdAndMember_Id(anyLong(), eq("user"))).thenReturn(Optional.of(Account.builder().build()));
        when(accountRepository.changeBalance(1L, -1000L)).thenReturn(1);

        accountService.transfer("user", 1L, 2L, 1000L);

        verify(accountRepository).changeBalance(2L, 1000L);
    }

    @Test
    void 잔액이_부족하면_받는_통장에_더하지_않는다() {
        when(accountRepository.findByAccountIdAndMember_Id(anyLong(), eq("user"))).thenReturn(Optional.of(Account.builder().build()));
        when(accountRepository.changeBalance(1L, -1000L)).thenReturn(0);

        assertThrows(IllegalArgumentException.class, () -> accountService.transfer("user", 1L, 2L, 1000L));
        verify(accountRepository, never()).changeBalance(2L, 1000L);
    }

    @Test
    void 남의_통장으로는_이체하지_않는다() {
        when(accountRepository.findByAccountIdAndMember_Id(1L, "user")).thenReturn(Optional.of(Account.builder().build()));
        when(accountRepository.findByAccountIdAndMember_Id(2L, "user")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> accountService.transfer("user", 1L, 2L, 1000L));
        verify(accountRepository, never()).changeBalance(anyLong(), anyLong());
    }

    @Test
    void 같은_통장이나_0원_이하는_이체하지_않는다() {
        assertThrows(IllegalArgumentException.class, () -> accountService.transfer("user", 1L, 1L, 1000L));
        assertThrows(IllegalArgumentException.class, () -> accountService.transfer("user", 1L, 2L, 0L));
        verify(accountRepository, never()).changeBalance(anyLong(), anyLong());
    }
}
