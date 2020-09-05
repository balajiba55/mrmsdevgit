var db=require('../db');
var mongoose=require('mongoose');
module.exports=
    {
        update:function(data,where,callback){

            db.salonCart.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){
                // console.log("err++",err);
                //  console.log("after Update",response);
                callback(response);
                // console.log(doc);
            });
        }, updateMany:function(data,where,callback){
        //console.log("err++",data);

        db.salonCart.update(where, {$set:data},{ multi: true }, function(err, response){
            // console.log("err++",err);
            // console.log("after Update",response);
            callback(response);
            // console.log(doc);
        });
    }, save: function (values, callback) {


        var cart = new db.salonCart(values);

        cart.save(function (err, response) {
            // console.log("err save  eeeee",err);
            callback(response);
        });
    },find: function (check, callback) {

        db.salonCart.find(check, function (err, response) {
            //console.log("errrrr",err);
            callback(response);
        });
    }
    }