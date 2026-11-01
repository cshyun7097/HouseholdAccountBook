package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
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
class MemberServiceImplTest {

    @Mock MemberRepository memberRepository;
    @InjectMocks MemberServiceImpl memberService;

    private Member newMember() {
        return Member.builder().id("user").password("pw").name("이름").phoneNumber("01012345678").build();
    }

    @Test
    void 새_아이디면_가입한다() {
        when(memberRepository.findById("user")).thenReturn(Optional.empty());

        memberService.signUp(newMember());

        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void 이미_있는_아이디면_가입하지_않는다() {
        when(memberRepository.findById("user")).thenReturn(Optional.of(newMember()));

        assertThrows(IllegalArgumentException.class, () -> memberService.signUp(newMember()));
        verify(memberRepository, never()).save(any());
    }
}
