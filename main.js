/* global document, window, R */
(function() {
  var headers = document.querySelectorAll('.toc-container h2')

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
  // https://stackoverflow.com/questions/20864893/javascript-replace-all-non-alpha-numeric-characters-new-lines-and-multiple-whi
  // https://stackoverflow.com/questions/2701192/what-characters-can-be-used-for-up-down-triangle-arrow-without-stem-for-displa
  headers.forEach(header => {
    var nextEl = header.nextElementSibling

    var toggleDiv = document.createElement('span', {})
    var toggleIcon = document.createTextNode('❱')
    toggleDiv.appendChild(toggleIcon)
    toggleDiv.addEventListener('click', ev => nextEl.classList.toggle('hidden'))
    toggleDiv.style.position = 'absolute'
    toggleDiv.style.minWidth = '1em'
    toggleDiv.style.marginLeft = '-.5em'
    toggleDiv.style.marginTop = '.5em'
    toggleDiv.style.color = '#859900'
    toggleDiv.style.backgroundColor = '#002b36'
    toggleDiv.style.padding = '0 5px 0 5px'


    header.style.marginLeft = '.5em'
    header.parentNode.insertBefore(toggleDiv, header)

    header.addEventListener('click', event => {
      // header.insertAdjacentElement()
      console.log('clicked header')
      window.location.hash = '#' + header.children[0].innerText
    })
  })
}).call(this);

(function() {
  var findFirst = R.find(R.prop('offsetParent'))
  var nameFilter = document.getElementById('name-filter')
  var funcs
  var listItems = document.querySelectorAll('.toc-container li a')

  function toArray(xs) {
    return Array.prototype.slice.call(xs)
  }

  function filterTocType(category) {
    nameFilter.value = category
    filterToc()
  }

  function filterToc() {
    if (!nameFilter) {
      console.log('no name filter')
      return
    }
    var f = filterElement.bind(null, nameFilter.value)
    console.log('filter toc', f)

    funcs.forEach(f)
  }

  function fuzzyIn(left, right) {
    return R.toLower(right).includes(R.toLower(left))
  }

  function filterElement(elementNameFilter, elem) {
    // elem.getAttribute('data-category'
    const name = elem.getAttribute('data-name')
    const all = elem.getAttribute('data-all')
    elem.style.display =
      strIn(elementNameFilter || '', name || '') ||
        fuzzyIn(elementNameFilter || '', all || '')
        ? ''
        : 'none'
  }

  function gotoFirst(e) {
    if (R.isEmpty(e.detail)) {
      return
    }

    var func = findFirst(funcs)
    if (func) {
      var onHashChange = function() {
        e.target.focus()
        window.removeEventListener('hashchange', onHashChange)
      }

      // Hash change blurs input, put focus back to input
      window.addEventListener('hashchange', onHashChange)
      window.location.hash = func.getAttribute('data-name')
    }
  }

  function strIn(a, b) {
    a = a.toLowerCase()
    b = b.toLowerCase()
    return b.indexOf(a) >= 0
  }

  function scrollToTop() {
    var main = document.querySelector('main')
    main.scrollTop = 0
  }

  function isTopLink(elem) {
    return elem.getAttribute('href') === '#'
  }

  function isAnchorLink(elem) {
    return elem.tagName === 'A' && elem.getAttribute('href').charAt(0) === '#'
  }

  function closeNav() {
    document.getElementById('open-nav').checked = false
  }

  function dispatchEvent(event) {
    var target = event.target
    var category = target.getAttribute('data-category')

    if (isAnchorLink(target)) {
      closeNav()
    }
    if (category) {
      filterTocType(category)
    }
    if (isTopLink(target)) {
      scrollToTop(target)
    }
  }

  function keypress(e) {
    if (e.which === 13) {
      e.target.dispatchEvent(new window.CustomEvent('enter', {
        detail: e.target.value,
      }))
    }
  }

  // https://goo.gl/Zbejtc
  function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16)
    })
  }

  function tryInREPL(event) {
    if (!event.target.matches('.try-repl')) {
      return
    }
    var version = event.target.dataset && event.target.dataset.ramdaVersion
    var versionParam = version ? '?v=' + version : ''
    var code = event.target.nextElementSibling.textContent
    var encoded = fixedEncodeURIComponent(code)
    window.open(location.origin + '/repl/' +
      versionParam + '#;' + encoded)
  }


  //  .func
  // funcs = toArray(document.querySelectorAll('.toc'))
  funcs = toArray(listItems)
  filterToc()

  document.body.addEventListener('click', dispatchEvent, false)
  nameFilter.addEventListener('input', filterToc, false)
  nameFilter.addEventListener('keypress', keypress, false)
  nameFilter.addEventListener('enter', gotoFirst)
  document.body.addEventListener('click', tryInREPL)

  document.body.addEventListener('keyup', function(event) {
    console.log('keyup[')
    if (event.which == 191)
      document.getElementById('name-filter').focus()
  })

  document.body.addEventListener('click', function(event) {
    if (event.target.className.split(' ').indexOf('toggle-params') >= 0) {
      var expanded = event.target.parentNode.getAttribute('data-expanded')
      event.target.parentNode.setAttribute(
        'data-expanded',
        expanded === 'true' ? 'false' : 'true'
      )
    }
  }, false)

  // back-button hack
  window.addEventListener('hashchange', function() {
    location.href = location.href
  }, false)
}).call(this)
