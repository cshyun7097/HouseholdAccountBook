package com.seunghyun.householdaccountbook.domain.category.service;

import com.seunghyun.householdaccountbook.domain.category.entity.Category;

import java.util.List;

public interface CategoryService {

    void addCategory(String id, Category category);

    List<Category> getCategories(String id);

    void updateCategory(String id, Long categoryId, String categoryName);

    void deleteCategory(String id, Long categoryId);
}
