var express = require('express');
var router = express.Router();
var token = "bXImbXJzYXBpdG9rZW4";
var trim = require('trim');
var utility = require('../utility/utility');
var tables = require('../db_modules/baseTable');
var crypto = require('crypto');
async function tokenValidations(req, res, next) {
    console.log(req.originalUrl, req.body);

    var startTime = utility.getTime;
    var endTime = utility.getTime;
    var languageCode = req.body.language_code;
    languageCode = utility.languageCode(languageCode);
    req.body.language_code = languageCode;

    // console.log(req.body,req.originalUrl);
    var writeData = { "start_time": startTime, "end_time": endTime, "request_from": "stylist", "path": req.originalUrl, "request": req.body };
    // utility.writeToFile.writeToFile(writeData);
    ///console.log(req.originalUrl,req.body);

    if (req.body.token == token) {
        // if (req.body.access_token != "" && req.body.access_token != undefined && req.originalUrl != '/api/customer/logout') {
        //     var userAcessToken = '';

        //     var type = req.body.type;
        //     type = parseInt(type);


        //     var vendorId = req.body.vendor_id;
        //     userAcessToken = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "access_token": 1 });


        //     if (userAcessToken != undefined && userAcessToken.length != 0 && userAcessToken[0]['access_token'] != req.body.access_token) {

        //         //req.app.io.sockets.in(userId).emit("force_logout",{"is_login":2});
        //         return res.json({ success: false, message: utility.errorMessages["Invalid Access"][languageCode], "is_login": 2 });
        //     }
        // }
        return next();
    } else {
        res.json({ success: false, message: "Invalid  token" });
    }
}
function encrypt(string, hash) {
    var iv = '1234567890123456';
    var cipher = crypto.createCipheriv('aes-128-cbc', hash, iv);
    var encrypted = cipher.update(string, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    var hexVal = new Buffer.from(encrypted, 'binary');
    var newEncrypted = hexVal.toString('hex');
    return newEncrypted;
}
/*function encrypt(string){
 var crypto = require('crypto');
 var hash = generateHash();
 var iv = '1234567890123456';
 var cipher = crypto.createCipheriv('aes-128-cbc', hash, iv);

 var encrypted = cipher.update(string, 'utf8', 'binary');
 encrypted += cipher.final('binary');
 var hexVal = new Buffer(encrypted, 'binary');
 var newEncrypted = hexVal.toString('hex');
 return {hash : hash, encrypted_string : newEncrypted};

 },*/
async function generateHash() {
    return new Promise(async function (resolve) {
        var hashLength = 16;
        var characters = '1234567890123456';
        var hash = '';
        for (var i = 0; i < characters.length; i++) {
            hash = hash + characters.charAt(Math.random() * (hashLength - 0) + 0);
        }
        // var field='hash';


        var response = await tables.vendorTable.findFieldsWithPromises({ "hash": hash }, { "_id": 1 });
        return resolve(hash);
    });
}
function decrypt(password, hash) {
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
router.post('/get-category', tokenValidations, function (req, res) {
    var forWhom = req.body.for_whom;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    tables.categoryTable.getCategory(function (response) {
        return res.send({ "success": true, "cateogry": response });
    });
});
router.post('/get-services', tokenValidations, function (req, res) {
    var forWhom = req.body.for_whom;
    var vendorId = req.body.vendor_id;
    var categoryId = req.body.category_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (categoryId == '' || categoryId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }
    tables.servicesTable.getCategoryServicesList(categoryId, function (response) {
        return res.send({ "success": true, "services": response });
    });
});
router.post('/save-services', tokenValidations, function (req, res) {
    var forWhom = req.body.for_whom;
    var vendorId = req.body.vendor_id;
    var categoryId = req.body.category_id;
    var serviceId = req.body.service_id;
    var level = req.body.service_level;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (forWhom == '' || forWhom == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    if (categoryId == '' || categoryId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }
    if (serviceId == '' || serviceId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 3
        });
    }

    if (level == '' || level == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 4
        });
    }
    var save = {};
    var match = {};
    save['service_id'] = serviceId;
    save['service_for'] = forWhom;
    save['vendor_id'] = vendorId;
    save['service_levels'] = [parseInt(level)];


    tables.stylistServicesTable.save(save, function (response) {
        tables.vendorTable.update({ "status": 5 }, { "_id": vendorId, "status": { "$eq": 4 } }, function (response) {
            return res.send({ "success": true, "message": "updated" })
        });

    });
    /*
       match[forWhom]={'$in':[level]};
    */

});
router.post('/save-stylist-services', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var services = req.body.services;
    services = JSON.parse(services);
    var totalService = [];

    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    for (var i = 0; i < services.length; i++) {
        var save = {};
        var serviceId = services[i].service_id;
        var categoryId = services[i].category_id;
        var forWhom = services[i].for_whom;
        forWhom = parseInt(forWhom);
        save['category_id'] = categoryId;
        save['service_id'] = serviceId;
        save['service_for'] = forWhom;
        if (!utility.isValidServiceFor(forWhom)) {
            return res.send({
                "success": false,
                "message": "Please provide valid service for."
            });
        }
        save['vendor_id'] = vendorId;
        save['service_levels'] = [1];
        totalService.push(save);
    }
    tables.stylistServicesTable.find({ "vendor_id": vendorId }, function (response) {
        if (response != undefined && response.length != 0) {
            tables.stylistServicesTable.deleteMany({ "vendor_id": vendorId }, function (response) {
                tables.stylistServicesTable.save(totalService, function (response) {

                    tables.vendorTable.update({ "status": 5 }, { "_id": vendorId, "status": { "$eq": 4 } }, function (response) {
                        return res.send({ "success": true, "message": "updated" })

                    });

                });

            });
        } else {
            tables.stylistServicesTable.save(totalService, function (response) {
                if (response != undefined) {
                    tables.vendorTable.update({ "status": 5 }, { "_id": vendorId, "status": { "$eq": 4 } }, function (response) {
                        return res.send({ "success": true, "message": "updated" })

                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                    });
                }


            });

        }

    });

});
router.post('/new-service-request', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var save = {};
    var forWhom = req.body.for_whom;
    var categoryName = req.body.category_name;
    var serviceName = req.body.service_name;
    var duration = req.body.duration;
    var description = req.body.description;
    var currency = req.body.currency;
    var price = req.body.price;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 1
        });
    }
    if (categoryName == '' || categoryName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 2
        });
    }
    if (serviceName == '' || serviceName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 3
        });
    }
    if (duration == '' || duration == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 4
        });
    }
    if (description == '' || description == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 5
        });
    } if (price == '' || price == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 6
        });
    }
    if (currency == '' || currency == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorCode": 7
        });
    }
    save['for_whom'] = parseInt(forWhom);
    save['category_name'] = categoryName;
    save['service_name'] = serviceName;
    save['duration'] = duration;
    save['description'] = description;
    save['vendor_id'] = vendorId;
    save['price'] = price;
    save['currency'] = currency;
    save['requested_by'] = utility.PROMO_FOR_STYLIST;
    utility.curl.curlPost('admin/index/send-service-request-mail', save);
    tables.requestedServicesTable.save(save, function (response) {

        /* if(response!=undefined && response.length!=0)
         {
             return res.send({"success":true,"message":"new Service requested successfully"});
         }else
             {
                 return res.send({
                     "success": false,
                     "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                 });
             }*/
        return res.send({ "success": true, "message": utility.errorMessages["new Service requested successfully"][languageCode] });

    });

});
router.post('/services-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    tables.vendorTable.getServiceDetails(vendorId, languageCode, function (response) {
        if (response != undefined && response.length) {
            return res.send({ "success": true, "services": response[0] });
        } else {

            return res.send({ "success": true, "services": {} });
        }

    });
});
router.post('/get-styles', tokenValidations, function (req, res) {
    var languageCode = req.body.language_code;

    tables.styleTable.findFieldsWithProject({ "status": 1 }, { "style": { "$ifNull": ["$style." + languageCode, "$style.en"] }, "_id": 1 }, function (response) {

        return res.send({ "success": true, "message": "styles", "preferred_styles": response });
    });
    //  res.send([{_id:'dfgdgdfgdfg234233242',style:'indian style'},{_id:'dfgdgdfgdfg234233222',style:'mexiacan style'},{_id:'dfgdgdfgdfg23423322121',style:'american style'}])
});
router.post('/get-all-services', tokenValidations, async function (req, res) {


    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": utility.errorMessages["Invalid request"][languageCode]
            , "errocode": 1
        });
    }
    var stylistResponse = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { 'city_id': 1, "agent_status": 1, "manager_status": 1, "iban_status": 1, "_id": 0 });
    var cityId = '';

    if (stylistResponse != undefined && stylistResponse.length != 0) {
        cityId = stylistResponse[0].city_id;
        if (cityId == undefined) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["city services not available"][languageCode]
            });
        }
    } else {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languageCode]
            , "errocode": 2

        });
    }
    tables.vendorTable.getAllServices(cityId, utility.serviceTypeStylist, languageCode, function (response) {
        var status = 0;
        if (stylistResponse[0].agent_status == 1 && stylistResponse[0].manager_status == 1 && stylistResponse[0].iban_status == 1) {
            var status = 1;

        }
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "services": response[0], "status": status });
        } else {
            return res.send({ "success": true, "services": {}, "status": status });
        }
    });
});
router.post('/sender-details', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;
    tables.customerTable.findFields({ "_id": user_id }, { "first_name": 1, "last_name": 1 }, function (response) {
        var details = { "name": response[0].first_name + '' + response[0].last_name, "profile_pic": '' };
        return res.send({ "success": true, "details": details })
    });
});
router.post('/about', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var styles = req.body.styles;
    var expertise = req.body.expertise;
    var stylistLevels = req.body.stylist_levels;
    var intro = req.body.info;
    var introTranslate = await utility.translateText(intro, languageCode);
    introTranslate[languageCode] = intro;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": utility.errorMessages["Invalid request"][languageCode]
            , "errocode": 1
        });
    }
    var save = {};
    var styles = [];
    if (styles != '' && styles != undefined && styles != null) {
        styles = styles.split(',');
    }

    expertise = expertise.split(',');
    save['intro'] = introTranslate;
    save['styles'] = styles;
    save['expertise'] = expertise;
    save['levels'] = stylistLevels;
    save['vendor_id'] = vendorId;
    save['available_status'] = 1;
    save['lock'] = 0;
    tables.stylistTable.find({ 'vendor_id': vendorId }, function (stylistResponse) {

        if (stylistResponse != undefined && stylistResponse.length == 0) {

            tables.stylistTable.save(save, function (response) {

                if (response != undefined) {
                    console.log("second if")
                    tables.vendorTable.update({ 'status': 4 }, { "_id": vendorId }, function (vendorResponse) {
                        return res.send({ "success": true, "message": "updated" });
                    });
                } else {
                    console.log("second else")
                    return res.send({
                        "success": false,
                        "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]
                    });
                }
            });
        } else {

            tables.stylistTable.update(save, { 'vendor_id': vendorId }, function (response) {
                if (response != undefined) {
                    tables.vendorTable.update({ 'status': 4 }, { "_id": vendorId, "status": 3 }, function (vendorResponse) {
                        return res.send({ "success": true, "message": "updated" });
                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]
                    });
                }
            });
        }
    });
});
router.post('/update-about-stylist', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var styles = req.body.styles;
    var expertise = req.body.expertise;
    var stylistLevels = req.body.stylist_levels;
    var intro = req.body.info;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    var save = {};
    if (styles != '' && styles != undefined && styles != null) {
        styles = styles.split(',');
    } else {
        styles = []
    }

    expertise = expertise.split(',');
    save['intro.' + languageCode] = intro;
    save['styles'] = styles;
    save['expertise'] = expertise;
    // save['levels']=stylistLevels;
    save['vendor_id'] = vendorId;
    tables.stylistTable.find({ 'vendor_id': vendorId }, function (stylistResponse) {
        tables.stylistTable.update(save, { 'vendor_id': vendorId }, function (response) {
            if (response != undefined) {
                return res.send({ "success": true, "message": "updated" });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    });
});
router.post('/booking-details', tokenValidations, function (req, res) {
    var orderId = req.body.order_id;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (orderId == '' || orderId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.getVendorBookingDetails(orderId, languageCode, function (response) {

        if (response != undefined && response.length != 0) {

            return res.send({
                "success": true, "order": response[0]
            });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});
router.post('/portfolio', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    var filePath = req.body.file_path;
    if (filePath != undefined && filePath != null && filePath != "") {
        filePath = filePath.split(',');

    } else {
        filePath = [];

    }
    var save = [];
    for (var i = 0; i < filePath.length; i++) {
        var obj = {};
        obj['vendor_id'] = vendorId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }
    tables.portfolioTable.find({ "vendor_id": vendorId }, function (response) {
        if (response != undefined && response.length != 0) {
            tables.portfolioTable.deleteMany({ "vendor_id": vendorId }, function (response) {
                tables.portfolioTable.insertMany(save, function (response) {
                    tables.vendorTable.update({ "status": 6 }, { "_id": vendorId, "status": { "$eq": 5 } }, function (response) {

                        return res.send({ "success": true, "message": "updated" })
                    });
                });
            });

        } else {
            tables.portfolioTable.insertMany(save, function (response) {
                tables.vendorTable.update({ "status": 6 }, { "_id": vendorId, "status": { "$eq": 5 } }, function (response) {

                    return res.send({ "success": true, "message": "updated" })
                });
            });
        }


    });
});
router.post('/update-work-experience', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var deletedExperince = req.body.deleted_experince;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    var experience = req.body.experience;
    var totalExperience = [];
    if (experience != '') {
        experience = JSON.parse(experience);
        var rounded = '';
        for (var j = 0; j < experience.length; j++) {
            var save = {};
            var service_id = experience[j].service_id;
            var from = experience[j].from;
            var to = experience[j].to;
            var moment = require('moment-timezone');
            var yearsExperience = moment(new Date(to + '-31')).diff(moment(new Date(from + "-01")), 'years', true);
            rounded = Math.round(yearsExperience * 10) / 10;
            var as = experience[j].as;
            save['service_id'] = service_id;
            save['vendor_id'] = vendorId;
            save['from'] = from;
            save['to'] = to;
            save['experience'] = rounded;
            save['experience_as'] = as;
            totalExperience.push(save);
        }
    }
    if (totalExperience.length != 0) {
        var saveResponse = await tables.stylistExperienceTable.insertManyWithPromises(totalExperience);
    }
    if (deletedExperince != '' && deletedExperince != undefined) {
        deletedExperince = deletedExperince.split(',');
        var deletedReponse = await tables.stylistExperienceTable.deleteManyWithPromises({ "_id": { "$in": deletedExperince } });
    }
    return res.send({ "success": true, "message": "updated" });
});

router.post('/update-portfolio', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var deletedPortfolio = req.body.deleted_portfolio;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    var filePath = req.body.file_path;
    if (filePath != '') {

    }
    filePath = filePath.split(',');
    var save = [];
    for (var i = 0; i < filePath.length; i++) {
        var obj = {};
        obj['vendor_id'] = vendorId;
        obj['file_path'] = filePath[i];
        save.push(obj);
    }

    if (deletedPortfolio != '' && deletedPortfolio != undefined) {
        deletedPortfolio = deletedPortfolio.split(',');
        var deletedReponse = await tables.portfolioTable.deleteManyWithPromises({ "_id": { "$in": deletedPortfolio } });
    }
    if (save.length != 0) {
        var saveResponse = await tables.portfolioTable.insertManyWithPromises(save);
    }
    return res.send({ "success": true, "message": "updated" });
});
router.post('/work-experience', tokenValidations, function (req, res) {
    console.log("req>>>>>>>>>>>>>>>>.",req.body)
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    var experience = req.body.experience;

    experience = JSON.parse(experience);
    var totalExperience = [];
    var rounded = '';
    for (var j = 0; j < experience.length; j++) {
        var save = {};
        var service_id = experience[j].service_id;
        var from = experience[j].from;
        var to = experience[j].to;
        var moment = require('moment-timezone');


        var yearsExperience = moment(new Date(to + '-31')).diff(moment(new Date(from + "-01")), 'years', true);
        rounded = Math.round(yearsExperience * 10) / 10;
        
        if(experience[j].experience_as == "0" || experience[j].experience_as == "1"){

            var as = experience[j].experience_as;

        }else{
            var as = experience[j].as;

        }
        save['service_id'] = service_id;
        save['vendor_id'] = vendorId;
        save['from'] = from;
        save['to'] = to;

        save['experience'] = rounded;
        save['experience_as'] = as;
        totalExperience.push(save);
    }
    tables.stylistExperienceTable.find({ "vendor_id": vendorId }, function (response) {
        if (response != undefined && response.length != 0) {
            tables.stylistExperienceTable.deleteMany({ "vendor_id": vendorId }, function (response) {
                tables.stylistExperienceTable.insertMany(totalExperience, function (response) {
                    tables.vendorTable.update(
                        { "status": 7 }, { "_id": vendorId, "status": { "$eq": 6 } }, function (response) {
                            res.send({ "success": true, "message": "updated" })
                        });
                })

            });
        } else {
            tables.stylistExperienceTable.insertMany(totalExperience, function (response) {
                tables.vendorTable.update(
                    { "status": 7 }, { "_id": vendorId, "status": { "$eq": 6 } }, function (response) {
                        res.send({ "success": true, "message": "updated" });
                    });
            });
        }
    });
});
router.post('/update-basic-info', tokenValidations, async function (req, res) {

    var languageCode = req.body.language_code;
    var firstName = req.body.first_name;
    var vendorId = req.body.vendor_id;
    var lastName = req.body.last_name;
    var email = req.body.email;

    var gender = req.body.gender;
    var dob = req.body.dob;
    var nationality = req.body.nationality;
    var country = req.body.country;

    var password = req.body.password;
    var invitecode = req.body.invite_code;
    var languageSpeak = req.body.language_speak;
    var optFor = req.body.opt_for;
    var subscribeFor = req.body.subscribe_for;
    var profilePic = req.body.profile_pic;
    var cityId = req.body.city_id;
    firstName = trim(firstName);
    lastName = trim(lastName);
    nationality = trim(nationality);

    if (firstName == undefined || firstName === "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["First Name is required!"][languageCode]
        });
    }

    if (lastName == undefined || lastName === "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Last Name is required!"][languageCode]
        });
    }
    /*  country=country.charAt(0).toUpperCase()+country.slice(1);
      var  countryResponse=await tables.countryTable.findFieldsWithPromises({"country":country},{"_id":1});

      if(countryResponse==undefined || countryResponse.length==0)
      {

          return res.send({"success":false,"message":"country Not avalible"});
      }
      if(cityId=='' || cityId==undefined)
      {
          return res.send({
              "success": false,
              "message": "please select city"
          });
      }
      var countryId=countryResponse[0]._id;
*/
    var update = {};
    var stylistSave = {};

    firstName = utility.removeSpacesInBetween(firstName);
    lastName = utility.removeSpacesInBetween(lastName);

    update['first_name.' + languageCode] = firstName;
    update['last_name.' + languageCode] = lastName;
    update['gender'] = parseInt(gender);
    update['dob'] = dob;
    stylistSave['nationality'] = nationality;
    stylistSave['invite_code'] = invitecode;
    stylistSave['languages_speak'] = languageSpeak.split(',');
    if (profilePic != '' && profilePic != undefined) {
        update['profile_pic'] = profilePic;
    }
    /* update['country']=countryId;
     stylistSave['country']=countryId;
     stylistSave['city_id']=cityId;*/
    email = email.toLowerCase();
    update['name.' + languageCode] = firstName + " " + lastName;
    update['email'] = email;
    tables.vendorTable.find({ "email": email, "_id": { "$ne": vendorId } }, async function (response) {
        if (response.length == 0) {
            update['email'] = email;
            var password = req.body.password;
            if (password != '' && password != undefined) {
                var hash = await generateHash();
                update["password"] = encrypt(password, hash);
                update['hash'] = hash;
            }
            tables.vendorTable.find({ '_id': vendorId }, async function (checkResponse) {
                if (checkResponse.length != 0) {
                    var existingGender = checkResponse[0]['gender'];
                    var mobile = checkResponse[0]['mobile'];
                    var mobileCountry = checkResponse[0]['mobile_country'];
                    var tmUserId = checkResponse[0]['tm_user_id'];
                    tables.vendorTable.update(update, { "_id": vendorId }, function (response) {
                        if (response != null && response.length != 0) {
                            tables.stylistTable.find({ "vendor_id": vendorId }, function (stylistResponse) {
                                if (stylistResponse != undefined && stylistResponse.length != 0) {
                                    if (profilePic != '') {
                                        setTimeout(function () {
                                            utility.curl.curl('application/index/generateTheStylistImage?image=' + profilePic + '&vendor_id=' + vendorId + '&gender=' + gender, function (response) {

                                            });
                                        }, 1000);
                                    } else if (existingGender != gender) {
                                        profilePic = checkResponse[0]['profile_pic'];
                                        setTimeout(function () {
                                            utility.curl.curl('application/index/generateTheStylistImage?image=' + profilePic + '&vendor_id=' + vendorId + '&gender=' + gender, function (response) {

                                            });
                                        }, 1000);
                                    }

                                    tables.stylistTable.update(stylistSave, { "vendor_id": vendorId }, async function (stylistUpdate) {
                                        var update = utility.updateTmProfile({ "user_id": tmUserId, "name": firstName + ' ' + lastName, 'email': email, "mobile": mobileCountry + '' + mobile })
                                        return res.send({
                                            "success": true,
                                            "status": response.status,
                                            "message": "Updated",
                                            "type": response.type,
                                            "vendor_id": response._id
                                        });

                                    });
                                } else {
                                    stylistSave['vendor_id'] = vendorId;
                                    if (profilePic != '') {
                                        setTimeout(function () {
                                            utility.curl.curl('application/index/generateTheStylistImage?image=' + profilePic + '&vendor_id=' + vendorId + '&gender=' + gender, function (response) {

                                            });

                                        }, 1000);
                                    }
                                    tables.stylistTable.save(stylistSave, function (stylistSave) {
                                        return res.send({
                                            "success": true,
                                            "status": response.status,
                                            "message": "Updated",
                                            "type": response.type,
                                            "vendor_id": response._id

                                        });
                                    });
                                }
                            });

                        } else {
                            return res.send({ "success": false, "status": 2, "message": "try Again" });
                        }
                    });
                } else {
                    return res.send({ "success": false, "status": 1, "message": utility.errorMessages["Invalid User"][languageCode] });

                }
            });
        } else {
            return res.send({ "success": false, "message": utility.errorMessages["email already exists"][languageCode] });
        }
    });



});
router.post('/documents', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    var documents = req.body.documents;
    var stylistDocuemnts = [];
    documents = JSON.parse(documents);
    var tmp = {};
    var countryDocuments = [];
    if (documents.length != 0) {
        //  return res.send({"success":false,"message":(utility.errorMessages["Invalid request"][languageCode]!=undefined?utility.errorMessages["Invalid request"][languageCode]:utility.errorMessages["Invalid request"]['en'])});

        for (var d = 0; d < documents.length; d++) {
            if (documents[d].document_path != undefined) {
                tmp = {};
                tmp['type'] = 0;
                tmp['document_reference_id'] = documents[d].document_id;
                if (documents[d].document_path == undefined || documents[d].document_path == '') {
                    return res.send({ "success": false, "message": "invalid file" });
                }
                var path = documents[d].document_path.split('.');

                var ext = path[path.length - 1];

                ext = ext.toLowerCase();

                if (utility.documentsExtensions.indexOf(ext) === -1) {
                    return res.send({ "success": false, "message": "invalid file ext" });
                }
                tmp['path'] = documents[d].document_path;
                tmp['document_name'] = documents[d].document_name;
                tmp['vendor_id'] = vendorId;
                if (documents[d].expiry_date != undefined) {
                    tmp['expiry_date'] = documents[d].expiry_date;
                    tmp['is_expiry_date'] = 1;
                } else {
                    tmp['is_expiry_date'] = 0;
                }
                tmp['agent_status'] = 0;
                tmp['manager_status'] = 0;
                tmp['admin_status'] = 0;
                tmp['status'] = 1;

                stylistDocuemnts.push(tmp);
            }

        }
    }
    /*var checkCountryDocuemtns=await tables.s4618*/
    var certificates = req.body.certificates;
    var certificatesNames = req.body.certificates_name;


    if (certificates != undefined) {
        certificatesNames = certificatesNames.split(',');
        certificates = certificates.split(',');
        certificates = cleanArray(certificates);
        certificatesNames = cleanArray(certificatesNames);
        if (certificates.length != 0) {
            var certificatesNamesTranslate = {};

            if (certificates.length == certificatesNames.length) {

                for (var c = 0; c < certificatesNames.length; c++) {
                    certificatesNamesTranslate = await utility.translateText(certificatesNames[c], languageCode);
                    certificatesNamesTranslate[languageCode] = certificatesNames[c];
                    tmp = {};
                    tmp['type'] = 2;
                    tmp['document_name'] = certificatesNamesTranslate;
                    if (certificates[c] == undefined || certificates[c] == '') {
                        return res.send({ "success": false, "message": "Invalid file" });
                    }
                    var path = certificates[c].split('.');

                    var ext = path[path.length - 1];
                    ext = ext.toLowerCase();
                    if (utility.documentsExtensions.indexOf(ext) === -1) {
                        return res.send({ "success": false, "message": "Invalid file" });

                    }
                    tmp['path'] = certificates[c];
                    tmp['agent_status'] = 0;
                    tmp['manager_status'] = 0;
                    tmp['vendor_id'] = vendorId;
                    tmp['admin_status'] = 0;
                    tmp['is_expiry_date'] = 0;
                    tmp['status'] = 1;

                    stylistDocuemnts.push(tmp);
                }
            }
        }
    }



    var licence = req.body.licence;
    var document_name = req.body.document_name;
    tmp = {};

    var licenceTrasalate = await utility.translateText('licence', 'en');


    documentTrasalate = {};
    documentTrasalate['en'] = document_name;
    documentTrasalate['tr'] = "Kimlik, Pasaport, Sürücü Belgesi"


    tmp['document_name'] = documentTrasalate;
    tmp['path'] = licence;
    tmp['type'] = 1;
    tmp['is_expiry_date'] = 0;
    tmp['vendor_id'] = vendorId;
    tmp['status'] = 0;
    stylistDocuemnts.push(tmp);
    tables.stylistDocumentsTable.find({ "vendor_id": vendorId }, function (response) {
        if (response != undefined && response.length != 0) {
            tables.stylistDocumentsTable.deleteMany({ "vendor_id": vendorId }, function (response) {
                tables.stylistDocumentsTable.insertMany(stylistDocuemnts, function (response) {
                    tables.vendorTable.update({ "status": 8 }, { "_id": vendorId, "status": { "$eq": 7 } }, function (response) {
                        return res.send({ "success": true, "message": "updated" })
                    });

                });

            });
        } else {
            tables.stylistDocumentsTable.insertMany(stylistDocuemnts, function (response) {
                tables.vendorTable.update({ "status": 8 }, { "_id": vendorId, "status": { "$eq": 7 } }, function (response) {
                    return res.send({ "success": true, "message": "updated" })
                });

            });
        }
    });
});
router.post('/add-documents', tokenValidations, async function (req, res) {

    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var documents = req.body.documents;
    if (documents == '' || documents == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 2
        });
    }
    var stylistDocuemnts = [];
    documents = JSON.parse(documents);
    var tmp = {};
    var countryDocuments = [];
    if (documents.length != 0) {
        //  return res.send({"success":false,"message":(utility.errorMessages["Invalid request"][languageCode]!=undefined?utility.errorMessages["Invalid request"][languageCode]:utility.errorMessages["Invalid request"]['en'])});

        for (var d = 0; d < documents.length; d++) {
            if (documents[d].path != undefined) {
                tmp = {};
                tmp['type'] = 0;
                tmp['document_reference_id'] = documents[d].document_id;
                if (documents[d].path == undefined || documents[d].path == '') {
                    return res.send({ "success": false, "message": "invalid file" });
                }
                var path = documents[d].path.split('.');

                var ext = path[path.length - 1];
                ext = ext.toLowerCase();
                if (utility.documentsExtensions.indexOf(ext) === -1) {
                    return res.send({ "success": false, "message": "invalid file extension" });
                }
                tmp['path'] = documents[d].path;
                tmp['vendor_id'] = vendorId;
                if (documents[d].expiry_date != undefined) {
                    tmp['expiry_date'] = documents[d].expiry_date;
                    tmp['is_expiry_date'] = 1;
                } else {
                    tmp['is_expiry_date'] = 0;
                }
                tmp['agent_status'] = 0;
                tmp['manager_status'] = 0;
                tmp['admin_status'] = 0;
                tmp['status'] = 1;
                stylistDocuemnts.push(tmp);
            }
        }
    }

    var certificates = req.body.certificates;


    if (certificates != undefined) {

        certificates = JSON.parse(certificates);
        if (certificates.length != 0) {

            var certificatesNamesTranslate = {};
            for (var c = 0; c < certificates.length; c++) {
                tmp = {};
                tmp['type'] = 2;
                certificatesNamesTranslate = {};
                var documentName = certificates[c].document_name;
                certificatesNamesTranslate = await utility.translateText(documentName, languageCode);
                certificatesNamesTranslate[languageCode] = documentName;
                tmp['document_name'] = certificatesNamesTranslate;
                var documents_path = certificates[c].path;
                var path = documents_path.split('.');
                var ext = path[path.length - 1];
                ext = ext.toLowerCase();
                if (utility.documentsExtensions.indexOf(ext) != -1) {
                    tmp['path'] = documents_path;
                    tmp['agent_status'] = 0;
                    tmp['manager_status'] = 0;
                    tmp['vendor_id'] = vendorId;
                    tmp['admin_status'] = 0;
                    tmp['is_expiry_date'] = 0;
                    tmp['status'] = 1;

                    stylistDocuemnts.push(tmp);
                } else {
                    return res.send({ "success": false, "message": 'invalid certificate document' });
                }

            }
        }
    }
    // var resume = req.body.resume;
    // tmp = {};
    // var resumeTrasalate = await utility.translateText('resume', 'en');
    // resumeTrasalate['en'] = 'resume';
    // tmp['document_name'] = resumeTrasalate;
    // tmp['path'] = resume;
    var licence = req.body.licence;
    var document_name = req.body.document_name;
    tmp = {};
    // var licenceTrasalate = await utility.translateText('licence', 'en');


    documentTrasalate = {};
    documentTrasalate['en'] = document_name;
    documentTrasalate['tr'] = "Kimlik, Pasaport, Sürücü Belgesi";



    tmp['document_name'] = documentTrasalate;
    tmp['path'] = licence;
    tmp['type'] = 1;
    tmp['is_expiry_date'] = 0;
    tmp['vendor_id'] = vendorId;
    tmp['status'] = 1;

    stylistDocuemnts.push(tmp);
    tables.stylistDocumentsTable.find({ "vendor_id": vendorId }, function (response) {
        if (response != undefined && response.length != 0) {
            tables.stylistDocumentsTable.deleteMany({ "vendor_id": vendorId }, function (response) {
                tables.stylistDocumentsTable.insertMany(stylistDocuemnts, function (response) {
                    tables.vendorTable.update({ "status": 8 }, { "_id": vendorId }, function (response) {
                        return res.send({ "success": true, "message": "updated" })
                    });

                });

            });
        } else {
            tables.stylistDocumentsTable.insertMany(stylistDocuemnts, function (response) {
                tables.vendorTable.update({ "status": 8 }, { "_id": vendorId }, function (response) {
                    return res.send({ "success": true, "message": "updated" })
                });

            });
        }

    });
});
router.post('/booking-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var limit = req.body.limit;
    var offset = req.body.offset;

    if (limit == undefined || limit == '') {
        limit = 10;
    }

    if (offset == undefined || offset == '') {
        offset = 0
    }

    var languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    tables.bookingsTable.getVendorBookings(vendorId, limit, offset, languageCode, async function (response) {

        return res.send({ "success": true, "bookings": response });
    });
});
router.post('/booking-list-count', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;

    var languageCode = req.body.language_code;


    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    let bookingsCount = await tables.bookingsTable.getVendorBookingsCount(vendorId, languageCode);
    bookingsCount = (bookingsCount && bookingsCount.length && bookingsCount[0]['bookings_count'] ? bookingsCount[0]['bookings_count'] : 0);
    return res.send({ "success": true, "bookings": bookingsCount });

});
router.post('/services', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    tables.stylistServicesTable.serviceList(vendorId, languageCode, function (response) {
        return res.send({ "success": true, "services": response });
    });
});
router.post('/get-vendor-basic-details', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    tables.vendorTable.getBasicInfo(vendorId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "basic_details": response[0] });
        } else {
            return res.send({ "success": true, "basic_details": {} });
        }

    });
});
router.post('/get-surge', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']) });
    }
    tables.surgePriceTable.getSurge(function (response) {
        if (response != undefined) {
            return res.send({ "success": true, "surge": response });
        } else {
            return res.send({ "success": true, "surge": {} });
        }

    });
});

