<script setup lang="ts">
import { type SelectMoment, db } from '@/modules/database'
import type { Replace } from '@/interfaces'

interface Image {
  src: string
  alt: string
  title: string
}

type Moment = Replace<SelectMoment, {
  content: {
    filteredMarkdown: string
    images: Array<Image>
  }
}>

const router = useRouter()

const list = ref<Array<Moment>>([])

async function init() {
  list.value = (await db.moment.select()).map(i => ({
    ...i,
    content: filterMarkdownImages(i.content),
  }))
}

function filterMarkdownImages(markdown: string) {
  const regex = /!\[([^\]]*)\]\(([^\)]*)\s"([^"]*)"\)/g
  let match
  let filteredMarkdown = markdown
  const images: Array<Image> = []

  match = regex.exec(markdown)
  while (match !== null) {
    images.push({ alt: match[1], src: match[2], title: match[3] })
    filteredMarkdown = filteredMarkdown.replace(match[0], '')
    match = regex.exec(markdown)
  }

  return { filteredMarkdown, images }
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
  <div p-4>
    <template v-if="list.length">
      <template v-for="{ title, content, id }, index in list" :key="id">
        <v-card
          :title="title"
          variant="flat"
          class="group"
          @click="viewDetail(id)"
        >
          <v-card-text>
            <div flex flex-1 space-x-4>
              <img v-if="content.images.length" width="200" height="200" object-contain v-bind="content.images[0]">
              <div flex-1 line-clamp-2>
                {{ content.filteredMarkdown }}
              </div>
              <div flex flex-col>
                <div flex-1 />
                <v-menu open-on-hover>
                  <template #activator="{ props }">
                    <v-btn icon size="small" v-bind="props" opacity-0 group-hover:opacity-100 transition-opacity-400>
                      <div i-mdi:menu-down text-6 />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      value="edit"
                      @click="update(id)"
                    >
                      <v-list-item-title>{{ $t('moment.edit') }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-divider v-if="index != list.length - 1" my-4 />
      </template>
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
