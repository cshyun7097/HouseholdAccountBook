package com.seunghyun.householdaccountbook.domain.category.controller;

import com.seunghyun.householdaccountbook.domain.category.dto.request.AddCategoryRequestDto;
import com.seunghyun.householdaccountbook.domain.category.dto.request.UpdateCategoryRequestDto;
import com.seunghyun.householdaccountbook.domain.category.dto.response.CategoryResponseDto;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/category/get")
    public ResponseEntity<?> getCategories(@AuthenticationPrincipal String id) {
        List<CategoryResponseDto> categories = categoryService.getCategories(id).stream()
                .map(category -> CategoryResponseDto.builder()
                        .categoryId(category.getCategoryId())
                        .categoryName(category.getCategoryName())
                        .build())
                .toList();
        return ResponseEntity.ok(categories);
    }

    @PatchMapping("/category/update/{categoryId}")
    public ResponseEntity<?> updateCategory(@AuthenticationPrincipal String id,
                                            @PathVariable Long categoryId,
                                            @RequestBody UpdateCategoryRequestDto updateDto) {
        categoryService.updateCategory(id, categoryId, updateDto.getCategoryName());
        return ResponseEntity.ok("카테고리 수정 완료");
    }

    @DeleteMapping("/category/delete/{categoryId}")
    public ResponseEntity<?> deleteCategory(@AuthenticationPrincipal String id,
                                            @PathVariable Long categoryId) {
        categoryService.deleteCategory(id, categoryId);
        return ResponseEntity.ok("카테고리 삭제 완료");
    }
}
