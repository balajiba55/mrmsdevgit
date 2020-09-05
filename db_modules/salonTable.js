var db = require('../db');
var mongoose = require('mongoose');

module.exports =
    {
        status: {
            "1": {
                status: 1, "value": "Salon Info "
            },
            "2": {
                status: 2, "value": "registered"
            },
            "3": {
                status: 3, "value": "Basic Details"

            },
            "4": {
                status: 4, "value": "salon Info "

            },
            "5": {
                status: 5, "value": "login with password"
            }
        },
        save:  function (values, callback) {

            var salon = new db.salon(values);
            salon.save(function (err, response) {

                return callback(response);
            });
        },
        update: function (data, where, callback){

            db.salon.findOneAndUpdate(where, {$set: data}, {new: true}, function (err, response)
            {


                return callback(response);
            });
        }
        ,updateMany:function(data,where,callback){
        db.salon.update(where, {$set:data},{ multi: true }, function(err, response){

            callback(response);

        });
    },
        find: function (check, callback)
        {

            db.salon.find(check, function (err, response) {

                return callback(response);
            });
        },
        getsalons: function (vendorId,salonId, languagesCode,callback){
            var id = mongoose.Types.ObjectId(vendorId);
            var now = new Date();
            var day = now.getUTCDay() + 1;
            var start = "$working_hours." + day + ".start";
            var end = "$working_hours." + day + ".end";
              var matchCondition='';
            if(salonId!='')
                   {
                     var  salon=mongoose.Types.ObjectId(salonId);
                       matchCondition={"$match":{"_id":salon}};
                   }else{
                        matchCondition={"$match":{"vendor_id":id}};
                   }
            db.salon.aggregate([
                matchCondition,
                {"$lookup":{"from":"rating","let":{"salon_id":"$_id"}
                    ,"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$rated_by",1]}]}}}],"as":"rating"}},
                {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},
                    "pipeline": [{
                        '$match': {
                            '$expr': {
                                '$and': [{'$eq': ['$salon_id','$$salon_id']}]
                            }
                        }
                    },{"$group":{"_id":"$salon_id","file_path":{"$push":"$file_path"}}},
                        {"$project":{"_id":0}}

                    ],"as":"salonPictures"
                }},
                {
                    "$project": {
                        "salon_id": "$_id",
                        "_id": 0,
                        "salon_name":{"$ifNull":["$salon_name."+languagesCode,"$salon_name.en"]},
                        "salon_mobile": "$salon_mobile",
                        "salon_location": {"$ifNull":["$location",'']},
                        "salonPictures":{"$arrayElemAt":["$salonPictures.file_path",0]},
                        "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [
                            {'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                        "totalreviews":{"$size":"$rating"},
                        "status":{"$ifNull":["$status",1]},
                        "active_status":{"$ifNull":["$active_status",1]},
                        "booking_status":{"$ifNull":["$booking_status",1]},
                        "agent_status":"$agent_status",
                        "manager_status":"$manager_status"
                    }

                }], function (err, response) {

                return callback(response);
            });
        },
        getSalonsListForBooking: function (vendorId,salonId, languagesCode,callback){
            var id = mongoose.Types.ObjectId(vendorId);
            var now = new Date();
            var day = now.getUTCDay() + 1;
            var start = "$working_hours." + day + ".start";
            var end = "$working_hours." + day + ".end";
            var matchCondition='';
            if(salonId!='')
            {
                var  salon=mongoose.Types.ObjectId(salonId);
               // matchCondition={"$match":{"_id":salon,"agent_status":{"$eq":1},"manager_status":{"$eq":1}}};
                matchCondition={"$match":{"_id":salon}};
            }else{
                //matchCondition={"$match":{"vendor_id":id,"agent_status":{"$eq":1},"manager_status":{"$eq":1}}};
                matchCondition={"$match":{"vendor_id":id}};
            }
            db.salon.aggregate([
                matchCondition,
                {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},
                    "pipeline": [{
                        '$match': {
                            '$expr': {
                                '$and': [{'$eq': ['$salon_id','$$salon_id']}]
                            }
                        }
                    },{"$group":{"_id":"$salon_id","file_path":{"$push":"$file_path"}}},
                        {"$project":{"_id":0}}

                    ],"as":"salonPictures"
                }},
                {
                    "$project": {
                        "salon_id": "$_id",
                        "_id": 0,
                        "salon_name":{"$ifNull":["$salon_name."+languagesCode,"$salon_name.en"]},

                        "salonPictures":{"$arrayElemAt":["$salonPictures.file_path",0]}
                    }

                }], function (err, response) {

                return callback(response);
            });
        },
        getsalonInfo: function (salonId,languagesCode, callback){
            var id = mongoose.Types.ObjectId(salonId);
            var now = new Date();
            var day = now.getUTCDay() + 1;
            var start = "$working_hours." + day + ".start";
            var end = "$working_hours." + day + ".end";
            db.salon.aggregate([{"$match": {"_id": id}},
                {"$lookup":{"from":"rating","localField":"_id","foreignField":"salon_id","as":"ratingDetails"}},
                {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},
                    "pipeline": [{
                        '$match': {
                            '$expr': {
                                '$and': [{'$eq': ['$salon_id','$$salon_id']}]
                            }
                        }
                    },{"$group":{"_id":"$salon_id","file_path":{"$push":"$file_path"}}},
                        {"$project":{"_id":0}}

                    ],"as":"salonPictures"
                }},
                {
                    "$project": {
                        "salon_id": "$_id",
                        "_id": 0,
                        "salon_name": "$salon_name."+languagesCode,
                        "salon_mobile": "$salon_mobile",
                        "salon_location": "$location",
                        "salonPictures":{"$arrayElemAt":["$salonPictures.file_path",0]},
                        'rating':{"$ifNull":[{"$avg":"$ratingDetails.rating"},0]},
                        "status":{"$ifNull":["$status",1]}
                    }
                }], function (err, response) {
                return callback(response);
            });
        }, findFieldsWithPromises: function (check, fields) {
        return new Promise(function(resolve){

            db.salon.find(check, fields ,function (err, response) {
                resolve(response);
            });
        });
    },
        findFields: function (check, fields, callback){
            db.salon.find(check, fields,function (err, response)
            {
                return  callback(response);
            });
        },
        getSalonDetails: function (salonId, callback)
        {
            var id = mongoose.Types.ObjectId(salonId);

            db.salon.aggregate([{"$match": {"_id": id}},
                {
                    "$lookup": {
                        "from": "salonEmployees",
                        "localField": "_id",
                        "foreignField": "salon_id",
                        "as": "salonEmployees"
                    }
                },
                {"$unwind": "$salonEmployees"},
                {
                    "$graphLookup": {
                        "from": "services",
                        "startWith": "$salonEmployees.expertise",
                        "connectFromField": "salonEmployees.expertise",
                        "connectToField": "_id",
                        "as": "expertise"
                    }
                }, {
                    "$graphLookup": {
                        "from": "styles",
                        "startWith": "$salonEmployees.styles",
                        "connectFromField": "salonEmployees.styles",
                        "connectToField": "_id",
                        "as": "styles"
                    }
                },
                {
                    "$lookup": {
                        "from": "vendorLocation",
                        "localField": "_id",
                        "foreignField": "salon_id",
                        "as": "vendorLocation"
                    }
                },
                {"$unwind": "$vendorLocation"},
                {"$lookup": {"from": "rating", "localField": "_id", "foreignField": "salon_id", "as": "rating"}},
                {
                    "$lookup": {
                        "from": "salonPictures",
                        "localField": "_id",
                        "foreignField": "salon_id",
                        "as": "salonPictures"
                    }
                },
                {"$lookup": {"from": "portfolio", "localField": "_id", "foreignField": "salon_id", "as": "portfolio"}},
                {"$project": {
                    "salonEmployees": {
                        "employee_name": "$salonEmployees.employee_name",
                        "expertise": "$expertise.service_name.en",
                        "styles": "$styles.style",
                        "employee_id": "$salonEmployees._id",
                        "profile_pic": "$salonEmployees.profile_pic"
                    }, "salon": {
                        "salon_id": "$_id",
                        "salon_name": "$salon_name",
                        "about": "$about",
                        "salon_mobile": {"$concat":["$country_code",' ',"$phone"]},
                        "working_hours": "$working_hours",
                        "salon_pictures": "$salonPictures.file_path",
                        "latitude": {"$arrayElemAt": ["$vendorLocation.location.coordinates", 1]},
                        "longitude": {"$arrayElemAt": ["$vendorLocation.location.coordinates", 0]}
                    },
                    "salonRating": {
                        "1": {
                            "$sum": {
                                "$size": {
                                    "$filter": {
                                        "input": "$rating",
                                        "as": "one",
                                        "cond": {"$eq": ["$$one.rating", 1]}
                                    }
                                }
                            }
                        },
                        "2": {
                            "$sum": {
                                "$size": {
                                    "$filter": {
                                        "input": "$rating",
                                        "as": "one",
                                        "cond": {"$eq": ["$$one.rating", 2]}
                                    }
                                }
                            }
                        },
                        "3": {
                            "$sum": {
                                "$size": {
                                    "$filter": {
                                        "input": "$rating",
                                        "as": "one",
                                        "cond": {"$eq": ["$$one.rating", 3]}
                                    }
                                }
                            }
                        },
                        "4": {
                            "$sum": {
                                "$size": {
                                    "$filter": {
                                        "input": "$rating",
                                        "as": "one",
                                        "cond": {"$eq": ["$$one.rating", 4]}
                                    }
                                }
                            }
                        },
                        "5": {
                            "$sum": {
                                "$size": {
                                    "$filter": {
                                        "input": "$rating",
                                        "as": "one",
                                        "cond": {"$eq": ["$$one.rating", 5]}
                                    }
                                }
                            }
                        },
                        "totalrating": {"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]}, "totalreviews": {"$size": "$rating"}
                    }, "portfolio": "$portfolio.file_path"
                }
                },
                {
                    "$group": {
                        "_id": "$salon.salon_id", "salonEmployees": {"$push": "$salonEmployees"},
                        "salon": {"$first": "$salon"},
                        "rating": {"$first": "$salonRating"}, "portfolio": {"$first": "$portfolio"}
                    }
                }
                , {"$project": {"_id": 0}}
            ], function (err, response) {
                return callback(response);
            });
        },
        getServiceDetails: function (customerId, salonId, callback)
        {
            var salon = mongoose.Types.ObjectId(salonId);
            var customer = mongoose.Types.ObjectId(customerId);
            db.salon.aggregate([{"$match": {"_id": salon}},
                {"$unwind": "$services"},
                {
                    "$lookup": {
                        "from": "services",
                        "localField": "services.service_id",
                        "foreignField": "_id",
                        "as": "servicesDetails"
                    }
                },
                {"$unwind": "$servicesDetails"},
                {
                    "$lookup": {
                        "from": "subCategory",
                        "localField": "servicesDetails.sub_category_id",
                        "foreignField": "_id",
                        "as": "subCategoryDetails"
                    }
                },
                {"$unwind": "$subCategoryDetails"},
                {'$lookup': {
                    "from": 'cart', "let": {"sub_category_id": '$subCategoryDetails._id'},
                    "pipeline": [{
                        '$match': {
                            '$expr': {
                                '$and': [{'$eq': ['$sub_category_id', '$$sub_category_id']},
                                    {'$eq': ['$customer_id', customer]}]
                            }
                        }
                    }], as: 'cart'
                }
                },
                {'$group': {
                    _id: '$subCategoryDetails._id',
                    subCategory: {
                        '$first': {
                            sub_category_name: '$subCategoryDetails.sub_category_name',
                            category_id: '$subCategoryDetails.category_id',
                            sub_category_id: '$subCategoryDetails._id',
                            url: '$subCategoryDetails.url',
                            cart: {
                                "women": {
                                    "$size": {
                                        $filter: {
                                            "input": "$cart", as: "cartValues",
                                            cond: {"$eq": ["$$cartValues.selected_for", 1]}
                                        }
                                    }
                                }, "girl": {
                                    "$size": {
                                        $filter: {
                                            "input": "$cart", as: "cartValues",
                                            cond: {"$eq": ["$$cartValues.selected_for", 2]}
                                        }
                                    }
                                }, "men": {
                                    "$size": {
                                        "$filter": {
                                            "input": "$cart", as: "cartValues",
                                            cond: {"$eq": ["$$cartValues.selected_for", 3]}
                                        }
                                    }
                                },"boy": {
                                    "$size": {
                                        "$filter": {
                                            "input": "$cart", as: "cartValues",
                                            cond: {"$eq": ["$$cartValues.selected_for", 4]}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                },
                {
                    '$lookup': {
                        from: 'category',
                        localField: 'subCategory.category_id',
                        foreignField: '_id',
                        as: 'categoryData'
                    }
                },
                {
                    '$group': {
                        _id: '$categoryData._id',
                        sub_cateogry: {'$push': '$subCategory'},
                        category: {'$first': '$categoryData'}
                    }
                },
                {'$unwind': '$category'},
                {"$project": {"_id": 0, "cat": "$category", "sub_category": "$sub_cateogry"}}
            ], function (err, response) {
                return callback(response);
            });
        },getCustomerSalonDetails:function(salonId,customerId,latitude,longitude,languageCode,callback)
        {
        var salon = mongoose.Types.ObjectId(salonId);
        var user = mongoose.Types.ObjectId(customerId);
        db.salon.aggregate([{"$match":{"_id":salon }},
            {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},"pipeline":
                [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$salon_id",
                    "file_path":{"$push":"$file_path"}}},

                    {"$project":{"_id":0}}],"as":"salonPitures"}},
            {"$lookup":{"from":"portfolio","let":{"salon_id":"$_id"},"pipeline":
                [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$salon_id",
                    "file_path":{"$push":"$file_path"}}},

                    {"$project":{"_id":0}}],"as":"portfolio"}},
            {"$unwind":{"path":"$portfolio","preserveNullAndEmptyArrays": true}},
            {"$lookup":{"from":"rating","let":{"salon_id":"$_id"},'pipeline':
                [{"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$status",1]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices","let":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$service_id","$service_id"]},
                            {"$eq":["$$service_for","$service_for"]},
                            {"$eq":["$$salon_id","$salon_id"]},{"$eq":["$status",1]}]}}},
                            {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                                "employeeServiceCount":{"$sum":1}}},
                            {"$match":{"$expr":{"$and":[{"$gte":["$employeeServiceCount",1]}]}}}
                        ],"as":"employeeServices"}},
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$employeeServices"},0]}]}}}
                ],"as":"salonServices"}},

            {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$ne":["$status",0]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices","let":{"service_id":"$service_id","salon_id":"$salon_id","service_for":"$service_for"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service_id"]},{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$service_for","$$service_for"]},{"$ne":["$status",0]}]}}},
                            {"$group":{"_id":"$salon_id","service_for":{"$addToSet":"$service_for"}}}
                        ],
                        "as":"salonEmployeeServices"}},
                    {"$unwind":"$salonEmployeeServices"},
                    {"$group":{"_id":"$salon_id","service_for":{$addToSet:"$service_for"}}}
                ],"as":"salonServicesWorking"}},
            {"$unwind":"$salonServicesWorking"},
            {"$lookup":{"from":"salonPackages","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$status",1]}]}}},{"$unwind":"$services"},
                    {"$lookup":{"from":"services","localField":"services.service_id","foreignField":"_id","as":"serviceDetails"}},
                    {"$lookup":{"from":"salonServices","let":{"service":"$services.service_id","service_for":"$services.service_for",
                        "salon_id":"$salon_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service"]},
                            {"$eq":["$service_for","$$service_for"]},{"$eq":["$salon_id","$$salon_id"]},{"$ne":["$status",0]}
                            ]}}}],
                        "as":"salonServices"}},
                    {"$unwind":"$salonServices"},
                    {"$unwind":"$serviceDetails"},
                    {"$group":{"_id":"$_id","services_details":
                        {"$push":{"service_name":"$serviceDetails.service_name.en",
                            "service_cost":"$salonServices.service_cost",
                            "service_time":"$salonServices.service_time",
                            "service_for":"$services.service_for"
                        }},
                        "package_name":{"$first":"$package_name"},
                        "package_for":{"$first":"$package_for"},
                        "total_service_time":{"$sum":"$salonServices.service_time"},
                        "discount_amount":{"$first":"$discount_amount"},
                        "total_service_cost":{"$sum":"$salonServices.service_cost"},
                        "package_amount":{"$first":"$package_amount"}}},
                    {"$lookup":{"from":"cart","let":{"package_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$package_id","$$package_id"]},{"$eq":["$status",1]},{"$eq":["$customer_id",user]}]}}}],"as":"cartItems"}},
                    {"$unwind":{"path":"$cartItems","preserveNullAndEmptyArrays": true}},
                    {"$project":{"_id":0,
                        "cart_id":'$cartItems._id',
                        "quantity":"$cartItems.quantity",
                        "package_id":"$_id",
                        "service_details":"$services_details",
                        "package_amount":{"$subtract":["$total_service_cost","$discount_amount"]},
                        "package_name":"$package_name","package_for":"$package_for",
                        "total_service_cost":"$total_service_cost",
                        "total_service_time":"$total_service_time"}}
                ],
                "as":"salonPackages"}},
            {"$lookup":{"from":"vendorLocation","let":{"salon_id":"$_id"},"pipeline":[{'$geoNear':{"near":{"type": 'Point',
                coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                spherical: true,
                "query" : {"salon_id":salon}
            } }
                ],"as":"salonLocation"}},
            {"$unwind":"$salonLocation"},
            {"$unwind":{"path":"$salonPitures","preserveNullAndEmptyArrays": true}},
            {"$lookup":{"from":"cart","pipeline":[
                {"$match": {"customer_id":user , "cart_type": 2, "status": 1}},
                {"$group":{"_id":{"customer_id":"$customer_id","package_id":"$package_id"},
                "service_items":{"$push":{"$cond":[{"$eq":["$is_package",1]},"","$$ROOT"]}},
                "package_items":{"$first":{"$cond":[{"$eq":["$is_package",1]},"$$ROOT",{}]}}}},   
                {"$group":{"_id":"$_id.customer_id","package_items":{"$push":"$package_items"},
    "service_items":{"$first":{ '$filter': { input: '$service_items', as: 'service', cond: { '$ne': [ '$$service', "" ] } } }}}},
            {"$project":{ "services":{$concatArrays: [ "$service_items", "$package_items" ]} }},
            
            {"$unwind":"$services"},
             {"$match":{"services.service_id":{"$exists":true}}},
               { $replaceRoot: { newRoot: "$services" } }, 
              
                {
                    "$lookup": {
                        "from": "salonPackages", "let": {"package_id": "$package_id","salon_id":"$salon_id"},
                        "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$_id", "$$package_id"]}]}}},
                            {"$unwind": "$services"},
                            {"$lookup":
                                {
                                    "from": "salonServices",
                                    "let": {"service": "$services.service_id", "service_for": "$services.service_for"},
                                    "pipeline": [{"$match": {"$expr": {"$and": [{"$eq": ["$service_id", "$$service"]},
                                        {"$eq": ["$service_for", "$$service_for"]},{"$eq":["$salon_id","$$salon_id"]},{"$ne":["$status",0]}]}}}],
                                    "as": "salonServices"
                                }
                            },
                            {"$unwind": "$salonServices"},
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "service_time":{"$sum":"$salonServices.service_time"},
                                    "package_amount":{"$first": "$package_amount"}
                                }
                            }
                        ], "as": "salonPackages"
                    }
                },
                {
                    "$lookup": {
                        "from": "salonServices",
                        "let": {"service_id": "$service_id", "salon_id": "$salon_id", "selected_for": "$selected_for"},
                        "pipeline": [
                            {"$match": {"$expr": {"$and": [
                                          {"$eq": ["$salon_id", "$$salon_id"]},
                                          {"$eq": ["$service_id", "$$service_id"]},
                                          {"$eq": ["$$selected_for", "$service_for"]},
                                          {"$ne":["$status",0]}
                                          ]}}},
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
                {"$unwind": {"path": "$salonServices", "preserveNullAndEmptyArrays": true}},
                {"$unwind": {"path": "$salonPackages", "preserveNullAndEmptyArrays": true}},
                {"$lookup":{"from":"cities","let":{"city_id":"$city_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$$city_id","$_id"]}]}}},
                    {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country" }},
                    {"$unwind": {"path": "$country", "preserveNullAndEmptyArrays": true}}
                    ],"as":"cities"
                }
                },
                {"$unwind": {"path": "$cities", "preserveNullAndEmptyArrays": true}},
                {"$group":{"_id":"$customer_id","cart_time":{"$sum":{"$ifNull":[
                    {"$multiply":["$salonServices.service_time","$quantity"]},
                    {"$multiply":["$salonPackages.service_time","$quantity"]}]}},
                    "cart_amount":{"$sum":{"$ifNull":[
                        { $cond: [ {"$eq":["$is_package",1]},{"$multiply":["$salonPackages.package_amount","$quantity"]},
                        {"$multiply":["$salonServices.service_cost","$quantity"]}
                    ] }
                        ,0
                        ]}},
                    'is_package':{"$first":{"$ifNull":['$is_package',0]}},
                    "cart_count":{"$sum":{"$multiply":[{"$sum":1},"$quantity"]}},
                    "currency":{"$first":{"currency":{"$ifNull":["$cities.country.currency_symbol",'₹']},
                        "currency_code":{"$ifNull":["$cities.country.currency_code","INR"]}}

                }}
                }
            ],"as":"cartDuration"}},
            {"$unwind": {"path": "$cartDuration", "preserveNullAndEmptyArrays": true}},
            {"$project":{"_id":0,
                "salon_id":"$_id",
                "salon_name":{"$ifNull":["$salon_name."+languageCode,""]},
                "special_instrutions":{"$ifNull":["$special_instrutions."+languageCode,'']},
                "salon_pictures":"$salonPitures.file_path"
                ,"view":{"$ifNull":["$type",0]},
                "portfolio":{"$ifNull":["$portfolio.file_path",[]]},
                "totalrating":
                    {"$ifNull":[{'$divide':
                        [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"},10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "for":{"$ifNull":["$salonServicesWorking.service_for",[1,2]]},
                "services_count":1,
                "packages":"$salonPackages",
                "about":{"$ifNull":["$intro."+languageCode,'']},
                //"facilities":[{"wifi":'$wifi_available',"parking":'$parking_available', "kids":'$kids_friendly',"handicap":'$handicap', "pets":'$pets'}],
                "facilities":[
                    {"$cond": {
                        "if": { "$eq": [ "$wifi_available", 1 ] },
                        "then": "wifi available",
                        "else": ""
                    }},
                    {"$cond": {
                        "if": { "$eq": [ "$parking_available", 1 ] },
                        "then": "parking available",
                        "else": ''
                    }},
                    {"$cond": {
                        "if": { "$eq": [ "$kids_friendly", 1 ] },
                        "then": "kids friendly",
                        "else": ''
                    }},
                    {
                        "$cond": {
                            "if": { "$eq": ["$handicap",1]},
                            "then": "handicap accessible",
                            "else": ""
                        }
                    },
                    { "$cond": {
                        "if": {"$eq": ["$pets",1] },
                        "then": "pets friendly",
                        "else": ""
                    }}
                    ],
                "salon_timings":"$timing",
                "special_instructions":{"$ifNull":["$special_instructions."+languageCode,""]},
                "cancelation":"",
                "salonServices":{"$size":"$salonServices"},
                "location" : {"latitude":{"$arrayElemAt":["$salonLocation.location.coordinates",1]},
                    "longitude":{"$arrayElemAt":["$salonLocation.location.coordinates",0]},
                    "address":{"$ifNull":["$salonLocation.address",'']},
                    "distance":{
                        $divide: [{
                            $trunc: {
                                $multiply: ["$salonLocation.distance", 1000]
                            }
                        }, 1000]
                    }
                },"salon_rating":{"1":{"$size":{"$ifNull":[{"$filter":{"input":"$rating","as":"one",
                    "cond":{"$and":[{"$gte":["$$one.rating",0]}, {"$lt":["$$one.rating",2]}]}}},[]]}},
                    "2":{"$size":{"$ifNull":[{"$filter":{"input":"$rating","as":"two",
                        "cond":{"$and":[{"$gte":["$$two.rating",2]},{"$lt":["$$two.rating",3]}]}}},[]]}}
                    ,"3":{"$size":{"$ifNull":[{"$filter":{"input":"$rating","as":"three",
                        "cond":{"$and":[{"$gte":["$$three.rating",3]},{"$lt":["$$three.rating",4]}]}}},[]]}},
                    "4":{"$size":{"$ifNull":[{"$filter":{"input":"$rating","as":"four",
                        "cond":{"$and":[{"$gte":["$$four.rating",4]},{"$lt":["$$four.rating",5]}]}}},[]]}},
                    "5":{"$size":{"$ifNull":[{"$filter":{"input":"$rating","as":"five",
                        "cond":{"$and":[{"$eq":["$$five.rating",5]}]}}},[]]}}   },
                "cart":"$cartDuration"}},
            {"$project":{"_id":0,
                "salon_id":1,
                "salon_name":1,
                "special_instrutions":1,
                "salon_pictures":1
                ,"view":1,
                "portfolio":1,
                "totalrating":1,
                "totalreviews":1,
                "for":1,
                "services_count":1,
                "packages":1,
                "about":1,
                //"facilities":[{"wifi":'$wifi_available',"parking":'$parking_available', "kids":'$kids_friendly',"handicap":'$handicap', "pets":'$pets'}],
                "facilities":{"$filter":{"input":"$facilities","as":"check","cond":{"$and":[{'$ne':["$$check",'']}]}}},
                "salon_timings":1,
                "special_instructions":1,
                "cancelation":1,
                "salonServices":1,
                "location" : 1,
                "longitude":1,
                "address":1,
                "distance":1
                ,"salon_rating":1,"cart":1}}
        ],function(err,response){



            return callback(response);
        });
    },checkSalonStaff:function(salonId,callback)
    {
        var salon = mongoose.Types.ObjectId(salonId);

        db.salonEmployees.aggregate([{"$match":{"salon_id":salon}},
            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertise"}},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$salon_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$service_id"}}],"as":"salonServices"}},
            {"$project":{"_id":0,"employee_id":"$_id","name":"$employee_name","about":"$about","languages":"","expertise":"$expertise.service_name.en",
                "working_hours":"$working_time","services":{"$size":"$salonServices"},"for":[1,2],"profile_pic":"$profile_pic",
                "country":""}}],function(err,response){

            return callback(response);
        });

    },getSalonPackages:function(salonId,customerId,callback)
    {
        var salon = mongoose.Types.ObjectId(salonId);
        var user = mongoose.Types.ObjectId(customerId);
        try{
            db.salon.aggregate([
                {"$match":{"_id":salon }},
                {"$lookup":{"from":"salonPackages","let":{"salon_id":"$_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$unwind":"$services"},
                        {"$lookup":{"from":"services","localField":"services.service_id","foreignField":"_id","as":"servicesDetails"}},
                        {"$lookup":{"from":"salonServices","let":{"service":"$services.service_id",
                            "service_for":"$services.service_for",
                            "salon_id" : "$salon_id"},
                            "pipeline":[
                                {"$match":{"$expr":{"$and":[
                                {"$eq":["$service_id","$$service"]},
                                {"$eq":["$salon_id","$$salon_id"]},
                                {"$eq":["$service_for","$$service_for"]},
                                {"$ne":["$status",0]}
                                ]}}}],
                            "as":"salonServices"}},
                        {"$unwind":"$salonServices"},
                        {"$unwind":"$servicesDetails"},
                        {"$group":{"_id":"$_id","services_details":{"$push":{
                            "service_name":"$servicesDetails.service_name.en",
                            "service_cost":"$salonServices.service_cost",
                            "service_for":"$services.service_for",
                            "service_time":"$salonServices.service_time"}},
                            "package_name":{"$first":"$package_name"},
                            "package_for":{"$first":"$package_for"},
                            "total_service_time":{"$sum":"$salonServices.service_time"},
                            "total_service_cost":{"$sum":"$salonServices.service_cost"},
                            "package_amount":{"$first":"$package_amount"}}},
                        {"$lookup":{"from":"cart","let":{"package_id":"$_id"},"pipeline":[
                            {"$match":{"$expr":{"$and":[{"$eq":["$package_id","$$package_id"]},
                                {"$eq":["$status",1]},
                                {"$eq":["$customer_id",user]}]}}}],"as":"cartItems"}},
                        {"$unwind":{"path":"$cartItems","preserveNullAndEmptyArrays": true}},
                        {"$group":{"_id":"$_id","cart_id":{"$first":{"$ifNull":['$cartItems._id','']}},
                        "quantity":{"$first":{"$ifNull":["$cartItems.quantity",0]}},
                        "package_id":{"$first":"$_id"},
                        "service_details":{"$first":"$services_details"},
                        "package_amount":{"$first":"$package_amount"},
                        "package_name":{"$first":"$package_name"},
                        "package_for":{"$first":"$package_for"},
                        "total_service_cost":{"$first":"$total_service_cost"},
                        "total_service_time":{"$first":"$total_service_time"}}}
                    ],
                    "as":"salonPackages"}},
                {"$project":{"_id":0,"packages":"$salonPackages"}}
            ],function(error , response){
                return callback(response);
            });
        }catch(Exception){

        }

    },getAllServices:function(countryId,cityId,languagesCode,callback)
    {
        var country = mongoose.Types.ObjectId(countryId);
        var city = mongoose.Types.ObjectId(cityId);

        db.services.aggregate([
            {'$lookup':{ from: 'category',"let":{"category_id":"$category_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$category_id","$_id"]},
                    {"$eq":["$service_type",2]},
                    {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]}]}
                ]}}}], as: 'category' } },
            {"$unwind":"$category"},
            {"$facet":
                {
                    "women":[{"$match":{"$and":[{"category.category_for":{"$in":[1]}}],
                        "service_cities":{"$in":[city]},"service_for":{"$in":[1]}}},
                        {"$group":{"_id":"$category._id",
                            "category":{"$first":{"category_name":{"$ifNull":["$category.category_name."+languagesCode,"$category.category_name.en"]},
                                "category_id":"$category._id",
                                "url":"$category.url",
                                "video_url":"$category.video_url"}},
                            "services":{"$push":{"service_id":
                                "$_id","service_name":{"$ifNull":["$service_name."+languagesCode,"$service_name.en"]},
                                "url":"$url","service_quatity":{"$cond":
                                    [{"$eq":["$cartValues.selected_for",1]},"$cartValues.selected_service_level",'']}

                            }}}}

                    ],"girl":[{"$match":{"$and":[{"category.category_for":{"$in":[2]}}],
                    "service_cities":{"$in":[city]} ,"service_for":{"$in":[2]}}},
                    {"$group":{"_id":"$category._id",
                        "category":{"$first":{"category_name":{"$ifNull":["$category.category_name."+languagesCode,"$category.category_name.en"]},"category_id":"$category._id","url":"$category.url","video_url":"$category.video_url"}},
                        "services":{"$push":{"service_id":"$_id","service_name":"$service_name.en",
                            "url":"$url","service_quatity":{"$cond":
                                [{"$eq":["$cartValues.selected_for",2]},"$cartValues.selected_service_level",'']}

                        }}}}
                ],"men":[{"$match":{"$and":[{"category.category_for":{"$in":[3]}}],
                    "service_cities":{"$in":[city]},"service_for":{"$in":[3]} }},
                    {"$group":{"_id":"$category._id",
                        "category":{"$first":{"category_name":{"$ifNull":["$category.category_name."+languagesCode,"$category.category_name.en"]},"category_id":"$category._id","url":"$category.url","video_url":"$category.video_url"}},
                        "services":{"$push":{"service_id":"$_id","service_name":{"$ifNull":["$service_name."+languagesCode,"$service_name.en"]},

                            "url":"$url","service_quatity":{"$cond":
                                [{"$eq":["$cartValues.selected_for",3]},"$cartValues.selected_service_level",'']}


                        }}}}
                ],"boy":[{"$match":{"$and":[{"category.category_for":{"$in":[4]}}]
                    ,"service_cities":{"$in":[city]} ,"service_for":{"$in":[4]}}},
                    {"$group":{"_id":"$category._id",
                        "category":{"$first":{"category_name":{"$ifNull":["$category.category_name."+languagesCode,"$category.category_name.en"]},"category_id":"$category._id","url":"$category.url","video_url":"$category.video_url"}},
                        "services":{"$push":{"service_id":"$_id","service_name":{"$ifNull":["$service_name."+languagesCode,"$service_name.en"]},
                            "url":"$url","service_quatity":{"$cond":
                                [{"$eq":["$cartValues.selected_for",4]},"$cartValues.selected_service_level",'']}
                        }}}}
                ], "country":[
                    {
                        $bucketAuto: {
                            groupBy: "$created_at",
                            buckets: 1
                        }
                    },
                    {"$project":{"_id":0}},

                    {"$lookup":{"from":"country","let":{"country_id":country},
                        "pipeline":[{"$match":{"$expr":
                            {"$and":[{"$eq":["$_id",country]}]}}}],"as":"country"}}
                    ,{"$unwind":"$country"},

                    {"$project":{"currency":"$country.currency_symbol","currency_code":"$country.currency_code"}}

                ]
                }
            }

        ],function(err,response)
        {

            return callback(response);
        });
    },getSalongeneralDetails:function(salonId,callback)
    {
        var salon = mongoose.Types.ObjectId(salonId);

        db.salon.find([{"_id":salon}
        ],function(err,response){
            return callback(response);
        });
    },getCountryDocuments:function(salonId,languagesCode,callback)
    {

        var salon=mongoose.Types.ObjectId(salonId);
        db.salon.aggregate([
            {"$match":{"_id":salon }},
            {"$lookup":{"from":"country","let":{"country":"$country_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$country","$_id"]}]}}},
                    {"$unwind":"$salon_documents"},
                    {"$lookup":{"from":"documents","let":{"document_id":"$salon_documents"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$_id","$$document_id"]},{"$eq":["$status",1]}]}}}]
                        ,"as":"documents"}},
                    {"$unwind":"$documents"},
                    {"$project":{"document_id":"$documents._id","document_name":{"$ifNull":["$documents.document_name."+languagesCode,"$documents.document_name.en"]}
                        ,"is_expiry_date":"$documents.is_expiry_date"}}],"as":"documents"}},
            {"$unwind":"$documents"},
            {"$project":{"document_name":"$documents.document_name","document_id":"$documents.document_id","is_expiry_date":"$documents.is_expiry_date"}}
        ],function(err,response){

            return callback(response);
        });
    },getCountryDocumentsServeOut:function(salonId,languagesCode,callback){

        var salon=mongoose.Types.ObjectId(salonId);

        db.salon.aggregate([
            {"$match":{"_id":salon }},
            {"$lookup":{"from":"country","let":{"country":"$country_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$country","$_id"]}]}}},
                    {"$unwind":"$stylist_documents"},
                    {"$lookup":{"from":"documents","let":{"document_id":"$stylist_documents"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$_id","$$document_id"]},{"$eq":["$status",1]}]}}}]
                        ,"as":"documents"}},
                    {"$unwind":"$documents"},
                    {"$project":{"document_id":"$documents._id","document_name":{"$ifNull":["$documents.document_name."+languagesCode,"$documents.document_name.en"]}
                        ,"is_expiry_date":"$documents.is_expiry_date"}}],"as":"documents"}},
            {"$unwind":"$documents"},
            {"$project":{"document_name":"$documents.document_name","document_id":"$documents.document_id","is_expiry_date":"$documents.is_expiry_date"}}
        ],function(err,response){

            return callback(response);
        });
    },getCurrency:function(salonId){
        var salon = new mongoose.Types.ObjectId(salonId);

        return new Promise(function (resolve) {

            db.salon.aggregate([{"$match": {"_id": salon}},
                {
                    "$lookup": {
                        "from": "country",
                        "localField": "country_id",
                        "foreignField": "_id",
                        "as": "countryDetails"
                    }
                },
                {"$unwind": "$countryDetails"},
                {
                    "$project": {
                        "country_id": "$country_id",
                        "city_id": "$city_id",
                        "dollar_conversion_rate":"$countryDetails.dollar_conversion_rate",
                        "currency_code": "$countryDetails.currency_code",
                        "currency_symbol": "$countryDetails.currency_symbol",
                        "_id": 0
                    }
                }
            ], function (err, response) {

                resolve(response);
            });
        });
    },getAdminCurrency:function(salonId)
    {
        var salon = new mongoose.Types.ObjectId(salonId);

        return new Promise(function(resolve){

            db.salon.aggregate([{"$match":{"_id":salon}},
                {"$lookup":{"from":"vendor","localField":"vendor_id","foreignField":"_id","as":"vendorDetails"}},
                {"$unwind":"$vendorDetails"},
                {"$lookup":{"from":"country","localField":"vendorDetails.country_id","foreignField":"_id","as":"countryDetails"}},
                {"$unwind":"$countryDetails"},
                {"$project":{"country_id":"$country_id","city_id":"$_id","currency_code":"$countryDetails.currency_code","currency_symbol":"$countryDetails.currency_symbol","_id":0}}
            ],function (err, response) {
                resolve(response);
            });
        });
    },salonBooingsList:function(vendorId,salonId,languagesCode,callback){
    var vendor = new mongoose.Types.ObjectId(vendorId);
    /*  conver the date string to date
     "booked_a_date":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date:
     { $dateFromString : { dateString: {"$concat":["$bookingDetails.date",' ', "$bookingDetails.time"]}, timezone: "$bookingDetails.timezone",}}}}

     */
    var matchCondition={"$match":{"vendor_id":vendor}}

    if(salonId!='')
    {
        var salon = new mongoose.Types.ObjectId(salonId);
        matchCondition={"$match":{"_id":salon}};
    }
    db.salon.aggregate([
        matchCondition,
        {"$lookup":{"from":"bookings","let":{"salon_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$salon_id",
                                    "$salon_id"]},{"$or":[{"$eq":["$status",2]},{"$eq":["$status",4]},{"$eq":["$status",5]},
                                    {"$eq":["$status",7]},{"$eq":["$status",8]},{"$eq":["$status",10]}]}]}}}],"as":"bookingDetails"}},
        {"$unwind":"$bookingDetails"},
        {"$lookup":{"from":"customers","let":{"customer_id":"$bookingDetails.customer_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$customer_id","$_id"]}]}}}],"as":"customerDetails"}},
        {"$unwind":"$customerDetails"},
        {"$project":{"booking_id":"$bookingDetails._id","customer_name":{"$concat":["$customerDetails.first_name."+languagesCode," ","$customerDetails.last_name."+languagesCode]},
                "booked_date":{$dateToString:{format: "%Y-%m-%d %H:%M:%S",date:"$bookingDetails.created"}},
                "assign_date":{"$ifNull":[{"$concat":["$bookingDetails.date",' ',"$bookingDetails.time"]},{$dateToString:{format: "%Y-%m-%d %H:%M",date:"$bookingDetails.created"}}]},
                "assign_time":{"$ifNull":["$bookingDetails.time",""]},
                "status":"$bookingDetails.status",
                "salon_name":"$bookingDetails.salon_name."+languagesCode,
                "location":"$address",
                "type":{"$ifNull":["$bookingDetails.stylist_type",2]},
                "booking_inc_id":{"$concat":["#BST-",{$substr:["$bookingDetails.booking_inc_id", 0, -1 ]}]}
            }},
        {"$sort":{"assign_date":-1}}
    ],function(err,response){

        return callback(response);
    });
},updateStatus:function(data,where,callback){

        db.salon.update(where, {$addtoSet:data},{new:true},function(err, response){

            return  callback(response);

        });
    },getCancellationPolicy:function(salonId,callback)
    {
        var salon = new mongoose.Types.ObjectId(salonId);

        db.salon.aggregate([
            {"$match":{"_id":salon}},
            {"$project":{"policy":{"$ifNull":["$cancellation_policy.1.policy",[]]}}}
        ],function(err,response){
            return callback(response);
        });
    },getAllSalonsForAdmin:function(vendorId){
        return new Promise(function(resolve) {
            var vendor = new mongoose.Types.ObjectId(vendorId);

            db.salon.aggregate([{"$match": {"vendor_id": vendor}},
                {"$group": {"_id": "$vendor_id", "salons": {"$push": "$_id"}}}], function (err, response) {
                return resolve(response);
            });
        });
    },findsalonsWithCity:function(cityIds)
    {
        return new Promise(function(resolve) {
            db.salon.aggregate([{"$match":{"city_id":{"$in":cityIds}}},
                {"$group":{"_id":"$city_id","salons":{"$push":"$_id"}}}],function(err,response){
                return resolve(response);
            });
        })
    },salonOrdersList:function(salonId,languagesCode,callback)
    {
    var salon = new mongoose.Types.ObjectId(salonId);
    /*  conver the date string to date
     "booked_a_date":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date:
     { $dateFromString : { dateString: {"$concat":["$bookingDetails.date",' ', "$bookingDetails.time"]}, timezone: "$bookingDetails.timezone",}}}}
     */
    db.salon.aggregate([
        {"$match":{"_id":salon}},
        {"$lookup":{"from":"orders","let":{"salon_id":"$_id"},
            "pipeline":[{"$match":{"$expr":{"$or":[{"$eq":["$$salon_id","$salon_id"]},{"$in":["$$salon_id","$serve_out_order_salons_list"]}]}}}
            ],"as":"orderDetails"}},
          {"$unwind":"$orderDetails"},
          {"$unwind":"$orderDetails.booking_id"},  
        {"$lookup":{"from":"bookings","let":{"booking_id":"$orderDetails.booking_id","salon_id":"$_id"},"pipeline":[
            {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]},
            {"$eq":["$$booking_id","$_id"]},{"$eq":["$status",1]}]}}}],"as":"bookingDetails"}},
        {"$unwind":"$bookingDetails"},
        {"$group":{"_id":"$orderDetails._id","bookingDetails":{"$first":"$bookingDetails"},
        "orderDetails":{"$first":{"customer_id":"$orderDetails.customer_id",
        "created":"$orderDetails.created","order_inc_id":"$orderDetails.order_inc_id"}},

        "salon_details":{"$first":{"salon_name":"$salon_name","address":"$address"}}
    }},
        {"$lookup":{"from":"customers","let":{"customer_id":"$orderDetails.customer_id"},
            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$customer_id","$_id"]}]}}}],"as":"customerDetails"}},
        {"$unwind":"$customerDetails"},
        {"$project":{"order_id":{"$cond":[{"$eq":["$bookingDetails.stylist_type",3]},"$bookingDetails._id","$_id"]},
            "customer_name":"$customerDetails.first_name."+languagesCode,
            "is_package":"$bookingDetails.is_package",
            "type":{"$ifNull":["$bookingDetails.stylist_type",2]},
            "booked_date":{$dateToString:{format: "%Y-%m-%d %H:%M:%S",date:"$orderDetails.created"}},
            "status":"$orderDetails.status",
            "salon_name":"$salon_details.salon_name."+languagesCode,
            "location":"$salon_details.address",
            "order_inc_id":"$orderDetails.order_inc_id"
        }},
        {"$sort":{"booked_date":-1}}
    ],function(err,response){

        return callback(response);
    });
},updateManyWithPromises:function(data,where){
    return new Promise(function(resolve){
        db.salon.update(where, {$set:data}, {multi: true}, function(err, response){

            resolve(response);

        });
    });},updateWithPromises:function(data,where){
    return new Promise(function(resolve){
        db.salon.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            resolve(response);

        });
    });
},promotionAmount:function(vendorId,salonId,startDate,endDate)
    {

        var vendor = new mongoose.Types.ObjectId(vendorId);
        var matchCondtion={"$match":{"vendor_id":vendor}};
        if(salonId!='')
        {
            var salon = new mongoose.Types.ObjectId(salonId);
            matchCondtion={"$match":{"_id":salon}}
        }

        return new Promise(function(resolve)
        {
            db.salon.aggregate([
                matchCondtion,
                {"$unwind": "$promotions"},

                {"$match":{"promotions.to":{
                    $gte: new Date(startDate),
                    $lte: new Date(endDate) }}},
                {"$group": {"_id": "$vendor_id", "amount": {"$sum": "$promotions.promotion_amount"}}}

            ],function(err,response)
            {
                 return resolve(response);
            });
        });
    },updateArrays:function(data,where){
        return new Promise(function(resolve){

            db.salon.update(where, {$push:data}, {new: true}, function(err, response){
                return  resolve(response);

            });

        })
    },getPaymentCard:function (vendorId)
{
    var vendor = mongoose.Types.ObjectId(vendorId);
    return  new Promise(function(resolve)
    {
        db.salon.aggregate([
            {"$match":{"_id":vendor}},
            {"$unwind":"$payment"},
            {"$match":{"payment.status":1}},
            {"$group":{"_id":"$_id"
                    ,"payment":{"$push":{"_id":"$payment._id","last4":"$payment.last4","brand":"$payment.brand","is_primary":"$payment.is_primary"}}}},
            {"$project":{"_id":0,"payment":1}}
        ],function(err,response){
            console.log(err,vendor);
            console.log(response);
            return resolve(response);
        })
    });

},getPaymentCardDetails:function (salonId,cardId)
{
    var salon = mongoose.Types.ObjectId(salonId);
    var card = mongoose.Types.ObjectId(cardId);
    return  new Promise(function(resolve) {
        db.salon.aggregate([
            {"$match":{"_id":salon}},
            {"$unwind":"$payment"},
            {"$match":{"payment._id":card}},
            {"$project":{"_id":0,"strip_account_id":1,"payment":{"_id":"$payment._id","last4":"$payment.last4","brand":"$payment.brand","is_primary":"$payment.is_primary","id":"$payment.id"}}},

        ],function(err,response){

            return resolve(response);
        })
    });

},promotionList:function(salonId,startDate,endDate,languageCode,callback)
        {
            var salon = new mongoose.Types.ObjectId(salonId);
            var matchCondtion={"$match":{"_id":salon}};

            db.salon.aggregate([
                matchCondtion,
                {"$unwind": "$promotions"},
                {"$match":{"promotions.to":{
                            $gte: new Date(startDate),
                            $lte: new Date(endDate) }}},
                {"$lookup":{"from":"promotions","localField":"promotions.promotion_id","foreignField":"_id","as":"promotionDetails"}},
                {"$unwind":"$promotionDetails"},
                {"$project":{"title":{"$ifNull":["$promotionDetails.title."+languageCode,"$promotionDetails.title.en"]},
                        "date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotions.to"} },
                        "amount":'$promotions.promotion_amount',"promotion_id":"$promotions.promotion_id",
                        "target_amount":"$promotionDetails.target_amount",
                        "promotion_image":"$promotionDetails.promotion_image",
                        "promotion_type":"$promotionDetails.promotion_type",
                        "valid_from":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotionDetails.valid_from"} },
                        "valid_up_to":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$promotionDetails.valid_up_to" } }}}
            ],function(err,response)
            {
                     console.log(err);
                     console.log(response);
                return callback(response);
            });
        }


    };
