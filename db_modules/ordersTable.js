var db=require('../db');
var mongoose=require('mongoose');

module.exports=
    {
        save: function (values, callback)
        {

            var orders = new db.orders(values);

            orders.save(function (err, response) {

                callback(response);
            });
        },
        getOrderDetails:function(orderId,customerId,callback)
        {
            var id = mongoose.Types.ObjectId(orderId);
            db.orders.aggregate([
                {"$match":{"_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity","service_name":"$services.service_name.en","category_name":"$category.category_name.en",
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},{"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                    [{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                        {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                        {"$project":{"_id":0,"expertise":"$expertiseServices.service_name.en"}}
                                                    ],"as":"expertises"}},{"$unwind":"$expertises"},
                                            {"$lookup":{"from":"vendorLocation",
                                                    "let":{"vendor_id":"$_id"},
                                                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]
                                                                }]}}},
                                                        {"$project":{"location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                                                                    "longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}],
                                                    "as":"location"}},{"$unwind":"$location"}],"as":"vendorDetails"}},

                                {"$unwind":"$vendorDetails"},
                                {"$lookup":{"from":"rating",
                                        "let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}]
                                        ,"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},"status":{"$first":"$status"}
                                        ,"vendor":{"$first":{

                                                "profile_pic":"$vendorDetails.profile_pic",
                                                "totalrating":{"$ifNull":[{"$avg":"$rating.rating"},0]},"totalreview":{"$ifNull":[{"$size":"$rating"},0]},"location":"$vendorDetails.location.location","vendor_id":"$vendor_id","mobile":"$vendorDetails.mobile",
                                                "name":{"$concat":["$vendorDetails.first_name","  ","$vendorDetails.last_name"]},
                                                "expertise":"$vendorDetails.expertises.expertise"
                                            }}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor","promo":{"promo_amount":{"$ifNull":["$promo",0]},"promo_code":"mr","type":{"$ifNull":["$type",1]}},
                                        "booking_id":"$_id","booking_status":"$status"}}],"as":"bookingsDetails"}},
                { "$unwind": "$bookingsDetails" },
                {"$group":{"_id":"$_id","bookings":{"$push":"$bookingsDetails"},"created_at":{"$first":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},"address":{"$first":"$address"},"longitude":{"$first":"$longitude"},"latitude":{"$first":"$latitude"}}}
                ,{"$project":{"_id":"$_id","bookings":"$bookings","created_at":"$created_at","order_address":{"address":"$address","latitude":"$latitude","longitude":"$longitude"}}}
            ],function(err,response){

                return callback(response);
            });
        }, getBookingOrderDetails:function(orderId,customerId,languageCode,callback)
        {
            var id = mongoose.Types.ObjectId(orderId);
            //ObjectId("5af4129a1b8ba939b7b3df9a")
            db.orders.aggregate([
                {"$match":{"_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity","duration":"$duration","service_name":"$services.service_name."+languageCode,"category_name":"$category.category_name."+languageCode,
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},
                                            {"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                        [
                                                            {"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                            {"$project":{"_id":0,"expertise":"$expertiseServices.service_name."+languageCode}}
                                                        ],"as":"expertises"}},{"$unwind":"$expertises"},{"$lookup":{"from":"vendorLocation","let":{"vendor_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}},
                                                        {"$project":{"location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                                                                    "longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}],"as":"location"}}
                                        ],"as":"vendorDetails"}},
                                {"$unwind":"$vendorDetails"},
                                {"$lookup":{"from":"rating","let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}],"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},
                                        "coupon":{"$first":{"coupon_amount":{"$ifNull":["$coupon_amount",0]},
                                                "coupon_code":{"$ifNull":["$coupon_code",'']},
                                                "up_to_amount":{"$ifNull":["$up_to_amount",'$coupon_amount']},
                                                "type":{"$ifNull":["$coupon_amount_type",1]}}},
                                        "coupon_details":{"$first":"$coupon_details"},
                                        "status":{"$first":"$status"},
                                        "payment_type":{"$first":{"$ifNull":["$payment_type",1]}},
                                        "vendor":{"$first":{
                                                "profile_pic":"$vendorDetails.profile_pic",
                                                "tm_user_id":{"$ifNull":["$vendorDetails.tm_user_id",0]},
                                                "totalrating":{"$ifNull":[
                                                        {'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]}, 0]},
                                                "totalreview":{"$ifNull":[{"$size":"$rating"},0]},
                                                "location":{"$arrayElemAt":["$vendorDetails.location.location",0]},
                                                "vendor_id":"$vendor_id",
                                                "mobile":{"$concat":["$vendorDetails.mobile"," ","$vendorDetails.mobile_country"]},
                                                "name":{"$concat":["$vendorDetails.first_name."+languageCode,"  ","$vendorDetails.last_name."+languageCode]}
                                                ,"expertise":"$vendorDetails.expertises.expertise"
                                            }},"surge":{"$first":"$surge"},
                                        'net_amount':{"$first":'$net_amount'},
                                        "payment_details":{"$first":{"$ifNull":["$payment_details.payment",{}]}},
                                    "created_at": {"$first":{$dateToString: { format: "%Y-%m-%d %H:%M:%S:%L", date: "$created"}}},
                                        "currency_details":{"$first":{"currency_code":"$customer_country_details.currency_code","currency_symbol":"$customer_country_details.currency_symbol"
                                            }}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"","type":{"$ifNull":["$type",1]}},
                                        "coupon":"$coupon",
                                        "coupon_details":{"$ifNull":["$coupon_details",{}]},
                                        "booking_id":"$_id",
                                        'net_amount':'$net_amount',
                                        "payment_type":"$payment_type",
                                    "created_at": "$created_at",
                                        "payment_details":"$payment_details"
                                        ,"surge":"$surge","booking_status":"$status","currency_details":"$currency_details"}}
                                        ],
                        "as":"bookingsDetails"}},
                {"$unwind": "$bookingsDetails"},
                {"$group":{"_id":"$_id",
                        "bookings":{"$push":"$bookingsDetails"},
                        "coupon_details":{"$first":"$coupon_details"},
                        "created_at":{"$first":
                                {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},
                        "address":{"$first":"$address"},
                        'order_total':{"$sum":"$bookingsDetails.net_amount"},
                        "orders":{"$sum":1},
                        "surge":{"$first":"$bookingsDetails.surge"},
                        "longitude":{"$first":"$longitude"},
                        "latitude":{"$first":"$latitude"},
                        'coupon':{"$first":"$coupon"},
                        'promo':{"$first":"$promo"},
                        "payment_details":{"$first":"$bookingsDetails.payment_details"},
                        "payment_type":{"$first":"$bookingsDetails.payment_type"},
                        "currency_details":{"$first":"$bookingsDetails.currency_details"}
                    }}
            ],function(err,response){

                return callback(response);
            });
        }, getVendorBookingOrderDetails:function(orderId,vendorId,callback)
        {
            var id = mongoose.Types.ObjectId(orderId);
            //ObjectId("5af4129a1b8ba939b7b3df9a")
            db.orders.aggregate([
                {"$match":{"_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity","service_name":"$services.service_name.en","category_name":"$category.category_name.en",
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},{"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                    [{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                        {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                        {"$project":{"_id":0,"expertise":"$expertiseServices.service_name.en"}}
                                                    ],"as":"expertises"}},{"$unwind":"$expertises"},{"$lookup":{"from":"vendorLocation","let":{"vendor_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}},{"$project":{"location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}],"as":"location"}},{"$unwind":"$location"}],"as":"vendorDetails"}},

                                {"$unwind":"$vendorDetails"},
                                {"$lookup":{"from":"rating",
                                        "let":{"vendor_id":"$vendorDetails.vendor_id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}]
                                        ,"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},"status":{"$first":"$status"},"vendor":{"$first":{
                                                "profile_pic":"$vendorDetails.profile_pic","totalrating":{"$ifNull":[{"$avg":"$rating.rating"},0]},"totalreview":{"$ifNull":[{"$size":"$rating"},0]},"location":"$vendorDetails.location.location","vendor_id":"$vendor_id","mobile":"$vendorDetails.mobile",
                                                "name":{"$concat":["$vendorDetails.first_name","  ","$vendorDetails.last_name"]},"expertise":"$vendorDetails.expertises.expertise"
                                            }}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"mr","type":{"$ifNull":["$type",1]}},
                                        "booking_id":"$_id","booking_status":"$status"}}],"as":"bookingsDetails"}},
                {"$unwind": "$bookingsDetails"},
                {"$group":{"_id":"$_id","bookings":{"$push":"$bookingsDetails"},"created_at":{"$first":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},"address":{"$first":"$address"},"longitude":{"$first":"$longitude"},"latitude":{"$first":"$latitude"}}}
            ],function(err,response){

                return callback(response);
            });
        }, getSalonBookingOrderDetails:function(orderId,callback)
        {
            var id = mongoose.Types.ObjectId(orderId);
            //ObjectId("5af4129a1b8ba939b7b3df9a")
            db.orders.aggregate([
                {"$match":{"_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity","service_name":"$services.service_name.en","category_name":"$category.category_name.en",
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},

                                {"$lookup":{"from":"rating",
                                        "let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}]
                                        ,"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},"status":{"$first":"$status"}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"mr","type":{"$ifNull":["$type",1]}},
                                        "booking_id":"$_id","booking_status":"$status"}}],"as":"bookingsDetails"}},
                {"$unwind": "$bookingsDetails"},
                {"$group":{"_id":"$_id","bookings":{"$push":"$bookingsDetails"},"created_at":{"$first":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},"address":{"$first":"$address"},"longitude":{"$first":"$longitude"},"latitude":{"$first":"$latitude"}}}
            ],function(err,response){

                return callback(response);
            });
        },update:function(data,where,callback){

            db.orders.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){
                return  callback(response);

            });
        },  findFieldsWithPromises: function (check, fields){
            return new Promise(function(resolve){

                db.orders.find(check, fields ,function (err, response) {
                    resolve(response);
                });
            });
        }, find: function (check, callback) {

            db.orders.find(check, function (err, response) {

                callback(response);
            });
        },getCustomerOrderDetails:function(customerId,callback)
        {
            var id = mongoose.Types.ObjectId(customerId);
            //ObjectId("5af4129a1b8ba939b7b3df9a")
            db.orders.aggregate([{"$match":{"customer_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity","service_name":"$services.service_name.en","category_name":"$category.category_name.en",
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},{"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                    [{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                        {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                        {"$project":{"_id":0,"expertise":"$expertiseServices.service_name.en"}}
                                                    ],"as":"expertises"}},{"$unwind":"$expertises"},
                                            {"$lookup":{"from":"vendorLocation","let":{"vendor_id":"$_id"},
                                                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}},{"$project":{"location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}],"as":"location"}},{"$unwind":"$location"}],"as":"vendorDetails"}},

                                {"$unwind":"$vendorDetails"},
                                {"$lookup":{"from":"rating",
                                        "let":{"vendor_id":"$vendorDetails.vendor_id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}]
                                        ,"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},"status":{"$first":"$status"},"booking_total":{"$sum":"$cart.price"},"vendor":{"$first":{
                                                "profile_pic":"$vendorDetails.profile_pic","totalrating":{"$ifNull":[{"$avg":"$rating.rating"},0]},"totalreview":{"$ifNull":[{"$size":"$rating"},0]},"location":"$vendorDetails.location.location","vendor_id":"$vendor_id","mobile":"$vendorDetails.mobile",
                                                "name":{"$concat":["$vendorDetails.first_name","  ","$vendorDetails.last_name"]},"expertise":"$vendorDetails.expertises.expertise"
                                            }}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"mr","type":{"$ifNull":["$type",1]}},"booking_total":"$booking_total",
                                        "booking_id":"$_id","booking_status":"$status"}}],"as":"bookingsDetails"}},
                {"$unwind": "$bookingsDetails"},
                {"$group":{"_id":"$_id","bookings":{"$push":"$bookingsDetails"},
                        "total":{"$sum":"$bookingsDetails.booking_total"},
                        "created_at":{"$first":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},
                        "address":{"$first":"$address"},"longitude":{"$first":"$longitude"},
                        "latitude":{"$first":"$latitude"}}}
                ,{"$sort":
                        {"created_at":-1
                        }}
            ],function(err,response){

                return callback(response);
            });
        },getCustomerBookingDetails:function(customerId,languageCode,callback)
        {
            var id = mongoose.Types.ObjectId(customerId);
            db.orders.aggregate([
                {"$match":{"customer_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","quantity":"$quantity",
                                                    "date":"$date",
                                                    "time":"$time",
                                                    "service_name":"$services.service_name."+languageCode,"category_name":"$category.category_name."+languageCode,
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","time_type":"$time_type","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},{"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                    [{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                        {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                        {"$project":{"_id":0,"expertise":"$expertiseServices.service_name."+languageCode}}
                                                    ],"as":"expertises"}},{"$unwind":"$expertises"},
                                            {"$lookup":{"from":"vendorLocation","let":{"vendor_id":"$_id"},
                                                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}},
                                                        {"$project":{"location" :
                                                                    {"latitude":{"$arrayElemAt":
                                                                                ["$location.coordinates",1]},
                                                                        "longitude":{"$arrayElemAt":
                                                                                ["$location.coordinates",0]}}}}],
                                                    "as":"location"}},{"$unwind":"$location"}],
                                        "as":"vendorDetails"}},
                                {"$lookup":{"from":"salon","let":{"salon_id":"$salon_id","employee_id":"$employee_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$_id"]}]}}},
                                            {"$lookup":{"from":"salonEmployees","let":{"employee_id":"$$employee_id"},"pipeline":
                                                        [
                                                            {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$employee_id"]}]}}},
                                                            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                            {"$project":{"_id":0,"expertise":"$expertiseServices.service_name."+languageCode}}
                                                        ],"as":"salonEmployees"}}
                                            ,{"$unwind":{"path":"$salonEmployees",
                                                    "preserveNullAndEmptyArrays": true}}
                                        ],"as":"salonDetails"}},
                                {"$unwind":{"path":"$vendorDetails","preserveNullAndEmptyArrays": true}},
                                {"$unwind":{"path":"$salonDetails","preserveNullAndEmptyArrays": true}},
                                {"$lookup":{"from":"rating",
                                        "let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}]
                                        ,"as":"rating"}},
                                {"$group":{"_id":"$_id",
                                        "cart":{"$push":"$cart"},
                                        "status":{"$first":"$status"},
                                        "online_payment_status":{"$first":"$online_payment_status"},
                                        "payment_type":{"$first":"$payment_type"},
                                        "card":{"$first":"$card"},
                                        

                                        "created":{"$first":"$created"},
                                        "booking_total":{"$sum":"$cart.price"},
                                        "address":{"$first":{"$ifNull":[
                                                    {"$cond":[{"$eq":["$type",1]},
                                                            "$address","$salonDetails.location"]},'']}},
                                        "vendor":{"$first":{"$cond":[
                                                    {"$eq":["$type",1]},
                                                    {"profile_pic":"$vendorDetails.profile_pic",
                                                        "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                                                        "totalreview":{"$ifNull":[{"$size":"$rating"},0]},
                                                        "location":"$vendorDetails.location.location",
                                                        "vendor_id":"$vendor_id","mobile":"$vendorDetails.mobile",
                                                        "name":{"$concat":["$vendorDetails.first_name."+languageCode,"  ","$vendorDetails.last_name."+languageCode]},
                                                        "expertise":"$vendorDetails.expertises.expertise"},
                                                    {"salon_name":{"$ifNull":["$salonDetails.salon_name."+languageCode,'']},
                                                        "address":{"$ifNull":["$salonDetails.location",'']},
                                                        "emploee_name":{"$ifNull":[{"$concat":["$salonDetails.salonEmployees.employee_first_name."+languageCode," ","$salonDetails.salonEmployees.employee_last_name."+languageCode]},'']},
                                                        "profile_pic":{"$ifNull":["$salonDetails.salonEmployees.profile_pic",'']}
                                                    }]

                                            }},
                                        "time_type":{"$first":{"$ifNull":["$cart.time_type",1]}},
                                        "full_date":{"$first":{"date":{"$ifNull":["$date","$cart.date"]},
                                                "time":{"$ifNull":["$time","$cart.time"]},
                                                "split_time":{"$cond":[{"$eq":["$cart.time_type",1]},{"$split":[{"$ifNull":["$time","$cart.time"]},'-']},
                                                        {"$split":[{"$ifNull":["$time","$cart.time"]},'-']}]},
                                                "time_zone":"$time_zone"}},
                                        "booking_code":{"$first":"$booking_inc_id"},
                                        "type":{"$first":"$type"}}},
                                {"$project":{"_id":0,
                                        "cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"mr",
                                            "type":{"$ifNull":["$type",1]}},
                                        "type":"$type",
                                        "booking_total":"$booking_total",
                                        "booking_id":"$_id",
                                        "booking_status":"$status",
                                        "online_payment_status" : "$online_payment_status",
                                        "payment_type" : "$payment_type",
                                        "card" : "$card",
                                       

                                        "address":"$address",
                                        "date":"$full_date.date",
                                        "time":"$full_date.time",
                                        "timezone":"$full_date.time_zone",
                                        "created":{$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}},
                                        "time_type":"$time_type",
                                        "assign_date":
                                            {"$cond":[{"$eq":["$type",2]},
                                                    {"$dateToString":{format: "%Y-%m-%d %H:%M","date":{ $dateFromString : { dateString:
                                                                        {"$concat":["$full_date.date",' ', { $arrayElemAt: ["$full_date.split_time", 0 ] }]},timezone: "$full_date.time_zone"}}
                                                        }},
                                                    {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}]},
                                        "end_date":{"$cond":[{"$eq":["$type",2]},
                                                {"$dateToString":{format: "%Y-%m-%d %H:%M","date":{ $dateFromString : { dateString:
                                                                    {"$concat":["$full_date.date",' ',


                                                                            {"$cond":[{"$eq":["$time_type",2]},{ $arrayElemAt: ["$full_date.split_time", 0 ] },
                                                                                    { $arrayElemAt: ["$full_date.split_time", 1 ] }]}


                                                                        ]},timezone: "$full_date.time_zone"}}
                                                    }},
                                                {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}]},
                                        "booking_code":{"$concat":["#BST-",{$substr:["$booking_code", 0, -1 ]}]}

                                    }}],
                        "as":"bookingsDetails"}},
                {"$unwind":"$bookingsDetails"},
                { $replaceRoot: { newRoot: "$bookingsDetails"} },
                {"$sort":{"created":-1}}
            ],function(err,response)
            {
                return callback(response);
            });
        },getCustomerSingleOrderDetails:function(bookingId,customerId,languageCode,callback)
        {
            var booking=new mongoose.Types.ObjectId(bookingId);

            db.orders.aggregate([
                {"$match":{"booking_id":booking}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":
                            [{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                                {"$unwind":"$cart_id"},
                                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart_id","$_id"]}]}}},
                                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                                            {"$unwind":"$category"},
                                            {"$unwind":"$services"},
                                            {"$project":{"cart_id":"$_id","additional_details":"$additional_details","quantity":"$quantity","duration":"$duration","service_name":"$services.service_name."+languageCode,"category_name":"$category.category_name."+languageCode,
                                                    "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status"}},
                                        ],
                                        "as":"cart"}},
                                {"$unwind":"$cart"},
                                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},
                                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},
                                            {"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":
                                                        [{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}},
                                                            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertiseServices"}},
                                                            {"$project":{"_id":0,"expertise":"$expertiseServices.service_name."+languageCode}}
                                                        ],"as":"expertises"}},{"$unwind":"$expertises"},{"$lookup":{"from":"vendorLocation","let":{"vendor_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}},
                                                        {"$project":{"location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                                                                    "longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}],"as":"location"}}
                                        ],"as":"vendorDetails"}},
                                {"$unwind":"$vendorDetails"},
                                {"$lookup":{"from":"rating","let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[
                                                        {"$eq":["$vendor_id","$$vendor_id"]},{"$eq":['$rated_by',1]}]}}}],"as":"rating"}},
                                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},
                                        "payment_details":{"$first":"$payment_details"},
                                        "status":{"$first":"$status"},
                                        "vendor":{"$first":{
                                                "profile_pic":"$vendorDetails.profile_pic",
                                                "tm_user_id":{"$ifNull":["$vendorDetails.tm_user_id",0]},
                                                "totalrating":{"$ifNull":[
                                                        {'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]}, 0]},"totalreview":{"$ifNull":[{"$size":"$rating"},0]},
                                                "location":{"$arrayElemAt":["$vendorDetails.location.location",0]},
                                                "vendor_id":"$vendor_id",
                                                "mobile":{"$concat":["$vendorDetails.mobile_country"," ","$vendorDetails.mobile"]},
                                                "name":{"$concat":["$vendorDetails.first_name."+languageCode,"  ","$vendorDetails.last_name."+languageCode]}
                                                ,"expertise":"$vendorDetails.expertises.expertise"
                                            }},
                                        "payment_type":{"$first":"$payment_type"},
                                        "payment_status":{"$first":"$payment_status"},
                                        "additional_details":{"$first":{"$ifNull":["$additional_details",{}]}},
                                        "booking_code":{"$first":"$booking_inc_id"},
                                        "coupon":{"$first":{"coupon_amount":{"$ifNull":["$coupon_amount",0]},
                                                "coupon_code":{"$ifNull":["$coupon",'']},
                                                "up_to_amount":{"$ifNull":["$up_to_amount",'$coupon_amount']},
                                                "type":{"$ifNull":["$coupon_amount_type",1]}}},
                                        "coupon_details":{"$first":{"$ifNull":['$coupon_details',{}]}},
                                    "created_at": {"$first":{$dateToString: { format: "%Y-%m-%d %H:%M:%S:%L", date: "$booking_requested"}}},

                                    'cancel':{"$first":{"cancell_type":"$cancell_type","cancell_type_value":"$cancellation_amount","cancellation_pay_status":"$cancellation_pay_status"}},
                                        "surge":{"$first":"$surge"},"currency_details":{"$first":{"currency_code":"$customer_country_details.currency_code","currency_symbol":"$customer_country_details.currency_symbol"
                                            }}}},
                                {"$project":{"_id":0,"cart":"$cart","vendor":"$vendor",
                                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                                            "promo_code":"","type":{"$ifNull":["$type",1]}},
                                        "booking_id":"$_id",
                                        'coupon':"$coupon",
                                        "coupon_details":"$coupon_details",
                                    "created_at":"$created_at",
                                        "payment_type":{"$ifNull":["$payment_type",1]},
                                        "payment_status":{"$ifNull":["$payment_status",2]},
                                    "additional_details":"$additional_details",
                                        "payment_details":{"$ifNull":["$payment_details",{}]},
                                        "cancell":{"$ifNull":["$cancel",{}]},
                                        "booking_code":{"$concat":["#BST-",{$substr:["$booking_code", 0, -1 ]}]},
                                        "surge":"$surge","booking_status":"$status","currency_details":"$currency_details"}}]
                        ,"as":"bookingsDetails"}},
                {"$unwind": "$bookingsDetails"},
                {"$group":{"_id":"$_id",
                        "bookings":{"$push":"$bookingsDetails"},
                        "payment_type":{"$first":"$bookingsDetails.payment_type"},
                        "created_at":{"$first":
                                {$dateToString: { format: "%Y-%m-%d %H:%M", date: "$created"}}},
                        "address":{"$first":"$address"},
                        "surge":{"$first":"$bookingsDetails.surge"},
                        "longitude":{"$first":"$longitude"},
                        "latitude":{"$first":"$latitude"},
                        "payment_details":{"$first":"$bookingsDetails.payment_details"},
                        "additional_details":{"$first":{"$ifNull":["$additional_details",{}]}},
                        "promo":{"$first":{"promo_amount":{"$ifNull":["$promo_amount",0]},
                                "promo_code":{"$ifNull":["$promo",'']},"type":{"$ifNull":["$type",1]}}},
                        "coupon":{"$first":{"coupon_amount":{"$ifNull":["$coupon_amount",0]},
                                "coupon_code":{"$ifNull":["$coupon",'']},"up_to_amount":{"$ifNull":["$up_to_amount","$coupon_amount"]},"type":{"$ifNull":["$coupon_amount_type",1]}}},
                        "currency_details":{"$first":"$bookingsDetails.currency_details"}
                    }}
            ],function(err,response)
            {
                 console.log(err);
                return callback(response)
            });
        },getOrderassignDetails:function(orderId,languageCode,callback)
        {
            var id = mongoose.Types.ObjectId(orderId);
            db.orders.aggregate([{"$match":{"_id":id}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","localField":"booking_id","foreignField":"_id","as":"bookingDetails"}},
                {"$unwind":"$bookingDetails"},
                {"$unwind":"$bookingDetails.cart_id"},
                {"$lookup":{"from":"cart","localField":"bookingDetails.cart_id","foreignField":"_id","as":"cartDetails"}},
                {"$unwind":"$cartDetails"},
                {
                    "$lookup": {
                        "from": "salonEmployees",
                        "localField": "cartDetails.employee_id",
                        "foreignField": "_id",
                        "as": "employeeDetails"
                    }
                },
                {
                    "$lookup": {
                        "from": "salonEmployees",
                        "localField": "bookingDetails.employee_id",
                        "foreignField": "_id",
                        "as": "assignEmployeeDetails"
                    }
                },
                {
                    "$lookup":{
                        "from": "salon",
                        "let":{"salon_id":"$cartDetails.salon_id"},
                        "pipeline":[
                            {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$_id"]}]}}},
                            {"$lookup":{"from":"rating","localField":"_id","foreignField":"salon_id","as":"rating"}},
                            {"$lookup":{"from":"vendorLocation","let":{"salon_id":"$_id"},"pipeline":[{'$geoNear':{"near":{"type": 'Point',
                                                coordinates: [0,0]},
                                            'limit':1,
                                            "query":{'salon_id':"$$salon_id"},
                                            distanceField: 'distance', distanceMultiplier: 0.001, spherical: true } },
                                        {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]}]}}}
                                    ],"as":"salonLocation"}},
                            {"$unwind": {"path": "$salonLocation","preserveNullAndEmptyArrays": true}},
                            {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},"pipeline":
                                        [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$salon_id",
                                                "file_path":{"$push":"$file_path"}}},
                                            {"$project":{"_id":0}}],"as":"salonPitures"}},
                            {"$unwind": {"path": "$salonPitures","preserveNullAndEmptyArrays": true}},
                            {"$project":{"_id":0,"totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add':
                                                        [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                                    "totalreviews":{"$size":"$rating"},"salon_id":"$_id",
                                    "salon_number":{"$ifNull":["$phone","9"]},
                                    "salon_name":"$salon_name."+languageCode,
                                    "salon_pictures":"$salonPitures.file_path",
                                    "address":"$salonLocation.address"}}
                        ],
                        "as": "salonDetails"
                    }
                },
                {
                    "$lookup": {
                        "from": "salonPackages", "let": {"package_id": "$cartDetails.package_id"},
                        "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$_id", "$$package_id"]}]}}},
                            {"$unwind": "$services"},
                            {
                                "$lookup": {
                                    "from": "services",
                                    "localField": "services.service_id",
                                    "foreignField": "_id",
                                    "as": "servicesDetails"
                                }
                            },
                            {
                                "$lookup": {
                                    "from": "salonServices",
                                    "let": {"service": "$services.service_id", "service_for": "$services.service_for","salon_id":"$salon_id"},
                                    "pipeline": [
                                        {"$match": {"$expr": {"$and": [
                                                        {"$eq":['$salon_id','$$salon_id']},
                                                        {"$ne":["$status",0]},
                                                        {"$eq": ["$service_id", "$$service"]}, {"$eq": ["$service_for", "$$service_for"]}
                                                    ]}}}
                                    ],
                                    "as": "salonServices"
                                }
                            },

                            {"$unwind": "$salonServices"},
                            {"$unwind": "$servicesDetails"},
                            {
                                "$lookup": {
                                    "from": "category",
                                    "localField": "servicesDetails.category_id",
                                    "foreignField": "_id",
                                    "as": "categoryDetails"
                                }
                            },
                            {"$unwind": "$categoryDetails"},
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "services_details": {
                                        "$push": {
                                            "service_name": "$servicesDetails.service_name."+languageCode,
                                            "service_cost": "$salonServices.service_cost",
                                            "service_time": "$salonServices.service_time",
                                            "category_name": "$categoryDetails.category_name."+languageCode,


                                        }
                                    },
                                    "package_name": {"$first": "$package_name"},
                                    "package_for": {"$first": "$package_for"},
                                    "total_service_time": {"$sum": "$salonServices.service_time"},
                                    "total_service_cost": {"$sum": "$salonServices.service_cost"},
                                    "package_amount": {"$first": "$package_amount"}
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "package_id": "$_id",
                                    "service_details": "$services_details",
                                    "package_amount": "$package_amount",
                                    "package_name": "$package_name",
                                    "package_for": "$package_for",
                                    "total_service_cost": "$total_service_cost",
                                    "total_service_time": "$total_service_time"
                                }
                            }

                        ], "as": "salonPackages"
                    }
                },
                {"$lookup":{"from":"customers","localField":'customer_id',"foreignField":"_id","as":"customerDetails"}},
                {"$unwind": {"path": "$customerDetails","preserveNullAndEmptyArrays": true}},
                {
                    "$lookup": {
                        "from": "services", "let": {"service_id": "$cartDetails.service_id"},
                        "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$$service_id", "$_id"]}]}}},
                            {
                                "$lookup": {
                                    "from": "category",
                                    "localField": "category_id",
                                    "foreignField": "_id",
                                    "as": "category"
                                }
                            },
                            {"$unwind": "$category"},
                            {"$project":
                                    {
                                        "category_id": "$category.category_id",
                                        "category_name": "$category.category_name",
                                        "service_id": "$_id",
                                        "service_name": "$service_name"
                                    }
                            }
                        ], "as": "servicesList"
                    }
                },
                {"$unwind": "$servicesList"},

                {
                    "$lookup": {
                        "from": "salonServices",
                        "let": {"service_id": "$cartDetails.service_id", "salon_id": "$cartDetails.salon_id", "selected_for": "$cartDetails.selected_for"},
                        "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$salon_id", "$$salon_id"]},
                                        {"$eq": ["$service_id", "$$service_id"]}, {"$eq": ["$$selected_for", "$service_for"]},{"$eq":['$status',1]}]}}},

                            {
                                "$project": {
                                    "service_cost": "$service_cost",
                                    "service_time": "$service_time"
                                }
                            }
                        ],
                        "as": "salonServices"
                    }
                },
                {"$unwind": {"path": "$employeeDetails", "preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$assignEmployeeDetails", "preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$salonServices", "preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$salonDetails", "preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$salonPackages", "preserveNullAndEmptyArrays": true}},
                {
                    "$group": {
                        "_id": "$_id",
                        "cart_items":
                        {
                            "$push":{
                                "cart":{
                                    "cart_id": "$cartDetails._id",
                                    "cart_time": "$salonServices.service_time",
                                    "selected_for": "$cartDetails.selected_for",
                                    "cart_count": "$cartDetails.quantity",
                                    "cart_amount": "$cartDetails.price",
                                    "employee_id":{"$ifNull":[ "$employeeDetails._id",'']},
                                    "profile_pic": {"$ifNull":["$employeeDetails.profile_pic",'']},
                                    "employee_name": {"$ifNull":[{"$concat":["$employeeDetails.employee_first_name."+languageCode," ","$employeeDetails.employee_last_name."+languageCode]},'']},

                                    "assign_employee_id":{"$ifNull": ["$assignEmployeeDetails._id",'']},
                                    "assign_employee_name": {"$ifNull":[{"$concat":["$assignEmployeeDetails.employee_first_name."+languageCode," ","$assignEmployeeDetails.employee_last_name."+languageCode]},'']},
                                    "assign_profile_pic": {"$ifNull":["$assignEmployeeDetails.profile_pic",'']},
                                    "date": "$cartDetails.date",
                                    "time": "$cartDetails.time"
                                },
                                "type":"$type",
                                "booking_id":"$bookingDetails._id",
                                "fixed_date": {"$ifNull":[ "$bookingDetails.date", '']},
                                "fixed_time": {"$ifNull":[ "$bookingDetails.time", '']},
                                "service":{
                                    "service_cost": "$salonServices.service_cost",
                                    "service_name": "$servicesList.service_name."+languageCode,
                                    "service_id": "$servicesList.service_id",
                                    "category_id": "$servicesList.category_id",
                                    "category_name": "$servicesList.category_name."+languageCode
                                }
                            }
                        },"package": { "$first":{ "package_id": "$salonPackages.package_id",
                                "package_name": "$salonPackages.package_name",
                                "package_service":"$salonPackages.service_details",
                                "package_amount":"$salonPackages.package_amount",
                                "total_service_time":"$salonPackages.total_service_time"
                            }},
                        "cart_time":{"$sum":{"$ifNull":[{"$multiply":["$salonServices.service_time","$cartDetails.quantity"]},
                                    {"$multiply":["$salonPackages.total_service_time","$cartDetails.quantity"]}]}},
                        "cart_amount":{"$sum":{"$ifNull":[{"$cond":[{"$eq":["$cartDetails.is_package",1]},
                                        {"$multiply":["$salonPackages.package_amount","$cartDetails.quantity"]},
                                        {"$multiply":["$salonServices.service_cost","$cartDetails.quantity"]},
                                    ]},0
                                ]}},
                        "cart_count":{"$sum":{"$multiply":[{"$sum":1},"$cartDetails.quantity"]}},
                        "salonDetails":{"$push":"$salonDetails"},
                        "date":{"$first":"$cartDetails.date"},
                        "time":{"$first":"$cartDetails.time"},
                        "is_package":{"$first":"$cartDetails.type"},
                        "packages":{"$sum":"$salonPackages"},
                         "payment_type":{"$first":"$payment_type"},
                        "booking_for":{"$first":{"$ifNull":['$cartDetails.cart_for',1]}},
                        "currency":{"$first":{"currency":"$bookingDetails.customer_country_details.currency_code","currency_symbol":"$bookingDetails.customer_country_details.currency_symbol"}},
                        "customer_details":{"$first":{"customer_name":
                                    {"$ifNull":[{"$concat":["$customerDetails.first_name."+languageCode,"  ","$customerDetails.last_name."+languageCode]},'']},
                                "tm_user_id":{"$ifNull":["$customerDetails.tm_user_id",0]},
                                "profile_pic":{"$ifNull":["$customerDetails.profile_pic",'']},
                                'friend_name':'$cartDetails.friend_details.friend_name',
                                'friend_mobile':'$cartDetails.friend_details.friend_mobile'}}
                    }
                },
                {
                    "$project": {
                        "order_id": "$_id",
                        "_id": 0,
                        "cart_items": "$cart_items",
                        "is_package":{ $cond: [ {"$eq":["$is_package",2]}, 1, 0] },
                        "customer_id":"$cartDetails.customer_id",
                        "total_cart":{"cart_time":"$cart_time","cart_amount":"$cart_amount","cart_count":"$cart_count"},
                        "salonDetails":{"$arrayElemAt":["$salonDetails",0]},
                        "date":{"$ifNull":["$date",'']},
                        "time":{"$ifNull":["$time",'']},
                        "booking_for":"$booking_for",
                        "currency":"$currency",
                        "payment_type":"$payment_type",
                        "package":"$package",
                        "customer_details":{"$ifNull":["$customer_details",{}]}
                    }
                }
            ],function(err,response){

                return callback(response);
            });
        },checkOrderDetails:function(orderId,callback){
            var order= mongoose.Types.ObjectId(orderId);

            db.orders.aggregate([{"$match":{"_id":order}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","let":{"booking_id":"$booking_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]}]}}},
                            {"$unwind":"$cart_id"},
                            {"$lookup":{"from":"cart","let":{"cart":"$cart_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$cart","$_id"]}]}}}],"as":"cartDetails"}},
                            {"$unwind":"$cartDetails"}
                        ],"as":"bookingDetails"}},
                {"$unwind":"$bookingDetails"},
                { $replaceRoot: { newRoot: '$bookingDetails' } }

            ],function(err,response){


                return callback(response);
            });
        },getSalonPackageOrder:function(packageId,callback)
        {
            db.orders.aggregate([{"$match":{"_id":packageId}},
                {"$unwind":"$booking_id"},
                {"$lookup":{"from":"bookings","localField":"booking_id","foreignField":"_id","as":"bookingDetails"}},
                {"$unwind":"$bookingDetails"},
                {"$lookup":{"from":"salonPackages","localField":"package_id","foreignField":"_id","as":"packageDetails"}}
                ,{"$unwind":"$packageDetails"},
                {
                    "$lookup": {
                        "from": "salonPackages", "let": {"package_id": "$package_id"},
                        "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$_id", "$$package_id"]}]}}},
                            {"$unwind": "$services"},
                            {
                                "$lookup": {
                                    "from": "services",
                                    "localField": "$services.service_id",
                                    "foreignField": "_id",
                                    "as": "servicesDetails"
                                }
                            },
                            {
                                "$lookup": {
                                    "from": "salonServices",
                                    "let": {"service": "$services.service_id", "service_for": "$services.service_for","salon_id":"$salon_id"},
                                    "pipeline": [{"$match": {"$expr": {"$and": [
                                                    {"$eq":["$salon_id","$$salon_id"]},
                                                    {"$ne":["$status",0]},
                                                    {"$eq": ["$service_id", "$$service"]},
                                                    {"$eq": ["$service_for", "$$service_for"]}]
                                            }}}],
                                    "as": "salonServices"
                                }
                            },
                            {"$unwind": "$salonServices"},
                            {"$unwind": "$services"},
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "services_details": {
                                        "$push": {
                                            "service_name": "$servicesDetails.service_name.en",
                                            "service_cost": "$salonServices.service_cost",
                                            "service_time": "$salonServices.service_time"
                                        }
                                    },

                                    "package_name": {"$first": "$package_name"},
                                    "package_for": {"$first": "$package_for"},
                                    "total_service_time": {"$sum": "$salonServices.service_time"},
                                    "total_service_cost": {"$sum": "$salonServices.service_cost"},
                                    "package_amount": {"$first": "$package_amount"}
                                }
                            },
                            {
                                "$project": {
                                    "_id": 0,
                                    "package_id": "$_id",
                                    "service_details": "$services_details",
                                    "package_amount": "$package_amount",
                                    "package_name": "$package_name",
                                    "package_for": "$package_for",
                                    "total_service_cost": "$total_service_cost",
                                    "total_service_time": "$total_service_time"
                                }
                            }
                        ], "as": "salonPackages"
                    }
                },
                {"$lookup":{"from":"customers","localField":'customer_id',"foreignField":"_id","as":"customerDetails"}},
                {"$unwind": {"path": "$customerDetails","preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$salonPackages","preserveNullAndEmptyArrays": true}},
                {"$project":{"package":"$salonPackages", "customer_details":{"customer_name":{"$ifNull":[{"$concat":["$customerDetails.first_name","  ","$customerDetails.last_name"]},'']},"profile_pic":{"$ifNull":["$customerDetails.profile_pic",'']}}}
                }
            ],function(err,response){
                return callback(response);
            })
        }
    };
