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

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var argv = require('yargs').argv;

var app = express();
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);

const PacketCounter = require("./network/counter");
const PacketSniffer = require("./network/sniffer");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({message: err.message});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({message: err.message});
});

/**
 * This function accepts an HTTP server (created by ./bin/www) and augments
 * it with the SocketIO server and packet sniffer.
 */
const setupSocketIo = http => {
  const io = require("socket.io")(http);

  // Create a packet counter that broadcasts the packet data
  // to all socket listeners every second (1000 ms).
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
  // packets.
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

setupSocketIo(server);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
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
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 
    'pipe ' + addr : 
    'port ' + addr.port;
  console.log('Listening on ' + bind);
}
