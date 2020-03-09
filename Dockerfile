FROM node:12
WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY index.js .
COPY /api ./api
ENV NODE_ENV=development
EXPOSE 8080
CMD npm start