FROM node:22

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build
RUN npx next telemetry disable

EXPOSE 3000

VOLUME [ "/app/VoiceMemos" ]

CMD ["npm", "start"]
