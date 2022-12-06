const fs = require('fs-extra')
const path = require('path')

const distPath = path.join(__dirname, '../frontend/dist')
const tempPath = path.join(distPath, '.temp')

;(async () => {
  const exists = await fs.pathExists(distPath)
  if (!exists) {
    await fs.ensureFile(tempPath)
  }
})()
