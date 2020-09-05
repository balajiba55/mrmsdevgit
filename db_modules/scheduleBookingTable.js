var db = require('../db');
var mongoose = require('mongoose');

module.exports =
    {
        type: {
            "1": {type: 1, "message": "part of the day"},
            "2": {type: 2, "message": "specific time of the day"}
        }, status: {
            "1": {type: 1, "message": "cart items is not assinged"},
            "2": {type: 2, "message": "assinged cart items to schedule"},
            "3": {type: 3, "message": "schedule booked"},
        },
        save: function (values, callback) {

            var scheduleBooking = new db.scheduleBooking(values);
            scheduleBooking.save(function (err, response) {

                return callback(response);
            });
        }, findFieldsWithPromises: function (check, fields){
            return new Promise(function(resolve){

                db.scheduleBooking.find(check, fields ,function (err, response) {

                    resolve(response);
                });
            });
        }, update:function(data,where,callback){

        db.scheduleBooking.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            callback(response);

        });
    },checkScheduleBookingCouponCode:function(scheduleId){
    var schedule=new mongoose.Types.ObjectId(scheduleId);

    return new Promise(function(resolve) {
        db.scheduleBooking.aggregate([
            {"$match":{"$expr":{"$and":[{"$eq":["$_id",schedule]}]}}},
            {"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},"pipeline":
                        [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],"as":"cartItems"}},
            {"$unwind":"$cartItems"},
            { $replaceRoot: { newRoot: "$cartItems" } },
            {
                "$group": {
                    "_id": "$customer_id", "total_amount": {"$sum": "$price"}, "coupon": {
                        "$first": {
                            "coupon": "$coupon",
                            "coupon_amount_type": "$coupon_amount_type",
                            "up_to_amount": "$up_to_amount",
                            'min_amount':"$min_amount",
                            "coupon_id": "$coupon_id"
                        }
                    }
                }
            }
        ], function (err,response){

            return resolve(response);
        });
    });
},removeCartItemsWithPromises: function (data, where) {

            return new  Promise(function(resolve) {
                db.scheduleBooking.update(where, {$pull: data},{new: true}, function (err, response) {

                    resolve(response);

                });
            })}
            ,updateManyWithPromises: function (data, where, callback) {

    return new  Promise(function(resolve) {
        db.scheduleBooking.update(where, {$set: data}, {multi: true}, function (err, response) {

            resolve(response);

        });
    })
},getCartDetailsFindStylist:function(scheduleId,callback)
    {
        var schedule = new mongoose.Types.ObjectId(scheduleId);

        db.scheduleBooking.aggregate([{"$match":{"$expr":{"$and":[{"$eq":["$_id",schedule]}]}}},
            {"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},"pipeline":
                [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],"as":"cartItems"}},
            {"$unwind":"$cartItems"},
            { $replaceRoot: { newRoot: "$cartItems" } }
        ],function(err,response){
            return callback(response);
        });},getScheduleCartDetails: function (scheduleId, callback)
        {
            var schedule = new mongoose.Types.ObjectId(scheduleId);
            db.scheduleBooking.aggregate([{"$match":{"$expr":{"$and":[{"$eq":["$_id",schedule]}]}}},
                {"$unwind":"$cart_id"},
                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],"as":"cartItems"}},
                {"$unwind":"$cartItems"},
                { $replaceRoot: { newRoot: "$cartItems" } }
            ], function (err, response) {

                return callback(response);
            })
        },getCartDetails:function(scheduleId,callback)
    {
        var schedule = new mongoose.Types.ObjectId(scheduleId);

        db.scheduleBooking.aggregate([{"$match":{"$expr":{"$and":[{"$eq":["$_id",schedule]}]}}},
            {"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},"pipeline":
                [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],"as":"cartItems"}},
            {"$unwind":"$cartItems"},
            { $replaceRoot: { newRoot: "$cartItems" } },
            {"$group": {
                    "_id": "$vendor_id",
                    "services": {
                        "$push": {
                            "cart_id": "$_id",
                            "service_id": "$service_id",
                            "latitude": "$latitude",
                            "longitude": "$longitude",
                            "selected_service_level": "$selected_service_level",
                            "selected_for": "$selected_for",
                            "price":"$price",
                            "quantity":"$quantity",
                            "cart_for":"$cart_for",
                            'duration':"$duration"
                        }
                    },
                    coupon_code_details:{"$first":{"coupon_amount":{"$ifNull":["$coupon_amount",0]},
                            "coupon_code":{"$ifNull":['$coupon','']},
                            "up_to_amount":{"$ifNull":["$up_to_amount",0]},
                            "type":{"$ifNull":["$coupon_amount_type",0]},
                            'coupon_scope':{"$ifNull":["$coupon_scope",1]},
                            'min_amount':"$min_amount",
                            'coupon_type':'$coupon_type',
                            'coupon_id':'$coupon_id'
                        }},
                    "additional_details":{"$first":{"$ifNull":["$additional_details",{}]}},
                    "city_id": {"$first": "$city_id"},
                    "latitude": {"$first": "$latitude"},
                    "longitude": {"$first": "$longitude"},
                    "address": {"$first": "$address"},
                    "payment_type":{"$first":"$payment_type"},
                    "card_id":{"$first":"$card_id"}
                }
            }
        ],function(err,response){
            return callback(response);
        });
    },scheduleList:function(customerId,callaback)
     {
    var customer = new mongoose.Types.ObjectId(customerId);

    db.scheduleBooking.aggregate([
        {"$sort":{"created":-1}},

        {"$match":{"$expr":{"$and":[{"$eq":["$customer_id",customer]},{"$eq":["$status",2]},{"$gte":[{"$size":"$cart_id"},1]}]}}},


        {"$project":{"schedule_id":"$_id",
            "created":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}},
            "schedule_date":"$date","schedule_time":{"$cond":[{"$eq":["$type",2]},"$time",'$timebetween']},
            "type":"$type","timezone":"$timezone",
            "schedule_code":{"$ifNull":[{"$concat":["#BSCH-",{$substr:["$schedule_inc_id", 0, -1 ]}]},1]},
            "assign_date":{"$dateToString":{format: "%Y-%m-%d %H:%M","date":{ $dateFromString : { dateString:
                {"$concat":["$date",' ', "$time"] },timezone: "$timezone"}}}}
    }}
    ],function(err,response){

        return callaback(response);
    });
},checkSchedulePromoCartTotal: function (scheduleId) {
    var schedule = new mongoose.Types.ObjectId(scheduleId);
    return new Promise(function(resolve){
        db.scheduleBooking.aggregate([
            {"$match": {"_id": schedule, "status":  2}},
            {"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart", let:{"cart_id":"$cart_id"},
                    "pipeline": [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],
                    "as":"cartItems"}},
            {"$unwind":"$cartItems"},
            {$replaceRoot: { newRoot: "$cartItems" }},
            {
                "$project":
                    {
                        "_id": "$customer_id",

                        "quantity": "$quantity",
                        "type":"$type",
                        "salon_id":"$salon_id",
                        "price": "$price",
                        "latitude":"$latitude",
                        "longitude":"$longitude",
                        "city_id":"$city_id",
                        'is_package':"$is_package",
                        'cart_type':"$cart_type",
                        "country_id":"$country_id"
                    }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "quantity": {"$sum": "$quantity"},
                    "type":{"$first":"$type"},
                    "salon_id":{"$first":"$salon_id"},
                    'country_id':{"$first":"$country_id"},
                    'city_id':{"$first":"$city_id"},
                    "price": {"$sum":"$price"},
                    "latitude":{"$first":"$latitude"},
                    "cart_type":{"$first":"$cart_type"},
                    "longitude":{"$first":"$longitude"},
                    "is_package":{"$first":"$is_package"}
                }
            }

        ], function (err, response)
        {

            return resolve(response);
        });
    });
},scheduleCart:function(scheduleId,languageCode,callback){
        var schedule= new mongoose.Types.ObjectId(scheduleId);
        db.scheduleBooking.aggregate([
            {"$match":{"_id":schedule}},
            {"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart", let:{"cart_id":"$cart_id"},
                "pipeline": [{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}}],
                "as":"cartItems"}},
            {"$unwind":"$cartItems"},
            {$replaceRoot: { newRoot: "$cartItems" }},
            {"$lookup": {
                    "from": "stylist",
                    "localField": "vendor_id",
                    "foreignField": "vendor_id",
                    "as": "stylist"
                }
            },
            {"$lookup": {
                    "from": "vendor",
                    "localField": "stylist.vendor_id",
                    "foreignField": "_id",
                    "as": "vendorDetails"
                }
            },
            {
                "$lookup": {
                    "from": "vendorLocation",
                    "let": {"vendor_id": "$vendor_id"},
                    "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$$vendor_id", "$vendor_id"]}]}}},
                        {
                            "$project": {
                                "latitude": {"$arrayElemAt": ["$location.coordinates", 1]},
                                "longitude": {"$arrayElemAt": ["$location.coordinates", 0]}
                            }
                        }
                    ],
                    "as": "vendorLocation"
                }
            },
            {"$unwind": {"path": "$stylist", "preserveNullAndEmptyArrays": true}},
            {"$unwind": {"path": "$vendorLocation", "preserveNullAndEmptyArrays": true}},
            {"$unwind": {"path": "$vendorDetails", "preserveNullAndEmptyArrays": true}},
            {'$lookup': {
                    "from": 'subCategory',
                    "localField": 'sub_category_id',
                    "foreignField": '_id',
                    as: 'subCategory'
                }
            },
            { '$lookup': {
                "from": 'services', "let": {"service_id": "$service_id", "city_id": "$city_id"},
                "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$_id", "$$service_id"]}]}}},
                    {
                        "$project": {
                            "_id": "$_id",
                            "service_name": "$service_name",
                            'duration': "$duration",
                            "service_prices": {
                                "$filter": {
                                    "input": "$service_prices",
                                    "as": "prices",
                                    "cond": {"$eq": ['$$prices.city', '$$city_id']}
                                }
                            }
                        }
                    }], as: 'services'
            }
            },
            {"$lookup": {"from": "category", "localField": "category_id", "foreignField": "_id", "as": "category"}},
            {"$unwind": "$category"},
            {"$unwind": "$services"},
            {"$unwind": "$services.service_prices"},
            {'$group': {
                    '1': {'$first': '$services.service_prices.1'},
                    '2': {'$first': '$services.service_prices.2'},
                    '3': {'$first': '$services.service_prices.3'},
                    '4': {'$first': '$services.service_prices.4'},
                    _id: '$_id',
                    "payment_type":{"$first":"$payment_type"},
                    "card_id":{"$first":"$card_id"},
                    service: {
                        '$first': {
                            service_name: '$services.service_name.'+languageCode,
                            service_id: '$services._id',
                            duration: {
                                $switch:
                                    {
                                        branches: [
                                            {
                                                case: { $eq : ["$selected_for",1] },
                                                then:'$services.service_prices.duration.1'
                                            },
                                            {
                                                case: { $eq : ["$selected_for",2] },
                                                then:'$services.service_prices.duration.2'
                                            },
                                            {
                                                case: { $eq : ["$selected_for",3] },
                                                then:'$services.service_prices.duration.3'
                                            }, {
                                                case: { $eq : ["$selected_for",4] },
                                                then:'$services.service_prices.duration.4'
                                            }
                                        ],
                                        default:0
                                    }
                            }



                        }
                    },
                    quantity: {'$first': '$quantity'},
                    price: {'$first': '$price'},
                    price_currency: {'$first': '$price_currency'},
                    selected_service_level: {'$first': '$selected_service_level'},
                    selected_for: {'$first': '$selected_for'},
                    subCategory: {
                        '$first': {
                            sub_category_name: '$subCategory.sub_category_name.en',
                            sub_category_id: '$subCategory._id'
                        }
                    },
                    category: {
                        '$first': {
                            category_name: '$category.category_name.'+languageCode,
                            sub_category_id: '$category._id'
                        }
                    },
                    customer_id: {'$first': '$customer_id'},
                    address: {
                        "$first": {
                            "address": "$address",
                            "city_id": "$city_id",
                            "latitude": "$latitude",
                            "longitude": "$longitude"
                        }
                    },
                    cart: {
                        '$first': {
                            cart_id: '$_id',
                            quantity: '$quantity',
                            price: '$price',
                            price_currency: '$price_currency',
                            selected_service_level: '$selected_service_level',
                            selected_for: '$selected_for',
                            "vendor_id": "$stylist.vendor_id",
                            "profile_pic": "$vendorDetails.profile_pic",
                            "name": "$vendorDetails.first_name."+languageCode,
                            "nationality": "$stylist.nationality",
                            "latitude": "$vendorLocation.latitude",
                            "longitude": "$vendorLocation.longitude"
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "cities", "let": {"city_id": "$address.city_id"},
                    "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$_id", "$$city_id"]}]}}},
                        {
                            "$lookup": {
                                "from": "country",
                                "localField": "country_id",
                                "foreignField": "_id",
                                "as": "country"
                            }
                        }, {"$unwind": "$country"}],
                    "as": "countryCurrency"
                }
            },
            {"$unwind": "$countryCurrency"},
            {
                '$project': {
                    customer_id: '$customer_id',
                    subCategory: '$subCategory',
                    "category": "$category",
                    "payment_type":"$payment_type",
                    "card_id":"$card_id",
                    service: {
                        service_name: '$service.service_name',
                        service_id: '$service.service_id',
                        duration: '$service.duration',
                        service_price: {
                            '1': {'$ifNull': ['$1', {}]},
                            '2': {'$ifNull': ['$2', {}]}, '3': {'$ifNull': ['$3', {}]}, '4': {'$ifNull': ['$4', {}]}
                        },
                        "vendor_service_levels":{"$ifNull":["$vendorServices.service_levels",[]]}
                    },
                    cart: '$cart',
                    "coupons":"$coupons",
                    "currency": {
                        "currency": "$countryCurrency.country.currency_symbol",
                        "currency_code": "$countryCurrency.country.currency_code"
                    },
                    "address": "$address"
                }
            },
            {
                '$group': {
                    "_id": '$customer_id',
                    cart_items: {
                        '$push': {
                            "cart": '$cart',
                            "service": '$service',
                            "sub_category": '$subCategory',
                            "category": "$category"
                        }
                    },
                    "card_id": { "$first":"$card_id"},
                    "payment_type": { "$first": "$payment_type" },
                    "address": { "$first": "$address"},
                    "currency":{ "$first": "$currency"},
                    "sub_total":{ '$sum': '$cart.price'}
                }
            }


        ],function(err,response){
                   console.log(err);
            return callback(response);
        });

    }
    };