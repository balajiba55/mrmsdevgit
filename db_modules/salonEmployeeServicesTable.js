var db = require('../db');
module.exports=
    {
        save: function (values, callback){


            var services = new db.salonEmployeeServices(values);

            services.save(function (err, response) {

                callback(response);
            });
        },
        insertMany:function (values,callback){

            db.salonEmployeeServices.insertMany(values,function (err,response){

                callback(response);
            })
        }, find: function (check, callback) {

        db.salonEmployeeServices.find(check, function (err, response) {
            callback(response);
        });
    },updateMany:function(data,where,callback)
    {
        db.salonEmployeeServices.update(where,
            {"$set":data},{multi:true},function(err,response){

                return callback(response);
            });
    },deleteMany: function (where, callback) {
        db.salonEmployeeServices.deleteMany(where, function (err, response) {

            return callback(response);
        });
    },  updateWithPromises:function(data,where){
        return new Promise(function(resolve){
            db.salonEmployeeServices.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response)
            {
                resolve(response);
            });
        });
    },updateManyWithPromises: function (data, where) {

    return new  Promise(function(resolve)
    {
        db.salonEmployeeServices.update(where, {$set: data}, {multi: true}, function (err, response) {

            resolve(response);

        });
      })
    }
    };