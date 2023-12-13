<script setup lang="ts">
import { type SelectLabel, type SelectPlan, type SelectProgram, db } from '@/modules/database'

interface Props {
  category: 'plan' | 'label' | 'monitor' | string & {} | undefined
  id: number | undefined
}

const props = defineProps<Props>()

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
])

const { open, close, setModelValue } = useFormModal<Props, {
  planList: Array<SelectPlan>
  labelList: Array<SelectLabel>
  programList: Array<SelectProgram>
}>(
  (model, modal) => {
    let list: Array<{ id: number; name: string }> = []
    switch (model.category) {
      case 'plan':
        list = modal.planList || []
        break
      case 'label':
        list = modal.labelList || []
        break
      case 'monitor':
        list = modal.programList || []
        break
    }
    const idItems = list.map(i => ({
      title: i.name,
      value: i.id,
    }))
    return {
      attrs: {
        title: t('timeline.filter'),
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
              type: 'select',
              key: 'id',
              label: t(`timeline.${model.category}`),
              visible: typeof model.category == 'string',
              props: {
                items: idItems,
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
          if (v.category)
            statusBarText.value = categoryOptions.value.find(i => i.value == v.category)!.title

          if (v.id)
            statusBarText.value += ` / ${idItems.find(i => i.value == v.id)!.title}`

          close()
        },
      },
    }
  }, async () => {
    const [planList, labelList, programList] = await Promise.all([
      db.plan.select(),
      db.label.select(),
      db.program.select(),
    ])
    return { planList, labelList, programList }
  })

function openFilterForm() {
  setModelValue({
    category: categoryVModel.value,
    id: idVModel.value,
  })
  open()
}
</script>

<template>
  <more-menu>
    <v-list>
      <v-list-item value="timeline.filter" :title="$t('timeline.filter')" @click="openFilterForm" />
    </v-list>
  </more-menu>
  <footer-teleport>
    <tooltip-button v-if="statusBarText" :tooltip="$t('statusBar.timeline')" location="top" :text="statusBarText" variant="text" @click="openFilterForm" />
  </footer-teleport>
</template>
