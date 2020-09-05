var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    getPromoCodes : function(cityId,promo_for,callback){
        var city=new mongoose.Types.ObjectId(cityId);
                  promo_for=parseInt(promo_for);
        db.promoCode.aggregate(
            [
                {"$match":{"city":city,"promo_for":promo_for}},
            {"$lookup":{"from":"country","localField":"country","foreignField":"_id","as":"countryDetails"}},
            {"$unwind":"$countryDetails"},
            {"$project":{"title":"$title","currency_code":"$countryDetails.currency_code",
                "currency_symbol":"$countryDetails.currency_symbol",
                "amount":"$amount",
                "amount_type":"$amount_type",
                "promo_for":"$promo_for",
            "promo_code":"$promo_code","first_booking":"$first_booking","repeat":"$repeat","image":"$image"}}
            ],
            function (err, response) {
           return  callback(response);
        });
    },getPromoCodesForSalon : function(promo_for,callback){

        db.promoCode.aggregate(
            [

            {"$project":{"title":"$title","currency_code":"awe",
                "currency_symbol":"د.إ",
                "amount":"$amount",
                "amount_type":"$amount_type",
                "promo_for":"$promo_for",
            "promo_code":"$promo_code","first_booking":"$first_booking","repeat":"$repeat","image":"$image"}}
            ],
            function (err, response) {
           return  callback(response);
        });
    }, findFieldsWithPromises: function (check, fields) {
    return new Promise(function(resolve){

        db.promoCode.find(check, fields ,function (err, response) {

            resolve(response);
        });
    });
},insertMany:function(values,callback)
    {


        db.promoCode.insertMany(values,function (err,response){

            callback(response);
        })

    }
};