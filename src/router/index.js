import Vue from 'vue'
import Router from 'vue-router'
import Toast from 'muse-ui-toast'
import _ from 'lodash'

import routes from './routes'
import { API } from '@/store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: routes,
})

// when landing page not '/', router.back() may be a trouble
router._numRouteVistied = -1
router.safeBack = function() {
  if (router._numRouteVistied < 1) {
    router.replace('/')
  } else {
    router.back()
  }
}

router.beforeEach((to, from, next) => {
  // after some path visited, browser history can go back safely
  if (router._numRouteVistied < 1) {
    router._numRouteVistied += 1
  }
  const loginRequired = to.matched.some(record => record.meta.loginRequired)
  const goLogin = error => {
    let response = error.response
    // When "Network Error", not redirect to login
    // https://github.com/axios/axios/issues/383
    if (_.isNil(response) && _.isNil(error.status)) {
      return goNext()
    }
    if (response && response.status >= 500) {
      Toast.error(error.message)
      return next(false)
    }
    next({
      path: '/login',
      replace: true,
    })
  }
  const goNext = () => next()
  if (loginRequired) {
    API.user
      .login()
      .then(goNext)
      .catch(goLogin)
  } else {
    API.user
      .login()
      .catch(() => null)
      .finally(goNext)
  }
})

export default router
