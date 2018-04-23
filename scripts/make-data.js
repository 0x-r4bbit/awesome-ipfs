const lunr = require('lunr')
const fs = require('fs-extra')
const path = require('path')
const { slugify, capitalize, sortAbc } = require('./utils')

const dataDir = path.join(__dirname, '../src/data')
const contentDir = path.join(__dirname, '../src/content')

const processDataType = (data) => {
  const content = data.content.map((info, index) => {
    const { name, url, ...more } = info

    if (data.title === 'Videos' && url.includes('youtube')) {
      more.youtube = url.replace('https://www.youtube.com/watch?v=', '')
    }

    return {
      title: name,
      link: url,
      categories: [data.title.toLowerCase()],
      ...more
    }
  })

  delete data.content

  return {
    info: { ...data },
    content: content
  }
}

const writeContentFile = (data) => {
  const basename = slugify(data.title)
  const filename = path.join(contentDir, `${basename}.md`)

  fs.writeFileSync(filename, JSON.stringify(data))
}

const makeIndex = (data) => {
  const idx = lunr(function () {
    this.ref('index')
    this.field('title')
    this.field('description')
    this.field('tags')
    this.field('type')
    this.field('categories')

    data.forEach((data) => {
      if (Array.isArray(data.tags)) {
        data.tags = data.tags.join(' ')
      }

      if (Array.isArray(data.categories)) {
        data.categories = data.categories.join(' ')
      }

      this.add(data)
    })
  })

  const file = path.join(__dirname, '../src/layouts/partials/search_index.html')
  const json = JSON.stringify(idx).replace(`'`, `\\'`)

  fs.writeFileSync(file, `<script>var idx = JSON.parse(\`${json}\`);</script>`)
}

const process = () => {
  fs.ensureDirSync(dataDir)
  fs.ensureDirSync(contentDir)
  fs.emptyDirSync(dataDir)
  fs.emptyDirSync(contentDir)

  let data = []
  let types = []
  let typesObj = {}

  require('./data')
    .map(processDataType)
    .forEach(({info, content}) => {
      types.push(info)
      data.push(content)
    })

  data = data.reduce((a, v) => a.concat(v), [])
    .sort((a, b) => sortAbc(a.title, b.title))
    .map((v, i) => { v.index = i; return v })

  data.forEach(writeContentFile)
  makeIndex(data)

  types = types.map(t => {
    t.title = capitalize(t.title)
    return t
  }).sort((a, b) => {
    if (a.weight < b.weight) {
      return -1
    }

    if (a.weight > b.weight) {
      return 1
    }

    return 0
  }).forEach(type => {
    typesObj[type.title.toLowerCase()] = type
  })

  const pt = path.join(dataDir, 'categories.json')
  fs.writeFileSync(pt, JSON.stringify(typesObj))
}

process()
