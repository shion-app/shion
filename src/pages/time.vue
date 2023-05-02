<script setup lang="ts">
const store = useTime()

const { running, time } = storeToRefs(store)
const { start, finish } = store

const planId = ref(0)
const labelIdList = ref<Array<number>>([])
const visible = ref(false)

async function create() {
  const time = Date.now()
  const { lastInsertId: noteId } = await createNote({
    startTime: time,
    endTime: time,
    planId: planId.value,
  })
  await relateNoteAndLabel(noteId, labelIdList.value)
  start(() => {
    updateNote(noteId, {
      endTime: Date.now(),
    })
  })
}

function openModal() {
  visible.value = true
}
function cancelModal() {
  visible.value = false
}

async function finishModal(data: {
  planId: number
  labelIdList: Array<number>
}) {
  cancelModal()
  planId.value = data.planId
  labelIdList.value = data.labelIdList
  await create()
  planId.value = 0
  labelIdList.value = []
}
</script>

<template>
  <div flex flex-col items-center justify-evenly m-a h-full relative>
    <div font-mono text-20>
      {{ time }}
    </div>
    <a-button v-if="running" shape="circle" @click="finish">
      <template #icon>
        <div i-mdi:stop />
      </template>
    </a-button>
    <a-button v-else shape="circle" @click="openModal">
      <template #icon>
        <div i-mdi:play />
      </template>
    </a-button>
  </div>
  <a-modal v-model:visible="visible" destroy-on-close :title="$t('note.fill.title')" :footer="null">
    <note-before-create @finish="finishModal" @cancel="cancelModal" />
  </a-modal>
</template>
