---
title: Calm down, JavaScript
date: 2013-04-20
---
I’ve been writing a lot of JavaScript lately, mostly for browser interactions, animations, and single-page navigation controls. As you begin to attach more callbacks to the window’s onscroll event, you become aware of just how jumpy that event is, and how costly it becomes if your callbacks are doing anything remotely intense.

I’d heard of the concepts of throttling and debouncing before—mostly from [Underscore](http://underscorejs.org)—but a library isn’t always necessary, especially for two small utility functions. Not to mention it’d be nice to fully understand what throttling and debouncing are, what the difference is, and how they work. 

I started by reading through the Underscore docs for the \_.throttle and \_.debounce functions, which basically say something like this.

> **A throttled function** will only actually call the original function at most once per every `wait` milliseconds.
> 
> **A debounced function** will postpone its execution until after `wait` milliseconds have elapsed since the last time it was invoked.

The first fifty times I read those descriptions, I couldn’t tell the difference, so I decided to make my own versions. I started with throttling. I knew what I wanted was to keep track of the last time a function is run and not run it again until `wait` milliseconds later, so I threw something together:

```javascript
var wait = 100;
var last;
function doStuff() {
  var now = new Date();
  if (now - last < wait) {
    return;
  }
  // Do stuff
  last = now;
}
```

If it hasn’t been at least 100 milliseconds since the last time you tried to call `doStuff`, it’s not going to do anything but return. The function is, in effect, _throttled_. But not without problems. 

1. The `last` variable is possibly global because the function needs access to its value from the previous call, and global or badly scoped variables suck.
2. The actual throttling is being done inside the function itself, which also sucks.
3. The number of milliseconds to throttle is hard-coded into the whole mess, which _really_ sucks.

We can do better.

## Closures to the rescue

To encapsulate our ‘last’ variable in the right scope, we can wrap the function in a closure. If you don’t know what a closure does, think of it as a function that returns another function. Anything defined in the scope of the outer function is available to the inner function forever, without ever colliding with other variables outside the outer function. Perfect for what we need here.

```javascript
var doStuff = (function () {
  // This is the scope of the 'outer function'
  var last;
  return function () {
    // This is the scope of the 'inner function', with access to 'last' forever

    // do cool stuff
  };
})();
```

This fixes the scope problem, but we still need to separate out the throttling code and make it flexible. For that, we need a function that takes a function and turns it into a newly throttled function. (Function!)

```javascript
var throttle = function (wait, func) {
  var last;
  return function () {
    var now = new Date();
    if (now - last < wait) {
      return;
    }  
    func();
    last = now;
  }
};

var doStuff = throttle(500, function () {
  // do stuff 
});

doStuff(); // will run, and set last to now
doStuff(); // now - last will be less than 500 ms, so nothing happens (last stays unchanged)

// 1 second later
doStuff(); // last is more than 500 ms ago, function will run
```

Success! Now we’ve moved the throttling code outside of the doStuff definition, and we’ve allowed the ms to be adjusted per throttle. But what if you wanted to pass arguments to `doStuff()`? You could define the parameters in the anonymous function that you pass to `throttle`, but then you’d have to explicitly pass them in what’s supposed to be a general throttle function—not good. We need to use `function.apply()`.

## Function.apply() yourself

> People see `fn.apply(var, args)` and go `head.asplode()`.
> 
> &mdash;[@jcarouth](https://twitter.com/jcarouth)

Fn.apply (and its sibling, ‘fn.call’) has a reputation for being difficult because it involves the confusing value of ‘this’, but it’s not that complicated, and it’s a really powerful and useful tool to understand. 

[MDN has a great explanation](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/apply), but the short version is this: Inside any function `fn`, if you want control over what the magic `this` value will be, use `fn.apply`. If you call `myFunction.apply(a, b)`, `a` will be _the context_, or value of `this`, for myFunction while it runs.

```javascript
// Pass in money and it returns the change
function purchase(money) {
  return money - this.price;
}

// If you called this function directly
purchase(3.00);
// => NaN because price is undefined

// You could attach this to an object's prototype to permanently add it
var Fruit = function (name, price) {
  this.name = name;
  this.price = price;
}
Fruit.prototype.purchase = purchase;

var apple = new Fruit('apple', 1.25);
apple.purchase(3); 
// => 1.75

// But if you just want to add that function temporarily, use apply()
var Car = function (make, model, price) {
  this.make = make;
  this.model = model;
  this.price = price;
};
var sweetRide = new Car('Honda', 'Civic', 18999);

sweetRide.purchase(3000);
// => TypeError: Property 'purchase' of object [object Object] is not a function

purchase.apply(sweetRide, [3000]);
// => -15999 (somebody needs a loan)
```

The second argument passed to apply should be an array of arguments that JS will magically pass to myFunction, one argument at a time.

```javascript
function myFunction(a, b, c) {
  console.log(a);
  console.log(b);
  console.log(c);
}
var argList = ["first", "second", "third"];
myFunction.apply({}, argList);
// => "first"
// => "second"
// => "third"
```

In our example, we’re not worried about setting the context, but the second argument in `fn.apply()` lets us take the javascript ‘arguments’ array (an array of all arguments passed to the currently-scoped function) and pass it to the function that was meant to be throttled.

```javascript
var throttle = function (wait, func) {
  var last;
  return function () {
    var now = new Date();
    if (now - last < wait) {
      return;
    }  

    // whatever was passed to the throttled function is passed on to your function
    func.apply(this, arguments); 

    last = now;
  }
}

var doStuff = throttle(100, function (a, b) {
  // do stuff 
  console.log(a, b);
});
```

Now a throttled function can accept any number of arguments because they’ll all be passed via the javascript `arguments` array. In ~10 lines of code, you have a simple throttling factory, which comes in handy when you need to do a lot of complicated DOM stuff, for example.

```javascript
var complicatedDOMStuff = throttle(250, function (a, b) {
  // all kinds of dom interactions etc
});

var a = "something, maybe a jquery wrapped element or data structure";

$(window).on('scroll', function (e) { 
  var b = "something you want to look up on EVERY unthrottled event";
  complicatedDOMStuff(a, b);
}
```

## Debounce is debest

Throttling is pretty easy to understand, but debouncing is arguably much more useful. The word ‘debounce’ comes from electrical engineering.

> Bouncing is the tendency of any two metal contacts in an electronic device to generate multiple signals as the contacts close or open; debouncing is any kind of hardware device or software that ensures that only a single signal will be acted upon for a single opening or closing of a contact. ([—source](http://whatis.techtarget.com/definition/debouncing))

For example, when you push the “c” key on your keyboard, you might make physical contact 3 or 4 times, but if it output “cccc” it would be really hard to get anything done. The signal debounces your keypress by only accepting one contact in a given number of milliseconds. 

You might ask, “But wouldn’t throttling solve this problem?” Good question! And well, yeah, it would, kind of. But throttling and debouncing are solutions to two slightly different problems. 

With **throttling**, if any two events are less than ‘n’ time apart, the later event should fail _if the earlier one was successful_.

With **debouncing**, if any two events are less than ‘n’ time apart, only one event should fire, no matter how many are fired in a row. (Sometimes the first of the group, sometimes the last.)

For example, if letters represent attempts to fire an event and a dash represents a unit of time

```
a - - - b - - - c - - - d
```

An event _throttled_ by 4 dashes results in `ac`: 

* a? no earlier event, fire.
* b? earlier successful event less than 4 dashes ago, do not fire.
* c? earlier event less than 4 dashes ago but it wasn’t successful, fire.
* d? successful event less than 4 dashes ago, do not fire.

However, an event _debounced_ by 4 dashes results in `d`*:  

* a? wait for 4 dashes before firing
* b? a is less than 4 dashes ago, cancel a, wait for 4 dashes before firing b
* c? b is less than 4 dashes ago, cancel b, wait for 4 dashes before firing c
* d? c is less than 4 dashes ago, cancel c, wait for 4 dashes before firing d
* (4 dashes later) d fires

<small>* _Debouncing could theoretically result in just ‘a’, depending on the debouncing method. For my examples, it will always be the last event that ultimately fires because I find that to be a lot more useful in the browser._</small>

Debouncing is perfect for listening to an event and only performing a task once a user has _stopped_ or _paused_—stopped scrolling = perform an animation, stopped typing = perform an AJAX request, paused typing = perform validation, etc. 

My first attempt at a simple debounce factory looked something like this. (_Note: I've named the anonymous functions here just to make it easier to talk about them._)

```javascript
var debounce = function (wait, func) {
  var timer;
  return function myDebouncer() {
    window.clearTimeout(timer);
    timer = window.setTimeout(function waiter() {
      func.apply(this, arguments);
    }, wait);
  }
};
```

Which is actually really close to what we need. Instead of checking to see if enough time has passed since the last successful call, we set a timer for when the function should execute and if the function gets called again before that timer ‘goes off’, then the timer gets reset.

Unfortunately, I broke the original function because `arguments` in the example above is always empty. The debounce factory returns a copy of the function I've named `myDebouncer`, which should seem to the user like an _exact copy_ of the function they debounced, just with the new debouncing properties added. That's why we use the special `arguments` array to accommodate any list of arguments used. 

However, because we use `setTimeout`, we have to pass it another function, the one I've called `waiter`. Inside that function `this` and `arguments` are relative to `waiter`, which received no arguments at all. That's why it's empty in the example above. The fix is simple: save copies of `this` and `arguments` as `that` and `args` in the scope above.

```javascript
var debounce = function (wait, func) {
  var timer;
  return function myDebouncer() {
    var that = this;
    var args = arguments;
    window.clearTimeout(timer);
    timer = window.setTimeout(function waiter() {
      func.apply(that, args);
    }, wait);
  }
};
```

Ta da! Now I can be way more efficient with AJAX requests, for example.

```javascript
var makeXHRRequest = debounce(500, function () {
   // make request, process results, etc
});

$(input).on('keypress', makeXHRRequest);
```

Here’s a GitHub gist of the two completed functions if you want to play with them more.

<script src='https://gist.github.com/jasonrhodes/5407519.js'></script>

If you want to find slightly more robust versions of these functions, check out [Underscore.js](http://underscorejs.org) or [Ben Alman’s jQuery throttle/debounce](http://benalman.com/projects/jquery-throttle-debounce-plugin/) (which is _not_ jQuery-dependent, despite its name).