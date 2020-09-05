var db = require('../db');
var mongoose = require('mongoose');

module.exports =
    {
        save: function (values, callback) {
            var services = new db.salonServices(values);

            services.save(function (err, response) {

                callback(response);
            });
        }, saveSalonPackage: function (values, callback) {
            var packages = new db.salonPackages(values);

        packages.save(function (err, response) {

                callback(response);
            });
        },
        updateWithPromises:function(data,where){
      return new Promise(function(resolve){
          db.salonServices.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

              resolve(response);

          });
      });
    },find:function (check, callback) {
        db.salonServices.find(check, function (err, response){

            return callback(response);
        });
    },update:function(data,where,callback)
    {
        db.salonServices.findOneAndUpdate(where, {$set:data}, {new: true},function(err, response){

            callback(response);

        });
    }, findFieldsWithPromises: function (check, fields) {
    return new Promise(function(resolve){

        db.salonServices.find(check, fields ,function (err, response) {

            resolve(response);
        });
    });
},
        updateMany:function(data,where,callback){
            db.salonServices.update(where, {$set:data},{ multi: true }, function(err, response){

                callback(response);

            });
        },
        insertMany: function (values, callback)
        {


            db.salonServices.insertMany(values,function (err, response) {

                return   callback(response);
            });
        },
        getSalonServices:function(salonId,cityId,userId,callback)
        {
            var id=mongoose.Types.ObjectId(salonId);
            var city=mongoose.Types.ObjectId(cityId);
            var user=mongoose.Types.ObjectId(userId);
            db.salonServices.aggregate([
                {"$match":{"salon_id":id,"status":1}},
                {"$lookup":{"from":"salonEmployeeServices","let":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$service_id","$service_id"]},
                        {"$eq":["$$service_for","$service_for"]},
                        {"$eq":["$$salon_id","$salon_id"]},{"$eq":["$status",1]}]}}},
                        {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                            "employeeServiceCount":{"$sum":1}}},
                        {"$match":{"$expr":{"$and":[{"$gte":["$employeeServiceCount",1]}]}}}
                    ],"as":"employeeServices"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$employeeServices"},0]}]}}},
                {"$lookup":{"from":"services","let":{"service_id":"$service_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$service_id","$_id"]}]}}}],"as":"services"}},
                {"$lookup":{"from":"category","let":{"category_id":"$category_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$category_id","$_id"]},{"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]}]}]}}}],"as":"category"}},
                {"$unwind":"$services"},
                {"$unwind":"$category"},
                { '$lookup': { from: 'cart', let: { service_id: '$service_id' },
                    pipeline: [
                        { '$match': { '$expr': { '$and': [{"$eq":["$salon_id",id]},{"$ne":["$is_package",1]}, { '$eq': [ '$service_id', '$$service_id' ] },
                        { '$eq': [ '$customer_id', user] },{"$eq":["$status",1]},{"$eq":["$cart_type",2]} ] } } } ], as: 'cartValues' } },
                {"$project":{"_id":0,"service_name":"$services.service_name","service_id":"$service_id",
                    "duration":"$service_time","category_id":"$category._id",
                    "category_name":"$category.category_name",
                    "cartValues":"$cartValues",
                    "service_cost":"$service_cost",
                    "service_for":"$service_for","url":"$category.url",
                    "video_url":"$category.video"}},
                {"$facet":
                    {"women":[{"$match":{"service_for":1}},
                        {"$group":{"_id":"$category_id","category":{"$first":{
                "category_name":"$category_name","category_id":"$category_id",
                            "url":"$url",
                            "video_url":"$video_url"
                         }},
                            "services":{"$push":{
                                "service_name":"$service_name",
                                "service_id":"$service_id",
                                "duration":"$duration",
                                "service_prices":"$service_cost",
                                "cartValue":{"$ifNull":[ {"$filter":{"input":"$cartValues","as":"cart","cond":{"$and":[{"$eq":["$$cart.selected_for",1]},{"$eq":["$$cart.service_id","$service_id"]}]}}},{}]}

                            }}}}],
                        "girl":[{"$match":{"service_for":2}},
                            {"$group":{"_id":"$category_id","category":{"$first":{"category_name":"$category_name","category_id":"$category_id","url":"$url","video_url":"$video_url"}},
                                "services":{"$push":{
                          "service_name":"$service_name",
                                    "service_id":"$service_id",
                                    "duration":"$duration",
                                    "service_prices":"$service_cost",
                                    "cartValue":{"$ifNull":[ {"$filter":{"input":"$cartValues","as":"cart","cond":{"$and":[{"$eq":["$$cart.selected_for",2]},{"$eq":['$$cart.service_id','$service_id']}]}}},{}]}


                                }}}}],
                        "men":[{"$match":{"service_for":3}},
                            {"$group":{"_id":"$category_id","category":{"$first":{"category_name":"$category_name","category_id":"$category_id","url":"$url","video_url":"$video_url"}},
                                "services":{"$push":{"service_name":"$service_name",
                                    "service_id":"$service_id","duration":"$duration",
                                    "service_prices":"$service_cost",
                                    "cartValue":{"$ifNull":[ {"$filter":{"input":"$cartValues","as":"cart","cond":{"$and":[{"$eq":["$$cart.selected_for",3]},{"$eq":['$$cart.service_id','$service_id']}]}}},{}]}
                                }}}}],
                        "boy":[{"$match":{"service_for":4}},
                            {"$group":{"_id":"$category_id","category":
                                {"$first":{"category_name":"$category_name",
                                    "category_id":"$category_id","url":"$url","video_url":"$video_url"}},
                                "services":{"$push":{"service_name":"$service_name",
                                    "service_id":"$service_id","duration":"$duration",
                                    "service_prices":"$service_cost",
                                    "cartValue":{"$ifNull":[ {"$filter":{"input":"$cartValues","as":"cart","cond":{"$and":[{"$eq":["$$cart.selected_for",4]},{"$eq":['$$cart.service_id','$service_id']}]}}},{}]}

                                }}}}],

                        "country":[
                            {
                                $bucketAuto: {
                                    groupBy: "$created_at",
                                    buckets: 1
                                }
                            },
                            {"$project":{"_id":0}},
                            {"$lookup":{"from":"cities","pipeline":[{"$match":{"_id":city}},
                                {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country"}},{"$unwind":"$country"}],"as":"cities"}},
                            {"$unwind":"$cities"},
                            {"$project":{"currency":"$cities.country.currency_symbol","currency_code":"$cities.country.currency_code"}}

                        ]
                    }}
            ],function(err,response){
               return callback(response);
            });
        },getSalonServicesList:function(salonId,countryId,languagesCode,callback)
        {
            var id=mongoose.Types.ObjectId(salonId);
            var country=mongoose.Types.ObjectId(countryId);


            db.salonServices.aggregate([
                {"$match":{"salon_id":id,"status":1}},
                {"$lookup":{"from":"services","let":{"service_id":"$service_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$service_id","$_id"]}]}}}],"as":"services"}},
                {"$lookup":{"from":"category","let":{"category_id":"$category_id"},"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$category_id","$_id"]}]}}}],"as":"category"}},
                {"$unwind":"$services"},
                {"$unwind":"$category"},
                 {"$project":{"_id":0,"service_name":{"$ifNull":["$services.service_name."+languagesCode,"$services.service_name.en"]},
                     "salon_service_id":"$_id","service_description":{"$ifNull":["$services.service_description."+languagesCode," "]},"service_id":"$service_id","duration":"$service_time","category_id":"$category._id",
                    "url":"$category.url",
                     "category_name":{"$ifNull":["$category.category_name."+languagesCode,"$category.category_name.en"]},
                     "cartValues":"$cartValues","service_cost":"$service_cost","service_for":"$service_for"}},
                {"$facet":
                    {"women":[{"$match":{"service_for":1}},
                        {"$group":{"_id":"$category_id","category":
                            {"$first":
                                {"category_name":"$category_name",
                                    "category_id":"$category_id",
                                    "url":"$url"
                                }
                            },
                            "services":{"$push":{"service_name":"$service_name",
                                "service_id":"$service_id","salon_service_id":"$salon_service_id","service_description":"$service_description","duration":"$duration","service_prices":"$service_cost"
                            }}}}
                            ],
                        "girl":[{"$match":{"service_for":2}},
                            {"$group":{"_id":"$category_id","category":{"$first":{"category_name":"$category_name",
                                "url":"$url",

                                "category_id":"$category_id"}},
                                "services":{"$push":{"service_name":"$service_name","salon_service_id":"$salon_service_id","service_description":"$service_description","service_id":"$service_id","duration":"$duration","service_prices":"$service_cost"

                                }}}}],
                        "men":[{"$match":{"service_for":3}},
                            {"$group":{"_id":"$category_id","category":{"$first":{"category_name":"$category_name",
                                "url":"$url",
                                "category_id":"$category_id"}},
                                "services":{"$push":{"service_name":"$service_name","salon_service_id":"$salon_service_id","service_id":"$service_id","service_description":"$service_description","duration":"$duration","service_prices":"$service_cost"
                                }}}}],
                        "boy":[{"$match":{"service_for":4}},
                            {"$group":{"_id":"$category_id","category":{"$first":{"category_name":"$category_name",
                                "url":"$url",
                                "category_id":"$category_id"}},
                                "services":{"$push":{"service_name":"$service_name","salon_service_id":"$salon_service_id","service_description":"$service_description","service_id":"$service_id","duration":"$duration","service_prices":"$service_cost"

                                }}}}]
                    , "country":[{
                        $bucketAuto: {
                            groupBy: "$created_at",
                            buckets: 1
                        }
                    },
                    {"$project":{"_id":0}},

                    {"$lookup":{"from":"country","let":{"country_id":country},"pipeline":[{"$match":{"$expr":
                        {"$and":[{"$eq":["$_id",country]}]}}}],"as":"country"}}
                    ,{"$unwind":"$country"},

                    {"$project":{"currency":"$country.currency_symbol","currency_code":"$country.currency_code"}}

                ]
                    }}
            ],function(err,response){

               return callback(response);
            });
        },deleteMany: function (where, callback)
       {
          db.salonServices.deleteMany(where, function (err, response) {
           return callback(response);
           });
        },getPricesForTheSalon:function(salonId,services)
    {
        var salon= mongoose.Types.ObjectId(salonId);
        var servicesList=[];
        var tmp={};
        var servicesCount=services.length;

        for(var s=0;s<services.length;s++)
        {
            var tmpCondition=[];
            tmp={};
            var serviceId= mongoose.Types.ObjectId(services[s].service_id);

            tmp['$eq']=["$service_id",serviceId];
            tmpCondition.push(tmp);
            tmp={};
            tmp['$eq']=['$service_for',parseInt(services[s].service_for)];
            tmpCondition.push(tmp);
            tmp={};

            tmp['$ne']=['$status',0];
            tmpCondition.push(tmp);




            servicesList.push({"$and":tmpCondition});
        }



        var totalServices=[];
        var salonservices={"$or":servicesList};
        totalServices.push({"$eq":[salon,'$salon_id']});
        totalServices.push(salonservices);
        return new Promise(function(resolve) {

            db.salonServices.aggregate([{"$match": {"$expr": {"$and": totalServices}}},
                {"$group": {"_id": "$salon_id", "services": {"$push": "$$ROOT"}}},
                {"$match": {"$expr": {"$and": [{"$eq": [{"$size":"$services"}, servicesCount]}]}}},
                {"$unwind": "$services"},
                { $replaceRoot: { newRoot: "$services"} }

            ], function (err, response) {

                return resolve(response);
            });

        });

    }
    };
