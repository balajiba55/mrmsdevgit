var express = require('express');
var router = express.Router();
var tables = require('../db_modules/baseTable');
var token = "bXImbXJzYXBpdG9rZW4";
var utility = require('../utility/utility');
var async = require('async');
var trim = require('trim');
var crypto = require('crypto');
const axios = require('axios');
const erpbaseUrl = "http://myor.mrandmsbeauty.com/";
const publicIp = require('public-ip');




async function tokenValidations(req, res, next) {
    var startTime = utility.getTime;
    var endTime = utility.getTime;


    var languageCode = req.body.language_code;
    languageCode = utility.languageCode(languageCode);

    req.body.language_code = languageCode;
    console.log(req.originalUrl, req.body);

    var writeData = { "start_time": startTime, "end_time": endTime, "request_from": "vendor", "path": req.originalUrl, "request": req.body };
    utility.writeToFile.writeToFile(writeData);

    if (req.body.token == token) {
        return next()

        // var vendor_id = req.body.vendor_id || req.body.vendorId;

        // if (vendor_id) {
        //     var vendorAcessToken = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "access_token": 1, "is_locked": 1 });

        //     if (vendorAcessToken == undefined || vendorAcessToken.length == 0) {
        //         return res.json({ success: false, message: "Invalid Access Your Account is going to logout ", "is_login": 2 });
        //     }
        //     if (vendorAcessToken != undefined && vendorAcessToken.length != 0 && vendorAcessToken[0]['access_token'] != req.body.access_token) {
        //         return res.json({ success: false, message: "Invalid Access Your Account is going to logout", "is_login": 2 });
        //     }


        // } else {

        //     return next()

        // }

    }
    else {
        return res.json({
            "success": false,
            "message": (utility.errorMessages["Invalid token"][languageCode] != undefined ? utility.errorMessages["Invalid token"][languageCode] : utility.errorMessages["Invalid token"]['en'])
        })
    }
}



