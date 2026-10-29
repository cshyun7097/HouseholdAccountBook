package com.seunghyun.householdaccountbook.domain.member.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberRequestDto {
    private String currentPassword;
    private String phoneNumber;
    private String password;
}
