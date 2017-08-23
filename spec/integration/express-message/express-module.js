'use strict';

module.exports = function () {

  var handleExpressMessage = require('../../../').workerMessage;

  this.on('expressMessage', function (messageObj, send, finished) {
    var results = {
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString()
    };
    finished(results);
  });

  this.on('message', function (messageObj, send, finished) {
    var expressMessage = handleExpressMessage.call(this, messageObj, send, finished);
    if (expressMessage) {
      return;
    }

    // handle any non-Express messages
    if (messageObj.type === 'non-express-message') {
      var results = {
        messageType: 'non-express',
        workerSent: 'hello from worker ' + process.pid,
        time: new Date().toString()
      };
      finished(results);
    } else {
      this.emit('unknownMessage', messageObj, send, finished);
    }
  });

};
