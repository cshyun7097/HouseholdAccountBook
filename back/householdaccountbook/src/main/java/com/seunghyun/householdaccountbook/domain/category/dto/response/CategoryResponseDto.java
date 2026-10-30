package com.seunghyun.householdaccountbook.domain.category.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponseDto {
    private Long categoryId;
    private String categoryName;
}
