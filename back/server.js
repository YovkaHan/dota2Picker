/**
 * Сервер TODO-шки
 *
 * Сервер должен отдавать и писать данные в виде тудушек
 * Данные : {
 *   - id сгенеренное сервером
 *   - name
 *   - color
 *   - shape
 *   - details
 * }
 *
 *  *Запрос на создание
 *
 *  *Запрос на получение всех тудушек
 *
 *  *Запрос на получение определенной тудушки
 *
 *  *Запрос на удаление тудушки
 *
 * */
const port = 4010;
const addr = '0.0.0.0';

const path = require('path');
const express = require('express');
const app = require('express')();
const url = require('url');
const axios = require('axios');
const http = require('http').Server(app);
const io = require('socket.io')(port);
const winston = require('winston'); // for transports.Console
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');

const router = express.Router();

const heroesRoles = require('./db/heroesRoles');

http.listen(port, addr);

app.use('/', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.methodOverride());

// express-winston logger makes sense BEFORE the router
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    )
}));

// Now we can tell the app to use our routing code:
app.use(router);

// express-winston errorLogger makes sense AFTER the router.
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    )
}));

// Optionally you can include your custom error handler after the logging.
// app.use(express.errorLogger({
//     dumpExceptions: true,
//     showStack: true
// }));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://10.101.11.62:4000');
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.0.105:4000');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/heroes/roles', (req, res) => {
    res.send(heroesRoles);
});

io.on('connection', (client) => {

    console.log('user connected !!!!');

    client.on('disconnect', function () {
        console.log('user disconnected !!!!');
    });

    client.on('heroes get', function () {
        axios.get('http://www.dota2.com/jsfeed/heropickerdata?v=4890656b4890656')
            .then(response => {
                client.emit('heroes get/result', {data: response.data});
            })
            .catch(error => {
                client.emit('todo-list get/error', {error: error});
            });
    });

    client.on('heroes-adv-stat get', function () {
       axios.get('http://dotapicker.com/assets/json/data/heroadvscores.json?cv=109')
           .then(response => {
               client.emit('heroes-adv-stat get/result', {data: response.data});
           })
           .catch(error => {
               client.emit('heroes-adv-stat get/error', {error: error});
           });
    });

    client.on('heroes-win-stat get', function () {
        axios.get('http://dotapicker.com/assets/json/data/herowinscores.json?cv=109')
            .then(response => {
                client.emit('heroes-win-stat get/result', {data: response.data});
            })
            .catch(error => {
                client.emit('heroes-win-stat get/error', {error: error});
            });
    });

    client.on('shut up!', function () {
        client.emit('disconnected', {data: 'disconnected'});
    });
});