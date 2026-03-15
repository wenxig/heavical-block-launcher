<script setup lang="ts">
import { Icons } from '@/icons'
</script>

<template>
  <Motion
    asChild
    :transition="{ delay: 2, duration: 0.2, type: 'spring' }"
    :initial="{ '--tw-translate-y': '200%', 'opacity': 0 }"
    :animate="{ '--tw-translate-y': '0%', 'opacity': 1 }"
    :exit="{ '--tw-translate-y': '200%', 'opacity': 0 }"
  >
    <NButtonGroup class="h-15! w-60! overflow-hidden rounded-lg">
      <NButton class="h-full! w-50! opacity-80" type="primary">
        <div class="flex flex-col items-center gap-1">
          <span class="font-light">启动游戏</span>
          <span class="text-xs! font-light">没有游戏实例</span>
        </div>
      </NButton>
      <NButton class="ml-px! h-full! w-10! opacity-80" type="primary">
        <template #icon>
          <NIcon color="#fff" class="**:text-white!">
            <Icons.caretUp color="#fff" />
          </NIcon>
        </template>
      </NButton>
    </NButtonGroup>
  </Motion>
</template>