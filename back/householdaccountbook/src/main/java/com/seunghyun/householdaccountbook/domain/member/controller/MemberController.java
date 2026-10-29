package com.seunghyun.householdaccountbook.domain.member.controller;

import com.seunghyun.householdaccountbook.domain.member.dto.request.LoginRequestDto;
import com.seunghyun.householdaccountbook.domain.member.dto.request.SignUpRequestDto;
import com.seunghyun.householdaccountbook.domain.member.dto.request.UpdateMemberRequestDto;
import com.seunghyun.householdaccountbook.domain.member.dto.response.LoginResponseDto;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.service.MemberService;
import com.seunghyun.householdaccountbook.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/member/sign-up")
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

    @GetMapping("/member/id-check/{id}")
    public ResponseEntity<?> idCheck(@PathVariable String id) {
        log.info("아이디 체크 들어왔핑");
        boolean isEmpty = memberService.checkId(id);
        if (isEmpty) {
            return ResponseEntity.ok("아이디 생성 가능");
        } else {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
    }

    @PostMapping("/member/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginDto) {
        Member member = memberService.login(loginDto.getId(), loginDto.getPassword());
        String token = jwtTokenProvider.generateToken(member.getId());
        return ResponseEntity.ok(LoginResponseDto.builder().token(token).build());
    }

    @PatchMapping("/member/update")
    public ResponseEntity<?> updateMember(@AuthenticationPrincipal String id,
                                          @RequestBody UpdateMemberRequestDto updateDto) {
        memberService.updateMember(id, updateDto.getCurrentPassword(), updateDto.getPhoneNumber(), updateDto.getPassword());
        return ResponseEntity.ok("회원정보 수정 완료");
    }
}
