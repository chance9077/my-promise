let len = 0
const quence = []

function asap(callback, arg) {
  quence[len] = callback
  quence[len + 1] = arg
  len += 2
  len === 2 && schedulerFlush()
}

function flush() {
  for (let i = 0; i < len; i += 2) {
    const callback = quence[i]
    callback(quence[i + 1])

    quence[i] = undefined
    quence[i + 1] = undefined
  }
  len = 0
}

let schedulerFlush

if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
  schedulerFlush = () => process.nextTick(flush)
} else if (typeof window !== undefined && (window.MutationObserver || window.WebKitMutationObserver)) {
    let text = 0
    const observer = new (MutationObserver || WebKitMutationObserver)(flush)
    const node = document.createTextNode('')
    observer.observe(node, { characterData: true })
    schedulerFlush = () => node.data = (text = ++text % 2)
} else {
  schedulerFlush = () => setTimeout(flush)
}

module.exports = { asap }