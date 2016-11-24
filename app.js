var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
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
    (result) => io.emit("vis_data", result)
  );

  // Create a packet sniffer.
  const sniffer = new PacketSniffer();

  // Launch the packet sniffer. It will send its packets to the packet 
  // counter above. If a filepath has been given (process.argv[2]), then we
  // will read from that pcap file. Otherwise, we will start sniffing actual
  // packets.
  sniffer.sniff(
    counter,
    (process.argv.length >= 3) ? process.argv[2] : undefined
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

module.exports = {app, setupSocketIo};
