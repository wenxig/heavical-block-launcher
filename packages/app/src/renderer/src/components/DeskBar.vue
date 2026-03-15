<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <motion.div
    :transition="{ delay: 2, duration: 0.2, type: 'spring' }"
    class="flex h-15 w-fit gap-2 rounded-2xl bg-(--bg-color) px-2"
    :initial="{ '--tw-translate-y': '200%', 'opacity': 0 }"
    :animate="{ '--tw-translate-y': '0%', 'opacity': 1 }"
    :exit="{ '--tw-translate-y': '200%', 'opacity': 0 }"
  >
  </motion.div>
</template>