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

  sniff(counter, path) {
    if (this.pcap_session !== null) {
      return;
    } else {
      const pcap_session = (path) ? 
        pcap.createOfflineSession(path, "") : 
        pcap.createSession("", "ip proto \\tcp");

      this.tcp_tracker.on("session", session => {
        counter.updateSession(session);
        console.log("Start of session between: " + session.src_name + " and " + 
          session.dst_name);

        session.on("data recv", session => {
          counter.updateSession(session);
        });

        session.on("end", session => {
          counter.removeSession(session);
          console.log("End of session between: " + session.src_name + " and " +
            session.dst_name);
        });
      });

      const tracker = this.tcp_tracker;
      pcap_session.on("packet", raw_packet => {
        try {
          var packet = pcap.decode.packet(raw_packet);
          tracker.track_packet(packet);
        } catch(err) {
          console.log(err);
        }
      });
    }
  }
}

module.exports = new PacketSniffer();
