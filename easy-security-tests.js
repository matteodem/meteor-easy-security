if (Meteor.isServer) {
  Meteor.methods({
    secureDivide: function (dividend, divisor) {
      return dividend / divisor;
    },
    returnTwo: function () {
      return 2;
    }
  });

  EasySecurity.config({
    methods: { returnTwo : { type: "throttle", ms: 200 } }
  });
}

Tinytest.add('EasySecurity API - config', function (test) {
  var defaultConf = EasySecurity.config()._defaults;
  test.equal(defaultConf.type, 'rateLimit');
  test.equal(defaultConf.ms, 500);

  EasySecurity.config({
    methods: { login: { type:'throttle', ms: 1000 } },
    ignoredMethods: ['logout']
  });

  EasySecurity.config({
    general: { ms: 200 },
    ignoredMethods: ['someOtherMethod']
  });

  var newConfig = EasySecurity.config();

  test.equal(newConfig.general.ms, 200);
  test.equal(newConfig.methods.login.type, 'throttle');
  test.equal(newConfig.methods.login.ms, 1000);
  test.isTrue(newConfig.ignoredMethods.indexOf('logout') > -1);
  test.isTrue(newConfig.ignoredMethods.indexOf('someOtherMethod') > -1);

  EasySecurity.config({ general: defaultConf });
});

Tinytest.add('EasySecurity API - getMethod', function (test) {
  test.throws(function () {
    EasySecurity.getMethod('wowSuchNotHere');
  });
  test.throws(function () {
    EasySecurity.getMethod();
  });

  test.instanceOf(EasySecurity.throttle, Function);
  test.instanceOf(EasySecurity.rateLimit, Function);
  test.instanceOf(EasySecurity.getMethod('throttle').wrap, Function);
  test.instanceOf(EasySecurity.getMethod('rateLimit').wrap, Function);
});

Tinytest.add('EasySecurity API - _getId ', function (test) {
  var confWithConnection = { 'connection' : { 'id' : 'someConnectionId' }},
    confWithOnlyUserId = { 'userId' : 'someUserId'},
    confWithConnectionAndUserId = _.extend(confWithConnection, confWithConnectionAndUserId );

  test.equal(EasySecurity._getId(confWithConnection, test.id), 'someConnectionId');
  test.equal(EasySecurity._getId(confWithOnlyUserId, test.id), 'someUserId');
  test.equal(EasySecurity._getId(confWithConnectionAndUserId, test.id), 'someConnectionId');
  test.equal(EasySecurity._getId({}, test.id), test.id);
});

Tinytest.addAsync('EasySecurity API - getSecuredFunction - method', function (test, resolve) {
  var count = 0,
    now = new Date().getTime(),
    wrapped;

  function testFunction(howMuch) {
    test.isTrue((new Date().getTime() - now > (150 * count - 50)));
    count += howMuch;

    if (count === 4) {
      resolve();
    }
  }

  EasySecurity.config({
    methods: { someMethodNotSecure: { type: "rateLimit", ms: 150 } }
  });

  wrapped = EasySecurity.getSecuredFunction('someMethodNotSecure', testFunction);
  wrapped(1);
  wrapped(1);
  wrapped(1);
  wrapped(1);
});

Tinytest.addAsync('EasySecurity API - getSecuredFunction - general', function (test, resolve) {
  var count = 0,
    now = new Date().getTime(),
    wrapped;

  function testFunction(howMuch) {
    test.isTrue((new Date().getTime() - now > (500 * count - 50)));
    count += howMuch;

    if (count === 2) {
      resolve();
    }
  }

  EasySecurity.config({
    general: { type: "rateLimit", ms: 500 }
  });

  wrapped = EasySecurity.getSecuredFunction('methodThatDoesntExist' + test.id, testFunction);
  wrapped(1);
  wrapped(1);
});

Tinytest.addAsync('EasySecurity API - Methods - rateLimit', function (test, resolve) {
  var count = 0,
    now = new Date().getTime(),
    wrapped;

  function testFunction(howMuch) {
    test.isTrue((new Date().getTime() - now > (100 * count - 50)));
    count += howMuch;

    if (count === 3) {
      resolve();
    }
  }

  wrapped = EasySecurity.rateLimit(testFunction, 100);
  wrapped(1);
  wrapped(1);
  wrapped(1);
});

Tinytest.addAsync('EasySecurity API - Methods - throttle', function (test, resolve) {
  var number = 0,
    wrapped;

  function testFunction() {
    number += 1;
  }

  wrapped = EasySecurity.throttle(testFunction, 200);
  wrapped();
  wrapped();

  test.equal(number, 1);

  Meteor.setTimeout(function () {
    test.equal(number, 1);
    wrapped();
    wrapped();
  }, 250);

  Meteor.setTimeout(function () {
    wrapped();
  }, 300);

  Meteor.setTimeout(function () {
    test.equal(number, 2);
    wrapped();
  }, 480);

  Meteor.setTimeout(function () {
    test.equal(number, 3);
    resolve();
  }, 500);
});

if (Meteor.isClient) {
  Tinytest.addAsync('EasySecurity API - Meteor.call', function (test, resolve) {
    var now = new Date().getTime();

    Meteor.call('secureDivide', 10, 5, function (err, res) {
      test.isUndefined(err);
      test.equal(res, 2);
      test.isTrue((new Date().getTime() - now < 100));
    });

    Meteor.call('returnTwo', function (err, res) {
      test.isUndefined(err);
      test.equal(res, 2);
      test.isTrue((new Date().getTime() - now < 100));
    });

    Meteor.call('returnTwo', function (err, res) {
      test.isUndefined(err);
      test.isNull(res);
      test.isTrue((new Date().getTime() - now < 200));
    });

    Meteor.setTimeout(function () {
      Meteor.call('returnTwo', function (err, res) {
        test.isUndefined(err);
        test.equal(res, 2);
      });
    }, 250);

    Meteor.call('secureDivide', 500, 10, function (err, res) {
      test.isUndefined(err);
      test.equal(res, 50);
      test.isTrue((new Date().getTime() - now > 500 - 50));

      resolve();
    });
  });
}

// TODO: debounce and method hooks
// TODO: Check why "login" doesn't work with rateLimit
