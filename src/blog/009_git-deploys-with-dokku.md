---
title: Easy Heroku-like git deployments with Dokku and Digital Ocean
date: 2016-04-02
hero: /assets/images/dokku-header-2.jpeg
---
_tl;dr I'm gonna explain how I just set up a Digital Ocean server so I can deploy apps to it with `git push`, and oh btw I accidentally got custom DNS subdomain management (via nginx) because Dokker is p cool._

I really like [Heroku](https://www.heroku.com/). I know some developers aren't big fans, but for small hobby apps like bots or side projects, I love it for one main reason:

```console
$ git push heroku master
```

That's all it takes to deploy an app. And since my apps are almost always node.js apps, I can put the startup command in the `npm start` script inside `package.json` and that's all I have to do. Make a change, push to `heroku master`, it figures out dependencies, restarts the process, proxies to nginx. It's the best.

The only reason I looked for anything else is because I can't justify $7 per app when, like I said, these are little shitty hobby apps. I'd rather throw $10-20 at [Digital Ocean](https://m.do.co/c/4e1fe8fd0656) every month and be free to cram that box as full as it'll go with garbage apps and idiot bots. But dammit I want my easy git deployment, too. Waaaaaaaaah.

I was about to take a stab at some git hook magic myself today when at about 6:04 PM my pal [Visnup](https://twitter.com/visnup) suggested, "Dokku sounds close to what you want." I had never heard of Dokku. It's now 9:48 PM and I have a working Dokku instance running and a test app successfully deployed. And it's only costing me $5/mo for the cloud server and about $10/year for a cheap domain. Here's what I did.

## Digital Ocean

Since I'd already decided to use Digital Ocean, my first step was to spin up a droplet. If you're not familiar, DO is a great service that provides cloud servers for cheap monthly fees ([give me those sweet referral credits](https://m.do.co/c/4e1fe8fd0656)). [They even have a Dokku image](https://cloud.digitalocean.com/droplets/new?image=dokku), which I happily grabbed.

<div class="linked-image image-small">
[![Dokku on Digital Ocean](/assets/images/do-dokku-droplet.png)](https://cloud.digitalocean.com/droplets/new?image=dokku)
</div>

After picking the image, you pick a size (I grabbed the 512 MB RAM / 20 GB HD for $5/mo just to start), a datacenter, and then [add your SSH public key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2). You can also choose an optional hostname for your new droplet if you want your apps to run on something other than the dumb IP address URL.

That's it for the Digital Ocean side. The droplet should get created in under a minute.

<div class="with-caption image-small">
![Dokku image getting created](/assets/images/dokku-do.gif)
Well, maybe not _this_ fast. But it's fast.
</div>

## Dokku

Once I got Dokku installed and running on Digital Ocean, I went to the new box's IP address in the browser to bring up the Dokku setup screen.

<div class="image-small">
![Dokku setup screen](/assets/images/dokku-setup-1.png)
</div>

It imported my public key from the Digital Ocean setup (tbqh it was a little scary to see that pop up there), but not my hostname. I think it was supposed to bring the hostname over, but for me I had to add it again, and then check the "Use virtualhost naming for apps" checkbox which made the url preview change to `http://<app-name>.mydokku.rhodesjason.com`. Clicking "Finish Setup" redirected me to the Dokku documentation page. Great success.

## DNS

Since I'd opted to use hostnames instead of the IP for my Dokku apps, I needed to get my DNS set up correctly too. My domains are mostly managed through http://iwantmyname.com, but most domain management services should have a similar interface for managing your DNS records.

After logging in and finding my way to the "Manage DNS Records" page for my rhodesjason.com domain, I added two A records pointed at the IP address of my Dokku server.

![DNS A record set up](/assets/images/dns-a-records.png)

`mydokku` is the main subdomain I chose for all of my dokku apps. I set up that A record to allow me to SSH into the box at `<user>@mydokku.rhodesjason.com` and to push to the git remote I'll eventually set up there, too.

`*.mydokku` is the magic wildcard DNS that will make it so dokku can assign all of my apps to `<app-name>.mydokku.rhodesjason.com`.

Since DNS can take some time to "propagate", I usually check http://whatsmydns.net to keep track of the status. You can use `dig` on  the command line, too. Once it's propagated, you can finish setting up Dokku.

## Deploy authorization

This part of the setup bit me. I just added my public key to `/home/dokku/.ssh/authorized_keys` thinking that would give me all the permissions I need to push to the git remotes that Dokku makes, but it didn't work. Turns out there is [a special command you need to run to set up the permissions correctly](http://dokku.viewdocs.io/dokku/deployment/user-management/#adding-deploy-users).

```console
# from your local machine
# replace dokku.me with your domain name or the host's IP
# replace root with your server's root user
# USER is the username you use to refer to this particular key
cat ~/.ssh/id_rsa.pub | ssh root@dokku.me "sudo sshcommand acl-add dokku USER"
```

To be honest, it's not totally clear to me the point of the `USER` in that above command. I think just adding your key to the `dokku` user is enough, unless you have some special deploy user that a tool has to use.

## Creating a new dokku app

To create the remote repo, you have to log into the box where Dokku is running. This is a one-time setup for each app. Log into the box, then run:

```console
dokku apps:create sample-dokku
```

This does 2 things:

1. Creates the remote repo called `sample-dokku`
1. Links the app to my subdomain `sample-dokku.mydokku.rhodesjason.com`

## Deploying your local repo with a simple git push

All I need now is a little app to test this thing out with. As best as I can tell, you can use any language you want, but I threw together [a simple nodejs sample app](https://github.com/jasonrhodes/sample-dokku). If you just want something simple to test with, feel free to `git clone git@github.com:jasonrhodes/sample-dokku.git`. When you have your local git repo ready to go, you just have to add the dokku remote and push it:

```console
$ git remote add dokku dokku@<your-host-name>:<your-project-name>
$ git push dokku master
```

If everything is set up right, on push you'll see a long stream of output very similar to Heroku's deploy output:

```console
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

etc etc. When it finishes, you should see something like this:

```console
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

Huzzah, the app is deployed to my custom subdomain. Any time I make changes that I want to deploy, I just push to the `dokku` remote and off they go. And creating new apps with the same deployment process just takes a quick log in to the remote box to create the app. So far, this is exactly what I wanted. Thanks, @Visnup!

More resources that may or may not be helpful:
- http://dokku.viewdocs.io/dokku/
- https://www.andrewmunsell.com/blog/dokku-tutorial-digital-ocean/
