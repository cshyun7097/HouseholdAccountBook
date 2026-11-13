package com.seunghyun.householdaccountbook.domain.card.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import com.seunghyun.householdaccountbook.domain.card.repository.CardRepository;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceImplTest {

    @Mock CardRepository cardRepository;
    @Mock MemberRepository memberRepository;
    @Mock AccountBookRepository accountBookRepository;
    @Mock AccountRepository accountRepository;
    @InjectMocks CardServiceImpl cardService;

    private void givenMyCardAndAccount() {
        when(cardRepository.findByCardIdAndMember_Id(5L, "user")).thenReturn(Optional.of(Card.builder().cardId(5L).build()));
        when(accountRepository.findByAccountIdAndMember_Id(10L, "user")).thenReturn(Optional.of(Account.builder().accountId(10L).build()));
    }

    @Test
    void 납부하면_부채를_줄이고_통장에서_뺀다() {
        givenMyCardAndAccount();
        when(cardRepository.payDebt(5L, 3000L)).thenReturn(1);
        when(accountRepository.changeBalance(10L, -3000L)).thenReturn(1);

        cardService.payCard("user", 5L, 10L, 3000L);

        verify(cardRepository).payDebt(5L, 3000L);
        verify(accountRepository).changeBalance(10L, -3000L);
    }

    @Test
    void 부채보다_많이_내면_통장을_건드리지_않는다() {
        givenMyCardAndAccount();
        when(cardRepository.payDebt(5L, 3000L)).thenReturn(0);

        assertThrows(IllegalArgumentException.class, () -> cardService.payCard("user", 5L, 10L, 3000L));
        verify(accountRepository, never()).changeBalance(anyLong(), anyLong());
    }

    @Test
    void 잔액이_부족하면_예외() {
        givenMyCardAndAccount();
        when(cardRepository.payDebt(5L, 3000L)).thenReturn(1);
        when(accountRepository.changeBalance(10L, -3000L)).thenReturn(0);

        assertThrows(IllegalArgumentException.class, () -> cardService.payCard("user", 5L, 10L, 3000L));
    }

    @Test
    void 남의_통장으로는_납부할_수_없다() {
        when(cardRepository.findByCardIdAndMember_Id(5L, "user")).thenReturn(Optional.of(Card.builder().cardId(5L).build()));
        when(accountRepository.findByAccountIdAndMember_Id(10L, "user")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> cardService.payCard("user", 5L, 10L, 3000L));
        verify(cardRepository, never()).payDebt(anyLong(), anyLong());
    }

    @Test
    void 금액이_0이하면_납부하지_않는다() {
        assertThrows(IllegalArgumentException.class, () -> cardService.payCard("user", 5L, 10L, 0L));
        verifyNoInteractions(cardRepository, accountRepository);
    }
}
