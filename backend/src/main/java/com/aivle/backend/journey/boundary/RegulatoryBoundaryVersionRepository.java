package com.aivle.backend.journey.boundary;

import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegulatoryBoundaryVersionRepository extends JpaRepository<RegulatoryBoundaryVersion, Long> {
    @EntityGraph(attributePaths = {"project", "run", "briefVersion"})
    Optional<RegulatoryBoundaryVersion> findTopByProjectIdAndDeletedAtIsNullOrderByVersionNumberDesc(Long projectId);

    @EntityGraph(attributePaths = {"project", "run", "briefVersion"})
    Optional<RegulatoryBoundaryVersion> findByIdAndProjectIdAndDeletedAtIsNull(Long id, Long projectId);
}
