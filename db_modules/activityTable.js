var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    save: function (values, callback)
    {
        var activity = new db.activity(values);

        activity.save(function (err, response) {

            callback(response);
        });
    }
};