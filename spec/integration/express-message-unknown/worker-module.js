'use strict';

module.exports = function () {

  var handleExpressMessage = require('../../../').workerMessage;

  this.on('message', function (messageObj, send, finished) {
    handleExpressMessage.call(this, messageObj, send, finished);
  });

};
