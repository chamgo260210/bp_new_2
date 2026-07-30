package com.aivle.backend.file.object;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ObjectKeyGenerator {
    public String aiArtifactJson() {
        return "ai-artifacts/" + UUID.randomUUID() + ".json";
    }
}
