---
layout: post
title: Killing orphans in Jekyll
subtitle: Dealing with heading "orphans" in my new Jekyll-generated blog setup
tags: [jekyll, headings, orphans]
---

I'm using [Jekyll](https://github.com/mojombo/jekyll) to generate this blog now. I tried Octopress and found its reliance on SASS and the default template to be too limiting for what I wanted to do. Jekyll allows me (forces me, really) to have complete control over the design of the site, which is what I want.

Getting Jekyll up and running is mostly easy, with a few unsurprising Ruby gem and rvm related snags. As I was putting together this very simple template, I decided to keep the headings of each post cleaner by appending the date at the end of each title line. Obviously, I don't want the date to break onto two lines, so I wrapped the date portion of the Liquid template in a `<span>` tag that's styled as `whitespace: no-wrap;` in the CSS.

I still wasn't satisfied that this heading style wouldn't break at certain line widths, though. If the last word of the title drops onto the second line with the span-wrapped date, it still gives the appearance of an [orphan](http://en.wikipedia.org/wiki/Widows_and_orphans), a capital offense.

To fix this, it took a bit of Liquid magic, so to speak. Enough that I thought it was worth sharing.

{% highlight html %}
{% raw %}
{% assign words = page.title | split: " " %}
{% endraw %}
{% endhighlight %}

Liquid has an `assign` syntax that you have to use to create new variables. If you know Twig syntax, it's pretty much the same as using Twig's "set". Here, I've used Liquid's `split` filter to split the page title on a space and assign the array of all words to the `words` variable.

{% highlight html %}
{% raw %}
{% assign last = words | last %}
{% assign count = words | size | minus: 1 %}
{% endraw %}
{% endhighlight %}

Now that I have all the words of the title in an array, I can assign the last word and the number of words, minus 1, to `last` and `count` variables.

{% highlight html %}
{% raw %}
{% assign trunctitle = page.title | truncatewords: count, '' %}
{% endraw %}
{% endhighlight %}

Liquid has a [truncatewords filter](http://wiki.shopify.com/Truncatewords) that removes _x_ number of words and returns the remainder. By default, Liquid appends an ellipsis to the return value, but it can be removed by passing an empty string as the second parameter of the filter. 

Now `trunctitle` is the title with the last word removed.

{% highlight html %}
{% raw %}
<h1 class="post-title">
	{{ trunctitle }}&nbsp;{{ last }}&nbsp;
	<span class="datestamp">
		{{ page.date | date: "%d %b %Y" }}
	</span>
</h1>
{% endraw %}
{% endhighlight %}

The only thing left to do is put the truncated title together with the last word, separated by a non-breaking space, and the orphans disappear.

All together:

{% highlight html %}
{% raw %}
{% assign words = page.title | split: " " %}
{% assign last = words | last %}
{% assign count = words | size | minus: 1 %}
{% assign trunctitle = page.title | truncatewords: count, '' %}
<h1 class="post-title">
	{{ trunctitle }}&nbsp;{{ last }}&nbsp;
	<span class="datestamp">
		{{ page.date | date: "%d %b %Y" }}
	</span>
</h1>
{% endraw %}
{% endhighlight %}