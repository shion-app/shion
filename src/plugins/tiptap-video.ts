import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'

const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

export interface VideoOptions {
  HTMLAttributes: Record<string, any>
}

export const Video = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  draggable: true,
  addOptions() {
    return {
      HTMLAttributes: {
        controls: 'controls',
      },
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
})
