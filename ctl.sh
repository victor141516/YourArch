#!/bin/sh

env=$1
cmd="docker-compose -f docker-compose.base.yml -f docker-compose.$env.yml"

if [ "$2" = "logs" ]; then
  run="$cmd logs -f yourarch"
elif [ "$2" = "down" ]; then
  run="$cmd down"
elif [ "$2" = "up" ]; then
  run="$cmd up -d"
elif [ "$2" = "build" ]; then
  run="$cmd build yourarch"
elif [ "$2" = "rm" ]; then
  run="sudo rm -rf database"
elif [ "$2" = "pull" ]; then
  run="git pull"
fi

eval $run
