goog.require('ww.mode.Core');
goog.require('ww.util');
goog.provide('ww.mode.FlipMode');

/**
 * Flip mode.
 * @constructor
 * @param {Element} containerElem The containing element.
 * @param {String} assetPrefix_ The containing element.
 */
ww.mode.FlipMode = function(containerElem, assetPrefix_) {
  goog.base(this, containerElem, assetPrefix_, 'flip', false, true, false, true);

  this.iRadius = 112 / 2;
  this.oRadius = 118 / 2;
  this.iPosition = { x: 53, y: 98 };
  this.oPosition = { x: 182, y: 98 };

  this.iSpinnerCanvas = this.addCanvas(1, {x: 0, y: 0});
  this.oSpinnerCanvas = this.addCanvas(2, {x: 0, y: 0});

  this.iSpinner = new ww.RectangleSpinnerView(this.iSpinnerCanvas, this.iRadius, this.iPosition, -0.06, this.wantsRetina_);
  this.iSpinner.update();

  this.oSpinner = new ww.SpinnerView(this.oSpinnerCanvas, this.oRadius, this.oPosition, -0.06, this.wantsRetina_);
  this.oSpinner.update();
};
goog.inherits(ww.mode.FlipMode, ww.mode.Core);

/**
 * Event is called before a mode focused.
 */
ww.mode.FlipMode.prototype.willFocus = function() {
  goog.base(this, 'willFocus');

  var evt = ww.util.getPointerEventNames('down', this.name_);
  var self = this;
  this.$window_.bind(evt, function(e) {
    e.preventDefault();
    e.stopPropagation();

    self.setSpeed(e.pageX, e.pageY);
  });
};

/**
 * Event is called after a mode unfocused.
 */
ww.mode.FlipMode.prototype.didUnfocus = function() {
  goog.base(this, 'didUnfocus');

  var evt = ww.util.getPointerEventNames('down', this.name_);
  this.$window_.unbind(evt);
};

/**
 * Handles a browser window resize.
 * @param {Boolean} redraw Whether resize redraws.
 */
ww.mode.FlipMode.prototype.onResize = function(redraw) {
  goog.base(this, 'onResize', false);

  this.setSize();

  if (redraw) {
    this.redraw();
  }
};

/**
 * Runs code on each requested frame.
 * @param {Number} delta Ms since last draw.
 */
ww.mode.FlipMode.prototype.onFrame = function(delta) {
  goog.base(this, 'onFrame', delta);

  this.iSpinner.update();
  this.oSpinner.update();
};

ww.mode.FlipMode.prototype.addCanvas = function(id, position) {
  var canvas = document.createElement('canvas');
  canvas.id = 'canvas'+ id;

  canvas.style.zIndex = 8;
  canvas.style.position = 'absolute';
  canvas.style.top = position.y + 'px';
  canvas.style.left = position.x + 'px';

  this.$bounds.append(canvas);

  return canvas;
};

/**
 * Method called when activating the I.
 */
ww.mode.FlipMode.prototype.activateI = function() {
  this.setSpeed(this.boundsX_ + this.iRadius, this.boundsCenterY_);
};

/**
 * Method called when activating the O.
 */
ww.mode.FlipMode.prototype.activateO = function() {
  this.setSpeed(this.boundsX_ + this.boundsWidth_ + this.iRadius, this.boundsCenterY_);
};

/**
 * Set the speed of the animation based on the distance
 * of a click event from the center.
 * @param {Number} x X event pos.
 * @param {Number} y Y event pos.
 */