// if (req.body.token == token) {
//     var userId = req.body.user_id;
//     if (userId != undefined && req.body.access_token != undefined && req.body.access_token != "" && req.originalUrl != '/api/customer/logout') {
//         var userAcessToken = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "access_token": 1, "is_locked": 1 });
//         if (userAcessToken == undefined || userAcessToken.length == 0) {
//             return res.json({ success: false, message: "Invalid Access Your Account is going to logout ", "is_login": 2 });
//         }
//         if (userAcessToken != undefined && userAcessToken.length != 0 && userAcessToken[0]['access_token'] != req.body.access_token) {
//             return res.json({ success: false, message: "Invalid Access Your Account is going to logout", "is_login": 2 });
//         }
//         if (userAcessToken[0].is_locked != undefined && userAcessToken[0].is_locked == 2) {
//             return res.json({ success: false, message: "Your Account is going to logout because the account is blocked please contact admin", "is_login": 2 });
//         }
//     }
//     return next();
// } else {
//     return res.json({ success: false, message: "Invalid token" });
// }





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
function generateHash(next) {
    var hashLength = 16;
    var characters = '1234567890123456';
    var hash = '';
    for (var i = 0; i < characters.length; i++) {
        hash = hash + characters.charAt(Math.random() * (hashLength - 0) + 0);
    }
    // var field='hash';
    tables.vendorTable.find({ "hash": hash }, function (response) {
        if (response != undefined) {
            if (response.length == 0) {
                return next(hash);
            } else {
                generateHash();
            }
        } else {
            generateHash();
        }
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

router.post('/check-mobile',  async function (req, res) {
console.log("comming to function")

    var mobile = req.body.mobile;
    var countryCode = req.body.country_code;
    var type = req.body.type;
    var languageCode = req.body.language_code;
    if (mobile == '' || mobile == null) {
        return res.json({ success: false, message: utility.errorMessages["Please provide mobile number"][languageCode] });
    }
    var check = { mobile: mobile, "mobile_country": countryCode };
    if (type == '' || type == null) {
        return res.json({ success: false, message: utility.errorMessages["Invalid request"][languageCode], "error_code": 1 });
    }
    if (countryCode == '' || countryCode == undefined) {
        return res.json({ success: false, message: utility.errorMessages["Invalid request"][languageCode], "error_code": 2 });

    }
    var response = await tables.vendorTable.findMobile(mobile, countryCode);
    if (response != undefined && response.length != 0) {
        var vendorType = response[0].type;
        var registerType = response[0].register_type;
        var registerBy = response[0].register_by;
        var status = response[0].status;

        if (vendorType == utility.VENDOR_TYPE_SALON_ADMIN && type == utility.VENDOR_TYPE_SALON) {
            if (status == 13) {
                return res.send({
                    "success": true,
                    "user_id": response[0]._id,
                    "salon_id": response[0]['branches'][0].salon_id,
                    "status": 14,
                    "type": response[0].type,
                    "message": "login"
                });
            } else {
                return res.send({
                    "success": false,
                    "user_id": response[0]._id,
                    "status": 14,
                    "message": utility.errorMessages["salon registration is not complted"][languageCode]
                });
            }
        }

        if (type != vendorType && vendorType != 3) {
            if (status != 1) {
                var message = '';


                if (type == 1 && vendorType != 3) {
                    message = utility.errorMessages["Registered As Salon"][languageCode];
                } else if (type == 2 && vendorType == 1) {
                    message = utility.errorMessages["Registered As Stylist"][languageCode];
                } else if (type == 2 && vendorType == 3) {
                    message = utility.errorMessages["Registered As Stylist"][languageCode]
                }
                return res.send({ "success": false, "message": message });
            }

        }
        if (vendorType == 3 && type != 1) {
            return res.send({ "success": false, "message": utility.errorMessages["Registered As Serve out Stylist"][languageCode] });
        }
        if (type == 2) {
            if (registerBy != undefined) {
                if (registerBy == 1 && status != 13) {
                    return res.send({ "success": false, "message": utility.errorMessages["Please complete your profile from agent or manager"][languageCode] });
                }
            }
        }

        if (status == tables.vendorTable.status[1].status) {
            let otp = utility.generateOtp();
            // var otp=1234;
            let message = '';

            // message = 'your otp for registration into mr&ms is ' + otp;
            message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`;

            let encodeMessage = encodeURIComponent(message);

            utility.curl.sendingSms(countryCode + mobile, encodeMessage, function (response) {

            });
            tables.vendorTable.update({ "otp": otp }, { "_id": response[0]._id }, function (updateResponse) {
                return res.send({
                    "success": true,
                    "status": 1,
                    "message": "otp verification",
                    "mobile": response[0].mobile,
                    "user_id": response[0]._id,
                    "otp": otp
                })
            });
        } else if (status == tables.vendorTable.status[2].status) {
            let otp = utility.generateOtp();
            // var otp=1234;
            let message = '';

            // message = 'your otp for registration into mr&ms is ' + otp;
            message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`
            let encodeMessage = encodeURIComponent(message);

            utility.curl.sendingSms(countryCode + mobile, encodeMessage, function (response) {

            });
            tables.vendorTable.update({ "otp": otp }, { "_id": response[0]._id }, function (updateResponse) {
                return res.send({
                    "success": true,
                    "status": 1,
                    "message": "otp verification",
                    "mobile": response[0].mobile,
                    "user_id": response[0]._id,
                    "otp": otp
                })
            });
            /*   return res.send({
                   "success": true,
                   "status": 2,
                   "message": "Mobile Number Verified Please Register",
                   "mobile":response[0].mobile,
                   "user_id": response[0]._id
               })*/
        } else if (status == tables.vendorTable.status[3].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 3,
                "type": response[0].type,
                "message": "Salon About"
            })
        } else if (status == tables.vendorTable.status[4].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 4,
                "type": response[0].type,
                "message": "Salon Service info"
            })
        } else if (status == tables.vendorTable.status[5].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 5,
                "type": response[0].type,
                "message": "staff info "
            })
        } else if (status == tables.vendorTable.status[6].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 6,
                "type": response[0].type,
                "message": "salon Images"
            });

        } else if (status == tables.vendorTable.status[7].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 7,
                "type": response[0].type,
                "message": "portfolio"
            });
        } else if (status == tables.vendorTable.status[8].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 8,
                "type": response[0].type,
                "message": "Documents"
            });

        } else if (status == tables.vendorTable.status[9].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 9,
                "type": response[0].type,
                "message": "cancellation policy "
            });

        } else if (status == tables.vendorTable.status[10].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 10,
                "type": response[0].type,
                "message": "agreement"
            });
        } else if (status == tables.vendorTable.status[11].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 11,
                "type": response[0].type,
                "message": "login"
            });
        } else if (status == tables.vendorTable.status[12].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 12,
                "type": response[0].type,
                "message": "login"
            });
        }
        else if (status == tables.vendorTable.status[13].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 13,
                "type": response[0].type,
                "message": "login"
            });
        } else if (status == tables.vendorTable.status[14].status) {
            return res.send({
                "success": true,
                "user_id": response[0]._id,
                "status": 14,
                "type": response[0].type,
                "message": "login"
            });
        } else {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]
                , "status": response[0].status
            });
        }

    } else if (response != undefined) {
        var otp = utility.generateOtp();
        // var otp=1234;
        // message = 'your otp for registration into mr&ms is ' + otp;
        message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`

        var encodeMessage = encodeURIComponent(message);
        utility.curl.sendingSms(countryCode + mobile, encodeMessage, function (response) {
        });
        var save = { "mobile": mobile, "status": tables.vendorTable.status[1].status, "otp": otp, mobile_country: countryCode };
        if (type == 1) {
            save['type'] = 1;
        } else {
            save['type'] = 2;
        }
        tables.vendorTable.save(save, function (response) {
            return res.send({ "success": true, "status": 1, "message": "otp verification", "mobile": mobile, "user_id": response._id, "otp": otp });


        })
    } else {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]
        });
    }

});
router.post('/verify-otp', async function (req, res) {

    var otp = req.body.otp;
    var otpType = req.body.otp_type;
    var mobile_country = req.body.mobile_country;
    var mobile = '';
    if (otpType == undefined || otpType == '') {
        otpType = utility.OTP_TYPE_CUSTOMER_SIGN_UP;
    }

    var languageCode = req.body.language_code;
    otpType = parseInt(otpType);
    if (!utility.isValidOtpType(parseInt(otpType))) {
        return res.send({ "success": false, "message": utility.errorMessages["Invalid request"][languageCode] });
    }
    if (otp == '' || otp == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Please enter otp"][languageCode] });
    }

    if (otpType == utility.OTP_TYPE_CUSTOMER_SIGN_UP) {

        var userId = req.body.user_id;
        if (userId == '' || userId == undefined) {
            return res.send({ "success": false, "message": utility.errorMessages["Invalid request"][languageCode] });
        }
        async.series([
            function (callback) {

                tables.vendorTable.findFields({ _id: userId }, { "status": 1, "_id": 0 }, function (result) {
                    if (result != undefined && result.length) {
                        if (result[0].status > tables.vendorTable.status[1].status) {
                            /*return callback({
                             success: false,
                             message: "Your accountant is already verified. Please login."
                             });*/
                            return callback({ success: true });

                        } else {
                            return callback({ success: true });
                        }
                    } else {
                        return callback({ success: true });
                    }
                });

            }],
            function (data) {

                if (!data.success) {
                    return res.send({ "success": false, "message": data.message });
                }

                tables.vendorTable.update({ "status": 2 }, { _id: userId, otp: otp }, async function (result) {
                    var fcmId = req.body.fcm_id;
                    var deviceId = req.body.device_id;
                    if (fcmId != '' && fcmId != undefined) {
                        var fcmData = {};
                        fcmData['fcm_id'] = fcmId;
                        fcmData["device_id"] = deviceId;

                        deviceType = parseInt(req.body.device_type);
                        fcmData["device_type"] = deviceType;
                        console.log("fcmData>>>>>>>>", fcmData)
                        tables.fcmTable.update(fcmData, { "vendor_id": userId }, function (response) {


                            console.log("response>>>>>>>>>>>", response)
                            if (response == null) {
                                var save = {};
                                save['fcm'] = [];
                                save['fcm'].push(fcmData);
                                save['customer_id'] = userId;
                                tables.fcmTable.save(save, function (response) {

                                });
                            }
                        });
                    }

                    if (result != null && result.length != 0) {
                        var countrydetails = await tables.countryTable.findrequiredfields({ "phone_code": mobile_country }, { call_center_number: 1 })
                        var call_center_number = "";
                        if (countrydetails && countrydetails[0]) {
                            call_center_number = countrydetails[0].call_center_number;
                        }

                        return res.send({
                            "success": true,
                            "status": 2,
                            "message": utility.errorMessages["Mobile Number Verified Please Register"][languageCode],
                            "user_id": result._id,
                            "call_center_number": call_center_number
                        });

                    } else {

                        return res.send({
                            "success": false, "status": 1,
                            "message": utility.errorMessages["Invalid otp"][languageCode]
                        });
                    }



                });

            });
    }
    else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL) {
        var userId = req.body.user_id;

        var email = req.body.email;
        /* if(email === "" || email == undefined || !email)
         {
             return res.send({
                 "success" : false,
                 "message" : utility.errorMessages["email required"][languageCode]
             });
         }*/
        tables.otpTable.find({
            user_id: userId,
            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
            otp: otp
        }, function (result) {

            if (result.length) {
                tables.otpTable.update({
                    is_verified: true,
                    updated: Date.now()
                }, {
                    _id: result[0]._id
                }, function (result) {
                    if (result != null && result.updated != undefined) {
                        return res.send({
                            "success": true
                        });
                    } else {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["Invalid otp"][languageCode]
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid otp"][languageCode]
                });
            }
        });
    }
    else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE) {
        var userId = req.body.user_id;
        /*
                 mobile = req.body.mobile;
                if(mobile === "" || mobile == undefined || !mobile){
                    return res.send({
                        "success" : false,
                        "message" : utility.errorMessages["Mobile number required"][languageCode]
                    });
                }*/

        tables.otpTable.find({
            user_id: userId,
            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
            otp: otp
        }, function (result) {
            if (result.length) {
                tables.otpTable.update({
                    is_verified: true,
                    updated: Date.now()
                }, {
                    _id: result[0]._id
                }, function (result) {
                    if (result != null && result.updated != undefined) {
                        return res.send({
                            "success": true
                        });
                    } else {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["Invalid otp"][languageCode]
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid otp"][languageCode]
                });
            }
        });
    } else if (otpType == utility.OTP_TYPE_VERIFY_DEVICE) {
        var vendorId = req.body.vendor_id;
        var fcmId = req.body.fcm_id;
        var deviceId = req.body.device_id;
        var deviceType = req.body.device_type;
        var type = req.body.type;
        var userDetails = ''
        var salonId = req.body.salon_id;
        deviceType = parseInt(deviceType);
        if (isNaN(deviceType)) {
            deviceType = 1;
        }

        if (type == utility.VENDOR_TYPE_SALON_ADMIN) {

            userDetails = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "phone": 1, tm_user_id: 1, "salon_name": 1, "email": 1, "status": 1 });
            if (userDetails == '' || userDetails == undefined || userDetails.length == 0) {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid user"][languageCode]
                });
            }

            mobile = userDetails[0].phone;

        } else {
            userDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, {
                "mobile": 1, "profile_pic": 1,
                "mobile_country": 1, tm_user_id: 1, "first_name": 1, "last_name": 1, "email": 1, "status": 1
            });
            if (userDetails == '' || userDetails == undefined || userDetails.length == 0) {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid user"][languageCode]
                });
            }
            mobile = userDetails[0].mobile;
        }



        tables.otpTable.find({
            data: mobile,
            otp_type: utility.OTP_TYPE_VERIFY_DEVICE,
            otp: otp
        }, function (result) {

            if (result.length) {
                tables.otpTable.update({
                    is_verified: true,
                    updated: Date.now()
                }, {
                    _id: result[0]._id
                }, async function (result) {
                    if (result != null && result.updated != undefined) {
                        var tmUserId = userDetails[0].tm_user_id;
                        if (type == 1 || type == 3) {
                            if (type == 3) {
                                var vendorStatus = await tables.stylistTable.updateWithPromises({ "available_status": 1 }, { "vendor_id": vendorId });
                            }
                            tables.stylistTable.find({ 'vendor_id': vendorId }, async function (stylistResponse) {
                                var managerStatus = 0;
                                var agentStatus = 0;
                                var iban_status = 0;
                                if (stylistResponse != undefined && stylistResponse.length != 0) {
                                    managerStatus = (stylistResponse[0].manager_status != undefined ? stylistResponse[0].manager_status : (type != 3 ? 0 : 1));
                                    agentStatus = (stylistResponse[0].agent_status != undefined ? stylistResponse[0].agent_status : (type != 3 ? 0 : 1));
                                    iban_status = stylistResponse[0].iban_status
                                }
                                var fcmData = {};
                                fcmData['fcm_id'] = fcmId;
                                fcmData["device_id"] = deviceId;
                                deviceType = parseInt(deviceType);
                                fcmData["device_type"] = deviceType;
                                tables.fcmTable.deleteVendor({ "vendor_id": vendorId }, function () {

                                });

                                tables.fcmTable.update(fcmData, { "vendor_id": vendorId }, async function (response) {
                                    if (response == null) {
                                        var save = {};
                                        save['fcm'] = [];
                                        save['fcm'].push(fcmData);
                                        save['vendor_id'] = vendorId;
                                        tables.fcmTable.save(save, function (response) {

                                        });
                                    }

                                    if (tmUserId != 0) {


                                        var fcmUpdate = await utility.updateFcm({
                                            "fcm_token": fcmId,
                                            "user_id": tmUserId,
                                            "device_type": deviceType
                                        }, utility.user_role_stylist);
                                    }
                                });
                                var accessToken = utility.generateAccessToken();
                                tables.vendorTable.update({ "access_token": accessToken }, { "_id": vendorId }, function (response) {

                                });
                                req.app.io.sockets.in(vendorId).emit("force_logout", { "is_login": 2 });
                                return res.send({
                                    "success": true,
                                    "vendor_id": vendorId,
                                    "manager_status": managerStatus,
                                    "agent_status": agentStatus,
                                    "iban_status": iban_status,
                                    "tm_user_id": tmUserId,
                                    "type": type,
                                    "access_token": accessToken,
                                    "status": userDetails[0].status
                                });
                            });
                        } else {
                            var accessToken = '';
                            tables.salonTable.find({ "vendor_id": vendorId }, async function (response) {
                                var fcmData = {};
                                fcmData['fcm_id'] = fcmId;
                                fcmData["device_id"] = deviceId;

                                deviceType = parseInt(deviceType);
                                fcmData["device_type"] = deviceType;
                                var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "_id": 1, "status": 1, "type": 1 });

                                if (type == utility.VENDOR_TYPE_SALON) {
                                    accessToken = utility.generateAccessToken();
                                    if (salonId != '' && salonId != undefined) {
                                        salonId = (response[0]._id != undefined ? response[0]._id : "");
                                    }
                                    tables.vendorTable.update({ "access_token": accessToken }, { "_id": vendorId }, function (response) {
                                    });
                                    vendorId = response[0].vendor_id;
                                    tables.fcmTable.deleteVendor({ "vendor_id": vendorId }, function () {

                                    });
                                    tables.fcmTable.update(fcmData, { "vendor_id": vendorId }, async function (response) {
                                        if (response == null) {
                                            var save = {};
                                            save['fcm'] = [];
                                            save['fcm'].push(fcmData);
                                            save['vendor_id'] = vendorId;
                                            tables.fcmTable.save(save, function (response) {

                                            });
                                        }
                                        var fcmUpdate = await utility.updateFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": deviceType }, utility.user_role_salon);
                                    });
                                } else if (type == utility.VENDOR_TYPE_SALON_ADMIN) {

                                    accessToken = utility.generateAccessToken();
                                    tables.salonTable.update({ "access_token": accessToken }, { "_id": salonId }, function (response) {
                                    });
                                    tables.fcmTable.deleteVendor({ "vendor_id": salonId }, function () {

                                    });
                                    tables.fcmTable.update(fcmData, { "vendor_id": salonId }, async function (response) {
                                        if (response == null) {
                                            var save = {};
                                            save['fcm'] = [];
                                            save['fcm'].push(fcmData);
                                            save['vendor_id'] = salonId;
                                            tables.fcmTable.save(save, function (response) {

                                            });
                                        }
                                        var fcmUpdate = await utility.updateFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": deviceType }, utility.user_role_salon);
                                    });
                                }
                                req.app.io.sockets.in(salonId).emit("force_logout", { "is_login": 2 });


                                return res.send({
                                    "success": true,
                                    "vendor_id": vendorDetails[0]._id,
                                    "salon_id": salonId,
                                    "status": vendorDetails[0].status,
                                    "tm_user_id": tmUserId,
                                    'access_token': accessToken,
                                    "type": type
                                });


                            });
                        }
                    } else {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["Invalid otp"][languageCode]
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid otp"][languageCode]
                });
            }
        });
    }
    else {

        return res.send({ "success": false, "message": utility.errorMessages["Invalid request"][languageCode] });
    }
});


router.post('/languages', tokenValidations, function (req, res) {
    var languageCode = req.body.language_code;

    tables.languagesTable.aggregateFind(languageCode, function (response) {
        if (response && response.length) {

            for (var i = 0; i <= response.length; i++) {
                if (req.body.language_code == "tr") {
                    response[i].language = response[i].language.toLocaleUpperCase('TR')
                } else {
                    response[i].language = response[i].language.toLocaleUpperCase('en-US')
                }

                if (i == response.length - 1) {
                    return res.send({ "success": true, "languages": response });
                }
            }

        } else {
            return res.send({ "success": true, "languages": response });

        }
    });
});
router.post('/basic-info', async function (req, res) {

    var firstName = req.body.first_name;
    var vendorId = req.body.vendor_id;
    var lastName = req.body.last_name;
    var email = req.body.email;
    var gender = req.body.gender;
    var dob = req.body.dob;
    var nationality = req.body.nationality;
    var country = req.body.country;
    var password = req.body.password;
    var languageSpeak = req.body.language_speak;
    var optFor = req.body.opt_for;
    var subscribeFor = req.body.subscribe_for;
    var profilePic = req.body.profile_pic;
    var cityId = req.body.city_id;
    var inviteCode = req.body.invite_code;
    var languageCode = req.body.language_code;

    firstName = trim(firstName);
    lastName = trim(lastName);
    nationality = trim(nationality);
    var update = {};

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
    // var countryLan=await utility.translate(country,languageCode);


    // country=countryLan.text;
    country = country.toLowerCase();
    var checkCountry = {};
    checkCountry["country." + languageCode] = {
        '$regex': country + '.*', '$options': 'i'
    };
    var countryResponse = await tables.countryTable.findFieldsWithPromises(checkCountry, { "_id": 1 });



    if (countryResponse == undefined || countryResponse.length == 0) {

        return res.send({
            "success": false,
            "message": utility.errorMessages["country Not available"][languageCode]
        });
    }


    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["please select city"][languageCode]
        });
    }

    if (inviteCode != '' && inviteCode != undefined) {
        inviteCode = inviteCode.toLowerCase();
        var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "invite_code": inviteCode }, { "_id": 1 });

        if (vendorDetails != undefined && vendorDetails.length != 0) {
            if (vendorDetails[0]._id != vendorId) {
                update['referral_invite_code'] = inviteCode;
                update['referral_vendor_id'] = vendorDetails[0]._id;
            } else {
                res.send({ "success": false, "message": utility.errorMessages["u can't use your own invite code"][languageCode] });
            }

        } else {
            return res.send({ "success": false, "message": utility.errorMessages["invite Code is invalid"][languageCode] });
        }
    }
    var countryId = countryResponse[0]._id;
    var stylistSave = {};
    firstName = utility.removeSpacesInBetween(firstName);
    lastName = utility.removeSpacesInBetween(lastName);
    var firstNameTranslate = await utility.translateText(firstName, languageCode);

    firstNameTranslate[languageCode] = firstName;
    var lastNameTranslate = await utility.translateText(lastName, languageCode);
    lastNameTranslate[languageCode] = lastName;
    update['first_name'] = firstNameTranslate;
    update['last_name'] = lastNameTranslate;
    update['gender'] = parseInt(gender);
    stylistSave['gender'] = parseInt(gender);
    update['dob'] = dob;
    stylistSave['nationality'] = nationality;
    stylistSave['invite_code'] = inviteCode;
    stylistSave['languages_speak'] = languageSpeak.split(',');
    update['profile_pic'] = profilePic;
    update['country'] = countryId;
    stylistSave['country'] = countryId;
    stylistSave['city_id'] = cityId;
    stylistSave['active_status'] = 1;
    stylistSave['levels'] = [1];
    update['email'] = email;
    update['subscribe_for'] = [1, 2, 3];
    update['opt_for'] = [1, 2, 3];
    update['type'] = 1;
    var name = {};
    for (var l in firstNameTranslate) {
        name[l] = firstNameTranslate[l] + " " + lastNameTranslate[l];
    }
    update['name'] = name;
    tables.vendorTable.find({ "email": email, "_id": { "$ne": vendorId } }, function (response) {
        if (response.length == 0) {
            update['email'] = email;
            generateHash(function (hash) {
                update["password"] = encrypt(password, hash);
                update['hash'] = hash;
                update['status'] = tables.vendorTable.status[3].status;
                stylistSave['manager_status'] = 0;
                stylistSave['agent_status'] = 0;
                stylistSave['admin_status'] = 0;
                tables.vendorTable.find({ '_id': vendorId }, function (checkResponse) {
                    if (checkResponse.length != 0) {
                        tables.vendorTable.update(update, { "_id": vendorId }, function (response) {

                            if (response != null && response.length != 0) {
                                tables.stylistTable.find({ "vendor_id": vendorId }, async function (stylistResponse) {
                                    if (stylistResponse != undefined && stylistResponse.length != 0) {
                                        setTimeout(function () {
                                            utility.curl.curl('application/index/generateTheStylistImage?image=' + profilePic + '&vendor_id=' + vendorId + '&gender=' + gender, function (response) {

                                            });
                                        }, 1000);
                                        tables.stylistTable.update(stylistSave, { "vendor_id": vendorId }, function (stylistUpdate) {
                                            return res.send({
                                                "success": true,
                                                "status": response.status,
                                                "message": "Basic Details",
                                                "type": response.type,
                                                "vendor_id": response._id

                                            });
                                        });
                                    } else {
                                        stylistSave['vendor_id'] = vendorId;
                                        setTimeout(function () {
                                            utility.curl.curl('application/index/generateTheStylistImage?image=' + profilePic + '&vendor_id=' + vendorId + '&gender=' + gender, function (response) {

                                            });
                                        }, 1000);
                                        if (inviteCode != '' && inviteCode != undefined) {
                                            var updateInvite = await tables.vendorTable.updateInvite({ "vendor_id": vendorId, "amount": 0 }, { "_id": vendorDetails[0]._id })
                                        }
                                        tables.stylistTable.save(stylistSave, function (stylistSave) {
                                            return res.send({
                                                "success": true,
                                                "status": response.status,
                                                "message": "Basic Details",
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
                        return res.send({ "success": false, "status": 1, "message": "Invalid User" });

                    }
                });

            });
        } else {
            return res.send({ "success": false, "message": utility.errorMessages["email already exists"][languageCode] });
        }
    });

});
router.post('/registration', tokenValidations, async function (req, res) {

    var firstName = req.body.first_name;
    var lastName = req.body.last_name;
    var country = req.body.country;
    var email = req.body.email.toLowerCase();
    var gender = req.body.gender;
    var password = req.body.password;
    var inviteCode = req.body.invite_code;
    var languageSpeak = req.body.language_speak;
    var optFor = req.body.opt_for;
    var subscribeFor = req.body.subscribe_for;
    var languageCode = req.body.language_code;
    var update = {};
    /*  if (!utility.isValidOtpType(parseInt(otpType))) {
     return res.send({"success": false, "message": "Invalid  request"});
     }*/
    update['gender'] = parseInt(gender);
    update['password'] = password;
    //update['language']=languageSpeak.split(',');
    // update['otp_for']=optFor.split(',');
    //  update['subscribe_for']=subscribeFor.split(',');
    var vendorId = req.body.vendor_id;
    if (vendorId == '' || vendorId == undefined) {
        return res.send({ success: false, message: "Invalid  request", "error_code": 1 });
    }
    if (firstName == undefined || trim(firstName) == "") {
        return res.send({
            "success": false,
            "message": "Please provide your first name."
        });
    }
    if (isNaN(gender)) {
        return res.send({
            "success": false,
            "message": "Please provide valid gender."
        });
    }
    /* if (!utility.isValidName(firstName))
     {
         return res.send({
             "success": false,
             "message": "Please provide valid first name."
         });
     }*/

    if (lastName == undefined || trim(lastName) === "") {
        return res.send({
            "success": false,
            "message": "Please provide your last name."
        });
    }
    /* if (!utility.isValidName(lastName))
     {
         return res.send({
             "success": false,
             "message": "Please provide valid last name."
         });
     }*/

    if (email == undefined || trim(email) == "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Please provide your email."][languageCode]
        });
    }
    if (country == undefined || trim(country) == "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Please provide your country."][languageCode]
        });
    }
    if (inviteCode != '' && inviteCode != undefined) {
        inviteCode = trim(inviteCode);
        inviteCode = inviteCode.toLowerCase();
        var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "invite_code": inviteCode }, { "_id": 1 });
        if (vendorDetails != undefined && vendorDetails.length != 0) {
            if (vendorDetails[0]._id != vendorId) {
                update['referral_invite_code'] = inviteCode;
                update['referral_vendor_id'] = vendorDetails[0]._id;
            } else {
                return res.send({ "success": false, "message": utility.errorMessages["u can't use your own invite code"][languageCode] });
            }
        } else {
            return res.send({ "success": false, "message": utility.errorMessages["invite Code is invalid"][languageCode] });
        }
    }
    /*   console.log(country,"country+++")
    var countryLan=await utility.translate(country);
    country=countryLan.text;*/
    country = country.toLowerCase();

    var countryCheck = {};
    countryCheck['country.' + languageCode] = {
        '$regex': country + '.*', '$options': 'i'
    };
    var countryResponse = await tables.countryTable.findFieldsWithPromises(countryCheck, { "_id": 1 });
    if (countryResponse == undefined || countryResponse.length == 0) {
        return res.send({ "success": false, "message": utility.errorMessages["country Not available"][languageCode] });
    }
    firstName = utility.removeSpacesInBetween(firstName);
    lastName = utility.removeSpacesInBetween(lastName);

    var firstNameTranslate = await utility.translateText(firstName, languageCode);
    firstNameTranslate[languageCode] = firstName;
    var lastNameTranslate = await utility.translateText(lastName, languageCode);
    lastNameTranslate[languageCode] = lastName;
    update['first_name'] = firstNameTranslate;
    update['last_name'] = lastNameTranslate;
    update['country_id'] = countryResponse[0]._id;
    update['type'] = 2;
    update['status'] = 3;
    update['subscribe_for'] = [1, 2, 3];
    update['opt_for'] = [1, 2, 3];
    var name = {};
    for (var l in firstNameTranslate) {
        name[l] = firstNameTranslate[l] + " " + lastNameTranslate[l];
    }
    update['name'] = name;

    tables.vendorTable.find({ email: email, "_id": { "$ne": vendorId } }, function (response) {
        if (response.length == 0) {
            update['email'] = email;
            generateHash(function (hash) {
                var password = req.body.password;
                update["password"] = encrypt(password, hash);
                update['hash'] = hash;
                update['status'] = tables.vendorTable.status[3].status;
                tables.vendorTable.find({ '_id': vendorId }, function (checkResponse) {
                    if (checkResponse.length != 0) {

                        tables.vendorTable.update(update, { "_id": vendorId }, async function (response) {
                            if (response != null && response.length != 0) {
                                if (inviteCode != '' && inviteCode != undefined) {
                                    var updateInvite = await tables.vendorTable.updateInvite({ "vendor_id": response._id, "amount": 0 }, { "_id": vendorDetails[0]._id })
                                }

                                return res.send({
                                    "success": true,
                                    "status": response.status,
                                    "message": "Basic Details",
                                    "type": response.type,
                                    "user_id": response._id

                                });
                            } else {
                                return res.send({ "success": false, "status": 2, "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] });
                            }
                        });
                    } else {
                        return res.send({ "success": false, "status": 1, "message": utility.errorMessages["Invalid User"][languageCode] });

                    }
                });

            });
        } else {
            return res.send({ "success": false, "message": utility.errorMessages["email already exists"][languageCode] });
        }
    });

});
router.post("/login", tokenValidations, async function (req, res) {
    var languageCode = req.body.language_code;

    var startTime = utility.getTime;
    var mobileNumber = req.body.mobile;
    var password = req.body.password;
    var countryCode = req.body.country_code;
    var fcmId = req.body.fcm_id;

    var deviceId = req.body.device_id;
    var deviceType = req.body.device_type;
    var deviceName = req.body.device_name;

    if (mobileNumber === "") {
        return res.send({
            "success": false,
            "message": "Mobile number is required!"
        });
    }

    if (password === "") {
        return res.send({
            "success": false,
            "message": "Password is required!"
        });
    }

    /* if(deviceId=='' ||deviceId==undefined)
     {
         return res.send({
             "success": false,
             "message": "Invalid Request"
         });
     }
     if(deviceName=='' ||deviceName==undefined)
     {
         return res.send({
             "success": false,
             "message": "Invalid Request"
         });
     }
     if(fcmId=='' || fcmId==undefined)
     {
         return res.send({
             "success": false,
             "message": "Invalid Request",
             "error_code":5
         });
     }*/
    //  var endTime=utility.getTime;
    // var writeData={"start_time":startTime,"end_time":endTime,"data":{"message":"inside the request"},"request":req.body};
    // utility.writeToFile.writeToFile(writeData);
    deviceType = parseInt(deviceType);
    var update = {};
    update['device_name'] = deviceName;
    update['device_id'] = deviceId;
    //{"password": 1,"tm_user_id":1, "hash": 1,"type":1,"device_id":1,"device_name":1,"first_name":1,
    // "last_name":1,"mobile":1,"email":1,"mobile_country":1,"status":1}
    var result = await tables.vendorTable.findMobile(mobileNumber, countryCode);
    if (result != undefined && result.length != 0) {
        var encryptPassword = '';
        var hash = '';
        var email = '';
        var type = result[0]['type'];
        var tmUserId = 0;
        var name = '';
        var salonId = '';

        if (type == utility.VENDOR_TYPE_SALON_ADMIN) {
            encryptPassword = result[0]['branches'][0]['password'];
            hash = result[0]['branches'][0]['hash'];
            email = result[0]['branches'][0]['email'];
            salonId = result[0]['branches'][0]['salon_id'];
            var salonName = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "salon_name": 1, "tm_user_id": 1 });
            name = salonName[0]['salon_name'][languageCode];
            tmUserId = salonName[0]['tm_user_id'];
        } else {
            encryptPassword = result[0]['password'];
            hash = result[0]['hash'];
            email = result[0]['email'];
            tmUserId = result[0]['tm_user_id'];
            name = result[0].first_name[languageCode] + " " + result[0].last_name[languageCode];

        }
        if (encryptPassword != undefined && encryptPassword != '') {
            if (decrypt(encryptPassword, hash) == password) {
                /*if(oldDeviceId==undefined || oldDeviceId==deviceId)
                 {*/
                var vendorId = result[0]._id;


                if (result[0].type == 1 || result[0].type == 2 || result[0].type == 3) {
                    if (result[0].type == utility.VENDOR_TYPE_SERVEOUT_EMPLOYEE) {
                        var employeeDetails = await tables.salonEmployeesTable.findFieldsWithPromises({ "_id": result[0].employee_id }, { "serve_out": 1 });


                        if (employeeDetails != undefined && employeeDetails.length != 0 && employeeDetails[0].serve_out == 1) {
                            return res.send({
                                "success": false,
                                "message": utility.errorMessages["Your serveout is off please contact salon admin"][languageCode],
                                "type": result[0].type, "vendor_id": vendorId
                            })
                        }
                    }
                    /*  var vendorDetails=await tables.vendorTable.findFieldsWithPromises({"_id":vendorId},{"access_token":1});
                    if(vendorDetails[0].access_token!=undefined && vendorDetails[0].access_token!='')
                    {
                           if(deviceType==1 || deviceType==2){

                               return res.send({
                                   "success":false,
                                   "message":utility.errorMessages["your logged in another device do u want to login?"][languageCode],
                                   "is_login":1,
                                   "type":result[0].type,"vendor_id":vendorId})
                           }

                    }*/
                } else if (result[0].type == 4) {
                    /* var salonDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"access_token":1});
                     if(salonDetails[0].access_token!=undefined && salonDetails[0].access_token!=''){

                         if(deviceType==1 || deviceType==2) {
                             return res.send({
                                 "success": false,
                                 "message": utility.errorMessages["your logged in another device do u want to login?"][languageCode],
                                 'is_login': 1,
                                 "type": result[0].type,
                                 "salon_id": salonId
                             })
                         }
                     }*/
                }
                if (tmUserId == undefined || tmUserId == 0) {
                    var mobile = mobileNumber;
                    var mobileCountry = countryCode;
                    if (email == undefined) {
                        email = '';
                    }
                    tmUserId = await utility.getTmUserId({ mobile: mobileCountry + mobile, name: name, email: email });
                    if (type == utility.VENDOR_TYPE_SALON_ADMIN) {
                        var update = await tables.salonTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": salonId });
                        /*tables.salonTable*/
                        var salonTm = await tables.vendorTable.updateWithPromises({ "branches.$.tm_user_id": tmUserId }, { "_id": vendorId, "branches.salon_id": salonId })
                    } else {
                        var update = await tables.vendorTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": vendorId });
                    }
                }
                if (result[0].type == 1 || result[0].type == 2 || result[0].type == 3) {
                    tables.activityTable.save({ "action_id": vendorId, "activity_title": utility.user_login_text, "device_type": deviceType },
                        function () {

                        });
                } else if (result[0].type == 4) {
                    tables.activityTable.save({ "action_id": vendorId, "activity_title": utility.user_login_text, "device_type": deviceType },
                        function () {

                        });
                }
                if (result[0].type == 1 || result[0].type == 3) {
                    if (result[0].type == 3) {
                        var vendorStatus = await tables.stylistTable.updateWithPromises({ "available_status": 1 }, { "vendor_id": vendorId });
                    }
                    tables.stylistTable.find({ 'vendor_id': vendorId }, async function (stylistResponse) {
                        var managerStatus = 0;
                        var agentStatus = 0;
                        if (stylistResponse != undefined && stylistResponse.length != 0) {
                            managerStatus = (stylistResponse[0].manager_status != undefined ? stylistResponse[0].manager_status : 0);
                            agentStatus = (stylistResponse[0].agent_status != undefined ? stylistResponse[0].agent_status : 0);
                        }
                        var fcmData = {};
                        fcmData['fcm_id'] = fcmId;
                        fcmData["device_id"] = deviceId;
                        deviceType = parseInt(deviceType);
                        fcmData["device_type"] = deviceType;
                        tables.fcmTable.update(fcmData, { "vendor_id": vendorId }, async function (response) {
                            if (response == null) {
                                var save = {};
                                save['fcm'] = [];
                                save['fcm'].push(fcmData);
                                save['vendor_id'] = vendorId;
                                tables.fcmTable.save(save, function (response) {

                                });
                            }
                            if (tmUserId != 0) {
                                var fcmUpdate = await utility.updateFcm({
                                    "fcm_token": fcmId,
                                    "user_id": tmUserId,
                                    "device_type": deviceType
                                }, utility.user_role_stylist);
                            }
                        });
                        var accessToken = utility.generateAccessToken();
                        tables.vendorTable.update({ "access_token": accessToken }, { "_id": vendorId }, function (response) {
                        });

                        var countrydetails = await tables.countryTable.findrequiredfields({ "phone_code": countryCode }, { call_center_number: 1 })
                        var call_center_number = ''
                        if (countrydetails && countrydetails[0]) {
                            call_center_number = countrydetails[0].call_center_number
                        }
                        tables.stylistTable.find({ 'vendor_id': vendorId }, async function (stylistResponse) {
                            return res.send({
                                "success": true,
                                "vendor_id": vendorId,
                                "manager_status": managerStatus,
                                "agent_status": agentStatus,
                                "tm_user_id": tmUserId,
                                "type": result[0].type,
                                "access_token": accessToken,
                                "status": result[0].status,
                                "created": result[0].created,
                                "updated": result[0].updated,
                                "mobile": result[0].mobile,
                                "mobile": result[0].mobile,
                                "mobile_country": result[0].mobile_country,
                                "call_center_number": call_center_number,

                                "iban_status": stylistResponse[0].iban_status


                            });
                        })


                    });
                } else {
                    var accessToken = '';
                    tables.salonTable.find({ "vendor_id": result[0]._id }, async function (response) {
                        var fcmData = {};
                        fcmData['fcm_id'] = fcmId;
                        fcmData["device_id"] = deviceId;
                        deviceType = parseInt(deviceType);
                        fcmData["device_type"] = deviceType;

                        var salonId = (response.length != 0 && response[0]._id != undefined ? response[0]._id : "");
                        if (result[0].status == tables.vendorTable.status[13].status && type == utility.VENDOR_TYPE_SALON_ADMIN) {
                            salonId = result[0]['branches'][0].salon_id;
                        }
                        if (type == utility.VENDOR_TYPE_SALON) {
                            accessToken = utility.generateAccessToken();
                            if (salonId != '' && salonId != undefined) {
                                salonId = (response[0]._id != undefined ? response[0]._id : "");
                            }
                            tables.vendorTable.update({ "access_token": accessToken }, { "_id": vendorId }, function (response) {

                            });

                        } else if (type == utility.VENDOR_TYPE_SALON_ADMIN) {
                            vendorId = salonId;
                            accessToken = utility.generateAccessToken();
                            tables.salonTable.update({ "access_token": accessToken }, { "_id": salonId }, function (response) {

                            });
                        }

                        tables.fcmTable.update(fcmData, { "vendor_id": vendorId }, async function (response) {
                            if (response == null) {
                                var save = {};
                                save['fcm'] = [];
                                save['fcm'].push(fcmData);
                                save['vendor_id'] = vendorId;
                                tables.fcmTable.save(save, function (response) {

                                });
                            }
                            var fcmUpdate = await utility.updateFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": deviceType }, utility.user_role_salon);
                        });
                        var countrydetails = await tables.countryTable.findrequiredfields({ "phone_code": countryCode }, { call_center_number: 1 })

                        tables.stylistTable.find({ 'vendor_id': vendorId }, async function (stylistResponse) {
                            return res.send({
                                "success": true,
                                "vendor_id": result[0]._id,
                                "salon_id": salonId,
                                "status": result[0].status,
                                "tm_user_id": tmUserId,
                                'access_token': accessToken,
                                "type": result[0].type,
                                "created": result[0].created,
                                "updated": result[0].updated,
                                "mobile": result[0].mobile,
                                "mobile_country": result[0].mobile_country,
                                "call_center_number": call_center_number,
                                "iban_status": stylistResponse[0].iban_status
                            });
                        })

                    });
                }
            } else {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Invalid credentials"][languageCode]
                });
            }
        } else {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Invalid credentials"][languageCode]

            });
        }
    } else {

        return res.send({
            "success": false,
            "message": "Mobile is not registered.",
            "error-code": 4
        });
    }
});
router.post("/another-device-logout", tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var deviceId = req.body.device_id;
    if (vendorId == undefined || vendorId == '') {
        return res.send({
            "success": false,
            "message": "Invalid Request"
        });
    }

    if (deviceId === '' || deviceId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request"
        });
    }
});
router.post('/expertise', function (req, res) {
    var languageCode = req.body.language_code;
    var type = req.body.type;

    type = 1;


    tables.servicesTable.getExpertiseServices(languageCode, type, function (response) {
        return res.send({ "success": true, "expertise": response });

    });
});
router.post('/check-country', tokenValidations, async function (req, res) {
    console.log("comming to function>>>>>>>>>>>>>>>>>>>>")
    var country = req.body.country;
    var countryCode = req.body.country_code;
    var languageCode = req.body.language_code;
    //  var countryLan=await utility.translate(country);
    //  //country=countryLan.text;
    //   var countryLan=await utility.translate(country);
    //   country=countryLan.text;
    if (country == undefined || country == '') {
        var countryDetails = await tables.countryTable.findFieldsWithPromises({ "country_code": countryCode }, { "country": 1 });
        if (countryDetails != undefined && countryDetails.length != 0) {
            country = countryDetails[0][languageCode];
        }
    }
    country = country.toLowerCase();
    //res.send(country);
    var condition = {};
    condition["country." + languageCode] =
    {
        '$regex': country + '.*', '$options': 'i'
    };
    condition["status"] = 1;

    var condition1 = {};
    condition1["country.en"] =
    {
        '$regex': country + '.*', '$options': 'i'
    };
    condition1["status"] = 1;
    var query = { $or: [condition, condition1] }

    console.log("condition>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", condition)
    tables.countryTable.findCountry(query, { "_id": 1, "country": { "$ifNull": ["$country." + languageCode, '$country.en'] }, "phone_code": 1 }, function (response) {
        if (response != undefined && response != 0) {
            return res.send({ "success": true, "message": "avalible", "country": response });
        } else {
            tables.countryTable.findCountry({ "status": { "$eq": 1 } }, { "_id": 1, "country": { "$ifNull": ["$country." + languageCode, ''] }, "phone_code": 1 }, function (response) {

                if (response != undefined && response.length != 0) {
                    return res.send({ "success": false, "country": response, "errcode": 1 });
                } else {
                    return res.send({ "success": false, "country": [], "errcode": 2 });
                }

            });

        }
    });

});
router.post('/country-list', tokenValidations, async function (req, res) {
    var languageCode = req.body.language_code;
    tables.countryTable.findCountry({ "status": { "$eq": 1 } },
        { "_id": 1, "country": { "$ifNull": ["$country." + languageCode, "$country.en"] }, "phone_code": 1, "country_code": 1, "flag": 1, "phone_min_length": 1, "phone_max_length": 1 },
        function (response) {
            if (response != undefined && response != 0) {
                return res.send({ "success": true, "message": "available", "country": response });
            }
            else {
                return res.send({ "success": false, "country": [], "errcode": 2 });
            }
        });
});
router.post('/get-cities', function (req, res) {
    var country = req.body.country;
    country = country.toLowerCase();
    //res.send(country);

    var languageCode = req.body.language_code;

    tables.countryTable.getCities(country, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "country": response });
        } else {
            return res.send({ "success": false, "country": [], "message": utility.errorMessages["Services are not available, please select different country"][languageCode], "errcode": 1 });
        }

    });
});
router.post('/forgot-password', tokenValidations, function (req, res) {
    var requestType = req.body.request_type;
    var languageCode = req.body.language_code;
    requestType = parseInt(requestType);
    if (!utility.isValidForgotPasswordType(parseInt(requestType))) {
        return res.send({
            "success": false,
            "message": "Invalid request."
        });
    }
    if (requestType == utility.FORGOT_PASSWORD_REQUEST_TYPE_EMAIL) {
        var email = req.body.email;
        if (trim(email) === "") {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Please provide your email"][languageCode]
            });
        }
        if (!utility.isValidEmail(email)) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Please provide valid email"][languageCode]
            });
        }
        email = email.toLowerCase();
        tables.vendorTable.findFields({ email: email }, { "email": 1, "_id": 1 }, function (response) {
            console.log(response);
            if (response != undefined && response.length != 0) {
                var otp = utility.generateOtp();
                // var otp=1234;
                var userId = response[0]._id;
                tables.otpTable.find({
                    data: email,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                    user_id: response[0]._id
                }, function (result) {
                    if (result != undefined && result.length) {
                        tables.otpTable.update({
                            otp: otp,
                            is_verified: false,
                            updated: Date.now()
                        }, {
                            _id: result[0]._id
                        }, function (response) {
                            if (response.updated != undefined) {
                                utility.curl.curl('send-otp-customer/' + userId + '/' + utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL);

                                return res.send({
                                    "success": true,
                                    "message": "OTP has been sent to " + email,
                                    'user_id': userId
                                });
                            } else {
                                utility.curl.curl('send-otp-customer/' + userId + '/' + utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL);

                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    } else {
                        tables.otpTable.save({
                            user_id: response[0]._id,
                            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                            type_id: response[0]._id,
                            data: email,
                            otp: otp,
                            is_verified: false
                        }, function (result) {

                            return res.send({
                                "success": true,
                                "message": "OTP has been sent to " + email,
                                'user_id': response[0]._id
                            });
                        });
                    }
                });

            } else {
                return res.send({
                    "success": false,
                    "message": "Email account doesn't exists"
                });
            }
        });
    } else if (requestType == utility.FORGOT_PASSWORD_REQUEST_TYPE_MOBILE) {
        var mobile = req.body.mobile;
        var mobileCountry = req.body.mobile_country;
        if (trim(mobile) === "") {
            return res.send({
                "success": false,
                "message": "Please provide your mobile number"
            });
        }
        console.log(mobileCountry.includes(), mobileCountry);
        if (!mobileCountry.includes("+")) {
            mobileCountry = "+" + trim(mobileCountry);
        }

        console.log(mobileCountry.includes(), mobileCountry);
        tables.vendorTable.findFields({ mobile: mobile, "mobile_country": mobileCountry }, { "mobile": 1, "mobile_country": 1 }, function (response) {
            console.log(response, mobile, mobileCountry);

            if (response == undefined || response.length == 0) {
                return res.send({
                    "success": false,
                    "message": "Mobile number is not registered."
                });
            } else {
                //var otp = 1234;
                var otp = utility.generateOtp();
                // var otp=1234;
                // var message = 'your otp for reset password into mr&ms is ' + otp;
                message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`

                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {
                });
                tables.otpTable.find({
                    data: mobile,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                    user_id: response[0]._id
                }, function (result) {
                    var userId = response[0]._id
                    if (result != undefined && result.length) {
                        tables.otpTable.update({
                            otp: otp,
                            is_verified: false,
                            updated: Date.now()
                        }, {
                            _id: result[0]._id
                        }, function (response) {
                            if (response.updated != undefined) {
                                return res.send({
                                    "success": true,
                                    "message": "OTP has been sent to " + mobile,
                                    user_id: userId
                                });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    } else {
                        tables.otpTable.save({
                            user_id: response[0]._id,
                            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                            type_id: response[0]._id,
                            data: mobile,
                            otp: otp,
                            is_verified: false
                        }, function (result) {

                            return res.send({
                                "success": true,
                                "message": "OTP has been sent to " + mobile,
                                user_id: response[0]._id,
                            });
                        });
                    }
                });
            }
        });
    } else {
        return res.send({
            "success": false,
            "message": "Invalid request."
        });
    }
});
router.post('/instant-pay', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    tables.bookingsTable.instantPay(vendorId, function (response) {

    });
});
router.post('/change-password', tokenValidations, function (req, res) {
    var password = req.body.password;
    var payload = req.body.payload;
    var userId = req.body.user_id;
    if (password == '' || password == undefined) {

        return res.send({ "success": false, "message": "Please enter password" })
    } else if (password.length < 6) {
        return res.send({
            "success": false,
            "message": "Password should contain minimum 6 characters"
        });
    } else {
        if (payload == utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL) {
            var email = req.body.email;

            if (email === "") {
                return res.send({
                    "success": false,
                    "message": "Email is required"
                });
            }


            tables.otpTable.find({
                user_id: userId,
                otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                is_verified: true
            }, function (result) {
                if (result.length) {
                    generateHash(function (hash) {

                        password = encrypt(password, hash);
                        tables.vendorTable.update({
                            password: password,
                            hash: hash,
                            updated: Date.now()
                        }, {
                            _id: userId,
                        }, function (result) {
                            if (result != null) {
                                return res.send({
                                    "success": true
                                });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": "Email verification is required."
                    });
                }
            });

        } else if (payload == utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE) {
            var mobile = req.body.mobile;
            var mobileCountry = req.body.mobile_country;
            if (mobile === "") {
                return res.send(
                    {
                        "success": false,
                        "message": "Something went wrong. Please try again after sometime"
                    });
            }

            tables.otpTable.find({
                user_id: userId,
                otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                is_verified: true
            }, function (result) {
                if (result.length) {
                    generateHash(function (hash) {

                        password = encrypt(password, hash);
                        tables.vendorTable.update({
                            password: password,
                            hash: hash,
                            updated: Date.now()
                        }, {
                            _id: userId,
                        }, function (result) {
                            if (result != null) {
                                return res.send({
                                    "success": true
                                });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": "Mobile verification is required."
                    });
                }
            });
        } else {
            return res.send({
                "success": false,
                "message": "Invalid request"
            });
        }

        /*return res.send({
         "success" : false
         });*/
    }
});
router.post('/logout', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var salonId = req.body.salon_id;
    var deviceType = req.body.device_type;
    var userId = '';
    var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "tm_user_id": 1 });
    if (vendorDetails == undefined || vendorDetails.length == 0) {
        return res.send({ "success": true, "message": "Invalid User" });
    }
    if (salonId != '' && salonId != undefined) {
        var updateSalons = await tables.salonTable.updateWithPromises({ "access_token": '' }, { "_id": salonId });
        vendorId = salonId;
        userId = salonId
    } else {
        userId = vendorId;
        var updateSalons = await tables.vendorTable.updateWithPromises({ "access_token": '' }, { "vendor_id": vendorId });

    }
    var tmUserId = vendorDetails[0].tm_user_id;
    var fcmId = req.body.fcm_id;

    tables.activityTable.save({ "action_id": userId, "activity_title": utility.user_logout_text, "device_type": deviceType },
        function () {

        });
    tables.fcmTable.deleteVendor({ "vendor_id": vendorId }, async function (response) {
        var updateSalons = await tables.salonTable.updateWithPromises({ "booking_status": 2, "active_status": 2 }, { "vendor_id": vendorId });
        var fcmUpdate = await utility.deleteFcm({ "fcm_token": fcmId, "user_id": tmUserId, "device_type": 1 }, utility.user_role_salon);
        return res.send({ "success": true, "message": "updated" });
    });
});
router.post('/invite-code', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;

    if (vendorId == '' || vendorId == undefined) {
        return res.send({ success: false, message: "Invalid  request" });
    }
    var languageCode = req.body.language_code;

    tables.vendorTable.inviteCodeDetails(vendorId, languageCode, async function (response) {
        if (response[0].invite_code == undefined) {
            var vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "first_name": 1, "last_name": 1 });
            if (vendorDetails != undefined && vendorDetails.length != 0) {
                var firstName = vendorDetails[0].first_name['en'];
            }

            var genreateInviteCode = await utility.generateInviteCodeVendor(firstName);
            var update = await tables.vendorTable.updateWithPromises({ "invite_code": genreateInviteCode }, { "_id": vendorId });
            response[0].invite_code = genreateInviteCode;
        }
        return res.send({ "success": true, "details": response[0], "reach_amount": 200, "currency": "$" });
    });
});
router.post('/remind-invite', function (req, res) {
    var userId = req.body.vendor_id;
    var inviteUserId = req.body.invite_vendor_id;
    var languagesCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    if (inviteUserId == '' || inviteUserId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languagesCode] != undefined ? utility.errorMessages["Invalid request"][languagesCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.vendorTable.update({ "invite.$.remind": 2 }, { "_id": userId, "invite.vendor_id": inviteUserId }, async function (response) {
        var userDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": inviteUserId }, { "_id": 1, "mobile": 1, "first_name": 1, "last_name": 1 });
        if (userDetails != undefined && userDetails.length != 0) {
            var mobile = userDetails[0].mobile;
            var mobileCountry = userDetails[0].mobile_country;
            var name = userDetails[0].first_name + " " + userDetails[0].last_name;
        }
        if (response != null) {
            var inviteUser = response[0].first_name + " " + response[0].last_name;
        }
        var content = 'Hey use mrms app for booking';
        utility.curl.sendingSms(mobileCountry + mobile, content, function (response) { });
        return res.send({ "success": true, "message": "Reminder sent" });
    });
});

router.post('/aws-keys', tokenValidations, function (req, res) {
    var fs = require('fs'),
        path = require('path'),
        filePath = path.join(__dirname, '../aws-config.json');

    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            var jsonData = data.trim();
            var RNCryptor = require('jscryptor');
            var keys = RNCryptor.Encrypt(jsonData, '1234567890123456');
            return res.send({ "success": true, "keys": keys });
        } else {
            return res.send({ "success": false, "message": "no keys" });
        }
    });
});
router.post('/set-password', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;

    var email = req.body.email;
    var password = req.body.password;

    var update = {};

    if (vendorId == '' || vendorId == undefined) {
        return res.send({ success: false, message: "Invalid  request" });
    }


    if (password == '' || password == undefined) {

        return res.send({ "success": false, "message": "Please enter password" })
    } else if (password.length < 5) {
        return res.send({
            "success": false,
            "message": "Password should contain minimum 6 characters"
        });
    } else {

        async.series([
            function (callback) {


                generateHash(function (hash) {
                    var password = req.body.password;
                    update["password"] = encrypt(password, hash);
                    update['hash'] = hash;
                    return callback(true);
                });

            }],
            function (err) {

                /*  if (err == null) {
                 return res.send({"success": false, "message": "email already exits"});
                 } else if (err == "invalid email") {
                 return res.send({
                 "success": false,
                 "message": "Please provide valid email"
                 });
                 }
                 */
                tables.vendorTable.find({ "_id": vendorId }, function (response) {
                    if (response != undefined) {
                        tables.vendorTable.update(update, { "_id": vendorId }, function (response) {
                            if (response != null && response.length != 0) {
                                return res.send({
                                    "success": true,
                                    "status": response.status,
                                    "message": "Your password has been changed successfully. Please login.",
                                    "vendor_id": vendorId
                                });
                            } else {
                                return res.send({ "success": false, "message": "try Again" });
                            }
                        });
                    } else {
                        return res.send({
                            "success": false,
                            "status": 1,
                            "message": "not a valid user"
                        });
                    }
                });


            });
    }
});
router.post('/chat-profile-pics', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "type": 1, "salon_id": 1, "vendor_id": 1, "customer_id": 1 });
    if (bookingDetails != undefined && bookingDetails.length != 0) {
        var bookingType = bookingDetails[0].type;
        var customerId = bookingDetails[0].customer_id;
        var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": customerId }, { "profile_pic": 1 });
        var vendorDetails = '';
        var vendorProfilePic = '';
        var customerProfilePic = (customerDetails != undefined && customerDetails.length != 0 && customerDetails[0].profile_pic != undefined ? customerDetails[0].profile_pic : '');

        if (bookingType == utility.BOOKING_STYLIST_TYPE_SALON) {
            var salonId = bookingDetails[0].salon_id;
            vendorDetails = await tables.salonPicturesTable.findFieldsWithPromises({ "salon_id": salonId }, { "file_path": 1 });
            vendorProfilePic = (vendorDetails != undefined && vendorDetails.length != 0 ? vendorDetails[0].file_path : '');
        } else {
            var vendorId = bookingDetails[0].vendor_id;
            vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "profile_pic": 1 });
            vendorProfilePic = (vendorDetails != undefined && vendorDetails.length != 0 ? vendorDetails[0].profile_pic : '');
        }
        return res.send({ "success": true, "customer_profile_pic": customerProfilePic, "vendor_profile_pic": vendorProfilePic })
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        })

    }
});
router.post('/chat-profile', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "type": 1, "salon_id": 1, "vendor_id": 1, "customer_id": 1 });
    if (bookingDetails != undefined && bookingDetails.length != 0) {
        var bookingType = bookingDetails[0].type;
        var customerId = bookingDetails[0].customer_id;
        var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": customerId }, { "profile_pic": 1, "first_name": 1, "last_name": 1 });
        var vendorDetails = '';
        var vendorProfilePic = '';
        var customerProfilePic = (customerDetails != undefined && customerDetails.length != 0 && customerDetails[0].profile_pic != undefined ? customerDetails[0].profile_pic : '');
        var name = customerDetails[0]['first_name'][languageCode] + " " + customerDetails[0]['last_name'][languageCode];
        var vendorName = '';
        if (bookingType == utility.BOOKING_STYLIST_TYPE_SALON) {
            var salonId = bookingDetails[0].salon_id;
            vendorDetails = await tables.salonPicturesTable.findFieldsWithPromises({ "salon_id": salonId, }, { "file_path": 1 });
            var salonDetails = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "salon_name": 1 });
            vendorName = (salonDetails[0].salon_name[languageCode] ? salonDetails[0].salon_name[languageCode] : '');
            vendorProfilePic = (vendorDetails != undefined && vendorDetails.length != 0 ? vendorDetails[0].file_path : '');
        } else {
            var vendorId = bookingDetails[0].vendor_id;
            vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, { "profile_pic": 1, "name": 1 });
            vendorName = (vendorDetails[0].name[languageCode] ? vendorDetails[0].name[languageCode] : '');
            vendorProfilePic = (vendorDetails != undefined && vendorDetails.length != 0 ? vendorDetails[0].profile_pic : '');
        }
        return res.send({ "success": true, "customer_profile": { "profile_pic": customerProfilePic, 'name': name }, "vendor_profile": { "profile_pic": vendorProfilePic, "name": vendorName } })
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        })
    }
});
router.post('/customer-chat-profiles', tokenValidations, function (req, res) {
    var tmUserIds = req.body.tm_user_id;
    var languageCode = req.body.language_code;
    tmUserIds = JSON.parse(tmUserIds);
    var userIds = [];
    for (var t = 0; t < tmUserIds.length; t++) {
        userIds.push(parseInt(tmUserIds[t]));
    }
    tables.customerTable.getCustomerProfiles(userIds, languageCode, function (response) {
        return res.send({ "success": true, "customer_details": response });

    });
});
router.post('/resend-otp', tokenValidations, function (req, res) {
    var otpType = req.body.otp_type;
    if (otpType == undefined) {
        otpType = utility.OTP_TYPE_CUSTOMER_SIGN_UP;
    }
    var userId = req.body.user_id;
    if (!utility.isValidOtpType(parseInt(otpType))) {
        return res.send({ "success": false, "message": "Invalid  request" });
    }
    if (otpType == utility.OTP_TYPE_CUSTOMER_SIGN_UP) {

        if (userId == '' || userId == undefined) {
            return res.send({ "success": false, "message": "Invalid  request" });
        }
        async.series([
            function (callback) {

                tables.vendorTable.findFields({ _id: userId }, { "status": 1, "_id": 0 }, function (result) {
                    if (result != undefined && result.length) {
                        if (result[0].status > tables.vendorTable.status[3].status) {
                            return callback({
                                success: false,
                                message: "Your accountant is already verified. Please login."
                            });
                        } else {
                            return callback({ success: true });
                        }
                    } else {
                        return callback({ success: true });
                    }
                });

            }],
            async function (data) {

                if (!data.success) {
                    return res.send({ "success": false, "message": data.message });
                }


                var customerDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": userId }, { "mobile": 1, "mobile_country": 1 });

                var mobile = customerDetails[0].mobile;
                var mobileCountry = customerDetails[0].mobile_country;
                var otp = utility.generateOtp();
                // var otp=1234;

                // var message = 'your otp for registration into mr&ms is ' + otp;
                message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`

                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                var updateReqponse = await tables.vendorTable.updateWithPromises({ "otp": otp }, { "_id": userId });
                return res.send({
                    "success": true,
                    "status": 1,
                    "message": "otp sent",
                    "otp": otp,

                });
            });
    } else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL) {
        tables.vendorTable.findFields({ _id: userId }, { "email": 1, "_id": 1 }, function (response) {
            if (response != undefined && response.length != 0) {
                var email = response[0].email;
                var otp = utility.generateOtp();
                // var otp=1234;
                tables.otpTable.find({
                    data: email,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                    user_id: response[0]._id
                }, function (result) {
                    if (result != undefined && result.length) {
                        tables.otpTable.update({
                            otp: otp,
                            is_verified: false,
                            updated: Date.now()
                        }, {
                            _id: result[0]._id
                        }, function (response) {
                            if (response.updated != undefined) {
                                utility.curl.curl('send-otp-customer/' + userId + '/' + utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL);
                                return res.send({
                                    "success": true,
                                    "message": "OTP has been sent to " + email
                                });
                            } else {

                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    } else {
                        tables.otpTable.save({
                            user_id: response[0]._id,
                            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                            type_id: response[0]._id,
                            data: email,
                            otp: otp,
                            is_verified: false
                        }, function (result) {
                            utility.curl.curl('send-otp-customer/' + userId + '/' + utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL);
                            return res.send({
                                "success": true,
                                "message": "OTP has been sent to " + email
                            });
                        });
                    }
                });


            } else {
                return res.send({
                    "success": false,
                    "message": "not valid Email"
                });
            }
        });
    }
    else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE) {



        tables.vendorTable.findFields({ _id: userId }, { "mobile": 1, mobile_country: 1 }, function (response) {
            if (!response.length) {
                return res.send({
                    "success": false,
                    "message": "Mobile number is not registered."
                });
            }
            else {
                var mobile = response[0].mobile;
                var mobileCountry = response[0].mobile_country;
                var otp = utility.generateOtp();

                // var message = 'your otp for reset password into mr&ms is ' + otp;
                message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`

                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                tables.otpTable.find({
                    data: mobile,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                    user_id: response[0]._id
                }, function (result) {
                    if (result != undefined && result.length != 0) {
                        tables.otpTable.update({
                            otp: otp,
                            is_verified: false,
                            updated: Date.now()
                        }, {
                            _id: result[0]._id
                        }, function (response) {
                            if (response.updated != undefined) {
                                return res.send({
                                    "success": true,
                                    "message": "OTP has been sent to " + mobile
                                });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": "Something went wrong. Please try again after sometime"
                                });
                            }
                        });
                    } else {
                        tables.otpTable.save({
                            user_id: response[0]._id,
                            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                            type_id: response[0]._id,
                            data: mobile,
                            otp: otp,
                            is_verified: false
                        }, function (result) {
                            return res.send({
                                "success": true,
                                "message": "OTP has been sent to " + mobile
                            });
                        });
                    }
                });
            }
        });
    }
    else {
        return res.send({ "success": false, "message": "Invalid  request" });
    }

});
router.post('/send-otp-verify-device', tokenValidations, async function (req, res) {
    var vendorId = req.body.vendor_id;
    var userId = '';
    var type = req.body.type;
    var response = '';
    var mobile = '';
    type = parseInt(type);

    if (type == utility.VENDOR_TYPE_SALON_ADMIN) {
        var salonId = req.body.salon_id;




        userId = salonId;
        response = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "_id": 1, "phone": 1, mobile_country: 1 });
        mobile = response[0].phone;

    } else {
        userId = vendorId;
        response = await tables.vendorTable.findFieldsWithPromises({ _id: vendorId }, { "_id": 1, "mobile": 1, mobile_country: 1 });
        mobile = response[0].mobile;
    }

    if (!response.length) {
        return res.send({
            "success": false,
            "message": "Mobile number is not registered."
        });
    }
    else {

        var mobileCountry = response[0].mobile_country;
        var otp = utility.generateOtp();

        // var message = 'your otp for verify device into mr&ms is ' + otp;
        var message = `Mr&Ms Beauty icin tek kullanimlik giris sifreniz ${otp}`

        var encodeMessage = encodeURIComponent(message);
        utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

        });

        tables.otpTable.find({
            data: mobile,
            otp_type: utility.OTP_TYPE_VERIFY_DEVICE,
            user_id: userId
        }, function (result) {
            if (result != undefined && result.length != 0) {
                tables.otpTable.update({
                    otp: otp,
                    is_verified: false,
                    updated: Date.now()
                }, {
                    _id: result[0]._id
                }, function (response) {
                    if (response.updated != undefined) {
                        return res.send({
                            "success": true,
                            "message": "OTP has been sent to " + mobile
                        });
                    } else {
                        return res.send({
                            "success": false,
                            "message": "Something went wrong. Please try again after sometime"
                        });
                    }
                });
            } else {
                tables.otpTable.save({
                    user_id: response[0]._id,
                    otp_type: utility.OTP_TYPE_VERIFY_DEVICE,
                    type_id: response[0]._id,
                    data: mobile,
                    otp: otp,
                    is_verified: false
                }, function (result) {
                    return res.send({
                        "success": true,
                        "message": "OTP has been sent to " + mobile
                    });
                });
            }
        });
    }
});


