import Router from 'vue-router'
import PubHomePage from '@/publish/views/HomePage'
import PubFeedDetailPage from '@/publish/views/FeedDetailPage'
import PubNotFoundPage from '@/publish/views/NotFoundPage'
import { enableSafeBack } from '@/router'

const routes = [
  {
    path: '/',
    name: 'PubHomePage',
    component: PubHomePage,
  },
  {
    path: '/feed-detail',
    name: 'PubFeedDetailPage',
    component: PubFeedDetailPage,
  },
  { path: '*', component: PubNotFoundPage },
]

export function createPublishRouter() {
  const router = new Router({
    mode: 'history',
    base: '/rssant/',
    routes: routes,
    strict: true,
  })
  enableSafeBack(router, { fallback: '/' })
  return router
}
