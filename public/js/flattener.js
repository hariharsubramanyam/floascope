/**
 * This file defines the Flatten function. It accepts
 * array of session arguments like those sent from the server.
 * It will then strip port numbers and merge sessions accordingly.
 * For example, if the array is:
 * [
 *  {src: "A:1", dst: "B:2", num_bytes_inst: 3},
 *  {src: "A:2", dst: "B:3", num_bytes_inst: 4}
 * ]
 *
 * Then the returned array is:
 * [
 *  {src: "A", dst: "B", num_bytes_inst: 7}
 * ]
 */
(function() {
  /**
   * Given a string of the form "IP:port", this function
   * returns the IP address. If the string does not have
   * a colon character (":"), then the original string 
   * will be returned.
   */
  var stripPort = function(ipAndPort) {
    var col = ipAndPort.indexOf(":");
    if (col >= 0) {
      return ipAndPort.substring(0, col);
    } else {
      return ipAndPort;
    }
  };

  /**
   * Creates a key (to be used in an Object) given a source and destination IP.
   */
  var key = function(src, dst) {
    if (src > dst) {
      var tmp = dst;
      dst = src;
      src = tmp;
    }
    return src + "-" + dst;
  };

  /**
   * This performs the actual flattening. Given existing session data 
   * (currentData), update it so that it reflects the new session data 
   * (newData).
   */
  var update = function(currentData, newData) {
    currentData.num_bytes_inst += newData.num_bytes_inst;
    currentData.num_recv_bytes += newData.num_recv_bytes_inst;
    currentData.num_send_bytes += newData.num_send_bytes_inst;
    currentData.num_retransmits += newData.num_retransmits;
    currentData.retransmit_bytes += newData.num_retrans_bytes_inst;
  };

  Flatten = function(data) {
    // Will map from "srcIP-dstIP" to the data (an Object) for that session.
    var map = {};

    // Update the map with all of the session data.
    data.forEach(function(session) {
      var src = stripPort(session.src);
      var dst = stripPort(session.dst);
      if (map.hasOwnProperty(key(src, dst))) {
        // Update the entry if it already exists.
        update(map[key(src, dst)], session);
      } else {
        // Create a new entry if the session is not stored.
        map[key(src, dst)] = session;
      }
    });

    return Object.keys(map).map(function(key) {
      var obj = map[key];
      obj.src = stripPort(obj.src);
      obj.dst = stripPort(obj.dst);
      return map[key];
    });
  };
})();
