import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import semver from 'semver'
import { Argument, Command } from 'commander'
import { $ } from 'execa'

const run = (bin, args, opts = {}) =>
  $(bin, args, { stdio: 'inherit', ...opts })

const packagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json')
const config = fs.readJsonSync(packagePath)

const repleaceVersion = (version) => {
  config.version = version
  fs.writeJsonSync(packagePath, config, {
    spaces: 2,
  })
}

const program = new Command()
program
  .addArgument(new Argument('<release>').choices(['major', 'minor', 'patch']))
  .action(async (release) => {
    const newVersion = semver.inc(config.version, release)
    repleaceVersion(newVersion)
    const targetVersion = `v${newVersion}`
    await run('git', ['add', '.'])
    await run('git', ['commit', '-m', `release: ${targetVersion}`])
    await run('git', ['tag', targetVersion])
    await run('git', ['push', 'origin', targetVersion])
    await run('git', ['push'])
  })

program.parse(process.argv)
