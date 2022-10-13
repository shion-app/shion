const { spawn } = require("child_process");
const { Command } = require("commander");

const { version, author, name: appName } = require("../package.json");

const run = (args) => {
  const ls = spawn("wails", args);

  ls.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  ls.stderr.on("data", function (data) {
    console.log(data.toString());
  });
};

const formatProp = (key, value) => `-X 'main.${key}=${value}'`;

const getLdflags = (isProd = false) => {
  const propList = []
  propList.push(
    formatProp("version", version),
    formatProp("appName", appName),
    formatProp("author", author.name)
  );
  if (isProd) {
    formatProp("mode", "production");
  }
  return "-ldflags=" + propList.join(' ');
}

const program = new Command();
program.command("dev").action(() => {
  const args = ["dev", getLdflags()];
  run(args);
});

program
  .command("build")
  .option("-n, --nsis")
  .action(({ nsis }) => {
    const args = ["build", "-clean", "-upx", "-webview2=Browser", getLdflags(true)];
    if (nsis) {
      args.push("-nsis");
    }
    run(args);
  });

program.parse(process.argv);
