FROM node:lts-alpine as builder
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm i
COPY . /app
RUN npm run prisma:generate && npm run build


FROM node:lts-alpine as dev
VOLUME [ "/app" ]
WORKDIR /app
RUN apk add --no-cache musl-dev && \
  mkdir -p "/tmp/.npm" && \
  chown -R 1000:1000 "/tmp/.npm"
ENV HOME=/tmp
CMD ["npm", "run", "start"]


FROM node:lts-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/package.json /app/package-lock.json /app/
RUN npm install --only=production
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/src/static/index.html /app/src/static/index.html
ENTRYPOINT ["npm", "run", "run-compiled", "--", "index.js"]
