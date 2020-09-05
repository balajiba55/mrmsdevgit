var db = require('../db');
var mongoose = require('mongoose');
module.exports =
{
    save: function (values, callback) {
        db.paymentcard.find({ add_card_number: values.add_card_number, status: 1, UserId: values.UserId }, (err, data) => {
            console.log("data>>>>>>>>>>>>,", data)
            if (data && data.length) {
                callback("allready added");
            } else {
                var paymentcard = new db.paymentcard(values);
                paymentcard.save(function (err, response) {
                    callback(response);
                });
            }

        })

    },
    updatedocument: function (req, callback) {

        db.paymentcard.updateOne({ _id: req.body._id }, { $set: req.body }).lean().exec((err, data) => {
            callback(data)
        })


    },
    gatusercards: function (req, callback) {
        console.log("req.body.dv>>>>>>>", req.body.userId)
        
        var id = req.body.userId || req.body.vendor_id
        db.paymentcard.find({ UserId: id, status: "1" }).lean().exec((err, data) => {
            callback(data)
        })


    },
    gatusercardsbyuserId: function (userId) {
                
        return db.paymentcard.find({ UserId: userId, status: "1" }).lean().exec()
         

    },
    gatvendorcards: function (vendorId, callback) {

        return db.paymentcard.find({ UserId: vendorId, status: "1" }).sort({ _id: -1 }).lean().exec();



    },
    gatusercardsbyId: function (req, callback) {
        console.log("req.body.cardId>>>>>>>", req.body.cardId)
        db.paymentcard.find({ _id: req.body.cardId, status: "1" }).lean().exec((err, data) => {
            callback(data)
        })


    },

    addpayment: function (values, callback) {
        db.onlinepayment.find({basketId : values.basketId},async function(err,data){
            if(data && data.length){
                var removerecord = await db.onlinepayment.remove({basketId : values.basketId}).lean().exec();
                var onlinepayment = new db.onlinepayment(values);
                onlinepayment.save(function (err, response) {
                    callback(response);
                });
            }else{
                var onlinepayment = new db.onlinepayment(values);
                onlinepayment.save(function (err, response) {
                    callback(response);
                });
        

            }

        })
       
    },
    updateonilepayment: async function (req, callback) {
        // let payment_result = JSON.parse(req.body.payment_result)
        let itemTransactions = req.body.payment_result.itemTransactions
        var data = await db.onlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId }, { $set: req.body }).lean().exec();
        
        if (req.body.paymentstatus == "success") {
            var bookingupdatedata = await db.bookings.findOneAndUpdate({ _id: data.basketId }, { $set: { online_payment_status: true, payment_status: 1 } }).lean().exec();
           
            var cancellationamountupdate = await db.cancelamount.update({ bookingId: bookingupdatedata._id,status : 4,paid_status : 0}, { $set: { paid_status: 1,conversationId : req.body.conversationId } }).lean().exec();
            var getbookingdetails = await db.bookings.find({ _id: data.basketId,payment_status : 1 }, {vendor_id : 1}).lean().exec();
            for (var i = 0; i < itemTransactions.length; i++) {
                var updateddata = await db.onlinepayment.updateOne({ conversationId: req.body.conversationId, basketItems: { $elemMatch: { id: itemTransactions[i].itemId } } }, { $set: { "basketItems.$.paymentTransactionId": itemTransactions[i].paymentTransactionId } }).lean().exec();
                var updateddata = await db.onlinepayment.updateOne({ conversationId: req.body.conversationId,cancelby : 1, basketItems: { $elemMatch: { id: 1 } } }, { $set: { "basketItems.$.approve_status": 1 },order_approve_status :1 }).lean().exec();
                
                if (i == itemTransactions.length - 1) {
                    
                    callback(bookingupdatedata,getbookingdetails)
                }


            }



        } else {
            callback(data)
        }




    }, gatusercardsbyconversationId: function (req, callback) {
        db.paymentcard.find({ add_coversation_id: req.body.add_coversation_id, UserId: req.body.UserId }).lean().exec((err, data) => {
            callback(data)
        })


    }, deleteonilepaymentcard: function (req, callback) {

        if (req.body.status == "success") {
            db.paymentcard.remove({ add_coversation_id: req.body.conversationId }).lean().exec((err, data) => {
                console.log("err, data", err, data)
                callback(data)
            })

        } else {
            callback("failed")
        }

    },
    findPaymentData: function (req, callback) {
        db.onlinepayment.find({ basketId: req.body.basketId }).lean().exec((err, data) => {
            callback(data)
        })
    },
    updateconversationId: function (req) {

        return db.onlinepayment.findOneAndUpdate({ basketId: req.body.basketId }, { $set: { conversationId: req.body.conversationId } }).lean().exec();
    },

    getuserpendingtransactions: function (userId) {

        return db.bookings.find({ customer_id: userId, online_payment_status: false }).lean().exec();
    },
    updateapprovestatus: async function (req, callback) {

        var updateddata = await db.onlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId, basketItems: { $elemMatch: { paymentTransactionId: req.body.paymentTransactionId } } }, { $set: { "basketItems.$.approve_status": req.body.approve_status } }).lean().exec();
        
        var onlinepaymentdoc = await db.onlinepayment.find({ conversationId: req.body.conversationId}).lean().exec();
        var array = onlinepaymentdoc[0].basketItems;
        console.log("array>>>>>>>>>>>>>",array)
      
        if(array.every(obj => obj.approve_status == array[0].approve_status)){
            console.log("comming to if>>>>>>>>>>>>>>>",req.body.conversationId,array[0].approve_status)
            
            var updateddata = await db.onlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId}, { $set: {order_approve_status : array[0].approve_status} }).lean().exec();
           console.log("updateddata>>>>>>>>>>>>....",updateddata)
            callback(updateddata)
        } else{
            console.log("comming to else>>>>>>>>>>>>>>>")

            
            callback(updateddata)
        }
       
    },

    returnusercardsbyId: function (cardId) {
        var cardId = cardId;

        return db.paymentcard.find({ _id: cardId, status: "1" }).lean().exec();


    },

    vendoraddpayment: function (values, callback) {

        var vendoronlinepayment = new db.vendoronlinepayment(values);
        vendoronlinepayment.save(function (err, response) {

            callback(response);
        });

    },
    vendorupdateonilepayment: async function (req, callback) {

        var data = await db.vendoronlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId }, { $set: req.body }).lean().exec();
        callback(data)
    },
    updatepaymentstatus: async function (req, callback) {

        var data = await db.bookings.findOneAndUpdate({ _id: req.body.bookingId }, { $set: { payment_status: req.body.payment_status } }).lean().exec();

        callback(data)
    },
    checkpaymentstatus: async function (req, callback) {

        return await db.bookings.find({ _id: req.body.bookingId }, { payment_status: 1 }).lean().exec();

    },
    getvendorpaymentstoadmin: async function (req, callback) {

        return await db.vendoronlinepayment.find({ VendorId: req.body.VendorId, paymentstatus: "success" }, { _id: 1, card_number: 1, created: 1, paidPrice: 1 }).lean().exec();

    },
    updatepaymentinbookings: async function (where,data) {
       
        // await db.bookings.deleteOne(where).lean().exec();
        return await db.bookings.findOneAndUpdate(where, { $set: data}).lean().exec();

    },
    getuserpaymentmessage: async function (req) {
        console.log("req.body.conversationId",req.body.conversationId)
        if(req.body.type == 1){
            console.log("comming to if")
            return await db.paymentcard.find({add_coversation_id : req.body.conversationId}).lean().exec();
        }else if(req.body.type == 2){
            return await db.onlinepayment.find({conversationId : req.body.conversationId}).lean().exec();
        }else if(req.body.type == 3){
            return await db.vendoronlinepayment.find({conversationId : req.body.conversationId}).lean().exec();  
        }else if(req.body.type == 4){
            return await db.vendorbankdetails.find({setConversationId : req.body.conversationId}).lean().exec(); 
        }else{
            return 
        }
       
        
        

    } 




}