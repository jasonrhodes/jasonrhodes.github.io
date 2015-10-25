---
title: AirPlay Problems Disappear With This One Weird Trick!
date: 2015-10-24
hero: /assets/images/airplay-magic.jpg
---
I bought an Apple TV for my living room when we cut DirecTV earlier this year, but the AirPlay mirroring feature never worked. Today, I finally discovered why, kind of, or at least how to fix it, I think.

If you have AirPlay problems where you can't seem to ever connect, or if you do it lags horribly and disconnects, sometimes knocking out your entire Wi-Fi, try this. Log into your wireless router. I have a Cisco/LinkSys E2500, but I think this is a problem for many kinds of routers. I logged into mine at http://192.168.1.1, but if that doesn't work for you, Google for the brand of your router and "IP address" to get some other suggestions to try.

Once you're logged in, you'll need to find a setting called "WMM" or "WiFi Multimedia" support. Fair warning, this setting is _supposed_ to make streaming easier and more reliable, so disabling it could cause you other problems if you stream on other devices like a PlayStation, XBox, etc. For iOS devices, laptops, and Apple TVs, this setting made me feel sad.

I found it under *Applications & Gaming* > *QOS* and no, I have no idea what these settings are all about. I set WMM to disabled like so:

![Disabling WMM in a Cisco Router](/assets/images/disable-wmm.png)

and ... ta da! I could use AirPlay. That's my whole story.