ww.mode.FlipMode.prototype.setSpeed = function(x, y) {
  var d = x-this.width_/2;
  var s = (d < 0) ? Math.max(-0.5, d/1000) : Math.min(0.5, d/1000);
  
  var containerPosition = this.$bounds.position();
  containerPosition.x = Math.round( ( this.width_ - this.boundsWidth_ )/2 );
  
  var d2;
  var range = this.boundsWidth_;
  var strength = 1000;
  
  var iD = x - (containerPosition.x + this.iPosition.x + this.iSpinner.r * 0.46);
  if (Math.abs(iD) < range) {
    d2 = (range - Math.abs(iD)) * Math.abs(iD)/iD;
    this.iSpinner.da += d2 / strength;
  }
  
  var oD = x - (containerPosition.x + this.oPosition.x + this.oSpinner.r);
  if (Math.abs(oD) < range) {
    d2 = ( range - Math.abs( oD ) )*Math.abs(oD)/oD;
    this.oSpinner.da += d2 / strength;
  }
};

/**
 * Set the size and scale of the logo.
 */
ww.mode.FlipMode.prototype.setSize = function() {
  // Scale
  var s = this.boundsWidth_ * 0.00382;

  var newSize = { w: this.boundsWidth_, h: this.boundsHeight_ };

  this.iSpinner.r = s * this.iRadius;
  var newIPosition = { x: this.iPosition.x * s, y: this.iPosition.y * s };
  this.iSpinner.setSize(newSize);
  this.iSpinner.setCenter(newIPosition);

  this.oSpinner.r = s * this.oRadius;
  var newOPosition = { x: this.oPosition.x * s, y: this.oPosition.y * s };
  this.oSpinner.setSize(newSize);
  this.oSpinner.setCenter(newOPosition);
};

/**
 * View controller for drawing the O
 * @constructor
 * @param {Element} canvasDomElement The canvas DOM element.
 * @param {Number} radius Circle radius.
 * @param {Object} center Coordinates for the center.
 * @param {Number} speed Animation speed.
 * @param {Boolean} wantsRetina Whether the view should draw at 2x.
 */
ww.SpinnerView = function(canvasDomElement, radius, center, speed, wantsRetina) {
  if (!canvasDomElement || canvasDomElement === undefined) {
    return;
  }

  this.dom = canvasDomElement;
  this.wantsRetina = wantsRetina;

  this.center = {x: 0, y: 0};

  this.r = Math.round(radius);
  this.c = { x: 0, y: 0 };

  this.isPlaying = false;
  this.isResetting = false;
  this.changeRotation = false;

  this.a = 0;
  this.da = speed;

  this.arc = [
    { point: { x: 0, y: 1 }, handleIn: { x: 0, y: 0 }, handleOut: { x: 0.55, y: 0 } },
    { point: { x: 1, y: 0 }, handleIn: { x: 0, y: 0.55 }, handleOut: { x: 0, y: -0.55 } },
    { point: { x: 0, y: -1 }, handleIn: { x: 0.55, y: 0 }, handleOut: { x: 0, y: 0 } }
  ];

  this.colors = [
    [{ r: 223, g: 73, b: 62, a: 1 }], // red
    [{ r: 67, g: 134, b: 252, a: 1 }], // blue
    [{ r: 13, g: 169, b: 95, a: 1 }], // green
    [{ r: 246, g: 195, b: 56, a: 1 }] // yellow
  ];

  // grab gradient values and steps
  this.getGradients();

  this.startColor = [ { r:249, g:249, b:249, a:1 } ];
  this.color1 = this.startColor;
  this.color2 = this.colors[1];
  this.defaultColor = this.colors[0];
  this.colorCount = 2;
};

/**
 * Set the center position.
 * @param {Object} position Center position.
 */
ww.SpinnerView.prototype.setCenter = function(position) {
  this.center.x = position.x;
  this.center.y = position.y;
};

/**
 * Update the size of the view.
 * @param {Object} dimensions Size of the view.
 */
ww.SpinnerView.prototype.setSize = function(dimensions) {
  if (this.wantsRetina) {
    this.dom.width = dimensions.w * 2;
    this.dom.height = dimensions.h * 2;
    this.dom.style.width = dimensions.w + 'px';
    this.dom.style.height = dimensions.h + 'px';
  } else {
    this.dom.width = dimensions.w;
    this.dom.height = dimensions.h;
  }
};

