---
layout: post
title: Calm down, JavaScript
subtitle: Finally understanding throttling and debouncing
tags: [javascript, functions]
---

I've been writing a lot of JavaScript lately, mostly for browser interactions, animations, and single-page navigation control. As you begin to attach more callbacks to the window's onscroll event, you become aware of just how often that event fires, and how costly it becomes if your callbacks are doing anything remotely intense. 

I'd heard of the concepts of throttling and debouncing before&mdash;mostly from [Underscore](http://underscorejs.org)&mdash;but a library isn't always necessary, especially for two small utility functions. Not to mention it'd be nice to fully understand what throttling and debouncing are, what the difference is, and how they work. I started by trying to understand how Underscore does it.

> **A throttled function** will only actually call the original function at most once per every `wait` milliseconds.
> 
> **A debounced function** will postpone its execution until after `wait` milliseconds have elapsed since the last time it was invoked.

The first fifty times I read those descriptions, I couldn't tell the difference, so I started with throttling, which basically looks like this:

```javascript
var last;
function doStuff() {
    var now = new Date();
    if (now - last < 100) {
        return;
    }
    // Do stuff
    last = now;
}
```

If it hasn't been at least 100 milliseconds since the last time you tried to call me, I'm not going to do anything but return. This function is, in effect, _throttled_. But not without problems. 

1. The `last` variable is possibly global because the function needs access to it's value from the previous call, and global or out-of-scope variables suck.
1. The actual throttling is being done inside the function itself, which really sucks. 
1. The number of milliseconds to throttle is hard-coded into the whole mess, which also sucks. We can do better.


## Closures to the rescue

To encapsulate our 'last' variable, we can wrap the function in a closure. If you don't know what a closure does, think of it as a function that returns another function. Anything defined in the scope of the outside function is available to the inside function forever, without ever colliding with other variables outside the outer function. Perfect for our 'last' scenario.

```javascript
var doStuff = (function () {
    // Scope: outside function
    var last;
    return function () {
        // This is the inside function that's assigned to doStuff
        // It has access to 'last' forever
        
        // do stuff
    };
})();
```

This fixes the scope problem, but to address the others, we need a function that takes your function and turns it into a newly throttled function. Function!

```javascript
var throttle = function (ms, func) {
    var last;
    return function () {
        var now = new Date();
        if (now - last < ms) {
            return;
        }  
        func();
        last = now;
    }
}

var doStuff = throttle(100, function () {
    // do stuff 
});
```

Success! Now we've moved the throttling code outside of the doStuff definition, and we've allowed the ms to be adjusted per throttle. But what if we wanted to pass arguments to `doStuff()`? You could define the parameters in the anonymous function that you pass to `throttle`, but then you'd have to explicitly pass them in what's supposed to be a general throttle function&mdash;not good. We need to use `function.apply()`.

## Function.apply() yourself

The `.apply()` method makes you 3x smarter every time you use it, and it's pretty simple, too. Inside any function, `this` can refer to a lot of different things. Often you want more control over what `this` will be (it's _context_), so when you use `function.apply()` the first argument is the context, or value of `this`, for that function while it runs.

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

purchase.apply(sweetRide, 3000);
// => -15999 (somebody needs a loan)
```
In our example, we're not worried about setting the context, but the second parameter passed to .apply() is an array of arguments. JavaScript magically takes the array you pass to apply() and drops it into the called function, one parameter at a time. This trick lets us take the javascript 'arguments' array (an array of all arguments passed to the currently-scoped function) and pass it to the function that was meant to be throttled.

```javascript
var throttle = function (ms, func) {
    var last;
    return function () {
        var now = new Date();
        if (now - last < ms) {
            return;
        }  
        func.apply(this, arguments);
        last = now;
    }
}

var doStuff = throttle(100, function (a, b) {
    // do stuff 
    console.log(a, b);
});
```

Now a throttled function can accept any number of arguments because they'll all be passed via the javascript `arguments` array. In 10 lines of code, you have a simple throttling factory, which comes in handy when you need to do a lot of complicated DOM stuff, for example.

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

Throttling is pretty easy to understand, but debouncing is arguably much more useful. The word 'debounce' comes from electrical engineering.

> Bouncing is the tendency of any two metal contacts in an electronic device to generate multiple signals as the contacts close or open; debouncing is any kind of hardware device or software that ensures that only a single signal will be acted upon for a single opening or closing of a contact. ([Source](http://whatis.techtarget.com/definition/debouncing))

You push the "c" key on your keyboard and you might make physical contact 3 or 4 times, but if it output "cccc" it would be really hard to get anything done. The signal debounces your keypress by only accepting one contact in a given number of milliseconds. 

You might ask, "But wouldn't throttling solve this problem?" Good question! And uh, yeah, it would, kind of. But throttling and debouncing are solutions to two slightly different problems. 

With **throttling**, if any two events are less than 'n' time apart, the later event should fail _if the earlier one was successful_.

With **debouncing**, if any two events are less than 'n' time apart, only one event should fire, no matter how many are fired in a row.

For example, if letters represent attempts to fire an event and a dash represents a unit of time

```

a - - - b - - - c - - - d

```

An event _throttled_ by 4 dashes results in 'ac': 

* a? no earlier event, fire. 
* b? earlier successful event less than 4 dashes ago, do not fire. 
* c? earlier event less than 4 dashes ago but it wasn't successful, fire.
* d? successful event less than 4 dashes ago, do not fire.

However, an event _debounced_ by 4 dashes results in 'd'*:  

* a? wait for 4 dashes before firing
* b? a is less than 4 dashes ago, cancel a, wait for 4 dashes before firing b
* c? b is less than 4 dashes ago, cancel b, wait for 4 dashes before firing c
* d? c is less than 4 dashes ago, cancel c, wait for 4 dashes before firing d
* 4 dashes later, d fires

\* <small>_Debouncing could theoretically result in just 'a', depending on the debouncing method. For my examples, it will always be the last event that ultimately fires because I find that to be a lot more useful in the browser._</small>

Debouncing is perfect for listening to an event and only performing a task once a user has _stopped_ or _paused_&mdash;stopped scrolling to perform an animation, stopped typing to perform an AJAX request, or paused typing to perform validation, etc. 

My first attempt at a simple debounce factory looked something like this.

```javascript
var debounce = function (ms, func) {
    var timer;
    return function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            func.apply(this, args);
        }, ms);
    }
};
```

Which is actually really close to what we need. Instead of checking to see if enough time has passed since the last successful call, we set a timer for when the function should execute and if the function gets called again before that timer 'goes off', then the timer gets reset.

By adding that third level of function scope inside the anonymous function passed to `window.setTimeout()`, I made it impossible to pass the right context or arguments to the callback. Fixing that was easy by saving off copies in the scope above.

```javascript
var debounce = function (ms, func) {
    var timer;
    return function () {
        var that = this;
        var args = arguments;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            func.apply(that, args);
        }, ms);
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

Here's a GitHub gist of the two completed functions if you want to play with them more.

{% gist 5407519 %}

If you want to find slightly more robust versions of these functions, check out [Underscore.js](http://underscorejs.org) or [Ben Alman's jQuery throttle/debounce](http://benalman.com/projects/jquery-throttle-debounce-plugin/), which is *not* jQuery-dependent despite its name.

Happy debouncing.