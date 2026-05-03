// User types
export interface User {
  id: string
  username: string
  avatar: string | null
  bio: string | null
  role?: 'USER' | 'ADMIN'
  isAdmin?: boolean
  blogCount?: number
  followerCount?: number
  followingCount?: number
  likeCount?: number
  likedCount?: number
  receivedLikeCount?: number
  bookmarkCount?: number
  bookmarksCount?: number
  isFollowing?: boolean
  createdAt: string
}

// Blog types
export interface Blog {
  id: string
  title: string
  content: string
  rawContent?: string
  summary: string | null
  image: string | null
  categoryId: string | null
  tags: number[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'ARCHIVED'
  visibility: 'PUBLIC' | 'PRIVATE'
  readTime: number
  views: number
  likesCount: number
  collectCount: number
  commentCount: number
  isSticky: boolean
  author: AuthorInfo
  createdAt: string
  updatedAt?: string
  publishAt?: string | null
  unpublishAt?: string | null
  seriesId?: string | null
  chapterOrder?: number | null
  isLiked?: boolean
  isBookmarked?: boolean
}

export interface BlogListItem {
  id: string
  title: string
  summary: string | null
  image: string | null
  category: string | null
  tags: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'ARCHIVED'
  readTime: number
  views: number
  likesCount: number
  commentCount: number
  isSticky: boolean
  author: AuthorInfo
  createdAt: string
  publishAt?: string | null
}

export interface AuthorInfo {
  id: string
  username: string
  avatar: string | null
}

// Comment types
export interface Comment {
  id: string
  blogId: string
  content: string
  author: AuthorInfo
  parentCommentId: string | null
  replyCount: number
  likesCount: number
  isLiked: boolean
  createdAt: string
  replies?: Comment[]
}

// Category & Tag types
export interface Category {
  id: string
  name: string
  description: string | null
  order: number
  blogCount: number
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  count: number
  isHot: boolean
  createdAt: string
}

// Draft types
export interface Draft {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[]
  image: string | null
  blogId: string | null
  wordCount: number
  summary: string | null
  currentVersion: number
  lastSavedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DraftListItem {
  id: string
  title: string
  summary: string | null
  wordCount: number
  isNew: boolean
  updatedAt: string
}

// Notification types
export interface Notification {
  id: string
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'REPLY' | 'SYSTEM'
  content: string
  sender: AuthorInfo | null
  relatedBlog: string | null
  relatedComment: string | null
  isRead: boolean
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
}

// Series types
export interface Series {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  status: 'Ongoing' | 'Completed'
  author: AuthorInfo
  createdAt: string
  updatedAt: string
  posts: BlogListItem[]
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}
