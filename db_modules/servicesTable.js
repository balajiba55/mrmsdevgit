var db = require('../db');
var mongoose = require('mongoose');

module.exports={
    find: function (check, callback) {
        db.services.find(check, function (err, response) {
            callback(response);
        });

    },
    getCategory:function(customerId,city,filter,callback)
    {

        var id = mongoose.Types.ObjectId(customerId);
        var cityId = mongoose.Types.ObjectId(city);
        var sort=0;
        var levels={};
        var duration=[];
        var levelCondition=[];
        var keys='';


        if(Object.keys(filter).length!=0)
        {
            if(filter.sort!=undefined)
            {
                sort=filter.sort;
            }

            if(filter.levels!=undefined)
            {
                levels=filter.levels;
            }
            if(filter.duration!=undefined)
            {
                duration=filter.duration;
            }

        }
        var womenStage=[],
            girlStage=[],
            menStage=[],
            boyStage=[];
        var womenCondition= {"$match":{"$and":[{"category.category_for":{"$in":[1]}}],
            "service_prices":{"$elemMatch":{"1":{"$exists":true},
                "city":{"$eq":cityId}}}}};
        womenStage.push(womenCondition);


        var womenSortCategory='';
        if(sort!=0)
        {

             womenSortCategory={"$sort":{"service_prices.duration.2":-1}};

            womenStage.push(womenSortCategory);

        }else
        {
            womenStage.push({"$sort":{"sort.2":1}})
        }
        womenStage.push({"$unwind":"$service_prices"});

        if(sort!=0)
        {
            sort=parseInt(sort);
            if(sort==1)
            {
                womenSortCategory={"$sort":{"service_prices.duration.1":-1}};
                womenStage.push(womenSortCategory);
            }else
            {
                womenSortCategory={"$sort":{"service_prices.duration.1":1}};
                womenStage.push(womenSortCategory);
            }
        }else
            {
                womenStage.push({"$sort":{"sort.1":1}})
            }

        if(Object.keys(levels).length!=0)
        {
            levelCondition=[];
            for(var k in levels)
            {


                var minvalue=parseFloat(levels[k][0]);
                var maxvalue=parseFloat(levels[k][1]);
                k=parseInt(k);
                levelCondition.push({"$and":[{"$gte":['$service_prices.1.'+k+'',minvalue]},{"$lte":['$service_prices.1.'+k+'',maxvalue]}]});
            }
            var womenLevelCondition={"$match":{"$expr":{"$and":[{"$and":levelCondition}]}}};
            womenStage.push(womenLevelCondition);

        }
        if(duration.length!=0)
        {

            var minDuration=parseInt(duration[0]);
            var maxDuration=parseInt(duration[1]);

            womenStage.push({"$match":{"$expr":{"$and":[{"$gte":["$service_prices.duration.1",minDuration]},{"$lte":["$service_prices.duration.1",maxDuration]}]}}})
        }

        var womenGroupStage={"$group":{"_id":"$category._id",
            "category":{"$first":{"category_name":"$category.category_name",
                "category_id":"$category._id","url":"$category.url",
                "video_url":"$category.video","sort":"$category.sort"}},
            "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                "service_prices":{"$ifNull":["$service_prices",{}]},

                'sort':"$sort",
                "duration":{"$ifNull":["$service_prices",{}]},
                "url":"$url","service_quatity":{"$cond":
                    [{"$eq":["$cartValues.selected_for",1]},"$cartValues.selected_service_level",'']},
                "cartValue":{"$ifNull":[{"$arrayElemAt":[
                    {"$filter":{"input":"$cartValues","as":"cart",
                        "cond":{"$eq":["$$cart.selected_for",1]}}},0]},{}]}
            }}}};
        womenStage.push(womenGroupStage);
        if(sort!=0)
        {

            if(sort==1)
            {

                var   womenSortServices= {"$sort":{"services.service_prices.duration.1":-1}};
            }else
            {
                var   womenSortServices= {"$sort":{"services.service_prices.duration.1":1}};
            }
            womenStage.push(womenSortServices);
        }else{
            womenStage.push({"$sort":{"services.sort.1":1}});
            womenStage.push({"$sort":{"category.sort.1":1}});
        }
        var girlCondition={"$match":{"$and":[{"category.category_for":{"$in":[2]}}],"service_prices":{"$elemMatch":{"2":{"$exists":true},
            "city":{"$eq":cityId}}} }};
        girlStage.push(girlCondition);

        if(sort!=0)
        {

            var girlSortCategory={"$sort":{"service_prices.duration.2":-1}};

            girlStage.push(girlSortCategory);

        }else
        {
            girlStage.push({"$sort":{"sort.2":1}})
        }
        girlStage.push({"$unwind":"$service_prices"});
        if(sort!=0)
        {
            sort=parseInt(sort);
            if(sort==1)
            {
                girlSortCategory={"$sort":{"service_prices.duration.2":-1}};
                girlStage.push(girlSortCategory);
            }else
            {
                girlSortCategory={"$sort":{"service_prices.duration.2":1}};
                girlStage.push(girlSortCategory);
            }
        }else
        {
            girlStage.push({"$sort":{"sort.2":1}})
        }

        if(Object.keys(levels).length!=0)
        {
            levelCondition=[];
            for(var k in levels)
            {


                var minvalue=parseFloat(levels[k][0]);
                var maxvalue=parseFloat(levels[k][1]);
                k=parseInt(k);
                levelCondition.push({"$and":[{"$gte":['$service_prices.2.'+k+'',minvalue]},
                    {"$lte":['$service_prices.2.'+k+'',maxvalue]}]});
            }
            var girlLevelCondition={"$match":{"$expr":{"$and":[{"$and":levelCondition}]}}};
            girlStage.push(girlLevelCondition);

        }
        if(duration.length!=0)
        {
            var minDuration=parseInt(duration[0]);
            var maxDuration=parseInt(duration[1]);
            girlStage.push({"$match":{"$expr":{"$and":[{"$gte":["$service_prices.duration.2",minDuration]},
                {"$lte":["$service_prices.duration.2",maxDuration]}]}}})
        }
        var girlGroupStage=  {"$group":{"_id":"$category._id",
            "category":{"$first":{"category_name":"$category.category_name","category_id":"$category._id",
                "url":"$category.url","video_url":"$category.video","sort":"$category.sort"}},
            "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                "service_prices":{"$ifNull":["$service_prices",{}]},"url":"$url","service_quatity":{"$cond":
                    [{"$eq":["$cartValues.selected_for",2]},"$cartValues.selected_service_level",'']},"sort":"$sort",
                "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",2]}}},0]},{}]}
            }}}};
        girlStage.push(girlGroupStage);
        if(sort!=0)
        {
            sort=parseInt(sort);

            if(sort==1)
            {
                var   girlSortServices= {"$sort":{"services.service_prices.duration.2":-1}};
            }else
            {
                var   girlSortServices= {"$sort":{"services.service_prices.duration.2":1}};
            }

            girlStage.push(girlSortServices);
        }else{
            girlStage.push({"$sort":{"services.sort.2":1}});
            girlStage.push({"$sort":{"category.sort.2":1}});
        }
        var menCondition= {"$match":{"$and":[{"category.category_for":{"$in":[3]}}],"service_prices":{"$elemMatch":{"3":{"$exists":true},
            "city":{"$eq":cityId}}}}};
        menStage.push(menCondition);

        if(sort!=0){
            var menSortCategory={"$sort":{"service_prices.duration.3":-1}};
            menStage.push(menSortCategory);
        }else
        {
            menStage.push({"$sort":{"sort.3":1}})
        }
        menStage.push({"$unwind":"$service_prices"});
        if(sort!=0)
        {
            sort=parseInt(sort);
            if(sort==1)
            {
                menSortCategory={"$sort":{"service_prices.duration.3":-1}};
                menStage.push(menSortCategory);
            }else
            {
                menSortCategory={"$sort":{"service_prices.duration.3":1}};
                menStage.push(menSortCategory);
            }
        }else
        {
            menStage.push({"$sort":{"sort.3":1}})
        }
        if(Object.keys(levels).length!=0)
        {
            //keys=Object.keys(levels);

            levelCondition=[];
            for(var k in levels)
            {
                var minvalue=parseFloat(levels[k][0]);
                var maxvalue=parseFloat(levels[k][1]);
                k=parseInt(k);
                levelCondition.push({"$and":[{"$gte":['$service_prices.3.'+k+'',minvalue]},{"$lte":['$service_prices.3.'+k+'',maxvalue]}]});
            }
            var menLevelCondition={"$match":{"$expr":{"$and":[{"$or":levelCondition}]}}};
            menStage.push(menLevelCondition);
        }
        if(duration.length!=0)
        {
            var minDuration=parseInt(duration[0]);
            var maxDuration=parseInt(duration[1]);
            menStage.push({"$match":{"$expr":{"$and":[{"$gte":["$service_prices.duration.3",minDuration]},
                {"$lte":["$service_prices.duration.3",maxDuration]}]}}})
        }
        var menGroupStage= {"$group":{"_id":"$category._id",
            "category":{"$first":{"category_name":"$category.category_name","sort":"$category.sort","category_id":"$category._id","url":"$category.url","video_url":"$category.video"}},
            "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                "service_prices":{"$ifNull":["$service_prices",{}]},
                "url":"$url","service_quatity":{"$cond":
                    [{"$eq":["$cartValues.selected_for",3]},"$cartValues.selected_service_level",'']},
                'sort':"$sort",
                "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",3]}}},0]},{}]}
            }}}};
        menStage.push(menGroupStage);
        if(sort!=0)
        {
            sort=parseInt(sort);

            if(sort==1)
            {
                var   menSortServices= {"$sort":{"services.service_prices.duration.3":-1}};
            }else{
                var   menSortServices= {"$sort":{"services.service_prices.duration.3":1}};
            }

            menStage.push(menSortServices);
        }else{
            menStage.push({"$sort":{"services.sort.3":1}});
            menStage.push({"$sort":{"category.sort.3":1}});
        }


        var boyCondition= {"$match":{"$and":[{"category.category_for":{"$in":[4]}}],"service_prices":{"$elemMatch":{"4":{"$exists":true},
            "city":{"$eq":cityId}}} }};
        boyStage.push(boyCondition);

        if(sort!=0)
        {
            var boySortCategory={"$sort":{"service_prices.duration.4":-1}};
            boyStage.push(boySortCategory);
        }else
        {
            boyStage.push({"$sort":{"sort.4":1}})
        }
        boyStage.push({"$unwind":"$service_prices"});

        if(sort!=0)
        {
            sort=parseInt(sort);
            if(sort==1)
            {
                boySortCategory={"$sort":{"service_prices.duration.4":-1}};
                boyStage.push(boySortCategory);
            }else
            {
                boySortCategory={"$sort":{"service_prices.duration.4":1}};
                boyStage.push(boySortCategory);
            }

        }else
        {
            boyStage.push({"$sort":{"sort.4":1}});
        }

        if(Object.keys(levels).length!=0)
        {
            levelCondition=[];
            for(var k in levels)
            {
                var minvalue=parseFloat(levels[k][0]);
                var maxvalue=parseFloat(levels[k][1]);
                k=parseInt(k);
                levelCondition.push({"$and":[{"$gte":['$service_prices.4.'+k+'',minvalue]},{"$lte":['$service_prices.4.'+k+'',maxvalue]}]});
            }

            var boyLevelCondition={"$match":{"$expr":{"$and":[{"$or":levelCondition}]}}};
            boyStage.push(boyLevelCondition);

        }
        if(duration.length!=0)
        {
            var minDuration=parseInt(duration[0]);
            var maxDuration=parseInt(duration[1]);
            boyStage.push({"$match":{"$expr":{"$and":[{"$gte":["$service_prices.duration.4",minDuration]},
                {"$lte":["$service_prices.duration.4",maxDuration]}]}}})
        }
        var boyGroupStage=  {"$group":{"_id":"$category._id",
            "category":{"$first":{"category_name":"$category.category_name","sort":"$category.sort","category_id":"$category._id","url":"$category.url","video_url":"$category.video"}},
            "services":{"$push":{"service_id":"$_id","service_name":"$service_name","sort":"$sort",
                "service_prices":{"$ifNull":["$service_prices",{}]},
                "url":"$url","service_quatity":{"$cond":
                    [{"$eq":["$cartValues.selected_for",4]},"$cartValues.selected_service_level",'']},
                "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",4]}}},0]},{}]}
            }}}};
        boyStage.push(boyGroupStage);
        if(sort!=0)
        {
            if(sort==1)
            {
                var   boySortServices= {"$sort":{"services.service_prices.duration.4":-1}};
            }else
             {
                var   boySortServices= {"$sort":{"services.service_prices.duration.4":1}};
            }
            boyStage.push(boySortServices);
        }else
        {
            boyStage.push({"$sort":{"services.sort.4":1}});
            boyStage.push({"$sort":{"category.sort.4":1}});
        }
        db.services.aggregate([
            {"$project":{"_id":1,"category_id":1,"service_name":1,"service_description":1,"status":1,"service_for":1,"created":1,
                "service_prices":{"$filter":{"input":"$service_prices","as":"prices","cond":
                    {"$eq":["$$prices.city",cityId]}}},"sort":"$sort"}},
            {'$lookup':{ from: 'category',"let":{"category_id":"$category_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[
                    {"$eq":["$service_type",1]},
                    {"$eq":["$$category_id","$_id"]},
                    {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]}]}
                ]}}}], as: 'category' } },
            {"$unwind":"$category"},
            { '$lookup': { from: 'cart', let: { service_id: '$_id' },
                pipeline: [ { '$match': { '$expr': { '$and': [ { '$eq': [ '$service_id', '$$service_id' ] },
                    { '$eq': [ '$customer_id', id ]},{"$eq":["$status",1]},{"$eq":["$cart_type",1]} ] } } } ],
                as: 'cartValues' } },
            {"$facet":
                {
                    "women":womenStage,"girl":girlStage,"men":menStage,"boy":boyStage,"country":[{
                        $bucketAuto: {
                            groupBy: "$created_at",
                            buckets: 1
                        }
                    },
                    {"$project":{"_id":0}},
                    {"$lookup":{"from":"cities","pipeline":[
                        {"$match":{"_id":cityId}},
                        {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country"}},{"$unwind":"$country"}],"as":"cities"}},
                    {"$unwind":"$cities"},
                    {"$project":{"currency":"$cities.country.currency_symbol","currency_code":"$cities.country.currency_code"}}
                ]
                }
            }

        ],function(err,response)
        {

            return callback(response);
        });

    },
    getSalonCategory:function(customerId,cityId,callback){
        var id = mongoose.Types.ObjectId(customerId);
        var city = mongoose.Types.ObjectId(cityId);
       db.services.aggregate([
           {'$lookup':{ from: 'category',"let":{"category_id":"$category_id"},
               "pipeline":[{"$match":{"$expr":{"$and":[
                   {"$eq":["$service_type",2]},
                   {"$eq":["$$category_id","$_id"]},
                   {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]}]}
               ]}}}], as: 'category' } },
           {"$unwind":"$category"},
           { '$lookup': { from: 'cart', let: { service_id: '$_id' },
               pipeline: [ { '$match': { '$expr': { '$and': [ { '$eq': [ '$service_id', '$$service_id' ] },
                   { '$eq': [ '$customer_id', id ] },{"$eq":["$status",1]},{"$eq":["$cart_type",1]} ] } } } ],
               as: 'cartValues' }},
           {"$facet":
              {
                   "women":[
                       {"$match":{"$and":[{"category.category_for":{"$in":[1]}}],
                       "service_cities":{"$in":[city]},"service_for":{"$in":[1]}}},
                       {"$group":{"_id":"$category._id",
                           "category":{"$first":{"category_name":"$category.category_name",
                               "category_id":"$category._id","url":"$category.url",
                               "video_url":"$category.video","sort":"$category.sort"}},
                           "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                               "service_prices":{"$ifNull":["$service_prices",{}]},
                               "duration":{"$ifNull":["$service_prices",{}]},
                               "sort":"$sort",
                               "url":"$url","service_quatity":{"$cond":
                                   [{"$eq":["$cartValues.selected_for",1]},"$cartValues.selected_service_level",'']},
                               "cartValue":{"$ifNull":[{"$arrayElemAt":[
                                   {"$filter":{"input":"$cartValues","as":"cart",
                                       "cond":{"$eq":["$$cart.selected_for",1]}}},0]},{}]}
                           }}}},
                       {"$sort":{"services.sort.1":1}},
                       {"$sort":{"category.sort.1":1}}
                   ],"girl":[
                  {"$match":{"$and":[{"category.category_for":{"$in":[2]}}],
                      "service_cities":{"$in":[city]},"service_for":{"$in":[2]}}},
                  {"$group":{"_id":"$category._id",
                      "category":{"$first":{"category_name":"$category.category_name",
                          "category_id":"$category._id",
                          "url":"$category.url","video_url":"$category.video",
                          "sort":"$category.sort"
                      }},
                      "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                          "service_prices":{"$ifNull":["$service_prices",{}]},"url":"$url","service_quatity":{"$cond":
                              [{"$eq":["$cartValues.selected_for",2]},"$cartValues.selected_service_level",'']},
                          "sort":"$sort",
                          "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",2]}}},0]},{}]}
                      }}}},
                  {"$sort":{"services.sort.2":1}},
                  {"$sort":{"category.sort.2":1}}
               ],"men":[
                   {"$match":{"$and":[{"category.category_for":{"$in":[3]}}],
                  "service_cities":{"$in":[city]},"service_for":{"$in":[3]}}},
                  {"$group":{"_id":"$category._id",
                      "category":{"$first":{"category_name":"$category.category_name",
                          "category_id":"$category._id"
                          ,"url":"$category.url",
                          "video_url":"$category.video","sort":"$category.sort"}},
                      "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                          "service_prices":{"$ifNull":["$service_prices",{}]},
                          "url":"$url","service_quatity":{"$cond":
                              [{"$eq":["$cartValues.selected_for",3]},"$cartValues.selected_service_level",'']},
                          "sort":"$sort",
                          "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",3]}}},0]},{}]}
                      }}}},
                  {"$sort":{"services.sort.3":1}},
                  {"$sort":{"category.sort.3":1}}

               ],"boy":[{"$match":{"$and":[{"category.category_for":{"$in":[4]}}],
                  "service_cities":{"$in":[city]},"service_for":{"$in":[4]}}},
                  {"$group":{"_id":"$category._id",
                      "category":{"$first":{"category_name":"$category.category_name",
                          "category_id":"$category._id","sort":"$category.sort",
                          "url":"$category.url","video_url":"$category.video"}},
                      "services":{"$push":{"service_id":"$_id","service_name":"$service_name",
                          "service_prices":{"$ifNull":["$service_prices",{}]},
                          "sort":"$sort",
                          "url":"$url","service_quatity":{"$cond":
                              [{"$eq":["$cartValues.selected_for",4]},"$cartValues.selected_service_level",'']},
                          "cartValue":{"$ifNull":[{"$arrayElemAt":[{"$filter":{"input":"$cartValues","as":"cart","cond":{"$eq":["$$cart.selected_for",4]}}},0]},{}]}
                      }}}},
                  {"$sort":{"services.sort.4":1}},
                  {"$sort":{"category.sort.4":1}}
               ],"country":[
                  {
                      $bucketAuto: {
                          groupBy: "$created_at",
                          buckets: 1
                      }
                  },
                  {"$project":{"_id":0}},
                  {"$lookup":{"from":"cities","pipeline":[
                      {"$match":{"_id":city}},
                      {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country"}},{"$unwind":"$country"}],"as":"cities"}},
                  {"$unwind":"$cities"},
                  {"$project":{"currency":"$cities.country.currency_symbol","currency_code":"$cities.country.currency_code"}}

              ]
               }
           }
       ],function(err,response){

                    return callback(response);
       });
    },
    getServicesList:function(languageCode,callback){
        var cond={};
        var servicename="$service_name."+languageCode;
        db.services.aggregate([{
        "$project":{"name":{ "$ifNull":[servicename,"$service_name.en"]},"id":"$_id","_id":0}
        }],function(err,response){

            return callback(response);
        });
    },getCategoryServicesList:function(categoryId,callback){
        var cond={};
       var servicename="$service_name.en";
        var id = mongoose.Types.ObjectId(categoryId);

        db.services.aggregate([
            {"$match":{"$and":[{"category_id":{'$eq':id}}]}},
            {

        "$project":{"name":"$service_name.en","service_id":"$_id","_id":0}
        }],function(err,response){

            return callback(response);
        });
    },getServices:function(callback){
        db.services.aggregate([ { '$lookup': { from: 'subCategory', localField: 'sub_category_id', foreignField: '_id', as: 'subCategory' } },
            {'$unwind': '$subCategory' },
            { '$group': { _id: '$subCategory._id',
                subCategory:
                    {'$first': { sub_category_name: '$subCategory.sub_category_name.en', category_id: '$subCategory.category_id', sub_category_id: '$subCategory._id',
                        url: '$subCategory.url'  } },"services":{"$push":{"service_id":"$_id","service_name":"$service_name.en","service_for":"$service_for"}}}},
            { '$lookup': { from: 'category', localField: 'subCategory.category_id', foreignField: '_id', as: 'categoryData' } },
            {"$unwind":"$categoryData"},
            { '$group': { _id: '$categoryData._id',
                sub_category: {'$push': {"sub_category_details":'$subCategory',"services":"$services"}},
                category: { '$first': {"category_name":"$categoryData.category_name.en",
                    "url":"$categoryData.url","category_id":"$categoryData._id"} } } },
            {"$project":{"_id":0,"category":"$category","sub_category":"$sub_category"}}
        ],function(err,response){
               return callback(response);
        });
    },getServiceDetails:function(serviceId,languageCode,callback){
        var id = mongoose.Types.ObjectId(serviceId);
        db.services.aggregate([
            {"$match":{"_id":id}},
            {"$project":{"service_description":{$ifNull:["$service_description."+languageCode,"$service_description.en"]},"duration":"$duration"}}],
            function(err,response)
            {
                callback(response);
        });
    },getExpertiseServices:function(languageCode,type,callback)
    {
        db.services.aggregate([
                {"$match":{"service_type":type}},
                {"$project":{"_id":0,"id":"$_id","service_name":{$ifNull:["$service_name."+languageCode,"$service_name.en"]}}}
                ],function(err,response)
            {
                return  callback(response);
            });
    },getPriceDetails: function(serviceId,cityId){
        var id = mongoose.Types.ObjectId(serviceId);
        var city = mongoose.Types.ObjectId(cityId);
        return new Promise(function(resolve){

        db.services.aggregate([{"$match":{"_id":id}},
        {"$project":{"service_prices":{"$filter":{"input":"$service_prices","as":"price",
                        "cond":{"$and":[{"$eq":["$$price.city",city]}]}}}}}
          ],function(err,response){
                return resolve(response);
        });
        });
     }, findFieldsWithPromises: function (check, fields)
    {
        return new Promise(function(resolve){

            db.services.find(check, fields ,function (err, response) {

                resolve(response);
            });
        });
    },updateWithPromises:function(data,where)
     {
          return new Promise(function(resolve){
        db.services.update(where, {$set:data}, {new: true}, function(err, response){

            return  resolve(response);

        });
         });
    },
};
