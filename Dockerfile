FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY import-custom-emojis.js ./

CMD ["node", "import-custom-emojis.js"]
