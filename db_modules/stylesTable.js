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

            project['id']='$_id';
            project['name']={"$ifNull":["$style."+languageCode,'$style.en']};
            db.styles.aggregate([
                {"$match":{"status":1}},
                {"$project":project}],function(err,response){
                return callback(response);
            })
        }, findFields: function (check, fields , callback) {

        db.styles.find(check, fields ,function (err, response) {
            callback(response);
        });

    },findFieldsWithProject: function (check, fields , callback) {
            db.styles.aggregate([{"$match":check},{"$project":fields }],function (err, response) {
                callback(response);
            });

        },
    };
