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
    this.lastSessionMap = new Map();

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
    const result = [];

    this.sessionMap.forEach( (value, key, map) => {
      //var value = this.sessionMap[key];
      var lastValue = this.lastSessionMap[key];

      value.time_stamp = (new Date()).getTime();
      value.src_host = this.rdns.lookup(this.stripPort(value.src));
      value.dst_host = this.rdns.lookup(this.stripPort(value.dst));

      value.num_bytes_inst = lastValue ? value.num_bytes - lastValue.num_bytes : value.num_bytes;
      value.num_send_bytes_inst = lastValue ? value.num_send_bytes - lastValue.num_send_bytes : value.num_send_bytes;
      value.num_recv_bytes_inst = lastValue ? value.num_recv_bytes - lastValue.num_recv_bytes : value.num_recv_bytes;
      value.num_retrans_bytes_inst = lastValue ? value.retransmit_bytes - lastValue.retransmit_bytes : value.retransmit_bytes;
      value.num_send_retrans_bytes_inst = lastValue ? value.send_retransmit_bytes - lastValue.send_retransmit_bytes : value.send_retransmit_bytes;
      value.num_recv_retrans_bytes_inst = lastValue ? value.recv_retransmit_bytes - lastValue.recv_retransmit_bytes : value.recv_retransmit_bytes;


      if (value.num_bytes > 0) {
        result.push(value);
      }
    })
    this.lastSessionMap = new Map(this.sessionMap);
    this.onTick(result);

    //this.sessionMap.forEach(v => v.num_bytes = 0);
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
// //        Calculate instantaneous values based on last interval information
        // data.num_bytes_inst = session.send_bytes_payload +
        //   session.recv_bytes_payload - data.num_bytes;
        // data.num_recv_bytes_inst = session.recv_bytes_payload - data.num_recv_bytes;
        // data.num_send_bytes_inst = session.send_bytes_payload - data.num_send_bytes;

        data.num_send_bytes = session.send_bytes_payload;
        data.num_recv_bytes = session.recv_bytes_payload;
        data.num_bytes = session.send_bytes_payload + session.recv_bytes_payload;
        return data;
      },
      () => {
        return that.extractData(session);
      }
    );
  }

  retransmit(session, len, sendOrRecv) {
    const that = this;
    console.log(sendOrRecv);
    this.upsert(
      session,
      data => {
        if (sendOrRecv === "send"){
          data.send_retransmit_bytes += len;
        }
        else{
          data.recv_retransmit_bytes += len;
        }

        data.num_retransmits++;
        data.retransmit_bytes += len;
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
      "key": this.key(session),
      "src": session.src_name,
      "dst": session.dst_name,
      "src_host": null,
      "dst_host": null,
      "num_bytes": session.recv_bytes_payload + session.send_bytes_payload,
      "num_recv_bytes": session.recv_bytes_payload,
      "num_send_bytes": session.send_bytes_payload,

      "num_bytes_inst" : 0,
      "num_send_bytes_inst" : 0,
      "num_recv_bytes_inst" : 0,

      "num_retrans_bytes_inst" : 0,
      "num_send_retrans_bytes_inst" : 0,
      "num_recv_retrans_bytes_inst" : 0,

      "interval": this.interval,
      "num_retransmits": 0,
      "retransmit_bytes": 0,
      "send_retransmit_bytes" : 0,
      "recv_retransmit_bytes" : 0
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
