'use strict';

module.exports = function () {

  this.on('message', function (messageObj, send, finished) {
    var results;

    if (messageObj.path === '/qoper8/pass') {
      results = {
        youSent: messageObj,
        workerSent: 'hello from worker ' + process.pid,
        time: new Date().toString()
      };
      finished(results);
      return;
    }

    if (messageObj.path === '/qoper8/fail') {
      results = {
        error: 'An error occurred!',
        status: {
          code: 403
        }
      };
      finished(results);
      return;
    }

    this.emit('unknownMessage', messageObj, send, finished);
  });

};
