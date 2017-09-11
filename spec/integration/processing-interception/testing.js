'use script';

module.exports.workerResponseHandlers = {

  users: function (messageObj) {
    return {
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString(),
      data: ['John Doe', 'Jane Doe']
    };
  }

};
