import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { execa } from 'execa'

const base = p => path.join(path.dirname(fileURLToPath(import.meta.url)), p)

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

async function main() {
  await run('cargo', ['build', '--release'], {
    cwd: base('../src-autostart'),
  })
  await run('pnpm', ['tauri', 'build', '-c', 'src-tauri/tauri.conf.build.json'], {
    cwd: base('../'),
  })
}

main()
