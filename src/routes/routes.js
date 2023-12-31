const express = require('express');
const router = express.Router();
const path = require('path');
//const conectado = require('../database/db.js');
const session = require('express-session');
const { engine } = require('express-handlebars');
const msal = require('@azure/msal-node');
require('dotenv').config({ path: path.join(__dirname, '/env/.env') });

const rootDir = __dirname.slice(0, -7);
console.log(rootDir)

const confidentialClientConfig = {
    auth: {
        clientId: process.env.APP_CLIENT_ID,
        authority: process.env.SIGN_UP_SIGN_IN_POLICY_AUTHORITY,
        clientSecret: process.env.APP_CLIENT_SECRET,
        knownAuthorities: [process.env.AUTHORITY_DOMAIN], //This must be an array
        redirectUri: process.env.APP_REDIRECT_URI,
        validateAuthority: false
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const APP_STATES = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    PASSWORD_RESET: 'password_reset',
    EDIT_PROFILE: 'update_profile'
}

const confidentialClientApplication = new msal.ConfidentialClientApplication(confidentialClientConfig);

const authCodeRequest = {
    redirectUri: confidentialClientConfig.auth.redirectUri,
};

const tokenRequest = {
    redirectUri: confidentialClientConfig.auth.redirectUri,
};


// ------- paginas

router.get(['/', '/perfil', 'banco', 'subasta'], async (req, res) => {
    //res.render(path.join(route,'views/index.html'));
    res.sendFile(path.join(rootDir, '20.109.18.73', 'index.html'))
});


// ------ rutas del directorio activo

/**
 * This method is used to generate an auth code request
 * @param {string} authority: the authority to request the auth code from 
 * @param {array} scopes: scopes to request the auth code for 
 * @param {string} state: state of the application
 * @param {Object} res: express middleware response object
 */
const getAuthCode = (authority, scopes, state, res) => {

    // prepare the request
    console.log("Fetching Authorization code")
    authCodeRequest.authority = authority;
    authCodeRequest.scopes = scopes;
    authCodeRequest.state = state;

    //Each time you fetch Authorization code, update the relevant authority in the tokenRequest configuration
    tokenRequest.authority = authority;

    // request an authorization code to exchange for a token
    return confidentialClientApplication.getAuthCodeUrl(authCodeRequest)
        .then((response) => {
            console.log("\nAuthCodeURL: \n" + response);
            //redirect to the auth code URL/send code to 
            res.redirect(response);
        })
        .catch((error) => {
            res.status(500).send(error);
        });
}

//</ms_docref_authorization_code_url>


//<ms_docref_app_endpoints>
//app.get('/', (req, res) => {
//res.render('signin', { showSignInButton: true });
//});

router.get('/signin', (req, res) => {
    //Initiate a Auth Code Flow >> for sign in
    //no scopes passed. openid, profile and offline_access will be used by default.
    getAuthCode(process.env.SIGN_UP_SIGN_IN_POLICY_AUTHORITY, [], APP_STATES.LOGIN, res);
});

/**
 * Change password end point
*/
router.get('/password', (req, res) => {
    getAuthCode(process.env.RESET_PASSWORD_POLICY_AUTHORITY, [], APP_STATES.PASSWORD_RESET, res);
});

/**
 * Edit profile end point
*/
router.get('/profile', (req, res) => {
    getAuthCode(process.env.EDIT_PROFILE_POLICY_AUTHORITY, [], APP_STATES.EDIT_PROFILE, res);
});

/**
 * Sign out end point
*/
router.get('/signout', async (req, res) => {
    logoutUri = process.env.LOGOUT_ENDPOINT;
    req.session.destroy(() => {
        //When session destruction succeeds, notify B2C service using the logout uri.
        res.redirect(logoutUri);
    });
});

router.get('/redirect', (req, res) => {

    //determine the reason why the request was sent by checking the state
    if (req.query.state === APP_STATES.LOGIN) {
        //prepare the request for authentication
        tokenRequest.code = req.query.code;
        confidentialClientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            console.log(response)
            req.session.sessionParams = { user: response.account, idToken: response.idToken };
            console.log("\nAuthToken: \n" + JSON.stringify(response));
            //res.render('signin', { showSignInButton: false, givenName: response.account.idTokenClaims.given_name });
            res.redirect('/')
        }).catch((error) => {
            console.log("\nErrorAtLogin: \n" + error);
        });
    } else if (req.query.state === APP_STATES.PASSWORD_RESET) {
        //If the query string has a error param
        if (req.query.error) {
            //and if the error_description contains AADB2C90091 error code
            //Means user selected the Cancel button on the password reset experience 
            if (JSON.stringify(req.query.error_description).includes('AADB2C90091')) {
                //Send the user home with some message
                //But always check if your session still exists
                //res.render('signin', { showSignInButton: false, givenName: req.session.sessionParams.user.idTokenClaims.given_name, message: 'User has cancelled the operation' });
                res.redirect('/')
            }
        } else {

            res.render('signin', { showSignInButton: false, givenName: req.session.sessionParams.user.idTokenClaims.given_name });
        }

    } else if (req.query.state === APP_STATES.EDIT_PROFILE) {

        tokenRequest.scopes = [];
        tokenRequest.code = req.query.code;

        //Request token with claims, including the name that was updated.
        confidentialClientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            req.session.sessionParams = { user: response.account, idToken: response.idToken };
            console.log("\AuthToken: \n" + JSON.stringify(response));
            //res.render('signin', { showSignInButton: false, givenName: response.account.idTokenClaims.given_name });
            res.redirect('/')
        }).catch((error) => {
            //Handle error
        });
    } else {
        console.log(req.query.state)
        res.status(500).send('We do not recognize this response!');
    }

});


module.exports = router;
