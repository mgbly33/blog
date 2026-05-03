package com.blog.repository;

import com.blog.entity.DraftVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DraftVersionRepository extends JpaRepository<DraftVersion, Long> {

    Page<DraftVersion> findByDraftIdOrderByVersionNumberDesc(Long draftId, Pageable pageable);

    List<DraftVersion> findByDraftIdOrderByVersionNumberDesc(Long draftId);

    Optional<DraftVersion> findFirstByDraftIdOrderByVersionNumberDesc(Long draftId);

    Optional<DraftVersion> findByDraftIdAndVersionNumber(Long draftId, Integer versionNumber);

    long countByDraftId(Long draftId);

    @Modifying
    @Query("DELETE FROM DraftVersion dv WHERE dv.draftId = :draftId")
    void deleteByDraftId(@Param("draftId") Long draftId);
}
