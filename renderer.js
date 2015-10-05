var GameRenderer = function(canvas, width, height, cellSize) {
  this.ctx = canvas.getContext('2d');
  this.canvas = canvas;
  this.width = width;
  this.height = height;
  this.lastRenderedData = [];
  this.cellSize = cellSize;
  this.lastDraw = 0;
  this.draws = 0;
  this.fgColor = "#FFF";
  this.bgColor = "#333";
};

GameRenderer.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width * this.cellSize, this.height * this.cellSize);
};

GameRenderer.prototype.render = function (display) {
  this.clear();
  this.lastRenderedData = display;
  var i, x, y;
  for (i = 0; i < display.length; i++) {
    x = (i % this.width) * this.cellSize;
    y = Math.floor(i / this.width) * this.cellSize;

    this.ctx.fillStyle = [this.bgColor, this.fgColor][display[i]];
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
  }
  this.draws++;
};
