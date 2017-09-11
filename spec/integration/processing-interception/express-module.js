'use strict';

var path = require('path');

module.exports = function () {

  this.on('message', function (messageObj, send, finished) {
    /*jshint camelcase: false */
    var results = {
      type: messageObj.params.type,
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString(),
      ewd_application: path.join(__dirname, messageObj.query.ewd)
    };
    /*jshint camelcase: true */

    finished(results);
  });

};
