var fork = require('child_process').fork;

module.exports = {
  fork: function (modulePath, callback) {
    var cp = fork(modulePath);

    cp.on('message', function (message) {
      if (message.type === 'express-started') {
        callback();
      }
    });

    return cp;
  },

  exit: function (cp, callback) {
    cp.on('exit', function () {
      callback();
    });
    cp.kill();
  },

  handleResponse: function (res, responseObj) {
    var message = responseObj.message;

    if (message.error) {
      res.status(400).send(message);
    } else {
      res.send(message);
    }
  },

  errorHandler: function () {
    return function (req, res, next) {
      var message = {
        status: 404,
        response: {
          error: 'Not found'
        }
      };

      if ('error' in res.locals.message) {
        message.status = res.locals.message.status || 400;
        message.response.error = res.locals.message.error;
      }


      next(message);
    };
  }
};
