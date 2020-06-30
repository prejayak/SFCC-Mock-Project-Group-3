'use strict';

var server = require('server');

server.get('World', function (req, res, next) {
	var h = "hello";
    res.render('hello/helloWorld');
    next();
});


module.exports = server.exports();