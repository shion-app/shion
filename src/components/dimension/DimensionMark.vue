<script setup lang="ts">
import type { SelectPlan } from '@/modules/database'
import { db } from '@/modules/database'

interface LabelCheckbox {
  name: string
  selected: boolean
  labelId: number
  planId: number
}

interface ProgramCheckbox {
  name: string
  selected: boolean
  programId: number
}

type PlanCheckbox = SelectPlan & { selected: boolean }

const props = defineProps<{
  visible: boolean
  dimensionId: number
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const { visible: visibleVModel } = useVModels(props)

const labelCheckboxList = ref<Array<LabelCheckbox>>([])
const programCheckboxList = ref<Array<ProgramCheckbox>>([])
const planList = ref<Array<PlanCheckbox>>([])
const tab = ref<'label' | 'monitor'>('label')

let labelCheckboxBase: Array<LabelCheckbox> = []
let programCheckboxBase: Array<ProgramCheckbox> = []

async function init() {
  labelCheckboxList.value = []
  programCheckboxList.value = []
  labelCheckboxBase = []
  programCheckboxBase = []
  const [labelList, programList, dimensionLabelList, dimensionProgramList] = await Promise.all([
    db.label.select(),
    db.program.select(),
    db.dimensionLabel.select({
      dimensionId: props.dimensionId,
    }),
    db.dimensionProgram.select({
      dimensionId: props.dimensionId,
    }),
  ])
  labelCheckboxList.value = labelList.map(i => ({
    name: i.name,
    labelId: i.id,
    selected: !!dimensionLabelList.find(d => d.labelId == i.id),
    planId: i.planId,
  }))
  planList.value = (await db.plan.select()).flatMap((plan) => {
    const list = labelCheckboxList.value.filter(label => label.planId == plan.id)
    if (list.length) {
      const selected = list.every(i => i.selected)
      return [{ ...plan, selected }]
    }
    else {
      return []
    }
  })
  labelCheckboxBase = labelCheckboxList.value.map(i => ({
    ...i,
  }))
  programCheckboxList.value = programList.map(i => ({
    name: i.name,
    programId: i.id,
    selected: !!dimensionProgramList.find(d => d.programId == i.id),
  }))
  programCheckboxBase = programCheckboxList.value.map(i => ({
    ...i,
  }))
}

async function handleSubmit() {
  const label = differenceBetween(labelCheckboxBase, labelCheckboxList.value, 'selected')
  const program = differenceBetween(programCheckboxBase, programCheckboxList.value, 'selected')
  await Promise.all([
    ...label.added.map(i => db.dimensionLabel.insert({
      dimensionId: props.dimensionId,
      labelId: i.labelId,
    })),
    ...label.removed.map(i => db.dimensionLabel.removeBy({
      dimensionId: props.dimensionId,
      labelId: i.labelId,
    })),
    ...program.added.map(i => db.dimensionProgram.insert({
      dimensionId: props.dimensionId,
      programId: i.programId,
    })),
    ...program.removed.map(i => db.dimensionProgram.removeBy({
      dimensionId: props.dimensionId,
      programId: i.programId,
    })),
  ])
  emit('submit')
}

function differenceBetween<T>(base: Array<T>, target: Array<T>, key: string) {
  const added: Array<T> = []
  const removed: Array<T> = []
  for (let i = 0; i < base.length; i++) {
    if (base[i][key] != target[i][key]) {
      if (target[i][key])
        added.push(target[i])
      else
        removed.push(target[i])
    }
  }
  return {
    added,
    removed,
  }
}

function clickPlanCheckBox(plan: PlanCheckbox) {
  plan.selected = !plan.selected
  labelCheckboxList.value.filter(label => label.planId == plan.id).forEach(label => label.selected = plan.selected)
}

function clickLabelCheckBox(label: LabelCheckbox, plan: PlanCheckbox) {
  label.selected = !label.selected
  plan.selected = labelCheckboxList.value.filter(label => label.planId == plan.id).every(label => label.selected)
}

whenever(visibleVModel, init)
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('dimension.mark')" class="w-[700px]!">
    <v-card-text>
      <v-tabs v-model="tab" color="primary">
        <v-tab prepend-icon="mdi-label-variant" :text="$t('dimensionMark.tab.label')" value="label" />
        <v-tab prepend-icon="mdi-eye" :text="$t('dimensionMark.tab.monitor')" value="monitor" />
      </v-tabs>
      <v-tabs-window v-model="tab" class="h-[350px] pt-0! overflow-y-auto!">
        <div v-if="tab == 'label'" py-2 space-y-6>
          <template v-if="planList.length">
            <div v-for="plan in planList" :key="plan.id">
              <v-checkbox
                :label="plan.name" hide-details :color="plan.color" :model-value="plan.selected"
                @click="clickPlanCheckBox(plan)"
              />
              <v-divider />
              <div class="grid grid-cols-3">
                <v-checkbox
                  v-for="item in labelCheckboxList.filter(label => label.planId == plan.id)"
                  :key="item.labelId" :model-value="item.selected" :label="item.name" hide-details :color="plan.color"
                  @click="clickLabelCheckBox(item, plan)"
                />
              </div>
            </div>
          </template>
          <empty v-else :width="250" />
        </div>
        <div v-else-if="tab == 'monitor'" py-2>
          <div v-if="programCheckboxList.length" class="grid grid-cols-3">
            <v-checkbox
              v-for="item in programCheckboxList" :key="item.programId" v-model="item.selected"
              :label="item.name" hide-details
            />
          </div>
          <empty v-else :width="250" />
        </div>
      </v-tabs-window>
    </v-card-text>
    <v-card-actions>
      <div flex-1 />
      <v-btn color="primary" @click="handleSubmit">
        {{ $t('modal.submit') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
