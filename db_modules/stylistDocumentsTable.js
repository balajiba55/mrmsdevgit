var db = require('../db');
var mongoose = require('mongoose');
module.exports =
{
    save: function (values, callback) {


        var salon = new db.stylistDocuments(values);

        salon.save(function (err, response) {

            callback(response);
        });
    }, find: function (check, callback) {

        db.stylistDocuments.find(check, function (err, response) {

            callback(response);
        });
    }, update: function (data, where, callback) {

        db.stylistDocuments.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

            callback(response);

        });
    }, insertMany: function (values, callback) {
        //  var bookings = new db.bookings(values);


        db.stylistDocuments.insertMany(values, function (err, response) {

            return callback(response);
        });
    }, deleteMany: function (where, callback) {
        db.stylistDocuments.deleteMany(where, function (err, response) {
            return callback(response);
        });
    }, deleteWithPromises: function (where) {


        return new Promise(function (resolve) {
            db.stylistDocuments.deleteMany(where, function (err, response) {

                return resolve(response);
            });
        });
    }, updateWithPromises: function (data, where) {

        return new Promise(function (resolve) {
            db.stylistDocuments.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {

            db.stylistDocuments.find(check, fields, function (err, response) {

                resolve(response);
            });
        });
    }, getDocuments: function (vendorId, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        var obj = {reason : ""}
        db.stylistDocuments.aggregate([
            { "$match": { "vendor_id": vendor } },
            { $lookup: { from: "stylistDocumentStatus",let: { id : "$_id", "role" : "2" },pipeline: [{ $match:{ $expr:{ $and:[{ $eq: [ "$document_id",  "$$id" ] },{ $eq: [ "$role",  2 ] }]}}},{ $project: { _id : 0 } }],as: "agentreason" } },

            
            {
                "$project": {
                    
                    // "agentreason": { "$ifNull": [{ $arrayElemAt: [ "$agentreason",  { $subtract: [{ $size: "$agentreason"}, 1 ] }] },""]},
                    // "agentreason": { "$ifNull": ["$agentreason[1].reason",""]},
                    "agentreason": { "$ifNull": [{ $arrayElemAt: [ "$agentreason",-1] },obj]},
                    
                    "type": 1, "document_reference_id": 1, "path": 1, "document_name": 1, "salon_id": 1, "is_expiry_date":
                        { $cond: [{ "$and": [{ "$ne": ["$expiry_date", ''] }, { "$ifNull": ["$expiry_date", 0] }] }, 1, 0] }
                    , "agent_status": 1,
                    "manager_status": 1, "admin_status": 1,
                    "expiry_date": { $cond: [{ "$and": [{ "$ne": ["$expiry_date", ''] }] }, { $dateToString: { format: "%Y-%m-%d", date: "$expiry_date" } }, ''] }
                }
            }], function (err, response) {
                
                return callback(response);
            })
    }
};