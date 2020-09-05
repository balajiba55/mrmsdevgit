var express = require('express');
var router = express.Router();
var token = "bXImbXJzYXBpdG9rZW4";
var trim = require('trim');
var utility = require('../utility/utility');
var tables = require('../db_modules/baseTable');
var sockets=require('../sockets').sockets;
var moment=require('moment-timezone');
var crypto = require('crypto');


async function tokenValidations(req, res, next)
{
    var languageCode = req.body.language_code;
    languageCode=utility.languageCode(languageCode);
    req.body.language_code=languageCode;
    var startTime=utility.getTime;
    var endTime=utility.getTime;
   // console.log(req.body,req.originalUrl);

     if(req.body.token == token)
    {
        var userId=req.body.user_id;
        if(req.body.access_token!=undefined && req.body.access_token!='' && req.originalUrl!='/api/customer/logout')
        {
           /* var userAcessToken='';

            var type=req.body.type;
            type=parseInt(type);
            if(type==utility.VENDOR_TYPE_SALON_ADMIN){
                var salonId=req.body.salon_id;
                userAcessToken=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"access_token":1});
            }else{
                var vendorId=req.body.vendor_id;
                    userAcessToken=await tables.vendorTable.findFieldsWithPromises({"_id":vendorId},{"access_token":1});
                }


            if(userAcessToken!=undefined && userAcessToken.length!=0 && userAcessToken[0]['access_token']!=req.body.access_token)
            {
                //req.app.io.sockets.in(userId).emit("force_logout",{"is_login":2});
                return res.json({success: false, message: "Invalid  Access ","is_login":2});
            }*/
        }
        return next();
    }else
    {
      return  res.json({
            success: false,
            message: (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid token"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
}
router.post('/get-category', tokenValidations, function (req, res){
    var forWhom = req.body.for_whom;
    var salonId = req.body.salon_id;
    tables.categoryTable.getCategory(function (response)
    {
        return res.send({"success": true, "cateogry": response});
    });
});
router.post('/get-services', tokenValidations, function (req, res) {
    var forWhom = req.body.for_whom;
    var salonId = req.body.salon_id;
    var categoryId = req.body.category_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (forWhom == '' || forWhom == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    if (categoryId == '' || categoryId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }
    tables.servicesTable.getCategoryServicesList(categoryId, function (response)
    {
        return res.send({"success": true, "services": response});
    });
});
router.post('/save-service',tokenValidations,function(req, res) {
    // var forWhom=req.body.for_whom;
    var save = [];
    var salonId = req.body.salon_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    var services = JSON.parse(req.body.services);

    for (var i = 0; i < services.length; i++)
    {
        var tmp = {};
        var serviceId = services[i].service_id;
        var categoryId = services[i].category_id;
        var price = services[i].price;
        var forWhom = services[i].service_for;
        var duration = services[i].duration;
        tmp['category_id'] = categoryId;
        tmp['service_id'] = serviceId;
        tmp['service_for'] = parseInt(forWhom);
        tmp['service_cost'] = parseFloat(price);
        tmp['service_time'] = parseInt(duration);
        tmp['salon_id'] = salonId;
        tmp['vendor_id'] = vendorId;
        tmp['status'] = 1;
        save.push(tmp);
    }
    tables.salonServicesTable.find({"salon_id":salonId},function(response){
        if(response!=undefined && response.length!=0){
            tables.salonServicesTable.deleteMany({"salon_id":salonId},function(response)
            {
                tables.salonServicesTable.insertMany(save,async function (response){
                    tables.vendorTable.updateStatus({"status": 7},{"_id": vendorId, "status": {"$eq": 6}}, async function (response) {
                        var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
                        var countryId='';


                        if(salonResponse!=undefined  && salonResponse.length!=0)
                        {
                            countryId=salonResponse[0].country_id;
                            if(countryId==undefined)
                            {
                                return res.send({"success":false,"message":"Country  services not avalible"});
                            }
                        }else
                        {
                            return res.send({"success":false,
                                "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
                                , "errocode":2

                            });
                        }


                        tables.salonServicesTable.getSalonServicesList(salonId,countryId,languagesCode, function (salonServices) {
                            res.send({"success": true, "message": "updated", "services": salonServices[0],"status": 7})
                        });
                    });
                });

            });
        }else{
            tables.salonServicesTable.insertMany(save,function (response){
                tables.vendorTable.updateStatus({"status": 7},{"_id": vendorId, "status": {"$eq": 6}},async  function (response) {
                    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
                    var countryId='';


                    if(salonResponse!=undefined  && salonResponse.length!=0)
                    {
                        countryId=salonResponse[0].country_id;
                        if(countryId==undefined)
                        {
                            return res.send({"success":false,"message":"Country  services not avalible"});
                        }
                    }else
                    {
                        return res.send({"success":false,
                            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
                            , "errocode":2

                        });
                    }
                    tables.salonServicesTable.getSalonServicesList(salonId,countryId, languagesCode,function (salonServices) {
                        res.send({"success": true, "message": "updated", "services": salonServices[0],"status": 7})
                    });
                });
            });

        }
    });
});

router.post('/add-service',tokenValidations,function(req, res) {
    // var forWhom=req.body.for_whom;
    var save = [];
    var salonId = req.body.salon_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    var services = JSON.parse(req.body.services);

    for (var i = 0; i < services.length; i++)
    {
        var tmp = {};
        var serviceId = services[i].service_id;
        var categoryId = services[i].category_id;
        var price = services[i].price;
        var forWhom = services[i].service_for;
        var duration = services[i].duration;
        tmp['category_id'] = categoryId;
        tmp['service_id'] = serviceId;
        tmp['service_for'] = parseInt(forWhom);
        tmp['service_cost'] = parseFloat(price);
        tmp['service_time'] = parseInt(duration);
        tmp['salon_id'] = salonId;
        tmp['vendor_id'] = vendorId;
        tmp['status'] = 1;
        save.push(tmp);
    }
    tables.salonServicesTable.find({"salon_id":salonId},function(response){
        if(response!=undefined && response.length!=0)
        {
            tables.salonServicesTable.deleteMany({"salon_id":salonId},function(response)
            {
                tables.salonServicesTable.insertMany(save,async function (response){

                        var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
                        var countryId='';


                        if(salonResponse!=undefined  && salonResponse.length!=0)
                        {
                            countryId=salonResponse[0].country_id;
                            if(countryId==undefined)
                            {
                                return res.send({"success":false,"message":"Country  services not avalible"});
                            }
                        }else
                        {
                            return res.send({"success":false,
                                "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
                                , "errocode":2

                            });
                        }


                        tables.salonServicesTable.getSalonServicesList(salonId,countryId,languagesCode, function (salonServices) {
                            res.send({"success": true, "message": "updated", "services": salonServices[0],"status": 7})
                        });

                });

            });

        }else
        {
            tables.salonServicesTable.insertMany(save,function (response){
                tables.vendorTable.updateStatus({"status": 7},{"_id": vendorId, "status": {"$eq": 6}},async  function (response) {
                    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
                    var countryId='';


                    if(salonResponse!=undefined  && salonResponse.length!=0)
                    {
                        countryId=salonResponse[0].country_id;
                        if(countryId==undefined)
                        {
                            return res.send({"success":false,"message":"Country  services not avalible"});
                        }
                    }else
                    {
                        return res.send({"success":false,
                            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
                            , "errocode":2

                        });
                    }
                    tables.salonServicesTable.getSalonServicesList(salonId,countryId, languagesCode,function (salonServices) {
                        res.send({"success": true, "message": "updated", "services": salonServices[0],"status": 7})
                    });
                });
            });

        }
    });


});
router.post('/update-salon-service',tokenValidations,async function(req,res)
{
    var save = [];
    var salonId = req.body.salon_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    var updateServices=req.body.update_services;
    var deletedServices=req.body.deleted_services;

    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

   /* if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }*/

    if(req.body.services!='' && req.body.services!=undefined){
        var services = JSON.parse(req.body.services);
        for(var i=0;i<services.length;i++)
        {
            /* var salonServiceListId=*/
            var tmp = {};
            var serviceId = services[i].service_id;
            var categoryId = services[i].category_id;
            var price = services[i].price;
            var forWhom = services[i].service_for;
            var duration = services[i].duration;
            tmp['category_id'] = categoryId;
            tmp['service_id'] = serviceId;
            tmp['service_for'] = parseInt(forWhom);
            tmp['service_cost'] = parseFloat(price);
            tmp['service_time'] = parseInt(duration);
            tmp['salon_id'] = salonId;
            tmp['status'] = 1;
            save.push(tmp);
        }
    }

      if(updateServices!=undefined && updateServices!='')
      {
          updateServices = JSON.parse(updateServices);
          for (var u = 0; u < updateServices.length; u++) {

              var salonServiceId = updateServices[u].salon_service_id;
              var updatePrice = parseFloat(updateServices[u].price);
              var updateDuration = parseInt(updateServices[u].duration);
              var response = await tables.salonServicesTable.updateWithPromises({
                  "service_cost": updatePrice,
                  "service_time": updateDuration
              }, {"_id": salonServiceId});
          }
      }
    if(deletedServices!='' && deletedServices!=undefined)
    {


        try{
            deletedServices=JSON.parse(deletedServices);
        }catch(err)
        {
            deletedServices=deletedServices.split(",");
        }
    }
    if(deletedServices!=undefined && deletedServices.length!=0)
    {
        var salonServiceId='';
        var serviceId='';
        var serviceFor='';
        for(var i=0;i<deletedServices.length;i++)
        {
            salonServiceId=deletedServices[i];
            var serviceDetails=await tables.salonServicesTable.findFieldsWithPromises({"_id":salonServiceId},{"service_id":1,"service_for":1});
            if(serviceDetails!=undefined && serviceDetails.length!=0)
            {
                serviceId=serviceDetails[0].service_id;
                serviceFor=serviceDetails[0].service_for;

                var updateServices=await tables.salonEmployeesServicesTable.updateManyWithPromises({"status":0},{"service_id":serviceId,"service_for":serviceFor,"salon_id":salonId})
            }
        }
        tables.salonServicesTable.updateMany({"status":0},{"_id":{"$in":deletedServices}},function(response){
            tables.salonServicesTable.insertMany(save,function (response) {

                return   res.send({"success":true,"message":"updated","services":updateServices});
            });
        });
    }else
    {
        tables.salonServicesTable.insertMany(save,function (response){
            return   res.send({"success":true,"message":"updated","services":updateServices});
        });
        //return   res.send({"success":true,"message":"updated"});
    }

});
function doubleAfter2Seconds(x,callback){
    return new Promise(function(resolve) {
        setTimeout(function() {

            resolve(x * 2);
            callback();

        }, 2000);
    });
}
/*async function promise(req,res)
{

    for (var i = 0; i < 10; i++)
    {
        var a = await tables.salonEmployeesTable.getSalon('5b45f0218acbac3de37094fd');
    }
    res.send({"success":true,"response":a});
}
router.get('/check-promises',promise);*/
router.post('/service-list', tokenValidations,async function(req,res)
{
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
    var countryId='';


    if(salonResponse!=undefined  && salonResponse.length!=0)
    {
        countryId=salonResponse[0].country_id;
        if(countryId==undefined)
        {
            return res.send({"success":false,"message":"Country services not avalible"});
        }
    }else{
        return res.send({
            "success":false,
            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en']),
            "error_code":2
        });
    }
    tables.salonServicesTable.getSalonServicesList(salonId,countryId,languagesCode,function(response)
    {
        return  res.send({"success": true, "services": response[0]});
    });
});
router.post('/services-for-package', tokenValidations,async function(req,res){
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"_id":0});
    var countryId='';


    if(salonResponse!=undefined  && salonResponse.length!=0)
    {
        countryId=salonResponse[0].country_id;
        if(countryId==undefined)
        {
            return res.send({"success":false,"message":"Country services not avalible"});
        }
    }else
    {
        return res.send({
            "success":false,
            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en']),
            "errocode":2
        });
    }
    tables.salonServicesTable.getSalonServicesList(salonId,countryId,languagesCode,function(response){

        return  res.send({"success": true, "services": response[0]});
    });
});
router.post('/basic-info', tokenValidations,async function (req, res){
    var vendorId = req.body.vendor_id;
    var salonName = req.body.salon_name;
    var aliasName = req.body.alias_name;
    var salonMobile = req.body.salon_mobile;
    var emailAddress = req.body.email;
    var salonId=req.body.salon_id;
    var workingGender = req.body.working_gender;
    var country_code = req.body.mobile_country;

    var workingHours = req.body.working_hours;
    var update = {};
    var languageCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languageCode]
        });
    }

    if (trim(salonName) == '' || salonName == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon name is required."][languageCode]
        });
    }
    if (salonMobile == '' || salonMobile == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon mobile is required."][languageCode]
        });
    }
    if (trim(emailAddress) == '' || emailAddress == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon email is required."][languageCode]
        });
    }
    update['email'] = emailAddress;
    /* if (workingGender == '' || workingGender == undefined)
     {
         return res.send({
             "suceess": false,
             "message": "working gender is required."
         });
     }*/

    /* if (Array.isArray(workingGender))
     {
         workingGender = JSON.parse(workingGender);
         var tmp=[];
         for(var i=0;i<workingGender.length;i++)
         {
             var gender=parseInt(workingGender[i]);
             tmp.push(gender);
         }
         workingGender=tmp;
     } else
     {
         workingGender = workingGender.split(',');
         var tmp=[];
         for(var i=0;i<workingGender.length;i++)
         {
                  var gender=parseInt(workingGender[i]);
                  tmp.push(gender);
         }
         workingGender=tmp;
     }*/


    /*  var genderFlag = [];
      for (var g = 0; g < workingGender.length; g++) {

          if (!utility.isValidWorkingGender(parseInt(workingGender[g]))) {
              genderFlag.push(0);
          }
      }
      if (genderFlag.indexOf(0) != -1)
      {
          return res.send({
              "success": false,
              "message": "Please provide valid stylist gender."
          });
      }*/


    /*update['working_genders'] = workingGender;*/
    if (workingHours == '' || workingHours == undefined)
    {
        return res.send({"suceess": false, "message":utility.errorMessages["Please provide working hours"][languageCode]});
    }
    var salonWorkingHours = {};
    //working days
    workingHours = JSON.parse(workingHours);
    for (var keys in workingHours)
    {
        //checking valid days
        if (!utility.isValidWorkingDAY(parseInt(keys)))
        {
            return res.send({"success": false, "message": utility.errorMessages["Please provide valid working day"][languageCode]});
        }
        salonWorkingHours[keys] = [];

        /*    var startTime = workingHours[keys]['start'];
            var endTime = workingHours[keys]['end'];
            //start time and end time in a day

            // checking start time
            if (startTime == '')
            {
                return res.send({"success": false, "message": "Please provide valid start time "});
            }
            // checking end time
            if (endTime == '')
            {
                return res.send({"success": false, "message": "Please provide valid end time "});
            }*/
        // salonWorkingHours[keys]['start'] = startTime;
        //salonWorkingHours[keys]['end'] = endTime;

        if (workingHours[keys] != undefined){
            // return res.send({"success":false,"message":"Please provide valid break time"})
            if (workingHours[keys].length)
            {
                salonWorkingHours[keys] = [];
            }
            for (var i = 0; i < workingHours[keys].length; i++)
            {
                var obj = {};
                //checking each break start and end time in a day
                obj['start'] = workingHours[keys][i]['start'];
                obj['end'] = workingHours[keys][i]['end'];
                salonWorkingHours[keys].push(obj);
            }
        }
        //break timeings in a day
    }
    update['working_hours'] = salonWorkingHours;
    var response= await tables.vendorTable.findMobile(salonMobile,country_code);

    if((response.length!=0 && (response[0]['branches'].length!=0 && response[0]['branches'][0].salon_id!=salonId)) || (response.length!=0 && response[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["mobile number already exists"][languageCode]
        });
    }


    var emailResponse= await tables.vendorTable.findEmail(emailAddress);

    if((emailResponse.length!=0 && (emailResponse[0]['branches'].length!=0 && emailResponse[0]['branches'][0].salon_id!=salonId)) || (emailResponse.length!=0 && emailResponse[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["email already exists"][languageCode]
        });
    }

    salonName=utility.removeSpacesInBetween(salonName);

    var salonNameTranslate=await utility.translateText(salonName,languageCode);
    salonNameTranslate[languageCode]=salonName;
    var aliasNameTranslate=await utility.translateText(aliasName,languageCode);
    aliasNameTranslate[languageCode]=aliasName;
    update['salon_name'] = salonNameTranslate;
    update['alias_name'] = aliasNameTranslate;
    update['phone'] = salonMobile;
    update['mobile_country'] = country_code;
    update['booking_status'] = 1;
    update['active_status'] = 1;

    tables.vendorTable.find({"_id": vendorId}, async function (response){
        if (response != undefined){
            if (response.length){
                if (response[0].type == tables.vendorTable.type.salon){
                    var checkSalonbranch=await tables.salonTable.findFieldsWithPromises({"vendor_id":vendorId},{"_id":1});
                    var vendorUpdate={};
                    var hash=await generateHashasync();
                    var password = utility.generateRandomString(6);
                    vendorUpdate["branches"]=[{"mobile":salonMobile,"mobile_country":country_code,
                        "password":encrypt(password, hash),"hash":hash,"email":emailAddress}];
                    if (checkSalonbranch!=undefined &&checkSalonbranch.length==0 && response[0].status == 3 ){
                        update["vendor_id"] = vendorId;
                        update['manager_status']=0;
                        update['agent_status']=0;
                        tables.salonTable.save(update, async function (salonResponse){

                            var hash=await generateHashasync();
                            var password = utility.generateRandomString(6);
                            vendorUpdate["branches"][0]["salon_id"]=salonResponse._id;
                            tables.vendorTable.update({"status": 4},{
                                "_id": vendorId,
                                "status": {"$eq": 3}
                            },async function (response){
                                var vendorResponse=await tables.vendorTable.updateWithPromises(vendorUpdate,{"_id":vendorId});
                                return res.send({
                                    "success": true,
                                    "status": tables.vendorTable.status[4].status,
                                    "message": "salon Info",
                                    "type": tables.vendorTable.type.salon,
                                    "vendor_id": response.vendor_id,
                                    "salon_id": salonResponse._id

                                });
                            });
                        });
                    } else if(checkSalonbranch.length!=0){
                        vendorUpdate["branches"][0]["salon_id"]=checkSalonbranch[0]._id;
                        tables.salonTable.update(update, {"vendor_id": vendorId}, async function (salonResponse) {
                            if (salonResponse!=undefined){
                                var vendorResponse=await tables.vendorTable.updateWithPromises(vendorUpdate,{"_id":vendorId});

                                return res.send({
                                    "success": true,
                                    "status": tables.vendorTable.status[4].status,
                                    "message": "salon Info",
                                    "type": tables.vendorTable.type.salon,
                                    "vendor_id": response.vendor_id,
                                    "salon_id": salonResponse._id
                                });

                            }else{
                                return res.send({
                                    "success": false,
                                    "status": tables.vendorTable.status[3].status,
                                    "message": "Invalid request",
                                    "type": tables.vendorTable.type.salon
                                });
                            }

                        });
                    }else{
                        return res.send({"success":false,"message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]});
                    }
                }else{
                    return res.send({"success": false, "message":  utility.errorMessages["registered as stylist"][languageCode]});

                }
            } else {
                return res.send({"success": false, "message": utility.errorMessages["salon is not registered"][languageCode]});

            }
        } else {
            return res.send({"success": false, "message": utility.errorMessages["salon is not registered"][languageCode]});
        }
    });
    /* tables.salonTable.save(update,function(response){
     res.send(response);
     });*/


});
router.post('/add-basic-info', tokenValidations,async function (req, res) {
    var vendorId = req.body.vendor_id;
    var salonName = req.body.salon_name;
    var aliasName = req.body.alias_name;
    var salonMobile = req.body.salon_mobile;
    var emailAddress = req.body.email;
    var salonId=req.body.salon_id;
    var workingGender = req.body.working_gender;
    var country_code = req.body.mobile_country;

    var workingHours = req.body.working_hours;
    var update = {};
    var languageCode = req.body.language_code;
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languageCode]
        });
    }
    if(trim(salonName) == '' || salonName == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon name is required."][languageCode]
        });
    }
    if (salonMobile == '' || salonMobile == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon mobile is required."][languageCode]
        });
    }
    if (trim(emailAddress) == '' || emailAddress == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["salon email is required."][languageCode]
        });
    }
    update['email'] = emailAddress;
    /* if (workingGender == '' || workingGender == undefined)
     {
         return res.send({
             "suceess": false,
             "message": "working gender is required."
         });
     }*/

    /* if (Array.isArray(workingGender))
     {
         workingGender = JSON.parse(workingGender);
         var tmp=[];
         for(var i=0;i<workingGender.length;i++)
         {
             var gender=parseInt(workingGender[i]);
             tmp.push(gender);
         }
         workingGender=tmp;
     } else
     {
         workingGender = workingGender.split(',');
         var tmp=[];
         for(var i=0;i<workingGender.length;i++)
         {
                  var gender=parseInt(workingGender[i]);
                  tmp.push(gender);
         }
         workingGender=tmp;
     }*/


    /*  var genderFlag = [];
      for (var g = 0; g < workingGender.length; g++) {

          if (!utility.isValidWorkingGender(parseInt(workingGender[g]))) {
              genderFlag.push(0);
          }
      }
      if (genderFlag.indexOf(0) != -1)
      {
          return res.send({
              "success": false,
              "message": "Please provide valid stylist gender."
          });
      }*/


    /*update['working_genders'] = workingGender;*/
    if (workingHours == '' || workingHours == undefined)
    {
        return res.send({"suceess": false, "message":utility.errorMessages["Please provide working hours"][languageCode]});
    }
    var salonWorkingHours = {};
    //working days
    workingHours = JSON.parse(workingHours);
    for (var keys in workingHours)
    {
        //checking valid days
        if (!utility.isValidWorkingDAY(parseInt(keys)))
        {
            return res.send({"success": false, "message": utility.errorMessages["Please provide valid working day"][languageCode]});
        }
        salonWorkingHours[keys] = [];

        /*    var startTime = workingHours[keys]['start'];
            var endTime = workingHours[keys]['end'];
            //start time and end time in a day

            // checking start time
            if (startTime == '')
            {
                return res.send({"success": false, "message": "Please provide valid start time "});
            }
            // checking end time
            if (endTime == '')
            {
                return res.send({"success": false, "message": "Please provide valid end time "});
            }*/
        // salonWorkingHours[keys]['start'] = startTime;
        //salonWorkingHours[keys]['end'] = endTime;

        if (workingHours[keys] != undefined)
        {
            // return res.send({"success":false,"message":"Please provide valid break time"})
            if (workingHours[keys].length)
            {
                salonWorkingHours[keys] = [];
            }
            for (var i = 0; i < workingHours[keys].length; i++)
            {
                var obj = {};
                //checking each break start and end time in a day
                obj['start'] = workingHours[keys][i]['start'];
                obj['end'] = workingHours[keys][i]['end'];
                salonWorkingHours[keys].push(obj);
            }
        }
        //break timeings in a day
    }
    update['working_hours'] = salonWorkingHours;
    var response= await tables.vendorTable.findMobile(salonMobile,country_code);

    if((response.length!=0 && (response[0]['branches'].length!=0 && response[0]['branches'][0].salon_id!=salonId)) || (response.length!=0 && response[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["mobile number already exists"][languageCode]
        });
    }
    var emailResponse= await tables.vendorTable.findEmail(emailAddress);

       //console.log(email)
    if((emailResponse.length!=0 && (emailResponse[0]['branches'].length!=0 && emailResponse[0]['branches'][0].salon_id!=salonId)) || (emailResponse.length!=0 && emailResponse[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["email already exists"][languageCode]
        });
    }
    salonName=utility.removeSpacesInBetween(salonName);

    var salonNameTranslate=await utility.translateText(salonName,languageCode);
    salonNameTranslate[languageCode]=salonName;
    var aliasNameTranslate=await utility.translateText(aliasName,languageCode);
    aliasNameTranslate[languageCode]=aliasName;
    update['salon_name'] = salonNameTranslate;
    update['alias_name'] = aliasNameTranslate;
    update['phone'] = salonMobile;
    update['mobile_country'] = country_code;
    update['booking_status'] = 1;
    update['active_status'] = 1;
    tables.vendorTable.find({"_id": vendorId}, async function (response) {


        if (response != undefined){
            if (response.length){
                if (response[0].type == tables.vendorTable.type.salon){
                 var salonMobileResponse=await tables.salonTable.findFieldsWithPromises({"phone":salonMobile,"mobile_country":country_code},{"_id":1});
                    if(salonMobileResponse!=undefined && salonMobileResponse.length!=0)
                    {
                        salonId=salonMobileResponse[0]['_id'];
                    }

                    if (salonId == undefined  || salonId ==''){
                        update["vendor_id"] = vendorId;
                        update['manager_status']=0;
                        update['agent_status']=0;
                        tables.salonTable.save(update,async  function (salonResponse) {

                            var vendorUpdate={};
                            var hash=await generateHashasync();
                            vendorUpdate={"mobile":salonMobile,"mobile_country":country_code,"salon_id":salonResponse._id,"email":emailAddress,"password":encrypt('123456', hash),"hash":hash};
                            var vendorResponse=await tables.vendorTable.updateBranch(vendorUpdate,{"_id":vendorId});
                            return res.send({
                                "success": true,
                                "status": tables.vendorTable.status[4].status,
                                "message": "salon Info",
                                "type": tables.vendorTable.type.salon,
                                "vendor_id": vendorId,
                                "salon_id": salonResponse._id

                            });
                        });
                    }else {
                        tables.salonTable.update(update, {"_id": salonId}, function (salonResponse) {
                            if (salonResponse!=undefined) {
                                return res.send({
                                    "success": true,
                                    "status": tables.vendorTable.status[4].status,
                                    "message": "Updated successfully",
                                    "type": tables.vendorTable.type.salon,
                                    "vendor_id": response.vendor_id,
                                    "salon_id": salonResponse._id
                                });

                            }else{
                                return res.send({
                                    "success": false,
                                    "status": tables.vendorTable.status[3].status,
                                    "message": "Invalid request",
                                    "type": tables.vendorTable.type.salon
                                });
                            }

                        });
                    }
                }else{
                    return res.send({"success": false, "message": "Registered as stylist"});

                }
            }else{
                return res.send({"success": false, "message": "Salon is not registered"});
            }
        }else{
            return res.send({"success": false, "message": "Salon is not registered"});
        }
    });
    /* tables.salonTable.save(update,function(response){
     res.send(response);
     });*/


});
router.post('/salon-info', tokenValidations,async function (req, res) {

    var vendorId = req.body.vendor_id;
    var streetName = req.body.street_name;
    var bulidingName = req.body.buliding_name;
    var floor = req.body.floor;
    var zipCode = req.body.zip_code;
    var country = req.body.country;
    var city = req.body.city;
    var location = req.body.location;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;

    var update = {};
    longitude=parseFloat(longitude);
    latitude=parseFloat(latitude);
    var languagesCode = req.body.language_code;
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languagesCode]
        });
    }
    if (streetName == '' || streetName == undefined)
    {
        return res.send({"success": false, "message":  utility.errorMessages["Please provide street name"][languagesCode]});
    }
    update['street_name'] = streetName;
    if (bulidingName == '' || bulidingName == undefined)
    {
        return res.send({"success": false, "message":  utility.errorMessages["Please provide buliding name"][languagesCode]});
    }
    update['building_name'] = bulidingName;
    if (location == '' || bulidingName == undefined) {
        return res.send({"success": false, "message": utility.errorMessages["Please provide location"][languagesCode]});
    }
    update['location'] = location;
    if (floor != '' && floor != undefined)
    {
        update['floor'] = floor;
    }
    if (zipCode != '' && zipCode != undefined)
    {
        update['zip_code'] = zipCode;
    }
    if (country == '' || country == undefined)
    {
        return res.send({"success": false, "message": utility.errorMessages["Please provide country"][languagesCode]})
    }


    var checkCountry={};
    checkCountry["country."+languagesCode] = {
        '$regex': country + '.*', '$options': 'i'
    };
     var checkCountryEnglish={};
    checkCountryEnglish["country.en"] = {
        '$regex': country + '.*', '$options': 'i'
    };
    var  countryResponse=await tables.countryTable.findFieldsWithPromises({"$or":[checkCountryEnglish,checkCountry]},{"_id":1});




    if(countryResponse==undefined || countryResponse.length==0)
    {
        return res.send({"success":false,"message": utility.errorMessages["country Not available"][languagesCode]});
    }
     var cityCheck={};

    cityCheck["city_name."+languagesCode]={
        '$regex': city + '.*', '$options': 'i'
    };

       var cityCheckEnglish={};

    cityCheckEnglish["city_name.en"]={
        '$regex': city + '.*', '$options': 'i'
    };

    var cityCheckTrakish={};
    cityCheckTrakish["city_name.tr"]={
        '$regex': city + '.*', '$options': 'i'
    };
    var checkSubCity={};
    checkSubCity['sub_city_names.sub_city_name.'+languagesCode]={
        '$regex': city + '.*', '$options': 'i'
    };
    var  cityResponse=await tables.citiesTable.findFieldsWithPromises({"$or":[cityCheckEnglish,cityCheck,cityCheckTrakish,checkSubCity]},{"_id":1});

    if(cityResponse==undefined || cityResponse.length==0)
    {
        return res.send({"success":false,"message":utility.errorMessages["city Not available"][languagesCode]});
    }
    update['country_id'] = countryResponse[0]._id;
    update['city_id'] = cityResponse[0]._id;
    update['country'] = country;
    update['longitude']=longitude;
    update['latitude']=latitude;
    update['city']=city;

    var fullAddress = "";
    var locationData = {};
    locationData['type'] = "Point";
    locationData['coordinates'] = [longitude, latitude];
    fullAddress = floor+','+bulidingName+','+streetName+','+','+country;
    update['full_address'] = fullAddress;
    // var checkSalon =await tables.salonTable.findFieldsWithPromises({"vendor_id":1},{"_id":1});
    tables.salonTable.update(update, {"vendor_id": vendorId}, function (updateresponse)
    {
        if(updateresponse != null){
            if(updateresponse.length != 0){
                tables.vendorLocationTable.find({"salon_id": updateresponse._id}, function (locationResponse) {
                    if (locationResponse != undefined && locationResponse.length!=0){
                        tables.vendorLocationTable.update({"location": locationData,"address":location}, {"salon_id": updateresponse._id},
                            function (response){
                                tables.vendorTable.update({"status": 5},
                                    {
                                        "_id": vendorId,
                                        "status": {"$eq": 4}
                                    }, function(response){
                                        return res.send({
                                            "success": true,
                                            "message": "updated",
                                            "status": tables.vendorTable.status[5].status,
                                            "user_id": vendorId,
                                            "salon_id":updateresponse._id
                                        })
                                    });

                            });
                    }else{
                        tables.vendorLocationTable.save({
                            "location": locationData,
                            "type": 2,
                            "address":location,
                            "salon_id": updateresponse._id
                        },function (response) {
                            tables.vendorTable.update({"status": 5}, {
                                "_id": vendorId,
                                "status": {"$eq": 4}
                            },function (response){
                                return res.send({
                                    "success": true,
                                    "message": "updated",
                                    "status": tables.vendorTable.status[5].status,
                                    "user_id": vendorId,
                                    "salon_id": updateresponse._id
                                });

                            });
                        });
                    }
                });
            }else
            {
                return res.send({"success": false, "message": "Try again"})
            }

        } else {
            return res.send({"success": false, "message": "salon is not registered"});

        }

    });


});
router.post('/add-salon-info', tokenValidations,async function (req, res) {

    var vendorId = req.body.vendor_id;
    var streetName = req.body.street_name;
    var bulidingName = req.body.buliding_name;
    var floor = req.body.floor;
    var zipCode = req.body.zip_code;
    var country = req.body.country;
    var city = req.body.city;
    var location = req.body.location;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var salonId = req.body.salon_id;
    var address = req.body.location;
    var update = {};

    longitude=parseFloat(longitude);
    latitude=parseFloat(latitude);
    var languagesCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languagesCode]
        });
    }
    if (streetName == '' || streetName == undefined)
    {
        return res.send({"success": false, "message":  utility.errorMessages["Please provide street name"][languagesCode]});
    }
    update['street_name'] = streetName;
    if (bulidingName == '' || bulidingName == undefined)
    {
        return res.send({"success": false, "message":  utility.errorMessages["Please provide buliding name"][languagesCode]});
    }
    update['building_name'] = bulidingName;
    if (location == '' || bulidingName == undefined) {
        return res.send({"success": false, "message": utility.errorMessages["Please provide location"][languagesCode]});
    }
    update['location'] = location;
    if (floor != '' && floor != undefined)
    {
        update['floor'] = floor;
    }
    if (zipCode != '' && zipCode != undefined)
    {
        update['zip_code'] = zipCode;
    }
    if (country == '' || country == undefined)
    {
        return res.send({"success": false, "message": utility.errorMessages["Please provide country"][languagesCode]})
    }
    if (country == '' || country == undefined)
    {
        return res.send({"success": false, "message": utility.errorMessages["Please provide country"][languagesCode]})
    }
    var checkCountry={};
    checkCountry["country."+languagesCode] = {
        '$regex': country + '.*', '$options': 'i'
    };
    var checkCountryEnglish={};
    checkCountryEnglish["country.en"] = {
        '$regex': country + '.*', '$options': 'i'
    };
    var  countryResponse=await tables.countryTable.findFieldsWithPromises({"$or":[checkCountryEnglish,checkCountry]},{"_id":1});




    if(countryResponse==undefined || countryResponse.length==0)
    {
        return res.send({"success":false,"message": utility.errorMessages["country Not available"][languagesCode]});
    }
    var cityCheck={};

    cityCheck["city_name."+languagesCode]= {
        '$regex': city + '.*', '$options': 'i'
    };

    var cityCheckEnglish={};

    cityCheckEnglish["city_name.en"]= {
        '$regex': city + '.*', '$options': 'i'
    };

    var cityCheckTrakish={};
    cityCheckTrakish["city_name.tr"]= {
        '$regex': city + '.*', '$options': 'i'
    };

    var checkSubCity={};
    checkSubCity['sub_city_names.sub_city_name.'+languagesCode]={
        '$regex': city + '.*', '$options': 'i'
    }
    var  cityResponse=await tables.citiesTable.findFieldsWithPromises({"$or": [ cityCheckEnglish,cityCheck,cityCheckTrakish,checkSubCity ] },{"_id":1});

    if(cityResponse==undefined || cityResponse.length==0)
    {
        return res.send({"success":false,"message":utility.errorMessages["city Not available"][languagesCode]});
    }

    update['city_id'] = cityResponse[0]._id;
    update['country_id'] = countryResponse[0]._id;
    update['country'] = country;
    update['longitude']=longitude;
    update['latitude']=latitude;
    update['city']=city;

    var fullAddress='';
    fullAddress = floor+','+bulidingName+','+streetName+','+','+country;
    update['full_address'] = fullAddress;
    var locationData = {};
    locationData['type'] = "Point";
    locationData['coordinates'] = [longitude, latitude];
    tables.salonTable.update(update, {"_id": salonId}, function (updateresponse)
    {
        if (updateresponse != null)
        {
            if (updateresponse.length != 0)
            {
                tables.vendorLocationTable.find({"salon_id": updateresponse._id}, function (locationResponse) {
                    if (locationResponse != undefined && locationResponse.length!=0){
                        tables.vendorLocationTable.update({"location": locationData,"address":address
                            },{"salon_id": updateresponse._id},
                            function (response) {
                                return res.send({
                                    "success": true,
                                    "message": "updated",
                                    "status": tables.vendorTable.status[5].status,
                                    "user_id": vendorId,
                                    "salon_id":updateresponse._id
                                })
                            });
                    }else{
                        tables.vendorLocationTable.save({
                            "location": locationData,
                            "type": 2,
                            "salon_id": updateresponse._id
                        },function (response) {
                            return res.send({
                                "success": true,
                                "message": "updated",
                                "status": tables.vendorTable.status[5].status,
                                "user_id": vendorId,
                                "salon_id": updateresponse._id
                            });
                        });
                    }
                });
            } else {
                return res.send({"success": false, "message": "Try again"})
            }

        }else {
            return res.send({"success": false, "message": "salon is not registered"});

        }

    });


});
router.post('/salon-facility', tokenValidations,async function (req, res){
    var vendorId = req.body.vendor_id;
    var wifi = req.body.wifi;
    var wifiCost = req.body.wifi_cost;
    var parking = req.body.parking;
    var parkingCost = req.body.parking_cost;
    var kids = req.body.kids;
    var handicapped = req.body.handicapped;
    var pets = req.body.pets;
    var specialInstruction = req.body.special_instruction;
    var salonId = req.body.salon_id;
    var about = req.body.about;
    var levels = req.body.levels;
    /* var bulidingName=req.body.buliding_name;
     var floor=req.body.floor;
     var zipCode=req.body.zip_code;
     var country=req.body.country;
     var city=req.body.city;
     var location=req.body.location;
     var latitude=req.body.latitude;
     var longitude=req.body.longitude;*/
    var update = {};
    var languagesCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languagesCode]
        });
    }
    var specialInstructionTraslate=await utility.translateText(specialInstruction);
    specialInstructionTraslate[languagesCode]=specialInstruction;
    var aboutTraslate= await utility.translateText(about);
    aboutTraslate[languagesCode]=about;
    update['wifi_available'] = parseInt(wifi);
    update['wifi_cost'] = parseInt(wifiCost);
    update['parking_available'] =parseInt(parking);
    update['parking_cost'] =parseInt(parkingCost);
    update['kids_friendly'] = parseInt(kids);
    update['handicap'] = parseInt(handicapped);
    update['pets'] = parseInt(pets);
    update['special_instructions'] = specialInstructionTraslate;
    update['intro'] = aboutTraslate;
    update['levels'] = levels;

    /* if(bulidingName=='' || bulidingName==undefined)
     {
     return res.send({"success":false,"message":"Please provide buliding name"});
     }
     update['buliding_name']=bulidingName;*/
    /* if(location=='' || bulidingName==undefined)
     {
     return res.send({"success":false,"message":"Please provide location"});
     }*/
    /* update['location']=location;

     if(floor!='' && floor!=undefined)
     {
     update['floor']=floor;
     }
     if(zipCode!='' && zipCode!=undefined)
     {
     update['zip_code']=zipCode;
     }
     if(country=='' || country==undefined)
     {
     return res.send({"success":false,"message":"Please provide country"})
     }
     update['country']=country;

     var locationData={};
     locationData['type']="Point";
     locationData['coordinates']=[longitude,latitude];*/
    tables.salonTable.update(update, {"_id": salonId}, function (updateresponse) {
        if (updateresponse != null) {
            if (updateresponse.length != 0){
                /*tables.vendorLocationTable.find({"salon_id":updateresponse._id},function (locationResponse) {

                 if(locationResponse!=undefined)
                 {
                 tables.vendorLocationTable.update({"location":locationData},{"salon_id":updateresponse._id},function(response){
                 tables.vendorTable.update({"status":5},{"_id":vendorId,"status":{"$eq":4}},function(response){
                 return   res.send({"success":true,"message":"updated","status":tables.vendorTable.status[5].status,"user_id":vendorId})

                 });

                 });
                 }else
                 {
                 tables.vendorLocationTable.save({"location":locationData,"type":2,"salon_id":updateresponse._id},function(response)
                 {

                 });
                 }
                 });*/
                tables.vendorTable.update({"status": 6}, {"_id": vendorId, "status": {"$eq": 5}}, function (response){
                    return res.send({
                        "success": true,
                        "message": "updated",
                        "status": tables.vendorTable.status[6].status,
                        "user_id": vendorId
                    });
                });
            } else {
                return res.send({"success": false, "message": "Try again"})
            }
        }else 
        {
            return res.send({"success": false, "message": "salon is not registered"});
        }
    });
});
router.post('/add-salon-facility',tokenValidations,async function(req,res){
    var vendorId = req.body.vendor_id;
    var wifi = req.body.wifi;
    var wifiCost = req.body.wifi_cost;
    var parking = req.body.parking;
    var parkingCost = req.body.parking_cost;
    var kids = req.body.kids;
    var handicapped = req.body.handicapped;
    var pets = req.body.pets;
    var specialInstruction = req.body.special_instruction;
    var salonId = req.body.salon_id;
    var about = req.body.about;
    var levels = req.body.levels;

    /* var bulidingName=req.body.buliding_name;
     var floor=req.body.floor;
     var zipCode=req.body.zip_code;
     var country=req.body.country;
     var city=req.body.city;
     var location=req.body.location;
     var latitude=req.body.latitude;
     var longitude=req.body.longitude;*/
    var update = {};
    var languagesCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languagesCode]
        });
    }
    var specialInstructionTraslate= await utility.translateText(specialInstruction);
    specialInstructionTraslate[languagesCode]=specialInstruction;
    var aboutTraslate=await utility.translateText(about);
    aboutTraslate[languagesCode]=about;
    update['wifi_available'] = parseInt(wifi);
    update['wifi_cost'] = parseInt(wifiCost);
    update['parking_available'] =parseInt(parking);
    update['parking_cost'] =parseInt(parkingCost);
    update['kids_friendly'] = parseInt(kids);
    update['handicap'] = parseInt(handicapped);
    update['pets'] = parseInt(pets);
    update['special_instructions'] = specialInstructionTraslate;
    update['intro'] = aboutTraslate;
    update['levels'] = levels;
    tables.salonTable.update(update, {"_id": salonId}, function (updateresponse) {
        if (updateresponse != null)
        {
            if (updateresponse.length != 0)
            {
                /*tables.vendorLocationTable.find({"salon_id":updateresponse._id},function (locationResponse) {

                 if(locationResponse!=undefined)
                 {
                 tables.vendorLocationTable.update({"location":locationData},{"salon_id":updateresponse._id},function(response){
                 tables.vendorTable.update({"status":5},{"_id":vendorId,"status":{"$eq":4}},function(response){
                 return   res.send({"success":true,"message":"updated","status":tables.vendorTable.status[5].status,"user_id":vendorId})

                 });

                 });
                 }else
                 {
                 tables.vendorLocationTable.save({"location":locationData,"type":2,"salon_id":updateresponse._id},function(response)
                 {

                 });
                 }
                 });*/

                return res.send({
                    "success": true,
                    "message": "updated",
                    "status": tables.vendorTable.status[6].status,
                    "user_id": vendorId
                })
            } else {
                return res.send({"success": false, "message": "Try again"})
            }

        } else {
            return res.send({"success": false, "message": "salon is not registered"});

        }

    });


});
router.post('/salon-pictures', tokenValidations,function(req, res) {
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;

    var filePath = req.body.file_path;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++) {
        var obj = {};
        obj['salon_id'] = salonId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }
    tables.salonPicturesTable.find({"salon_id":salonId},function(response) {
        if(response!=undefined && response.length!=0){
            tables.salonPicturesTable.deleteMany({"salon_id":salonId},function(response){
                tables.salonPicturesTable.insertMany(save, function (response) {
                    tables.vendorTable.update({"status": 9}, {"_id": vendorId, "status": {"$eq": 8}}, function (response) {

                        res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[9].status})
                    });
                });
            });
        }else
        {
            tables.salonPicturesTable.insertMany(save, function (response) {
                tables.vendorTable.update({"status": 9}, {"_id": vendorId,"status":{"$eq": 8}},function(response){

                    res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[9].status})
                });
            });
        }
    });
});
router.post('/add-salon-pictures', tokenValidations,function(req, res){
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;
    var filePath = req.body.file_path;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++)
    {
        var obj = {};
        obj['salon_id'] = salonId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }

    tables.salonPicturesTable.find({"salon_id":salonId},function(response){
        if(response!=undefined && response.length!=0)
        {
            tables.salonPicturesTable.deleteMany({"salon_id":salonId},function(response){
                tables.salonPicturesTable.insertMany(save, function (response)
                {
                    return  res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[9].status})

                });
            });
        }else
        {
            tables.salonPicturesTable.insertMany(save, function (response) {

                return  res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[9].status})

            });

        }
    });

});
router.post('/portfolio', tokenValidations, function(req, res){
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    var salonId = req.body.salon_id;

    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "errorcode": 1,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "errorcode": 2,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });

    }
    var filePath = req.body.file_path;

    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++) {
        var obj = {};
        obj['salon_id'] = salonId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }
    tables.portfolioTable.find({"salon_id":salonId},function(response){
        if(response!=undefined && response.length!=0)
        {
            tables.portfolioTable.deleteMany({"salon_id":salonId},function(response)
            {
                tables.portfolioTable.insertMany(save, function (response)
                {
                    tables.vendorTable.update({"status": 10}, {"_id": vendorId, "status": {"$eq": 9}}, function (response) {
                        return   res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[10].status})
                    });
                });
            });
        }else
        {
            tables.portfolioTable.insertMany(save, function (response) {
                tables.vendorTable.update({"status": 10}, {"_id": vendorId, "status": {"$eq": 9}}, function (response) {
                    return   res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[10].status})
                });
            });
        }

    });

});
router.post('/add-portfolio', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    var salonId = req.body.salon_id;

    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "errorcode": 1,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "errorcode": 2,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });

    }
    var filePath = req.body.file_path;

    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++) {
        var obj = {};
        obj['salon_id'] = salonId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }
    tables.portfolioTable.find({"salon_id":salonId},function(response){
        if(response!=undefined && response.length!=0)
        {
            tables.portfolioTable.deleteMany({'salon_id':salonId},function(response){
                tables.portfolioTable.insertMany(save,function (response) {
                    return   res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[10].status})
                });
            });
        }else
        {
            tables.portfolioTable.insertMany(save,function (response) {
                return   res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[10].status})

            });
        }

    });

});
router.post('/documents', tokenValidations, function (req, res) {

    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    } if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    /*   var tradeLicensePath = req.body.trade_license_path;
       var establishmentPath = req.body.establishment_path;
       var immigrationPath = req.body.immigration_path;*/
    var documents=req.body.documents;

    var salonDocuemnts=[];
    documents=JSON.parse(documents);
    var tmp={};

    if(documents.length !=0)
    {
        //  return res.send({"success":false,"message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])});
        for(var d=0;d<documents.length;d++){
            tmp={};
            tmp['type']=0;
            tmp['document_reference_id']=documents[d].document_id;
            tmp['path']=documents[d].document_path;
          //  tmp['document_name']=documents[d].document_name;
            tmp['salon_id']=salonId;
            var exporyDate = documents[d].expiry_date;

            if(exporyDate == undefined || exporyDate == null || !exporyDate) {
                exporyDate = "";
            }
            if(!exporyDate)
            {
                tmp['expiry_date'] = exporyDate;
                tmp['is_expiry_date'] = 0;
            }else
            {
                tmp['expiry_date']=exporyDate;
                tmp['is_expiry_date']=1;
            }
            if(documents[d].document_path ==undefined || documents[d].document_path=='')
            {
                return res.send({"success":false,"message":"invalid file"});
            }
            var path=documents[d].document_path.split('.');
            var ext=path[path.length-1];
            if(utility.documentsExtensions.indexOf(ext)=== -1){
                return res.send({"success":false,"message":"invalid file ext"});
            }
            tmp['vendor_id']=vendorId;
            tmp['agent_status']=0;
            tmp['manager_status']=0;
            tmp['admin_status']=0;
            salonDocuemnts.push(tmp);
        }
    }
    tables.salonDocuments.find({"salon_id": salonId}, function (response)
    {
        if (response!=undefined && response.length != 0)
        {
            tables.salonDocuments.deleteMany({"salon_id":salonId},function(response)
            {

                tables.salonDocuments.insertMany(salonDocuemnts, function (response)
                {
                    tables.vendorTable.update({"status": 11}, {"_id": vendorId, "status": {"$eq": 10}}, function (response) {

                        res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[11].status})

                    });
                });
            });

        }else{


            tables.salonDocuments.insertMany(salonDocuemnts, function (repsonse) {

                tables.vendorTable.update({"status": 11}, {"_id": vendorId, "status": {"$eq": 10}}, function (response) {

                    res.send({
                        "success": true,
                        "message": "updated",
                        "status": tables.vendorTable.status[11].status
                    })
                });
            });
        }
    });

});
router.post('/add-documents',tokenValidations,function (req, res){
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;

    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var documents=req.body.documents;
    var salonDocuemnts=[];
    documents=JSON.parse(documents);
    var tmp={};
    if(documents.length !=0)
    {
        //  return res.send({"success":false,"message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])});
        for(var d=0;d<documents.length;d++)
        {

            tmp={};
            tmp['type']=0;
            tmp['document_reference_id']=documents[d].document_id;
            tmp['path']=documents[d].document_path;
            tmp['document_name']=documents[d].document_name;
            tmp['salon_id']=salonId;
            var exporyDate = documents[d].expiry_date;

            if(exporyDate == undefined || exporyDate == null || !exporyDate) {
                exporyDate = "";
            }
            if(!exporyDate)
            {
                tmp['expiry_date'] = exporyDate;
                tmp['is_expiry_date'] = 0;
            }else
            {
                tmp['expiry_date']=exporyDate;
                tmp['is_expiry_date']=1;
            }
            if(documents[d].document_path ==undefined || documents[d].document_path=='')
            {
                return res.send({"success":false,"message":"invalid file"});
            }
            var path=documents[d].document_path.split('.');
            var ext=path[path.length-1];
            ext=ext.toLowerCase();
            if(utility.documentsExtensions.indexOf(ext)=== -1){
                return res.send({"success":false,"message":"invalid file ext"});
            }
            tmp['vendor_id']=vendorId;
            tmp['agent_status']=0;
            tmp['manager_status']=0;
            tmp['admin_status']=0;
            salonDocuemnts.push(tmp);
        }
    }
    tables.salonDocuments.find({"salon_id": vendorId}, function (response) {
        if (response!=undefined&&response.length != 0)
        {
            tables.salonDocuments.deleteMany({"salon_id":salonId},function(response){
                tables.salonDocuments.insertMany(salonDocuemnts, function (response)
                {
                    return  res.send({"success": true, "message": "updated", "status": tables.vendorTable.status[11].status})
                });
            });

        } else
            {
            tables.salonDocuments.insertMany(salonDocuemnts, function (repsonse) {
                return    res.send({
                    "success": true,
                    "message": "updated",
                    "status": tables.vendorTable.status[11].status
                })

            });
        }
    });

});
router.post('/all-services', tokenValidations,async function (req, res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,"city_id":1,"_id":0});
    var countryId='';
    var cityId='';

    if(salonResponse!=undefined  && salonResponse.length!=0)
    {
        countryId=salonResponse[0].country_id;
        cityId=salonResponse[0].city_id;
        if(countryId==undefined)
        {
            return res.send({"success":false,"message":"Country  services not avalible"});
        }
    }else
    {
        return res.send({"success":false,
            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
            , "errocode":2
        });
    }

    tables.salonTable.getAllServices(countryId,cityId,languagesCode,function (response) {

        res.send({"success": true, "services": response[0]})
    })
});
router.post('/serve-out-services-list',tokenValidations,async function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'country_id':1,'city_id':1,"_id":0});
    var countryId='';
    var cityId='';
    if(salonResponse!=undefined  && salonResponse.length!=0)
    {
        countryId=salonResponse[0].country_id;
        cityId=salonResponse[0].city_id;
        if(countryId==undefined)
        {
            return res.send({"success":false,"message":"Country services not avalible"});
        }
    }else
    {
        return res.send({
            "success":false,
            "message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
            ,"errocode":2
        });
    }
    tables.vendorTable.getAllServices(cityId,utility.serviceTypeStylist,languagesCode,function(response)
    {
        if(response!=undefined && response.length!=0)
        {
            return res.send({"success":true,"services":response[0]});
        }else
        {
            return  res.send({"success":true,"services":{}});
        }
    });
});

