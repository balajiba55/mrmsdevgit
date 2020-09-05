var db = require('../db');
module.exports =
{
    save: function (values, callback) {


        var otp = new db.otp(values);
        // console.log(user);
        otp.save(function (err, response) {
           return  callback(response);
        });
    },
    select: function (callback) {

        db.otp.find(function (err, response) {
            callback(response);
        });
    },
    find: function (check, callback) {

        db.otp.find(check, function (err, response) {
            callback(response);
        });
    },
    findFields: function (check, fields , callback) {

        db.otp.find(check, fields ,function (err, response) {
            callback(response);
        });
    },
    update:function(data,where,callback)
    {

        db.otp.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){
            if(err){

                callback(null);
            }
            callback(response);

        });
    }
};