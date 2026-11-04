package com.seunghyun.householdaccountbook.domain.member.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequestDto {
    private String id;
    private String email;
    private String code;
    private String newPassword;
}
