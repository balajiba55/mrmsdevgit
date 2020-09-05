var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    getCouponCodes : function(cityId,customerId,date,promFor,salonId,languageCode,callback){
        var city=new mongoose.Types.ObjectId(cityId);
        var customer=new mongoose.Types.ObjectId(customerId);

       var couponCondition=[
           {"$in":[city,'$city_id']},{"$eq":['$status',1]},
           { "$or":[
                {"$or":[{"$and":[{"$eq":["$coupon_type",1]},{"$eq":["$coupon_scope",1]}]}]},
                {"$or":[{"$and":[{"$eq":["$coupon_type",1]},{"$in":[customer,{"$ifNull":["$customers",[]]}]}]}
                ]},
                {"$or":[{"$and":[{"$eq":["$coupon_type",3]},{"$eq":["$coupon_scope",1]}]}]},
                {"$or":[{"$and":[{"$eq":["$coupon_type",3]},{"$in":[customer,{"$ifNull":["$customers",[]]}]}]}]}
            ]}];
       var tmp='';
       /* if(promFor==2)
        {
            couponCondition.push({"$eq":["$coupon_type",3]});
        }*/
        if(promFor==1)
        {
            couponCondition.push({"$ne":["$coupon_type",3]});
        }
        if(salonId!='')
        {
            var salon=new mongoose.Types.ObjectId(salonId);
            couponCondition.push({"$eq":["$salon_id",salon]})
        }

        db.coupons.aggregate(
            [
                {"$match":{"$expr":{"$and":couponCondition}}},
                {"$project":{"expiry_date":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$expiry_date"}},
                    "valid_from":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$valid_from"}},"coupon_data":"$$ROOT"}},
                {"$match":{"$expr":{"$and":[{"$gte":[date,'$valid_from']},{"$lte":[date,'$expiry_date']}]}}},
                {"$replaceRoot": {
                        "newRoot": "$coupon_data"
                }
                },
                {"$lookup":{"from":"bookings",'let':{'coupon_code':"$coupon_code"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$coupon_code",'$coupon']},
                        {"$eq":["$customer_id",customer]}
                        ]}}}],"as":'bookingDetails'}},
                {"$match":{"$expr":{"$and":[{"$lte":[{"$sum":[{"$ifNull":["$repeat",0]},1]},"$bookingDetails"]}]}}},
                {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"countryDetails"}},
                {"$unwind":"$countryDetails"},
                {"$project":{"title":"$title.en","currency_code":"$countryDetails.currency_code",
                    "currency_symbol":"$countryDetails.currency_symbol",
                    "amount":"$amount",
                    "amount_type":"$amount_type",
                    "coupon_for":"$promo_for",
                    "description":{"$ifNull":["$description."+languageCode,""]},
                    "valid_till":{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$expiry_date"}},
                    'created':1,
                    "coupon_code":"$coupon_code","first_booking":"$first_booking",
                    "repeat":"$repeat",
                    "image":"$coupon_image"
                }},
                {"$sort":{"created":-1}}
            ],
            function (err, response)
            {


                return  callback(response);
            });
    }, findFieldsWithPromises: function (check, fields)
    {
    return new Promise(function(resolve){

        db.coupons.find(check, fields ,function (err, response){
            resolve(response);
        });
    });
    }, checkPromoWithPromises: function (couponCode)
    {
    return new Promise(function(resolve){

        db.coupons.aggregate([{"$match":{"coupon_code":couponCode}},
        {"$project":{"min_amount":1,
        "first_booking":1,
        "amount_type":1,
        "amount":1,
        "repeat":1,
        "up_to_amount":1,
        "coupon_scope":1,
        'coupon_type':1,
        "city_id":1,
        "country":1,
                "customers":1,
                "customer_id":1,
        'valid_from':{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$valid_from"}},
        'expiry_date':{$dateToString:{ format: "%Y-%m-%d %H:%M", date: "$expiry_date"}}}}] ,function (err, response){

            resolve(response);
        });
    });
    },insertMany:function(values,callback)
    {


    db.coupons.insertMany(values,function (err,response){

        callback(response);
    })

   },saveWithPromises: function (values)
    {
    return new Promise(function(resolve)
    {
        var coupons = new db.coupons(values);

        coupons.save(function (err, response){

            resolve(response);
        });
    });
   },getSalonCouponCodes : function(salonId,promoScope,languagesCode,callback){
        var salon=new mongoose.Types.ObjectId(salonId);

        var copuonscope='';
        if(promoScope!='')
        {
            promoScope=parseInt(promoScope);
              copuonscope={"$match":{"$expr":{"$and":[{"$eq":[salon,'$salon_id']},{"$eq":['$status',1]},{"$eq":["$coupon_scope",promoScope]}
            ]}}};

        }else
            {
                  copuonscope={"$match":{"$expr":{"$and":[{"$eq":[salon,'$salon_id']},{"$eq":['$status',1]}
                ]}}};
            }
        db.coupons.aggregate([
                 copuonscope,
                {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"countryDetails"}},
                {"$unwind":"$countryDetails"},
                {"$project":{
                    "title":"$title."+languagesCode,
                    "currency_code":"$countryDetails.currency_code",
                    "currency_symbol":"$countryDetails.currency_symbol",
                    "amount":"$amount",
                    "coupon_scope":"$coupon_scope",
                    "amount_type":"$amount_type",
                    "coupon_for":"$promo_for",
                    'up_to_amount':"$up_to_amount",
                    'min_amount':"$min_amount",
                    "description":"$description.en",
                    "valid_till":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$expiry_date"}},
                    "valid_from":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$valid_from"}},
                    "coupon_code":"$coupon_code","first_booking":"$first_booking",
                    "repeat":"$repeat",
                    "image":"$coupon_image",
                    'created':{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}
                }},
                {"$sort":{'created':-1}}
            ],function (err,response)
            {
                return  callback(response);
            });
    },
    updateUsersWithPromises:function(data,where)
    {
         return new Promise(function(resolve){
             db.coupons.update(where, {$addToSet:data}, {new: true}, function(err, response){
                 return  resolve(response);

             });
         });
    },pullWithPromises:function(data,where){
    return new Promise(function(resolve){
        db.coupons.findOneAndUpdate(where, {$pull:data}, {new: true}, function(err, response){

            resolve(response);

        });
    });}

};
