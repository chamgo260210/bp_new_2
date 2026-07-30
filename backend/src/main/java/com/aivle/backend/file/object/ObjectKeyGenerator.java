package com.aivle.backend.file.object;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ObjectKeyGenerator {
    public String aiArtifactJson() {
        return "ai-artifacts/" + UUID.randomUUID() + ".json";
    }

    public String aiArtifactImage(String extension) {
        if (!extension.matches("png|jpg|jpeg|webp")) {
            throw new IllegalArgumentException("unsupported image extension");
        }
        return "ai-artifacts/" + UUID.randomUUID() + "." + extension;
    }
}