router.post('/add-payment-deteils', async function (req, res) {

    if (req.body.iban == '' || req.body.iban == undefined) {
        return res.send({
            "success": false,
            "message": "iban required"
            , "errorcode": 1
        });
    }
    if (req.body.vendorId == '' || req.body.vendorId == undefined) {
        return res.send({
            "success": false,
            "message": "vendorId required"
            , "errorcode": 1
        });
    }
    if (req.body.languageCode == '' || req.body.languageCode == undefined) {
        return res.send({
            "success": false,
            "message": "languageCode required"
            , "errorcode": 1
        });
    }
    if (req.body.Address == '' || req.body.Address == undefined) {
        return res.send({
            "success": false,
            "message": "Address required"
            , "errorcode": 1
        });
    }

    vendorDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": req.body.vendorId }, {
        "mobile": 1, "profile_pic": 1,
        "mobile_country": 1, tm_user_id: 1, "first_name": 1, "last_name": 1, "email": 1, "status": 1
    });
    getconstdetails = await tables.vendorTable.getconstdetails({ "constant_type": 2 });

    if (!vendorDetails[0].mobile || !vendorDetails[0].mobile_country || !vendorDetails[0].first_name || !vendorDetails[0].last_name || !vendorDetails[0].email) {
        return res.send({
            "success": false,
            "message": "fields from db missing"
            , "errorcode": 1
        });
    }

    var iban = req.body.iban.replace(/\s+/g, "");

    var CariKodu = "";
    if (await publicIp.v4() == "3.212.189.52") {
        CariKodu = `te${vendorDetails[0].mobile}`
    } else if (await publicIp.v4() == "35.169.9.99") {
        CariKodu = `mr${vendorDetails[0].mobile}`;

    }



    var erpobj = {
        "CariKodu": CariKodu,
        "CariIsim": `${vendorDetails[0].first_name['tr']} ${vendorDetails[0].last_name['tr']}`,
        "CariTelefon": `${vendorDetails[0].mobile_country}${vendorDetails[0].mobile}`,
        "CariIl": ``,
        "CariIlce": ``,
        "UlkeKodu": getconstdetails[0].UlkeKodu,
        "CariAdres": `${req.body.Address}`,
        "TcKimlikNo": `${req.body.taxNumber}`,
        "KayitTarihi": new Date(),
        "KayitYapan": getconstdetails[0].KayitYapan,
        "Email": `${vendorDetails[0].email}`,
        "SirketKodu": getconstdetails[0].SirketKodu,
        "SubeKodu": getconstdetails[0].SubeKodu,
        "Aktif": getconstdetails[0].Aktif
    }


    var iserp = 0;
    var response = await axios.get(`${erpbaseUrl}api/cari/${getconstdetails[0].token}/oku?cariKodu=${erpobj.CariKodu}`);
    if (response.data.status == true) {

        iserp = 1
    } else {

        var createresponse = await axios.post(`${erpbaseUrl}api/cari/${getconstdetails[0].token}/kaydet`, erpobj);
        if (createresponse.data.status) {

            iserp = 1
        } else {
            console.log("createresponse>>>>>>>>>>>>>", createresponse)
            iserp = 0;

        }
    }

    console.log("iserp>>>>>>>>>>>>>>>>.", iserp)
    if (iserp == 1) {
        var languageCode = req.body.languageCode;

        var obj = {};
        obj.setConversationId = new Date().getTime();
        obj.setSubMerchantExternalId = new Date().getTime();
        obj.setAddress = req.body.Address;
        obj.setContactName = vendorDetails[0].first_name[languageCode];
        obj.setContactSurname = vendorDetails[0].last_name[languageCode];
        obj.setEmail = vendorDetails[0].email;
        obj.setGsmNumber = `${vendorDetails[0].mobile_country} ${vendorDetails[0].mobile}`;
        obj.setName = `${vendorDetails[0].first_name[languageCode]} ${vendorDetails[0].last_name[languageCode]}`;
        obj.setIban = iban;

        obj.setIdentityNumber = req.body.vendorId;
        obj.vendorId = req.body.vendorId;
        obj.ibanname = req.body.ibanname;
        obj.taxNumber = req.body.taxNumber;
        obj.ifsc = req.body.ifsc;
        tables.vendorTable.addvendorbankdetails(obj, async (err, data) => {
            if (data == "already added") {
                return res.send({
                    "success": false,
                    "status": 0,

                    "data": data

                });
            } else if (!err) {
                obj._id = data._id;
                var finalobj = JSON.stringify(obj);
                var encriptobj = Buffer.from(finalobj).toString('base64')
                var url = "";
                if (await publicIp.v4() == "3.212.189.52") {
                    url = `${utility.testurl}payment_sdk/samples/create_sub_merchant.php?str=${encriptobj}`
                } else if (await publicIp.v4() == "35.169.9.99") {
                    url = `${utility.produrl}payment_sdk/samples/create_sub_merchant.php?str=${encriptobj}`

                }

console.log("url>>>>>>>>>>>>>.",url)
                return res.send({
                    "success": true,
                    "status": 1,
                    "url": url,
                    "conversationId": data.setConversationId



                });
            }
        })

    } else {
        return res.send({
            "success": false,
            "message": "Cari kaydınız oluşturulamadı."



        });
    }










});

