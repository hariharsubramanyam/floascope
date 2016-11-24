/*jslint node: true */
"use strict";

// This is the packet sniffing library.
const pcap = require("pcap");

class PacketSniffer {
  constructor(onPacket) {
    this.tcp_tracker = new pcap.TCPTracker();
    this.pcap_session = null;
    this.onPacket = onPacket;
  }

  sniff() {
    if (this.pcap_session !== null) {
      return;
    } else {
      const pcap_session = pcap.createSession("en0", "ip proto \\tcp");

      this.tcp_tracker.on("session", session => {
        console.log("Start of session between: " + session.src_name + " and " + 
          session.dst_name);
        session.on("end", session => {
          console.log("End of session between: " + session.src_name + " and " +
            session.dst_name);
        });
      });

      const tracker = this.tcp_tracker;
      pcap_session.on("packet", raw_packet => {
        var packet = pcap.decode.packet(raw_packet);
        tracker.track_packet(packet);
      });
    }
  }
}

module.exports = new PacketSniffer();
