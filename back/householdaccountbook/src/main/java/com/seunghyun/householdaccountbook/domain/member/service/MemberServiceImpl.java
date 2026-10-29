package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Override
    public void signUp(Member member) {
        member.updatePassword(member.getPassword());
        memberRepository.save(member);
    }

    @Override
    public Member login(String id, String password) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (!member.matchPassword(password)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }

        return member;
    }

    @Override
    public boolean checkId(String id) {
        Optional<Member> member = memberRepository.findById(id);
        return member.isEmpty();
    }

    @Override
    @Transactional
    public void updateMember(String id, String currentPassword, String phoneNumber, String password) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (currentPassword == null || !member.matchPassword(currentPassword)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // null이면 기존 값 유지 (nullable = false 컬럼)
        if (phoneNumber != null) {
            member.setPhoneNumber(phoneNumber);
        }
        if (password != null) {
            member.updatePassword(password);
        }
    }

    @Override
    @Transactional
    public void withdraw(String id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
        member.setWithDrawalStatus(WithDrawalStatus.INACTIVE);
    }
}
