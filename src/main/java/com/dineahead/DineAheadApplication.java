package com.dineahead;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DineAheadApplication {

	public static void main(String[] args) {
		SpringApplication.run(DineAheadApplication.class, args);
	}

}
