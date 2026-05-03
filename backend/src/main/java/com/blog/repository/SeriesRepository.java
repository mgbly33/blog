package com.blog.repository;

import com.blog.entity.Series;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeriesRepository extends JpaRepository<Series, Long> {

    Page<Series> findByAuthorId(Long authorId, Pageable pageable);

    List<Series> findAllByAuthorId(Long authorId);

    Optional<Series> findByIdAndAuthorId(Long id, Long authorId);

    // 查询公开且完成的系列
    Page<Series> findByStatus(Series.Status status, Pageable pageable);
}
