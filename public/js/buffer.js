(function() {
  ItemBuffer = function(maxLength) {
    maxLength = maxLength || 10000;
    var buffer = [];

    var that = Object.create(ItemBuffer.prototype);

    that.buffer = function(item) {
      buffer.push(item);
      while (buffer.length > maxLength) {
        buffer.shift();
      }
    };

    that.replay = function(fn) {
      buffer.forEach(fn);
    };

    Object.freeze(that);
    return that;
  };
})();
