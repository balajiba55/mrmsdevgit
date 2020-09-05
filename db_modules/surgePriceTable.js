var db=require('../db');
var mongoose=require('mongoose');
module.exports=
    {
        checkSurge:function(city,callback)
        {
            db.cities.aggregate([{"$match":{"city_name":city}},
                {"$lookup":{"from":"surgePrice","localField":"_id","foreignField":"city_id","as":"surge"}},
                {"$unwind":"$surge"},
                {"$match":{"surge.start":{"$lte" :new Date()},"surge.expiry_at":{"$gte":new Date()}}},
                {"$project":{"surge":"$surge.surge","expire_at":"$surge.expire_at"}}
            ],function(err,response){

                return callback(response);
            });
        },checkSurgePrice:function(latitude,longitude,callback)
        {


              db.surgePrice.find({area:
                {$geoIntersects:
                    {$geometry:{ "type" : "Point",
                        "coordinates" : [ parseFloat(longitude), parseFloat(latitude) ] }
                    }
                },"status":1,"start":{"$lte" :new Date()},"expiry_at":{"$gte":new Date()}
              },{"surge":1,"expiry_at":1,"start":1,"_id":1,"surge_banner":1},function(err,response){

                   return callback(response);
             });
        },checkSurgePriceWithPromises:function(latitude,longitude){

            return new Promise(function(resolve){
                db.surgePrice.find({area:
                    {$geoIntersects:
                        {$geometry:{ "type" : "Point",
                            "coordinates" : [ parseFloat(longitude), parseFloat(latitude) ] }
                        }
                    },  "status":1,"start":{"$lte" :new Date()},"expiry_at":{"$gte":new Date()}

                },{"surge":1,"expiry_at":1,"start":1,"_id":1},function(err,response){

                    return resolve(response);
                });
            });
        },
        deleteAllSurgePrices:function(callback){
            db.surgePrice.deleteMany({},function(err,response){
                return callback(response);
            });
        },
        getSurge:function(callback)
        {
            db.surgePrice.aggregate([
                {"$match":{"status":1,"start":{"$lte" :new Date()},"expiry_at":{"$gte":new Date()}}},
                {"$project":{
                "surge":"$surge",
                "area":{"$arrayElemAt":["$area.coordinates",0]}}}],function (err,response) {
                return callback(response)
            })
        },getNearSurges:function(data,callback)
       {
             var condition= {"status":1,expiry_at:{"$gte":new Date()}};
         
             if(data['longitude']!=undefined &&data['longitude']!='' && data['latitude']!=undefined &&data['latitude']!='')
             {

                condition["area"]=
                     { $near :
                         {
                             $geometry: { type: "Point", coordinates: [ parseFloat(data['longitude']),parseFloat(data['latitude'])] },
                             $minDistance: 0,
                             $maxDistance: 4000
                         }
                     }
             }

             if(data['from_date']!=undefined && data['from_date']!='')
             {

                 condition['start']={"$gte":new Date(data['from_date'])};
             }
           if(data['to_date']!=undefined && data['to_date']!=''){

                 if(condition['start']==undefined)
                 {
                     condition['start']={"$lte":new Date(data['to_date'])};
                 }else{
                     condition['start']={"$gte":new Date(data['from_date']),"$lte":new Date(data['to_date'])};
                 }

           }
          /* if((data['from_date']!=undefined && data['from_date']!='') ||(data['to_date']!=undefined && data['to_date']!=''))
           {
               var time=[];
               if(data['from_date']!=undefined && data['from_date']!='' && data['to_date']!=undefined && data['to_date']!='')
               {

                   time.push({"start":{"$gte":new Date(data['from_date']),"$lte":new Date(data['to_date'])}});
                  // time.push({"start":{"$gte":new Date(data['to_date']),"$lte":new Date(data['from_date'])}});
               }
               if(data['to_date']!=undefined && data['to_date']!='' && data['from_date']==undefined && data['from_date']=='')
               {
                   time.push({"start":{"$lte":new Date(data["to_date"])}});
               }
               if(data['from_date']!=undefined && data['from_date']!='' && data['to_date']==undefined && data['to_date']=='')
               {
                   time.push({"start":{"$gte":new Date(data["from_date"])}});
               }
               condition['$or']=time;
           }*/
           db.surgePrice.find(condition,function(err,response){
             
                 return callback(response)
               }
        )
       }
    };