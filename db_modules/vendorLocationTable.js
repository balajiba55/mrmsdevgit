
var db = require('../db');
var mongoose = require('mongoose');
var moment=require('moment-timezone');

/*
 var mongoose=require('mongodb').MongoClient;
 */

module.exports={

    locationFind:function(latitude,longitude,cityId,languageCode,callback)
    {
        /*"maxDistance":1,*/
        var now = new Date();
        var day= now.getUTCDay()+1;

        var utc_timestamp = Date.UTC(now.getFullYear(),now.getMonth(), now.getDate() ,
            now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

        var date = new Date(utc_timestamp*1000);
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();

        var time = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        var obj={};
        var obj2={};
        obj["working_hours."+day]={"$elemMatch":{"start":{"$lte":time},"end":{'$gte':time}}};
        obj2["working_hours."+day]={"$exists":false};
        /* var salonCondition=
         { "$match": {

         "$expr": { "$and": [
         {"$lte":["$working_hours."+day+".start",time]},
         {"$gte":["$working_hours."+day+".end",time]},
         { "$eq": [ "$_id", "$$salon_id" ] }

         ] },"$or":[obj,obj2]

         }
         };*/

        var salonCondition =
            {"$match": {"$expr":{"$and": [
                {"$eq": [ "$_id", "$$salon_id" ] },
                {"$eq":["$agent_status",1]},
                {"$eq":["$manager_status",1]},
                {"$eq":["$active_status",1]},
                {"$eq":["$booking_status",1]}
            ]}
            }};
        var city= mongoose.Types.ObjectId(cityId);
        db.vendorLocation.aggregate([{
                "$geoNear": {
                    "near" : {"type" : "Point", "coordinates" : [ parseFloat(longitude),parseFloat(latitude)]},
                    "distanceField": "distance",
                    "maxDistance":4*1000,
                    "limit":99999999,
                    "distanceMultiplier":1/1000,
                    "spherical": true
                }},
            {"$lookup":{"from":"vendor", "let":{"vendor_id":"$vendor_id"}, "pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor_id"]}]}}},
                {"$lookup":{"from":"providerStatus","localField":"_id","foreignField":"vendor_id","as":"providerStatus"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
                {"$lookup":{"from":"stylist","let":{"vendor_id":"$_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[
                        {"$eq":["$vendor_id","$$vendor_id"]},
                        {"$eq":["$agent_status",1]},
                        {"$eq":["$manager_status",1]},
                        {"$eq":["$available_status",1]},
                        {"$eq":["$active_status",1]},
                        {"$eq":["$booking_status",1]},
                        {"$eq":["$city_id",city]}
                    ]}}}
                ],"as":"stylistDetails"}},
                {"$unwind":"$stylistDetails"}
            ],
                "as":"vendorDetails"}},
            {"$unwind":{"path":"$vendorDetails","preserveNullAndEmptyArrays": true}},
            {"$lookup":{"from":"salon",
                "let": {
                    "salon_id": "$salon_id"
                },
                "pipeline": [
                    salonCondition,
                    {"$lookup":{"from":"salonEmployees","let":{"salon_id":"$_id"},"pipeline":
                        [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}}],"as":"salonEmployee"}},
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployee"},0]}]}}},
                    {"$lookup":{"from":"salonServices","let":{'salon_id':'$_id'},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}}],"as":"salonServices"}},
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonServices"},0]}]}}}
                ],
                "as":"salonDetails"}},
            {"$unwind":{"path":"$salonDetails","preserveNullAndEmptyArrays": true}},
            {"$match":{ "$or": [
                { 'salonDetails.salon_name': {"$exists": true, "$not": { "$size": 0 } } },
                { "vendorDetails.last_name": {"$exists": true, "$not": { "$size": 0 } } }
            ]}},
            {"$lookup":{"from":"rating","let":{"vendor_id":"$vendor_id"},"pipeline":[{"$match":{"$expr":{"$and":
                [{"$eq":["$vendor_id","$$vendor_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}},
            {"$lookup":{"from":"rating","let":{"salon_id":"$salon_id"},"pipeline":[{"$match":{"$expr":{"$and":
                [{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"salonRating"}},
            {"$unwind":{"path":"$vendorDetails.stylistDetails","preserveNullAndEmptyArrays": true}},
            {"$graphLookup": {"from": "services","startWith": "$vendorDetails.stylistDetails.expertise","connectFromField": "vendorDetails.stylistDetails.expertise",
                "connectToField": "_id","as": "expertise"}},
            {"$project" : {
                "distance":"$distance",
                "type":"$type",
                "name": {"$ifNull":[{"$concat":[ "$vendorDetails.first_name."+languageCode," ","$vendorDetails.last_name."+languageCode ]},
                    "$salonDetails.salon_name."+languageCode]},
                "expertise":"$expertise.service_name."+languageCode,
                "profile_pic": {"$ifNull":["$vendorDetails.profile_pic","salon-rating.png"]},
                "totalrating":{ $cond: [ {"$eq":["$type",2]},{"$ifNull":[
                    {'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$salonRating.rating"},10]}, 0.5]}}, 10]},0]} ,{"$ifNull":[
                    {'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"},10]}, 0.5]}}, 10]},0]}  ] },
                "totalreviews":
                    { $cond: [ {"$eq":["$type",2]}, {"$ifNull":[{"$size":"$salonRating"},0]}, {"$ifNull":[{"$size":"$rating"},0]} ] },
                "salon_name":"$salonDetails.salon_name",
                "vendor_id" : {"$ifNull":["$vendor_id","$vendor_id"]} ,
                "salon_id" : "$salon_id" ,
                "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                    "longitude":{"$arrayElemAt":["$location.coordinates",0]}}
            }
            },
            {"$group":{"_id":{"salon_id":"$salon_id","vendor_id":"$vendor_id"},"vendorDetails":{"$first":"$$ROOT"}}},
            { $replaceRoot: { newRoot:"$vendorDetails" } }
        ],function(err,result)
        {

            return  callback(result);
        });
    },
    checkReachedLocation:function(vendorId,latitude,longitude,callback)
    {
        var vendor= mongoose.Types.ObjectId(vendorId);
        db.vendorLocation.aggregate([{
            "$geoNear": {
                "near" : {"type" : "Point", "coordinates" : [ longitude,latitude]},
                "distanceField": "distance",
                "maxDistance":0.05*1000,
                "distanceMultiplier":1/1000,
                "spherical": true
            }},{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id",vendor]}]}}}],function(err,response){
            return callback(response);
        });
    },
    save:function(data,callback)
    {
        var user = new db.vendorLocation(data);
        user.save(function (err, response) {
            return callback(response);
        });
    },
    find: function (check, callback) {

        db.vendorLocation.find(check, function (err, response) {
            return callback(response);
        });
    },
    update:function(data,where,callback){

        db.vendorLocation.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            return  callback(response);

        });
    },updateLocationTime:function(data,where,callback){

        db.vendorLocation.findOneAndUpdate(where, {$addToSet:{"updated_at":data}}, {new: true}, function(err, response){

            return  callback(response);

        });
    },  checkStylistAvailable:function(response,filter,callBack)
    {

        var vendorServices=[];
        var distance=[];
        var rating=[];
        var stylistGender=[];
        var preferedStyles=[];
        var languages=[];
        var sort=0;

        if(Object.keys(filter).length!=0)
        {

            if(filter['distance']!=undefined)
            {
                distance=filter['distance'];
            }
            if(filter['rating']!=undefined)
            {
                rating=filter['rating'];

            }
            if(filter['stylist_gender']!=undefined){
                stylistGender=filter['stylist_gender'];
                var tmp=[];
                for(var g=0;g<stylistGender.length;g++)
                {
                    tmp.push(parseInt(stylistGender));
                }
                stylistGender=tmp;
            }
            if(filter['prefered_styles']!=undefined){
                preferedStyles=filter['prefered_styles'];
            }
            if(filter['languages']!=undefined){
                languages=filter['languages'];
            }
            if(filter['sort']!=undefined)
            {
                sort=filter['sort'];
            }

        }for(var i=0;i<response.length;i++)
    {
        var serviceId= mongoose.Types.ObjectId(response[i].service_id);
        var for_whom=response[i].selected_for ;
        var selected_service_level=response[i].selected_service_level ;
        var latitude=response[i].latitude;
        var longitude=response[i].longitude;
        var matchConditionService={};
        var matchConditionServiceFor={};
        var matchConditionServiceLevel={};
        matchConditionService['$eq']=['$service_id',serviceId];
        //vendorServices.push(matchCondition);

        for_whom=parseInt(for_whom);
        matchConditionServiceFor['$eq']=['$service_for',for_whom];
        // vendorServices.push(matchCondition);

        selected_service_level=parseInt(selected_service_level);

        matchConditionServiceLevel['$in']=[selected_service_level,'$service_levels'];
        vendorServices.push({"$and":[matchConditionService,matchConditionServiceFor,matchConditionServiceLevel,
            {"$ne":["$status",0]}
        ]});
    }

        var servicesCount=response.length;
        //  var  totalServices=[];
        // totalServices.push({"$or":vendorServices});


        var geoNear= {'$geoNear':{near:{type: 'Point',
            coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
            distanceField: 'distance', distanceMultiplier: 0.001,
            "maxDistance":4*1000,
            spherical: true } };
        var basicMatchCondition='';
        if(distance.length!=0){
            var minDistance=parseFloat(distance[0]);
            var maxDistance=parseFloat(distance[1]);
            basicMatchCondition={"$match":{"$expr":{"$and":[{"$and":[{"$gte":["$distance",minDistance]},
                {"$lte":["$distance",maxDistance]}]}]}}}
            // basicMatchCondition= {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}};
        }else
        {

            basicMatchCondition= {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}};
        }
        var lookupVendor='';
        if(stylistGender.length!=0)
        {


            lookupVendor= {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor"]},{"$in":["$gender",stylistGender]}]} }},
                {"$lookup":{"from":"providerStatus","localField":"_id","foreignField":"vendor_id","as":"providerStatus"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
                {"$lookup":{"from":"stylist","let":{"vendor_id":'$_id'},
                    "pipeline":[{"$match":{"$expr":{"$and":[
                        {"$eq":["$vendor_id","$$vendor_id"]},
                        {"$eq":["$agent_status",1]},
                        {"$eq":["$manager_status",1]},
                        {"$eq":["$available_status",1]},
                        {"$eq":["$booking_status",1]}
                    ]}}}
                    ],"as":"stylistDetails"}},
                {"$unwind":"$stylistDetails"},
                {"$lookup":{"from":"stylistServices",let:{"vendor_id":"$_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$or":vendorServices}]
                    }}}

                ],"as":"vendorServices"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$vendorServices"},0]}]}}}
            ],"as":"vendorDetails"}};
        }else
        {
            lookupVendor= {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor"]}]} }},
                {"$lookup":{"from":"stylist","let":{"vendor_id":'$_id'},
                    "pipeline":[{"$match":{"$expr":{"$and":[
                        {"$eq":["$vendor_id","$$vendor_id"]},
                        {"$eq":["$agent_status",1]},
                        {"$eq":["$manager_status",1]},
                        {"$eq":["$available_status",1]},
                        {"$eq":["$booking_status",1]}
                    ]}}}
                    ],"as":"stylistDetails"}},
                {"$unwind":"$stylistDetails"},
                {"$lookup":{"from":"stylistServices",let:{"vendor_id":"$_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$or":vendorServices}]
                    }}}


                ],"as":"vendorServices"}},

                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$vendorServices"},0]}]}}},
                {"$unwind":"$vendorservices"}
            ],"as":"vendorDetails"}};
        }
        var unwindVendorDetails= {"$unwind":"$vendorDetails"};
        var stylistLookupPipeline=[{"$eq":["$vendor_id","$$vendor_id"]}];
        if(preferedStyles.length!=0)
        {
            var styles=[];
            var id='';
            for(var p=0;p<preferedStyles.length;p++)
            {
                id='';
                id=mongoose.Types.ObjectId(preferedStyles[p]);
                styles.push(id);
            }
            stylistLookupPipeline.push({"styles":{"$in":styles}})
        }
        if(languages.length!=0)
        {
            var languagesSpeak=[];
            for(var l=0;l<languagesSpeak.length;l++)
            {
                id='';
                id=mongoose.Types.ObjectId(languagesSpeak[p]);
                languagesSpeak.push(id);
            }
            stylistLookupPipeline.push({"languages_speak":{"$in":languagesSpeak}})
        }
        var stylistLookup= {"$lookup":{"from":"stylist",'let':{"vendor_id":'$vendor_id'},
            "pipeline":[{"$match":{"$expr":{"$and":stylistLookupPipeline}}}],"as":"stylist"}};
        var stylistUnwind= {"$unwind":"$stylist"};
        var ratingLookup= {"$lookup":{"from":"rating","let":{"vendor_id":"$vendor_id"}
            ,"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$eq":["$rated_by",1]}]}}}],"as":"rating"}};
        var expertiseLookup= {"$graphLookup": {"from": "services","startWith": "$stylist.expertise","connectFromField": "salonEmployees.expertise",
            "connectToField": "_id","as": "expertise"}};
        var project=   { "$project" :{"distance":"$distance",
            "type":"$type",
            "expertise":"$expertise.service_name.en",
            "name": {"$ifNull":[{"$concat":["$vendorDetails.first_name","  ","$vendorDetails.last_name"]},'']},
            "profile_pic": "$vendorDetails.profile_pic",
            "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
            "totalreviews":{"$size":"$rating"},
            "vendor_id" : {"$ifNull":["$vendor_id",""]} ,
            "salon_id" : "$salon_id" ,
            "vendorDetails":"$vendorDetails",
            "booked":{"$ifNull":["$vendorDetails.booked",0]},
            "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                "longitude":{"$arrayElemAt":["$location.coordinates",0]}}}};
        var vendorTotallConditon=[
            geoNear,
            basicMatchCondition,
            lookupVendor,
            unwindVendorDetails,
            stylistLookup,
            stylistUnwind,
            ratingLookup,
            expertiseLookup,
            {"$group":{"_id":{"service_id":"$vendorDetails.vendorservices.service_id","service_for":"$vendorDetails.vendorservices.service_for"},"service_details":{"$first":"$$ROOT"}}},
            {"$group":{"_id":null,'services':{"$push":'$_id'}}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$services"},servicesCount]}]}}}
        ];
        /* if(sort!=0)
         {
         var sortConditon='';
         if(sort==1)
         {
         sortConditon = {"$sort":{'totalrating':-1}}
         }
         if(sort==2)
         {
         sortConditon = {"$sort":{'booked':-1}}
         }
         if(sort==3)
         {
         sortConditon = {"$sort":{'distance':-1}}

         }
         if(sortConditon!='')
         {
         vendorTotallConditon.push(sortConditon);
         }

         }*/
        db.vendorLocation.aggregate(vendorTotallConditon,function(err,response)
        {

            return callBack(response);
        });

    }, getStylists:function(response,timezone,filter,languageCode,callBack)
    {

        var vendorServices=[];
        var distance=[];
        var rating=[];
        var stylistGender=[];
        var preferedStyles=[];
        var languages=[];
        var sort=0;

        if(Object.keys(filter).length!=0){

            if(filter['distance']!=undefined)
            {
                distance=filter['distance'];
            }
            if(filter['rating']!=undefined)
            {
                rating=filter['rating'];
            }
            if(filter['stylist_gender']!=undefined)
            {
                stylistGender=filter['stylist_gender'];
                var tmp=[];
                for(var g=0;g<stylistGender.length;g++)
                {
                    tmp.push(parseInt(stylistGender[g]));
                }
                stylistGender=tmp;
            }
            if(filter['prefered_styles']!=undefined){
                preferedStyles=filter['prefered_styles'];
            }
            if(filter['languages']!=undefined){
                languages=filter['languages'];
            }
            if(filter['sort']!=undefined)
            {
                sort=filter['sort'];
            }
        }
        var duration=0;

        for(var i=0;i<response.length;i++){
            var serviceId= mongoose.Types.ObjectId(response[i].service_id);
            var cityId= mongoose.Types.ObjectId(response[i].city_id);
            var for_whom=response[i].selected_for ;
            var selected_service_level=response[i].selected_service_level ;
            var latitude=response[i].latitude;
            var longitude=response[i].longitude;
            var quantity=response[i].quantity;
            var matchConditionService={};
            var matchConditionServiceFor={};
            var matchConditionServiceLevel={};
            matchConditionService['$eq']=['$service_id',serviceId];

            //vendorServices.push(matchCondition);
            for_whom=parseInt(for_whom);
            matchConditionServiceFor['$eq']=['$service_for',for_whom];
            // vendorServices.push(matchCondition);

            selected_service_level=parseInt(selected_service_level);
            matchConditionServiceLevel['$in']=[selected_service_level,'$service_levels'];
            duration+=(parseInt(response[i].duration)*quantity);
                    

            vendorServices.push({"$and":[matchConditionService,matchConditionServiceFor,matchConditionServiceLevel,
                {"$ne":["$status",0]},{"$eq":["$vendor_id","$$vendor_id"]}
            ]});
        }
        var dateTimeFormat='YYYY-MM-DD HH:mm';
        var timeFormat='HH:mm';
        //for booking date//
        var startDateTime=moment.utc();
        var startDate=startDateTime.format(dateTimeFormat);
        var endDateTime=moment(startDateTime).add(duration, 'minutes');
        var endDate=endDateTime.format(dateTimeFormat);

        //for local time //
        var startLocalDateTime=moment.tz(timezone);
        var startTime=startLocalDateTime.format(timeFormat);
        var endLocalDateTime=moment(startLocalDateTime).add(duration, 'minutes');
        var endTime=endLocalDateTime.format(timeFormat);
        var day=startLocalDateTime.day();
        if(day==0){
            day=7;
        }

        var servicesCount=response.length;
        //  var  totalServices=[];
        // totalServices.push({"$or":vendorServices});


        var geoNear={'$geoNear':{near:{type: 'Point',
            coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
            distanceField: 'distance', distanceMultiplier: 0.001,
            "maxDistance":150*1000,
            "limit":1000000000,
            'query':{"vendor_id":{"$exists":true}},
            spherical: true } };
        var basicMatchCondition='';



        if(distance.length!=0)
        {
            var minDistance=parseFloat(distance[0]);
            var maxDistance=parseFloat(distance[1]);
            basicMatchCondition={"$match":{"$expr":{"$and":[{"$and":[{"$gte":["$distance",minDistance]},
                {"$lte":["$distance",maxDistance]}]}]}}}
            // basicMatchCondition= {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}};
        }else
        {
            basicMatchCondition= {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}};
        }
        var   stylistCheck=[{"$match":{"$expr":{"$and":[
            {"$eq":["$city_id",cityId]},
            {"$eq":["$vendor_id","$$vendor_id"]},
            {"$eq":["$agent_status",1]},
            {"$eq":["$manager_status",1]},
            {"$eq":["$available_status",1]},
            {"$eq":["$booking_status",1]}
        ]}}}
        ];
        var salonEmployeeCondtion= {};
        salonEmployeeCondtion["working_time."+day]={"$elemMatch":{"$and":[{"start":{"$lte":startTime}},{"end":{'$gte':endTime}},
            {"break":{"$not":{"$elemMatch":{"$or":[
                {"$and":[{"start":{"$gt":startTime}},{"start":{"$lt":endTime}}]},
                {"$and":[{"end":{"$gt":startTime}},{"end":{"$lt":endTime}}]},
                {"$and":[{"start":{"$lte":startTime}},{"end":{"$gt":endTime}}]}
            ]}}}}
        ]}};
        var vendorStatus='';
        if(stylistGender.length!=0)
        {
            vendorStatus=[{"$eq":["$_id","$$vendor"]},{"$in":["$gender",stylistGender]}];
        }else
        {
            vendorStatus=[{"$eq":["$_id","$$vendor"]}]
        }

        var lookupVendor= {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
            {"$match":{"$expr":{"$and":vendorStatus} }},
            {"$lookup":{"from":"providerStatus","let":{"vendor_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}}],"as":"providerStatus"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
            {"$lookup":{"from":'salonEmployees','let':{"employee_id":{"$ifNull":["$employee_id",'']}},
                "pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$employee_id"]}]}}},
                    {"$match":{"$and":[salonEmployeeCondtion]}}
                ],"as":"salonEmployees"
            }},
            {"$match":{"$expr":{"$or":[{"$gt":[{"$size":"$salonEmployees"},0]},{"$eq":["$type",1]}]}}},
            {"$lookup":{"from":"stylist","let":{"vendor_id":'$_id'},
                "pipeline":stylistCheck,"as":"stylistDetails"}},
            {"$unwind":"$stylistDetails"},
            {"$lookup":{"from":'bookings',"let":{"employee_id":"$employee_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$employee_id","$$employee_id"]},
                    {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                        {"$eq":["$status",7]}]}]}}},
                {"$project":{"start_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$time"]}, timezone: "$time_zone"}},
                    "end_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$end_time"]}, timezone: "$time_zone"}}
                }},
                {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                    "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                }},
                {"$match":{"$expr":{"$or":[
                    {"$and":[{"$gt":["$start_date",startDate]},{"$lt":["$start_date",endDate]}]},
                    {"$and":[{"$gt":["$end_date",startDate]},{"$lte":["$end_date",endDate]}]},
                    {"$and":[{"$lte":["$start_date",startDate]},{"$gte":["$end_date",endDate]}]}
                ]}}}
            ],"as":"bookingsDetails"}},
            {"$match":{"$expr":{"$or":[{"$eq":[{"$size":"$bookingsDetails"},0]}, {"$eq":["$type",1]}]}}},
            {"$lookup":{"from":"stylistServices",let:{"vendor_id":"$_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$or":vendorServices}]
                }}},
                {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","vendor_id":"$vendor_id"},"services":{"$push":{"service_id":"$servcie_id","service_for":"$service_for"}}}},

                {"$group":{"_id":"$_id.vendor_id","services":{"$sum":1}}},
                {"$match":{"$expr":{"$and":[{"$gte":["$services",servicesCount]}]}}}
            ],"as":"vendorServices"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$vendorServices"},0]}]}}}
        ],"as":"vendorDetails"}};
        var unwindVendorDetails= {"$unwind":"$vendorDetails"};
        var stylistLookupPipeline=[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]}]}}}];

        var stylistMatchCondtion={};
        if(preferedStyles.length!=0)
         {
         var styles=[];
         var id='';
         for(var p=0;p<preferedStyles.length;p++)
         {
         id='';
         id=mongoose.Types.ObjectId(preferedStyles[p]);
         styles.push(id);
         }
             stylistMatchCondtion['styles']={"$in":styles};
         }
         if(languages.length!=0){
         var languagesSpeak=[];
         for(var l=0;l<languages.length;l++)
         {
         id='';
         id=mongoose.Types.ObjectId(languages[l]);
         languagesSpeak.push(id);
         }
             stylistMatchCondtion["languages_speak"]={"$in":languagesSpeak};
         }
            if(Object.keys(stylistMatchCondtion)!=0)
            {
                stylistLookupPipeline.push({"$match":stylistMatchCondtion});
            }
        var stylistLookup= {"$lookup":{"from":"stylist",'let':{"vendor_id":'$vendor_id'},
            "pipeline":stylistLookupPipeline,"as":"stylist"}};
        var stylistUnwind= {"$unwind":"$stylist"};
        var ratingLookup= {"$lookup":{"from":"rating","let":{"vendor_id":"$vendor_id"}
            ,"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$eq":["$rated_by",1]}]}}}],"as":"rating"}};
        var expertiseLookup= {"$graphLookup": {"from": "services","startWith": "$stylist.expertise","connectFromField": "salonEmployees.expertise",
            "connectToField": "_id","as": "expertise"}};


        var serviceForLookup=  {"$lookup":{"from":"stylistServices","let":{"vendor_id":"$vendor_id"},
            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$ne":["$status",0]}]}}},

                {"$group":{"_id":"$vendor_id","service_for":{$addToSet:"$service_for"}}}
            ],"as":"stylistServices"}};
        var serviceForLookupUnwind={"$unwind":"$stylistServices"};


        var project=
            { "$project" :{"distance":"$distance",
                "type":"$type",
                "expertise":"$expertise.service_name."+languageCode,
                "name": {"$ifNull":[{"$concat":[{"$ifNull":["$vendorDetails.first_name."+languageCode,"$vendorDetails.first_name.en"]},"  ",{"$ifNull":["$vendorDetails.last_name."+languageCode,"$vendorDetails.first_name.en"]}]},""]},
                "profile_pic": "$vendorDetails.profile_pic",
                "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "vendor_id" : {"$ifNull":["$vendor_id",""]} ,
                "salon_id" : "$salon_id" ,
                "service_for":"$stylistServices.service_for",
                "vendorServices":"$vendorDetails.vendorServices.services",
                //"vendorDetails":"$vendorDetails",
                "booked":{"$ifNull":["$vendorDetails.booked",0]},
                "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},
                    "longitude":{"$arrayElemAt":["$location.coordinates",0]}}}};

        var vendorTotallConditon=[
            geoNear,
            basicMatchCondition,
            lookupVendor,
            unwindVendorDetails,
            stylistLookup,
            stylistUnwind,
            ratingLookup,
            expertiseLookup,
            serviceForLookup,
            serviceForLookupUnwind,
            project,
            {"$group":{"_id":{"salon_id":"$salon_id","vendor_id":"$vendor_id"},"vendorDetails":{"$first":"$$ROOT"}}},
            { $replaceRoot: { newRoot:"$vendorDetails" } }
        ];


        if(rating.length!=0)
        {
            vendorTotallConditon.push({"$match":{"$expr":{"$and":[{"$and":[{"$gte":["$totalrating",parseFloat(rating[0])]},
                {"$lte":["$totalrating",parseFloat(rating[1])]}]}]}}})
        }
        if(sort!=0)
        {
           sort=parseInt(sort);
            var sortConditon='';
            if(sort==1)
            {
                sortConditon = {"$sort":{'totalrating':-1}}
            }
            if(sort==2)
            {
                sortConditon = {"$sort":{'booked':-1}}
            }
            if(sort==3)
            {
                sortConditon = {"$sort":{'distance':1}}
            }
            if(sortConditon!='')
            {
                vendorTotallConditon.push(sortConditon);
            }
        }
        db.vendorLocation.aggregate(vendorTotallConditon).allowDiskUse(true).exec(function(err,response){

            return callBack(response);
        });
        /*db.vendorLocation.aggregate([ {'$geoNear':{near:{type: 'Point', coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
         distanceField: 'distance', distanceMultiplier: 0.001, spherical: true } },
         {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}},
         {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
         {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor"]}]} }} ],"as":"vendorDetails"}},
         {"$unwind":"$vendorDetails"},
         {"$lookup":{"from":"stylist","localField":"vendorDetails._id","foreignField":"vendor_id","as":"stylist"}},
         {"$unwind":"$stylist"},
         {"$lookup":{"from":"rating","localField":"vendor_id","foreignField":"vendor_id","as":"rating"}},
         {"$graphLookup": {"from": "services","startWith": "$stylist.expertise","connectFromField": "salonEmployees.expertise",
         "connectToField": "_id","as": "expertise"}},
         { "$project" :{"distance":"$distance",
         "type":"$type",
         "expertise":"$expertise.service_name.en",
         "name": {"$ifNull":["$vendorDetails.last_name",'']},
         "profile_pic": "$vendorDetails.profile_pic",
         "totalrating":{"$avg":{"$size":"$rating.rating"}},
         "totalreviews":{"$size":"$rating"},
         "vendor_id" : {"$ifNull":["$vendor_id",""]} ,
         "salon_id" : "$salon_id" ,
         "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}
         ],function(err,response){

         return callBack(response);
         });*/
    },getStylistForBooking:function(response,timezone,rejectVendors,languageCode,callBack)
    {

        var vendorServices=[];
        //  var vendorId=response[0]._id;
        response=response[0].cart;
        var servicesCount=response.length;
        var duration=0;
        for(var i=0;i<response.length;i++)
        {
            var serviceId= mongoose.Types.ObjectId(response[i].service_id);
            var for_whom=response[i].selected_for ;
            var selected_service_level=response[i].selected_service_level ;
            var latitude=response[i].latitude;
            var longitude=response[i].longitude;
            var matchConditionService={};
            var matchConditionServiceFor={};
            var matchConditionServiceLevel={};
            matchConditionService['$eq']=['$service_id',serviceId];

            //vendorServices.push(matchCondition);
            for_whom=parseInt(for_whom);
            matchConditionServiceFor['$eq']=['$service_for',for_whom];
            // vendorServices.push(matchCondition);

            selected_service_level=parseInt(selected_service_level);
            matchConditionServiceLevel['$in']=[selected_service_level,'$service_levels'];


            duration+=parseInt(response[i].duration);
            vendorServices.push({"$and":[matchConditionService,matchConditionServiceFor,matchConditionServiceLevel,
                {"$ne":["$status",0]}
            ]});



            /*var serviceId= mongoose.Types.ObjectId(response[i].service_id);
             var for_whom=response[i].selected_for ;
             var selected_service_level=response[i].selected_service_level ;
             var latitude=response[i].latitude;
             var longitude=response[i].longitude;
             var matchCondition={};
             matchCondition['$eq']=['$service_id',serviceId];
             vendorServices.push(matchCondition);
             matchCondition={};
             matchCondition['$eq']=['$service_for',for_whom];
             vendorServices.push(matchCondition);
             matchCondition={};
             matchCondition['$in']=[selected_service_level,'$service_levels'];
             vendorServices.push(matchCondition);
             vendorServices.push({"$ne":["$status",0]});*/
        }

        var dateTimeFormat='YYYY-MM-DD HH:mm';
        var timeFormat='HH:mm';
        //for booking date//
        var startDateTime=moment.utc();
        var startDate=startDateTime.format(dateTimeFormat);
        var endDateTime=moment(startDateTime).add(duration, 'minutes');
        var endDate=endDateTime.format(dateTimeFormat);

        //for local time //
        var startLocalDateTime=moment.tz(timezone);
        var startTime=startLocalDateTime.format(timeFormat);
        var endLocalDateTime=moment(startLocalDateTime).add(duration,'minutes');
        var endTime=endLocalDateTime.format(timeFormat);
        var day=startLocalDateTime.day();
        if(day==0)
        {
            day=7;
        }
        var salonEmployeeCondtion= {};
        salonEmployeeCondtion["working_time."+day]={"$elemMatch":{"$and":[{"start":{"$lte":startTime}},{"end":{'$gte':endTime}},
            {"break":{"$not":{"$elemMatch":{"$or":[
                {"$and":[{"start":{"$gt":startTime}},{"start":{"$lt":endTime}}]},
                {"$and":[{"end":{"$gt":startTime}},{"end":{"$lt":endTime}}]},
                {"$and":[{"start":{"$lte":startTime}},{"end":{"$gt":endTime}}]}
            ]}}}}
        ]}};
         var matchCondition= {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}};
            if(rejectVendors.length!=0)
            {

                  var vendors=[];
                  var vendor='';
                  for(var i=0;i<rejectVendors.length;i++)
                  {
                    vendor=  mongoose.Types.ObjectId(rejectVendors[i]);
                       vendors.push(vendor);
                  }
                matchCondition={"$match":{"vendor_id":{"$nin":vendors}}};
            }
        db.vendorLocation.aggregate([
            {'$geoNear':{near:{type: 'Point', coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                "maxDistance":4*1000,
                "limit":1000000,
                'query':{"vendor_id":{"$exists":true}},
                spherical: true } } ,
            matchCondition,
            {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor"]}]} }},
                {"$lookup":{"from":"providerStatus","let":{"vendor_id":"$_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$vendor_id"]}]}}}],"as":"providerStatus"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
                {"$lookup":{"from":'salonEmployees','let':{"employee_id":{"$ifNull":["$employee_id",'']}},
                    "pipeline":[
                        {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$employee_id"]}]}}},
                        {"$match":{"$and":[salonEmployeeCondtion]}}
                    ],"as":"salonEmployees"
                }},
                {"$match":{"$expr":{"$or":[{"$gt":[{"$size":"$salonEmployees"},0]},{"$eq":["$type",1]}]}}},
                {"$lookup":{"from":"stylist","let":{"vendor_id":'$_id'},
                    "pipeline":[{"$match":{"$expr":{"$and":[
                        {"$eq":["$vendor_id","$$vendor_id"]},
                        {"$eq":["$agent_status",1]},
                        {"$eq":["$manager_status",1]},
                        {"$eq":["$available_status",1]},
                        {"$eq":["$booking_status",1]}
                    ]}}}
                    ],"as":"stylistDetails"}},
                {"$unwind":"$stylistDetails"},
                {"$lookup":{"from":'bookings',"let":{"employee_id":"$employee_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$employee_id","$$employee_id"]},
                        {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                            {"$eq":["$status",7]}]}]}}},
                    {"$project":{"start_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$time"]}, timezone: "$time_zone"}},
                        "end_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$end_time"]}, timezone: "$time_zone"}}
                    }},
                    {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                        "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                    }},
                    {"$match":{"$expr":{"$or":[
                        {"$and":[{"$gt":["$start_date",startDate]},{"$lt":["$start_date",endDate]}]},
                        {"$and":[{"$gt":["$end_date",startDate]},{"$lte":["$end_date",endDate]}]},
                        {"$and":[{"$lte":["$start_date",startDate]},{"$gte":["$end_date",endDate]}]}
                    ]}}}
                ],"as":"bookingsDetails"}},

                {"$match":{"$expr":{"$or":[{"$eq":[{"$size":"$bookingsDetails"},0]}, {"$eq":["$type",1]}]}}},
                {"$lookup":{"from":"stylistServices",let:{"vendor_id":"$_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$or":vendorServices}]
                    }}},
                    {"$group":{"_id":"$vendor_id","services":{"$sum":1}}},
                    {"$match":{"$expr":{"$and":[{"$gte":["$services",servicesCount]}]}}}
                ],"as":"vendorServices"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$vendorServices"},0]}]}}}
            ],"as":"vendorDetails"}},
            {"$unwind":"$vendorDetails"},
            {"$lookup":{"from":"bookings","let":{"vendor_id":"$vendorDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":[ {"$eq":["$vendor_id","$$vendor_id"]},
                {"$eq":["$status",8]}]}}}],"as":"totalBooking"}},
            {"$lookup":{"from":"rating","let":{"vendor_id":"$vendorDetails._id"}
                ,"pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$eq":["$rated_by",1]}]}}}],"as":"rating"}},
            {"$unwind":{"path":"$vendorDetails.stylistDetails","preserveNullAndEmptyArrays": true}},
            {"$graphLookup": {"from": "services","startWith": "$vendorDetails.stylistDetails.expertise","connectFromField": "vendorDetails.stylistDetails.expertise",
                "connectToField": "_id","as": "expertise"}},
            {"$project" :{"distance":"$distance",
                "bookings":{"$ifNull":[{"$size":"$totalBooking"},0]},
                "nationality":{"$ifNull":["$vendorDetails.stylistDetails.nationality","IND"]},
                "service_for":"$vendorDetails.services_for",
                "expertise":"$expertise.service_name."+languageCode,
                "name": {"$ifNull":[{"$concat":["$vendorDetails.first_name."+languageCode,"  ","$vendorDetails.last_name."+languageCode]},'']},
                "profile_pic": {"$ifNull":["$vendorDetails.profile_pic","salon-rating.png"]},
                "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "vendor_id" : {"$ifNull":["$vendor_id",""]} ,
                "salon_id" : "$salon_id" ,
                "mobile":"$vendorDetails.mobile",
                "tm_user_id":{"$ifNull":["$vendorDetails.tm_user_id",0]},
                "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}},
            {"$group":{"_id":{"salon_id":"$salon_id","vendor_id":"$vendor_id"},
                "vendorDetails":{"$first":"$$ROOT"}}},
            {$replaceRoot: { newRoot:"$vendorDetails" }}
        ],function(err,response){

            return callBack(response);
        });
        /*db.vendorLocation.aggregate([ {'$geoNear':{near:{type: 'Point', coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
         distanceField: 'distance', distanceMultiplier: 0.001, spherical: true } },
         {"$match":{"$and":[{"vendor_id":{"$exists":true}}]}},
         {"$lookup":{"from":"vendor","let":{"vendor":"$vendor_id"},"pipeline":[
         {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$vendor"]}]} }} ],"as":"vendorDetails"}},
         {"$unwind":"$vendorDetails"},
         {"$lookup":{"from":"stylist","localField":"vendorDetails._id","foreignField":"vendor_id","as":"stylist"}},
         {"$unwind":"$stylist"},
         {"$lookup":{"from":"rating","localField":"vendor_id","foreignField":"vendor_id","as":"rating"}},
         {"$graphLookup": {"from": "services","startWith": "$stylist.expertise","connectFromField": "salonEmployees.expertise",
         "connectToField": "_id","as": "expertise"}},
         { "$project" :{"distance":"$distance",
         "type":"$type",
         "expertise":"$expertise.service_name.en",
         "name": {"$ifNull":["$vendorDetails.last_name",'']},
         "profile_pic": "$vendorDetails.profile_pic",
         "totalrating":{"$avg":{"$size":"$rating.rating"}},
         "totalreviews":{"$size":"$rating"},
         "vendor_id" : {"$ifNull":["$vendor_id",""]} ,
         "salon_id" : "$salon_id" ,
         "location" : {"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}}
         ],function(err,response){

         return callBack(response);
         });*/
    },
    getStylistLocation:function(vendorId,callback)
    {
        var id= mongoose.Types.ObjectId(vendorId);

        db.vendorLocation.aggregate([{'$geoNear':{near:{type: 'Point', coordinates: [ 78.3740932, 17.4184362 ] },
            distanceField: 'distance', distanceMultiplier: 0.001, spherical: true } },{"$match":{"vendor_id":id}},
            {"$project":{"latitude":{"$arrayElemAt":["$location.coordinates",1]},"longitude":{"$arrayElemAt":["$location.coordinates",0]}}}],function(err,response){
            return  callback(response);
        });
    },getSalonLocations:function(services,time,timebetween,date,latitude,longitude,callback)
    {
        /*
         time condition

         {"$match":{"timing.1":{"$elemMatch":{"start":{"$lte":"14:00:00"},
         "end":{"$gte":"14:00:00"}}}}},
         */
        var now=new Date(date);
        var day= now.getDay();
        if(day==0)
        {
            day=7;
        }
        var servicesList=[];
        var tmp={};

        /*  {"$eq":["$agent_status",1]},
         {"$eq":["$manager_status",1]}
         tmp['$eq']=['$agent_status',1];
         tmp['$eq']=['$manager_status',1];*/
        //servicesList.push(tmp);
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
            tmp['$eq']=['$status',1];
            tmpCondition.push(tmp);
            servicesList.push({"$and":tmpCondition});
        }

        var salonTimeings={};
        var totalServices=[];
        var salonEmployeeServicesCheck=[];
        var salonservices={"$or":servicesList};
        totalServices.push({"$eq":['$$salon_id','$salon_id']});
        salonEmployeeServicesCheck.push({"$eq":['$$salon_id','$salon_id']});

        totalServices.push(salonservices);
        salonEmployeeServicesCheck.push(salonservices);
        // var salonEmployeeServicesCheck=totalServices;

        salonEmployeeServicesCheck.push({"$in":["$employee_id","$$employee_id"]});

        if(time!='')
        {
            var condition=[];
            var tmp={};
            tmp['working_hours']={"$exists":true};
            condition.push(tmp);
            tmp={};
            tmp['working_hours.'+day]={"$exists":true};
            var timeings={};

            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":time},"end":{"$gte":time}}};
            condition['$or']=[];
            condition['$or'].push(timeings);
            salonTimeings['$match']={"$and":condition};
        }else if(timebetween!='')
        {
            var condition=[];
            var tmp={};
            tmp['working_hours']={"$exists":true};
            // condition.push(tmp);
            // tmp={};
            // tmp['working_hours.'+day]={"$exists":true};
            var timeings={};

            var  splitTimeings=timebetween.split('-');
            var startTime=splitTimeings[0];
            startTime=startTime.split(":");
            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":""+startTime[0]+":"+startTime[1]},"end":{"$gte":""+startTime[0]+":"+startTime[1]}}};


            condition.push({"$and":[tmp,timeings]});
            timeings={};
            var endTime=splitTimeings[1];
            endTime=endTime.split(":");

            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":""+endTime[0]+":"+endTime[1]},"end":{"$gte":""+endTime[0]+":"+endTime[1]}}};
            condition.push({"$and":[tmp,timeings]});

            salonTimeings['$match']={"$or":condition};
        }



        /* {"$lookup":{"from":"salonEmployeeServices",let:{"salon_id":"$_id"},
         "pipeline":[{"$match":{"$expr":{"$and":totalServices}}},
         {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},"employeeServiceCount":{"$sum":1}}},
         {"$match":{"$expr":{"$and":[{"$eq":["$employeeServiceCount",servicesCount]}]}}}

         ],"as":"salonEmployeeService"}} ,
         {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployeeService"},0]}]}}}*/




        db.salon.aggregate([
            {"$match":{"agent_status":1,"manager_status":1,"booking_status":1,"active_status":1}},
            salonTimeings,
            {"$lookup":{"from":"vendorLocation","let":{"salon_id":"$_id"},"pipeline":[
                {'$geoNear':{
                    near:{type: 'Point',
                        coordinates: [ parseFloat(longitude), parseFloat(latitude) ] },
                    distanceField: 'distance',
                    "limit":1000000,
                    'query':{"salon_id":{"$exists":true}},
                    "distanceMultiplier":1/1000,
                    "maxDistance":4*1000,
                    spherical: true } },
                {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]}]}}}
            ],"as":"salonLocation"}},
            {"$unwind":"$salonLocation"},
            {"$lookup":{"from":"salonEmployees","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$booking_status",1]}]}}},
                    {"$group":{"_id":"$salon_id","employee_id":{"$push":"$_id"}}}],"as":"salonEmployees"}},
            {"$unwind":"$salonEmployees"},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id","employee":"$salonEmployees.employee_id"},
                "pipeline":[{"$match":{"$expr":{"$and":totalServices}}},
                    {"$group":{"_id":"$salon_id","services":{"$sum":1},"service_price":{"$sum":"$service_cost"},
                        "salon_employees":{"$first":"$$employee"}}},
                    {"$match":{"$expr":{"$and":[{"$eq":["$services",servicesCount]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices",let:{"salon_id":"$_id","employee_id":"$salon_employees"},
                        "pipeline":[{"$match":{"$expr":{"$and":salonEmployeeServicesCheck}}},
                            {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                                "employeeServiceCount":{"$sum":1}}},
                            {"$group":{"_id":null,"employeeService":{"$push":"$_id"}}},
                            {"$match":{"$expr":{"$and":[{"$gte":[{"$size":"$employeeService"},servicesCount]}]}}}
                        ],"as":"salonEmployeeService"}},
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployeeService"},0]}]}}}
                ],"as":"salonServicesDetails"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonServicesDetails"},0]}]}}},
            {"$unwind":"$salonServicesDetails"},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$ne":["$status",0]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices","let":{"service_id":"$service_id",
                        "salon_id":"$salon_id","service_for":"$service_for"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service_id"]},{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$service_for","$$service_for"]},{"$ne":["$status",0]}]}}},
                            {"$group":{"_id":"$salon_id","service_for":{"$addToSet":"$service_for"}}}
                        ],
                        "as":"salonEmployeeServices"}},
                    {"$unwind":"$salonEmployeeServices"},
                    {"$group":{"_id":"$salon_id","service_for":{$addToSet:"$service_for"}}}
                ],"as":"salonServices"}},
            {"$unwind":"$salonServices"},
            {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},"pipeline":
                [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$salon_id",
                    "file_path":{"$push":"$file_path"}}},
                    {"$project":{"_id":0}}],"as":"salonPitures"}
            },
            {"$lookup":{"from":"rating","let":{"salon_id":"$_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}
            },
            {"$project":
                {"_id":0,
                    "salon_id":"$_id",
                    "name":"$salon_name",
                    "salon_pictures":{"$arrayElemAt":["$salonPitures",0]},
                    "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10]},0]},
                    "totalreviews":{"$size":"$rating"},
                    "location" : {"latitude":{"$arrayElemAt":["$salonLocation.location.coordinates",1]},
                        "longitude":{"$arrayElemAt":["$salonLocation.location.coordinates",0]},
                        "address":{"$ifNull":["$salonLocation.address",'']},
                        "distance":{
                            $divide: [{
                                $trunc: {
                                    $multiply: ["$salonLocation.distance", 1000]
                                }
                            }, 1000]
                        }},
                    "service_price":"$salonServicesDetails.service_price",
                    "service_for":"$salonServices.service_for",
                    "for":"$working_genders"
                }},
            {"$project":{"salon_id":"$salon_id","name":"$name","view":{"$ifNull":["$type",0]},
                "profile_pic":"salon-rating.png",
                "salon_pictures":"$salon_pictures.file_path",
                "totalrating":"$totalrating",
                "totalreviews":"$totalreviews",
                "location" : "$location",
                "for":"$service_for",
                "service_price":1
            }},{"$sort":{"location.distance":-1}}
        ],function(err,response)
        {

            return callback(response)
        });
    }
    ,getSalonLocationsWithFilter:function(services,time,timebetween,date,latitude,longitude,filter,languageCode,callback)
    {
        /*
         time condition

         {"$match":{"timing.1":{"$elemMatch":{"start":{"$lte":"14:00:00"},
         "end":{"$gte":"14:00:00"}}}}},
         */
        var now=new Date(date);
        var day= now.getDay();
        if(day==0)
        {
            day=7;
        }
        var servicesList=[];
        var tmp={};
        /*  {"$eq":["$agent_status",1]},
         {"$eq":["$manager_status",1]}
         tmp['$eq']=['$agent_status',1];
         tmp['$eq']=['$manager_status',1];*/
        //servicesList.push(tmp);
        var servicesCount=services.length;

        var distanceFilter=[];
        var ratingFilter=[];
        var salonType=[];
        var priceFilter=[];
        var facilityFilter=[];
        var languages=[];
        var sortFilter='';
        if(Object.keys(filter).length!=0)
        {
            if(filter['distance']!=undefined)
            {
               distanceFilter=filter['distance'];
            }
            if(filter['rating']!=undefined)
            {
                ratingFilter=filter['rating'];
            }
            if(filter['price']!=undefined)
            {
                priceFilter=filter['price'];
            }
            if(filter['salon_type']!=undefined)
            {
                salonType=filter['salon_type'];
                var tmp=[];
                for(var t=0;t<salonType.length;t++)
                {
                    tmp.push(parseInt(salonType[t]));
                }
                salonType=tmp;
            }
            if(filter['facilities']!=undefined)
            {
               facilityFilter=filter['facilities'];
                var tmp=[];
                for(var f=0;f<facilityFilter.length;f++)
                {
                    tmp.push(parseInt(facilityFilter[f]));
                }
                facilityFilter=tmp;
            }
            if(filter['languages']!=undefined)
            {
                languages=filter['languages'];
                var tmp=[];
                for(var l=0;l<languages.length;l++)
                {
                    tmp.push(mongoose.Types.ObjectId(languages[l]));
                }
                languages=tmp;
            }
            if(filter['sort']!=undefined)
            {
                sortFilter=filter['sort'];

            }
        }
        for(var s=0;s<services.length;s++)
        {
            var tmpCondition=[];
            tmp={};
            var serviceId= mongoose.Types.ObjectId(services[s].service_id);
            tmpCondition.push({"$eq":["$service_id",serviceId]});
            tmpCondition.push({"$eq":['$service_for',parseInt(services[s].service_for)]});
            tmpCondition.push({"$eq":["$status",1]});
            /* if(priceFilter.length!=0)
             {
             var minvalue=parseFloat(priceFilter[0]);
             var maxvalue=parseFloat(priceFilter[1]);

             tmpCondition.push({"$and":[{"$gte":['$service_cost',minvalue]},{"$lte":['$service_cost',maxvalue]}]})
             }*/
            servicesList.push({"$and":tmpCondition});
        }
        var salonTimeings={};
        var totalServices=[];
        var salonEmployeeServicesCheck=[];
        var salonservices={"$or":servicesList};
        totalServices.push({"$eq":['$$salon_id','$salon_id']});
        salonEmployeeServicesCheck.push({"$eq":['$$salon_id','$salon_id']});

        totalServices.push(salonservices);
        salonEmployeeServicesCheck.push(salonservices);
        // var salonEmployeeServicesCheck=totalServices;

        salonEmployeeServicesCheck.push({"$in":["$employee_id","$$employee_id"]});
        if(time!='')
        {
            var condition=[];
            var tmp={};
            tmp['working_hours']={"$exists":true};
            condition.push(tmp);
            tmp={};
            tmp['working_hours.'+day]={"$exists":true};
            var timeings={};
            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":time},"end":{"$gte":time}}};

            condition['$or']=[];
            condition['$or'].push(timeings);

            salonTimeings['$match']={"$and":condition};
        }else if(timebetween!='')
        {

            var condition=[];
            var tmp={};
            tmp['working_hours']={"$exists":true};
            // condition.push(tmp);
            // tmp={};
            // tmp['working_hours.'+day]={"$exists":true};
            var timeings={};
            var  splitTimeings=timebetween.split('-');
            var startTime=splitTimeings[0];
            startTime=startTime.split(":");
            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":""+startTime[0]+":"+startTime[1].trim()},
                "end":{"$gte":""+startTime[0]+":"+startTime[1].trim()}}};
            condition.push({"$and":[tmp,timeings]});
            timeings={};
            var endTime=splitTimeings[1];

            endTime=endTime.split(":");

            timeings['working_hours.'+day]={"$elemMatch":{"start":{"$lte":""+endTime[0].trim()+":"+endTime[1]},"end":{"$gte":""+endTime[0].trim()+":"+endTime[1]}}};
            condition.push({"$and":[tmp,timeings]});
            salonTimeings['$match']={"$or":condition};
        }
        var location= '';

        if(distanceFilter.length!=0){
            location= {"$lookup":{"from":"vendorLocation","let":{"salon_id":"$_id"},"pipeline":[{'$geoNear':{
                near:{type: 'Point',
                    coordinates:[parseFloat(longitude),parseFloat(latitude)]},
                distanceField: 'distance',
                "limit":1000000,
                "distanceMultiplier":1/1000,
                spherical: true } },
                {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]},
                    {"$and":[{"$gte":["$distance",parseFloat(distanceFilter[0])]},{"$lt":["$distance",parseFloat(distanceFilter[1])]}]}
                ]}}}
            ],"as":"salonLocation"}}
        }else{
            location=   {"$lookup":{"from":"vendorLocation","let":{"salon_id":"$_id"},"pipeline":[{'$geoNear':{
                near:{type: 'Point',
                    coordinates:[parseFloat(longitude),parseFloat(latitude)]},
                distanceField: 'distance',
                "distanceMultiplier":1/1000,
                "limit":10000000,
                'query':{"salon_id":{"$exists":true}},
                "maxDistance":4*1000,
                spherical: true } },
                {"$match":{"$expr":{"$and":[{"$eq":["$$salon_id","$salon_id"]}]}}}
            ],"as":"salonLocation"}}
        }
        var unwindLocation= {"$unwind":"$salonLocation"};

        var checkSalonServices='';

        var salonEmployess= {"$lookup":{"from":"salonEmployees","let":{"salon_id":"$_id"},
            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$booking_status",1]}]}}},
                {"$group":{"_id":"$salon_id","employee_id":{"$push":"$_id"}}}],"as":"salonEmployees"}};
        var salonEmployessUnwind={"$unwind":"$salonEmployees"};

        if(languages.length!=0)
        {
            var emploeeCondition=[];
            emploeeCondition.push({"language":{"$in":languages}});
            checkSalonServices= {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id","employee":"$salonEmployees.employee_id"},
                "pipeline":[{"$match":{"$expr":{"$and":totalServices}}},
                    {"$group":{"_id":"$salon_id","services":{"$sum":1},"service_price":{"$sum":"$service_cost"},
                        "salon_employees":{"$first":"$$employee"}}},
                    {"$match":{"$expr":{"$and":[{"$eq":["$services",servicesCount]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices",let:{"salon_id":"$_id","employee_id":"$salon_employees"},
                        "pipeline":[{"$match":{"$expr":{"$and":salonEmployeeServicesCheck}}},
                            {"$lookup":{"from":"salonEmployees","let":{"employee_id":"$employee_id"},
                                "pipeline":[
                                    {"$match":{"$expr":{"$and":[{"$eq":["$$employee_id","$_id"]}]}}},
                                    {"$match":{"$and":emploeeCondition}}],"as":"salonEmployees"
                            }},
                            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployees"},0]}]}}},
                            {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                                "employeeServiceCount":{"$sum":1}}},
                            {"$group":{"_id":null,"employeeService":{"$push":"$_id"}}},
                            {"$match":{"$expr":{"$and":[{"$gte":[{"$size":"$employeeService"},servicesCount]}]}}}
                        ],"as":"salonEmployeeService"}} ,
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployeeService"},0]}]}}}
                ],"as":"salonServicesDetails"}};
        }else
        {
            checkSalonServices= {"$lookup":{"from":"salonServices","let":{"salon_id":"$_id","employee":"$salonEmployees.employee_id"},
                "pipeline":[{"$match":{"$expr":{"$and":totalServices}}},
                    {"$group":{"_id":"$salon_id","services":{"$sum":1},"service_price":{"$sum":"$service_cost"},
                        "salon_employees":{"$first":"$$employee"}}},
                    {"$match":{"$expr":{"$and":[{"$eq":["$services",servicesCount]}]}}},
                    {"$lookup":{"from":"salonEmployeeServices",let:{"salon_id":"$_id","employee_id":"$salon_employees"},
                        "pipeline":[{"$match":{"$expr":{"$and":salonEmployeeServicesCheck}}},
                            {"$group":{"_id":{"service_id":"$service_id","service_for":"$service_for","salon_id":"$salon_id"},
                                "employeeServiceCount":{"$sum":1}}},
                            {"$group":{"_id":null,"employeeService":{"$push":"$_id"}}},
                            {"$match":{"$expr":{"$and":[{"$gte":[{"$size":"$employeeService"},servicesCount]}]}}}
                        ],"as":"salonEmployeeService"}} ,
                    {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonEmployeeService"},0]}]}}}
                ],"as":"salonServicesDetails"}};
        }
        var salonServicesCondition='';
        if(priceFilter.length!=0)
        {
            var minvalue=parseFloat(priceFilter[0]);
            var maxvalue=parseFloat(priceFilter[1]);
            salonServicesCondition={"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonServicesDetails"},0]},
                {"$and":[{"$gte":[{ $arrayElemAt: ["$salonServicesDetails.service_price",0] },minvalue]},{"$lte":[{ $arrayElemAt: ["$salonServicesDetails.service_price",0] },maxvalue]}]}]}}};
        }else{
            salonServicesCondition={"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$salonServicesDetails"},0]}]}}};
        }

        var salonServiceUnwind={"$unwind":"$salonServicesDetails"};
        var serviceFor={"$lookup":{"from":"salonServices","let":{"salon_id":"$_id"},
            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$ne":["$status",0]}]}}},
                {"$lookup":{"from":"salonEmployeeServices","let":{"service_id":"$service_id","salon_id":"$salon_id","service_for":"$service_for"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$service_id","$$service_id"]},{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$service_for","$$service_for"]},{"$ne":["$status",0]}]}}},
                        {"$group":{"_id":"$salon_id","service_for":{"$addToSet":"$service_for"}}}
                    ],
                    "as":"salonEmployeeServices"}},
                {"$unwind":"$salonEmployeeServices"},
                {"$group":{"_id":"$salon_id","service_for":{$addToSet:"$service_for"}}}
            ],"as":"salonServices"}};
        var unwindServiceFor= {"$unwind":"$salonServices"};
        var pictures= {"$lookup":{"from":"salonPictures","let":{"salon_id":"$_id"},"pipeline":
            [{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$salon_id",
                "file_path":{"$push":"$file_path"}}},
                {"$project":{"_id":0}}],"as":"salonPitures"}
        };
        var rating={"$lookup":{"from":"rating","let":{"salon_id":"$_id"},
            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":["$rated_by",1]}]}}}],
            "as":"rating"}
        };
        var projectFirstStage= {"$project":{"_id":0,
                "salon_id":"$_id",
                "name":{"$ifNull":["$salon_name."+languageCode,""]},
                "salon_pictures":{"$arrayElemAt":["$salonPitures",0]},
                "totalrating":
                    { "$ifNull": [
                    { '$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.rating"}, 10]}, 0.5]}}, 10] } ,0 ]  },
                "totalreviews": { "$size":"$rating" },
                "location" : { "latitude":{"$arrayElemAt":["$salonLocation.location.coordinates",1] },
                    "longitude": { "$arrayElemAt" : ["$salonLocation.location.coordinates",0] },
                    "address": { "$ifNull": [ "$salonLocation.address" , '' ] },
                    "distance": {
                        $divide: [{
                            $trunc: {
                                $multiply: [ "$salonLocation.distance" , 1000]
                            }
                        }, 1000]
                    } },
                "service_price":"$salonServicesDetails.service_price",
                "service_for":"$salonServices.service_for",
                "booked":"$bookings.booked",
                "for":"$working_genders"
            }};
        var projectSecondStage = {"$project":{"salon_id":"$salon_id","name":"$name","view":{"$ifNull":["$type",0]},
            "profile_pic":"salon-rating.png",
            "salon_pictures":"$salon_pictures.file_path",
            "totalrating":"$totalrating",
            "totalreviews":"$totalreviews",
            "location" : "$location",
            "for":"$service_for",
            "booked":1,
            "service_price":1
        }};
        var matchCondition='';

        var matchCondtionFilter=[];
        if(facilityFilter.length!=0)
        {
            var facilities=[];
            var wifiAvailable=facilityFilter.indexOf(1);
            var parkingAvailable=facilityFilter.indexOf(2);
            var kidsFriendly=facilityFilter.indexOf(3);
            var handicap=facilityFilter.indexOf(4);
            var pets=facilityFilter.indexOf(5);
            if(wifiAvailable!=-1)
            {
                matchCondtionFilter.push({"$eq": [ "$wifi_available", 1 ] })
            }
            if(parkingAvailable!=-1)
             {
               matchCondtionFilter.push({ "$eq": [ "$parking_available", 1 ] })
             }
            if(kidsFriendly!=-1)
            {
                matchCondtionFilter.push({ "$eq": [ "$kids_friendly", 1 ] })
            }
            if(handicap!=-1)
            {
                matchCondtionFilter.push({ "$eq": ["$handicap",1]})
            }
            if(pets!=-1)
            {
                matchCondtionFilter.push({"$eq": ["$pets",1] })
            }
        }
        matchCondtionFilter.push({"$eq":["$manager_status",1]});
        matchCondtionFilter.push({"$eq":["$agent_status",1]});
        matchCondtionFilter.push({"$eq":["$booking_status",1]});
        matchCondtionFilter.push({"$eq":["$active_status",1]});
        matchCondition={"$match":{"$expr":{"$and":matchCondtionFilter}}};

        var totalCondition=[
            matchCondition,
            salonTimeings,
            location,
            unwindLocation,
            salonEmployess,
            salonEmployessUnwind,
            checkSalonServices,
            salonServicesCondition,
            salonServiceUnwind,
            serviceFor,
            unwindServiceFor,
            pictures,
            rating,
            {"$lookup":{"from":"bookings","let":{"salon_id":"$_id"},
                "pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]},{"$eq":['$status',8]}]}}},
                    {"$group":{"_id":"$salon_id","booked":{"$sum":1}}}],"as":"bookings"}},
            {"$unwind":{"path":"$bookings","preserveNullAndEmptyArrays": true}},
            projectFirstStage,
            projectSecondStage
        ];
        if(ratingFilter.length!=0)
        {
            totalCondition.push({"$match":{"$expr":{"$and":[{"$gte":["$totalrating",parseFloat(ratingFilter[0])]},{"$lte":["$totalrating",parseFloat(ratingFilter[1])]}]}}})
        }
        if(salonType!=0)
        {
            totalCondition.push({"$match":{"$and":[{"for":{"$in":salonType}}]}})
        }

        var sort={"$sort":{"location.distance":-1}};
        if(sortFilter!='')
        {
            if(sortFilter==1)
            {
                sort={"$sort":{"booked":-1}}
            }
        }
        totalCondition.push(sort);

        db.salon.aggregate(totalCondition,function(err,response){

            return callback(response)
        });
    }
    ,getAvaliableStylists:function(latitude,longitude,languageCode,callback)
    {
        db.vendorLocation.aggregate([
                {'$geoNear':{near:{type: 'Point', coordinates: [ parseFloat(longitude), parseFloat(latitude)] },
                    distanceField: 'distance', distanceMultiplier: 0.001,
                    "limit":1000000,
                    'query':{"vendor_id":{"$exists":true}},
                    "maxDistance":150*1000, spherical: true } },
                {"$lookup":{"from":"vendor","let":{"vendor_id":"$vendor_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}}

                ],"as":"vendorDetails"}},
                {"$lookup":{"from":"providerStatus","localField":"vendor_id","foreignField":"vendor_id","as":"providerStatus"}},
                {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
                {"$lookup":{"from":"stylist","let":{"vendor_id":"$vendor_id"},"pipeline":[{"$match":{"$expr":
                    {"$and":[{"$eq":["$vendor_id","$$vendor_id"]},
                        {"$eq":["$agent_status",1]},
                        {"$eq":["$manager_status",1]},
                        {"$eq":["$available_status",1]},
                        {"$eq":["$booking_status",1]}]}}}],"as":"stylistDetails"}},
                {"$unwind":"$vendorDetails"},
                {"$unwind":"$stylistDetails"},
                {"$lookup":{"from":"stylistServices",let:{"vendor_id":"$vendor_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$and":[{"$eq":["$vendor_id","$$vendor_id"]},{"$ne":['$status',0]}]}
                    ]}}
                    }],"as":"vendorServices"}},
                {"$project":{"_id":0,"vendor_id":"$vendor_id","services":"$vendorServices",
                    "latitude":{"$arrayElemAt":["$location.coordinates",1]},
                    "longitude":{"$arrayElemAt":["$location.coordinates",0]},
                    "profile_pic":"$vendorDetails.profile_pic",
                    "name":{"$concat":["$vendorDetails.first_name."+languageCode,"  ","$vendorDetails.last_name."+languageCode ]},
                    "nationality":"$stylistDetails.nationality"

                }},
                {"$group":{"_id":{"salon_id":"$salon_id","vendor_id":"$vendor_id"},"vendorDetails":{"$first":"$$ROOT"}}},
                { $replaceRoot: { newRoot:"$vendorDetails" } }
            ],
            function(err,response){

                return callback(response);
            });
    },checkStylistsForServices:function(serviceId,serviceFor,duration,latitude,longitude,timezone,cityId,callback)
    {

        var service= mongoose.Types.ObjectId(serviceId);
        var city= mongoose.Types.ObjectId(cityId);
        var dateTimeFormat='YYYY-MM-DD HH:mm';
        var timeFormat='HH:mm';
        //for booking date//
        var startDateTime=moment.utc();
        var startDate=startDateTime.format(dateTimeFormat);
        var endDateTime=moment(startDateTime).add(duration, 'minutes');
        var endDate=endDateTime.format(dateTimeFormat);

        //for local time //
        var startLocalDateTime=moment.tz(timezone);
        var startTime=startLocalDateTime.format(timeFormat);
        var endLocalDateTime=moment(startLocalDateTime).add(duration, 'minutes');
        var endTime=endLocalDateTime.format(timeFormat);
        var day=startLocalDateTime.day();
        if(day==0)
        {
            day=7;
        }
        var salonEmployeeCondtion= {};
        salonEmployeeCondtion["working_time."+day]={"$elemMatch":{"$and":[{"start":{"$lte":startTime}},{"end":{'$gte':endTime}},
            {"break":{"$not":{"$elemMatch":{"$or":[
                {"$and":[{"start":{"$gt":startTime}},{"start":{"$lt":endTime}}]},
                {"$and":[{"end":{"$gt":startTime}},{"end":{"$lt":endTime}}]},
                {"$and":[{"start":{"$lte":startTime}},{"end":{"$gt":endTime}}]}
            ]}}}}
        ]}};
        db.vendorLocation.aggregate([{'$geoNear':{near:{type: 'Point', coordinates: [ parseFloat(longitude),parseFloat(latitude)] },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                'query':{"vendor_id":{"$exists":true}},
                "limit":99999999,
                "maxDistance":150*1000, spherical: true } },
            {"$lookup":{"from":"providerStatus","localField":"vendor_id","foreignField":"vendor_id","as":"providerStatus"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$providerStatus"},0]}]}}},
            {"$lookup":{"from":'vendor',"let":{"vendor_id":"$vendor_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$$vendor_id","$_id"]}]}}},
                {"$lookup":{"from":'salonEmployees','let':{"employee_id":{"$ifNull":["$employee_id",'']}},
                    "pipeline":[
                        {"$match":{"$expr":{"$and":[{"$eq":["$_id","$$employee_id"]}]}}},
                        {"$match":{"$and":[salonEmployeeCondtion]}}
                    ],"as":"salonEmployees"
                }},
                {"$match":{"$expr":{"$or":[{"$gt":[{"$size":"$salonEmployees"},0]},{"$eq":["$type",1]}]}}},
                {"$lookup":{"from":'bookings',"let":{"employee_id":"$employee_id"},"pipeline":[
                    {"$match":{"$expr":{"$and":[{"$eq":["$employee_id","$$employee_id"]}]}}},
                    {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                        "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                    }},
                    {"$match":{"$expr":{"$or":[
                        {"$and":[{"$gt":["$start_date",startDate]},{"$lt":["$start_date",endDate]}]},
                        {"$and":[{"$gt":["$end_date",startDate]},{"$lte":["$end_date",endDate]}]},
                        {"$and":[{"$lte":["$start_date",startDate]},{"$gte":["$end_date",endDate]}]}
                    ]}}}
                ],"as":"bookingsDetails"}},
                {"$match":{"$expr":{"$or":[
                    {"$eq":[{"$size":"$bookingsDetails"},0]},
                    {"$eq":["$type",1]}
                ]}}}
            ],"as":"vendorDetails"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$vendorDetails"},0]}]}}},
            {"$lookup":{"from":"stylist","let":{"vendor_id":"$vendor_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[
                    {"$eq":[city,"$city_id"]},

                    {"$eq":["$agent_status",1]},
                    {"$eq":["$manager_status",1]},
                    {"$eq":["$available_status",1]},
                    {"$eq":["$booking_status",1]},
                    {"$eq":["$$vendor_id","$vendor_id"]}]}}}],"as":"stylistDetails"}},
            {"$unwind":"$stylistDetails"},
            {"$lookup":{"from":"stylistServices","let":{"vendor_id":"$vendor_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[
                    {"$eq":["$service_id",service]},
                    {"$eq":["$service_for",parseInt(serviceFor)]},
                    {"$eq":["$$vendor_id","$vendor_id"]},{"$ne":["$status",0]}]}}},{"$unwind":"$service_levels"}],
                "as":"stylistServices"}},
            {"$match":{"$expr":{"$and":[{"$gt":[{"$size":"$stylistServices"},0]}]}}},
            {"$unwind":"$stylistServices"}  ,
            {"$group":{"_id":{"service_id":"$service_id"},"service_levels":{"$addToSet":"$stylistServices.service_levels"}}}
        ],function(err,response){
            return callback(response);
        });
    }

};