router.post('/cancellation-policy', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });

    } if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var update = {};
    var cancellationPolicy = req.body.cancellationPolicy;
    var salonCancellationPolicy=[];
    var cancellationType='';
    var cancellationTimeType='';
    var cancellationTypeValue='';
    var cancellationTime='';
    var tmp={};

    if(cancellationPolicy!=undefined && cancellationPolicy.length!=0)
    {

        if(typeof  cancellationPolicy==="string")
        {
            try
            {
                cancellationPolicy=JSON.parse(cancellationPolicy);

            }catch(err)
            {
                cancellationPolicy=[];
            }
        }

        for(var c=0;c<cancellationPolicy.length;c++)
        {
            tmp={};
            cancellationType=parseInt(cancellationPolicy[c].cancellation_type);
            cancellationTypeValue=parseInt(cancellationPolicy[c].cancellation_type_value);
            cancellationTimeType=parseInt(cancellationPolicy[c].cancellation_time_type);
            cancellationTime=parseInt(cancellationPolicy[c].cancellation_time);
            tmp["cancellation_type"]=cancellationType;
            tmp["cancellation_time_type"]= cancellationTimeType;
            tmp["cancellation_type_value"]=cancellationTypeValue;
            tmp["cancellation_time"]= cancellationTime;
            salonCancellationPolicy.push(tmp);
        }
        update['cancellation_policy']={"1":{"policy":salonCancellationPolicy}};
    }


    tables.salonTable.update(update, {"_id": salonId}, function (response){
        tables.vendorTable.update({'status': 12}, {"_id": vendorId, "status": {"$eq": 11}}, function (response) {
            res.send({
                "success": true,
                "message": "updated",
                "status": tables.vendorTable.status[12].status
            });
        });
    });
});
router.post('/add-cancellation-policy', tokenValidations, function (req, res){
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var update = {};
    var cancellationPolicy = req.body.cancellationPolicy;



    var salonCancellationPolicy=[];
    var cancellationType='';
    var cancellationTimeType='';
    var cancellationTypeValue='';
    var cancellationTime='';
    var tmp={};

    if(cancellationPolicy.length!=0)
    {
        if(typeof  cancellationPolicy==="string")
        {
            try{
                cancellationPolicy=JSON.parse(cancellationPolicy);
            }catch(err){
                cancellationPolicy=[];
            }
        }
        for(var c=0;c<cancellationPolicy.length;c++)
        {
            tmp={};
            cancellationType=parseInt(cancellationPolicy[c].cancellation_type);
            cancellationTypeValue=parseInt(cancellationPolicy[c].cancellation_type_value);
            cancellationTimeType=parseInt(cancellationPolicy[c].cancellation_time_type);
            cancellationTime=parseInt(cancellationPolicy[c].cancellation_time);
            tmp["cancellation_type"]=cancellationType;
            tmp["cancellation_time_type"]= cancellationTimeType;
            tmp["cancellation_type_value"]=cancellationTypeValue;
            tmp["cancellation_time"]= cancellationTime;
            salonCancellationPolicy.push(tmp);
        }
        update['cancellation_policy']={"1":{"policy":salonCancellationPolicy}};
    }
    if(salonCancellationPolicy.length==0)
    {
        update['cancellation_policy']=[];
    }

    update['status']=13;
    tables.salonTable.update(update,{"_id": salonId},async function(response){
       /* var salonResponse =await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
            if(salonResponse.length!=0)
            {
                   var vendorId=salonResponse[0].vendor_id;
                var updateVendor=await tables.vendorTable.updateWithPromises({"status": tables.vendorTable.status[12].status},{"_id":vendorId})
            }*/
       return  res.send({
            "success": true,
            "message": "updated",
            "status": tables.vendorTable.status[12].status
        })
    });
});
router.post('/get-documents',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.salonDocuments.getDocuments(salonId,function(response){
        return res.send({"success":true,"documents":response});
    });
});
router.post('/agreement', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var condition = req.body.condition;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({"success": false, "message": "Invalid request"});
    }
    var vendorDetails=await tables.vendorTable.findFieldsWithPromises({"_id":vendorId},{"first_name":1,"last_name":1,"mobile":1,"mobile_country":1,"email":1,"tm_user_id":1});
    var genreateInviteCode=await utility.generateInviteCodeVendor(vendorDetails[0].first_name[languagesCode]);
    var update={};
    update['status']=13;
    update['invite_code']=genreateInviteCode;
    var mobile=vendorDetails[0].mobile;
    var mobileCountry=vendorDetails[0].mobile_country;

    var name=vendorDetails[0].first_name[languagesCode] +" "+vendorDetails[0].last_name[languagesCode];
    var email=vendorDetails[0].email;
    var tmUserId=vendorDetails[0].tm_user_id;
    tables.vendorTable.update({'status': 13}, {"_id": vendorId, "status": {"$eq": 12}}, function(response){
        tables.salonTable.updateMany({"status":13},{"vendor_id":vendorId},async function(response)
        {
            var accessToken=utility.generateAccessToken();
                        update['access_token']=accessToken;
            var updateResponse= await tables.vendorTable.updateWithPromises(update,{"_id":vendorId});
            tables.vendorTable.update({"access_token":accessToken},{"_id":vendorId},function(response){

            });
            if(tmUserId==undefined || tmUserId==0)
            {
                tmUserId=await utility.getTmUserId({mobile:mobileCountry+mobile,name:name,email:email});
            }
            res.send({
                "success": true,
                "message": "updated",
                "access_token":accessToken,
                "status": tables.vendorTable.status[13].status,
                "tm_user_id":tmUserId
            })
        });
    });
});

router.post('/add-agreement', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var condition = req.body.condition;
    if (vendorId == '' || vendorId == undefined){
        return res.send({"success": false, "message": "Invalid request"});
    }
    res.send({
        "success": true,
        "message": "updated",
        "status": tables.vendorTable.status[13].status
    })

});
router.post('/services', tokenValidations, function (req, res){
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    tables.servicesTable.getServicesList(languagesCode, function (response) {
        if (response != undefined){
            res.send({"success": true, "services": response});
        }
    });

});
router.post('/get-styles', tokenValidations, function (req, res){
    var languageCode=req.body.language_code;

    tables.styleTable.aggregateFind(languageCode,function (response) {
        return res.send({"success": true, "message": "styles", "preferred_styles": response});


        //  res.send([{_id:'dfgdgdfgdfg234233242',style:'indian style'},{_id:'dfgdgdfgdfg234233222',style:'mexiacan style'},{_id:'dfgdgdfgdfg23423322121',style:'american style'}])
    });
});
router.post('/salon-list', tokenValidations, function (req, res){
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            });
    }
    var type=req.body.type;
    var salonId=req.body.salon_id;
    if(type==utility.VENDOR_TYPE_SALON_ADMIN)
    {
        if (salonId == '' || salonId == undefined)
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
    }else
    {
        salonId='';
    }
    tables.salonTable.getsalons(vendorId,salonId,languagesCode,async function (response){
        var salon=[];
        for(var s=0;s<response.length;s++)
        {
            salon.push(response[s].salon_id);
        }

        var bookingsList=await tables.bookingsTable.findFieldsWithPromises({"salon_id":{"$in":salon},"status":1},{"_id":1,"type":1});
        if(bookingsList==undefined)
        {
            bookingsList=[];
        }
        var bookings=[];
        var servceOutBookings=[];
        for(var b=0;b<bookingsList.length;b++)
        {
            if(bookingsList[b].type==utility.BOOKING_STYLIST_TYPE_STYLIST)
            {
                servceOutBookings.push(bookingsList[b]._id);
            }else
            {
                bookings.push(bookingsList[b]._id);
            }
        }
        return res.send({"success": true, "salon_list": response,"bookings":bookings,"servceOutBookings":servceOutBookings});
    });
});

router.post('/booking-salon-list', tokenValidations, function (req, res){
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var type=req.body.type;
    var salonId=req.body.salon_id;
    if(type==utility.VENDOR_TYPE_SALON_ADMIN)
    {
        if (salonId == '' || salonId == undefined)
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
    }else {
        salonId='';
    }
    tables.salonTable.getSalonsListForBooking(vendorId,salonId,languagesCode,async function (response){

        return res.send({"success": true, "salon_list": response})
    });
});

router.post('/salon-timings', tokenValidations, function (req, res) {
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.salonTable.findFields({"_id": salonId}, {"working_hours": 1, "_id": 0}, function (response) {
        if (response != undefined)
        {
            if (response.length != 0){
                return res.send({"success": true, "salon_timeing": response[0].working_hours})
            }else{
                return res.send({"success": true, "salon_timeing": {}});

            }
        }else
        {
            return res.send({"success": false, "message": "Invalid user"})
        }
    });
});
router.post('/salon-details', tokenValidations, function (req, res){
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }


    tables.salonTable.getsalonInfo(salonId, languagesCode,function (response)
    {
        return res.send({"success": true, "details": response});
    });
});

router.post('/cancellation-policy-for-booking',tokenValidations,async function(req,res)
{
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (bookingId == '' || bookingId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"errocode":1 });
    }
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    var type=req.body.type;
    if(type==undefined)
    {
        type=1;
    }
    var  response=[];
    var bookingTime='';
    var now='';
    var timeDiff='';
    var diffDays='';
    var diffHrs='';
    var diffMins='';

    response=await tables.bookingsTable.getCancellationForSalonDetails(bookingId);
    if(response!=undefined && response.length!=0)
    {
        bookingTime=response[0].date+" "+response[0].time;
        now =new Date();
        var timezone=response[0].time_zone;
        bookingTime=moment(bookingTime).tz(timezone).utc().format();
        bookingTime=new Date(bookingTime);

        timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        diffDays = Math.floor(timeDiff / 86400000); // days
        diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes

        var policyForAcceptance=response[0]['policy_for_acceptance'];
        var policyForArrival=response[0]['policy_for_arrival'];
        if(policyForArrival==undefined || policyForArrival.length==0)
        {
            policyForArrival=[];
            policyForArrival['policy']=[];
        }
        var cancellationTime='';
        var cancellationTimeType='';
        var cancellationType='';
        var cancellationTypeValue='';
        var text='';
        var acceptanceTotalPolicy=[];
        var arrialTotalPolicy=[];

        var near=response[0].is_notified;
        if(near==1 || (policyForArrival['policy']==undefined || policyForArrival['policy'].length==0 && type!=2) )
        {
            if (policyForAcceptance['policy'].length != 0){
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {
                    text = '';
                    if(diffDays!=0)
                    {
                        if((diffDays>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                text += "Appointments cancelled  "+acceptancePolicy[ac].cancellation_time+" days of salon acceptance are subject to";

                            }
                        }
                    }
                    if(diffHrs!=0)
                    {
                        if((diffHrs>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                text +="Appointments cancelled  "+acceptancePolicy[ac].cancellation_time+" hours of salon acceptance are subject to";
                            }
                        }
                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0))
                    {


                        if(diffMins>=acceptancePolicy[ac].cancellation_time)
                        {


                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                text +="Appointments cancelled "+acceptancePolicy[ac].cancellation_time+" mins of salon acceptance are subject to";
                            }
                        }
                    }
                    if(text!='')
                    {
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += "You will be rated a "+acceptancePolicy[ac].cancellation_type_value+" star for the current booking which might effect your upcoming bookings";
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text +=  acceptancePolicy[ac].cancellation_type_value+"  of the service cost";
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += "levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
                        }
                        acceptanceTotalPolicy.push(text);
                    }

                }
            }
        }else
        {
            if(policyForArrival['policy']!=undefined && policyForArrival['policy'].length!=0)
            {
                var arrivalPolicy=policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for(var ar=0;ar<arrivalPolicy.length;ar++)
                {
                    text='';
                    if(diffDays!=0)
                    {

                        if(diffDays>=arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
                            {

                                text += "Appointments cancelled  "+arrivalPolicy[ar].cancellation_time+" days of stylist acceptance are subject to";

                            }
                        }


                    }
                    if(diffHrs!=0 && diffDays!=0)
                    {
                        if(diffHrs>=arrivalPolicy[ar].cancellation_time)
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
                            {
                                text +="Appointments cancelled  "+arrivalPolicy[ar].cancellation_time+" hours of stylist acceptance are subject to";

                            }
                        }


                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0))
                    {
                        if(diffMins>=arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES)
                            {
                                text +="Appointments cancelled   "+arrivalPolicy[ar].cancellation_time+" mins of stylist acceptance are subject to";

                            }
                        }



                    }
                    if(text!='') {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += "You will be rated a "+arrivalPolicy[ar].cancellation_type_value+" star for the current booking which might effect your upcoming bookings";
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text +=  arrivalPolicy[ar].cancellation_type_value+"  of the service cost";
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += "levy a charge of flat " + arrivalPolicy[ar].cancellation_type_value
                        }
                        arrialTotalPolicy.push(text);
                         break;
                    }
                }


            }
        }
        var cancel='';
        if(near==1 && acceptanceTotalPolicy.length!=0 || ((policyForArrival['policy']==undefined || policyForArrival['policy'].length==0)) && type!=2)
        {
            cancel=acceptanceTotalPolicy[0];
        }
        else if(arrialTotalPolicy.length!=0)
        {
            cancel=arrialTotalPolicy[0];
        }
        if(cancel=='' ||cancel==undefined)
        {
            cancel=(utility.errorMessages["No cancellation policy found"][languagesCode] != undefined ? utility.errorMessages["No cancellation policy found"][languagesCode] : utility.errorMessages["No cancellation policy found"]['en']);
        }

        return res.send({"success":true,"text":cancel})
    }else{
        return res.send(
            {
                "success": true,
                "text": (utility.errorMessages["No cancellation policy found"][languagesCode] != undefined ? utility.errorMessages["No cancellation policy found"][languagesCode] : utility.errorMessages["No cancellation policy found"]['en'])
            });
    }

});