//update vendor bank details
router.post('/update-payment-deteils', async function (req, res) {
    console.log(">>>>>>>>>>>>>>>>>>>comming to update payment")
    if (req.body.iban_result) {
        req.body.iban_result = JSON.parse(req.body.iban_result)
    }
    console.log("update-payment-deteils", req.body)

    tables.vendorTable.updatepaymentdetails(req, (err, data) => {
        console.log("err,data",err,data)
        if (err) {
            return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
        } else {
            return res.send({
                "success": true,
                "response": data
            });
        }

    })



});


//get iban
router.post('/getiban', async function (req, res) {


    tables.vendorTable.getiban(req, (err, data) => {
        if (err) {
            return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
        } else if (!data.length) {
            return res.send({
                "success": false,
                "response": data
            });
        } else {
            return res.send({
                "success": true,
                "response": data
            });
        }

    })



});


router.post('/update-iban', async function (req, res) {

    if (req.body.vendorId == '' || req.body.vendorId == undefined) {
        return res.send({
            "success": false,
            "message": "vendorId required"
            , "errorcode": 1
        });
    }
    if (req.body.languageCode == '' || req.body.languageCode == undefined) {
        return res.send({
            "success": false,
            "message": "languageCode required"
            , "errorcode": 1
        });
    }


    await tables.vendorTable.getiban(req, async (err, getvendoribandetails) => {
        if (!getvendoribandetails || !getvendoribandetails[0]) {
            return res.send({
                "success": false,
                "message": "vendor iban not found"
                , "errorcode": 1
            });
        }



        getvendoribandetails[0].setIban = req.body.iban;
        getvendoribandetails[0].ibanname = req.body.ibanname;
        getvendoribandetails[0].taxNumber = req.body.taxNumber;


        var finalobj = JSON.stringify(getvendoribandetails[0]);
        var encriptobj = Buffer.from(finalobj).toString('base64')

        var url = "";
        if (await publicIp.v4() == "3.212.189.52") {
            url = `${utility.testurl}payment_sdk/samples/update_sub_merchant.php?str=${encriptobj}`
        } else if (await publicIp.v4() == "35.169.9.99") {
            url = `${utility.produrl}payment_sdk/samples/update_sub_merchant.php?str=${encriptobj}`

        }

        return res.send({
            "success": true,
            "status": 1,
            "url": url,
            "conversationId": getvendoribandetails[0].setConversationId

        });
    });






});



