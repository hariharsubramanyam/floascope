/**
 * This depends on the Google Charts library, so add the following script tag
 * to your HTML page.
 * <script src="https://www.gstatic.com/charts/loader.js"></script>
 * 
 * The module defined here can be found in the global variable Sankey, which is
 * documented below.
 */
(function() {
  // Load the Sankey chart.
  google.charts.load('current', {'packages':['sankey']});

  /**
   * Create a Sankey diagram.
   * @param {String} divId - The ID of the div that should contain the Sankey
   *  diagram.
   * @param {Array[Array of form [String, String, Number]]} data - The data
   *  should be given as a matrix (an Array of Arrays). Each inner Array 
   *  represents a row, and each row has three columns. The first column is
   *  a String representing the name of the source, the second column is a 
   *  String representing the destination, and the third column is the weight
   *  of the flow from the source to destination.
   * @param {Object} options - Any other options to apply to the Sankey diagram,
   *  see https://developers.google.com/chart/interactive/docs/gallery/sankey 
   *  for more information.
   * @param {Function} callback - To be executed after chart is drawn. It will
   *  be given the returned Sankey object as an argument.
   */
  Sankey = function(divId, data, options, callback) {
    google.charts.setOnLoadCallback(function() {
      // Default options if not defined.
      options = options || {};

      // Default width.
      options.width = options.width || 600;

      // Default iterations (ensures that order of flows doesn't change).
      options.sankey = options.sankey || {};
      options.sankey.iterations = options.sankey.iterations || 0;

      // Create data.
      var dataTable = new google.visualization.DataTable();
      dataTable.addColumn("string", "From");
      dataTable.addColumn("string", "To");
      dataTable.addColumn("number", "Weight");
      dataTable.addRows(data);

      // Create a mapping from (From, To) to row number.
      var rowForFlow = {};
      var constructKey = function(row) {
        return row[0] + ", " + row[1];
      };
      data.forEach(function(row, rowIndex) {
        var key = constructKey(row);
        rowForFlow[key] = rowIndex;
      });

      // Draw the chart.
      var divNode = document.getElementById(divId);
      var chart = new google.visualization.Sankey(divNode);
      chart.draw(dataTable, options);

      // Create an object that can be used to manipulate the diagram.
      var that = Object.create(Sankey.prototype);

      /**
       * Redraw the chart.
       */
      that.redraw = function() {
        chart.draw(dataTable, options);
      };

      /**
       * Overwrite the options dictionary passed to the Sankey diagram and
       * redraw the chart.
       * @param {Object} newOptions - The new options.
       */
      that.setOptions = function(newOptions) {
        options = newOptions;
        that.redraw();
      };

      /**
       * Throws away the data used for the chart and redraws using this new
       * data.
       * @param {Array} newData - Same structure as the constructor argument for
       *  Sankey.
       */
      that.resetData = function(newData) {
        dataTable = new google.visualization.DataTable();
        dataTable.addColumn("string", "From");
        dataTable.addColumn("string", "To");
        dataTable.addColumn("number", "Weight");
        dataTable.addRows(newData);
        that.redraw();
      };

      /**
       * Adds the given data to the chart and redraws it. If any (From, To) pairs
       * here are also in the current chart data, then they will be overwritten.
       * @param {Array} additionalData - Same structure as the constructor argument
       *  for Sankey.
       */
      that.updateData = function(additionalData) {
        // Add the rows that aren't being overwritten.
        dataTable.addRows(additionalData.filter(function(row) {
          return rowForFlow[constructKey(row)] === undefined;
        }));


        // Overwrite already existing rows.
        additionalData.filter(function(row) {
          return rowForFlow[constructKey(row)] !== undefined;
        }).map(function(row) {
          return [rowForFlow[constructKey(row)], row[2]];
        }).map(function(indexWeightPair) {
          dataTable.setCell(indexWeightPair[0], 2, indexWeightPair[1]);
        });
        that.redraw();
      };

      // Freeze the object and return it.
      Object.freeze(that);

      callback(that);
    });
  };
})();

