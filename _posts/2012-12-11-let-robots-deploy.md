---
layout: post
title: Let the robots deploy your PHP project
subtitle: Robots like Capistrano and git-ftp are better at this than you are, and you have better things to do, like complaining about open-source projects on Twitter
tags: [deployment, capistrano, git, robots]
---

I used to have a well-rehearsed routine that you might recognize.

1. Open "Coda" or a similar FTP-coupled editor
1. Reverse publish from the remote server
1. Make changes to the file(s) locally
1. Mark a set of files for publishing from my local machine
1. Make sure that if I haven't properly set up the remote and local folders for this project (and I was never really sure that I had), that I'm in the right directory in both locations manually
1. Publish the marked files
1. Pray that I didn't overwrite anything that I didn't mean to overwrite

Sometimes I would mix in steps like 

> Forget which server has the most up to date files, so inspect both files and try to figure out which is more current  

or  

> Overwrite 3 weeks of changes by pulling down an old copy of the code and overwriting my local copy by accident  

What a rush!

Somewhere along the way, I learned about version control. I could write for a long time about how git completely changed my life. But even after I'd learned git, I was only using it to "track changes" of all my work, both locally and eventually on Github's remote servers. When it came time to make changes that went live, I was still wrestling with FTP dragons and still getting regularly burned.

At Johns Hopkins, we finally moved away from shared hosting and got ourselves a couple of dedicated servers that allowed SSH access. The process changed to something like this.

1. Pull the latest changes from the `master` branch.
1. `$ scp` the folder into a `tmp` directory on the staging or production server
1. Log into the server with ssh
1. Make any changes that are necessary for the code to work on the remote servers, by hand
1. Move the current code out of the main folder and into some backup folder, maybe, or just remove it entirely
1. Move the new code into the main folder as fast as possible to minimize downtime

It wasn't a great system even for somebody who isn't automating the process. But the point is that this is an incredibly mundane set of rote tasks, and it's the kind of thing that a robot goes GA GA over. And since we're [NOT ROBOTIC](https://gimmebar.com/view/50c74599aac422ce14000000), we really shouldn't be wasting time on such a robot-friendly job. 

And then I stumbled on Capistrano.

The short side-story here is that I had a brief love affair with Ruby a few years ago, and became really enamored with a lot of what they do. I wrote a few Rails apps and went to some meetups, and I learned a ton about programming. I'm heading to the Rails meetup here in Baltimore tonight, in fact. One thing I really loved about the Ruby world was all of the small useful libraries that they were able to plug into their workflows, something that PHP is getting a lot better at, which is exciting, too.

Capistrano was the library everybody seemed to use for deployment. "Deployment" was one of those scary words that would send me scrambling for my FTP credentials. It sounded incredibly complex and involved. But it turns out, using Capistrano is easy and not just for Ruby folks. You need to know a very minimal amount of Ruby and install a modern version of Ruby on your local machine, but if you have a Mac, it's already installed.

Once you have it set up and running, all of the steps above are swapped out for one: `$ cap deploy`. Interested?

### How to use Capistrano to deploy via ssh

Getting it up and running the first time is by far the most difficult part of using Capistrano. Mostly because getting an up to date version of Ruby usually requires ... RVM (cue the menacing score). RVM is a Ruby version manager. There are alternatives, and I'd be happy to hear about how to make this easier, but up to now I've suffered through the RVM setup, which includes the awesome and wonderful process of installing an up to date copy of XCODE! Trust me, run through it once and you'll never have to think about it again.

[Mac OS X, Ruby, RVM, Rails and You](http://ryanbigg.com/2011/06/mac-os-x-ruby-rvm-rails-and-you/)  
[Ruby installer for Windows](http://rubyinstaller.org/)

Once you've got Ruby all set, you should be using 1.9.3 or later. You can quickly run `$ rvm use 1.9.3`, or create a simple .rvmrc file in each project directory that has that `rvm use 1.9.3` line at the top to automate it (notice a theme?). Next, you have to install Capistrano. Ruby has a system for installing small libraries of code that they call "gems". If you've never run Ruby before you may need to run a quick setup script to get the `gem` command working.

[RubyGems installation](http://docs.rubygems.org/read/chapter/3)

Now installing gems from the remote gem repo is as easy as `$ gem install myfavoritegem`. This is a little confusing, because some gems are global utilities to use from your command-line interface (CLI), and some are project-specific that you'd have to include from your Ruby project's Gemfile. Don't worry about the second one, Capistrano is a global utility so once we install it, we're done.

```
$ gem install capistrano
```

That's really it. 


