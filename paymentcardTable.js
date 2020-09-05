var db = require('../db');
var mongoose = require('mongoose');
module.exports =
{
    save: function (values, callback) {
        var paymentcard = new db.paymentcard(values);
        paymentcard.save(function (err, response) {
            callback(response);
        });
    },
    updatedocument: function (req, callback) {
        console.log("req.body._id>>>>>>>..",req.body._id,req.body)
       db.paymentcard.updatedocument({_id : req.body._id},{$set : req.body}).lean().exec((err,data) => {
           callback(data)
       })
        
      
    },
    gatusercards: function (req, callback) {
        db.paymentcard.find({UserId : req.body.userId,status : "1"}).lean().exec((err,data) => {
            callback(data)
        })
         
       
     },
     gatusercardsbyId: function (req, callback) {
        db.paymentcard.find({_id : req.body.cardId,status : "1"}).lean().exec((err,data) => {
            callback(data)
        })
         
       
     },
     addpayment: function (values, callback) {
       
        var onlinepayment = new db.onlinepayment(values);
        onlinepayment.save(function (err, response) {
            callback(response);
        });
       
     },  
     updateonilepayment: function (req, callback) {
       
        db.onlinepayment.update({_id : req.body._id},{$set : req.body}).lean().exec((err,data) => {
            callback(data)
        })
       
     }
}