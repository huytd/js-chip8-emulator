console.doc = function(msg) {
    console.log(msg);
    //document.write(msg + "<br/>");
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Chip8 = function() {
    this.displayWidth = 64;
    this.displayHeight = 32;
    this.display = new Array(this.displayWidth * this.displayHeight);
    this.renderer = null;
    self.drawFlag = false;

    this.pc = 0;
    this.memory = new Uint8Array(new ArrayBuffer(0x1000)); // 4Kb RAM
    this.v = new Array(16);
    this.i = null;
    this.stack = new Array(16);
    this.sp = null;

    this.reset();
};

Chip8.prototype.setRenderer = function(renderer) {
  this.renderer = renderer;
};

Chip8.prototype.reset = function() {
    for (var i = 0; i < this.memory.length; i++) {
        this.memory[i] = 0;
    }

    var hexChars = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80 // F
    ];

    for (var i = 0; i < hexChars.length; i++) {
        this.memory[i] = hexChars[i];
    }

    for (i = 0; i < this.v.length; i++) {
      this.v[i] = 0;
    }

    for (i = 0; i < this.display.length; i++) {
      this.display[i] = 0;
    }
    self.drawFlag = false;

    this.pc = 0x200;
    this.sp = 0;
    this.i = 0;
};

Chip8.prototype.start = function() {
  if (!this.renderer) {
    throw new Error("You must specify a renderer.");
  }
  var self = this;
  requestAnimFrame(function main() {
    for (var i = 0; i < 10; i++) {
      //if (self.running) {
      self.cycle();
      //}
    }

    if (self.drawFlag) {
      self.renderer.render(self.display);
      self.drawFlag = false;
    }

  // if ( ! (self.step++ % 2)) {
  //   self.handleTimers();
  // }

    requestAnimFrame(main);

  });
};

Chip8.prototype.open = function(url) {
    var self = this;
    return new Promise(function(resolve, reject){
        var xhr = new XMLHttpRequest;
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function () {
           var program = new Uint8Array(xhr.response);
           self.loadProgram(program).then(function(){
               resolve();
           });
        };

        xhr.send();
    });
};

Chip8.prototype.loadProgram = function(program) {
    var self = this;
    return new Promise(function(resolve, reject) {
        for (var i = 0; i < program.length; i++) {
            self.memory[i + 0x200] = program[i];
        }
        resolve();
    });
};

Chip8.prototype.getDisplayWidth = function () {
  return this.displayWidth;
};

Chip8.prototype.getDisplayHeight = function () {
  return this.displayHeight;
};

Chip8.prototype.setPixel = function(x, y) {
  var location,
  width = this.getDisplayWidth(),
  height = this.getDisplayHeight();

  // If the pixel exceeds the dimensions,
  // wrap it back around.
  if (x > width) {
    x -= width;
  } else if (x < 0) {
    x += width;
  }

  if (y > height) {
    y -= height;
  } else if (y < 0) {
    y += height;
  }

  location = x + (y * width);

  this.display[location] ^= 1;

  return !this.display[location];
};

