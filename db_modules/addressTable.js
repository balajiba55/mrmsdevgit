var db=require('../db');
var mongoose=require('mongoose');
module.exports={
    save: function (values, callback)
    {


        var address = new db.address(values);

        address.save(function (err, response) {

            callback(response);
        });
    },  saveCurrency: function (values, callback)
    {
       // var address = new db.currency(values);

        db.currency.insertMany(values,function (err, response){

            callback(response);
        });
    },deleteCurrency:function(callback){
        db.currency.deleteMany({},function(err,response){
              return callback(response);
        });
    },
    find: function (check, callback){

        db.address.find(check, function (err, response){

             callback(response);
        });
    },
    fi:function (check,callback){
        db.address.aggregate().cursor().on("data",function(doc)
        {

        }).on("close",function(result){

        });
    },
    update:function(data,where,callback){

        db.address.findOneAndUpdate(where, {$set:data}, {new: true}, function(err, response){

            if(err){

                callback(null);
            }
            callback(response);

        });
    },
    updateAndSlice:function(data,where,callback)
    {

        db.address.update(where, { $push:{"recent_address":{$each:[data], $slice: -5}}}, {new: true}, function(err, response){

            if(err){

                callback(null);
            }
            callback(response);

        });
    },
    userAddress:function(condition,callback)
    {
        var user_id=new mongoose.Types.ObjectId(condition);
        db.address.aggregate([ { '$match': { customer_id: user_id } },
            { '$group': { _id: '$user_id',
                recent_address:
                    { '$push': { '$cond': { if: { '$eq': [ '$type', 4 ] }, then: '$recent_address', else: [] } } },
                saved_address: { '$push': { '$cond': { if: { '$eq': [ '$type', 3 ] },
                    then: { _id: '$_id', label: '$label', address: '$address',
                        landmark: '$landmark', longitude: '$longitude', latitude: '$latitude',
                        buliding: '$buliding', city:"$city","country":"$country",
                        floor: '$flat_no', details: '$details' }, else: '' } } },

                office_address: { '$push': {'$cond':{if:{'$eq':['$type',2] },
                    then: {_id:"$_id" ,
                        label: '$label', address: '$address',
                        landmark: '$landmark', longitude: '$longitude', latitude: '$latitude', buliding: '$buliding',
                        floor: '$flat_no',city:"$city", country:"$country",
                        "details": '$details' }, else: '' } } },
                home_address: { '$push': { '$cond': { if: { '$eq': [ '$type', 1 ] },
                    then: { _id:"$_id",
                        label: '$label', address: '$address',
                        landmark: '$landmark', longitude: '$longitude'
                        , latitude: '$latitude', buliding: '$buliding',
                        floor: '$flat_no',city:"$city"
                        ,country:"$country",
                        details: '$details' }, else: '' } } } } },
            { '$project': { '1': { '$filter': { input: '$home_address', as: 'home', cond: { '$ne': [ '$$home', '' ] } } },
                '2': { '$filter': { input: '$office_address', as: 'office', cond: { '$ne': [ '$$office', '' ] } } },
                '3': { '$filter': { input: '$saved_address', as: 'saved', cond: { '$ne': [ '$$saved', '' ] } } },
                '4':{"$ifNull":[ {"$cond":[{"$ne":["$recent_address",[]]},{ '$filter': { input: '$recent_address', as: 'recent',
                    cond: { '$ne': [ '$$recent', [] ] } } },[]]},[]]}, _id: 0, user_id: '$_id' } },
                {"$unwind":{"path":"$4","preserveNullAndEmptyArrays": true}},
                {"$project":{"home":{"$ifNull":["$1",[]]},"office":{"$ifNull":["$2",[]]},
                    "saved":{"$ifNull":["$3",[]]},
                    "recent":{"$ifNull":["$4",[]]}}}
               ]
            ,function(err,result){
           callback(result);
        });
    },deleteAddress:function(where,callback){
    db.address.deleteMany(where,function(err,response){

        return callback(response);
    });
}
};