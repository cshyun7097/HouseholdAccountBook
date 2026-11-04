package com.seunghyun.householdaccountbook.domain.member.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FindIdRequestDto {
    private String name;
    private String phoneNumber;
}
