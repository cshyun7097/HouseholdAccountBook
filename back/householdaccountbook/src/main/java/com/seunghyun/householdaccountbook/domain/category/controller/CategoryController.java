package com.seunghyun.householdaccountbook.domain.category.controller;

import com.seunghyun.householdaccountbook.domain.category.dto.request.AddCategoryRequestDto;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping("/category/add")
    public ResponseEntity<?> addCategory(@AuthenticationPrincipal String id,
                                         @RequestBody AddCategoryRequestDto addDto) {
        categoryService.addCategory(id, Category.builder()
                .categoryName(addDto.getCategoryName())
                .build());
        return ResponseEntity.ok("카테고리 추가 완료");
    }
}
