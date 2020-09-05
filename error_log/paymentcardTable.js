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

        db.paymentcard.updateOne({ _id: req.body._id }, { $set: req.body }).lean().exec((err, data) => {
            callback(data)
        })


    },
    gatusercards: function (req, callback) {
        db.paymentcard.find({ UserId: req.body.userId, status: "1" }).lean().exec((err, data) => {
            callback(data)
        })


    },
    gatusercardsbyId: function (req, callback) {
        db.paymentcard.find({ _id: req.body.cardId, status: "1" }).lean().exec((err, data) => {
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
       
        db.onlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId }, { $set: req.body }).lean().exec((err, data) => {
            if (req.body.paymentstatus == "success") {
                db.bookings.update({ _id: data.basketId }, { $set: { online_payment_status: true } }).lean().exec((err, data) => {
                  
                    callback(data)
                });
            } else {
                callback(data)
            }


        })

    }, gatusercardsbyconversationId: function (req, callback) {
        db.paymentcard.find({ add_coversation_id: req.body.add_coversation_id, UserId: req.body.UserId }).lean().exec((err, data) => {
            callback(data)
        })


    }, deleteonilepaymentcard: function (req, callback) {
       
        if (req.body.status == "success") {
            db.paymentcard.remove({ add_coversation_id: req.body.conversationId }).lean().exec((err, data) => {
                console.log("err, data",err, data)
                callback(data)
            })

        } else {
            callback("failed")
        }

    },
    findPaymentData: function (req, callback) {
        db.onlinepayment.find({basketId : req.body.basketId}).lean().exec((err, data) => {
            callback(data)
        })
    },
    updateconversationId: function (req) {
      
       return db.onlinepayment.findOneAndUpdate({basketId : req.body.basketId},{$set : {conversationId : req.body.conversationId}}).lean().exec();
    }
}