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
   *  Executed every interval milliseconds. It is executed with one argument,
   *  which is an array of objects (each object represents a TCP connection).
   *  To see what the objects look like, see the extractData() function in
   *  this class.
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
    const result = [];

    const now = (new Date()).getTime();
    this.sessionMap.forEach( (value, key, map) => {
      value.time_stamp = now;
      value.src_host = this.rdns.lookup(this.stripPort(value.src));
      value.dst_host = this.rdns.lookup(this.stripPort(value.dst));

      value.num_retrans_bytes_inst = value.num_send_retrans_bytes_inst +
        value.num_recv_retrans_bytes_inst;

      value.num_bytes_inst = value.num_send_bytes_inst +
        value.num_recv_bytes_inst;

      if (value.num_bytes_inst > 0) {
        result.push(value);
      }
    });

    this.onTick(result);
    this.clear();

    //this.sessionMap.forEach(v => v.num_bytes = 0);
  }

  clear() {
    const that = this;
    this.sessionMap.forEach( (value, key) => {
      that.sessionMap.set(key, that.extractData(value.session));
    });
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
    const src = (session.src_name <= session.dst_name) ? session.src_name :
      session.dst_name;
    const dst = (session.src_name <= session.dst_name) ? session.dst_name :
      session.src_name;
    return src + "-" + dst;
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
  updateSession(session, dataLength, sendOrRecv) {
    const data = this.extractData(session);

    const updateData = (data) => {
      const isSend = (sendOrRecv === "send");
      data.num_send_bytes_inst += (isSend) ? dataLength : 0;
      data.num_recv_bytes_inst += (isSend) ? 0 : dataLength;
      return data;
    };

    this.upsert(session, updateData, () => updateData(data));
  }

  retransmit(session, dataLength, sendOrRecv) {
    const data = this.extractData(session);

    const updateData = (data) => {
      const isSend = (sendOrRecv === "send");
      data.num_send_retrans_bytes_inst += isSend ? dataLength : 0;
      data.num_recv_retrans_bytes_inst += isSend ? 0 : dataLength;
      data.num_retransmits++;
      return data;
    };

    this.upsert(session, updateData, () => updateData(data));
  }

  extractData(session) {
    return {
      // The unique key identifying this TCP connection.
      "key": this.key(session),

      // The source IP:port address of the connection. The source address appears
      // lexicographically before the destination address.
      "src": (session.src_name <= session.dst_name) ? session.src_name : session.dst_name,

      // The destination IP:port address of the connection. The destination address
      // appears lexicographically before the destination address.
      "dst": (session.src_name < session.dst_name) ? session.dst_name : session.src_name,

      // The hostname (via reverse DNS lookup) of the source address. If the hostname
      // is unknown, then this will be null.
      "src_host": null,

      // The hostname (via reverse DNS lookup) of the destination address. If the hostname
      // is unknown, then this will be null.
      "dst_host": null,

      // The total number of bytes exchanged in the connection in the last interval.
      "num_bytes_inst" : 0,

      // The total number of bytes send by the src in the last interval.
      "num_send_bytes_inst" : 0,

      // The total number of bytes received by the src in the last interval.
      "num_recv_bytes_inst" : 0,

      // The total number of bytes retransmitted in the last interval.
      "num_retrans_bytes_inst" : 0,

      // The total number of bytes retransmitted by the src in the last interval.
      "num_send_retrans_bytes_inst" : 0,

      // The total number of bytes retransmitted by the dst in the last interval.
      "num_recv_retrans_bytes_inst" : 0,

      // The number of milliseconds over which the above values are computed
      // and sent to the client.
      "interval": this.interval,

      // The number of retransmissions that occured within the last interval.
      "num_retransmits": 0,

      // The underlying TCPSession (which should be called a TCP connection, if
      // we want to be accurate with name).
      "session": session
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
