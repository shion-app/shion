<script setup lang="ts">
import type { SelectMoment } from '@/modules/database'
import { db } from '@/modules/database'

const props = defineProps<{
  moment: SelectMoment
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const { formatYYYYmmdd } = useDateFns()

const momentList = ref<Array<SelectMoment>>()
const activeMoment = ref<SelectMoment>()

async function init() {
  activeMoment.value = props.moment
  momentList.value = [props.moment]

  if (!props.moment.linkId)
    return

  momentList.value = (await db.moment.select({ linkId: props.moment.linkId })).reverse()
}

function handleSwitch(moment: SelectMoment) {
  activeMoment.value = moment
}

whenever(visibleVModel, init)
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel">
    <v-card-text>
      <v-window :model-value="activeMoment?.id" h-full>
        <v-window-item v-for="{ id, title, content, createdAt } in momentList" :key="id" :value="id">
          <div flex items-end>
            <div text-6>
              {{ title }}
            </div>
            <div flex-1 />
            <v-chip>
              {{ $t('moment.createdAt', {
                date: formatYYYYmmdd(createdAt, true),
              }) }}
            </v-chip>
          </div>
          <tiptap :content="content" :editable="false" content-class="h-[350px]" />
        </v-window-item>
      </v-window>
    </v-card-text>
    <v-card-actions v-if="momentList?.length">
      <div flex justify-around w-full relative mt-2>
        <div absolute left-0 right-0 top-1.5 bg-gray h-0.5 class="z-[-1]" />
        <div v-for="m in momentList" :key="m.id" flex flex-col items-center flex-1>
          <div w-4 h-4 rounded-full cursor-pointer :class="activeMoment?.id == m.id ? 'bg-[rgb(var(--v-theme-primary))]' : 'bg-black'" @click="handleSwitch(m)" />
          <div mt-2 class="max-w-[80px]" truncate>
            {{ m.title }}
          </div>
        </div>
      </div>
    </v-card-actions>
  </advanced-dialog>
</template>
