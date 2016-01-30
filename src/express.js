'use strict';

const rx = require('rx');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

module.exports = rx.Observable.create(function (o) {
    const expressApp = express();

    expressApp.use(function (req, res, next) {
        const headers = req.headers;
        const contentType = headers['Content-Type'];

        if (!contentType) {
            headers['Content-Type'] = 'application/json';
        }

        next();

    });

    // parse application/json
    expressApp.use(bodyParser.json());

    expressApp.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', "*");
      res.header('Access-Control-Allow-Headers', 'authentication, Origin, Content-Type, Accept');
      next();
    });

    expressApp.use(cors());

    o.onNext(expressApp);
    o.onCompleted();
});
