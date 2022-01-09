# YourArch

Remember that YouTube video you watched 6 months ago? Now you need it and you don't remember who uploaded it or what the title was. Looking for it was a pain until now

YourArch is a service that watches your YouTube history and saves all video captions so that you can search and find the exact video and time

## Install

There is a script called `ctl.sh` in the root of this project. It can do most of the management stuff.

For example you can run the project with:

```sh
./ctl.sh local build && \
  ./ctl.sh local up && \
  ./ctl.sh local migrate
```

The usage is `./ctl.sh [env] [action]`

`env` is the docker-compose file suffix, so for now there are `local` and `prod`

## Usage

This repo contains only the backend and (for now) a simple frontend, but you have to provide the backend with the videos you watched. This was easy some time ago when YouTube had an api to get users' history, but now that Google decided to remove that endpoint, you have to use the [YourArch Chrome Extension](https://github.com/victor141516/YourArch-Chrome-Extension)

Simply install it and go to any YouTube page. The extension will inject an iframe with the history page in any page you visit, then it'll scrape it and remove the iframe. This is done once every hour, but that's probably too much since it'll scrape ~200 videos each time

You can change the backend URL by clicking the extension icon in Chrome. It expects something like `https://yourarch.example.com` (without the path)