router.post('/update-iban-from-web', async function (req, res) {

    console.log("update-iban-from-web", req.body)
    if (req.body.iban_result) {
        req.body.iban_result = JSON.parse(req.body.iban_result)
    }

    tables.vendorTable.updateibanfromweb(req, (err, data) => {
        if (err) {
            return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
        } else if (data = "failed") {
            return res.send({
                "success": false,
                "response": data
            });
        } else {
            return res.send({
                "success": true,
                "response": data
            });
        }

    })







});

router.post('/vendor-online-payment', async function (req, res) {

    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (req.body.card_token == '' || req.body.card_token == undefined) {
        return res.send({
            "success": false,
            "message": "card_token required"
            , "errorcode": 1
        });
    }
    if (req.body.card_user_key == '' || req.body.card_user_key == undefined) {
        return res.send({
            "success": false,
            "message": "card_user_key required"
            , "errorcode": 1
        });
    } if (req.body.price == '' || req.body.price == undefined) {
        return res.send({
            "success": false,
            "message": "price required"
            , "errorcode": 1
        });
    } if (req.body.buyer == '' || req.body.buyer == undefined) {
        return res.send({
            "success": false,
            "message": "buyer object required"
            , "errorcode": 1
        });
    }
    if (req.body.shippingAddress == '' || req.body.shippingAddress == undefined) {
        return res.send({
            "success": false,
            "message": "shippingAddress object required"
            , "errorcode": 1
        });
    } if (req.body.billingAddress == '' || req.body.billingAddress == undefined) {
        return res.send({
            "success": false,
            "message": "billingAddress object required"
            , "errorcode": 1
        });
    }
    req.body.status = "0"
    req.body.paidPrice = Number(req.body.price);
    req.body.conversationId = new Date().getTime();
    console.log("req.body.paidPrice>>>>>>>>>>", req.body.paidPrice)
    tables.paymentcardTable.vendoraddpayment(req.body, async (response) => {

        if (response != undefined) {
            req.body._id = response._id;

            var finalobj = JSON.stringify(req.body);
            var encriptobj = Buffer.from(finalobj).toString('base64')
            var url = "";
            if (await publicIp.v4() == "3.212.189.52") {
                url = `${utility.testurl}payment_sdk/samples/create_payment_with_registered_card.php?str=${encriptobj}`
            } else if (await publicIp.v4() == "35.169.9.99") {
                url = `${utility.produrl}payment_sdk/samples/create_payment_with_registered_card.php?str=${encriptobj}`

            }

            return res.send({
                "success": true,
                "status": 1,
                "url": url,
                "conversationId": response.conversationId

            });
        }

    })



});


