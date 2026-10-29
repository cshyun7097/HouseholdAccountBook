package com.seunghyun.householdaccountbook.global.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Objects;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException e) {
        return toResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleNotReadable(HttpMessageNotReadableException e) {
        return toResponse(HttpStatus.BAD_REQUEST, "요청 본문 형식이 올바르지 않습니다.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        // 404, 405 등 Spring이 상태코드를 정해둔 예외는 그 상태 그대로 반환
        if (e instanceof ErrorResponse errorResponse) {
            return toResponse(errorResponse.getStatusCode(), e.getMessage());
        }
        log.error("처리되지 않은 예외", e);
        return toResponse(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
    }

    private ResponseEntity<?> toResponse(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", HttpStatus.valueOf(status.value()).getReasonPhrase(),
                "message", Objects.requireNonNullElse(message, "")));
    }
}