/**
 * Setup gradients.
 */
ww.SpinnerView.prototype.getGradients = function() {
  // grab gradient values and steps
  this.newColors = [];
  for (var i = 0; i < this.colors.length; i++) {
    var c1 = this.colors[i][0];
    var n = (i + 1 >= this.colors.length) ? 0 : i + 1;
    var c2 = this.colors[n][0];

    this.newColors.push([
      { r: c1.r, g: c1.g, b: c1.b },
      {
        r: Math.round((c2.r - c1.r) / 2 + c1.r),
        g: Math.round((c2.g - c1.g) / 2 + c1.g),
        b: Math.round((c2.b - c1.b) / 2 + c1.b)
      }
    ]);
  }
  this.colors = this.newColors;
};

/**
 * Check the color, fix gradient based on scale.
 */
ww.SpinnerView.prototype.checkColors = function(color, scale) {
  if (color.length > 1) {
    var halfColor = {
      r: Math.round(color[1].r - color[0].r) / 2 + color[0].r,
      g: Math.round(color[1].g - color[0].g) / 2 + color[0].g,
      b: Math.round(color[1].b - color[0].b) / 2 + color[0].b
    };

    if (scale > 0) {
      return [color[0], halfColor];
    } else {
      return [halfColor, color[1]];
    }
  }

  return color;
};

/**
 * Update some state.
 */
ww.SpinnerView.prototype.checkState = function() {
 
  if( this.isResetting )
  {
    if( this.a >= Math.PI && this.color2 == this.defaultColor )
    {
      this.a = Math.PI;
      this.da = 0;
      this.isResetting = false;
      
      if( this.color1 == this.startColor ) this.color1 = this.colors[1];
    }
    
    if( this.a <= 0  && this.color1 == this.defaultColor )
    {
      this.a = 0;
      this.da = 0;
      this.isResetting = false;
      
      if( this.color2 == this.startColor ) this.color2 = this.colors[1];
    }
  }
  
  if( this.a > Math.PI )
  {
    this.a = this.a-Math.PI;
    this.color1 = this.color2;
    this.colorCount ++;
    if( this.colorCount >= this.colors.length ) this.colorCount = 0;
    
    if(Math.abs(this.da) < .06)
    {
      this.isResetting = true;
      this.da = .1*Math.abs(this.da)/this.da;
    }
    
    if( this.colors[this.colorCount] == this.color1 )
    {
      this.colorCount ++;
      if( this.colorCount >= this.colors.length ) this.colorCount = 0;
    }
    
    this.color2 = ( this.isResetting ) ? this.defaultColor : this.colors[this.colorCount];
  }
  
  if( this.a < 0 )
  {
    this.a = Math.PI + this.a;
    this.color2 = this.color1;
    this.colorCount --;
    if( this.colorCount < 0 ) this.colorCount = this.colors.length-1;

    if(Math.abs(this.da) < .06)
    {
      this.isResetting = true;
      this.da = .1*Math.abs(this.da)/this.da;
    }
    
    if( this.colors[this.colorCount] == this.color2 )
    {
      this.colorCount --;
      if( this.colorCount < 0 ) this.colorCount = this.colors.length-1;
    }
    
    this.color1 = ( this.isResetting ) ? this.defaultColor : this.colors[this.colorCount];
  }
};

/**
 * onFrame event
 */
