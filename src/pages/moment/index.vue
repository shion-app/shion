<script setup lang="ts">
import { isThisYear } from 'date-fns'

import type { SelectMoment } from '@/modules/database'
import { db } from '@/modules/database'

const router = useRouter()

const list = ref<Array<SelectMoment>>([])

async function init() {
  list.value = await db.moment.select()
}

function viewMomentCreate() {
  router.push('/moment/create')
}

function viewDetail(id: number) {
  router.push(`/moment/detail/${id}`)
}

function update(id: number) {
  router.push(`/moment/update/${id}`)
}

init()
</script>

<template>
  <div>
    <template v-if="list.length">
      <v-card
        v-for="{ title, content, time, id } in list" :key="id"
        m-4
        @click="viewDetail(id)"
      >
        <v-card-title class="flex!">
          <div>{{ title }}</div>
          <div flex-1 />
          <div>{{ isThisYear(time) ? format(time, 'MM-dd') : format(time, 'yyyy-MM-dd') }}</div>
        </v-card-title>
        <v-card-text line-clamp-2 class="pb-0!">
          {{ content }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click.stop="update(id)">
            {{ $t('moment.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
    <empty v-else />
    <more-menu>
      <v-list>
        <v-list-item value="moment.create">
          <v-list-item-title @click="viewMomentCreate">
            {{ $t('moment.create') }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </more-menu>
  </div>
</template>
