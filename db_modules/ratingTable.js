var db=require('../db');
var mongoose=require('mongoose');
module.exports=
    {
        "rated_by":{"1":"rated by customer","2":"rated by vendor" },
        find: function (check, callback)
        {

            db.rating.find(check, function (err, response)
            {

                callback(response);
            });
        },
        rating:function(vendorId,limit,offset,languageCode,callback)
        {
            var vendor = new mongoose.Types.ObjectId(vendorId);
            db.rating.aggregate([
                {"$match":{"vendor_id":vendor,"rated_by":1}},
                {"$sort":{"created":-1}},
                {"$sort":{"created":-1}},
               {"$skip":parseInt(offset)},
                {"$limit":parseInt(limit)},
                {"$lookup":{"from":"customers","let":{"customer_id":"$customer_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$customer_id","$_id"]}]}}}],"as":"customerDetails"}},
                {"$unwind":"$customerDetails"},
                {"$project":{"review":"$review","rating":"$rating",
                    "customer_name":{"$concat":["$customerDetails.first_name."+languageCode," ","$customerDetails.last_name."+languageCode]}
                    ,"created":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created"}}}}
            ],function(err,response){

                return callback(response);
            });
        },salonRating:function(salonId,limit,offset,languageCode,callback)
        {
            var salon = new mongoose.Types.ObjectId(salonId);
            db.rating.aggregate([
                {"$match":{"salon_id":salon,"rated_by":1}},
                {"$sort":{"created":-1}},
               {"$skip":parseInt(offset)},
                {"$limit":parseInt(limit)},
                {"$lookup":{"from":"customers","let":{"customer_id":"$customer_id"},
                    "pipeline":[{"$match":{"$expr":{"$and":[{"$eq":["$$customer_id","$_id"]}]}}}],"as":"customerDetails"}},
                {"$unwind":"$customerDetails"},
                {"$project":{"review":"$review","rating":"$rating",
                    "customer_name":{"$concat":["$customerDetails.first_name."+languageCode," ","$customerDetails.last_name."+languageCode]}
                    ,"created":{$dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$created"}}}}
            ],function(err,response){
                return callback(response);
            });
        },customerStylistReview:function(vendorId,limit,offset,callback)
        {
              var vendor = new mongoose.Types.ObjectId(vendorId);
             db.rating.aggregate([{"$sort":{"created":-1}},
                         {"$match":{"vendor_id":vendor,"rated_by":1}},
                         {"$skip":parseInt(offset)},
                         {"$limit":parseInt(limit)},
                         {"$project":{"review":"$review","rating":"$rating"}}
                             ],function(err,response){
                             return callback(response);
                          });
        },customerStylistReviewsCount:function(vendorId,callback)
        {
              var vendor = new mongoose.Types.ObjectId(vendorId);
             db.rating.aggregate([{"$sort":{"created":-1}},
                         {"$match":{"vendor_id":vendor,"rated_by":1}},

                         {"$project":{"review":"$review","rating":"$rating"}},
                 {"$count":"ratingsCount"}
                             ],function(err,response){
                             return callback(response);
                          });
        },save: function (values, callback)
        {
          var rating = new db.rating(values);
          rating.save(function (err, response) {


            callback(response);
           });

        }
    };
