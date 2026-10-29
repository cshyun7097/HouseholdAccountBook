package com.seunghyun.householdaccountbook.domain.member.repository;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findById(String id);
}
