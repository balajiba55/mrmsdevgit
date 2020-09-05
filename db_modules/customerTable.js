var db = require('../db');
var mongoose = require('mongoose');
module.exports =
{
    status: {
        "0": {
            status: 0, "value": "gifited user need to verifiy the user", send: { status: 1, message: "otp verification", success: true }
        }, "1": {
            status: 1, "value": "otp verification", send: { status: 1, message: "otp verification", success: true }
        },
        "2": {
            status: 2, "value": "email updated", send: { status: 2, message: "email updated", success: true }
        },
        "3": {
            status: 3, value: "password", send: { status: 3, message: "password update", success: true }
        },
        "4": {
            status: 4, value: "profile updated", send: { status: 4, message: "profile updated", success: true }
        },
        "5": {
            status: 5, value: "login", send: { status: 4, message: "login", success: true }
        }
    },
    loginType: { fackebook: 1, gmail: 2, instagram: 3, twitter: 4, linkedin: 5, snapchat: 6 },
    statusCodes: [1, 2, 3, 4, 5],
    validPaymentModes: [1, 2],
    paymentMode: {
        "card": 1,
        "cash": 2
    },
    save: function (values, callback) {
        var user = new db.customers(values);
        user.save(function (err, response) {
            callback(response);
        });
    }, saveWithPromises: function (values) {

        return new Promise(function (resolve) {
            var user = new db.customers(values);

            user.save(function (err, response) {

                resolve(response);
            });
        });
    },
    select: function (callback) {

        db.customers.find(function (err, response) {
            callback(response);
        });
    },
    find: function (check, callback) {

        db.customers.find(check, function (err, response) {

            callback(response);
        });
    },
    findFields: function (check, fields, callback) {

        db.customers.find(check, fields, function (err, response) {
            callback(response);
        });
    },
    update: function (data, where, callback) {
        data['updated'] = Date.now();
        db.customers.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

            callback(response);
        });
    }, updateRemind: function (data, where, callback) {

        db.customers.update(where, { $set: data }, { new: true }, function (err, response) {

            callback(response);

        });
    }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {

            db.customers.find(check, fields, function (err, response) {
                resolve(response);
            });
        });
    }, updateInvite: function (data, where) {
        return new Promise(function (resolve) {

            db.customers.update(where, { $addToSet: { "invite": data } }, { new: true }, function (err, response) {
                return resolve(response);

            });

        })
    }, updateArrays: function (data, where) {
        return new Promise(function (resolve) {

            db.customers.update(where, { $push: data }, { new: true }, function (err, response) {
                return resolve(response);

            });
        })
    }, updateReferAmountWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.customers.findOneAndUpdate(where, { $inc: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    },
    inviteCodeDetails: function (userId, languageCode, callback) {

        var user = mongoose.Types.ObjectId(userId);
        db.customers.aggregate([
            { "$match": { "_id": user } },
            { "$unwind": { "path": "$invite", "preserveNullAndEmptyArrays": true } },
            { "$lookup": { "from": "customers", "localField": "invite.customer_id", "foreignField": "_id", "as": "inviteDetails" } },
            { "$unwind": { "path": "$inviteDetails", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": '$invite_code',
                    "referral_invite_code": { "$first": "$referral_invite_code" },
                    "referral_amount": { "$first": "$referral_amount" },
                    "invites": {
                        "$push": {
                            "_id": "$invite.customer_id",
                            "first_name": { "$ifNull": ["$inviteDetails.first_name." + languageCode, ''] },
                            "last_name": { "$ifNull": ["$inviteDetails.last_name." + languageCode, ''] },
                            "remind": "$invite.remind",
                            "status": { "$ifNull": ["$inviteDetails.status", 0] },
                            "amount": { "$cond": [{ "$eq": ["$inviteDetails._id", "$_id"] }, "$referral_amount", "$invite.amount"] },
                            'profile_pic': { "$ifNull": ["$inviteDetails.profile_pic", ''] },
                            "created": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } }
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "referral_invite_code": { "$ifNull": ["$referral_invite_code", ''] },
                    "referral_amount": { "$ifNull": ["$referral_amount", 0] },
                    "invite_code": "$_id",
                    "invited_users": {
                        "$filter": {
                            "input": "$invites", "as": "details",
                            "cond": { "$ne": ["$$details.first_name." + languageCode, ''] }
                        }
                    }
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, updateWithPromises: function (data, where) {
        data['updated'] = Date.now();
        return new Promise(function (resolve) {
            db.customers.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

                resolve(response);

            });
        });
    }, updateAddToSet: function (data, where) {
        return new Promise(function (resolve) {
            db.customers.update(where, { $addToSet: data }, { new: true }, function (err, response) {
                return resolve(response);
            });
        })
    }, getCustomersDetailsForSalon: function (salonId, customerId, callback) {
        var user = mongoose.Types.ObjectId(customerId);
        var salon = mongoose.Types.ObjectId(salonId);

        db.customers.aggregate([
            { "$match": { "_id": user } },
            {
                "$lookup": {
                    "from": "coupons", "let": { "coupon_id": "$_id", "customer_id": "$_id" },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$eq": [salon, "$salon_id"] },

                                    ]
                                }
                            }
                        },
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "coupon_code": "$couponDetails.coupon_code", "customer_id": "$_id" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$coupon_code", "$coupon"] }, { "$eq": ["$$customer_id", "$customer_id"] }] } } },
                                { "$group": { "_id": "$coupon", "count": { "$sum": 1 } } }
                                ], "as": "bookingDetails"
                            }
                        },
                        { "$unwind": { "path": "$bookingDetails", "preserveNullAndEmptyArrays": true } },
                        {
                            "$project": {
                                "_id": "$salon_id", "coupon_title": "$title.en",
                                "coupon_path": "$coupon_image", "coupon_used": { "$ifNull": ["$bookingDetails.count", 0] }
                            }
                        }
                    ],
                    "as": "couponDetails"
                }
            },
            { "$unwind": { "path": "$couponDetails", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": "$_id", "customer_details": {
                        "$first": {
                            "name": { "$concat": ["$first_name", ' ', "$last_name"] },
                            "profile_pic": "$profile_pic", "mobile": "$mobile", "mobile_country": "$mobile_country"
                        }
                    },
                    "coupon_details": { "$push": "$couponDetails" }
                }
            },
            {
                "$lookup": {
                    "from": "bookings", "let": { "customer_id": "$_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$customer_id", "$customer_id"] }] } } },
                    {
                        "$group": {
                            "_id": "$customer_id", "booking_amount": { "$sum": "$net_amount" },
                            "bookings_count": { "$sum": 1 }
                        }
                    }], "as": "bookings"
                }
            },
            { "$unwind": { "path": "$bookings", "preserveNullAndEmptyArrays": true } },
            {
                "$project": {
                    "customer_details": {
                        "name": "$customer_details.name", "mobile": "$customer_details.mobile", "mobile_country": "$customer_details.mobile_country",
                        "profile_pic": "$custome_details.profile_pic", "booking_amount": { "$ifNull": ["$bookings.booking_amount", 0] },
                        "bookings": { "$ifNull": ["$bookings.bookings_count", 0] }
                    }, "coupons": { "$ifNull": ["$coupon_details", []] }
                }
            }

        ], function (err, response) {

            return callback(response);
        });
    }, getCustomerProfiles: function (tmUsers, languageCode, callback) {
        db.customers.aggregate(
            [
                { "$match": { "tm_user_id": { "$in": tmUsers } } },
                {
                    "$project": {
                        "name": { "$concat": ["$first_name." + languageCode, " ", "$last_name." + languageCode] },
                        "profile_pic": { "$ifNull": ["$profile_pic", ""] },
                        "tm_user_id": "$tm_user_id"
                    }
                }

            ], function (err, response) {

                return callback(response);
            });
    }, getPaymentCard: function (customerId) {
        var customer = mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {
            db.customers.aggregate([
                { "$match": { "_id": customer } },
                { "$unwind": "$payment" },
                { "$match": { "payment.status": 1 } },
                {
                    "$group": {
                        "_id": "$_id"
                        , "payment": { "$push": { "_id": "$payment._id", "last4": "$payment.last4", "brand": "$payment.brand", "is_primary": { "$ifNull": ["$payment.is_primary", 0] } } }
                    }
                },

            ], function (err, response) {

                return resolve(response);
            })
        });

    }, getPaymentDefaultCard: function (customerId) {
        var customer = mongoose.Types.ObjectId(customerId);
        return new Promise(function (resolve) {
            db.customers.aggregate([
                { "$match": { "_id": customer } },
                { "$unwind": "$payment" },
                { "$match": { "payment.status": 1, "payment.is_primary": 1 } },
                { "$project": { "payment": { "_id": "$payment._id", "last4": "$payment.last4", "status": "$payment.status", "brand": "$payment.brand", "is_primary": { "$ifNull": ["$payment.is_primary", 0] } } } },

            ], function (err, response) {

                return resolve(response);
            })
        });

    }, getPaymentCardDetails: function (customerId, cardId) {
        var customer = mongoose.Types.ObjectId(customerId);
        var card = mongoose.Types.ObjectId(cardId);
        return new Promise(function (resolve) {
            db.customers.aggregate([
                { "$match": { "_id": customer } },
                { "$unwind": "$payment" },
                { "$match": { "payment._id": card } },
                { "$project": { "_id": 0, "strip_id": 1, "payment": { "_id": "$payment._id", "last4": "$payment.last4", "brand": "$payment.brand", "is_primary": "$payment.is_primary", "id": "$payment.id" }, "status": "$payment.status" } },

            ], function (err, response) {

                return resolve(response);
            })
        });

    }, getUserDefaultCardDetails: function (customerId, cardId) {
        var customer = mongoose.Types.ObjectId(customerId);

        return new Promise(function (resolve) {
            db.paymentcard.find({ "UserId": customerId, status: 1 }).lean().exec((err, response) => {
                return resolve(response);
            })

        });

    }, getbasketdata: async function (basketitem, cardId) {
        var cartid = mongoose.Types.ObjectId(basketitem);
        var response = await db.cart.find({ _id: cartid }).lean().exec()
        var vendorbankdetails = await db.vendorbankdetails.find({ vendorId: response[0].vendor_id, "status": true }).lean().exec()
        var bookkingPercentage = await db.constants.find({constant_type : 1}).sort({ _id: -1 }).limit(1).lean().exec();
        var obj = {};
        obj.response = response,
            obj.vendorbankdetails = vendorbankdetails,
            obj.bookkingPercentage = bookkingPercentage
        return obj;
    }, getbasketdataforcancelamount: async function (vendorId) {
        var vendorbankdetails = await db.vendorbankdetails.find({ vendorId: vendorId, "status": true }).lean().exec()
        
        var bookkingPercentage = await db.constants.find({constant_type : 1}).sort({ _id: -1 }).limit(1).lean().exec();
        var obj = {};
        obj.vendorbankdetails = vendorbankdetails,

            obj.bookkingPercentage = bookkingPercentage
        return obj;
    }, getbookingpercentage: async function () {
      
        var bookkingPercentage = await db.constants.find({constant_type : 1}).sort({ _id: -1 }).limit(1).lean().exec();
        
        return bookkingPercentage;
    }, getotp: function (obj, callback) {
        console.log("obj", obj)
        db.customers.find(obj, function (err, response) {
            callback(response);
        });
    }, getvendorotp: function (obj, callback) {
        console.log("obj", obj)
        db.vendor.find(obj, function (err, response) {
            callback(response);
        });
    }, deleteuser: async function (obj, callback) {
        console.log("obj", obj);
        var userdata = await db.customers.find(obj).lean().exec();
        if (!userdata || !userdata[0]) {
            callback("nouser");
        } else {
            var customer_id = new mongoose.Types.ObjectId(userdata[0]._id);
            var bookingdata = await db.bookings.find({ customer_id: customer_id }).lean().exec();
            if (bookingdata && bookingdata.length > 0) {
                callback("bookings");

            } else {
                db.customers.remove(obj, function (err, response) {
                    callback(response);
                });
            }
        }



    }, deletevendor: async function (obj, callback) {

        var vendordata = await db.vendor.find(obj).lean().exec();
        if (!vendordata || !vendordata[0]) {
            callback("nouser");
        } else {
            var vendor_id = new mongoose.Types.ObjectId(vendordata[0]._id);
            var bookingdata = await db.bookings.find({ vendor_id: vendor_id }).lean().exec();
console.log("bookingdata.length>>>>>>>>>>>",bookingdata.length)
            if (bookingdata && bookingdata.length > 0) {
                callback("bookings");

            } else {

                db.vendor.remove(obj, function (err, response) {
                    callback(response);
                });
            }
        }


    }


};
