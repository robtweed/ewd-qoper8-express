# ewd-qoper8-express: Express integration module for ewd-qoper8

[![Build Status](https://travis-ci.org/robtweed/ewd-qoper8-express.svg?branch=master)](https://travis-ci.org/robtweed/ewd-qoper8-express) [![Coverage Status](https://coveralls.io/repos/github/robtweed/ewd-qoper8-express/badge.svg?branch=master)](https://coveralls.io/github/robtweed/ewd-qoper8-express?branch=master) [![Dependency Status](https://gemnasium.com/badges/github.com/robtweed/ewd-qoper8-express.svg)](https://gemnasium.com/github.com/robtweed/ewd-qoper8-express)

Rob Tweed <rtweed@mgateway.com>  
24 February 2016-17, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com).

Twitter: [@rtweed](https://twitter.com/rtweed)

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community).

Thanks to [Ward De Backer](https://github.com/wdbacker) for assistance with bug tracking, fixing and functionality suggestions.


## ewd-qoper8-express

This module may be used to integrate Express with ewd-qoper8, for simpler routing and handling of incoming HTTP requests within ewd-qoper8's master and worker processes.


## Installing

    npm install ewd-qoper8-express


## Getting Started

server.js
```js
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var qoper8 = require('ewd-qoper8');
var qx = require('ewd-qoper8-express');

var app = express();
app.use(bodyParser.json());

var q = new qoper8.masterProcess();
qx.addTo(q);

app.post('/qoper8', function (req, res) {
  qx.handleMessage(req, res);
});

app.get('/qoper8/test', function (req, res) {
  qx.handleMessage(req, res);
});

q.on('started', function () {
  this.worker.module = process.cwd() + '/worker-module';
  app.listen(8080);
});

q.start();

```
worker-module.js
```js
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

```

## Debug

```
DEBUG=ewd-qoper8-express server.js
```


## Examples

  - For a complete, working examples, refer to the [ewd-qoper8-express-examples](https://github.com/robtweed/ewd-qoper8-express-examples) that uses `ewd-qoper8-express`.
  - **ewd-qoper8**: Refer to the full details and documentation: [tutorial](http://gradvs1.mgateway.com/download/ewd-qoper8.pdf) / [examples](https://github.com/robtweed/ewd-qoper8-examples).


## Related Modules

 - [ewd-qoper8](https://github.com/robtweed/ewd-qoper8) - Node.js Message Queue and Multi-Process Manager.


## License

```
 Copyright (c) 2016 M/Gateway Developments Ltd,                           
 Reigate, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  http://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      
```