---
layout: post
title: Let the robots deploy your code
subtitle: Think about all the time you'll have to complain about open-source projects on Twitter if you just let robots deploy for you
tags: [deployment, capistrano, git]
---

I used to have a well-rehearsed routine that you might recognize.

1. Open "Coda" or a similar FTP-coupled editor
1. Reverse publish from the remote server
1. Make changes to the file(s) locally
1. Mark a set of files for publishing from my local machine
1. Make sure that if I haven't properly set up the remote and local folders for this project (and I was never really sure that I had), that I'm in the right directory in both locations manually
1. Publish the marked files
1. Pray that I didn't overwrite anything that I didn't mean to overwrite

Sometimes I would mix in a few steps like "_Forget which server has the most up to date files, then inspect each one line by line and try to figure out which is the right one_" or "_Overwrite 3 weeks of changes by pulling down an old copy of code and overwriting my local copy by accident_".

What a rush!

Learning version control solved some of the pain of accidental overwrites, etc. But even after we got into a good version control workflow (we use git and Github at Johns Hopkins), deployment was still pretty manual for a while. Now, it looked like

1. `$ scp` the folder into a `tmp` directory on the staging or production server
1. [_do things on the remote server via ssh_]
1. Move the current code out of the main folder and into some backup folder, maybe, or just remove it entirely
1. Move the new code into the main folder _as fast as possible_ to minimize downtime

There were a lot of reasons why this process sucked. But really, this is a repetitive list of really important tasks, and it's the kind of thing that we humans suck at and that a robot goes _GA GA_ over. And since we're definitely not robotic [(wink, wink)](https://gimmebar.com/view/50c74599aac422ce14000000), why waste so much time on such a robot-friendly job?

\[Enter _Capistrano_\]

I first heard of Capistrano from the Ruby clans who were all using it for deploying their Rails to-do apps. I assumed, like you might, that it wouldn't work for PHP projects, but if you can get Ruby installed on your local machine and you have SSH access to the remote servers, that's all you really need, especially if the project is hosted on Github (even a private repo). After a small amount of Ruby version-related setup pain, our deployment process became:

{% highlight sh %}
$ cap (environment) deploy
{% endhighlight %}

Interested?

### If you have ssh access, use Capistrano

Here's the basic runthrough of what Capistrano does: connect to a remote server via ssh, cd into the project folder, clone from the repo/branch you designate into a folder named as a unix timestamp, run through a series of tasks that you designate, points the symlink of "[project]/current" to the new timestamped directory. Rolling back, or `$ cap rollback`, just points the symlink back and removes the latest directory. And the site's virtual host just has to be adjusted to point to [project]/current/public or whatever.

The traditional Cap setup is just a `Capfile` (think Makefile, Gemfile, etc) in your project root alongside `config/deploy.rb`. The settings are almost all self-explanatory and easy to adapt for your own setup. And if you need to deploy to multiple environments, like we do, that's easy too. There's [a gem called multistage](https://github.com/capistrano/capistrano/wiki/2.x-Multistage-Extension) that changes the deploy.rb file into a deploy directory, with [environment].rb files inside. We have config/deploy/staging.rb and config/deploy/production.rb, with environment-specific settings in each.

We default the deploy command to our staging environment, so deploying to staging is really just `$ cap deploy` and deploying to production is `$ cap production deploy`. Once everything is automated, you can build in some pretty neat tricks and defaults, too. 

For instance, one of the settings you set is which branch to deploy from. In staging.rb, we set it like this:

{% highlight ruby %}
set :branch, $1 if `git branch` =~ /\* (\S+)\s/m # "master"
{% endhighlight %}

It prints out the branches and regex selects the branch with an "*", so you can easily deploy from whichever branch you happen to be on (make sure it's pushed to github!). But in production.rb, we just use:

{% highlight ruby %}
set :branch, "master"
{% endhighlight %}

Which keeps us from ever mistakenly deploying to production from any branch but master. Robots keep us safe. And because one of our databases is currently a Drupal database, we have a series of Drupal-related tasks we'd like to run through on every deploy. Writing your own custom tasks is pretty easy once you get familiar with the DSL. A sampling of our Drupal tasks:

{% highlight ruby %}
namespace :drupal do
	
	# Clear all caches
	task :clear_caches do 
        run "cd #{latest_release}/public/factory && drush cc all"
	end
	
	# revert all features
	task :features_revert do
	    run "cd #{latest_release}/public/factory && drush fr-all"
	end		
	
    # shared directories
    task :setup do
        run "mkdir -p #{shared_path}/files"
        run "chown -R #{user}:web #{deploy_to}"
    end
 
    # ... etc

end
{% endhighlight %}

Adding these tasks into the deployment flow is also pretty easy.

{% highlight ruby %}
after "deploy:setup", "drupal:setup"
after "deploy:create_symlink", "drupal:clear_caches"
# etc
{% endhighlight %}

Or you can call a task manually from your local machine, like `$ cap drupal:features_revert` to abstract the ssh file system navigation, or group together a bunch of steps into one easy command you run from time to time.

Capistrano is also great for managing Composer, if you add the vendor file to your .gitignore and let your remote servers install dependencies on each deployment.

{% highlight ruby %}
task :update_dependencies do 
	# Uses composer to update dependencies into the vendor/ directory
	run "cd #{current_release} && php composer.phar update"
end
{% endhighlight %}

If you have SSH access to your remote servers, Capistrano will change your deployment life. But what if you're stuck on a shared host that doesn't allow good SSH access? Back to FTP copy and paste hell? That's what I thought for a long time, when I would come home at night and work on smaller freelance projects, and it made me cry.

And then I discovered git-ftp.

### If you only have FTP access, use git-ftp

[git-ftp](https://github.com/resmo/git-ftp) isn't going to let you automate extra deployment tasks, or protect you from deploying from the wrong branch. Capistrano is way better if you can use it. But if you can't, you still want to avoid manually copying and pasting files over FTP if you value your life and sanity. Once you've initialized a git repo in your project and have git-ftp installed on your machine, you can set it up quickly.

{% highlight sh %}
$ git config git-ftp.user jason
$ git config git-ftp.url ftp.mysite.com
$ git config git-ftp.password password1234 # kids love this password
{% endhighlight %}

You can easily point it to a subfolder of the ftp site, too, using ftp.mysite.com/public_html/mysubfolder, if you need to. Then, once you commit your changes, you just git ftp them up.

{% highlight sh %}
# The first time
$ git ftp init

# Every other time, it just pushes the diff
$ git ftp push
{% endhighlight %}

Quick, smart deployment for an FTP project. 


**Some resources**

* [Mac OS X, Ruby, RVM, Rails and You](http://ryanbigg.com/2011/06/mac-os-x-ruby-rvm-rails-and-you/)
* [Ruby and GCC issues on Mac OS X](http://stackoverflow.com/questions/8032824/cant-install-ruby-under-lion-with-rvm-gcc-issues)
* [Ruby installer for Windows](http://rubyinstaller.org/)
* ["Getting Started" with Capistrano documentation](https://github.com/capistrano/capistrano/wiki/2.x-Getting-Started)
* [git-ftp](https://github.com/resmo/git-ftp)


