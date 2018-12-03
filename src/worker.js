const SCWorker = require('socketcluster/scworker');
const fs = require('fs');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const healthChecker = require('sc-framework-health-check');
const firebase = require('./middlewares/firebase');
const places = require('./middlewares/googlePlaces');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`${process.env.dbUser}:${process.env.dbPass}@${process.env.dbHost}`);

const MessageSchema = new mongoose.Schema({
    channel: String,
    text: String,
    user: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

class Worker extends SCWorker {

    run() {
        console.log('   >> Worker PID:', process.pid);
        const environment = this.options.environment;

        const app = express();

        const httpServer = this.httpServer;
        const scServer = this.scServer;

        if (environment === 'dev') {
            // Log every HTTP request. See https://github.com/expressjs/morgan for other
            // available formats.
            app.use(morgan('dev'));

            // Add GET /health-check express route
            healthChecker.attach(this, app);
        }

        httpServer.on('request', app);

        /**
         * Subscribe middleware token check
         */
        scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, (req, next) => {
            const authToken = req.socket.authToken;
            console.log('MIDDLEWARE_SUBSCRIBE', req.channel, authToken);
            if (req.authTokenExpiredError) {
                next(req.authTokenExpiredError); // Fail with a default auth token expiry error
            } else if (authToken) {
                next();
            } else {
                next('You are not authorized to publish to ' + req.channel);
            }
        });

        /**
         * Messages persist
         */
        scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_IN, ({data, channel}, next) => {
            console.log('MIDDLEWARE_PUBLISH_IN', data.text);
            const {text, createdAt, user} = data;
            Message.create({channel, text, createdAt, user})
                .then(() => {

                }).catch(err => {
                    next(err);
                });
            next();
        });

        /**
         * In here we handle our incoming realtime connections and listen for events.
         */
        scServer.on('connection', (socket) => {

            console.log('User connection');
            socket.on('neabyPlaces', (coords, next) => {
                console.log('coords', coords);
                places.getNearbyPlaces(coords, (places, err) => {
                   if (err) {
                       console.log(err);
                   } else {
                       console.log(places);
                       socket.emit('neabyPlaces', places);
                   }
                });
            });

            // Authentification with login/password
            socket.on('login', (req, next) => {//firebase.login(req, (err, user) => {
            //     if (err) {
            //         console.log('login', err);
            //         next(err);
            //     }
                const user = {
                    uid: '1234567890',
                    displayName: 'manu',
                    email: 'manu@test.com',
                    photoURL: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2016%2F08%2F20%2F05%2F38%2Favatar-1606916_640.png&f=1'
                };
                socket.emit('userInfo', user);
                socket.setAuthToken({user: user.email});
                next();
            });

            // Registration with username/email/password
            socket.on('register', (req, next) => firebase.register(req, (err, user) => {
                if (err) {
                    next(err);
                }
                socket.emit('userInfo', user);
                socket.setAuthToken({user: user});
                next();
            }));

            // Fetch older messages
            socket.on('oldMessages', ({channel}) => {
                Message
                    .find({channel})
                    .limit(10)
                    .sort({createdAt: -1})
                    .exec()
                    .then(
                        messages => {
                            socket.emit('oldMessages', messages)
                        }
                    );
            });

            // Fetch older messages
            socket.on('olderMessages', ({channel, date}) => {
                Message
                    .find({channel, createdAt: {$lt: date}})
                    .limit(10)
                    .sort({createdAt: -1})
                    .exec()
                    .then(
                        messages => {
                            console.log('older', messages);
                            socket.emit('olderMessages', messages)
                        }
                    );
            });

            // Get user infos
            socket.on('userInfo', () => {
                socket.emit('userInfo', socket.getAuthToken());
                console.log('userinfo', socket.getAuthToken());
            });

            socket.on('disconnect', () => {
                console.log('User left');
            });
        });
    }
}

new Worker();
