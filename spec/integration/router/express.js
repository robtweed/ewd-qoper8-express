'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var qoper8 = require('ewd-qoper8');
var qx = require('../../../');

var app = express();
app.use(bodyParser.json());

var q = new qoper8.masterProcess();
qx.addTo(q);

app.use('/qoper8', qx.router());

app.use('/qoper8-application', qx.router({
  route: '/testing',
  application: 'jwt'
}));

app.use('/qoper8-expressType', qx.router({
  route: '/testing',
  expressType: '4.x'
}));

app.use('/qoper8-nextCallback', qx.router({
  route: '/testing',
  nextCallback: true
}), function (req, res) {
  res.status(200).send(res.locals.message);
});

q.on('start', function () {
  this.worker.module = path.join(__dirname, 'express-module');
  this.log = false;
});

q.on('started', function () {
  app.listen(8080, function () {
    process.send({
      type: 'express-started'
    });
  });
});

q.start();

