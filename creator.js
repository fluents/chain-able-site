const {resolve} = require('path')
const marked = require('marked')
const {read, write} = require('flipfile')
const log = require('fliplog')
const curry = require('../../src/deps/fp/curry')
const esc = require('../../src/deps/matcher/to-regexp')

const resolver = curry(2, (base, rel) => resolve(base, rel))
const res = resolver(__dirname)
const resRoot = resolver(res(process.cwd()))
const resDocs = resolver(res('../docdown/'))

// log.quick(esc('<!--'))
const htmlComments = /\<\!\-\-/gmi
const htmlEndComments = /\-\-\>/gmi
const startTagSpace = /\<\s+div/gmi
const endTagSpace = /\div\s+>/gmi

const stringReplace = (replace, replacement) => target => {
  while (target.includes(replace)) {
    target = target.replace(replace, replacement)
  }
  return target
}

const replaceStartTag = stringReplace('< div', '<div')
const replaceEndTag = stringReplace('div >', 'div>')
const replaceSpaceTag = stringReplace('< /div>', '</div>')
const replaceHighlight = stringReplace('lang-js', 'highlight js')

const uncomment = x => {
  const replaced = x
    .replace(htmlComments, '<')
    .replace(htmlEndComments, '>')
    .replace(endTagSpace, 'div>')

  const started = replaceStartTag(replaced)
  const ended = replaceEndTag(started)
  const spaced = replaceSpaceTag(ended)
  const highlight = replaceHighlight(spaced)
  return highlight
}

// @TODO:
// const make = path => {
//   const FileChain = require('../../_modules/fluent-fs')
//   const docsPath = resDocs(path + '.md')
//   const htmlPath = res(path + '.html')
//
//   const file = FileChain().src(docsPath).read()
//   file.contents.replace(htmlComments, '').replace(htmlEndComments, '')
//   log.quick(file)
//   file.src(htmlPath).write()
// }

const styles = `
  <link rel="stylesheet" type="text/css" href="styles.css">
  <!--<link rel="stylesheet" type="text/css" href="styles2.css">-->
`
// <!-- <script src="https://cdn.jsdelivr.net/prism/1.6.0/prism.js"></script> -->
// <script src="https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom.js"></script>
// <script src="https://sidecar.gitter.im/dist/sidecar.v1.js"></script>

const cdns = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ramda/0.24.1/ramda.min.js"></script>
  <script src="https://cdn.jsdelivr.net/lodash/4.17.4/lodash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
`
const scripts = `
  <script src="main.js"></script>
  <script>hljs.initHighlightingOnLoad();</script>
  <script>
    /*
    window.gitter = {
      chat: {
        options: {
          room: 'fliphub/fliphub'
        }
      }
    }
    */
  </script>
`
//
const indexSpecific = `
  <style>
    body, html, main {
      overflow: auto !important;
    }
    body {
      padding: 2em;
    }
  </style>
`
const notIndex = `
  <style>
  h1 {
    display: none;
  }
  </style>
`

// <a href="${docsHref}" id="docslink">documentation</a>
const playgroundHref = 'https://aretecode.github.io/chain-able-playground/'
const docHref = 'https://fluents.github.io/chain-able-site/documentation.html'
const nav = isIndex => `
<input type="checkbox" id="open-nav">
<header class="navbar navbar-fixed-top navbar-inverse container-fluid">
    <div class="container-fluid">
        <div class="navbar-header">
            <label class="open-nav" for="open-nav"></label>
            <a class="navbar-brand" href="#">
                <strong>⛓</strong>
                <span class="version">v5.0.0</span>
            </a>
        </div>
        <ul class="nav navbar-nav navbar-left">
            <li class="${isIndex ? 'active' : ''}"><a href="/">Home</a></li>
            <li class="${isIndex ? '' : 'active'}"><a href="${docHref}">Documentation</a></li>
            <li><a href="${playgroundHref}">Try ⛓</a></li>
        </ul>
        <ul class="nav navbar-nav navbar-right">
            <li><a href="https://github.com/chain-able/chain-able">GitHub</a></li>
            <li><a href="https://gitter.im/fliphub/Lobby">Discuss</a></li>
        </ul>
    </div>
