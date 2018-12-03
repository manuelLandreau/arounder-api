FROM node:10.9

LABEL maintainer="Manuel Landreau"
LABEL version="1.0.0"
LABEL description="Arounder API"

RUN mkdir -p /usr/src/
WORKDIR /usr/src/
COPY . /usr/src/

RUN npm install .

EXPOSE 8000

CMD ["npm", "run", "start:docker"]