router.post('/stylist-details', tokenValidations, async function (req, res) {
    var bookingids = [];
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined) {
        return res.send({ "success": false, "message": utility.errorMessages["Invalid request"][languageCode] != undefined });
    }
    var bookingdetails = await tables.vendorTable.getbookingdetails(vendorId, languageCode)
    if (bookingdetails && bookingdetails.length) {
        bookingids.push(bookingdetails[0]._id);
        await timeOutStylist(bookingids)
    }

    tables.vendorTable.getStylistDetails(vendorId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "stylist": response[0] })
        } else {
            return res.send({ "success": true, "stylist": {} })
        }
    });
});



function timeOutStylist(bookingId) {
    tables.bookingsTable.find({ "_id": { "$in": bookingId } }, async function (response) {
        if (response != undefined && response.length != 0) {
            for (var b = 0; b < response.length; b++) {
                var presentTime = new Date();
                var requestTime = response[0].booking_requested;
                requestTime = new Date(requestTime);

                var dif = presentTime.getTime() - requestTime.getTime();

                var Seconds_from_T1_to_T2 = dif / 1000;

                if (response[b].status == 1 && Seconds_from_T1_to_T2 >= 30) {
                    var vendor_id = response[b].vendor_id;
                    var user_id = response[b].customer_id;


                    var bookingupdate = await tables.bookingsTable.updateWithPromises({ "status": 3 }, { "_id": response[b]._id });

                    var stylistUpdate = await tables.stylistTable.updateWithPromises({ "booking_status": 1 }, { "vendor_id": vendor_id });
                    if (b == response.length - 1) {
                        return
                    }










                }
            }
        }
    });
}
router.post('/rating-submit', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var rating = req.body.rating;
    var review = req.body.comment;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 2
        });
    }
    var bookingDeteails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "customer_id": 1 });

    if (bookingDeteails == undefined || bookingDeteails.length == 0) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 2
        });
    }
    var customerId = bookingDeteails[0].customer_id;
    tables.ratingTable.save({ "booking_id": bookingId, "customer_id": customerId, "vendor_id": vendorId, "rated_by": 2, "rating": rating, "review": review },
        function (response) {
            return res.send({ "success": true, "message": "successfully" });
        });

});
router.post('/stylist-earnings', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }

    if (startDate == '' || startDate == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 2
        });
    }

    if (endDate == '' || endDate == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 3
        });
    }
    var moment = require('moment-timezone');
    endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1, 'd').format("YYYY-MM-DD HH:mm:ss");
    tables.bookingsTable.getStylistEarings(vendorId, startDate, endDate, async function (response) {
        var currency = await tables.vendorTable.getCurrency(vendorId);
        var currencyValues = { "currency_code": "INR", "currency": "₹" };
        if (currency != undefined || currency.length != 0) {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }

        return res.send({ "success": true, "earings": response, "currency": currencyValues });
    });
});
router.post('/stylist-status', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var status = req.body.status;
    var deviceType = req.body.device_type;
    var languageCode = req.body.language_code;
    if (deviceType == undefined) {
        deviceType = 1;
    }

    req.app.io.sockets.in('admins').emit('vendor_status', { 'vendor_id': vendorId, "status": status });
    req.app.io.sockets.in('agents').emit('vendor_status', { 'vendor_id': vendorId, "status": status });
    req.app.io.sockets.in('managers').emit('vendor_status', { 'vendor_id': vendorId, "status": status });
    status = parseInt(status);
    var text = 1;


    if (status == 1) {
        text = utility.user_online_text;
    } else {
        text = utility.user_offline_text;
    }

    var vendorDetails = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "is_locked": 1 });

    if (vendorDetails.length == 0) {
        // return res.send({ "success": false, "message": "try again" });
        return res.send({ "success": false, "message": "Tekrar deneyin" });


    }
    if (vendorDetails[0].is_locked != undefined && vendorDetails[0].is_locked == 2) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["you are blocked by admin please contact admin"][languageCode]


        })
    }
    tables.activityTable.save({ "action_id": vendorId, "activity_title": text, "device_type": deviceType },
        function () {
        });
    tables.stylistTable.update({ "available_status": status }, { "vendor_id": vendorId }, function (response) {
        return res.send({ "success": true, "message": "updated" });
    });
});
router.post('/check-status', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }

    tables.stylistTable.find({ 'vendor_id': vendorId }, function (stylistResponse) {

        if (stylistResponse != undefined && stylistResponse.length != 0) {
            return res.send({
                "success": true,
                "vendor_id": vendorId,
                "manager_status": stylistResponse[0].manager_status,
                "agent_status": stylistResponse[0].agent_status,
                "iban_status": stylistResponse[0].iban_status
            });

        } else {
            return res.send({
                "success": false,
                "message": "try again"
            });
        }

    });
});
router.post('/aggrements-update', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var agreed = req.body.agreed;
    var reason = req.body.reason;
    var languageCode = req.body.language_code;
    var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "first_name": 1, "last_name": 1, "mobile": 1, "mobile_country": 1, "email": 1, "tm_user_id": 1 });

    if (vendorDetails != undefined && vendorDetails.length != 0) {
        var firstName = vendorDetails[0].first_name[languageCode];
    }
    var genreateInviteCode = await utility.generateInviteCodeVendor(firstName);
    var update = {};
    update['status'] = 9;
    update['invite_code'] = genreateInviteCode;
    var mobile = vendorDetails[0].mobile;
    var mobileCountry = vendorDetails[0].mobile_country;
    var name = vendorDetails[0].first_name[languageCode] + " " + vendorDetails[0].last_name[languageCode];
    var email = vendorDetails[0].email;
    var tmUserId = vendorDetails[0].tm_user_id;




    tables.vendorTable.update(update, { "_id": vendorId, "status": 8 }, async function (response) {
        var accessToken = utility.generateAccessToken();
        tables.vendorTable.update({ "access_token": accessToken }, { "_id": vendorId }, function (response) {

        });
        if (tmUserId == undefined || tmUserId == 0) {

            tmUserId = await utility.getTmUserId({ mobile: mobileCountry + mobile, name: name, email: email });
            var update = await tables.vendorTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": vendorId });
        }
        return res.send({ "success": true, "message": 'updated', "status": 9, "tm_user_id": tmUserId, "access_token": accessToken })
    });

});
router.post('/get-about-stylist', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "sucess": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    tables.stylistTable.findFieldsWithProject(vendorId, { "intro": "$intro." + languageCode, "styles": 1, "expertise": 1, "levels": 1 }, function (response) {
        if (response[0].intro == undefined) {
            response[0].intro = '';
        }
        return res.send({ "success": true, "about": response[0] });
    });
});
router.post('/get-stylist-services', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.stylistServicesTable.findFields({ "vendor_id": vendorId, "status": { "$ne": 0 } }, { "service_id": 1, "category_id": 1, "_id": 1, "service_levels": 1, "service_for": 1 }, function (response) {
        return res.send({ "success": true, "services": response });
    });
});


