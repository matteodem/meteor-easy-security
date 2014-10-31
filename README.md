Easy Security
====================

This package has been created because of following [post on Meteor Talk](https://groups.google.com/forum/#!topic/meteor-talk/XyYhi8ZMgd8).
It wraps all defined Meteor.methods with a general __rate limit__ of __500ms__ per __connection__. It also does spam checks on the sockets and more. 

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

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-security
```
