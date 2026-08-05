package com.aivle.backend.journey.boundary;

import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegulatoryBoundaryRunRepository extends JpaRepository<RegulatoryBoundaryRun, Long> {
    @EntityGraph(attributePaths = {"project", "briefVersion", "taskRun"})
    Optional<RegulatoryBoundaryRun> findTopByProjectIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(Long projectId);

    @EntityGraph(attributePaths = {"project", "briefVersion", "taskRun"})
    Optional<RegulatoryBoundaryRun> findByIdAndProjectIdAndDeletedAtIsNull(Long id, Long projectId);
}
