const fs = require('fs')
const path = require('path')
const yaml = require('node-yaml')
const { sortInv, sortAbc } = require('./utils')
const dataDir = path.join(__dirname, '../data')

const files = fs.readdirSync(dataDir)
  .map(file => path.join(dataDir, file))
  .map(file => yaml.readSync(file))
  .sort((a, b) => sortAbc(a.title, b.title))
  .map(cat => {
    if (cat.title === 'Articles') {
      cat.content = cat.content.sort((a, b) => sortInv(a.date, b.date))
    } else {
      cat.content = cat.content.sort((a, b) => sortAbc(a.name, b.name))
    }

    return cat
  })

module.exports = files
