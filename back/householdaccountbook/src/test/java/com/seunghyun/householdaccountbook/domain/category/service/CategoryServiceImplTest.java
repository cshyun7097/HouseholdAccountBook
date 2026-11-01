package com.seunghyun.householdaccountbook.domain.category.service;

import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock CategoryRepository categoryRepository;
    @Mock MemberRepository memberRepository;
    @Mock AccountBookRepository accountBookRepository;
    @InjectMocks CategoryServiceImpl categoryService;

    @Test
    void 이름이_비어있으면_추가하지_않는다() {
        Category category = Category.builder().categoryName(" ").build();

        assertThrows(IllegalArgumentException.class, () -> categoryService.addCategory("user", category));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void 가계부에서_사용_중인_카테고리는_삭제하지_않는다() {
        Category category = Category.builder().categoryId(1L).build();
        when(categoryRepository.findByCategoryIdAndMember_Id(1L, "user")).thenReturn(Optional.of(category));
        when(accountBookRepository.existsByCategory_CategoryId(1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> categoryService.deleteCategory("user", 1L));
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void 사용하지_않는_카테고리는_삭제한다() {
        Category category = Category.builder().categoryId(1L).build();
        when(categoryRepository.findByCategoryIdAndMember_Id(1L, "user")).thenReturn(Optional.of(category));
        when(accountBookRepository.existsByCategory_CategoryId(1L)).thenReturn(false);

        categoryService.deleteCategory("user", 1L);

        verify(categoryRepository).delete(category);
    }
}
