<script setup lang="ts">
import { db } from '@/modules/database'

interface LabelCheckbox {
  name: string
  selected: boolean
  labelId: number
}

interface ProgramCheckbox {
  name: string
  selected: boolean
  programId: number
}

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
  }))
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

whenever(visibleVModel, init)
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('dimension.mark')">
    <v-card-text>
      <v-tabs v-model="tab" color="primary">
        <v-tab prepend-icon="mdi-label-variant" :text="$t('dimensionMark.tab.label')" value="label" />
        <v-tab prepend-icon="mdi-eye" :text="$t('dimensionMark.tab.monitor')" value="monitor" />
      </v-tabs>
      <v-tabs-window v-model="tab" class="h-[350px] pt-0! overflow-y-auto!">
        <div class="grid grid-cols-3">
          <template v-if="tab == 'label'">
            <v-checkbox v-for="item in labelCheckboxList" :key="item.labelId" v-model="item.selected" :label="item.name" />
          </template>
          <template v-else-if="tab == 'monitor'">
            <v-checkbox
              v-for="item in programCheckboxList" :key="item.programId" v-model="item.selected"
              :label="item.name"
            />
          </template>
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
