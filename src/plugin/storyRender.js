import _ from 'lodash'

// Note: use strict regex to check MathJax, use loose regex to render
// LaTex '$' will conflict with money dollar, jQuery, shell/bash
// AsciiMath '`' will conflict with shell/bash

// Example:
// https://liam.page/2019/06/28/variants-of-FM/
// http://matt33.com/2019/10/27/paper-chandy-lamport/
// https://andrewchen.co/podcast-ecosystem-2019/
// http://karpathy.github.io/2015/03/30/breaking-convnets/
// https://timvieira.github.io/blog/post/2016/09/25/evaluating-fx-is-as-fast-as-fx/
// https://www.zybuluo.com/knight/note/96093

// see also: https://stackoverflow.com/questions/35142364/regex-negative-lookbehind-not-valid-in-javascript
// see also: https://caniuse.com/#feat=js-regexp-lookbehind
// see also: https://regexr.com/

// Note: regex object contains states !!!
const RE_STRICT_MATHJAX = () => /(\$\$.+?\$\$)|(\\\[.+?\\\])|(\\\(.+?\\\))/ms
const RE_INLINE_MATHJAX = () => /(\\\(.+?\\\))|(\$.+?\$(?![^\s<]))/ms
const RE_DISPLAY_MATHJAX = () => /(\$\$.+?\$\$)|(\\\[.+?\\\])/ms

function hasStrictMathJax(content) {
  return RE_STRICT_MATHJAX().test(content)
}

function hasInlineMathJax(content) {
  return RE_INLINE_MATHJAX().test(content)
}

function hasDisplayMathJax(content) {
  return RE_DISPLAY_MATHJAX().test(content)
}

function isMathjaxReady() {
  return !_.isNil(window.MathJax) && !_.isNil(window.MathJax.Hub) && window.MathJax.isReady
}

export { hasInlineMathJax, hasDisplayMathJax, hasStrictMathJax }

// https://github.com/mathjax/mathjax-docs/wiki/'Can't-make-callback-from-given-data'-error-if-resetEquationNumbers-is-called-when-no-math-is-typeset
let isFirstMathJaxRender = true

const ignoreClasses = {}
;[
  'asciimath2jax_ignore',
  'tex2jax_ignore',
  'mathjax_ignore',
  'asciimath2jax-ignore',
  'tex2jax-ignore',
  'mathjax-ignore',
].forEach(c => {
  ignoreClasses[c] = true
})

function isClassNameIgnore(className) {
  if (!_.isEmpty(className)) {
    let classList = className.split(/\s+/g)
    for (let c of classList) {
      if (ignoreClasses[c.toLowerCase()]) {
        return true
      }
    }
  }
  return false
}

const _HAS_MATH_DOMAINS = ['mathoverflow.net']
const HAS_MATH_DOMAINS = {}
_HAS_MATH_DOMAINS.forEach(x => {
  HAS_MATH_DOMAINS[x] = true
})

function getDomainOfLink(link) {
  if (_.isNil(link) || link === '') {
    return null
  }
  let hostname
  try {
    hostname = new URL(link).hostname
  } catch (ignore) {
    return null
  }
  if (!hostname) {
    return null
  }
  let parts = hostname.split('.')
  if (parts.length < 2) {
    return null
  }
  return parts.slice(parts.length - 2, parts.length).join('.')
}

export function isHasMathStoryLink(link) {
  let domain = getDomainOfLink(link)
  return domain ? !!HAS_MATH_DOMAINS[domain] : false
}

const StoryRender = {
  install(Vue) {
    function renderMathjax(dom, elementId) {
      dom.querySelectorAll('code,pre').forEach(block => {
        if (isClassNameIgnore(block.className)) {
          return
        }
        const text = block.innerHTML
        let hasInline = hasInlineMathJax(text)
        let hasDisplay = hasDisplayMathJax(text)
        if (hasInline || hasDisplay) {
          if (hasInline) {
            block.outerHTML = '<span class="story-render-mathjax">' + text + '</span>'
          } else {
            block.outerHTML = '<p class="story-render-mathjax">' + text + '</p>'
          }
        }
      })
      try {
        // http://docs.mathjax.org/en/v2.7-latest/advanced/typeset.html#reset-automatic-equation-numbering
        if (!isFirstMathJaxRender) {
          // use elementId instead of dom object can avoid errors
          MathJax.Hub.Queue(
            ['resetEquationNumbers', MathJax.InputJax.TeX, elementId],
            ['PreProcess', MathJax.Hub, elementId],
            ['Reprocess', MathJax.Hub, elementId]
          )
        }
        isFirstMathJaxRender = false
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, dom])
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('MathJax ' + error)
      }
    }

    function renderMathjaxIfReady(dom, elementId) {
      if (isMathjaxReady()) {
        window._MathJaxStoryRender = null
        renderMathjax(dom, elementId)
      } else {
        // render MathJax after it's ready and stay in the same page
        const expectUrl = window.location.href
        window._MathJaxStoryRender = () => {
          window._MathJaxStoryRender = null
          if (window.location.href === expectUrl) {
            renderMathjax(dom, elementId)
          }
        }
      }
    }

    Vue.directive('story', function(el, binding) {
      let newContent = _.isNil(binding.value) ? '' : binding.value.content
      let oldContent = _.isNil(binding.oldValue) ? '' : binding.oldValue.content
      if (newContent === oldContent) {
        return
      }
      let content = (newContent || '').trim()
      let hasMath = hasStrictMathJax(content) || isHasMathStoryLink(binding.value.link)
      el.innerHTML = content
      if (!_.isNil(binding.value) && !_.isNil(binding.value.callback)) {
        binding.value.callback(el)
      }
      if (hasMath && !_.isEmpty(el.id)) {
        renderMathjaxIfReady(el, el.id)
      }
    })
  },
}

export default StoryRender
