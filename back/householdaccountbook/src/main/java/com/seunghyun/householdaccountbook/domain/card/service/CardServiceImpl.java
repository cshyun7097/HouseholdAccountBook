package com.seunghyun.householdaccountbook.domain.card.service;

import com.seunghyun.householdaccountbook.domain.accountbook.repository.AccountBookRepository;
import com.seunghyun.householdaccountbook.domain.card.entity.Card;
import com.seunghyun.householdaccountbook.domain.card.repository.CardRepository;
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
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final MemberRepository memberRepository;
    private final AccountBookRepository accountBookRepository;

    @Override
    @Transactional
    public void createCard(String id, Card card) {
        if (isBlank(card.getCardName()) || isBlank(card.getCardCompany())) {
            throw new IllegalArgumentException("카드 이름과 카드사를 모두 입력해주세요.");
        }
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (member.getWithDrawalStatus() != WithDrawalStatus.ACTIVE) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }
        card.setMember(member);
        cardRepository.save(card);
    }

    @Override
    public List<Card> getCards(String id) {
        return cardRepository.findAllByMember_Id(id);
    }

    @Override
    @Transactional
    public void deleteCard(String id, Long cardId) {
        Card card = cardRepository.findByCardIdAndMember_Id(cardId, id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카드입니다."));
        // 가계부가 카드를 참조하고 있어서 그대로 지우면 FK 오류가 난다. 내역을 함께 지우지 않도록 막는다
        if (accountBookRepository.existsByCard_CardId(cardId)) {
            throw new IllegalArgumentException("가계부 내역이 있는 카드는 삭제할 수 없습니다.");
        }
        cardRepository.delete(card);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
