package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;

import java.util.List;

public interface MemberService {

    void signUp(Member member);

    Member login(String id, String password);

    boolean checkId(String id);

    List<String> findIds(String name, String phoneNumber);

    void resetPassword(String id, String name, String phoneNumber, String newPassword);

    void withdraw(String id, String currentPassword);

    Member getMember(String id);

    void updateMember(String id, String currentPassword, String phoneNumber, String password);
}
