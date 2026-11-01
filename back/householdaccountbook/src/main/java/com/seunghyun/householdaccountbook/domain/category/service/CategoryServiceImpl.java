package com.seunghyun.householdaccountbook.domain.category.service;

import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
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
    private final AccountBookRepository accountBookRepository;

    @Override
    @Transactional
    public void addCategory(String id, Category category) {
        requireName(category.getCategoryName());
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
        requireName(categoryName);
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
        // 가계부가 카테고리를 참조하고 있어서 그대로 지우면 FK 오류가 난다
        if (accountBookRepository.existsByCategory_CategoryId(categoryId)) {
            throw new IllegalArgumentException("가계부에서 사용 중인 카테고리는 삭제할 수 없습니다.");
        }
        categoryRepository.delete(category);
    }

    private static void requireName(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("카테고리 이름을 입력해주세요.");
        }
    }
}
