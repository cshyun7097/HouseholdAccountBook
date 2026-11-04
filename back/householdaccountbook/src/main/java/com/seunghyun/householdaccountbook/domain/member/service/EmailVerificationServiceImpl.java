package com.seunghyun.householdaccountbook.domain.member.service;

import com.seunghyun.householdaccountbook.domain.member.entity.EmailVerification;
import com.seunghyun.householdaccountbook.domain.member.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final Duration EXPIRATION = Duration.ofMinutes(5);
    private static final Duration RESEND_INTERVAL = Duration.ofMinutes(1);
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationRepository emailVerificationRepository;
    private final JavaMailSender mailSender;

    @Override
    @Transactional
    public void sendCode(String email) {
        if (email == null || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plus(EXPIRATION);

        emailVerificationRepository.findByEmail(email).ifPresentOrElse(verification -> {
            // 발송 시각 = 만료 시각 - 5분. 메일 폭탄을 막으려고 1분 안에는 다시 보내지 않는다
            if (now.isBefore(verification.getExpiresAt().minus(EXPIRATION).plus(RESEND_INTERVAL))) {
                throw new IllegalArgumentException("잠시 후 다시 요청해주세요.");
            }
            verification.renew(code, expiresAt);
        }, () -> emailVerificationRepository.save(EmailVerification.builder()
                .email(email).code(code).expiresAt(expiresAt).build()));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[가계부] 이메일 인증번호");
        message.setText("인증번호: " + code + "\n5분 안에 입력해주세요.");
        mailSender.send(message);
    }

    // 호출한 쪽 트랜잭션이 예외로 롤백돼도 시도 횟수는 남아야 하므로 별도 트랜잭션으로 커밋한다
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = IllegalArgumentException.class)
    public void verifyCode(String email, String code) {
        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증번호를 먼저 요청해주세요."));
        if (verification.isExpired(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }
        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException("시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.");
        }
        if (!verification.matchCode(code)) {
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다.");
        }
        emailVerificationRepository.delete(verification);
    }
}
