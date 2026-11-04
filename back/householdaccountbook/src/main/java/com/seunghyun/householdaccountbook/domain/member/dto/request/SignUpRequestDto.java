package com.seunghyun.householdaccountbook.domain.member.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequestDto {
    private String name;
    private String phoneNumber;
    private String email;
    private String code;
    private String id;
    private String password;
}
