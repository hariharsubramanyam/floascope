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

    var divNode = document.getElementById(divId);

    // Populate the input fields.
    var inputHtml = Handlebars.templates.interval_ui_input();
    divNode.innerHTML = inputHtml;

    // Get handles to the input fields.
    var intervalButton = 
      document.getElementsByClassName("interval-ui-button")[0];
    var intervalInput =
      document.getElementsByClassName("interval-ui-input")[0];
    
    // Set the handler.
    intervalButton.addEventListener("click", function() {
      var interval = parseFloat(intervalInput.value);
      websocketHelper.sendUpdateIntervalMessage(parseFloat(interval));
      alert("Set interval to " + interval + " ms");
    });

    Object.freeze(that);
    return that;
  };
})();
