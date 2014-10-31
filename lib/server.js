var connections = {},
  calls = {};

var rateLimit = EasySecurity.rateLimit(function () {
  return true;
}, 500);

Meteor.server.onConnection(function (conn) {
  connections[conn.clientAddress] = conn;
});

// Hook into the raw ddp calls being sent
Meteor.server.stream_server.server.on('connection', function (socket) {
  if (!calls[socket.remoteAddress]) {
    calls[socket.remoteAddress] = [];
  }

  EasySecurity.log(socket.remoteAddress + ' connected');

  socket.on('data', function (raw) {
    var ipAddr = socket.remoteAddress;

    calls[ipAddr].push({ time: (new Date()).getTime(), data: raw });
    EasySecurity.log(ipAddr + ' sent '+ raw);

    if (calls[ipAddr].length > 100) {
      // More than 100 times data received in the past 5 seconds, closed the socket
      if ((calls[ipAddr][calls[ipAddr].length - 1].time  - calls[ipAddr][0].time) < 1000 * 5) {
        EasySecurity.log(ipAddr + ' sent data over 100 times in the past 5 seconds!');
        EasySecurity.log('Closing session!');
        socket.end();
        calls[ipAddr] = [];
      } else {
        calls[ipAddr] = [];
      }
    }
  });

  socket.on('close', function () {
    EasySecurity.log(socket.remoteAddress + ' disconnected');
  });
});

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

  // Login hooks, needs to be handled with its own hooks
  if (typeof Accounts !== "undefined") {
    Accounts.onLogin(rateLimit);
    Accounts.onLoginFailure(rateLimit);
  }

  // Rewrite current registered methods and methods function
  Meteor.server.method_handlers = wrapMethods(Meteor.server.method_handlers);

  Meteor.methods = function (methods) {
    return _methods.apply(this, [wrapMethods(methods)]);
  };
});
