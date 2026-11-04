package com.seunghyun.householdaccountbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class HouseholdaccountbookApplication {

	public static void main(String[] args) {
		// 서버(Render)는 UTC라 LocalDate.now()/YearMonth.now()가 한국 날짜와 하루까지 어긋난다
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(HouseholdaccountbookApplication.class, args);
	}

}
