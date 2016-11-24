/*jslint node: true */
"use strict";

class PacketCounter {
  constructor(interval) {
    this.sessionMap = new Map();

    const that = this;
    const tick = () => {
      that.tick();
    };
    setInterval(tick, interval);
  }

  tick() {
    for (var entry of this.sessionMap.entries()) {
      const key = entry[0];
      const value = entry[1];
      console.log(key + " = " + value.recv_bytes_payload);
    }
  }

  key(session) {
    return session.src_name + "-" + session.dst_name;
  }

  updateSession(session) {
    const data = this.sessionMap.get(this.key(session));
    data.recv_bytes_payload = session.recv_bytes_payload;
    this.sessionMap.set(this.key(session), data);
  }

  addSession(session) {
    this.sessionMap.set(this.key(session), {
      "recv_bytes_payload": 0
    });
  }

  removeSession(session) {
    this.sessionMap.delete(this.key(session));
  }
}

module.exports = PacketCounter;
