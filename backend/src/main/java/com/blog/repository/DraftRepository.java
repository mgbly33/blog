package com.blog.repository;

import com.blog.entity.Draft;
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
public interface DraftRepository extends JpaRepository<Draft, Long> {

    Page<Draft> findByAuthorIdOrderByUpdatedAtDesc(Long authorId, Pageable pageable);

    List<Draft> findAllByAuthorId(Long authorId);

    Optional<Draft> findByAuthorIdAndBlogId(Long authorId, Long blogId);

    long countByAuthorId(Long authorId);

    @Modifying
    @Query("DELETE FROM Draft d WHERE d.authorId = :authorId")
    void deleteByAuthorId(@Param("authorId") Long authorId);
}
