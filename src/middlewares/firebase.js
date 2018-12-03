const firebase = require('firebase');
const config = require('../config');

// Firebase init
firebase.initializeApp(config.firebase);

// Firebase middleware and abstractions
module.exports = {

    /**
     * Sign in with login/password
     * @param login
     * @param password
     * @param next
     */
    login: ({login, password}, next) => {
        // firebase.auth()
        //     .signInWithEmailAndPassword(login, password)
        //     .then(({uid, displayName, email, photoURL}) => next(null, {uid, displayName, email, photoURL}))
        //     .catch((error) => {
        //         if (error.code === 'auth/wrong-password') {
        //             console.log('firebase', error);
        //             next('Wrong password.');
        //         } else {
        //             console.log('firebase', error);
        //             next(error.message);
        //         }
        //     });
        next(null, {
            uid: '1234567890',
            displayName: 'manu',
            email: 'manu@test.com',
            photoURL: 'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2016%2F08%2F20%2F05%2F38%2Favatar-1606916_640.png&f=1'
        });
    },

    /**
     * Signup with username/email/password
     * @param req
     * @param next
     */
    register: (req, next) => {
        const {username, email, password} = req;
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(() => {
                firebase.User().updateProfile({displayName: username});
                this.login(req, next);
            })
            .catch((error) => {
                // Handle Errors here.
                if (error.code === 'auth/weak-password') {
                    next('The password is too weak.');
                } else {
                    next(error.message);
                }
            });
    }
};