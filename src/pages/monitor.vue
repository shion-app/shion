<script lang="ts" setup>
import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type { Program } from '@interfaces/index'

listen('filter-program', (event: Event<Program>) => {
  // console.log(event.payload)
})
</script>

<template>
  <div />
</template>
