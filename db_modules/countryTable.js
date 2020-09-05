var db = require('../db');
var mongoose = require('mongoose');
module.exports=
{
        save: function (values, callback)
        {


            var country = new db.country(values);

            country.save(function (err, response) {

                return   callback(response);
            });
        }, insertMany: function (values, callback)
    {
        //  var bookings = new db.bookings(values);

        db.country.insertMany(values,function (err, response){

            return   callback(response);
        });
    }, find: function (check, callback) {

        db.country.find(check, function (err, response) {

            callback(response);
        });
    }, findrequiredfields: function (check, filelds) {

       return  db.country.find(check,filelds).lean().exec();

            
    },update:function(data,where,callback){

        db.country.findOneAndUpdate(where, {$set:data},{new: true},function(err, response){

            callback(response);

        });
    },checkCountry:function(country,callback)
    {
        db.country.aggregate({})
    },findFields: function (check, fields,callback) {

        db.country.find(check, fields ,function (err, response) {

            callback(response);
        });
    },findCountry: function (check, fields,callback) {
            db.country.aggregate([{"$match":check}, {"$project":fields} ],function (err, response) {

                callback(response);
            });
        }
    ,findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

        db.country.find(check, fields ,function (err, response) {
           resolve(response);
        });
        });
    },getCities: function (country,language,callback){
        /*{"$lookup":{"from":"services","let":{'city_id':"$_id"},"pipeline":[{"$match":{"service_prices":{"$elemMatch":{"$eq":["$city", ObjectId("5aacd0e682de4500a80200bf")]}}}}],
         "as":"services"}},*/
        var project={};
        project['city_id']="$cities._id";
       
        project['city_name']={"$ifNull":["$cities.city_name."+language,"$cities.city_name.en"]};

        project['_id']=0;
        db.country.aggregate([
            {"$match":{"$expr":{$or : [{"$and":[{"$eq":[{ $toLower: "$country."+language },country]},{"$eq":["$status",1]}]},{"$and":[{"$eq":[{ $toLower: "$country.en" },country]},{"$eq":["$status",1]}]}]}}}
            ,{"$lookup": {"from": "cities", "localField": "_id", "foreignField": "country_id", "as": "cities"}},
            {"$unwind":"$cities"},
            {"$project": project}
        ],function (err, response){
            return callback(response);
        });
    },updateCurrency:function(callback){
        db.country.findOneAndUpdate({"country":"India"},{"$set":{"currency_code":"INR"}}, {new: true},function(err,response){
              return callback(response);
        });
    },getAllCurrency:function(callback){
        db.currency.aggregate([{"$group":{"_id":null,"currency":{"$push":"$$ROOT"}}},
            {"$unwind":"$currency"},
            {"$project":{"_id":"$_id","currency":{ $objectToArray: "$currency" }} },
            {"$unwind":"$currency"},
            {"$group":{"_id":null,"symbol":{"$push":"$currency.v.symbol"}}}
        ],function(err,response){
             return callback(response);
        });
    },updateWithPromises:function(data,where){
    return new Promise(function(resolve){
        db.country.update(where, {$set:data}, {new: true}, function(err, response){
            return  resolve(response);
        });
    });
    }
};
