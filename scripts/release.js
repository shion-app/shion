const fs = require('fs-extra')
const path = require('path')

const semver = require('semver')
const { Command, Option } = require("commander");

const { run } = require('./run')

const packagePath = path.join(__dirname, '../package.json')
const wailsPath = path.join(__dirname, '../wails.json')
const package = require(packagePath)
const wails = require(wailsPath)

const repleaceVersion = (version) => {
  package.version = version
  fs.writeJSONSync(packagePath, package, {
    spaces: 2
  })
  wails.info.productVersion = version
  fs.writeJSONSync(wailsPath, wails, {
    spaces: 2
  })
}

const program = new Command();
program
  .addOption(new Option('-r, --release <type>').choices(['major', 'minor', 'patch']))
  .action(async ({ release }) => {
    const newVersion = semver.inc(package.version, release)
    repleaceVersion(newVersion)
    const targetVersion = `v${newVersion}`
    await run('git', ['add', '.'])
    await run('git', ['commit', '-m', `release: ${targetVersion}`])
    await run('git', ['tag', targetVersion])
    await run('git', ['push', 'origin', `refs/tags/${targetVersion}`])
    await run('git', ['push'])
  });

program.parse(process.argv);