router.post('/get-portfolio', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.portfolioTable.find({ "vendor_id": vendorId }, function (response) {
        return res.send({ "success": true, "portfolio": response });

    });
});
router.post('/get-experience', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.stylistExperienceTable.findwithaggregation({ "vendor_id": vendorId }, function (response) {
        return res.send({ "success": true, "experience": response });
    });
});
router.post('/get-documents', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.stylistDocumentsTable.getDocuments(vendorId, async function (response) {

        if (response != undefined && response.length != 0) {
            for (var i = 0; i < response.length; i++) {
                if (response[i].type == 0) {
                    var referenceId = response[i].document_reference_id;
                    var documents = await tables.documentsTable.findFieldsWithPromises({ "_id": referenceId }, { "document_name": 1 });
                    if (documents != undefined && documents.length != 0) {

                        response[i].document_name =
                            (documents[0].document_name[languageCode] != undefined ? documents[0].document_name[languageCode] : "");
                    }
                } else {
                    response[i].document_name = (response[i].document_name[languageCode] != undefined ? response[i].document_name[languageCode] : '');
                }
            }
        }

        return res.send({ "success": true, "documents": response });
    });
});
router.post('/documents-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid request"][languageCode],
            "errorcode": 1
        });
    }
    tables.vendorTable.getCountryDocuments(vendorId, languageCode, function (response, isabroad) {
        console.log("isabroad>>>>>>>>>>>>>", isabroad)
        if (isabroad == 1) {
            tables.vendorTable.getCountryabroadDocuments(vendorId, languageCode, function (responseone) {
                var finalarray = response.concat(responseone)
                return res.send({ "success": true, "documents": finalarray });
            })
        } else {
            return res.send({ "success": true, "documents": response });
        }


    });
});
router.post('/update-fcm', tokenValidations, async function (req, res) {
    var deviceId = req.body.device_id;
    var deviceType = req.body.device_type;
    var vendorId = req.body.vendor_id;
    var fcmId = req.body.fcm_id;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request",
            "error_code": 1
        });
    } if (fcmId == '' || fcmId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request",
            "error_code": 2
        });
    }
    if (deviceId == '' || deviceId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request",
            "error_code": 3
        });
    }
    var fcmData = {};
    fcmData['fcm_id'] = fcmId;
    fcmData["device_id"] = deviceId;
    deviceType = parseInt(deviceType);
    if (isNaN(deviceType)) {
        deviceType = 1;
    }
    fcmData['device_type'] = deviceType;
    var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "tm_user_id": 1 });
    if (vendorDetails == undefined || vendorDetails.length == 0) {
        return res.send({ "success": false, "message": "Invalid User" });
    }
    var tmUserId = vendorDetails[0].tm_user_id;
    tables.fcmTable.update(fcmData, { "vendor_id": vendorId }, async function (response) {
        if (response == null) {
            var save = {};
            save['fcm'] = [];
            save['fcm'].push(fcmData);
            save['vendor_id'] = vendorId;
            tables.fcmTable.save(save, function (response) {
            });
        }
        var fcmUpdate = await utility.updateFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": deviceType }, utility.user_role_stylist);


    });
    return res.send({ "success": true });
});
router.post('/vendor-ratings', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.vendorTable.getRatings(vendorId, function (response) {
        if (response != undefined) {
            if (response.length != 0) {
                return res.send({ "success": true, "ratings": response[0] });
            } else {
                return res.send({ "success": true, "ratings": {} });
            }
        } else {
            return res.send({ "success": false, "message": "try again" });

        }
    });

});
router.post('/logout', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var deviceType = req.body.device_type;

    var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "tm_user_id": 1, "access_token": 1 });
    if (vendorDetails == undefined || vendorDetails.length == 0) {
        return res.send({ "success": true, "message": "Invalid User" });

    }
    tables.activityTable.save({ "action_id": vendorId, "activity_title": utility.user_logout_text, "device_type": deviceType },
        function () {
        });

    var tmUserId = vendorDetails[0].tm_user_id;
    var fcmId = req.body.fcm_id;

    tables.stylistTable.update({ "available_status": 2 }, { "vendor_id": vendorId }, function (response) {
        tables.fcmTable.deleteVendor({ "vendor_id": vendorId }, async function (response) {
            /* for(var i=0;i<sockets[vendorId].length;i++)
             {

                 if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined)
                 {

                     req.app.io.sockets.sockets[sockets[vendorId][i]].emit("order",{"booking_id":bookingId});
                 }else
                 {
                     sockets[vendorId].slice(i,1);
                 }

             }  */
            if (vendorDetails[0].access_token == req.body.access_token) {
                await tables.vendorTable.updateWithPromises({ "access_token": '' }, { "_id": vendorId });
            }
            var fcmUpdate = await utility.deleteFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": 1 }, utility.user_role_stylist);
            return res.send({ "success": true, "message": "updated" });
        });
    });
});
router.post('/total-earings', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.stylistTable.totalStylistEarings(vendorId, startDate, endDate, async function (response) {
        if (response != undefined && response.length != 0) {
            var currency = await tables.vendorTable.getCurrency(vendorId);
            var currencyValues = { "currency_code": "INR", "currency": "₹" };
            if (currency != undefined || currency.length != 0) {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            var format = 'YYYY-MM-DD HH:mm';
            var moment = require('moment');

            startDate = moment(startDate).format(format);
            endDate = moment(endDate).format(format);

            var promotionAmountDetails = await tables.stylistTable.promotionAmount(vendorId, startDate, endDate);
            var promotionAmount = 0;


            if (promotionAmountDetails != undefined && promotionAmountDetails.length != 0) {
                promotionAmount = promotionAmountDetails[0]['amount'];
            }
            response[0]['promotion_amount'] = promotionAmount;


            return res.send({ "success": true, "total_earings": response[0], "currency": currencyValues });
        } else {
            return res.send({ "success": true, "total_earings": {} });
        }
    });
});
router.post('/card-and-cash-earings', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.stylistTable.cashandcardEarings(vendorId, startDate, endDate, async function (response) {

        if (response != undefined && response.length != 0) {
            var currency = await tables.vendorTable.getCurrency(vendorId);
            var currencyValues = { "currency_code": "INR", "currency": "₹" };
            if (currency != undefined || currency.length != 0) {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            var format = 'YYYY-MM-DD HH:mm';
            var moment = require('moment');

            startDate = moment(startDate).format(format);
            endDate = moment(endDate).format(format);

            var promotionAmountDetails = await tables.stylistTable.promotionAmount(vendorId, startDate, endDate);
            var promotionAmount = 0;


            if (promotionAmountDetails != undefined && promotionAmountDetails.length != 0) {
                promotionAmount = promotionAmountDetails[0]['amount'];
            }
            response[0]['promotion_amount'] = promotionAmount;
            var vendorpaidamount = await tables.stylistTable.vendorpaidamount(vendorId);
            console.log("vendorpaidamount>>>>>>>", vendorpaidamount[0])
            if (vendorpaidamount == null || !vendorpaidamount[0]) {
                amount = 0;
            } else {
                amount = vendorpaidamount[0].vendorpaidprice
            }


            var totalamount = 0, cashamount = 0, cardamount = 0, dueamount = 0, dueamountcancellation = 0;
            if (response[0] && response[0].dueamount[0] && response[0].dueamount[0].cancellation_amount) {
                dueamountcancellation = response[0].dueamount[0].cancellation_amount
            }
            if (response[0].totalamount[0] && response[0].totalamount[0].amount) {
                // totalamount = response[0].totalamount[0].amount - response[0].totalamount[0].mr_miss_fee - response[0].totalamount[0].cancellation_amount;
                totalamount = (response[0].totalamount[0].amount - response[0].totalamount[0].mr_miss_fee).toFixed(2);

            } if (response[0].cashamount[0] && response[0].cashamount[0].amount) {
                cashamount = (response[0].cashamount[0].amount - response[0].cashamount[0].mr_miss_fee - response[0].cashamount[0].cancellation_amount).toFixed(2);
                // cashamount = response[0].cashamount[0].amount - response[0].cashamount[0].mr_miss_fee;

            } if (response[0].cardamount[0] && response[0].cardamount[0].amount) {
                // cardamount = response[0].cardamount[0].amount - response[0].cardamount[0].mr_miss_fee - response[0].cardamount[0].cancellation_amount;
                cardamount = (response[0].cardamount[0].amount - response[0].cardamount[0].mr_miss_fee).toFixed(2);

            } if ((response[0].dueamount[0] && response[0].dueamount[0].mr_miss_fee) || dueamountcancellation) {

                dueamount = Number((Number(response[0].dueamount[0].mr_miss_fee)).toFixed(2) - Number(amount).toFixed(2)) + Number((response[0].dueamount[0].cancellation_amount).toFixed(2));



            }



            return res.send({ "success": true, totalamount: totalamount, cashamount: cashamount, cardamount: cardamount, dueamount: dueamount, "currency": currencyValues });
            // return res.send({ "success": true,"response" : response,"currency": currencyValues });


        } else {
            return res.send({ "success": true, "total_earings": {} });
        }
    });
});
router.post('/bookings-daily', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var limit = req.body.limit;
    var offset = req.body.offset;
    var languageCode = req.body.language_code;

    var moment = require('moment-timezone');
    endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1, 'd').format("YYYY-MM-DD HH:mm:ss");
    tables.bookingsTable.stylistBookingList(vendorId, startDate, endDate, limit, offset, languageCode, async function (response) {
        var currency = await tables.vendorTable.getCurrency(vendorId);
        var currencyValues = { "currency_code": "INR", "currency": "₹" };
        if (currency != undefined || currency.length != 0) {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        res.send({ "success": true, "bookings": response, "currency": currencyValues });
    });
});
router.post('/earned-promotions-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var startDate = req.body.start_date;
    var endDate = req.body.end_date;
    var languageCode = req.body.language_code;

    var moment = require('moment-timezone');
    endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss").add(1, 'd').format("YYYY-MM-DD HH:mm:ss");
    tables.stylistTable.promotionList(vendorId, startDate, endDate, languageCode, async function (response) {
        var currency = await tables.vendorTable.getCurrency(vendorId);
        var currencyValues = { "currency_code": "INR", "currency": "₹" };
        if (currency != undefined || currency.length != 0) {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }
        res.send({ "success": true, "promotions": response, "currency": currencyValues });
    });
});
router.post('/reviews-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var limit = req.body.limit;
    var offset = req.body.offset;

    var languageCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }


    if (limit == undefined || limit == '') {
        limit = 10;
    }

    if (offset == undefined || offset == '') {
        offset = 0
    }

    tables.ratingTable.customerStylistReview(vendorId, limit, offset, function (response) {
        return res.send({ "success": true, "ratings": response });
    });
});
router.post('/stylist-reviews-count', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }


    tables.ratingTable.customerStylistReviewsCount(vendorId, function (response) {
        let reviewsCount = (response && response.length && response[0]['ratingsCount'] ? response[0]['ratingsCount'] : 0);
        return res.send({ "success": true, "ratings_count": reviewsCount });
    });
});
router.post('/deactive-account', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var activeStatus = req.body.active_status;

    var stylistDetails = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "is_locked": 1, "active_status": 1 });


    if (stylistDetails[0]['is_locked'] != undefined && stylistDetails[0]['is_locked'] == 2) {
        return res.send({ "success": false, "message": "your account has been deactivated by admin u can't activate/deactivate  please contact admin" });
    }
    activeStatus = parseInt(activeStatus);
    tables.stylistTable.update({ "active_status": activeStatus }, { "vendor_id": vendorId }, function (response) {
        if (activeStatus == 2) {
            tables.stylistTable.update({ "available_status": 2 }, { "vendor_id": vendorId }, function () {

            });
        }
        return res.send({ "success": true, "message": "updated" });
    });
});
router.post('/update-stylist-services', tokenValidations, async function (req, res) {
    var save = [];
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var updateServices = req.body.update_services;
    var deletedServices = req.body.deleted_services;


    if (languageCode == undefined) {
        languageCode = 'en';
    }



    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 2
        });
    }

    if (deletedServices != undefined) {
        deletedServices = deletedServices.split(',');

        // try {
        //     deletedServices = JSON.parse(JSON.stringify(deletedServices));
        //     console.log("deletedServices111111111",deletedServices)
        // } catch (e) {

        //     console.log("deletedServices222222222222",deletedServices)

        // }
        // try {
        //     deletedServices = JSON.parse(deletedServices);
        //     console.log("deletedServices3333333333333",deletedServices)

        // } catch (e) {
        //     deletedServices = deletedServices;
        //     console.log("deletedServices4444444444444",deletedServices)

        // }

    } else {

        deletedServices = [];
    }

    var services = JSON.parse(req.body.services);
    for (var i = 0; i < services.length; i++) {
        /* var salonServiceListId=*/
        var tmp = {};
        var serviceId = services[i].service_id;
        var categoryId = services[i].category_id;
        var forWhom = parseInt(services[i].for_whom);
        tmp['category_id'] = categoryId;
        tmp['service_id'] = serviceId;
        tmp['service_for'] = forWhom;
        tmp['vendor_id'] = vendorId;
        tmp['service_levels'] = [1];
        tmp['status'] = 1;
        var checkStylistServices = await tables.stylistServicesTable.findFieldsWithPromises({ "service_id": serviceId, "service_for": forWhom, "vendor_id": vendorId }, { "status": 1, "_id": 1 });
        if (checkStylistServices != undefined && checkStylistServices.length != 0) {
            var status = checkStylistServices[0].status;
            var stylistServiceId = checkStylistServices[0].id;
            if (status != undefined && status == 1) {
                return res.send({ "success": false, "message": "service already exits" });
            } else if (status == 0) {
                var deleteServicesResponse = await tables.stylistServicesTable.deleteWithPromises({ "_id": stylistServiceId })
            }
        }
        save.push(tmp);
    }

    if (deletedServices.length != 0) {

        var updateService = await tables.stylistServicesTable.updateManyWithPromises({ "status": 0 }, { "_id": { "$in": deletedServices } });

    }
    if (save.length != 0) {
        tables.stylistServicesTable.insertMany(save, function (response) {
            if (response != undefined) {
                return res.send({ "success": true, "message": "updated" });
            } else {
                return res.send({ "success": false, "message": "try again" });
            }
        });
    } else {
        return res.send({ "success": true, "message": "updated" });
    }

    //return   res.send({"success":true,"message":"updated"});


});
router.post('/stylist-agreement', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    var vendorReponse = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "country": 1 });
    if (vendorReponse != undefined && vendorReponse.length != 0) {
        var country = vendorReponse[0].country;
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 2
        });
    }

    var countryResponse = await tables.countryTable.findFieldsWithPromises({ "_id": country }, { "stylist_agreement": 1 });
    var aggrements = '';
    if (countryResponse != undefined && countryResponse.length != 0 && countryResponse[0].stylist_agreement != undefined) {
        aggrements = (countryResponse[0].stylist_agreement[languageCode] != undefined) ? countryResponse[0].stylist_agreement[languageCode] : '';
    }
    return res.send({ "success": true, "aggrement": aggrements });
});
router.post('/with-draw-amount', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    tables.vendorTable.withDrawAmount(vendorId, async function (response) {
        var amount = 0;
        var cardDetails = await tables.paymentcardTable.gatvendorcards(vendorId);
        if (response != undefined && response.length != 0) {
            var cashAmount = (response[0]['cashAmount'][0] ? response[0]['cashAmount'][0]['amount'] : 0);
            var cashbookingPercentageAmount = (response[0]['cashAmount'][0] ? response[0]['cashAmount'][0]['booking_percentage'] : 0);
            var cardAmount = (response[0]['cardAmount'][0] ? response[0]['cardAmount'][0]['amount'] : 0);
            var cardbookingPercentageAmount = (response[0]['cardAmount'][0] ? response[0]['cardAmount'][0]['booking_percentage'] : 0);
            var cancellationAmount = (response[0]['cancellationAmount'][0] ? response[0]['cancellationAmount'][0]['amount'] : 0);
            amount = cardAmount - cashbookingPercentageAmount - cancellationAmount;

        }


        if (cardDetails != undefined && cardDetails.length != 0 && cardDetails[0].payment != undefined) {
            cardDetails = cardDetails[0].payment
        }
        var currency = await tables.vendorTable.getCurrency(vendorId);
        var currencyValues = { "currency_code": "INR", "currency": "₹" };
        if (currency != undefined && currency.length != 0) {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }

        return res.send({ "success": true, "amount": amount, "payment": cardDetails, "currency": currency });
    });

});
router.post('/delete-card', tokenValidations, async function (req, res) {
    let vendorId = req.body.vendor_id;
    let cardId = req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    if (cardId == '' || cardId == undefined) {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });

    }

    let updateBranch = await tables.vendorTable.updateWithPromises({ "payment.$.status": 0 }, { "_id": vendorId, "payment._id": cardId });

    if (updateBranch) {

        return res.send({ "success": true, "message": "Deleted Successfully" });

    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
});
router.post('/update-card', tokenValidations, async function (req, res) {
    let vendorId = req.body.vendor_id;
    let cardId = req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    if (cardId == '' || cardId == undefined) {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });

    }
    /* var customerDetails=await tables.vendorTable.getPaymentCardDetails(vendorId,cardId);
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
     }
     let updateBranchCard=await tables.customerTable.updateWithPromises({"payment.$.is_primary":0},{"_id":userId,"payment.is_primary":1});
     let updateBranch=await tables.customerTable.updateWithPromises({"payment.$.is_primary":1},{"_id":userId,"payment._id":cardId});
 */
    let updateBranchCard = await tables.vendorTable.updateWithPromises({ "payment.$.is_primary": 0 }, { "_id": vendorId, "payment.is_primary": 1 });
    let updateBranch = await tables.vendorTable.updateWithPromises({ "payment.$.is_primary": 1 }, { "_id": vendorId, "payment._id": cardId });
    if (updateBranch) {
        return res.send({ "success": true, "message": "Updated Successfully" });
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }

});
function compareTime(a, b) {
    var min = { a: 0, b: 0 };

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

    if (min.a < min.b) {
        return 1
    }
    if (min.a > b.cancellation_time_type) {
        return -1;
    }
}
// router.post('/cancellation-policy', tokenValidations, async function (req, res) {
//     var bookingId = req.body.booking_id;
//     var languageCode = req.body.language_code;
//     if (bookingId == '' || bookingId == undefined) {
//         return res.send({
//             "success": false,
//             "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
//             , "errocode": 1
//         });
//     }
//     if (languageCode == '' || languageCode == undefined) {
//         languageCode = 'en';
//     }
//     var type = req.body.type;
//     if (type == undefined) {
//         type = 1;
//     }
//     var response = [];
//     var bookingTime = '';
//     var now = '';
//     var timeDiff = '';
//     var diffDays = '';
//     var diffHrs = '';
//     var diffMins = '';

