/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-express: Express Integration Module for ewd-qpoper8           |
 |                                                                          |
 | Copyright (c) 2016-17 M/Gateway Developments Ltd,                        |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  15 August 2017

  MicroService Routing Module

*/

function microServiceRouter(message, handleResponse) {

  //console.log('** testing route for message: ' + JSON.stringify(message));
  //console.log('restRoutes = ' + JSON.stringify(qoper8.u_services.restRoutes));
  //console.log('destinations = ' + JSON.stringify(qoper8.u_services.byDestination));

  var route = this.router.hasRoute(message.path, message.method, this.u_services.restRoutes);
  //console.log('** route = ' + JSON.stringify(route));
  if (route.matched) {
    // route.args         - variables found in route, which may include destination;
    // route.destination  - explicitly-defined destination for route
    // route.pathTemplate - original path template on which route was matched

    // destination may be explicitly defined for path, or defined by path itself (ie in args)
    //  destination defined in path will over-ride an explicitly-defined one

    var destination = route.args.destination || route.destination;
    if (destination && this.u_services.byDestination[destination]) {

      var microService = this.u_services.byDestination[route.destination];

      //  incoming REST message is repackaged as a QEWD WebSocket message and sent
      //   over the micro-service socket interface to the micro-service host system

      // any incoming API that doesn't include a valid JWT should be given a
      //  nominal one using the QEWD client registration one - this is simply
      //  to allow the remote QEWD websocket interface to not immediately reject it
      //  the nominal one must have the expiry updated
    
      var token = this.jwt.handlers.getRestJWT(message);
      //console.log('*** token =' + token + ';'); 

      if (token === '') {
        //console.log('*** using updated registration JWT');
        var application = microService.application;
        token = microService.client.token;

        // we must also update the application - remote system uses the value
        // in the JWT to determine the application to load
        // prevents arbitrary application change attempts

        token = this.jwt.handlers.updateJWTExpiry.call(this, token, application);
      }
      else {
        //console.log('isJWTValid..');
        var status = this.jwt.handlers.isJWTValid.call(this, token);
        //console.log('** status = ' + JSON.stringify(status));
        if (!status.ok) {
          // return standard QEWD WebSocket error response object
          return handleResponse({
            message: {
              error: status.error
            }
          });
        }

        //console.log('** using JWT attached to incoming REST request - microservice may reject it!');

        token = this.jwt.handlers.updateJWTExpiry.call(this, token, microService.application);
      }

      var messageObj = {
        application: microService.application,
        type: 'restRequest',
        path: message.path,
        pathTemplate: route.pathTemplate,
        method: message.method,
        headers: message.headers,
        params: message.params,
        query: message.query,
        body: message.body,
        ip: message.ip,
        ips: message.ips,
        token: token,
        args: route.args,
        jwt: true
      };

      // send micro-service request over WebSocket to remote system

      microService.client.send(messageObj, handleResponse);
      return true;
    }
  }
  return false;
}

module.exports = microServiceRouter;
