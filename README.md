Easy Security
====================

This package has been created because of following [post on Meteor Talk](https://groups.google.com/forum/#!topic/meteor-talk/XyYhi8ZMgd8).
It wraps all defined Meteor.methods with a general __rate limit__ of __500ms__. It also does spam checks on the sockets and more. 

* Possibility to add hooks for interecepting execution (e.g "login")
* Adding throttle, debounce and rate-limit to any function you want

```javascript
// On Server, does not need to be called for general rate-limiting
EasySecurity.config({
  methods: { mySecureMethod: { type: "throttle", ms: 500 } }
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
