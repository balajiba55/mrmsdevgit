var db=require('../db');
var mongoose=require('mongoose');

module.exports=
    {
        save: function (values, callback) {

            var salonFilteredItems = new db.salonFilteredItems(values);
            salonFilteredItems.save(function (err, response) {

                return callback(response);
            });
        }, find: function (check, callback) {

        db.salonFilteredItems.find(check, function (err, response) {

            callback(response);
        });
    }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

            db.salonFilteredItems.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });},deleteFilteredItems:function(condition,callback)
{
    db.salonFilteredItems.deleteMany(condition,function(err,response){

        return callback(response);
    });
}
    };