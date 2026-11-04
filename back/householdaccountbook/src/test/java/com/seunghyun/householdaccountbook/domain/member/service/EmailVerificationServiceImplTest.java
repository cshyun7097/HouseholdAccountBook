package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.EmailVerification;
import com.seunghyun.householdaccountbook.domain.member.repository.EmailVerificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceImplTest {

    @Mock EmailVerificationRepository emailVerificationRepository;
    @Mock JavaMailSender mailSender;
    @InjectMocks EmailVerificationServiceImpl emailVerificationService;

    private EmailVerification verification(LocalDateTime expiresAt) {
        return EmailVerification.builder().email("a@b.com").code("123456").expiresAt(expiresAt).build();
    }

    @Test
    void 인증번호를_5분_만료로_저장하고_메일로_보낸다() {
        when(emailVerificationRepository.findByEmail("a@b.com")).thenReturn(Optional.empty());

        emailVerificationService.sendCode("a@b.com");

        ArgumentCaptor<EmailVerification> saved = ArgumentCaptor.forClass(EmailVerification.class);
        verify(emailVerificationRepository).save(saved.capture());
        LocalDateTime expiresAt = saved.getValue().getExpiresAt();
        assertTrue(expiresAt.isAfter(LocalDateTime.now().plusMinutes(4)) && !expiresAt.isAfter(LocalDateTime.now().plusMinutes(5)));
        assertTrue(saved.getValue().getCode().matches("\\d{6}"));

        ArgumentCaptor<SimpleMailMessage> mail = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(mail.capture());
        assertTrue(mail.getValue().getText().contains(saved.getValue().getCode()));
    }

    @Test
    void 이메일_형식이_아니면_보내지_않는다() {
        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.sendCode("not-an-email"));
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void 보낸지_1분이_안됐으면_다시_보내지_않는다() {
        // 30초 전에 보낸 인증번호
        when(emailVerificationRepository.findByEmail("a@b.com"))
                .thenReturn(Optional.of(verification(LocalDateTime.now().plusMinutes(5).minusSeconds(30))));

        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.sendCode("a@b.com"));
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void 보낸지_1분이_지났으면_새_번호로_갱신한다() {
        EmailVerification old = verification(LocalDateTime.now().plusMinutes(3));
        when(emailVerificationRepository.findByEmail("a@b.com")).thenReturn(Optional.of(old));

        emailVerificationService.sendCode("a@b.com");

        assertTrue(old.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(4)));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void 맞는_번호면_통과하고_번호를_지운다() {
        EmailVerification v = verification(LocalDateTime.now().plusMinutes(5));
        when(emailVerificationRepository.findByEmail("a@b.com")).thenReturn(Optional.of(v));

        emailVerificationService.verifyCode("a@b.com", "123456");

        verify(emailVerificationRepository).delete(v);
    }

    @Test
    void 만료된_번호면_맞아도_예외() {
        when(emailVerificationRepository.findByEmail("a@b.com"))
                .thenReturn(Optional.of(verification(LocalDateTime.now().minusSeconds(1))));

        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.verifyCode("a@b.com", "123456"));
        verify(emailVerificationRepository, never()).delete(any());
    }

    @Test
    void 틀린_번호면_예외() {
        when(emailVerificationRepository.findByEmail("a@b.com"))
                .thenReturn(Optional.of(verification(LocalDateTime.now().plusMinutes(5))));

        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.verifyCode("a@b.com", "000000"));
    }

    @Test
    void 다섯_번_틀리면_맞는_번호도_막는다() {
        EmailVerification v = verification(LocalDateTime.now().plusMinutes(5));
        when(emailVerificationRepository.findByEmail("a@b.com")).thenReturn(Optional.of(v));
        for (int i = 0; i < 5; i++) {
            assertThrows(IllegalArgumentException.class, () -> emailVerificationService.verifyCode("a@b.com", "000000"));
        }

        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.verifyCode("a@b.com", "123456"));
        verify(emailVerificationRepository, never()).delete(any());
    }

    @Test
    void 요청한_적_없는_이메일이면_예외() {
        when(emailVerificationRepository.findByEmail("a@b.com")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> emailVerificationService.verifyCode("a@b.com", "123456"));
    }
}