Chip8.prototype.cycle = function() {
    // Read the instruction
    var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];

    // Read the variables
    // n - 0x000F
    var n = opcode & 0x000F;
    // nnn - 0x0FFF
    var nnn = opcode & 0x0FFF;
    // kk - 0x00FF
    var kk = opcode & 0x00FF;
    // x - 0x0F00
    var x = opcode & 0x0F00 >> 8;
    // y - 0x00F0
    var y = opcode & 0x00F0 >> 4;

    // Move pc to 2 byte
    this.pc += 2;

    //console.doc({ op: opcode.toString(16), check: (opcode & 0xF000) });

    // Filter the prefix
    switch (opcode & 0xF000) {
        // 0nnn - SYS addr
        case 0x0000:
            switch (opcode) {
                // 00E0 - CLS
                case 0x00E0:
                    console.doc("CLS");
                    this.renderer.clear();
                    for (var i = 0; i < this.display.length; i++) {
                      this.display[i] = 0;
                    }
                    break;
                // 00EE - RET
                case 0x00EE:
                    console.doc("RET");
                    this.pc = this.stack[--this.sp];
                    break;
            }
            break;
        // 1nnn - JP addr
        case 0x1000:
            console.doc("JP " + nnn);
            this.pc = nnn;
            break;
        // 2nnn - CALL addr
        case 0x2000:
            console.doc("CALL " + nnn);
            this.stack[this.sp] = this.pc;
            this.sp++;
            this.pc = nnn;
            break;
        // 3xkk - SE Vx, byte
        case 0x3000:
            console.doc("SE V" + x + ", " + kk);
            if (this.v[x] === kk) {
              this.pc += 2;
            }
            break;
        // 4xkk - SNE Vx, byte
        case 0x4000:
            console.doc("SNE V" + x + ", " + kk);
            if (this.v[x] != kk) {
              this.pc += 2;
            }
            break;
        // 5xy0 - SE Vx, Vy
        case 0x5000:
            console.doc("SE V" + x + ", V" + y);
            if (this.v[x] === this.v[y]) {
                this.pc += 2;
            }
            break;
        // 6xkk - LD Vx, byte
        case 0x6000:
            console.doc("LD V" + x + ", " + kk);
            this.v[x] = kk;
            break;
        // 7xkk - ADDR Vx, byte
        case 0x7000:
            console.doc("ADDR V" + x + ", " + kk);
            var val = kk + this.v[x]
            if (val > 255) {
                val -= 256;
            }
            this.v[x] = val;
            break;
        // 8xy*
        case 0x8000:
            switch (opcode & 0x000F) {
                // 8xy0 - LD Vx, Vy
                case 0x0000:
                    console.doc("LD V" + x + ", V" + y);
                    this.v[x] = this.v[y];
                    break;
                // 8xy1 - OR Vx, Vy
                case 0x0001:
                    console.doc("OR V" + x + ", V" + y);
                    this.v[x] |= this.v[y];
                    break;
                // 8xy2 - AND Vx, Vy
                case 0x0002:
                    console.doc("AND V" + x + ", V" + y);
                    this.v[x] &= this.v[y];
                    break;
                // 8xy3 - XOR Vx, Vy
                case 0x0003:
                    console.doc("XOR V" + x + ", V" + y);
                    this.v[x] ^= this.v[y];
                    break;
                // 8xy4 - ADD Vx, Vy
                case 0x0004:
                    console.doc("AD V" + x + ", V" + y);
                    this.v[x] += this.v[y];
                    this.v[0xF] = +(this.v[x] > 255);
                    if (this.v[x] > 255) {
                      this.v[x] -= 256;
                    }
                    break;
                // 8xy5 - SUB Vx, Vy
                case 0x0005:
                    console.doc("SUB V" + x + ", V" + y);
                    this.v[0xF] = +(this.v[x] > this.v[y]);
                    this.v[x] -= this.v[y];
                    if (this.v[x] < 0) {
                      this.v[x] += 256;
                    }
                    break;
                // 8xy6 - SHR Vx {, Vy}
                case 0x0006:
                    console.doc("SHR V" + x + ", V" + y);
                    this.v[0xF] = this.v[x] & 0x1;
                    this.v[x] >>= 1;
                    break;
                // 8xy7 - SUBN Vx, Vy
                case 0x0007:
                    console.doc("SUBN V" + x + ", V" + y);
                    this.v[0xF] = +(this.v[y] > this.v[x]);
                    this.v[x] = this.v[y] - this.v[x];
                    if (this.v[x] < 0) {
                      this.v[x] += 256;
                    }
                    break;
                // 8xyE - SHL Vx {, Vy}
                case 0x000E:
                    console.doc("SHL V" + x + ", V" + y);
                    this.v[0xF] = +(this.v[x] & 0x80);
                    this.v[x] <<= 1;
                    if (this.v[x] > 255) {
                      this.v[x] -= 256;
                    }
                    break;
            }
            break;
        // 9xy*
        case 0x9000:
            // 9xy0 - SNE Vx, Vy
            console.doc("SNE V" + x + ", V" + y);
            if (this.v[x] != this.v[y]) {
              this.pc += 2;
            }
            break;
        // Annn - LD I, addr
        case 0xA000:
            console.doc("LD I, " + nnn);
            this.i = nnn;
            break;
        // Bnnn - JP V0, addr
        case 0xB000:
            console.doc("JP V0, " + nnn);
            this.pc = nnn + this.v[0];
            break;
        // Cxkk - RND Vx, byte
        case 0xC000:
            console.doc("RND V" + x + ", " + kk);
            this.v[x] = Math.floor(Math.random() * 0xFF) & kk
            break;
        // Dxyn - DRW Vx, Vy, nibble
        case 0xD000:
            console.doc("DRW V" + x + ", V" + y + ", " + n);
            this.v[0xF] = 0;

            var height = opcode & 0x000F;
            var registerX = this.v[x];
            var registerY = this.v[y];
            var x, y, spr;

            for (y = 0; y < height; y++) {
              spr = this.memory[this.i + y];
              for (x = 0; x < 8; x++) {
                if ((spr & 0x80) > 0) {
                  if (this.setPixel(registerX + x, registerY + y)) {
                    this.v[0xF] = 1;
                  }
                }
                spr <<= 1;
              }
              this.drawFlag = true;
            }
            break;
        // Ex**
        case 0xE000:
            switch (opcode & 0x00FF) {
                // Ex9E - SKP Vx
                case 0x009E:
                    console.doc("SKP V" + x);

                    break;
                // ExA1 - SKNP Vx
                case 0x00A1:
                    console.doc("SKNP V" + x);
                    break;
            }
            break;
        // Fx**
        case 0xF000:
            switch (opcode & 0x00FF) {
                // Fx07 - LD Vx, DT
                case 0x0007:
                    console.log("LD V" + x + ", DT");
                    break;
                // Fx0A - LD Vx, K
                case 0x000A:
                    console.log("LD V" + x + ", K");
                    break;
                // Fx15 - LD DT, Vx
                case 0x0015:
                    console.log("LD DT, V" + x);
                    break;
                // Fx18 - LD ST, Vx
                case 0x0018:
                    console.log("LD ST, V" + x);
                    break;
                // Fx1E - ADD I, Vx
                case 0x001E:
                    console.log("ADD I, V" + x);
                    this.i += this.v[x];
                    break;
                // Fx29 - LD F, Vx
                case 0x0029:
                    console.log("LD F, V" + x);
                    this.i = this.v[x] * 5;
                    break;
                // Fx33 - LD B, Vx
                case 0x0033:
                    console.log("LD B, V" + x);
                    var number = this.v[x], i;
                    for (i = 3; i > 0; i--) {
                      this.memory[this.i + i - 1] = parseInt(number % 10);
                      number /= 10;
                    }
                    break;
                // Fx55 - LD [I], Vx
                case 0x0055:
                    console.log("LD [I], V" + x);
                    for (var i = 0; i <= x; i++) {
                      this.memory[this.i + i] = this.v[i];
                    }
                    break;
                // Fx65 - LD Vx, [I]
                case 0x0065:
                    console.log("LD V" + x + ", [I]");
                    for (var i = 0; i <= x; i++) {
                      this.v[i] = this.memory[this.i + i];
                    }
                    break;
            }
            break;
    }
};
