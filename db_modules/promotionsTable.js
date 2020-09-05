var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    getPromotions:
        function(cityId,date,languagesCode,callback)
        {
                    var city=new mongoose.Types.ObjectId(cityId);

            db.promotions.aggregate([
                {"$match":{"city_id":city}},
                {"$lookup":{"from":"cities","pipeline":[
                    {"$match":{"_id":city}},
                    {"$lookup":{"from":"country","localField":"country_id","foreignField":"_id","as":"country"}},{"$unwind":"$country"}],"as":"cities"}},
                {"$unwind":"$cities"},
                {"$project":{"title":"$title."+languagesCode,"target_amount":1,"valid_from":{"$dateToString":{"date":"$valid_from","format":"%Y-%m-%d %H:%M"}},
                    "valid_up_to":{"$dateToString":{"date":"$valid_up_to","format":"%Y-%m-%d %H:%M"}},
                    "promotion_type":1,
                    "promotion_value":1,"promotion_image":1,
                    "currency":"$cities.country.currency_symbol","currency_code":"$cities.country.currency_code",

                    "created":{"$dateToString":{"date":"$created","format":"%Y-%m-%d %H:%M"}}}},
                {"$match":{"$expr":{"$and":[{"$gt":["$valid_up_to",date]}]}}},

                {"$sort":{"created":-1}}
        ],function(err,response){

                  return callback(response);
            });
        }
};