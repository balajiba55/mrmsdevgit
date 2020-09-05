var db = require('../db');
var mongoose = require('mongoose');
module.exports=
    {
        find: function (check, callback) {

            db.category.find(check, function (err, response) {
                callback(response);
            });
        },
        getCategory:function (callback) {

            db.category.aggregate([

                {"$project":{"category_name":"$category_name.en","category_id":"$_id","_id":0}}
                   ],function (err,response) {

                   return   callback(response);
            })
        },getCategoryUrls:function(callback){
          db.category.aggregate([{"$group":{"_id":null,"url":{"$push":"$video_url"}}}],function(err,response){
              return callback(response);
          });
         },updateWithPromises:function(data,where)
          {
            return new Promise(function(resolve){
                db.category.update(where, {$set:data}, {new: true}, function(err, response){

                    return  resolve(response);

                });
            });
           }, findFieldsWithPromises: function (check, fields){
        return new Promise(function(resolve){

            db.category.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });
    },
    };