//     response = await tables.bookingsTable.getCancellationPolicyStylit(bookingId);

//     if (response != undefined && response.length != 0) {
//         bookingTime = response[0].created;
//         now = new Date();
//         bookingTime = new Date(bookingTime);
//         timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
//         diffDays = Math.floor(timeDiff / 86400000); // days
//         diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
//         diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
//         var policyForAcceptance = response[0]['policy_for_acceptance'];
//         var policyForArrival = response[0]['policy_for_arrival'];
//         if (policyForArrival == undefined || policyForArrival.length == 0) {
//             policyForArrival = [];
//             policyForArrival['policy'] = [];
//         }
//         var cancellationTime = '';
//         var cancellationTimeType = '';
//         var cancellationType = '';
//         var cancellationTypeValue = '';
//         var text = '';
//         var acceptanceTotalPolicy = [];
//         var arrialTotalPolicy = [];

//         var near = response[0].is_notified;
//         if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0 && type != 2)) {
//             if (policyForAcceptance['policy'].length != 0) {
//                 var acceptancePolicy = policyForAcceptance['policy'];
//                 acceptancePolicy = acceptancePolicy.sort(compareTime);
//                 for (var ac = 0; ac < acceptancePolicy.length; ac++) {
//                     text = '';
//                     if (diffDays != 0) {