router.post('/cancellation-policy-new',tokenValidations,async function(req,res){
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (bookingId == '' || bookingId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"errocode":1 });
    }
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    var type=req.body.type;
    if(type==undefined)
    {
        type=1;
    }
    var  response=[];
    var bookingTime='';
    var now='';
    var timeDiff='';
    var diffDays='';
    var diffHrs='';
    var diffMins='';

    response=await tables.bookingsTable.getCancellationForSalonDetails(bookingId);
    if(response!=undefined && response.length!=0){

        bookingTime=response[0].date+" "+response[0].time;
        now =new Date();
        var timezone=response[0].time_zone;
        bookingTime=moment(bookingTime).tz(timezone).utc().format();
        bookingTime=new Date(bookingTime);

        timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        diffDays = Math.floor(timeDiff / 86400000); // days
        diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes

        var policyForAcceptance=response[0]['policy_for_acceptance'];
        var policyForArrival=response[0]['policy_for_arrival'];
        if(policyForArrival==undefined || policyForArrival.length==0)
        {
            policyForArrival=[];
            policyForArrival['policy']=[];
        }
        var cancellationTime='';
        var cancellationTimeType='';
        var cancellationType='';
        var cancellationTypeValue='';
        var text='';
        var acceptanceTotalPolicy=[];
        var arrialTotalPolicy=[];

        var near=response[0].is_notified;
        if(near==1 || (policyForArrival['policy']==undefined || policyForArrival['policy'].length==0 && type!=2) )
        {
            if (policyForAcceptance['policy'].length != 0){
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {
                    text = '';
                    if(diffDays!=0)
                    {
                        if((diffDays>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                text += "Appointments cancelled  "+acceptancePolicy[ac].cancellation_time+" days of salon acceptance are subject to";

                            }
                        }
                    }
                    if(diffHrs!=0)
                    {
                        if((diffHrs>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                text +="Appointments cancelled  "+acceptancePolicy[ac].cancellation_time+" hours of salon acceptance are subject to";
                            }
                        }
                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0))
                    {


                        if(diffMins>=acceptancePolicy[ac].cancellation_time)
                        {


                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                text +="Appointments cancelled "+acceptancePolicy[ac].cancellation_time+" mins of salon acceptance are subject to";
                            }
                        }
                    }
                    if(text!='')
                    {
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += "You will be rated a "+acceptancePolicy[ac].cancellation_type_value+" star for the current booking which might effect your upcoming bookings";
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text +=  acceptancePolicy[ac].cancellation_type_value+"  of the service cost";
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += "levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
                        }
                        acceptanceTotalPolicy.push(text);
                         break;
                    }

                }
            }
        }else
        {
            if(policyForArrival['policy']!=undefined && policyForArrival['policy'].length!=0)
            {
                var arrivalPolicy=policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for(var ar=0;ar<arrivalPolicy.length;ar++)
                {
                    text='';
                    if(diffDays!=0)
                    {

                        if(diffDays>=arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
                            {

                                text += "Appointments cancelled  "+arrivalPolicy[ar].cancellation_time+" days of stylist acceptance are subject to";

                            }
                        }


                    }
                    if(diffHrs!=0 && diffDays!=0)
                    {
                        if(diffHrs>=arrivalPolicy[ar].cancellation_time)
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
                            {
                                text +="Appointments cancelled  "+arrivalPolicy[ar].cancellation_time+" hours of stylist acceptance are subject to";

                            }
                        }


                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0))
                    {
                        if(diffMins>=arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES)
                            {
                                text +="Appointments cancelled   "+arrivalPolicy[ar].cancellation_time+" mins of stylist acceptance are subject to";

                            }
                        }



                    }
                    if(text!='') {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += "You will be rated a "+arrivalPolicy[ar].cancellation_type_value+" star for the current booking which might effect your upcoming bookings";
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text +=  arrivalPolicy[ar].cancellation_type_value+"  of the service cost";
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += "levy a charge of flat " + arrivalPolicy[ar].cancellation_type_value
                        }
                        arrialTotalPolicy.push(text);
                         break;
                    }
                }


            }
        }
        var cancel='';
        if(near==1 && acceptanceTotalPolicy.length!=0 || ((policyForArrival['policy']==undefined || policyForArrival['policy'].length==0)) && type!=2)
        {
            cancel=acceptanceTotalPolicy[0];
        }
        else if(arrialTotalPolicy.length!=0)
        {
            cancel=arrialTotalPolicy[0];
        }
        if(cancel=='' ||cancel==undefined)
        {
            cancel=(utility.errorMessages["No cancellation policy found"][languagesCode] != undefined ? utility.errorMessages["No cancellation policy found"][languagesCode] : utility.errorMessages["No cancellation policy found"]['en']);
        }

        return res.send({"success":true,"text":cancel})
    }else{
        return res.send(
            {
                "success": true,
                "text": (utility.errorMessages["No cancellation policy found"][languagesCode] != undefined ? utility.errorMessages["No cancellation policy found"][languagesCode] : utility.errorMessages["No cancellation policy found"]['en'])
            });
    }

});
router.post('/get-cancellation-policy',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.salonTable.getCancellationPolicy(salonId,function(response){

        return res.send({"success":true,"details":response[0]});
    });
});
///*** start of the employee add employee ,add new employee,update eployee  **///

