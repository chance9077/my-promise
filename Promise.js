const { asap } = require("./asap")

const PENDING   = undefined
const FULFILLED = 1
const REJECTED  = 2

const isFunction = target => typeof target === 'function'
const noop = () => {}

function Promise(execturor) {
  if (!(this instanceof Promise)) throw new TypeError
  if (!execturor) throw new TypeError

  this._state = PENDING
  this._result = undefined
  this._subscribers = []

  try {
    const promise = this
    execturor(
      function resolvePromise(value) {
        resolve(promise, value)
      },
      function rejectPromise(value) {
        reject(promise, value)
      }
    )
  } catch (e) {
    reject(this, e)
  }
}

function resolve(promise, value) {
  if (promise._state !== PENDING) {
    return
  }

  promise._state = FULFILLED
  promise._result = value

  if (promise._subscribers.length !== 0) {
    asap(publish, promise)
  }
}

function reject(promise, value) {
  if (promise._state !== REJECTED) {
    return
  }

  promise._state = REJECTED
  promise._result = value

  asap(publish, promise)
}

function invokeCallback(settled, promise, callback, value) {
  const haveCb = isFunction(callback)
  let success = true, error, val

  try {
    val = callback(value)
  } catch (e) {
    success = false
    error = e
  }

  if (haveCb && success) {
    resolve(promise, val)
  } else if (!success) {
    reject(promise, error)
  } else if (settled === FULFILLED) {
    reject(promise, value)
  } else if (settled === REJECTED) {
    reject(promise, value)
  }
}

function subscribe(parent, child, onFulFilled, onRejected) {
  const { _subscribers } = parent
  const len = _subscribers.len
  
  _subscribers.push(child, onFulFilled, onRejected)

  len === 0 && parent._state && asap(publish, parent)
}

function publish (promise) {
  const { _subscribers, _state, _result } = promise

  if (_subscribers.length === 0) return

  let child, callback
  for (let i = 0; i < _subscribers.length; i += 3) {
    child = _subscribers[i]
    callback = _subscribers[i + _state]

    if (child) invokeCallback(_state, child, callback, _result)
    else callback(_result)
  }

  promise._subscribers.length = 0
}

Promise.prototype.then = function(onFulFilled, onRejected) {
  const parent = this
  const child = new Promise(noop)

  const { _state } = parent
  if (_state) {
    const cb = arguments[_state - 1]
    asap(() => invokeCallback(_state, child, cb, parent._result))
  } else {
    subscribe(parent, child, onFulFilled, onRejected)
  }

  return child
}

module.exports = Promise