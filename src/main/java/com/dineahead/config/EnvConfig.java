package com.dineahead.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class EnvConfig {

    @PostConstruct
    public void init() {
        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        String stripeSecretKey = dotenv.get("STRIPE_SECRET_KEY");
        String stripePublishableKey = dotenv.get("STRIPE_PUBLISHABLE_KEY");

        System.out.println("=== STRIPE KEYS LOADED ===");
        System.out.println("Secret Key: " + (stripeSecretKey != null ? stripeSecretKey.substring(0, 20) + "..." : "NOT FOUND!"));
        System.out.println("Publishable Key: " + (stripePublishableKey != null ? stripePublishableKey.substring(0, 20) + "..." : "NOT FOUND!"));

        if (stripeSecretKey != null) {
            System.setProperty("STRIPE_SECRET_KEY", stripeSecretKey);
        }
        if (stripePublishableKey != null) {
            System.setProperty("STRIPE_PUBLISHABLE_KEY", stripePublishableKey);
        }
    }

}