import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'
import semver from 'semver'
import { Argument, Command, Option } from 'commander'
import { execa } from 'execa'
import inquirer from 'inquirer'

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

const base = p => path.join(path.dirname(fileURLToPath(import.meta.url)), p)

const packagePath = base('../package.json')
const config = fs.readJsonSync(packagePath)

const repleaceVersion = (version) => {
  config.version = version
  fs.writeJsonSync(packagePath, config, {
    spaces: 2,
  })
}

export async function checkChangelog(version) {
  const dir = base('../changelog')
  const list = await fs.readdir(dir)
  for (const name of list) {
    await run('cargo', ['bin', 'parse-changelog', '-t', path.join(dir, name), version], {
      cwd: base('../src-tauri'),
    })
  }
}

const program = new Command()
program
  .addArgument(new Argument('<release>').choices(['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease']))
  .addOption(new Option('-i, --identifier <version>', 'prerelease identifier').choices(['alpha', 'beta']))
  .action(async (release, { identifier }) => {
    const isPre = release.startsWith('pre')
    if (isPre && !identifier) {
      console.error('Missing option "identifier"')
      return
    }
    const newVersion = semver.inc(config.version, release, identifier)
    const targetVersion = `v${newVersion}`
    console.log(`release version: ${targetVersion}`)
    const { versionConfirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'versionConfirm',
      message: 'Are you sure it is expected?',
    })
    if (!versionConfirm)
      return
    if (!isPre)
      await checkChangelog(newVersion)

    repleaceVersion(newVersion)
    await run('git', ['add', '.'])
    await run('git', ['commit', '-m', `release: ${targetVersion}`])
    await run('git', ['tag', targetVersion])
    await run('git', ['push', 'origin', targetVersion])
    await run('git', ['push'])
  })

program.parse(process.argv)
