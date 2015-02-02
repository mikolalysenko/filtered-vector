'use strict'

module.exports = createFilteredVector

var cubicHermite = require('cubic-hermite')
var bsearch = require('binary-search-bounds')

function FilteredVector(state0, velocity0, t0) {
  this.dimension  = state0.length
  this._state     = state0.slice().reverse()
  this._velocity  = velocity0.slice().reverse()
  this._time      = [ t0 ]
  this._scratch   = [ state0.slice(), state0.slice(), state0.slice(), state0.slice(), state0.slice() ]
}

var proto = FilteredVector.prototype

proto.flush = function(t) {
  var idx = bsearch.gt(this._time, t) - 1
  if(idx <= 0) {
    return
  }
  this._time.splice(0, idx)
  this._state.splice(0, idx * this.dimension)
  this._velocity.splice(0, idx * this.dimension)
}

proto.curve = function(t) {
  var time      = this._time
  var n         = time.length
  var idx       = bsearch.le(time, t)
  var result    = this._scratch[0]
  var state     = this._state
  var velocity  = this._velocity
  var d         = this.dimension
  if(idx >= n-1) {
    var ptr = state.length-1
    var tf = t - time[n-1]
    for(var i=0; i<d; ++i, --ptr) {
      result[i] = state[ptr] + tf * velocity[ptr]
    }
  } else {
    var ptr = d * (idx+1) - 1
    var t0  = time[idx]
    var t1  = time[idx+1]
    var dt  = (t1 - t0) || 1.0
    var x0  = this._scratch[1]
    var x1  = this._scratch[2]
    var v0  = this._scratch[3]
    var v1  = this._scratch[4]
    for(var i=0; i<d; ++i, --ptr) {
      x0[i] = state[ptr]
      v0[i] = velocity[ptr] * dt
      x1[i] = state[ptr+d]
      v1[i] = velocity[ptr+d] * dt
    }
    cubicHermite(x0, v0, x1, v1, (t-t0)/dt, result)
  }
  return result
}

proto.dcurve = function(t) {
  var time     = this._time
  var n        = time.length
  var idx      = bsearch.le(time, t)
  var result   = this._scratch[0]
  var state    = this._state
  var velocity = this._velocity
  var d        = this.dimension
  if(idx >= n-1) {
    var ptr = state.length-1
    var tf = t - time[n-1]
    for(var i=0; i<d; ++i, --ptr) {
      result[i] = velocity[ptr]
    }
  } else {
    var ptr = d * (idx+1) - 1
    var t0 = time[idx]
    var t1 = time[idx+1]
    var dt = (t1 - t0) || 1.0
    var x0 = this._scratch[1]
    var x1 = this._scratch[2]
    var v0 = this._scratch[3]
    var v1 = this._scratch[4]
    for(var i=0; i<d; ++i, --ptr) {
      x0[i] = state[ptr]
      v0[i] = velocity[ptr] * dt
      x1[i] = state[ptr+d]
      v1[i] = velocity[ptr+d] * dt
    }
    cubicHermite.derivative(x0, v0, x1, v1, (t-t0)/dt, result)
    for(var i=0; i<d; ++i) {
      result[i] /= dt
    }
  }
  return result
}

proto.lastT = function() {
  var time = this._time
  return time[time.length-1]
}

proto.stable = function() {
  var velocity = this._velocity
  var ptr = velocity.length
  for(var i=this.dimension-1; i>=0; --i) {
    if(velocity[--ptr]) {
      return false
    }
  }
  return true
}

proto.push = function(t, w, x, y, z) {
  var t0 = this.lastT()
  if(t <= t0) {
    return
  }
  var state     = this._state
  var velocity  = this._velocity
  var ptr       = state.length-this.dimension
  var dt        = t - t0
  this._time.push(t)
  switch(this.dimension) {
    case 4:
      state.push(z)
      velocity.push((z - state[ptr++]) / dt)
    case 3:
      state.push(y)
      velocity.push((y - state[ptr++]) / dt)
    case 2:
      state.push(x)
      velocity.push((x - state[ptr++]) / dt)
    case 1:
      state.push(w)
      velocity.push((w - state[ptr]) / dt)
  }
}

proto.set = function(t, w, x, y, z) {
  if(t <= this.lastT()) {
    return
  }
  var state    = this._state
  var velocity = this._velocity
  this._time.push(t)
  switch(this.dimension) {
    case 4:
      state.push(z)
      velocity.push(0)
    case 3:
      state.push(y)
      velocity.push(0)
    case 2:
      state.push(x)
      velocity.push(0)
    case 1:
      state.push(w)
      velocity.push(0)
  }
}

proto.move = function(t, dw, dx, dy, dz) {
  var t0 = this.lastT()
  if(t <= t0) {
    return
  }
  var state    = this._state
  var velocity = this._velocity
  var statePtr = state.length - this.dimension
  var dt       = t - t0
  this.time.push(t)
  switch(this.dimension) {
    case 4:
      state.push(state[statePtr++] + dz)
      velocity.push(dz / dt)
    case 3:
      state.push(state[statePtr++] + dy)
      velocity.push(dy / dt)
    case 2:
      state.push(state[statePtr++] + dx)
      velocity.push(dx / dt)
    case 1:
      state.push(state[statePtr++] + dw)
      velocity.push(dw / dt)
  }
}

proto.idle = function(t) {
  if(t <= this.lastT()) {
    return
  }
  var state = this._state
  var velocity = this._velocity
  var statePtr = state.length-1
  this._time.push(t)
  switch(this.dimension) {
    case 4:
      state.push(state[--statePtr])
      velocity.push(0)
    case 3:
      state.push(state[--statePtr])
      velocity.push(0)
    case 2:
      state.push(state[--statePtr])
      velocity.push(0)
    case 1:
      state.push(state[--statePtr])
      velocity.push(0)
  }
}

function getZero(d) {
  d = d|0
  if(d <= 0 || d > 4) {
    throw new Error('invalid dimension, must be between 1 and 4')
  }
  return [0,0,0,0].slice(0, d)
}

function createFilteredVector(initState, initVelocity, initTime) {
  switch(arguments.length) {
    case 0:
      return new FilteredVector([0], [0], 0)
    case 1:
      if(typeof initState === 'number') {
        var zero = getZero(initState)
        return new FilteredVector(zero, zero, 0)
      } else {
        return new FilteredVector(initState, getZero(initState.length), 0)
      }
    case 2:
      if(typeof initVelocity === 'number') {
        var zero = getZero(initState.length)
        return new FilteredVector(initState, zero, +initVelocity)
      } else {
        initTime = 0
      }
    case 3:
      if(initState.length !== initVelocity.length ||
         initState.length <= 0 || 4 < initState.length) {
        throw new Error('invalid dimension, must be between 1 and 4')
      }
      return new FilteredVector(initState, initVelocity, initTime)
  }
}