Easy Security
====================

This package has been created because of following [post on Meteor Talk](https://groups.google.com/forum/#!topic/meteor-talk/XyYhi8ZMgd8).
It wraps all defined Meteor.methods with a general __rate limit__ of __500ms__. It also does under the hood checks to prevent any harmful DDP attacks (not yet implemented) and more.

* Hooks for interecepting execution of certain methods (e.g login)
* Adding throttle, debounce and rate-limit to any function you want
* Detailed configuration possibilities

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-security
```
