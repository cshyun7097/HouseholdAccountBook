package com.seunghyun.householdaccountbook.domain.accountbook.dto.response;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;

// JPQL 집계 결과 (year/month는 Integer로 반환된다)
public record MonthlyTotal(Integer year, Integer month, AccountBookType type, Long total) {
}
