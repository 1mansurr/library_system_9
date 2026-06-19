package com.library.loan.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient userServiceClient(@Value("${services.user-url}") String userServiceUrl) {
        return RestClient.builder()
                .baseUrl(userServiceUrl)
                .build();
    }

    @Bean
    public RestClient bookServiceClient(@Value("${services.book-url}") String bookServiceUrl) {
        return RestClient.builder()
                .baseUrl(bookServiceUrl)
                .build();
    }
}
