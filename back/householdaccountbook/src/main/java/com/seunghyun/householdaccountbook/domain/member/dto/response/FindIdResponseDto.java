package com.seunghyun.householdaccountbook.domain.member.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FindIdResponseDto {
    private List<String> ids;
}
