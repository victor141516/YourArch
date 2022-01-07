#!/bin/sh

env=$1
cmd="docker-compose -f docker-compose.base.yml -f docker-compose.$env.yml"

if [ $2 = 'logs' ]; then
  $cmd logs -f yourarch
elif [ $2 = 'down' ]; then
  $cmd down
elif [ $2 = 'up' ]; then
  $cmd up -d
elif [ $2 = 'build' ]; then
  $cmd build yourarch
elif [ $2 = 'rm' ]; then
  sudo rm -rf database
elif [ $2 = 'pull' ]; then
  git pull
fi
