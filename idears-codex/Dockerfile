FROM node:14-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "src/index.js"]