(function() {
  PausePlayUI = function(divId) {
    var that = Object.create(PausePlayUI.prototype);

    var divNode = document.getElementById(divId);

    var html = Handlebars.templates.pause_play_ui();
    divNode.innerHTML = html;

    var pausePlayButton = 
      document.getElementsByClassName("pause-play-button")[0];

    pausePlayButton.addEventListener("click", function() {
      if (that.isPaused()) {
        pausePlayButton.innerHTML = "Pause";
        that.play();
      } else {
        pausePlayButton.innerHTML = "Play";
        that.pause();
      }
    });

    var paused = false;

    that.isPaused = function() {
      return paused;
    };

    that.pause = function() {
      paused = true;
    };

    that.play = function() {
      paused = false;
    };

    Object.freeze(that);
    return that;
  };
})();
