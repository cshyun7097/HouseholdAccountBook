package com.seunghyun.householdaccountbook.domain.category.repository;

import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByMember_Id(String id);

    Optional<Category> findByCategoryIdAndMember_Id(Long categoryId, String id);
}
