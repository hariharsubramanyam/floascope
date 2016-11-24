/**
 * This depends on the SocketIO library, so add the following to your HTML
 * page:
 * <script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
 *
 * The module defined here can be found in the global variable WebsocketHelper.
 */
(function() {
  /**
   * Connect to the websocket server and return a WebsocketHelper.
   *
   * @param {String} serverUrl - The URL of the websocket server.
   * @param {Array[Function]} messageHandlers - The array of functions to
   *  execute, as fn(messageJSON), when a message arrives.
   * @param {Array[Function]} connectHandlers - The array of functions to
   *  execute, as fn(), when the client connects (or re-connects) to the
   *  websocket server.
   * @param {Array[Function]} disconnectHandlers - The array of functions to
   *  execute, as fn(), when the client disconnects from the websocket server.
   */
  WebsocketHelper = function(
    messageHandlers,
    connectHandlers,
    disconnectHandlers
  ) {
    // Replace each arg with [] if it's undefined.
    connectHandlers = connectHandlers || [];
    messageHandlers = messageHandlers || [];
    disconnectHandlers = disconnectHandlers || [];

    // Execute every element of arr with the argument arg.
    var notify = function(arr, arg) {
      arr.forEach(function(han) {
        han(arg);
      });
    };

    // Attempt connection to server.
    var socket = io();

    socket.on("connect", function() {
      notify(connectHandlers);
    });

    socket.on("vis_data", function(data) {
      notify(messageHandlers, data);
    });

    socket.on("disconnect", function() {
      notify(disconnectHandlers);
    });

    var that = Object.create(WebsocketHelper.prototype);

    /**
     * Send a message to the server.
     * @param {Object} message - The JSON data to send to the server.
     */
    that.sendMessage = function(message) {
      socket.emit("vis_request", message);
    };

    Object.freeze(that);
    return that;
  };
})();

