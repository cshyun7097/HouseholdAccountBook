package com.seunghyun.householdaccountbook.domain.category.service;

import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public void addCategory(String id, Category category) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }

        category.setMember(member);
        categoryRepository.save(category);
    }

    @Override
    public List<Category> getCategories(String id) {
        return categoryRepository.findAllByMember_Id(id);
    }

    @Override
    @Transactional
    public void updateCategory(String id, Long categoryId, String categoryName) {
        // 본인 카테고리만 조회해서 남의 카테고리 수정을 막는다
        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));
        category.setCategoryName(categoryName);
    }

    @Override
    @Transactional
    public void deleteCategory(String id, Long categoryId) {
        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));
        categoryRepository.delete(category);
    }
}
