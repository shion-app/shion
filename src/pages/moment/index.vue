<script setup lang="ts">
import { isThisYear } from 'date-fns'

import { type SelectMoment, db } from '@/modules/database'
import type { Replace } from '@/interfaces'
import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'

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
const { format } = useDateFns()

const list = ref<Array<Moment>>([])
const selectedList = computed(() => list.value.filter(i => i.selected).map(i => i.id))

const { open: openBatchRemoveModal } = useConfirmDeleteModal(async () => {
  await db.moment.batchRemove(selectedList.value)
  success({})
  refresh()
})

const { setRemoveId, remove } = buildRemoveFn()
const { open: openRemoveModal } = useConfirmDeleteModal(remove)

function handleRemove(id: number) {
  setRemoveId(id)
  openRemoveModal()
}

function buildRemoveFn() {
  let id = 0
  return {
    setRemoveId: (removeId: number) => {
      id = removeId
    },
    remove: async () => {
      await db.moment.remove(id)
      success({})
      refresh()
    },
  }
}

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

refresh()
</script>

<template>
  <template v-if="list.length">
    <grid-card
      v-for="moment in list" :key="moment.id"
      v-model:selected="moment.selected"
      :title="moment.title"
      :subtitle="format(moment.createdAt, isThisYear(moment.createdAt) ? 'MM-dd' : 'yyyy-MM-dd')"
      mx-4 mb-6
      @click="viewDetail(moment.id)"
    >
      <v-card-text flex space-x-4>
        <v-img v-if="moment.content.images.length" :max-width="200" v-bind="moment.content.images[0]" />
        <div flex-1 line-clamp-4 h-max break-all mb-6>
          {{ moment.content.data }}
        </div>
      </v-card-text>
      <template #menu>
        <v-list-item value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline" base-color="red" @click="handleRemove(moment.id)" />
        <v-list-item value="moment.edit" :title="$t('moment.edit')" append-icon="mdi-pencil-outline" @click="update(moment.id)" />
      </template>
    </grid-card>
  </template>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal" />
      <v-list-item value="moment.create" :title="$t('moment.create')" append-icon="mdi-plus" @click="viewMomentCreate" />
    </v-list>
  </more-menu>
</template>
