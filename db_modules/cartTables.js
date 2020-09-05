var db = require('../db');
var mongoose = require('mongoose');

module.exports =
{
    "cart_type": { "1": { "cart_type": 1, "message": "stylist cart" }, "2": { "cart_type": 2, "message": "salon cart" } },
    "status": {
        "1": { "status": 1, "message": "cart itmes added" },
        "2": { "status": 2, "message": "cart itmes  booked" }
    }, insertManyWithPromises: function (values) {
        return new Promise(function (resolve) {

            db.cart.insertMany(values, function (err, response) {

                resolve(response);
            });
        });
    },
    removeCoupon: function (data, where) {
        return new Promise(function (resolve) {
            db.cart.update(where, { "$unset": data }, function (err, response) {
                return resolve(response);
            });
        });
    },
    cartValues: function (customerId, languageCode, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);

        db.cart.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$customer_id", userId] },
                        { "$eq": ["$status", 1] }, { "$eq": ["$cart_type", 1] }]
                    }
                }
            },
            {
                "$lookup":
                {
                    "from": "stylist",
                    "localField": "vendor_id",
                    "foreignField": "vendor_id",
                    "as": "stylist"
                }
            },
            {
                "$lookup":
                {
                    "from": "vendor",
                    "localField": "stylist.vendor_id",
                    "foreignField": "_id",
                    "as": "vendorDetails"
                }
            },
            {
                "$lookup": {
                    "from": "vendorLocation",
                    "let": { "vendor_id": "$vendor_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$vendor_id"] }] } } },
                        {
                            "$project":
                            {
                                "vendor_id": "$vendor_id",
                                "latitude": { "$arrayElemAt": ["$location.coordinates", 1] },
                                "longitude": { "$arrayElemAt": ["$location.coordinates", 0] }
                            }
                        },
                        { "$group": { "_id": { "vendor_id": "$vendor_id" }, "vendorDetails": { "$first": "$$ROOT" } } },
                        { $replaceRoot: { newRoot: "$vendorDetails" } }
                    ],
                    "as": "vendorLocation"
                }
            },
            { "$unwind": { "path": "$stylist", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$vendorLocation", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$vendorDetails", "preserveNullAndEmptyArrays": true } },
            {
                '$lookup': {
                    "from": 'subCategory',
                    "localField": 'sub_category_id',
                    "foreignField": '_id',
                    as: 'subCategory'
                }
            },
            {
                '$lookup': {
                    "from": 'services', "let": { "service_id": "$service_id", "city_id": "$city_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$service_id"] }] } } },
                    {
                        "$project": {
                            "_id": "$_id",
                            "service_name": "$service_name",
                            'duration': "$duration",
                            "service_prices": {
                                "$filter": {
                                    "input": "$service_prices",
                                    "as": "prices",
                                    "cond": { "$eq": ['$$prices.city', '$$city_id'] }
                                }
                            }
                        }
                    }], as: 'services'
                }
            },
            { "$lookup": { "from": "category", "localField": "category_id", "foreignField": "_id", "as": "category" } },
            { "$unwind": "$category" },
            { "$unwind": "$services" },
            { "$unwind": "$services.service_prices" },
            {
                '$group': {
                    '1': { '$first': '$services.service_prices.1' },
                    '2': { '$first': '$services.service_prices.2' },
                    '3': { '$first': '$services.service_prices.3' },
                    '4': { '$first': '$services.service_prices.4' },
                    _id: '$_id',
                    service: {
                        '$first': {
                            service_name: { "$ifNull": ['$services.service_name.' + languageCode, ""] },
                            service_id: '$services._id',
                            duration: {
                                $switch:
                                {
                                    branches: [
                                        {
                                            case: { $eq: ["$selected_for", 1] },
                                            then: '$services.service_prices.duration.1'
                                        },
                                        {
                                            case: { $eq: ["$selected_for", 2] },
                                            then: '$services.service_prices.duration.2'
                                        },
                                        {
                                            case: { $eq: ["$selected_for", 3] },
                                            then: '$services.service_prices.duration.3'
                                        },
                                        {
                                            case: { $eq: ["$selected_for", 4] },
                                            then: '$services.service_prices.duration.4'
                                        }
                                    ],
                                    default: 0
                                }
                            }
                        }
                    },
                    quantity: { '$first': '$quantity' },
                    price: { '$first': '$price' },
                    price_currency: { '$first': '$price_currency' },
                    selected_service_level: { '$first': '$selected_service_level' },
                    selected_for: { '$first': '$selected_for' },
                    subCategory: {
                        '$first': {
                            sub_category_name: '$subCategory.sub_category_name.' + languageCode,
                            sub_category_id: '$subCategory._id'
                        }
                    },
                    category: {
                        '$first': {
                            category_name: { "$ifNull": ['$category.category_name.' + languageCode, ""] },
                            sub_category_id: '$category._id',
                            category_id: '$category._id'
                        }
                    },
                    customer_id: { '$first': '$customer_id' },
                    address: {
                        "$first": {
                            "address": "$address",
                            "city_id": "$city_id",
                            "latitude": "$latitude",
                            "longitude": "$longitude",
                            "additional_details": { "$ifNull": ["$additional_details", ''] }
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
                            "name": { "$ifNull": ["$vendorDetails.first_name." + languageCode, ""] },
                            "nationality": "$stylist.nationality",
                            "latitude": "$vendorLocation.latitude",
                            "longitude": "$vendorLocation.longitude"

                        }
                    }, "coupons": {
                        "$first": {
                            "coupon_code": { "$ifNull": ["$coupon", ''] },
                            "coupon_amount_type": { "$ifNull": ["$coupon_amount_type", ''] },
                            'coupon_amount': { "$ifNull": ['$coupon_amount', 0] },
                            "up_to_amount": { "$ifNull": ["$up_to_amount", 0] }
                        }
                    },
                    "payment_type": { "$first": "$payment_type" }
                }
            },
            {
                "$lookup": {
                    "from": "stylistServices", "let": {
                        "vendor_id": "$cart.vendor_id",
                        "service_id": "$service.service_id",
                        "service_for": "$cart.selected_for"
                    },
                    "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] },
                                { "$eq": ["$service_id", "$$service_id"] }, { "$eq": ["$$service_for", "$service_for"] }, { "$ne": ["$status", 0] }]
                            }
                        }
                    },
                    { "$group": { "_id": "$vendor_id", "services": { "$first": "$$ROOT" } } },
                    { $replaceRoot: { newRoot: "$services" } }
                    ]
                    , "as": "vendorServices"
                }
            },
            { "$unwind": { "path": "$vendorServices", "preserveNullAndEmptyArrays": true } },
            {
                "$lookup":
                {
                    "from": "cities", "let": { "city_id": "$address.city_id" },
                    "pipeline":
                        [
                            { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$city_id"] }] } } },
                            {
                                "$lookup": {
                                    "from": "country",
                                    "localField": "country_id",
                                    "foreignField": "_id",
                                    "as": "country"
                                }
                            },
                            { "$unwind": "$country" }
                        ],
                    "as": "countryCurrency"
                }
            },
            { "$unwind": "$countryCurrency" },
            {
                '$project': {
                    customer_id: '$customer_id',
                    subCategory: '$subCategory',
                    "category": "$category",
                    service: {
                        service_name: '$service.service_name',
                        service_id: '$service.service_id',
                        duration: '$service.duration',
                        service_price: {
                            '1': { '$ifNull': ['$1', {}] },
                            '2': { '$ifNull': ['$2', {}] }, '3': { '$ifNull': ['$3', {}] }, '4': { '$ifNull': ['$4', {}] }
                        },
                        "vendor_service_levels": { "$ifNull": ["$vendorServices.service_levels", []] }
                    },
                    cart: '$cart',
                    "coupons": "$coupons",
                    "currency": {
                        "currency": "$countryCurrency.country.currency_symbol",
                        "currency_code": "$countryCurrency.country.currency_code"
                    },
                    "payment_type": "$payment_type",
                    "address": "$address"
                }
            },
            {
                '$group': {
                    "_id": '$customer_id',
                    cart_items: {
                        '$push': {
                            "cart": '$cart',
                            "vendor_service_levels": "$vendor_service_levels",
                            "service": '$service',
                            "sub_category": '$subCategory',
                            "category": "$category"
                        }
                    },
                    "payment_type": { "$first": "$payment_type" },
                    "coupons": { "$first": "$coupons" },
                    "address": { "$first": "$address" },
                    "currency": { "$first": "$currency" },
                    "sub_total": { '$sum': '$cart.price' }
                }
            }
        ], function (err, response) {



            return callback(response);
        });
    },
    deleteCart: function (cartId, customerId, callback) {
        db.cart.updateMany({ '_id': cartId, "customer_id": customerId, "status": 1 }, { "$set": { "status": 3 } }, function (err, response) {
            return callback(response);
        });
    }, deleteTotallCart: function (customerId, callback) {
        db.cart.updateMany({ "customer_id": customerId, "status": 1 }, { "$set": { "status": 3 } }, function (err, response) {
            return callback(response);
        });
    }, deleteManyItems: function (where, callback) {
        db.cart.deleteMany(where, function (err, response) {
            return callback(response);
        });
    }, updateCartWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.cart.update(where, { "$set": data }, { multi: true }, function (err, response) {
                return resolve(response);
            });
        });
    }, getCartDetails: function (customerId, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "customer_id": userId, "status": { "$eq": 1 }, "cart_type": 1 } }
        ], function (err, response) {

            return callback(response);
        })
    }, checkCartItems: function (customerId, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "customer_id": userId, "status": { "$eq": 1 }, "cart_type": 1 } },
            {
                "$group": {
                    "_id": "$vendor_id",
                    "services": {
                        "$push": {
                            "cart_id": "$_id",
                            "service_id": "$service_id",
                            "latitude": "$latitude",
                            "longitude": "$longitude",
                            "selected_service_level": "$selected_service_level",
                            "selected_for": "$selected_for",
                            "price": "$price",
                            "quantity": "$quantity",
                            "cart_for": "$cart_for",
                            'duration': "$duration"
                        }
                    },
                    coupon_code_details: {
                        "$first": {
                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                            "coupon_code": { "$ifNull": ['$coupon', ''] },
                            "up_to_amount": { "$ifNull": ["$up_to_amount", 0] },
                            "type": { "$ifNull": ["$coupon_amount_type", 0] },
                            'coupon_scope': { "$ifNull": ["$coupon_scope", 1] },
                            'min_amount': "$min_amount",
                            'coupon_type': '$coupon_type',
                            'coupon_id': '$coupon_id'
                        }
                    },
                    "additional_details": { "$first": { "$ifNull": ["$additional_details", {}] } },
                    "city_id": { "$first": "$city_id" },
                    "latitude": { "$first": "$latitude" },
                    "longitude": { "$first": "$longitude" },
                    "address": { "$first": "$address" },
                    "payment_type": { "$first": "$payment_type" },
                    "card_id": { "$first": "$card_id" }
                },

            }
        ], function (err, response) {

            return callback(response);
        })

    }, getCartItems: function (cartIds, callback) {
        //var userId=new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "_id": { "$in": cartIds } } }
        ], function (err, response) {
            return callback(response);
        })
    }, getVendorCartItems: function (userId, callback) {
        var userObjectId = new mongoose.Types.ObjectId(userId);

        db.cart.aggregate([
            { "$match": { "customer_id": userObjectId, "status": 1, "cart_type": 1 } },
            {
                "$group": {
                    "_id": "$vendor_id",
                    "services": {
                        "$push": {
                            "cart_id": "$_id",
                            "service_id": "$service_id",
                            "latitude": "$latitude",
                            "longitude": "$longitude",
                            "selected_service_level": "$selected_service_level",
                            "price": "$price",
                            "quantity": "$quantity",
                            "selected_for": "$selected_for",
                            "cart_for": "$cart_for",
                            "duration": "$duration"
                        }
                    },
                    coupon_code_details: {
                        "$first": {
                            "coupon_amount": { "$ifNull": ["$coupon_amount", 0] },
                            "coupon_code": { "$ifNull": ['$coupon', ''] },
                            "type": { "$ifNull": ["$coupon_amount_type", 0] },
                            'min_amount': "$min_amount",
                            'coupon_type': '$coupon_type',
                            'coupon_id': '$coupon_id',
                            'coupon_scope': { "$ifNull": ["$coupon_scope", 1] },
                            "up_to_amount": { "$ifNull": ["$up_to_amount", 0] }
                        }
                    },
                    "price": { "$first": "$price" },
                    "city_id": { "$first": "$city_id" },
                    "latitude": { "$first": "$latitude" },
                    "longitude": { "$first": "$longitude" },
                    "address": { "$first": "$address" },
                    "additional_details": { "$first": { "$ifNull": ["$additional_details", {}] } },
                    "payment_type": { "$first": "$payment_type" },
                    "card_id": { "$first": "$card_id" }
                }
            }
        ], function (err, response) {

            return callback(response);
        })
    }, getSingleCartDetails: function (cartId, userId, callback) {
        var cartObjectId = new mongoose.Types.ObjectId(cartId);
        var userObjectId = new mongoose.Types.ObjectId(userId);
        db.cart.aggregate([
            { "$match": { "_id": cartObjectId, "customer_id": userObjectId } }
        ], function (err, response) {
            return callback(response);
        })

    }, update: function (data, where, callback) {


        db.cart.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

            callback(response);

        });
    }, updateMany: function (data, where, callback) {
        db.cart.update(where, { $set: data }, { multi: true }, function (err, response) {

            callback(response);

        });
    }, updateManyWithPromises: function (data, where, callback) {

        return new Promise(function (resolve) {
            db.cart.update(where, { $set: data }, { multi: true }, function (err, response) {

                resolve(response);
            });
        })
    }, save: function (values, callback) {


        var cart = new db.cart(values);

        cart.save(function (err, response) {

            callback(response);
        });
    }, checkCart: function (customerId) {
        var userId = new mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {

            db.cart.aggregate([
                { "$match": { "customer_id": userId, "status": 1 } },
                {
                    "$lookup": {
                        "from": "services",
                        "localField": "service_id",
                        "foreignField": "_id",
                        "as": "serviceDetails"
                    }
                },
                { "$unwind": "$serviceDetails" },
                {
                    "$project": {
                        "_id": "$customer_id",
                        "service_duration": { "$multiply": ["$serviceDetails.duration", "$quantity"] },
                        "quantity": "$quantity",
                        'country': "$country_id",
                        "price": "$price"
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "country": { "$first": "$country" },
                        "service_duration": { "$sum": "$service_duration" },
                        "quantity": { "$sum": "$quantity" },
                        "price": { "$sum": "$price" }
                    }
                }
            ], function (err, response) {
                return resolve(response);
            });
        });
    }, checkCartTotal: function (customerId) {
        var userId = new mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {
            db.cart.aggregate([
                { "$match": { "customer_id": userId, "status": 1 } },
                {
                    "$lookup": {
                        "from": "services",
                        "localField": "service_id",
                        "foreignField": "_id",
                        "as": "serviceDetails"
                    }
                },
                { "$unwind": "$serviceDetails" },
                {
                    "$project":
                    {
                        "_id": "$customer_id",
                        "service_duration": { "$multiply": ["$serviceDetails.duration", "$quantity"] },
                        "quantity": "$quantity",
                        "type": "$type",
                        "salon_id": "$salon_id",
                        "price": "$price",
                        "latitude": "$latitude",
                        "longitude": "$longitude"

                    }
                }, {
                    "$group": {
                        "_id": "$_id",
                        "service_duration": { "$sum": "$service_duration" },
                        "quantity": { "$sum": "$quantity" },
                        "type": { "$first": "$type" },
                        "salon_id": { "$first": "$salon_id" },
                        'country_id': { "$first": "$country_id" },
                        'city_id': { "$first": "$city_id" },
                        "price": { "$sum": "$price" },
                        "latitude": { "$first": "$latitude" },
                        "longitude": { "$first": "$longitude" }
                    }
                }

            ], function (err, response) {

                return resolve(response);
            });
        });
    }, checkPromoCartTotal: function (customerId) {
        var userId = new mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {
            db.cart.aggregate([
                { "$match": { "customer_id": userId, "status": 1 } },

                {
                    "$project":
                    {
                        "_id": "$customer_id",

                        "quantity": "$quantity",
                        "type": "$type",
                        "salon_id": "$salon_id",
                        "price": "$price",
                        "latitude": "$latitude",
                        "longitude": "$longitude",
                        "city_id": "$city_id",
                        'is_package': "$is_package",
                        'cart_type': "$cart_type",
                        "country_id": "$country_id"
                    }
                },

                {
                    "$group": {
                        "_id": "$_id",
                        "quantity": { "$sum": "$quantity" },
                        "type": { "$first": "$type" },
                        "salon_id": { "$first": "$salon_id" },
                        'country_id': { "$first": "$country_id" },
                        'city_id': { "$first": "$city_id" },
                        "price": { "$sum": "$price" },
                        "latitude": { "$first": "$latitude" },
                        "cart_type": { "$first": "$cart_type" },
                        "longitude": { "$first": "$longitude" },
                        "is_package": { "$first": "$is_package" }
                    }
                }

            ], function (err, response) {

                return resolve(response);
            });
        });
    },

    cartTotal: function (customerId) {
        var userId = new mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {

            db.cart.aggregate([{ "$match": { "status": 1 } },
            {
                "$facet": {
                    "stylist": [{ "$match": { "cart_type": 1 } },
                    {
                        "$lookup": {
                            "from": "services",
                            "localField": "service_id",
                            "foreignField": "_id",
                            "as": "serviceDetails"
                        }
                    },
                    { "$unwind": "$serviceDetails" },
                    {
                        "$project":
                        {
                            "_id": "$customer_id",
                            "service_duration": { "$multiply": ["$serviceDetails.duration", "$quantity"] },
                            "quantity": "$quantity",
                            "price": "$price"
                        }
                    }, {
                        "$group": {
                            "_id": "$_id",
                            "service_duration": { "$sum": "$service_duration" },
                            "quantity": { "$sum": "$quantity" },
                            "price": { "$sum": "$price" }
                        }
                    }

                    ], "salon": [
                        { "$match": { "cart_type": 2 } },
                        {
                            "$lookup": {
                                "from": "salonPackages", "let": { "package_id": "$package_id" },
                                "pipeline": [{
                                    "$match": {
                                        "$expr": {
                                            "$and": [
                                                { "$eq": ["$_id", "$$package_id"] }
                                            ]
                                        }
                                    }
                                },
                                { "$unwind": "$services_id" },
                                {
                                    "$lookup": {
                                        "from": "salonServices",
                                        "let": { "service": "$services_id", "service_for": "$package_for" },
                                        "pipeline": [{
                                            "$match": {
                                                "$expr": {
                                                    "$and": [{ "$eq": ["$service_id", "$$service"] },
                                                    { "$eq": ["$service_for", "$$service_for"] }
                                                    ]
                                                }
                                            }
                                        }],
                                        "as": "salonServices"
                                    }
                                },
                                { "$unwind": "$salonServices" },
                                {
                                    "$group": {
                                        "_id": "$_id",

                                        "service_time": { "$sum": "$salonServices.service_time" },
                                        "package_amount": { "$first": "$package_amount" }
                                    }
                                }



                                ], "as": "salonPackages"
                            }
                        },
                        {
                            "$lookup": {
                                "from": "salonServices",
                                "let": { "service_id": "$service_id", "salon_id": "$salon_id", "selected_for": "$selected_for" },
                                "pipeline": [
                                    {
                                        "$match": {
                                            "$expr": {
                                                "$and": [{ "$eq": ["$salon_id", "$$salon_id"] },
                                                { "$eq": ["$service_id", "$$service_id"] },
                                                { "$eq": ["$$selected_for", "$service_for"] }]
                                            }
                                        }
                                    },
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
                        { "$unwind": { "path": "$salonServices", "preserveNullAndEmptyArrays": true } },
                        { "$unwind": { "path": "$salonPackages", "preserveNullAndEmptyArrays": true } },
                        {
                            "$group": {
                                "_id": "$customer_id", "cart_time": {
                                    "$sum": {
                                        "$ifNull": [{ "$multiply": ["$salonServices.service_time", "$quantity"] },
                                        { "$multiply": ["$salonPackages.service_time", "$quantity"] }]
                                    }
                                },
                                "cart_amount": {
                                    "$sum": {
                                        "$ifNull": [{ "$multiply": ["$salonServices.service_cost", "$quantity"] },
                                        { "$multiply": ["$salonPackages.package_amount", "$quantity"] }]
                                    }
                                }, "cart_count": { "$sum": { "$multiply": [{ "$sum": 1 }, "$quantity"] } }

                            }
                        }]
                }
            }],
                function (err, response) {

                    return resolve(response);
                });
        });
    }
    , updateWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.cart.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, find: function (check, callback) {

        db.cart.find(check, function (err, response) {

            callback(response);
        });
    }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {

            db.cart.find(check, fields, function (err, response) {
                resolve(response);
            });
        });
    }, salonCartItems: function (customerId, languageCode, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "$expr": { "$and": [{ "$eq": ["$customer_id", userId] }, { "$eq": ["$cart_type", 2] }, { "$eq": ["$status", 1] }] } } },
            {
                "$group": {
                    "_id": { "customer_id": "$customer_id", "package_id": "$package_id" },

                    "service_items": { "$push": { "$cond": [{ "$eq": ["$is_package", 1] }, "", "$$ROOT"] } },
                    "package_items": { "$first": { "$cond": [{ "$eq": ["$is_package", 1] }, "$$ROOT", {}] } }
                }
            },
            {
                "$group": {
                    "_id": "$_id.customer_id", "package_items": { "$push": "$package_items" },
                    "service_items": {
                        "$first": {
                            '$filter': { input: '$service_items', as: 'service', cond: { '$ne': ['$$service', ""] } }
                        }
                    }
                }
            },
            { "$project": { "services": { $concatArrays: ["$service_items", "$package_items"] } } },
            { "$unwind": "$services" },
            { "$match": { "services.service_id": { "$exists": true } } },
            { $replaceRoot: { newRoot: "$services" } },
            {
                "$lookup": {
                    "from": "salonEmployees",
                    "localField": "employee_id",
                    "foreignField": "_id",
                    "as": "employeeDetails"
                }
            },
            {
                "$lookup": {
                    "from": "salon",
                    "let": { "salon_id": "$salon_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$_id"] }] } } },
                        { "$lookup": { "from": "vendor", "localField": "vendor_id", "foreignField": "_id", "as": "vendorDetails" } },
                        { "$unwind": "$vendorDetails" },
                        { "$lookup": { "from": "rating", "localField": "_id", "foreignField": "salon_id", "as": "rating" } },
                        {
                            "$lookup": {
                                "from": "vendorLocation",
                                "let": { "salon_id": "$_id" },
                                "pipeline": [{
                                    '$geoNear': {
                                        "near": {
                                            "type": 'Point',
                                            coordinates: [0, 0]
                                        },
                                        distanceField: 'distance', distanceMultiplier: 0.001, spherical: true
                                    }
                                },
                                { "$match": { "$expr": { "$and": [{ "$eq": ["$$salon_id", "$salon_id"] }] } } }
                                ], "as": "salonLocation"
                            }
                        },
                        { "$unwind": { "path": "$salonLocation", "preserveNullAndEmptyArrays": true } },
                        {
                            "$lookup": {
                                "from": "salonPictures", "let": { "salon_id": "$_id" }, "pipeline":
                                    [{ "$match": { "$expr": { "$and": [{ "$eq": ["$salon_id", "$$salon_id"] }] } } }, {
                                        "$group": {
                                            "_id": "$salon_id",
                                            "file_path": { "$push": "$file_path" }
                                        }
                                    },
                                    { "$project": { "_id": 0 } }], "as": "salonPitures"
                            }
                        },
                        { "$unwind": { "path": "$salonPitures", "preserveNullAndEmptyArrays": true } },
                        {
                            "$project": {
                                "_id": 0,
                                "totalrating": {
                                    "$ifNull": [
                                        { '$divide': [{ '$trunc': { '$add': [{ '$multiply': [{ "$avg": "$rating.rating" }, 10] }, 0.5] } }, 10] }, 0]
                                },
                                "totalreviews": { "$size": "$rating" },
                                "salon_id": "$_id",
                                "city_id": { "$ifNull": ["$city_id", ''] },
                                "salon_number": { "$ifNull": ["$salon_number", ""] },
                                "salon_name": "$salon_name." + languageCode,
                                "tm_user_id": { "$ifNull": ["$vendorDetails.tm_user_id", 0] },
                                "salon_pictures": "$salonPitures.file_path",
                                "address": "$salonLocation.address"
                            }
                        }
                    ],
                    "as": "salonDetails"
                }
            },
            {
                "$lookup": {
                    "from": "salonPackages", "let": { "package_id": "$package_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$package_id"] }] } } },
                    { "$unwind": "$services" },
                    {
                        "$lookup": {
                            "from": "services",
                            "localField": "services.service_id",
                            "foreignField": "_id",
                            "as": "serviceDetails"
                        }
                    },
                    {
                        "$lookup": {
                            "from": "salonServices",
                            "let": {
                                "service": "$services.service_id", "service_for": "$services.service_for",
                                "salon_id": "$salon_id"
                            },
                            "pipeline": [{
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            { "$eq": ["$salon_id", "$$salon_id"] },
                                            { "$eq": ["$service_id", "$$service"] }, { "$ne": ["$status", 0] },
                                            { "$eq": ["$service_for", "$$service_for"] }]
                                    }
                                }
                            },
                            { "$group": { "_id": { "service_for": "$service_for", "service_id": "$service_id" }, "service": { "$first": "$$ROOT" } } },
                            { $replaceRoot: { newRoot: '$service' } }

                            ],
                            "as": "salonServices"
                        }
                    },
                    { "$unwind": "$salonServices" },
                    { "$unwind": "$serviceDetails" },
                    {
                        "$group": {
                            "_id": "$_id",
                            "services_details": {
                                "$push": {
                                    "service_name": "$serviceDetails.service_name." + languageCode,
                                    "service_cost": "$salonServices.service_cost",
                                    'service_for': "$services.service_for",
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
            {
                "$lookup": {
                    "from": "salonServices",
                    "let": { "service_id": "$service_id", "salon_id": "$salon_id", "selected_for": "$selected_for", "is_package": "$is_package" },
                    "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [
                                    { "$eq": ["$salon_id", "$$salon_id"] },
                                    { "$ne": ["$is_package", 1] },
                                    { "$eq": ["$service_id", "$$service_id"] },
                                    { "$eq": ["$$selected_for", "$service_for"] }, { "$eq": ["$status", 1] }]
                            }
                        }
                    },
                    {
                        "$lookup": {
                            "from": "services", "let": { "service_id": "$service_id" },
                            "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } },
                            {
                                "$lookup": {
                                    "from": "category",
                                    "localField": "category_id",
                                    "foreignField": "_id",
                                    "as": "category"
                                }
                            },
                            { "$unwind": "$category" },
                            {
                                "$project": {
                                    "category_id": "$category_id",
                                    "category_name": "$category.category_name",
                                    "service_id": "$_id",
                                    "service_name": "$service_name"
                                }
                            }
                            ], "as": "servicesList"
                        }
                    },
                    { "$unwind": "$servicesList" },
                    {
                        "$project": {
                            "service_cost": "$service_cost",
                            "service_time": "$service_time",
                            "category_name": "$servicesList.category_name",
                            "category_id": "$servicesList.category_id",
                            "service_id": "$servicesList.service_id",
                            "service_name": "$servicesList.service_name." + languageCode
                        }
                    }
                    ],
                    "as": "salonServices"
                }
            },
            { "$unwind": { "path": "$employeeDetails", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$salonServices", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$salonDetails", "preserveNullAndEmptyArrays": true } },
            {
                "$lookup": {
                    "from": "cities", "let": { "city_id": "$salonDetails.city_id" }, "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$city_id"] }] } } },
                        { "$lookup": { "from": "country", "localField": "country_id", "foreignField": "_id", "as": "country" } },
                        { "$unwind": "$country" }], "as": "cities"
                }
            },
            { "$unwind": { "path": "$cities", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$salonPackages", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": "$_id",
                    "payment_type": { "$first": "$payment_type" },
                    "card_id": { "$first": { "$ifNull": ["$card_id", ""] } },
                    "customer_id": { "$first": "$customer_id" },
                    "cart_items": {
                        "$first": {
                            "$cond": [{ "$ne": [{ "$ifNull": ["$salonPackages", []] }, []] }, {
                                "package": {
                                    "package_id": "$salonPackages.package_id",
                                    "package_name": "$salonPackages.package_name", "package_service": "$salonPackages.service_details", "package_amount": "$salonPackages.package_amount"
                                },
                                "type": "$type",
                                "cart": {
                                    "cart_id": "$_id",
                                    "cart_time": "$salonPackages.total_service_time",

                                    "selected_for": "$salonPackages.package_for",

                                    "cart_count": "$quantity",
                                    "cart_amount": { "$multiply": ["$salonPackages.package_amount", "$quantity"] }
                                }
                            }, {
                                "cart": {
                                    "cart_id": "$_id",
                                    "cart_time": "$salonServices.service_time",
                                    "selected_for": "$selected_for",
                                    "cart_count": "$quantity",
                                    "cart_amount": "$price",
                                    "employee_id": "$employeeDetails._id",
                                    "employee_name": { "$ifNull": [{ "$concat": ["$employeeDetails.employee_first_name." + languageCode, " ", "$employeeDetails.employee_last_name." + languageCode] }, ''] },
                                    "profile_pic": "$employeeDetails.profile_pic",
                                    "date": "$date",
                                    "time": "$time"
                                },
                                "type": "$type",
                                "service": {
                                    "service_cost": "$salonServices.service_cost",
                                    "service_name": "$salonServices.service_name",
                                    "service_id": "$salonServices.service_id",
                                    "category_id": "$salonServices.category_id",
                                    "category_name": "$salonServices.category_name." + languageCode
                                }
                            }]
                        }
                    }, "coupons": {
                        "$first": {
                            "coupon_code": { "$ifNull": ["$coupon", ''] },
                            "coupon_amount_type": { "$ifNull": ["$coupon_amount_type", ''] },
                            'coupon_amount': { "$ifNull": ['$coupon_amount', 0] },
                            "up_to_amount": { "$ifNull": ["$up_to_amount", 0] }
                        }
                    },
                    "cart_time": {
                        "$first": {
                            "$ifNull": [{ "$multiply": ["$salonServices.service_time", "$quantity"] },
                            { "$multiply": ["$salonPackages.total_service_time", "$quantity"] }]
                        }
                    },
                    "cart_amount": {
                        "$first": {
                            "$ifNull": [
                                {
                                    "$cond": [{ "$eq": ["$is_package", 1] },
                                    { "$multiply": ["$salonPackages.package_amount", "$quantity"] },
                                    { "$multiply": ["$salonServices.service_cost", "$quantity"] }]
                                }, 0
                            ]
                        }
                    },
                    "cart_count": { "$first": { "$multiply": [{ "$sum": 1 }, "$quantity"] } },
                    "salonDetails": { "$push": "$salonDetails" },
                    "selected_date": { "$first": "$selected_date" },
                    "selected_time": { "$first": "$selected_time" },
                    "currency": {
                        "$first": {
                            "currency": "$cities.country.currency_symbol",
                            "currency_code": "$cities.country.currency_code"
                        }
                    }
                }
            },
            {
                "$group": {
                    "card_id": { "$first": "$card_id" },
                    "payment_type": { "$first": "$payment_type" },
                    "_id": "$customer_id",
                    "cart_items": { "$push": "$cart_items" },
                    "cart_time": { "$sum": "$cart_time" },
                    "cart_amount": { "$sum": "$cart_amount" }
                    , "cart_count": { "$sum": "$cart_count" },
                    "coupons": { "$first": "$coupons" },
                    "salonDetails": { "$first": { "$arrayElemAt": ["$salonDetails", 0] } },
                    "date": { "$first": { "$ifNull": ["$selected_date", new Date().toLocaleDateString()] } },
                    "time": { "$first": { "$ifNull": ["$selected_time", new Date().toLocaleTimeString()] } },
                    "currency": {
                        "$first": {
                            "currency": { "$ifNull": ["$currency.currency", "₹"] },
                            "currency_code": { "$ifNull": ["$currency.currency_code", "INR"] }
                        }
                    }
                }
            },
            {
                "$project":
                {
                    "customer_id": "$_id",
                    "_id": 0,
                    "payment_type": "$payment_type",
                    "card_id": "$card_id",
                    "cart_items": "$cart_items",
                    "total_cart": { "cart_time": "$cart_time", "cart_amount": "$cart_amount", "cart_count": "$cart_count" },
                    "salonDetails": "$salonDetails",
                    "date": { "$ifNull": ["$date", new Date().toLocaleDateString()] },
                    "time": { "$ifNull": ["$time", new Date().toLocaleTimeString()] },
                    'coupons': "$coupons",
                    "currency": "$currency"
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, salonCartCount: function (customerId, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "$expr": { "$and": [{ "$eq": ["$customer_id", userId] }, { "$eq": ["$cart_type", 2] }, { "$eq": ["$status", 1] }] } } },
            {
                "$group": {
                    "_id": { "customer_id": "$customer_id", "package_id": "$package_id" },

                    "service_items": { "$push": { "$cond": [{ "$eq": ["$is_package", 1] }, "", "$$ROOT"] } },
                    "package_items": { "$first": { "$cond": [{ "$eq": ["$is_package", 1] }, "$$ROOT", {}] } }
                }
            },
            {
                "$group": {
                    "_id": "$_id.customer_id", "package_items": { "$push": "$package_items" },
                    "service_items": { "$first": { '$filter': { input: '$service_items', as: 'service', cond: { '$ne': ['$$service', ""] } } } }
                }
            },
            { "$project": { "services": { $concatArrays: ["$service_items", "$package_items"] } } },

            { "$unwind": "$services" },
            { "$match": { "services.service_id": { "$exists": true } } },
            { $replaceRoot: { newRoot: "$services" } },
            {
                "$lookup": {
                    "from": "salonPackages", "let": { "package_id": "$package_id" },
                    "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [
                                    { "$eq": ["$_id", "$$package_id"] }
                                ]
                            }
                        }
                    },
                    { "$unwind": "$services" },
                    {
                        "$lookup": {
                            "from": "salonServices",
                            "let": { "service": "$services.service_id", "service_for": "$services.service_for", "salon_id": "$salon_id" },
                            "pipeline": [{
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            { "$eq": ["$service_id", "$$service"] },
                                            { "$eq": ["$salon_id", "$$salon_id"] },
                                            { "$eq": ["$service_for", "$$service_for"] }
                                        ]
                                    }
                                }
                            }],
                            "as": "salonServices"
                        }
                    },
                    { "$unwind": "$salonServices" },
                    {
                        "$group": {
                            "_id": "$_id",

                            "service_time": { "$sum": "$salonServices.service_time" },
                            "package_amount": { "$first": "$package_amount" }
                        }
                    }



                    ], "as": "salonPackages"
                }
            },
            {
                "$lookup": {
                    "from": "salonServices",
                    "let": { "service_id": "$services.service_id", "salon_id": "$salon_id", "selected_for": "$selected_for", "is_package": "$is_package" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$eq": ["$salon_id", "$$salon_id"] }, { "$ne": ["$is_package", 1] },
                                    { "$eq": ["$service_id", "$$service_id"] },
                                    { "$eq": ["$$selected_for", "$service_for"] }]
                                }
                            }
                        },
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
            { "$unwind": { "path": "$salonServices", "preserveNullAndEmptyArrays": true } },
            { "$unwind": { "path": "$salonPackages", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": { "customer_id": "$customer_id", "package_id": "$package_id" },
                    "cart_time": {
                        "$sum": {
                            "$ifNull": [
                                {
                                    $cond: [{ "$eq": ["$is_package", 1] }, { "$multiply": ["$salonPackages.service_time", "$quantity"] },
                                    { "$multiply": ["$salonServices.service_time", "$quantity"] },

                                    ]
                                }, 0
                            ]
                        }
                    },
                    "cart_amount": {
                        "$sum": {
                            "$ifNull": [
                                {
                                    $cond: [{ "$eq": ["$is_package", 1] }, { "$multiply": ["$salonPackages.package_amount", "$quantity"] },
                                    { "$multiply": ["$salonServices.service_cost", "$quantity"] }
                                    ]
                                }
                                , 0
                            ]
                        }
                    },
                    'is_package': { "$first": { "$ifNull": ['$is_package', 0] } },
                    "cart_count": { "$sum": { "$cond": [{ "$eq": ["$is_package", 1] }, 0, { "$multiply": [{ "$sum": 1 }, "$quantity"] }] } },

                }
            },
            {
                "$group": {
                    "_id": "$_id.customer_id", "cart_time": { "$first": "$cart_time" }, "cart_amount": { "$first": "$cart_amount" },
                    "is_package": { "$first": "$is_package" }, "cart_count": { "$sum": { "$cond": [{ "$eq": ["$is_package", 1] }, 1, "$cart_count"] } }
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, getSalonCartDetails: function (customerId, callback) {
        var userId = new mongoose.Types.ObjectId(customerId);
        db.cart.aggregate([
            { "$match": { "customer_id": userId, "status": { "$eq": 1 }, "cart_type": 2 } }
        ], function (err, response) {

            return callback(response);
        })

    }, getCartServiceDetails: function (cartIds, callback) {

        var totalCartIds = [];
        for (var c = 0; c < cartIds.length; c++) {
            var cart = new mongoose.Types.ObjectId(cartIds[c]);
            totalCartIds.push(cart)
        }
        db.cart.aggregate([
            { "$match": { "$expr": { "$and": [{ "$in": ["$_id", totalCartIds] }] } } },
            { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "serviceDetails" } },
            { "$unwind": "$serviceDetails" },
            { "$lookup": { "from": "category", "localField": "category_id", "foreignField": "_id", "as": "categoryDetails" } },
            { "$unwind": "$categoryDetails" },
            {
                "$group": {
                    "_id": "$customer_id", "customer_details": { "$first": { "address": "$address", "latitude": "$latitude", "longitude": "$longitude", "city_id": "$city_id" } },
                    "services": {
                        "$push": {
                            "service_name": "$serviceDetails.service_name.en",
                            "category_name": "$categoryDetails.category_name.en",
                            "service_for": "$selected_for"
                        }
                    }
                }
            },
            { "$lookup": { "from": "cities", "localField": "customer_details.city_id", "foreignField": "_id", "as": "cities" } },
            { "$unwind": "$cities" },
            { "$lookup": { "from": "country", "localField": "cities.country_id", "foreignField": "_id", "as": "countryDetails" } },
            { "$unwind": "$countryDetails" },
            { "$lookup": { "from": "customers", "localField": "_id", "foreignField": "_id", "as": "customerDetails" } },
            { "$unwind": "$customerDetails" },
            {
                "$project": {
                    "customer_name": { "$concat": ["$customerDetails.first_name", ' ', "$customerDetails.last_name"] },
                    "city_name": "$cities.city_name", "customer_mobile": "$customerDetails.mobile",
                    "country_name": "$countryDetails.country_name",
                    "services": "$services", "customer_details": "$customer_details"
                }
            }
        ], function (err, response) {

            return callback(response);
        });
    }, checkCouponCode: function (customerId) {
        var user = new mongoose.Types.ObjectId(customerId);

        return new Promise(function (resolve) {
            db.cart.aggregate([{ "$match": { "customer_id": user, "status": 1 } },
            {
                "$group": {
                    "_id": "$customer_id", "total_amount": { "$sum": "$price" }, "coupon": {
                        "$first": {
                            "coupon": "$coupon",
                            "coupon_amount_type": "$coupon_amount_type",
                            "up_to_amount": "$up_to_amount",
                            'min_amount': "$min_amount",
                            "coupon_id": "$coupon_id"
                        }
                    }
                }
            }
            ], function (err, response) {

                return resolve(response);
            });
        });
    }, checkSalonCouponCode: function (customerId) {
        var user = new mongoose.Types.ObjectId(customerId);

        return new Promise(function (resolve) {
            db.cart.aggregate([{ "$match": { "customer_id": user, "status": 1 } },
            {
                "$group": {
                    "_id": "$customer_id", "total_amount": { "$sum": "$price" }, "coupon": {
                        "$first": {
                            "coupon": "$coupon",
                            "coupon_amount_type": "$coupon_amount_type",
                            "up_to_amount": "$up_to_amount",
                            'min_amount': "$min_amount",
                            "coupon_id": "$coupon_id"
                        }
                    }
                }
            }
            ], function (err, response) {

                return resolve(response);
            });
        });
    },  updatepayment: function (data, where) {
        return new Promise(function (resolve) {
            db.cart.update(where, { $set: data }, { multi: true }, function (err, response) {

                resolve(response);

            });
        });
    }
}
