---
title: CSS whyyyyyy
date: 2014-12-30
---
_Note: this is a stream of conscious style dump of some thoughts that have been in my head for over a year now about CSS. It was originally posted on [BBS](https://bigboringsystem.com) and in that spirit it's going to stay long, rambly, unfocused, and incomplete. Now that I've gotten you excited..._

Alternate titles considered for this post:

## Cant-even Style Sheets, or 

## CSS is the Worst but Oh Well Too Bad, or 

## Spooky Selectors at a Distance, or 

## Some Random Thoughts About CSS

Whenever I say that I really hate CSS, people *seem* to make one of several assumptions about me. Either I don't understand it very well, or I come from back-end development/computer science and I'm being disparaging or patronizing toward it.

Which is funny, because I don't come from a back-end/computer science background or from a design and art background. I come to the web from a nothing background, kind of. A "Religious Studies and Sociology double major" background, if you will. Never mind. I stumbled onto "web stuff" in a Barnes and Noble where I'd discovered Jeffrey Zeldman's _Designing with Web Standards_, which I read/skimmed while sitting on the floor for about an hour that day and then went back to revisit several times after that.

> > I just realized I probably should have bought the book at some point--sorry Zeldman, B&N, etc.

I wrote a ton of HTML and CSS back then and cobbled together some PHP and built shitty websites for people, the way you do. I wasn't a great designer and I knew fuck-all about programming, but I really loved making things out of HTML and CSS. I read A List Apart and had a Google Reader list full of Meyer and Shea and Zeldman and Cederholm etc. In 2009 I paid for my own flight to San Francisco and a not-cheap ticket to go to An Event Apart where I met Ethan Marcotte and saw Nicole Sullivan talk about Object Oriented CSS. I rode the wave of CSS3. I supported IE6. I memorized float hacks and quirks mode and all the rest.

***

I say all of that kind of annoying shit to make it clear that I *know* CSS and I *appreciate* its power and complexity and usefulness.

But then I discovered this talk by Rich Hickey called [Simple Made Easy](http://www.infoq.com/presentations/Simple-Made-Easy) and I watch it a few times a year now. Hickey created a language called Clojure which I know almost nothing about, and which I have no plans to learn. But this talk, _ohhhh_ this talk. A few of the things that stood out to me:

> Simplicity is a prerequisite to reliability
> --Edsger Dijkstra

Simple is different than easy and better than complex: [infoq.com/resource/presentations/Simple-Made-Easy/en/slides/sl3.jpg](http://www.infoq.com/resource/presentations/Simple-Made-Easy/en/slides/sl3.jpg)

Simple is one braid:  
- one role
- one task
- one concept
- one dimension

Four truths:   
* We can only hope to make reliable those things we can understand
* We can only consider a few things at a time
* Intertwined things must be considered together
* Complexity undermines understanding

[Limits!](http://www.infoq.com/resource/presentations/Simple-Made-Easy/en/slides/sl7.jpg)

"complect" -> to interleave, intertwine  
"compose" -> to place together

> Programming ... boils down to no more and no less than very effective thinking so as to avoid unmastered complexity, to very vigorous separation of your many different concerns
> --Edsger Dijkstra

***

CSS is **complected by design**. The cascade is complection by definition. Complected Style Sheets, pretty much. Consider this CSS:

```css
section.container div {
  background-color: red;
}

body section div {
  background-color: green;
}
```

What background color is that div? 

If you said 'red' because the class selector is more specific than the element selector, you might be right. But the best answer is probably "no idea" because you don't know if there's another matching selector further down the page, or a slightly more specific one anywhere else, or inline styles in the HTML, or a matching !important declaration anywhere...

The fact is that you can't look at a decent-sized set of stylesheet selectors and confidently figure out what the effect is until you see it in the browser. That should terrify you, I think.

_[A bunch of hands in the room go up.]_

This isn't just a side-effect of _bad_ CSS, either.

_[Hands go down.]_

The cascade is designed to tempt you to override all the things, ie overload and complect. You could have defined a whole set of carefully set CSS properties and one of them can be so easily over-ridden by any other matching selector somewhere else in your stylesheet system. In programming we borrowed a term for this from Einstein, called "spooky action at a distance". It's not a good thing.

This article from [Technology Review](http://www.technologyreview.com/view/427174/einsteins-spooky-action-at-a-distance-paradox-older-than-thought/) explains a little about spooky action using the term "entanglement". A couple of good quotes:

> Entanglement occurs when two particles are so deeply linked that they share the same existence.

.

> Entangled particles can become widely separated in space. But even so, the mathematics implies that a measurement on one immediately influences the other, regardless of the distance between them.

This is generally a bad thing and makes it hard for you to reason about what's happening in your code. Which makes it harder to change and harder to debug and harder to maintain as it grows.

So we have a language that's built on the idea that complection, or cascade, is fundamentally good when in traditional programming we try to avoid it if we can. You have selector specificity that relies on a formula that's nearly impossible to remember, and pretty much any CSS loaded anywhere is "global" and can affect any other CSS loaded in a 'spooky at a distance' kind of way. So what did we do with that system?

We built another level of complection right on top of it, of course! Enter: media queries. Now depending on the state of the browser, which you can't replicate outside of the browser, different sections of global cascading CSS selectors will apply and override other global cascading CSS selectors. Perfect! Now you can have this situation:

```css
@media (max-width: 600px) {
  .container a {
    color: green;
  }
}

li a {
  color: red;
}

.nav a {
  color: black;
}
```

What color is the link? Now it's dependent on the cascade, the HTML structure it's within *and* the width of the browser, which I understand is by design for *very good reasons* but wow does it make it hard to think about anything!

> > You could argue that CSS good practices and general programming good practices are opposites in some regard. Embracing the cascade and leveraging it, like mobile-first responsive design encourages you to do, is opposite to the advice that you should keep code simple and de-coupled from other parts of your code.

So I get it, there's no better solution that I know of besides CSS and media queries. We have to use them, it's the only visual design solution we have and when we use them intelligently they can do some powerful, awesome things. But they're difficult and susceptible to inflexibility and strange frustrating bugs and other common problems because the system is built on the idea that complecting is good and should be leveraged. That's hard to overcome.

I think that's why we're seeing so many new CSS strategies designed to avoid and ignore the cascade altogether. [BEM](https://bem.info/method), for instance, [SMACSS](https://smacss.com/) to some extent, [OOCSS](http://oocss.org/) (not very new) -- and a bunch of other even newer CSS abstractions and strategies aimed at adding descriptive classes to nested elements and *sidestepping the cascade* to create a more reliable, simple system. 

Simplifying, decomplecting. Good things, in my opinion, for how to deal with what we're dealt. Because CSS isn't going anywhere and we sure as hell need it.

::still thinking through more ways to overcome this problem::