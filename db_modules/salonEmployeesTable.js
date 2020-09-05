var db = require('../db');
var mongoose = require('mongoose');
var utility=require('../utility/utility');
module.exports=
    {
        status: {
            "0": {
                status:0,"value": "Employee inactive"
            },
            "1": {
                status:1, "value": "Employee active"
            }
        },
        save: function (values, callback) {

            var salonEmployees = new db.salonEmployees(values);
            salonEmployees.save(function (err, response) {

                return callback(response);
            });
        },
        find: function (check, callback) {
            db.salonEmployees.find(check, function (err, response) {

                return  callback(response);
            });
        }, updateMany:function(data,where,callback)
    {

        db.salonEmployees.updateMany(where,
            {"$set":data},function(err,response){

                return callback(response);
            });
    },  findFieldsWithPromises: function (check, fields){
            return new Promise(function(resolve){

                db.salonEmployees.find(check, fields ,function (err, response) {

                    resolve(response);
                });
            });
        }, updateManyWithPromises:function(data,where){
            return new Promise(function(resolve){
                db.salonEmployees.update(where, {$set:data},{multi:true}, function(err, response){

                    resolve(response);

                });
            });
        },update:function(data,where,callback){
        db.salonEmployees.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            return  callback(response);
           });
         },getSalonStaff:function(salonId,languageCode,callback)
            {
           var salon = mongoose.Types.ObjectId(salonId);
            db.salonEmployees.aggregate([{"$match":{"salon_id":salon}
            },
            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertise"}},
            {"$graphLookup":{"from":"languages", "startWith":"$language",
                "connectFromField":"language",
                "connectToField":"_id","as":"languages"}},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$salon_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},
                    {"$group":{"_id":"$service_id"}}],"as":"salonServices"}},
            {"$project":{"_id":0,"employee_id":"$_id",
                    "name":{"$concat":["$employee_first_name."+languageCode," ","$employee_last_name."+languageCode]},
                "about":{"$ifNull":["$about",'']},
                "mobile":"$employee_mobile",
                "languages":"$languages.language."+languageCode,
                "expertise":"$expertise.service_name."+languageCode,
                "working_hours":"$working_time",
                "services":{"$size":"$salonServices"},
                "for":[1,2],
                "profile_pic":"$profile_pic",
                "country":"$nationality"}}],function(err,response)
        {

            return callback(response);
        });
        },  getSalonStaffList:function(salonId,languagesCode,callback){
        var salon = mongoose.Types.ObjectId(salonId);
        db.salonEmployees.aggregate([
            {"$match":{"salon_id":salon}},
            {"$project":{"_id":0,
                "employee_id":"$_id",
                "name":{"$concat":[{"$ifNull":["$employee_first_name."+languagesCode,"$employee_first_name.en"]}," ",{"$ifNull":["$employee_last_name."+languagesCode,"$employee_last_name.en"]}]},
                "profile_pic":"$profile_pic"
            }}],function(err,response){

            return callback(response);
        });
    },
        getSalonStaffInfo:function(salonId,languagesCode,callback)
        {
        var salon = mongoose.Types.ObjectId(salonId);
        db.salonEmployees.aggregate([
            {"$match":{"salon_id":salon}},
            {"$lookup":{"from":"rating","let":{"employee_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":
                [{"$eq":["$employee_id","$$employee_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}},
            {"$graphLookup":{"from":"services", "startWith":"$expertise","connectFromField":"expertise","connectToField":"_id","as":"expertise"}},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$salon_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$service_id"}}],"as":"salonServices"}},
            {"$lookup":{"from":'vendor',"let":{'employee_id':"$_id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$$employee_id","$employee_id"]}]}}}],"as":'serveOutDetails'}},
            {"$project":{"_id":0,"employee_id":"$_id","name":{"$concat":[{"$ifNull":["$employee_first_name."+languagesCode,"$employee_first_name.en"]}," ",{"$ifNull":["$employee_last_name."+languagesCode,"$employee_last_name.en"]}]},
                "about":"$about","mobile":"$employee_mobile","languages":"","expertise":"$expertise.service_name.en",
                "working_hours":"$working_time",
                "services":{"$size":"$salonServices"},
                "for":[1,2],"profile_pic":"$profile_pic",
                'has_serve_out':{ $cond: [{"$gt":[{"$size":"$serveOutDetails"},0]}, 2, 1 ] },
            "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.employee_rating"}, 10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "country":"$nationality",
                "serve_out":{"$ifNull":["$serve_out",1]},
                "booking_status":{"$ifNull":["$booking_status",1]},
                "active_status":{"$ifNull":["$active_status",1]}
            }}],function(err,response){

            return callback(response);
        });
    },getAllSalonStaffInfo:function(vendorId,languagesCode,callback)
    {
        var vendor = mongoose.Types.ObjectId(vendorId);
        db.vendor.aggregate([
            {"$match":{"_id":vendor}},
            {"$lookup":{"from":"salon","localField":"_id","foreignField":"vendor_id","as":"salonDetails"}},
            {"$unwind":"$salonDetails"},
            {"$lookup":{"from":"salonEmployees","localField":"salonDetails._id","foreignField":"salon_id","as":"salonEmployeeDetails"}},
            {"$unwind":"$salonEmployeeDetails"},
            {"$lookup":{"from":'vendor',"let":{'employee_id':"$salonEmployeeDetails._id"},"pipeline":[
                {"$match":{"$expr":{"$and":[{"$eq":["$$employee_id","$employee_id"]}]}}}],"as":'serveOutDetails'}},
            {"$lookup":{"from":"rating","let":{"employee_id":"$salonEmployeeDetails._id"},"pipeline":[{"$match":{"$expr":{"$and":
                [{"$eq":["$employee_id","$$employee_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}},
            {"$graphLookup":{"from":"services", "startWith":"$salonEmployeeDetails.expertise","connectFromField":"salonEmployeeDetails.expertise","connectToField":"_id","as":"expertise"}},
            {"$lookup":{"from":"salonServices","let":{"salon_id":"$salonDetails.salon_id"},
                "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}},{"$group":{"_id":"$service_id"}}],"as":"salonServices"}},
            {"$project":{"_id":0,"employee_id":"$salonEmployeeDetails._id",
                "name":{"$concat":[{"$ifNull":["$$salonEmployeeDetails.employee_first_name."+languagesCode,"$$salonEmployeeDetails.employee_first_name.en"]}," ",{"$ifNull":["$$salonEmployeeDetails.employee_last_name."+languagesCode,"$$salonEmployeeDetails.employee_last_name.en"]}]},

                "about":"$salonEmployeeDetails.about",
                "mobile":"$salonEmployeeDetails.employee_mobile",
                "languages":"",
                "expertise":"$expertise.service_name.en",
                "working_hours":"$working_time",
                "services":{"$size":"$salonServices"},
                "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.employee_rating"}, 10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "for":[1,2],
                'has_serve_out':{ $cond: [{"$gt":[{"$size":"$serveOutDetails"},0]}, 2, 1 ] },
                "profile_pic":"$salonEmployeeDetails.profile_pic",
                "rating":{"$ifNull":["$rating",0]},
                "country":"$nationality",
        "serve_out":{"$ifNull":["$salonEmployeeDetails.serve_out",1]},
        "booking_status":{"$ifNull":["$booking_status",1]},
        "active_status":{"$ifNull":["$active_status",1]}
        }}],function(err,response){

            return callback(response);
        });
    },checkSalonEmployees:function(cartId,serviceStart,serviceEnd,languageCode,callback)
    {
             var cart = mongoose.Types.ObjectId(cartId);
                if(serviceStart!='' && serviceStart!=undefined){
                    db.cart.aggregate([{"$match":{"_id":cart}},
                            {"$lookup":{"from":"salonEmployees","let":
                                {"salon_id":"$salon_id","service_id":"$service_for","selected_for":"$selected_for"},
                                "pipeline":[
                                    {"$match":{"$expr":{"$and":[
                                        {"$eq":["$$salon_id","$salon_id"]},
                                        {"$eq":["$booking_status",1]}
                                    ]}}}
                                ],"as":"salonEmployess"}},
                            {"$unwind":"$salonEmployess"},
                            {"$lookup":{"from":"salonEmployeeServices","let":{
                                "employee_id":"$salonEmployess._id",
                                "selected_for":"$selected_for","service_id":"$service_id"},
                                "pipeline":[{"$match":{"$expr":{"$and":[
                                    {"$eq":["$$employee_id","$employee_id"]},
                                    {"$eq":["$$service_id","$service_id"]},
                                    {"$eq":["$service_for","$$selected_for"]},{"$ne":["$status",0]}]}}}],"as":"employeeServices"}},
                            {"$unwind":"$employeeServices"},
                            {"$graphLookup":{"from":"services",
                                "startWith":"$employeeServices.expertise",
                                "connectFromField":"employeeServices.expertise",
                                "connectToField":"_id",
                                "as":"expertise"}},
                            {"$group":{"_id":"$salonEmployess._id",
                                "employeeDetails":{"$first":{"name":{"$concat":["$salonEmployess.employee_first_name."+languageCode," ","$salonEmployess.employee_last_name."+languageCode]},
                                    "employee_id":"$salonEmployess._id",
                                    "expertise":"$expertise.service_name."+languageCode,
                                    "nationality":"$salonEmployess.nationality",
                                    "profile_pic":"$salonEmployess.profile_pic"
                                }},"time":{"$first":"$time"},
                                "assign_date":{"$first":"$date"}}},

                            {"$lookup":{"from":"bookings","let":{"employee_id":{"$ifNull":["$_id",'']},
                                "start_time":"$time","assign_date":"$assign_date",
                                "end_time":"$time"},"pipeline":
                                [{"$match":{"$expr":{"$and":[
                                    {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                                        {"$eq":["$status",3]},{"$eq":["$status",7]}]},
                                    {"$eq":["$$employee_id","$employee_id"]},{"$eq":["$date","$$assign_date"]}
                                    ,{"$or":[{"$eq":["$time","$$start_time"]},{"$eq":["$end_time","$$start_time"]}]}

                                ]}}},
                                    {"$project":{"start_date":
                                        { $dateFromString : { dateString: {"$concat":["$date",' ', "$time"]},
                                            timezone: "$time_zone"}},
                                        "end_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$end_time"]},
                                            timezone: "$time_zone"}}
                                    }},
                                    {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                                        "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                                    }},
                                    {"$match":{"$expr":{"$or":[
                                        {"$and":[{"$gt":["$start_date",serviceStart]},{"$lt":["$start_date",serviceEnd]}]},
                                        {"$and":[{"$gt":["$end_date",serviceStart]},{"$lte":["$end_date",serviceEnd]}]},
                                        {"$and":[{"$lte":["$start_date",serviceStart]},{"$gte":["$end_date",serviceEnd]}]}

                                    ]}}}
                                ],
                                "as":"bookings"}},
                            {"$project":{"name":"$employeeDetails.name",
                                "employee_id":"$employeeDetails.employee_id",
                                "booking_status":"$employeeDetails.booking_status",
                                "expertise":"$employeeDetails.expertise",
                                "nationality":"$employeeDetails.nationality",
                                "profile_pic":"$employeeDetails.profile_pic",
                                "booking":"$bookings",
                                "status":{"$ifNull":[{"$cond":[{"$gt":[{"$size":"$bookings"},0]},0,1]},0]},
                                "bookings":"$employeeDetails.bookings"
                            }}
                        ],function(err,response){

                            return callback(response);
                        });
                }else{
                        db.cart.aggregate([{"$match":{"_id":cart}},
                                {"$lookup":{"from":"salonEmployees","let":
                                    {"salon_id":"$salon_id","service_id":"$service_for","selected_for":"$selected_for"},
                                    "pipeline":[
                                        {"$match":{"$expr":{"$and":[
                                            {"$eq":["$$salon_id","$salon_id"]},
                                            {"$eq":["$booking_status",1]}
                                        ]}}}
                                    ],"as":"salonEmployess"}},
                                {"$unwind":"$salonEmployess"},
                                {"$lookup":{"from":"salonEmployeeServices","let":{
                                    "employee_id":"$salonEmployess._id",
                                    "selected_for":"$selected_for","service_id":"$service_id"},
                                    "pipeline":[{"$match":{"$expr":{"$and":[
                                        {"$eq":["$$employee_id","$employee_id"]},
                                        {"$eq":["$$service_id","$service_id"]},
                                        {"$eq":["$service_for","$$selected_for"]},

                                        {"$ne":["$status",0]}]}}}],"as":"employeeServices"}},
                                {"$unwind":"$employeeServices"},
                                {"$graphLookup":{"from":"services",
                                    "startWith":"$employeeServices.expertise",
                                    "connectFromField":"employeeServices.expertise",
                                    "connectToField":"_id",
                                    "as":"expertise"}},
                                {"$group":{"_id":"$salonEmployess._id",
                                    "employeeDetails":{"$first":{"name":{"$concat":["$salonEmployess.employee_first_name."+languageCode," ","$salonEmployess.employee_last_name."+languageCode]},
                                        "employee_id":"$salonEmployess._id",
                                        "expertise":"$expertise.service_name."+languageCode,
                                        "nationality":"$salonEmployess.nationality",
                                        "profile_pic":"$salonEmployess.profile_pic"
                                    }},"time":{"$first":"$time"},
                                    "assign_date":{"$first":"$date"}}},
                                {"$lookup":{"from":"bookings","let":{"employee_id":{"$ifNull":["$_id",'']},
                                    "start_time":"$time","assign_date":"$assign_date",
                                    "end_time":"$time"},"pipeline":
                                    [{"$match":{"$expr":{"$and":[
                                        {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                                            {"$eq":["$status",3]},{"$eq":["$status",7]}]},

                                        {"$eq":["$$employee_id","$employee_id"]},{"$eq":["$date","$$assign_date"]}
                                        ,{"$or":[{"$eq":["$time","$$start_time"]},{"$eq":["$end_time","$$start_time"]}]}

                                    ]}}}
                                    ],
                                    "as":"bookings"}},
                                {"$project":{"name":"$employeeDetails.name",
                                    "employee_id":"$employeeDetails.employee_id",
                                    "expertise":"$employeeDetails.expertise",
                                    "nationality":"$employeeDetails.nationality",
                                    "profile_pic":"$employeeDetails.profile_pic",
                                    "status":{"$ifNull":[{"$cond":[{"$gt":[{"$size":"$bookings"},0]},0,1]},0]},
                                    "bookings":"$employeeDetails.bookings"
                                }}
                            ],
                            function(err,response)
                            {

                                return callback(response);
                            });
                    }

         },checkEmployeeTime:function (employeeId,starttime,endTime,date) {
        var employee = mongoose.Types.ObjectId(employeeId);

           var checkTime=starttime;
        var checkEndTime=endTime;

                return new Promise(function(resolve)
                {
            /*  db.bookings.aggregate(
                [
                    {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": [employee, "$employee_id"]},
                                {"$eq": ["$date", date]}
                                , {"$and": [{"$gte": ["$time", starttime]},
                                {"$lte":["$end_time", endTime]}]}

                            ]
                        }
                    }
                }], function (err, response){


                    return resolve(response);
                });*/

          db.bookings.aggregate([
              {"$match":{"$expr":{"$and":[{"$eq": [employee, "$employee_id"]},
                  {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                      {"$eq":["$status",3]},{"$eq":["$status",7]}]}]}}},
              {"$project":{"start_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$time"]}, timezone: "$time_zone"}},
                  "end_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$end_time"]}, timezone: "$time_zone"}}
              }},
              {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                  "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
              }},
              {"$match":{"$expr":{"$or":[
                  {"$and":[{"$gt":["$start_date",checkTime]},{"$lt":["$start_date",checkEndTime]}]},
                  {"$and":[{"$gt":["$end_date",checkTime]},{"$lte":["$end_date",checkEndTime]}]},
                  {"$and":[{"$lte":["$start_date",checkTime]},{"$gte":["$end_date",checkEndTime]}]}
              ]}}}],function(err,response){
                           
              return resolve(response);
          });
        });
    },getEmployeesTime:function(employeeId,callback){
           var employee = mongoose.Types.ObjectId(employeeId);
           db.salonEmployees.aggregate([{"$match":{"_id":employee}},{"$project":{"working_hours":"$working_time"}}], function(err,response)
           {
                   return callback(response);
           })
         },getSalonEmployeeForBooking:function(bookingId,serviceStart,serviceEnd,languagesCode,callback){
            var booking = mongoose.Types.ObjectId(bookingId);
            if(serviceStart!='' && serviceStart!=undefined){
                db.bookings.aggregate([
                    {"$match":{"_id":booking}},
                    {"$unwind":"$cart_id"},
                    {"$lookup":{"from":"cart","localField":"cart_id","foreignField":"_id","as":"cartDetails"}},
                    {"$unwind":"$cartDetails"},
                    {"$lookup":{"from":"salonEmployees","let":{"salon_id":"$salon_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}}],"as":"salonEmployess"}},
                    {"$unwind":"$salonEmployess"},
                    {"$lookup":{"from":"salonEmployeeServices","let":{
                        "employee_id":"$salonEmployess._id",
                        "selected_for":"$cartDetails.selected_for","service_id":"$cartDetails.service_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[
                            {"$eq":["$$employee_id","$employee_id"]},
                            {"$eq":["$$service_id","$service_id"]},
                            {"$ne":['$status',0]},
                            {"$eq":["$service_for","$$selected_for"]}]}}}],"as":"employeeServices"}},
                    {"$unwind":"$employeeServices"},
                    {"$graphLookup":{"from":"services",
                        "startWith":"$employeeServices.expertise",
                        "connectFromField":"employeeServices.expertise",
                        "connectToField":"_id","as":"expertise"
                    }},
                    {"$group":{"_id":"$salonEmployess._id",
                        "employeeDetails":{"$first":{"name":{"$concat":["$salonEmployess.employee_first_name."+languagesCode," ","$salonEmployess.employee_last_name."+languagesCode]},
                            "employee_id":"$salonEmployess._id",
                            "expertise":"$expertise.service_name."+languagesCode,
                            "nationality":"$salonEmployess.nationality",
                            "profile_pic":"$salonEmployess.profile_pic",
                            "status":{"$ifNull":["$sal",0]}

                        }}, "time":{"$first":"$cartDetails.time"},
                        "time_type":{"$first":"$cartDetails.time_type"}
                        ,
                        "assign_date":{"$first":"$cartDetails.date"}}},
                    {"$lookup":{"from":"bookings","let":{"employee_id":{"$ifNull":["$_id",'']},"start_time":"$time",
                        "assign_date":"$assign_date",
                        "end_time":"$time"},"pipeline":[
                            {"$match":{"$expr":{"$and":[
                            {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                                {"$eq":["$status",3]},{"$eq":["$status",7]}]},

                            {"$eq":["$$employee_id","$employee_id"]},{"$eq":["$date","$$assign_date"]}

                        ]}}},
                            {"$project":{"start_date":
                                { $dateFromString : { dateString: {"$concat":["$date",' ', "$time"]},
                                    timezone: "$time_zone"}},
                                "end_date": { $dateFromString : { dateString: {"$concat":["$date",' ', "$end_time"]},
                                    timezone: "$time_zone"}}
                            }},
                            {"$project":{"start_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$start_date" } },
                                "end_date":{ $dateToString: { format: "%Y-%m-%d %H:%M", date: "$end_date" } }
                            }},
                            {"$match":{"$expr":{"$or":[
                                {"$and":[{"$gt":["$start_date",serviceStart]},{"$lt":["$start_date",serviceEnd]}]},
                                {"$and":[{"$gt":["$end_date",serviceStart]},{"$lte":["$end_date",serviceEnd]}]},
                                {"$and":[{"$lte":["$start_date",serviceStart]},{"$gte":["$end_date",serviceEnd]}]}
                            ]}}}
                        ],
                        "as":"bookings"}},
                    {"$project":{"name":"$employeeDetails.name",
                        "employee_id":"$employeeDetails.employee_id",
                        "expertise":"$employeeDetails.expertise",
                        "nationality":"$employeeDetails.nationality",
                        "profile_pic":"$employeeDetails.profile_pic",
                        "status":{"$ifNull":[{"$cond":[{"$eq":["$time_type",2]},2,
                            {"$cond":[{"$gt":[{"$size":"$bookings"},0]},0,1]}]},0]},
                        "bookings":"$employeeDetails.bookings",
                        "time":"$time",
                        "assign_date":"$assign_date"
                    }}
                ],function(err,response){

                    return callback(response);
                });
            }else{
                    db.bookings.aggregate([
                        {"$match":{"_id":booking}},
                        {"$unwind":"$cart_id"},
                        {"$lookup":{"from":"cart","localField":"cart_id","foreignField":"_id","as":"cartDetails"}},
                        {"$unwind":"$cartDetails"},
                        {"$lookup":{"from":"salonEmployees","let":{"salon_id":"$salon_id"},
                            "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$salon_id","$$salon_id"]}]}}}],"as":"salonEmployess"}},
                        {"$unwind":"$salonEmployess"},
                        {"$lookup":{"from":"salonEmployeeServices","let":{
                            "employee_id":"$salonEmployess._id",
                            "selected_for":"$cartDetails.selected_for","service_id":"$cartDetails.service_id"},
                            "pipeline":[{"$match":{"$expr":{"$and":[
                                {"$eq":["$$employee_id","$employee_id"]},
                                {"$ne":['$status',0]},
                                {"$eq":["$$service_id","$service_id"]},
                                {"$eq":["$service_for","$$selected_for"]}
                                ]}}}],"as":"employeeServices"}},
                        {"$unwind":"$employeeServices"},
                        {"$graphLookup":{"from":"services",
                            "startWith":"$employeeServices.expertise",
                            "connectFromField":"employeeServices.expertise",
                            "connectToField":"_id","as":"expertise"
                        }},
                        {"$group":{"_id":"$salonEmployess._id",
                            "employeeDetails":{"$first":{"name":{"$concat":["$salonEmployess.employee_first_name."+languagesCode," ","$salonEmployess.employee_last_name."+languagesCode]},
                                "employee_id":"$salonEmployess._id",
                                "expertise":"$expertise.service_name."+languagesCode,
                                "nationality":"$salonEmployess.nationality",
                                "profile_pic":"$salonEmployess.profile_pic",
                                "status":{"$ifNull":["$sal",0]}

                            }}, "time":{"$first":"$cartDetails.time"},
                            "time_type":{"$first":"$cartDetails.time_type"}
                            ,
                            "assign_date":{"$first":"$cartDetails.date"}}},
                        {"$lookup":{"from":"bookings","let":{"employee_id":{"$ifNull":["$_id",'']},"start_time":"$time",
                            "assign_date":"$assign_date",
                            "end_time":"$time"},"pipeline":
                            [{"$match":{"$expr":{"$and":[
                                {"$or":[{"$eq":["$status",1]},{"$eq":["$status",2]},{"$eq":["$status",10]},
                                    {"$eq":["$status",3]},{"$eq":["$status",7]}]},
                                {"$eq":["$$employee_id","$employee_id"]},{"$eq":["$date","$$assign_date"]}

                            ]}}}
                            ],
                            "as":"bookings"}},
                        {"$project":{"name":"$employeeDetails.name",
                            "employee_id":"$employeeDetails.employee_id",
                            "expertise":"$employeeDetails.expertise",
                            "nationality":"$employeeDetails.nationality",
                            "profile_pic":"$employeeDetails.profile_pic",
                            "status":{"$ifNull":[{"$cond":[{"$eq":["$time_type",2]},2,{"$cond":[{"$gt":[{"$size":"$bookings"},0]},0,1]}]},0]},
                            "bookings":"$employeeDetails.bookings",
                            "time":"$time",
                            "assign_date":"$assign_date"
                        }}
                    ],function(err,response){
                                
                        return callback(response);
                    });
                }

        },getSalon:function(bookingId)
        {
        return new Promise(function(resolve) {
            var booking=new mongoose.Types.ObjectId(bookingId);
            db.bookings.aggregate([
                {"$match":{"$expr":{"$and":[{"$eq":["$_id",booking]}]}}},
                {"$unwind":"$cart_id"},
                {"$lookup":{"from":"cart","let":{"cart_id":"$cart_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[
                            {"$eq":["$$cart_id","$_id"]}
                            ]}}},
                            {'$lookup':{ "from":'subCategory', "localField": 'sub_category_id', "foreignField" :'_id', as: 'subCategory' } },
                            {'$lookup':{ "from": 'services', "localField":"service_id","foreignField":"_id", as: 'services' } },
                            {"$lookup":{"from":"category","localField":"category_id","foreignField":"_id","as":"category"}},
                            {"$unwind":"$category"},
                            {"$unwind":"$services"},
                            {"$project":{"cart_id":"$_id","quantity":"$quantity","service_name":"$services.service_name.en","category_name":"$category.category_name.en",
                                "selected_for":"$selected_for","selected_service_level":"$selected_service_level","price":"$price","status":"$status","customer_id":"$customer_id"}}
                        ],
                        "as":"cart"}},
                {"$unwind":"$cart"},
                {"$lookup":{"from":"customers","let":{"customer_id":"$customer_id"},
                        "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$customer_id","$_id"]}]}}}],
                        "as":"customerDetails"}},

                {"$unwind":"$customerDetails"},
                {"$lookup":{"from":"rating","localField":"customerDetails._id","foreignField":"customer_id","as":"rating"}},
                {"$group":{"_id":"$_id","cart":{"$push":"$cart"},"status":{"$first":"$status"},"customer":{"$first":{
                        "profile_pic":"$customerDetails.profile_pic","totalrating":{"$ifNull":[{"$avg":"$rating.rating"},0]},"totalreview":{"$ifNull":[{"$size":"$rating"},0]},"location":"$vendorDetails.location.location","customer_id":"$customerDetails._id","mobile":"$customerDetails.mobile",
                        "latitude":"$latitude","longitude":"$longitude","created_at":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created"}},"address":"$address", "name":{"$concat":["$customerDetails.first_name","  ","$customerDetails.last_name"]}
                    }}}},
                {"$project":{"_id":"$_id","cart":"$cart","customer":"$customer",
                        "promo":{"promo_amount":{"$ifNull":["$promo",0]},
                            "promo_code":"mr","type":{"$ifNull":["$type",1]}},
                        "booking_id":"$_id","booking_status":"$status"}}
                ],function(err,response){

                    resolve(response);
                });
        });
       },stafDetails:function(employeeId,languagesCode,callback){
        var employee=new mongoose.Types.ObjectId(employeeId);
        db.salonEmployees.aggregate([
            {"$match":{"_id":employee}},
            {"$lookup":{"from":"rating","let":{"employee_id":"$_id"},"pipeline":[{"$match":{"$expr":{"$and":
                [{"$eq":["$employee_id","$$employee_id"]},{"$eq":["$rated_by",1]}]}}}],
                "as":"rating"}},
            {"$project":{
                "_id":"$_id",
                "expertise":{"$ifNull":["$expertise",[]]},
                "styles":{"$ifNull":["$styles",[]]},
                "about":{"$ifNull":["$about",'']},
                'salon_id':"$salon_id","employee_first_name":{"$ifNull":["$employee_first_name."+languagesCode,'']},
                "employee_last_name":{"$ifNull":["$employee_last_name."+languagesCode,'']},
                "nationality":{"$ifNull":["$nationality",'']},
                "profile_pic":"$profile_pic",
                "languages_speak":{"$ifNull":["$language",[]]},
                "working_time":{"$ifNull":["$working_time",{}]},
                "email":{"$ifNull":["$employee_email",'']},
                "end_date":{"$ifNull":["$end_date",'']},
                "start_date":{"$ifNull":["$start_date",'']},
                "dob":{"$ifNull":["$dob",'']},
                "totalrating":{"$ifNull":[{'$divide': [{'$trunc': {'$add': [{'$multiply': [{"$avg":"$rating.employee_rating"}, 10]}, 0.5]}}, 10]},0]},
                "totalreviews":{"$size":"$rating"},
                "employee_mobile":{"$ifNull":["$employee_mobile",'']},
                "mobile_country":{"$ifNull":["$mobile_country",'']},
                "serve_out":{"$ifNull":["$serve_out",1]},
                "gender":{"$ifNull":["$gender",0]},
                "contractor":{"$ifNull":["$contractor",0]},
                "employee_designation":{"$ifNull":["$employee_designation",0]}
            }}
        ],function(err,response){
              return callback(response);
        });
        },checkEmployeeAvaliablity:function(employeeId,startTime,day)
    {
       var salonTimeings={};
        var condition=[];
        var tmp={};
        tmp['working_time']={"$exists":true};
        condition.push(tmp);
        tmp={};
        tmp['working_time.'+day]={"$exists":true};
        var timeings={};
        timeings['working_time.'+day]={"$elemMatch":{"start":{"$lte":startTime},"end":{"$gte":startTime}}};

          condition.push(timeings);
        salonTimeings['$match']={"$and":condition};


        var employee=new mongoose.Types.ObjectId(employeeId);
              return new Promise(function(resolve)
              {
                 db.salonEmployees.aggregate(
                 [
                     {"$match":{"$expr":{"$and":[{"$eq":["$_id",employee]}]}}},
                  salonTimeings
                 ],function(err,response)
                 {

                    return resolve(response);
                 });
              });
    }
    };
