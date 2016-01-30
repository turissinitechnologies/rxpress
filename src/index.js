'use strict';

const rx = require('rx');
const expressStream = require('./express');

module.exports = function (routesStream) {
    return expressStream.map((expressApp) => {
        const requests = new rx.Subject();

        expressApp.requests = requests.asObservable();

        const responsesStream = expressApp.responses = routesStream.flatMap((routeData) => {
            console.log(`Listening for ${routeData.method.toUpperCase()} ${routeData.path}`);

            function createResponseObject (req, res) {
                return {
                    data: {},
                    req: req,
                    write: function () {
                        res.write(JSON.stringify(this.data));
                    },

                    end: function () {
                        res.end();
                    }
                }
            }

            return rx.Observable.create(function (o) {
                expressApp[routeData.method](routeData.path, function (req, res) {
                    requests.onNext(req);

                    const response = createResponseObject(req, res);

                    routeData.handler(req).first()
                        .subscribe(function (data) {
                            response.data = {
                                data: data
                            };

                            o.onNext(response);
                        }, function (error) {
                            const errorMessage = error.message ? error.message : error;
                            const data = {
                                error: {
                                    message: errorMessage
                                }
                            };

                            response.data = data;

                            o.onNext(response);
                        });
                })
            });

        })
        .publish();

        responsesStream.subscribe((response) => {
            response.write();
            response.end();
        });


        expressApp.start = function (port) {
            responsesStream.connect();
            expressApp.listen(port);
        };

        return expressApp;

    })
    .first();

}