ww.SpinnerView.prototype.update = function() {
  if (!this.dom || this.dom.width < 1 || this.dom.height < 1) { return; }

  var ctx = this.dom.getContext('2d');
  ctx.clearRect(0, 0, this.dom.width + 1, this.dom.height + 1);

  ctx.save();

  if (this.wantsRetina) {
    ctx.scale(2, 2);
  }

  ctx.translate(Math.round(this.center.x), Math.round(this.center.y));

  if (!this.isResetting) {
    this.da *= 0.98;
  }
  
  if (!this.isResetting && (Math.abs(this.da) < 0.01) && (this.da !== 0)) {
    this.isResetting = true;
    this.da = 0.2 * (-Math.abs(this.da)/this.da);
  }

  this.a += this.da;
  this.checkState();

  var scale = Math.cos(this.a);

  var color_offset = 30 * (1 - Math.abs(scale));
  var foldColor;
  if (scale > 0) {
    if (this.color1.length > 1) {
      foldColor = [];
      foldColor.push({ r: this.color1[0].r - color_offset, g: this.color1[0].g - color_offset, b: this.color1[0].b - color_offset });
      foldColor.push({ r: this.color1[1].r - color_offset, g: this.color1[1].g - color_offset, b: this.color1[1].b - color_offset });
    } else {
      foldColor = [{ r: this.color1[0].r - color_offset, g: this.color1[0].g - color_offset, b: this.color1[0].b - color_offset }];
    }
  } else {
    if (this.color2.length > 1) {
      foldColor = [];
      foldColor.push({ r: this.color2[0].r - color_offset, g: this.color2[0].g - color_offset, b: this.color2[0].b - color_offset });
      foldColor.push({ r: this.color2[1].r - color_offset, g: this.color2[1].g - color_offset, b: this.color2[1].b - color_offset });
    } else {
      foldColor = [{ r: this.color2[0].r - color_offset, g: this.color2[0].g - color_offset, b: this.color2[0].b - color_offset }];
    }
  }

  var shadowScale = Math.min(1, Math.abs(scale) * 1.4) * Math.abs(scale) / scale;

  this.draw(-1, this.color1, 1); // draw old arc
  this.draw(1, this.color2, 1); // draw new base arc
  this.draw(shadowScale, [{r: 0, g: 0, b: 0}], 0.1); // draw shadow
  this.draw(scale, foldColor, 1); // draw flipping arc

  ctx.restore();
};

/**
 * Draw some arcs.
 * @param {Number} scale Scale to draw at.
 * @param {Object} color rgb values.
 * @param {Number} a Opacity.
 */
