'use strict';

module.exports = function () {

  this.on('message', function (messageObj, send, finished) {
    var results = {
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString()
    };
    finished(results);
  });

};
