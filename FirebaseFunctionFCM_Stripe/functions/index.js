"use strict";
const functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var errorhandler = require('errorhandler');
const cors = require('cors');

const express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(bodyParser.json({ limit: '5mb' }));
const stripe = require('stripe')('sk_test_fg6lxRP5xB7Hk8BnlBatro95');
var gcm = require('node-gcm');
var sender = new gcm.Sender('AAAAkWWvpcA:APA91bHBWqJU2UrXo8FKq37x8zv5vTAqmevna8PsxzEX8cAgywb_gMOO6V7zxzmrTP-BfqDi-LK57OceG6t-13qSRk2kpkMO1KQQgvz5rlXtVpcYXZjiYWAuaLQHOxSGmZEPLIXSPu1t'); //put your server key here
var FCM = require('fcm-push');
var serverKey = 'AAAAkWWvpcA:APA91bHBWqJU2UrXo8FKq37x8zv5vTAqmevna8PsxzEX8cAgywb_gMOO6V7zxzmrTP-BfqDi-LK57OceG6t-13qSRk2kpkMO1KQQgvz5rlXtVpcYXZjiYWAuaLQHOxSGmZEPLIXSPu1t';
var fcm = new FCM(serverKey);

app.use(cors());
app.use(function (err, req, res, next) {
    if (err.name === 'StatusError') {
        res.send(err.status, err.message);
    } else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next(err);
    }
});
if (process.env.NODE_ENV === 'development') {
    console.log("-----------", process.env.NODE_ENV);
    app.use(express.logger('dev'));
    app.use(errorhandler());
}

var router = express.Router();
//Direct payment with Stripe token
router.post('/direct_pay', (request, response) => {
    var stripetoken = request.body.stripetoken;
    var amountpayable = request.body.amount;
    var currency = request.body.currency;
    var description = request.body.description;
    console.log(stripetoken);
    console.log(amountpayable);
    console.log(currency);
    console.log(description);
    stripe.charges.create({
        amount: amountpayable * 100,
        currency: currency,
        description: description,
        source: stripetoken,
    }, function (err, charge) {
        if (err) {
            response.status(200).json({
                success: false,
                message: "Charge Failed!"
            });
        } else {
            response.status(200).json({
                success: true,
                message: "Successfully Charged!"
            });
        }
    });
})
//Create Custommer with Stripe token
router.post('/create_customer', (request, response) => {
    var stripetoken = request.body.stripetoken;
    var email = request.body.email;
    var description = request.body.description;
    console.log("Customer Create", stripetoken, email, description);
    stripe.customers.create({
        email: email,
        description: description,
        source: stripetoken,
    }, function (err, customer) {
        if (err) {
            response.status(200).json({
                success: false,
                message: "Charge Failed!"
            });
        } else {
            response.status(200).json({
                success: true,
                message: "Successfully Charged!",
                customer: customer.id
            });
        }
    });
})
//Update Custommer with Stripe token
router.post('/update_customer', (request, response) => {
    var stripetoken = request.body.stripetoken;
    var strcustomerid = request.body.customerid;
    var description = request.body.description;
    console.log("Customer Update", strcustomerid, stripetoken, description);
    stripe.customers.update(strcustomerid, {
        description: description,
        source: stripetoken,
    }, function (err, customer) {
        if (err) {
            response.status(200).json({
                success: false,
                message: "Update Failed!"
            });
        } else {
            response.status(200).json({
                success: true,
                message: "Successfully Updated!",
                customer: customer.id
            });
        }
    });
})
//Pay with Customer Id
router.post('/customer_pay', (request, response) => {
    var customerid = request.body.customerid;
    var amountpayable = request.body.amount;
    var currency = request.body.currency;
    var description = request.body.description;
    console.log("Customer Pay", customerid, amountpayable, currency, description);
    stripe.charges.create({
        amount: amountpayable * 100,
        currency: currency,
        description: description,
        customer: customerid
    }, function (err, charge) {
        if (err) {
            response.status(200).json({
                success: false,
                message: "Charge Failed!"
            });
        } else {
            response.status(200).json({
                success: true,
                message: "Successfully Charged!"
            });
        }
    });
})
//Send Notification to specified device
router.post('/pushnoti', (request, response) => {
    console.log("ABC", request.body);
    // let message = new gcm.Message({
    //     notification: {
    //         title: request.body.title,
    //         body: request.body.msg
    //     },
    // });

    // Specify which registration IDs to deliver the message to
    var regTokens = request.body.deviceTokens;
    // Actually send the message
    // sender.sendNoRetry(message, regTokens, (err, resp) => {
    //     if (err) {
    //         console.error(err);
    //         response.status(200).json({
    //             success: false,
    //             message: "Charge Failed!"
    //         });
    //     }
    //     else {
    //         console.log(resp);
    //         response.status(200).json({
    //             success: true,
    //             message: "Successfully Charged!"
    //         });
    //     }
    // });
    var message = {
        registration_ids: regTokens, // required fill with device token or topics
        notification: {
            title: request.body.title,
            body: request.body.msg
        }
    };

    //callback style
    fcm.send(message, function (err, resp) {
        if (err) {
            console.log(err);
            response.status(200).json({
                success: false,
                message: "Successfully Charged!"
            });
        } else {
            console.log(resp);
            response.status(200).json({
                success: true,
                message: "Successfully Charged!"
            });
        }
    });
})

app.use(router);

exports.fcmapi = functions.https.onRequest(app);