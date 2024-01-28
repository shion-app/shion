<script setup lang="ts">
import { db } from '@/modules/database'
import type { SelectBox, SelectMoment } from '@/modules/database'

import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'

interface Image {
  src: string
  alt: string
  title: string
}

type Moment = SelectMoment & {
  selected: boolean
  disabled: boolean
  summary: {
    data: string
    images: Array<Image>
  }
}

const { success, error } = useNotify()
const { getI18nMessage, isUniqueError } = useDatabase()
const { t } = useI18n()
const { formatYYYYmmdd } = useDateFns()
const route = useRoute()

const momentList = ref<Array<Moment>>([])
const boxtList = ref<Array<Pick<SelectBox, 'id' | 'color' | 'name'>>>([])
const createDialogVisible = ref(false)
const updateDialog = reactive<{
  visible: boolean
  title: string
  content: string
  boxId?: number
  momentId?: number
}>({
  visible: false,
  title: '',
  content: '',
  boxId: undefined,
  momentId: undefined,
})
const detailDialog = reactive<{
  visible: boolean
  moment: SelectMoment
}>({
  visible: false,
  moment: {} as SelectMoment,
})
const activeBox = ref(Number(route.query.id as string) || 0)

const filterMomentList = computed(() => activeBox.value == 0 ? momentList.value : momentList.value.filter(i => i.boxId == activeBox.value))
const selectedList = computed(() => filterMomentList.value.filter(i => i.selected).map(i => i.id))
const linkActive = computed(() => momentList.value.some(i => i.disabled))

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
  boxtList.value = [{
    id: 0,
    name: t('moment.box.all'),
    color: '#000000',
  }, ...await db.box.select()]
  momentList.value = (await db.moment.select()).map((i) => {
    const summary = filterImagesAndContent(i.content)
    return {
      ...i,
      summary,
      selected: false,
      disabled: false,
    }
  })
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
  createDialogVisible.value = true
}

function viewDetail(moment: Moment) {
  Object.assign(detailDialog, {
    visible: true,
    moment,
  })
}

function update(moment: Moment) {
  const { title, content, id, boxId } = moment
  Object.assign(updateDialog, {
    visible: true,
    title,
    content,
    boxId,
    momentId: id,
  })
}

async function handleCreate(v: Pick<SelectMoment, 'title' | 'content' | 'boxId'>) {
  try {
    await db.moment.insert(v)
  }
  catch (e) {
    if (isUniqueError(e)) {
      return error({
        text: t('moment.tip.duplicateTitle'),
      })
    }
    return error({
      text: getI18nMessage(e),
    })
  }
  createDialogVisible.value = false
  success({})
  await refresh()
}
async function handleUpdate(v: Pick<SelectMoment, 'title' | 'content' | 'boxId'>) {
  try {
    await db.moment.update(updateDialog.momentId!, v)
  }
  catch (e) {
    if (isUniqueError(e)) {
      return error({
        text: t('moment.tip.duplicateTitle'),
      })
    }
    return error({
      text: getI18nMessage(e),
    })
  }
  finally {
    updateDialog.momentId = undefined
  }
  updateDialog.visible = false
  success({})
  await refresh()
}

function switchBox(id: number) {
  activeBox.value = id
  for (const item of momentList.value)
    item.selected = false
}

function handleLink(moment: Moment) {
  moment.disabled = true
  moment.selected = false
}

function handleCancelLink(moment: Moment) {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('moment.link.cancelTip'),
      async onConfirm() {
        await db.moment.update(moment.id, {
          linkId: null,
        })
        close()
        success({})
        await refresh()
      },
    },
  })
  open()
}

function handleLinkCancel() {
  for (const item of momentList.value) {
    item.disabled = false
    item.selected = false
  }
}

function handleLinkConfirm() {
  const { open, close } = useConfirmModal({
    attrs: {
      title: t('moment.link.submitTip', {
        count: selectedList.value.length,
      }),
      async onConfirm() {
        const target = momentList.value.find(i => i.disabled)!
        let linkId = target.linkId
        if (!linkId) {
          const { lastInsertId } = await db.link.insert({})
          linkId = lastInsertId
        }
        await Promise.all([target.id, ...selectedList.value].map(id => db.moment.update(id, {
          linkId,
        })))
        close()
        success({})
        await refresh()
      },
    },
  })
  open()
}

refresh()
</script>

<template>
  <div space-x-2 mx-4 my-2>
    <v-chip
      v-for="{ id, name, color } in boxtList"
      :key="id"
      label
      :color="color"
      :variant="activeBox == id ? 'tonal' : 'outlined'"
      link
      @click="switchBox(id)"
    >
      {{ name }}
    </v-chip>
  </div>
  <template v-if="filterMomentList.length">
    <grid-card
      v-for="moment in filterMomentList" :key="moment.id" v-model:selected="moment.selected" :title="moment.title"
      :subtitle="formatYYYYmmdd(moment.createdAt, true)" mx-4 mb-6
      :disabled="moment.disabled"
      @click="viewDetail(moment)"
    >
      <v-card-text flex space-x-4>
        <v-img v-if="moment.summary.images.length" :max-width="200" v-bind="moment.summary.images[0]" />
        <div flex-1 line-clamp-4 h-max break-all mb-6>
          {{ moment.summary.data }}
        </div>
      </v-card-text>
      <template v-if="!linkActive" #menu>
        <v-list-item
          value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline"
          base-color="red" @click="handleRemove(moment.id)"
        />
        <v-list-item
          value="moment.edit" :title="$t('moment.edit')" append-icon="mdi-pencil-outline"
          @click="update(moment)"
        />
        <v-list-item v-if="Number(moment.linkId)" value="moment.link.remove" :title="$t('moment.link.remove')" base-color="red" append-icon="mdi-link-variant-off" @click="handleCancelLink(moment)" />
        <v-list-item value="moment.link.submit" :title="$t('moment.link.submit')" append-icon="mdi-link-variant" @click="handleLink(moment)" />
      </template>
    </grid-card>
  </template>
  <empty v-else />
  <v-snackbar
    :model-value="linkActive"
    timeout="-1"
  >
    {{ $t('moment.link.snackbar') }}

    <template #actions>
      <v-btn
        color="red"
        variant="text"
        @click="handleLinkCancel"
      >
        {{ $t('modal.cancel') }}
      </v-btn>
      <v-btn
        color="primary"
        variant="text"
        @click="handleLinkConfirm"
      >
        {{ $t('modal.submit') }}
      </v-btn>
    </template>
  </v-snackbar>
  <more-menu :visible="!linkActive">
    <v-list>
      <v-list-item
        v-if="selectedList.length" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal"
      />
      <v-list-item value="moment.create" :title="$t('moment.create')" append-icon="mdi-plus" @click="viewMomentCreate" />
    </v-list>
  </more-menu>
  <moment-edit v-model:visible="createDialogVisible" @submit="handleCreate" />
  <moment-edit v-model:visible="updateDialog.visible" v-bind="{ title: updateDialog.title, content: updateDialog.content, boxId: updateDialog.boxId }" @submit="handleUpdate" />
  <moment-detail v-model:visible="detailDialog.visible" :moment="detailDialog.moment" :editable="false" />
</template>
