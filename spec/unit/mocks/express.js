'use strict';

function Router () {
  var verbs = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  var router = {
    routes: [],
    route: function () {
      return this;
    },
    handle: function (method, req, res, next) {
      router.routes.forEach(function (route) {
        if (route.method === method) {
          route.handler(req, res, next);
        }
      });
    }
  };

  verbs.forEach(function (verb) {
    router[verb.toLowerCase()] = function (fn) {
      router.routes.push({
        method: verb,
        handler: fn
      });

      return router;
    };
  });

  ['route'].concat(verbs).forEach(function (method) {
    spyOn(router, method.toLowerCase()).and.callThrough(router);
  });

  return router;
}

module.exports = {
  mock: function () {
    return {
      Router: Router
    };
  }
};
