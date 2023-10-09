const express = require('express');
const router = express.Router();
const path = require('path');
//const conectado = require('../database/db.js');
//const session = require('express-session');

const route = __dirname.slice(0,-6);
console.log(route);

// ------- html

router.get('/', async (req, res) => {
        //res.render(path.join(route,'views/index.html'));
	res.sendfile('20.109.18.73/index.html')
});
//router.get('/creacioPartida', async (req, res) => {
//        res.render(path.join(route,'views/creacionPartida.html'));
//});
//router.get('/lobbyJuegos', async (req, res) => {
//        res.render(path.join(route,'views/lobbyJuegos.html'));
//});
//router.get('/salaJuego', async (req, res) => {
//        res.render(path.join(route,'views/salaJuego.html'));
//});


// ------ js

//router.get('/index', async (req, res) => {
//        res.redirect('/')
//});


module.exports = router;
