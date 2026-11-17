
FROM node:22.23.4

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5002

CMD ["npm", "run", "dev"]