//update payment
router.post('/vendor-update-online-payment', async function (req, res) {
    if (req.body.payment_result) {
        req.body.payment_result = JSON.parse(req.body.payment_result)
    }
    tables.paymentcardTable.vendorupdateonilepayment(req, (response) => {

        if (response.nModified == 1 || response) {
            return res.send({
                "success": true,
                "message": "updated successfully"
            });
        } else {
            return res.send({
                "success": false,
                "message": "updated failed"
            });
        }

    })

});


//check payment status
router.post('/checkpaymentstatus', async function (req, res) {
    var bookingdetails = await tables.paymentcardTable.checkpaymentstatus(req);
    return res.send({
        "success": true,
        "message": "success",
        "bookingdetails": bookingdetails
    });



});


//vendor payments to admin
//check payment status
router.post('/vendorpaymentstoadmin', async function (req, res) {
    var getvendorpaymentstoadmin = await tables.paymentcardTable.getvendorpaymentstoadmin(req);
    return res.send({
        "success": true,
        "message": "success",
        "bookingdetails": getvendorpaymentstoadmin
    });



});

// const erp = "http://myor.mrandmsbeauty.com/"
// router.post('/erpsystem', async function (req, res) {
//     var response = await axios.get(`${erpbaseUrl}api/cari/9oY-Rd8M631gNO1C58d5T0FktOmKrtMuX2aBWSV0DD0xrRgmHU6Mpg/oku?cariKodu=${req.body.CariKodu}`);
//     if (response.data.status == true) {
//         res.send({ status: true, type: "get" })
//     } else {
//         var createresponse = await axios.post(`${erpbaseUrl}api/cari/9oY-Rd8M631gNO1C58d5T0FktOmKrtMuX2aBWSV0DD0xrRgmHU6Mpg/kaydet`, obj);
//         if (createresponse.data.status) {
//             res.send({ status: true, type: "create" })
//         } else {
//             res.send({ status: false, type: "create" })

//         }


//     }

// });





module.exports = router;
