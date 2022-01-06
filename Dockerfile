FROM node:lts-alpine as builder

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm i
COPY . /app
RUN npm run prisma:generate && npm run build


FROM node:lts-alpine

WORKDIR /app
COPY --from=builder /app/dist /app/package.json /app/package-lock.json /app/
RUN npm install --only=production
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

ENTRYPOINT ["npm", "run", "run-compiled", "--", "index.js"]
