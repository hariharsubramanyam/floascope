/*jslint node: true */
"use strict";

const dns = require("dns");

class ReverseDns {
  constructor() {
    this.hostNameForIP = new Map();
  }

  /**
   * If there's no hostname, then null will be returned and a lookup will be
   * performed if the name has not already been looked up.
   */
  lookup(ip) {
    if (this.hostNameForIP.has(ip)) {
      return this.hostNameForIP.get(ip);
    } else {
      const that = this;
      dns.reverse(ip, (err, hostnames) => {
        if (hostnames && hostnames.length > 0) {
          that.hostNameForIP.set(ip, hostnames[0]);
        } else {
          that.hostNameForIP.set(ip, null);
        }
      });
      return null;
    }
  }
}

module.exports = ReverseDns;
