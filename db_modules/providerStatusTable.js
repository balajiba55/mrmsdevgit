var db=require('../db');
var mongoose=require('mongoose');
module.exports=
{
    save: function (values, callback)
    {


        var status = new db.providerStatus(values);

        status.save(function (err, response) {

            callback(response);
        });
    }
};