import type { Plugin } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import type * as Locale from 'date-fns/locale'

const plugin = (options: {
  locale: Array<keyof typeof Locale>
}) => {
  const filter = createFilter(/ant-design-vue\/.*\/dateFns.js/)

  return {
    name: 'minify-date-fns-locale',
    transform(code, id) {
      if (!filter(id))
        return

      const { locale } = options

      const magic = new MagicString(code)
      const importName = locale.join(', ')

      code = code.replace('import * as Locale from \'date-fns/locale\';', (match, offset) => {
        const start = offset
        const end = offset + match.length
        const newStr
          = `import { ${importName} } from 'date-fns/locale';\n`
          + `const Locale = { ${importName} };`
        magic.overwrite(start, end, newStr)
        return newStr
      })

      const map = magic.generateMap({
        hires: true,
      })

      return { code, map }
    },
  } as Plugin
}

export default plugin
