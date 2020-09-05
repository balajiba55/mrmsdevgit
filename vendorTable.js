var db = require('../db');
var mongoose = require('mongoose');
var moment = require('moment-timezone');

module.exports =
{
    status: {
        "1": {
            status: 1, "value": "otp verification"
        },
        "2": {
            status: 2, "value": "registered"
        },
        "3": {
            status: 3, "value": "Basic Details"
        },
        "4": {
            status: 4, "value": "Salon info"
        },
        "5": {
            status: 5, "value": "salon Pitures"
        }, "6": {
            status: 6, "value": "portfolio"
        }, "7": {
            status: 7, "value": "Documents"
        }, "8": {
            status: 8, "value": "cancellation policy"
        }, "9": {
            status: 9, "value": "agreement"
        }, "10": {
            status: 10, "value": "login"
        }, "11": {
            status: 11, "value": "login"
        }, "12": {
            status: 12, "value": "login"
        }, "13": {
            status: 13, "value": "login"
        }, "14": {
            status: 14, "value": "login"
        }, "15": {
            status: 15, "value": "register"
        }
    },
    findFieldsWithPromises: function (check, fields) {
        return new Promise(function (resolve) {

            db.vendor.find(check, fields, function (err, response) {

                resolve(response);
            });
        });
    },
    updateStatus: function (data, where, callback) {
        db.vendor.update(where, {
            '$set':
                data
        }, { new: true }, function (err, reponse) {
            return callback(reponse);
        })
    },
    type: { stylist: 1, salon: 2, serveOutEmployee: 3, salonBranchAdmin: 4 },
    save: function (values, callback) {


        var user = new db.vendor(values);


        user.save(function (err, response) {

            callback(response);
        });
    },
    select: function (callback) {

        db.vendor.find(function (err, response) {
            callback(response);
        });
    },
    find: function (check, callback) {

        db.vendor.find(check, function (err, response) {
            callback(response);
        });
    },
    findFields: function (check, fields, callback) {
        db.vendor.find(check, fields, function (err, response) {
            return callback(response);
        });
    },
    update: function (data, where, callback) {

        db.vendor.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {

            if (err) {
                callback(null);
            }

            callback(response);

        });
    },
    getVendor: function (vendorId) {
        var id = mongoose.Types.ObjectId(vendorId);

    },

    getVendorDetails: function (vendorId, languageCode, callback) {
        var id = mongoose.Types.ObjectId(vendorId);

        db.vendor.aggregate([{ "$match": { "_id": id } },
        { "$lookup": { "from": "stylist", "localField": "_id", "foreignField": "vendor_id", "as": "stylist" } },
        { "$unwind": "$stylist" },
        { "$graphLookup": { "from": "services", "startWith": "$stylist.expertise", "connectFromField": "stylist.expertise", "connectToField": "_id", "as": "expertise" } },
        { "$graphLookup": { "from": "languages", "startWith": "$stylist.languages_speak", "connectFromField": "stylist.languages_speak", "connectToField": "_id", "as": "languages_speak" } },
        { "$unwind": { "path": "$stylist.languages_speak", "preserveNullAndEmptyArrays": true } },
        {
            "$lookup": {
                "from": "stylistDocuments", "let": { "vendor_id": "$_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$type", 2] }, { "$eq": ["$vendor_id", "$$vendor_id"] }] } } }],
                "as": "certificates"
            }
        },
        { "$lookup": { "from": "portfolio", "localField": "_id", "foreignField": "vendor_id", "as": "portfolio" } },
        {
            "$lookup": {
                "from": "stylistServices", "let": { 'vendor_id': "$_id" },
                "pipeline": [{
                    "$match": {
                        "$expr": {
                            "$and": [
                                { "$ne": ["$status", 0] },
                                { "$eq": ["$vendor_id", "$$vendor_id"] }
                            ]
                        }
                    }
                }],
                "as": "stylistServices"
            }
        },
        {
            "$project": {
                "_id": "$_id", "vendor": {
                    "vendor_id": "$_id", "vendor_name": { "$concat": ["$first_name." + languageCode, "  ", "$last_name." + languageCode] },
                    "profile_pic": "$profile_pic", "intro": "$stylist.intro." + languageCode,
                    "services": { "$size": "$stylistServices" }, "service_for": "$services_for"
                },
                "expertise": "$expertise.service_name." + languageCode, "languages_speak": "$languages_speak.language." + languageCode,
                "certificates": { "$ifNull": ["$certificates.document_name." + languageCode, ""] }, "portfolio": "$portfolio.file_path"
            }
        },
        {
            "$lookup": {
                "from": "rating", "let": { "vendor_id": "$_id" }, "pipeline": [{
                    "$match": {
                        "$expr": {
                            "$and":
                                [{ "$eq": ["$vendor_id", "$$vendor_id"] }, { "$eq": ["$rated_by", 1] }]
                        }
                    }
                }
                ], "as": "rating"
            }
        },
        {
            "$group": {
                "_id": "$_id", "vendor": { "$first": "$vendor" },
                "expertise": { "$first": "$expertise" },
                "portfolio": { "$first": "$portfolio" },
                "languages_speak": { "$first": "$languages_speak" },
                "certificates": { "$first": "$certificates" },
                "rating": { "$first": "$rating" }
            }
        },

        { "$lookup": { "from": "vendorLocation", "localField": "_id", "foreignField": "vendor_id", "as": "location" } },
        { "$unwind": { "path": "$location", "preserveNullAndEmptyArrays": true } },
        {
            "$lookup": {
                "from": "bookings", "let": { "vendor_id": "$_id" },
                "pipeline": [{
                    "$match": {
                        "$expr": {
                            "$and": [{ "$eq": ['$$vendor_id', "$vendor_id"] },
                            { "$eq": ["$status", 8] }]
                        }
                    }
                }], "as": "bookingsDetails"
            }
        },
        {
            "$project":
            {
                "1": {
                    "$size": {
                        "$ifNull": [{
                            "$filter": {
                                "input": "$rating", "as": "one",
                                "cond": { "$and": [{ "$gte": ["$$one.rating", 0] }, { "$lt": ["$$one.rating", 2] }] }
                            }
                        }, []]
                    }
                },
                "2": {
                    "$size": {
                        "$ifNull": [{
                            "$filter": {
                                "input": "$rating", "as": "two",
                                "cond": { "$and": [{ "$gte": ["$$two.rating", 2] }, { "$lt": ["$$two.rating", 3] }] }
                            }
                        }, []]
                    }
                }
                , "3": {
                    "$size": {
                        "$ifNull": [{
                            "$filter": {
                                "input": "$rating", "as": "three",
                                "cond": { "$and": [{ "$gte": ["$$three.rating", 3] }, { "$lt": ["$$three.rating", 4] }] }
                            }
                        }, []]
                    }
                },
                "4": {
                    "$size": {
                        "$ifNull": [{
                            "$filter": {
                                "input": "$rating", "as": "four",
                                "cond": { "$and": [{ "$gte": ["$$four.rating", 4] }, { "$lt": ["$$four.rating", 5] }] }
                            }
                        }, []]
                    }
                },
                "5": {
                    "$size": {
                        "$ifNull": [{
                            "$filter": {
                                "input": "$rating", "as": "five",
                                "cond": { "$and": [{ "$eq": ["$$five.rating", 5] }] }
                            }
                        }, []]
                    }
                },
                "totalrating": { "$avg": "$rating.rating" }, "vendor": "$vendor",
                "location": {
                    "latitude": { "$arrayElemAt": ["$location.location.coordinates", 1] },
                    "longitude": { "$arrayElemAt": ["$location.location.coordinates", 0] }
                }, "languages_speak": "$languages_speak",
                "expertise": "$expertise", "portfolio": "$portfolio",
                "certificates": { "$ifNull": ["$certificates", []] },
                "bookings": { "$size": "$bookingsDetails" }
            }
        },
        {
            "$lookup": {
                "from": "stylistServices", "let": { "vendor_id": "$_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] }, { "$ne": ["$status", 0] }] } } },
                { "$group": { "_id": "$vendor_id", "service_for": { $addToSet: "$service_for" } } }
                ], "as": "stylistServices"
            }
        },
        { "$unwind": "$stylistServices" },
        {
            "$project": {
                "_id": 0, "location": "$location", "vendor": "$vendor",
                "expertise": { "$ifNull": ["$expertise", []] },
                "languages_speak": { "$ifNull": ["$languages_speak", []] },
                "portfolio": { "$ifNull": ["$portfolio", []] },
                "bookings": { "$ifNull": ['$bookings', 0] },
                "service_for": "$stylistServices.service_for",
                "certificates": { "$ifNull": ["$certificates", []] },
                "rating": {
                    "1": "$1", "2": "$2", "3": "$3", "4": "$4", "5": "$5",
                    "totalrating": { "$ifNull": ["$totalrating", 0] },
                    "total_review": { "$sum": ['$1', '$2', '$3', '$4', '$5'] }
                }
            }
        }

        ]).allowDiskUse(true).exec(function (err, response) {

            return callback(response);
        });
    },
    getVendorServiceDetails: function (customerId, vendorId, cityId, filter, callback) {

        var customer = mongoose.Types.ObjectId(customerId);
        var vendor = mongoose.Types.ObjectId(vendorId);
        var city = mongoose.Types.ObjectId(cityId);
        var sort = 0;
        var levels = {};
        var duration = [];
        var levelCondition = [];
        var keys = '';
        var womenSortCategory = '';
        var womenStage = [];
        var girlStage = [];
        var menStage = [];
        var boyStage = [];

        if (Object.keys(filter).length != 0) {
            if (filter.sort != undefined) {
                sort = filter.sort;
            } else {
                sort = 0;
            }

            if (filter.levels != undefined) {
                levels = filter.levels;
            }
            if (filter.duration != undefined) {

                duration = filter.duration;
            }
        }
        womenStage =
            [{ "$unwind": "$vendorServices" },
            { "$match": { "vendorServices.service_for": 1 } },
            {
                "$lookup": {
                    "from": "services", "let": { "service_id": "$vendorServices.service_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } },
                    {
                        "$project": {
                            "_id": 1, "category_id": 1, "sort": "$sort", "service_name": 1, "service_description": 1, "status": 1, "service_for": 1, "created": 1,
                            "service_prices": {
                                "$filter": {
                                    "input": "$service_prices", "as": "prices", "cond":
                                        { "$eq": ["$$prices.city", city] }
                                }
                            }
                        }
                    }
                    ],
                    "as": "servicesData"
                }
            },
            { "$unwind": "$servicesData" },
            { '$lookup': { from: 'category', "let": { "category_id": "$servicesData.category_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$category_id", "$_id"] }, { "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }] }] } } }], as: 'category' } },
            { "$unwind": "$category" },
            {
                '$lookup': {
                    from: 'cart', let: { service_id: '$servicesData._id' },
                    pipeline: [{
                        '$match': {
                            '$expr': {
                                '$and': [{ '$eq': ['$service_id', '$$service_id'] },
                                { '$eq': ['$customer_id', customer] }, { "$eq": ["$status", 1] }, { "$eq": ["$cart_type", 1] }]
                            }
                        }
                    }], as: 'cartValues'
                }
            },
            { "$match": { "$and": [{ "category.category_for": { "$in": [1] } }], "servicesData.service_prices": { "$elemMatch": { "1": { "$exists": true } } } } },
            ];



        womenStage.push({ "$unwind": "$servicesData.service_prices" });

        /* if(sort!=0)
         {
             womenSortCategory={"$sort":{"servicesData.service_prices.duration.1":-1}};
             womenStage.push(womenSortCategory);
         }else
         {
             womenStage.push({"$sort":{"servicesData.sort.1":1}});

             womenStage.push({"$sort":{"category.sort.1":1}});
         }*/

        if (sort != 0) {
            sort = parseInt(sort);
            if (sort == 1) {
                womenSortCategory = { "$sort": { "servicesData.service_prices.duration.1": -1 } };
                womenStage.push(womenSortCategory);
            } else {

                womenSortCategory = { "$sort": { "servicesData.service_prices.duration.1": 1 } };
                womenStage.push(womenSortCategory);
            }
        } else {
            womenStage.push({ "$sort": { "servicesData.sort.1": 1 } });

        }


        if (Object.keys(levels).length != 0) {
            levelCondition = [];
            for (var k in levels) {


                var minvalue = parseFloat(levels[k][0]);
                var maxvalue = parseFloat(levels[k][1]);
                k = parseInt(k);
                levelCondition.push({ "$and": [{ "$gte": ['$servicesData.service_prices.1.' + k + '', minvalue] }, { "$lte": ['$servicesData.service_prices.1.' + k + '', maxvalue] }] });
            }
            var womenLevelCondition = { "$match": { "$expr": { "$and": [{ "$and": levelCondition }] } } };
            womenStage.push(womenLevelCondition);

        }
        if (duration.length != 0) {

            var minDuration = parseInt(duration[0]);
            var maxDuration = parseInt(duration[1]);

            womenStage.push({ "$match": { "$expr": { "$and": [{ "$gte": ["$servicesData.service_prices.duration.1", minDuration] }, { "$lte": ["$servicesData.service_prices.duration.1", maxDuration] }] } } })
        }

        var womenGroupStage = {
            "$group": {
                "_id": "$category._id",
                "category": {
                    "$first": {
                        "category_name": "$category.category_name",
                        "category_id": "$category._id",
                        "url": "$category.url",
                        "sort": "$category.sort",
                        "video_url": "$category.video"
                    }
                },
                "services": {
                    "$push": {
                        "service_id": "$servicesData._id", "service_name": "$servicesData.service_name",
                        "service_prices": "$servicesData.service_prices.1",
                        "duration": "$servicesData.service_prices.duration",
                        "service_quantity": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 1] }, "$cartValues.quantity", 0]
                        },
                        "selected_service_level": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 1] }, "$cartValues.selected_service_level", 0]
                        },

                        "cartValue": { "$ifNull": [{ "$arrayElemAt": [{ "$filter": { "input": "$cartValues", "as": "cart", "cond": { "$eq": ["$$cart.selected_for", 1] } } }, 0] }, {}] }
                        , "levels": '$vendorServices.service_levels'
                    }
                }
            }
        };
        womenStage.push(womenGroupStage);
        if (sort != 0) {

            if (sort == 1) {

                var womenSortServices = { "$sort": { "services.service_prices.duration.1": -1 } };
            } else {
                var womenSortServices = { "$sort": { "services.service_prices.duration.1": 1 } };
            }
            womenStage.push(womenSortServices);
        } else {
            womenStage.push({ "$sort": { "services.sort.1": 1 } });
            womenStage.push({ "$sort": { "category.sort.1": 1 } });
        }




        // girl services conditon


        girlStage = [{ "$unwind": "$vendorServices" },
        { "$match": { "vendorServices.service_for": 2 } },
        {
            "$lookup": {
                "from": "services", "let": { "service_id": "$vendorServices.service_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } },
                {
                    "$project": {
                        "_id": 1, "category_id": 1, "service_name": 1, "sort": 1, "service_description": 1, "status": 1, "service_for": 1, "created": 1,
                        "service_prices": {
                            "$filter": {
                                "input": "$service_prices", "as": "prices", "cond":
                                    { "$eq": ["$$prices.city", city] }
                            }
                        }
                    }
                }
                ],
                "as": "servicesData"
            }
        },
        { "$unwind": "$servicesData" },
        { '$lookup': { from: 'category', "let": { "category_id": "$servicesData.category_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$category_id", "$_id"] }, { "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }] }] } } }], as: 'category' } },
        { "$unwind": "$category" },
        {
            '$lookup': {
                from: 'cart', let: { service_id: '$servicesData._id' },
                pipeline: [{
                    '$match': {
                        '$expr': {
                            '$and': [{ '$eq': ['$service_id', '$$service_id'] },
                            { '$eq': ['$customer_id', customer] }, { "$eq": ["$status", 1] }, { "$eq": ["$cart_type", 1] }]
                        }
                    }
                }], as: 'cartValues'
            }
        },
        { "$match": { "$and": [{ "category.category_for": { "$in": [2] } }], "servicesData.service_prices": { "$elemMatch": { "2": { "$exists": true } } } } },
        ];

        girlStage.push({ "$unwind": "$servicesData.service_prices" });
        /* if(sort!=0)
         {

             var girlSortCategory={"$sort":{"servicesData.service_prices.duration.2":-1}};

             girlStage.push(girlSortCategory);

         }else
         {
             girlStage.push({"$sort":{"servicesData.sort.2":1}})
         }*/


        if (sort != 0) {
            var girlSortCategory = '';
            sort = parseInt(sort);
            if (sort == 1) {
                girlSortCategory = { "$sort": { "servicesData.service_prices.duration.2": -1 } };
                girlStage.push(girlSortCategory);
            } else {

                girlSortCategory = { "$sort": { "servicesData.service_prices.duration.2": 1 } };
                girlStage.push(girlSortCategory);
            }
        } else {
            girlStage.push({ "$sort": { "servicesData.sort.2": 1 } })
        }




        if (Object.keys(levels).length != 0) {
            levelCondition = [];
            for (var k in levels) {


                var minvalue = parseFloat(levels[k][0]);
                var maxvalue = parseFloat(levels[k][1]);
                k = parseInt(k);
                levelCondition.push({
                    "$and": [{ "$gte": ['$servicesData.service_prices.2.' + k + '', minvalue] },
                    { "$lte": ['$servicesData.service_prices.2.' + k + '', maxvalue] }]
                });
            }
            var girlLevelCondition = { "$match": { "$expr": { "$and": [{ "$and": levelCondition }] } } };
            girlStage.push(girlLevelCondition);

        }
        if (duration.length != 0) {
            var minDuration = parseInt(duration[0]);

            var maxDuration = parseInt(duration[1]);
            girlStage.push({
                "$match": {
                    "$expr": {
                        "$and": [{ "$gte": ["$servicesData.service_prices.duration.2", minDuration] },
                        { "$lte": ["$servicesData.service_prices.duration.2", maxDuration] }]
                    }
                }
            })
        }
        var girlGroupStage = {
            "$group": {
                "_id": "$category._id",
                "category": {
                    "$first": {
                        "category_name": "$category.category_name",
                        "category_id": "$category._id",
                        "url": "$category.url",
                        "sort": "$category.sort",
                        "video_url": "$category.video"
                    }
                },
                "services": {
                    "$push": {
                        "service_id": "$servicesData._id", "service_name": "$servicesData.service_name", "service_prices": "$servicesData.service_prices.2",
                        "duration": "$servicesData.service_prices.duration",

                        "service_quantity": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 2] }, "$cartValues.quantity", 0]
                        },
                        "selected_service_level": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 2] }, "$cartValues.selected_service_level", 0]
                        },

                        "cartValue": { "$ifNull": [{ "$arrayElemAt": [{ "$filter": { "input": "$cartValues", "as": "cart", "cond": { "$eq": ["$$cart.selected_for", 2] } } }, 0] }, {}] }
                        , "levels": '$vendorServices.service_levels'
                    }
                }
            }
        };
        girlStage.push(girlGroupStage);
        if (sort != 0) {
            sort = parseInt(sort);

            if (sort == 1) {
                var girlSortServices = { "$sort": { "services.service_prices.duration.2": -1 } };
            } else {
                var girlSortServices = { "$sort": { "services.service_prices.duration.2": 1 } };
            }

            girlStage.push(girlSortServices);
        } else {
            girlStage.push({ "$sort": { "services.sort.2": 1 } });
            girlStage.push({ "$sort": { "category.sort.2": 1 } });
        }
        menStage = [{ "$unwind": "$vendorServices" },
        { "$match": { "vendorServices.service_for": 3 } },
        {
            "$lookup": {
                "from": "services", "let": { "service_id": "$vendorServices.service_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } },
                {
                    "$project": {
                        "_id": 1, "category_id": 1, "service_name": 1, "sort": 1, "service_description": 1, "status": 1, "service_for": 1, "created": 1,
                        "service_prices": {
                            "$filter": {
                                "input": "$service_prices", "as": "prices", "cond":
                                    { "$eq": ["$$prices.city", city] }
                            }
                        }
                    }
                }
                ],
                "as": "servicesData"
            }
        },
        { "$unwind": "$servicesData" },
        { '$lookup': { from: 'category', "let": { "category_id": "$servicesData.category_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$category_id", "$_id"] }, { "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }] }] } } }], as: 'category' } },
        { "$unwind": "$category" },
        {
            '$lookup': {
                from: 'cart', let: { service_id: '$servicesData._id' },
                pipeline: [{
                    '$match': {
                        '$expr': {
                            '$and': [{ '$eq': ['$service_id', '$$service_id'] },
                            { '$eq': ['$customer_id', customer] }, { "$eq": ["$status", 1] }, { "$eq": ["$cart_type", 1] }]
                        }
                    }
                }], as: 'cartValues'
            }
        },
        { "$match": { "$and": [{ "category.category_for": { "$in": [3] } }], "servicesData.service_prices": { "$elemMatch": { "3": { "$exists": true } } } } },
        ];
        menStage.push({ "$unwind": "$servicesData.service_prices" });

        /*  if(sort!=0){
              var menSortCategory={"$sort":{"servicesData.service_prices.duration.3":-1}};
              menStage.push(menSortCategory);
          }else
          {
              menStage.push({"$sort":{"sort.3":1}})
          }*/
        if (sort != 0) {
            var menSortCategory = '';
            sort = parseInt(sort);
            if (sort == 1) {
                menSortCategory = { "$sort": { "servicesData.service_prices.duration.3": -1 } };
                menStage.push(menSortCategory);
            } else {

                menSortCategory = { "$sort": { "servicesData.service_prices.duration.3": 1 } };
                menStage.push(menSortCategory);
            }
        } else {
            menStage.push({ "$sort": { "servicesData.sort.3": 1 } })
        }


        if (Object.keys(levels).length != 0) {
            //keys=Object.keys(levels);

            levelCondition = [];
            for (var k in levels) {
                var minvalue = parseFloat(levels[k][0]);
                var maxvalue = parseFloat(levels[k][1]);
                k = parseInt(k);
                levelCondition.push({
                    "$and": [{ "$gte": ['$servicesData.service_prices.3.' + k + '', minvalue] },
                    { "$lte": ['$servicesData.service_prices.3.' + k + '', maxvalue] }]
                });
            }
            var menLevelCondition = { "$match": { "$expr": { "$and": [{ "$or": levelCondition }] } } };
            menStage.push(menLevelCondition);
        }
        if (duration.length != 0) {
            var minDuration = parseInt(duration[0]);
            var maxDuration = parseInt(duration[1]);
            menStage.push({
                "$match": {
                    "$expr": {
                        "$and": [{ "$gte": ["$servicesData.service_prices.duration.3", minDuration] },
                        { "$lte": ["$servicesData.service_prices.duration.3", maxDuration] }]
                    }
                }
            })
        }
        var menGroupStage = {
            "$group": {
                "_id": "$category._id",
                "category": {
                    "$first": {
                        "category_name": "$category.category_name",
                        "category_id": "$category._id",
                        "url": "$category.url",
                        "sort": "$category.sort",
                        "video_url": "$category.video"
                    }
                },
                "services": {
                    "$push": {
                        "service_id": "$servicesData._id", "service_name": "$servicesData.service_name",
                        "service_prices": "$servicesData.service_prices.3",
                        "duration": "$servicesData.service_prices.duration",

                        "service_quantity": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 3] }, "$cartValues.quantity", 0]
                        },
                        "selected_service_level": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 3] }, "$cartValues.selected_service_level", 0]
                        },

                        "cartValue": { "$ifNull": [{ "$arrayElemAt": [{ "$filter": { "input": "$cartValues", "as": "cart", "cond": { "$eq": ["$$cart.selected_for", 3] } } }, 0] }, {}] }
                        , "levels": '$vendorServices.service_levels'
                    }
                }
            }
        };
        menStage.push(menGroupStage);
        if (sort != 0) {
            sort = parseInt(sort);

            if (sort == 1) {
                var menSortServices = { "$sort": { "services.service_prices.duration.3": -1 } };
            } else {
                var menSortServices = { "$sort": { "services.service_prices.duration.3": 1 } };
            }

            menStage.push(menSortServices);
        } else {
            menStage.push({ "$sort": { "services.sort.3": 1 } });
            menStage.push({ "$sort": { "category.sort.3": 1 } });
        }


        boyStage = [{ "$unwind": "$vendorServices" },

        { "$match": { "vendorServices.service_for": 4 } },
        {
            "$lookup": {
                "from": "services", "let": { "service_id": "$vendorServices.service_id" },
                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$service_id", "$_id"] }] } } },
                {
                    "$project": {
                        "_id": 1, "category_id": 1, "sort": 1, "service_name": 1, "service_description": 1, "status": 1, "service_for": 1, "created": 1,
                        "service_prices": {
                            "$filter": {
                                "input": "$service_prices", "as": "prices", "cond":
                                    { "$eq": ["$$prices.city", city] }
                            }
                        }
                    }
                }
                ],
                "as": "servicesData"
            }
        },
        { "$unwind": "$servicesData" },
        { '$lookup': { from: 'category', "let": { "category_id": "$servicesData.category_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$category_id", "$_id"] }, { "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }] }] } } }], as: 'category' } },
        { "$unwind": "$category" },
        {
            '$lookup': {
                from: 'cart', let: { service_id: '$servicesData._id' },
                pipeline: [{
                    '$match': {
                        '$expr': {
                            '$and': [{ '$eq': ['$service_id', '$$service_id'] },
                            { '$eq': ['$customer_id', customer] }, { "$eq": ["$status", 1] }, { "$eq": ["$cart_type", 1] }]
                        }
                    }
                }], as: 'cartValues'
            }
        },



        { "$match": { "$and": [{ "category.category_for": { "$in": [4] } }], "servicesData.service_prices": { "$elemMatch": { "4": { "$exists": true } } } } },
        ];
        boyStage.push({ "$unwind": "$servicesData.service_prices" });
        if (sort != 0) {
            var boySortCategory = { "$sort": { "servicesData.service_prices.duration.4": -1 } };
            boyStage.push(boySortCategory);
        } else {
            boyStage.push({ "$sort": { "servicesData.sort.4": 1 } })
        }
        if (sort != 0) {

            sort = parseInt(sort);
            if (sort == 1) {
                boySortCategory = { "$sort": { "servicesData.service_prices.duration.4": -1 } };
                boyStage.push(boySortCategory);
            } else {

                boySortCategory = { "$sort": { "servicesData.service_prices.duration.4": 1 } };
                boyStage.push(boySortCategory);
            }
        } else {
            boyStage.push({ "$sort": { "servicesData.sort.4": 1 } })
        }

        if (Object.keys(levels).length != 0) {
            levelCondition = [];
            for (var k in levels) {

                var minvalue = parseFloat(levels[k][0]);
                var maxvalue = parseFloat(levels[k][1]);
                k = parseInt(k);
                levelCondition.push({
                    "$and": [{ "$gte": ['$servicesData.service_prices.4.' + k + '', minvalue] },
                    { "$lte": ['$servicesData.service_prices.4.' + k + '', maxvalue] }]
                });
            }

            var boyLevelCondition = { "$match": { "$expr": { "$and": [{ "$or": levelCondition }] } } };
            boyStage.push(boyLevelCondition);

        }
        if (duration.length != 0) {
            var minDuration = parseInt(duration[0]);
            var maxDuration = parseInt(duration[1]);
            boyStage.push({
                "$match": {
                    "$expr": {
                        "$and": [{ "$gte": ["$servicesData.service_prices.duration.4", minDuration] },
                        { "$lte": ["$servicesData.service_prices.duration.4", maxDuration] }]
                    }
                }
            })
        }
        var boyGroupStage = {
            "$group": {
                "_id": "$category._id",
                "category": {
                    "$first": {
                        "category_name": "$category.category_name",
                        "category_id": "$category._id",
                        "url": "$category.url",
                        "sort": "$category.sort",
                        "video_url": "$category.video"
                    }
                },
                "services": {
                    "$push": {
                        "service_id": "$servicesData._id", "service_name": "$servicesData.service_name", "service_prices": "$servicesData.service_prices.4",
                        "duration": "$servicesData.service_prices.duration",

                        "service_quantity": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 4] }, "$cartValues.quantity", 0]
                        },
                        "selected_service_level": {
                            "$cond":
                                [{ "$eq": ["$cartValues.selected_for", 4] }, "$cartValues.selected_service_level", 0]
                        },

                        "cartValue": { "$ifNull": [{ "$arrayElemAt": [{ "$filter": { "input": "$cartValues", "as": "cart", "cond": { "$eq": ["$$cart.selected_for", 4] } } }, 0] }, {}] }
                        , "levels": '$vendorServices.service_levels'
                    }
                }
            }
        };
        boyStage.push(boyGroupStage);
        if (sort != 0) {
            if (sort == 1) {
                var boySortServices = { "$sort": { "services.service_prices.duration.4": -1 } };
            } else {
                var boySortServices = { "$sort": { "services.service_prices.duration.4": 1 } };
            }
            boyStage.push(boySortServices);
        } else {
            boyStage.push({ "$sort": { "services.sort.4": 1 } });
            boyStage.push({ "$sort": { "category.sort.4": 1 } });
        }
        var vendorServicesConditon = [{
            "$match": {
                "$expr": {
                    "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] },
                    { "$ne": ["$status", 0] }]
                }
            }
        }];
        levelCondition = [];
        if (Object.keys(levels).length != 0) {
            levelCondition = [];
            var serviceLevels = [];
            for (var k in levels) {


                k = parseInt(k);
                serviceLevels.push(k);
            }

            levelCondition = { "$match": { "$and": [{ "service_levels": { "$in": serviceLevels } }] } };

            vendorServicesConditon.push(levelCondition);


        }

        db.vendor.aggregate([
            { "$match": { "_id": vendor } },
            {
                "$lookup": {
                    "from": "stylistServices", "let": { "vendor_id": "$_id" },
                    "pipeline": vendorServicesConditon,
                    "as": "vendorServices"
                }
            },
            {
                "$facet": {
                    "women":
                        womenStage
                    , "girl": girlStage, "men": menStage, "boy": boyStage,
                    "country": [
                        {
                            $bucketAuto: {
                                groupBy: "$created_at",
                                buckets: 1
                            }
                        },
                        { "$project": { "_id": 0 } },
                        {
                            "$lookup": {
                                "from": "cities", "pipeline": [{ "$match": { "_id": city } },
                                { "$lookup": { "from": "country", "localField": "country_id", "foreignField": "_id", "as": "country" } }, { "$unwind": "$country" }], "as": "cities"
                            }
                        },
                        { "$unwind": "$cities" },
                        { "$project": { "currency": "$cities.country.currency_symbol", "currency_code": "$cities.country.currency_code" } }

                    ]

                }
            }
        ], function (err, response) {

            return callback(response);
        });

    }, getCurrency: function (vendorId) {
        var vendor = new mongoose.Types.ObjectId(vendorId);

        return new Promise(function (resolve) {

            db.stylist.aggregate([{ "$match": { "vendor_id": vendor } },
            { "$lookup": { "from": "country", "localField": "country", "foreignField": "_id", "as": "countryDetails" } },
            { "$unwind": "$countryDetails" },
            {
                "$project": {
                    "country_id": "$country_id", "city_id": "$city_id", "currency_code": "$countryDetails.currency_code",
                    "currency_symbol": "$countryDetails.currency_symbol", "_id": 0
                }
            }
            ], function (err, response) {
                resolve(response);
            });
        });
    }, getSalonCurrency: function (vendorId) {
        var vendor = new mongoose.Types.ObjectId(vendorId);
        return new Promise(function (resolve) {
            db.vendor.aggregate([{ "$match": { "_id": vendor } },
            { "$lookup": { "from": "country", "localField": "country_id", "foreignField": "_id", "as": "countryDetails" } },
            { "$unwind": "$countryDetails" },
            {
                "$project": {
                    "country_id": "$country_id", "city_id": "$_id", "currency_code": "$countryDetails.currency_code",
                    "currency_symbol": "$countryDetails.currency_symbol", "_id": 0
                }
            }
            ], function (err, response) {
                resolve(response);
            });
        });
    }, getVendorServices: function (vendorId, languageCode, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.vendor.aggregate([{ "$match": { "_id": vendor } },
        {
            "$lookup": {
                "from": "vendorLocation", "let": { "vendor_id": "$_id" }, "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$vendor_id"] }] } } },
                { "$project": { "latitude": { "$arrayElemAt": ["$location.coordinates", 1] }, "longitude": { "$arrayElemAt": ["$location.coordinates", 0] } } }
                ], "as": "vendorLocation"
            }
        },
        {
            "$lookup": {
                'from': "stylistServices", "let": { 'vendor_id': '$_id' }, "pipeline": [
                    { "$match": { "$expr": { "$and": [{ "$eq": ["$$vendor_id", "$vendor_id"] }, { "$ne": ["$status", 0] }] } } }
                ], "as": "vendorServices"
            }
        },
        { "$unwind": "$vendorLocation" },
        {
            "$project": {
                "_id": 0, "services": "$vendorServices", "latitude": "$vendorLocation.latitude", "longitude": "$vendorLocation.longitude",
                "profile_pic": "$profile_pic", "name": { "$concat": ["$first_name." + languageCode, "  ", "$last_name." + languageCode] }
            }
        }], function (err, response) {

            return callback(response);
        });
    }, checkVendorStatus: function (vendorId, timezone, cartItems, cityId, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        var city = mongoose.Types.ObjectId(cityId);
        var vendorServices = [];
        // vendorServices.push({"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]});
        var duration = 0;
        for (var i = 0; i < cartItems.length; i++) {
            var serviceId = mongoose.Types.ObjectId(cartItems[i].service_id);
            var for_whom = cartItems[i].selected_for;
            var selected_service_level = cartItems[i].selected_service_level;
            var latitude = cartItems[i].latitude;
            var longitude = cartItems[i].longitude;
            var matchCondition = [];
            duration += parseInt(cartItems[i].duration);
            matchCondition.push({ "$eq": ['$service_id', serviceId] });
            matchCondition.push({ "$eq": ['$service_for', for_whom] });
            matchCondition.push({ "$ne": ["$status", 0] });
            matchCondition.push({ "$in": [selected_service_level, '$service_levels'] });
            vendorServices.push({ "$and": matchCondition });
        }
        var format = 'YYYY-MM-DD HH:mm';
        var timeFormat = 'HH:mm';

        var startDate = moment.utc().format(format);
        var endDate = moment(startDate).add(2, 'minutes').format(format);

        var startLocalDateTime = moment.tz(timezone);
        var startTime = startLocalDateTime.format(timeFormat);
        var endLocalDateTime = moment(startLocalDateTime).add(duration, 'minutes');
        var endTime = endLocalDateTime.format(timeFormat);
        var day = startLocalDateTime.day();
        if (day == 0) {
            day = 7;
        }

        var totalServices = [];
        // totalServices.push({"$or":vendorServices});

        var servicesCount = cartItems.length;

        var salonEmployeeCondtion = {};
        salonEmployeeCondtion["working_time." + day] = {
            "$elemMatch": {
                "$and": [{ "start": { "$lte": startTime } }, { "end": { '$gte': endTime } },
                {
                    "break": {
                        "$not": {
                            "$elemMatch": {
                                "$or": [
                                    { "$and": [{ "start": { "$gt": startTime } }, { "start": { "$lt": endTime } }] },
                                    { "$and": [{ "end": { "$gt": startTime } }, { "end": { "$lt": endTime } }] },
                                    { "$and": [{ "start": { "$lte": startTime } }, { "end": { "$gt": endTime } }] }
                                ]
                            }
                        }
                    }
                }
                ]
            }
        };

        db.vendor.aggregate([
            { "$match": { "$and": [{ "_id": vendor }] } },
            {
                "$lookup": {
                    "from": 'salonEmployees', 'let': { "employee_id": { "$ifNull": ["$employee_id", ''] } },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$employee_id"] }] } } },
                        { "$match": { "$and": [salonEmployeeCondtion] } }
                    ], "as": "salonEmployees"
                }
            },
            { "$match": { "$expr": { "$or": [{ "$gt": [{ "$size": "$salonEmployees" }, 0] }, { "$eq": ["$type", 1] }] } } },

            {
                "$lookup": {
                    "from": 'bookings', "let": { "employee_id": "$employee_id" }, "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$eq": ["$employee_id", "$$employee_id"] }, {
                                        "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }, { "$eq": ["$status", 10] },
                                        { "$eq": ["$status", 7] }]
                                    }]
                                }
                            }
                        },

                        {
                            "$project": {
                                "start_date": { $dateFromString: { dateString: { "$concat": ["$date", ' ', "$time"] }, timezone: "$time_zone" } },
                                "end_date": { $dateFromString: { dateString: { "$concat": ["$date", ' ', "$end_time"] }, timezone: "$time_zone" } }
                            }
                        },
                        {
                            "$project": {
                                "start_date": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                                "end_date": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                            }
                        },
                        {
                            "$match": {
                                "$expr": {
                                    "$or": [
                                        { "$and": [{ "$gt": ["$start_date", startDate] }, { "$lt": ["$start_date", endDate] }] },
                                        { "$and": [{ "$gt": ["$end_date", startDate] }, { "$lte": ["$end_date", endDate] }] },
                                        { "$and": [{ "$lte": ["$start_date", startDate] }, { "$gte": ["$end_date", endDate] }] }
                                    ]
                                }
                            }
                        }
                    ], "as": "bookingsDetails"
                }
            },
            {
                "$match": {
                    "$expr": {
                        "$or": [
                            { "$eq": [{ "$size": "$bookingsDetails" }, 0] },
                            { "$eq": ["$type", 1] }
                        ]
                    }
                }
            },
            {
                "$lookup": {
                    "from": "stylist", "let": { "vendor_id": "$_id" },
                    "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] },
                                { "$eq": ["$agent_status", 1] },
                                { "$eq": ["$manager_status", 1] },
                                { "$eq": ["$available_status", 1] },
                                { "$eq": ["$booking_status", 1] }
                                ]
                            }
                        }
                    }
                    ], "as": "availability"
                }
            },
            {
                "$lookup": {
                    "from": "stylistServices", let: { "vendor_id": vendor }, "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$eq": ['$$vendor_id', '$vendor_id'] }, { "$or": vendorServices }]
                                }
                            }
                        },
                        {
                            "$group": {
                                "_id": { "service_id": "$service_id", "service_for": "$service_for", "vendor_id": "$vendor_id" },
                                "services": { "$push": { "service_id": "$servcie_id", "service_for": "$service_for" } }
                            }
                        },
                        { "$group": { "_id": "$_id.vendor_id", "services": { "$sum": 1 } } },
                        { "$match": { "$expr": { "$and": [{ "$gte": ["$services", servicesCount] }] } } }
                    ], "as": "vendorServices"
                }
            },
            { "$match": { "$expr": { "$and": [{ "$gt": [{ "$size": { "$ifNull": ["$vendorServices", []] } }, 0] }] } } }
        ], function (err, response) {
            return callback(response);
        })
    }, checkVendor: function (userName, callback) {

    }, getServiceDetails: function (vendorId, languageCode, callback) {
        // var customer = mongoose.Types.ObjectId(customerId);

        var vendor = mongoose.Types.ObjectId(vendorId);
        //var city = mongoose.Types.ObjectId(cityId);
        /* db.vendor.aggregate([
         {"$match":{"_id":vendor}},
         {"$unwind":"$services"},
         {"$lookup":{"from":"services","localField":"services.service_id","foreignField":"_id","as":"servicesData"}},
         {"$unwind":"$servicesData"},
         {'$lookup':{ from: 'category', localField: 'servicesData.category_id', foreignField: '_id', as: 'category' } },
         {"$unwind":"$category"},
         { '$lookup': { from: 'cart', let: { service_id: '$servicesData._id' },
         pipeline: [ { '$match': { '$expr': { '$and': [ { '$eq': [ '$service_id', '$$service_id' ] },
         { '$eq': [ '$customer_id', customer ] },{"$eq":["$status",1]} ] } } } ], as: 'cartValues' } },
         {"$facet":
         {"women":[{"$match":{"$and":[{"category.category_for":{"$in":[1]}}],"servicesData.service_prices":{"$elemMatch":{"1":{"$exists":true}}} }},
         {"$group":{"_id":"$category._id",
         "category":{"$first":{"category_name":"$category.category_name","category_id":"$category._id"}},
         "services":{"$push":{"service_id":"$servicesData._id","service_name":"$servicesData.service_name","service_prices":"$servicesData.service_prices.1",
         "service_quantity":{"$cond":
         [{"$eq":["$cartValues.selected_for",1]},"$cartValues.quantity",0]},
         "selected_service_level":{"$cond":
         [{"$eq":["$cartValues.selected_for",1]},"$cartValues.selected_service_level",0]},

         "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",1]}}},0]},{}]}

         }}}}
         ],"girl":[{"$match":{"$and":[{"category.category_for":{"$in":[2]}}],"servicesData.service_prices":{"$elemMatch":{"2":{"$exists":true}}} }},
         {"$group":{"_id":"$category._id",
         "category":{"$first":{"category_name":"$category.category_name","category_id":"$category._id"}},
         "services":{"$push":{"service_id":"$servicesData._id","service_name":"$servicesData.service_name","service_prices":"$servicesData.service_prices.2",
         "service_quantity":{"$cond":
         [{"$eq":["$cartValues.selected_for",2]},"$cartValues.quantity",0]},
         "selected_service_level":{"$cond":
         [{"$eq":["$cartValues.selected_for",2]},"$cartValues.selected_service_level",0]},

         "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",2]}}},0]},{}]}

         }}}}
         ],"men":[{"$match":{"$and":[{"category.category_for":{"$in":[3]}}],"servicesData.service_prices":{"$elemMatch":{"3":{"$exists":true}}} }},
         {"$group":{"_id":"$category._id",
         "category":{"$first":{"category_name":"$category.category_name","category_id":"$category._id"}},
         "services":{"$push":{"service_id":"$servicesData._id","service_name":"$servicesData.service_name","service_prices":"$servicesData.service_prices.3",
         "service_quantity":{"$cond":
         [{"$eq":["$cartValues.selected_for",3]},"$cartValues.quantity",0]},
         "selected_service_level":{"$cond":
         [{"$eq":["$cartValues.selected_for",3]},"$cartValues.selected_service_level",0]},

         "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",3]}}},0]},{}]}

         }}}}
         ],"boy":[{"$match":{"$and":[{"category.category_for":{"$in":[4]}}],"servicesData.service_prices":{"$elemMatch":{"4":{"$exists":true}}} }},
         {"$group":{"_id":"$category._id",
         "category":{"$first":{"category_name":"$category.category_name","category_id":"$category._id"}},
         "services":{"$push":{"service_id":"$servicesData._id","service_name":"$servicesData.service_name","service_prices":"$servicesData.service_prices.4",
         "service_quantity":{"$cond":
         [{"$eq":["$cartValues.selected_for",4]},"$cartValues.quantity",0]},
         "selected_service_level":{"$cond":
         [{"$eq":["$cartValues.selected_for",4]},"$cartValues.selected_service_level",0]},

         "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",4]}}},0]},{}]}

         }}}}
         ],
         "country":[
         {  $bucketAuto: {
         groupBy: "$created_at",
         buckets: 1
         }
         },
         {"$project":{"_id":0}},
         {"$lookup":{"from":"cities","pipeline":[{"$match":{"_id":cityId}},
         {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country"}},{"$unwind":"$country"}],"as":"cities"}},
         {"$unwind":"$cities"},
         {"$project":{"currency":"$cities.country.currency_symbol","currency_code":"$cities.country.currency_code"}}

         ]

         }}
         ],function(err,response){

         return callback(response);
         });*/

        db.vendor.aggregate([
            { "$match": { "_id": vendor } },

            {
                "$lookup": {
                    "from": "stylistServices", "let": { "vendor_id": "$_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] }] } } }], "as": "vendorServices"
                }
            },

            {
                "$facet":
                {
                    "women": [
                        { "$unwind": "$vendorServices" },

                        { "$match": { "vendorServices.service_for": 1 } },
                        { "$lookup": { "from": "services", "localField": "vendorServices.service_id", "foreignField": "_id", "as": "servicesData" } },
                        { "$unwind": "$servicesData" },
                        { '$lookup': { from: 'category', localField: 'servicesData.category_id', foreignField: '_id', as: 'category' } },
                        { "$unwind": "$category" },

                        { "$match": { "$and": [{ "category.category_for": { "$in": [1] } }], "servicesData.service_prices": { "$elemMatch": { "1": { "$exists": true } } } } },
                        {
                            "$group": {
                                "_id": "$category._id",
                                "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languageCode, "$category.category_name.en"] }, "category_id": "$category._id" } },
                                "services": {
                                    "$push": {
                                        "service_id": "$servicesData._id", "service_name": { "$ifNull": ["$servicesData.service_name." + languageCode, "$servicesData.service_name.en"] }, "service_prices": "$servicesData.service_prices.1",
                                        "levels": '$vendorServices.service_levels'
                                    }
                                }
                            }
                        }
                    ], "girl": [
                        { "$unwind": "$vendorServices" },
                        { "$match": { "vendorServices.service_for": 2 } },
                        { "$lookup": { "from": "services", "localField": "vendorServices.service_id", "foreignField": "_id", "as": "servicesData" } },
                        { "$unwind": "$servicesData" },
                        { '$lookup': { from: 'category', localField: 'servicesData.category_id', foreignField: '_id', as: 'category' } },
                        { "$unwind": "$category" },


                        { "$match": { "$and": [{ "category.category_for": { "$in": [2] } }], "servicesData.service_prices": { "$elemMatch": { "2": { "$exists": true } } } } },
                        {
                            "$group": {
                                "_id": "$category._id",
                                "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languageCode, "$category.category_name.en"] }, "category_id": "$category._id" } },
                                "services": {
                                    "$push": {
                                        "service_id": "$servicesData._id", "service_name": { "$ifNull": ["$servicesData.service_name." + languageCode, "$servicesData.service_name.en"] }, "service_prices": "$servicesData.service_prices.2",
                                        "levels": '$vendorServices.service_levels'
                                    }
                                }
                            }
                        }
                    ], "men": [
                        { "$unwind": "$vendorServices" },

                        { "$match": { "vendorServices.service_for": 3 } },
                        { "$lookup": { "from": "services", "localField": "vendorServices.service_id", "foreignField": "_id", "as": "servicesData" } },
                        { "$unwind": "$servicesData" },
                        { '$lookup': { from: 'category', localField: 'servicesData.category_id', foreignField: '_id', as: 'category' } },
                        { "$unwind": "$category" },
                        { "$match": { "$and": [{ "category.category_for": { "$in": [3] } }], "servicesData.service_prices": { "$elemMatch": { "3": { "$exists": true } } } } },
                        {
                            "$group": {
                                "_id": "$category._id",
                                "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languageCode, "$category.category_name.en"] }, "category_id": "$category._id" } },
                                "services": {
                                    "$push": {
                                        "service_id": "$servicesData._id", "service_name": { "$ifNull": ["$servicesData.service_name." + languageCode, "$servicesData.service_name.en"] }, "service_prices": "$servicesData.service_prices.3",
                                        "levels": '$vendorServices.service_levels'
                                    }
                                }
                            }
                        }
                    ], "boy": [
                        { "$unwind": "$vendorServices" },

                        { "$match": { "vendorServices.service_for": 4 } },
                        { "$lookup": { "from": "services", "localField": "vendorServices.service_id", "foreignField": "_id", "as": "servicesData" } },
                        { "$unwind": "$servicesData" },
                        { '$lookup': { "from": 'category', "localField": 'servicesData.category_id', "foreignField": '_id', as: 'category' } },
                        { "$unwind": "$category" },

                        { "$match": { "$and": [{ "category.category_for": { "$in": [4] } }], "servicesData.service_prices": { "$elemMatch": { "4": { "$exists": true } } } } },
                        {
                            "$group": {
                                "_id": "$category._id",
                                "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languageCode, "$category.category_name.en"] }, "category_id": "$category._id" } },
                                "services": {
                                    "$push": {
                                        "service_id": "$servicesData._id", "service_name": { "$ifNull": ["$servicesData.service_name." + languageCode, "$servicesData.service_name.en"] }, "service_prices": "$servicesData.service_prices.4",
                                        "levels": '$vendorServices.service_levels'
                                    }
                                }
                            }
                        }
                    ]


                }
            }
        ], function (err, response) {

            return callback(response);
        });
    }, getBasicInfo: function (vendorId, languageCode, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.vendor.aggregate([
            { "$match": { "_id": vendor } },
            { "$lookup": { "from": "stylist", "localField": "_id", "foreignField": "vendor_id", "as": "stylistDetails" } },
            { "$lookup": { "from": "country", "localField": "stylistDetails.country", "foreignField": "_id", "as": "countryDetails" } },
            { "$unwind": "$stylistDetails" },
            { "$unwind": "$countryDetails" },
            {
                "$project": {
                    "first_name": { "$ifNull": ["$first_name." + languageCode, ""] },
                    "last_name": { "$ifNull": ["$last_name." + languageCode, ""] }, "email": "$email", "mobile": "$mobile",
                    "profile_pic": "$profile_pic", "stylistDetails": "$stylistDetails.gender",
                    "dob": "$dob",
                    "gender": "$gender",
                    "mobile_country": "$mobile_country",
                    "city": "$stylistDetails.city_id",
                    "nationality": "$stylistDetails.nationality",
                    "country": "$stylistDetails.country",
                    "country_name": { "$ifNull": ["$countryDetails.country." + languageCode, ""] },
                    "opt_for": "$stylistDetails.opt_for",
                    "subscribe_for": "$stylistDetails.subscribe_for",
                    "languages_speak": "$stylistDetails.languages_speak",
                    "country_code": "$country_code",
                    "invite_code": "$stylistDetails.invite_code"
                }
            }], function (err, response) {
                return callback(response);

            });
    }, getInfo: function () {

    }, getAllServices: function (cityId, serviceType, languagesCode, callback) {
        var city = mongoose.Types.ObjectId(cityId);

        db.services.aggregate([
            {
                "$project": {
                    "_id": 1, "category_id": 1, "service_name": 1, "service_description": 1, "status": 1, "service_for": 1, "created": 1,
                    "service_prices": {
                        "$filter": {
                            "input": "$service_prices", "as": "prices", "cond":
                                { "$eq": ["$$prices.city", city] }
                        }
                    }
                }
            },
            {
                '$lookup': {
                    from: 'category', "let": { "category_id": "$category_id" },
                    "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{ "$eq": ["$$category_id", "$_id"] }, { "$eq": ["$service_type", serviceType] },
                                { "$or": [{ "$eq": ["$status", 1] }, { "$eq": ["$status", 2] }] }
                                ]
                            }
                        }
                    }], as: 'category'
                }
            }, { "$unwind": "$category" },
            {
                "$facet": {
                    "women": [
                        {
                            "$match": {
                                "$and": [{ "category.category_for": { "$in": [1] } }],
                                "service_prices": { "$elemMatch": { "1": { "$exists": true }, "city": { "$eq": city } } }
                            }
                        },
                        {
                            "$group": {
                                "_id": "$category._id",
                                "category": {
                                    "$first": {
                                        "category_name": { "$ifNull": ["$category.category_name." + languagesCode, "$category.category_name.en"] },
                                        "category_id": "$category._id", "url": "$category.url",
                                        "video_url": "$category.video_url"
                                    }
                                },
                                "services": {
                                    "$push": {
                                        "service_id": "$_id", "service_name": { "$ifNull": ["$service_name." + languagesCode, "$service_name.en"] },

                                        "service_prices": { "$arrayElemAt": ["$service_prices.1", 0] },
                                        "duration": { "$ifNull": [{ "$arrayElemAt": ["$service_prices.duration.1", 0] }, 0] },

                                        "service_description": { "$ifNull": ["$service_description." + languagesCode, "$service_description.en"] },
                                        "url": "$url"
                                    }
                                }
                            }
                        }
                    ], "girl": [{
                        "$match": {
                            "$and": [{ "category.category_for": { "$in": [2] } }],
                            "service_prices": { "$elemMatch": { "2": { "$exists": true }, "city": { "$eq": city } } }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$category._id",
                            "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languagesCode, "$category.category_name.en"] }, "category_id": "$category._id", "url": "$category.url", "video_url": "$category.video_url" } },
                            "services": {
                                "$push": {
                                    "service_id": "$_id", "service_name": { "$ifNull": ["$service_name." + languagesCode, "$service_name.en"] },
                                    "duration": { "$ifNull": [{ "$arrayElemAt": ["$service_prices.duration.2", 0] }, 0] },
                                    "service_description": { "$ifNull": ["$service_description." + languagesCode, "$service_description.en"] },
                                    "service_prices": { "$arrayElemAt": ["$service_prices.2", 0] }
                                    , "url": "$url"
                                }
                            }
                        }
                    }
                    ], "men": [{
                        "$match": {
                            "$and": [{ "category.category_for": { "$in": [3] } }],
                            "service_prices": { "$elemMatch": { "3": { "$exists": true }, "city": { "$eq": city } } }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$category._id",
                            "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languagesCode, "$category.category_name.en"] }, "category_id": "$category._id", "url": "$category.url", "video_url": "$category.video_url" } },
                            "services": {
                                "$push": {
                                    "service_id": "$_id", "service_name": { "$ifNull": ["$service_name." + languagesCode, "$service_name.en"] },
                                    "service_prices": { "$arrayElemAt": ["$service_prices.3", 0] },
                                    "service_description": { "$ifNull": ["$service_description." + languagesCode, "$service_description.en"] },
                                    "duration": { "$ifNull": [{ "$arrayElemAt": ["$service_prices.duration.3", 0] }, 0] },

                                    "url": "$url"
                                }
                            }
                        }
                    }
                    ], "boy": [{
                        "$match": {
                            "$and": [{ "category.category_for": { "$in": [4] } }],
                            "service_prices": { "$elemMatch": { "4": { "$exists": true }, "city": { "$eq": city } } }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$category._id",
                            "category": { "$first": { "category_name": { "$ifNull": ["$category.category_name." + languagesCode, "$category.category_name.en"] }, "category_id": "$category._id", "url": "$category.url", "video_url": "$category.video_url" } },
                            "services": {
                                "$push": {
                                    "service_id": "$_id", "service_name": { "$ifNull": ["$service_name." + languagesCode, "$service_name.en"] },
                                    "service_prices": { "$arrayElemAt": ["$service_prices.4", 0] },
                                    "duration": { "$ifNull": [{ "$arrayElemAt": ["$service_prices.duration.4", 0] }, 0] },
                                    "service_description": { "$ifNull": ["$service_description." + languagesCode, "$service_description.en"] },
                                    "url": "$url"
                                }
                            }
                        }
                    }
                    ], "country": [{
                        $bucketAuto: {
                            groupBy: "$created_at",
                            buckets: 1
                        }
                    },
                    { "$project": { "_id": 0 } },
                    {
                        "$lookup": {
                            "from": "cities", "pipeline": [
                                { "$match": { "_id": city } },
                                { "$lookup": { "from": "country", "localField": "country_id", "foreignField": "_id", "as": "country" } },
                                { "$unwind": "$country" }],
                            "as": "cities"
                        }
                    },
                    { "$unwind": "$cities" },
                    { "$project": { "currency": "$cities.country.currency_symbol", "currency_code": "$cities.country.currency_code" } }
                    ]
                }
            },
            { "$project": { "women": "$women", "girl": "$girl", "men": "$men", "boy": "$boy", "country": { "$arrayElemAt": ["$country", 0] } } }], function (err, response) {

                return callback(response);
            });
    },
    getSalonBookings: function (salonId, employeeId, date, languagesCode, callback) {

        var salon = mongoose.Types.ObjectId(salonId);
        var matchCondtion = { "$match": { "_id": salon } };

        var bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }] } } };
        if (employeeId != '' && employeeId != undefined) {
            var employee = mongoose.Types.ObjectId(employeeId);
            bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }, { "$eq": ["$employee_id", employee] }] } } };
        }
        db.salon.aggregate([matchCondtion,
            { "$group": { "_id": "$_id", "salon_id": { "$push": "$_id" } } },
            {
                "$lookup": {
                    "from": "bookings", "let": { salon_id: "$salon_id" },
                    "pipeline": [bookingsConditon,
                        { "$match": { "$expr": { "$and": [{ "$ne": ["$status", 1] }, { "$ne": ["$status", 3] }, { "$ne": ["$status", 6] }, { "$eq": [{ $substr: ['$date', 0, 7] }, date] }] } } },
                        { "$group": { "_id": { "date": "$date", "customer_id": "$customer_id" } } },
                        { "$lookup": { "from": "customers", "localField": "_id.customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        { "$project": { "date": "$_id.date", "customers": { "$concat": ["$customerDetails.first_name." + languagesCode, "  ", "$customerDetails.last_name." + languagesCode] }, "_id": 0 } },
                        { "$group": { "_id": "$date", "customers": { "$push": "$customers" } } }
                    ],
                    "as": "bookingDetails"
                }
            },
            { "$unwind": "$bookingDetails" },
            { "$project": { "date": "$bookingDetails._id", "customers": "$bookingDetails.customers", "_id": 0 } }
        ], function (err, response) {
            return callback(response);
        });
    }, getSalonWeekBooking: function (salonId, employeeId, startDate, endDate, languagesCode, callback) {

        var salon = mongoose.Types.ObjectId(salonId);
        var matchCondtion = { "$match": { "_id": salon } };

        var bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }] } } };
        if (employeeId != '' && employeeId != undefined) {
            var employee = mongoose.Types.ObjectId(employeeId);
            bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }, { "$eq": ["$employee_id", employee] }] } } };
        }
        db.salon.aggregate([matchCondtion,
            { "$group": { "_id": "$_id", "salon_id": { "$push": "$_id" } } },
            {
                "$lookup": {
                    "from": "bookings", "let": { salon_id: "$salon_id" },
                    "pipeline": [bookingsConditon,
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$ne": ["$status", 1] }, { "$ne": ["$status", 3] }, { "$ne": ["$status", 6] }, { "$gte": [{ $substr: ['$date', 0, -1] }, startDate] },
                                    { "$lte": [{ $substr: ['$date', 0, -1] }, endDate] }]
                                }
                            }
                        },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" }
                    ],
                    "as": "bookingDetails"
                }
            },
            { "$unwind": "$bookingDetails" },
            {
                "$project": {
                    "_id": 0, "customer_name":
                        { "$concat": ["$bookingDetails.customerDetails.first_name." + languagesCode, "  ", "$bookingDetails.customerDetails.last_name." + languagesCode] },
                    "booking_id": "$bookingDetails._id",
                    "start_time": "$bookingDetails.time",
                    "end_time": "$bookingDetails.end_time",
                    "date": "$bookingDetails.date",
                    "type": { "$ifNull": ["$bookingDetails.stylist_type", 2] },
                    "status": "$bookingDetails.status"
                }
            }
        ], function (err, response) {

            return callback(response);
        });
    }, getSalonDayBooking: function (salonId, employeeId, date, languagesCode, callback) {
        var salon = mongoose.Types.ObjectId(salonId);
        var matchCondtion = { "$match": { "_id": salon } };

        var bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }] } } };
        if (employeeId != '' && employeeId != undefined) {
            var employee = mongoose.Types.ObjectId(employeeId);
            bookingsConditon = { "$match": { "$expr": { "$and": [{ "$in": ["$salon_id", "$$salon_id"] }, { "$eq": ["$employee_id", employee] }] } } };
        }
        db.salon.aggregate([
            matchCondtion,
            { "$group": { "_id": "$_id", "salon_id": { "$push": "$_id" } } },
            {
                "$lookup": {
                    "from": "bookings", "let": { salon_id: "$salon_id" },
                    "pipeline": [bookingsConditon,
                        { "$match": { "$expr": { "$and": [{ "$ne": ["$status", 1] }, { "$ne": ["$status", 3] }, { "$ne": ["$status", 6] }, { "$eq": [{ $substr: ['$date', 0, -1] }, date] }] } } },
                        { "$lookup": { "from": "customers", "localField": "customer_id", "foreignField": "_id", "as": "customerDetails" } },
                        { "$unwind": "$customerDetails" },
                        { "$unwind": "$cart_id" },
                        {
                            "$lookup": {
                                "from": "cart", "let": { "cart_id": "$cart_id" }, "pipeline": [
                                    { "$match": { "$expr": { "$and": [{ "$eq": ["$$cart_id", "$_id"] }] } } },
                                    { "$lookup": { "from": "services", "localField": "service_id", "foreignField": "_id", "as": "serviceDetails" } },
                                    { "$unwind": { "path": "$serviceDetails", "preserveNullAndEmptyArrays": true } },
                                    { "$lookup": { "from": "salonPackages", "localField": "package_id", "foreignField": "_id", "as": "packageDetails" } },
                                    { "$unwind": { "path": "$packageDetails", "preserveNullAndEmptyArrays": true } }

                                ], "as": "cartDetails"
                            }
                        },
                        { "$unwind": { "path": "$cartDetails", "preserveNullAndEmptyArrays": true } },
                        {
                            "$group": {
                                "_id": "$_id", "booking": {
                                    "$first": {
                                        "service_name": "$cartDetails.serviceDetails.service_name.en",
                                        "type": { "$ifNull": ["$stylist_type", 2] },

                                        "package_name": "$cartDetails.packageDetails.package_name", "booking_id": "$_id",
                                        "employee_id": "$employee_id",
                                        "customer_name": { "$concat": ["$customerDetails.first_name." + languagesCode, "  ", "$customerDetails.last_name." + languagesCode] },
                                        "date": "$date", "start_time": "$time", "end_time": "$end_time", "status": "$status"
                                    }
                                }
                            }
                        },
                        { "$group": { "_id": { "employee_id": "$booking.employee_id", "date": "$booking.date" }, "bookings": { "$push": "$booking" } } },
                        { "$lookup": { "from": "salonEmployees", "localField": "_id.employee_id", "foreignField": "_id", "as": "employeeDetails" } },
                        { "$unwind": "$employeeDetails" }
                    ],
                    "as": "bookingDetails"
                }
            },
            { "$unwind": "$bookingDetails" }

        ], function (err, response) {

            return callback(response);
        });
    }, getStylistDetails: function (vendorId, languageCode, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.vendor.aggregate([
            { "$match": { "_id": vendor } },
            {
                "$lookup": {
                    "from": "stylist", "let": { "vendor_id": "$_id" },
                    "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] }] } } }],
                    "as": "availability"
                }
            },
            {
                "$lookup": {
                    "from": "bookings", "let": { "vendor_id": "$_id", "type": "$type" },
                    "pipeline":
                        [{
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        { "$eq": ["$vendor_id", "$$vendor_id"] },
                                        {
                                            "$or": [
                                                { "$and": [{ "$eq": ["$$type", 1] }, { "$eq": ["$status", 1] }] },
                                                { "$eq": ["$status", 2] },
                                                { "$eq": ["$status", 7] }
                                            ]
                                        }]
                                }
                            }
                        }

                        ], "as": "bookingDetails"
                }
            },
            { "$unwind": "$availability" },
            {
                "$project": {
                    '_id': 0,
                    "first_name": { "$ifNull": ["$first_name." + languageCode, ''] },
                    "last_name": { "$ifNull": ["$last_name." + languageCode, ''] },
                    "email": "$email",
                    "mobile": "$mobile",
                    "profile_pic": "$profile_pic",
                    "vendor_id": '$_id',
                    "status": "$availability.available_status",
                    "bookings_status": {
                        '$cond': {
                            if: { '$gte': [{ "$size": "$bookingDetails" }, 1] },
                            then: true,
                            else: false
                        }
                    }, "dob": "$od", "created": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created" } },
                    "booking_id": { "$arrayElemAt": ['$bookingDetails._id', 0] },
                    "active_status": { "$ifNull": ["$availability.active_status", 1] },
                    "is_locked": { "$ifNull": ["$availability.is_locked", 1] },
                    "invite_code": { "$ifNull": ['$user_invite_code', 'MR&MS241'] }
                }
            }
        ], function (err, response) {

            return callback(response);
        });
    }, getbookingdetails: function (vendorId, languageCode, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        return db.bookings.find({ "vendor_id": vendor,status : 1}).lean().exec();
    
    
          
    
            
           
        
    }, getCountryDocuments: function (vendorId, languageCode, callback) {

        var vendor = mongoose.Types.ObjectId(vendorId);
        db.stylist.aggregate([
            { "$match": { "vendor_id": vendor } },
            {
                "$lookup": {
                    "from": "country", "let": { "country": "$country" },
                    "pipeline": [
                        { "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$country"] }] } } },
                        { "$unwind": "$stylist_documents" },
                        {
                            "$lookup": {
                                "from": "documents", "let": { "document_id": "$stylist_documents" },
                                "pipeline": [{ "$match": { "$expr": { "$and": [{ "$eq": ["$_id", "$$document_id"] }, { "$eq": ["$status", 1] }] } } }]
                                , "as": "documents"
                            }
                        },
                        { "$unwind": "$documents" },
                        {
                            "$project": {
                                "document_id": "$documents._id", "document_name": { "$ifNull": ["$documents.document_name." + languageCode, ""] }
                                , "is_expiry_date": "$documents.is_expiry_date"
                            }
                        }], "as": "documents"
                }
            },
            { "$unwind": "$documents" },
            { "$project": { "document_name": "$documents.document_name", "document_id": "$documents.document_id", "is_expiry_date": "$documents.is_expiry_date" } }
        ], function (err, response) {

            return callback(response);
        });
    }, getRatings: function (vendorId, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.vendor.aggregate([
            { "$match": { "_id": vendor } },
            {
                "$lookup": {
                    "from": "rating", "let": { "vendor_id": "$_id" }, "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [{ "$eq": ["$vendor_id", "$$vendor_id"] },
                                    { "$eq": ["$rated_by", 1] }]
                                }
                            }
                        }], "as": "vendorRatings"
                }
            },
            {
                "$lookup": {
                    "from": "bookings", "let": { "vendor_id": "$_id" }, "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [
                                    { "$eq": ["$vendor_id", "$$vendor_id"] },
                                    { "$or": [{ "$eq": ["$status", 8] }, { "$eq": ["$status", 4] }, { "$eq": ["$status", 5] }] }]
                            }
                        }
                    }], "as": "bookings"
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "vendorRatings": { "$first": "$vendorRatings" },
                    "bookings_completed": {
                        "$first": {
                            "$ifNull": [{
                                "$size": {
                                    "$filter": {
                                        "input": "$bookings",
                                        "as": "bookingCompleted",
                                        "cond": { "$and": [{ "$eq": ["$$bookingCompleted.status", 8] }] }
                                    }
                                }
                            }, 0]
                        }
                    },
                    "bookings_cancelled": {
                        "$first": {
                            "$ifNull": [{
                                "$size": {
                                    "$filter": {
                                        "input": "$bookings",
                                        "as": "bookingCancelled",
                                        "cond": { "$or": [{ "$eq": ["$$bookingCancelled.status", 4] }, { "$eq": ["$$bookingCancelled.status", 5] }] }
                                    }
                                }
                            }, 0]
                        }
                    },
                    "total_bookings": { "$first": { "$ifNull": [{ "$size": "$bookings" }, 0] } }
                }
            },
            {
                "$project": {
                    "five_star": {
                        "$ifNull": [{
                            "$size": {
                                "$filter": {
                                    "input": "$vendorRatings", "as": "five",
                                    "cond": { "$and": [{ "$eq": ["$$five.rating", 5] }] }
                                }
                            }
                        }, 0]
                    },
                    "total_rating": {
                        "$ifNull": [{
                            "$avg": "$vendorRatings.rating"
                        }, 0]
                    },
                    "bookings_completed": "$bookings_completed",
                    "totalBookings": "$total_bookings",
                    "booking_cancelled": "$bookings_cancelled",
                    "booking_completed_percentage": { "$ifNull": [{ "$cond": [{ "$eq": ["$total_bookings", 0] }, 0, { "$divide": [{ "$multiply": ["$bookings_completed", 100] }, "$total_bookings"] }] }, 0] },
                    "booking_cancelled_percentage": { "$ifNull": [{ "$cond": [{ "$eq": ["$total_bookings", 0] }, 0, { "$divide": [{ "$multiply": ["$bookings_cancelled", 100] }, "$total_bookings"] }] }, 0] }
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, updateInvite: function (data, where) {

        return new Promise(function (resolve) {
            db.vendor.findOneAndUpdate(where, { $addToSet: { "invite": data } }, { new: true }, function (err, response) {
                return resolve(response);
            });
        })
    }, inviteCodeDetails: function (userId, languageCode, callback) {
        var user = mongoose.Types.ObjectId(userId);
        db.vendor.aggregate([
            { "$match": { "_id": user } },
            { "$unwind": { "path": "$invite", "preserveNullAndEmptyArrays": true } },
            { "$lookup": { "from": "vendor", "localField": "invite.vendor_id", "foreignField": "_id", "as": "inviteDetails" } },
            { "$unwind": { "path": "$inviteDetails", "preserveNullAndEmptyArrays": true } },
            {
                "$group": {
                    "_id": '$invite_code', "referral_amount": { "$first": "$referral_amount" }, "invites": {
                        "$push": {
                            "_id": "$invite._id",
                            "first_name": { "$ifNull": ["$inviteDetails.first_name." + languageCode, ''] },
                            "last_name": { "$ifNull": ["$inviteDetails.last_name." + languageCode, ''] },
                            "remind": "$invite.remind",
                            "amount": "$invite.amount",
                            "profile_pic": "$inviteDetails.profile_pic",
                            "status": {
                                "$cond": [{
                                    "$or": [
                                        { "$and": [{ "$eq": ["$inviteDetails.type", 1] }, { "$eq": ["$inviteDetails.status", 9] }] },
                                        { "$and": [{ "$eq": ["$inviteDetails.type", 2] }, { "$eq": ["$inviteDetails.status", 13] }] }]
                                }, 0, 1]
                            },
                            "created": { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$inviteDetails.created" } }
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0, "referral_amount": { "$ifNull": ["$referral_amount", 0] }, "invite_code": "$_id", "invited_users": {
                        "$filter": {
                            "input": "$invites", "as": "details",
                            "cond": { "$and": [{ "$ne": ["$$details.first_name", ""] }] }
                        }
                    }
                }
            }
        ], function (err, response) {
            return callback(response);
        });
    }, updateBookings: function (vendorId) {
        return new Promise(function (resolve) {
            db.vendor.update({ "_id": vendorId }, { "$inc": { "bookings_completed": 1 } }, function (err, response) {
                return resolve(response);
            });
        });
    }, updateWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.vendor.findOneAndUpdate(where, { $set: data }, { new: true }, function (err, response) {
                console.log(err, where, data);
                resolve(response);
            });
        });
    },
    updateReferAmountWithPromises: function (data, where) {
        return new Promise(function (resolve) {
            db.vendor.findOneAndUpdate(where, { $inc: data }, { new: true }, function (err, response) {
                resolve(response);
            });
        });
    }, withDrawAmount: function (vendorId, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.bookings.aggregate([
            { "$match": { "$expr": { "$and": [{ "$eq": ['$vendor_id', vendor] }, { "$ne": ['$vendor_payment_status', 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$eq": ["$status", 5] }] }] } } },
            {
                "$facet": {
                    "cashAmount": [
                        { "$match": { "payment_type": 1, "status": 8 } },
                        {
                            "$group": {
                                "_id": "$vendor_id", "amount": {
                                    "$push": {
                                        "amount": {
                                            "$subtract": [
                                                { "$multiply": ["$net_amount", { "$ifNull": ["$surge", 1] }] }, { "$ifNull": ["$booking_percentage", 0] }
                                            ]
                                        }, "booking_id": "$_id", "booking_percentage": { "$ifNull": ["$booking_percentage", 0] }
                                    }
                                }
                            }
                        },

                        { "$unwind": "$amount" },

                        {
                            "$group": {
                                "_id": "$_id",
                                "amount": { "$sum": "$amount.amount" },
                                "booking_percentage": { "$sum": "$amount.booking_percentage" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }

                    ],

                    "cardAmount": [
                        { "$match": { "payment_type": 2, "status": 8 } },
                        {
                            "$group": {
                                "_id": "$vendor_id", "amount": {
                                    "$push": {
                                        "amount": {
                                            "$subtract": [
                                                { "$multiply": ["$net_amount", { "$ifNull": ["$surge", 1] }] }, { "$ifNull": ["$booking_percentage", 0] }]
                                        }, "booking_id": "$_id", "booking_percentage": { "$ifNull": ["$booking_percentage", 0] }
                                    }
                                }
                            }
                        },

                        { "$unwind": "$amount" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "amount": { "$sum": "$amount.amount" },
                                "booking_percentage": { "$sum": "$amount.booking_percentage" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }
                    ],
                    "cancellationAmount": [

                        { "$match": { "status": 5 } },

                        {
                            "$group": {
                                "_id": "$vendor_id", "amount": {
                                    "$push": {
                                        "amount": "$cancellation_amount", "booking_id": "$_id", "booking_percentage": { "$ifNull": ["$booking_percentage", 0] }
                                    }
                                }
                            }
                        },

                        { "$unwind": "$amount" },

                        {
                            "$group": {
                                "_id": "$_id",
                                "amount": { "$sum": "$amount.amount" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }
                    ]

                }
            },

        ], function (err, response) {
            //console.log(response[0].cashAmount[0]);
            return callback(response);
        });
    }, withDrawAmountSalon: function (vendorId, callback) {
        var salon = mongoose.Types.ObjectId(vendorId);
        db.orders.aggregate([
            { "$match": { "salon_id": salon } },
            { "$unwind": "$booking_id" },
            {
                "$facet": {
                    "salonBookings": [
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id", "order_id": "$_id" },
                                "pipeline": [

                                    {
                                        "$match": {
                                            "$expr": {
                                                "$and": [{ "$eq": ["$is_package", 0] }, { "$eq": ["$$booking_id", "$_id"] },
                                                { "$ne": ["$vendor_payment_status", 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$ne": ["$cancell_type", 3] }, { "$eq": ["$status", 5] }] }] }]
                                            }
                                        }
                                    },
                                    { $addFields: { "order_id": "$$order_id" } }
                                    //{"$match":{"status":8,"vendor_payment_status":{"$ne":1}}},
                                ], "as": 'bookingDetails'
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { "$replaceRoot": { "newRoot": "$bookingDetails" } }
                    ],
                    'packageBooking': [{
                        "$lookup": {
                            "from": "bookings", "let": { "booking_id": "$booking_id", "order_id": "$_id" },
                            "pipeline": [

                                { "$match": { "$expr": { "$and": [{ "$eq": ["$is_package", 1] }, { "$eq": ["$$booking_id", "$_id"] }, { "$ne": ["$vendor_payment_status", 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$ne": ["$cancell_type", 3] }, { "$eq": ["$status", 5] }] }] }] } } },
                                { $addFields: { "order_id": "$$order_id" } }
                            ], "as": 'bookingDetails'
                        }
                    },
                    { "$unwind": "$bookingDetails" },
                    { "$group": { "_id": "$_id", "booking": { "$first": "$bookingDetails" } } },
                    { "$replaceRoot": { "newRoot": "$booking" } }


                    ],
                    "serveOutBooking": [
                        {
                            "$lookup": {
                                "from": "bookings", "let": { "booking_id": "$booking_id", "order_id": "$_id" },
                                "pipeline": [

                                    { "$match": { "$expr": { "$and": [{ "$eq": ["$booking_type", 3] }, { "$eq": ["$$booking_id", "$_id"] }, { "$ne": ["$vendor_payment_status", 1] }, { "$or": [{ "$eq": ["$status", 8] }, { "$and": [{ "$ne": ["$cancell_type", 3] }, { "$eq": ["$status", 5] }] }] }] } } },
                                    { $addFields: { "order_id": "$$order_id" } }
                                ], "as": 'bookingDetails'
                            }
                        },
                        { "$unwind": "$bookingDetails" },
                        { "$replaceRoot": { "newRoot": "$bookingDetails" } }
                    ]
                }
            },
            { "$project": { "_id": 0, "items": { "$concatArrays": ["$salonBookings", "$packageBooking", "$serveOutBooking"] } } },
            { "$unwind": "$items" },
            { "$replaceRoot": { "newRoot": "$items" } },
            {
                "$facet": {
                    "cashAmount": [
                        { "$match": { "payment_type": 1, "status": 8 } },
                        {
                            "$group": {
                                "_id": "$salon_id", "amount": {
                                    "$push": {
                                        "amount": {
                                            "$subtract":

                                                [{
                                                    "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                                    { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                                }

                                                    , { "$ifNull": ["$booking_percentage", 0] }]
                                        },
                                        "booking_percentage": { "$ifNull": ["$booking_percentage", 0] },
                                        "booking_id": "$_id", "order_id": "$order_id"
                                    }
                                }
                            }
                        },
                        { "$unwind": "$amount" },
                        {
                            "$group": {
                                "_id": "$_id", "amount": { "$sum": "$amount.amount" },
                                "booking_percentage": { "$sum": "$amount.booking_percentage" },
                                "order_id": { "$push": "$amount.order_id" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }
                    ],
                    "cardAmount": [
                        { "$match": { "payment_type": 2, "status": 8 } },
                        {
                            "$group": {
                                "_id": "$salon_id",
                                "amount": {
                                    "$push": {
                                        "booking_percentage": { "$ifNull": ["$booking_percentage", 0] },
                                        "amount": {
                                            "$subtract":

                                                [{
                                                    "$cond": [{ "$and": [{ "$eq": ["$coupon_details.coupon_type", 3] }] },
                                                    { "$subtract": ["$net_amount", "$coupon_details.coupon_amount"] }, "$net_amount"]
                                                }

                                                    , { "$ifNull": ["$booking_percentage", 0] }]
                                        }, "booking_id": "$_id", "order_id": "$order_id"
                                    }
                                }
                            }
                        },
                        { "$unwind": "$amount" },


                        {
                            "$group": {
                                "_id": "$_id", "amount": { "$sum": "$amount.amount" }, "booking_percentage": { "$sum": "$amount.booking_percentage" },
                                "order_id": { "$push": "$amount.order_id" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }
                    ],
                    "cancellationAmount": [
                        { "$match": { "status": 5 } },
                        {
                            "$group": {
                                "_id": "$salon_id",
                                "amount": {
                                    "$push": {
                                        "booking_percentage": { "$ifNull": ["$booking_percentage", 0] },
                                        "amount": {
                                            "$subtract": [
                                                { "$multiply": ["$net_amount", { "$ifNull": ["$surge", 1] }] }, { "$ifNull": ["$booking_percentage", 0] }]
                                        },
                                        "cancellation_amount": "$cancellation_amount", "booking_id": "$_id", "order_id": "$order_id"
                                    }
                                }
                            }
                        },
                        { "$unwind": "$amount" },
                        {
                            "$group": {
                                "_id": "$_id", "amount": { "$sum": "$amount.amount" }, "booking_percentage": { "$sum": "$amount.booking_percentage" },
                                "cancellation_amount": { "$sum": "$amount.cancellation_amount" },
                                "order_id": { "$push": "$amount.order_id" },
                                "booking": { "$push": "$amount.booking_id" }
                            }
                        }
                    ]
                }
            }

        ], function (err, response) {
            // console.log(response);
            return callback(response);
        });
    }, withDrawalList: function (salonId, callback) {
        var salon = mongoose.Types.ObjectId(salonId);
        db.salon.aggregate([
            { "$match": { "_id": salon } },
            { "$unwind": "$payment_status" },
            { "$project": { "status": "$payment_status.status", "created": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$payment_status.created_at" } }, "amount": "$payment_status.amount" } }
        ], function (err, response) {
            return callback(response);
        });

    }, withDrawalListStylist: function (salonId, callback) {
        var salon = mongoose.Types.ObjectId(salonId);
        db.vendor.aggregate([
            { "$match": { "_id": salon } },
            { "$unwind": "$payment_status" },
            { "$project": { "status": "$payment_status.status", "created": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$payment_status.created_at" } }, "amount": "$payment_status.amount" } }
        ], function (err, response) {

            return callback(response);
        });
    }, updatePayment: function (data, where) {
        return new Promise(function (resolve) {
            db.salon.findOneAndUpdate(where, { $addToSet: { "payment_status": data } }, { new: true }, function (err, response) {
                return resolve(response);
            });
        })
    }, updatePaymentStylist: function (data, where) {
        return new Promise(function (resolve) {
            db.vendor.findOneAndUpdate(where, { $addToSet: { "payment_status": data } }, { new: true }, function (err, response) {
                return resolve(response);
            });
        })
    }, updateBranch: function (data, where) {
        return new Promise(function (resolve) {
            db.vendor.findOneAndUpdate(where, { $addToSet: { "branches": data } }, { new: true }, function (err, response) {
                return resolve(response);
            });
        })
    }, findMobile: function (mobile, mobileCountry) {
        return new Promise(function (resolve) {
            db.vendor.aggregate([
                {
                    "$match": {
                        "$or": [{
                            "mobile": mobile,
                            "mobile_country": mobileCountry
                        }, { "branches.mobile": mobile, "branches.mobile_country": mobileCountry }]
                    }
                },
                {
                    "$project": {
                        "_id": "$_id", "branches": {
                            "$ifNull": [{
                                "$filter": {
                                    "input": "$branches", "as": "branchAdmin", "cond": {
                                        "$and": [
                                            { "$eq": ["$$branchAdmin.mobile", mobile] },
                                            { "$eq": ["$$branchAdmin.mobile_country", mobileCountry] }
                                        ]
                                    }
                                }
                            }, []]
                        }, "type": "$type",
                        "hash": "$hash",
                        "first_name": "$first_name",
                        "last_name": "$last_name",
                        "email": "$email",
                        "password": "$password",
                        "employee_id": { "$ifNull": ["$employee_id", ''] },
                        "status": "$status",
                        "created": "$created",
                        "updated": "$updated",


                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "branches": "$branches",
                        "hash": "$hash",
                        "password": "$password",
                        "first_name": "$first_name",
                        "last_name": "$last_name",
                        "email": "$email",
                        "employee_id": "$employee_id",
                        "type": { "$cond": [{ "$gte": [{ "$size": "$branches" }, 1] }, 4, "$type"] },
                        "status": "$status",
                        "created": "$created",
                        "updated": "$updated",
                    }
                }], function (err, response) {
                    return resolve(response);
                });
        });
    }, findEmail: function (email) {
        return new Promise(function (resolve) {
            db.vendor.aggregate([
                {
                    "$match": {
                        "$or": [{
                            "email": email

                        }, { "branches.email": email }]
                    }
                },
                {
                    "$project": {
                        "_id": "$_id", "branches": {
                            "$ifNull": [{
                                "$filter": {
                                    "input": "$branches", "as": "branchAdmin", "cond": {
                                        "$and": [
                                            { "$eq": ["$$branchAdmin.email", email] },
                                        ]
                                    }
                                }
                            }, []]
                        }, "type": "$type",
                        "hash": "$hash",
                        "first_name": "$first_name",
                        "last_name": "$last_name",
                        "email": "$email",
                        "password": "$password",
                        "employee_id": { "$ifNull": ["$employee_id", ''] },
                        "status": "$status"
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "branches": "$branches",
                        "hash": "$hash",
                        "password": "$password",
                        "first_name": "$first_name",
                        "last_name": "$last_name",
                        "email": "$email",
                        "employee_id": "$employee_id",
                        "type": { "$cond": [{ "$gte": [{ "$size": "$branches" }, 1] }, 4, "$type"] },
                        "status": "$status"
                    }
                }
            ], function (err, response) {
                return resolve(response);
            });
        });
    }, updateArrays: function (data, where) {
        return new Promise(function (resolve) {
            db.vendor.update(where, { $push: data }, { new: true }, function (err, response) {
                //   console.log(err,where);
                return resolve(response);
            });
        });
    }, checkSession() {
        return new Promise(function (resolve) {
            db.vendor.aggregate([{ "$unwind": "$sessions" },
            {
                "$group": {
                    "_id": "$sessions.session_id", "vendor_id": { "$first": "$_id" },
                    "sessions_count": { "$sum": 1 }, "session_type": { "$first": "$sessions.session_type" }, "device_type": { "$first": "$sessions.device_type" }
                }
            },

            { "$match": { "sessions_count": { "$lte": 1 }, "session_type": { "$eq": 1 } } }], function (err, response) {
                return resolve(response);
            })
        });

    }, vendorDetails: function (vendorId, fields, callback) {
        var vendor = mongoose.Types.ObjectId(vendorId);

        db.vendor.aggregate([{ "$match": { "_id": vendor } }, { "$project": fields }], function (err, response) {
            callback(response);
        });
    }, getPaymentCard: function (vendorId) {
        var vendor = mongoose.Types.ObjectId(vendorId);
        return new Promise(function (resolve) {
            db.vendor.aggregate([
                { "$match": { "_id": vendor } },
                { "$unwind": "$payment" },
                { "$match": { "payment.status": 1 } },
                {
                    "$group": {
                        "_id": "$_id"
                        , "payment": { "$push": { "_id": "$payment._id", "last4": "$payment.last4", "brand": "$payment.brand", "is_primary": "$payment.is_primary" } }
                    }
                },
                { "$project": { "_id": 0, "payment": 1 } }
            ], function (err, response) {

                return resolve(response);
            })
        });

    }, getPaymentCardDetails: function (vendorId, cardId) {
        var customer = mongoose.Types.ObjectId(vendorId);
        var card = mongoose.Types.ObjectId(cardId);
        return new Promise(function (resolve) {
            db.vendor.aggregate([
                { "$match": { "_id": customer } },
                { "$unwind": "$payment" },
                { "$match": { "payment._id": card } },
                { "$project": { "_id": 0, "strip_account_id": 1, "payment": { "_id": "$payment._id", "last4": "$payment.last4", "brand": "$payment.brand", "is_primary": "$payment.is_primary", "id": "$payment.id" } } },

            ], function (err, response) {

                return resolve(response);
            })
        });

    }, addvendorbankdetails: function (values, callback) {
        db.vendorbankdetails.find({ vendorId: values.vendorId, status: true }).lean().exec((err, data) => {

            if (!data || !data[0]) {
                var vendorbankdetails = new db.vendorbankdetails(values);


                vendorbankdetails.save(function (err, response) {

                    callback(err, response)
                });
            } else {
                callback(err, "already added")

            }
        })



    }, updatepaymentdetails: function (req, callback) {
        if (req.body.status == "success") {
            db.vendorbankdetails.update({ _id: req.body.id }, { $set: { submarchantkey: req.body.submarchantkey, status: true } }).lean().exec((err, data) => {
                db.stylist.update({ vendor_id: req.body.vendorId }, { $set: { iban_status: 1 } }).lean().exec((err, response) => {

                    callback(err, response)
                });

            })
        }



    }, getiban: function (req, callback) {
        db.vendorbankdetails.find({ vendorId: req.body.vendorId, status: true }).lean().exec((err, data) => {

            callback(err, data)
        })


    }, updateibanfromweb: function (req, callback) {
        if (req.body.status == "success") {
            db.vendorbankdetails.update({ _id: req.body.id }, { $set: { setIban: req.body.setIban, submarchantkey: req.body.submarchantkey, status: true, ibanname: req.body.ibanname, taxNumber: req.body.taxNumber } }).lean().exec((err, data) => {
                callback(err, data)
            })
        } else {
            callback("err", "failed")
        }

    }
};