///*** start of the employee add employee while vendor signup **///
//**  ,add new employee while adding new salon     ***///
router.post('/add-employee', tokenValidations,async function(req, res)
{
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (salonId == '' || salonId == undefined){
        return res.send(
            {
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
                "errorcode": 1
            });
    }

    var vendorId = req.body.vendor_id;
    var firstName = req.body.first_name;
    var lastName = req.body.last_name;
    var email = req.body.email;
    var employeeMobile = req.body.employee_mobile;
    var expertise = req.body.expertise;
    var nationality = req.body.nationality;
    var profilePic = req.body.profile_pic;
    var employeeDesignation = req.body.employee_designation;
    var gender = req.body.gender;
    var dob = req.body.dob;
    var workingHours = req.body.timeings;
    var lanaguages_speak = req.body.lanaguages_speak;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var contractor = req.body.contractor;
    var about = req.body.about;
    var mobileCountry=req.body.mobile_country;
    var serveOut=req.body.serve_out;
    if (firstName == '' || firstName == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee name"][languagesCode] != undefined ? utility.errorMessages["please enter employee name"][languagesCode] : utility.errorMessages["please enter employee name"]['en'])
            , "errorcode": 2
        });
    }
    if (lastName == '' || lastName == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee name"][languagesCode] != undefined ? utility.errorMessages["please enter employee name"][languagesCode] : utility.errorMessages["please enter employee name"]['en'])
            , "errorcode": 3
        });
    }
    if (employeeMobile == '' || employeeMobile == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee mobile"][languagesCode] != undefined ? utility.errorMessages["please enter employee mobile"][languagesCode] : utility.errorMessages["please enter employee mobile"]['en'])
            , "errorcode": 4
        })
    }

    if (nationality == '' || nationality == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee nationality"][languagesCode] != undefined ? utility.errorMessages["please enter employee nationality"][languagesCode] : utility.errorMessages["please enter employee nationality"]['en'])
            , "errorcode": 5
        })
    }
    if (expertise == '' || expertise == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select employee expertise"][languagesCode] != undefined ? utility.errorMessages["please enter employee expertise"][languagesCode] : utility.errorMessages["please enter employee expertise"]['en'])
            , "errorcode": 6
        })
    }
    if (profilePic == '' || profilePic == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select employee profile picture"][languagesCode] != undefined ? utility.errorMessages["please select employee profile picture"][languagesCode] : utility.errorMessages["please select employee profile picture"]['en'])
            , "errorcode": 7
        })
    }
    nationality=nationality.toLowerCase();
    if (lanaguages_speak == '' || lanaguages_speak == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select languages"][languagesCode] != undefined ? utility.errorMessages["please select languages"][languagesCode] : utility.errorMessages["please select languages"]['en'])
            ,"errorcode": 8
        })
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select languages"][languagesCode] != undefined ? utility.errorMessages["please select languages"][languagesCode] : utility.errorMessages["please select languages"]['en'])
            , "errorcode": 9
        })
    }
    if (startDate == '' || startDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select start date"][languagesCode] != undefined ? utility.errorMessages["please select start date"][languagesCode] : utility.errorMessages["please select state date"]['en'])
            , "errorcode": 10
        })
    }
    workingHours=JSON.parse(workingHours);
    if(parseInt(contractor) == 1)
    {
        if (endDate == '' || endDate == undefined)
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["please select end date"][languagesCode] != undefined ? utility.errorMessages["please select end date"][languagesCode] : utility.errorMessages["please select end date"]['en'])
                , "errorcode": 11
            })
        }
    }
    var totalServices = [];
    var services=req.body.services;
    services=JSON.parse(services);
    expertise = expertise.split(',');
    var expertiseService = [];
    for (var i = 0; i < expertise.length; i++)
    {
        expertiseService.push(trim(expertise[i]));
    }
    gender=parseInt(gender);
    lanaguages_speak = lanaguages_speak.split(',');
    serveOut=parseInt(serveOut);

    if(serveOut==2)
    {
        var response= await tables.vendorTable.findMobile(employeeMobile,mobileCountry);

        if(response.length!=0)
        {
            return res.send({"success":false,
                "message": utility.errorMessages["mobile number already exists"][languagesCode]
            });
        }
        var emailResponse= await tables.vendorTable.findEmail(email);

        if((emailResponse.length!=0 && (emailResponse[0]['branches'].length!=0 && emailResponse[0]['branches'][0].salon_id!=salonId)) || (emailResponse.length!=0 && emailResponse[0]['branches'].length==0))
        {
            return res.send({"success":false,
                "message": utility.errorMessages["email already exists"][languagesCode]
            });
        }
        var serveOutServices=req.body.serve_out_services;
        var documents=req.body.documents;
        var certificates=req.body.certificates;
        var resume=req.body.resume;
        var portfolio=req.body.portfolio;
    }
    var firstNameTraslate=await utility.translateText(firstName);
    firstNameTraslate[languagesCode]=firstName;
    var lastNameTraslate=await utility.translateText(lastName);
    lastNameTraslate[languagesCode]=lastName;
    firstName=firstNameTraslate;
    lastName=lastNameTraslate;


    var name={};
    for(var l in firstNameTraslate)
    {
        name[l]=firstNameTraslate[l]+" "+lastNameTraslate[l];
    }
    var salonWorkingHours={};
    var breakTimeings= [];
    for (var keys in workingHours)
    {
        //checking valid days
        if (!utility.isValidWorkingDAY(parseInt(keys)))
        {

            return res.send({"success": false, "message": "Please provide valid working day"});
        }
        salonWorkingHours[keys] = {};


        /*salonWorkingHours[keys] = startTime;
        salonWorkingHours[keys] = endTime;
*/
        if (workingHours[keys] != undefined)
        {
            // return res.send({"success":false,"message":"Please provide valid break time"})
            if (workingHours[keys].length)
            {
                salonWorkingHours[keys] = [];
            }
            for (var i = 0; i < workingHours[keys].length; i++)
            {
                var obj = {};
                //checking each break start and end time in a day

                obj['start'] = workingHours[keys][i]['start'];


                obj['end'] = workingHours[keys][i]['end'];
                var startTime = obj['end'] ;
                var endTime = obj['start'];
                //start time and end time in a day

                // checking start time
                if (startTime == '')
                {
                    return res.send({"success": false, "message": "Please provide valid start time "});
                }
                // checking end time
                if (endTime == '')
                {
                    return res.send({"success": false, "message": "Please provide valid end time "});
                }
                breakTimeings=[];
                for(let b=0;b<workingHours[keys][i]['break'];b++)
                {
                    var startBreakTimeings=workingHours[keys][i]['break'][b]['start'];
                    var endBreakTimeings=workingHours[keys][i]['break'][b]['end'];
                    breakTimeings.push({"start":startBreakTimeings,"end":endBreakTimeings});
                }
                salonWorkingHours[keys].push(obj);
            }
        }
        //break timeings in a day
    }
    tables.salonTable.find({"_id": salonId}, function (salonResponse){

        if(salonResponse!=undefined && salonResponse.length!=0){



            tables.salonEmployeesTable.find({"employee_mobile": employeeMobile,"mobile_country":mobileCountry, "status": 1}, function (response){
                if (response != undefined && response.length){
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["mobile number already exists"][languagesCode] != undefined ? utility.errorMessages["mobile number already exists"][languagesCode] : utility.errorMessages["mobile number already exists"]['en'])
                    })
                }else {
                    var salonCountry=salonResponse[0].country_id;
                    var salonCity=salonResponse[0].city_id;

                    tables.salonEmployeesTable.save({
                        "employee_email": email,
                        "salon_id": salonId,
                        "gender":gender,
                        "language": lanaguages_speak,
                        "employee_name": name,
                        "employee_first_name": firstNameTraslate,
                        "employee_last_name": lastNameTraslate,
                        "employee_mobile": employeeMobile,
                        "mobile_country": mobileCountry,
                        "nationality": nationality,
                        "expertise": expertiseService,
                        "profile_pic": profilePic,
                        "working_time":salonWorkingHours,
                        "start_date":startDate,
                        "end_date":endDate,
                        "about":about,
                        "dob":dob,
                        "employee_designation":employeeDesignation,
                        "status": 1,
                        "booking_status":1,
                        "active_status":1,
                        "serve_out":serveOut
                    },async function (response){

                        for(var s=0;s<services.length;s++)
                        {
                            var tmp={};
                            tmp['service_for']=services[s].service_for;
                            tmp['service_id']=services[s].service_id;
                            tmp['category_id']=services[s].category_id;
                            tmp['employee_id']=response._id;
                            tmp['salon_id']=salonId;
                            tmp['status']=1;
                            totalServices.push(tmp);
                        }
                        var employeeId=response._id;

                        tables.salonEmployeesServicesTable.insertMany(totalServices,function(response)
                        {
                            tables.salonTable.find({"_id": salonId}, async function (salonResponse)
                            {
                                if(serveOut==2)
                                {
                                    var check=await manageServeOutEmployee({"mobile":employeeMobile,
                                        "mobile_country":mobileCountry,
                                        "first_name":firstNameTraslate,
                                        "last_name":lastNameTraslate,
                                        "name":name,
                                        'profile_pic':profilePic,
                                        'gender':gender,
                                        'salon_id':salonId,
                                        "language": lanaguages_speak,
                                        "nationality": nationality,
                                        "expertise": expertiseService,
                                        "dob":dob,
                                        "email":email,
                                        'city':salonCity,
                                        "country":salonCountry,
                                        'intro':about,
                                        'documents':documents,
                                        'resume':resume,
                                        'certificates':certificates,
                                        'employee_id':employeeId,
                                        'password':utility.generateRandomString(6),
                                        'serve_out':2,
                                        "language_code":languagesCode,
                                        "portfolio":portfolio,
                                        'services':serveOutServices
                                    });
                                    if(!check['success']){
                                        return  res.send(check);
                                    }
                                }
                                tables.vendorTable.updateStatus({'status': 8}, {
                                    "_id": {"$eq": salonResponse[0].vendor_id},
                                    "status": {"$eq": 7}
                                },function (response){
                                    if (response != undefined){
                                        return res.send({
                                            "success": true,
                                            "message": (utility.errorMessages["employee added successfully"][languagesCode] != undefined ? utility.errorMessages["employee added successfully"][languagesCode] : utility.errorMessages["employee added successfully"]['en'])
                                        })

                                    } else {
                                        return res.send({
                                            "success": false,
                                            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                        })

                                    }
                                });
                            });
                        });



                    });
                }
            });
        }else{
            return res.send({"success":false,"message":"salon is not registered"})
        }
    });

});
function generateHash(next)
{
    var hashLength = 16;
    var characters = '1234567890123456';
    var hash = '';
    for (var i = 0; i < characters.length; i++)
    {
        hash = hash + characters.charAt(Math.random() * (hashLength - 0) + 0);
    }
    // var field='hash';
    tables.vendorTable.findFieldsWithPromises({"hash": hash},function(response)
    {
        if (response != undefined){
            if (response.length == 0){
                return next(hash);
            } else{
                generateHash();
            }
        } else{
            generateHash();
        }
    });

}
function generateHashasync()
{
    return new Promise(async function(resolve){
        var hashLength = 16;
        var characters = '1234567890123456';
        var hash = '';
        for (var i = 0; i < characters.length; i++) {
            hash = hash + characters.charAt(Math.random() * (hashLength - 0) + 0);

        }
        // var field='hash';
        var response=await  tables.vendorTable.findFieldsWithPromises({"hash": hash},{"_id":1});
        if (response != undefined){
            if (response.length == 0){
                return resolve(hash);
            } else{
                generateHash();
            }
        } else{
            generateHash();
        }
    });
}
function encrypt(string, hash)
{
    var iv = '1234567890123456';
    var cipher = crypto.createCipheriv('aes-128-cbc', hash, iv);

    var encrypted = cipher.update(string, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    var hexVal = new Buffer.from(encrypted, 'binary');
    var newEncrypted = hexVal.toString('hex');
    return newEncrypted;
}
function decrypt(password, hash)
{
    var iv = '1234567890123456';

    var decipher = crypto.createDecipheriv('aes-128-cbc', hash, iv);

    var decrypted = decipher.update(password, 'hex', 'binary');
    decrypted += decipher.final('binary');
    return decrypted;

    /*   var mykey = crypto.createDecipher('aes-128-cbc', hash);
     var mystr = mykey.update(password, 'hex', 'utf8');
     mystr += mykey.final('utf8');
     return mystr;*/
}
async function  updateServeOutEmployee(details)
{
    var vendorId=details['vendor_id'];
    return new Promise(async function(resolve){

        if(details['serve_out']==1)
        {
            return resolve({"success":true});
        }else
        {
             var languagesCode=details['language_code'];
            var update={};
            var stylistSave={};




            update['first_name.'+languagesCode]=details['first_name'];

            update['mobile']=details['mobile'];
            update['mobile_country']=details['mobile_country'];
            update['last_name.'+languagesCode]=details['last_name'];
            update['gender'] = parseInt(details['gender']);
            update['dob']=details['dob'];

            if(details['profile_pic']!='' && details['profile_pic']!=undefined)
            {
                update['profile_pic']=details['profile_pic'];
            }
            update['country']=details['country'];
            update['subscribe_for']=[1,2,3];
            update['opt_for']=[1,2,3];
            update['type']=3;
            update['salon_id']=details['salon_id'];
            update['employee_id']=details['employee_id'];
            update['email']=details['email'];
            update['status']=9;
            update['name.'+languagesCode]=details['first_name']+' '+details['last_name'];
            stylistSave['gender'] = parseInt(details['gender']);
            stylistSave['nationality']=details['nationality'];
            stylistSave['languages_speak']=details['language'];
            stylistSave['country']=details['country'];
            stylistSave['employee_id']=details['employee_id'];
            stylistSave['city_id']=details['city'];
            stylistSave['active_status']=1;
            stylistSave['type']=3;
            stylistSave['salon_id']=details['salon_id'];
            stylistSave['intro.'+languagesCode]=details['intro'];
            stylistSave['styles']=[];
            stylistSave['expertise']=details['expertise'];
            var vendorUpdate=await  tables.vendorTable.updateWithPromises(update,{"_id":vendorId});
            setTimeout(function(){
                utility.curl.curl('application/index/generateTheStylistImage?image='+details['profile_pic']+'&vendor_id='+details['vendor_id']+'&gender='+details['gender'],function(response){

                });

            },1000);
            var stylistUpdate=await  tables.stylistTable.updateWithPromises(stylistSave,{"vendor_id":vendorId});
            var serviceUpdate= await manageServeOutServices(details);
            if(serviceUpdate['success'])
            {
                var updateDocument=await manageDocuments(details);


                if(updateDocument['success'])
                {
                    var updatePortfolioResponse=await updatePortfolio(details);
                    return resolve(updatePortfolioResponse)
                }else
                {
                    return resolve(updateDocument);
                }
            }else{
                return resolve(serviceUpdate);
            }


        }

    });
}

function manageDocuments(details)
{
    return new Promise(async function(resolve){
        var documents=details['documents'];
        var updateDocuments=details['update_documents'];
        var vendorId=details['vendor_id'];
        var languagesCode = details['language_code'];
        var deleteDocuments=details['deleted_documents'];

        if (languagesCode == undefined)
        {
            languagesCode = 'en';
        }
        var tmp={};
        var stylistDocuemnts=[];
        var isDocumentUploaded=false;

        if(documents!='' && documents!=undefined)
        {
            documents=JSON.parse(documents);
            for(var d=0;d<documents.length;d++)
            {
                if(documents[d].path!=undefined)
                {
                    tmp={};
                    tmp['type']=0;
                    if(documents[d].path ==undefined || documents[d].path=='')
                    {
                        return resolve({"success":false,"message":"invalid file"});
                    }
                    var path=documents[d].path.split('.');

                    var ext=path[path.length-1];
                    ext=ext.toLowerCase();
                    if(utility.documentsExtensions.indexOf(ext)=== -1)
                    {
                        return resolve({"success":false,"message":"invalid file"});
                    }
                    tmp['path']=documents[d].path;

                    tmp['vendor_id']=vendorId;
                    if(documents[d].expiry_date!=undefined)
                    {
                        tmp['is_expiry_date']=1;

                        tmp['expiry_date']=documents[d].expiry_date;
                    }else{
                        tmp['is_expiry_date']=0;

                    }
                    tmp['document_reference_id']=documents[d].document_id;

                    tmp['agent_status']=0;
                    tmp['manager_status']=0;
                    tmp['admin_status']=0;
                    tmp['status']=1;

                    isDocumentUploaded=true;
                    stylistDocuemnts.push(tmp);
                }

            }
        }


        var certificates=details['certificates'];



        if(certificates!=undefined && certificates!='')
        {
            certificates=JSON.parse(certificates);
            if(certificates.length!=0){
                var certificatesNamesTranslate={};
                for(var c=0;c<certificates.length;c++)
                {
                    tmp={};
                    tmp['type']=2;
                    var documents_path=certificates[c].path;
                    var path=documents_path.split('.');
                    var ext=path[path.length-1];
                    ext=ext.toLowerCase();
                    if(utility.documentsExtensions.indexOf(ext)!= -1) {
                        var documentName=certificates[c].document_name;
                        certificatesNamesTranslate = await utility.translateText(documentName, languagesCode);
                        certificatesNamesTranslate[languagesCode] = documentName;
                        tmp['document_name'] = certificatesNamesTranslate;
                        tmp['path']=documents_path;
                        tmp['agent_status']=0;
                        tmp['manager_status']=0;
                        tmp['vendor_id']=vendorId;
                        tmp['admin_status']=0;
                        tmp['is_expiry_date']=0;
                        tmp['status']=1;

                        stylistDocuemnts.push(tmp);
                    }else{
                        return resolve({"success":false,"message":'invalid certificate document'});
                    }
                }
            }
        }
        var  checkDocument=[];
        if(updateDocuments!=undefined && updateDocuments.length!=0)
        {

            updateDocuments=JSON.parse(updateDocuments);
            if(updateDocuments.length!=0)
            {
                var documentsPath='';
                var update={};
                var docuemntId='';
                var type='';

                for(var u=0;u<updateDocuments.length;u++)
                {
                    type=updateDocuments[u].type;
                    documentsPath=updateDocuments[u].path;
                    docuemntId=updateDocuments[u].document_id;

                    type=parseInt(type);
                      checkDocument=[];
                    if(docuemntId==undefined || docuemntId=='')  //  checking  new upload documents
                    {
                        if(documentsPath!=''){
                            var path=updateDocuments[u].path;
                            path=path.split('.');
                            var ext=path[path.length-1];
                            ext=ext.toLowerCase();
                            if(utility.documentsExtensions.indexOf(ext)=== -1)
                            {
                                return resolve({"success":false,"message":"invalid file"});
                            }
                            var  tmp={};

                            tmp['type']=type;
                              if(type==2)
                              {
                                  tmp['document_name.'+languagesCode]=updateDocuments[u].document_name;
                              }
                            tmp['path']=documentsPath;
                            tmp['vendor_id']=vendorId;

                            if(type==0)
                            {
                                var documentReferenceId=updateDocuments[u].document_reference_id;
                                if(documentReferenceId=='' || documentReferenceId==undefined) {
                                    return resolve({
                                        "success": false,
                                        "message": utility.errorMessages['document reference id missing'][languagesCode]
                                        , "error_code": 4
                                    });
                                }
                                 checkDocument=await tables.stylistDocumentsTable.findFieldsWithPromises({"document_reference_id":documentReferenceId},{"_id":1});
                                if(updateDocuments[u].expiry_date!=undefined)
                                {
                                    tmp['is_expiry_date']=1;
                                    tmp['expiry_date']=updateDocuments[u].expiry_date;
                                }else
                                {
                                    tmp['is_expiry_date']=0;
                                }
                                tmp['agent_status'] = 0;
                                tmp['manager_status'] = 0;
                                tmp['document_reference_id']=documentReferenceId;
                                tmp['status']=1;

                                if(checkDocument.length!=0)
                                {
                                    docuemntId=checkDocument[0]._id;
                                     update=tmp;
                                    await tables.stylistDocumentsTable.updateWithPromises(update,{"_id":docuemntId});
                                }
                            }
                            if(checkDocument.length==0 )
                            {
                                stylistDocuemnts.push(tmp);
                            }
                        }
                    }else{
                        update={};
                        update['path'] = documentsPath;
                        if(updateDocuments[u].expiry_date!=undefined)
                        {
                            tmp['is_expiry_date']=1;

                            update['expiry_date']=updateDocuments[u].expiry_date;
                        }else{
                            tmp['is_expiry_date']=0;
                        }

                        if(documentsPath!=undefined)
                        {
                            if(documentsPath==undefined || documentsPath=='')
                            {
                                return resolve({"success":false,"message":"invalid file"});
                            }
                            var path=updateDocuments[u].path;
                            path=path.split('.');
                            var ext=path[path.length-1];
                            ext=ext.toLowerCase();
                            if(utility.documentsExtensions.indexOf(ext)=== -1)
                            {
                                return resolve({"success":false,"message":"invalid file"});
                            }
                            update['agent_status'] = 0;
                            update['manager_status'] = 0;
                            var documentStatus=await tables.stylistDocumentsTable.updateWithPromises(update,{"_id":docuemntId});
                            if(documentStatus==null || documentStatus==undefined && documentStatus.length==0)
                            {
                                return resolve({
                                    "success": false,
                                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                    ,"error_code":1
                                });
                            }
                            isDocumentUploaded=true;
                        }
                    }


                }
            }
        }

        if(deleteDocuments!=undefined)
        {
            try{
                deleteDocuments=  JSON.parse(deleteDocuments);
            }catch (e){
                deleteDocuments=  deleteDocuments.split(",");
            }
            deleteDocuments=cleanArray(deleteDocuments);
        }
        var resume=details['resume'];
        if(resume!=undefined &&resume!='')
        {


            if(resume==undefined || resume=='')
            {
                return resolve({"success":false,"message":"please upload resume"});
            }
            var path=resume.split('.');
            var ext=path[path.length-1];
            ext=ext.toLowerCase();
            if(utility.documentsExtensions.indexOf(ext)=== -1)
            {
                return resolve({"success":false,"message":'invalid resume document'});
            }
            tmp={};
            var resumeTrasalate = await utility.translateText('resume', 'en');
            resumeTrasalate['en']='resume';
            tmp['document_name']=resumeTrasalate;
            tmp['path']=resume;
            tmp['type']=1;
            tmp['vendor_id']=vendorId;
            tmp['status']=1;

            checkDocument=await tables.stylistDocumentsTable.findFieldsWithPromises({"type":0},{"_id":1});
            if(checkDocument.length==0)
            {
                stylistDocuemnts.push(tmp);
            }
        }
        if(deleteDocuments!=undefined && deleteDocuments.length!=0){
            var deleteDocumentsStatus=await tables.stylistDocumentsTable.deleteWithPromises({"_id":{"$in":deleteDocuments}});
        }

        if(stylistDocuemnts.length!=0)
        {

            tables.stylistDocumentsTable.insertMany(stylistDocuemnts,async function(response){
                if(response!=undefined)
                {
                    /*if(isDocumentUploaded)
                    {
                        var update=await  tables.stylistTable.updateWithPromises({"agent_status":0,"manager_status":0},{"vendor_id":vendorId});
                    }*/
                    return resolve({"success":true,"message":"updated"});
                }else{
                    return resolve({"success":false,"message":"something went wrong try again"});
                }
            });
        }else
        {
            /*if(isDocumentUploaded){
                tables.stylistTable.update({"agent_status":0,"manager_status":0},{"vendor_id":vendorId},function(response){

                });
            }*/
            return resolve({"success":true,"message":"updated"});
        }
    });
}
function manageServeOutEmployee(details)
{
    var employeeId=details['employee_id'];
    return new Promise(async function(resolve){
        var checkEmployee=await tables.vendorTable.findFieldsWithPromises({"employee_id":employeeId},{"_id":1});

        if(checkEmployee!=undefined && checkEmployee.length!=0)
        {
            details['vendor_id']=checkEmployee[0]._id;
            var updateStatus='';
            if(details['servce_out']==1)
            {
                updateStatus=await tables.vendorTable.updateWithPromises({"booking_status":2},{"_id":details['vendor_id']});
                return resolve({"success":true,"message":"updated"});
            }else
            {
                updateStatus=await tables.vendorTable.updateWithPromises({"booking_status":1},{"_id":details['vendor_id']});
                var update=await updateServeOutEmployee(details);
                return resolve(update);
            }
        }else
            {
            var add=await addServeOutEmpolyee(details);
            return resolve(add);
        }
    });
}
async function manageServeOutServices(details)
{
    return new Promise(async function(resolve)
    {
        var save = [];
        var vendorId = details['vendor_id'];
        var deletedServices=details['deleted_services'];

        if(deletedServices!=undefined && deletedServices!='')
        {
            try
            {
                deletedServices=JSON.parse(deletedServices);
            }catch (e)
            {
                deletedServices=deletedServices.split(',');
            }
            // deletedServices=JSON.parse(deletedServices);
        }else
        {
            deletedServices=[];
        }
        var services = details['services'];
        if(services!=undefined && services!='')
        {
            services=JSON.parse(services);
            for(var i=0;i<services.length;i++)
            {
                /* var salonServiceListId=*/

                var tmp = {};
                var serviceId = services[i].service_id;
                var categoryId = services[i].category_id;
                var forWhom = parseInt(services[i].for_whom);
                tmp['category_id'] = categoryId;
                tmp['service_id'] = serviceId;
                tmp['service_for'] = forWhom;
                tmp['salon_id']=details['salon_id'];
                tmp['employee_id']=details['employee_id'];
                tmp['vendor_id']=vendorId;
                tmp['service_levels']=[1];
                tmp['status']=1;
                var checkStylistServices=await tables.stylistServicesTable.findFieldsWithPromises({"service_id":serviceId,"service_for":forWhom,"vendor_id":vendorId},{"status":1,"_id":1});

                if(checkStylistServices!=undefined && checkStylistServices.length!=0)
                {
                    var status=checkStylistServices[0].status;
                    var stylistServiceId=checkStylistServices[0].id;
                    if(status!=undefined &&  status==1)
                    {
                        //  return res.send({"success":false,"message":"service already exits"});
                    }else if(status==0)
                    {
                        var deleteServices=await tables.stylistServicesTable.deleteWithPromises({"_id":stylistServiceId})
                    }
                }
                save.push(tmp);
            }
        }


        if(deletedServices.length!=0)
        {

            var updateService=await  tables.stylistServicesTable.updateManyWithPromises({"status":0},{"_id":{"$in":deletedServices}});

        }


        if(save.length!=0)
        {
            tables.stylistServicesTable.insertMany(save,function (response) {

                /* if(response!=undefined)
                 {
                     return   res.send({"success":true,"message":"updated"});

                 }else
                 {
                     return   res.send({"success":false,"message":"try again"});

                 }*/
                return resolve({"success":true});
            });
        }else
        {
            //  return   res.send({"success":true,"message":"updated"});
            return resolve({"success":true});
        }
    });
}

function addServeOutEmpolyee(details)
{
    return new Promise(async function(resolve)
    {
        var update={};
        var stylistSave={};
        var firstName=details['first_name'];
        var lastName=details['last_name'];
        var name=details['name'];
        var languageCode=details["language_code"];

                 if(typeof  details['first_name'] === "object")
                 {

                     update['first_name']=firstName;
                     update['last_name']=lastName;
                     update['name']=name;

                 }else
                 {
                     update['first_name']={};
                     update['last_name']={};
                     update['name']={};
                     update['first_name'][languageCode]=firstName;
                     update['last_name'][languageCode]=lastName;
                     update['name'][languageCode]=name;
                 }



        update['mobile']=details['mobile'];
        update['mobile_country']=details['mobile_country'];
        update['country']=details['country'];

        update['gender'] = parseInt(details['gender']);
        update['dob']=details['dob'];
        update['profile_pic']=details['profile_pic'];
        update['country']=details['country'];
        update['subscribe_for']=[1,2,3];
        update['opt_for']=[1,2,3];
        update['type']=3;
        update['salon_id']=details['salon_id'];
        update['employee_id']=details['employee_id'];
        update['email']=details['email'];
        update['status']=9;
        stylistSave['gender']=parseInt(details['gender']);
        stylistSave['nationality']=details['nationality'];
        stylistSave['languages_speak']=details['language'];
        stylistSave['country']=details['country'];
        stylistSave['employee_id']=details['employee_id'];
        stylistSave['country']=details['country'];
        stylistSave['city_id']=details['city'];
        stylistSave['active_status']=1;
        stylistSave['type']=3;
        stylistSave['salon_id']=details['salon_id'];
        var intro=details['intro'];
        var introTranslate=await utility.translateText(intro,languageCode);
        introTranslate[languageCode]=intro;
        stylistSave['intro']=introTranslate;
        stylistSave['styles']=[];
        stylistSave['expertise']=details['expertise'];
        stylistSave['levels']=[1];
        var hash=await generateHashasync();
        update["password"] = encrypt(details['password'], hash);
        update['hash'] = hash;
        stylistSave['manager_status']=1;
        stylistSave['agent_status']=1;
        stylistSave['admin_status']=1;

        //save['levels']=stylistLevels;
        stylistSave['available_status']=1;
        stylistSave['lock']=0;



        tables.vendorTable.save(update,async function(response){
            setTimeout(function(){
                var    message='your password for login into mr&ms is '+details['password'];
                let encodeMessage=encodeURIComponent(message);

                utility.curl.sendingSms(details['mobile_conutry']+details['mobile'],encodeMessage,function(response){

                });
                utility.curl.curl('application/index/generateTheStylistImage?image='+details['profile_pic']+'&vendor_id='+details['vendor_id']+'&gender='+details['gender'],function(response)
                {
                });
            },1000);


            var services=details['services'];
            var totalServices=[];
            var vendorId=response._id;

            try{
                services=JSON.parse(services);
            }catch (err)
            {
                services=services;
            }

            for(var s=0;s<services.length;s++)
            {
                var tmp={};
                if(services[s].service_id!=undefined && services[s].service_id!=''){
                    tmp['service_for']=services[s].for_whom;
                    tmp['service_id']=services[s].service_id;
                    tmp['category_id']=services[s].category_id;
                    tmp['service_levels']=[1];
                    tmp['salon_id']=details['salon_id'];
                    tmp['employee_id']=details['employee_id'];
                    tmp['vendor_id']=response._id;
                    tmp['status']=1;
                }
                totalServices.push(tmp);
            }
            var documentsAdding=await  addDocuments({"vendor_id":response._id,
                'documents':details['documents'],
                'resume':details['resume'],
                'certificates':details['certificates'],
                'certificatesNames':details['certificatesNames']
            });



            if(documentsAdding['success']){
                var portfolioAdding=await addPortfolio({'file_path':details['portfolio'],'vendor_id':vendorId});

                if(portfolioAdding['success'])
                {

                    stylistSave['vendor_id']=response._id;
                    tables.stylistTable.save(stylistSave,function(response){
                        tables.stylistServicesTable.save(totalServices,function(response){
                            return resolve({"success":true});
                        });
                    });
                }else
                {
                    return resolve(portfolioAdding);
                }

            }else
            {
                return resolve(documentsAdding);
            }

        });
    });
}
function addPortfolio(details)
{
    return new Promise(function(resolve)
    {
        var filePath=details['file_path'];
        var vendorId=details['vendor_id'];
        filePath=filePath.split(',');
        var save=[];
        var obj={};
        for(var i=0;i<filePath.length;i++)
        {
            obj={};
            obj['vendor_id']=vendorId;
            obj['file_path']=filePath[i];
            save.push(obj);
        }
        tables.portfolioTable.insertMany(save,function(response)
        {
            return resolve({"success":true});
        });
    });
}
function updatePortfolio(details){
    return new Promise(function(resolve){
        var vendorId=details['vendor_id'];
        /* tables.salonPicturesTable.find({'salon_id':salonId},function(response){
         res.send({"success":true,"pictures":response});
         });*/
        var filePath=details['portfolio'];
        var languagesCode = details['language_code'];

        if (languagesCode == undefined)
        {
            languagesCode = 'en';
        }
        if(filePath!=undefined && filePath!='')
        {
            filePath = filePath.split(',');
            var save = [];
            for (var i = 0; i < filePath.length; i++)
            {
                if(filePath[i]!='')
                {
                    var obj = {};
                    obj['vendor_id'] = vendorId;
                    obj['file_path'] = filePath[i];
                    save.push(obj);
                }
            }
            tables.portfolioTable.insertMany(save,function(response){

            });
        }
        var deletedPictures=details['delete_id'];
        if(deletedPictures!=undefined && deletedPictures!='')
        {
            deletedPictures=deletedPictures.split(',');
            tables.portfolioTable.deleteMany({"_id":{"$in":deletedPictures}},function(response)
            {
            });
        }
        return resolve({"success":true,"message":"updated"});
    })
}
//** update employee details **//
router.post('/update-employee',tokenValidations,async function(req,res)
{
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    var firstName = req.body.first_name;
    var lastName = req.body.last_name;
    var email = req.body.email;
    var employeeMobile = req.body.employee_mobile;
    var mobileCountry = req.body.mobile_country;
    var expertise = req.body.expertise;
    var nationality = req.body.nationality;
    var profilePic = req.body.profile_pic;
    var employeeDesignation = req.body.employee_designation;
    var gender = req.body.gender;
    var dob = req.body.dob;
    var timeings = req.body.timeings;
    var lanaguages_speak = req.body.lanaguages_speak;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var contractor = req.body.contractor;
    var about = req.body.about;
    var employeeId = req.body.employee_id;
    var deletedservice=req.body.deleted_services;
    var serveOutServices=req.body.serve_out_services;
    var deletedServeOutServices=req.body.deleted_serve_out_servies;
    var documents=req.body.documents;
    var updateDocuments=req.body.update_documents;
    var deleteDocuments=req.body.deleted_documents;
    var certificates=req.body.certificates;
    var deletedIds=req.body.delete_portfolio_id;
    var portfolio=req.body.portfolio;
    var serveOut=req.body.serve_out;
    if (firstName == '' || firstName == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please enter employee name"][languagesCode]
            , "errorcode": 2
        });
    }
    if (lastName == '' || lastName == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please enter employee name"][languagesCode]
            , "errorcode": 3
        });
    }

    if (employeeMobile == '' || employeeMobile == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please enter employee mobile"][languagesCode]
            , "errorcode": 4
        })
    }
    if (nationality == '' || nationality == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please enter employee nationality"][languagesCode]
            , "errorcode": 5
        });
    }

    if (expertise == '' || expertise == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select employee expertise"][languagesCode]
            , "errorcode": 6
        })
    }

    if (profilePic == '' || profilePic == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select employee profile picture"][languagesCode]
            , "errorcode": 7
        })
    }
    if (lanaguages_speak == '' || lanaguages_speak == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select languages"][languagesCode]
            ,"errorcode": 8
        })
    }
    if (startDate == '' || startDate == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select start date"][languagesCode]
            ,"errorcode": 8
        })
    }
    if(parseInt(contractor) == 1)
    {

        if (endDate == '' || endDate == undefined) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["please select end date"][languagesCode]
                ,"errorcode": 8
            })
        }
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languagesCode]
        });
    }
    if (timeings == '' ||timeings == undefined)
    {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select languages"][languagesCode]
            , "errorcode": 9
        })
    }
    var update={};
    var totalServices = [];
    var services=req.body.services;
    services=JSON.parse(services);

    if(deletedservice!='' && deletedservice!=undefined)
    {
        deletedservice=JSON.parse(deletedservice);
    }

    nationality=nationality.toLowerCase();
    timeings=JSON.parse(timeings);
    expertise = expertise.split(',');
    var expertiseService = [];
    for (var i = 0; i < expertise.length; i++)
    {
        expertiseService.push(trim(expertise[i]));
    }
    var resume=req.body.resume;
    if(serveOut==2)
    {
        var checkMobile=await tables.vendorTable.findFieldsWithPromises({"mobile":employeeMobile,"mobile_country":mobileCountry},{"_id":1,"mobile":1,"employee_id":1});
        if(checkMobile.length!=0 &&checkMobile[0].employee_id!=employeeId)
        {
            return res.send({"success":false,
                "message": utility.errorMessages["mobile number already exists"][languagesCode]
            });
        }
    }

    lanaguages_speak = lanaguages_speak.split(',');
    tables.salonTable.find({"_id": salonId}, function (salonResponse)
    {

        if(salonResponse!=undefined && salonResponse.length!=0)
        {
            /*  timing= {
             "1" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "2" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "3" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "4" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ]
             };*/
            var salonCountry=salonResponse[0].country_id;
            var salonCity=salonResponse[0].city_id;
            tables.salonEmployeesTable.find({"employee_mobile": employeeMobile,"mobile_country":mobileCountry, "status": 1,"_id":{"$ne":employeeId}}, function (response)
            {
                if (response != undefined && response.length){
                    return res.send({
                        "success": false,
                        "message": utility.errorMessages["mobile number already exists"][languagesCode]
                    })
                }else{
                    update={
                        employee_email: email,
                        "salon_id": salonId,
                        gender: parseInt(gender),
                        "language": lanaguages_speak,
                        "employee_mobile": employeeMobile,
                        "mobile_country": mobileCountry,
                        "nationality": nationality,
                        "expertise": expertiseService,
                        "working_time":timeings,
                        "start_date":startDate,
                        "end_date":endDate,
                        "contractor":contractor,
                        "about":about,
                        "dob":dob,
                        'serve_out':serveOut,
                        "employee_designation":employeeDesignation,
                        "status": 1
                    };
                    update['employee_first_name.'+languagesCode]=firstName;
                    update['employee_last_name.'+languagesCode]=lastName;
                    if(profilePic!='' && profilePic!=undefined)
                    {
                        update["profile_pic"]= profilePic;
                    }
                    tables.salonEmployeesTable.update(update,{"_id":employeeId},async function (response)
                    {
                        for(var s=0;s<services.length;s++)
                        {
                            var tmp={};
                            tmp['service_for']=services[s].service_for;
                            tmp['service_id']=services[s].service_id;
                            tmp['category_id']=services[s].category_id;
                            tmp['employee_id']=employeeId;
                            tmp['salon_id']=salonId;
                            tmp['status']=1;
                            totalServices.push(tmp);
                        }
                        if(response!=undefined && response.length!=0)
                        {
                            var servceOut=response.serve_out;
                            servceOut=parseInt(servceOut);
                            var update=await manageServeOutEmployee({"mobile":employeeMobile,
                                "mobile_country":mobileCountry,
                                "first_name":firstName,
                                "last_name":lastName,
                                'profile_pic':profilePic,
                                'gender':gender,
                                'salon_id':salonId,
                                "language": lanaguages_speak,
                                "nationality": nationality,
                                "expertise": expertiseService,
                                "dob":dob,
                                "email":email,
                                'city':salonCity,
                                'intro':about,
                                "country":salonCountry,
                                'password':'123456',
                                'employee_id':employeeId,
                                'services':serveOutServices,
                                'serve_out':servceOut,
                                'delete_id':deletedIds,
                                'documents':documents,
                                'portfolio':portfolio,
                                "resume":resume,
                                'certificates':certificates,
                                'deleted_documents':deleteDocuments,
                                'update_documents':updateDocuments,
                                "language_code":languagesCode,
                                "deleted_services":deletedServeOutServices
                            });
                            if(!update['success'])
                            {
                                return res.send(update);
                            }
                        }
                        tables.salonEmployeesServicesTable.deleteMany({"_id":{"$in":deletedservice}},function(response){
                            tables.salonEmployeesServicesTable.insertMany(totalServices,function(response){
                                tables.salonTable.find({"_id": salonId}, function (salonResponse)
                                {

                                    return res.send({
                                        "success": true,
                                        "message": utility.errorMessages["employee updated successfully"][languagesCode]
                                    });
                                    /*tables.vendorTable.updateStatus({'status': 8}, {
                                     "_id": {"$eq": salonResponse[0].vendor_id},
                                     "status": {"$eq": 7}
                                     },function (response){
                                     if (response != undefined){


                                     } else {
                                     return res.send({
                                     "success": false,
                                     "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                     })

                                     }
                                     });*/
                                });
                            });
                        });




                    });
                }
            });
        }else{
            return res.send({"success":false,"message":"salon is not registered"})
        }
    });
});
///*** end of the employee add employee ,add new employee,update eloyee  **///
router.post('/salon-employee-service',tokenValidations,function(req,res){

    var employeeId=req.body.employee_id;
    var languagesCode = req.body.language_code;


    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errocode":1
        });
    }
    tables.salonEmployeesServicesTable.find({"employee_id":employeeId,"status":1},function(response){
           console.log(response);
        return res.send({"success":true,"services":response});
    })
});
router.post('/salon-staff', tokenValidations, function (req, res){
    var salonId = req.body.salon_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;

    if(languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if(salonId==undefined)
    {
        salonId='';
    }
    if(salonId!='')
    {
        tables.salonEmployeesTable.getSalonStaffInfo(salonId, languagesCode,function (response) {
            if (response != undefined){

                return   res.send({"success":true, "details": response});

            }else{
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    }else
    {
        tables.salonEmployeesTable.getAllSalonStaffInfo(vendorId, languagesCode,function (response) {
            if (response != undefined)
            {
                return   res.send({"success": true, "details": response});
            }else
            {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    }
});
router.post('/booking-salon-staff-list', tokenValidations, function (req, res){
    var salonId = req.body.salon_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;

    if(languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if(salonId==undefined)
    {
        salonId='';
    }
    if(salonId!='')
    {
        tables.salonEmployeesTable.getSalonStaffList(salonId, languagesCode,function (response) {
            if (response != undefined){
                return   res.send({"success":true, "details": response});

            }else{
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    }else
    {
        tables.salonEmployeesTable.getAllSalonStaffInfo(vendorId, languagesCode,function (response) {
            if (response != undefined)
            {
                return   res.send({"success": true, "details": response});
            }else{
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    }

});

router.post('/add-new-employees',tokenValidations,async function(req, res){
    var salonId = req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    var vendorId = req.body.vendor_id;
    var firstName = req.body.first_name;
    var lastName = req.body.last_name;
    var email = req.body.email;
    var employeeMobile = req.body.employee_mobile;
    var mobileCountry = req.body.mobile_country;
    var expertise = req.body.expertise;
    var nationality = req.body.nationality;
    var profilePic = req.body.profile_pic;
    var employeeDesignation = req.body.employee_designation;
    var gender = req.body.gender;
    var dob = req.body.dob;
    var workingHours = req.body.timeings;
    var lanaguages_speak = req.body.lanaguages_speak;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var contractor = req.body.contractor;
    var about = req.body.about;
    var serveOut=req.body.serve_out;

    if (firstName == '' || firstName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee name"][languagesCode] != undefined ? utility.errorMessages["please enter employee name"][languagesCode] : utility.errorMessages["please enter employee name"]['en'])
            , "errorcode": 2
        });
    }
    if (lastName == '' || lastName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee name"][languagesCode] != undefined ? utility.errorMessages["please enter employee name"][languagesCode] : utility.errorMessages["please enter employee name"]['en'])
            , "errorcode": 3
        });
    }

    if (employeeMobile == '' || employeeMobile == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee mobile"][languagesCode] != undefined ? utility.errorMessages["please enter employee mobile"][languagesCode] : utility.errorMessages["please enter employee mobile"]['en'])
            , "errorcode": 4
        })
    }
    if (nationality == '' || nationality == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please enter employee nationality"][languagesCode] != undefined ? utility.errorMessages["please enter employee nationality"][languagesCode] : utility.errorMessages["please enter employee nationality"]['en'])
            , "errorcode": 5
        })
    }

    if (expertise == '' || expertise == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select employee expertise"][languagesCode] != undefined ? utility.errorMessages["please enter employee expertise"][languagesCode] : utility.errorMessages["please enter employee expertise"]['en'])
            , "errorcode": 6
        })
    }

    if (profilePic == '' || profilePic == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select employee profile picture"][languagesCode] != undefined ? utility.errorMessages["please select employee profile picture"][languagesCode] : utility.errorMessages["please select employee profile picture"]['en'])
            ,"errorcode": 7
        })
    }
    if (lanaguages_speak == '' || lanaguages_speak == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select languages"][languagesCode] != undefined ? utility.errorMessages["please select languages"][languagesCode] : utility.errorMessages["please select languages"]['en'])
            ,"errorcode": 8
        })
    }
    if (startDate == '' || startDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["please select start date"][languagesCode] != undefined ? utility.errorMessages["please select start date"][languagesCode] : utility.errorMessages["please select start date"]['en'])
            ,"errorcode": 8
        })
    }
    if(parseInt(contractor) == 1)
    {
        if (endDate == '' || endDate == undefined){
            return res.send({
                "success": false,
                "message": (utility.errorMessages["please select end date"][languagesCode] != undefined ? utility.errorMessages["please select end date"][languagesCode] : utility.errorMessages["please select end date"]['en'])
                ,"errorcode": 8
            })
        }
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if(workingHours=='' || workingHours ==undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    var totalServices = [];
    var services=req.body.services;
    services=JSON.parse(services);
          console.log(req.body,workingHours,"working outrss");
    workingHours=JSON.parse(workingHours);
    expertise = expertise.split(',');
    var expertiseService = [];
    for (var i = 0; i < expertise.length; i++) {
        expertiseService.push(trim(expertise[i]));
    }
    lanaguages_speak = lanaguages_speak.split(',');
    serveOut=parseInt(serveOut);

    if(serveOut==2)
    {

        var response= await tables.vendorTable.findMobile(employeeMobile,mobileCountry);

        if(response.length!=0)
        {
            return res.send({"success":false,
                "message": utility.errorMessages["mobile number already exists"][languagesCode]
            });
        }
        var emailResponse= await tables.vendorTable.findEmail(email);

        if(emailResponse.length!=0)
        {
            return res.send({"success":false,
                "message": utility.errorMessages["email already exists"][languagesCode]
            });
        }

        var serveOutServices=req.body.serve_out_services;

        var documents=req.body.documents;
        var certificates=req.body.certificates;
        var resume=req.body.resume;
        var portfolio=req.body.portfolio;
    }
    var firstNameTraslate=utility.translateText(firstName);
    firstNameTraslate[languagesCode]=firstName;
    var lastNameTraslate=utility.translateText(lastName);
    lastNameTraslate[languagesCode]=lastName;
    firstName=firstNameTraslate;
    lastName=lastNameTraslate;


    var name={};
    for(var l in firstNameTraslate)
    {
        name[l]=firstNameTraslate[l]+" "+lastNameTraslate[l];
    }
    var salonWorkingHours = {};
    //working days

    var breakTimeings= [];

    for (var keys in workingHours)
    {
        //checking valid days
        if (!utility.isValidWorkingDAY(parseInt(keys)))
        {
                console.log(keys);
            return res.send({"success": false, "message": "Please provide valid working day"});
        }
        salonWorkingHours[keys] = {};


        /*salonWorkingHours[keys] = startTime;
        salonWorkingHours[keys] = endTime;
*/
        if (workingHours[keys] != undefined)
        {
            // return res.send({"success":false,"message":"Please provide valid break time"})
            if (workingHours[keys].length)
            {
                salonWorkingHours[keys] = [];
            }
            for (var i = 0; i < workingHours[keys].length; i++)
            {
                var obj = {};
                //checking each break start and end time in a day

                obj['start'] = workingHours[keys][i]['start'];


                obj['end'] = workingHours[keys][i]['end'];
                var startTime = obj['end'] ;
                var endTime = obj['start'];
                //start time and end time in a day

                // checking start time
                if (startTime == '')
                {
                    return res.send({"success": false, "message": "Please provide valid start time "});
                }
                // checking end time
                if (endTime == '')
                {
                    return res.send({"success": false, "message": "Please provide valid end time "});
                }
                                  console.log("end time++++++++++++++++++++++++++++++++++++++++", workingHours[keys][i]['end']);
                breakTimeings=[];
               for(let b=0;b<workingHours[keys][i]['break'];b++)
               {
                      var startBreakTimeings=workingHours[keys][i]['break'][b]['start'];
                      var endBreakTimeings=workingHours[keys][i]['break'][b]['end'];
                   breakTimeings.push({"start":startBreakTimeings,"end":endBreakTimeings});
               }
                salonWorkingHours[keys].push(obj);
            }
        }
        //break timeings in a day
    }

    tables.salonTable.find({"_id": salonId}, function (salonResponse)
    {

        if(salonResponse!=undefined && salonResponse.length!=0)
        {
            // timing=salonResponse[0].working_hours;

            /*  timing= {
             "1" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "2" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "3" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ],
             "4" : [
             {
             "start" : "12:00:00",
             "end" : "16:00:00"
             },
             {
             "start" : "17:00:00",
             "end" : "20:00:00"
             }
             ]
             };*/
            var salonCountry=salonResponse[0].country_id;
            var salonCity=salonResponse[0].city_id;
            tables.salonEmployeesTable.find({"employee_mobile": employeeMobile, "status": 1},function (response){
                if (response != undefined && response.length) {
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["mobile number already exists"][languagesCode] != undefined ? utility.errorMessages["mobile number already exists"][languagesCode] : utility.errorMessages["mobile number already exists"]['en'])
                    })
                }else {

                    tables.salonEmployeesTable.save({
                        employee_email: email,
                        "salon_id": salonId,
                        gender: parseInt(gender),
                        "language": lanaguages_speak,
                        "employee_name": name,
                        "employee_first_name": firstNameTraslate,
                        "employee_last_name": lastNameTraslate,
                        "employee_mobile": employeeMobile,
                        "mobile_country": mobileCountry,
                        "nationality": nationality,
                        "expertise": expertiseService,
                        "profile_pic": profilePic,
                        "working_time":salonWorkingHours,
                        "start_date":startDate,
                        "end_date":endDate,
                        "contractor":contractor,
                        "about":about,
                        "dob":dob,
                        "employee_designation":employeeDesignation,
                        "status": 1,
                        "booking_status":1,
                        "active_status":1,
                        "serve_out":serveOut
                    },async function (response){
                        for(var s=0;s<services.length;s++){
                            var tmp={};
                            tmp['service_for']=services[s].service_for;
                            tmp['service_id']=services[s].service_id;
                            tmp['category_id']=services[s].category_id;
                            tmp['employee_id']=response._id;
                            tmp['salon_id']=salonId;
                            tmp['status']=1;
                            totalServices.push(tmp);
                        }
                        var employeeId=response._id;
                        if(serveOut==2)
                        {
                            var password=utility.generateRandomString(6);
                            var check=await manageServeOutEmployee({"mobile":employeeMobile,
                                "mobile_country":mobileCountry,
                                "first_name":firstNameTraslate,
                                "last_name":lastNameTraslate,
                                'name':name,
                                'profile_pic':profilePic,
                                'gender':gender,
                                'salon_id':salonId,
                                "language": lanaguages_speak,
                                "nationality": nationality,
                                "expertise": expertiseService,
                                "dob":dob,
                                "email":email,
                                'city':salonCity,
                                "country":salonCountry,
                                'intro':about,
                                'documents':documents,
                                'resume':resume,
                                'certificates':certificates,
                                'employee_id':employeeId,
                                'password':password,
                                'serve_out':2,
                                "portfolio":portfolio,
                                "language_code":languagesCode,
                                'services':serveOutServices
                            });
                            if(!check['success']){
                                return  res.send(check);
                            }
                        }
                        tables.salonEmployeesServicesTable.insertMany(totalServices,function(response){
                            tables.salonTable.find({"_id": salonId}, function (salonResponse){
                                return res.send({
                                    "success": true,
                                    "message": (utility.errorMessages["employee add successfully"][languagesCode] != undefined ? utility.errorMessages["employee add successfully"][languagesCode] : utility.errorMessages["employee add successfully"]['en'])
                                });
                                /*tables.vendorTable.updateStatus({'status': 8}, {
                                 "_id": {"$eq": salonResponse[0].vendor_id},
                                 "status": {"$eq": 7}
                                 },function (response){
                                 if (response != undefined){


                                 } else {
                                 return res.send({
                                 "success": false,
                                 "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                 })

                                 }
                                 });*/
                            });
                        });



                    });
                }
            });
        }else
        {
            return res.send({"success":false,"message":"salon is not registered"})
        }
    });

});
//**  end  add new employee while adding new salon     ***///

