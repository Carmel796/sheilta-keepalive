// version 1.0.7 28/11/2016
// version 1.0.6 14/08/2013
// version 1.2.5 30/06/2019

//checkUrl = https://sheilta.apps.openu.ac.il/pls/dmyopt2/session_guard
//refreshUrl = https://sheilta.apps.openu.ac.il/pls/dmyopt2/session_guard?p_refresh=1
//logoutUrl = https://www.openu.ac.il/students/pages/default.aspx?logout=1

function SessionGuard() {
  /// <summary>
  /// Initial a new SessionGuard object.
  /// Required settings are: checkUrl, refreshUrl, logoutUrl.
  /// </summary>

  // Requried settings
  this.checkUrl = null;
  this.refreshUrl = null;
  this.logoutUrl = null;

  this.defaultInterval = 30;
  this.alertDuration = 300;
  this.minimumInterval = 10;
  this.dialogId = "session-guard";
  this.dialogYesId = this.dialogId + "-yes";
  this.dialogNoId = this.dialogId + "-no";

  var _this = this;
  var isDialogRaised = false;
  var logoutTimeoutId;

  this.start = function () {
    /// <summary>
    /// Start the session guard timer.
    /// The properties checkUrl, refreshUrl and logoutUrl must to be set before this call.
    /// </summary>

    if (!_this.checkUrl) {
      console.error("SessionGuard error: checkUrl is required.");
      return;
    }

    if (!_this.refreshUrl) {
      console.error("SessionGuard error: refreshUrl is required.");
      return;
    }

    if (!_this.logoutUrl) {
      console.error("SessionGuard error: logoutUrl is required.");
      return;
    }

    setTimeout(check, _this.defaultInterval * 1000);
  };

  this.initial = function () {
    /// <summary>
    ///     DEPRECATED. use start() instead.
    /// </summary>
    this.start();
  };

  var check = function () {
    requestUrl(_this.checkUrl, checkCallback);
  };

  var checkCallback = function (nextIntervalText) {
    var nextInterval = nextIntervalText ? new Number(nextIntervalText) : NaN;

    if (isNaN(nextInterval)) {
      setTimeout(check, _this.defaultInterval * 1000);
      return;
    }

    if (nextInterval > _this.alertDuration + _this.minimumInterval * 2) {
      if (isDialogRaised) {
        hideDialog(_this.dialogId);
        isDialogRaised = false;
      }

      setTimeout(
        check,
        (nextInterval - (_this.alertDuration + _this.minimumInterval)) * 1000
      );
    } else if (nextInterval > _this.minimumInterval) {
      logoutTimeoutId = setTimeout(
        check,
        (nextInterval - _this.minimumInterval) * 1000
      );
      isDialogRaised = true;
      raiseDialog(
        _this.dialogId,
        _this.dialogYesId,
        _this.dialogNoId,
        refresh,
        logout
      );
    } else {
      logout();
    }
  };

  var refresh = function () {
    if (logoutTimeoutId) {
      clearTimeout(logoutTimeoutId);
      logoutTimeoutId = false;
    }

    requestUrl(_this.refreshUrl, checkCallback);
  };

  var logout = function () {
    if (_this.logoutUrl) {
      top.window.location.href = _this.logoutUrl;
    }
  };

  function requestUrl(url, callback) {
    if ($) {
      $.ajax(url, {
        method: "POST",
        success: callback,
        error: function (error) {
          callback(null);
        },
        xhrFields: { withCredentials: true },
      });
    } else {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.withCredentials = true;
      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
          if (xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
          } else {
            callback(null);
          }
        }
      };
      xmlhttp.open("POST", url, true);
      xmlhttp.send();
    }
  }

  function raiseDialog(dialogId, yesId, noId, yesCallback, noCallback) {
    var blockBoxId = "blox-box-20-03-2013";
    var dialog = document.getElementById(dialogId);

    if (!dialog) {
      alert("Error: Dialog #" + dialogId + " not found.");
      return;
    }

    // first time
    if (!document.blockBox) {
      // block box
      var blockBox = document.createElement("div");
      blockBox.id = blockBoxId;
      blockBox.style.backgroundColor = "black";
      blockBox.style.width = "100%";
      blockBox.style.height = "100%";
      blockBox.style.position = "fixed";
      blockBox.style.left = "0";
      blockBox.style.top = "0";
      blockBox.style.zIndex = "999";
      blockBox.style.display = "none";
      document.body.appendChild(blockBox);
      document.blockBox = blockBox;

      $(document.blockBox).css({
        opacity: "0.5",
      });

      // dialog
      dialog.style.position = "fixed";
      dialog.style.zIndex = "1000";

      // yes no buttons
      var yes = document.getElementById(yesId);
      var no = document.getElementById(noId);

      if (yes)
        $(yes).click(function () {
          yesCallback();
          $(dialog).hide();
          $(document.blockBox).hide();
        });
      if (no)
        $(no).click(function () {
          noCallback();
          $(dialog).hide();
          $(document.blockBox).hide();
        });
    }

    $(dialog).css({
      top: $(window).height() / 2 - $(dialog).height() / 2 + "px",
      right: $(window).width() / 2 - $(dialog).width() / 2 + "px",
    });

    $(document.blockBox).fadeIn(500);
    $(dialog).fadeIn(500);
  }

  function hideDialog(dialogId) {
    if (document.blockBox) {
      var dialog = $("#" + dialogId);
      $(dialog).hide();
      $(document.blockBox).hide();
    }
  }
}
