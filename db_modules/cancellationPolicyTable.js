var db=require('../db');
var mongoose=require('mongoose');
module.exports=
    {
        find: function (check, callback) {

            db.cancellationPolicy.find(check, function (err, response) {

                callback(response);
            });
        }
    };