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
    private final EmailVerificationService emailVerificationService;

    @Override
    public void signUp(Member member, String code) {
        // 프론트와 같은 규칙: 화면을 거치지 않은 요청도 막는다
        if (isBlank(member.getName()) || isBlank(member.getId()) || isBlank(member.getPassword()) || isBlank(member.getPhoneNumber())
                || isBlank(member.getEmail())) {
            throw new IllegalArgumentException("모든 항목을 입력해주세요.");
        }
        if (!member.getPhoneNumber().matches("\\d{11}")) {
            throw new IllegalArgumentException("휴대폰번호는 숫자 11자리로 입력해주세요.");
        }
        if (member.getPassword().length() > 20) {
            throw new IllegalArgumentException("비밀번호는 20자 이내로 입력해주세요.");
        }
        if (!checkId(member.getId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        // 입력값 검사를 다 통과한 뒤에 확인해야, 아이디 중복 같은 이유로 인증번호가 헛되이 소모되지 않는다
        emailVerificationService.verifyCode(member.getEmail(), code);
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
    public List<String> findIds(String email, String code) {
        emailVerificationService.verifyCode(email, code);
        List<String> ids = memberRepository
                .findAllByEmailAndWithDrawalStatus(email, WithDrawalStatus.ACTIVE)
                .stream().map(Member::getId).toList();
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("일치하는 회원이 없습니다.");
        }
        return ids;
    }

    @Override
    @Transactional
    public void resetPassword(String id, String email, String code, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        // 인증을 먼저 해야 인증번호 없이 아이디·이메일 조합을 떠볼 수 없다
        emailVerificationService.verifyCode(email, code);
        Member member = memberRepository.findById(id)
                .filter(m -> email.equals(m.getEmail())
                        && m.getWithDrawalStatus() == WithDrawalStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));
        member.updatePassword(newPassword);
    }

    @Override
    public Member getMember(String id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
    }

    @Override
    @Transactional
    public void updateMember(String id, String currentPassword, String phoneNumber, String password) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (currentPassword == null || !member.matchPassword(currentPassword)) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // null이면 기존 값 유지, 빈 값으로 바꾸는 것은 막는다 (nullable = false 컬럼)
        if ((phoneNumber != null && phoneNumber.isBlank()) || (password != null && password.isBlank())) {
            throw new IllegalArgumentException("변경할 값을 입력해주세요.");
        }
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

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
