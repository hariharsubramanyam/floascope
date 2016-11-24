/*jslint node: true */
"use strict";

/**
 * This class is responsible for receiving packet data, extracting the fields
 * of interest, and calling a function to send that data out every interval
 * milliseconds.
 */
class PacketCounter {
  /**
   * @param {Number} interval - 
   *  Call the onTick function every interval milliseconds.
   * @param {Function} onTick -
   *  Executed every second with a map from source "IP:port" to the data
   *  associated with that TCP session (see extractData).
   */
  constructor(interval, onTick) {
    this.onTick = onTick;
    this.interval = interval;

    // This maps from "source IP:port - dest IP:port" to the data for that flow.
    this.sessionMap = new Map();

    // Execute the tick function every interval.
    const that = this;
    setInterval(() => that.tick, interval);
  }

  /**
   * Executed every interval milliseconds.
   */
  tick() {
    // Extract data for every entry in the session map and call the onTick
    // function with the result.
    const result = {};
    for (var value of this.sessionMap.values()) {
      result[value.src] = value;
    }
    this.onTick(result);
  }

  /**
   * Generates a unique key for a session.
   * It simply returns: srcIP:srcPort-dstIP:dstPort.
   */
  key(session) {
    return session.src_name + "-" + session.dst_name;
  }

  /**
   * Update the session map with the content of this session.
   * The session comes from the PacketSniffer.
   */
  updateSession(session) {
    this.sessionMap.set(this.key(session), this.extractData(session));
  }

  /**
   * Extract the data we care about from a given session.
   */
  extractData(session) {
    const now = new Date();
    return {
      "src": session.src_name,
      "dst": session.dst_name,
      "time_stamp": now.getTime(),
      "num_packets": session.recv_bytes_payload,
      "interval": this.interval
    };
  }

  /**
   * Remove a session from the map.
   */
  removeSession(session) {
    this.sessionMap.delete(this.key(session));
  }
}

module.exports = PacketCounter;
