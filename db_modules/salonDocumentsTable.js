var db = require('../db');
var mongoose = require('mongoose');

module.exports=
    {
        save: function (values, callback) {


            var salon = new db.salonDocuments(values);

            salon.save(function (err, response) {

                callback(response);
            });
        }, find: function (check, callback) {

        db.salonDocuments.find(check, function (err, response) {

            callback(response);
        });
    },insertMany:function (values,callback) {

        db.salonDocuments.insertMany(values,function (err,response){

            callback(response);
        })
    },update:function(data,where,callback){

        db.salonDocuments.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            callback(response);

        });
    }, updateWithPromises:function(data,where){

        return new Promise(function(resolve)
        {

            db.salonDocuments.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

                resolve(response);

            });
        });
    },deleteMany: function (where, callback)
    {
        db.salonDocuments.deleteMany(where, function (err, response)
        {
            return callback(response);
        });
    },getDocuments:function(salonId,callback){
        var salon=new mongoose.Types.ObjectId(salonId);
        db.salonDocuments.aggregate([
            {"$match":{"salon_id":salon}},
            {"$project":{"type":1,"document_reference_id":1,"path":1,"document_name":1,"salon_id":1,"is_expiry_date":1,"agent_status":1,
                "manager_status":1,"admin_status":1,
                "expiry_date":{ $cond: [ {"$eq":["$is_expiry_date",1]}, {$dateToString:{ format: "%Y-%m-%d", date: "$expiry_date"}}, '' ] }

            }}],function(err,response){

             return callback(response);
        })
    }
    }