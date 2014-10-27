/*
When someone connects, use it for basic validation maybe?

Meteor.server.onConnectionHook.register(function () {
  console.log(arguments);
});

// Hook into the raw ddp calls being sent
Meteor.server.stream_server.server.on('connection', function (socket) {
  socket.on('data', function (raw_msg) {
    console.log(raw_msg, this._session.connection._meteorSession.connectionHandle);
  });
});
*/

Meteor.startup(function () {
  'use strict';

  var _methods = Meteor.methods;

  function createWrappedMethod(name, func) {
    // create the securityWrappedMethod by the configuration
    return EasySecurity.getSecuredFunction(name, func);
  }

  function wrapMethods(methods) {
    var name;

    for (name in methods) {
      methods[name] = createWrappedMethod(name, methods[name]);
    }

    return methods;
  }

  // Rewrite current registered methods and methods function
  Meteor.server.method_handlers = wrapMethods(Meteor.server.method_handlers);

  Meteor.methods = function (methods) {
    return _methods.apply(this, [wrapMethods(methods)]);
  };
});
