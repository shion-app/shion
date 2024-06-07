import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Emitter } from 'mitt'
import mitt from 'mitt'

import VideoView from '@/components/shared/tiptap/video/VideoView.vue'

declare module '@tiptap/core' {
  interface Commands {
    video: {
      previewVideo: (src: string) => void
    }
  }
}

const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

export interface VideoOptions {
  HTMLAttributes: Record<string, any>
  emitter: Emitter<{
    preview: {
      src: string
    }
  }>
}

export const Video = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  draggable: true,
  addOptions() {
    return {
      HTMLAttributes: {
        // controls: 'controls',
      },
      emitter: mitt(),
    }
  },
  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , src] = match
          return { src }
        },
      }),
    ]
  },
  addCommands() {
    return {
      previewVideo:
        src =>
          () => {
            this.options.emitter.emit('preview', { src })
          },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(VideoView)
  },
})
