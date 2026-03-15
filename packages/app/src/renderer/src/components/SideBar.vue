<script setup lang="ts">
import { motion } from 'motion-v'
import { type MenuOption, NIcon } from 'naive-ui'
import { h, shallowRef } from 'vue'

defineProps<{
  menuOptions: MenuOption[]
}>()

const collapsed = shallowRef(true)

function renderMenuLabel(option: MenuOption) {
  if ('href' in option) {
    return h('a', { href: option.href, target: '_blank' }, option.label as string)
  }
  return option.label as string
}

function renderMenuIcon(option: MenuOption) {
  return h(NIcon, null, { default: option.icon })
}

function expandIcon(option: MenuOption) {
  return h(NIcon, null, { default: option.icon })
}
</script>

<template>
  <NLayout hasSider class="bg-transparent!">
    <motion.div
      :transition="{ delay: 2, duration: 0.2, type: 'spring' }"
      :initial="{ translateX: '-200%' }"
      :animate="{ translateX: '0%' }"
      :exit="{ translateX: '-200%' }"
    >
      <NLayoutSider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        class="relative rounded-2xl! border-none!"
        style="
          --n-color: var(--bg-color);
          --n-border-color: transparent;
          --n-toggle-button-color: var(--bg-color);
          --n-toggle-button-border: none;
        "
      >
        <NMenu
          :collapsed
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :render-label="renderMenuLabel"
          :render-icon="renderMenuIcon"
          :expand-icon="expandIcon"
          :themeOverrides="{ itemColorHover: 'var(--bg-color)' }"
        />
      </NLayoutSider>
    </motion.div>
  </NLayout>
</template>