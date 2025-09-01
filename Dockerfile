FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ krb5-dev

COPY package*.json ./


RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "start"]
