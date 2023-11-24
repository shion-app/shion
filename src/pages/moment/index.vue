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
    data: string
    images: Array<Image>
  }
}> & {
  selected: boolean
}

const router = useRouter()
const { success } = useNotify()
const { t } = useI18n()

const list = ref<Array<Moment>>([])
const selectedList = computed(() => list.value.filter(i => i.selected).map(i => i.id))

async function refresh() {
  list.value = (await db.moment.select()).map(i => ({
    ...i,
    content: filterImagesAndContent(i.content),
    selected: false,
  }))
}

function filterImagesAndContent(str: string) {
  const match = str.match(/<img[^>]+>/g)
  const images = match
    ? match.map((image) => {
      const src = image.match(/src="([^"]*)"/)?.[1] || ''
      const alt = image.match(/alt="([^"]*)"/)?.[1] || ''
      const title = image.match(/title="([^"]*)"/)?.[1] || ''
      return { src, alt, title }
    })
    : []

  const data = str.replace(/<img[^>]+>/g, t('moment.placeholder')).replace(/(<([^>]+)>)/gi, ' ')
  return { images, data }
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

async function remove() {
  await Promise.all(selectedList.value.map(id => db.moment.remove(id)))
  await refresh()
  success({})
}

refresh()
</script>

<template>
  <div p-4>
    <template v-if="list.length">
      <template v-for="moment, index in list" :key="moment.id">
        <v-card
          :title="moment.title"
          variant="flat"
          class="group"
          @click="viewDetail(moment.id)"
        >
          <template #append>
            <div group-hover:opacity-100 transition-opacity-400 :class="moment.selected ? 'opacity-100' : 'opacity-0'" @click.stop>
              <v-checkbox v-model="moment.selected" />
            </div>
          </template>
          <v-card-text>
            <div flex space-x-4>
              <img v-if="moment.content.images.length" width="200" height="200" object-contain v-bind="moment.content.images[0]">
              <div flex-1 line-clamp-4 h-max break-all>
                {{ moment.content.data }}
              </div>
              <div flex flex-col>
                <div flex-1 />
                <v-menu open-on-hover>
                  <template #activator="{ props }">
                    <v-btn icon size="small" v-bind="props" opacity-0 group-hover:opacity-100 transition-opacity-400 @click.stop>
                      <div i-mdi:menu-down text-6 />
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      value="edit"
                      @click="update(moment.id)"
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
        <v-list-item v-if="selectedList.length" value="button.remove">
          <v-list-item-title @click="remove">
            {{ $t('button.remove') }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </more-menu>
  </div>
</template>
