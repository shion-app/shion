<script setup lang="ts">
import { Notification, NotificationGroup } from '@/plugins/notiwind'
</script>

<template>
  <NotificationGroup>
    <div
      fixed inset-0 flex items-start p-6 pointer-events-none z-10000
      :class="isMobile ? 'justify-center' : 'justify-end'"
    >
      <div min-w-56 max-w-xs pointer-events-auto>
        <Notification
          v-slot="{ notifications }"
          enter="transform ease-out duration-300 transition"
          enter-from="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
          enter-to="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-500"
          leave-from="opacity-100"
          leave-to="opacity-0"
          move="transition duration-500"
          move-delay="delay-300"
        >
          <v-alert
            v-for="{ id, type, title, text } in notifications"
            :key="id"
            :type="type"
            :title="title"
            :text="text"
            variant="tonal"
            mt-4
            class="bg-white! elevation-4"
          />
        </Notification>
      </div>
    </div>
  </NotificationGroup>
</template>
