/*jslint node: true */
"use strict";

class PacketCounter {
  constructor(interval, onTick) {
    this.onTick = onTick;
    this.interval = interval;
    this.sessionMap = new Map();

    const that = this;
    const tick = () => {
      that.tick();
    };
    setInterval(tick, interval);
  }

  tick() {
    const result = {};
    for (var value of this.sessionMap.values()) {
      result[value.src] = value;
    }
    this.onTick(result);
  }

  key(session) {
    return session.src_name + "-" + session.dst_name;
  }

  updateSession(session) {
    this.sessionMap.set(this.key(session), this.extractData(session));
  }

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

  removeSession(session) {
    this.sessionMap.delete(this.key(session));
  }
}

module.exports = PacketCounter;
