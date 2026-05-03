import type { QueryClient } from '@tanstack/react-query'

type QueryKey = readonly unknown[]

function invalidateMany(queryClient: QueryClient, keys: QueryKey[]) {
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey })
  })
}

export function invalidateBlogCollections(queryClient: QueryClient) {
  invalidateMany(queryClient, [
    ['blogs'],
    ['user-blogs'],
    ['my-content', 'blogs'],
    ['search'],
    ['tagBlogs'],
    ['series'],
    ['series-list'],
    ['admin', 'blogs'],
    ['admin', 'dashboard'],
    ['admin', 'blog-preview'],
  ])
}

export function invalidateUserEngagement(queryClient: QueryClient, username?: string) {
  const keys: QueryKey[] = [['user-likes'], ['user-bookmarks']]
  if (username) {
    keys.push(['user', username])
  }
  invalidateMany(queryClient, keys)
}
