package com.aivle.backend.integration.ai;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

class AiServerTestControllerProfileTests {

    @Test
    void controllerIsNotRegisteredOutsideLocalOrDevProfiles() {
        try (
            AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext()
        ) {
            context.getEnvironment().setActiveProfiles("prod");
            context.register(AiServerTestController.class);
            context.refresh();

            assertFalse(
                context.containsBeanDefinition("aiServerTestController")
            );
        }
    }
}