//                         if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
//                             if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
//                                 text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " days of stylist acceptance are subject to";

//                             }
//                         }
//                     }
//                     if (diffHrs != 0) {
//                         if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
//                             if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
//                                 text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " hours of stylist acceptance are subject to";
//                             }
//                         }
//                     }
//                     if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {


//                         if (diffMins >= acceptancePolicy[ac].cancellation_time) {

//                             if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

//                                 text += "Appointments cancelled  " + acceptancePolicy[ac].cancellation_time + " mins of stylist acceptance are subject to";
//                             }
//                         }
//                     }
//                     if (text != '') {


//                         if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
//                             text += " You will be rated a " + acceptancePolicy[ac].cancellation_type_value + " star for the current booking which might effect your upcoming bookings";
//                         }
//                         if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
//                             text += ' ' + acceptancePolicy[ac].cancellation_type_value + " % of the service cost.";
//                         }
//                         if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
//                             text += " levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
//                         }
//                         acceptanceTotalPolicy.push(text);
//                         break;
//                     }

//                 }
//             }
//         } else {
//             if (policyForArrival['policy'] != undefined && policyForArrival['policy'].length != 0) {
//                 var arrivalPolicy = policyForArrival['policy'];
//                 arrivalPolicy = arrivalPolicy.sort(compareTime);

