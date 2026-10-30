package com.seunghyun.householdaccountbook.domain.accountbook.repository;

import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
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
}
