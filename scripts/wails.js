const path = require('path')

const { Command } = require("commander");
const fs = require('fs-extra')

const { run } = require('./run')

const { version, author, name: appName } = require("../package.json");

const formatProp = (key, value) => `-X 'main.${key}=${value}'`;

const getLdflags = (isProd = false) => {
  const propList = []
  propList.push(
    formatProp("version", version),
    formatProp("appName", appName),
    formatProp("author", author.name)
  );
  if (isProd) {
    propList.push(formatProp("mode", "production"));
  }
  return "-ldflags=" + propList.join(' ');
}

const program = new Command();
program
  .command("dev")
  .action(async () => {
    const htmlPath = path.join(__dirname, '../frontend/dist/index.html')
    const exists = await fs.pathExists(htmlPath)
    const args = ["dev", exists ? "-s" : "", getLdflags()];
    run("wails", args);
  });

program
  .command("build")
  .option("-n, --nsis")
  .action(({ nsis }) => {
    const args = ["build", "-clean", "-upx", "-webview2=Browser", getLdflags(true)];
    if (nsis) {
      args.push("-nsis");
    }
    run("wails", args);
  });

program.parse(process.argv);
