var db = require('../db');
var mongoose = require('mongoose');
module.exports = {
    save: function (values, callback) {


        var stylist = new db.stylist(values);

        stylist.save(function (err, response) {

            callback(response);
        });
    },
    find: function (check, callback) {

        db.stylist.find(check, function (err, response) {

            callback(response);
        });
    },

    findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {

            db.stylist.find(check, fields, function (err, response) {

                resolve(response);
            });
        });
    }, updateMany: function (data, where, callback) {


        db.stylist.update(where, { $set: data }, { multi: true }, function (err, response) {

            callback(response);

        });
    }, updateStatus: function (data, where, callback) {


        db.stylist.update(where, { $addtoSet: data }, { multi: true }, function (err, response) {

            callback(response);

        });
    },
    fi: function (check, callback) {
        db.stylist.aggregate().cursor().on("data", function (doc) {
        }).on("close", function (result) {

        });
    }, findFields: function (check, fields, callback) {

        db.stylist.find(check, fields, function (err, response) {
            return callback(response);
        });
    }, findFieldsWithProject: function (vendorId, fields, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);

        db.stylist.aggregate([{ "$match": { "vendor_id": vendor } }, { "$project": fields }], function (err, response) {

            return callback(response);
        });
    },
    update: function (data, where, callback) {
        db.stylist.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {
            if (err) {
                console.log(err)
                callback(err);
            }else{
                callback(response);
            }
           
        });
    }, totalStylistEarings: function (vendorId, startDate, endDate, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);

        db.bookings.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },
                        { $gte: ["$created", new Date(startDate)] }, { "$lte": ["$created", new Date(endDate)] }
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$vendor_id", "amount": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                    "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                    "total_bookings": { "$sum": 1 },
                    "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                    //"mr_miss_fee":{"$sum":{"$multiply":[{"$divide":["$net_amount",100]},utility.mr_miss_booking_fee]}}
                    "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } }
                }
            },
            { "$project": { "_id": 1, "cancellation_amount": "$cancellation_amount", "amount": 1, "surge": 1, "mr_miss_fee": "$mr_miss_fee", "total_bookings": 1 } }
        ], function (err, response) {
            console.log(response, err);
            return callback(response);
        });
    }, cashandcardEarings: function (vendorId, startDate, endDate, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([{
            $facet: {
                "totalamount": [{
                    "$match": {
                        "$expr": {
                            "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },
                            { $gte: ["$created", new Date(startDate)] }, { "$lte": ["$created", new Date(endDate)] }
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$vendor_id", "amount": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                        "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                        "total_bookings": { "$sum": 1 },
                        "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                        "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } }
                    }
                },
                { "$project": { "_id": 1, "cancellation_amount": "$cancellation_amount", "amount": 1, "surge": 1, "mr_miss_fee": "$mr_miss_fee", "total_bookings": 1 } }],


                "cashamount": [{
                    "$match": {
                        "$expr": {
                            "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$eq": ["$payment_type", 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },
                            { $gte: ["$created", new Date(startDate)] }, { "$lte": ["$created", new Date(endDate)] }
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$vendor_id", "amount": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                        "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                        "total_bookings": { "$sum": 1 },
                        "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                        "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } }
                    }
                },
                { "$project": { "_id": 1, "cancellation_amount": "$cancellation_amount", "amount": 1, "surge": 1, "mr_miss_fee": "$mr_miss_fee", "total_bookings": 1 } }],


                "cardamount": [{
                    "$match": {
                        "$expr": {
                            "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$eq": ["$payment_type", 2] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },
                            { $gte: ["$created", new Date(startDate)] }, { "$lte": ["$created", new Date(endDate)] }
                            ]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$vendor_id", "amount": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                        "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                        "total_bookings": { "$sum": 1 },
                        "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                        "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } }
                    }
                },
                { "$project": { "_id": 1, "cancellation_amount": "$cancellation_amount", "amount": 1, "surge": 1, "mr_miss_fee": "$mr_miss_fee", "total_bookings": 1 } }],


                "dueamount": [{
                    "$match": {
                        "$expr": {
                            "$and": [{ "$eq": ["$vendor_id", vendor] }, { "$eq": ["$payment_type", 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$eq": ["$status", 5] }, { "$ne": ["$cancell_type", 3] }] }] },

                            ]
                        }
                    }
                },


                {
                    "$group": {
                        "_id": "$vendor_id", "amount": { "$sum": { "$cond": [{ "$eq": ["$status", 8] }, "$net_amount", 0] } },
                        "surge": { "$sum": { $subtract: [{ "$multiply": ["$net_amount", "$surge"] }, "$net_amount"] } },
                        "total_bookings": { "$sum": 1 },
                        "cancellation_amount": { "$sum": { "$cond": [{ "$eq": ["$status", 5] }, "$cancellation_amount", 0] } },
                        "mr_miss_fee": { "$sum": { "$ifNull": ["$booking_percentage", 0] } },





                    }
                },

                { "$project": { "_id": 1, "cancellation_amount": "$cancellation_amount", "amount": "$amount", "surge": 1, "mr_miss_fee": "$mr_miss_fee", "total_bookings": 1 } }]


            }
        }

        ], function (err, response) {

            return callback(response);
        });


    }, findsalonsWithCity: function (cityIds) {
        return new Promise(function (resolve) {
            db.stylist.aggregate([{ "$match": { "city_id": { "$in": cityIds } } },
            { "$group": { "_id": "$city_id", "stylist": { "$push": "$_id" } } }], function (err, response) {
                return resolve(response);
            });
        })
    }, updateWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.stylist.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, promotionAmount: function (vendorId, startDate, endDate) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        var matchCondtion = { "$match": { "vendor_id": vendor } };

        return new Promise(function (resolve) {
            db.stylist.aggregate([
                matchCondtion,
                { "$unwind": "$promotions" },
                {
                    "$match": {
                        "promotions.to": {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                },
                { "$group": { "_id": "$vendor_id", "amount": { "$sum": "$promotions.promotion_amount" } } }
            ], function (err, response) {
                return resolve(response);
            });
        });
    }, promotionList: function (vendorId, startDate, endDate, languageCode, callback) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        var matchCondtion = { "$match": { "vendor_id": vendor } };

        db.stylist.aggregate([
            matchCondtion,
            { "$unwind": "$promotions" },
            {
                "$match": {
                    "promotions.to": {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            { "$lookup": { "from": "promotions", "localField": "promotions.promotion_id", "foreignField": "_id", "as": "promotionDetails" } },
            { "$unwind": "$promotionDetails" },
            {
                "$project": {
                    "title": { "$ifNull": ["$promotionDetails.title." + languageCode, "$promotionDetails.title.en"] },
                    "date": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotions.to" } },
                    "amount": '$promotions.promotion_amount', "promotion_id": "$promotions.promotion_id",
                    "target_amount": "$promotionDetails.target_amount",
                    "promotion_image": "$promotionDetails.promotion_image",
                    "promotion_type": "$promotionDetails.promotion_type",
                    "valid_from": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotionDetails.valid_from" } },
                    "valid_up_to": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotionDetails.valid_up_to" } }
                }
            }
        ], function (err, response) {

            return callback(response);
        });
    }, vendorpaidamount: function (vendorId) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        
        return db.vendoronlinepayment.aggregate([{
            "$match": {"VendorId" : vendor,"paymentstatus" : "success"}
        },
        {
            "$group": {
                "_id": "$VendorId", 
                "vendorpaidprice": { "$sum": { "$ifNull": ["$paidPrice", 0] } }
            }
        },
        { "$project": { "_id": "$_id", "vendorpaidprice": "$vendorpaidprice" } }])
    }

};
