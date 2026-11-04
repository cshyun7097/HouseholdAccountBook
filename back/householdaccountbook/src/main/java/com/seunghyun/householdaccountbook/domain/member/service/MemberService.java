package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;

import java.util.List;

public interface MemberService {

    void signUp(Member member, String code);

    Member login(String id, String password);

    boolean checkId(String id);

    List<String> findIds(String email, String code);

    void resetPassword(String id, String email, String code, String newPassword);

    void withdraw(String id);

    Member getMember(String id);

    void updateMember(String id, String currentPassword, String phoneNumber, String password);
}
