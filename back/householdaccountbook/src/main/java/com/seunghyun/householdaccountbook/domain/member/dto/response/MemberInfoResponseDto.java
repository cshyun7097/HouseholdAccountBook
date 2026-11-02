package com.seunghyun.householdaccountbook.domain.member.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberInfoResponseDto {
    private String id;
    private String name;
    private String phoneNumber;
}