//** start update employee details **//
//** end employee details **//
///*** end of the employee add employee ,add new employee,update emloyee  **///
/*router.post('/salon-employee-service',tokenValidations,function(req,res){
    var employeeId=req.body.employee_id;
    tables.salonEmployeesServicesTable.find({"employee_id":employeeId},function(response){
        return res.send({"success":true,"services":response});
    });
});*/
router.post('/bookings-list-month',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var date=req.body.date;
    var languagesCode = req.body.language_code;
    var salonId=req.body.salon_id;

    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }
   vendorId="";


    if (salonId == '' || salonId == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if (date == '' || date == undefined)
    {
        return res.send({

            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    var employeeId='';

    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }


    tables.vendorTable.getSalonBookings(salonId,employeeId,date,languagesCode,function(response){
        if(response!=undefined&&response.length!=0)
        {
            return res.send({"success":true,"bookings":response});
        }else
        {
            return res.send({"success":true,"message":"no bookings","bookings":[]});
        }
    });
});
router.post('/salon-staff-info',tokenValidations,function(req,res)
{
    var salonId=req.body.salon_id;
    var employeeId=req.body.employee_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });


    }
    tables.salonEmployeesTable.stafDetails(employeeId,languagesCode,function(response){
        return res.send({"success":true,"employee":response});

    });
});
router.post('/serve-out-services',tokenValidations,function(req,res){
    var employeeId=req.body.employee_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });

    }
    tables.stylistServicesTable.findFields({"employee_id":employeeId,"status":{"$ne":0}},{"_id":1,"service_id":1,"category_id":1,"service_for":1,"service_levels":1},function(response){
        if(response!=undefined && response.length!=0)
        {
            return res.send({"success":true,"services":response});
        }else{
            return res.send({"success":true,"services":[]});
        }
    });
});
router.post('/bookings-list-week',tokenValidations,function(req,res)
{
    var vendorId=req.body.vendor_id;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var languagesCode = req.body.language_code;
  var   salonId=req.body.salon_id;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
   vendorId='';
    if (salonId == '' || salonId == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if (startDate == '' || startDate == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }

    if (endDate == '' || endDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":3
        });
    }
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    var employeeId='';

    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }
    tables.vendorTable.getSalonWeekBooking(salonId,employeeId,startDate,endDate,languagesCode,function(response){
        if(response!=undefined && response.length!=0)
        {
            var timeSlots=[
                "00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00",
                "08:00","09:00","10:00","11:00","12:00",
                "13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00",
                "22:00","23:00"
            ];
            var bookingResponse=response;
            var dateBookingResponse={};

            for(var d=0;d<bookingResponse.length;d++)
            {
                var date=bookingResponse[d].date;
                var startTime=bookingResponse[d].start_time;
                var endTime=bookingResponse[d].end_time;
                var bookingId=bookingResponse[d].booking_id;
                var customerName=bookingResponse[d].customer_name;

                var booking={};
                var bookingType=bookingResponse[d].type;

                var status=bookingResponse[d].status;

                booking['type']=bookingType;
                booking['booking_id']=bookingId;
                booking['customer_name']=customerName;
                booking['start_time']=startTime;
                booking['end_time']=endTime;
                booking['status']=status;
                for(var t=0;t<timeSlots.length;t++)
                {
                    var m = t +1;
                    var nextTime=timeSlots[m];
                    var presentTime = timeSlots[t];

                    if(startTime >= presentTime  && startTime < nextTime)
                    {

                        t=timeSlots.length;
                    }

                }
                if(dateBookingResponse[date]!=undefined){
                    if(dateBookingResponse[date][presentTime]!=undefined)
                    {

                        dateBookingResponse[date][presentTime].push(booking);
                    }else
                    {
                        dateBookingResponse[date][presentTime]=[];
                        dateBookingResponse[date][presentTime].push(booking);
                    }
                }else
                {
                    dateBookingResponse[date]={};
                    dateBookingResponse[date][presentTime]=[];
                    dateBookingResponse[date][presentTime].push(booking);
                }

            }
            return res.send({"success":true,"bookings":dateBookingResponse});
        }
        else{
            return res.send({"success":true,"message":"no bookings","bookings":[]});
        }
    });


});
router.post('/bookings-list-day',tokenValidations,function(req,res)
{
    var vendorId=req.body.vendor_id;
    var date=req.body.date;
    var languagesCode = req.body.language_code;
    var employeeType=req.body.employee_type;
    var salonType=req.body.salon_type;
    var salonId=req.body.salon_id;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    if (date == '' || date == undefined)
    {
        return res.send({

            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }


    var employeeId='';
    if(employeeType==1)
    {
        employeeId = req.body.employee_id;
    }

    tables.vendorTable.getSalonDayBooking(salonId,employeeId,date,languagesCode,function(response)
    {
        if(response!=undefined&&response.length!=0)
        {
            var timeSlots=[
                "00:00", "01:00","02:00","03:00","04:00","05:00","06:00","07:00",
                "08:00","09:00","10:00","11:00","12:00",
                "13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00",
                "22:00","23:00"
            ];
            var dayResponse=[];
            for(var r=0;r<response.length;r++)
            {
                var bookingResponse=response[r].bookingDetails.bookings;
                var employeeDetails=response[r].bookingDetails.employeeDetails;
                var dateBookingResponse={};
                var  tmp={};
                tmp['employee_name']=employeeDetails['employee_first_name'][languagesCode]+" "+employeeDetails['employee_last_name'][languagesCode];
                tmp['employee_id']=employeeDetails['_id'];
                tmp['profile_pic']=employeeDetails['profile_pic'];
                for(var d=0;d<bookingResponse.length;d++)
                {
                    var startTime=bookingResponse[d].start_time;
                    var endTime=bookingResponse[d].end_time;
                    var bookingId=bookingResponse[d].booking_id;
                    var customerName=bookingResponse[d].customer_name;
                    var bookingType=bookingResponse[d].type;
                    var booking={};
                    var status=bookingResponse[d].status;
                    booking['status']=status;

                    booking['booking_id']=bookingId;
                    booking['customer_name']=customerName;
                    booking['start_time']=startTime;
                    booking['end_time']=endTime;
                    booking['type']=bookingType;
                    for(var t=0;t<timeSlots.length;t++)
                    {
                        var m = t +1;
                        var nextTime=timeSlots[m];
                        var presentTime = timeSlots[t];
                        if(startTime >= presentTime  && startTime < nextTime)
                        {
                            t=timeSlots.length;
                        }
                    }
                    if(dateBookingResponse[presentTime]!=undefined){
                        dateBookingResponse[presentTime].push(booking);
                    }else {
                        dateBookingResponse[presentTime]=[];
                        dateBookingResponse[presentTime].push(booking);
                    }
                }
                tmp['bookings']=dateBookingResponse;
                dayResponse.push(tmp);
            }

            return res.send({"success":true,"bookings":dayResponse});
        }else {
            return res.send({"success":true,"message":"no bookings","bookings":[]});
        }

    });
});
router.post('/services-list', tokenValidations, function (req, res) {

    tables.servicesTable.getServices(function (response) {
        return  res.send({"success": true, "category": response})
    });
});

router.post('/reject-salon-order',tokenValidations,function(req,res){
    var order_id=req.body.order_id;
   var languageCode=req.body.language_code;
    tables.ordersTable.update({"status":6},{"_id":order_id},async function(orderResponse){
        if(orderResponse!=undefined){
            var  user_id=orderResponse.customer_id;
            var  salon_id=orderResponse.salon_id;
            var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1,"country_id":1,'city_id':1});

            var salonName='salon';
            if(salonResponse!=undefined)
            {
                salonName=salonResponse[0].salon_name['en'];
            }
            var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

            var data=
                {
                    "title":"Booking rejected",
                    "message":"Booking rejected From salon",
                    "order_id":order_id,
                    "type":6
                };
            data['country_id']=salonResponse[0].country_id;
            data['city_id']=salonResponse[0].city_id;
            data['customer_id']=user_id;
            data['vendor_id']=salon_id;
            data['notification_type']=16;

            tables.notificationsTable.save(data,function(response){

            });
            if(fcmResponse!=undefined && fcmResponse.length!=0)
            {
                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
            }
            tables.bookingsTable.updateMany({"status":6},{"_id":{"$in":orderResponse.booking_id}},function(response)
            {
            });
            req.app.io.sockets.in(user_id).emit("reject_salon_order",{"order_id":order_id});
            req.app.io.sockets.in(salon_id).emit("order_status",{"order_id":order_id,"status":6});


                return res.send({"success":true,"message":"Booking Rejected"});
        }else
        {
              return   res.send({"success":false,"message" : utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] });
        }
    });
})
router.post('/order-details',tokenValidations,function(req,res){
    var orderId=req.body.order_id;
    var languageCode = req.body.language_code;
    if (orderId == '' || orderId == undefined)
    {
        return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
    }

    tables.ordersTable.getOrderassignDetails(orderId,languageCode,function(response)
    {


        if(response!=undefined && response.length!=0)
        {


            return res.send({"success":true,"order_details":response[0]});
        }else
        {
            return res.send({"success":true,"order_details":{}});
        }
    });
});
router.post('/package-order-details',tokenValidations,function(req,res)
{
    var orderId=req.body.order_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (orderId == '' || orderId == undefined)
    {
        return res.send(
            {
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            });
    }
    tables.ordersTable.getSalonPackageOrder(orderId,function(response){
        if(response.length!=0)
        {
            return res.send({"success":true,"order_details":response[0]});
        }else
        {
            return res.send({"success":true,"order_details":{}});
        }

    });
});
router.post('/accept-salon-package',tokenValidations,async function(req,res){
    var orderId=req.body.order_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (orderId == '' || orderId == undefined)
    {
        return res.send(
            {
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            });
    }

    var orderResponse =await tables.ordersTable.findFieldsWithPromises({"_id":orderId},{"booking_id":1,customer_id:1,salon_id:1});
    if(orderResponse==undefined || orderResponse.length!=0)
    {

        var  user_id=orderResponse[0].customer_id;
        var  salon_id=orderResponse[0].salon_id;
        var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});
        var salonName='salon';
        if(salonResponse!=undefined)
        {
            salonName=salonResponse[0].salon_name;
        }
        var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

        var data={
            "title":"Booking acceptance",
            "message":"Booking Accepted From salon",
            "order_id":orderId,
            "type":2
        };
        var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":{"$in":orderResponse[0].booking_id}},{"customer_country_details":1,"customer_id":1,"salon_id":1})
        data['country_id']=bookingDetails[0].customer_country_details.country_id;
        data['city_id']=bookingDetails[0].customer_country_details.city_id;
        data['customer_id']=bookingDetails[0].customer_id;
        data['vendor_id']=bookingDetails[0].salon_id;
        data['notification_type']=1;

        tables.notificationsTable.save(data,function(response){

        });

        if(fcmResponse!=undefined && fcmResponse.length!=0)
        {

            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
        }
        req.app.io.sockets.in(user_id).emit("accept_salon_order",{"order_id":orderId });
        return res.send({"success":true,"message":"updated"});
    }
    var booking=orderResponse[0].booking_id;
    tables.bookingsTable.updateManyWithPromises({"status":2},{"_id":{"$in":booking}},function(response){
        return res.send({"success":true,"message":"order accepted"});
    })
});
router.post('/rating-submit',tokenValidations,async function(req,res){
    var customerId=req.body.user_id;
    var bookingId=req.body.booking_id;
    var vendorId=req.body.vendor_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    var rating = req.body.rating;
    var review = req.body.comment;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    if(salonId == '' || salonId == undefined)
    {
        return res.send({"success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":4
        });
    }
    var bookingDetails =await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"customer_id":1,"salon_id":1});
    customerId=bookingDetails[0]['customer_id'];
    salonId=bookingDetails[0]['salon_id'];
    tables.ratingTable.save({ "booking_id":bookingId, "customer_id":customerId, "vendor_id":vendorId, "salon_id":salonId, "rated_by":2, "rating":rating, "review":review },
        function(response){
            return res.send({"success":true,"message":"Thank you for your feedback"});
        });
});
router.post('/get-employees-for-booking',tokenValidations,function(req,res) {
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    tables.bookingsTable.getBookingCartDetailsSalon(bookingId,async function(bookingResponse)
    {
        var selectedSalon=bookingResponse[0].salon_id;
        var cartId=bookingResponse[0]._id;
        var cartDate=await tables.cartTable.findFieldsWithPromises({"_id":cartId},{"date":1,"time":1,"time_type":1,"selected_time":1,"selected_date":1,
            'timezone':1,"selected_for":1,"service_id":1});
        var timeType=cartDate[0].time_type;
        var serviceStartDate='';
        var serviceEndDate='';
        if(timeType==1)
        {
            var selectedServiceFor=cartDate[0].selected_for;
            var selectedService=cartDate[0].service_id;
            var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,
                "service_id":selectedService,"service_for":selectedServiceFor},{"service_time":1});
            var serviceTime=selectedServiceTimeResponse[0].service_time;
            var timeSlots=[];
            var preferredTime=cartDate[0].time;


            var preferredDate=cartDate[0].date;
            var time=preferredTime.split(":");
            var startTime = parseIn(time[0],time[1]);
            var endTime=parseIn(time[0],time[1]);
            endTime.setMinutes(startTime.getMinutes()+parseInt(serviceTime));
            startTime=startTime.toTimeString().substring(0, 5);
            endTime=endTime.toTimeString().substring(0, 5);
            var format = 'YYYY-MM-DD HH:mm';
            var timezone=cartDate[0].timezone;
            serviceStartDate=moment.tz(preferredDate+" "+startTime,format,timezone).utc().format(format);
            serviceEndDate=moment.tz(preferredDate+" "+endTime,format,timezone).utc().format(format);
            //  serviceStartDate=new Date(preferredDate+" "+startTime);
            //serviceEndDate=new Date(preferredDate+" "+endTime);
            //serviceStartDate=utility.formatUtcTimaAndDate(serviceStartDate);
            // serviceEndDate=utility.formatUtcTimaAndDate(serviceEndDate);
        }
        tables.salonEmployeesTable.getSalonEmployeeForBooking(bookingId,serviceStartDate,serviceEndDate,languagesCode,async function(response){
            if(response!=undefined && response.length!=0)
            {


                if(timeType!=1 || (cartDate[0].selected_time!=undefined && cartDate[0].selected_time.indexOf('-')!=-1)){
                    var timeSlots=[];
                    var preferredTime=cartDate[0].selected_time;
                    var preferredDate=cartDate[0].selected_date;
                    var timezone=cartDate[0].timezone;
                    var preferredTimeBetween=preferredTime.split("-");


                    var preferredTimeStart=preferredTimeBetween[0];
                    preferredTimeStart=preferredTimeStart.split(":");
                    var preferredTimeEnd=preferredTimeBetween[1];
                    preferredTimeEnd=preferredTimeEnd.split(":");
                    var preferredStartString=parseIn(preferredTimeStart[0],preferredTimeStart[1]);
                    preferredStartString= toTimeZone(preferredStartString,timezone);
                    var preferredEndString=parseIn(preferredTimeEnd[0],preferredTimeEnd[1]);
                    preferredEndString= toTimeZone(preferredEndString,timezone);
                    var end = new Date(preferredDate);
                    var day = end.getDay();
                    if(day==0)
                    {
                        day=7;
                    }
                    for(var e=0;e<response.length;e++)
                    {
                        var preferredEmployee=response[e].employee_id;
                        preferredStartString=new Date(preferredStartString);
                        preferredEndString=new Date(preferredEndString);
                        timeSlots=await  timeIntervel(preferredStartString,preferredEndString,preferredEmployee,preferredDate,day,serviceTime,timezone);

                        if(timeSlots.length!=0)
                        {
                            // 1 for available
                            response[e].status=1;
                        }else
                        {
                            // 0 for not available
                            response[e].status=0;
                        }
                    }
                }
                return res.send({"success":true,"employees":response});
            }else
            {
                return res.send({"success":true,"employees":[]});
            }


        });
    });

});
router.post('/get-employee-availability',tokenValidations,async function (req, res) {

    var date = req.body.date;
    var employeeId = req.body.employee_id;
    var bookingId = req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    var datetimeResponse=await tables.bookingsTable.getDateTime(bookingId);
    if(datetimeResponse)
        var preferredDate=new Date();
    if(datetimeResponse==undefined || datetimeResponse.length==0)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }else
    {
        if(datetimeResponse[0].date!=undefined)
        {
            preferredDate=datetimeResponse[0].date;

        }
    }

    tables.salonEmployeesTable.getEmployeesTime(employeeId,async function (response){
        var start = new Date();

        var hours = response[0].working_hours;
        var availableDates=[];
        var end = new Date(preferredDate);
        var day = end.getDay();
        var salonTimeings=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"cart_id":1,"salon_id":1});
        var cartId=salonTimeings[0].cart_id;
        var selectedSalon=salonTimeings[0].salon_id;
        var cartDate=await tables.cartTable.findFieldsWithPromises({"_id":{"$in":cartId}},{"date":1,"time":1,"time_type":1,"selected_for":1,"timezone":1,"service_id":1});
        var selectedServiceFor=cartDate[0].selected_for;
        var selectedService=cartDate[0].service_id;
        var timezone=cartDate[0].timezone;
        var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,
            "service_id":selectedService,"service_for":selectedServiceFor},{"service_time":1});

        var serviceTime=selectedServiceTimeResponse[0].service_time;

        for (var i = 1; i < 9; i++)
        {
            var days={};
            var assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;


            if (hours[day] != undefined && hours[day].length!=0 )
            {
                var assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;
                var availableHoursSlots=[];

                var timeSolts=await dateforEmployees(hours[day],employeeId,assignDate,day,serviceTime,timezone);

                if(timeSolts!=undefined && timeSolts.length!=0)
                {
                    days['date']=assignDate;
                    days["time_slots"]=timeSolts;
                    availableDates.push(days);
                }
            }
            end.setDate(end.getDate() + 1);
            day = end.getDay();

            if(day==0)
            {
                day=7;
            }


            assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;
        }

        return  res.send({"success":true,"avaliable_dates":availableDates});


    });


});
function dateforEmployees(hours,employeeId,assignDate,day,serviceTime,timezone){
    return new Promise(async function(resolve){
        var availableHoursSlots=[];
        for (var h = 0; h < hours.length; h++)
        {
            var startTimeSlot = hours[h].start;
            var endTimeSlot = hours[h].end;
            startTimeSlot=startTimeSlot.split(":");
            endTimeSlot=endTimeSlot.split(":");

            //Input
            //  var startTime = new Date(0, 0, 0, startTimeSlot[0], startTimeSlot[1], 0);
            //  var endTime = new Date(0, 0, 0, startTimeSlot[0], startTimeSlot[1], 0);



            var startTime = parseIn(startTimeSlot[0],startTimeSlot[1]);
            var endTime = parseIn(endTimeSlot[0],endTimeSlot[1]);

            var intervals = await timeIntervel(startTime, endTime,employeeId,assignDate,day,serviceTime,timezone);
            availableHoursSlots= availableHoursSlots.concat(intervals);
            if(h<hours.length)
            {

                return  resolve(availableHoursSlots);

            }


        }


    });

}
function timeIntervel(time1, time2,employeeId,assignDate,day,serviceTime,timezone)
{
    return new Promise(async function(resolve){
        var arr = [];
        while(time1<time2){


            var time = time1.toTimeString().substring(0, 5);
            time=time.split(":");

            var startTime = parseIn(time[0],time[1]);
            var endTime=parseIn(time[0],time[1]);
            endTime.setMinutes(startTime.getMinutes()+parseInt(serviceTime));
            startTime=startTime.toTimeString().substring(0, 5);
            endTime=endTime.toTimeString().substring(0, 5);
            if(day==undefined)
            {
                day=1
            }
            if(day==0)
            {
                day=7;
            }
            var employeeTime=await tables.salonEmployeesTable.checkEmployeeAvaliablity(employeeId,startTime,day);

            if(employeeTime!=undefined && employeeTime.length!=0)
            {
                var now = moment();
                var format = 'YYYY-MM-DD HH:mm';
                var currentTime=now.tz(timezone).format(format);
                var assignDateTime=new Date(assignDate+" "+startTime);
                var assignEndTime=new Date(assignDate+" "+endTime);
                assignDateTime= moment(assignDateTime).format(format);
                assignEndTime= moment(assignEndTime).format(format);


                var assignUtcDateTime=moment.tz(assignDate+" "+startTime,format,timezone).utc().format(format);

                // var assignUtcEndTime=new Date(assignDate+" "+endTime);
                //  assignUtcDateTime.setTimezone(timezone);

                // assignUtcEndTime.setTimezone(timezone);

                var  assignUtcEndTime=moment.tz(assignDate+" "+endTime,format,timezone).utc().format(format) ;
                //   assignUtcDateTime=utility.formatUtcTimaAndDate(assignUtcDateTime);

                // assignUtcEndTime=utility.formatUtcTimaAndDate(assignUtcEndTime);

                var assignConditon = await tables.salonEmployeesTable.checkEmployeeTime(employeeId, assignUtcDateTime,assignUtcEndTime, assignDate);

                if(assignConditon != undefined && assignConditon.length==0)
                {

                    if(assignDateTime>currentTime)
                    {

                        arr.push(startTime);

                    }
                }

            }

            time1.setMinutes(time1.getMinutes()+30);


        }

        return resolve(arr);
    });
}
function toTimeZone(time, zone){
    var format = 'YYYY-MM-DD HH:mm:ss';
    return moment(time, format).tz(zone).format(format);
}
function isValidDate(str,format) {
    var d = moment(str,format);
    if(d == null || !d.isValid()) return false;

    return str.indexOf(d.format('D/M/YYYY')) >= 0;
}
router.post('/assign-employee-booking', tokenValidations,async function(req,res){
    var employeeId = req.body.employee_id;
    var bookingId = req.body.booking_id;
    var languagesCode = req.body.language_code;
    var time=req.body.time;
    var date=req.body.date;



    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send(
            {
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code":1
            });
    }
    // if(date=='' || date==undefined)
    // {
    //     return res.send(
    //         {
    //             "success": false,
    //             "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
    //             "error_code":2
    //         });
    // }
    var moment=require('moment');
    var salonTimeings=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"cart_id":1,"salon_id":1});
    var cartId=salonTimeings[0].cart_id;
    var selectedSalon=salonTimeings[0].salon_id;
    var cartDate=await tables.cartTable.findFieldsWithPromises({"_id":{"$in":cartId}},{"date":1,"time":1,"time_type":1,"selected_for":1,"service_id":1,"timezone":1});
    var selectedServiceFor=cartDate[0].selected_for;
    var selectedService=cartDate[0].service_id;
    var timezone=cartDate[0].timezone;
    var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,
        "service_id":selectedService,"service_for":selectedServiceFor,"status":{"$ne":0}},{"service_time":1});
    var serviceTime=selectedServiceTimeResponse[0].service_time;

    if(time==undefined || time=='' || date =='' || date==undefined || time.indexOf('-')!=-1)
    {
        if(cartDate[0].time_type==2 || cartDate[0].time.indexOf('-') !=-1)
        {
            var timeSlots=[];
            var preferredTime=cartDate[0].time;
            var preferredEmployee=employeeId;
            var preferredDate=cartDate[0].date;
            var preferredTimeBetween=preferredTime.split("-");

            var preferredTimeStart=preferredTimeBetween[0];
            preferredTimeStart=preferredTimeStart.split(":");
            var preferredTimeEnd=preferredTimeBetween[1];
            preferredTimeEnd=preferredTimeEnd.split(":");
            var preferredStartString=parseIn(preferredTimeStart[0],preferredTimeStart[1]);
            var preferredEndString=parseIn(preferredTimeEnd[0],preferredTimeEnd[1]);
            var end = new Date(preferredDate);
            var day = end.getDay();
            date=preferredDate;
            if(day==0)
            {
                day=7;
            }
            timeSlots=await  timeIntervel(preferredStartString,preferredEndString,preferredEmployee,preferredDate,day,serviceTime,timezone);

            if(timeSlots.length!=0)
            {
                preferredTime=timeSlots[0];
                preferredTime=preferredTime.split(":");
                var startTime = parseIn(preferredTime[0],preferredTime[1]);
                var endTime=parseIn(preferredTime[0],preferredTime[1]);
                /*  endTime.setMinutes(startTime.getMinutes()+30);
                  startTime=startTime.toTimeString().substring(0, 5);
                  endTime=endTime.toTimeString().substring(0, 5);
                  endTime=endTime.split(":");
                  startTime=startTime.split(":");*/

                // return false;
                endTime.setMinutes(startTime.getMinutes()+parseInt(serviceTime));
                startTime=startTime.toTimeString().substring(0,5);
                // return false;
                time=startTime;
                //  assignTimeSlot=await tables.bookingsTable.updateWithPromises({"status":2,"employee_id":preferredEmployee,"time":startTime[0]+":"+startTime[1],"end_time":endTime[0]+":"+endTime[1]},{"_id":bookingId});
            }else
            {
                return res.send({"success":false,"message":"select another time slots"});
            }
        }else{
            time=cartDate[0].time;
            date=cartDate[0].date;
            time=time.split(":");
            var startTime = parseIn(time[0],time[1]);
            var endTime=parseIn(time[0],time[1]);
            endTime.setMinutes(startTime.getMinutes()+parseInt(serviceTime));
            startTime=startTime.toTimeString().substring(0,5);
            // return false;
            time=startTime;
        }

        time=time.split(":");
        //var startTime = parseIn(time[0],time[1]);
        // var endTime=parseIn(time[0],time[1]);
        // endTime.setMinutes(startTime.getMinutes()+30);
        time=time[0]+':'+time[1];
    }else{
        if(!moment(date, "YYYY-MM-DD").isValid())
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code":3
            });
        }
        if(!moment(time, "HH:mm").isValid())
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code":4,
                "time":time
            });
        }

        time=time.split(":");
        var startTime = parseIn(time[0],time[1]);
        var endTime=parseIn(time[0],time[1]);
        endTime.setMinutes(startTime.getMinutes()+parseInt(serviceTime));
        time=time[0]+':'+time[1];
    }
    endTime=endTime.toTimeString().substring(0,5);
    endTime=endTime.split(":");
    endTime=endTime[0]+':'+endTime[1];

    tables.bookingsTable.update({"employee_id": employeeId,"service_time":serviceTime,"time":time,"end_time":endTime,"date":date },
        {"_id": bookingId}, function(response){
            if(response!=undefined && response.length!=0){
                return res.send({"success": true})
            }else{
                return res.send({"success":false,"message":"try again"});
            }
        });
});
router.post('/packages-order',tokenValidations,function(req,res){
});
router.post('/check-in-between',tokenValidations,function(req,res)
{
    var bookingId=req.body.booking_id;
    var employeeId=req.body.employee_id;
    var date='';
    tables.bookingsTable.getBookingCartDetailsSalon(bookingId,async function(bookingResponse)
    {
        var selectedSalon=bookingResponse[0].salon_id;
        var cartId=bookingResponse[0]._id;
        var cartDate=await tables.cartTable.findFieldsWithPromises({"_id":cartId},{"date":1,"time":1,"time_type":1,"selected_for":1,"timezone":1,"service_id":1});

        var selectedServiceFor=cartDate[0].selected_for;
        var selectedService=cartDate[0].service_id;
        var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,"service_id":selectedService,"service_for":selectedServiceFor},{"service_time":1});
        var serviceTime=selectedServiceTimeResponse[0].service_time;
        var timeSlots=[];
        var preferredTime=cartDate[0].time;
        var preferredEmployee=employeeId;
        var preferredDate=cartDate[0].date;
        var timezone=cartDate[0].timezone;



        var preferredTimeBetween=preferredTime.split("-");
        var preferredTimeStart=preferredTimeBetween[0];

        preferredTimeStart=preferredTimeStart.split(":");
        var preferredTimeEnd=preferredTimeBetween[1];
        preferredTimeEnd=preferredTimeEnd.split(":");

        var preferredStartString=parseIn(preferredTimeStart[0],preferredTimeStart[1]);
        var preferredEndString=parseIn(preferredTimeEnd[0],preferredTimeEnd[1]);
        var end = new Date(preferredDate);
        var day = end.getDay();
        date=preferredDate;
        if(day==0)
        {
            day=7;
        }
        timeSlots=await  timeIntervel(preferredStartString,preferredEndString,preferredEmployee,preferredDate,day,serviceTime,timezone);
        if(timeSlots.length==0){
            tables.salonEmployeesTable.getEmployeesTime(employeeId,async function(response)
            {
                var start = new Date();
                var hours = response[0].working_hours;
                var availableDates=[];
                var end = new Date(preferredDate);
                var day = end.getDay();
                for (var i = 1; i < 9; i++)
                {
                    var days={};

                    var assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;

                    if(hours[day] != undefined && hours[day].length!=0)
                    {
                        var assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;

                        var availableHoursSlots=[];

                        var timeSolts=await dateforEmployees(hours[day],employeeId,assignDate,day,serviceTime,timezone);

                        if(timeSolts!=undefined && timeSolts.length!=0)
                        {
                            days['date']=assignDate;
                            days["time_slots"]=timeSolts;
                            availableDates.push(days);
                        }
                    }
                    end.setDate(end.getDate() + 1);
                    day = end.getDay();

                    if(day==0)
                    {
                        day=7;
                    }

                    assignDate= end.getFullYear()+"-"+("0" + (end.getMonth() + 1)).slice(-2)+"-"+("0" + end.getDate()).slice(-2) ;
                }
                return  res.send({"success":true,"avaliable_dates":availableDates});
            });
        }else{
            var availableDates=[];
            var days={};
            days['date']=preferredDate;
            days["time_slots"]=timeSlots;
            availableDates.push(days);
            return   res.send({"success":true,"avaliable_dates":availableDates,"avaliable_slots":1});
        }
    });

});
router.post('/salon-basic-info',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }

    if(salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.salonTable.find({'_id':salonId},async function(response)
    {
            response[0]['salon_name']= response[0]['salon_name'][languagesCode];
            response[0]['alias_name']= response[0]['alias_name'][languagesCode];
            response[0]['special_instructions']= (response[0]['special_instructions'] && response[0]['special_instructions'][languagesCode]?response[0]['special_instructions'][languagesCode]:'');
            response[0]['intro']=(response[0]['intro']&& response[0]['intro'][languagesCode]?response[0]['intro'][languagesCode]:'')
       var salonPicturesResponse=await tables.salonPicturesTable.findFieldsWithPromises({"salon_id":salonId,'status':{"$ne":2}},{"file_path":1});
        var salonPicture='';
        if(response[0].country_id)
        {
            var countryDetails= await tables.countryTable.findFieldsWithPromises({"_id":response[0].country_id},{"country":1});
            if(response[0].city_id)
            {
                var citiesDetails= await tables.citiesTable.findFieldsWithPromises({"_id":response[0].city_id},{"city_name":1});
                response[0]['city']=citiesDetails[0]['city_name'][languagesCode];
            }
            response[0]['country']=countryDetails[0]['country'][languagesCode];
        }
        if(salonPicturesResponse!=undefined && salonPicturesResponse.length!=0)
        {
                  salonPicture=salonPicturesResponse[0]['file_path'];
        }
        return res.send({"success":true,"details":response,"salon_picture":salonPicture});
    });
});
router.post('/salon-basic-info-update',tokenValidations,async function(req,res)
{
    var vendorId = req.body.vendor_id;
    var salonName = req.body.salon_name;
    var aliasName = req.body.alias_name;
    var salonMobile = req.body.salon_mobile;
    var mobileCountry = req.body.mobile_country;
    var emailAddress = req.body.email;
    var workingGender = req.body.working_gender;
    var workingHours = req.body.working_hours;
    var wifi = req.body.wifi;
    var wifiCost = req.body.wifi_cost;
    var parking = req.body.parking;
    var parkingCost = req.body.parking_cost;
    var kids = req.body.kids;
    var handicapped = req.body.handicapped;
    var pets = req.body.pets;
    var specialInstruction = req.body.special_instruction;
    var about = req.body.about;
    var salonId = req.body.salon_id;
    var levels = req.body.levels;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined){
        languagesCode = 'en';
    }
    if(vendorId == '' || vendorId == undefined)
    {
        return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            })
    }
    var streetName = req.body.street_name;
    var bulidingName = req.body.buliding_name;
    var floor = req.body.floor;
    var zipCode = req.body.zip_code;
    var country = req.body.country;
    var city = req.body.city;
    var location = req.body.location;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var address = req.body.address;
    var update = {};
    longitude=parseFloat(longitude);
    latitude=parseFloat(latitude);
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code":1
        });
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"error_code":2
        });
    }
    /* var workingHoursDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"working_hours":1});
          workingHoursDetails=workingHoursDetails[0].working_hours;*/
    //working days
    // workingHours=JSON.stringify(workingHours);
    //  return res.send(salonWorkingHours);

    if (streetName == '' || streetName == undefined)
    {
        return res.send({"success": false, "message": "Please provide street name"});
    }
    update['street_name'] = streetName;
    if (bulidingName == '' || bulidingName == undefined)
    {
        return res.send({"success": false, "message": "Please provide buliding name"});
    }

    update['building_name'] = bulidingName;
    if (location == '' || bulidingName == undefined)
    {
        return res.send({"success": false, "message": "Please provide location"});
    }
    update['location'] = location;
    if (floor != '' && floor != undefined)
    {
        update['floor'] = floor;
    }
    if (zipCode != '' && zipCode != undefined)
    {
        update['zip_code'] = zipCode;
    }
    if (country == '' || country == undefined)
    {
        return res.send({"success": false, "message": "Please provide country"})
    }
   /* var cityLan=await utility.translate(city);
    var countryLan=await utility.translate(country);
    country=countryLan.text;
    city=cityLan.text;*/
    var checkCountry={};
    country=country.toLowerCase();

    checkCountry["country."+languagesCode] =
    {
        '$regex': country + '.*', '$options': 'i'
    };
    var  countryResponse = await tables.countryTable.findFieldsWithPromises(checkCountry,{ "_id":1 });

    if(countryResponse==undefined || countryResponse.length==0)
    {
        return res.send({"success":false,"message":"country Not avalible"});
    }
    update['country_id'] = countryResponse[0]._id;
    update['country'] = country;
    update['longitude']=longitude;
    update['latitude']=latitude;
    update['city']=city;
    update['mobile_country']=mobileCountry;
    update['wifi_available'] = wifi;
    update['wifi_cost'] = wifiCost;
    update['parking_available'] = parking;
    update['parking_cost'] = parkingCost;
    update['kids_friendly'] = kids;
    update['handicap'] = handicapped;
    update['pets'] = pets;
    update['special_instructions.'+languagesCode] = specialInstruction;
    update['intro.'+languagesCode] = about;
    update['levels'] = levels;

    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    if (trim(salonName) == '' || salonName == undefined)
    {
        return res.send({
            "success": false,
            "message": "salon name is required."
        });
    }
    salonName=utility.removeSpacesInBetween(salonName);
    update['salon_name.'+languagesCode] = salonName;
    if (salonMobile == '' || salonMobile == undefined)
    {
        return res.send({
            "success": false,
            "message": "salon mobile is required."
        });
    }
    update['alias_name.'+languagesCode] = aliasName;
    update['phone'] = salonMobile;
    if (trim(emailAddress) == '' || emailAddress == undefined)
    {
        return res.send({
            "success": false,
            "message": "salon email is required."
        });
    }
    update['email'] = emailAddress;
    /*if (workingGender == '' || workingGender == undefined) {
        return res.send({
            "success": false,
            "message": "working gender is required."
        });
    }
    workingGender=[];
    if (Array.isArray(workingGender)) {
        workingGender = JSON.parse(workingGender);
    } else {
        workingGender = workingGender.split(',');
    }


    var genderFlag = [];
    for (var g = 0; g < workingGender.length; g++) {

        if (!utility.isValidWorkingGender(parseInt(workingGender[g])))
        {
            genderFlag.push(0);
        }
    }
    if (genderFlag.indexOf(0) != -1)
    {
        return res.send({
            "success": false,
            "message": "Please provide valid stylist gender."
        });
    }
    update['working_genders'] = workingGender;*/
    if (workingHours == '' || workingHours == undefined)
    {
        return res.send({
            "suceess": false,
            "message": "Please provide working hours"
        });
    }
    var response= await tables.vendorTable.findMobile(salonMobile,mobileCountry);

    if((response.length!=0 && (response[0]['branches'].length!=0 && response[0]['branches'][0].salon_id!=salonId)) || (response.length!=0 && response[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["mobile number already exists"][languagesCode]
        });
    }
    var emailResponse= await tables.vendorTable.findEmail(emailAddress);

    if((emailResponse.length!=0 && (emailResponse[0]['branches'].length!=0 && emailResponse[0]['branches'][0].salon_id!=salonId)) || (emailResponse.length!=0 && emailResponse[0]['branches'].length==0))
    {
        return res.send({"success":false,
            "message": utility.errorMessages["email already exists"][languagesCode]
        });
    }
    var salonWorkingHours = {};
    //working days
    workingHours = JSON.parse(workingHours);
    for (var keys in workingHours)
    {
        //checking valid days
        if (!utility.isValidWorkingDAY(parseInt(keys)))
        {
            return res.send({"success": false, "message": "Please provide valid working day"});
        }
        salonWorkingHours[keys] = {};

        var startTime = workingHours[keys]['start'];
        var endTime = workingHours[keys]['end'];
        //start time and end time in a day

        // checking start time
        if (startTime == '')
        {
            return res.send({"success": false, "message": "Please provide valid start time "});
        }
        // checking end time
        if (endTime == '')
        {
            return res.send({"success": false, "message": "Please provide valid end time "});
        }
        salonWorkingHours[keys] = startTime;
        salonWorkingHours[keys] = endTime;

        if (workingHours[keys] != undefined)
        {
            // return res.send({"success":false,"message":"Please provide valid break time"})
            if (workingHours[keys].length)
            {
                salonWorkingHours[keys] = [];
            }
            for (var i = 0; i < workingHours[keys].length; i++)
            {
                var obj = {};
                //checking each break start and end time in a day

                obj['start'] = workingHours[keys][i]['start'];


                obj['end'] = workingHours[keys][i]['end'];
                salonWorkingHours[keys].push(obj);
            }
        }
        //break timeings in a day
    }
    update['working_hours'] = salonWorkingHours;
    var locationData = {};
    locationData['type'] = "Point";
    locationData['coordinates'] = [longitude, latitude];
    tables.salonTable.update(update,{'_id':salonId},async function(updateresponse)
    {
        var updateBranch=await tables.vendorTable.updateWithPromises({"branches.$.mobile":salonMobile,"branches.$.mobile_country":mobileCountry,"branches.$.email":emailAddress},{"_id":vendorId,"branches.$.salon_id":salonId});
        var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"tm_user_id":1});
        var salonEmployeeDetailsUpdate=await tables.salonEmployeesTable.updateManyWithPromises({"working_time":salonWorkingHours},{"salon_id":salonId});
        if(salonDetails!=undefined && salonDetails.length!=0)
        {
            var userId=salonDetails[0].tm_user_id;
            if(userId!=undefined)
            {
                var update=await utility.updateTmProfile({"name":salonName,'email':emailAddress,"mobile":mobileCountry+''+salonMobile,'user_id':userId})
            }
        }
        tables.vendorLocationTable.find({"salon_id": updateresponse._id}, function (locationResponse)
        {
            if (locationResponse != undefined && locationResponse.length!=0)
            {
                tables.vendorLocationTable.update({"location": locationData,"address":location}, {"salon_id": updateresponse._id},
                    function (response) {
                        return res.send({"success":true,"message":"updated","address":location});
                    });
            }else
            {
                tables.vendorLocationTable.save({
                    "location": locationData,
                    "type": 2,
                    "address":address,
                    "salon_id": updateresponse._id
                },function (response) {
                    return res.send({"success":true,"message":"updated","address":location});

                });
            }
        });
    });
});
router.post('/salon-pictures-paths',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.salonPicturesTable.find({'salon_id':salonId},function(response){
        res.send({"success":true,"pictures":response});
    });
});
router.post('/salon-pictures-update',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    /* tables.salonPicturesTable.find({'salon_id':salonId},function(response){
            res.send({"success":true,"pictures":response});
     });*/
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    var filePath=req.body.file_path;
    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])
        });
    }
    filePath = filePath.split(',');
    var save = [];
    if(filePath.length!=0)
    {

        for (var i = 0; i < filePath.length; i++)
        {
            if(filePath[i]!=''){
                var obj = {};
                obj['salon_id'] = salonId;
                obj['file_path'] = filePath[i];
                save.push(obj);
            }
        }

    }
    var deletedSalonPictures=req.body.deleted_id;
    deletedSalonPictures=deletedSalonPictures.split(',');
    tables.salonPicturesTable.insertMany(save,function(response)
    {
        tables.salonPicturesTable.deleteMany({"_id":{"$in":deletedSalonPictures}},function(response){
            return res.send({"success":true,"message":"updated"});
        });
    });
});
router.post('/salon-portfolio-paths',tokenValidations,function(req,res) {
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.portfolioTable.find({'salon_id':salonId},function(response)
    {
        return  res.send({"success":true,"pictures":response});
    });
});
router.post('/salon-portfolio-update',tokenValidations,function(req,res)
{
    var salonId=req.body.salon_id;

    /* tables.salonPicturesTable.find({'salon_id':salonId},function(response){
            res.send({"success":true,"pictures":response});
     });*/
    var filePath=req.body.file_path;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++)
    {
        if(filePath[i]!='')
        {
            var obj = {};
            obj['salon_id'] = salonId;
            obj['file_path'] = filePath[i];
            save.push(obj);
        }
    }
    var deletedSalonPictures=req.body.deleted_id;
    deletedSalonPictures=deletedSalonPictures.split(',');
    tables.portfolioTable.insertMany(save,function(response)
    {
        tables.portfolioTable.deleteMany({"_id":{"$in":deletedSalonPictures}},function(response)
        {
            return res.send({"success":true,"message":"updated"});
        });
    });
});
/*router.post('/')*/
router.post('/booking-details',tokenValidations,function(req,res)
{
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.bookingsTable.getSalonBookingDetails(bookingId,languagesCode,function(response)
    {
        return res.send({"success":true,"bookings":response});
    });
})
router.post('/get-salon-booking-details',tokenValidations,function(req,res)
{
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.bookingsTable.getSalonBookingDetails(bookingId,languagesCode,function(response)
    {
        return  res.send({"success":true,"details":response[0]});
    });
});
router.post('/accept-booking',tokenValidations,function(req,res)
{
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.ordersTable.checkOrderDetails(bookingId,async function(response){
        if(response!=undefined && response.length!=0)
        {
            var orderResponse=response;
            for(var o=0;o<orderResponse.length;o++)
            {
                var time=orderResponse[o].time;
                var bookingId=orderResponse[o]._id;
                var date=orderResponse[o].date;
                if(date==undefined || time==undefined)
                {
                    var preferredTime=orderResponse[o].cartDetails.time;
                    var preferredDate=orderResponse[o].cartDetails.date;
                    var preferredEmployee=orderResponse[o].cartDetails.employee_id;
                    var timezone=orderResponse[o].cartDetails.timezone;
                    if(preferredEmployee==undefined)
                    {
                        return  res.send({"success":false,"message":"Please assign employee , time and date for the booking","booking_id":bookingId});

                    }
                    if(preferredDate==undefined)
                    {
                        return  res.send({"success":false,"message":"Please Select the  date for the booking","booking_id":bookingId});
                    }
                    if(preferredTime==undefined)
                    {
                        return  res.send({"success":false,"message":"Please Select the time for the booking","booking_id":bookingId});
                    }
                    var timeType=orderResponse[o].cartDetails.time_type;
                    var selectedService=orderResponse[o].cartDetails.service_id;
                    var selectedServiceFor=orderResponse[o].cartDetails.selected_for;
                    var selectedSalon=orderResponse[o].cartDetails.salon_id;
                    var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,"service_id":selectedService,"service_for":selectedServiceFor},{"service_time":1});

                    if(selectedServiceTimeResponse!=undefined)
                    {
                        var endServiceTime=selectedServiceTimeResponse[0].service_time;
                    }
                    var assignTimeSlot=[];
                    if(timeType==1)
                    {
                        preferredTime=preferredTime.split(":");

                        var startTime = parseIn(preferredTime[0],preferredTime[1]);
                        var endTime=parseIn(preferredTime[0],preferredTime[1]);
                        endTime.setMinutes(startTime.getMinutes()+parseInt(endServiceTime));
                        startTime=startTime.toTimeString().substring(0, 5);
                        endTime=endTime.toTimeString().substring(0, 5);
                        var checkTimeSolt=await tables.salonEmployeesTable.checkEmployeeTime(preferredEmployee,startTime,endTime,preferredDate);
                        if (checkTimeSolt != undefined && checkTimeSolt.length == 0)
                        {
                            time=preferredTime[0]+":"+preferredTime[1];
                            //end=preferredTime[0]+":"+preferredTime[1];
                            assignTimeSlot=await tables.bookingsTable.updateWithPromises({"status":2,"employee_id":preferredEmployee,"service_time":endServiceTime,"time":time,"end_time":endTime,"date":preferredDate},{"_id":bookingId});
                        }else
                        {
                            return res.send({"success":false,"message":"select another TimeSlot for the booking",
                                "booking_id":bookingId})
                        }
                    }else
                    {
                        var timeSlots=[];
                        var preferredTimeBetween=preferredTime.split("-");
                        var preferredTimeStart=preferredTimeBetween[0];
                        var preferredTimeEnd=preferredTimeBetween[1];
                        var startTime=parseIn(preferredTimeStart[0],preferredTimeStart[1]);
                        var endTime=parseIn(preferredTimeEnd[0],preferredTimeEnd[1]);
                        var end = new Date(preferredDate);
                        var day = end.getDay();
                        date=preferredDate;
                        if(day==0)
                        {
                            day=7;
                        }
                        timeSlots=await  timeIntervel(startTime,endTime,preferredEmployee,preferredDate,day,endServiceTime,timezone);

                        if(timeSlots.length!=0)
                        {
                            preferredTime=timeSlots[0];
                            var startTime = parseIn(preferredTime[0],preferredTime[1]);
                            var endTime=parseIn(preferredTime[0],preferredTime[1]);
                            endTime.setMinutes(startTime.getMinutes()+parseInt(endServiceTime));
                            startTime=startTime.toTimeString().substring(0, 5);
                            endTime=endTime.toTimeString().substring(0, 5);
                            endTime=endTime.split(":");
                            startTime=startTime.split(":");


                            assignTimeSlot=await tables.bookingsTable.updateWithPromises({"status":2,"employee_id":preferredEmployee,"service_time":endServiceTime,"time":startTime[0]+":"+startTime[1],"end_time":endTime[0]+":"+endTime[1]},{"_id":bookingId});
                        }else
                        {
                            return res.send({"success":false,"message":"select another time slots ","booking_id":bookingId});
                        }
                    }


                }else
                {
                    var acceptBooking=await tables.bookingsTable.updateWithPromises({"status":2},{"_id":bookingId})
                }
            }
            var  user_id=orderResponse[0].customer_id;
            var  salon_id=orderResponse[0].salon_id;
            var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});

            var salonName='salon';
            if(salonResponse!=undefined)
            {
                salonName=salonResponse[0].salon_name['en'];
            }
            var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);


            var data={
                "title":"Booking acceptance",
                "message":"Booking Accepted From "+salonName,
                "order_id":bookingId,
                "type":2
            };
             var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"customer_country_details":1,"customer_id":1,"salon_id":1})
            data['country_id']=bookingDetails[0].customer_country_details.country_id;
            data['city_id']=bookingDetails[0].customer_country_details.city_id;
            data['customer_id']=bookingDetails[0].customer_id;
            data['vendor_id']=bookingDetails[0].salon_id;
            data['notification_type']=1;

            tables.notificationsTable.save(data,function(response){

            });

            if(fcmResponse!=undefined && fcmResponse.length!=0)
            {


                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
            }


            req.app.io.sockets.in(user_id).emit("accept_salon_order",{"order_id":bookingId });



            return res.send({"success":true,"message":"order accepted"});
        }else
        {

            tables.bookingsTable.updateMany({"status":2},{"_id":bookingId},async function(response)
            {

                var  user_id=response.customer_id;
                var  salon_id=response.salon_id;
                var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});

                var salonName='salon';
                if(salonResponse!=undefined && salonResponse.length!=0)
                {
                    salonName=salonResponse[0].salon_name;
                }



                var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);
                var data={
                    "title":"Booking acceptance",
                    "message":"Booking Accepted From "+salonName,
                    "order_id":bookingId,
                    "type":2
                };


                data['country_id']=response.customer_country_details.country_id;
                data['city_id']=response.customer_country_details.city_id;
                data['customer_id']=response.customer_id;
                data['vendor_id']=response.salon_id;
                data['notification_type']=1;




                tables.notificationsTable.save(data,function(response){

                });
                if(fcmResponse!=undefined && fcmResponse.length!=0 && fcmResponse[0].fcm_id!=undefined)
                {


                    utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
                }





                req.app.io.sockets.in(user_id).emit("accept_salon_order",{"order_id":bookingId });


                /*  tables.bookingsTable.find({"_id":{"$in":orderResponse.booking_id}},function(response)
                 {

                 });*/
                return res.send({"success":true,"message":"booking accepted"});

            });




        }



    });


});
router.post('/sender-details',tokenValidations,function(req,res){
    var user_id=req.body.user_id;
    tables.customerTable.findFields({"_id":user_id},{"first_name":1,"last_name":1},function(response){
        var details={"name":response[0].first_name+'' +response[0].last_name,"profile_pic":''};
        return res.send({"success":true,"details":details})
    });
});
router.post('/start-booking',tokenValidations,function(req,res) {
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.bookingsTable.update({"status":7},{"_id":bookingId},async function(response){

        var  user_id=response.customer_id;
        var  salon_id=response.salon_id;
        tables.bookingsTable.update({"booking_start":new Date()},{"_id":bookingId},function(response){

        });
        var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});

        var salonName='salon';
        if(salonResponse!=undefined)
        {
            salonName=salonResponse[0].salon_name['en'];
        }

        var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

        var data={
            "title":"Service started",
            "message":"Service  started From "+salonName,
            "booking_id":bookingId,
            "type":13
        };
        data['country_id']=response.customer_country_details.country_id;
        data['city_id']=response.customer_country_details.city_id;
        data['customer_id']=response.customer_id;
        data['vendor_id']=response.salon_id;
        data['notification_type']=1;

        tables.notificationsTable.save(data,function(response){

        });

        if(fcmResponse!=undefined && fcmResponse.length!=0)
        {



            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
        }


        req.app.io.sockets.in(salon_id).emit("booking_status",{"booking_id":bookingId ,"status":7});
        req.app.io.sockets.in(user_id).emit("booking_status",{"booking_id":bookingId ,"status":7});

        return res.send({"success":true,"message":"updated", "status":7});

    });
});
router.post('/complete-booking',tokenValidations,async function(req,res){
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var bookingPercentageResult=await tables.constantsTable.getBookingPercentage(utility.VENDOR_TYPE_SALON);
    var bookingPercentage=0;

    if(bookingPercentageResult!=undefined && bookingPercentageResult.length!=0 && bookingPercentageResult[0].booking_percentage!=undefined)
    {
        var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"net_amount":1,"surge":1,"coupon_details":1});
        var netAmount=bookingDetails[0]['net_amount'];
        bookingPercentage=bookingPercentageResult[0].booking_percentage;

        if(bookingDetails[0]['coupon_details']!=undefined)
        {

               if(bookingDetails[0]['coupon_details']['coupon_amount']!=undefined && bookingDetails[0]['coupon_details']['coupon_amount']<netAmount)
               {
                   netAmount = netAmount - bookingDetails[0]['coupon_details']['coupon_amount']
               }
        }
        var amount=(netAmount/100)*bookingPercentage;
        bookingPercentage=amount;

        //{"$multiply":[{"$divide":["$net_amount",100]},utility.mr_miss_booking_fee]}
    }

    tables.bookingsTable.update({"status":8,"booking_end":new Date(),
        'booking_percentage':bookingPercentage},{"_id":bookingId},async function(response){
        var  user_id=response.customer_id;
        var  salon_id=response.salon_id;
        var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});
        var salonName='salon';
        var amount=response.net_amount;
        var currencyCode=response.customer_country_details.currency_code;

        var country=response.customer_country_details.country_id;
        if(salonResponse!=undefined)
        {
            salonName=salonResponse[0].salon_name['en'];
        }
        var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

        var data={
            "title":"Service completed",
            "message":"Service completed From "+salonName,
            "booking_id":bookingId,
            "type":8
        };

        data['country_id'] = response.customer_country_details.country_id;
        data['city_id'] = response.customer_country_details.city_id;
        data['customer_id'] = response.customer_id;
        data['vendor_id'] = response.salon_id;
        data['notification_type'] = 12;


        tables.notificationsTable.save(data,function(response){

        });

        if(fcmResponse!=undefined && fcmResponse.length!=0)
        {
            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
        }
        var customerDetails=await tables.customerTable.findFieldsWithPromises({"_id":user_id},{"strip_id":1});
        if(response.payment_type==2 && customerDetails)
        {
            var stripe=require('../utility/stripPayment');
            var stripId=customerDetails[0].strip_id;
            if(response.coupon_details)
            {
                var couponAmount = response.coupon_amount;
                if (couponAmount)
                {
                    amount = amount - couponAmount;
                }
            }
            var paymentDetails = await stripe.chargeCustomer(amount,currencyCode,stripId);
              if(paymentDetails)
              {
                  var stripFee=(paymentDetails.strip_fee?paymentDetails.strip_fee:0);
                  var updateCustomer=await tables.bookingsTable.updateWithPromises({"payment_status":2,"strip_charge_id":paymentDetails.id,"strip_fee":stripFee},{"_id":bookingId});
              }else
              {

              }
        }
        req.app.io.sockets.in(salon_id).emit("booking_status",{"booking_id":bookingId ,"status":8});

        req.app.io.sockets.in(user_id).emit("booking_status",{"booking_id":bookingId ,"status":8});
        res.send({"success":true,"message":"updated" ,"status":8});
        var salonDetials=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"vendor_id":1});
        var vendorId=salonDetials[0].vendor_id;
        utility.updateInviteAmountVendor(vendorId,amount,country);
    });
});
router.post('/cancel-booking',tokenValidations,async function(req,res){
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"status":1,"net_amount":1});
    if(bookingDetails==undefined ||bookingDetails.length==0){
        return res.send({"success":false,"message":"Invalid Booking"});
    }
    var status=bookingDetails[0].status;
    status = 1;
    if(status==tables.bookingsTable.status['4'].status)
    {
        return res.send({"success":false,"message":"booking already cancelled by user"});
    }
    if(status==tables.bookingsTable.status['5'].status)
    {
        return res.send({"success":false,"message":"booking already cancelled"});
    }
    var response=[];
    response=await tables.bookingsTable.getCancellationDetailsBySalon(bookingId);

    if(response!=undefined && response.length!=0)
    {
        var  bookingTime=response[0].date+" "+response[0].time;
        var now =new Date();
        var timezone=response[0].time_zone;
        bookingTime=moment(bookingTime).tz(timezone).utc().format();
        bookingTime=new Date(bookingTime);

        var   timeDiff = Math.abs(now.getTime() - bookingTime.getTime());

        var   diffDays = Math.floor(timeDiff / 86400000); // days
        var  diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        var  diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000);

        var policyForAcceptance=response[0]['policy_for_acceptance'];
        var cancellationTime='';
        var cancellationTimeType='';
        var cancellationType='';
        var cancellationTypeValue='';
        var text='';
        var acceptanceTotalPolicy=[];
        var arrialTotalPolicy=[];

        var near=response[0].is_notified;

        var type='';
        var cancellValue=0;
        var value = 0;

        if(near==1)
        {
            if (policyForAcceptance['policy'].length != 0)
            {
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++)
                {

                    if(diffDays!=0)
                    {

                        if((diffDays>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                value=acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if(diffHrs!=0)
                    {
                        if((diffHrs>=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                value= acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0)) {
                        if(diffMins>=acceptancePolicy[ac].cancellation_time)
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                value= acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }



                    if(value!=0)
                    {


                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type=utility.CANCELLATION_POLICY_TYPE_RATING;
                            cancellValue=acceptancePolicy[ac].cancellation_type_value;

                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type=utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                            cancellValue=acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT)
                        {
                            type=utility.CANCELLATION_POLICY_TYPE_FLAT;
                            cancellValue= acceptancePolicy[ac].cancellation_type_value ;
                            break;
                        }
                        // acceptanceTotalPolicy.push(text);

                    }

                }
            }
        }else
        {
            var policyForArrival=response[0]['policy_for_arrival'];

            if(policyForArrival['policy'].length!=0)
            {
                var arrivalPolicy=policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for(var ar=0;ar<arrivalPolicy.length;ar++)
                {
                    text='';
                    if(diffDays!=0)
                    {
                        if(diffMins<arrivalPolicy[ar].cancellation_time);
                        {
                            if(acceptancePolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
                            {
                                value=arrivalPolicy[ar].cancellation_time;

                            }
                        }


                    }
                    if(diffHrs!=0)
                    {
                        if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
                        {
                            value=arrivalPolicy[ar].cancellation_time;
                        }

                    }
                    if((diffDays==0) && (diffHrs==0) && (diffMins!=0))
                    {

                        if(diffMins<arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES)
                            {
                                value=arrivalPolicy[ar].cancellation_time;
                            }
                        }
                    }
                    if(value!=0) {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type=utility.CANCELLATION_POLICY_TYPE_RATING;
                            cancellValue= arrivalPolicy[ar].cancellation_type_value;
                             break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type=utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                            cancellValue= arrivalPolicy[ar].cancellation_type_value ;
                            break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            type=utility.CANCELLATION_POLICY_TYPE_FLAT;
                            cancellValue= arrivalPolicy[ar].cancellation_type_value ;
                            break;
                        }

                    }
                }


            }
        }
    }
    var update={};
    var update = {};
    var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":bookingId},{"surge":1,"net_amount":1,"vendor_id":1,"customer_id":1,"salon_id":1});

    if(cancellValue!=0){



        var netAmount=bookingDetails[0]['net_amount'];
        var surge=bookingDetails[0]['surge'];
        if(surge!=undefined)
        {
            netAmount=netAmount*surge;
        }

        var cancellationAmount=cancellValue;
        if(type==utility.CANCELLATION_POLICY_TYPE_PERCENTAGE)
        {
            cancellationAmount=(netAmount/100)*cancellValue;
        }
        if(type==utility.CANCELLATION_POLICY_TYPE_RATING)
        {
            var salonId=bookingDetails[0]['salon_id'];

            var customerId=bookingDetails[0]['customer_id'];
            var save={"booking_id":bookingId,"customer_id":customerId,"salon_id":salonId,"rated_by":1,"rating":cancellationAmount,"review":''};
            var updateRating=await tables.ratingTable.save(save,function(response){

            });
        }
        update['cancellation_amount']=cancellationAmount;
        update['cancell_type']=type;
        update['cancell_type_value']=cancellValue;
        update['cancellation_pay_status']=1;
    }

    update['status']=5;

    tables.bookingsTable.update(update,{"_id":bookingId},async function(response)
    {
        var  user_id=response.customer_id;
        var  salon_id=response.salon_id;
        var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});

        var salonName='salon';
        if(salonResponse!=undefined)
        {
            salonName=salonResponse[0].salon_name['en'];
        }
        var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);


        var data={
            "title":"Service cancelled",
            "message":"Service  cancelled From "+salonName,
            "booking_id":bookingId,
            "type":5
        };
        data['country_id']=response.customer_country_details.country_id;
        data['city_id']=response.customer_country_details.city_id;
        data['customer_id']=response.customer_id;
        data['vendor_id']=response.salon_id;
        data['notification_type']=1;

        tables.notificationsTable.save(data,function(response){

        });


        if(fcmResponse!=undefined && fcmResponse.length!=0)
        {


            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
        }

        req.app.io.sockets.in(salon_id).emit("booking_status",{"booking_id":bookingId ,"status":5});

        req.app.io.sockets.in(user_id).emit("booking_status",{"booking_id":bookingId ,"status":5});



        return res.send({"success":true,"message":"updated"});
    });
});
router.post('/cancellation-policy-details',tokenValidations,async function(req,res){
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;
    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"errocode":1 });
    }
    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }
    var type=req.body.type;
    var  response=[];
    var bookingTime='';
    var now='';
    var timeDiff='';
    var diffDays='';
    var diffHrs='';
    var diffMins='';
    if(type==2)
    {
        /*response= await tables.bookingsTable.*/
        response=await tables.bookingsTable.getCancellationDetailsBySalon(bookingId);
        bookingTime=response[0].date+" "+response[0].time;
        now =new Date();
        var timezone=response[0].time_zone;
        bookingTime=moment(bookingTime).tz(timezone).utc().format();
        bookingTime=new Date(bookingTime);

        timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        diffDays = Math.floor(timeDiff / 86400000); // days
        diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
    }else
    {
        response= await tables.bookingsTable.getStylistCancellationDetails(bookingId);
        bookingTime=response[0].created;
        now =new Date();
        bookingTime=new Date(bookingTime);
        timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        diffDays = Math.floor(timeDiff / 86400000); // days
        diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
    }

    if(response!=undefined && response.length!=0){
        var policyForAcceptance=response[0]['policy_for_acceptance'];
        var cancellationTime='';
        var cancellationTimeType='';
        var cancellationType='';
        var cancellationTypeValue='';
        var text='';
        var acceptanceTotalPolicy=[];
        var arrialTotalPolicy=[];

        var near=response[0].is_notified;

        if(near==1) {
            if (policyForAcceptance['policy'].length != 0) {
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {
                    text = '';
                    if(diffDays!=0)
                    {

                        if((diffDays<=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                text += '' + acceptancePolicy[ac].cancellation_time + " days";

                            }
                        }
                    }
                    if(diffHrs!=0)
                    {
                        if((diffHrs<=acceptancePolicy[ac].cancellation_time))
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                text += '' + acceptancePolicy[ac].cancellation_time + "  hours ";
                            }
                        }
                    }
                    if(!(diffDays==0) && !(diffHrs==0) && !(diffMins!=0)) {
                        if(diffMins<acceptancePolicy[ac].cancellation_time)
                        {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                text += ' ' + acceptancePolicy[ac].cancellation_time + "  minutes ";
                            }
                        }
                    }
                    if(text!='')
                    {
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += " rating will be charged" + acceptancePolicy[ac].cancellation_type_value
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text += " percentage will be charged" + acceptancePolicy[ac].cancellation_type_value
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += " " + acceptancePolicy[ac].cancellation_type_value + " Flat amount will be charged ";
                        }
                        acceptanceTotalPolicy.push(text);
                           break;
                    }

                }
            }
        }else{
            var policyForArrival=response[0]['policy_for_arrival'];
            if(policyForArrival['policy'].length!=0)
            {
                var arrivalPolicy=policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);
                for(var ar=0;ar<arrivalPolicy.length;ar++)
                {
                    text='';
                    if(diffDays!=0)
                    {
                        if(diffMins<arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
                            {
                                text +="policy for days "+arrivalPolicy[ar].cancellation_time;

                            }
                        }
                    }
                    if(diffHrs!=0)
                    {
                        if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
                        {
                            text +="policy for hours "+acceptancePolicy[ar].cancellation_time;
                        }
                    }
                    if(!(diffDays==0) && !(diffHrs==0) && !(diffMins!=0))
                    {
                        if(diffMins<arrivalPolicy[ar].cancellation_time);
                        {
                            if(arrivalPolicy[ar].cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES)
                            {
                                text +="policy for minutes "+arrivalPolicy[ar].cancellation_time;
                            }
                        }
                    }
                    if(text!='') {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            text += "rating will be charged " + arrivalPolicy[ar].cancellation_type_value
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            text += " percentage will be charged " + arrivalPolicy[ar].cancellation_type_value
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            text += " Flat will be charged " + arrivalPolicy[ar].cancellation_type_value
                        }
                        arrialTotalPolicy.push(text);
                        break;
                    }
                }


            }
        }

        var cancel='';
        if(near==1&& acceptanceTotalPolicy.length!=0)
        {

            cancel=acceptanceTotalPolicy[0];
        }
        else if(arrialTotalPolicy.length!=0)
        {
            cancel=arrialTotalPolicy[0];
        }
        if(cancel=='')
        {
            cancel="no cancellation fee";
        }
        return res.send({"success":true,"text":cancel})
    }else
    {
        if(response!=undefined){
            return res.send({
                "success": true,
                "text": "no cancellation policy"
            });
        }else{
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }

    }

});
router.post('/update-fcm',tokenValidations,async function(req,res)
{
    var deviceId=req.body.device_id;
    var vendorId=req.body.vendor_id;
    var salonId=req.body.salon_id;
    var fcmId=req.body.fcm_id;
    var deviceType=req.body.device_type;
    if(vendorId=='' || vendorId==undefined)
    // {
    //     return res.send({
    //         "success": false,
    //         "message": "Invalid Request",
    //         "error_code":1
    //     });
    // }
        if(fcmId=='' || fcmId==undefined)
        {
            return res.send({
                "success": false,
                "message": "Invalid Request",
                "error_code":2
            });
        }
    if(deviceId=='' ||deviceId==undefined)
    {
        return res.send({
            "success": false,
            "message": "Invalid Request",
            "error_code":3
        });
    }
    deviceType = parseInt(deviceType);
    if (isNaN(deviceType)) {
        deviceType = 1;
    }
    var fcmData={};
    fcmData['fcm_id']=fcmId;
    fcmData["device_id"]=deviceId;
    fcmData["device_type"]=deviceType;
    var tmUserId='';


    if(salonId!='' && salonId!=undefined)
    {
        var vendorDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"tm_user_id":1});
        if(vendorDetails==undefined || vendorDetails.length==0)
        {
            return res.send({"success":false,"message":"Invalid User"});
        }
        tmUserId= vendorDetails[0].tm_user_id
    }else
    {
        var salonDetails=await tables.vendorTable.findFieldsWithPromises({"_id":vendorId},{"tm_user_id":1});
        if(salonDetails==undefined || salonDetails.length==0)
        {
            return res.send({"success":false,"message":"Invalid User"});
        }
        tmUserId= salonDetails[0].tm_user_id
    }
    if(tmUserId!=0 && tmUserId!=''){
        tables.fcmTable.update(fcmData,{"vendor_id":vendorId},async function(response){
            if(response==null){
                var save={};
                save['fcm']=[];
                save['fcm'].push(fcmData);
                save['vendor_id']=vendorId;
                tables.fcmTable.save(save,function(response){
                });
            }

            var fcmUpdate= await  utility.updateFcm({"fcm_token":fcmId,"user_id":tmUserId,"device_type":deviceType},utility.user_role_stylist);


        });
    }

    return res.send({"success":true});
});
router.post('/documents-list',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.salonTable.getCountryDocuments(salonId,languagesCode,function(response){

        return res.send({"success":true,"documents":response});
    });
});
router.post('/update-documents',tokenValidations,async function(req,res){
    var salonId=req.body.salon_id;
    var documents=req.body.documents;
    var updateDocuments=req.body.update_documents;

    if(documents!=undefined && documents!='')
    {
        documents=JSON.parse(documents);
    }else
    {
        documents=[];
    }

    if(updateDocuments!='' && updateDocuments!=undefined){
        updateDocuments=JSON.parse(updateDocuments);
    }else
    {
        updateDocuments=[];
    }

    var isDocumentUploaded=false;
    var salonDocuemnts=[];
    if(documents.length!=0)
    {
        var tmp={};
        for(var d=0;d<documents.length;d++)
        {
            tmp={};
            tmp['type']=0;
            tmp['document_reference_id']=documents[d].document_id;
            tmp['path']=documents[d].path;
            tmp['document_name']=documents[d].document_name;
            tmp['salon_id']=salonId;
            var exporyDate = documents[d].expiry_date;

            if(exporyDate == undefined || exporyDate == null || !exporyDate){
                exporyDate = "";
            }

            if(!exporyDate)
            {

                tmp['expiry_date'] = exporyDate;
                tmp['is_expiry_date'] = 0;
            }else
            {
                tmp['expiry_date']=exporyDate;
                tmp['is_expiry_date']=1;
            }
            if(documents[d].path ==undefined || documents[d].path=='')
            {
                return res.send({"success":false,"message":"invalid file"});
            }
            var path=documents[d].path.split('.');
            var ext=path[path.length-1];
            ext=ext.toLowerCase();
            if(utility.documentsExtensions.indexOf(ext)=== -1){
                return res.send({"success":false,"message":"invalid file ext"});
            }
            tmp['agent_status']=0;
            tmp['manager_status']=0;
            tmp['admin_status']=0;
            isDocumentUploaded=true;
            salonDocuemnts.push(tmp);
        }
    }
    var update={};

    if(updateDocuments.length!=0)
    {

        for(var u=0;u<updateDocuments.length;u++)
        {
            update={};
            var documentId=updateDocuments[u]['_id'];
            var documentpath=updateDocuments[u]['path'];

            if(documentId==undefined || documentId=='')
            {
                tmp={};
                tmp['type']=0;
                tmp['document_reference_id']=updateDocuments[u].document_reference_id;
                tmp['path']=updateDocuments[u].path;
                tmp['salon_id']=salonId;
                var exporyDate = updateDocuments[u].expiry_date;

                if(exporyDate == undefined || exporyDate == null || !exporyDate){
                    exporyDate = "";
                }

                if(!exporyDate)
                {

                    tmp['expiry_date'] = exporyDate;
                    tmp['is_expiry_date'] = 0;
                }else
                {
                    tmp['expiry_date']=exporyDate;
                    tmp['is_expiry_date']=1;
                }
                if(updateDocuments[u].path ==undefined || updateDocuments[u].path=='')
                {
                    return res.send({"success":false,"message":"invalid file"});
                }
                var path=updateDocuments[u].path.split('.');
                var ext=path[path.length-1];
                ext=ext.toLowerCase();
                if(utility.documentsExtensions.indexOf(ext)=== -1){
                    return res.send({"success":false,"message":"invalid file ext"});
                }
                tmp['agent_status']=0;
                tmp['manager_status']=0;
                tmp['admin_status']=0;
                isDocumentUploaded=true;

                salonDocuemnts.push(tmp);
            }else{
                if(updateDocuments[u]['expiry_date']!=undefined)
                {
                    var expiryDate=updateDocuments[u]['expiry_date'];
                    update['expiry_date']=expiryDate;
                }
                if(documentpath!=undefined)
                {
                    if(updateDocuments[u]['path'] ==undefined || updateDocuments[u]['path']=='')
                    {
                        return res.send({"success":false,"message":"invalid file"});
                    }
                    var path=updateDocuments[u].path.split('.');
                    var ext=path[path.length-1];

                    ext=ext.toLowerCase();

                    if(utility.documentsExtensions.indexOf(ext)=== -1){
                        return res.send({"success":false,"message":"invalid file"});
                    }
                    update['path'] = documentpath;
                    update['agent_status'] = 0;
                    update['manager_status'] = 0;
                    isDocumentUploaded=true;
                    var updateResponse=await tables.salonDocuments.updateWithPromises(update,{"_id":documentId});
                }
            }

        }
    }
    if(salonDocuemnts.length!=0)
    {
        tables.salonDocuments.insertMany(salonDocuemnts, function(response)
        {
            if(isDocumentUploaded)
            {
                tables.salonTable.update({"agent_status":0,"manager_status":0},{"_id":salonId},function(response){
                });
                return    res.send({
                    "success": true,
                    "message": "updated"
                })
            }
            return    res.send({
                "success": true,
                "message": "no documents is  updated"
            });
        });
    }else
    {
        if(isDocumentUploaded)
        {
            tables.salonTable.update({"agent_status":0,"manager_status":0},{"_id":salonId},function(response){

            });

            return    res.send({
                "success": true,
                "message": "updated"
            })
        }
        return    res.send({
            "success": true,
            "message": "no documents is  updated"
        })
    }
});
router.post('/aggrements',tokenValidations,function(req,res){

    return res.send({"success":true,"message":'updated'})
});
/*router.post('/bookings',tokenValidations,function(req,res){
      var vendorId=req.body.vendor_id;
      tables.vendorTable.getAllsalonBookings()

});*/
function updateSalonStatus(salonId,status){
    tables.salonTable.updateStatus({"completed_steps":parseInt(status)},{"_id":salonId},function(response){
        if(response!=undefined && response.length!=0)
        {
            var status=response.completed_steps;
            if(status!=0 && status.length==6)
            {
                tables.salonTable.update({"status":13},{"_id":salonId},function(response){

                });
            }
        }
    });
}
router.post("/rating-list",tokenValidations,function(req,res){

});
router.post('/accept-order',tokenValidations,function(req,res){
    var orderId=req.body.order_id;
    var languageCode = req.body.language_code;

    tables.ordersTable.checkOrderDetails(orderId,async function(response){
        if(response!=undefined){
            var orderResponse=response;
            for(var o=0;o<orderResponse.length;o++)
            {
                var time=orderResponse[o].time;
                var bookingId=orderResponse[o]._id;
                var date=orderResponse[o].date;
                if(date==undefined || time==undefined)
                {
                    var preferredTime=orderResponse[o].cartDetails.time;
                    var preferredDate=orderResponse[o].cartDetails.date;
                    var preferredEmployee=orderResponse[o].cartDetails.employee_id;
                    if(preferredEmployee==undefined )
                    {
                        return  res.send({"success":false,"message":"Please assign employee , time and date for the booking","booking_id":bookingId});

                    }
                    if(preferredDate==undefined){
                        return  res.send({"success":false,"message":"Please Select the  date for the booking","booking_id":bookingId});
                    }
                    if(preferredTime==undefined){
                        return  res.send({"success":false,"message":"Please Select the time for the booking","booking_id":bookingId});
                    }
                    var timeType=orderResponse[o].cartDetails.time_type;
                    var selectedService=orderResponse[o].cartDetails.service_id;
                    var selectedServiceFor=orderResponse[o].cartDetails.selected_for;
                    var selectedSalon=orderResponse[o].cartDetails.salon_id;
                    var timezone=orderResponse[o].cartDetails.timezone;
                    var selectedServiceTimeResponse=await tables.salonServicesTable.findFieldsWithPromises({"salon_id":selectedSalon,"service_id":selectedService,"service_for":selectedServiceFor},{"service_time":1});

                    if(selectedServiceTimeResponse!=undefined){
                        var endServiceTime=selectedServiceTimeResponse[0].service_time;
                    }
                    var assignTimeSlot=[];
                    if(timeType==1){
                        var format = 'YYYY-MM-DD HH:mm';
                        preferredTime=preferredTime.split(":");
                        var startTime = parseIn(preferredTime[0],preferredTime[1]);
                        var endTime=parseIn(preferredTime[0],preferredTime[1]);
                        endTime.setMinutes(startTime.getMinutes()+parseInt(endServiceTime));
                        startTime=startTime.toTimeString().substring(0, 5);
                        endTime=endTime.toTimeString().substring(0, 5);

                        var assignUtcDateTime=moment.tz(preferredDate+" "+startTime,format,timezone).utc().format(format);

                        // var assignUtcEndTime=new Date(assignDate+" "+endTime);
                        //  assignUtcDateTime.setTimezone(timezone);

                        // assignUtcEndTime.setTimezone(timezone);

                        var  assignUtcEndTime=moment.tz(preferredDate+" "+endTime,format,timezone).utc().format(format) ;
                        var checkTimeSolt=await tables.salonEmployeesTable.checkEmployeeTime(preferredEmployee,assignUtcDateTime,assignUtcEndTime,preferredDate);
                        if (checkTimeSolt != undefined && checkTimeSolt.length == 0)
                        {
                            time=preferredTime[0]+":"+preferredTime[1];
                            //end=preferredTime[0]+":"+preferredTime[1];
                            assignTimeSlot=await tables.bookingsTable.updateWithPromises({"status":2,"employee_id":preferredEmployee,"service_time":endServiceTime,"time":time,"end_time":endTime,"date":preferredDate},{"_id":bookingId});
                        }else
                        {
                            return res.send({"success":false,"message":"select another TimeSlot for the booking",
                                "booking_id":bookingId})
                        }
                    }else{
                        var timeSlots=[];
                        var preferredTimeBetween=preferredTime.split("-");
                        var preferredTimeStart=preferredTimeBetween[0];
                        var preferredTimeEnd=preferredTimeBetween[1];
                        var startTime=parseIn(preferredTimeStart[0],preferredTimeStart[1]);
                        var endTime=parseIn(preferredTimeEnd[0],preferredTimeEnd[1]);
                        var end = new Date(preferredDate);
                        var day = end.getDay();
                        if(day==0)
                        {
                            day=7;
                        }
                        date=preferredDate;
                        timeSlots=await  timeIntervel(startTime,endTime,preferredEmployee,preferredDate,day,endServiceTime,timezone);

                        if(timeSlots.length!=0)
                        {
                            preferredTime=timeSlots[0];
                            var startTime = parseIn(preferredTime[0],preferredTime[1]);
                            var endTime=parseIn(preferredTime[0],preferredTime[1]);
                            endTime.setMinutes(startTime.getMinutes()+parseInt(endServiceTime));
                            startTime=startTime.toTimeString().substring(0, 5);
                            endTime=endTime.toTimeString().substring(0, 5);
                            endTime=endTime.split(":");
                            startTime=startTime.split(":");

                            assignTimeSlot=await tables.bookingsTable.updateWithPromises({"status":2,"service_time":endServiceTime,"employee_id":preferredEmployee,"time":startTime[0]+":"+startTime[1],"end_time":endTime[0]+":"+endTime[1]},{"_id":bookingId});
                        }else{
                            return res.send({"success":false,"message":"select another time slots ","booking_id":bookingId});
                        }
                    }


                }else
                {
                    var acceptBooking=await tables.bookingsTable.updateWithPromises({"status":2},{"_id":bookingId})
                }
            }
            var  user_id=orderResponse[0].customer_id;
            var  salon_id=orderResponse[0].salon_id;
            var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});
            var salonName='salon';
            if(salonResponse!=undefined)
            {
                salonName=salonResponse[0].salon_name['en'];
            }
            var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

          var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":orderResponse[0]._id},{"customer_details":1,"customer_country_details":1,"customer_id":1,"salon_id":1});


          var data={
                "title":"Booking acceptance",
                "message":"Booking Accepted From "+salonName,
                "order_id":orderId,
                "type":2
            };
            data['country_id']=bookingDetails[0].customer_country_details.country_id;
            data['city_id']=bookingDetails[0].customer_country_details.city_id;
            data['customer_id']=bookingDetails[0].customer_id;
            data['vendor_id']=bookingDetails[0].salon_id;
            data['notification_type']=1;

            tables.notificationsTable.save(data,function(response){

            });

            if(fcmResponse!=undefined && fcmResponse.length!=0)
            {

                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
            }


            req.app.io.sockets.in(user_id).emit("accept_salon_order",{"order_id":orderId });
            req.app.io.sockets.in(salon_id).emit("order_status",{"order_id":orderId ,"status":tables.bookingsTable.status["2"].status});


            return res.send({"success":true,"message":utility.errorMessages["order accepted"][languageCode]});
        }else
        {
            tables.ordersTable.update({"status":2},{_id:orderId},async function(orderResponse){
                if(orderResponse!=undefined && orderResponse.length!=0)
                {
                    tables.bookingsTable.updateMany({"status":2},{"_id":{"$in":orderResponse.booking_id}},async function(response)
                    {
                        var  user_id=orderResponse.customer_id;
                        var  salon_id=orderResponse.salon_id;
                        var salonResponse=await tables.salonTable.findFieldsWithPromises({"_id":salon_id},{"salon_name":1});
                        var salonName='salon';
                        if(salonResponse!=undefined){
                            salonName=salonResponse[0].salon_name;
                        }
                        var fcmResponse=await tables.fcmTable.getFcmIdsCustomer(user_id);

                        var data={
                            "title":"Booking acceptance",
                            "message":"Booking Accepted From "+salonName,
                            "order_id":orderId,
                            "type":2
                        };
                        var bookingDetails=await tables.bookingsTable.findFieldsWithPromises({"_id":{"$in":orderResponse.booking_id}},{"customer_country_details":1,city_id:1,"country_id":1,"salon_id":1})
                        data['country_id']=bookingDetails[0].customer_country_details.country_id;
                        data['city_id']=bookingDetails[0].customer_country_details.city_id;
                        data['customer_id']=bookingDetails[0].customer_id;
                        data['vendor_id']=bookingDetails[0].salon_id;
                        data['notification_type']=1;

                        tables.notificationsTable.save(data,function(response){

                        });

                        if(fcmResponse!=undefined && fcmResponse.length!=0)
                        {

                            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id,data);
                        }
                        req.app.io.sockets.in(user_id).emit("accept_salon_order",{"order_id":orderId });


                        /*  tables.bookingsTable.find({"_id":{"$in":orderResponse.booking_id}},function(response)
                         {

                         });*/
                    });




                }


            }) ;

        }
    });
});
function parseIn(hours,min)
{
    var d = new Date();

    d.setHours(hours);
    d.setMinutes(min);
    return d;
}
function parseInTimeZone(hours,min,timezone)
{
    var d = new Date();
    d.setTimezone(timezone);
    d.setHours(hours);
    d.setMinutes(min);
    return d;
}
function parseInDate(date_time)
{
    var d = new Date();
    d.setHours(date_time.substring(11,13));
    d.setMinutes(date_time.substring(14,16));
    return d;
}
router.post('/check-status',tokenValidations,function(req,res)
{

    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    tables.salonTable.find({'_id':salonId},function(response)
    {

        return res.send({
            "success": true,
            "salon_id" :salonId,
            "manager_status":response[0].manager_status,
            "agent_status":response[0].agent_status
        });

    });
});
router.post('/total-earnings',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var languagesCode = req.body.language_code;
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    var salonId='';
    var employeeId='';
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
        salonId=req.body.salon_id;

    if(employeeType==1){
        employeeId=req.body.employee_id;
    }
    var dateFormat="YYYY-MM-DD";
    var format = 'YYYY-MM-DD HH:mm';
    var moment=require('moment');
    var startTime="00:00";
    var endTime="23:59";
    startDate=moment(startDate).format(dateFormat);
    endDate=moment(endDate).format(dateFormat);

    var startDateTime=  moment(startDate+" "+startTime).format(format);
  var   endDateTime =  moment(endDate+" "+endTime).format(format);
    tables.bookingsTable.getSalonDailyEarings(startDateTime,endDateTime,salonId,employeeId,async function(response){

        if(response!=undefined && response.length!=0){
            var currency=await tables.salonTable.getCurrency(salonId);
            var currencyValues={"currency_code":"INR","currency":"₹"};
            if(currency!=undefined && currency.length!=0 && currency[0].currency_code!=undefined)
            {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }

            var promotionAmountDetails=await tables.salonTable.promotionAmount(vendorId,salonId,startDateTime,endDateTime);
            var promotionAmount=0;
            if(promotionAmountDetails!=undefined &&promotionAmountDetails.length!=0)
            {
                promotionAmount=promotionAmountDetails[0]['amount'];
            }

            response[0]['promotion_amount'] = promotionAmount;

            return res.send({"success":true,"total_earnings":response[0],"currency":currencyValues});
        }else{
            var currency=await tables.salonTable.getCurrency(salonId);
            var currencyValues={"currency_code":"INR","currency":"₹"};
            if(currency!=undefined && currency.length!=0 && currency[0].currency_code!=undefined){
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            return res.send({"success":true,"total_earnings":{},"currency":currencyValues});

        }
    });
});
router.post('/bookings-daily',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var limit=req.body.limit;
    var offset=req.body.offset;
    var languagesCode = req.body.language_code;
    var salonId='';
    var employeeId='';
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if(offset=='' || offset==undefined)
    {
        offset=0;
    }
    if(limit=='' || limit==undefined)
    {
        limit=10;
    }
    offset=parseInt(offset);
    limit=parseInt(limit);
    salonId=req.body.salon_id;


    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }
    var dateFormat="YYYY-MM-DD";
    var format = 'YYYY-MM-DD HH:mm';
    var moment=require('moment');
    var startTime="00:00";
    var endTime="23:59";
    startDate=moment(startDate).format(dateFormat);
    endDate=moment(endDate).format(dateFormat);

    var startDateTime=  moment(startDate+" "+startTime).format(format);
    var   endDateTime =  moment(endDate+" "+endTime).format(format);

    /*endDate= moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1,'d').format("YYYY-MM-DD HH:mm:ss");*/
    tables.bookingsTable.salonBookingList(startDateTime,endDateTime,limit,offset,salonId,employeeId,languagesCode,async function(response){
        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }


        return res.send({"success":true,"bookings":response,"currency":currencyValues});
    });
});
router.post('/bookings-count',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var limit=req.body.limit;
    var offset=req.body.offset;
    var languagesCode = req.body.language_code;
    var salonId='';
    var employeeId='';
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    salonId=req.body.salon_id;
    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }
    var dateFormat="YYYY-MM-DD";
    var format = 'YYYY-MM-DD HH:mm';
    var moment=require('moment');
    var startTime="00:00";
    var endTime="23:59";
    startDate=moment(startDate).format(dateFormat);
    endDate=moment(endDate).format(dateFormat);
    var startDateTime=  moment(startDate+" "+startTime).format(format);
    var   endDateTime =  moment(endDate+" "+endTime).format(format);

    /*endDate= moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1,'d').format("YYYY-MM-DD HH:mm:ss");*/
    tables.bookingsTable.salonBookingCount(startDateTime,endDateTime,salonId,employeeId,languagesCode,async function(response)
    {
        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        return res.send({"success":true,"bookings_count":(response.length &&response[0]['bookings_count']?response[0]['bookings_count']:0)});
    });
});
router.post('/bookings-daily-packages',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var limit=req.body.limit;
    var offset=req.body.offset;
    var languagesCode = req.body.language_code;
    var salonId='';
    var employeeId='';
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if(offset=='' || offset==undefined)
    {
        offset=0;
    }
    if(limit=='' || limit==undefined)
    {
        limit=10;
    }
    offset=parseInt(offset);
    limit=parseInt(limit);
    if(salonType==1)
    {
        salonId=req.body.salon_id;
    }
    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }
    endDate= moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1,'d').format("YYYY-MM-DD HH:mm:ss");
    tables.bookingsTable.salonBookingListPackage(vendorId,startDate,endDate,limit,offset,salonId,employeeId,async function(response){
        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }


        return res.send({"success":true,"bookings":response,"currency":currencyValues});
    });
});
router.post('/bookings-list',tokenValidations,function(req,res)
{
    var vendorId=req.body.vendor_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if(salonId==undefined)
    {
        salonId=''
    }
    if ((vendorId == '' || vendorId == undefined) )
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.salonTable.salonBooingsList(vendorId,salonId,languagesCode,function(response)
    {
        return res.send({"success":true,"bookings":response});
    });
});
router.post('/weekly-earnings',tokenValidations,function(req,res)
{
    var vendorId=req.body.vendor_id;
    var languagesCode = req.body.language_code;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    var salonId='';
    var employeeId='';
    var salonType=req.body.salon_type;
    var employeeType=req.body.employee_type;

    if (startDate == '' || startDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });

    }

    if (endDate == '' || endDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":3
        });
    }

     salonId=req.body.salon_id;
    if(employeeType==1)
    {
        employeeId=req.body.employee_id;
    }

    var dateFormat="YYYY-MM-DD";
    var format = 'YYYY-MM-DD HH:mm';
    var moment=require('moment');
    var startTime="00:00";
    var endTime="23:59";
    startDate=moment(startDate).format(dateFormat);
    endDate=moment(endDate).format(dateFormat);


    var startDateTime=  moment(startDate+" "+startTime).format(format);
    var   endDateTime =  moment(endDate+" "+endTime).format(format);
    tables.bookingsTable.getSalonEarings(startDateTime,endDateTime,salonId,employeeId,async function(response){

        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0 && currency[0].currency_code!=undefined)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        return res.send({"success":true,"earnings":response,"currency":currencyValues});
    });
});
router.post('/monthly-earnings',tokenValidations,function(req,res){
    var vendorId=req.body.vendor_id;
    var languagesCode = req.body.language_code;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    var salonId='';
    var employeeId='';
    var salonType=req.body.salon_type;


    var employeeType=req.body.employee_type;
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if (startDate == '' || startDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }

    if (endDate == '' || endDate == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":3
        });
    }
    if(salonType==1){
        salonId=req.body.salon_id;
    }
    if(employeeType==1){
        employeeId=req.body.employee_id;
    }
    endDate= moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1,'d').format("YYYY-MM-DD HH:mm:ss");

    tables.bookingsTable.getSalonMonthlyEarings(vendorId,startDate,endDate,salonId,employeeId,function(response)
    {
        return res.send({"success":true,"earnings":response});
    });
});
router.post('/earned-promotions-list',tokenValidations,async function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode=req.body.languages_code;
    var startDate=req.body.start_date;
    var endDate=req.body.end_date;
    var languageCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {

        return res.send({

            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    var moment=require('moment-timezone');

    endDate= moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1,'d').format("YYYY-MM-DD HH:mm:ss");

    tables.salonTable.promotionList(salonId,startDate,endDate,languageCode,async function(response)
    {

        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues = { "currency_code":"INR","currency":"₹" };

        if(currency!=undefined || currency.length!=0)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }

        res.send({"success":true,"promotions":response,"currency":currencyValues});

    });
});
router.post('/update-status',tokenValidations,async function(req,res)
{

    var salonId=req.body.salon_id;
    var type=req.body.type;
    var status=req.body.active_status;
    var languageCode = req.body.language_code;

    /*   tables.salonTable.update({"active_status":status},{"_id":salonId},function(response){
       if(response!=undefined){
           return res.send({"success":true,"message":"update"});
       } else
       {
           return res.send({"success":false,"message":"try again"});
       }

   });*/

    var salonDetails= await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"is_locked":1});
      if(salonDetails.length==0)
      {
        return res.send({"success":false,"message":"try again"});
      }

        if(salonDetails[0].is_locked!=undefined && salonDetails[0].is_locked==2)
        {

         return  res.send({"success":false,"message":utility.errorMessages["This salon is blocked please contact admin"][languageCode]})

        }

       var update={};

       var bookingStatus=req.body.booking_status;

       if(status!='')
       {
          status=parseInt(status);
           update['active_status']=status;
       }

       if(bookingStatus!='')
       {
          bookingStatus=parseInt(bookingStatus);
          update['booking_status']=bookingStatus;
       }

       if(bookingStatus==tables.bookingsTable.status["7"]['status'])
       {
          update['booking_started']=new Date();
       }

       if(bookingStatus == tables.bookingsTable.status["8"]['status'])
       {
        update['booking_ended']=new Date();
       }

    tables.salonTable.update(update,{"_id":salonId},function(response){
        if(response!=undefined)
        {
            let vendorId=response.vendor_id;
                  update['salon_id']=salonId;

            req.app.io.sockets.in(salonId).emit("salon_status",update);
            req.app.io.sockets.in(vendorId).emit("salon_status",update);
            return res.send({"success":true,"message":"update"});
        }else{
            return res.send({"success":false,"message":"try again"});
        }
    });
});
router.post('/update-employee-status',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var employeeId=req.body.employee_id;
    var type=req.body.type;
    var status=req.body.active_status;
    var serveOut=req.body.serve_out;
    /*   tables.salonTable.update({"active_status":status},{"_id":salonId},function(response){
       if(response!=undefined){
           return res.send({"success":true,"message":"update"});
       } else
       {
           return res.send({"success":false,"message":"try again"});
       }

   });*/
    var update={};
    var bookingStatus=req.body.booking_status;
    if(bookingStatus!=undefined && bookingStatus!=''){
        bookingStatus=parseInt(bookingStatus);
        update["booking_status"]=bookingStatus
    }

    if(status!=undefined && status!=''){
        status=parseInt(status);
        update['status']=status;
    }

    if(serveOut!=undefined && serveOut!=''){
        serveOut=parseInt(serveOut);
        update['serve_out']=serveOut;
    }

    tables.salonEmployeesTable.update(update,{"_id":employeeId},async function(response){
        if(response!=undefined){
            let salonId=response.salon_id;

            var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
            let vendorId=salonDetails[0].vendor_id;
            update['salon_id']=salonId;
            update['employee_id']=employeeId;

            req.app.io.sockets.in(salonId).emit("employee_status",update);
            req.app.io.sockets.in(vendorId).emit("employee_status",update);
            return res.send({"success":true,"message":"update"});
        }else{
            return res.send({"success":false,"message":"try again"});
        }
    });

});
router.post("/vendor-details",tokenValidations,function(req,res){
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.vendorTable.vendorDetails(vendorId,{"mobile":1,"mobile_country":1,"email":1,
        "first_name":"$first_name."+languagesCode,
        "last_name":"$last_name."+languagesCode
    },function(response){
        if(response!=undefined && response.length!=0){
            return res.send({"success":true,"details":response[0]});
        }else
        {
            return res.send({"success":false,"message":"try again"});
        }
    });
});
router.post('/salon-aggrement',tokenValidations,async function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == undefined){
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"errocode": 1
        });
    }

    var vendorReponse=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"country_id":1});

    if(vendorReponse!=undefined && vendorReponse.length!=0){
        var country=vendorReponse[0].country_id;
    }else{
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }

    var  countryResponse=await tables.countryTable.findFieldsWithPromises({"_id":country},{"salon_agreement":1});
    var aggrements='';
    if(countryResponse!=undefined && countryResponse.length!=0)
    {
        aggrements=(countryResponse[0].salon_agreement!=undefined&&countryResponse[0].salon_agreement[languagesCode]?countryResponse[0].salon_agreement[languagesCode]:'');
    }

    return res.send({"success":true,"aggrement":aggrements});
});

