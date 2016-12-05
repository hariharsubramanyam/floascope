/*jslint node: true */
"use strict";

// This is the packet sniffing library.
const pcap = require("pcap");

// When reading packets from a file, we can't play them back all at once, we
// need to delay them according to their timestamps. This contains the logic
// for delaying packets.
const PacketDelayer = require("./delayer");

// This is a custom version of node_pcap's TCPTracker, which accepts sniffed
// packets and computes useful statistics on TCP sessions.
const TCPTracker = require("./tcp_tracker").TCPTracker;

/**
 * This is the packet sniffer. It can either sniff actual packets or sniff
 * packets from a .pcap file.
 *
 * Currently, it only works for TCP sessions.
 */
class PacketSniffer {
  constructor() {
    this.tcp_tracker = new TCPTracker();
  }

  /**
   * Start sniffing for packets. At a high level, we use the following flow:
   *
   * packer => delayer => TCP tracker => counter => broadcast to clients
   *
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

      // Update the session whenever we get new data.
      session.on("data recv", session => counter.updateSession(session));
      session.on("data send", session => counter.updateSession(session));

      // On retransmit, notify that the counter that a retransmissing (of
      // the given byte length) has occured for the given session.
      session.on("retransmit", (session, sendOrRecv, endOfData, len) => {
        counter.retransmit(session, len, sendOrRecv);
      });

      // Purge the session when it closes.
      session.on("end", session => {
        counter.removeSession(session);
        console.log("End of session between: " + session.src_name + " and " +
          session.dst_name);
      });
    });

    // We need to set up a packet delayer that we send our packets to after
    // we sniff them. For live packet sniffing, the delay will simply let the
    // pass through right away. For playing back packets from a file, the
    // delayer will examine the timestamp and desired playback rate (ffwd) and
    // will decide when to actually let the packet pass through.
    const tracker = this.tcp_tracker;
    const delayer = new PacketDelayer(
      path ? false : true, // Whether the delayer should actually delay packets.
      ffwd, // The playback rate.
      packet => { // The callback to execute when the delayer emits a packet.
        try {
          // We just feed our packet to the TCP Tracker.
          tracker.track_packet(packet);
        } catch(err) {
          console.log(err);
        }
      }
    );

    // Whenever we get a new packet, feed it to the delayer.
    pcap_session.on("packet", raw_packet => delayer.add(raw_packet));
  }
}

module.exports = PacketSniffer;
