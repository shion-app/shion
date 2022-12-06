const execa = require('execa')

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

module.exports = {
  run
}
