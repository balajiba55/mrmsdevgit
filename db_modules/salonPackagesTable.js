var db = require('../db');
var mongoose = require('mongoose');
module.exports=
    {
        save: function (values, callback) {

            var addSalonPackages = new db.salonPackages(values);
            addSalonPackages.save(function (err, response) {

                return callback(response);
            });
        }, find: function (check, callback) {

        db.salonPackages.find(check, function (err, response) {

            callback(response);
        });
    }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

            db.salonPackages.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });
        },
        update:function(data,where,callback){

            db.salonPackages.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

                callback(response);

            });
        },
        packagesList:function(salonId,callback)
        {
            var salon = mongoose.Types.ObjectId(salonId);

            db.salonPackages.aggregate([
                {"$match":{"salon_id":salon,"status":1}},
                {"$unwind":"$services"},
                {"$lookup":{"from":"services","localField":"services.service_id","foreignField":"_id","as":"serviceDetails"}},
                {"$lookup":{"from":"salonServices","let":{"service":"$services.service_id","salon_id" : "$salon_id","service_for":"$services.service_for"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service"]},
                        {"$eq":["$salon_id","$$salon_id"]},
                        {"$ne":['$status',0]},
                        {"$eq":["$$service_for","$service_for"]}]}}}],
                    "as":"salonServices"}},
                {"$unwind":"$salonServices"},
                {"$unwind":"$serviceDetails"},
                {"$group":{"_id":"$_id","services_details":{"$push":{"service_name":"$serviceDetails.service_name.en",
                    "service_cost":"$salonServices.service_cost","service_time":"$salonServices.service_time",
                    "service_for":"$services.service_for"}},
                    "package_name":{"$first":"$package_name"},"package_for":{"$first":"$package_for"},
                    "total_service_time":{"$sum":"$salonServices.service_time"},
                    "total_service_cost":{"$sum":"$salonServices.service_cost"},
                    'discount_amount':{"$first":'$discount_amount'},
                    "package_amount":{"$first":"$package_amount"}}},

                {"$project":{"_id":0,"package_id":"$_id","service_details":"$services_details","package_amount":"$package_amount",
                    "package_name":"$package_name","total_service_cost":"$total_service_cost","discount_amount":"$discount_amount",
                    "total_service_time":"$total_service_time"}}],function(err,response){
               return callback(response)
            });
        }, packagesServicePrices:function(packageId)
        {

            var package = mongoose.Types.ObjectId(packageId);
            return new Promise(function(resolve){
                db.salonPackages.aggregate([
                    {"$match":{"_id":package,"status":1}},
                    {"$unwind":"$services"},
                    
                    {"$lookup":{"from":"salonServices","let":{"service":"$services.service_id","salon_id" : "$salon_id","service_for":"$services.service_for"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service"]},
                            {"$eq":["$salon_id","$$salon_id"]},
                            {"$ne":['$status',0]},
                            {"$eq":["$$service_for","$service_for"]}]}}}],
                        "as":"salonServices"}},
                    {"$unwind":"$salonServices"},
                    {"$group":{"_id":"$_id","services_details":{"$push":{
                        "service_id":"$services.service_id",
                        "category_id":"$salonServices.category_id",
                        "service_cost":"$salonServices.service_cost","service_time":"$salonServices.service_time",
                        "service_for":"$services.service_for"}},
                        "package_name":{"$first":"$package_name"},"package_for":{"$first":"$package_for"},
                        "total_service_time":{"$sum":"$salonServices.service_time"},
                        "total_service_cost":{"$sum":"$salonServices.service_cost"},
                        'discount_amount':{"$first":'$discount_amount'},
                        "package_amount":{"$first":"$package_amount"}}},
                    {"$project":{"_id":0,"package_id":"$_id","service_details":"$services_details","package_amount":"$package_amount",
                        "package_name":"$package_name","total_service_cost":"$total_service_cost","discount_amount":"$discount_amount",
                        "total_service_time":"$total_service_time"}}
                    ],function(err,response){

                         
                   return resolve(response);
                });
            });
            
        },
    }