<template>
  <mu-menu
    placement="bottom"
    :open="open"
    v-on:update:open="updateOpen"
    :popover-class="popoverClass"
  >
    <template slot="default">
      <slot name="default"></slot>
    </template>
    <template slot="content">
      <slot name="content"></slot>
    </template>
  </mu-menu>
</template>

<script>
export default {
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    placement: {
      type: String,
      default: 'right',
      validator: function(value) {
        return ['center', 'right'].indexOf(value) !== -1
      },
    },
  },
  computed: {
    popoverClass() {
      return `rssant-menu-popover-${this.placement}`
    },
  },
  methods: {
    updateOpen(event) {
      this.$emit('update:open', event)
    },
  },
}
</script>

<style lang="less">
@import '~@/styles/common';

.rssant-menu-popover-center,
.rssant-menu-popover-right {
  .header-menu-popover;
  &.transition-bottom {
    // unset muse-ui transition
    transform-origin: unset;
    &.mu-popover-transition-enter,
    &.mu-popover-transition-leave-active {
      transform: none;
    }
  }
}

.rssant-menu-popover-center {
  right: unset;
}

.rssant-menu-popover-right {
  right: 8 * @pr;
}
</style>
