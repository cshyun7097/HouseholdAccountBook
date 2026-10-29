package com.seunghyun.householdaccountbook.domain.member.controller;

import com.seunghyun.householdaccountbook.domain.member.dto.request.LoginRequestDto;
import com.seunghyun.householdaccountbook.domain.member.dto.request.SignUpRequestDto;
import com.seunghyun.householdaccountbook.domain.member.dto.response.LoginResponseDto;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.service.MemberService;
import com.seunghyun.householdaccountbook.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/sign-up")
    public ResponseEntity<?> singUp(@RequestBody SignUpRequestDto signUpDto) {
        memberService.signUp(Member.builder()
                .name(signUpDto.getName())
                .id(signUpDto.getId())
                .password(signUpDto.getPassword())
                .phoneNumber(signUpDto.getPhoneNumber())
                .withDrawalStatus(WithDrawalStatus.ACTIVE)
                .build());
        return ResponseEntity.ok("회원가입 완료핑");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginDto) {
        Member member = memberService.login(loginDto.getId(), loginDto.getPassword());
        String token = jwtTokenProvider.generateToken(member.getId());
        return ResponseEntity.ok(LoginResponseDto.builder().token(token).build());
    }
}