//                 for (var ar = 0; ar < arrivalPolicy.length; ar++) {
//                     text = '';
//                     if (diffDays != 0) {

//                         if (diffDays >= arrivalPolicy[ar].cancellation_time);
//                         {
//                             if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {

//                                 text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " days of stylist acceptance are subject to";

//                             }
//                         }


//                     }
//                     if (diffHrs != 0 && diffDays != 0) {
//                         if (diffHrs >= arrivalPolicy[ar].cancellation_time) {
//                             if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
//                                 text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " hours of stylist acceptance are subject to";

//                             }
//                         }


//                     }
//                     if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
//                         if (diffMins >= arrivalPolicy[ar].cancellation_time) {
//                             if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
//                                 text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " mins of stylist acceptance are subject to";

//                             }
//                         }



//                     }
//                     if (text != '') {
//                         if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
//                             text += " You will be rated a " + arrivalPolicy[ar].cancellation_type_value + " star for the current booking which might effect your upcoming bookings";
//                         }
//                         if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
//                             text += ' ' + arrivalPolicy[ar].cancellation_type_value + " % of the service cost.";
//                         }
//                         if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
//                             text += " levy a charge of flat " + arrivalPolicy[ar].cancellation_type_value
//                         }
//                         arrialTotalPolicy.push(text);
//                         break;
//                     }
//                 }


//             }
//         }

//         var cancel = '';


//         if (near == 1 && acceptanceTotalPolicy.length != 0 || ((policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) && type != 2) {

//             cancel = acceptanceTotalPolicy[0];
//         }

//         else if (arrialTotalPolicy.length != 0) {
//             cancel = arrialTotalPolicy[0];
//         }

//         if (cancel == '' || cancel == undefined) {
//             // cancel = "no cancellation fee";
//             cancel = "İptal üceti yok.";

//         }

//         return res.send({ "success": true, "text": cancel })
//     } else {
//         if (response != undefined) {
//             return res.send({
//                 "success": true,
//                 // "text": "no cancellation policy"
//                 "text": "İptal üceti yok."


//             });
//         } else {
//             return res.send({
//                 "success": false,
//                 "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
//             });
//         }
//     }

// });


