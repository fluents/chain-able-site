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

const htmlComments = /\<\!\-\-/gmi
const htmlEndComments =  /\-\-\>/gmi
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
const cdns = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
  <script src="https://sidecar.gitter.im/dist/sidecar.v1.js"></script>
`
const scripts = `
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

const docsHref = 'https://fluents.github.io/chain-able-site/aio.html'
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
      <nav>
        <a href="${docsHref}" id="docslink">documentation</a>
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
 */

const make = (path) => {
  const docsPath = resDocs(path + '.md')
  const htmlPath = res(path + '.html')

  const md = read(docsPath)
  let html = marked(md)
  html = uncomment(html)
  html = render(html)

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
