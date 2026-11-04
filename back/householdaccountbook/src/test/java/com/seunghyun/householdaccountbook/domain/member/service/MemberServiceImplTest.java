package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    void 휴대폰번호가_숫자_11자리가_아니면_가입하지_않는다() {
        for (String phone : List.of("0101234567", "010123456789", "010-1234-5678")) {
            Member member = Member.builder().id("user").password("pw").name("이름").phoneNumber(phone).build();
            assertThrows(IllegalArgumentException.class, () -> memberService.signUp(member));
        }
        verify(memberRepository, never()).save(any());
    }

    @Test
    void 비밀번호가_20자를_넘으면_가입하지_않는다() {
        Member member = Member.builder().id("user").password("a".repeat(21)).name("이름").phoneNumber("01012345678").build();

        assertThrows(IllegalArgumentException.class, () -> memberService.signUp(member));
        verify(memberRepository, never()).save(any());
    }

    @Test
    void 비밀번호가_20자면_가입한다() {
        when(memberRepository.findById("user")).thenReturn(Optional.empty());
        Member member = Member.builder().id("user").password("a".repeat(20)).name("이름").phoneNumber("01012345678").build();

        memberService.signUp(member);

        verify(memberRepository).save(member);
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

    @Test
    void 이름과_휴대폰번호로_활성_회원의_아이디를_찾는다() {
        when(memberRepository.findAllByNameAndPhoneNumberAndWithDrawalStatus("이름", "01012345678", WithDrawalStatus.ACTIVE))
                .thenReturn(List.of(newMember()));

        assertEquals(List.of("user"), memberService.findIds("이름", "01012345678"));
    }

    @Test
    void 일치하는_회원이_없으면_예외() {
        when(memberRepository.findAllByNameAndPhoneNumberAndWithDrawalStatus("이름", "01000000000", WithDrawalStatus.ACTIVE))
                .thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> memberService.findIds("이름", "01000000000"));
    }

    private Member activeMember() {
        return Member.builder().id("user").password("old").name("이름").phoneNumber("01012345678")
                .withDrawalStatus(WithDrawalStatus.ACTIVE).build();
    }

    @Test
    void 정보가_모두_맞으면_비밀번호를_재설정한다() {
        Member member = activeMember();
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));

        memberService.resetPassword("user", "이름", "01012345678", "new");

        assertTrue(member.matchPassword("new"));
    }

    @Test
    void 전화번호가_다르면_재설정하지_않는다() {
        Member member = activeMember();
        member.updatePassword("old");
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));

        assertThrows(IllegalArgumentException.class,
                () -> memberService.resetPassword("user", "이름", "01000000000", "new"));
        assertFalse(member.matchPassword("new"));
    }

    @Test
    void 새_비밀번호가_비어있으면_예외() {
        assertThrows(IllegalArgumentException.class,
                () -> memberService.resetPassword("user", "이름", "01012345678", " "));
    }

    @Test
    void 현재_비밀번호가_맞으면_휴대폰번호를_바꾼다() {
        Member member = activeMember();
        member.updatePassword("old");
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));

        memberService.updateMember("user", "old", "01099990000", null);

        assertEquals("01099990000", member.getPhoneNumber());
        assertTrue(member.matchPassword("old"));
    }

    @Test
    void 현재_비밀번호가_틀리면_바꾸지_않는다() {
        Member member = activeMember();
        member.updatePassword("old");
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));

        assertThrows(IllegalArgumentException.class, () -> memberService.updateMember("user", "wrong", null, "new"));
        assertFalse(member.matchPassword("new"));
    }

    @Test
    void 새_비밀번호가_빈_값이면_바꾸지_않는다() {
        Member member = activeMember();
        member.updatePassword("old");
        when(memberRepository.findById("user")).thenReturn(Optional.of(member));

        assertThrows(IllegalArgumentException.class, () -> memberService.updateMember("user", "old", null, " "));
        assertTrue(member.matchPassword("old"));
    }
}
