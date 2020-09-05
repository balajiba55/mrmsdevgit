var db = require('../db');
var mongoose = require('mongoose');
var round = require('mongo-round');
var utility = require('../utility/utility');


module.exports =
{
    status: {
        "1": { "status": 1, "stylist_status": "Requesting Stylist" },
        "2": { "status": 2, "stylist_status": "Booking confirmed" },
        "3": { "status": 3, "stylist_status": "Requesting timeout" },
        "4": { "status": 4, "stylist_status": "Booking cancelled by user" },
        "5": { "status": 5, "stylist_status": "Booking cancelled by stylist" },
        "6": { "status": 6, "stylist_status": "Requesting rejected" },
        "7": { "status": 7, "stylist_status": "Booking started" },
        "8": { "status": 8, "stylist_status": "Booking completed" },
        "9": { "status": 9, "stylist_status": "Request cancelled by the User" },
        "10": { "status": 10, "stylist_status": "User reached the salon" }
    },
    cancellation_pay_status: { "1": { "cancellation_pay_status": "pending to pay cancellation fee", "2": "cancellation fee paid" } },
    save: function (values, callback) {
        var bookings = new db.bookings(values);
        bookings.save(function (err, response) {
            return callback(response);
        });
    }, insertMany: function (values, callback) {
        db.bookings.insertMany(values, function (err, response) {
            return callback(response);
        });
    }, find: function (check, callback) {
        db.bookings.find(check, function (err, response) {
            callback(response);
        });
    }, update: function (data, where, callback) {
        db.bookings.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {
            callback(response);
        });
    }, updateLocation: function (data, where, callback) {
        db.bookings.findOneAndUpdate(where, { "$addToSet": { "traveled_location": data } }, { new: true },
            function (err, response) {
                callback(response);
            });
    }, updateRejectVendors: function (data, where, callback) {
        db.bookings.findOneAndUpdate(where, { "$addToSet": { "reject_vendors": data } }, { new: true },
            function (err, response) {
                callback(response);
            });
    }, checkVendor: function (vendorId, userId) {

    }, getBookingDetails: function (customerId, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.bookings.aggregate([
            { "$match": { "customer_id": userId } }
        ], function (err, response) {

            return callback(response);
        })
    }, getBookingCartDetails: function (bookingId, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        db.bookings.aggregate([
            { "$match": { "_id": booking } },
            { "$unwind": "$cart_id" },
            { "$lookup": { "from": "cart", "localField": "cart_id", "foreignField": "_id", "as": "cart" } },
            { "$unwind": "$cart" },
            { "$group": { "_id": "$vendor_id", "cart": { "$push": "$cart" } } }
        ], function (err, response) {

            return callback(response);
        });
    }, getBookingCartDetailsSalon: function (bookingId, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        db.bookings.aggregate([
            { "$match": { "_id": booking } },
            { "$unwind": "$cart_id" },
            { "$lookup": { "from": "cart", "localField": "cart_id", "foreignField": "_id", "as": "cart" } },
            { "$unwind": "$cart" },
            { $replaceRoot: { newRoot: '$cart' } }
        ], function (err, response) {
            return callback(response);
        });
    }, getVendorBookings: function (vendorId, limit, offset, languageCode, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([
            { "$sort": { "created": -1 } },
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            { "$eq": ["$vendor_id", vendor] },
                            { "$ne": ["$status", 3] }
                        ]
                    }
                }
            },
            { "$skip": parseInt(offset) },
            { "$limit": parseInt(limit) },
            { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } }
            , { "$unwind": "$customerDetails" },
            {
                "$project": {
                    "booking_date": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created" } },
                    "customer_name": { "$concat": ["$customerDetails.first_name." + languageCode, "  ", "$customerDetails.last_name." + languageCode] },
                    "booking_id": { "$ifNull": ["$booking_inc_id", 0] }, "status": "$status"
                }
            }
        ], function (err, response) {
            return callback(response);
        })
    }, getVendorBookingsCount: function (vendorId, languageCode) {
        var vendor = new mongoose.Types.ObjectId(vendorId);

        return new Promise(function (resolve) {
            db.bookings.aggregate([
                { "$sort": { "created": -1 } },
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                { "$eq": ["$vendor_id", vendor] },
                                { "$ne": ["$status", 3] }
                            ]
                        }
                    }
                },
                { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } }
                , { "$unwind": "$customerDetails" },
                {
                    "$project": {
                        "booking_date": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created" } },
                        "customer_name": { "$concat": ["$customerDetails.first_name." + languageCode, "  ", "$customerDetails.last_name." + languageCode] },
                        "booking_id": { "$ifNull": ["$booking_inc_id", 0] }, "status": "$status"
                    }
                },
                {
                    $count: "bookings_count"
                }
            ], function (err, response) {
                console.log(err);
                return resolve(response);
            })
        });

    }, getVendorBookingDetails: function (bookingId, languageCode, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);

        db.bookings.aggregate([
            { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", booking] }] } } },
            { "$unwind": "$cart_id" },
            {
                "$lookup": {
                    "from": "cart", "let": { "cart_id": "$cart_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                        { '$lookup': { "from": 'subCategory', "localField": 'sub_category_id', "foreignField": '_id', as: 'subCategory' } },
                        { '$lookup': { "from": 'services', "localField": "service_id", "foreignField": "_id", as: 'services' } },
                        { "$lookup": { "from": "category", "localField": "category_id", "foreignField": "_id", "as": "category" } },
                        { "$unwind": "$category" },
                        { "$unwind": "$services" },
                        {
                            "$project": {
                                "cart_id": "$_id",
                                "quantity": "$quantity",
                                "service_name": "$services.service_name." + languageCode,
                                "category_name": "$category.category_name." + languageCode,
                                "selected_for": "$selected_for",
                                "selected_service_level": "$selected_service_level",
                                "price": "$price",
                                "status": "$status"
                                , "duration": "$duration"
                                , 'cart_for': "$cart_for",
                                "friend_details": "$friend_details",
                                "customer_id": "$customer_id"
                            }
                        }
                    ],
                    "as": "cart"
                }
            },
            { "$unwind": "$cart" },
            {
                "$lookup": {
                    "from": "customers", "let": { "customer_id": "$customer_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$customer_id", "$_id"] }] } } }],
                    "as": "customerDetails"
                }
            },
            { "$unwind": "$customerDetails" },
            {
                "$lookup": {
                    "from": "rating", "let": { "customer_id": "$customer_id", "booking_id": "$_id" }, "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and":
                                    [
                                        { "$eq": ["$customer_id", "$$customer_id"] },
                                        /* {"$eq":["$booking_id","$$booking_id"]},*/
                                        { "$eq": ["$rated_by", 2] }]
                            }
                        }
                    }],
                    "as": "rating"
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "cart": { "$push": "$cart" },
                    "status": { "$first": "$status" },
                    "vendor_id": { "$first": "$vendor_id" },
                    "customer": {
                        "$first": {
                            "profile_pic": { "$ifNull": ["$customerDetails.profile_pic", ''] },
                            "totalrating": { "$ifNull": [{ '$divide': [{ '$trunc': { '$add': [{ '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5] } }, 10] }, 0] },
                            "totalreviews": { "$ifNull": [{ "$size": "$rating" }, 0] },
                            "totalreview": { "$ifNull": [{ "$size": "$rating" }, 0] },
                            "location": "$vendorDetails.location.location",
                            "customer_id": "$customerDetails._id",
                            "mobile": "$customerDetails.mobile",
                            "latitude": "$latitude",
                            "additional_details": "$additional_details",
                            "longitude": "$longitude",
                            "created_at": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created" } },
                            "tm_user_id": { "$ifNull": ["$customerDetails.tm_user_id", 0] },
                            "address": "$address",
                            'friend_name': '$cart.friend_details.friend_name',
                            'friend_mobile': '$cart.friend_details.friend_mobile',
                            "name": { "$ifNull": [{ "$concat": [{ "$ifNull": ["$customerDetails.first_name." + languageCode, "$customerDetails.first_name.en"] }, "  ", { "$ifNull": ["$customerDetails.last_name." + languageCode, "$customerDetails.first_name.en"] }] }, ""] },
                        }
                    }, "booking_for": { "$first": { "$ifNull": ['$cart.cart_for', 1] } },
                    "coupon": {
                        "$first": {
                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] }, "coupon_code": { "$ifNull": ['$coupon', ''] },
                            "type": { "$ifNull": ["$coupon_amount_type", 0] }
                        }
                    },
                    "surge": { "$first": "$surge" },
                    "duration": { "$sum": "$cart.duration" },
                    "currency_details": {
                        "$first": {
                            "currency_code": "$customer_country_details.currency_code",
                            "currency_symbol": "$customer_country_details.currency_symbol"
                        }
                    },
                    "currency": {
                        "$first": {
                            "currency_code": "$customer_country_details.currency_code",
                            "currency": "$customer_country_details.currency_symbol"
                        }
                    },
                    "payment_type": { "$first": { "$ifNull": ["$payment_type", 1] } },
                    "booking_request_time": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$booking_requested" } } },
                    "cancellation_type": { "$first": "$cancell_type" },
                    "net_amount": { "$first": "$net_amount" },
                    "mr_miss_fee": { "$first": { "$ifNull": ["$booking_percentage", 0] } },
                    "cancellation_value": { "$first": { "$ifNull": ["$cancellation_amount", 0] } },
                    "coupon_details": { "$first": "$coupon_details" }
                }
            },
            { "$lookup": { "from": "vendor", "localField": "vendor_id", "foreignField": "_id", "as": "vendorDetails" } },
            { "$unwind": "$vendorDetails" },
            {
                "$project": {
                    "_id": "$_id",
                    "cart": "$cart",
                    "name": { "$ifNull": [{ "$concat": [{ "$ifNull": ["$vendorDetails.first_name." + languageCode, "$vendorDetails.first_name.en"] }, "  ", { "$ifNull": ["$vendorDetails.last_name." + languageCode, "$vendorDetails.first_name.en"] }] }, ""] },
                    "profile_pic": "$vendorDetails.profile_pic",
                    "customer": "$customer",
                    "coupon": "$coupon",
                    "booking_id": "$_id",
                    "booking_for": "$booking_for",
                    "surge": { "$ifNull": ["$surge", 0] },
                    "mr_ms_fee": { "$ifNull": ["$mr_miss_fee", 1] },
                    "mr_miss_fee": { "$ifNull": ["$mr_miss_fee", 1] },
                    "booking_status": "$status",
                    "net_amount": "$net_amount",
                    "total": { $multiply: ["$surge", "$net_amount"] },
                    "payment_type": "$payment_type",
                    "currency": "$currency",
                    "service_time": "$duration",
                    "booking_request_time": "$booking_request_time",
                    "currency_details": "$currency_details",
                    "cancellation_value": "$cancellation_value",
                    "cancellation_type": { "$ifNull": ["$cancellation_type", 0] },
                    "coupon_details": { "$ifNull": ["$coupon_details", {}] }
                }
            }
        ], function (err, response) {

            return callback(response)
        });
    },
    findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {
            db.bookings.find(check, fields, function (err, response) {

                resolve(response);
            });
        });
    }, getCustomerBookingDetails: function (bookingId, customerId, languageCode, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);

        db.bookings.aggregate(
            [
                {
                    "$match":
                        { "$expr": { "$and": [{ "$eq": ["$_id", booking] }] } }
                },
                { "$unwind": "$cart_id" },
                {
                    "$lookup": {
                        "from": "cart", "let": { "cart_id": "$cart_id" },
                        "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                        { '$lookup': { "from": 'subCategory', "localField": 'sub_category_id', "foreignField": '_id', as: 'subCategory' } },
                        { '$lookup': { "from": 'services', "localField": "service_id", "foreignField": "_id", as: 'services' } },
                        { "$lookup": { "from": "category", "localField": "category_id", "foreignField": "_id", "as": "category" } },
                        { "$unwind": "$category" },
                        { "$unwind": "$services" },
                        {
                            "$project": {
                                "cart_id": "$_id", "additional_details": "$additional_details", "quantity": "$quantity", "duration": "$duration", "service_name": "$services.service_name." + languageCode, "category_name": "$category.category_name." + languageCode,
                                "selected_for": "$selected_for", "selected_service_level": "$selected_service_level", "price": "$price", "status": "$status", "customer_id": "$customer_id"
                            }
                        }
                        ],
                        "as": "cart"
                    }
                },
                { "$unwind": "$cart" },
                {
                    "$lookup": {
                        "from": "vendor", "let": { "vendor_id": "$vendor_id" },
                        "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$_id"] }] } } }, {
                            "$lookup": {
                                "from": "stylist", "let": { "vendor_id": "$_id" }, "pipeline":
                                    [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$vendor_id"] }] } } },
                                    { "$graphLookup": { "from": "services", "startWith": "$expertise", "connectFromField": "expertise", "connectToField": "_id", "as": "expertiseServices" } },
                                    { "$project": { "_id": 0, "expertise": "$expertiseServices.service_name." + languageCode } }
                                    ], "as": "expertises"
                            }
                        },
                        {
                            "$lookup": {
                                "from": "vendorLocation",
                                "let": { "vendor_id": "$_id" },
                                "pipeline": [{
                                    "$match": {
                                        "$expr": {
                                            "$and": [{
                                                "$eq": ["$vendor_id", "$$vendor_id"]
                                            }]
                                        }
                                    }
                                }, {
                                    "$project": {
                                        "location": {
                                            "latitude": { "$arrayElemAt": ["$location.coordinates", 1] },
                                            "longitude": { "$arrayElemAt": ["$location.coordinates", 0] }
                                        }
                                    }
                                }],
                                "as": "location"
                            }
                        }], "as": "vendorDetails"
                    }
                },

                { "$unwind": "$vendorDetails" },
                {
                    "$lookup": {
                        "from": "rating", "let": { "vendor_id": "$vendorDetails._id" },
                        "pipeline": [{
                            "$match":
                            {
                                "$expr": {
                                    "$and": [
                                        { "$eq": ["$vendor_id", "$$vendor_id"] },
                                        { "$eq": ["$rated_by", 1] }
                                    ]
                                }
                            }
                        }],
                        "as": "rating"
                    }
                },
                {
                    "$lookup": {
                        "from": "orders", "let": { "booking_id": "$_id" },
                        "pipeline": [{ "$match": { "$expr": { "$and": [{ "$in": ["$$booking_id", "$booking_id"] }] } } },
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking": "$booking_id" }, "pipeline":
                                    [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$booking"] }] } } }], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { "$group": { "_id": "$_id", "booking_total": { "$sum": "$bookingDetails.net_amount" }, "booking_count": { "$sum": 1 } } }
                        ],
                        "as": "orderTotal"
                    }
                },
                { "$unwind": "$orderTotal" },
                {
                    "$group": {
                        "_id": "$_id",
                        "cart": { "$push": "$cart" },
                        "status": { "$first": "$status" },
                        "payment_type": { "$first": "$payment_type" },
                        "created": { "$first": "$created" }
                        , "vendor": {
                            "$first": {
                                "profile_pic": "$vendorDetails.profile_pic",
                                "tm_user_id": { "$ifNull": ["$vendorDetails.tm_user_id", 0] },
                                "totalrating": {
                                    "$ifNull": [
                                        {
                                            '$divide': [{ '$trunc': { '$add': [{ '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5] } }, 10]
                                        },
                                        0]
                                },
                                "totalreview": { "$ifNull": [{ "$size": "$rating" }, 0] },
                                "location": { "$arrayElemAt": ["$vendorDetails.location.location", 0] },
                                "vendor_id": "$vendor_id", "mobile": "$vendorDetails.mobile",
                                "name": { "$concat": ["$vendorDetails.first_name." + languageCode, "  ", "$vendorDetails.last_name." + languageCode] },
                                "expertise": { "$arrayElemAt": ["$vendorDetails.expertises.expertise", 0] }

                            }
                        },
                        'order_total': { "$first": "$orderTotal.booking_total" },
                        "orders": { "$first": "$orderTotal.booking_count" },
                        'cancel': { "$first": { "cancell_type": "$cancell_type", "cancell_type_value": "$cancell_type_value", "cancellation_pay_status": "$cancellation_pay_status" } },
                        "promo_code_details": { "$first": { "promo_amount": { "$ifNull": ["$promo_amount", 0] }, "promo_code": { "$ifNull": ['$promo', ''] }, "type": { "$ifNull": ["$promo_amount_type", 0] } } },
                        "coupon_code_details": {
                            "$first": {
                                "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                "coupon_code": { "$ifNull": ['$coupon', ''] },
                                "up_to_amount": { "$ifNull": ["$up_to_amount", 0] },
                                "type": { "$ifNull": ["$coupon_amount_type", 0] }
                            }
                        },
                        "customer": {
                            "$first": {
                                "latitude": "$latitude",
                                "longitude": "$longitude", "address": "$address"
                            }
                        },
                        "booking_code": { "$first": "$booking_inc_id" },
                        "surge": { "$first": "$surge" },
                        "currency_details": {
                            "$first": {
                                "currency_code": "$customer_country_details.currency_code",
                                "currency_symbol": "$customer_country_details.currency_symbol"
                            }
                        },
                        "created_at": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M:%S:%L", date: "$booking_requested" } } },
                        "payment_details": { "$first": "$payment_details" },
                        "coupon_details": { "$first": { "$ifNull": ["$coupon_details", {}] } },
                        "additional_details": { "$first": { "$ifNull": ["$additional_details", {}] } }
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "bookings": [{
                            "cart": "$cart",
                            "vendor": "$vendor",
                            "promo": "$promo_code_details",
                            "coupon": "$coupon_code_details",
                            "booking_id": "$_id",
                            "coupon_details": "$coupon_details",
                            "booking_status": "$status",
                            "created_at": "$created_at",
                            "payment_details": { "$ifNull": ["$payment_details.payment", {}] },
                            "payment_type": { "$ifNull": ["$payment_type", 1] }
                        }],
                        "order_total": "$order_total",
                        "orders": "$orders",
                        "payment_type": { "$ifNull": ["$payment_type", 1] },
                        "surge": { "$ifNull": ["$surge", 1.0] },
                        "cancell": { "$ifNull": ["$cancel", {}] },
                        "booking_code": { "$concat": ["#BST-", { $substr: ["$booking_code", 0, -1] }] },
                        "created_at": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } },
                        "address": "$customer.address",
                        "latitude": "$customer.latitude",
                        "longitude": "$customer.longitude",
                        "additional_details": { "$ifNull": ["$additional_details", {}] },
                        "currency_details": "$currency_details",
                        "online_payment_status": "$online_payment_status"
                    }
                }
            ], function (err, response) {

                return callback(response)
            });
    }, getcustomerBookings: function (vendorId, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([{
            "$match": {
                "$expr": {
                    "$and": [
                        { "$eq": ["$vendor_id", vendor] },
                        { "$ne": ["$status", 3] }
                    ]
                }
            }
        },
        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } }
            , { "$unwind": "$customerDetails" },
        {
            "$project": {
                "booking_date": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created" } }, "customer_name": { "$concat": ["$customerDetails.first_name", "  ", "$customerDetails.last_name"] },
                "booking_id": { "$ifNull": ["$booking_inc_id", 0] }, "status": "$status"
            }
        }
        ], function (err, response) {

            return callback(response);
        });
    }, getStylistEarings: function (vendorId, startDate, endDate, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([
            { "$match": { "$expr": { "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] }] } } },
            { "$match": { "created": { $gte: new Date(startDate), $lt: new Date(endDate) } } },
            /*{"$unwind":"$cart_id"},
            {"$lookup":{"from":"cart","localField":"cart_id","foreignField":"_id","as":"cartDetails"}},
            {"$unwind":"$cartDetails"},
                   {"$group":{"_id":"$_id","cart_amount":{"$sum":"$cartDetails.price"},"created":{"$first":"$created"}}},
                   {"$group":{"_id":{ $dayOfWeek: "$created" },"amount":{"$sum":"$cart_amount"}}},
                   {"$project":{"_id":"$_id","amount":"$amount"}} */
            {
                "$group": {
                    "_id": "$_id", "amount": { "$sum": "$net_amount" },
                    "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                    "total_bookings": { "$sum": 1 },
                    "status": { "$first": "$status" },
                    "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                    // "mr_miss_fee":{"$sum":{"$multiply":[{"$divide":["$net_amount",100]},utility.mr_miss_booking_fee]}},
                    "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } },
                    "created": { "$first": "$created" }
                }
            },

            {
                "$project": {
                    "_id": 1, "amount": 1, "surge": 1,
                    "mr_miss_fee": "$mr_miss_fee", "status": 1, "cancellation_amount": 1,
                    "total_bookings": 1, "created": 1
                }
            },
            {
                "$group": {
                    "_id": { $dayOfWeek: "$created" }, "amount": {
                        "$sum":
                        {
                            '$cond': [{ "$eq": ['$status', 8] }, {
                                "$subtract": [{ "$add": ["$amount", "$surge"] }, "$mr_miss_fee"]
                            }, 0]
                        }
                    },
                    "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                    "total_bookings": { "$sum": 1 }
                }
            },
            { "$project": { "_id": "$_id", "amount": round({ "$subtract": ["$amount", "$cancellation_amount"] }, 2), "total_bookings": 1 } }

            // { "$project": { "_id": "$_id", "amount":  { "$subtract": ["$amount", "$cancellation_amount"] }, "total_bookings": 1 } }
        ],
            function (err, response) {
                return callback(response);
            });




    }, getSalonEarings: function (startDate, endDate, salonId, employeeId, callback) {
        var salon = new mongoose.Types.ObjectId(salonId);
        var bookingConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, { "$eq": ["$status", 8] },
                    { "$eq": ["$is_package", 0] }]
                }
            }
        };
        var bookingPacakgeConditon = { "$match": { "$expr": { "$and": [{ "$eq": ["$$booking_id", "$_id"] }, { "$eq": ["$status", 8] }, { "$eq": ["$is_package", 1] }] } } };
        var salonCondition = { "$match": { "salon_id": salon } };
        var bookingServeOutConditon = { "$match": { "salon_id": salon, "status": 8, "stylist_type": 3 } };



        if (employeeId != '') {
            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, { "$eq": ["$status", 8] },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 0] }]
                    }
                }
            };
            bookingServeOutConditon = { "$match": { "salon_id": salon, "status": 8, "stylist_type": 3, 'employee_id': employee } };
            bookingPacakgeConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, { "$eq": ["$status", 8] },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 1] }]
                    }
                }
            };
        }

        db.orders.aggregate([
            salonCondition,
            {
                "$facet": {
                    "bookings":
                        [
                            { "$unwind": "$booking_id" },
                            {
                                "$lookup": {
                                    "from": "bookings", "let": { "booking_id": "$booking_id" },
                                    "pipeline": [
                                        bookingConditon,
                                        {
                                            "$project": {
                                                "created": {
                                                    $dateFromString: {
                                                        dateString: { "$concat": ["$date", ' ', "$time"] },
                                                        timezone: "$time_zone"
                                                    }
                                                }, "is_package": "$is_package",
                                                "salon_id": "$salon_id", "status": 1,
                                                "net_amount": "$net_amount",
                                                "booking_percentage": 1
                                            }
                                        },
                                        {
                                            "$match": {
                                                "created": {
                                                    $gte: new Date(startDate),
                                                    $lt: new Date(endDate)
                                                }
                                            }
                                        },
                                    ], "as": "booking_details"
                                }
                            },
                            { "$unwind": "$booking_details" },
                            { $replaceRoot: { newRoot: "$booking_details" } }
                        ],
                    "packages": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id" },
                                "pipeline": [
                                    bookingPacakgeConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            }, "is_package": "$is_package", "salon_id": "$salon_id", "status": 1, "net_amount": "$net_amount", "booking_percentage": 1
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    },
                                ], "as": "booking_details"
                            }
                        },
                        { "$unwind": "$booking_details" },
                        { "$group": { "_id": "$_id", "booking_details": { "$first": "$booking_details" } } },
                        { $replaceRoot: { newRoot: "$booking_details" } }
                    ], "serveOutBookings": [
                        {
                            $bucketAuto: {
                                groupBy: "$created_at",
                                buckets: 1
                            }
                        },
                        { "$project": { "_id": 0 } },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id" },
                                "pipeline": [
                                    bookingServeOutConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            }, "coupon_details": "$coupon_details", "is_package": "$is_package", "salon_id": "$salon_id", "status": 1, "net_amount": "$net_amount", "booking_percentage": 1
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    },
                                ], "as": "booking_details"
                            }
                        },
                        { "$unwind": "$booking_details" },
                        { $replaceRoot: { newRoot: "$booking_details" } }
                    ]
                }
            },
            { $project: { items: { $concatArrays: ["$bookings", "$packages", "$serveOutBookings"] } } },
            { "$unwind": "$items" },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            }, {
                "$group": {
                    "_id": { $dayOfWeek: "$created" }, "amount": {
                        "$sum": {
                            "$subtract": [{
                                "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                            }
                                , { "$ifNull": ["$booking_percentage", 0] }]
                        }
                    }
                }
            },
            { "$project": { "_id": "$_id", "amount": "$amount" } }

        ], function (err, response) {

            return callback(response);
        })
    }, getSalonMonthlyEarings: function (vendorId, startDate, endDate, salonId, employeeId, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        var bookingConditon = { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }, { "$eq": ["$status", 8] }] } } };
        var salonCondition = { "$match": { "vendor_id": vendor } };
        if (employeeId != '') {
            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingConditon = { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }, { "$eq": ["$status", 8] }, { "$eq": ["$employee_id", employee] }] } } };
        }
        if (salonId != '') {
            var salon = new mongoose.Types.ObjectId(salonId);
            salonCondition = { "$match": { "_id": salon } }
        }


        db.salon.aggregate([
            salonCondition,
            {
                "$lookup": {
                    "from": "bookings", "let": { "salon_id": "$_id" },
                    "pipeline": [
                        bookingConditon,
                        {
                            "$project": {
                                "created": {
                                    $dateFromString: {
                                        dateString: { "$concat": ["$date", ' ', "$time"] },
                                        timezone: "$time_zone"
                                    }
                                },
                                "salon_id": "$salon_id", "net_amount": "$net_amount",
                                "coupon_details": "$coupon_details", "booking_percentage": "$booking_percentage"
                            }
                        },
                        {
                            "$match": {
                                "created": {
                                    $gte: new Date(startDate),
                                    $lt: new Date(endDate)
                                }
                            }
                        },
                        {
                            "$group": {
                                "_id": { $dayOfMonth: "$created" },
                                "amount": {
                                    "$sum": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                }
                            }
                        },
                        { "$project": { "_id": "$_id", "amount": "$amount" } }
                    ], "as": "booking_details"
                }
            },
            { "$unwind": "$booking_details" },
            { $replaceRoot: { newRoot: "$booking_details" } }
        ], function (err, response) {

            return callback(response);
        })
    },
    getSalonDailyEarings: function (startDate, endDate, salonId, employeeId, callback) {
        var salon = new mongoose.Types.ObjectId(salonId);
        var bookingConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 0] }]
                }
            }
        };
        var bookingServeOutConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$stylist_type', 3] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    }]
                }
            }
        };

        //var bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3}};
        var bookingPacakgeConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 1] }]
                }
            }
        };
        var salonCondition = { "$match": { "salon_id": salon } };

        if (employeeId != '') {
            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingConditon = {
                "$match": {
                    "$expr": {
                        "$and": [
                            { "$eq": ["$$booking_id", "$_id"] },
                            {
                                '$or': [{ "$eq": ["$status", 8] },
                                { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                            },
                            { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 0] }]
                    }
                }
            };

            bookingServeOutConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$employee_id', employee] }, { "$eq": ['$stylist_type', 3] },
                        {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        }
                        ]
                    }
                }
            };

            //bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3,'employee_id':employee}};

            bookingPacakgeConditon = {
                "$match": {
                    "$expr": {
                        "$and": [
                            { "$eq": ["$$booking_id", "$_id"] },
                            {
                                '$or': [{ "$eq": ["$status", 8] },
                                {
                                    "$and": [{ "$eq": ["$status", 5] },
                                    { "$ne": ["$cancell_type", 3] }]
                                }]
                            },
                            { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 1] }]
                    }
                }
            };
        }

        db.orders.aggregate([
            salonCondition,
            {
                "$facet": {
                    "bookings": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id" },
                                "pipeline": [
                                    bookingConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString:
                                                {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            },
                                            "coupon_details": "$coupon_details",
                                            "is_package": "$is_package",
                                            "salon_id": "$salon_id",
                                            "status": 1, "cancellation_amount": "$cancellation_amount",
                                            "net_amount": "$net_amount",
                                            "booking_percentage": 1
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    },
                                ], "as": "booking_details"
                            }
                        },
                        { "$unwind": "$booking_details" },
                        { $replaceRoot: { newRoot: "$booking_details" } }
                    ],
                    "packages": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id" },
                                "pipeline": [
                                    bookingPacakgeConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            }, "cancellation_amount": "$cancellation_amount", "coupon_details": "$coupon_details", "is_package": "$is_package", "salon_id": "$salon_id", "status": 1, "net_amount": "$net_amount",
                                            "booking_percentage": 1
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    },
                                ], "as": "booking_details"
                            }
                        },
                        { "$unwind": "$booking_details" },

                        { "$group": { "_id": "$_id", "booking_details": { "$first": "$booking_details" } } },
                        { $replaceRoot: { newRoot: "$booking_details" } }

                    ], "serveOutBookings": [
                        {
                            $bucketAuto: {
                                groupBy: "$created_at",
                                buckets: 1
                            }
                        },
                        { "$project": { "_id": 0 } },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id" },
                                "pipeline": [
                                    bookingServeOutConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            }, "cancellation_amount": "$cancellation_amount", "coupon_details": "$coupon_details", "is_package": "$is_package", "salon_id": "$salon_id", "status": 1, "net_amount": "$net_amount", "booking_percentage": 1
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    },
                                ], "as": "booking_details"
                            }
                        },
                        { "$unwind": "$booking_details" },
                        { $replaceRoot: { newRoot: "$booking_details" } }
                    ]
                }
            },
            { $project: { items: { $concatArrays: ["$bookings", "$packages", "$serveOutBookings"] } } },
            { "$unwind": "$items" },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                "$group": {
                    "_id": "$salon_id", "total_income": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                    "amount": {
                        "$sum":
                        {
                            "$cond": [{ "$eq": ["$status", 8] },
                            {
                                "$subtract":
                                    [{
                                        "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                        { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                    }
                                        , { "$ifNull": ["$booking_percentage", 0] }]
                            }, "$cancellation_amount"]
                        }
                    },
                    "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                    "total_bookings": { "$sum": 1 },
                    "coupon_amount": {
                        "$sum": {
                            "$cond": [{ "$eq": ["$status", 8] }, {
                                "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                    "$coupon_details.coupon_amount", 0]
                            }, 0]
                        }
                    },
                    "mr_miss_fee": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$booking_percentage", 0] } }
                }
            },
            {
                "$project": {
                    "_id": 1, "amount": 1, "surge": 1, "mr_miss_fee": "$mr_miss_fee",
                    "total_bookings": 1, "coupon_amount": 1, "total_income": 1, "cancellation_amount": 1
                }
            }
        ], function (err, response) {
            console.log(err);
            return callback(response);
        });
    }, getSalonBookingDetails: function (bookingId, languagesCode, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        db.bookings.aggregate(
            [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", booking] }] } } },
            { "$unwind": "$cart_id" },
            {
                "$lookup": {
                    "from": "cart", "let": { "cart_id": "$cart_id", "assign_employee_id": { "$ifNull": ['$employee_id', ''] } },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                    { '$lookup': { "from": 'subCategory', "localField": 'sub_category_id', "foreignField": '_id', as: 'subCategory' } },
                    { '$lookup': { "from": 'services', "localField": "service_id", "foreignField": "_id", as: 'services' } },

                    {
                        "$lookup": {
                            "from": "salonEmployees",
                            "let": { "employee_id": "$employee_id" },
                            "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$employee_id", "$_id"] }] } } }],
                            "as": "employeeDetails"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "salonEmployees",
                            "let": { "employee_id": "$$assign_employee_id" },
                            "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$employee_id", "$_id"] }] } } }],
                            "as": "assignEmployeeDetails"
                        }
                    },
                    { "$unwind": "$services" },
                    { "$lookup": { "from": "category", "localField": "services.category_id", "foreignField": "_id", "as": "category" } },
                    { "$unwind": { "path": "$employeeDetails", "preserveNullAndEmptyArrays": true } },
                    { "$unwind": { "path": "$assignEmployeeDetails", "preserveNullAndEmptyArrays": true } },
                    { "$unwind": "$category" },
                    {
                        "$project": {
                            "cart_id": "$_id",
                            "quantity": "$quantity",
                            "service_name": { "$ifNull": ["$services.service_name." + languagesCode, ""] },
                            "category_name": { "$ifNull": ["$category.category_name." + languagesCode, ""] },
                            "selected_for": "$selected_for",
                            "employee_id": { "$ifNull": ["$employeeDetails._id", ''] },
                            "profile_pic": { "$ifNull": ["$employeeDetails.profile_pic", ''] },
                            "employee_name": { "$ifNull": [{ "$concat": ["$employeeDetails.employee_first_name." + languagesCode, " ", "$employeeDetails.employee_last_name." + languagesCode] }, ''] },
                            'cart_for': "$cart_for",
                            'is_package': "$is_package",
                            "payment_type": "$payment_type",
                            "friend_details": "$friend_details",
                            'package_id': "$package_id",
                            "assign_employee_id": { "$ifNull": ["$assignEmployeeDetails._id", ''] },
                            "assign_employee_name": { "$ifNull": [{ "$concat": ["$assignEmployeeDetails.employee_first_name." + languagesCode, " ", "$assignEmployeeDetails.employee_last_name." + languagesCode] }, ''] },
                            "assign_profile_pic": { "$ifNull": ["$assignEmployeeDetails.profile_pic", ''] },
                            "selected_service_level": "$selected_service_level",
                            "price": "$price", "status": "$status",
                            "customer_id": "$customer_id",
                            "date": "$date",
                            "time": "$time"
                        }
                    }],
                    "as": "cart"
                }
            },
            { "$unwind": "$cart" },
            {
                "$lookup": {
                    "from": "customers", "let": { "customer_id": "$customer_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$customer_id", "$_id"] }] } } }],
                    "as": "customerDetails"
                }
            },
            { "$unwind": "$customerDetails" },
            {
                "$lookup": {
                    "from": "rating", "let": { "customer_id": "$customerDetails._id" }
                    , "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$customer_id", "$$customer_id"] }, { "$eq": ["$rated_by", 2] }] } } }],
                    "as": "rating"
                }
            },
            {
                "$lookup": {
                    "from": "salonPackages", "let": { "package_id": "$cart.package_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$package_id"] }] } } },
                        { "$unwind": "$services" },
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
                                "let": { "service": "$services.service_id", "service_for": "$services.service_for", "salon_id": "$salon_id" },
                                "pipeline": [
                                    {
                                        "$match": {
                                            "$expr": {
                                                "$and": [
                                                    { "$eq": ['$salon_id', '$$salon_id'] },
                                                    { "$ne": ["$status", 0] },
                                                    { "$eq": ["$service_id", "$$service"] }, { "$eq": ["$service_for", "$$service_for"] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                "as": "salonServices"
                            }
                        },
                        { "$unwind": "$salonServices" },
                        { "$unwind": "$servicesDetails" },
                        {
                            "$lookup": {
                                "from": "category",
                                "let": { "categoryId": "$servicesDetails.category_id" },
                                "pipeline": [
                                    {
                                        "$match": {
                                            "$expr": {
                                                "$and": [
                                                    { "$eq": ["$_id", "$$categoryId"] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                "as": "categoryDetails"
                            }
                        },
                        { "$unwind": "$categoryDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "services_details": {
                                    "$push": {
                                        "service_name": "$servicesDetails.service_name." + languagesCode,
                                        "service_cost": "$salonServices.service_cost",
                                        "service_for": "$services.service_for",
                                        "service_time": "$salonServices.service_time",
                                        "category_name": "$categoryDetails.category_name." + languagesCode
                                    }
                                },
                                "package_name": { "$first": "$package_name" },
                                "package_for": { "$first": "$package_for" },
                                "total_service_time": { "$sum": "$salonServices.service_time" },
                                "total_service_cost": { "$sum": "$salonServices.service_cost" },
                                "package_amount": { "$first": "$package_amount" }
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
            { "$unwind": { "path": "$salonPackages", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": "$_id", "cart": { "$push": "$cart" }, "status": { "$first": "$status" },
                    "customer": {
                        "$first": {
                            "profile_pic": { "$ifNull": ["$customerDetails.profile_pic", ''] },
                            "totalrating": {
                                "$ifNull": [{
                                    '$divide': [{
                                        '$trunc': {
                                            '$add': [
                                                { '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5]
                                        }
                                    }, 10]
                                }, 0]
                            },
                            "totalreview": { "$ifNull": [{ "$size": "$rating" }, 0] },
                            "location": "$vendorDetails.location.location",
                            "customer_id": "$customerDetails._id",
                            "tm_user_id": { "$ifNull": ["$customerDetails.tm_user_id", 0] },
                            "mobile": { "$concat": ["$customerDetails.mobile", " ", "$customerDetails.mobile_country"] },
                            'friend_name': '$cart.friend_details.friend_name',
                            'friend_mobile': '$cart.friend_details.friend_mobile',
                            "latitude": "$latitude", "longitude": "$longitude"
                            , "created_at": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } },
                            "address": "$address",
                            "name": { "$concat": ["$customerDetails.first_name." + languagesCode, "  ", "$customerDetails.last_name." + languagesCode] }
                        }
                    }, "payment_type": { "$first": "$payment_type" }, "currency": {
                        "$first": {
                            "currency_code": "$customer_country_details.currency_code",
                            "currency": "$customer_country_details.currency_symbol"
                        }
                    },
                    "net_amount": { "$first": "$net_amount" },
                    "pacakage_details": { "$first": "$salonPackages" },
                    "cart_for": { "$first": { "$ifNull": ["$cart.cart_for", 1] } },
                    "coupon": {
                        "$first": {
                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                            "coupon_code": { "$ifNull": ['$coupon', ''] },
                            "up_to_amount": { "$ifNull": ["$up_to_amount", '$coupon_amount'] },
                            "type": { "$ifNull": ["$coupon_amount_type", 0] }
                        }
                    },
                    "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } },
                    "booking_for": { "$first": { "$ifNull": ['$cart.cart_for', 1] } },
                    "is_package": { "$first": "$cart.is_package" },
                    "type": { "$first": "$type" },
                    "salon_id": { "$first": "$salon_id" },
                    "cancellation_type": { "$first": "$cancell_type" },
                    "booking_id": { "$first": "$_id" },
                    "service_time": { "$first": { "$ifNull": ['$service_time', 0] } },
                    "fixed_date": { "$first": "$date" },
                    "fixed_time": { "$first": "$time" },
                    "booking_type": { "$first": "$type" },
                    "coupon_details": { "$first": "$coupon_details" },
                    "cancellation_value": { "$first": { "$ifNull": ["$cancellation_amount", 0] } }
                }
            },

            {
                "$lookup": {
                    "from": "salon", "let": { "salon_id": "$salon_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$salon_id"] }] } } }], "as": "salonDetails"
                }
            },
            { "$unwind": "$salonDetails" },
            {
                "$project": {
                    "_id": "$_id", "cart": "$cart",
                    "fixed_date": { "$ifNull": ["$fixed_date", ''] },
                    "fixed_time": { "$ifNull": ["$fixed_time", ''] },
                    "customer": "$customer",
                    "payment_type": { '$ifNull': ["$payment_type", 1] },
                    // "coupon":"$coupon",
                    "booking_type": { "$ifNull": ["$booking_type", 1] },
                    "salon_name": { "$ifNull": ["$salonDetails.salon_name." + languagesCode, ""] },
                    "mr_miss_fee": { "$ifNull": ["$mr_miss_fee", 0] },
                    "service_time": "$service_time",
                    "cancellation_value": "$cancellation_value",
                    "cart_for": "$cart_for",
                    "is_package": "$is_package",
                    "net_amount": "$net_amount",
                    "cancellation_type": { "$ifNull": ["$cancellation_type", 0] },
                    "pacakage_details": { "$ifNull": ["$pacakage_details", {}] },
                    "coupon_details": { "$ifNull": ["$coupon_details", {}] },
                    "booking_id": "$_id", "booking_status": "$status",
                    "currency": "$currency"
                }
            }
            ], function (err, response) {

                return callback(response);
            })
    }, checkBookingVendorStatus: function (bookingId, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        db.bookings.aggregate([{ "$match": { "_id": booking } },
        {
            "$lookup": {
                "from": "stylist", "let": { "vendor_id": "$vendor_id" },
                "pipeline": [{
                    "$match": {
                        "$expr": {
                            "$and": [
                                { "$eq": ["$vendor_id", "$$vendor_id"] },
                                { "$eq": ["$agent_status", 1] },
                                { "$eq": ["$manager_status", 1] },
                                { "$eq": ["$available_status", 1] },
                                { "$eq": ["$booking_status", 1] }
                            ]
                        }
                    }
                }
                ]
                , "as": "stylistDetails"
            }
        },
        { "$unwind": "$stylistDetails" },
        {
            "$lookup": {
                "from": 'vendor', "let": { "vendor_id": "$vendor_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$_id"] }] } } }],
                "as": "vendorDetails"
            }
        },
        { "$unwind": "$vendorDetails" }

        ], function (err, response) {
            return callback(response);
        });
    }, checkVendorStatus: function (vendorId, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);


        db.stylist.aggregate([{
            "$match": {
                "$expr": {
                    "$and": [
                        { "$eq": ["$vendor_id", vendor] },
                        { "$eq": ["$agent_status", 1] },
                        { "$eq": ["$manager_status", 1] },
                        { "$eq": ["$available_status", 1] },
                        { "$eq": ["$booking_status", 1] }
                    ]
                }
            }
        }, {
            "$lookup": {
                "from": 'vendor', "let": { "vendor_id": "$vendor_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$_id"] }] } } }],
                "as": "vendorDetails"
            }
        },
        { "$unwind": "$vendorDetails" }
        ], function (err, response) {

            return callback(response);
        });
    }, updateMany: function (data, where, callback) {

        db.bookings.update(where,
            { "$set": data }, { multi: true }, function (err, response) {

                return callback(response);
            });
    }, updateWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.bookings.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, updateWithPromisesBooking: function (data, where) {
        return new Promise(function (resolve) {
            db.bookings.findOneAndUpdate(where, { $inc: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, updateManyWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.bookings.update(where, { $set: data }, { multi: true }, function (err, response) {

                resolve(response);

            });
        });
    }
    , getSalonBookingCustomerDetails: function (bookingId, languageCode, callback) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        db.bookings.aggregate([{ "$match": { "_id": booking } },
        { "$unwind": "$cart_id" },
        {
            "$lookup": {
                "from": "cart", "let": { "cart_id": "$cart_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } }], "as": "cartDetails"
            }
        }
            , { "$unwind": "$cartDetails" },
        {
            "$lookup": {
                "from": "services", "let": { "service_id": "$cartDetails.service_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } }], "as": "serviceDetails"
            }
        },
        { "$unwind": "$serviceDetails" },
        {
            "$lookup": {
                "from": "category", "let": { "category_id": "$serviceDetails.category_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$category_id", "$_id"] }] } } }], "as": "categoryDetails"
            }
        },
        { "$unwind": "$categoryDetails" },
        {
            "$lookup": {
                "from": "salon", "let": { "salon_id": "$salon_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$_id"] }] } } }], "as": "salonDetails"
            }
        },
        { "$unwind": "$salonDetails" },
        {
            "$lookup": {
                "from": "salonPictures", "let": { "salon_id": "$salon_id" }, "pipeline":
                    [{ "$match": { "$expr": { "$and": [{ "$eq": ["$salon_id", "$$salon_id"] }] } } }, {
                        "$group": {
                            "_id": "$salon_id",
                            "file_path": { "$push": "$file_path" }
                        }
                    },

                    { "$project": { "_id": 0 } }], "as": "salonPitures"
            }
        },
        {
            "$lookup": {
                "from": "rating", "let": { "salon_id": "$salon_id" }, 'pipeline':
                    [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }, { "$eq": ["$rated_by", 1] }] } } }],
                "as": "rating"
            }
        },
        { "$lookup": { "from": "vendor", "localField": "salonDetails.vendor_id", "foreignField": "_id", "as": "vendorDetails" } },
        { "$unwind": "$vendorDetails" },
        { "$lookup": { "from": "salonEmployees", "let": { "employee_id": "$employee_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$employee_id", "$_id"] }] } } }], "as": "salonEmpolyeeDetails" } },
        {
            "$unwind": {
                "path": "$salonEmpolyeeDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$unwind": {
                "path": "$salonPitures",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$lookup": {
                "from": "orders", "let": { "booking_id": "$_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$in": ["$$booking_id", "$booking_id"] }] } } },
                { "$unwind": "$booking_id" },
                {
                    "$lookup": {
                        "from": "bookings", "let": { "booking": "$booking_id" }, "pipeline":
                            [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$booking"] }] } } }], "as": "bookingDetails"
                    }
                },
                { "$unwind": "$bookingDetails" },
                { "$group": { "_id": "$_id", "booking_total": { "$sum": "$bookingDetails.net_amount" }, "booking_count": { "$sum": 1 } } }
                ],
                "as": "orderTotal"
            }
        },
        { "$unwind": "$orderTotal" },
        {
            "$project": {
                "assined_date": { "$ifNull": ["$date", ''] },
                "assined_time": { "$ifNull": ["$time", ''] },
                "cart": {
                    "service_name": "$serviceDetails.service_name." + languageCode,
                    "category_name": "$categoryDetails.category_name." + languageCode,
                    "selected_for": "$cartDetails.selected_for",
                    "price": "$cartDetails.price",
                    "quantity": "$cartDetails.quantity",
                    "duration": { "$ifNull": ["$cartDetails.duration", 20] }
                },
                'payment_type': { "$ifNull": ['$payment_type', 1] },
                'payment_details': { "$ifNull": ['$payment_details.payment', {}] },
                'order_total': "$orderTotal.booking_total",
                "orders": "$orderTotal.booking_count",
                "full_date": {
                    "date": { "$ifNull": ["$date", "$cartDetails.date"] },
                    "time": { "$ifNull": ["$time", "$cartDetails.time"] },
                    "split_time": {
                        "$cond": [{ "$eq": ["$cartDetails.time_type", 1] }, { "$split": [{ "$ifNull": ["$time", "$cartDetails.time"] }, '-'] },
                        { "$split": [{ "$ifNull": ["$time", "$cartDetails.time"] }, '-'] }]
                    },
                    "time_zone": "$time_zone"
                },
                "coupon": {
                    "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                    "coupon_code": { "$ifNull": ['$coupon', ''] },
                    "up_to_amount": { "$ifNull": ["$up_to_amount", '$coupon_amount'] },
                    "type": { "$ifNull": ["$coupon_amount_type", 0] }
                },
                "salonDetails": {
                    "salon_name": "$salonDetails.salon_name." + languageCode,
                    "salon_id": "$salonDetails._id",
                    "salon_number": { "$ifNull": ["$salonDetails.phone", ''] },
                    "address": "$salonDetails.location",
                    "salon_pictures": "$salonPitures.file_path",
                    "totalrating": {
                        "$ifNull": [{
                            '$divide':
                                [{ '$trunc': { '$add': [{ '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5] } }, 10]
                        }, 0]
                    },
                    "totalreviews": { "$size": "$rating" },
                    "latitude": "$salonDetails.latitude",
                    "longitude": "$salonDetails.longitude",
                    "tm_user_id": { "$ifNull": ["$salonDetails.tm_user_id", 0] },
                    "vendor_id": { "$ifNull": ["$vendorDetails._id", 0] }
                },
                'cancel': {
                    "$ifNull": [{
                        "cancell_type": "$cancell_type",
                        "cancell_type_value": "$cancellation_amount", "cancellation_pay_status": "$cancellation_pay_status"
                    }, {}]
                },
                "status": "$status",
                "type": "$type",
                "booking_code": { "$concat": ["#BST-", { $substr: ["$booking_inc_id", 0, -1] }] },
                "booked_date": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } },
                "coupon_details": { "$ifNull": ["$coupon_details", {}] },
                "employee_name": { "$ifNull": [{ "$concat": ["$salonEmpolyeeDetails.employee_first_name." + languageCode, " ", "$salonEmpolyeeDetails.employee_last_name." + languageCode] }, ''] },
                "employee_id": { "$ifNull": ["$salonEmpolyeeDetails._id", ''] },
                "currency": {
                    "currency": { "$ifNull": ["$customer_country_details.currency_symbol", "₹"] },
                    "currency_code": { "$ifNull": ["$customer_country_details.currency_code", "INR"] }
                },
                "time_type": { "$ifNull": ["$cartDetails.time_type", 1] },
                "profile_pic": { "$ifNull": ["$salonEmpolyeeDetails.profile_pic", ''] }
            }
        },
        {
            "$project": {
                "assign_date":
                {
                    "$cond": [{ "$eq": ["$type", 2] },
                    {
                        "$dateToString": {
                            format: "%Y-%m-%d %H:%M", "date": {
                                $dateFromString: {
                                    dateString:
                                    {
                                        "$concat": ["$full_date.date", ' ',
                                            { $arrayElemAt: ["$full_date.split_time", 0] }]
                                    }, timezone: "$full_date.time_zone"
                                }
                            }
                        }
                    },
                    { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } }]
                },
                "end_date": {
                    "$ifNull": [
                        {
                            "$cond": [{ "$eq": ["$type", 2] },
                            {
                                "$dateToString": {
                                    format: "%Y-%m-%d %H:%M", "date": {
                                        $dateFromString: {
                                            dateString:
                                            {
                                                "$concat": ["$full_date.date", ' ',
                                                    {
                                                        "$cond": [{ "$eq": ["$time_type", 2] }, { $arrayElemAt: ["$full_date.split_time", 0] },
                                                        { $arrayElemAt: ["$full_date.split_time", 1] }]
                                                    }
                                                ]
                                            }, timezone: "$full_date.time_zone"
                                        }
                                    }
                                }
                            },
                            { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } }
                            ]
                        }, '']
                },
                "cart": "$cart",
                "payment_details": "$payment_details",
                "payment_type": "$payment_type",
                "coupon": "$coupon",
                "coupon_details": "$coupon_details",
                "salonDetails": "$salonDetails",
                'cancel': "$cancel",
                "status": "$status",
                'orders': "$orders",
                'order_total': "$order_total",
                "booking_code": "$booking_code",
                "booked_date": "$booked_date",
                "employee_name": "$employee_name",
                "employee_id": "$employee_id",
                "currency": "$currency",
                "profile_pic": "$profile_pic"
            }
        }
        ], function (err, response) {

            return callback(response);
        });
    },
    getEmployeeTimeSlotDetails: function (employeeId, startTime, endTime, date, callback) {
        var employee = new mongoose.Types.ObjectId(employeeId);
        /*var d = new Date(date);
        var n = d.toISOString();*/
        db.bookings.aggregate([{
            "$match": {
                "employee_id": employee, "booking_started": { '$gte': date },
                "booking_ended": { '$lt': date }
            }
        }],
            function (err, response) {
                return callback(response);
            });
    }, stylistBookingList: function (vendorId, startDate, endDate, limit, offset, languageCode, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);

        db.bookings.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },
                        { $gte: ["$created", new Date(startDate)] }, { $lte: ["$created", new Date(endDate)] }]
                    }
                }
            },
            { "$skip": parseInt(offset) },
            { "$limit": parseInt(limit) },
            {
                "$lookup": {
                    "from": "customers", "let": { "customer_id": "$customer_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$customer_id", "$_id"] }] } } }],
                    "as": "customerDetails"
                }
            },

            { "$unwind": "$customerDetails" },
            {
                "$project": {
                    "_id": 0, "booking_id": "$_id",
                    "surge": { "$ifNull": ["$surge", 0] },
                    "customer": {
                        "profile_pic": { "$ifNull": ["$customerDetails.profile_pic", ''] },
                        "customer_id": "$customerDetails._id",
                        "mobile": "$customerDetails.mobile",
                        "latitude": "$latitude", "longitude": "$longitude",
                        "name": { "$concat": ["$customerDetails.first_name." + languageCode, "  ", "$customerDetails.last_name." + languageCode] }
                    },
                    "status": "$status",
                    "created": 1,
                    "date": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } },
                    "mr_miss_fee": { "$ifNull": ["$booking_percentage", 0] },
                    "net_amount": "$net_amount",
                    "cancell_fee": { "$ifNull": ["$cancellation_amount", 0] },
                    "address": "$address"
                }
            }, { "$sort": { "created": -1 } }
        ], function (err, response) {

            return callback(response);
        });
    },
    salonBookingList: function (startDate, endDate, limit, offset, salonId, employeeId, languagesCode, callback) {

        /* var salon=new mongoose.Types.ObjectId(salonId);
         var bookingCondition={"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]},{"$eq":["$status",8]},
                         {"$eq":["$is_package",0]}]}}};
         var bookingPacakgeConditon={"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]},{"$eq":["$status",8]},{"$eq":["$is_package",1]}]}}};
         var salonCondition={"$match":{"salon_id":salon}};
         var bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3}};

         if(employeeId!="")
         {
             var employee=new mongoose.Types.ObjectId(employeeId);
             bookingCondition={"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]},{"$eq":["$status",8]},
                             {"$eq":["$employee_id",employee]},{"$eq":["$is_package",0]}]}}};
              bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3,"employee_id":employee}};

             bookingPacakgeConditon={"$match":{"$expr":{"$and":[{"$eq":["$$booking_id","$_id"]},{"$eq":["$status",8]},
                             {"$eq":["$employee_id",employee]},{"$eq":["$is_package",1]}]}}};
         }*/
        var salon = new mongoose.Types.ObjectId(salonId);
        var bookingCondition = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 0] }]
                }
            }
        };
        var bookingServeOutConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$stylist_type', 3] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    }]
                }
            }
        };

        //var bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3}};
        var bookingPacakgeConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 1] }]
                }
            }
        };
        var salonCondition = { "$match": { "salon_id": salon } };

        if (employeeId != '') {

            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingCondition = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 0] }]
                    }
                }
            };

            bookingServeOutConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$employee_id', employee] }, { "$eq": ['$stylist_type', 3] },
                        {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        }
                        ]
                    }
                }
            };

            //bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3,'employee_id':employee}};

            bookingPacakgeConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 1] }]
                    }
                }
            };
        }


        db.orders.aggregate([
            salonCondition,
            { "$lookup": { "from": "salon", "localField": "salon_id", "foreignField": "_id", "as": "salonDetails" } },
            { "$unwind": "$salonDetails" },
            {
                "$facet": {
                    "bookings": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id",
                                    "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingCondition,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone"
                                                }
                                            },
                                            "salon_id": "$salon_id", "timezone": "$time_zone", "net_amount": "$net_amount",
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id",
                                            "customer_id": "$customer_id",
                                            'is_package': "$is_package", "cancellation_amount": "$cancellation_amount",
                                            "status": "$status",
                                            "type": { "$ifNull": ["$stylist_type", 2] },
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "services" } },
                                { "$unwind": "$services" },
                                { "$project": { "service_name": "$services.service_name." + languagesCode } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "type": { "$first": "$type" },
                                "status": { "$first": "$status" },
                                "cancellation_amount": { "$first": "$cancellation_amount" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "address": { "$first": "$address" }
                            }
                        }],
                    "serveOutBookings": [
                        {
                            $bucketAuto: {
                                groupBy: "$created_at",
                                buckets: 1
                            }
                        },
                        { "$lookup": { "from": "salon", "pipeline": [{ "$match": { "_id": salon } }], "as": "salonDetails" } },
                        { "$unwind": "$salonDetails" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id", "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingServeOutConditon,
                                    {
                                        "$project": {
                                            "created": { $dateFromString: { dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone" } },
                                            "salon_id": "$salon_id",
                                            "timezone": "$time_zone",
                                            "net_amount": { "$multiply": ["$net_amount", "$surge"] },
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id", "cancellation_amount": "$cancellation_amount",
                                            "customer_id": "$customer_id",
                                            'is_package': "$is_package",
                                            "status": "$status",
                                            "type": { "$ifNull": ["$stylist_type", 2] },
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "services" } },
                                { "$unwind": "$services" },
                                { "$project": { "service_name": "$services.service_name." + languagesCode } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "type": { "$first": "$type" },
                                "status": { "$first": "$status" },
                                "cancellation_amount": { "$first": "$cancellation_amount" },
                                "address": { "$first": "$address" }
                            }
                        }],
                    "packages": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id",
                                    "order_inc_id": "$order_inc_id",
                                    "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingPacakgeConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            },
                                            "salon_id": "$salon_id", "timezone": "$time_zone", "net_amount": "$net_amount",
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id",
                                            "customer_id": "$customer_id",
                                            "order_inc_id": "$$order_inc_id",
                                            'is_package': "$is_package",
                                            "status": "$status",
                                            "type": { "$ifNull": ["$stylist_type", 2] },
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "cancellation_amount": "$cancellation_amount",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { "$group": { "_id": "$_id", "bookingDetails": { "$first": "$bookingDetails" } } },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "salonPackages", "localField": "package_id", "foreignField": "_id", "as": "packageDetails" } },
                                { "$unwind": "$packageDetails" },
                                { "$project": { "service_name": "$packageDetails.package_name" } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "status": { "$first": "$status" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "address": { "$first": "$address" },
                                "cancellation_amount": { "$first": "$cancellation_amount" },
                                "type": { "$first": "$type" },
                            }
                        }
                    ]
                }
            },
            { $project: { items: { $concatArrays: ["$bookings", "$packages", "$serveOutBookings"] } } },
            { "$unwind": "$items" },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            { "$skip": parseInt(offset) },
            { "$limit": parseInt(limit) },
        ], function (err, response) {

            return callback(response);
        });
    }, salonBookingCount: function (startDate, endDate, salonId, employeeId, languagesCode, callback) {
        var salon = new mongoose.Types.ObjectId(salonId);
        var bookingCondition = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 0] }]
                }
            }
        };
        var bookingServeOutConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$stylist_type', 3] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    }]
                }
            }
        };

        //var bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3}};
        var bookingPacakgeConditon = {
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                        '$or': [{ "$eq": ["$status", 8] },
                        { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                    },
                    { "$eq": ["$is_package", 1] }]
                }
            }
        };
        var salonCondition = { "$match": { "salon_id": salon } };

        if (employeeId != '') {
            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingCondition = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 0] }]
                    }
                }
            };

            bookingServeOutConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$salon_id", salon] }, { "$eq": ['$employee_id', employee] }, { "$eq": ['$stylist_type', 3] },
                        {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        }
                        ]
                    }
                }
            };
            //bookingServeOutConditon={"$match":{"salon_id":salon,"status":8,"stylist_type":3,'employee_id':employee}};

            bookingPacakgeConditon = {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$$booking_id", "$_id"] }, {
                            '$or': [{ "$eq": ["$status", 8] },
                            { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }]
                        },
                        { "$eq": ["$employee_id", employee] }, { "$eq": ["$is_package", 1] }]
                    }
                }
            };
        }

        db.orders.aggregate([
            salonCondition,
            { "$lookup": { "from": "salon", "localField": "salon_id", "foreignField": "_id", "as": "salonDetails" } },
            { "$unwind": "$salonDetails" },
            {
                "$facet": {
                    "bookings": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id",
                                    "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingCondition,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone"
                                                }
                                            },
                                            "salon_id": "$salon_id", "timezone": "$time_zone", "net_amount": "$net_amount",
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id",
                                            "customer_id": "$customer_id",
                                            'is_package': "$is_package",
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "services" } },
                                { "$unwind": "$services" },
                                { "$project": { "service_name": "$services.service_name." + languagesCode } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "address": { "$first": "$address" }
                            }
                        }],
                    "serveOutBookings": [
                        {
                            $bucketAuto: {
                                groupBy: "$created_at",
                                buckets: 1
                            }
                        },
                        { "$lookup": { "from": "salon", "pipeline": [{ "$match": { "_id": salon } }], "as": "salonDetails" } },
                        { "$unwind": "$salonDetails" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id", "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingServeOutConditon,
                                    {
                                        "$project": {
                                            "created": { $dateFromString: { dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone" } },
                                            "salon_id": "$salon_id",
                                            "timezone": "$time_zone",
                                            "net_amount": "$net_amount",
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id",
                                            "customer_id": "$customer_id",
                                            'is_package': "$is_package",
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "services" } },
                                { "$unwind": "$services" },
                                { "$project": { "service_name": "$services.service_name." + languagesCode } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "address": { "$first": "$address" }
                            }
                        }],
                    "packages": [
                        { "$unwind": "$booking_id" },
                        {
                            "$lookup": {
                                "from": "bookings", "let": {
                                    "booking_id": "$booking_id",
                                    "order_inc_id": "$order_inc_id",
                                    "salon_name": "$salonDetails.salon_name." + languagesCode
                                },
                                "pipeline": [
                                    bookingPacakgeConditon,
                                    {
                                        "$project": {
                                            "created": {
                                                $dateFromString: {
                                                    dateString: { "$concat": ["$date", ' ', "$time"] },
                                                    timezone: "$time_zone"
                                                }
                                            },
                                            "salon_id": "$salon_id", "timezone": "$time_zone", "net_amount": "$net_amount",
                                            "salon_name": "$$salon_name",
                                            "cart_id": "$cart_id",
                                            "customer_id": "$customer_id",
                                            "order_inc_id": "$$order_inc_id",
                                            'is_package': "$is_package",
                                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                            "coupon_details": "$coupon_details",
                                            "booking_percentage": "$booking_percentage"
                                        }
                                    },
                                    {
                                        "$match": {
                                            "created": {
                                                $gte: new Date(startDate),
                                                $lt: new Date(endDate)
                                            }
                                        }
                                    }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { "$group": { "_id": "$_id", "bookingDetails": { "$first": "$bookingDetails" } } },
                        { $replaceRoot: { newRoot: '$bookingDetails' } },
                        { "$unwind": "$cart_id" },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                { "$lookup": { "from": "salonPackages", "localField": "package_id", "foreignField": "_id", "as": "packageDetails" } },
                                { "$unwind": "$packageDetails" },
                                { "$project": { "service_name": "$packageDetails.package_name" } }
                                ],
                                "as": "serviceDetails"
                            }
                        },
                        { "$unwind": "$serviceDetails" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "booking_id": { "$first": "$_id" },
                                "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                                "coupon_amount": { "$first": "$coupon_amount" },
                                "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                                "salon_name": { "$first": "$salon_name" },
                                "service_name": { "$first": "$serviceDetails.service_name" },
                                "customer_name": { "$first": { "$concat": ["$customerDetails.first_name." + languagesCode, ' ', "$customerDetails.last_name." + languagesCode] } },
                                "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                                "coupon_details": { "$first": "$coupon_details" },
                                "net_amount": {
                                    "$first": {
                                        "$subtract": [{
                                            "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                            { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                        }
                                            , { "$ifNull": ["$booking_percentage", 0] }]
                                    }
                                },
                                "address": { "$first": "$address" }
                            }
                        }]
                }
            },
            { $project: { items: { $concatArrays: ["$bookings", "$packages", "$serveOutBookings"] } } },
            { "$unwind": "$items" },
            {
                "$replaceRoot": {
                    "newRoot": "$items"
                }
            },
            {
                $count: "bookings_count"
            }
        ], function (err, response) {
            console.log(err);
            return callback(response);
        });
    }, salonBookingListPackage: function (vendorId, startDate, endDate, limit, offset, salonId, employeeId, callback) {

        var vendor = new mongoose.Types.ObjectId(vendorId);

        var salonCondition = { "$match": { "vendor_id": vendor } };
        if (salonId != '') {
            var salon = new mongoose.Types.ObjectId(salonId);
            salonCondition = { "$match": { "_id": salon } };
        }

        var bookingCondition = { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }, { "$eq": ["$status", 8] }] } } };

        if (employeeId != '') {
            var employee = new mongoose.Types.ObjectId(employeeId);
            bookingCondition = { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }, { "$eq": ["$status", 8] }, { "$eq": ["$employee_id", employee] }] } } }
        }

        db.salon.aggregate([
            salonCondition,
            { "$lookup": { "from": "orders", "localField": "salon_id", "foreignField": "salon_id", "as": "orderDetails" } },
            { "$unwind": "$ordeDetails" },
            {
                "$lookup": {
                    "from": "bookings", "let": { "salon_id": "$_id", "salon_name": "$salon_name", "booking_id": "$orderDetails.booking_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$$booking_id", "$_id"] }, { "$eq": ["$status", 8] }] } } },
                        {
                            "$project": {
                                "created": { $dateFromString: { dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone" } },
                                "salon_id": "$salon_id", "timezone": "$time_zone", "net_amount": "$net_amount",
                                "salon_name": "$$salon_name",
                                "cart_id": "$cart_id",
                                "customer_id": "$customer_id",
                                "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                                "coupon_details": "$coupon_details",

                                "booking_percentage": "$booking_percentage"
                            }
                        },
                        {
                            "$match": {
                                "created": {
                                    $gte: new Date(startDate),
                                    $lt: new Date(endDate)
                                }
                            }
                        }
                    ], "as": "bookingDetails"
                }
            },
            { "$unwind": "$bookingDetails" },
            { "$group": { "_id": "$orderDetails.booking_id", "bookingDetails": { "$first": "$bookingDetails" } } },
            { "$unwind": "$bookingDetails" },
            { $replaceRoot: { newRoot: '$bookingDetails' } },
            { "$skip": parseInt(offset) },
            { "$limit": parseInt(limit) },
            { "$unwind": "$cart_id" },
            { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
            { "$unwind": "$customerDetails" },
            {
                "$lookup": {
                    "from": "cart", "let": { "cart_id": "$cart_id" },
                    "pipeline": [
                        {
                            "$lookup": {
                                "from": "salonPackages", "let": { "salon_id": "$_id", "package_id": "$package_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$salon_id", "$$salon_id"] }, { "$eq": ["$_id", "$$package_id"] }] } } }, { "$unwind": "$services" },
                                { "$lookup": { "from": "services", "localField": "services.service_id", "foreignField": "_id", "as": "servicesDetails" } },
                                {
                                    "$lookup": {
                                        "from": "salonServices", "let": {
                                            "service": "$services.service_id",
                                            "service_for": "$services.service_for",
                                            "salon_id": "$salon_id"
                                        },
                                        "pipeline": [
                                            {
                                                "$match": {
                                                    "$expr": {
                                                        "$and": [
                                                            { "$eq": ["$service_id", "$$service"] },
                                                            { "$eq": ["$salon_id", "$$salon_id"] },
                                                            { "$eq": ["$service_for", "$$service_for"] },
                                                            { "$ne": ["$status", 0] }
                                                        ]
                                                    }
                                                }
                                            }],
                                        "as": "salonServices"
                                    }
                                },
                                { "$unwind": "$salonServices" },
                                { "$unwind": "$servicesDetails" },
                                {
                                    "$group": {
                                        "_id": "$_id", "services_details": {
                                            "$push": {
                                                "service_name": "$servicesDetails.service_name.en",
                                                "service_cost": "$salonServices.service_cost",
                                                "service_for": "$services.service_for",
                                                "service_time": "$salonServices.service_time"
                                            }
                                        },
                                        "package_name": { "$first": "$package_name" },
                                        "package_for": { "$first": "$package_for" },
                                        "total_service_time": { "$sum": "$salonServices.service_time" },
                                        "total_service_cost": { "$sum": "$salonServices.service_cost" },
                                        "package_amount": { "$first": "$package_amount" }
                                    }
                                },

                                {
                                    "$project": {
                                        "_id": 0
                                        , "package_id": "$_id", "service_details": "$services_details", "package_amount": "$package_amount",
                                        "package_name": "$package_name", "package_for": "$package_for", "total_service_cost": "$total_service_cost",
                                        "total_service_time": "$total_service_time"
                                    }
                                }
                                ],
                                "as": "salonPackages"
                            }
                        },
                    ],
                    "as": "serviceDetails"
                }
            },
            { "$unwind": "$serviceDetails" },
            { "$unwind": "$serviceDetails.salonPackages" },
            {
                "$group": {
                    "_id": "$_id",
                    "booking_id": { "$first": "$_id" },
                    "surge": { "$first": { "$ifNull": ["$surge", 0] } },
                    'package_details': "$serviceDetails.salonPackages",
                    "coupon_amount": { "$first": "$coupon_amount" },
                    "date": { "$first": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created", "timezone": "$timezone" } } },
                    "salon_name": { "$first": "$salon_name" },
                    "service_name": { "$first": "$serviceDetails.service_name" },
                    "customer_name": { "$first": { "$concat": ["$customerDetails.first_name", ' ', "$customerDetails.last_name"] } },
                    "profile_pic": { "$first": { "$ifNull": ["$customerDetails.profile_pic", ''] } },
                    "coupon_details": { "$first": "$coupon_details" },
                    "net_amount": {
                        "$first": {
                            "$subtract": [{
                                "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                            }
                                , { "$ifNull": ["$booking_percentage", 0] }]
                        }
                    },
                    "address": { "$first": "$address" }
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, getDateTime: function (bookingId) {
        var booking = new mongoose.Types.ObjectId(bookingId);
        return new Promise(function (resolve) {
            db.bookings.aggregate([
                { "$match": { "_id": booking } },
                { "$unwind": "$cart_id" },
                { "$lookup": { "from": "cart", "localField": "cart_id", "foreignField": "_id", "as": "cartDetails" } },
                { "$unwind": "$cartDetails" },
                { "$project": { "date": "$cartDetails.date", "time": "$cartDetails.time" } }
            ], function (err, response) {
                return resolve(response);
            });
        });
    }, getStylistCancellationDetails: function (bookingId) {
        return new Promise(function (resolve) {

            var booking = new mongoose.Types.ObjectId(bookingId);
            db.bookings.aggregate([
                { "$match": { "_id": booking } },
                {
                    "$lookup": {
                        "from": "cancellationPolicy", "let": { "city_id": "$customer_country_details.city_id" },
                        "pipeline": [{
                            "$match": {
                                "$expr": { "$and": [{ "$eq": ["$city_id", "$$city_id"] }] },
                                "$or": [{ "cancellation_policy.4": { "$exists": true } }, { "cancellation_policy.3": { "$exists": true } }]
                            }
                        }]
                        , "as": "cancellationDetails"
                    }
                },
                { "$unwind": "$cancellationDetails" },
                {
                    "$project": {
                        "net_amount": 1,
                        "surge" : 1,
                        "policy_for_acceptance": "$cancellationDetails.cancellation_policy.3",
                        "policy_for_arrival": "$cancellationDetails.cancellation_policy.4",
                        "created": "$created",
                        "is_notified": "$is_notified"
                    }
                }
            ], function (err, response) {

                return resolve(response);
            });
        });
    }, getCancellationPolicyStylit: function (bookingId) {
        return new Promise(function (resolve) {

            var booking = new mongoose.Types.ObjectId(bookingId);
            db.bookings.aggregate([
                { "$match": { "_id": booking } },
                {
                    "$lookup": {
                        "from": "cancellationPolicy", "let": { "city_id": "$customer_country_details.city_id" },
                        "pipeline": [{
                            "$match": {
                                "$expr": { "$and": [{ "$eq": ["$city_id", "$$city_id"] }] },
                                "$or": [{ "cancellation_policy.1": { "$exists": true } }, { "cancellation_policy.2": { "$exists": true } }]
                            }
                        }]
                        , "as": "cancellationDetails"
                    }
                },
                { "$unwind": "$cancellationDetails" },
                {
                    "$project": {
                        "net_amount": 1,
                        "surge" : 1,
                        "policy_for_acceptance": "$cancellationDetails.cancellation_policy.1",
                        "policy_for_arrival": "$cancellationDetails.cancellation_policy.2",
                        "created": "$created",
                        "is_notified": "$is_notified"
                    }
                }
            ], function (err, response) {


                return resolve(response);
            });
        });
    }, getCancellationForSalonDetails: function (bookingId) {
        return new Promise(function (resolve) {

            var booking = new mongoose.Types.ObjectId(bookingId);
            db.bookings.aggregate([
                { "$match": { "_id": booking } },
                {
                    "$lookup": {
                        "from": "cancellationPolicy", "let": { "city_id": "$customer_country_details.city_id" },
                        "pipeline": [{
                            "$match": {
                                "$expr": { "$and": [{ "$eq": ["$city_id", "$$city_id"] }] },
                                "$or": [{ "cancellation_policy.5": { "$exists": true } }, { "cancellation_policy.6": { "$exists": true } }]
                            }
                        }]
                        , "as": "cancellationDetails"
                    }
                },
                { "$unwind": "$cancellationDetails" },
                {
                    "$project": {
                        "policy_for_acceptance": "$cancellationDetails.cancellation_policy.5",
                        "policy_for_arrival": "$cancellationDetails.cancellation_policy.6",
                        "created": "$created",
                        "is_notified": "$is_notified",
                        "date": "$date",
                        "time": "$time",
                        "time_zone": "$time_zone"
                    }
                }
            ], function (err, response) {
                return resolve(response);
            });
        });
    }, getSalonCancellationDetails: function (bookingId) {
        return new Promise(function (resolve) {
            var booking = new mongoose.Types.ObjectId(bookingId);

            db.bookings.aggregate([{ "$match": { "_id": booking } },
            { "$lookup": { "from": "salon", "localField": "salon_id", "foreignField": "_id", "as": "salonDetails" } },
            { "$unwind": "$salonDetails" },
            {
                "$project": {
                    "net_amount": 1,
                    "surge" : 1,
                    "policy_for_acceptance": "$salonDetails.cancellation_policy.1",
                    "policy_for_arrival": "$salonDetails.cancellation_policy.2",
                    "created": "$created",
                    "date": "$date",
                    "time": "$time",
                    "time_zone": "$time_zone",
                    "is_notified": "$is_notified"
                }
            }
            ], function (err, response) {
                console.log(err, response);
                return resolve(response);
            })
        });
    }, getCancellationDetailsBySalon: function (bookingId) {
        return new Promise(function (resolve) {
            var booking = new mongoose.Types.ObjectId(bookingId);

            db.bookings.aggregate([{ "$match": { "_id": booking } },
            { "$lookup": { "from": "salon", "localField": "salon_id", "foreignField": "_id", "as": "salonDetails" } },
            {
                "$lookup": {
                    "from": "cancellationPolicy", "let": { "city_id": "$customer_country_details.city_id" },
                    "pipeline": [{
                        "$match": {
                            "$expr": { "$and": [{ "$eq": ["$city_id", "$$city_id"] }] },
                            "$or": [{ "cancellation_policy.5": { "$exists": true } }, { "cancellation_policy.6": { "$exists": true } }]
                        }
                    }]
                    , "as": "cancellationDetails"
                }
            },
            { "$unwind": "$cancellationDetails" },
            {
                "$project": {
                    "policy_for_acceptance": "$cancellationDetails.cancellation_policy.5",
                    "policy_for_arrival": "$cancellationDetails.cancellation_policy.6",
                    "created": "$created",
                    "date": "$date",
                    "time": "$time",
                    "time_zone": "$time_zone",
                    "is_notified": "$is_notified",
                    "status": "$status"
                }
            }
            ], function (err, response) {

                return resolve(response);
            })
        });
    }, getSalonCusotmers: function (salonId, languagesCode, callback) {
        var salon = new mongoose.Types.ObjectId(salonId);
        db.bookings.aggregate([
            { "$match": { "salon_id": salon, "status": 8 } },
            {
                "$group": {
                    "_id": "$customer_id", "bookings": { "$sum": 1 }, "currency": {
                        "$first": {
                            "currency_code": "$customer_country_details.currency_code",
                            "currency_symbol": "$customer_country_details.currency_symbol"
                        }
                    },
                    "booking_amount": { "$sum": "$net_amount" }, "date": { "$max": "$date" }
                }
            },
            {
                "$lookup": {
                    "from": "customers", "let": { "customer_id": "$_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$customer_id", "$_id"] }] } } }],
                    "as": "customerDetails"
                }
            },
            { "$unwind": "$customerDetails" },
            {
                "$project": {
                    "customer_name": { "$concat": ["$customerDetails.first_name." + languagesCode, "  ", "$customerDetails.last_name." + languagesCode] },
                    "profile_pic": { "$ifNull": ["$customerDetails.profile_pic", ''] },
                    "nationality": { "$ifNull": ["$customerDetails.nationality.shortCode", 'IND'] },

                    "mobile": { "$concat": ["$customerDetails.mobile_country", '', "$customerDetails.mobile"] },
                    "bookings": "$bookings", "booking_amount": "$booking_amount"
                }
            }], function (err, response) {
                return callback(response);
            });
    }, getStylistWeeklyRating: function (vendorId, startDate, endDate, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([{
            "$match": {
                "vendor_id": vendor, "created": {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            "$lookup": {
                "from": "rating", "let": { "booking_id": "$_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$booking_id", "$$booking_id"] }, { "$eq": ["$rated_by", 1] }] } } }], "as": "ratings"
            }
        },
        { "$unwind": "$ratings" },
        { "$group": { "_id": "$vendor_id", "rating": { "$push": "$ratings" } } },
        {
            "$project": {
                "rating": {
                    "$ifNull": [
                        { '$divide': [{ '$trunc': { '$add': [{ '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5] } }, 10] }, 0]
                }
            }
        }
        ], function (err, response) {
            return callback(response);
        });
    }, checkPromoForCustomer: function (customerId, couponCode, couponScope) {
        return new Promise(function (resolve) {

            var customer = new mongoose.Types.ObjectId(customerId);
            var couponCondition = {
                "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }, { "$eq": ["$status", 7] },
                { "$eq": ["$status", 8] }, { "$eq": ["$status", 10] }]
            };
            if (couponScope == 2) {
                couponCondition = {
                    "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }, { "$eq": ["$status", 7] },
                    { "$eq": ["$status", 10] }]
                }
            }
            db.bookings.aggregate([{
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$customer_id", customer] }, { "$eq": ["$coupon", couponCode] }, couponCondition
                        ]
                    }
                }
            }], function (err, response) {
                return resolve(response);
            })
        });
    }, getcurrentbookings: function (user_id) {
        return db.bookings.find({ $or: [{ status: 2, customer_id: user_id }, { status: 7, customer_id: user_id }] }, { _id: 1, booking_accepted: 1, status: 1, payment_status: 1 }).sort({ _id: 1 }).lean().exec()
    }, getorderdetails: function (bookingId) {
        return db.orders.find({ booking_id: bookingId }).lean().exec()
    }, findbookingdetails: function (data) {
        return db.bookings.find(data, { _id: 1, payment_type: 1 }).lean().exec()



    }, findstylist: function (data,fields) {
        return db.stylist.find(data,fields).lean().exec()


    }, getpendingbookings: function (callback) {
        // return db.bookings.find({status : 2}, { _id: 1, payment_type : 1}).lean().exec()
        db.bookings.aggregate([
            { "$match": { "status": 2 } },
            {
                "$group": {
                    "_id": "$customer_id", "bookings": { "$sum": 1 }, "booking_accepted": { "$first": "$booking_accepted" },
                }


            },

            {
                "$project": {
                    "_id": "$_id",
                    "bookings": "$bookings",
                    "booking_accepted": "$booking_accepted",

                }
            }], function (err, response) {
                console.log(response)

                return callback(response);
            });

    }, userbookings: function (data) {
        return db.bookings.find(data, { _id: 1, status: 1 }).lean().exec()


    }, cancellationAmount: async function (data, cancellValue) {
        if (data.payment_status == 1 && data.payment_type == 2) {
            var onlinepaymentdata = await db.onlinepayment.find({ basketId: data._id }).lean().exec();
            var percentage = (data.cancellation_amount * data.net_amount) * 100;
            if (onlinepaymentdata && onlinepaymentdata.length && onlinepaymentdata[0].basketItems) {
                for (var i = 0; i < onlinepaymentdata[0].basketItems.length; i++) {
                    var amount = onlinepaymentdata[0].basketItems[i].price;
                    cancelamount = ((amount / 100) * percentage).toFixed(2);
                    refundamount = Number(amount) - Number(cancelamount);
                    onlinepaymentdata[0].basketItems[i].cancelamount = cancelamount;
                    onlinepaymentdata[0].basketItems[i].refundamount = refundamount;

                    //    var updateddata = await db.onlinepayment.findOneAndUpdate({ basketId: data._id, basketItems: { $elemMatch: { id: onlinepaymentdata[0].basketItems[i].id } } }, { $set: { "basketItems.$.approve_status": req.body.approve_status } }).lean().exec();
                    if (i == onlinepaymentdata[0].basketItems.length - 1) {
                        // var updateddata = await db.onlinepayment.findOneAndUpdate({ conversationId: req.body.conversationId, basketItems: { $elemMatch: { paymentTransactionId: req.body.paymentTransactionId } } }, { $set: { "basketItems.$.approve_status": req.body.approve_status } }).lean().exec();

                        var updateddata = await db.onlinepayment.update({ basketId: data._id }, { $set: { basketItems: onlinepaymentdata[0].basketItems, cancelby: 1 } }).lean().exec();
                        return;
                    }
                }
            }

        } else {
            var obj = {};
            obj.vendor_id = data.vendor_id;
            obj.booking_id = data.booking_id;
            obj.customer_id = data.customer_id;
            obj.net_amount = data.net_amount;
            obj.cancellation_pay_status = data.cancellation_pay_status;
            obj.cancellation_amount = data.cancellation_amount;
            obj.payment_type = data.payment_type;
            obj.status = data.status;
            obj.paid_status = data.paid_status;
            obj.cancell_reason = data.cancell_reason;
            obj.cancell_reason = data.cancell_reason;
            obj.booking_inc_id = data.booking_inc_id;
            obj.bookingId = data._id;
            obj.surge = data.surge;
            obj.admin_percentage = data.admin_percentage;


            var totalAmount = Number(data.net_amount) * Number(data.surge);
            var izycocommision = ((Number(data.cancellation_amount) * (utility.iyzico_percentage)) / 100 + Number(utility.iyzico_commission)).toFixed(2);
            var amountwithoutizyco = data.cancellation_amount - izycocommision;
            var adminAmount = ((Number(amountwithoutizyco) * Number(data.admin_percentage)) / 100).toFixed(2);
            var vendorAmount = ((Number(amountwithoutizyco) * Number(100 - data.admin_percentage)) / 100).toFixed(2);

            obj.totalAmount = totalAmount;
            obj.izycocommision = izycocommision;
            obj.adminAmount = adminAmount;
            obj.vendorAmount = vendorAmount;



            var cancelamount = new db.cancelamount(obj);

            cancelamount.save(async function (err, response) {


            });
        }






    }, vendorcancellationamount: async function (data) {
        if (data.payment_status == 1 && data.payment_type == 2) {
            var updateddata = await db.onlinepayment.update({ basketId: data._id }, { $set: { cancelby: 2 } }).lean().exec();
            var obj = {};
            obj.vendor_id = data.vendor_id;
            obj.booking_id = data.booking_id;
            obj.customer_id = data.customer_id;
            obj.net_amount = data.net_amount;
            obj.cancellation_pay_status = data.cancellation_pay_status;
            obj.cancellation_amount = data.cancellation_amount;
            obj.payment_type = data.payment_type;
            obj.status = data.status;
            obj.paid_status = data.paid_status;
            obj.cancell_reason = data.cancell_reason;
            obj.cancell_reason = data.cancell_reason;
            obj.booking_inc_id = data.booking_inc_id;
            obj.bookingId = data._id;
            var cancelamount = new db.cancelamount(obj);
            cancelamount.save(async function (err, response) {


            });
            return;
        } else {

            var obj = {};
            obj.vendor_id = data.vendor_id;
            obj.booking_id = data.booking_id;
            obj.customer_id = data.customer_id;
            obj.net_amount = data.net_amount;
            obj.cancellation_pay_status = data.cancellation_pay_status;
            obj.cancellation_amount = data.cancellation_amount;
            obj.payment_type = data.payment_type;
            obj.status = data.status;
            obj.paid_status = data.paid_status;
            obj.cancell_reason = data.cancell_reason;
            obj.cancell_reason = data.cancell_reason;
            obj.booking_inc_id = data.booking_inc_id;
            obj.bookingId = data._id;
            var cancelamount = new db.cancelamount(obj);
            cancelamount.save(async function (err, response) {


            });
        }






    }, getcancellationamount: function (userId) {
        return db.cancelamount.find({ customer_id: userId, status: 4, paid_status: 0 }).lean().exec()


    }


};
