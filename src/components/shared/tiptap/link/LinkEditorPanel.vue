<script setup lang="ts">
interface Props {
  initialUrl?: string
  onSetLink: (url: string) => void
}

const props = defineProps<Props>()

const url = ref(props.initialUrl || '')

const isValidUrl = computed(() => /^(\S+):(\/\/)?\S+$/.test(url.value))

const handleSubmit = (e: Event) => {
  e.preventDefault()
  if (isValidUrl.value)
    props.onSetLink(url.value)
}
</script>

<template>
  <v-card>
    <form class="flex items-center gap-2 p-2" @submit.prevent="handleSubmit">
      <label class="flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 cursor-text">
        <input
          v-model="url" type="url"
          class="flex-1 bg-transparent outline-none min-w-[12rem] text-black text-sm dark:text-white" :placeholder="$t('tiptap.link.enter')"
        >
      </label>
      <v-btn type="submit" :disabled="!isValidUrl" ml-2>
        {{ $t('tiptap.link.set') }}
      </v-btn>
    </form>
  </v-card>
</template>
