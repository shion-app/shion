<script setup lang="ts">
import type { Filter } from './types'
import { db } from '@/modules/database'
import type { SelectDomain, SelectLabel, SelectPlan, SelectProgram } from '@/modules/database'

type CategoryItemOptions = Array<{
  title: string
  value: number
}>

const props = defineProps<Filter>()

const { category: categoryVModel, id: idVModel } = useVModels(props)

const { t } = useI18n()

const statusBarText = ref('')

const categoryOptions = computed(() => [
  {
    title: t('timeline.plan'),
    value: 'plan',
  },
  {
    title: t('timeline.label'),
    value: 'label',
  },
  {
    title: t('timeline.monitor'),
    value: 'monitor',
  },
  {
    title: t('timeline.history'),
    value: 'history',
  },
])

async function setModalValue() {
  const [planList, labelList, programList, domainList] = await Promise.all([
    db.plan.select(),
    db.label.select(),
    db.program.select(),
    db.domain.select(),
  ])
  return { planList, labelList, programList, domainList }
}

function getCategoryItemOptions(data: {
  planList?: Array<SelectPlan>
  labelList?: Array<SelectLabel>
  programList?: Array<SelectProgram>
  domainList?: Array<SelectDomain>
}, category: Filter['category']) {
  const { planList, labelList, programList, domainList } = data
  let list: Array<{ id: number; name: string }> = []
  switch (category) {
    case 'plan':
      list = planList || []
      break
    case 'label':
      list = labelList || []
      break
    case 'monitor':
      list = programList || []
      break
    case 'history':
      list = domainList || []
      break
  }
  return list.map(i => ({
    title: i.name,
    value: i.id,
  }))
}

const { open, close, setModelValue } = useFormModal<Filter, {
  planList: Array<SelectPlan>
  labelList: Array<SelectLabel>
  programList: Array<SelectProgram>
  domainList: Array<SelectDomain>
}>(
  (model, modal) => {
    const categoryItemOptions = getCategoryItemOptions(modal, model.category)
    return {
      attrs: {
        title: t('timeline.filter'),
        options: {
          reset: true,
        },
        form: {
          fields: [
            {
              type: 'select',
              key: 'category',
              label: t('timeline.filter'),
              props: {
                'items': categoryOptions.value,
                'onUpdate:modelValue': () => {
                  setModelValue({
                    id: undefined,
                  })
                },
              },
            },
            {
              type: 'autocomplete',
              key: 'id',
              label: t(`timeline.${model.category}`),
              visible: typeof model.category == 'string' && !!model.category,
              props: {
                items: categoryItemOptions,
                autoSelectFirst: 'exact',
              },
            },
          ],
        },
        schema: z => z.object({
          category: z.string().optional(),
          id: z.number().optional(),
        }),
        onConfirm(v) {
          categoryVModel.value = v.category
          idVModel.value = v.id
          setStatusBarText(categoryItemOptions, v)
          close()
        },
      },
    }
  }, setModalValue)

function openFilterForm() {
  setModelValue({
    category: categoryVModel.value,
    id: idVModel.value,
  })
  open()
}

function setStatusBarText(categoryItemOptions: CategoryItemOptions, filter: Filter) {
  statusBarText.value = ''
  if (filter.category)
    statusBarText.value = categoryOptions.value.find(i => i.value == filter.category)!.title

  if (filter.id)
    statusBarText.value += ` / ${categoryItemOptions.find(i => i.value == filter.id)!.title}`
}

async function init() {
  if (!props.category || !props.id)
    return

  const data = await setModalValue()
  const items = getCategoryItemOptions(data, props.category)
  setStatusBarText(items, props)
}

init()
</script>

<template>
  <more-menu>
    <v-list>
      <v-list-item
        value="timeline.filter" :title="$t('timeline.filter')" append-icon="mdi-filter-outline"
        @click="openFilterForm"
      />
    </v-list>
  </more-menu>
  <status-bar-teleport :xs="false">
    <status-bar-button
      v-if="statusBarText" :tooltip="$t('statusBar.timeline.filter.tooltip')" :text="statusBarText"
      icon="i-mdi:filter-outline" @click="openFilterForm"
    />
  </status-bar-teleport>
</template>
