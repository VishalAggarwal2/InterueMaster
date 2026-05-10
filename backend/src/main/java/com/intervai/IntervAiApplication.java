package com.intervai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IntervAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(IntervAiApplication.class, args);
    }
}
