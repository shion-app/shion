<script lang="ts" setup>
import { type Program, getProgramList } from 'tauri-plugin-shion-watcher-api'
import { UseObjectUrl } from '@vueuse/components'

import { db } from '@/modules/database'
import type { InsertProgram } from '@/modules/database'
import { useConfirmModal } from '@/hooks/useConfirmModal'

type ProgramForm = Pick<InsertProgram, 'name' | 'color' | 'path'>

interface SelectProgramDimension {
  programId: number
  dimensionId: number
  name: string
  color: string
}

const monitorStore = useMonitorStore()
const activityStore = useActivityStore()

const { t } = useI18n()
const { parseFieldsError, getI18nMessage } = useDatabase()
const { success, error } = useNotify()
const router = useRouter()
const { onRefresh } = usePageRefresh()
const confirm = useConfirmModal()

const { restart } = activityStore
const { whiteList } = storeToRefs(monitorStore)

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
const dimensionList = ref<Array<SelectProgramDimension>>([])

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
          {
            type: 'filePicker',
            key: 'path',
            label: t('program.path'),
          },
        ],
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
        path: z.string().min(1),
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
        await restart()
        await refresh()
      },
    },
  }))

function openBatchRemoveModal() {
  confirm.delete({
    onConfirm: async () => {
      await db.program.batchRemove(selectedList.value)
      success({})
      await refresh()
    },
  })
}

function handleRemove(id: number) {
  confirm.delete({
    onConfirm: async () => {
      await db.program.removeRelation(id)
      success({})
      await refresh()
    },
  })
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
  await db.program.transactionInsert(program)
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

async function handleLayoutUpdated(items: number[]) {
  const programList = items.map((id, index) => {
    const { sort } = whiteList.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => whiteList.value[index].id != i.id)
  if (programList.length) {
    await db.program.batchUpdate(programList)
    await refresh()
  }
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

async function refresh() {
  await monitorStore.refresh()
  dimensionList.value = await db.program.selectDimension()
}

onRefresh(refresh)

refresh()
</script>

<template>
  <grid
    v-if="whiteList.length" :items="items" :component-props="cardList" :options="{ cellHeight: 100 }"
    @layout-updated="handleLayoutUpdated"
  >
    <template #default="{ componentProps }">
      <time-card
        v-bind="componentProps" @update="showUpdateForm" @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)" @click="navigate(componentProps.id)"
      >
        <template v-if="dimensionList.filter(i => i.programId == componentProps.id).length > 0" #dimension>
          <v-chip
            v-for="item in dimensionList.filter(i => i.programId == componentProps.id)" :key="item.dimensionId"
            :color="item.color" size="x-small" class="mr-1"
          >
            {{ item.name }}
          </v-chip>
        </template>
      </time-card>
    </template>
  </grid>
  <empty v-else type="monitor" :desc="$t('hint.monitor')" :width="300" />
  <more-menu>
    <v-list>
      <v-list-item
        v-if="selectedList.length" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal"
      />
      <v-list-item
        value="monitor.filterProgram" :title="$t('monitor.filterProgram')" append-icon="mdi-filter-outline"
        @click="showFilterDialog"
      />
    </v-list>
  </more-menu>
  <advanced-dialog v-model:visible="filtering" :title="$t('monitor.filterProgram')" max-height="450">
    <v-card-text overflow-y-auto>
      <template v-if="filterList.length">
        <div text-3.5 mb-4 text-gray>
          {{ $t('monitor.tip') }}
        </div>
        <div grid grid-cols-2>
          <v-card
            v-for="program in filterList" :key="program.path" m-2 :color="program.checked ? 'primary' : ''"
            @click="program.checked = !program.checked"
          >
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
  </advanced-dialog>
</template>