</header>
`

const input = `
<div class="form-group has-feedback filter">
    <input class="form-control"
           tabindex="1"
           id="name-filter"
           placeholder="Filter"
           type="text"
           data-bind="textInput: filter"
           autofocus
    >
    <span class="form-control-feedback">
        <span class="glyphicon glyphicon-search"></span>
    </span>
</div>
`

const render = (html, index = false) => {
  const htmlClass = index ? '' : 'docs'
  const bodyClass = index ? '' : 'layout-docs'
  const docsClass = index ? '' : 'doc-main'

  return `
    <!DOCTYPE html>
    <html class="${htmlClass}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>chain-able documentation</title>
      ${styles}
      ${cdns}
      ${index ? indexSpecific : notIndex}
    </head>
    <body class="${bodyClass}">
      ${nav(index)}
      <nav class="nav-left">
        ${index ? '' : input}
      </nav>
      <main class="${docsClass}">
        ${html}
      </main>
      ${scripts}
    </body>
    </html>
  `
}

/**
 * @TODO should render this server side inferno, for practice...
 * @TODO should split TOC and MAIN to make it easier, either parse html or react
 */
const js_beautify = require('js-beautify').html

const beautify = data => js_beautify(data, {indent_size: 2, type: 'html'})

// SPLIT ON EVERY HEADER
// STRIP TAGS
//

// FUZZY SEARCH FILTER THIS IN SIDEBAR TO SHOW HEADERS FOR THE CONTENT MATCHING SEARCH...
let contents = []
let toc = []
let doctypes = []
let container = []

// should instead edit data attr of toc pieces...
// const mdParts = md.split('<!-- div class="toc-container" -->')
// toc = mdParts[0]
// contents = mdParts[1]
// const tocCommented = '<div id="toc-hidden" class="hidden">' + toc + '</div>'
// html += tocCommented

const stripTag = x => x.replace(/<[^>]+>/g, '')

// https://www.npmjs.com/package/html2commonmark
const make = (path) => {
  const docsPath = resDocs(path + '.md')
  const htmlPath = res(path + '.html')

  const md = read(docsPath)
  let html = marked(md)
  html = uncomment(html)
  html = render(html)
  html = beautify(html)

  // const parts = html.split('<div class="toc-container">')
  // doctypes = parts[0]
  // toc = parts[1]
  // const sub = toc.split('<div class="doc-container">')
  // toc = sub[0]
  // contents = sub[1]

  // const tocCommented = '<div id="toc-hidden" class="hidden">' + toc + '</div>'
  // html += tocCommented

  // toc.split('\n').map(item => {
  //   if (!item.includes('<li><a')) return item
  //
  //   const itemText = stripTag(item).trim()
  //   item = item.replace('<li', '<li data-')
  //   log.quick({item, itemText})
  // })
  // log.data(toc.split('\n')).echo()

  write(htmlPath, html)
  return {make}
}


const makeIndex = (path) => {
  const readmePath = resRoot('README.md')
  const docsPath = resDocs(path + '.md')
  const htmlPath = res(path + '.html')

  const md = read(docsPath)
  const readme = read(readmePath)

  let mdPlusReadme = readme + '\n\n\n --- \n\n\n ' + md

  mdPlusReadme = mdPlusReadme.replace(/<\/?details>/, '')
  mdPlusReadme = mdPlusReadme.replace(/<\/?summary>/, '')

  let html = marked(mdPlusReadme)
  html = uncomment(html)
  html = render(html, true)

  write(htmlPath, html)
  return {make}
}

make('aio')
makeIndex('README', true)
