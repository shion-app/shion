<script lang="ts" setup>
import { type Program, getProgramList } from 'tauri-plugin-shion-watcher-api'
import { UseObjectUrl } from '@vueuse/components'

import { db } from '@/modules/database'
import type { InsertProgram } from '@/modules/database'
import { upload } from '@/modules/upload'
import { useConfirmDeleteModal } from '@/hooks/useConfirmModal'

type ProgramForm = Pick<InsertProgram, 'name' | 'color'>

const { t } = useI18n()
const store = useMonitorStore()
const { parseFieldsError, getI18nMessage } = useDatabase()
const { success, error } = useNotify()
const router = useRouter()
const { onRefresh } = usePageRefresh()

const { refresh } = store
const { whiteList } = storeToRefs(store)

const { items, select, selectedList } = useGrid(whiteList)

const { setUpdateId, handleUpdate } = buildUpdateFn()

const cardList = computed(() => whiteList.value.map(({ id, name, totalTime, color, icon, selected }) => ({
  id,
  title: name,
  totalTime,
  color,
  prependImgUrl: icon,
  selected,
})))

const filtering = ref(false)
const filterList = ref<Array<Program & { checked: boolean }>>([])

const { open, close, setModelValue } = useFormModal<ProgramForm>(
  () => ({
    attrs: {
      title: t('program.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('program.name'),
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('program.color'),
          },
        ],
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
      }),
      async onConfirm(v, setErrors) {
        try {
          await handleUpdate(v)
        }
        catch (error) {
          return setErrors(parseFieldsError(error))
        }
        close()
        success({})
        refresh()
      },
    },
  }))

const { open: openBatchRemoveModal } = useConfirmDeleteModal(async () => {
  await Promise.all(selectedList.value.map(id => db.program.removeRelation(id)))
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
      await db.program.removeRelation(id)
      success({})
      refresh()
    },
  }
}

function showUpdateForm(id: number) {
  setUpdateId(id)
  const program = whiteList.value.find(i => i.id == id)
  if (!program)
    return

  setModelValue(program)
  open()
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (program: ProgramForm) => {
      return db.program.update(id, program)
    },
  }
}

async function handleCreateProgram(program: Program) {
  const { name, path, icon } = program
  const color = randomColor()
  // todo: db event listener
  const { lastInsertId } = await db.program.insert({
    name,
    path,
    icon: '',
    color,
  })
  const asset = await upload(`${name}.png`, new Uint8Array(icon))
  await db.program.update(lastInsertId, {
    sort: lastInsertId,
    icon: asset,
  })
}

async function handleSelect() {
  const result = await Promise.allSettled(filterList.value.filter(i => i.checked).map(handleCreateProgram))
  const vaild = result.every(i => i.status == 'fulfilled')
  if (!vaild) {
    const first = result.find(i => i.status == 'rejected')! as any
    const text = getI18nMessage(first.reason)
    error({
      text,
    })
  }
  else {
    success({})
  }
  filtering.value = false
  await refresh()
}

async function showFilterDialog() {
  filtering.value = true
  filterList.value = (await getProgramList()).filter(p => !whiteList.value.find(w => w.path == p.path)).map(p => ({
    ...p,
    checked: false,
  }))
}

async function handleGridChange(items: number[]) {
  const programList = items.map((id, index) => {
    const { sort } = whiteList.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => whiteList.value[index].id != i.id)
  await db.program.batchUpdate(programList)
  await refresh()
}

function navigate(id: number) {
  router.push({
    path: '/timeline',
    query: {
      category: 'monitor',
      id,
    },
  })
}

onRefresh(refresh)

refresh()
</script>

<template>
  <grid
    v-if="whiteList.length"
    :items="items"
    :component-props="cardList"
    :options="{ cellHeight: 120 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <time-card
        v-bind="componentProps"
        @update="showUpdateForm"
        @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)"
        @click="navigate(componentProps.id)"
      />
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item v-if="selectedList.length" value="button.remove" :title="$t('button.remove')" append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal" />
      <v-list-item value="monitor.filterProgram" :title="$t('monitor.filterProgram')" append-icon="mdi-filter-outline" @click="showFilterDialog" />
    </v-list>
  </more-menu>
  <v-dialog
    v-model="filtering"
    width="550"
    max-height="400"
  >
    <v-card>
      <v-card-title>{{ $t('monitor.filterProgram') }}</v-card-title>
      <v-card-text overflow-y-auto>
        <template v-if="filterList.length">
          <div grid grid-cols-2>
            <v-card v-for="program in filterList" :key="program.path" m-2 :color="program.checked ? 'primary' : ''" @click="program.checked = !program.checked">
              <template #prepend>
                <UseObjectUrl v-slot="url" :object="createIconBlob(program.icon)">
                  <img :src="url.value" width="32" height="32" object-contain>
                </UseObjectUrl>
              </template>
              <template #title>
                <div :title="program.path" truncate>
                  {{ program.name }}
                </div>
              </template>
            </v-card>
          </div>
        </template>
        <empty v-else />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="handleSelect">
          {{ $t('modal.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
