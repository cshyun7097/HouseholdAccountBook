package com.seunghyun.householdaccountbook.global.jwt;

import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private final JwtTokenProvider tokenProvider = new JwtTokenProvider("a".repeat(32), 60_000);
    private final MemberRepository memberRepository = mock(MemberRepository.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(tokenProvider, memberRepository);

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void requestAs(WithDrawalStatus status) throws Exception {
        when(memberRepository.findById("user"))
                .thenReturn(Optional.of(Member.builder().id("user").withDrawalStatus(status).build()));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + tokenProvider.generateToken("user"));
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    }

    @Test
    void 활성_회원의_토큰은_인증한다() throws Exception {
        requestAs(WithDrawalStatus.ACTIVE);
        assertEquals("user", SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void 탈퇴한_회원의_토큰은_인증하지_않는다() throws Exception {
        requestAs(WithDrawalStatus.INACTIVE);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