router.post('/cancellation-policy', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    var type = req.body.type;
    if (type == undefined) {
        type = 1;
    }
    var response = [];
    var bookingTime = '';
    var now = '';
    var timeDiff = '';
    var diffDays = '';
    var diffHrs = '';
    var diffMins = '';

    response = await tables.bookingsTable.getCancellationPolicyStylit(bookingId);

    if (response != undefined && response.length != 0) {
        bookingTime = response[0].created;
        now = new Date();
        bookingTime = new Date(bookingTime);
        timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        diffDays = Math.floor(timeDiff / 86400000); // days
        diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        var policyForAcceptance = response[0]['policy_for_acceptance'];
        var policyForArrival = response[0]['policy_for_arrival'];
        if (policyForArrival == undefined || policyForArrival.length == 0) {
            policyForArrival = [];
            policyForArrival['policy'] = [];
        }
        var cancellationTime = '';
        var cancellationTimeType = '';
        var cancellationType = '';
        var cancellationTypeValue = '';
        var text = '';
        var acceptanceTotalPolicy = [];
        var arrialTotalPolicy = [];

        var near = response[0].is_notified;
        if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0 && type != 2)) {
            if (policyForAcceptance['policy'].length != 0) {
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {
                    text = '';
                    if (diffDays != 0) {

                        if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " days of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} günü aştınız.`;

                            }
                        }
                    }
                    else if (diffHrs != 0) {
                        if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " hours of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} saati aştınız.`;

                            }
                        }
                    }
                    else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {


                        if (diffMins >= acceptancePolicy[ac].cancellation_time) {

                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                // text += "Appointments cancelled  " + acceptancePolicy[ac].cancellation_time + " mins of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} dakikayı aştınız.`;

                            }
                        }
                    }
                    if (text != '') {


                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            // text += " You will be rated a " + acceptancePolicy[ac].cancellation_type_value + " star for the current booking which might effect your upcoming bookings";
                            text += `İptal işleminizden dolayı ${acceptancePolicy[ar].cancellation_type_value} puanla değerlendirileceksiniz. Düşük puanlar sonraki rezervasyonlarınızın sayısını etkileyebilir.`


                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            var flatamount = ((response[0].net_amount * response[0].surge) * acceptancePolicy[ac].cancellation_type_value) / 100;
                            if (flatamount < utility.minimumcancellationamount) {
                                flatamount = utility.minimumcancellationamount;
                            }
                            // text += ' ' + acceptancePolicy[ac].cancellation_type_value + " % of the service cost.";
                            text += ` İptal ederseniz ${flatamount} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            // text += " levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
                            text += ` İptal ederseniz ${acceptancePolicy[ac].cancellation_type_value} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                        }
                        acceptanceTotalPolicy.push(text);
                        break;
                    }

                }
            }
        } else {
            if (policyForArrival['policy'] != undefined && policyForArrival['policy'].length != 0) {
                var arrivalPolicy = policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for (var ar = 0; ar < arrivalPolicy.length; ar++) {
                    text = '';
                    if (diffDays != 0) {

                        if (diffDays >= arrivalPolicy[ar].cancellation_time);
                        {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {

                                // text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " days of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${arrivalPolicy[ar].cancellation_time} günü aştınız.`;

                            }
                        }


                    }
                    else if (diffHrs != 0) {
                        if (diffHrs >= arrivalPolicy[ar].cancellation_time) {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                // text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " hours of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${arrivalPolicy[ar].cancellation_time} saati aştınız.`;

                            }
                        }


                    }
                    else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
                        if (diffMins >= arrivalPolicy[ar].cancellation_time) {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                // text += "Appointments cancelled " + arrivalPolicy[ar].cancellation_time + " mins of stylist acceptance are subject to";
                                text += `Ücretsiz iptal süreniz olan ${arrivalPolicy[ar].cancellation_time} dakikayı aştınız.`;

                            }
                        }



                    }
                    if (text != '') {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            // text += " You will be rated a " + arrivalPolicy[ar].cancellation_type_value + " star for the current booking which might effect your upcoming bookings";
                            text += `İptal işleminizden dolayı ${arrivalPolicy[ar].cancellation_type_value} puanla değerlendirileceksiniz. Düşük puanlar sonraki rezervasyonlarınızın sayısını etkileyebilir.`
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            // text += ' ' + arrivalPolicy[ar].cancellation_type_value + " % of the service cost.";
                            var flatamount = ((response[0].net_amount * response[0].surge) * arrivalPolicy[ar].cancellation_type_value) / 100;
                            if (flatamount < utility.minimumcancellationamount) {
                                flatamount = utility.minimumcancellationamount;
                            }
                            text += ` İptal ederseniz ${flatamount} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            // text += " levy a charge of flat " + arrivalPolicy[ar].cancellation_type_value
                            text += ` İptal ederseniz ${arrivalPolicy[ac].cancellation_type_value} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                        }
                        arrialTotalPolicy.push(text);
                        break;
                    }
                }


            }
        }

        var cancel = '';


        if (near == 1 && acceptanceTotalPolicy.length != 0 || ((policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) && type != 2) {

            cancel = acceptanceTotalPolicy[0];
        }

        else if (arrialTotalPolicy.length != 0) {
            cancel = arrialTotalPolicy[0];
        }

        if (cancel == '' || cancel == undefined) {
            // cancel = "no cancellation fee";
            cancel = "İptal üceti yok.";

        }

        return res.send({ "success": true, "text": cancel })
    } else {
        if (response != undefined) {
            return res.send({
                "success": true,
                // "text": "no cancellation policy"
                "text": "İptal üceti yok."


            });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    }

});
router.post('/transfer-amount', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;



    tables.vendorTable.withDrawAmount(vendorId, async function (response) {
        var amount = 0;


        if (response != undefined && response.length != 0) {
            var cashAmount = (response[0]['cashAmount'][0] ? response[0]['cashAmount'][0]['amount'] : 0);
            var cashbookingPercentageAmount = (response[0]['cashAmount'][0] ? response[0]['cashAmount'][0]['booking_percentage'] : 0);
            var cardAmount = (response[0]['cardAmount'][0] ? response[0]['cardAmount'][0]['amount'] : 0);
            var cardbookingPercentageAmount = (response[0]['cardAmount'][0] ? response[0]['cardAmount'][0]['booking_percentage'] : 0);
            var cancellationAmount = (response[0]['cancellationAmount'][0] ? response[0]['cancellationAmount'][0]['amount'] : 0);
            amount = cardAmount - cashbookingPercentageAmount - cancellationAmount;
        }
        var currency = await tables.vendorTable.getCurrency(vendorId);
        var currencyValues = { "currency_code": "INR", "currency": "₹" };
        if (currency != undefined && currency.length != 0) {
            currencyValues['currency_code'] = currency[0].currency_code;
            currencyValues['currency'] = currency[0].currency_symbol;
        }

        if (amount > 0) {
            var cashAmountBooking = (response[0]['cashAmount'][0] ? response[0]['cashAmount'][0]['booking'] : []);
            var cardAmountBooking = (response[0]['cardAmount'][0] ? response[0]['cardAmount'][0]['booking'] : []);
            var cancellationBooking = (response[0]['cancellationAmount'][0] ? response[0]['cancellationAmount'][0]['booking'] : []);
            var bookingIds = [...cashAmountBooking, ...cardAmountBooking, ...cancellationBooking];
            var stylistDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "strip_account_id": 1 });
            if (stylistDetails && stylistDetails[0]['strip_account_id']) {
                var stripe = require('../utility/stripPayment');
                var paymentResponse = await stripe.transferAmount(amount, currencyValues.currency_code, stylistDetails[0]['strip_account_id']);
                if (paymentResponse) {
                    var updateResponse = await tables.bookingsTable.updateManyWithPromises({ "vendor_payment_status": 1 }, { "_id": { "$in": bookingIds } });
                    var updatePayment = await tables.vendorTable.updatePaymentStylist({
                        "amount": amount,
                        "created_at": new Date(),
                        "status": 1, transfer: paymentResponse
                    }, { "_id": vendorId });
                    return res.send({ "success": true, "message": "transfered" });
                } else {
                    return res.send({ "success": false, "message": "No Balance in strip to transfer " })
                }
            }
        } else {
            return res.send({ "success": false, "message": "no amount to transfer" });
        }
    });
});
router.post('/with-draw-list', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    tables.vendorTable.withDrawalListStylist(vendorId, async function (response) {
        if (response != undefined && response.length != 0) {
            var currency = await tables.vendorTable.getCurrency(vendorId);
            var currencyValues = { "currency_code": "INR", "currency": "₹" };
            if (currency != undefined && currency.length != 0) {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            response = response.reverse();
            return res.send({ "success": true, "details": response, "currency": currency });
        } else {
            return res.send({ "success": true, "details": [] });
        }

    });
});
function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}
router.post('/update-stylist-documents', tokenValidations, async function (req, res) {
    var documents = req.body.documents;
    var updateDocuments = req.body.update_documents;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var deleteDocuments = req.body.deleted_documents;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    var tmp = {};
    var stylistDocuemnts = [];
    var isDocumentUploaded = false;
    if (documents != undefined && documents.length != 0 && documents != '') {
        documents = JSON.parse(documents);
        for (var d = 0; d < documents.length; d++) {

            if (documents[d].document_path != undefined) {
                tmp = {};
                tmp['type'] = 0;
                tmp['document_reference_id'] = documents[d].document_id;
                if (documents[d].document_path == undefined || documents[d].document_path == '') {
                    return res.send({ "success": false, "message": "invalid file" });
                }
                var path = documents[d].document_path.split('.');

                var ext = path[path.length - 1];
                if (utility.documentsExtensions.indexOf(ext) === -1) {
                    return res.send({ "success": false, "message": "invalid file" });

                }
                tmp['path'] = documents[d].document_path;

                tmp['vendor_id'] = vendorId;
                if (documents[d].expiry_date != undefined) {
                    tmp['expiry_date'] = documents[d].expiry_date;
                    tmp['is_expiry_date'] = 0;
                } else {
                    tmp['is_expiry_date'] = 1;
                }
                tmp['agent_status'] = 0;
                tmp['manager_status'] = 0;
                tmp['status'] = 1;

                tmp['admin_status'] = 0;
                isDocumentUploaded = true;
                stylistDocuemnts.push(tmp);
            }

        }
    }


    var certificates = req.body.certificates;
    var certificatesNames = req.body.certificates_name;

    if (certificates != undefined) {
        certificatesNames = certificatesNames.split(',');
        certificates = certificates.split(',');
        certificates = cleanArray(certificates);
        certificatesNames = cleanArray(certificatesNames);
        if (certificates.length != 0) {

            var certificatesNamesTranslate = {};
            if (certificates.length == certificatesNames.length) {

                for (var c = 0; c < certificatesNames.length; c++) {

                    tmp = {};
                    tmp['type'] = 2;


                    certificatesNamesTranslate = await utility.translateText(certificatesNames[c], languageCode);
                    certificatesNamesTranslate[languageCode] = certificatesNames[c];
                    tmp['document_name'] = certificatesNamesTranslate;

                    if (certificates[c] == undefined || certificates[c] == '') {
                        return res.send({ "success": false, "message": "invalid file" });
                    }
                    var path = certificates[c].split('.');

                    var ext = path[path.length - 1];
                    if (utility.documentsExtensions.indexOf(ext) === -1) {
                        return res.send({ "success": false, "message": "invalid file" });

                    }
                    tmp['path'] = certificates[c];
                    tmp['agent_status'] = 0;
                    tmp['manager_status'] = 0;
                    tmp['vendor_id'] = vendorId;
                    tmp['admin_status'] = 0;
                    tmp['status'] = 1;

                    tmp['is_expiry_date'] = 0;
                    isDocumentUploaded = true;
                    stylistDocuemnts.push(tmp);
                }
            }
        }
    }
    if (updateDocuments != undefined && updateDocuments.length != 0) {

        updateDocuments = JSON.parse(updateDocuments);
        if (updateDocuments.length != 0) {

            var documentsPath = '';
            var update = {};
            var docuemntId = '';
            var type = '';
            for (var u = 0; u < updateDocuments.length; u++) {


                update = {};
                documentsPath = updateDocuments[u].document_path;
                update['path'] = documentsPath;

                docuemntId = updateDocuments[u].document_id;
                if (updateDocuments[u].expiry_date != undefined) {
                    update['expiry_date'] = updateDocuments[u].expiry_date;
                }
                type = updateDocuments[u].type;
                if (type == 2) {
                    update['document_name.' + languageCode] = updateDocuments[u].document_name;
                }
                if (documentsPath != undefined) {



                    if (documentsPath == undefined || documentsPath == '') {
                        return res.send({ "success": false, "message": "invalid file" });
                    }
                    var path = updateDocuments[u].document_path;
                    path = path.split('.');
                    var ext = path[path.length - 1];
                    if (utility.documentsExtensions.indexOf(ext) === -1) {
                        return res.send({ "success": false, "message": "invalid file" });

                    }
                    update['agent_status'] = 0;
                    update['manager_status'] = 0;
                    var documentStatus = await tables.stylistDocumentsTable.updateWithPromises(update, { "_id": docuemntId });

                    if (documentStatus == null || documentStatus == undefined && documentStatus.length == 0) {
                        return res.send({
                            "success": false,
                            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                        });
                    }
                    isDocumentUploaded = true;
                }

            }
        }
    }

    if (deleteDocuments != undefined) {
        deleteDocuments.split(",");
        deleteDocuments = cleanArray(deleteDocuments);
    }


    if (deleteDocuments != undefined && deleteDocuments.length != 0) {
        var deleteDocumentsStatus = await tables.stylistDocumentsTable.deleteWithPromises({ "_id": { "$in": deleteDocuments } });
    }

    if (stylistDocuemnts.length != 0) {

        tables.stylistDocumentsTable.insertMany(stylistDocuemnts, async function (response) {

            if (response != undefined) {
                if (isDocumentUploaded) {
                    var update = await tables.stylistTable.updateWithPromises({ "agent_status": 0, "manager_status": 0 }, { "vendor_id": vendorId });
                }
                return res.send({ "success": true, "message": "updated" });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }

        });
    } else {
        if (isDocumentUploaded) {
            tables.stylistTable.update({ "agent_status": 0, "manager_status": 0 }, { "vendor_id": vendorId }, function (response) {

            });
        }
        return res.send({ "success": true, "message": "updated" });
    }
});
router.post('/update-documents', tokenValidations, async function (req, res) {
    var documents = req.body.documents;
    var updateDocuments = req.body.update_documents;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var deleteDocuments = req.body.deleted_documents;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    var tmp = {};
    var stylistDocuemnts = [];
    var isDocumentUploaded = false;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errocode": 1
        });
    }

    if (documents != undefined && documents.length != 0 && documents != '') {
        documents = JSON.parse(documents);
        for (var d = 0; d < documents.length; d++) {

            if (documents[d].path != undefined) {
                tmp = {};
                tmp['type'] = 0;
                tmp['document_reference_id'] = documents[d].document_id;
                if (documents[d].path == undefined || documents[d].path == '') {
                    return res.send({ "success": false, "message": "Invalid file" });
                }
                var path = documents[d].path.split('.');

                var ext = path[path.length - 1];
                ext = ext.toLowerCase();
                if (utility.documentsExtensions.indexOf(ext) === -1) {
                    return res.send({ "success": false, "message": "Invalid file" });
                }
                tmp['path'] = documents[d].path;
                tmp['document_name'] = documents[d].document_name;
                tmp['vendor_id'] = vendorId;
                if (documents[d].expiry_date != undefined) {
                    tmp['expiry_date'] = documents[d].expiry_date;
                    tmp['is_expiry_date'] = 0;
                } else {
                    tmp['is_expiry_date'] = 1;
                }
                tmp['agent_status'] = 0;
                tmp['manager_status'] = 0;
                tmp['admin_status'] = 0;
                tmp['status'] = 1;

                isDocumentUploaded = true;
                stylistDocuemnts.push(tmp);
            } else {
                return res.send({ "success": false, "message": "invalid file" });

            }

        }
    }

    var certificates = req.body.certificates;


    if (certificates != undefined) {

        certificates = JSON.parse(certificates);
        if (certificates.length != 0) {
            var certificatesNamesTranslate = {};
            for (var c = 0; c < certificates.length; c++) {
                tmp = {};
                tmp['type'] = 2;

                var documentName = certificates[c].document_name;

                var documents_path = certificates[c].path;
                var path = documents_path.split('.');
                var ext = path[path.length - 1];
                ext = ext.toLowerCase();
                if (utility.documentsExtensions.indexOf(ext) != -1) {
                    certificatesNamesTranslate = await utility.translateText(documentName, languageCode);
                    certificatesNamesTranslate[languageCode] = documentName;
                    tmp['document_name'] = certificatesNamesTranslate;
                    tmp['path'] = documents_path;
                    tmp['agent_status'] = 0;
                    tmp['manager_status'] = 0;
                    tmp['vendor_id'] = vendorId;
                    tmp['admin_status'] = 0;
                    tmp['is_expiry_date'] = 0;
                    tmp['status'] = 1;
                    isDocumentUploaded = true;
                    stylistDocuemnts.push(tmp);
                } else {
                    return res.send({ "success": false, "message": 'invalid certificate document' });
                }



            }
        }
    }
    if (updateDocuments != undefined && updateDocuments.length != 0) {

        updateDocuments = JSON.parse(updateDocuments);
        var checkDocument = [];
        if (updateDocuments.length != 0) {
            var documentsPath = '';
            var update = {};
            var docuemntId = '';
            var type = '';
            for (var u = 0; u < updateDocuments.length; u++) {
                update = {};
                documentsPath = updateDocuments[u].path;
                update['path'] = documentsPath;

                docuemntId = updateDocuments[u].document_id;
                if (updateDocuments[u].expiry_date != undefined) {
                    update['expiry_date'] = updateDocuments[u].expiry_date;
                }
                type = updateDocuments[u].type;
                if (type == 2) {

                    update['document_name.' + languageCode] = updateDocuments[u].document_name;
                }
                /* if(documentsPath!=undefined) {
 
 
 
                     if(documentsPath==undefined || documentsPath=='')
                     {
                         return res.send({"success":false,"message":"invalid file"});
                     }
                     var path=updateDocuments[u].path;
                     path=path.split('.');
                     var ext=path[path.length-1];
                     if(utility.documentsExtensions.indexOf(ext)=== -1)
                     {
                         return res.send({"success":false,"message":"invalid file"});
                     }
 
                     update['agent_status'] = 0;
                     update['manager_status'] = 0;
                     var documentStatus=await tables.stylistDocumentsTable.updateWithPromises(update,{"_id":docuemntId});
 
                     if(documentStatus==null || documentStatus==undefined && documentStatus.length==0){
                         return res.send({
                             "success": false,
                             "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                         });
                     }
                     isDocumentUploaded=true;
                 }*/
                docuemntId = updateDocuments[u].document_id;

                type = parseInt(type);
                checkDocument = [];
                if (docuemntId == undefined || docuemntId == '')  //  checking  new upload documents
                {

                    if (documentsPath != '') {
                        var path = updateDocuments[u].path;
                        path = path.split('.');
                        var ext = path[path.length - 1];
                        if (utility.documentsExtensions.indexOf(ext) === -1) {
                            return resolve({ "success": false, "message": "invalid file" });
                        }
                        var tmp = {};

                        tmp['type'] = type;
                        if (type == 2) {
                            tmp['document_name.' + languageCode] = updateDocuments[u].document_name;
                        }
                        tmp['path'] = documentsPath;
                        tmp['vendor_id'] = vendorId;

                        if (type == 0) {
                            var documentReferenceId = updateDocuments[u].document_reference_id;
                            if (documentReferenceId == '' || documentReferenceId == undefined) {
                                return res.send({
                                    "success": false,
                                    "message": utility.errorMessages['document reference id missing'][languageCode]
                                    , "error_code": 4
                                });
                            }
                            checkDocument = await tables.stylistDocumentsTable.findFieldsWithPromises({ "document_reference_id": documentReferenceId }, { "_id": 1 });
                            if (updateDocuments[u].expiry_date != undefined) {
                                tmp['is_expiry_date'] = 1;
                                tmp['expiry_date'] = updateDocuments[u].expiry_date;
                            } else {
                                tmp['is_expiry_date'] = 0;
                            }
                            tmp['agent_status'] = 0;
                            tmp['manager_status'] = 0;
                            tmp['document_reference_id'] = documentReferenceId;
                            tmp['status'] = 1;

                            if (checkDocument.length != 0) {
                                docuemntId = checkDocument[0]._id;
                                update = tmp;
                                isDocumentUploaded = true;
                                await tables.stylistDocumentsTable.updateWithPromises(update, { "_id": docuemntId });
                            }
                        }

                        if (checkDocument.length == 0) {
                            isDocumentUploaded = true;
                            stylistDocuemnts.push(tmp);
                        }
                    }
                } else {

                    // update = {};
                    update['path'] = documentsPath;
                    if (updateDocuments[u].expiry_date != undefined) {
                        tmp['is_expiry_date'] = 1;

                        update['expiry_date'] = updateDocuments[u].expiry_date;
                    } else {
                        tmp['is_expiry_date'] = 0;
                    }

                    if (documentsPath != undefined) {
                        if (documentsPath == undefined || documentsPath == '') {
                            return res.send({ "success": false, "message": "invalid file" });
                        }
                        var path = updateDocuments[u].path;
                        path = path.split('.');
                        var ext = path[path.length - 1];
                        ext = ext.toLowerCase();
                        if (utility.documentsExtensions.indexOf(ext) === -1) {
                            return res.send({ "success": false, "message": "invalid file" });
                        }
                        update['agent_status'] = 0;
                        update['manager_status'] = 0;
                        var documentStatus = await tables.stylistDocumentsTable.updateWithPromises(update, { "_id": docuemntId });
                        if (documentStatus == null || documentStatus == undefined && documentStatus.length == 0) {
                            return res.send({
                                "success": false,
                                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                , "error_code": 1
                            });
                        }
                        isDocumentUploaded = true;
                    }
                }
            }
        }
    }

    if (deleteDocuments != undefined) {
        try {
            deleteDocuments = JSON.parse(deleteDocuments);
        } catch (e) {
            deleteDocuments = deleteDocuments.split(',');
        }
        deleteDocuments = cleanArray(deleteDocuments);
    }
    if (deleteDocuments != undefined && deleteDocuments.length != 0) {
        var deleteDocumentsStatus = await tables.stylistDocumentsTable.deleteWithPromises({ "_id": { "$in": deleteDocuments } });
    }

    if (stylistDocuemnts.length != 0) {

        tables.stylistDocumentsTable.insertMany(stylistDocuemnts, async function (response) {

            if (response != undefined) {
                if (isDocumentUploaded) {
                    var update = await tables.stylistTable.updateWithPromises({ "agent_status": 0, "manager_status": 0 }, { "vendor_id": vendorId });
                }
                return res.send({ "success": true, "message": "updated" });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }

        });
    } else {
        if (isDocumentUploaded) {
            tables.stylistTable.update({ "agent_status": 0, "manager_status": 0 }, { "vendor_id": vendorId }, function (response) {

            });
        }
        return res.send({ "success": true, "message": "updated" });
    }
});
router.post("/promotions", tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var countryDetails = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "country": 1 });
    if (countryDetails == undefined || countryDetails.length == 0) {
        return res.send({
            "success": false,
            "message": "Something went wrong. Please try again after sometime"
        });
    }
    var country = countryDetails[0].country;
    var promoFor = utility.PROMO_FOR_STYLIST;
    tables.promoCodeTable.getPromoCodes(country, promoFor, function (promoCodes) {
        if (promoCodes != undefined) {
            return res.send({ "success": true, "promo_codes": promoCodes })
        } else {
            return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
        }

    });
});
router.post('/currency-values', tokenValidations, function (req, res) {
    tables.countryTable.getAllCurrency(function (response) {
        return res.send({ "success": true, "currency": response[0].symbol })
    });
});
router.post('/stylist-services', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;

});
router.post('/aws-keys', tokenValidations, function (req, res) {
    var fs = require('fs'),
        path = require('path'),
        filePath = path.join(__dirname, '../aws-config.json');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            var jsonData = data.trim();

            var keys = encrypt(jsonData, '1234567890123456');
            return res.send({ "success": true, "keys": keys });
        } else {

            return res.send({ "success": false, "message": "no keys" });
        }
    });
});
router.post('/promotions-list', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.languages_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    var stylistDetails = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "city_id": 1 });


    if (stylistDetails == undefined || stylistDetails.length == 0 || stylistDetails[0].city_id == undefined) {
        return res.send({ "success": true, 'promotions': [] });
    }
    var city = stylistDetails[0].city_id;
    var dateTimeFormat = 'YYYY-MM-DD HH:mm';
    var moment = require('moment-timezone');
    var startDateTime = moment.utc();
    var startDate = startDateTime.format(dateTimeFormat);
    tables.promotionsTable.getPromotions(city, startDate, languagesCode, function (response) {
        return res.send({ "success": true, "promotions": response });
    });
});
router.post('/weekly-rating', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var languagesCode = req.body.languages_code;
    if (languagesCode == '' || languagesCode == undefined) {
        languagesCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    var format = 'YYYY-MM-DD';
    var moment = require('moment-timezone');
    var stylistDetails = await tables.stylistTable.findFieldsWithPromises({ "vendor_id": vendorId }, { "city_id": 1 });
    var startDate = moment().startOf('week').utc().format('YYYY-MM-DD');
    var endDate = moment().endOf('week').utc().format('YYYY-MM-DD');
    if (stylistDetails == undefined || stylistDetails.length == 0) {
        return res.send({ "success": true, "rating": { "vendor_id": vendorId, "rating": 0, "start_date": startDate, "end_date": endDate } });
    }
    /* var city=stylistDetails[0].city_id;
      var timeZoneDetails = await tables.citiesTable.findFieldsWithPromises({"_id":city},{'time_zone':1});
        var timeZone=timeZoneDetails[0].time_zone;*/


    //  var endDate=moment.tz(new Date(),format,timeZone).utc().format(format);
    //  var startDate=moment.tz(new Date(),format,timeZone).add(7,'d').utc().format(format);
    /*var startDate=moment.tz(new Date(),format,timeZone).startOf('week').utc().format('YYYY-MM-DD');
    var endDate=moment.tz(new Date(),format,timeZone).endOf('week').utc().format('YYYY-MM-DD');*/
    tables.bookingsTable.getStylistWeeklyRating(vendorId, startDate, endDate, function (response) {
        if (response != undefined && response.length != 0) {
            response[0].start_date = startDate;
            response[0].end_date = endDate;
            return res.send({ "success": true, "rating": response[0] });
        } else {
            return res.send({ "success": true, "rating": { "vendor_id": vendorId, "rating": 0, "start_date": startDate, "end_date": endDate } });
        }

    });
});
router.post('/online-summary', tokenValidations, function (req, res) {

    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var moment = require('moment-timezone');
    var presentDate = moment(moment().tz('Asia/Kolkata').format("YYYY-MM-DD") + " " + "00:00").utc().format("YYYY-MM-DD HH:mm");
    return res.send({ "success": true, "online_mintues": 10 });
});
module.exports = router;
