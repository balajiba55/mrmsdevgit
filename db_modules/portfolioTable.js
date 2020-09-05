var db = require('../db');
module.exports=
    {
        save: function (values, callback) {


            var user = new db.portfolio(values);

            user.save(function (err, response) {

                callback(response);
            });
        },
        insertMany:function (values,callback) {

            db.portfolio.insertMany(values,function (err,response){


                   callback(response);
            })
        },find: function (check, callback) {

        db.portfolio.find(check, function (err, response) {
            callback(response);
        });
    },deleteMany: function (where, callback) {
        db.portfolio.deleteMany(where, function (err, response) {

            return callback(response);
        });
    },insertManyWithPromises:function (values) {

        return new  Promise(function(resolve){

            db.portfolio.insertMany(values ,function (err, response) {
                     
                resolve(response);
            });
        });
    },deleteManyWithPromises: function (where) {
        return new  Promise(function(resolve){
        db.portfolio.deleteMany(where, function (err, response) {

            return resolve(response);
        });
       });
    }
    };