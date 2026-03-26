FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY websocketServer.js .

ENV WS_PORT=8080
ENV API_URL=http://localhost:3020

EXPOSE 8080

CMD ["node", "websocketServer.js"]
