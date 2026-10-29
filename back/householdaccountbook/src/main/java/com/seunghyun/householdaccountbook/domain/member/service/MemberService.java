package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;

public interface MemberService {

    void signUp(Member member);

    Member login(String id, String password);

    boolean checkId(String id);
}
