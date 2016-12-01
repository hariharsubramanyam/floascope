/*jslint node: true */
"use strict";

// This is the packet sniffing library.
const pcap = require("pcap");

const PacketDelayer = require("./delayer");
const TCPTracker = require("./tcp_tracker").TCPTracker;

/**
 * This is the packet sniffer. It can either sniff actual packets or sniff
 * packets from a .pcap file.
 *
 * Currently, it only sniffs TCP sessions.
 */
class PacketSniffer {
  constructor() {
    // This will clean raw packets and extract info about TCP sessions.
    this.tcp_tracker = new TCPTracker();
  }

  /**
   * Start sniffing for packets.
   * @param {PacketCounter} counter - This will receive information from the
   *  Sniffer.
   * @param {Number} ffwd - The fast-forward ratio. If this is set to 2.0, for
   *  example, then the playback speed will be 2x (i.e. delays will be 0.5x).
   * @param {String} path - The path to the .pcap file. If empty, the sniffer
   *  will sniff actual packets.
   */
  sniff(counter, ffwd, path) {
    // Set up the session.
    const pcap_session = (path) ? 
      pcap.createOfflineSession(path, "") : 
      pcap.createSession("", "ip proto \\tcp");

    // Set up the TCP tracker.
    this.tcp_tracker.on("session", session => {
      // Indicate that a new session has occured.
      counter.updateSession(session);
      console.log("Start of session between: " + session.src_name + " and " + 
        session.dst_name);

      session.on("data recv", session => {
        // Update the session whenever we get new data.
        counter.updateSession(session);
      });

      session.on("retransmit", session => {
        // On retransmit, update the number of retransmissions.
        counter.retransmit(session);
      });

      session.on("end", session => {
        // Purge the session when it closes.
        counter.removeSession(session);
        console.log("End of session between: " + session.src_name + " and " +
          session.dst_name);
      });
    });

    // Every time we read a packet, decode it and feed it to the TCP tracker.
    const tracker = this.tcp_tracker;
    const delayer = new PacketDelayer(
      path ? false : true,
      ffwd,
      packet => {
        try {
          tracker.track_packet(packet);
        } catch(err) {
          console.log(err);
        }
      }
    );
    pcap_session.on("packet", raw_packet => delayer.add(raw_packet));
  }
}

module.exports = PacketSniffer;
