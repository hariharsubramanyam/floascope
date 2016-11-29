/**
 * This file defines the PrefixFilter class which supports
 * filtering down server websocket data to only the the
 * entries that come from a specified set of IP Prefixes.
 */
(function() {
  PrefixFilter = function() {
    var prefixes = [];
    var that = Object.create(PrefixFilter.prototype);

    that.addPrefix = function(prefix) {
      if (prefixes.indexOf(prefix) === -1) {
        prefixes.push(prefix);
      }
    };

    that.removePrefix = function(prefix) {
      index = prefixes.indexOf(prefix);
      if (index > - 1) {
        prefixes.splice(index, 1);
      }
    };

    that.passesFilter = function(ip) {
      return prefixes.filter(function(prefix) {
        return ip.startsWith(prefix);
      }).length === 0;
    };

    that.prefixes = function() {
      return prefixes.map(function(p) {
        return p;
      });
    };

    Object.freeze(that);
    return that;
  };
})();
