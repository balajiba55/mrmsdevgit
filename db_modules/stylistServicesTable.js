var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    save: function (values,callback)
    {



        db.stylistServices.insertMany(values,function (err, response) {

            return callback(response);
        });
    },
    find: function (check, callback) {

        db.stylistServices.find(check, function (err, response) {

            callback(response);
        });
    },  findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

            db.stylistServices.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });
    },
    findFields: function (check, fields , callback) {

        db.stylistServices.find(check, fields ,function (err, response) {
            callback(response);
        });
    },
    serviceList:function (vendorId,languageCode,callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);

        db.stylistServices.aggregate([
            {"$match":{"vendor_id":vendor,"stauts":{"$ne":0}}},
            {"$group":{"_id":"$service_id"}},
            {"$lookup":{"from":"services","localField":"_id","foreignField":"_id","as":"services"}},
            {"$unwind":"$services"},
            {"$project":{"_id":0,"service_id":"$_id","service_name":{"$ifNull":["$services.service_name."+languageCode,"$services.service_name.en"]}}}

            ],function(err,response){

               return callback(response);
        });
    },deleteMany: function (where, callback) {
        db.stylistServices.deleteMany(where, function (err, response) {
            return callback(response);
        });
    }, updateMany:function(data,where,callback){
        db.stylistServices.update(where, {$set:data},{ multi: true }, function(err, response){

            callback(response);

        });
    },  insertMany: function (values, callback){
        //  var bookings = new db.bookings(values);

        db.stylistServices.insertMany(values,function (err, response) {

            return   callback(response);
        });
    }, updateWithPromises:function(data,where){
        return new Promise(function(resolve){
            db.stylistServices.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

                resolve(response);

            });
        });
    }, updateManyWithPromises:function(data,where){
        return new Promise(function(resolve){
            db.stylistServices.update(where, {$set:data},{multi:true}, function(err, response){

                resolve(response);

            });
        });
    },deleteWithPromises: function (where) {
        return new Promise(function(resolve) {
            db.stylistServices.remove(where, function (err, response) {
                return resolve(response);
            });
        });
}
};
