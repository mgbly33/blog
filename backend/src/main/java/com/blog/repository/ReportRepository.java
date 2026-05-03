package com.blog.repository;

import com.blog.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);

    Page<Report> findByReporterId(Long reporterId, Pageable pageable);
}
