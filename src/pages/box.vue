<script setup lang="ts">
import { useConfirmModal } from '@/hooks/useConfirmModal'
import type { GridList } from '@/hooks/useGrid'
import { useGrid } from '@/hooks/useGrid'
import type { InsertBox, SelectBox } from '@/modules/database'
import { db } from '@/modules/database'

type boxForm = Pick<InsertBox, 'name' | 'color'>

const { t } = useI18n()
const { parseFieldsError } = useDatabase()
const { success } = useNotify()
const router = useRouter()
const { onRefresh } = usePageRefresh()
const confirm = useConfirmModal()

const list = ref<GridList<SelectBox>>([])

const { items, wrap, select, selectedList } = useGrid(list)

const isCreate = ref(true)

const { setUpdateId, handleUpdate } = buildUpdateFn()

const { open, close, setModelValue } = useFormModal<boxForm>(
  () => ({
    attrs: {
      title: isCreate.value ? t('box.create') : t('box.update'),
      form: {
        fields: [
          {
            type: 'textField',
            key: 'name',
            label: t('box.name'),
          },
          {
            type: 'colorPicker',
            key: 'color',
            label: t('box.color'),
          },
        ],
      },
      schema: z => z.object({
        name: z.string().min(1),
        color: z.string().length(7),
      }),
      async onConfirm(v, setErrors) {
        try {
          isCreate.value ? await handleCreate(v) : await handleUpdate(v)
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

const cardList = computed(() => list.value.map(({ id, name, itemCount, color, selected }) => ({
  id,
  title: name,
  itemCount,
  color,
  selected,
})))

function openBatchRemoveModal() {
  confirm.delete({
    onConfirm: async () => {
      await db.box.batchRemove(selectedList.value)
      success({})
      await refresh()
    },
  })
}

function handleRemove(id: number) {
  confirm.delete({
    onConfirm: async () => {
      await db.box.removeRelation(id)
      success({})
      await refresh()
    },
  })
}

async function refresh() {
  list.value = wrap(await db.box.select())
}

function showCreateForm() {
  isCreate.value = true
  setModelValue({
    color: randomColor(),
  })
  open()
}

function showUpdateForm(id: number) {
  setUpdateId(id)
  const plan = list.value.find(i => i.id == id)
  if (!plan)
    return

  isCreate.value = false
  setModelValue(plan)
  open()
}

async function handleCreate(plan: boxForm) {
  // todo: db event listener
  const { lastInsertId } = await db.box.insert(plan)
  await db.box.update(lastInsertId, {
    sort: lastInsertId,
  })
}

function buildUpdateFn() {
  let id = 0
  return {
    setUpdateId: (updateId: number) => {
      id = updateId
    },
    handleUpdate: (plan: boxForm) => {
      return db.box.update(id, plan)
    },
  }
}

async function handleGridChange(items: number[]) {
  const planList = items.map((id, index) => {
    const { sort } = list.value[index]
    return {
      id,
      sort,
    }
  }).filter((i, index) => list.value[index].id != i.id)
  await db.box.batchUpdate(planList)
  await refresh()
}

function navigate(id: number) {
  router.push({
    path: '/moment',
    query: {
      id,
    },
  })
}

onRefresh(refresh)

refresh()
</script>

<template>
  <grid
    v-if="list.length" :items="items" :component-props="cardList" :options="{ cellHeight: 120 }"
    @change="handleGridChange"
  >
    <template #default="{ componentProps }">
      <box-card
        v-bind="componentProps" @update="showUpdateForm" @remove="handleRemove"
        @update:selected="v => select(componentProps.id, v)" @click="navigate(componentProps.id)"
      />
    </template>
  </grid>
  <empty v-else />
  <more-menu>
    <v-list>
      <v-list-item
        v-if="selectedList.length" value="button.remove" :title="$t('button.remove')"
        append-icon="mdi-trash-can-outline" base-color="red" @click="openBatchRemoveModal"
      />
      <v-list-item value="box.create" :title="$t('box.create')" append-icon="mdi-plus" @click="showCreateForm" />
    </v-list>
  </more-menu>
</template>
