'use strict';

module.exports.workerResponseHandlers = {
  foo: function (message) {
    /*jshint camelcase: false */
    return {
      type: message.type,
      ewd_application: message.ewd_application,
      module: true
    };
    /*jshint camelcase: true */
  }
};
