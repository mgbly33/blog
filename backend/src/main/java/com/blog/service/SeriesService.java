package com.blog.service;

import com.blog.dto.BlogDto;
import com.blog.dto.PageDto;
import com.blog.dto.SeriesDto;
import com.blog.entity.Blog;
import com.blog.entity.Series;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.BlogRepository;
import com.blog.repository.SeriesRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeriesService {

    private final SeriesRepository seriesRepository;
    private final BlogRepository blogRepository;
    private final UserRepository userRepository;

    @Transactional
    public SeriesDto.Response createSeries(SeriesDto.CreateRequest request, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        Series series = Series.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .authorId(admin.getId())
                .status(Series.Status.Ongoing)
                .build();

        Series savedSeries = seriesRepository.save(series);
        return toResponse(savedSeries);
    }

    @Transactional
    public SeriesDto.Response updateSeries(Long id, SeriesDto.UpdateRequest request) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("专栏不存在"));

        if (request.getTitle() != null) {
            series.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            series.setDescription(request.getDescription());
        }
        if (request.getCoverUrl() != null) {
            series.setCoverUrl(request.getCoverUrl());
        }
        if (request.getStatus() != null) {
            series.setStatus(request.getStatus());
        }

        Series updatedSeries = seriesRepository.save(series);
        return toResponse(updatedSeries);
    }

    @Transactional
    public void deleteSeries(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("专栏不存在"));

        List<Blog> posts = blogRepository.findBySeriesIdOrderByChapterOrderAsc(id);
        for (Blog post : posts) {
            post.setSeriesId(null);
            post.setChapterOrder(null);
        }
        blogRepository.saveAll(posts);

        seriesRepository.delete(series);
    }

    public PageDto<SeriesDto.Response> getSeriesList(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Series> seriesPage = seriesRepository.findAll(pageable);
        List<Series> seriesList = seriesPage.getContent();

        List<Long> seriesIds = seriesList.stream().map(Series::getId).collect(Collectors.toList());
        List<Long> authorIds = seriesList.stream().map(Series::getAuthorId).distinct().collect(Collectors.toList());

        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, List<Blog>> postsBySeriesId = seriesIds.isEmpty()
                ? Map.of()
                : blogRepository.findBySeriesIdInAndStatusAndVisibilityOrderBySeriesIdAscChapterOrderAsc(
                                seriesIds, Blog.Status.APPROVED, Blog.Visibility.PUBLIC)
                        .stream()
                        .collect(Collectors.groupingBy(Blog::getSeriesId));

        Set<Long> postAuthorIds = postsBySeriesId.values().stream()
                .flatMap(List::stream)
                .map(Blog::getAuthorId)
                .collect(Collectors.toSet());
        Map<Long, User> postAuthorMap = postAuthorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(postAuthorIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageDto.from(seriesPage, series -> toResponse(
                series,
                authorMap.get(series.getAuthorId()),
                postsBySeriesId.getOrDefault(series.getId(), List.of()),
                postAuthorMap));
    }

    public SeriesDto.Response getSeriesById(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("专栏不存在"));
        return toResponse(series);
    }

    private SeriesDto.Response toResponse(Series series) {
        User author = userRepository.findById(series.getAuthorId()).orElse(null);
        List<Blog> posts = blogRepository.findBySeriesIdAndStatusAndVisibilityOrderByChapterOrderAsc(
                series.getId(), Blog.Status.APPROVED, Blog.Visibility.PUBLIC);
        Set<Long> postAuthorIds = posts.stream().map(Blog::getAuthorId).collect(Collectors.toSet());
        Map<Long, User> postAuthorMap = postAuthorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(postAuthorIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));
        return toResponse(series, author, posts, postAuthorMap);
    }

    private SeriesDto.Response toResponse(Series series, User author, List<Blog> posts, Map<Long, User> postAuthorMap) {
        List<BlogDto.BlogListItem> postDtos = posts.stream()
                .map(post -> toBlogListItem(post, postAuthorMap.get(post.getAuthorId())))
                .collect(Collectors.toList());

        return SeriesDto.Response.builder()
                .id(series.getId())
                .title(series.getTitle())
                .description(series.getDescription())
                .coverUrl(series.getCoverUrl())
                .status(series.getStatus())
                .author(author != null ? BlogDto.AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build() : null)
                .createdAt(series.getCreatedAt())
                .updatedAt(series.getUpdatedAt())
                .posts(postDtos)
                .build();
    }

    private BlogDto.BlogListItem toBlogListItem(Blog blog, User postAuthor) {
        return BlogDto.BlogListItem.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .image(blog.getImage())
                .categoryId(blog.getCategoryId())
                .tags(blog.getTags() != null ? new java.util.HashSet<>(blog.getTags()) : Set.of())
                .status(blog.getStatus())
                .readTime(blog.getReadTime() != null ? blog.getReadTime() : 1)
                .views(blog.getViews() != null ? blog.getViews() : 0)
                .likesCount(blog.getLikesCount() != null ? blog.getLikesCount() : 0)
                .commentCount(blog.getCommentCount() != null ? blog.getCommentCount() : 0)
                .isSticky(blog.getIsSticky() != null ? blog.getIsSticky() : false)
                .publishAt(blog.getPublishAt())
                .createdAt(blog.getCreatedAt())
                .seriesId(blog.getSeriesId())
                .chapterOrder(blog.getChapterOrder())
                .author(postAuthor != null ? BlogDto.AuthorInfo.builder()
                        .id(postAuthor.getId())
                        .username(postAuthor.getUsername())
                        .avatar(postAuthor.getAvatar())
                        .build() : null)
                .build();
    }
}
