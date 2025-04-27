FROM node:20 AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM base AS development
EXPOSE 3000
CMD ["tail", "-f", "/dev/null"]

FROM base AS production
EXPOSE 8080
CMD ["npm", "run", "start"]