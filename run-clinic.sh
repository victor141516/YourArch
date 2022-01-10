#!/bin/sh

yes | npm i -g clinic &&
  apk add --no-cache jq &&
  exec clinic flame -- $(cat package.json | jq -r '.scripts["run-compiled"]') dist/index.js
