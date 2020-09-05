var db = require('../db');
module.exports={
        save: function (values, callback) {


            var salon = new db.salonPictures(values);

            salon.save(function (err, response) {

                callback(response);
            });
        }, insertMany:function (values,callback) {

        db.salonPictures.insertMany(values,function (err,response) {

            callback(response);
        });
    },find: function (check, callback) {

        db.salonPictures.find(check, function (err, response) {
            callback(response);
        });
    },deleteMany: function (where, callback) {
        db.salonPictures.deleteMany(where, function (err, response) {
            return callback(response);
        });
    }, findFieldsWithPromises: function (check, fields){
        return new Promise(function(resolve){

            db.salonPictures.find(check, fields ,function (err, response) {
                resolve(response);
            });
        });
    }
    };