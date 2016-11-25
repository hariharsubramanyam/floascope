/*jslint node: true */
"use strict";

const pcap = require("pcap");

/**
 * This class contains logic for delaying packets instead of flushing them
 * all at once. This is useful for playing back .pcap files.
 */
class PacketDelayer {
  /**
   * @param {Boolean} flushImmediately - Whether to flush the packets right
   *  away as soon as we get them. We set this to true for live packet sniffing
   *  and false for replaying .pcap files.
   * @param {Number} ffwd - The fast-forward ratio. If this is set to 2.0, for
   *  example, then the playback speed will be 2x (i.e. delays will be 0.5x).
   * @param {Function} onPacket - The function execute whenever a packet will
   *  be flushed. It should take a single argument (the decoded packet).
   */
  constructor(flushImmediately, ffwd, onPacket) {
    this.flushImmediately = flushImmediately;
    this.ffwd = ffwd;
    this.onPacket = onPacket;

    // This will buffer packets that need to be flushed.
    this.packetBuffer = [];

    // The timestamp (from the packet header) of the last flushed packet.
    this.timestampOfLastPacket = null;

    // The timestamp (measuring using system clock) when we flushed the 
    // last packet.
    this.timestampOfLastFlush = null;

    // The timeout (from setTimeout) that is currently active.
    this.timeout = null;
  }

  /**
   * Requests the flushing of every packet in the packet buffer.
   */
  requestFlush() {
    // If there are no packets in the buffer, then do nothing.
    if (this.packetBuffer.length === 0) {
      return;
    }

    // The current time.
    const now = (new Date()).getTime();

    // Get the timestamp on the first packet in the buffer.
    const packet = this.packetBuffer[0];
    const timestamp = packet.pcap_header.tv_sec * 1000;

    // If this is the very first packet in the buffer, flush it.
    if (this.timestampOfLastPacket === null) {
      // Set the timestamps.
      this.timestampOfLastPacket = timestamp;
      this.timestampOfLastFlush = now;

      // Flush the packet and remove it from the buffer.
      this.onPacket(packet);
      this.packetBuffer.shift();

      // Attempt to flush another packet.
      this.requestFlush();
    } else {
      // What's the difference in timestamp between this packet and the last 
      // one?
      const pktTimeDiff = timestamp - this.timestampOfLastPacket;

      // How much actual time has passed since we flushed the last packet?
      const realTimeDiff = now - this.timestampOfLastFlush;

      // This is the number milliseconds to wait until flushing the next packet.
      const timeToWait = (pktTimeDiff - realTimeDiff) / this.ffwd;

      if (timeToWait <= 0) {
        // If it is already time to flush the packet, flush it, remove it
        // from the buffer, and attempt to flush another packet.
        this.onPacket(packet);
        this.packetBuffer.shift();
        this.requestFlush();
      } else if (this.timeout === null) {
        // If we don't already have a timeout that is active, create one
        // that will flush the packet after timeTowWait milliseconds.
        const that = this;
        this.timeout = setTimeout(() => {
          // Flush the packet, remove it from the buffer, nullify the timeout,
          // and attempt to flush another packet.
          that.onPacket(packet);
          that.packetBuffer.shift();
          that.timeout = null;
          that.requestFlush();
        }, timeToWait);
      }
    }
  }

  /**
   * Add a packet to the delayer.
   */ 
  add(raw_packet) {
    const packet = pcap.decode.packet(raw_packet);
    if (this.flushImmediately) {
      this.onPacket(packet);
    } else {
      this.packetBuffer.push(packet);
      this.requestFlush();
    } 
  } 
}

module.exports = PacketDelayer;
