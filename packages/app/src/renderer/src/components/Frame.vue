<script setup lang="ts">
import type { InjectFunctions } from '@s/index'
import { InjectFunction } from 'ipc-call/renderer'
import { motion } from 'motion-v'

import icon from '@/assets/icon.png'
import { Icons } from '@/icons'

const containerClass =
  'fixed flex h-10 w-fit items-center gap-2 overflow-hidden rounded-full border-2 border-(--bg-color)/5 bg-(--bg-color) px-2'

const osMiniSize = InjectFunction.from<InjectFunctions>()('os.miniSize')
const osExit = InjectFunction.from<InjectFunctions>()('os.exit')
</script>

<template>
  <motion.div
    :transition="{ delay: 2, duration: 0.2, type: 'spring' }"
    class="app-region-auto top-1 left-1"
    :class="containerClass"
    :initial="{ translateY: '-200%', opacity: 0 }"
    :animate="{ translateY: '0%', opacity: 1 }"
    :exit="{ translateY: '-200%', opacity: 0 }"
  >
    <NImage previewDisabled objectFit="contain" :src="icon" class="aspect-square h-2/3" />
    <span class="text-sm font-semibold">Heavical Block Launcher</span>
  </motion.div>

  <motion.div
    :transition="{ delay: 2.1, duration: 0.2, type: 'spring' }"
    class="app-region-auto top-1 right-1"
    :class="containerClass"
    :initial="{ translateY: '-200%', opacity: 0 }"
    :animate="{ translateY: '0%', opacity: 1 }"
    :exit="{ translateY: '-200%', opacity: 0 }"
  >
    <NButton quaternary circle class="app-region-no" @click="osMiniSize()">
      <template #icon>
        <NIcon>
          <Icons.subtract />
        </NIcon>
      </template>
    </NButton>
    <NButton quaternary circle class="app-region-no" @click="osExit()">
      <template #icon>
        <NIcon>
          <Icons.dismiss />
        </NIcon>
      </template>
    </NButton>
  </motion.div>
</template>