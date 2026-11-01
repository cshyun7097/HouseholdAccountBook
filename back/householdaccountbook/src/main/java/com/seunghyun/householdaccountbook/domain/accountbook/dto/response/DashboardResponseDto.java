package com.seunghyun.householdaccountbook.domain.accountbook.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardResponseDto {
    private String month; // 기준 달 (yyyy-MM)
    private List<MonthlySummary> monthly; // 오래된 달부터, 내역이 없는 달은 0
    private List<CategoryTotal> categories; // 기준 달 지출, 금액 큰 순

    public record MonthlySummary(String month, long income, long expense) {
    }
}
