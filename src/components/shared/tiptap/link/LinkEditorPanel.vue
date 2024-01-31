<script setup lang="ts">
interface Props {
  url?: string
  onSetLink: (url: string) => void
}

const props = defineProps<Props>()

const url = ref(props.url || '')

const isValidUrl = computed(() => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(url.value))

const handleSubmit = () => props.onSetLink(url.value)

watch(() => props.url, v => url.value = v || '')
</script>

<template>
  <v-card>
    <form class="flex items-center gap-2 p-2" @submit.prevent="handleSubmit">
      <label class="flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 cursor-text">
        <input
          v-model="url"
          class="flex-1 bg-transparent outline-none min-w-[300px] text-black text-sm dark:text-white" :placeholder="$t('tiptap.link.enter')"
        >
      </label>
      <v-btn type="submit" color="primary" :disabled="!isValidUrl" ml-2>
        {{ $t('tiptap.link.set') }}
      </v-btn>
    </form>
  </v-card>
</template>
