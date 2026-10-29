package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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

        return member;
    }

    @Override
    public boolean checkId(String id) {
        Optional<Member> member = memberRepository.findById(id);
        return member.isEmpty();
    }
}
