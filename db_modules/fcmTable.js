var db = require('../db');
var mongoose = require('mongoose');
module.exports=
    {
        update:function(data,where,callback)
        {
            
              db.fcm.remove(where,async function(err,response){
               var data = await db.fcm.findOneAndUpdate(where,{"$addToSet":{"fcm":data}})
                      return callback(data);
              });
        },  save: function (values, callback) {


        var fcm = new db.fcm(values);

        fcm.save(function (err, response) {

            callback(response);
        });
    },getFcmIds:function(vendorId){
        var vendor = new mongoose.Types.ObjectId(vendorId);
        return new Promise(function(resolve){
              db.fcm.aggregate([{"$match":{"vendor_id":vendor}},

                  {"$unwind":'$fcm'},
                  {"$group":{"_id":"$vendor_id","fcm_id":{"$push":{"fcm":"$fcm.fcm_id","device_type":"$fcm.device_type"}}}}

              ],function(err,response){
                    resolve(response);
              });
        });
    },getvendordata:function(req){
       return  db.vendor.find({},{_id : 1}).lean().exec();
    },multiplegetFcmIds:function(vendorId){
        
        var vendor = new mongoose.Types.ObjectId(vendorId);
        
        return new Promise(function(resolve){
              db.fcm.aggregate([{"$match":{"vendor_id":vendor}},

                  {"$unwind":'$fcm'},
                  {"$group":{"_id":"$vendor_id","fcm_id":{"$push":{"fcm":"$fcm.fcm_id","device_type":"$fcm.device_type"}}}}

              ],function(err,response){
                    resolve(response);
              });
        });
    },getFcmIdsCustomer:function(userId){
        var user = new mongoose.Types.ObjectId(userId);
        return new Promise(function(resolve){
              db.fcm.aggregate([{"$match":{"customer_id":user}},
                  {"$unwind":'$fcm'},
                  {"$group":{"_id":"$customer_id","fcm_id":{"$push":{"fcm":"$fcm.fcm_id","device_type":"$fcm.device_type"}}}},

              ],function(err,response)
              {
                    resolve(response);
              });
        });
    },deleteVendor: function ( where, callback){
        db.fcm.remove(where, function (err, response){
            return callback(response);
        });
    },deleteFcmCusotmer:function(customerId,where,callback)
    {
        db.fcm.update({"customer_id":customerId},{ $pull:{"fcm":where}},{new: true},function(err,response){
             return callback(response);
        });
    }
    };