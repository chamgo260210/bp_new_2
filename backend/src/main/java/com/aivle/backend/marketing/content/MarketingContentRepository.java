package com.aivle.backend.marketing.content;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketingContentRepository extends JpaRepository<MarketingContent, Long> {
    List<MarketingContent> findAllByProjectIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long projectId);
    Optional<MarketingContent> findByIdAndProjectIdAndDeletedAtIsNull(Long id, Long projectId);
}
