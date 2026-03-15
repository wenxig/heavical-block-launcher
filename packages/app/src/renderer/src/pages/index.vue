<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { computed } from 'vue'

import { Icons } from '@/icons'

const menuOptions = computed<MenuOption[]>(() => [
  {
    icon: Icons.apps,
    label: '实例管理',
    key: 'instance-manager'
  },
  {
    icon: Icons.appList,
    label: '实例列表',
    key: 'instance-list'
  }
])
</script>

<template>
  <AnimatePresence>
    <SideBar class="top-13 left-2" :menuOptions> </SideBar>
    <DeskBar class="fixed bottom-2 left-[calc(50%-100px)] -translate-x-1/2" />
    <PlayButton class="fixed! right-2 bottom-2" />
  </AnimatePresence>
</template>