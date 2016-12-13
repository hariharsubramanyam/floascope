(function() {
  Purger = function() {
    var that = Object.create(Purger.prototype);

    var lastUpdateForKey = {};

    that.update = function(key) {
      lastUpdateForKey[key] = (new Date()).getTime();
    };

    that.purge = function(olderThanSeconds) {
      var keys = Object.keys(lastUpdateForKey);
      var olderThanMilliseconds = olderThanSeconds * 1000;
      var now = (new Date()).getTime();
      var purgeKeys = [];
      keys.forEach(function(key) {
        if (now - lastUpdateForKey[key] > olderThanMilliseconds) {
          delete lastUpdateForKey[key];
          purgeKeys.push(key);
        }
      });
      return purgeKeys;
    };

    that.removeOneIf = function(arr, fn) {
      var removeAt = -1;
      for (var i = 0; i < arr.length; i++) {
        if (fn(arr[i])) {
          removeAt = i;
          break;
        }
      }
      if (removeAt > -1) {
        arr.splice(removeAt, 1);
      }
    };

    Object.freeze(that);
    return that;
  };
})();
