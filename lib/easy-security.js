EasySecurity = (function () {
  'use strict';

  var methods = {};

  var configuration = {
      general: { type: 'rateLimit', ms: 500 },
      hooks: {},
      methods: {},
      ignoredMethods: ['login'],
      maxQueueLength: 100
  };

  configuration._defaults = _.clone(configuration.general);

  var Future = null;

  if (Meteor.isServer) {
    Future = Npm.require('fibers/future');
  } else if (Meteor.isClient) {
    // Future Fake
    Future = function () {};
    Future.prototype.wait = function () {};
    Future.prototype.return = function () {};
  }
  
  // Easy Security Error Constructor
  // This allows to check object for it's inheritance
  // without having to set any custom properties to check for it
  var EasySecurityError = function (error) {
    this.error = error;
  };

  /**
   * Helper Functions
   */
  function getId(scope, rand) {
    if (scope && scope.userId) {
      var userId = scope.userId;
    }

    if (scope && scope.connection) return scope.connection.id;
    else if (userId) return userId;
    else return rand;
  }

  function wrapHooks(name, func) {
    var hooks = configuration.hooks[name] || [];

    return function () {
      var funcScope = this, args = Array.prototype.slice.call(arguments),
        returnVal;

      var canExecute = _.every(_.map(hooks, function (hook) {
        return hook.apply(funcScope, args);
      }));

      if (!canExecute) {
        throw new Meteor.Error("Hook stopped " + name + " from being executed");
      }

      returnVal = func.apply(this, arguments);

      if (returnVal instanceof EasySecurityError) {
        throw returnVal.error;
      }

      return returnVal;
    };
  }

  /**
   * RateLimit Method
   */
  methods.rateLimit = {
    queues: {
      // 'someId' : { functions: [func, func, func, func...], timer: ... }
    },
    callFunctionsInQueue: function (id, funcScope) {
      var funcs = this.queues[id].functions,
        func = funcs.shift(),
        funcData;

      if (funcs.length > configuration.maxQueueLength) {
        this.queues[id].functions = [];
      }

      if (func) {
        funcData = func._esData;

        // try to get the return value, otherwise catch errors
        try {
          funcData.future.return(func.apply(funcScope, funcData.args));
        } catch (e) {
          funcData.future.return(new EasySecurityError(e));
        }

      } else {
        this.queues[id].timer = null;
      }
    },
    wrap: function (func, ms, timeout) {
      var random = Random.id(),
        methodScope = methods.rateLimit;

      if (!timeout) {
        timeout = Meteor.setTimeout;
      }

      function timeoutFunction(func, ms, id) {
        if (methodScope.queues[id].timer) {
          timeout(function () {
            func();
            timeoutFunction(func, ms, id);
          }, ms);
        }
      }

      return function () {
        var id = getId(this, random),
          future = new Future(),
          funcScope = this,
          args = arguments;

        if (!methodScope.queues[id]) {
          methodScope.queues[id] = { 'functions' : [] };
        }

        func._esData = { args: args, future: future };
        methodScope.queues[id].functions.push(func);

        if (!methodScope.queues[id].timer) {
          methodScope.queues[id].timer = true;
          methodScope.callFunctionsInQueue(id, funcScope);

          timeoutFunction(function () {
            methodScope.callFunctionsInQueue(id, funcScope);
          }, ms, id);
        }

        return future.wait();
      };
    }
  };

  // inspiration from http://blogorama.nerdworks.in/javascriptfunctionthrottlingan/

  /**
   * Throttle Method
   */
  methods.throttle = {
    queues: {
      // 'someId' : { data: [], previousCall: time }
    },
    wrap: function throttle(func, ms, collectData) {
      var methodScope = methods.throttle,
        random = Random.id();

      return function () {
        var id = getId(this, random),
          now = new Date().getTime(),
          funcScope = this || {};

        if (!methodScope.queues[id]) {
          methodScope.queues[id] = { data: [], previousCall: null };
        }

        if (collectData) {
          methodScope.queues[id].data.push(Array.prototype.slice.call(arguments));
        }

        if (!methodScope.queues[id].previousCall || (now  - methodScope.queues[id].previousCall) >= ms) {
          var data = methodScope.queues[id].data;

          methodScope.queues[id].previousCall = now;
          funcScope.collectedData = collectData ? { data: _.clone(data) } : null;
          methodScope.queues[id].data = [];

          return func.apply(funcScope, arguments);
        }

        return null;
      };
    }
  };

  /**
   * Debounce Method
   */
  var debounce = {
    queues: {
      // 'someId' : { data: [], previousCall: time }
    },
    wrap: function (func, ms, collectData) {
      var methodScope = debounce,
        random = Random.id();

      return function () {
        var id = getId(this, random),
          funcScope = this || {},
          args = arguments;

        if (!methodScope.queues[id]) {
          methodScope.queues[id] = { data: [], timeout: null };
        }

        if (collectData) {
          methodScope.queues[id].data.push(Array.prototype.slice.call(args));
        }

        if (methodScope.queues[id].timeout) {
          Meteor.clearTimeout(methodScope.queues[id].timeout);
        }

        methodScope.queues[id].timeout = Meteor.setTimeout(function () {
          var data = methodScope.queues[id].data;
          funcScope.collectedData = collectData ? _.clone({ data: data }) : null;
          methodScope.queues[id].data = [];
          methodScope.queues[id].timeout = null;
          func.apply(funcScope, args);
        }, ms);

        return null;
      };
    }
  };

  return {
    debounce: debounce.wrap,
    throttle: methods.throttle.wrap,
    rateLimit: methods.rateLimit.wrap,
    log: function () {
      if (EasySecurity.DEBUG) {
        console.log('EasySecurity LOG: ' + Array.prototype.slice.call(arguments).join(', '));
      }
    },
    config: function (newConfig) {
      if (!newConfig) {
        return configuration;
      }

      configuration.general = _.extend(configuration.general, newConfig.general);
      configuration.methods = _.extend(configuration.methods, newConfig.methods);
      configuration.ignoredMethods = _.union(configuration.ignoredMethods, newConfig.ignoredMethods);
      EasySecurity.DEBUG = newConfig.debug;
    },
    addHook: function (name, func) {
      if (!configuration.hooks[name]) {
        configuration.hooks[name] = [];
      }

      configuration.hooks[name].push(func);
    },
    addHooks: function (names, func) {
      var publicScope = this;

      _.each(names, function (name) {
        publicScope.addHook(name, func);
      });
    },
    getHooks: function (name) {
      return configuration.hooks[name] || [];
    },
    resetHooks: function (name) {
      configuration.hooks[name] = [];
    },
    getMethod: function (name) {
      if (!methods[name]) {
        throw new Meteor.Error('Method: ' + name + ' does not exist!');
      }

      return methods[name];
    },
    getSecuredFunction: function (name, func) {
      var conf = configuration.general;

      if (configuration.methods[name]) {
        conf = configuration.methods[name];
      }

      if (configuration.ignoredMethods.indexOf(name) > -1) {
        return func;
      }

      return wrapHooks(name, this.getMethod(conf.type).wrap(func, conf.ms));
    },
    _getId: getId
  };
})();
