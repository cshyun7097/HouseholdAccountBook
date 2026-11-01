package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Override
    public void signUp(Member member) {
        if (!checkId(member.getId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
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
    public List<String> findIds(String name, String phoneNumber) {
        List<String> ids = memberRepository
                .findAllByNameAndPhoneNumberAndWithDrawalStatus(name, phoneNumber, WithDrawalStatus.ACTIVE)
                .stream().map(Member::getId).toList();
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("일치하는 회원이 없습니다.");
        }
        return ids;
    }

    @Override
    @Transactional
    public void resetPassword(String id, String name, String phoneNumber, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        // 어느 항목이 틀렸는지 알려주지 않아야 아이디 존재 여부가 드러나지 않는다
        Member member = memberRepository.findById(id)
                .filter(m -> m.getName().equals(name) && m.getPhoneNumber().equals(phoneNumber)
                        && m.getWithDrawalStatus() == WithDrawalStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));
        member.updatePassword(newPassword);
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
