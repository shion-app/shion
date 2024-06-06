import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Range } from '@tiptap/core'
import { mergeAttributes } from '@tiptap/core'
import type { Emitter } from 'mitt'
import mitt from 'mitt'

import type { ImageOptions } from './image'
import { Image } from './image'
import ImageBlockView from '@/components/shared/tiptap/imageBlock/ImageBlockView.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string }) => ReturnType
      setImageBlockAt: (attributes: { src: string; pos: number | Range }) => ReturnType
      setImageBlockAlign: (align: 'left' | 'center' | 'right') => ReturnType
      setImageBlockWidth: (width: number) => ReturnType
      preview: (src: string) => void
    }
  }
}

type Options = ImageOptions & {
  emitter: Emitter<{
    preview: {
      src: string
    }
  }>
}

export const ImageBlock = Image.extend<Options>({
  name: 'imageBlock',

  group: 'block',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => ({
          src: attributes.src,
        }),
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attributes => ({
          'data-width': attributes.width,
        }),
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => ({
          'data-align': attributes.align,
        }),
      },
      alt: {
        default: undefined,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt,
        }),
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      emitter: mitt(),
    }
  },

  addCommands() {
    return {
      setImageBlock:
        attrs =>
          ({ commands }) => {
            return commands.insertContent({ type: 'imageBlock', attrs: { src: attrs.src } })
          },

      setImageBlockAt:
        attrs =>
          ({ commands }) => {
            return commands.insertContentAt(attrs.pos, { type: 'imageBlock', attrs: { src: attrs.src } })
          },

      setImageBlockAlign:
        align =>
          ({ commands }) =>
            commands.updateAttributes('imageBlock', { align }),

      setImageBlockWidth:
        width =>
          ({ commands }) =>
            commands.updateAttributes('imageBlock', { width: `${Math.max(0, Math.min(100, width))}%` }),
      preview:
        src =>
          () => {
            this.options.emitter.emit('preview', { src })
          },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageBlockView)
  },
})
