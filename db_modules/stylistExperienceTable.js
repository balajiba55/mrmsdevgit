var db = require('../db');
var mongoose = require('mongoose');
module.exports =
{
    insertMany: function (values, callback) {
        //  var bookings = new db.bookings(values);


        db.stylistExperience.insertMany(values, function (err, response) {

            return callback(response);
        });
    }, find: function (check, callback) {

        db.stylistExperience.find(check, function (err, response) {

            callback(response);
        });
    }, findwithaggregation: function (check, callback) {
        var vendor_id = new mongoose.Types.ObjectId(check.vendor_id);

        db.stylistExperience.aggregate([{ "$match": {vendor_id : vendor_id} },{$lookup : {from: "services",localField: "service_id",foreignField: "_id",as: "servicesdetails"}},{$project : {_id : 1,service_id : 1,vendor_id : 1,from : 1,to : 1,experience : 1 ,experience_as : 1,created : 1,updated : 1,servicename : "$servicesdetails.service_name" }}],(err,data)=>{
            callback(data);

        })
    }, findFields: function (check, fields, callback) {

        db.stylistExperience.find(check, fields, function (err, response) {
            callback(response);
        });
    }, deleteMany: function (where, callback) {
        db.stylistExperience.deleteMany(where, function (err, response) {
            return callback(response);
        });
    }, insertManyWithPromises: function (values) {
        return new Promise(function (resolve) {
            db.stylistExperience.insertMany(values, function (err, response) {
                resolve(response);
            });
        });
    }, deleteManyWithPromises: function (where) {
        return new Promise(function (resolve) {
            db.stylistExperience.deleteMany(where, function (err, response) {

                return resolve(response);
            });
        });
    }
};