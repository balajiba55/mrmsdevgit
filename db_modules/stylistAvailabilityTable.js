var db=require('../db');
var mongoose=require('mongoose');
module.exports=
    {
        status:
            {
              "1":{ "status":1,"message":"availabile"},
              "2":{ "status":2, "message":"booked" }
            },
        update:function(data,where,callback){

            db.stylistAvailability.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

                if(err){

                    callback(null);
                }
                callback(response);
                // console.log(doc);
            });
        },updateMany:function(data,where,callback){

        db.stylistAvailability.update(where, {$set:data},{ multi: true }, function(err, response){
            // console.log("err++",err);
            // console.log("after Update",response);
            callback(response);
            // console.log(doc);
        });
    }
    }