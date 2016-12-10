/**
 * This files defines the IntervalUI, which is a textbox+button
 * that allows the user to change the interval at which the
 * server updates data. 
 *
 * The IntervalUI requires an argument of type WebSocketHelper, which it uses
 * to send an "updateInterval" message to the server.
 *
 * IntervalUI also requires the ID of a div (without the "#") to put its UI into.
 */
(function() {
  IntervalUI = function(divId, websocketHelper) {
    var that = Object.create(IntervalUI.prototype);

    // Get jQuery object associated with div.
    var divJq = $("#" + divId);

    // Populate the input fields.
    var inputHtml = Handlebars.templates.interval_ui_input();
    divJq.html(inputHtml);

    // Set the handler.
    divJq.on("click", ".interval-ui-button", function() {
      var interval = $(".interval-ui-input").val();
      websocketHelper.sendUpdateIntervalMessage(parseFloat(interval));
      alert("Set interval to " + interval + " ms");
    });

    Object.freeze(that);
    return that;
  };
})();
