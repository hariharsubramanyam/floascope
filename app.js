#!/usr/bin/env node

/**
 * Execute this as follows:
 *
 * node app.js --pcap <path_to_pcap_file> --ffwd <fast_forward_ratio> --rnds 
 *
 * --pcap [optional]: The path to the .pcap file that will be used for playback.
 * --ffwd [optional]: The fast-forward ratio. For example, if you set this to be
 *  2.0, then the playback will happen at 2x speed. This field only makes sense
 *  if you also set --pcap.
 * --rnds [optiona]: Whether the server should perform reverse DNS lookups. If
 *  you type --rdns, then reverse DNS lookups will be performed. If you don't
 *  type --rnds, then reverse DNS lookups will NOT be performed.
 */

/*
 * Imports
 */

// A Node.js web framework.
const express = require('express');

// Alllows concatenation of path strings (used for constructing path to public
// files).
const path = require('path');

// Logs requests to console.
const logger = require('morgan');

// Parses cookies in requests.
const cookieParser = require('cookie-parser');

// Parses HTTP body.
const bodyParser = require('body-parser');

// Allows wrapping Express app with HTTP Server (needed for SocketIO).
const http = require('http');

// Parser command line args.
const argv = require('yargs').argv;

// Allows websocket communication.
const SocketIO = require("socket.io");

// Computes statistics based on packet data.
const PacketCounter = require("./network/counter");

// Produces packet data by sniffing.
const PacketSniffer = require("./network/sniffer");

/*
 * Express app setup
 */
const app = express();

// TODO: Allow listening on ports other than 3000.
const port = 3000;
app.set('port', port);

// Set up middleware. For each request, we do the following (in order):
// Log the request, parse JSON in the body, parse URL-encoded data in the body,
// parse the cookies, attempt to serve a static (e.g. CSS, HTML, JS) file if
// it is requested.
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Handle errors.
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({message: err.message});
});

/**
 * Set up Socket IO.
 * @param {HTTPServer} server - This is an HTTP server object that is produced
 * by wrapping an Express app with http.createServer(app).
 */
const setupSocketIo = server => {
  // Create the websocket server by wrapping the HTTP server.
  const io = SocketIO(server);

  // Create a packet counter that broadcasts the packet data
  // to all socket listeners every second (1000 ms) on the vis_data channel.
  // The argv.rdns parameter indicates whether IPs should be converted to 
  // hostnames via reverse DNS.
  const counter = new PacketCounter(
    1000, 
    argv.rdns,
    (result) => io.emit("vis_data", result)
  );

  // Create a packet sniffer.
  const sniffer = new PacketSniffer();

  // Launch the packet sniffer. It will send its packets to the packet 
  // counter above. If a filepath has been given (argv.pcap), then we
  // will read from that pcap file. Otherwise, we will start sniffing actual
  // packets. The argv.ffwd is the playback rate, which defaults to 1.0.
  sniffer.sniff(
    counter,
    argv.ffwd || 1.0,
    argv.pcap
  );

  // This is not really useful right now, but it will later allows us to
  // send data from the clients to the server.
  io.on('connection', socket => { 
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    socket.on('vis_request', function(msg){
      console.log('message: ' + JSON.stringify(msg));
    });
  });

};

/*
 * Launch server
 */

// Wrap the Express app with an HTTP server and launch the SocketIO server.
const server = http.createServer(app);
setupSocketIo(server);

// Attempt to launch server.
server.listen(port);

// Handle failed server launch.
server.on('error', error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 
  'Pipe ' + port : 
  'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle successful launch.
server.on('listening', () => {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 
    'pipe ' + addr : 
    'port ' + addr.port;
  console.log('Listening on ' + bind);
});
