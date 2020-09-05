var db = require('../db');
var mongoose = require('mongoose');
module.exports = {
    status: {
        "1": {"status": 1, "message": "cart added"},
        "2": {"status": 2, "message": "booking done"},
        "3": {"status": 3, "message": "schedule booking"}
    },updateMany:function(data,where,callback){
    db.cities.update(where,
        {"$set":data},{multi:true},function(err,response){

            return callback(response);
        });
},deleteall:function(callback)
    {
        db.vendor.deleteMany({}, function (err, response){
            db.stylist.deleteMany({},function(response){
                db.salon.deleteMany({},function(response){
                    db.salonDocuments.deleteMany({},function(response){
                        db.salonEmployees.deleteMany({},function(response){
                            db.salonPictures.deleteMany({},function(response){
                                db.salonServices.deleteMany({},function(response){
                                    db.bookings.deleteMany({},function(response){
                                        db.stylistDocuments.deleteMany({},function(response){
                                            db.portfolio.deleteMany({},function(response){
                                                      return callback(response);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    },defaultValues: function (customerId, city, country,languageCode, callback){
        console.log("customerId, city, country,languageCode>>>>>>>>>>>>....",customerId, city, country,languageCode)
        var user_id = new mongoose.Types.ObjectId(customerId);
        console.log(city,"city from google");
        cityinturky = city;

        city = city.toLowerCase();

        country = country.toLowerCase();
               console.log(city,cityinturky,"city from google",country);
        db.cities.aggregate([
            {"$project":{'city_name':"$city_name","country_id":"$country_id","timezone":"$timezone","sub_city_names":{"$filter":{"input":"$sub_city_names","as":"sub_city",
                            "cond":{"$eq":[{ $toLower: "$$sub_city.sub_city_name."+languageCode },city]}}}}},
             {"$match": {"$expr":{"$or":[{"$eq":[{ $toLower: "$city_name.en" }, city]},{"$eq":["$city_name.tr", cityinturky]},{"$gt":[{"$size":{"$ifNull":["$sub_city_names",[]]}},0]}]}}},
             {"$lookup": {"from": "country", "localField": "country_id", "foreignField": "_id", "as": "country"}},
            {"$unwind":"$country"},
            {"$match": {"$expr":{"$or":[{"$eq":[{ $toLower: "$country.country.en" }, country]},
                {"$eq":["$country.country_ar", country]}]}}},
            {"$lookup": {"from": "timeSlots", "pipeline": [], "as": "timeSlots"}},
            {
                "$lookup": {
                    "from": "cart",
                    "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$customer_id", user_id]},
                        {"$eq": ["$status", 1]}]}}},
                        {"$lookup":{"from":"salon","localField":"salon_id","foreignField":"_id","as":"salonDetails"}},
                        {"$unwind": {"path": "$salonDetails", "preserveNullAndEmptyArrays": true}}

                    ],
                    "as": "cartItems"
                }
            },
            {
                "$lookup": {
                    "from": "scheduleBooking", "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{"$eq": ["$customer_id", user_id]},
                                    {"$eq": ["$status", 1]}
                                    ]
                            }
                        }
                    }], "as": "schedule_booking"
                }
            },
            {"$unwind": {"path": "$schedule_booking", "preserveNullAndEmptyArrays": true}},
            {$bucketAuto: {
                    groupBy: "$id",
                    buckets: 1,
                    output: {
                        "city_id": {"$first": "$_id"},

                        "time_slots": {'$first': "$timeSlots"},
                        "cart_items": {
                            "$first": {
                                '$cond': {
                                    if: {'$gte': [{"$size": "$cartItems"}, 1]},
                                    then: true,
                                    else: false
                                }
                            }
                        },
                        "schedule_booking": {"$first": "$schedule_booking"},
                        "cart_address": {"$first": "$cartItems.address"},
            "salon_name": {"$first": {"$ifNull":["$cartItems.salonDetails.salon_name."+languageCode,'']}},
            "salon_city_id": {"$first":"$cartItems.salonDetails.city_id" },
            "latitude": {"$first": "$cartItems.salonDetails.latitude"},
            "longitude": {"$first": "$cartItems.salonDetails.longitude"},
            "salon_address": {"$first": "$cartItems.salonDetails.address"},
                        "salon_id": {"$first": "$cartItems.salonDetails._id"},
                        "cart_type":{"$first":"$cartItems.cart_type"},
                        "address":{"$first":"$cartItems.address"},
                        "time_zone":{"$first":"$time_zone"},
                    }
                }
            },
            {"$lookup":{"from":"bookings",
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$customer_id",user_id]},
                    {"$eq":["$is_customer_rated",0]},{"$eq":['$status',8]}]}}},
                {"$group":{"_id":"$customer_id","booking_id":{"$push":{"booking_id":"$_id","type":"$type"}}}}
            ],"as":"bookingsDetails"}},
            {"$unwind": {"path": "$bookingsDetails", "preserveNullAndEmptyArrays": true}},
            {"$project": {
                    "_id": 0,
                    "city_id": "$city_id",
                    "rating":{"$ifNull":["$bookingsDetails.booking_id",[]]},
                    "category_urls": {"$ifNull":["$category_urls",[]]},
                    "time_slots": "$time_slots",
                    "cart_items": '$cart_items',
                    "time_zone":"$time_zone",
                    "cart_type":{"$arrayElemAt":['$cart_type',0]},
                    "salon_Details":{"salon_name":{"$arrayElemAt":['$salon_name',0]},
                        "salon_id":{"$arrayElemAt":['$salon_id',0]},
                        "latitude":{"$arrayElemAt":['$latitude',0]},
                        "city_id":{"$arrayElemAt":['$salon_city_id',0]},
                        "longitude":{"$arrayElemAt":['$longitude',0]},
                        "address":{"$ifNull":[{"$arrayElemAt":['$salon_address',0]},'']}},
                    "address":{"$arrayElemAt":['$address',0]},
                    "schedule_booking": {"$ifNull": ["$schedule_booking._id", false]},
                    "schedule_booking_details":{"schedule_booking":"$schedule_booking._id","type":"$schedule_booking.type","time":"$schedule_booking.time","timebetween":"$schedule_booking.timebetween","date":"$schedule_booking.date"},
                }
            }
        ], function (err, response) {
            console.log("response>>>>>>>>>>>.",response)

            return callback(response);
        });
    }, getCityId: function (city, country,languageCode, callback) {
        /*    {"$lookup":{"from":"services","let":{'city_id':"$_id"},"pipeline":[{"$match":{"service_prices":{"$elemMatch":{"$eq":["$city", ObjectId("5aacd0e682de4500a80200bf")]}}}}],
         "as":"services"}},*/
        city = city.toLowerCase();

        country = country.toLowerCase();


        db.cities.aggregate([
            {"$project":{'city_name':"$city_name","country_id":"$country_id","timezone":"$timezone","sub_city_names":{"$filter":{"input":"$sub_city_names","as":"sub_city",
                            "cond":{"$eq":[{ $toLower: "$$sub_city.sub_city_name."+languageCode },city]}}}}},
            {"$match": {"$expr":{"$or":[{"$eq":[{ $toLower: "$city_name.en" }, city]},{"$eq":["$city_name_ar", city]},{"$gt":[{"$size":{"$ifNull":["$sub_city_names",[]]}},0]}]}}},
            {"$lookup": {"from": "country", "localField": "country_id", "foreignField": "_id", "as": "country"}},
            {"$unwind":"$country"},
            {"$match": {"$expr":{"$or":[{"$eq":[{ $toLower: "$country.country.en" }, country]},
                {"$eq":["$country.country_ar", country]}]}}},

            {"$project": {"city_id": "$_id", "_id": 0}}
        ], function (err, response) {

            return callback(response);
        });
    }, find: function (check, callback) {

        db.cities.find(check, function (err, response) {
            callback(response);
        });
    },findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

            db.cities.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });
    },getCurrency:function(cityId)
    {
        var city = new mongoose.Types.ObjectId(cityId);

        return new Promise(function(resolve){

            db.cities.aggregate([{"$match":{"_id":city}},
                {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"countryDetails"}},
                {"$unwind":"$countryDetails"},
                {"$project":{"country_id":"$country_id","city_id":"$_id","currency_code":"$countryDetails.currency_code",
                    "dollar_conversion_rate":"$countryDetails.dollar_conversion_rate","currency_symbol":"$countryDetails.currency_symbol","_id":0}}
                ],function (err, response) {
                resolve(response);
            });
        });
    },updateWithPromises:function(data,where)
    {
        return new Promise(function(resolve){
            db.cities.update(where, {$set:data}, {new: true}, function(err, response){

                return  resolve(response);

            });
        });
    },getTimeSlots:function(cityId,callback)
    {
        var city = new mongoose.Types.ObjectId(cityId);

        db.cities.aggregate([
            {"$match":{"_id":city}},
            {"$lookup": {"from": "timeSlots", "pipeline": [], "as": "timeSlots"}},
            {"$project":{"time_slots":"$timeSlots","time_zone":"$time_zone"}}
        ],function(err,response){
            return callback(response);
        })
    },deleteCity(cityId,callback)
    {
        db.vendor.deleteMany({"_id":cityId}, function (err, response){

             return callback(response);
        });
    }

};
