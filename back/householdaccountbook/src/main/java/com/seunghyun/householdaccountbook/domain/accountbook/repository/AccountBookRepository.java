package com.seunghyun.householdaccountbook.domain.accountbook.repository;

import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.CategoryTotal;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.MonthlyTotal;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {

    // 응답에 카테고리 이름이 필요해서 함께 조회 (N+1 방지)
    @EntityGraph(attributePaths = "category")
    Page<AccountBook> findAllByMember_Id(String id, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<AccountBook> findAllByMember_IdAndAccount_AccountId(String id, Long accountId, Pageable pageable);

    // Between은 시작일과 종료일을 모두 포함한다
    @EntityGraph(attributePaths = "category")
    Page<AccountBook> findAllByMember_IdAndDateBetween(String id, LocalDate startDate, LocalDate endDate, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Page<AccountBook> findAllByMember_IdAndAccount_AccountIdAndDateBetween(String id, Long accountId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Optional<AccountBook> findByAccountBookIdAndMember_Id(Long accountBookId, String id);

    boolean existsByAccount_AccountId(Long accountId);

    boolean existsByCategory_CategoryId(Long categoryId);

    @Query("select new com.seunghyun.householdaccountbook.domain.accountbook.dto.response.MonthlyTotal(" +
            "year(a.date), month(a.date), a.type, sum(a.price)) " +
            "from AccountBook a where a.member.id = :id and a.date between :startDate and :endDate " +
            "group by year(a.date), month(a.date), a.type")
    List<MonthlyTotal> sumByMonthAndType(@Param("id") String id,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    @Query("select new com.seunghyun.householdaccountbook.domain.accountbook.dto.response.CategoryTotal(" +
            "a.category.categoryName, sum(a.price)) " +
            "from AccountBook a where a.member.id = :id and a.type = :type and a.date between :startDate and :endDate " +
            "group by a.category.categoryId, a.category.categoryName order by sum(a.price) desc")
    List<CategoryTotal> sumByCategory(@Param("id") String id,
                                      @Param("type") AccountBookType type,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);
}
