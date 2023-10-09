const express = require('express');
const path = require('path');
const session = require('express-session');
const { engine } = require('express-handlebars');
const msal = require('@azure/msal-node');
const app = express();

//app.use(express.urlencoded({extended:false}));
//app.use(express.json());

//dotenv var.entorno
const dotenv = require("dotenv");
dotenv.config({path:path.join(__dirname,'/env/.env')})

//configuracion
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'ejs');


/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */

//var.session
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // set this to true on production
    }
}

app.use(session(sessionConfig));




//DB
//const conectado = require('./database/mysql.js');
//const req = require('express/lib/request');

//recursos
app.use(express.static('20.109.18.73'));

//rutas
app.use(require('./routes/routes.js'));

//server
app.listen(process.env.SERVER_PORT,()=>{
    console.log("server on :"+ process.env.SERVER_PORT);
});
