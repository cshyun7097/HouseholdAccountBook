package com.seunghyun.householdaccountbook.domain.category.dto.request;

import lombok.*;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCategoryRequestDto {
    private String categoryName;
}