router.post('/with-draw-amount',tokenValidations,function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.vendorTable.withDrawAmountSalon(salonId,async function(response)
    {
        var amount=0;
        var cardDetails=await  tables.salonTable.getPaymentCard(salonId);
        if(response!=undefined  && response.length!=0)
        {
            var cashAmount=(response[0]['cashAmount'][0]?response[0]['cashAmount'][0]['amount']:0);
            var cashbookingPercentageAmount=(response[0]['cashAmount'][0]?response[0]['cashAmount'][0]['booking_percentage']:0);
            var cardAmount=(response[0]['cardAmount'][0]?response[0]['cardAmount'][0]['amount']:0);
            var cardbookingPercentageAmount=(response[0]['cardAmount'][0]?response[0]['cardAmount'][0]['booking_percentage']:0);
            var cancellationAmount=(response[0]['cancellationAmount'][0]?response[0]['cancellationAmount'][0]['cancellation_amount']:0);
            amount = cardAmount-cashbookingPercentageAmount-cancellationAmount;
        }
        /*  var cardDetails=[];*/

        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0){
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        if(cardDetails!=undefined && cardDetails.length!=0 && cardDetails[0].payment!=undefined)
        {
            cardDetails=cardDetails[0].payment
        }
        return res.send({"success":true,"amount":amount,"payment":cardDetails,"currency":currency});
    });


});
router.post('/transfer-amount',tokenValidations,function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;

    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.vendorTable.withDrawAmountSalon(salonId,async function(response)
    {
        var amount=0;
        if(response!=undefined && response.length!=0)
        {
            var cashAmount=(response[0]['cashAmount'][0]?response[0]['cashAmount'][0]['amount']:0);
            var cashbookingPercentageAmount=(response[0]['cashAmount'][0]?response[0]['cashAmount'][0]['booking_percentage']:0);
            var cardAmount=(response[0]['cardAmount'][0]?response[0]['cardAmount'][0]['amount']:0);
            var cardbookingPercentageAmount=(response[0]['cardAmount'][0]?response[0]['cardAmount'][0]['booking_percentage']:0);
            var cancellationAmount=(response[0]['cancellationAmount'][0]?response[0]['cancellationAmount'][0]['cancellation_amount']:0);
            amount = cardAmount-cashbookingPercentageAmount-cancellationAmount;
        }
        
        if(amount!=0)
        {
            var stripe=require('../utility/stripPayment');
            var currency=await tables.salonTable.getCurrency(salonId);
            var currencyValues={"currency_code":"INR","currency":"₹"};
            if(currency!=undefined && currency.length!=0)
            {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }

            var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"strip_account_id":1});

              if(salonDetails && salonDetails.length && salonDetails[0]['strip_account_id'])
              {
                 var paymentResponse=await  stripe.transferAmount(amount,currencyValues.currency_code,salonDetails[0]['strip_account_id']);

                  if(paymentResponse)
                  {
                      var updateResponse=await tables.bookingsTable.updateManyWithPromises({"vendor_payment_status":1},{"salon_id":salonId,"status":8});
                      var updatePayment=await tables.vendorTable.updatePayment({"amount":amount,"created_at":new  Date(),"status":1,transfer:paymentResponse},{"_id":salonId});
                      return res.send({"success":true,"message":utility.errorMessages["amount transfered"][languagesCode]});

                  }else{
                      return res.send({"success":false,"message":"No Balance in strip to transfer "})

                  }
                     }else{
                  return res.send({"success":false,"message":"Please Add Card to Transfer"})

              }

        }else{
            return res.send({"success":false,"message":utility.errorMessages["no amount to transfer"][languagesCode]});
        }
    });


});
router.post('/with-draw-list',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.vendorTable.withDrawalList(salonId,async function(response){
        if(response!=undefined && response.length!=0)
        {
            var currency=await tables.salonTable.getCurrency(salonId);
            var currencyValues={"currency_code":"INR","currency":"₹"};
            if(currency!=undefined && currency.length!=0)
            {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            response=response.reverse();
            return res.send({"success":true,"details":response,"currency":currency});
        }else{
            return res.send({"success":true,"details":[]});
        }

    });
});
router.post("/promotions", tokenValidations,async function(req , res){
    //  return res.send({"success":true,"coupon_codes":[]});
    var vendorId=req.body.vendor_id;
    var salonId=req.body.salon_id;
    var couponScope=req.body.coupon_scope;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    /*if (vendorId == '' || vendorId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }*/
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if(couponScope==undefined || couponScope=='')
    {
        couponScope=''
    }
    tables.couponsTable.getSalonCouponCodes(salonId,couponScope,languagesCode,function(response)
    {
        return res.send({"success":true,"promtions":response});
    });
});

