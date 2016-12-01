/**
 * This file defines the PrefixUI, which is a textbox+button that allows entry
 * of prefixes. The entered prefixes are entered in a list with a remove button
 * for each one.
 *
 * The PrefixUI requires callback to execute when the prefixes are changed.
 * The callback should accept an argument of type PrefixFilter.
 *
 * Prefix UI also requires the ID of a div (without the "#") to put its UI into.
 */
(function() {
  PrefixUI = function(divId, callback) {
    var that = Object.create(PrefixUI.prototype);
    callback = callback || function() {};

    // Get jQuery object associated with div.
    var divJq = $("#" + divId);

    // Populate the input fields.
    var inputHtml = Handlebars.templates.prefix_ui_input();
    divJq.html(inputHtml);

    // Create the PrefixFilter.
    var filter = PrefixFilter();

    // Populate the prefix list.
    var populateList = function() {
      divJq.find(".prefix-ui-list").remove();
      var prefixes = filter.prefixes().map(function(p) {
        return {
          "prefix": p
        };
      });
      var listHtml = Handlebars.templates.prefix_ui_list({
        "prefixes": prefixes
      });
      divJq.append(listHtml);
    };
    populateList();

    // Handler for creating a new prefix.
    divJq.on("click", ".prefix-ui-button", function() {
      var prefix = $(".prefix-ui-input").val();
      filter.addPrefix(prefix);
      populateList();
      callback(filter);
    });

    // Handler for removing prefix.
    divJq.on("click", ".prefix-ui-remove", function() {
      var prefix = "" + $(this).data("prefix");
      filter.removePrefix(prefix);
      populateList();
      callback(filter);
    });

    that.filter = function() {
      return filter;
    };

    Object.freeze(that);
    return that;
  };
})();
