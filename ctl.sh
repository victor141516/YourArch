#!/bin/sh

env=$1
compose_base="docker-compose -f docker-compose.base.yml -f docker-compose.$env.yml"

if [ "$2" = "logs" ]; then
  run="$compose_base logs -f yourarch"
elif [ "$2" = "down" ]; then
  run="$compose_base down"
elif [ "$2" = "up" ]; then
  run="$compose_base up -d"
elif [ "$2" = "build" ]; then
  run="$compose_base build yourarch"
elif [ "$2" = "ps" ]; then
  run="$compose_base ps"
elif [ "$2" = "migrate" ]; then
  run="$compose_base exec yourarch npm run prisma:migrate -- --schema node_modules/.prisma/client/schema.prisma"
elif [ "$2" = "psql" ]; then
  run="$compose_base exec postgres psql -h127.0.0.1 -Upostgres postgres"
elif [ "$2" = "psql-select-SubtitlePhrase" ]; then
  run="$compose_base exec postgres psql -h127.0.0.1 -Upostgres -c " 'select * from "SubtitlePhrase";' "postgres"
elif [ "$2" = "rm" ]; then
  run="sudo rm -rf database"
elif [ "$2" = "pull" ]; then
  run="git pull"
fi

eval $run
