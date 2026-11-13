package com.seunghyun.householdaccountbook.domain.accountbook.service;

import com.seunghyun.householdaccountbook.domain.account.entity.Account;
import com.seunghyun.householdaccountbook.domain.account.repository.AccountRepository;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.DashboardResponseDto;
import com.seunghyun.householdaccountbook.domain.accountbook.dto.response.MonthlyTotal;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBook;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.AccountBookType;
import com.seunghyun.householdaccountbook.domain.accountbook.entity.PaymentType;
import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.card.repository.CardRepository;
import com.seunghyun.householdaccountbook.domain.category.entity.Category;
import com.seunghyun.householdaccountbook.domain.category.repository.CategoryRepository;
import com.seunghyun.householdaccountbook.domain.member.entity.Member;
import com.seunghyun.householdaccountbook.domain.member.entity.WithDrawalStatus;
import com.seunghyun.householdaccountbook.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountBookServiceImpl implements AccountBookService {

    private static final int PAGE_SIZE = 20;

    private static final int DASHBOARD_MONTHS = 6;
    // 최신 날짜순, 같은 날짜는 최근 등록순
    private static final Sort SORT = Sort.by(Sort.Direction.DESC, "date", "accountBookId");

    private final AccountBookRepository accountBookRepository;
    private final MemberRepository memberRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final CardRepository cardRepository;

    @Override
    @Transactional
    public void addAccountBook(String id, Long categoryId, Long accountId, Long cardId, AccountBook accountBook) {
        validate(accountBook.getContent(), accountBook.getPrice(), accountBook.getType());
        if (accountBook.getPaymentType() == null) {
            throw new IllegalArgumentException("통장/카드 중 결제수단을 선택해주세요.");
        }
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }

        // 본인 카테고리만 조회해서 남의 카테고리로 등록하는 것을 막는다
        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        accountBook.setMember(member);
        accountBook.setCategory(category);

        // 카드는 잔액 대신 부채가 늘어난다 (지출이면 +, 환불 같은 수입이면 -)
        if (accountBook.getPaymentType() == PaymentType.CARD) {
            // 본인 카드만 조회해서 남의 카드로 등록하는 것을 막는다
            accountBook.setCard(cardRepository.findByCardIdAndMember_Id(cardId, id)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카드입니다.")));
            accountBookRepository.save(accountBook);
            cardRepository.addDebt(cardId, -balanceEffect(accountBook.getType(), accountBook.getPrice()));
            return;
        }

        // 본인 계좌만 조회해서 남의 계좌로 등록하는 것을 막는다
        Account account = accountRepository.findByAccountIdAndMember_Id(accountId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계좌입니다."));

        accountBook.setAccount(account);
        accountBookRepository.save(accountBook);
        changeBalance(accountId, balanceEffect(accountBook.getType(), accountBook.getPrice()));
    }

    @Override
    public Page<AccountBook> getAccountBooks(String id, int page) {
        return accountBookRepository.findAllByMember_Id(id, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByAccount(String id, Long accountId, int page) {
        // 회원 조건을 같이 걸어서 남의 계좌 내역은 조회되지 않는다
        return accountBookRepository.findAllByMember_IdAndAccount_AccountId(id, accountId, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByDate(String id, LocalDate startDate, LocalDate endDate, int page) {
        validateRange(startDate, endDate);
        return accountBookRepository.findAllByMember_IdAndDateBetween(id, startDate, endDate, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByAccountAndDate(String id, Long accountId, LocalDate startDate, LocalDate endDate, int page) {
        validateRange(startDate, endDate);
        // 회원 조건을 같이 걸어서 남의 계좌 내역은 조회되지 않는다
        return accountBookRepository.findAllByMember_IdAndAccount_AccountIdAndDateBetween(id, accountId, startDate, endDate, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByCard(String id, Long cardId, int page) {
        // 회원 조건을 같이 걸어서 남의 카드 내역은 조회되지 않는다
        return accountBookRepository.findAllByMember_IdAndCard_CardId(id, cardId, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByCardAndDate(String id, Long cardId, LocalDate startDate, LocalDate endDate, int page) {
        validateRange(startDate, endDate);
        return accountBookRepository.findAllByMember_IdAndCard_CardIdAndDateBetween(id, cardId, startDate, endDate, PageRequest.of(page, PAGE_SIZE, SORT));
    }

    @Override
    public Page<AccountBook> getAccountBooksByCategories(String id, List<Long> categoryIds, Long accountId, Long cardId, LocalDate startDate, LocalDate endDate, int page) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new IllegalArgumentException("카테고리를 하나 이상 선택해주세요.");
        }
        if (accountId != null && cardId != null) {
            throw new IllegalArgumentException("통장과 카드는 하나만 선택해주세요.");
        }
        if ((startDate == null) != (endDate == null)) {
            throw new IllegalArgumentException("시작일과 종료일을 모두 선택해주세요.");
        }
        PageRequest pageable = PageRequest.of(page, PAGE_SIZE, SORT);
        // 회원 조건을 같이 걸어서 남의 카테고리/계좌 id를 넣어도 본인 내역만 조회된다
        if (startDate == null) {
            if (cardId != null) {
                return accountBookRepository.findAllByMember_IdAndCategory_CategoryIdInAndCard_CardId(id, categoryIds, cardId, pageable);
            }
            return accountId == null
                    ? accountBookRepository.findAllByMember_IdAndCategory_CategoryIdIn(id, categoryIds, pageable)
                    : accountBookRepository.findAllByMember_IdAndCategory_CategoryIdInAndAccount_AccountId(id, categoryIds, accountId, pageable);
        }
        validateRange(startDate, endDate);
        if (cardId != null) {
            return accountBookRepository.findAllByMember_IdAndCategory_CategoryIdInAndCard_CardIdAndDateBetween(id, categoryIds, cardId, startDate, endDate, pageable);
        }
        return accountId == null
                ? accountBookRepository.findAllByMember_IdAndCategory_CategoryIdInAndDateBetween(id, categoryIds, startDate, endDate, pageable)
                : accountBookRepository.findAllByMember_IdAndCategory_CategoryIdInAndAccount_AccountIdAndDateBetween(id, categoryIds, accountId, startDate, endDate, pageable);
    }

    @Override
    @Transactional
    public void updateAccountBook(String id, Long accountBookId, Long categoryId, String content, Long price, AccountBookType type) {
        validate(content, price, type);
        AccountBook accountBook = accountBookRepository.findByAccountBookIdAndMember_Id(accountBookId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가계부입니다."));

        Category category = categoryRepository.findByCategoryIdAndMember_Id(categoryId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        // 기존 내역이 잔액에 준 영향과 수정 후 영향의 차이만큼만 반영한다
        long diff = balanceEffect(type, price) - balanceEffect(accountBook.getType(), accountBook.getPrice());
        if (diff != 0) {
            applyEffect(accountBook, diff);
        }

        accountBook.setCategory(category);
        accountBook.setContent(content);
        accountBook.setPrice(price);
        accountBook.setType(type);
    }

    @Override
    @Transactional
    public void deleteAccountBook(String id, Long accountBookId) {
        AccountBook accountBook = accountBookRepository.findByAccountBookIdAndMember_Id(accountBookId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가계부입니다."));

        // 추가할 때 반영한 만큼 되돌린다
        // 이미 쓴 수입을 지우면 잔액이 음수가 될 수 있지만, 잘못 쓴 내역은 지울 수 있어야 한다
        applyEffect(accountBook, -balanceEffect(accountBook.getType(), accountBook.getPrice()));
        accountBookRepository.delete(accountBook);
    }

    // 음수 금액은 잔액 계산을 뒤집으므로 막는다
    private static void validate(String content, Long price, AccountBookType type) {
        if (content == null || content.isBlank() || price == null || price <= 0 || type == null) {
            throw new IllegalArgumentException("내용, 0보다 큰 금액, 수입/지출을 모두 입력해주세요.");
        }
    }

    // 수입이면 더하고 지출이면 뺀다
    private long balanceEffect(AccountBookType type, Long price) {
        return type == AccountBookType.INCOME ? price : -price;
    }

    // 통장이면 잔액에, 카드면 부채에 반대 부호로 반영한다
    private void applyEffect(AccountBook accountBook, long effect) {
        if (accountBook.getCard() != null) {
            cardRepository.addDebt(accountBook.getCard().getCardId(), -effect);
        } else {
            accountRepository.addBalance(accountBook.getAccount().getAccountId(), effect);
        }
    }

    private void changeBalance(Long accountId, long amount) {
        if (accountRepository.changeBalance(accountId, amount) == 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
    }

    @Override
    public DashboardResponseDto getDashboard(String id, YearMonth month) {
        YearMonth firstMonth = month.minusMonths(DASHBOARD_MONTHS - 1);

        // 내역이 없는 달도 0으로 보여주기 위해 6개월을 미리 채워둔다 ([수입, 지출])
        Map<YearMonth, long[]> sums = new LinkedHashMap<>();
        for (int i = 0; i < DASHBOARD_MONTHS; i++) {
            sums.put(firstMonth.plusMonths(i), new long[2]);
        }
        for (MonthlyTotal total : accountBookRepository.sumByMonthAndType(id, firstMonth.atDay(1), month.atEndOfMonth())) {
            long[] sum = sums.get(YearMonth.of(total.year(), total.month()));
            sum[total.type() == AccountBookType.INCOME ? 0 : 1] += total.total();
        }

        List<DashboardResponseDto.MonthlySummary> monthly = sums.entrySet().stream()
                .map(e -> new DashboardResponseDto.MonthlySummary(e.getKey().toString(), e.getValue()[0], e.getValue()[1]))
                .toList();

        return DashboardResponseDto.builder()
                .month(month.toString())
                .monthly(monthly)
                .categories(accountBookRepository.sumByCategory(id, AccountBookType.EXPENSE, month.atDay(1), month.atEndOfMonth()))
                .build();
    }

    // 조회 기간은 최대 1개월: 종료일은 시작일 + 1개월까지 (1/31 + 1개월 = 2/28, plusMonths가 말일로 맞춘다)
    private static void validateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일이 종료일보다 늦습니다.");
        }
        if (endDate.isAfter(startDate.plusMonths(1))) {
            throw new IllegalArgumentException("조회 기간은 최대 1개월입니다.");
        }
    }
}
