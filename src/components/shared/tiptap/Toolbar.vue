<script setup lang="ts">
import type { ChainedCommands, Editor } from '@tiptap/vue-3'
import { open } from '@tauri-apps/plugin-dialog'

import { uploadByPath, uploadExtension } from '@/modules/upload'

const props = defineProps<{
  editor: Editor
}>()

const { t } = useI18n()

interface DialogFilter {
  name: string
  extensions: string[]
}

interface Divider {
  type: 'divider'
}

interface Button {
  icon: string
  tip: string
  handler: () => Promise<void>
  isActive?: () => boolean
}

type Util = Divider | Button

const utils = computed(() => [
  {
    icon: 'i-mdi:format-bold',
    tip: t('moment.editor.bold'),
    handler: call(c => c.toggleBold()),
    isActive: isActive('bold'),
  },
  {
    icon: 'i-mdi:format-italic',
    tip: t('moment.editor.italic'),
    handler: call(c => c.toggleItalic()),
    isActive: isActive('italic'),
  },
  {
    icon: 'i-mdi:format-underline',
    tip: t('moment.editor.underline'),
    handler: call(c => c.toggleUnderline()),
    isActive: isActive('underline'),
  },
  {
    icon: 'i-mdi:format-strikethrough',
    tip: t('moment.editor.strikethrough'),
    handler: call(c => c.toggleStrike()),
    isActive: isActive('strike'),
  },
  {
    icon: 'i-mdi:format-quote-close',
    tip: t('moment.editor.quote'),
    handler: call(c => c.toggleBlockquote()),
    isActive: isActive('blockquote'),
  },
  // {
  //   icon: 'i-mdi:code-tags',
  //   tip: t('moment.editor.code'),
  //   handler: call(c => c.toggleCode()),
  // },
  {
    icon: 'i-mdi:xml',
    tip: t('moment.editor.codeBlock'),
    handler: call(c => c.toggleCodeBlock()),
    isActive: isActive('codeBlock'),
  },
  // {
  //   icon: 'i-mdi:link-variant',
  //   tip: t('moment.editor.link'),
  //   handler: call(c => c.toggleLink()),
  // },
  {
    type: 'divider',
  },
  {
    icon: 'i-mdi:format-list-bulleted',
    tip: t('moment.editor.listBulleted'),
    handler: call(c => c.toggleBulletList()),
    isActive: isActive('bulletList'),
  },
  {
    icon: 'i-mdi:format-list-numbered',
    tip: t('moment.editor.listNumbered'),
    handler: call(c => c.toggleOrderedList()),
    isActive: isActive('orderedList'),
  },
  {
    icon: 'i-mdi:checkbox-marked-outline',
    tip: t('moment.editor.taskList'),
    handler: call(c => c.toggleTaskList()),
    isActive: isActive('taskList'),
  },
  {
    type: 'divider',
  },
  {
    icon: 'i-mdi:image',
    tip: t('moment.editor.image'),
    handler: uploadImage,
  },
  {
    icon: 'i-mdi:video',
    tip: t('moment.editor.video'),
    handler: uploadVideo,
  },
] as Array<Util>)

async function openFileDialog(filter: DialogFilter) {
  const selected = await open({
    multiple: true,
    filters: [
      filter,
    ],
  })
  if (selected?.length)
    return await Promise.all(selected.map(({ path }) => uploadByPath(path)))
  return []
}

async function uploadImage() {
  const files = await openFileDialog({
    name: t('moment.editor.image'),
    extensions: uploadExtension.image,
  })
  if (!files.length)
    return

  props.editor.commands.insertContent(files.map(src => ({
    type: 'image',
    attrs: {
      src,
    },
  })))
}

async function uploadVideo() {
  const files = await openFileDialog({
    name: t('moment.editor.video'),
    extensions: uploadExtension.video,
  })
  if (!files.length)
    return

  props.editor.commands.insertContent(files.map(src => ({
    type: 'video',
    attrs: {
      src,
    },
  })))
}

function isDivider(util: Util): util is Divider {
  return (util as Divider).type == 'divider'
}

function call(command: (chain: ChainedCommands) => ChainedCommands) {
  return () => command(props.editor.chain()).run()
}

function isActive(name: string) {
  return () => props.editor.isActive(name) || false
}
</script>

<template>
  <div flex>
    <template v-for="item, index in utils">
      <template v-if="isDivider(item)">
        <v-divider :key="item.type + index" vertical class="mx-2!" />
      </template>
      <template v-else>
        <tooltip-button
          :key="item.icon"
          :tooltip="item.tip"
          location="bottom"
          :icon="item.icon"
          size="small"
          variant="text"
          :active="item.isActive?.()"
          @click="item.handler"
        />
      </template>
    </template>
  </div>
</template>
