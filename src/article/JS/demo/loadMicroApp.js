const fetchHTML = entry => fetch(entry).then(response => response.text())

const loadStyle = (entry, rootElement, containerElement) => {
  const styleNodeList = [...rootElement.querySelectorAll('link[rel="stylesheet"],style')]

  const shadowHost = document.createElement('div')

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const root = document.createElement('div')

  root.setAttribute('id', 'root')

  styleNodeList.forEach(item => {
    if (item.nodeName === 'LINK') {
      item.setAttribute('href', `${entry}${item.getAttribute('href')}`)
    }

    shadow.append(item)
  })

  shadow.append(root)

  containerElement.append(shadowHost)

  return shadowHost
}

const loadScript = async (entry, rootElement) => {
  const scriptNodeList = [...rootElement.querySelectorAll('script')]

  for (let item of scriptNodeList) {
    await new Promise(resolve => {
      const script = document.createElement('script')

      const src = item.getAttribute('src')

      if (item.innerHTML) script.innerHTML = item.innerHTML

      if (src) {
        script.setAttribute('src', `${entry}${src}`)
        script.addEventListener('load', () => resolve())
      } else {
        resolve()
      }

      document.body.append(script)
    })
  }
}

const loadMicroApp = async app => {
  const { name, entry, container, props = {} } = app

  const containerElement = typeof container === 'string'
    ? document.querySelector(container)
    : container

  const html = await fetchHTML(entry)

  const rootElement = document.createElement('div')

  rootElement.innerHTML = html

  const shadowHost = loadStyle(entry, rootElement, containerElement)

  await loadScript(entry, rootElement)

  const microApp = window[name]

  microApp.mount({ ...props, container: shadowHost.shadowRoot })

  const unmount = () => {
    microApp.unmount && microApp.unmount({ ...props, container: shadowHost.shadowRoot })
    shadowHost.remove()
  }

  return {
    ...microApp,
    unmount,
  }
}

export default loadMicroApp