router.post('/salon-customers',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 1
        });
    }
    tables.bookingsTable.getSalonCusotmers(salonId,languagesCode,async function(response){
        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0){
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        return res.send({"success":true,"customers":response,"currency":currencyValues});
    })
});

router.post('/user-reached',tokenValidations,async function(req,res)
{
    var bookingId=req.body.booking_id;
    var languagesCode = req.body.language_code;

    if (bookingId == '' || bookingId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 1
        });
    }

    var bookingStatus=await tables.bookingsTable.updateWithPromises({"status": tables.bookingsTable.status['10'].status},{"_id":bookingId});
    if(bookingStatus!=undefined && bookingStatus.length!=0)
    {
        var salonId=bookingStatus.salon_id;
        req.app.io.sockets.in(salonId).emit("booking_status",{"booking_id":bookingId ,"status":10});

        return res.send({
            "success": true,
            "message": "updated",
            "status":10
        });
    }else
    {
        return res.send({
            "success": false,
            "message": "Something went wrong. Please try again after sometime"
        });
    }


});
router.post('/add-promotion',tokenValidations,async function(req,res){
    var title=req.body.title;
    var description=req.body.description;
    var expiryDate=req.body.expiry_date;
    var validFrom=req.body.valid_from;
    var amount=req.body.amount;
    var amountType=req.body.amount_type;
    var couponCode=req.body.coupon_code;
    var salonId=req.body.salon_id;
    var vendorId=req.body.vendor_id;
    var couponScope=req.body.coupon_scope;
    var minAmount=req.body.min_amount;
    var upToAmount=req.body.up_to_amount;
    var imagePath=req.body.image_path;
    var repeat=req.body.repeat;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (title == '' || title == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 1,

        });

    }
    if (description == '' || description == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,                        "error_code": 2
        });

    }
    if (expiryDate == '' || expiryDate == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,                        "error_code": 3
        });

    }
    if (validFrom == '' || validFrom == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,                        "error_code": 4
        });
    }
    if (amount == '' || amount == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,                        "error_code": 5
        });
    }
    if (amountType == '' || amountType == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"error_code": 6
        });
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
            ,"error_code": 7
        });
    }
    amountType=parseInt(amountType);
    amount=parseInt(amount);
    if(amount=='' || amount==undefined || amount==0 || amount==NaN)
    {
        return res.send({
            "success": false,
            "message": "Invalid amount"
            ,"error_code": 8
        });
    }
    var save={};
    couponCode=trim(couponCode);
    couponCode=couponCode.toLowerCase();
    var couponDetails=await tables.couponsTable.findFieldsWithPromises({"coupon_code":couponCode},{"_id":1});
    if(couponDetails!=undefined && couponDetails.length!=0)
    {
        return res.send({
            "success": false,
            "message": "coupon already exists"
            ,"error_code": 10
        });
    }
    var salonDetails=await  tables.salonTable.findFieldsWithPromises({"_id":salonId},{"city_id":1,"country_id":1});
    var cityId=salonDetails[0].city_id;
    var countryId=salonDetails[0].country_id;

    if(!moment(validFrom, "YYYY-MM-DD HH:mm").isValid())
    {
        return res.send({
            "success": false,
            "message": "not a valid date"
            ,"error_code": 11
        });
    }
    if(!moment(expiryDate, "YYYY-MM-DD HH:mm").isValid())
    {
        return res.send({
            "success": false,
            "message": "not a valid expiry date"
            ,"error_code": 12
        });
    }
    var gmtDateTime = moment.utc(validFrom);
    validFrom = gmtDateTime.local().format('YYYY-MM-DD HH:mm');
    var gmtDateTimeExpiryDate = moment.utc(expiryDate, "YYYY-MM-DD HH:mm");
    expiryDate = gmtDateTimeExpiryDate.local().format('YYYY-MM-DD HH:mm');
    save={
        'coupon_code':couponCode,
        'title':{'en':title},
        'description':{"en":description},
        'expiry_date':expiryDate,
        'valid_from':validFrom,
        'city_id':[cityId],
        'country_id':countryId,
        'amount':amount,
        'salon_id':salonId,
        "coupon_image":imagePath,
        'coupon_scope':couponScope,
        'coupon_type':utility.COUPON_TYPE_PROMOCODE,
        "amount_type":amountType,
        "status":1
    };
    if(couponScope==1)
    {
        if(repeat=='' || repeat==undefined)
        {
            return res.send({
                "success": false,
                "message": "Invalid Repeat count"
                ,"error_code": 9
            });
        }
        repeat=parseInt(repeat);
        save['repeat']=repeat;
    }
    if(amountType==utility.PROMO_FOR_FLAT)
    {
        minAmount=parseFloat(minAmount);
        save['min_amount']=minAmount;
        if (amountType == '' || amountType == undefined)
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
                ,"error_code": 7
            });
        }
    }
    if(amountType==utility.PROMO_FOR_PERCENTAGE)
    {
        upToAmount=parseFloat(upToAmount);
        save['up_to_amount']=upToAmount;
    }
    var response=await tables.couponsTable.saveWithPromises(save);


    if(response==undefined)
    {
        return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
    }
    return res.send({
        "success": true,
        "message": "created"
    });
});
router.post('/assign-coupon',tokenValidations,async function(req,res){
    var couponCodesList=req.body.assign_coupons;
    var usersList=req.body.assign_users_list;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if(couponCodesList=='' || couponCodesList==undefined || couponCodesList.length==0)
    {
        return res.send({"success":false,"message":"select coupons"});
    }
    if(usersList=="" || usersList==undefined || usersList.length==0)
    {
        return res.send({"success":false,'message':"please select users "});
    }
    couponCodesList=JSON.parse(couponCodesList);
    usersList=JSON.parse(usersList);
    for(var c=0;c<couponCodesList.length;c++)
    {
        var couponId=couponCodesList[c];
        for(var u=0;u<usersList.length;u++)
        {
            var update=await  tables.couponsTable.updateUsersWithPromises({"customers":usersList[u]},{"_id":couponId});
            if(update==undefined)
            {
                return res.send({
                    "success": false,
                    "message": "Something went wrong. Please try again after sometime"
                });
            }
        }
    }
    return res.send({"success":true,"message": "updated" });
});
router.post('/user-coupon-list',tokenValidations,function(req,res){

});