ww.SpinnerView.prototype.draw = function(scale, color, a) {
  var ctx = this.dom.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(this.arc[0].point.x * this.r + this.c.x, this.arc[0].point.y * this.r + this.c.y);

  for (var i = 1; i < this.arc.length; i++) {
    var x = this.arc[i].point.x * this.r * scale + this.c.x;
    var y = this.arc[i].point.y * this.r + this.c.y;
    var h1_x = (this.arc[i - 1].point.x + this.arc[i - 1].handleOut.x) * this.r * scale + this.c.x;
    var h1_y = (this.arc[i - 1].point.y + this.arc[i - 1].handleOut.y) * this.r + this.c.y;
    var h2_x = (this.arc[i].point.x + this.arc[i].handleIn.x) * this.r * scale + this.c.x;
    var h2_y = (this.arc[i].point.y + this.arc[i].handleIn.y) * this.r + this.c.y;
    ctx.bezierCurveTo(h1_x, h1_y, h2_x, h2_y, x, y);
  }

  var aColor = this.checkColors(color, scale);

  var c;
  if (aColor.length == 1) {
    c = 'rgba(' + Math.round(color[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')';
  } else {
    c = ctx.createLinearGradient(0, 0, this.r * scale, 0);

    if (scale > 0) {
      c.addColorStop(0.1, 'rgba(' + Math.round(aColor[1].r) + ',' + Math.round(aColor[1].g) + ', ' + Math.round(aColor[1].b) + ', ' + a + ')');
      c.addColorStop(0.9, 'rgba(' + Math.round(aColor[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')');
    } else {
      c.addColorStop(0.1, 'rgba(' + Math.round(aColor[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')');
      c.addColorStop(0.9, 'rgba(' + Math.round(aColor[1].r) + ',' + Math.round(aColor[1].g) + ', ' + Math.round(aColor[1].b) + ', ' + a + ')');
    }
  }

  ctx.fillStyle = c;
  ctx.fill();
};


/**
 * View to draw the I.
 * @constructor
 * @param {Element} canvasDomElement The canvas DOM element.
 * @param {Number} radius Circle radius.
 * @param {Object} center Coordinates for the center.
 * @param {Number} speed Animation speed.
 * @param {Boolean} wantsRetina Whether the view should draw at 2x.
 */
ww.RectangleSpinnerView = function(canvasDomElement, radius, center, speed, wantsRetina) {
  ww.SpinnerView.call(this, canvasDomElement, radius, center, speed, wantsRetina);

  this.arc = [
    { point: { x: 0, y: 1 }, handleIn: { x: 0, y: 1 }, handleOut: { x: 0, y: 1 } },
    { point: { x: 0.46, y: 1 }, handleIn: { x: 0.46, y: 1 }, handleOut: { x: 0.46, y: 1 } },
    { point: { x: 0.46, y: -1 }, handleIn: { x: 0.46, y: -1 }, handleOut: { x: 0.46, y: -1 } },
    { point: { x: 0, y: -1 }, handleIn: { x: 0, y: -1 }, handleOut: { x: 0, y: -1 } }
  ];

  this.colors = [
    [{ r: 223, g: 73, b: 62, a: 1 }], // red
    [{ r: 67, g: 134, b: 252, a: 1 }], // blue
    [{ r: 13, g: 169, b: 95, a: 1 }], // green
    [{ r: 246, g: 195, b: 56, a: 1 }] // yellow
  ];

  this.getGradients();
};

ww.RectangleSpinnerView.prototype = new ww.SpinnerView();

/**
 * Update the gradients.
 */
ww.RectangleSpinnerView.prototype.getGradients = function() {
  // grab gradient values and steps
  this.newColors = [];
  for (var i = 0; i < this.colors.length; i++) {
    var c1 = this.colors[i][0];
    var n = (i + 1 >= this.colors.length) ? 0 : i + 1;
    var c2 = this.colors[n][0];

    this.newColors.push([
      {
        r: Math.round((c2.r - c1.r) / 2 + c1.r),
        g: Math.round((c2.g - c1.g) / 2 + c1.g),
        b: Math.round((c2.b - c1.b) / 2 + c1.b)
      },
      { r: c2.r, g: c2.g, b: c2.b }
    ]);
  }
  this.colors = this.newColors;
};

ww.RectangleSpinnerView.prototype.draw = function(scale, color, a) {
  var ctx = this.dom.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(this.arc[0].point.x * this.r + this.c.x, this.arc[0].point.y * this.r + this.c.y);

  var skew = (Math.abs(scale) == 1) ? 1 : (Math.abs(Math.sin(this.a))) / 8 + 1;

  for (var i = 1; i < this.arc.length; i++)
  {
    var x = this.arc[i].point.x * this.r * scale + this.c.x;
    var y = this.arc[i].point.y * this.r + this.c.y;

    if (i == 1 || i == 2) y *= skew;

    ctx.lineTo(x, y);
  }

  var aColor = this.checkColors(color, scale);

  var c;
  if (aColor.length == 1) {
    c = 'rgba(' + Math.round(aColor[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')';
  } else {
    c = ctx.createLinearGradient(0, 0, this.r * scale, 0);

    if (scale > 0) {
      c.addColorStop(0, 'rgba(' + Math.round(aColor[1].r) + ',' + Math.round(aColor[1].g) + ', ' + Math.round(aColor[1].b) + ', ' + a + ')');
      c.addColorStop(0.5, 'rgba(' + Math.round(aColor[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')');
    } else {
      c.addColorStop(0, 'rgba(' + Math.round(aColor[0].r) + ',' + Math.round(aColor[0].g) + ', ' + Math.round(aColor[0].b) + ', ' + a + ')');
      c.addColorStop(0.5, 'rgba(' + Math.round(aColor[1].r) + ',' + Math.round(aColor[1].g) + ', ' + Math.round(aColor[1].b) + ', ' + a + ')');
    }
  }

  ctx.fillStyle = c;
  ctx.fill();
};