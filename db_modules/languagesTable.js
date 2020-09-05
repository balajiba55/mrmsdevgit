var db = require('../db');
module.exports =
    {
        find: function (callback) {

            db.styles.find().select('style _id').exec((function (err, response) {
                callback(response);
            }));
        },
        aggregateFind:function(languageCode,callback)
        {
               var project={};
                 project['_id']=0;
                 project['id']='$_id';
                 project['language']={"$ifNull":["$language."+languageCode,'$language.en']};
            db.language.aggregate([
                {"$match":{"status":1}},
                {"$project":project}],function(err,response){

                return callback(response);
            })
        }
    };