//serve out booking details//
router.post('/serve-out-booking-details', tokenValidations, function(req,res){
    var orderId = req.body.order_id;
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.language_code;
    if (orderId == '' || orderId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.getVendorBookingDetails(orderId,languagesCode,function(response){
        if (response != undefined && response.length != 0)
        {
            return res.send({
                "success": true, "order": response[0]
            });
        }else
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});
router.post('/get-user-details',tokenValidations,function(req,res){
    var userId=req.body.user_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;


    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (userId == '' || userId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.customerTable.getCustomersDetailsForSalon(salonId,userId,function(response){
        return res.send({"success":true,"user_details":response});
    });
});
router.post('/serve-out-documents-list',tokenValidations,function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.salonTable.getCountryDocumentsServeOut(salonId,languagesCode,function(response){
        return res.send({"success":true,"documents":response});
    });
});

function cleanArray(actual)
{
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}
function addDocuments(details)
{
    return new Promise(async function(resolve){
        var vendorId=details["vendor_id"];
        var documents=details['documents'];
        var languageCode=details['language_code'];
        var stylistDocuemnts=[];
        if(documents!='')
        {
            documents=JSON.parse(documents);
        }else{
            documents=[];
        }

        var tmp={};
        var countryDocuments=[];
        if(documents.length !=0 )
        {
            //  return res.send({"success":false,"message":(utility.errorMessages["Invalid request"][languagesCode]!=undefined?utility.errorMessages["Invalid request"][languagesCode]:utility.errorMessages["Invalid request"]['en'])});
            for(var d=0;d<documents.length;d++){
                if(documents[d].path!=undefined)
                {
                    tmp={};
                    tmp['type']=0;
                    tmp['document_reference_id']=documents[d].document_id;
                    if(documents[d].path ==undefined || documents[d].path=='')
                    {
                        return resolve({"success":false,"message":"invalid file"});
                    }
                    var path=documents[d].path.split('.');

                    var ext=path[path.length-1];


                    ext=ext.toLowerCase();

                    if(utility.documentsExtensions.indexOf(ext)!= -1)
                    {
                        tmp['path']=documents[d].path;

                        tmp['vendor_id']=vendorId;
                        if(documents[d].expiry_date!=undefined){
                            tmp['is_expiry_date']=1;

                            tmp['expiry_date']=documents[d].expiry_date;
                        }else{
                            tmp['is_expiry_date']=0;

                        }
                        tmp['agent_status']=0;
                        tmp['manager_status']=0;
                        tmp['admin_status']=0;
                        tmp['status']=1;

                        stylistDocuemnts.push(tmp);
                    }
                }
            }
        }
        if(stylistDocuemnts.length==0)
        {
            return resolve({"success":false,"message":"Please upload documents"});
        }

        /*var checkCountryDocuemtns=await tables.s4618*/
        var certificates=details['certificates'];


        if(certificates!=undefined && certificates!='')
        {
              var certificatesNamesTranslate={};
            certificates=JSON.parse(certificates);
            if(certificates.length!=0)
            {
                for(var c=0;c<certificates.length;c++)
                {
                    tmp={};
                    tmp['type']=2;
                    var documentName=certificates[c].document_name;
                    certificatesNamesTranslate = await utility.translateText(documentName, languageCode);
                    certificatesNamesTranslate[languageCode] = documentName;
                    tmp['document_name'] = certificatesNamesTranslate;
                    var documents_path=certificates[c].path;
                    var path=documents_path.split('.');
                    var ext=path[path.length-1];

                    ext=ext.toLowerCase();

                    tmp['is_expiry_date']=0;

                    if(utility.documentsExtensions.indexOf(ext)!= -1)
                    {
                        tmp['path']=documents_path;
                        tmp['agent_status']=0;
                        tmp['manager_status']=0;
                        tmp['vendor_id']=vendorId;
                        tmp['admin_status']=0;
                        tmp['status']=1;

                        stylistDocuemnts.push(tmp);
                    }else{
                        return resolve({"success":false,"message":'Invalid certificate document'});
                    }
                }
            }
        }

        var resume=details['resume'];

        if(resume==undefined || resume=='')
        {
            return resolve({"success":false,"message":"please upload resume"});
        }
        var path=resume.split('.');
        var ext=path[path.length-1];

        ext=ext.toLowerCase();

        if(utility.documentsExtensions.indexOf(ext)=== -1)
        {
            return resolve({"success":false,"message":'invalid resume document'});
        }
     var resumeTrasalate=   await utility.translateText('resume', 'en');
        resumeTrasalate['en']='resume';
        tmp={};
        tmp['document_name']=resumeTrasalate;
        tmp['path']=resume;
        tmp['type']=1;
        tmp['vendor_id']=vendorId;
        tmp['status']=1;

        stylistDocuemnts.push(tmp);

        tables.stylistDocumentsTable.find({"vendor_id":vendorId},function(response)
        {
            if(response!=undefined && response.length!=0){
                tables.stylistDocumentsTable.deleteMany({"vendor_id":vendorId},function(response)
                {
                    tables.stylistDocumentsTable.insertMany(stylistDocuemnts,function(response){
                        if(response!=undefined)
                        {
                            return resolve({"success":true})
                        }else
                        {
                            return resolve({"success":false,"message":"something went wrong try again"});
                        }
                    });
                });
            }else{
                tables.stylistDocumentsTable.insertMany(stylistDocuemnts,function(response)
                {
                    if(response!=undefined)
                    {
                        return resolve({"success":true})
                    }
                });
            }
        });
    });
}
router.post('/delete-card',tokenValidations,async function(req,res)
{
    let salonId=req.body.salon_id;
    let cardId=req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined)
    {
        languageCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    if (cardId == '' || cardId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }
         var stripe=require('../utility/stripPayment');
    var cardDetails=await tables.salonTable.getPaymentCardDetails(salonId,cardId);
      if(!cardDetails.length)
      {
          return res.send({
              "success": false,
              "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
          });
      }
    console.log(cardDetails);
    var accountId=cardDetails[0]['strip_account_id'];

    console.log(accountId);
    var stripCardId=cardDetails[0]['payment']['id'];
      var updateResponse=await stripe.deleteCard(accountId,stripCardId);
        if(!updateResponse)
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    let updateBranch=await tables.salonTable.updateWithPromises({"payment.$.status":0},{"_id":salonId,"payment._id":cardId});

    if(updateBranch)
    {

        return res.send({ "success":true,"message":"Deleted Successfully"});
    }else
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
});
router.post('/update-card',tokenValidations,async function(req,res)
{
    let salonId=req.body.salon_id;
    let cardId=req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined)
    {
        languageCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    if (cardId == '' || cardId == undefined)
    {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });

    }
   /* var customerDetails=await tables.salonTable.getPaymentCardDetails(salonId,cardId);
    if(!customerDetails)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            ,"errorcode": 1
        });

    }

    var stripCardId=customerDetails[0]['payment']['id'];
    var stripCustomerId=customerDetails[0]['strip_account_id'];
    var stripe = require("../utility/stripPayment");

    var paymentResponse=await stripe.updateCustomerCard(stripCardId,stripCustomerId);

    if(!paymentResponse)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }*/
    let updateBranchCard=await tables.salonTable.updateWithPromises({"payment.$.is_primary":0},{"_id":salonId,"payment.is_primary":1});
    let updateBranch=await tables.salonTable.updateWithPromises({"payment.$.is_primary":1},{"_id":salonId,"payment._id":cardId});

    if(updateBranch)
    {
        return res.send({ "success":true,"message":"Updated Successfully"});
    }else{
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
});
router.post('/servout-employee-documents',tokenValidations,async function(req,res)
{
    var employeeId=req.body.employee_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var vendorDetails=await tables.vendorTable.findFieldsWithPromises({"employee_id":employeeId},{"_id":1,"salon_id":1});

    if(vendorDetails== undefined || vendorDetails.length==0 )
    {
        return  res.send({"success":true,"documents":[]});
    }
    var vendorId=vendorDetails[0]._id;
    tables.stylistDocumentsTable.getDocuments(vendorId,async function(response){
        if(response!=undefined && response.length!=0)
        {
            for(var i=0;i<response.length;i++)
            {
                if(response[i].type==0)
                {
                    var referenceId=response[i].document_reference_id;
                    var documents=await  tables.documentsTable.findFieldsWithPromises({"_id":referenceId},{"document_name":1});
                    if(documents.length)
                    {
                        response[i].document_name = (documents[0].document_name[languagesCode]!=undefined)? documents[0].document_name[languagesCode]:'';
                    }
                }else{
                    response[i].document_name = (response[i].document_name && response[i].document_name[languagesCode]!=undefined?response[i].document_name[languagesCode]:'');

                }
            }
        }
        return res.send({"success":true,"documents":response});

    });
});
router.post('/serve-out-portfolio',tokenValidations,async function(req,res)
{
    var employeeId=req.body.employee_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined){
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var vendorDetails=await tables.vendorTable.findFieldsWithPromises({"employee_id":employeeId},{"_id":1,"salon_id":1});
    if(vendorDetails==undefined || vendorDetails.length==0) {
        return   res.send({"success": true, "portfolio": []});
    }
    var vendorId=vendorDetails[0]._id;
    tables.portfolioTable.find({"vendor_id":vendorId},function(response){
        return res.send({"success":true,"portfolio":response});

    });
});
router.post('/missed-requests',function(req,res)
{
    var vendorId=req.body.vendor_id;
    var salonId=req.body.salon_id;
    var languagesCode = req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    tables.salonTable.salonOrdersList(salonId,languagesCode,function(response){
        return res.send({"success":true,"orders":response});

    });
});

router.post('/aws-keys',tokenValidations,function(req,res){
    var fs = require('fs'),
        path = require('path'),
        filePath = path.join(__dirname,'../aws-config.json');

    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
        if (!err){
            var jsonData=data.trim();
            var keys  = encrypt(jsonData,'1234567890123456');
            return res.send({"success":true,"keys":keys});
        }else{
            return res.send({"success":false,"message":"no keys"});
        }
    });
});
router.post('/add-package',tokenValidations,function(req,res){
    var services=req.body.services;
    var packageName=req.body.package_name;
    var packageAmount=req.body.package_amount;
    var discountAmount=req.body.discount_amount;
    var salonId=req.body.salon_id;
    var languagesCode=req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if(packageName=='' || packageName==undefined)
    {
        return res.send({"success":false,"message":"please enter package name"});
    }
    if(services=='' || services==undefined)
    {
        return res.send({"success":false,"message":"please select services"});
    }
    if(packageAmount=='' || packageAmount==undefined)
    {
        return res.send({"success":false,"message":"please enter package amount"});
    }
    var servicesList=[];
    services=JSON.parse(services);
    for(var s=0;s<services.length;s++)
    {
        var serviceFor=services[s].service_for;
        var serviceId=services[s].service_id;
        var categoryId=services[s].category_id;
        serviceFor=parseInt(serviceFor);
        if(!utility.isValidServiceFor(serviceFor))
        {
            return res.send({"success":false,"message":"please enter valid service for"});
        }
        servicesList.push({'service_for':serviceFor,"service_id":serviceId,"category_id":categoryId});
    }
    tables.salonPackagesTable.save({"package_name":packageName,
        "package_amount":packageAmount,
        "services":servicesList,
        "discount_amount":discountAmount,
        'status':1,'salon_id':salonId},function(response){
        if(response!=undefined){
            return res.send({"success":true,"message":'package added'});

        }else{
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});
router.post('/update-package',tokenValidations,function(req,res){
    var services=req.body.services;
    var packageName=req.body.package_name;
    var packageAmount=req.body.package_amount;
    var discountAmount=req.body.discount_amount;
    var salonId=req.body.salon_id;
    var packageId=req.body.package_id;
    var languagesCode=req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if (packageId == '' || packageId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":2
        });
    }
    if(packageName=='' || packageName==undefined)
    {
        return res.send({"success":false,"message":"please enter package name"});
    }
    if(services=='' || services==undefined)
    {
        return res.send({"success":false,"message": "please select services"});
    }
    if(packageAmount=='' || packageAmount==undefined)
    {
        return res.send({"success":false,"message": "please enter package amount" });
    }

    var servicesList=[];
    services=JSON.parse(services);
    for(var s=0;s<services.length;s++)
    {
        var serviceFor=services[s].service_for;
        var serviceId=services[s].service_id;
        var categoryId=services[s].category_id;
        serviceFor=parseInt(serviceFor);
        if(!utility.isValidServiceFor(serviceFor))
        {
            return res.send({"success":false,"message":"please enter valid service for"});
        }
        servicesList.push({'service_for':serviceFor,"service_id":serviceId,"category_id":categoryId});
    }

    tables.salonPackagesTable.update({ "package_name":packageName,
        "package_amount":packageAmount,
        "services":servicesList,
        "discount_amount":discountAmount,
        'status':1,'salon_id':salonId },{"_id":packageId},function(response){
        if(response!=undefined)
        {
            return res.send({"success":true,"message":'package updated'});

        }else
        {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});
router.post('/packages-list',tokenValidations,function(req,res){
    var salonId=req.body.salon_id;
    var languagesCode=req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }

    tables.salonPackagesTable.packagesList(salonId,async function(response)
    {
        var currency=await tables.salonTable.getCurrency(salonId);
        var currencyValues={"currency_code":"INR","currency":"₹"};
        if(currency!=undefined && currency.length!=0 && currency[0].currency_code!=undefined)
        {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        return res.send({"success":true,"packages":response,"currency":currencyValues});
    });
});
router.post('/package-details',tokenValidations,async function(req,res)
{
    var salonId=req.body.salon_id;
    var packageId=req.body.package_id;
    var languagesCode=req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined)
    {
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    if (packageId == '' || packageId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var packageDetails=await tables.salonPackagesTable.findFieldsWithPromises({"_id":packageId},{"services":1,"package_name":1,"package_amount":1,"discount_amount":1});
    return res.send({"success":true,"package_details":packageDetails[0]});
});
router.post('/promotions-list',tokenValidations,async function(req,res)
{
    var salonId=req.body.salon_id;
    var languagesCode=req.body.language_code;
    if (languagesCode == '' || languagesCode == undefined){
        languagesCode = 'en';
    }
    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"city_id":1});
    if(salonDetails==undefined || salonDetails.length==0 || salonDetails[0].city_id==undefined)
    {
        return res.send({"success":true,'promotions':[]});
    }
    var city=salonDetails[0].city_id;
    var dateTimeFormat='YYYY-MM-DD HH:mm';
    var startDateTime=moment.utc();
    var startDate=startDateTime.format(dateTimeFormat);
    tables.promotionsTable.getPromotions(city,startDate,languagesCode,function(response){
        return res.send({"success":true,"promotions":response});
    });
});
router.post('/walk-in-customer',tokenValidations,async function(req,res){
    var salonId=req.body.salon_id;
    var date=req.body.date;
    var time=req.body.time;
    var firstName=req.body.first_name;
    var lastName=req.body.last_name;
    var languagesCode=req.body.language_code;
    var mobile=req.body.mobile;
    var mobileCountry=req.body.mobile_country;
    var isPackage=req.body.service_type;

    if (salonId == '' || salonId == undefined)
    {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode":1
        });
    }
    var services=req.body.services;

    if(date=='' || date==undefined)
    {
        return res.send({
            "success": false,
            "message": "Please Select date",
            "errorcode":3
        });
    }
    if(time=="" || time==undefined)
    {
        return res.send({
            "success": false,
            "message": "Please Select time",
            "errorcode":4
        });
    }
    if(firstName=="" || firstName==undefined)
    {
        return res.send({
            "success": false,
            "message": "Please Enter first name",
            "errorcode":5
        });
    }
    if(lastName=="" || lastName==undefined)
    {
        return res.send({
            "success": false,
            "message": "Please Enter last name",
            "errorcode":6
        });
    }
    var serviceFor=null;
    var serviceId=null;
    var quantity=null;
    var price=null;
    var serviceResponse=null;
    var totalServices=[];
    var tmp={};
    var userId='';
    var checkMobile=[];
    if(mobile!='' && mobile!=undefined)
    {
        checkMobile=await tables.customerTable.findFieldsWithPromises({"mobile":mobile,"mobile_country":mobileCountry},{"_id":1});
    }
    if(checkMobile==undefined || checkMobile.length==0)
    {
         var save={"mobile":mobile,
             "mobile_country":mobileCountry,"status":1,'is_social':0};
        var firstNameTranslate = await utility.translateText(firstName, languagesCode);
        firstNameTranslate[languagesCode] = firstName;
        var lastNameTranslate = await utility.translateText(lastName, languagesCode);
        lastNameTranslate[languagesCode] = lastName;
        save['first_name']=firstNameTranslate;
        save['last_name']=lastNameTranslate;
        var insertCustomer=await tables.customerTable.saveWithPromises(save);
        userId=insertCustomer._id;
    }else
    {
        userId=checkMobile[0]._id;
    }
    var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{'latitude':1,"longitude":1,"location":1,"city_id":1});
    if(salonDetails==null || salonDetails==undefined || salonDetails.length==0)
    {
        return res.send({
            "success": false,
            "message": "something went wrong try again",
            "errorcode":2
        });
    }
    var cityId=salonDetails[0]['city_id'];

    var cityDetails=await tables.citiesTable.findFieldsWithPromises({"_id":cityId},{"time_zone":1});
    var timezone=cityDetails[0].time_zone;
    isPackage=parseInt(isPackage);

    if(isPackage==undefined || isPackage==0 || isNaN(isPackage))
    {
        if(services=='' || services==undefined  || services.length==0)
        {
            return res.send({
                "success": false,
                "message": "Please Select services",
                "errorcode":2
            });
        }

        services=JSON.parse(services);
        for(var s=0;s<services.length;s++)
        {
            tmp={};
            serviceFor=services[s].service_for;
            serviceId=services[s].service_id;
            serviceFor=parseInt(serviceFor);
            serviceResponse =await tables.salonServicesTable.findFieldsWithPromises({"service_id":serviceId,"service_for":serviceFor,"status":{"$ne":0},"salon_id":salonId},{"service_cost":1});

            if(serviceResponse==null || serviceResponse==undefined || serviceResponse.length==0)
            {
                return res.send({
                    "success": false,
                    "message": "Please Select another services",
                    "errorcode":2
                });
            }
            price=serviceResponse[0].service_cost;
            tmp['service_id']=serviceId;
            tmp['selected_for']=serviceFor;
            tmp['quantity']=1;
            tmp['price']=price;
            tmp['date']=date;
            tmp['time']=time;
            tmp['time_type']=1;
            tmp['timezone']=timezone;
            tmp['customer_id']=userId;
            tmp['salon_id']=salonId;
            totalServices.push(tmp);
        }
    }else
    {
        var packageId=req.body.package_id;
        var packageDetails = await tables.salonPackagesTable.packagesServicePrices(packageId);
        //   return res.send(packageDetails);
        if (packageDetails != undefined && packageDetails.length) {
            var services = packageDetails[0].service_details;
            var saveValues = {};
            var save = [];
            var serviceId = '';
            var categoryId = '';
            var serviceFor = '';
            //price=packageDetails[0].discount_amount;
            for (var p = 0; p < services.length; p++) {
                saveValues = {};
                categoryId = services[p].category_id;
                serviceId = services[p].service_id;
                serviceFor = services[p].service_for;

                saveValues['unfiltered_service'] = 1;
                saveValues["quantity"] = quantity;
                saveValues["time"] = time;
                saveValues["date"] = date;
                saveValues['selected_time'] = time;
                saveValues['selected_date'] = date;
                saveValues["customer_id"] = userId;
                saveValues["is_package"] = 1;
                saveValues['timezone'] = timezone;
                saveValues['service_id'] = serviceId;
                saveValues['category_id'] = categoryId;
                saveValues['selected_for'] = serviceFor;
                saveValues['city_id'] = cityId;
                saveValues['salon_id'] = salonId;
                saveValues['time_type'] = 1;
                saveValues['quantity'] = 1;
                saveValues["price"] = price;
                saveValues["package_amount"] = packageDetails[0].package_amount;
                saveValues["package_id"] = packageId;
                saveValues["cart_type"] = 2;
                saveValues["type"] = 2;
                saveValues['selected_time'] = time;
                saveValues['selected_date'] = date;
                totalServices.push(saveValues);
            }
        }

    }

    if(totalServices.length==0)
    {
        return res.send({
            "success": false,
            "message": "Try again",
            "errorcode":2
        });
    }

    var response=await tables.cartTable.insertManyWithPromises(totalServices);
    isPackage=0;
    var totalBookings=[];
    var booking={};
    var cartId='';
    var  netAmount=0;
    var  salonId=response[0].salon_id;
    var salonLatitude=0;
    var salonLongitude=0;
    if(salonDetails!=undefined && salonDetails.length!=0)
    {
        salonLatitude=salonDetails[0].latitude;
        salonLongitude=salonDetails[0].longitude;
    }
    var location='';
    var checkSalonCouponCode=await tables.cartTable.checkSalonCouponCode(userId);

    for(var c=0;c<response.length;c++)
    {
        booking={};
        cartId=response[c]._id;
        salonId=response[c].salon_id;
        //  timezone=response[c].timezone;
        userId=response[c].customer_id;
        if(response[c].date!=undefined)
        {
            var date=response[c].date;
        }
        netAmount=0;
        if(response[c].price!=undefined)
        {
            netAmount =response[c].price;
        }
        booking['cart_id']=cartId;
        booking['net_amount']=netAmount;
        booking['customer_id']=userId;
        booking['type']=2;
        booking['salon_id']=salonId;

        booking['status']=1;
        booking['time_zone']=timezone;
        booking['latitude']=salonLatitude;
        booking['longitude']=salonLongitude;
        booking['is_customer_rated']=0;
        location={"type":"Point","coordinates":[salonLongitude,salonLatitude]};
        booking['location']=location;
        if(response[c].type!=undefined&&response[c].type==2)
        {
            isPackage=1;
        }
        if(isPackage==1)
        {
            booking['status']=2;
        }
        var coupon=response[c].coupon;
        if(coupon!=undefined&& coupon!='')
        {
            booking["coupon"]=response[c].coupon,
                booking["coupon_amount"]=response[c].coupon_amount,
                booking["coupon_amount_type"]=response[c].coupon_amount_type,
                booking["up_to_amount"]=response[c].up_to_amount;

            if(checkSalonCouponCode!=undefined && checkSalonCouponCode.length!=0)
            {
                var percentage=0;
                var couponDiscount=0;
                var cartTotal=checkSalonCouponCode[0]['total_amount'];
                var couponAmount=response[c].coupon_amount;
                var type=response[c].coupon_type;
                var couponId=response[c].coupon_id;
                if(response[c].coupon_amount_type==1){
                    percentage=netAmount/cartTotal;
                    percentage=percentage*100;
                    couponDiscount=percentage*couponAmount/100;
                }else{
                    var couponPercentage=response[c].coupon_amount;
                    var couponUpToAmount=response[c].up_to_amount;


                    var discountAmount=(cartTotal/100)*couponPercentage;
                    if(discountAmount>couponUpToAmount){
                        couponAmount=couponUpToAmount;
                    }else
                    {
                        couponAmount=discountAmount;
                    }
                    percentage=netAmount/cartTotal;
                    percentage=percentage*100;
                    couponDiscount=percentage*couponAmount/100;
                }
                booking['coupon_details']={"coupon":coupon,'coupon_amount':couponDiscount,"coupon_type":type ,"coupon_id":couponId };
            }
        }
        var currency=await tables.salonTable.getCurrency(salonId);
        var countryId = currency[0].country_id;
        var cityId = currency[0].city_id;
        var currencyCode = currency[0].currency_code;
        var currencySymbol = currency[0].currency_symbol;


        booking["customer_country_details"]=
            {
                country_id:countryId,
                city_id:cityId,
                currency_code:currencyCode,
                currency_symbol:currencySymbol
            };
        totalBookings.push(booking);
    }

    /*var salonStatus=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"active_status":1,"booking_status":1});
    if(salonStatus!=undefined && salonStatus.length!=0)
    {
        var activeStatus=salonStatus[0].active_status;
        var bookingStatus=salonStatus[0].booking_status;
        if(activeStatus==2)
        {
            return res.send({"success":false,"message":"salon is inactive book another salon"});
        }
        if(bookingStatus==2)
        {
            return res.send({"success":false,"message":"salon  is not accepting  bookings"});
        }
    }*/

    tables.bookingsTable.insertMany(totalBookings,function(bookingResponse)
    {
        var bookingIds = [];
        var salonId='';
        for (var v = 0; v < bookingResponse.length; v++)
        {
            bookingIds.push(bookingResponse[v]._id);
            // salonId=bookingResponse[v].salon_id;
            salonId=bookingResponse[v].salon_id;
        }
        var save={};
        save['customer_id']=userId;
        save['booking_id']=bookingIds;
        save['salon_id']=salonId;
        tables.ordersTable.save(save,function(orderResponse)
        {
            var orderId=orderResponse._id;
            return res.send({"success":true,"message":"Booked","order_id":orderId,"type":isPackage});
        });
    });
});
router.post('/customer-details',tokenValidations,async function(req,res){
    var mobile=req.body.mobile;
    var mobileCountry=req.body.mobile_country;
    var languageCode = req.body.language_code;

    var checkCustomer=await tables.customerTable.findFieldsWithPromises({"mobile":mobile,"mobile_country":mobileCountry},{"first_name":1,"last_name":1});

    if(checkCustomer!=undefined && checkCustomer.length!=0 && checkCustomer[0].first_name!=undefined)
    {
        return res.send({"success":true,"details":{"customer_id":checkCustomer[0]._id,"first_name":checkCustomer[0].first_name[languageCode],
                "last_name":checkCustomer[0].last_name[languageCode]}})
    }else{
        return res.send({"success":true,"details":{}})
    }
});
  router.get('/update-salon-branches',async function(req,res){
         var vendorResponse= await tables.vendorTable.findFieldsWithPromises({"type":2},{"_id":1,"branches":1});
         if(vendorResponse.length!=0){

         }
  });
  router.post('/update-booking-status',async function(req,res)
{
      var bookingId=req.body.booking_id;
      var status=req.body.status;
         status=parseInt(status);
      var updateStatus=await  tables.bookingsTable.updateManyWithPromises({"status":status},{"_id":bookingId});

       return res.send({"success":true});
  });
module.exports = router;
function compareTimeSalon(a, b) {
    var min = {a: 0, b: 0};
    if (a.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
        min.a = a.cancellation_time * 1440;
    } else if (a.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
        min.a = a.cancellation_time * 60;
    } else {
        min.a = a.cancellation_time;
    }
    if (b.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
        min.b = b.cancellation_time * 1440;
    } else if (b.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
        min.b = b.cancellation_time * 60;
    } else {
        min.b = b.cancellation_time;
    }
    if (min.a > min.b) {
        return 1
    }
    if (min.a < b.cancellation_time_type) {
        return -1;
    }
}
function compareTime(a,b)
{
    var min={a:0,b:0};
    if(a.cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
    {
        min.a=a.cancellation_time*1440;
    }else if(a.cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
    {
        min.a=a.cancellation_time*60;
    }else
    {
        min.a=a.cancellation_time;
    }
    if(b.cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_DAYS)
    {
        min.b=b.cancellation_time*1440;
    }else if(b.cancellation_time_type==utility.CANCELLATION_POLICY_TIME_TYPE_HOURS)
    {
        min.b=b.cancellation_time*60;
    }else
    {
        min.b=b.cancellation_time;
    }

    if (min.a < min.b)
    {
        return 1
    }
    if (min.a > b.cancellation_time_type)
    {
        return -1;
    }
}
