filtered-vector
===============
Applies cubic smoothing to a vector valued curve.  This is useful for smoothing out inputs from the mouse or other input devices.

# Example

```javascript
var now = require('right-now')
var filterVector = require('filtered-vector')
var smoothPosition = filterVector([256, 256])

var canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
document.body.appendChild(canvas)
var context = canvas.getContext('2d')

canvas.addEventListener('mousemove', function(ev) {
  smoothPosition.push(now(), ev.x, ev.y)
})

function paint() {
  requestAnimationFrame(paint)
  var t = now()
  context.fillStyle = 'rgba(0,0,0,1)'
  context.fillRect(0,0,512,512)
  
  context.strokeStyle = '#0f0'
  context.lineWidth = 1
  context.beginPath()
  var x = smoothPosition.curve(t)
  context.moveTo(x[0], x[1])
  for(var i=0; i<2000; ++i) {
    var y = smoothPosition.curve(Math.floor(t - i))
    context.lineTo(y[0], y[1])
  }
  context.stroke()
}
paint()
```

Try out the demo in your browser.

# Install

```
npm i filtered-vector
```

# API

## Constructor

#### `var vec = require('filtered-vector')(initState[, initVelocity, initTime])`
Creates a new smoothed vector with the given initial state, velocity and time.

* `initState` is the initial state of the vector
* `initVelocity` is the initial velocity of the vector
* `initTime` is the initial time of the vector

**Returns** A new smoothed vector valued curve

## Methods

#### `vec.curve(t)`

#### `vec.dcurve(t)`

#### `vec.push(t, w, x, y, z)`

#### `vec.flush(t)`

#### `vec.move(t, dw, dx, dy, dz)`

#### `vec.set(t, x, y, z, w)`

#### `vec.idle(t)`

#### `vec.lastT()`

# License
(c) 2015 Mikola Lysenko.  MIT License

