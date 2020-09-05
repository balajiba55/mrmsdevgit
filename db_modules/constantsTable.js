var db = require('../db');
var mongoose = require('mongoose');

module.exports={
    findFieldsWithPromises: function (check, fields) {
    return new Promise(function(resolve){

        db.constants.find(check, fields ,function (err, response) {
            resolve(response);
        });
    });
},getBookingPercentage: function (bookingType) {

        return new Promise(function(resolve){

            db.constants.aggregate([{"$match":{"booking_type":bookingType,"constant_type":1}},
                {"$sort":{"created":-1}},
                {"$skip":0},
                {"$limit":1},
                {"$project":{"booking_percentage":1}}] ,function (err, response) {
                resolve(response);
            });
        });
    }
};