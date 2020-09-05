var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    save: function (values, callback)
    {


        var requestedServices = new db.requestedServices(values);

        requestedServices.save(function (err, response) {

            callback(response);
        });
    }

     };