package com.seunghyun.householdaccountbook.domain.member.service;

public interface EmailVerificationService {

    void sendCode(String email);

    // 맞으면 인증번호를 지워서 한 번만 쓰게 하고, 틀리거나 만료면 예외
    void verifyCode(String email, String code);
}
