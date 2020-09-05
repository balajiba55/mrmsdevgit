
var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    getGiftCards : function(cityId,callback)
    {
        var city=new mongoose.Types.ObjectId(cityId);
        db.giftCards.aggregate(
            [
                
                {"$match":{"cities":city,"status":{"$ne":2}}},
                {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"countryDetails"}},
                {"$unwind":"$countryDetails"},
                {"$project":{"title":"$title.en",
                    "currency_code":"$countryDetails.currency_code",
                    "currency_symbol":"$countryDetails.currency_symbol",
                    "amount":"$price",
                    "amount_type":"$amount_type",
                    "coupon_for":"$promo_for",
                    "description":"$description.en",
                    "coupon_code":"$coupon_code",
                    "first_booking":"$first_booking",
                    "repeat":"$repeat",
                     "validity_type":{"$ifNull":['$validity.type',4]},
                     "validity":{"$ifNull":['$validity.value','']},
                    "image":"$coupon_image"}}
            ],
            function (err, response)
            {

                return  callback(response);
            });
    },findFieldsWithPromises: function (check, fields){
        return new Promise(function(resolve){

            db.giftCards.find(check, fields ,function (err, response)
            {

                resolve(response);
            });
        });
    },insertMany:function(values,callback)
    {


        db.giftCards.insertMany(values,function (err,response){

            callback(response);
        })

    },updateWithPromises:function(data,where)
    {
    return new Promise(function(resolve){
        db.giftCards.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            resolve(response);

        });
    });},CreateGiftCardCouponCodeWithPromises:function(data,where){
    return new Promise(function(resolve){
        db.giftCards.findOneAndUpdate(where,{$addToSet:{'gift_card':data}},{new: true},function(err, response){

            resolve(response);

        });
    });},userGiftCardList:function(userId,callback){
        var user=new mongoose.Types.ObjectId(userId);

        db.customers.aggregate([{"$match":{"_id":user}},{"$unwind":"$gift_card"}
            ,{"$lookup":{"from":"giftCards","let":{"gift_card":"$gift_card.gift_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$gift_card","$_id"]}]}}}],"as":"giftCards"
            }},{"$unwind":"$giftCards"},
            {"$lookup":{"from":"country","localField":"giftCards.country_id","foreignField":"_id","as":"countryDetails"}},
            {"$unwind":"$countryDetails"},
            {"$project":{"title":"$giftCards.title.en","amount":"$giftCards.price",
                "currency_code":"$countryDetails.currency_code",
                "gift_card_type":{"$ifNull":["$gift_card.gift_card_type",2]},
                "currency_symbol":"$countryDetails.currency_symbol",
                "description":"$giftCards.description.en","code":"$gift_card.code",
                "created_at":{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$gift_card.created"}},
                "expiry_date":{"$ifNull":[{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$gift_card.expiry_date"}},'']}}},
            {"$sort":{"created_at":-1}}
        ],function(err,response){
            return callback(response);
        });
    },unUseduserGiftCardList:function(userId,cityId,callback)
    {
        var user=new mongoose.Types.ObjectId(userId);
        var city=new mongoose.Types.ObjectId(cityId);

        db.customers.aggregate([
            {"$match":{"_id":user}},
            {"$unwind":"$gift_card"},
            {"$match":{"gift_card.gift_card_type":1}}
            ,{"$lookup":{"from":"giftCards","let":{"gift_card":"$gift_card.gift_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$gift_card","$_id"]},{"$in":[city,"$cities"]}]}}}],"as":"giftCards"
            }},{"$unwind":"$giftCards"},
            {"$lookup":{"from":"country","localField":"giftCards.country_id","foreignField":"_id","as":"countryDetails"}},
            {"$unwind":"$countryDetails"},
            {"$lookup":{"from":"bookings"
                ,"let":{"coupon":"$gift_card.code","customer_id":"$_id"},
                'pipeline':
                [{"$match":{"$expr":{"$and":[{"$eq":["$$coupon","$coupon"]},{"$eq":["$$customer_id","$customer_id"]},
                {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",7]},{"$eq":["$status",8]}]}]}}}],"as":"bookingDetails"}},
            {"$match":{"$expr":{"$and":[{"$eq":[{"$size":"$bookingDetails"},0]}]}}},
            {"$project":{"title":"$giftCards.title.en","amount":"$giftCards.price",
                "currency_code":"$countryDetails.currency_code",
                "gift_card_type":{"$ifNull":["$gift_card.gift_card_type",2]},
                "currency_symbol":"$countryDetails.currency_symbol",
                "description":"$giftCards.description.en",
                "code":"$gift_card.code",
                "created_at":{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$gift_card.created"}}}},
            {"$sort":{"created_at":-1}}
        ],function(err,response){



            return callback(response);
        });
    }
};