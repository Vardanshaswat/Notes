FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for native builds
RUN apk add --no-cache python3 make g++ krb5-dev libc6-compat

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Rebuild lightningcss for musl
# RUN npm rebuild lightningcss

# Build Next.js app
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]