---
title: Deploy apps with 'git push' using Dokku and Digital Ocean
date: 2016-04-02
hero: /assets/images/airplay-magic.jpg
---
I really like Heroku. I know some developers aren't big fans ("that sounds nice, but I like to have more control anyway"), but it has worked great for me for little apps like Slack bots or Twitter bots or tiny things I need to ping once in a while. The greatest thing about Heroku apps is that I can deploy them with a simple `git push heroku master`, watch a ton of logs pour out, and my new code is pushed, dependecies in place, and services restarted.

Recently, Heroku started enforcing its "6 hours of sleep per day" rule for free apps. All apps get put to bed for 6 hours a day, unless you upgrade to the $7/mo plan, which you have to pay per dyno (so per app at least). To be clear, I think this is fair and I think the pricing is fair, but for little hobby shit I just couldn't justify paying a fee per app like that.

For what I do, I much prefer giving Digital Ocean $10-20 bucks per month and being able to shove as much as I can fit on one of their boxes. But with DO, I have to figure out how to deploy my code there. UGGGH life is really hard. I was going to try to write some git hook magic myself today when my waffley pal [Visnup](https://twitter.com/visnup) said, "Dokku sounds close to what you want." That was at 6:04PM, and I had never heard of Dokku. It's now 9:48PM later that day and I have a working instance running with a test app deployed. Here's what I did.

## Digital Ocean

Since I'd already decided to use Digital Ocean, my first step was to spin up a droplet. If you're not familiar with [Digital Ocean](https://www.digitalocean.com/), they're a great service that provides cloud servers for a monthly fee. [They even have a Dokku image](https://cloud.digitalocean.com/droplets/new?image=dokku), which I happily grabbed.

<div class="linked-image image-small">
[![Dokku on Digital Ocean](/assets/images/do-dokku-droplet.png)](https://cloud.digitalocean.com/droplets/new?image=dokku)
</div>

After picking the image, you pick a size (I grabbed the 512 MB RAM / 20 GB HD for $5/mo just to start), a datacenter, and then [add your SSH public key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2). The last step is to choose an optional hostname for your new droplet. If you want your apps to run on something like http://123.45.67.8, then you can leave this alone, but if you have a domain you'd like to use, enter it in the hostname now.

That's it for the DO side. The droplet should get created in under a minute.

<div class="with-caption image-small">
![Dokku image getting created](/assets/images/dokku-do.gif)
Well, maybe not _this_ fast. But it's fast.
</div>


## Dokku

Once I got Dokku installed and running on Digital Ocean, I went to the new box's IP address in the browser to bring up the Dokku setup screen.

<div class="image-small">
![Dokku setup screen](/assets/images/dokku-setup-1.png)
</div>

It imported my public key from the Digital Ocean setup (was a little scary to see that there tbqh), but not my hostname. I think it was supposed to bring the hostname over, but for me I had to add it again. After adding it back, I checked the "Use virtualhost naming for apps" checkbox, and the url preview changed to `http://<app-name>.mydokku.rhodesjason.com`. Clicking "Finish Setup" redirected me to the Dokku documentation page. Great success.

## DNS

Since I'd opted to use hostnames instead of the IP for my Dokku apps, I needed to get my DNS set up correctly too. My domains are mostly managed through http://iwantmyname.com, but most domain management services should have a similar interface for managing your DNS records.

After logging in and finding my way to the "Manage DNS Records" page for my rhodesjason.com domain, I added two A records pointed at the IP address of my Dokku server.

![DNS A record set up](/assets/images/dns-a-records.png)

`mydokku` is the main subdomain I chose for all of my dokku apps. I set up that A record to allow me to SSH into the box at `<user>@mydokku.rhodesjason.com` and to push to the git remote I'll eventually set up there, too.

`*.mydokku` is the magic wildcard DNS that will make it so dokku can assign all of my apps to `<app-name>.mydokku.rhodesjason.com`.

Since DNS can take some time to "propagate", I usually check http://whatsmydns.net to keep track of the status. You can use `dig` on  the command line, too. Once it's propagated, you can finish setting up Dokku.

## Deploy authorization

This part of the setup bit me. I just added my public key to `/home/dokku/.ssh/authorized_keys` thinking that would give me all the permissions I need to push to the git remotes that Dokku makes, but it didn't work. Turns out there is [a special command you need to run to set up the permissions correctly](http://dokku.viewdocs.io/dokku/deployment/user-management/#adding-deploy-users).

<script src="https://gist.github.com/jasonrhodes/919516e75daa50faf4ee037f7dbb0645.js"></script>

To be honest, it's not totally clear to me the point of the `USER` in that above command. I think just adding your key to the `dokku` user is enough, unless you have some special deploy user that a tool has to use.

## Creating a new dokku app

To create the remote repo, you have to log into the box where Dokku is running. This is a one-time setup for each app. Log into the box, then run:

```bash
dokku apps:create sample-dokku
```

This does 2 things:

1. Creates the remote repo called `sample-dokku`
1. Links the app to my subdomain `sample-dokku.mydokku.rhodesjason.com`

## Deploying your local repo with a simple git push

All I need now is a little nodejs app to test this thing out with. If you're testing yours, feel free to clone https://github.com/jasonrhodes/sample-dokku and use that. When you have a git repo ready to go, you just have to add the dokku remote and push it:

```bash
$ git remote add dokku dokku@mydokku.rhodesjason.com:sample-dokku
$ git push dokku master
```

If everything is set up right, you'll see a long stream of output very similar to Heroku's deploy output:

```
Counting objects: 5, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (5/5), 654 bytes | 0 bytes/s, done.
Total 5 (delta 0), reused 0 (delta 0)
-----> Cleaning up...
-----> Building sample-dokku from herokuish...
-----> Setting config vars
       CURL_CONNECT_TIMEOUT: 5
-----> Setting config vars
       CURL_TIMEOUT: 30
-----> Adding BUILD_ENV to build environment...
-----> Node.js app detected

-----> Creating runtime environment

       NPM_CONFIG_LOGLEVEL=error
       NPM_CONFIG_PRODUCTION=true
       NODE_ENV=production
       NODE_MODULES_CACHE=true

-----> Installing binaries
       engines.node (package.json):  unspecified
       engines.npm (package.json):   unspecified (use default)

       Resolving node version (latest stable) via semver.io...
       Downloading and installing node 5.10.0...
       Using default npm version: 3.8.3

-----> Restoring cache
       Skipping cache restore (new runtime signature)

-----> Building dependencies
       Pruning any extraneous modules
       Installing node modules (package.json)
       sample-dokku@1.0.0 /tmp/build
       `-- express@4.13.4
       +-- accepts@1.2.13
       | +-- mime-types@2.1.10
```

etc etc. When it finishes, you'll see something like this:

```
-----> Default container check successful!
-----> Running post-deploy
-----> Attempting to run scripts.dokku.postdeploy from app.json (if defined)
=====> renaming container (86ac85941b97) pedantic_mirzakhani to sample-dokku.web.1
-----> Creating new /home/dokku/sample-dokku/VHOST...
-----> Setting config vars
       DOKKU_NGINX_PORT: 80
-----> Configuring sample-dokku.mydokku.rhodesjason.com...(using built-in template)
-----> Creating http nginx.conf
-----> Running nginx-pre-reload
       Reloading nginx
-----> Setting config vars
       DOKKU_APP_RESTORE: 1
=====> Application deployed:
       http://sample-dokku.mydokku.rhodesjason.com
```

Ta da! The app is deployed to my custom subdomain. Any time I make changes that I want to deploy, I just push to the `dokku` remote and off they go. Creating new apps just takes a log-in on the remote box to create the app. And if you want to let others push to the remote, just add their keys with the same command used above.

I just started using it but so far it seems like just what I was looking for. Hope it works for you, too!
