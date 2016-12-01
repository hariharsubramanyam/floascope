/*jslint node: true */
"use strict";

const ReverseDns = require("./reverse_dns");

/**
 * This class is responsible for receiving packet data, extracting the fields
 * of interest, and calling a function to send that data out every interval
 * milliseconds.
 */
class PacketCounter {
  /**
   * @param {Number} interval - 
   *  Call the onTick function every interval milliseconds.
   * @param {Boolean} shouldUseReverseDns -
   *  Whether the server should perform reverse DNS lookups of IP addresses.
   * @param {Function} onTick -
   *  Executed every second with a map from source "IP:port" to the data
   *  associated with that TCP session.
   */
  constructor(interval, shouldUseReverseDns, onTick) {
    // If we shouldn't do reverse DNS, just replace the ReverseDNS with a
    // dummy object with a lookup function that just returns null.
    this.rdns = shouldUseReverseDns ? new ReverseDns() : {
      "lookup": () => null
    };

    this.onTick = onTick;
    this.interval = interval;

    // This maps from "source IP:port - dest IP:port" to the data for that flow.
    this.sessionMap = new Map();

    // Execute the tick function every interval.
    const that = this;
    setInterval(() => that.tick(), interval);
  }

  /**
   * Simply returns the interval time, in milliseconds.
   */
  interval() {
    return this.interval;
  }

  /**
   * Executed every interval milliseconds.
   */
  tick() {
    // Extract data for every entry in the session map and call the onTick
    // function with the result.
    const result = {};
    for (var value of this.sessionMap.values()) {
      value.time_stamp = (new Date()).getTime();
      value.src_host = this.rdns.lookup(this.stripPort(value.src));
      value.dst_host = this.rdns.lookup(this.stripPort(value.dst));
      if (value.num_bytes > 0) {
        result[value.src] = value;
      }
    }

    this.onTick(result);

    this.sessionMap.forEach(v => v.num_bytes = 0);
  }

  stripPort(ipAndPort) {
    const col = ipAndPort.indexOf(":");
    if (col === -1) {
      return ipAndPort;
    } else {
      return ipAndPort.substring(0, col);
    }
  }

  /**
   * Generates a unique key for a session.
   * It simply returns: srcIP:srcPort-dstIP:dstPort.
   */
  key(session) {
    return session.src_name + "-" + session.dst_name;
  }

  upsert(session, updateFn, insertFn) {
    const key = this.key(session);
    if (this.sessionMap.has(key)) {
      const newData = updateFn(this.sessionMap.get(key));
      this.sessionMap.set(key, newData);
    } else {
      this.sessionMap.set(key, insertFn());
    }
  }

  /**
   * Update the session map with the content of this session.
   * The session comes from the PacketSniffer.
   */
  updateSession(session) {
    const that = this;
    this.upsert(
      session, 
      data => {
        data.num_bytes = session.recv_bytes_payload;
        return data;
      },
      () => {
        return that.extractData(session);
      }
    );
  }

  retransmit(session, len) {
    const that = this;
    this.upsert(
      session,
      data => {
        data.num_retransmits++;
        return data;
      },
      () => {
        const data = that.extractData(session);
        data.num_retransmits++;
        data.retransmit_bytes += len;
        return data;
      }
    );
  }

  extractData(session) {
    return {
      "src": session.src_name,
      "dst": session.dst_name,
      "src_host": null,
      "dst_host": null,
      "num_bytes": session.recv_bytes_payload,
      "interval": this.interval,
      "num_retransmits": 0,
      "retransmit_bytes": 0
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
