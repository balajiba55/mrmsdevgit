var db = require('../db');
var mongoose = require('mongoose');
module.exports =
    {
    findFieldsWithPromises: function (check, fields){
    return new Promise(function(resolve){

        db.documents.find(check, fields ,function (err, response) {
            resolve(response);
        });
    });
}
    }