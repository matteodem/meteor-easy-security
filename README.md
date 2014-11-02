Easy Security
====================

This package wraps all defined Meteor.methods with a general __rate limit__ of __500ms__ per __connection__. It also does spam checks on the sockets and more. The source code is [well tested](https://github.com/matteodem/meteor-easy-security/blob/master/easy-security-tests.js).

* Possibility to add hooks for interecepting execution (e.g "login")
* Adding throttle, debounce and rate-limit to any function you want
* Detailed configuration possibilities

```javascript
// On Server
EasySecurity.addHook('login', function () {
  // return a boolean
});
```

```javascript
// On Server and Client
var doSomethingSecure = EasySecurity.rateLimit(myFunction, 500);

doSomethingSecure(); // Executes immediately
doSomethingSecure(); // Executes after 500ms
```

___This does not prevent any DDOS attacks! Have a look at [iptables](http://blog.bodhizazen.net/linux/prevent-dos-with-iptables/), [load balancer techniques](http://blog.haproxy.com/2012/02/27/use-a-load-balancer-as-a-first-row-of-defense-against-ddos/) and [more](https://www.google.ch/search?q=ddos+protection+web)___

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-security
```

There doesn't have to be any code written for the general rate limit, but it's possible to change it.

## Configuration

```javascript
EasySecurity.config({
  general: { type: 'rateLimit', ms: 1000 },
  methods: {
    createMethod: { type: 'rateLimit', ms: 1000 * 10 },
    commentMethod: { type: 'throttle', ms: 500 }
  },
  ignoredMethods: ['someOtherMethod']
});
```

There is only 'rateLimit' and 'throttle' available to apply onto Meteor Methods. You can call ```config``` by passing in an object with following optional parameters.

* __general__ Change the general handling of all Meteor.methods
* __methods__ Set specific ways to handle defined methods
* __ignoredMethods__ An array of ignored methods, that means not rateLimit or throttle applied
* __debug__ Boolean if in debug mode or not

## Hooks

Hooks allow you to make checks or execute any code before the method gets executed, useful when having to secure 3rd party defined methods. It's also possible to retrieve them and reset them if needed.

```javascript
EasySecurity.addHook('thirdPartyMethod', function () {
  // Always return a truthy value if you want the method to be executed
  return this.profile.verified;
});

// Array of functions
var hooks = EasySecurity.getHooks('thirdPartyMethod');

// Remove defined hooks
EasySecurity.resetHooks('thirdPartyMethod');
```

## General helpers

You can add __debounce__, __rateLimit__ and __throttle__ to any function you want. Pass in the function as the first argument and the length in ms as the second.

```javascript
var debounced = EasySecurity.debounce(myScrollFunc, 1000),
  rateLimited = EasySecurity.rateLimit(transaction, 1000 * 10),
  throttled   = EasySecurity.throttle(doASpecialThing, 1000 * 5);


debounced(event);
//...
```
