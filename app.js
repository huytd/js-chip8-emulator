window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Chip8 = function() {
    this.pc = 0;
    this.memory = new Uint8Array(new ArrayBuffer(0x1000));
    this.reset();
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

    this.pc = 0x200;
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

Chip8.prototype.cycle = function() {
    var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
    var x = (opcode & 0x0F00) >> 8;
    var y = (opcode & 0x00F0) >> 4;

    this.pc += 2;

    console.log({ op: opcode, x: x, y: y, opHex: opcode.toString(16) });
};
