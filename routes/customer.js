var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var async = require('async');
var tables = require('../db_modules/baseTable');
var sockets = require('../sockets').sockets;
var token = "bXImbXJzYXBpdG9rZW4";
var trim = require('trim');
var moment = require('moment-timezone');
var utility = require('../utility/utility');
var otpTable = require('../db_modules/otpTable');
const db = require('../db');
const { timeStamp } = require('console');
var tmToken = utility.tmToken;
var timeOutObj = {};
var timeoutCount = 1;
var mongoose = require('mongoose');
const axios = require('axios');
var ip = require('ip');


var cron = require('node-cron');
const { type } = require('os');

const publicIp = require('public-ip');
var http = require('http');

var request = require('request');

cron.schedule('* * * * * *', async () => {
    tables.bookingsTable.getpendingbookings(async (data) => {
        // console.log("await publicIp.v4()",await publicIp.v4())
        if (data && data.length) {
            console.log("comming to first if")
            for (var i = 0; i < data.length; i++) {
                var booking_accepted = data[i].booking_accepted;
                const currentdate = new Date();
                ts1 = booking_accepted.getTime();
                ts2 = currentdate.getTime();
                timeStampdiff = ((ts2 - ts1) / 1000);
                //timer = ((data[i].bookings * 2 * 60) - timeStampdiff) * 1000;
                timer = ((10 * 60) - timeStampdiff) * 1000;
                if (timer <= 0) {
                    var userbookings = await tables.bookingsTable.userbookings({ customer_id: data[i]._id, payment_status: 2, status: 2 });
                    if (userbookings && userbookings.length) {
                        console.log("comming to second if")
                        for (var j = 0; j <= userbookings.length; j++) {


                            var obj = {};

                            obj.booking_id = userbookings[j]._id;
                            obj.user_id = data[i]._id;

                            var result = cancelbookingincron(obj);
                        }
                    }

                }


            }


        }


    });


});







async function tokenValidations(req, res, next) {
    var languageCode = req.body.language_code;
    languageCode = utility.languageCode(languageCode);
    req.body.language_code = languageCode;
    var startTime = utility.getTime;
    var endTime = utility.getTime;


    var writeData = {
        "start_time": startTime,
        "end_time": endTime,
        "request_from": "customer",
        "path": req.originalUrl,
        "request": req.body
    };

    utility.writeToFile.writeToFile(writeData);

    console.log(req.body, req.originalUrl, "orignal url");

    if (req.body.token == token) {
        var userId = req.body.user_id;
        if (userId != undefined && req.body.access_token != undefined && req.body.access_token != "" && req.originalUrl != '/api/customer/logout') {
            var userAcessToken = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "access_token": 1, "is_locked": 1 });
            if (userAcessToken == undefined || userAcessToken.length == 0) {
                // return res.json({ success: false, message: "Invalid Access Your Account is going to logout ", "is_login": 2 });
                return res.json({ success: false, message: "Geçersiz erişim isteği. Hesabınızdan çıkış yapılıyor.", "is_login": 2 });

            }
            if (userAcessToken != undefined && userAcessToken.length != 0 && userAcessToken[0]['access_token'] != req.body.access_token) {
                // return res.json({ success: false, message: "Invalid Access Your Account is going to logout", "is_login": 2 });
                return res.json({ success: false, message: "Geçersiz erişim isteği. Hesabınızdan çıkış yapılıyor.", "is_login": 2 });

            }
            if (userAcessToken[0].is_locked != undefined && userAcessToken[0].is_locked == 2) {
                // return res.json({ success: false, message: "Your Account is going to logout because the account is blocked please contact admin", "is_login": 2 });
                return res.json({ success: false, message: "Hesabınız dondurulmuş. Çıkış yapılıyor. Lütfen Mr&Ms Beauty ile iletişime geçiniz.", "is_login": 2 });

            }
        }
        return next();
    } else {
        // return res.json({ success: false, message: "Invalid token" });
        return res.json({ success: false, message: "Geçersiz anahtar." });

    }
}

/*router.get('/post-image',function(){
    imageMagick('/var/www/html/glow_me_up_development/public/img/girl.png')
        .composite('/var/www/html/glow_me_up_development/public/img/images.jpg')
        .in('-compose', 'Dst_Over')
        .in('-geometry', '253x253+15+15')
        .write('/var/www/html/glow_me_up_development/public/img/nodes.jpg', function (err) {
            if (err) console.error(err);
            else ;
        });
});*/

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
    tables.customerTable.find({ "hash": hash }, function (response) {
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


const debug = true;
const baseUrl = 'http://85.111.33.46:90';
// const stylist_phone = '919700006847';//number format must be like this. Dont use +
// const customer_phone = '919347954367';//number format must be like this. Dont use +

// const stylist_phone = '905335914568';//number format must be like this. Dont use +
// const customer_phone = '905069323139';//number format must be like this. Dont use +
const voice_code = '7575';
const callcentertoken = 'NBGET4576G6KT9';

var callcenter = (req) => {
    return new Promise((resolve, reject) => {
        axios.post(`${baseUrl}/call.php`, {
            arayan: req.body.stylist_phone,
            aranan: req.body.customer_phone,
            token: callcentertoken
        })
            .then(function (response) {
                // console.log("response>>>>>>>>>>",response)
                resolve(response)
                // return response
            })
            .catch(function (error) {
                console.log("comming to catch")
                reject(error)
            });
    })
}

router.post('/callcenterapi', async function (req, res) {
    if (!req.body.stylist_phone) {
        return res.send({ status: false, message: "stylist_phone phone number is required" })

    } else if (!req.body.customer_phone) {
        return res.send({ status: false, message: "customer_phone phone number is required" })

    } else {
        // if (debug) { console.log('Base url: ', baseUrl, 'Stylist Phone: ', stylist_phone, 'Customer Phone: ', customer_phone, 'Token: ', token) };
        var response = await callcenter(req);
        console.log(response);
        if (response.status == 200) {
            // return res.json({status : true,message : "You will be called soon"});
            return res.json({ status: true, message: "Birazdan aranacaksınız." })
        } else {
            // return res.json({status : false,message : "Connection could not be established"})
            return res.json({ status: false, message: "Bağlantı kurulamadı." })
        }

    }

});

router.post('/check-mobile', tokenValidations, function (req, res) {
    var mobile = req.body.mobile;
    var mobileCountry = req.body.mobile_country;
    if (mobile == '' || mobile == null) {
        return res.send({ success: false, message: "Please provide mobile number" });
    }

    var check = { mobile: mobile, mobile_country: mobileCountry };

    tables.customerTable.find(check, function (response) {
        if (response.length != 0) {
            var status = response[0].status;
            var isSocialLogin = (response[0].is_social_login == undefined || response[0].is_social_login == 0 ? 0 : response[0].is_social_login);

            if (status == 3 || status == 2) {
                status = 1;
            }

            if (status == tables.customerTable.status[0].status) {
                var otp = utility.generateOtp();
                // var otp=1234;

                var message = 'your otp for registration into mr&ms is ' + otp;
                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                tables.customerTable.update({ "otp": otp }, { "_id": response[0]._id }, function (updateResponse) {
                    return res.send({
                        "success": true,
                        "status": 1,
                        "message": "otp verification",
                        'is_social_login': isSocialLogin,
                        "user_id": response[0]._id,
                        "otp": otp
                    })
                });
            } else if (status == tables.customerTable.status[1].status) {
                var otp = utility.generateOtp();
                // var otp=1234;
                var message = '';
                message = 'your otp for registration into mr&ms is ' + otp;
                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                tables.customerTable.update({ "otp": otp, "status": 1, "email": '' }, { "_id": response[0]._id }, function (updateResponse) {
                    return res.send({
                        "success": true,
                        "status": 1,
                        "message": "otp verification",
                        'is_social_login': isSocialLogin,
                        "user_id": response[0]._id,
                        "otp": otp
                    })
                });

            } else if (status == tables.customerTable.status[2].status) {
                return res.send({
                    "success": true,
                    "status": 2,
                    "message": "email update",
                    'is_social_login': isSocialLogin,
                    "user_id": response[0]._id
                })

            } else if (status == tables.customerTable.status[3].status) {
                return res.send({
                    "success": true,
                    "user_id": response[0]._id,
                    "status": 3,
                    'is_social_login': isSocialLogin,
                    "message": "password update"
                })
            }
            else if (status == tables.customerTable.status[4].status) {
                return res.send({
                    "success": true,
                    "user_id": response[0]._id,
                    "status": 4,
                    'is_social_login': isSocialLogin,
                    "message": "profile update"
                })
            }
            else if (status == tables.customerTable.status[5].status) {
                return res.send({
                    "success": true,
                    "user_id": response[0]._id,
                    'is_social_login': isSocialLogin,
                    "status": 5

                })
            }
            else {
                return res.send({
                    "success": false,
                    "message": "Something went wrong. Please try again after sometime."
                });
            }
        } else {
            var otp = utility.generateOtp();
            // var otp=1234;
            var message = '';
            message = 'your otp for registration into mr&ms is ' + otp;
            var encodeMessage = encodeURIComponent(message);
            utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

            });
            tables.customerTable.save({
                "mobile": mobile,
                "mobile_country": mobileCountry,
                "status": tables.customerTable.status[1].status,
                "otp": otp
            }, function (response) {

                if (response != undefined) {
                    return res.send({
                        "success": true,
                        "status": 1,
                        "message": "otp verification",
                        "user_id": response._id
                    });
                }


            });
        }
    });

});
router.post('/get-user-details', tokenValidations, function (req, res) {
    var userId = req.body.user;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.customerTable.findFields({ "_id": userId }, { 'first_name': 1, "last_name": 1, "fullName": 1 }, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "details": response[0] });
        } else {
            return res.send({ "success": false, "message": "Invalid user" });
        }
    });
});
router.post('/verify-otp', tokenValidations, async function (req, res) {
    var otp = req.body.otp;
    var otpType = req.body.otp_type;
    var languageCode = req.body.language_code;
    var mobile_country = req.body.mobile_country;
    if (otpType == undefined || otpType == '') {
        otpType = utility.OTP_TYPE_CUSTOMER_SIGN_UP;
    }

    if (!utility.isValidOtpType(parseInt(otpType))) {
        return res.send({ "success": false, "message": "Invalid  request" });
    }

    if (otpType == utility.OTP_TYPE_CUSTOMER_SIGN_UP) {
        var userId = req.body.user_id;
        if (userId == '' || userId == undefined) {
            return res.send({ "success": false, "message": "Invalid  request" });
        }

        async.series([
            function (callback) {

                tables.customerTable.findFields({ _id: userId }, { "status": 1, "_id": 0 }, function (result) {
                    if (result != undefined && result.length) {
                        if (result[0].status > tables.customerTable.status[3].status) {
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
            function (data) {

                if (!data.success) {
                    return res.send({ "success": false, "message": data.message });
                }
                tables.customerTable.find({ _id: userId, otp: otp }, function (result) {

                    if (otp == '' || otp == undefined) {
                        return res.send({ success: false, message: "Please enter otp" });
                    }

                    if (!result.length) {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["Invalid otp"][languageCode]
                        });
                    } else {
                        tables.customerTable.update({ "status": tables.customerTable.status[2].status }, {
                            "_id": userId,
                            "otp": otp
                        }, async function (response) {
                            var countrydetails = await tables.countryTable.findrequiredfields({ "phone_code": mobile_country }, { call_center_number: 1 })
                            var call_center_number = '';
                            if (countrydetails && countrydetails[0]) {
                                call_center_number = countrydetails[0].call_center_number;
                            }
                            if (response != null && response.length != 0) {
                                return res.send({
                                    "success": true,
                                    "status": 2,
                                    "message": "update your password",
                                    "user_id": response._id,
                                    "mobile": response.mobile,
                                    "mobile_country": response.mobile_country,
                                    "call_center_number": call_center_number

                                });
                            } else {
                                return res.send({ "success": false, "status": 1, "message": utility.errorMessages["Invalid otp"][languageCode] });
                            }
                        });
                    }
                });

            });
    } else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL) {
        var email = req.body.email;
        email = email.toLowerCase();
        if (email === "") {
            return res.send({
                "success": false,
                "message": "email  is required"
            });
        }
        otpTable.find({
            data: email,
            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
            otp: otp
        }, function (result) {
            if (result.length) {
                otpTable.update({
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
                            "message": "Invalid OTP"
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": "Invalid OTP"
                });
            }
        });
    } else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE) {
        var mobile = req.body.mobile;
        if (mobile === "") {
            return res.send({
                "success": false,
                "message": "Mobile number is required"
            });
        }

        otpTable.find({
            data: mobile,
            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
            otp: otp
        }, function (result) {
            if (result.length) {
                otpTable.update({
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
                            "message": "Invalid OTP"
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": "Invalid OTP"
                });
            }
        });
    } else if (otpType == utility.OTP_TYPE_VERIFY_DEVICE) {
        var userId = req.body.user_id;
        var fcmId = req.body.fcm_id;
        var deviceId = req.body.device_id;
        var deviceType = req.body.device_type;
        var userDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
            "mobile": 1, "profile_pic": 1,
            "mobile_country": 1, "tm_user_id": 1, "first_name": 1, "last_name": 1, "email": 1
        });
        if (userDetails == undefined || userDetails.length == 0) {
            return res.send({
                "success": false,
                "message": "Invalid user"
            });
        }
        var mobile = userDetails[0].mobile;
        otpTable.find({
            data: mobile,
            otp_type: utility.OTP_TYPE_VERIFY_DEVICE,
            otp: otp
        }, function (result) {
            if (result.length) {
                otpTable.update({
                    is_verified: true,
                    updated: Date.now()
                }, {
                    _id: result[0]._id
                }, async function (result) {
                    if (result != null && result.updated != undefined) {
                        var userDetailsUpdate = await tables.customerTable.updateWithPromises({ "access_token": 1 }, { "_id": userId });
                        var mobileCountry = userDetails[0].mobile_country;
                        var tmUserId = userDetails[0].tm_user_id;
                        var name = userDetails[0].first_name[languageCode] + " " + userDetails[0].last_name[languageCode];
                        var profilePic = (userDetails[0].profile_pic == undefined ? '' : userDetails[0].profile_pic);
                        tables.activityTable.save({
                            "action_id": userId,
                            "activity_title": utility.user_login_text,
                            "device_type": deviceType
                        },
                            function () {
                            });
                        if (tmUserId == undefined || tmUserId == 0) {
                            var email = userDetails[0].email;
                            if (email == undefined) {
                                email = '';
                            }
                            tmUserId = await utility.getTmUserId({
                                mobile: mobileCountry + mobile,
                                name: name,
                                email: email
                            });
                            var update = await tables.customerTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": userId });
                        }
                        if (fcmId != '' && fcmId != undefined) {
                            deviceType = parseInt(deviceType);
                            var fcmData = {};

                            fcmData['fcm_id'] = fcmId;
                            fcmData["device_id"] = deviceId;
                            fcmData["device_type"] = deviceType;
                            tables.fcmTable.update(fcmData, { "customer_id": userId }, async function (response) {
                                if (response == null) {
                                    var save = {};
                                    save['fcm'] = [];
                                    save['fcm'].push(fcmData);
                                    save['customer_id'] = userId;
                                    tables.fcmTable.save(save, async function (response) {
                                        if (tmUserId != 0) {
                                            await utility.updateFcm({
                                                "fcm_token": fcmId,
                                                "user_id": tmUserId,
                                                "device_type": deviceType
                                            }, utility.user_role_customer)

                                        }
                                    });
                                }
                            });
                        }
                        var accessToken = utility.generateAccessToken();
                        tables.customerTable.update({ "access_token": accessToken }, { "_id": userId }, function (response) {
                        });
                        req.app.io.sockets.in(userId).emit("force_logout", { "is_login": 2 });
                        return res.send({
                            "success": true,
                            "user_id": userId,
                            "name": name,
                            'access_token': accessToken,
                            "profile_pic": profilePic,
                            "tm_user_id": tmUserId
                        });
                    }
                    else {
                        return res.send({
                            "success": false,
                            "message": "Invalid OTP"
                        });
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": "Invalid OTP"
                });
            }
        });
    } else {
        return res.send({ "success": false, "message": "Invalid  request" });
    }
});
router.post('/update-email', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var email = req.body.email;
    if (email == '' || email == undefined) {
        return res.send({
            "success": false,
            "message": "Please provide  email"
        });
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request"
        });
    }
    /*if (!utility.isValidEmail(email)) {
        return res.send({
            "success": false,
            "message": "Please provide valid email"
        });
    }*/
    var update = {};
    email = email.toLowerCase();
    tables.customerTable.find({ "email": email, "_id": { "$ne": userId } }, function (response) {

        if (response.length == 0) {
            update['email'] = email;
            tables.customerTable.find({ "_id": userId }, function (response) {
                if (response != undefined || response.length != 0) {
                    if (response[0].status == 2) {
                        update['status'] = 3
                    }
                    tables.customerTable.update(update, { '_id': userId }, function (response) {
                        if (response != null && response.length != 0) {
                            return res.send({
                                "success": true,
                                "status": response.status,
                                "message": "update password",
                                "user_id": response._id
                            });
                        } else {
                            return res.send({ "success": false, "message": "try again" });
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
        } else {
            return res.send({ "success": false, "message": "email already exists" });
        }

    });
});
router.post('/set-password', tokenValidations, function (req, res) {
    var userId = req.body.user_id;

    var email = req.body.email;
    var password = req.body.password;
    var languageCode = req.body.language_code;
    var update = {};


    if (userId == '' || userId == undefined) {
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

                /*  if (email != '' && email != undefined) {

                 if (!utility.isValidEmail(email)) {
                 return callback("invalid email");
                 }

                 customerTable.find({email: email}, function (response) {
                 if (response.length == 0) {
                 update['email'] = email;

                 generateHash(function (hash) {
                 var password = req.body.password;
                 update["password"] = encrypt(password, hash);
                 update['hash'] = hash;
                 update['status']=3
                 return callback(true);
                 });
                 } else {
                 var err = null;
                 return callback(err);
                 }
                 });
                 } else {
                 callback();
                 }*/
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
                tables.customerTable.find({ "_id": userId }, function (response) {
                    if (response != undefined) {
                        if (response[0].status == 3 || response[0].is_social_login == 1) {
                            update['status'] = 4
                        }
                        tables.customerTable.update(update, { "_id": userId }, function (response) {

                            if (response != null && response.length != 0) {

                                tables.styleTable.findFieldsWithProject({ "status": 1 }, { "style": { "$ifNull": ["$style." + languageCode, "$style.en"] } }, function (preferredStyles) {
                                    return res.send({
                                        "success": true,
                                        "status": 4,
                                        "message": "update profile",
                                        "user_id": response._id,
                                        "preferred_styles": preferredStyles
                                    });
                                });
                            } else {
                                return res.send({ "success": false, "status": 3, "message": "try Again" });
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
router.post('/update-profile', tokenValidations, async function (req, res) {
    console.log("comming to function")
    var firstName = req.body.first_name,
        lastName = req.body.last_name,
        fullName = req.body.fullName || "abc",
        nationality = req.body.nationality,
        nationalityShortCode = req.body.nationality_code,
        gender = parseInt(req.body.gender),
        userId = req.body.user_id,
        preferredStyle = req.body.preferred_style,
        stylistGender = req.body.stylist_gender,
        paymentMode = req.body.payment_mode,
        inviteCode = req.body.invite_code,
        languageCode = req.body.language_code,
        isSocialLogin = req.body.is_social_login;
    var update = {};
    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Invalid request"][languageCode] });
    }
    if (isSocialLogin == undefined || isSocialLogin == 0) {
        console.log("comming to social login function")
        if (trim(firstName) === "") {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Please provide your first name."][languageCode]
            });
        }
        /* if (!utility.isValidName(firstName)) {
         return res.send({
         "success": false,
         "message": "Please provide valid first name."
         });
         }*/
        if (trim(lastName) === "") {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Please provide your last name."][languageCode]
            });
        }

        /*if (!utility.isValidName(lastName)) {
         return res.send({
         "success": false,
         "message": "Please provide valid last name."
         });
         }*/

        // if (gender === "") {
        //     return res.send({
        //         "success": false,
        //         "message": utility.errorMessages["Please provide your gender."][languageCode]
        //     });
        // }

        // if (!utility.isValidGender(gender)) {
        //     return res.send({
        //         "success": false,
        //         "message": utility.errorMessages["Please provide valid gender."][languageCode]
        //     });
        // }
        update["gender"] = gender;
        // if (trim(nationality) == "") {
        //     return res.send({
        //         "success": false,
        //         "message": utility.errorMessages["Please provide your nationality."][languageCode]
        //     });
        // }

        // if (trim(nationalityShortCode) == "") {
        //     return res.send({
        //         "success": false,
        //         "message": utility.errorMessages["Nationality code is required."][languageCode]
        //     });
        // }
        update["nationality"] = {
            "nationality": nationality,
            "shortCode": nationalityShortCode
        };
        var firstNameTranslate = await utility.translateText(firstName, languageCode);
        firstNameTranslate[languageCode] = firstName;
        var lastNameTranslate = await utility.translateText(lastName, languageCode);
        lastNameTranslate[languageCode] = lastName;
        update['first_name'] = firstNameTranslate;
        update['last_name'] = lastNameTranslate;

        // var fullNameTranslate = await utility.translateText(fullName, languageCode);
        // fullNameTranslate[languageCode] = fullName;
        // update['full_name'] = fullNameTranslate;
    }

    if (preferredStyle != undefined && trim(preferredStyle) != "") {

        preferredStyle = preferredStyle.split(",");
        update["preferred_style"] = preferredStyle;
    }

    if (stylistGender != undefined && trim(stylistGender) != "") {

        stylistGender = stylistGender.split(",");
        var stylistGenderLength = stylistGender.length;
        var stylistGenderFlag = [];
        for (var g = 0; g < stylistGenderLength; g++) {
            if (!utility.isValidGender(parseInt(stylistGender[g]))) {
                stylistGenderFlag.push(0);
            }
        }

        if (stylistGenderFlag.indexOf(0) != -1) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Please provide valid stylist gender."][languageCode]
            });
        }

        update["stylist_gender"] = stylistGender;
    }


    if (paymentMode !== "" && paymentMode != undefined) {

        if (tables.customerTable.validPaymentModes.indexOf(parseInt(paymentMode)) == -1) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Invalid payment mode provided."][languageCode]
            });
        }

        update["payment_mode"] = paymentMode;
    }
    if (inviteCode != '' && inviteCode != undefined) {

        inviteCode = inviteCode.toLowerCase();
        var customerDetails = await tables.customerTable.findFieldsWithPromises({ "invite_code": inviteCode }, { "_id": 1 });
        if (customerDetails != undefined && customerDetails.length != 0) {
            update['referral_invite_code'] = inviteCode;
            update['referral_customer_id'] = customerDetails[0]._id;
        } else {
            return res.send({
                "success": false,
                "message": utility.errorMessages["invite Code is invalid"][languageCode]
            });

        }
    }

    update["updated"] = Date.now();

    tables.customerTable.find({ "_id": userId }, async function (result) {

        if (result != undefined) {
            if (result[0].status == 4) {
                update['status'] = 5
            }
            tables.customerTable.update(update, { "_id": userId }, async function (response) {

                update = {};
                var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "first_name": 1, "last_name": 1, "mobile": 1, "mobile_country": 1, "email": 1 })
                firstName = customerDetails[0]['first_name'][languageCode];
                lastName = customerDetails[0]['last_name'][languageCode];
                var genreateInviteCode = await utility.generateInviteCodeCustomer(firstName);
                var mobile = customerDetails[0].mobile;
                var mobileCountry = customerDetails[0].mobile_country;
                var email = customerDetails[0].email;
                if (email == undefined) {
                    email = '';
                }
                var name = firstName + ' ' + lastName;
                update['invite_code'] = genreateInviteCode;
                var tmUserId = await utility.getTmUserId({
                    mobile: mobileCountry + mobile,
                    name: name,
                    token: tmToken,
                    email: email
                });
                update['tm_user_id'] = tmUserId;
                if (response != null && response.length != 0) {
                    if (inviteCode != '' && inviteCode != undefined) {
                        var updateInvite = await tables.customerTable.updateInvite({
                            "customer_id": response._id,
                            "amount": 0
                        }, { "_id": customerDetails[0]._id })
                    }
                    var accessToken = utility.generateAccessToken();
                    update['access_token'] = accessToken;
                    var updateWithPromises = await tables.customerTable.updateWithPromises(update, { "_id": userId });
                    return res.send({
                        "success": true,
                        "status": 5, "name": name, "message": "login", "access_token": accessToken, "user_id": userId, "tm_user_id": tmUserId, "created": updateWithPromises.created, "updated": updateWithPromises.updated, "email": updateWithPromises.email, "profile_pic": updateWithPromises.profile_pic
                    });
                } else {
                    return res.send({
                        "success": false,
                        "status": 4,
                        "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode],
                        "name": name
                    });
                }
            });
        } else {
            return res.send({
                "success": false,
                "status": 1,
                "message": utility.errorMessages["not a valid user"][languageCode]
            });
        }

    });

});

router.post('/get-styles', tokenValidations, function (req, res) {

    var languageCode = req.body.language_code;
    tables.styleTable.findFieldsWithProject({ "status": 1 }, {
        "_id": 1,
        "style": { "$ifNull": ["$style." + languageCode, "$style.en"] }
    }, function (response) {
        return res.send({ "success": true, "message": "styles", "preferred_styles": response });
    });

    //  res.send([{_id:'dfgdgdfgdfg234233242',style:'indian style'},{_id:'dfgdgdfgdfg234233222',style:'mexiacan style'},{_id:'dfgdgdfgdfg23423322121',style:'american style'}])
});
router.post('/social-login', tokenValidations, async function (req, res) {
    var type = req.body.login_type;
    var checkUserLogin = '';
    var email = req.body.email;
    var deviceType = req.body.device_type;
    var languageCode = req.body.language_code;
    deviceType = parseInt(deviceType);
    if (type == tables.customerTable.loginType.fackebook) {
        //login details from facebook : first_name,profilePic,last_name,email,id;
        var faceBookId = req.body.id;
        checkUserLogin = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1 });
    } else if (type == tables.customerTable.loginType.gmail) {
        //login details from gmail : userId,email,firstName,lastName
        checkUserLogin = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1 });

    } else if (type == tables.customerTable.loginType.instagram) {

        checkUserLogin = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1 });

    } else if (type == tables.customerTable.loginType.snapchat) {
        checkUserLogin = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1, "status": 1 });
    }
    if (checkUserLogin != undefined && checkUserLogin.length != 0) {
        var userId = checkUserLogin[0]._id;
        var response = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
            "password": 1, "getFcmIdsCustomer": 1, "tm_user_id": 1, "hash": 1,
            "profile_pic": 1, "device_id": 1, "first_name": 1,
            "last_name": 1, "status": 1, "is_social_login": 1, "is_locked": 1, "access_token": 1
        });
        var name = (response[0].first_name != undefined && response[0].first_name[languageCode] != undefined ? response[0].first_name[languageCode] : '') + ' ' + (response[0].last_name != undefined && response[0].last_name[languageCode] != undefined ? response[0].last_name[languageCode] : '');
        var profilePic = (response[0].profile_pic != undefined ? response[0].profile_pic : '');
        var isSocialLogin = (response[0].is_social_login != undefined && response[0].is_social_login == 1 ? response[0].is_social_login : 0);
        var tmUserId = response[0].tm_user_id;
        var status = response[0]['status'];
        if ((tmUserId == undefined || tmUserId == 0) && status == 5) {
            var email = response[0].email;
            if (email == undefined) {
                email = '';
            }
            var mobileCountry = response[0].mobile_country;
            var mobileNumber = response[0].mobile;
            tmUserId = await utility.getTmUserId({ mobile: mobileCountry + mobileNumber, name: name, email: email });
            var update = await tables.customerTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": userId });
        }
        /* var otp=utility.generateOtp();
         // var otp=1234;
         var message='';
         message='your otp for registration into mr&ms is '+otp;
         var encodeMessage=encodeURIComponent(message);
         utility.curl.sendingSms(mobileCountry+mobile,encodeMessage,function(response){

         });*/
        if (response[0]['is_locked'] != undefined && response[0]['is_locked'] == 2) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Account is locked please concat admin"][languageCode],
                'is_login': 2
            });
        }
        if (response[0].access_token != undefined && response[0].access_token != '') {
            return res.send({ "success": false, "user_id": userId, "message": "user login in another device do u want to login", 'is_login': 1 })
        }
        var fcmId = req.body.fcm_id;
        var deviceId = req.body.device_id;
        if (fcmId != '' && fcmId != undefined) {
            var fcmData = {};
            fcmData['fcm_id'] = fcmId;
            fcmData["device_id"] = deviceId;
            fcmData["device_type"] = deviceType;
            tables.fcmTable.update(fcmData, { "customer_id": userId }, async function (response) {
                if (response == null) {
                    var save = {};
                    save['fcm'] = [];
                    save['fcm'].push(fcmData);
                    save['customer_id'] = userId;
                    tables.fcmTable.save(save, async function (response) {
                        await utility.updateFcm({
                            "fcm_token": fcmId,
                            "user_id": tmUserId,
                            "device_type": deviceType
                        }, utility.user_role_customer)
                    });
                }
            });
        }
        if (status == 5) {
            var accessToken = utility.generateAccessToken();

            tables.customerTable.update({ "access_token": accessToken }, { "_id": userId }, function (response) {
            });
        }
        return res.send({
            "success": true, "message": "old Login",
            "name": name, "profile_pic": profilePic,
            'user_id': userId,
            "tm_user_id": tmUserId,
            "error_code": 2,
            "status": status,
            "access_token": accessToken,
            "is_social_login": isSocialLogin
        });
    } else {
        //succees
        return res.send({ "success": true, "message": "new Login", "error_code": 1 })
    }
});

router.post('/chat-profile-pics', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, {
        "type": 1,
        "salon_id": 1,
        "vendor_id": 1,
        "customer_id": 1
    });
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
        return res.send({
            "success": true,
            "customer_profile_pic": customerProfilePic,
            "vendor_profile_pic": vendorProfilePic
        })
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        })

    }
});
router.post("/login", tokenValidations, function (req, res) {
    console.log(req.body)
    var mobileNumber = req.body.mobile;
    var mobileCountry = req.body.mobile_country;
    var password = req.body.password;
    var fcmId = req.body.fcm_id;
    var deviceId = req.body.device_id;
    var deviceType = req.body.device_type;
    var languageCode = req.body.language_code;

    deviceType = parseInt(deviceType);
    if (mobileNumber === "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Mobile number is required!"][languageCode]
        });
    }
    if (password === "") {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Password is required!"][languageCode]
        });
    }
    tables.customerTable.findFields({ mobile: mobileNumber, mobile_country: mobileCountry }, {
        "password": 1, "getFcmIdsCustomer": 1,
        "tm_user_id": 1, "hash": 1,
        "profile_pic": 1,
        "device_id": 1,
        "first_name": 1,
        "is_locked": 1,
        "last_name": 1, "access_token": 1, "email": 1, "created": 1, "updated": 1, "mobile": 1, "mobile_country": 1
    }, async function (result) {
        if (result != undefined) {
            if (!result.length) {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["Mobile is not registered."][languageCode]
                });
            } else {
                if (decrypt(result[0].password, result[0].hash) == password) {

                    if (result[0]['is_locked'] != undefined && result[0]['is_locked'] == 2) {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["Account is locked please contact admin"][languageCode],
                            'is_login': 1,
                            'is_locked': 1
                        });
                    }
                    /* if(result[0].access_token!=undefined && result[0].access_token!='')
                     {
                        return res.send({"success":false,"message":"user login in another device do u want to login",'is_login':1})
                     }*/
                    var userId = result[0]._id;
                    var tmUserId = result[0].tm_user_id;
                    console.log("languageCode>>>>>>>>>>>>>>>>>>", languageCode)
                    var name = result[0].first_name[languageCode] + " " + result[0].last_name[languageCode];
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>", name)
                    var name = name;
                    var email = result[0].email;
                    var created = result[0].created;
                    var updated = result[0].updated;
                    var profilePic = (result[0].profile_pic == undefined ? '' : result[0].profile_pic);
                    var mobile = result[0].mobile;
                    var mobile_country = result[0].mobile_country
                    tables.activityTable.save({
                        "action_id": userId,
                        "activity_title": utility.user_login_text,
                        "device_type": deviceType
                    },
                        function () {

                        });

                    if (tmUserId == undefined || tmUserId == 0) {
                        var email = result[0].email;
                        if (email == undefined) {
                            email = '';
                        }
                        tmUserId = await utility.getTmUserId({
                            mobile: mobileCountry + mobileNumber,
                            name: name,
                            email: email
                        });
                        var update = await tables.customerTable.updateWithPromises({ "tm_user_id": tmUserId }, { "_id": userId });
                    }

                    if (fcmId != '' && fcmId != undefined) {
                        var fcmData = {};
                        fcmData['fcm_id'] = fcmId;
                        fcmData["device_id"] = deviceId;
                        fcmData["device_type"] = deviceType;
                        tables.fcmTable.update(fcmData, { "customer_id": userId }, async function (response) {
                            if (response == null) {
                                var save = {};
                                save['fcm'] = [];
                                save['fcm'].push(fcmData);
                                save['customer_id'] = userId;
                                tables.fcmTable.save(save, async function (response) {
                                    if (tmUserId != 0) {
                                        await utility.updateFcm({
                                            "fcm_token": fcmId,
                                            "user_id": tmUserId,
                                            "device_type": deviceType
                                        }, utility.user_role_customer)

                                    }
                                });
                            }
                        });
                    }

                    deviceType = parseInt(deviceType);
                    if (isNaN(deviceType)) {
                        deviceType = 1;
                    }

                    var accessToken = utility.generateAccessToken();
                    tables.customerTable.update({
                        "access_token": accessToken,
                        "device_type": deviceType,
                    }, { "_id": userId }, function (response) {
                    });
                    var countrydetails = await tables.countryTable.findrequiredfields({ "phone_code": mobile_country }, { call_center_number: 1 })

                    call_center_number = "";
                    if (countrydetails && countrydetails[0]) {
                        var call_center_number = countrydetails[0].call_center_number;
                    }
                    return res.send({

                        "success": true,
                        "user_id": userId,
                        "name": name || "ABC",
                        "email": email,
                        "created": created,
                        "updated": updated,
                        'access_token': accessToken,
                        "profile_pic": profilePic,
                        "tm_user_id": tmUserId,
                        "mobile": mobile,
                        "mobile_country": mobile_country,
                        "call_center_number": call_center_number


                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": utility.errorMessages["Invalid credentials"][languageCode]
                    });
                }
            }
        } else {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Mobile is not registered."][languageCode]
            });
        }
    });
});
router.post('/clear-salon-cart', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var is_package = req.body.is_package;
    var salonId = req.body.salon_id;


    var response = await tables.cartTable.updateManyWithPromises({ "status": 2 }, { "customer_id": userId });
    if (is_package != '' && is_package != undefined && salonId != '') {
        var filteredItems = await tables.salonFilteredItemsTable.findFieldsWithPromises({ "customer_id": userId });
        if (filteredItems != undefined && filteredItems.length != 0) {
            var services = filteredItems[0].services;
            var serviceResponse = await tables.salonServicesTable.getPricesForTheSalon(salonId, services);
            var totall = [];
            for (var s = 0; s < serviceResponse.length; s++) {
                var saveValues = {};
                var serviceId = serviceResponse[s].service_id;
                var categoryId = serviceResponse[s].category_id;
                var serviceFor = serviceResponse[s].service_for;
                var price = serviceResponse[s].service_cost;
                var duration = serviceResponse[s].service_time;
                var cityId = filteredItems[0].city_id;
                var timeType = filteredItems[0].time_type;
                var timeZone = filteredItems[0].timezone;
                var time = '';
                if (filteredItems[0].time == undefined || filteredItems[0].time == '') {

                    time = filteredItems[0].timebetween;
                } else {
                    time = filteredItems[0].time;
                }

                saveValues['time_type'] = timeType;
                duration = parseInt(duration);
                var date = filteredItems[0].date;
                saveValues["quantity"] = 1;
                saveValues["duration"] = duration;
                saveValues["customer_id"] = userId;
                saveValues["service_id"] = serviceId;
                saveValues["salon_id"] = salonId;
                saveValues['type'] = 1;
                saveValues['time'] = time;
                saveValues['date'] = date;
                saveValues['selected_time'] = time;
                saveValues['selected_date'] = date;
                saveValues['city_id'] = cityId;
                saveValues["selected_for"] = serviceFor;
                saveValues["category_id"] = categoryId;
                saveValues["price"] = price;
                saveValues["status"] = utility.CART_ITEM_ADDEED;
                saveValues["cart_type"] = 2;
                saveValues["filtered_service"] = 1;
                saveValues["timezone"] = timeZone;
                totall.push(saveValues);
            }
            var cartResponse = await tables.cartTable.insertManyWithPromises(totall);

        }

    }
    return res.send({ "success": true, "message": "success" })

});
router.post('/sender-details', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;

    tables.vendorTable.findFields({ "_id": user_id }, {
        "first_name": 1,
        "last_name": 1,
        "profile_pic": 1
    }, function (response) {
        var details = {
            // "name": response[0].first_name + '' + response[0].last_name,
            "name": response[0].name,

            "profile_pic": response[0].profile_pic
        };
        return res.send({ "success": true, "details": details })
    });
});

router.post('/forgot-password', tokenValidations, function (req, res) {
    var requestType = req.body.request_type;
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
                "message": "Please provide your email"
            });
        }

        /*  if (!utility.isValidEmail(email)) {
              return res.send({
                  "success": false,
                  "message": "Please provide valid email"
              });
          }*/
        email = email.toLowerCase();
        tables.customerTable.findFields({ email: email }, { "email": 1 }, function (response) {

            if (!response.length) {
                return res.send({
                    "success": false,
                    "message": "Email is not registered."
                });
            } else {
                var userId = response[0]._id;
                var otp = utility.generateOtp();
                otpTable.find({
                    data: email,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                    user_id: response[0]._id
                }, function (result) {
                    if (result != undefined && result.length != 0) {
                        otpTable.update({
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
                        otpTable.save({
                            user_id: response[0]._id,
                            otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                            type_id: response[0]._id,
                            data: email,
                            otp: otp,
                            is_verified: false
                        }, function (result) {
                            utility.curl.curl('send-otp-customer/' + response[0]._id + '/' + utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL);
                            return res.send({
                                "success": true,
                                "message": "OTP has been sent to " + email
                            });
                        });
                    }
                });
            }
        });

    } else if (requestType == utility.FORGOT_PASSWORD_REQUEST_TYPE_MOBILE) {
        var mobile = req.body.mobile;
        if (trim(mobile) === "") {
            return res.send({
                "success": false,
                "message": "Please provide your mobile number"
            });
        }

        tables.customerTable.findFields({ mobile: mobile }, { "mobile": 1, "mobile_country": 1 }, function (response) {
            if (!response.length) {
                return res.send({
                    "success": false,
                    "message": "Mobile number is not registered."
                });
            } else {
                var otp = utility.generateOtp();
                var mobileCountry = response[0].mobile_country;
                var message = 'your otp for reset password into mr&ms is ' + otp;
                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                otpTable.find({
                    data: mobile,
                    otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                    user_id: response[0]._id
                }, function (result) {
                    if (result != undefined && result.length != 0) {
                        otpTable.update({
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
                        otpTable.save({
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
    } else {
        return res.send({
            "success": false,
            "message": "Invalid request."
        });
    }
});
router.post('/change-password', tokenValidations, function (req, res) {
    var password = req.body.password;
    var payload = req.body.payload;

    if (password == '' || password == undefined) {
        return res.send({ "success": false, "message": "Please enter password" });
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
            email = email.toLowerCase();
            tables.otpTable.find({
                data: email,
                otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL,
                is_verified: true
            }, function (result) {


                if (result.length) {

                    generateHash(function (hash) {

                        password = encrypt(password, hash);
                        tables.customerTable.update({
                            password: password,
                            hash: hash,
                            updated: Date.now()
                        }, {
                            email: email
                        }, function (result) {

                            if (result != null && result.updated != undefined) {
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
            if (mobile === "") {
                return res.send({
                    "success": false,
                    "message": "Something went wrong. Please try again after sometime"
                });
            }

            tables.otpTable.find({
                data: mobile,
                otp_type: utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE,
                is_verified: true
            }, function (result) {
                if (result.length) {
                    generateHash(function (hash) {
                        password = encrypt(password, hash);
                        tables.customerTable.update({
                            password: password,
                            hash: hash,
                            updated: Date.now()
                        }, {
                            mobile: mobile
                        }, function (result) {
                            if (result != null && result.updated != undefined) {
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
router.post('/get-near-vendor-list', tokenValidations, function (req, res, next) {
    var latitudes = req.body.latitude;
    var longitude = req.body.longitude;
    var cityId = req.body.city_id;
    var languageCode = req.body.language_code;

    if (latitudes == '' || latitudes == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request."
        })
    }

    if (longitude == '' || longitude == undefined) {

        return res.send({
            "success": false,
            "message": "Invalid Request."
        });
    }

    if (cityId == '' || cityId == undefined) {
        return res.send({ "success": false, "message": "Invalid request" })
    }

    /*tables.vendorLocationTable.save({ "vendor_id" : "5aa660d6f3fdee9e56f1aaba",
     "location" : {
     "type" : "Point",
     "coordinates" : [-110.8571443,32.4586858]
     }});*/
    var checkForValidMongoDbID = new RegExp("^[0-9a-fA-F]{24}$");

    if (!checkForValidMongoDbID.test(cityId)) {
        return res.send({ "success": false, "message": "Invalid request" })

    }
    /* var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
     if(checkForHexRegExp.isValid(cityId))
     {
         res.send({"success": false, "message": "Invalid request"})
     }*/
    tables.vendorLocationTable.locationFind(latitudes, longitude, cityId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            res.send({ "success": true, "vendor": response });
        } else {
            res.send({ "success": true, "vendor": [] });
        }

    });
});
router.post('/get-user-address', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;
    if (user_id == '' || user_id == undefined) {
        return res.send({ "success": false, "message": "Invalid request" })
    }
    /*var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
     if(checkForHexRegExp.isValid(user_id)){
         res.send({"success": false, "message": "Invalid request"})
     }*/

    var checkForValidMongoDbID = new RegExp("^[0-9a-fA-F]{24}$");

    if (!checkForValidMongoDbID.test(user_id)) {
        return res.send({ "success": false, "message": "Invalid request" })

    }
    tables.addressTable.userAddress(user_id, function (response) {
        return res.send({ "success": true, "address": response });
    });

});
router.post('/save-user-address', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;
    if (user_id == '' || user_id == undefined) {
        res.send({ "success": false, "message": "Invalid request" })
    }

    var request_type = req.body.type;
    var floor = req.body.flat_no;
    var buliding = req.body.buliding;
    var landmark = req.body.landmark;
    var details = req.body.details;
    var label = req.body.label;
    var address = req.body.address;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var city = req.body.city;
    var country = req.body.country;
    var update = {};
    var languageCode = req.body.language_code;

    if (address == '' || address == undefined) {
        return res.send({ "success": false, "message": "Invalid Address" });
    }
    update['address'] = address;
    if (label != '' && label != undefined) {
        update['label'] = label
    }
    if (landmark != '' && landmark != undefined) {
        update['landmark'] = landmark
    }
    if (buliding != '' && buliding != undefined) {
        update['buliding'] = buliding;
    }
    if (floor != '' && floor != undefined) {
        update['flat_no'] = floor;
    }

    if (details != '' && details != undefined) {
        update['details'] = details
    }
    if (longitude != '' && longitude != undefined) {
        update['longitude'] = longitude
    }
    if (latitude != '' && latitude != undefined) {
        update['latitude'] = latitude
    }
    if (city != '' && city != undefined) {
        update['city'] = city
    }
    if (country != '' && country != undefined) {
        update['country'] = country
    }

    if (request_type == '' || request_type == undefined) {
        return res.send({ "success": false, "message": "Invalid Address" });
    }
    request_type = parseInt(request_type);

    if (request_type == utility.ADDRESS_TYPE_HOME) {
        update['type'] = request_type
    } else if (request_type == utility.ADDRESS_TYPE_OFFICE) {
        update['type'] = request_type
    } else if (request_type == utility.ADDRESS_TYPE_RECENT) {

    } else if (request_type == utility.ADDRESS_TYPE_SAVED) {
        update['type'] = request_type
    } else {
        return res.send({ "success": false, "message": "Invalid Address" })
    }
    if (request_type != utility.ADDRESS_TYPE_SAVED) {


        tables.addressTable.find({ "customer_id": user_id, "type": parseInt(request_type) }, function (checkUser) {

            if (checkUser != undefined) {

                if (checkUser.length != 0) {
                    if (request_type != utility.ADDRESS_TYPE_RECENT) {

                        tables.addressTable.update(update, {
                            "customer_id": user_id,
                            "type": parseInt(request_type)
                        }, function (response) {
                            if (response != undefined) {
                                return res.send({ "success": true, "message": "updated", "_id": response._id });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                });
                            }
                        });
                    } else {

                        tables.addressTable.updateAndSlice(update, {
                            "customer_id": user_id,
                            "type": parseInt(utility.ADDRESS_TYPE_RECENT)
                        }, function (response) {
                            if (response != undefined) {
                                return res.send({ "success": true, "message": "updated" });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                });
                            }
                        });
                    }
                } else {
                    if (request_type != utility.ADDRESS_TYPE_RECENT) {
                        update['customer_id'] = user_id;
                        tables.addressTable.save(update, function (response) {
                            if (response != undefined) {
                                return res.send({ "success": true, "message": "updated", "_id": response._id });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                });
                            }
                        });

                    } else {
                        var resentAddress = {};
                        resentAddress['recent_address'] = update,
                            resentAddress['customer_id'] = user_id,
                            resentAddress['type'] = request_type;
                        tables.addressTable.save(resentAddress, function (response) {
                            if (response != undefined) {
                                return res.send({ "success": true, "message": "updated" });
                            } else {
                                return res.send({
                                    "success": false,
                                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                                });
                            }
                        });
                    }
                }
            } else {
                if (request_type != utility.ADDRESS_TYPE_RECENT) {
                    update['customer_id'] = user_id;
                    tables.addressTable.save(update, function (response) {
                        if (response != undefined) {
                            return res.send({ "success": true, "message": "updated", "_id": response._id });
                        }
                    });

                } else {
                    var resentAddress = {};
                    resentAddress['recent_address'] = update,
                        resentAddress['customer_id'] = user_id,
                        resentAddress['type'] = request_type;
                    tables.addressTable.save(resentAddress, function (response) {
                        if (response != undefined) {
                            return res.send({ "success": true, "message": "updated" });
                        }
                    });
                }
            }
        });

    } else {
        update['customer_id'] = user_id;
        tables.addressTable.save(update, function (response) {
            if (response != undefined) {
                res.send({ "success": true, "message": "updated", "_id": response._id });
            }
        });
    }
});

router.post('/get-categories', tokenValidations, function (req, res) {
    var startTime = utility.getTime;
    var customerId = req.body.user_id;
    var cityId = req.body.city_id;
    var languageCode = req.body.language_code;
    var filter = req.body.filter;
    if (filter == '' || filter == undefined) {
        filter = {};
    } else {
        filter = JSON.parse(filter);
    }
    if (languageCode == undefined || languageCode == '') {
        languageCode = 'en';
    }
    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }

    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    tables.servicesTable.getCategory(customerId, cityId, filter, function (response) {


        var data = {};
        // return res.send(response)
        if (response != undefined && response.length != 0) {
            data['women'] = {};
            data['girl'] = {};

            data['men'] = {};
            data['boy'] = {};
            //data['others'] = {};

            var servicesData = response[0];
            if (servicesData["women"].length != 0) {

                var womenCategoryOrder = 1;
                for (var w = 0; w < servicesData["women"].length; w++) {
                    var women = servicesData['women'][w];
                    var categoryName = women['category'].category_name["en"];
                    var displayCategoryName = women['category'].category_name["en"];
                    var categoryId = women['category'].category_id;
                    var categoryIcon = women['category'].url;
                    var sort = women['category'].sort;
                    var categoryVideoUrl = '';
                    if (women['category'].video_url != undefined) {
                        categoryVideoUrl = women['category'].video_url[1];

                    }
                    var womenCategoryQuatity = 0;

                    // var categoryFor=response[i].cat.category_for;
                    if (women['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = women['category'].category_name[languageCode];
                    }
                    if (data['women']['cat'] == undefined) {
                        data['women']['cat'] = {};
                    }

                    if (data['women']['cat'][categoryName] == undefined) {
                        data['women']['cat'][categoryName] = {};
                    }

                    data['women']['cat'][categoryName]['id'] = categoryId;
                    data['women']['cat'][categoryName]['order'] = sort['1'];
                    data['women']['cat'][categoryName]['order'] = womenCategoryOrder;
                    womenCategoryOrder++;
                    data['women']['cat'][categoryName]['display_name'] = displayCategoryName;

                    data['women']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                    data['women']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var womenServiceOrder = 1;
                    for (var s = 0; s < women['services'].length; s++) {


                        var womenServices = women['services'][s];
                        var serviceName = womenServices.service_name["en"];
                        var displayServiceName = womenServices.service_name["en"];
                        var serviceId = womenServices.service_id;
                        var serviceUrl = womenServices.url;
                        var cartId = (womenServices.cartValue._id == undefined ? 0 : womenServices.cartValue._id);
                        var duration = (womenServices.cartValue.duration == undefined ? 0 : womenServices.cartValue.duration);
                        var selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        var serviceQuantity = (womenServices.cartValue.quantity == undefined ? 0 : womenServices.cartValue.quantity);
                        var servicePrice = womenServices.service_prices;
                        var serviceSort = womenServices.sort;
                        womenCategoryQuatity = parseInt(womenCategoryQuatity) + parseInt(serviceQuantity);


                        if (data['women']['cat'][categoryName]['ser'] == undefined) {
                            data['women']['cat'][categoryName]['ser'] = {};
                        }
                        if (womenServices.service_name[languageCode] != undefined) {
                            displayServiceName = womenServices.service_name[languageCode];
                        }
                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice['1'];
                        if (servicePrice['duration'] != undefined) {
                            services['duration'] = (servicePrice['duration']['1'] != undefined ? servicePrice['duration']['1'] : 0);

                        } else {
                            services['duration'] = 0;
                        }
                        services['selected_service_quatity'] = serviceQuantity;
                        services['selected_service_level'] = selectedServiceLevel;

                        services['order'] = womenServiceOrder;
                        womenServiceOrder++;
                        services['service_id'] = serviceId;
                        //  services['duration'] = duration;
                        services['cart_id'] = cartId;

                        data['women']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }
                    data['women']['cat'][categoryName]['count'] = womenCategoryQuatity;
                }
            }
            if (servicesData['girl'].length != 0) {

                var girlCategoryOrder = 1;
                for (var g = 0; g < servicesData["girl"].length; g++) {
                    var girl = servicesData['girl'][g];
                    var categoryName = girl['category'].category_name["en"];
                    var displayCategoryName = girl['category'].category_name["en"];
                    var categoryId = girl['category'].category_id;
                    var categoryIcon = girl['category'].url;
                    var categoryVideoUrl = '';
                    var sort = girl['category'].sort;
                    if (girl['category'].video_url != undefined) {
                        categoryVideoUrl = girl['category'].video_url[2];
                    }
                    var girlCategoryQuatity = 0;

                    // var categoryFor=response[i].cat.category_for;
                    if (girl['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = girl['category'].category_name[languageCode];
                    }
                    if (data['girl']['cat'] == undefined) {
                        data['girl']['cat'] = {};
                    }

                    if (data['girl']['cat'][categoryName] == undefined) {
                        data['girl']['cat'][categoryName] = {};
                    }
                    data['girl']['cat'][categoryName]['id'] = categoryId;
                    data['girl']['cat'][categoryName]['display_name'] = displayCategoryName;
                    //data['girl']['cat'][categoryName]['order'] = sort['2'];
                    data['girl']['cat'][categoryName]['order'] = girlCategoryOrder;
                    girlCategoryOrder++;

                    data['girl']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                    data['girl']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var girlServiceOrder = 1;
                    for (var s = 0; s < girl['services'].length; s++) {
                        var girlServices = girl['services'][s];
                        var serviceName = girlServices.service_name["en"];
                        var displayServiceName = girlServices.service_name["en"];
                        var serviceId = girlServices.service_id;
                        var serviceUrl = girlServices.url;
                        var cartId = (girlServices.cartValue._id == undefined ? 0 : girlServices.cartValue._id);
                        var duration = (girlServices.cartValue.duration == undefined ? 0 : girlServices.cartValue.duration);
                        var selectedServiceLevel = (girlServices.cartValue.selected_service_level == undefined ? 0 : girlServices.cartValue.selected_service_level);
                        var serviceQuantity = (girlServices.cartValue.quantity == undefined ? 0 : girlServices.cartValue.quantity);
                        var servicePrice = girlServices.service_prices;
                        var serviceSort = girlServices.sort;

                        if (data['girl']['cat'][categoryName]['ser'] == undefined) {
                            data['girl']['cat'][categoryName]['ser'] = {};
                        }
                        if (girlServices.service_name[languageCode] != undefined) {
                            displayServiceName = girlServices.service_name[languageCode];
                        }
                        girlCategoryQuatity = parseInt(girlCategoryQuatity) + parseInt(serviceQuantity);
                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice['2'];
                        services['service_id'] = girlServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;
                        if (servicePrice['duration'] != undefined) {
                            services['duration'] = (servicePrice['duration']['2'] != undefined ? servicePrice['duration']['2'] : 0);
                        } else {
                            services['duration'] = 0;
                        }
                        services['selected_service_level'] = selectedServiceLevel;
                        services['service_id'] = serviceId;
                        //   services['duration'] = duration;
                        services['cart_id'] = cartId;
                        services['order'] = girlServiceOrder;
                        girlServiceOrder++;
                        data['girl']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }

                    data['girl']['cat'][categoryName]['count'] = girlCategoryQuatity;

                }
            }
            if (servicesData['men'].length != 0) {

                var menCategoryOrder = 1;
                for (var m = 0; m < servicesData["men"].length; m++) {
                    var men = servicesData['men'][m];
                    var categoryName = men['category'].category_name["en"];
                    var displayCategoryName = men['category'].category_name["en"];
                    var categoryId = men['category'].category_id;
                    var categoryIcon = men['category'].url;
                    var categoryVideoUrl = '';
                    var sort = men['category'].sort;
                    if (men['category'].video_url != undefined) {
                        categoryVideoUrl = men['category'].video_url[3];
                    }
                    // var url=men['category'].url;
                    var menCategoryQuatity = 0;

                    // var categoryFor=response[i].cat.category_for;
                    if (men['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = men['category'].category_name[languageCode];
                    }
                    if (data['men']['cat'] == undefined) {
                        data['men']['cat'] = {};
                    }

                    if (data['men']['cat'][categoryName] == undefined) {
                        data['men']['cat'][categoryName] = {};
                    }
                    data['men']['cat'][categoryName]['id'] = categoryId;
                    data['men']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['men']['cat'][categoryName]['order'] = menCategoryOrder;
                    menCategoryOrder++;
                    data['men']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                    data['men']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var menServiceOrder = 1;
                    for (var s = 0; s < men['services'].length; s++) {
                        var menServices = men['services'][s];
                        var serviceName = menServices.service_name["en"];
                        var displayServiceName = menServices.service_name["en"];
                        var serviceId = menServices.service_id;
                        var serviceUrl = menServices.url;
                        var cartId = (menServices.cartValue._id == undefined ? 0 : menServices.cartValue._id);
                        var duration = (menServices.cartValue.duration == undefined ? 0 : menServices.cartValue.duration);
                        var selectedServiceLevel = (menServices.cartValue.selected_service_level == undefined ? 0 : menServices.cartValue.selected_service_level);
                        var serviceQuantity = (menServices.cartValue.quantity == undefined ? 0 : menServices.cartValue.quantity);
                        var servicePrice = menServices.service_prices;
                        var serviceSort = menServices.sort;
                        menCategoryQuatity = parseInt(menCategoryQuatity) + parseInt(serviceQuantity);

                        if (data['men']['cat'][categoryName]['ser'] == undefined) {
                            data['men']['cat'][categoryName]['ser'] = {};
                        }
                        if (menServices.service_name[languageCode] != undefined) {
                            displayServiceName = menServices.service_name[languageCode];
                        }
                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice['3'];
                        services['service_id'] = menServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;
                        if (servicePrice['duration'] != undefined) {
                            services['duration'] = (servicePrice['duration']['3'] != undefined ? servicePrice['duration']['3'] : 0);
                        } else {
                            services['duration'] = 0;
                        }
                        services['selected_service_level'] = selectedServiceLevel;
                        services['service_id'] = serviceId;
                        services['cart_id'] = cartId;
                        services['order'] = menServiceOrder;
                        menServiceOrder++;
                        data['men']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }
                    data['men']['cat'][categoryName]['count'] = menCategoryQuatity;


                }
            }
            if (servicesData['boy'].length != 0) {

                var boyCategoryOrder = 1;
                for (var b = 0; b < servicesData["boy"].length; b++) {
                    var boy = servicesData['boy'][b];
                    var categoryName = boy['category'].category_name["en"];
                    var displayCategoryName = boy['category'].category_name["en"];
                    var categoryId = boy['category'].category_id;
                    var categoryIcon = boy['category'].url;
                    var sort = boy['category'].sort;
                    var categoryVideoUrl = '';
                    if (boy['category'].video_url != undefined) {
                        categoryVideoUrl = boy['category'].video_url[4];
                    }
                    var boyCategoryQuatity = 0;

                    // var categoryFor=response[i].cat.category_for;
                    if (boy['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = boy['category'].category_name[languageCode];
                    }
                    if (data['boy']['cat'] == undefined) {
                        data['boy']['cat'] = {};
                    }

                    if (data['boy']['cat'][categoryName] == undefined) {
                        data['boy']['cat'][categoryName] = {};
                    }
                    data['boy']['cat'][categoryName]['id'] = categoryId;
                    data['boy']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['boy']['cat'][categoryName]['order'] = boyCategoryOrder;
                    boyCategoryOrder++;
                    data['boy']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                    data['boy']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var boyServiceOrder = 1;
                    for (var s = 0; s < boy['services'].length; s++) {
                        var boyServices = boy['services'][s];
                        var serviceName = boyServices.service_name["en"];
                        var displayServiceName = boyServices.service_name["en"];
                        var serviceId = boyServices.service_id;
                        var cartId = (boyServices.cartValue._id == undefined ? 0 : boyServices.cartValue._id);
                        var duration = (boyServices.cartValue.duration == undefined ? 0 : boyServices.cartValue.duration);
                        var selectedServiceLevel = (boyServices.cartValue.selected_service_level == undefined ? 0 : boyServices.cartValue.selected_service_level);
                        var serviceQuantity = (boyServices.cartValue.quantity == undefined ? 0 : boyServices.cartValue.quantity);
                        var servicePrice = boyServices.service_prices;
                        var serviceSort = boyServices.sort;
                        var serviceUrl = boyServices.url;

                        if (data['boy']['cat'][categoryName]['ser'] == undefined) {
                            data['boy']['cat'][categoryName]['ser'] = {};
                        }
                        if (boyServices.service_name[languageCode] != undefined) {
                            displayServiceName = boyServices.service_name[languageCode];
                        }
                        boyCategoryQuatity = parseInt(boyCategoryQuatity) + parseInt(serviceQuantity);

                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice['4'];
                        services['service_id'] = boyServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;

                        services['selected_service_level'] = selectedServiceLevel;
                        if (servicePrice['duration'] != undefined) {
                            services['duration'] = (servicePrice['duration']['4'] != undefined ? servicePrice['duration']['4'] : 0);
                        } else {
                            services['duration'] = 0;
                        }


                        services['service_id'] = serviceId;
                        // services['duration'] = duration;
                        services['cart_id'] = cartId;
                        services['order'] = boyServiceOrder;
                        boyServiceOrder++;
                        data['boy']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }

                    data['boy']['cat'][categoryName]['count'] = boyCategoryQuatity;

                }
            }

            var currency_type = '';
            var currency_code = '';
            if (servicesData['country'].length != 0) {
                currency_type = (servicesData['country'][0]['currency'] == undefined ? '' : servicesData['country'][0]['currency']);
                currency_code = (servicesData['country'][0]['currency_code'] == undefined ? '' : servicesData['country'][0]['currency']);

            }

            return res.send({
                "success": true,
                "category_data": data,
                "currency_type": currency_type,
                "currency_code": currency_code
            });
        } else {
            return res.send({ "success": false, "message": "Something went wrong try again" });
        }

    });
});
router.post('/get-salon-categories', tokenValidations, function (req, res) {

    var customerId = req.body.user_id;
    var cityId = req.body.city_id;
    var languageCode = req.body.language_code;
    if (languageCode == undefined || languageCode == '') {
        languageCode = 'en';
    }
    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    var filter = req.body.filter;

    if (filter == '' || filter == undefined) {
        filter = {};
    } else {

        filter = JSON.parse(filter);
    }
    tables.servicesTable.getSalonCategory(customerId, cityId, function (response) {
        var data = {};
        // return    res.send(response);
        if (response != 0) {

            data['women'] = {};
            data['girl'] = {};

            data['men'] = {};
            data['boy'] = {};
            var categoryName = '',
                displayCategoryName = '',
                categoryId = '',
                categoryIcon = '',
                categoryVideoUrl = '',
                serviceName = '',
                displayServiceName = '',
                serviceId = '',
                serviceUrl = '',
                cartId = '',
                duration = '',
                selectedServiceLevel = '',
                serviceQuantity = '',
                servicePrice = '',
                services = {},
                women, girl, men, boy, womenServices, girlServices, menServices, boyServices;
            //data['others'] = {};
            var servicesData = response[0];
            var womenCategoryOrder = 1;
            for (var w = 0; w < servicesData["women"].length; w++) {

                women = servicesData['women'][w];
                categoryName = women['category'].category_name["en"];
                displayCategoryName = women['category'].category_name["en"];
                categoryId = women['category'].category_id;
                categoryIcon = women['category'].url;
                categoryVideoUrl = '';
                if (women['category'].video_url != undefined) {
                    categoryVideoUrl = women['category'].video_url[1];
                }
                var womenCategoryQuatity = 0;
                // var categoryFor=response[i].cat.category_for;
                if (women['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = women['category'].category_name[languageCode];
                }
                if (data['women']['cat'] == undefined) {
                    data['women']['cat'] = {};
                }

                if (data['women']['cat'][categoryName] == undefined) {
                    data['women']['cat'][categoryName] = {};
                }
                data['women']['cat'][categoryName]['id'] = categoryId;
                data['women']['cat'][categoryName]['order'] = womenCategoryOrder;
                womenCategoryOrder++;
                data['women']['cat'][categoryName]['display_name'] = displayCategoryName;

                data['women']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                data['women']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                var womenServicesOrder = 1;
                for (var s = 0; s < women['services'].length; s++) {
                    womenServices = women['services'][s];
                    serviceName = womenServices.service_name["en"];
                    displayServiceName = womenServices.service_name["en"];
                    serviceId = womenServices.service_id;
                    serviceUrl = womenServices.url;
                    cartId = (womenServices.cartValue._id == undefined ? 0 : womenServices.cartValue._id);
                    duration = (womenServices.cartValue.duration == undefined ? 0 : womenServices.cartValue.duration);
                    selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                    serviceQuantity = (womenServices.cartValue.quantity == undefined ? 0 : womenServices.cartValue.quantity);
                    servicePrice = womenServices.service_prices;
                    womenCategoryQuatity = parseInt(womenCategoryQuatity) + parseInt(serviceQuantity);


                    if (data['women']['cat'][categoryName]['ser'] == undefined) {
                        data['women']['cat'][categoryName]['ser'] = {};
                    }
                    if (womenServices.service_name[languageCode] != undefined) {
                        displayServiceName = womenServices.service_name[languageCode];
                    }
                    services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    // services['level'] = servicePrice['1'];
                    //  services['selected_service_quatity'] = serviceQuantity;

                    // services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['order'] = womenServicesOrder;
                    womenServicesOrder++;
                    //   services['duration'] = duration;
                    // services['cart_id'] = cartId;

                    data['women']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                // data['women']['cat'][categoryName]['count'] = womenCategoryQuatity;


            }
            var girlCategoryOrder = 1;
            for (var g = 0; g < servicesData["girl"].length; g++) {
                girl = servicesData['girl'][g];
                categoryName = girl['category'].category_name["en"];
                displayCategoryName = girl['category'].category_name["en"];
                categoryId = girl['category'].category_id;
                categoryIcon = girl['category'].url;
                categoryVideoUrl = '';
                if (girl['category'].video_url != undefined) {
                    categoryVideoUrl = girl['category'].video_url[2];
                }
                var girlCategoryQuatity = 0;

                // var categoryFor=response[i].cat.category_for;
                if (girl['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = girl['category'].category_name[languageCode];
                }
                if (data['girl']['cat'] == undefined) {
                    data['girl']['cat'] = {};
                }

                if (data['girl']['cat'][categoryName] == undefined) {
                    data['girl']['cat'][categoryName] = {};
                }
                data['girl']['cat'][categoryName]['id'] = categoryId;
                data['girl']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['girl']['cat'][categoryName]['order'] = girlCategoryOrder;
                girlCategoryOrder++;
                data['girl']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                data['girl']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                var girlSerivceOrder = 1;
                for (var s = 0; s < girl['services'].length; s++) {
                    girlServices = girl['services'][s];
                    serviceName = girlServices.service_name["en"];
                    displayServiceName = girlServices.service_name["en"];
                    serviceId = girlServices.service_id;
                    serviceUrl = girlServices.url;
                    cartId = (girlServices.cartValue._id == undefined ? 0 : girlServices.cartValue._id);
                    duration = (girlServices.cartValue.duration == undefined ? 0 : girlServices.cartValue.duration);
                    selectedServiceLevel = (girlServices.cartValue.selected_service_level == undefined ? 0 : girlServices.cartValue.selected_service_level);
                    serviceQuantity = (girlServices.cartValue.quantity == undefined ? 0 : girlServices.cartValue.quantity);
                    servicePrice = girlServices.service_prices;

                    if (data['girl']['cat'][categoryName]['ser'] == undefined) {
                        data['girl']['cat'][categoryName]['ser'] = {};
                    }
                    if (girlServices.service_name[languageCode] != undefined) {
                        displayServiceName = girlServices.service_name[languageCode];
                    }
                    girlCategoryQuatity = parseInt(girlCategoryQuatity) + parseInt(serviceQuantity);
                    services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = (serviceUrl === undefined ? '' : serviceUrl);
                    // services['level'] = servicePrice['2'];
                    services['service_id'] = girlServices.service_id;
                    //  services['selected_service_quatity'] = serviceQuantity;

                    //   services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['duration'] = duration;
                    services['cart_id'] = cartId;
                    services['order'] = girlSerivceOrder;
                    girlSerivceOrder++;
                    data['girl']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }

                data['girl']['cat'][categoryName]['count'] = girlCategoryQuatity;

            }
            var menCategoryOrder = 1;
            for (var m = 0; m < servicesData["men"].length; m++) {
                men = servicesData['men'][m];
                categoryName = men['category'].category_name["en"];
                displayCategoryName = men['category'].category_name["en"];
                categoryId = men['category'].category_id;
                categoryIcon = men['category'].url;
                categoryVideoUrl = '';
                if (men['category'].video_url != undefined) {
                    categoryVideoUrl = men['category'].video_url[3];
                }
                // var url=men['category'].url;
                var menCategoryQuatity = 0;

                // var categoryFor=response[i].cat.category_for;
                if (men['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = men['category'].category_name[languageCode];
                }
                if (data['men']['cat'] == undefined) {
                    data['men']['cat'] = {};
                }
                if (data['men']['cat'][categoryName] == undefined) {
                    data['men']['cat'][categoryName] = {};
                }
                data['men']['cat'][categoryName]['id'] = categoryId;
                data['men']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['men']['cat'][categoryName]['order'] = menCategoryOrder;
                menCategoryOrder++;
                data['men']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                data['men']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                var menSerivceOrder = 1;
                for (var s = 0; s < men['services'].length; s++) {
                    menServices = men['services'][s];
                    serviceName = menServices.service_name["en"];
                    displayServiceName = menServices.service_name["en"];
                    serviceId = menServices.service_id;
                    serviceUrl = menServices.url;
                    cartId = (menServices.cartValue._id == undefined ? 0 : menServices.cartValue._id);
                    duration = (menServices.cartValue.duration == undefined ? 0 : menServices.cartValue.duration);
                    selectedServiceLevel = (menServices.cartValue.selected_service_level == undefined ? 0 : menServices.cartValue.selected_service_level);
                    serviceQuantity = (menServices.cartValue.quantity == undefined ? 0 : menServices.cartValue.quantity);
                    servicePrice = menServices.service_prices;

                    menCategoryQuatity = parseInt(menCategoryQuatity) + parseInt(serviceQuantity);
                    if (data['men']['cat'][categoryName]['ser'] == undefined) {
                        data['men']['cat'][categoryName]['ser'] = {};
                    }

                    if (menServices.service_name[languageCode] != undefined) {
                        displayServiceName = menServices.service_name[languageCode];
                    }

                    services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    //    services['level'] = servicePrice['3'];
                    services['service_id'] = menServices.service_id;
                    //   services['selected_service_quatity'] = serviceQuantity;

                    //   services['selected_service_level'] = selectedServiceLevel;

                    services['service_id'] = serviceId;
                    services['order'] = menSerivceOrder;
                    menSerivceOrder++;
                    services['duration'] = duration;
                    services['cart_id'] = cartId;
                    data['men']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['men']['cat'][categoryName]['count'] = menCategoryQuatity;
            }
            var boyCategoryOrder = 1;
            for (var b = 0; b < servicesData["boy"].length; b++) {
                boy = servicesData['boy'][b];
                categoryName = boy['category'].category_name["en"];
                displayCategoryName = boy['category'].category_name["en"];
                categoryId = boy['category'].category_id;
                categoryIcon = boy['category'].url;
                categoryVideoUrl = '';
                if (boy['category'].video_url != undefined) {
                    categoryVideoUrl = boy['category'].video_url[4]
                }

                var boyCategoryQuatity = 0;

                // var categoryFor=response[i].cat.category_for;
                if (boy['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = boy['category'].category_name[languageCode];
                }
                if (data['boy']['cat'] == undefined) {
                    data['boy']['cat'] = {};
                }

                if (data['boy']['cat'][categoryName] == undefined) {
                    data['boy']['cat'][categoryName] = {};
                }
                data['boy']['cat'][categoryName]['id'] = categoryId;
                data['boy']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['boy']['cat'][categoryName]['order'] = boyCategoryOrder;
                boyCategoryOrder++;
                data['boy']['cat'][categoryName]['url'] = ((categoryIcon == undefined) ? '' : categoryIcon);
                data['boy']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                var boyServiceOrder = 1;
                for (var s = 0; s < boy['services'].length; s++) {
                    boyServices = boy['services'][s];
                    serviceName = boyServices.service_name["en"];
                    displayServiceName = boyServices.service_name["en"];
                    serviceId = boyServices.service_id;
                    cartId = (boyServices.cartValue._id == undefined ? 0 : boyServices.cartValue._id);
                    duration = (boyServices.cartValue.duration == undefined ? 0 : boyServices.cartValue.duration);
                    selectedServiceLevel = (boyServices.cartValue.selected_service_level == undefined ? 0 : boyServices.cartValue.selected_service_level);
                    serviceQuantity = (boyServices.cartValue.quantity == undefined ? 0 : boyServices.cartValue.quantity);
                    servicePrice = boyServices.service_prices;

                    serviceUrl = boyServices.url;

                    if (data['boy']['cat'][categoryName]['ser'] == undefined) {
                        data['boy']['cat'][categoryName]['ser'] = {};
                    }


                    if (boyServices.service_name[languageCode] != undefined) {
                        displayServiceName = boyServices.service_name[languageCode];
                    }
                    boyCategoryQuatity = parseInt(boyCategoryQuatity) + parseInt(serviceQuantity);

                    services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    //  services['level'] = servicePrice['4'];
                    services['service_id'] = boyServices.service_id;
                    //   services['selected_service_quatity'] = serviceQuantity;

                    // services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['duration'] = duration;
                    services['order'] = boyServiceOrder;
                    boyServiceOrder++;
                    services['cart_id'] = cartId;
                    data['boy']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['boy']['cat'][categoryName]['count'] = boyCategoryQuatity;

            }
            var currency_type = '';
            var currency_code = '';

            if (servicesData['country'].length != 0) {
                currency_type = (servicesData['country'][0]['currency'] == undefined ? '' : servicesData['country'][0]['currency']);
                currency_code = (servicesData['country'][0]['currency_code'] == undefined ? '' : servicesData['country'][0]['currency']);
            }
            return res.send({
                "success": true,
                "category_data": data,
                "currency_type": currency_type,
                "currency_code": currency_code
            });
            // return false;
            /* for(var i=0;i<response.length;i++)
             {
             var category={};
             category={};
             var categoryName=response[i].cat.category_name["en"];
             var displayCategoryName=response[i].cat.category_name["en"];
             var categoryId=response[i].cat.category_id;
             var url=response[i].cat.url;
             var categoryFor=response[i].cat.category_for;
             if(response[i].cat.category_name[languageCode]!=undefined)
             {
             displayCategoryName=response[i].cat.category_name[languageCode];
             }
             category={};
             var subCategory={};
             for(var s=0;s<response[i].sub_category.length;s++)
             {
             var  subCategoryName=response[i].sub_category[s].sub_category_name['en'];
             var  SubCategoryUrl=response[i].sub_category[s].url;
             var  cart=response[i].sub_category[s].cart;
             var subCategoryId=response[i].sub_category[s].sub_category_id;

             var displaySubCategoryName=response[i].sub_category[s].sub_category_name['en'];
             if(response[i].sub_category[s].sub_category_name[languageCode]!=undefined)
             {
             displaySubCategoryName=response[i].sub_category[s].sub_category_name[languageCode];
             }
             subCategory={};
             subCategory['id']=subCategoryId;
             subCategory['display_name']=displaySubCategoryName;
             subCategory['url']=((SubCategoryUrl==undefined)?'':SubCategoryUrl);
             subCategory['cart']='';
             subCategory['carts']=cart;

             if(categoryFor.indexOf(1)!=-1)
             {
             if(data['women']['cat']==undefined)
             {
             data['women']['cat']={};

             }
             data['women']['id']=1;
             if( data['women']['cat'][categoryName]==undefined)
             {
             data['women']['cat'][categoryName]={};
             }
             if( data['women']['cat'][categoryName]['sub']==undefined)
             {
             data['women']['cat'][categoryName]['sub']={};
             }
             data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
             data['women']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.women;
             data['women']['cat'][categoryName]['display_name']=displayCategoryName;
             data['women']['cat'][categoryName]['id']=categoryId;
             data['women']['cat'][categoryName]['url']=((url==undefined)?'':url);

             }
             if(categoryFor.indexOf(2)!=-1)
             {
             data['girl']['id']=2;
             if(data['girl']['cat']==undefined)
             {
             data['girl']['cat']={};

             }
             if( data['girl']['cat'][categoryName]==undefined)
             {
             data['girl']['cat'][categoryName]={};
             }
             if( data['girl']['cat'][categoryName]['sub']==undefined)
             {
             data['girl']['cat'][categoryName]['sub']={};
             }

             data['girl']['cat'][categoryName]['sub'][subCategoryName]=subCategory;

             data['girl']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.girl;

             data['girl']['cat'][categoryName]['display_name']=displayCategoryName;
             data['girl']['cat'][categoryName]['id']=categoryId;
             data['girl']['cat'][categoryName]['url']=((url==undefined)?'':url);
             }
             if(categoryFor.indexOf(3)!=-1)
             {
             if(data['men']['cat']==undefined)
             {
             data['men']['cat']={};

             }
             data['men']['id']=3;
             if( data['men']['cat'][categoryName]==undefined)
             {
             data['men']['cat'][categoryName]={};
             }
             if( data['men']['cat'][categoryName]['sub']==undefined)
             {
             data['men']['cat'][categoryName]['sub']={};
             }
             data['men']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
             data['men']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.men;

             data['men']['cat'][categoryName]['display_name']=displayCategoryName;
             data['men']['cat'][categoryName]['id']=categoryId;
             data['men']['cat'][categoryName]['url']=((url==undefined)?'':url);

             }
             if(categoryFor.indexOf(4)!=-1)
             {
             data['boy']['id']=4;
             if(data['boy']['cat']==undefined)
             {
             data['boy']['cat']={};

             }
             if( data['boy']['cat'][categoryName]==undefined)
             {
             data['boy']['cat'][categoryName]={};
             }
             data['boy']['cat'][categoryName]={};
             if( data['boy']['cat'][categoryName]['sub']==undefined)
             {
             data['boy']['cat'][categoryName]['sub']={};
             }
             data['boy']['cat'][categoryName]['sub'][subCategoryName]=subCategory;

             data['boy']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.boy;

             data['boy']['cat'][categoryName]['display_name']=displayCategoryName;
             data['boy']['cat'][categoryName]['id']=categoryId;
             data['boy']['cat'][categoryName]['url']=((url==undefined)?'':url);

             }
             }





             }*/
        }

    });
});
router.post('/get-salon-list', tokenValidations, async function (req, res) {

    var user_id = req.body.user_id;
    var cityId = req.body.city_id;
    var languageCode = req.body.language_code;
    var type = req.body.type;
    var date = req.body.date;
    var timezone = req.body.timezone;
    var services = req.body.service;
    if (services == undefined || services == '') {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 1
        })
    }
    services = JSON.parse(services);
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (user_id == '' || user_id == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 2
        })
    }
    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 3
        })
    }
    if (date == '' || date == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 4
        })
    }
    var save = {};
    var cityId = req.body.city_id;
    var timebetween = '';
    var time = '';
    var timeType = 1;
    var moment = require('moment');
    if (!moment(date, "YYYY-MM-DD").isValid()) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 5
        });
    }
    var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": cityId }, { "time_zone": 1 });
    if (cityDetails == undefined || cityDetails.length == 0) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 5
        });
    }

    timezone = cityDetails[0].time_zone;
    if (type == 1) {
        timebetween = req.body.timebetween;

        timebetween = timebetween.split('-');
        var startTime = timebetween[0].trim();
        var endTime = timebetween[1].trim();

        if (!moment(startTime, "HH:mm").isValid()) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 2
            });
        }
        if (!moment(endTime, "HH:mm").isValid()) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 2
            });
        }

        timebetween = startTime + '-' + endTime;
        timeType = 2;
    } else if (type == 2) {
        time = req.body.time;

        if (!moment(time, "HH:mm").isValid()) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 2
            });
        }

        timeType = 1;
    }

    //   {"distance":[0,10],"rating":[0,1],"price":[0,10],"salon_type":[],facilities:[],"languages":[],sort:1}
    //facilities: wifiAvailable=1 parkingAvailable=2 kidsFriendly=3   handicap=4   pets=5

    var filter = {};
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    save['latitude'] = latitude;
    save['longitude'] = longitude;
    save['services'] = services;
    save['date'] = date;
    save['time'] = time;
    save['timebetween'] = timebetween;
    save['customer_id'] = user_id;
    save['timezone'] = timezone;
    save['time_type'] = timeType;
    save['city_id'] = cityId;
    /* tables.salonFilteredItemsTable.deleteFilteredItems({"customer_id":user_id},function(response){
     });*/
    tables.salonFilteredItemsTable.deleteFilteredItems({ "customer_id": user_id }, function (response) {
    });
    var salonCondition = await tables.cartTable.updateCartWithPromises({ "status": 2 }, {
        "customer_id": user_id,
        "status": 1,
        "cart_type": 2
    });
    tables.vendorLocationTable.getSalonLocationsWithFilter(services, time, timebetween, date, latitude, longitude, filter, languageCode, async function (response) {
        if (response != undefined && response.length != 0) {
            var salonId = '';
            var salonViews = 0;
            for (var s = 0; s < response.length; s++) {
                salonId = response[s].salon_id;

                if (req.app.io.sockets.available_rooms['views_' + salonId] == undefined) {
                    req.app.io.sockets.available_rooms['views_' + salonId] = [];
                }
                salonViews = req.app.io.sockets.available_rooms['views_' + salonId].length;
                response[s].view = salonViews;
            }
            tables.salonFilteredItemsTable.save(save, function (response) {
            });
            var currency = await tables.citiesTable.getCurrency(cityId);
            var currencyValues = { "currency_code": "INR", "currency": "₹" };
            if (currency != undefined || currency.length != 0) {
                currencyValues['currency_code'] = currency[0].currency_code;
                currencyValues['currency'] = currency[0].currency_symbol;
            }
            return res.send({ "success": true, "salons": response, "currency": currencyValues });
        } else {
            /* tables.salonFilteredItemsTable.deleteFilteredItems({"customer_id":user_id},function(response){

             });*/
            return res.send({ "success": true, "salons": [] })
        }
    });
});

function sortView(a, b) {
    if (a.view < b.view) {
        return 1
    }
    if (a.view > b.view) {
        return -1;
    }
}
router.post('/salon-list-filter', tokenValidations, async function (req, res) {
    var user_id = req.body.user_id;
    var languageCode = req.body.language_code;
    // var services = JSON.parse(req.body.service);
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (user_id == '' || user_id == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    /*  if (cityId == '' || cityId == undefined)
      {
          return res.send({
              "success": false,
              "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
          })
      }*/
    var save = {};
    var filter = req.body.filter;
    if (filter == undefined || filter == '') {
        filter = {};
    } else {
        filter = JSON.parse(filter);
    }
    var salonFilteredItems = await tables.salonFilteredItemsTable.findFieldsWithPromises({ "customer_id": user_id },
        {
            "services": 1,
            "latitude": 1,
            "longitude": 1,
            "date": 1,
            "time": 1,
            "timebetween": 1,
            "timezone": 1,
            "time_type": 1,
            "city_id": 1,
            "type": 1
        });

    if (salonFilteredItems == undefined || salonFilteredItems.length == 0) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    var services = salonFilteredItems[0].services;

    var type = salonFilteredItems[0].time_type;
    var date = salonFilteredItems[0].date;
    var timezone = salonFilteredItems[0].timezone;
    var cityId = salonFilteredItems[0].city_id;
    var timebetween = '';
    var time = '';
    var timeType = 1;
    if (type == 2) {
        timebetween = salonFilteredItems[0].timebetween;
    } else if (type == 1) {
        time = salonFilteredItems[0].time;
        timeType = 1;
    }
    var latitude = salonFilteredItems[0].latitude;
    var longitude = salonFilteredItems[0].longitude;
    /* tables.salonFilteredItemsTable.deleteFilteredItems({"customer_id":user_id},function(response){

     });*/
    var salonCondition = await tables.cartTable.updateCartWithPromises({ "status": 2 }, {
        "customer_id": user_id,
        "status": 1,
        "cart_type": 2
    });
    //filter={};
    tables.vendorLocationTable.getSalonLocationsWithFilter(services, time, timebetween, date, latitude, longitude, filter, languageCode, function (response) {
        if (response != undefined && response.length != 0) {

            var salonId = '';
            var salonViews = 0;
            for (var s = 0; s < response.length; s++) {

                salonId = response[s].salon_id;
                if (req.app.io.sockets.available_rooms['views_' + salonId] == undefined) {
                    req.app.io.sockets.available_rooms['views_' + salonId] = [];
                }
                salonViews = req.app.io.sockets.available_rooms['views_' + salonId].length;
                response[s].view = salonViews;
            }
            response = response.sort(sortView);
            return res.send({ "success": true, "salons": response, "services": services });
        } else {
            /* tables.salonFilteredItemsTable.deleteFilteredItems({"customer_id":user_id},function(response){

             });*/
            return res.send({ "success": true, "salons": [] })
        }
    });
});

router.post('/cart', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (user_id == '' || user_id == undefined) {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.cartTable.cartValues(user_id, languageCode, async function (response) {
        if (response != undefined && response.length != 0) {
            var address = response[0].address;
            var latitude = address.latitude;
            var longitude = address.longitude;
            var checkSurgePrice = await tables.surgePriceTable.checkSurgePriceWithPromises(latitude, longitude);
            var surgePrice = 1.0;
            if (checkSurgePrice != undefined && checkSurgePrice.length != 0) {
                surgePrice = checkSurgePrice[0].surge;
            }
            if (response[0].payment_type == utility.PAYMENT_TYPE_CARD) {

                var customerDetails = await tables.customerTable.getPaymentDefaultCard(user_id);
                if (customerDetails.length) {
                    if (customerDetails[0]['payment']['status'] == 0) {
                        var cartUpdate = await tables.cartTable.updateManyWithPromises({ "payment_type": 1 }, { "customer_id": user_id, "status": 1 });
                        response[0]['payment_type'] = 1;

                    } else {
                        response[0]['card_details'] = customerDetails[0]['payment'];
                    }
                }
            }

            return res.send({ "success": true, "cart": response[0], "surge": surgePrice });
        } else {
            return res.send({ "success": true, "cart": {} })
        }
    });
});
router.post('/access-token', tokenValidations, function (req, res) {

});

router.post('/vendor-details', tokenValidations, function (req, res) {
    var user_id = req.body.user_id;
    var type = req.body.type;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (user_id == '' || user_id == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        })
    }
    var vendor_id = req.body.vendor_id;
    if (vendor_id == '' || vendor_id == undefined) {
        return res.send
            ({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            }
            )
    }

    if (type == 2) {
        tables.salonTable.getSalonDetails(vendor_id, function (response) {
            if (response != undefined && response.length != 0) {
                return res.send({ "success": true, "vendor": response[0] });

            } else {
                return res.send({ "success": true, "vendor": {} });

            }
        });
    } else {
        tables.vendorTable.getVendorDetails(vendor_id, languageCode, function (response) {
            if (response != undefined && response.length != 0) {
                return res.send({ "success": true, "vendor": response[0] });
            } else {
                return res.send({ "success": false, "vendor": {}, "message": "something went wrong try again" });
            }
        });
    }

});
router.post('/vendor-service-details', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var type = req.body.type;
    var cityId = req.body.city_id;
    var filter = req.body.filter;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (vendorId == '' || vendorId == undefined) {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });

    }
    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });

    }
    if (filter == undefined || filter == '') {
        filter = {};
    } else {
        filter = JSON.parse(filter);
    }
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (type == 2) {
        tables.salonTable.getServiceDetails(customerId, vendorId, function (response) {
            var data = {};

            /* return  res.send(response);*/

            if (response != 0) {
                /*for(var i=0;i<response.length;i++)
                 {

                 var type=response[i]._id;
                 if(type==1)
                 {
                 data['women']={};
                 data['women']['id']=1;
                 }else if(type==2)
                 {
                 data['girl']={};
                 data['girl']['id']=2;

                 }else if(type==3)
                 {
                 data['men']={};
                 data['men']['id']=3;
                 }else if(type==4)
                 {
                 data['boy']={};
                 data['men']['id']=4;

                 }
                 var category={};
                 category={};
                 for(var c=0;c<response[i].category.length;c++)
                 {
                 var categoryName=response[i].category[c].cat.category_name["en"];
                 var displayCategoryName=response[i].category[c].cat.category_name["en"];
                 var categoryId=response[i].category[c].cat.category_id;
                 var url=response[i].category[c].cat.url;
                 if(response[i].category[c].cat.category_name[languageCode]!=undefined)
                 {
                 displayCategoryName=response[i].category[c].cat.category_name[languageCode];
                 }
                 category[categoryName]={};
                 category[categoryName]['sub']={};
                 var subCategory={};
                 for(var s=0;s<response[i].category[c].sub_category.length;s++)
                 {
                 var  subCategoryName=response[i].category[c].sub_category[s].sub_category_name['en'];
                 var  SubCategoryUrl=response[i].category[c].sub_category[s].url;
                 var  cart=response[i].category[c].sub_category[s].cart;
                 var subCategoryId=response[i].category[c].sub_category[s].sub_category_id;

                 var displaySubCategoryName=response[i].category[c].sub_category[s].sub_category_name['en'];
                 if(response[i].category[c].sub_category[s].sub_category_name[languageCode]!=undefined)
                 {
                 displaySubCategoryName=response[i].category[c].sub_category[s].sub_category_name[languageCode];
                 }
                 subCategory[subCategoryName]={};
                 subCategory[subCategoryName]['id']=subCategoryId;
                 subCategory[subCategoryName]['display_name']=displaySubCategoryName;
                 subCategory[subCategoryName]['url']=((SubCategoryUrl==undefined)?'':SubCategoryUrl);
                 subCategory[subCategoryName]['cart']=cart;
                 }
                 category[categoryName]['sub']=subCategory;
                 category[categoryName]['display_name']=displayCategoryName;
                 category[categoryName]['id']=categoryId;
                 category[categoryName]['url']=((url==undefined)?'':url);
                 }
                 if(type==1)
                 {

                 data['women']['cat']=category;

                 }else if(type==2)
                 {

                 data['girl']['cat']=category;


                 }else if(type==3)
                 {

                 data['men']['cat']=category;

                 }else if(type==4)
                 {

                 data['boy']['cat']=category;


                 }






                 }*/
                data['women'] = {};
                data['men'] = {};
                data['girl'] = {};
                data['boy'] = {};

                for (var i = 0; i < response.length; i++) {
                    var category = {};
                    category = {};
                    var categoryName = response[i].cat.category_name["en"];
                    var displayCategoryName = response[i].cat.category_name["en"];
                    var categoryId = response[i].cat.category_id;
                    var url = response[i].cat.url;
                    var categoryFor = response[i].cat.category_for;
                    if (response[i].cat.category_name[languageCode] != undefined) {
                        displayCategoryName = response[i].cat.category_name[languageCode];
                    }
                    category = {};
                    var subCategory = {};
                    for (var s = 0; s < response[i].sub_category.length; s++) {
                        var subCategoryName = response[i].sub_category[s].sub_category_name['en'];
                        var SubCategoryUrl = response[i].sub_category[s].url;
                        var cart = response[i].sub_category[s].cart;
                        var subCategoryId = response[i].sub_category[s].sub_category_id;

                        var displaySubCategoryName = response[i].sub_category[s].sub_category_name['en'];
                        if (response[i].sub_category[s].sub_category_name[languageCode] != undefined) {
                            displaySubCategoryName = response[i].sub_category[s].sub_category_name[languageCode];
                        }
                        subCategory = {};
                        subCategory['id'] = subCategoryId;
                        subCategory['display_name'] = displaySubCategoryName;
                        subCategory['url'] = ((SubCategoryUrl == undefined) ? '' : SubCategoryUrl);
                        subCategory['cart'] = '';
                        subCategory['carts'] = cart;

                        if (categoryFor.indexOf(1) != -1) {
                            if (data['women']['cat'] == undefined) {
                                data['women']['cat'] = {};

                            }
                            data['women']['id'] = 1;
                            if (data['women']['cat'][categoryName] == undefined) {
                                data['women']['cat'][categoryName] = {};
                            }
                            if (data['women']['cat'][categoryName]['sub'] == undefined) {
                                data['women']['cat'][categoryName]['sub'] = {};
                            }
                            data['women']['cat'][categoryName]['sub'][subCategoryName] = subCategory;
                            data['women']['cat'][categoryName]['sub'][subCategoryName]['cart'] = cart.women;
                            data['women']['cat'][categoryName]['display_name'] = displayCategoryName;
                            data['women']['cat'][categoryName]['id'] = categoryId;
                            data['women']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);

                        }
                        if (categoryFor.indexOf(2) != -1) {
                            data['girl']['id'] = 2;
                            if (data['girl']['cat'] == undefined) {
                                data['girl']['cat'] = {};

                            }
                            if (data['girl']['cat'][categoryName] == undefined) {
                                data['girl']['cat'][categoryName] = {};
                            }
                            if (data['girl']['cat'][categoryName]['sub'] == undefined) {
                                data['girl']['cat'][categoryName]['sub'] = {};
                            }

                            data['girl']['cat'][categoryName]['sub'][subCategoryName] = subCategory;

                            data['girl']['cat'][categoryName]['sub'][subCategoryName]['cart'] = cart.girl;

                            data['girl']['cat'][categoryName]['display_name'] = displayCategoryName;
                            data['girl']['cat'][categoryName]['id'] = categoryId;
                            data['girl']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                        }
                        if (categoryFor.indexOf(3) != -1) {
                            if (data['men']['cat'] == undefined) {
                                data['men']['cat'] = {};
                            }
                            data['men']['id'] = 3;
                            if (data['men']['cat'][categoryName] == undefined) {
                                data['men']['cat'][categoryName] = {};
                            }
                            if (data['men']['cat'][categoryName]['sub'] == undefined) {
                                data['men']['cat'][categoryName]['sub'] = {};
                            }
                            data['men']['cat'][categoryName]['sub'][subCategoryName] = subCategory;
                            data['men']['cat'][categoryName]['sub'][subCategoryName]['cart'] = cart.men;

                            data['men']['cat'][categoryName]['display_name'] = displayCategoryName;
                            data['men']['cat'][categoryName]['id'] = categoryId;
                            data['men']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);

                        }
                        if (categoryFor.indexOf(4) != -1) {
                            data['boy']['id'] = 4;
                            if (data['boy']['cat'] == undefined) {
                                data['boy']['cat'] = {};
                            }
                            if (data['boy']['cat'][categoryName] == undefined) {
                                data['boy']['cat'][categoryName] = {};
                            }
                            data['boy']['cat'][categoryName] = {};
                            if (data['boy']['cat'][categoryName]['sub'] == undefined) {
                                data['boy']['cat'][categoryName]['sub'] = {};
                            }
                            data['boy']['cat'][categoryName]['sub'][subCategoryName] = subCategory;

                            data['boy']['cat'][categoryName]['sub'][subCategoryName]['cart'] = cart.boy;

                            data['boy']['cat'][categoryName]['display_name'] = displayCategoryName;
                            data['boy']['cat'][categoryName]['id'] = categoryId;
                            data['boy']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);

                        }
                    }
                }
            }
            if (data['women'] == undefined) {
                data['women'] = {};
            }
            if (data['men'] == undefined) {
                data['men'] = {};
            }
            if (data['girl'] == undefined) {
                data['girl'] = {};
            }
            if (data['boy'] == undefined) {
                data['boy'] = {};
            }

            var currency_type = '';
            var currency_code = '';

            if (response['country'].length != 0) {
                currency_type = (response['country'][0]['currency'] == undefined ? '' : response['country'][0]['currency']);
                currency_code = (response['country'][0]['currency_code'] == undefined ? '' : response['country'][0]['currency']);
            }
            return res.send({
                "success": true,
                "category_data": data,
                "currency_type": currency_type,
                "currency_code": currency_code
            });
        });
    } else {
        //  filter={};

        tables.vendorTable.getVendorServiceDetails(customerId, vendorId, cityId, filter, function (response) {
            var data = {};


            if (response.length != 0) {

                data['women'] = {};
                data['girl'] = {};

                data['men'] = {};
                data['boy'] = {};
                /* data['others'] = {};*/

                var servicesData = response[0];
                var womenCategoryOrder = 1;
                for (var w = 0; w < servicesData["women"].length; w++) {
                    var women = servicesData['women'][w];
                    var categoryName = women['category'].category_name["en"];
                    var displayCategoryName = women['category'].category_name["en"];
                    var categoryId = women['category'].category_id;
                    var url = women['category'].url;
                    var categoryVideoUrl = '';
                    if (women['category'].video_url != undefined) {
                        categoryVideoUrl = women['category'].video_url[1];
                    }
                    var womenCategoryQuatity = 0;
                    // var categoryFor=response[i].cat.category_for;
                    if (women['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = women['category'].category_name[languageCode];
                    }
                    if (data['women']['cat'] == undefined) {
                        data['women']['cat'] = {};
                    }

                    if (data['women']['cat'][categoryName] == undefined) {
                        data['women']['cat'][categoryName] = {};
                    }
                    data['women']['cat'][categoryName]['id'] = categoryId;
                    data['women']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['women']['cat'][categoryName]['order'] = womenCategoryOrder;
                    womenCategoryOrder++;
                    data['women']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                    data['women']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var womenServiceOrder = 1;
                    for (var s = 0; s < women['services'].length; s++) {

                        var womenServices = women['services'][s];
                        var serviceName = womenServices.service_name["en"];
                        var displayServiceName = womenServices.service_name["en"];
                        var serviceId = womenServices.service_id;
                        var serviceUrl = womenServices.url;
                        var cartId = (womenServices.cartValue._id == undefined ? 0 : womenServices.cartValue._id);
                        //   var duration = (womenServices.cartValue.duration == undefined ? 0 : womenServices.cartValue.duration);
                        var selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        var serviceQuantity = (womenServices.cartValue.quantity == undefined ? 0 : womenServices.cartValue.quantity);

                        var servicePrice = womenServices.service_prices;
                        var vendorServiceLevels = womenServices.levels;
                        var serviceDuration = womenServices.duration;


                        for (var keys in servicePrice) {
                            keys = parseInt(keys);
                            if (vendorServiceLevels.indexOf(keys) == -1) {
                                delete servicePrice[keys];
                            }
                        }


                        if (data['women']['cat'][categoryName]['ser'] == undefined) {
                            data['women']['cat'][categoryName]['ser'] = {};
                        }
                        if (womenServices.service_name[languageCode] != undefined) {
                            displayServiceName = womenServices.service_name[languageCode];
                        }
                        var services = {};
                        if (serviceDuration != undefined) {
                            services['duration'] = (serviceDuration['1'] != undefined ? serviceDuration['1'] : 0);

                        } else {
                            services['duration'] = 0;
                        }
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice;
                        if (vendorServiceLevels.indexOf(selectedServiceLevel) === -1) {
                            serviceQuantity = 0;
                            selectedServiceLevel = 0;
                        }
                        womenCategoryQuatity = parseInt(womenCategoryQuatity) + parseInt(serviceQuantity);
                        services['selected_service_quatity'] = serviceQuantity;

                        services['selected_service_level'] = selectedServiceLevel;
                        services['service_id'] = serviceId;
                        services['cart_id'] = cartId;
                        services['order'] = womenServiceOrder;
                        womenServiceOrder++;
                        data['women']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }
                    data['women']['cat'][categoryName]['count'] = womenCategoryQuatity;


                }
                var girlCategoryOrder = 1;
                for (var g = 0; g < servicesData["girl"].length; g++) {
                    var girl = servicesData['girl'][g];
                    var categoryName = girl['category'].category_name["en"];
                    var displayCategoryName = girl['category'].category_name["en"];
                    var categoryId = girl['category'].category_id;
                    var url = girl['category'].url;
                    var girlCategoryQuatity = 0;
                    var categoryVideoUrl = '';
                    if (girl['category'].video_url != undefined) {
                        categoryVideoUrl = girl['category'].video_url[2];
                    }
                    // var categoryFor=response[i].cat.category_for;
                    if (girl['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = girl['category'].category_name[languageCode];
                    }
                    if (data['girl']['cat'] == undefined) {
                        data['girl']['cat'] = {};
                    }

                    if (data['girl']['cat'][categoryName] == undefined) {
                        data['girl']['cat'][categoryName] = {};
                    }
                    data['girl']['cat'][categoryName]['id'] = categoryId;
                    data['girl']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['girl']['cat'][categoryName]['order'] = girlCategoryOrder;
                    girlCategoryOrder++;
                    data['girl']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                    data['girl']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    var girlServiceOrder = 1;
                    for (var s = 0; s < girl['services'].length; s++) {
                        var girlServices = girl['services'][s];
                        var serviceName = girlServices.service_name["en"];
                        var displayServiceName = girlServices.service_name["en"];
                        var serviceId = girlServices.service_id;
                        var serviceUrl = girlServices.url;
                        var cartId = (girlServices.cartValue._id == undefined ? 0 : girlServices.cartValue._id);
                        //  var duration = (girlServices.cartValue.duration == undefined ? 0 : girlServices.cartValue.duration);
                        var serviceDuration = girlServices.duration;

                        var selectedServiceLevel = (girlServices.cartValue.selected_service_level == undefined ? 0 : girlServices.cartValue.selected_service_level);
                        var serviceQuantity = (girlServices.cartValue.quantity == undefined ? 0 : girlServices.cartValue.quantity);
                        var servicePrice = girlServices.service_prices;
                        var vendorServiceLevels = girlServices.levels;
                        for (var keys in servicePrice) {
                            keys = parseInt(keys);
                            if (vendorServiceLevels.indexOf(keys) == -1) {


                                delete servicePrice[keys];
                            }
                        }
                        if (data['girl']['cat'][categoryName]['ser'] == undefined) {
                            data['girl']['cat'][categoryName]['ser'] = {};
                        }
                        if (girlServices.service_name[languageCode] != undefined) {
                            displayServiceName = girlServices.service_name[languageCode];
                        }

                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice;
                        services['service_id'] = girlServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;
                        if (serviceDuration != undefined) {
                            services['duration'] = (serviceDuration['2'] != undefined ? serviceDuration['2'] : 0);

                        } else {
                            services['duration'] = 0;
                        }

                        if (vendorServiceLevels.indexOf(selectedServiceLevel) === -1) {
                            serviceQuantity = 0;
                            selectedServiceLevel = 0;
                        }

                        girlCategoryQuatity = parseInt(girlCategoryQuatity) + parseInt(serviceQuantity);

                        services['selected_service_level'] = selectedServiceLevel;
                        services['order'] = girlServiceOrder;
                        girlServiceOrder++;
                        services['service_id'] = serviceId;
                        services['cart_id'] = cartId;
                        data['girl']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }

                    data['girl']['cat'][categoryName]['count'] = girlCategoryQuatity;

                }
                var menCategoryOrder = 1;
                for (var m = 0; m < servicesData["men"].length; m++) {
                    var men = servicesData['men'][m];
                    var categoryName = men['category'].category_name["en"];
                    var displayCategoryName = men['category'].category_name["en"];
                    var categoryId = men['category'].category_id;
                    var url = men['category'].url;
                    var menCategoryQuatity = 0;
                    var categoryVideoUrl = '';
                    if (men['category'].video_url != undefined) {
                        categoryVideoUrl = men['category'].video_url[3];
                    }
                    // var categoryFor=response[i].cat.category_for;
                    if (men['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = men['category'].category_name[languageCode];
                    }
                    if (data['men']['cat'] == undefined) {
                        data['men']['cat'] = {};
                    }

                    if (data['men']['cat'][categoryName] == undefined) {
                        data['men']['cat'][categoryName] = {};
                    }
                    data['men']['cat'][categoryName]['id'] = categoryId;
                    data['men']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['men']['cat'][categoryName]['order'] = menCategoryOrder;
                    menCategoryOrder++;
                    data['men']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                    data['men']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                    var menServiceOrder = 1;
                    for (var s = 0; s < men['services'].length; s++) {
                        var menServices = men['services'][s];
                        var serviceName = menServices.service_name["en"];
                        var displayServiceName = menServices.service_name["en"];
                        var serviceId = menServices.service_id;
                        var serviceUrl = menServices.url;
                        var cartId = (menServices.cartValue._id == undefined ? 0 : menServices.cartValue._id);
                        //  var duration = (girlServices.cartValue.duration == undefined ? 0 : menServices.cartValue.duration);
                        var serviceDuration = menServices.duration;

                        var selectedServiceLevel = (menServices.cartValue.selected_service_level == undefined ? 0 : menServices.cartValue.selected_service_level);
                        var serviceQuantity = (menServices.cartValue.quantity == undefined ? 0 : menServices.cartValue.quantity);
                        var servicePrice = menServices.service_prices;
                        var vendorServiceLevels = menServices.levels;
                        for (var keys in servicePrice) {
                            keys = parseInt(keys);
                            if (vendorServiceLevels.indexOf(keys) == -1) {


                                delete servicePrice[keys];
                            }
                        }

                        if (data['men']['cat'][categoryName]['ser'] == undefined) {
                            data['men']['cat'][categoryName]['ser'] = {};
                        }
                        if (menServices.service_name[languageCode] != undefined) {
                            displayServiceName = menServices.service_name[languageCode];
                        }

                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice;
                        services['service_id'] = menServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;
                        if (serviceDuration != undefined) {
                            services['duration'] = (serviceDuration['3'] != undefined ? serviceDuration['3'] : 0);

                        } else {
                            services['duration'] = 0;
                        }


                        if (vendorServiceLevels.indexOf(selectedServiceLevel) === -1) {
                            serviceQuantity = 0;
                            selectedServiceLevel = 0;
                        }
                        menCategoryQuatity = parseInt(menCategoryQuatity) + parseInt(serviceQuantity);
                        services['selected_service_level'] = selectedServiceLevel;
                        services['service_id'] = serviceId;
                        services['cart_id'] = cartId;
                        services['order'] = menServiceOrder;
                        menServiceOrder++;
                        data['men']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }
                    data['men']['cat'][categoryName]['count'] = menCategoryQuatity;


                }
                var boyCategoryOrder = 1;
                for (var b = 0; b < servicesData["boy"].length; b++) {
                    var boy = servicesData['boy'][b];
                    var categoryName = boy['category'].category_name["en"];
                    var displayCategoryName = boy['category'].category_name["en"];
                    var categoryId = boy['category'].category_id;
                    var url = boy['category'].url;
                    var boyCategoryQuatity = 0;
                    var categoryVideoUrl = '';
                    if (boy['category'].video_url != undefined) {
                        categoryVideoUrl = boy['category'].video_url[4];
                    }
                    // var categoryFor=response[i].cat.category_for;
                    if (boy['category'].category_name[languageCode] != undefined) {
                        displayCategoryName = boy['category'].category_name[languageCode];
                    }
                    if (data['boy']['cat'] == undefined) {
                        data['boy']['cat'] = {};
                    }

                    if (data['boy']['cat'][categoryName] == undefined) {
                        data['boy']['cat'][categoryName] = {};
                    }
                    data['boy']['cat'][categoryName]['id'] = categoryId;
                    data['boy']['cat'][categoryName]['display_name'] = displayCategoryName;
                    data['boy']['cat'][categoryName]['order'] = boyCategoryOrder;
                    boyCategoryOrder++;
                    data['boy']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);

                    data['boy']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                    var boyServiceOrder = 1;
                    for (var s = 0; s < boy['services'].length; s++) {
                        var boyServices = boy['services'][s];
                        var serviceName = boyServices.service_name["en"];
                        var displayServiceName = boyServices.service_name["en"];
                        var serviceId = boyServices.service_id;
                        var cartId = (boyServices.cartValue._id == undefined ? 0 : boyServices.cartValue._id);
                        var duration = (boyServices.cartValue.duration == undefined ? 0 : boyServices.cartValue.duration);
                        var selectedServiceLevel = (boyServices.cartValue.selected_service_level == undefined ? 0 : boyServices.cartValue.selected_service_level);
                        var serviceQuantity = (boyServices.cartValue.quantity == undefined ? 0 : boyServices.cartValue.quantity);
                        var servicePrice = boyServices.service_prices;
                        var serviceDuration = boyServices.duration;
                        var vendorServiceLevels = boyServices.levels;
                        for (var keys in servicePrice) {
                            keys = parseInt(keys);
                            if (vendorServiceLevels.indexOf(keys) == -1) {

                                delete servicePrice[keys];
                            }
                        }
                        var serviceUrl = boyServices.url;

                        if (data['boy']['cat'][categoryName]['ser'] == undefined) {
                            data['boy']['cat'][categoryName]['ser'] = {};
                        }
                        if (boyServices.service_name[languageCode] != undefined) {
                            displayServiceName = boyServices.service_name[languageCode];
                        }

                        var services = {};
                        services['display_name'] = displayServiceName;
                        services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                        services['level'] = servicePrice;
                        services['service_id'] = boyServices.service_id;
                        services['selected_service_quatity'] = serviceQuantity;
                        if (serviceDuration != undefined) {
                            services['duration'] = (serviceDuration['4'] != undefined ? serviceDuration['4'] : 0);

                        } else {
                            services['duration'] = 0;
                        }



                        if (vendorServiceLevels.indexOf(selectedServiceLevel) === -1) {
                            serviceQuantity = 0;
                            selectedServiceLevel = 0;
                        }
                        boyCategoryQuatity = parseInt(boyCategoryQuatity) + parseInt(serviceQuantity);
                        services['selected_service_level'] = selectedServiceLevel;
                        services['service_id'] = serviceId;
                        services['cart_id'] = cartId;
                        services['order'] = boyServiceOrder;
                        boyServiceOrder++;
                        data['boy']['cat'][categoryName]['ser'][serviceName] = services;
                        //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                    }

                    data['boy']['cat'][categoryName]['count'] = boyCategoryQuatity;

                }
                var currency_type = '';
                var currency_code = '';

                if (servicesData['country'].length != 0) {
                    currency_type = (servicesData['country'][0]['currency'] == undefined ? '' : servicesData['country'][0]['currency']);
                    currency_code = (servicesData['country'][0]['currency_code'] == undefined ? '' : servicesData['country'][0]['currency']);
                }
                return res.send({
                    "success": true,
                    "category_data": data,
                    "currency_type": currency_type,
                    "currency_code": currency_code
                });                // return false;
                /* for(var i=0;i<response.length;i++)
                 {
                 var category={};
                 category={};
                 var categoryName=response[i].cat.category_name["en"];
                 var displayCategoryName=response[i].cat.category_name["en"];
                 var categoryId=response[i].cat.category_id;
                 var url=response[i].cat.url;
                 var categoryFor=response[i].cat.category_for;
                 if(response[i].cat.category_name[languageCode]!=undefined)
                 {
                 displayCategoryName=response[i].cat.category_name[languageCode];
                 }
                 category={};
                 var subCategory={};
                 for(var s=0;s<response[i].sub_category.length;s++)
                 {
                 var  subCategoryName=response[i].sub_category[s].sub_category_name['en'];
                 var  SubCategoryUrl=response[i].sub_category[s].url;
                 var  cart=response[i].sub_category[s].cart;
                 var subCategoryId=response[i].sub_category[s].sub_category_id;

                 var displaySubCategoryName=response[i].sub_category[s].sub_category_name['en'];
                 if(response[i].sub_category[s].sub_category_name[languageCode]!=undefined)
                 {
                 displaySubCategoryName=response[i].sub_category[s].sub_category_name[languageCode];
                 }
                 subCategory={};
                 subCategory['id']=subCategoryId;
                 subCategory['display_name']=displaySubCategoryName;
                 subCategory['url']=((SubCategoryUrl==undefined)?'':SubCategoryUrl);
                 subCategory['cart']='';
                 subCategory['carts']=cart;

                 if(categoryFor.indexOf(1)!=-1)
                 {
                 if(data['women']['cat']==undefined)
                 {
                 data['women']['cat']={};

                 }
                 data['women']['id']=1;
                 if( data['women']['cat'][categoryName]==undefined)
                 {
                 data['women']['cat'][categoryName]={};
                 }
                 if( data['women']['cat'][categoryName]['sub']==undefined)
                 {
                 data['women']['cat'][categoryName]['sub']={};
                 }
                 data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                 data['women']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.women;
                 data['women']['cat'][categoryName]['display_name']=displayCategoryName;
                 data['women']['cat'][categoryName]['id']=categoryId;
                 data['women']['cat'][categoryName]['url']=((url==undefined)?'':url);

                 }
                 if(categoryFor.indexOf(2)!=-1)
                 {
                 data['girl']['id']=2;
                 if(data['girl']['cat']==undefined)
                 {
                 data['girl']['cat']={};

                 }
                 if( data['girl']['cat'][categoryName]==undefined)
                 {
                 data['girl']['cat'][categoryName]={};
                 }
                 if( data['girl']['cat'][categoryName]['sub']==undefined)
                 {
                 data['girl']['cat'][categoryName]['sub']={};
                 }

                 data['girl']['cat'][categoryName]['sub'][subCategoryName]=subCategory;

                 data['girl']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.girl;

                 data['girl']['cat'][categoryName]['display_name']=displayCategoryName;
                 data['girl']['cat'][categoryName]['id']=categoryId;
                 data['girl']['cat'][categoryName]['url']=((url==undefined)?'':url);
                 }
                 if(categoryFor.indexOf(3)!=-1)
                 {
                 if(data['men']['cat']==undefined)
                 {
                 data['men']['cat']={};

                 }
                 data['men']['id']=3;
                 if( data['men']['cat'][categoryName]==undefined)
                 {
                 data['men']['cat'][categoryName]={};
                 }
                 if( data['men']['cat'][categoryName]['sub']==undefined)
                 {
                 data['men']['cat'][categoryName]['sub']={};
                 }
                 data['men']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                 data['men']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.men;

                 data['men']['cat'][categoryName]['display_name']=displayCategoryName;
                 data['men']['cat'][categoryName]['id']=categoryId;
                 data['men']['cat'][categoryName]['url']=((url==undefined)?'':url);

                 }
                 if(categoryFor.indexOf(4)!=-1)
                 {
                 data['boy']['id']=4;
                 if(data['boy']['cat']==undefined)
                 {
                 data['boy']['cat']={};

                 }
                 if( data['boy']['cat'][categoryName]==undefined)
                 {
                 data['boy']['cat'][categoryName]={};
                 }
                 data['boy']['cat'][categoryName]={};
                 if( data['boy']['cat'][categoryName]['sub']==undefined)
                 {
                 data['boy']['cat'][categoryName]['sub']={};
                 }
                 data['boy']['cat'][categoryName]['sub'][subCategoryName]=subCategory;

                 data['boy']['cat'][categoryName]['sub'][subCategoryName]['cart']=cart.boy;

                 data['boy']['cat'][categoryName]['display_name']=displayCategoryName;
                 data['boy']['cat'][categoryName]['id']=categoryId;
                 data['boy']['cat'][categoryName]['url']=((url==undefined)?'':url);

                 }
                 }





                 }*/
            }

        });
    }
});
router.post('/find-stylist', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var languageCode = req.body.language_code;
    var filter = req.body.filter;
    if (filter == undefined || filter == '') {
        filter = {};
    } else {
        filter = JSON.parse(filter)
    }
    var type = req.body.type;

    if (type == 1) {
        var scheduleId = req.body.schedule_id;
        tables.scheduleBookingTable.getCartDetailsFindStylist(scheduleId, async function (response) {
            if (response != undefined && response.length != 0) {
                var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": response[0].city_id }, { "time_zone": 1 });
                var timeZone = '';
                if (cityDetails != undefined && cityDetails.length != 0) {
                    timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
                }
                tables.vendorLocationTable.getStylists(response, timeZone, filter, languageCode, function (result) {
                    if (result != undefined && result != 0) {
                        return res.send({ "success": true, "stylist": result, "errorcode": 0 });
                    } else {
                        if (response.length == 1) {
                            return res.send({ "success": true, "stylist": [], "errorcode": 2 });
                        } else {
                            return res.send({ "success": true, "stylist": [], "errorcode": 1 });

                        }
                        /* tables.vendorLocationTable.checkStylistAvailable(response,filter,function(result){
                         if(result!=undefined && result.length!=0)
                         {
                         utility.writeToFile.writeToFile(result);

                         return res.send({"success": true, "stylist": [],"errorcode":1});

                         }else
                         {
                         utility.writeToFile.writeToFile(result);

                         return res.send({"success": true, "stylist": [],"errorcode":2});

                         }
                         });*/
                    }

                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en'])
                })
            }
        });
    } else {
        tables.cartTable.getCartDetails(customerId, async function (response) {
            if (response != undefined && response.length != 0) {
                var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": response[0].city_id }, { "time_zone": 1 });
                var timeZone = '';
                if (cityDetails != undefined && cityDetails.length != 0) {
                    timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
                }
                tables.vendorLocationTable.getStylists(response, timeZone, filter, languageCode, function (result) {
                    if (result != undefined && result != 0) {
                        return res.send({ "success": true, "stylist": result, "errorcode": 0 });
                    } else {

                        if (response.length == 1) {
                            return res.send({ "success": true, "stylist": [], "errorcode": 2 });
                        } else {
                            return res.send({ "success": true, "stylist": [], "errorcode": 1 });

                        }
                        /* tables.vendorLocationTable.checkStylistAvailable(response,filter,function(result){
                               if(result!=undefined && result.length!=0)
                               {
                                   utility.writeToFile.writeToFile(result);

                                   return res.send({"success": true, "stylist": [],"errorcode":1});

                               }else
                                   {
                                       utility.writeToFile.writeToFile(result);

                                       return res.send({"success": true, "stylist": [],"errorcode":2});

                                   }
                         });*/
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en'])
                })
            }
            //res.send(response);
        });
    }

});
router.post('/cart-update', async function (req, res) {


    var cartId = req.body.cart_id;
    var userId = req.body.user_id;
    var type = req.body.cart_update_type;
    var languageCode = req.body.language_code;


    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            ,
            "error_code": 0
        })
    }
    if (!utility.isValidCartUpdate(parseInt(type))) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 1
        });
    }
    if (type == utility.CART_UPDATE_TYPE_DELETE) {

        if (cartId == '' || cartId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        tables.cartTable.updateMany({ "status": 3 }, { "_id": cartId }, async function (response) {
            if (typeof response != "undefined" && response != null) {
                var checkCouponAmount = await tables.cartTable.checkCouponCode(userId);

                if (checkCouponAmount != undefined && checkCouponAmount.length != 0) {
                    var couponDetails = checkCouponAmount[0]['coupon'];

                    if (couponDetails != undefined && couponDetails['coupon'] != undefined && couponDetails['coupon'] != '') {
                        var couponType = couponDetails['coupon_amount_type'];
                        if (couponType == 1) {

                            var cartAmount = checkCouponAmount[0]['total_amount'];
                            var minAmount = couponDetails['min_amount'];

                            if (cartAmount < minAmount) {
                                var cartUpdate = await tables.cartTable.removeCoupon({
                                    "coupon": 1,
                                    "coupon_amount": 1,
                                    "coupon_amount_type": 1,
                                    'up_to_amount': 1,
                                    'coupon_id': 1,
                                    'min_amount': 1
                                }, { "customer_id": userId, 'status': 1 })
                            }
                        }
                    }
                }
                return res.send({ "success": true, "message": "updated", "cart_id": cartId });
            } else {
                return res.send({ "success": false, "message": "try again" });

            }
        });
    }
    else if (type == utility.CART_UPDATE_TYPE_SERVICE_QTY_UPDATE) {

        if (cartId == '' || cartId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 2
            });
        }
        var quantity = req.body.quantity;
        var price = req.body.price;

        if (quantity == '' || quantity == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 3

            });
        }
        quantity = parseInt(quantity);
        if (quantity < 0) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 4

            });
        }

        if (price == '' || price == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 5
            });
        }
        if (price == 0 || price < 0) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 6
            });
        }

        tables.cartTable.update({ "quantity": quantity, "price": price }, {
            "_id": cartId,
            "customer_id": userId
        },
            async function (response) {
                if (typeof response != "undefined" && response != null) {
                    var checkCouponAmount = await tables.cartTable.checkCouponCode(userId);
                    if (checkCouponAmount != undefined && checkCouponAmount.length != 0) {
                        var couponDetails = checkCouponAmount[0]['coupon'];
                        if (couponDetails != undefined && couponDetails['coupon'] != undefined && couponDetails['coupon'] != '') {
                            var couponType = couponDetails['coupon_amount_type'];
                            if (couponType == 1) {
                                var cartAmount = checkCouponAmount[0]['total_amount'];
                                var minAmount = couponDetails['min_amount'];
                                if (cartAmount < minAmount) {
                                    var cartUpdate = await tables.cartTable.removeCoupon({
                                        "coupon": 1,
                                        "coupon_amount": 1,
                                        "coupon_amount_type": 1,
                                        'up_to_amount': 1,
                                        'coupon_id': 1,
                                        'min_amount': 1
                                    }, { "customer_id": userId, 'status': 1 })
                                }
                            }
                        }
                    }
                    return res.send({ "success": true, "message": "updated" });
                } else {
                    return res.send({ "success": false, "message": "try again" });
                }
            });
    }
    else if (type == utility.CART_UPDATE_TYPE_SERVICE_FOR_CHANGE) {

        if (cartId == '' || cartId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        var price = req.body.price;
        var serviceFor = req.body.service_for;
        if (price == '' || price == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (serviceFor == '' || typeof serviceFor === "undefined") {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        tables.cartTable.update({ "selected_for": serviceFor, "price": price }, {
            "_id": cartId,
            "customer_id": userId
        }, function (response) {
            if (typeof response != "undefined" && response != null) {
                return res.send({ "success": true, "message": "updated" });

            } else {
                return res.send({ "success": false, "message": "try again" });

            }
        });


    }
    else if (type == utility.CART_UPDATE_TYPE_SERVICE_LEVEL_CHANGE) {


        if (cartId == '' || cartId == undefined || cartId == 0) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        var price = req.body.price;
        var selectedServiceLevel = req.body.selected_service_level;
        var quantity = req.body.quantity;
        if (price == '' || typeof price === "undefined") {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (selectedServiceLevel == '' || selectedServiceLevel == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }


        tables.cartTable.update({
            "selected_service_level": selectedServiceLevel,
            "price": price,
            "quantity": quantity
        }, {
            "_id": cartId,
            "customer_id": userId
        }, async function (response) {
            if (typeof response != "undefined") {
                var checkCouponAmount = await tables.cartTable.checkCouponCode(userId);
                if (checkCouponAmount != undefined && checkCouponAmount.length != 0) {
                    var couponDetails = checkCouponAmount[0]['coupon'];
                    if (couponDetails != undefined && couponDetails['coupon'] != undefined && couponDetails['coupon'] != '') {
                        var couponType = couponDetails['coupon_amount_type'];
                        if (couponType == 1) {
                            var cartAmount = checkCouponAmount[0]['total_amount'];
                            var minAmount = couponDetails['min_amount'];
                            if (cartAmount < minAmount) {
                                var cartUpdate = await tables.cartTable.removeCoupon({
                                    "coupon": 1,
                                    "coupon_amount": 1,
                                    "coupon_amount_type": 1,
                                    'up_to_amount': 1,
                                    'coupon_id': 1,
                                    'min_amount': 1
                                }, { "customer_id": userId, 'status': 1 })
                            }
                        }
                    }
                }
                return res.send({
                    "success": true,
                    "message": "updated",
                    "cart_id": (cartId != undefined ? cartId : ''),
                    "level": "updated"
                });

            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    }
    else if (type == utility.CART_ADD) {
        var quantity = req.body.quantity;
        var price = req.body.price;
        var selectedServiceLevel = req.body.selected_service_level;
        var serviceFor = req.body.service_for;
        var serviceId = req.body.service_id;
        var categoryId = req.body.category_id;
        var duration = req.body.duration;
        var vendorId = req.body.vendor_id;
        var cityId = req.body.city_id;
        var address = req.body.address;
        var latitude = req.body.latitude;
        var longitude = req.body.longitude;
        var additionalDetails = req.body.additional_details;
        if (vendorId == undefined) {
            vendorId = '';
        }
        if (quantity == '' || quantity == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (price == '' || price == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (selectedServiceLevel == '' || selectedServiceLevel == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (serviceFor == '' || serviceFor == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (serviceId == '' || serviceId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (categoryId == '' || categoryId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (cityId == '' || cityId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (address == '' || address == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (latitude == '' || latitude == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (longitude == '' || longitude == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (duration == '' || duration == undefined) {

            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        var servicePrice = await tables.servicesTable.getPriceDetails(serviceId, cityId);

        if (servicePrice.length != 0) {
            duration = (servicePrice[0]['service_prices'][0]['duration'][serviceFor] ? servicePrice[0]['service_prices'][0]['duration'][serviceFor] : 0);
        }
        duration = parseInt(duration);
        tables.cartTable.find({
            "customer_id": userId,
            "service_id": serviceId,
            "selected_for": serviceFor,
            "status": utility.CART_ITEM_ADDEED,
            "cart_type": 1
        }, async function (response) {
            if (response != undefined && response.length == 0) {
                var cartValues = await tables.cartTable.findFieldsWithPromises({ "customer_id": userId, "status": 1 }, {
                    "coupon": 1,
                    "coupon_amount": 1,
                    "coupon_amount_type": 1,
                    'up_to_amount': 1,
                    "cart_for": 1,
                    "friend_details": 1,
                    "coupon_id": 1,
                    'coupon_type': 1,
                    "min_amount": 1, "additional_details": 1, payment_type: 1
                });
                var saveValues = {};
                saveValues["quantity"] = quantity;
                saveValues["customer_id"] = userId;
                saveValues["service_id"] = serviceId;
                saveValues["address"] = address;
                saveValues["latitude"] = latitude;
                saveValues["longitude"] = longitude;
                saveValues["duration"] = duration;
                saveValues["payment_type"] = 1;
                if (cartValues != undefined && cartValues.length != 0 && cartValues[0].coupon != undefined) {
                    saveValues['coupon'] = cartValues[0].coupon;
                    saveValues['coupon_amount'] = cartValues[0].coupon_amount;
                    saveValues['coupon_amount_type'] = cartValues[0].coupon_amount_type;
                    saveValues['up_to_amount'] = cartValues[0].up_to_amount;
                    saveValues['coupon_id'] = cartValues[0].coupon_id;
                    saveValues['coupon_type'] = cartValues[0].coupon_type;
                    saveValues['coupon_scope'] = cartValues[0].coupon_scope;
                    saveValues['min_amount'] = (cartValues[0].min_amount == undefined ? 0 : cartValues[0].min_amount);
                    saveValues['payment_type'] = cartValues[0].payment_type;
                }
                if (cartValues != undefined && cartValues.length != 0 && cartValues[0].cart_for != undefined && cartValues[0].cart_for == 2) {
                    saveValues['friend_details'] = cartValues[0]['friend_details'];
                }
                saveValues["cart_type"] = 1;
                vendorId = trim(vendorId);
                if (vendorId != '') {
                    saveValues["vendor_id"] = vendorId;
                }
                saveValues['city_id'] = cityId;
                saveValues["selected_for"] = serviceFor;
                saveValues["selected_service_level"] = selectedServiceLevel;
                saveValues["category_id"] = categoryId;
                saveValues["price"] = price;
                saveValues["status"] = utility.CART_ITEM_ADDEED;
                if (additionalDetails != '' && additionalDetails != undefined || (cartValues != undefined && cartValues.length != 0 && cartValues[0].additional_details)) {
                    var save = {};
                    if (cartValues != undefined && cartValues.length != 0 && cartValues[0].additional_details) {
                        additionalDetails = cartValues[0].additional_details;
                    } else {
                        additionalDetails = JSON.parse(additionalDetails);
                    }
                    if (additionalDetails['building_name'] != undefined) {
                        save['building_name'] = additionalDetails['building_name'];
                    }
                    if (additionalDetails['details'] != undefined) {
                        save['details'] = additionalDetails['details'];
                    }
                    if (additionalDetails['flat_num'] != undefined) {
                        save['flat_num'] = additionalDetails['flat_num'];
                    }
                    if (additionalDetails['land_mark'] != undefined) {
                        save['land_mark'] = additionalDetails['land_mark'];
                    }
                    saveValues['additional_details'] = save;
                }
                tables.cartTable.save(saveValues, function (response) {
                    return res.send({ "success": true, "message": "updated", "cart_id": response._id });
                });
            } else if (response != undefined) {
                return res.send({
                    "success": false,
                    "message": "Already in the cart",
                    "error_code": 1,
                    "cart_id": response[0]._id,
                    "selected_service_level": response[0].selected_service_level,
                    "selected_service_quatity": response[0].quantity
                });

            } else {
                type = parseInt(type);
                return res.send({ "success": false, "message": "something went worng try again" });
            }
        });

    }
    else if (type == utility.CART_PAYMENT_UPDATE) {
        var paymentType = req.body.payment_type;
        if (paymentType == '' || paymentType == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 2
            })
        }
        paymentType = parseInt(paymentType);

        if (!utility.isValidPayment(paymentType)) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 3
            });
        }

        if (paymentType === utility.PAYMENT_TYPE_CARD) {
            // var customerDetails = await tables.customerTable.getPaymentDefaultCard(userId);

            // if (!customerDetails || !customerDetails[0] || !customerDetails[0]['payment']) {
            //     return res.send({
            //         "success": false,
            //         "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
            //         "error_code": 4,
            //         "card_details": {}
            //     });
            // }
            // var cardId = '';

            // if (customerDetails && customerDetails[0]['payment']) {
            //     cardId = customerDetails[0]['payment']['_id']
            // }
            // var getPaymentDefaultCarddetails = await tables.customerTable.getUserDefaultCardDetails(userId);
            // if (!getPaymentDefaultCarddetails || !getPaymentDefaultCarddetails[0]) {
            //     return res.send({
            //         "success": false,
            //         "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
            //         "error_code": 4,
            //         "card_details": {}
            //     });
            // }
            // var cardId = '';

            // if (getPaymentDefaultCarddetails && getPaymentDefaultCarddetails[0]) {
            //     cardId = getPaymentDefaultCarddetails[0]['_id']
            // }
            // var card = await tables.customerTable.getPaymentCardDetails(userId, cardId);
            var updateCartResponse = await tables.cartTable.updatepayment({ "card_id": req.body.cardId, "payment_type": paymentType }, { "customer_id": userId, "status": 1 });
            return res.send({
                "success": true,
                "message": "Updated",
                "card_details": updateCartResponse
            });
        } else {

            var updateCartResponse = await tables.cartTable.updatepayment({ "payment_type": paymentType }, { "customer_id": userId, "status": 1 });
            return res.send({
                "success": true,
                "message": "Updated",
                "card_details": {}
            });

        }
    } else {

        return res.send({
            "success": false,

            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

});
router.post('/remove-promo', tokenValidations, function (req, res) {

});
router.post('/surge-price', tokenValidations, function (req, res) {
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    var city = req.body.city;
    if (city == '') {
        return res.send({ "success": true, "message": "please select the city" });
    }
    var latitude = req.body.latitude;
    if (latitude == '') {
        return res.send({ "success": true, "message": "Invalid request" });
    }
    var longitude = req.body.longitude;
    if (longitude == '') {
        return res.send({ "success": true, "message": "Invalid request" });
    }
    tables.surgePriceTable.checkSurgePrice(latitude, longitude, function (response) {

        if (response != undefined && response.length != 0) {
            var start = new Date();
            var end = new Date(response[0].expiry_at);
            var minitues = utility.diffMinutes(start, end);

            return res.send({
                "success": true,
                "message": "surge Price",
                "surge": response[0].surge,
                "surge_toggle": response[0].surge_banner,
                "time": minitues
            });
        } else if (response != undefined) {
            return res.send({ "success": true, "message": "no surge Price" });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});
router.post('/cart-count', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var userId = req.body.user_id;
    var type = req.body.type;

    tables.cartTable.checkCart(userId, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "cart": response[0] })
        } else {
            return res.send({ "success": true, "cart": {} })
        }
    });


});
router.post('/service-details', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var serviceId = req.body.service_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (serviceId == '' || serviceId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.servicesTable.getServiceDetails(serviceId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            res.send({ "success": true, "service_details": response[0] });
        } else {
            res.send({ "success": true, "service_details": {} });
        }

    });

});
router.post('/cursor', function (req, res) {
    tables.addressTable.fi("hi", function (response) {

    });
});
router.post('/notifiy-surge', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    var surgeId = req.body.surge_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var time = req.body.time;
    utility.cron.saveCron();
    /*  var customerResponse=await tables.customerTable.findFieldsWithPromises({"_id":userId},{"first_name":1,"last_name":1});
      var customerName='';
      if(customerResponse!=undefined && customerResponse.length!=0)
      {
          customerName=customerResponse[0].first_name;
      }*/
    var minitues = parseInt(time) * 10000;
    res.send({ "success": true, "message": "notification when surge drops" });
    /*  setTimeout(function()
    {
        timeoutFires(userId)
    },minitues);*/
});

async function timeoutFires(userId) {
    var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(userId);
    if (fcmResponse != undefined && fcmResponse.length != 0) {

        var data = {
            "title": "Surge Drops",
            "message": "surge dropped in your area,book now",
            "type": 12
        };
        utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
    }
}

function sendEmailForManager(cartIds, currency) {
    tables.cartTable.getCartServiceDetails(cartIds, function (response) {
        if (response != undefined && response.length != 0) {
            var customerDetails = response[0].customer_details;
            var customerName = response[0].customer_name;
            var customerMobile = response[0].customer_mobile;
            var cityName = response[0].city_name;
            var countryName = response[0].country_name;
            customerDetails['customer_name'] = customerName;
            customerDetails['customer_mobile'] = customerMobile;
            customerDetails['city_name'] = cityName;
            customerDetails['country_name'] = countryName;
            utility.curl.curlPost('admin/index/booking-service-mail', {
                "customer_details": customerDetails,
                "services": response[0].services
            });
        }
    });
}

router.post('/rating', function (req, res) {
    var userId = req.body.user_id;
    var vendorId = req.body.vendor_id;
    var sort = req.body.sort;
    var offset = req.body.offset;
    var limit = req.body.limit;
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
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (limit == '' || limit == undefined) {
        limit = 10;
    }
    if (offset == '' || offset == undefined) {
        offset = 0;
    }
    var find = {};
    if (sort != '' && sort != undefined) {
        find['rating'] = sort;
    }
    tables.ratingTable.rating(vendorId, limit, offset, languageCode, function (response) {
        if (response != undefined) {
            return res.send({ "success": true, "rating": response })
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});
router.post('/salon-reviews', function (req, res) {
    var userId = req.body.user_id;
    var salonId = req.body.salon_id;
    var sort = req.body.sort;
    var offset = req.body.offset;
    var limit = req.body.limit;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (limit == '' || limit == undefined) {
        limit = 10;
    }
    if (offset == '' || offset == undefined) {
        offset = 0;
    }
    var find = {};
    if (sort != '' && sort != undefined) {
        find['rating'] = sort;
    }
    find['salon_id'] = salonId;

    tables.ratingTable.salonRating(salonId, limit, offset, languageCode, function (response) {
        if (response != undefined) {
            res.send({ "success": true, "rating": response })
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});

router.post('/multiple-stylist-booking', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;


    if (userId == '' || userId == undefined) {

        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var type = req.body.type;
    if (type == 1) {
        var scheduleId = req.body.schedule_id;
        tables.scheduleBookingTable.getCartDetails(scheduleId, async function (cartItems) {
            if (cartItems != undefined && cartItems.length != 0) {
                var totalCartItems = cartItems.length;
                for (var v = 0; v < cartItems.length; v++) {
                    var vendorId = cartItems[v]._id;
                    if (vendorId != null) {

                    } else {
                        return res.send({
                            "success": false,
                            "message": (utility.errorMessages["stylist is for missing for some cart items please choose"][languageCode] != undefined ? utility.errorMessages["stylist is for missing for some cart items please choose"][languageCode] : utility.errorMessages["stylist is for missing for some cart items please choose"]['en']),
                            "errocode": 1,
                            "cartId": cartItems[v].services
                        });

                    }
                }
                if (cartItems.length) {
                    var cityId = cartItems[0].city_id;
                    var currency = await tables.citiesTable.getCurrency(cityId);
                    vendorId = cartItems[0]._id;
                    var totalcartItems = [];
                    var totalCartIds = [];
                    var totalVendors = [];
                    var checkCouponAmount = await tables.scheduleBookingTable.checkScheduleBookingCouponCode(scheduleId);
                    var paymentType = cartItems[0].payment_type;

                    var cardDetails = {};
                    if (paymentType == utility.PAYMENT_TYPE_CARD) {
                        var cardId = cartItems[0].card_id;
                        cardDetails = await tables.paymentcardTable.returnusercardsbyId(cardId);
                    }
                    checkVendor(vendorId, cartItems, 0, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, checkCouponAmount, cardDetails);

                } else {
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                        "errocode": 4

                    });
                }
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                    "errocode": 4

                });
            }
        });
    } else {
        tables.cartTable.getVendorCartItems(userId, async function (cartItems) {
            console.log(">>>>>>>>>>>>>>>>>>>>>>>", cartItems)
            if (cartItems != undefined && cartItems.length != 0) {
                var totalCartItems = cartItems.length;
                for (var v = 0; v < cartItems.length; v++) {
                    var vendorId = cartItems[v]._id;
                    if (vendorId != null) {

                    } else {
                        return res.send({
                            "success": false,
                            "message": (utility.errorMessages["stylist is for missing for some cart items please choose"][languageCode] != undefined ? utility.errorMessages["stylist is for missing for some cart items please choose"][languageCode] : utility.errorMessages["stylist is for missing for some cart items please choose"]['en']),
                            "errocode": 1,
                            "cartId": cartItems[v].services
                        });

                    }
                }
                if (cartItems.length) {
                    var cityId = cartItems[0].city_id;
                    var currency = await tables.citiesTable.getCurrency(cityId);
                    vendorId = cartItems[0]._id;
                    var totalcartItems = [];
                    var totalCartIds = [];
                    var totalVendors = [];
                    var checkCouponAmount = await tables.cartTable.checkCouponCode(userId);
                    var paymentType = cartItems[0].payment_type;

                    var cardDetails = {};
                    if (paymentType == utility.PAYMENT_TYPE_CARD) {
                        var cardId = cartItems[0].card_id;
                        cardDetails = await tables.paymentcardTable.returnusercardsbyId(cardId);

                    }

                    // console.log("cardDetails>>>>>>>>",cardDetails)

                    checkVendor(vendorId, cartItems, 0, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, checkCouponAmount, cardDetails);

                } else {
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                        "errocode": 4

                    });
                }
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                    "errocode": 4

                });
            }
        });
    }
    //var vendorId=response[b].vendor_id;
});

function cartDuration(services) {
    var duration = 0;
    return new Promise(function (resolve) {

        for (var d = 0; d < services.length; d++) {
            duration += services[d].duration;
        }
        if (d <= services.length) {
            return resolve(duration);
        }
    });
}

async function checkVendor(vendorId, cartItems, cart_pos, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, cartAmount, cardDetails) {

    var vendorCartItems = cartItems[cart_pos].services;
    var cityId = cartItems[cart_pos].city_id;
    var timeZone = '';
    var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": cityId }, { "time_zone": 1 });
    var getbookingpercentage = await tables.customerTable.getbookingpercentage();

    if (cityDetails != undefined && cityDetails.length != 0) {
        timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
    }
    tables.vendorTable.checkVendorStatus(vendorId, timeZone, vendorCartItems, cityId, async function (vendorResponse) {


        if (vendorResponse == undefined || vendorResponse.length == 0) {

            return res.send({
                "success": false,
                "message": (utility.errorMessages["stylist services not available at this moment"][languageCode] != undefined ? utility.errorMessages["stylist services not available at this moment"][languageCode] : utility.errorMessages["stylist services not available at this moment"]['en']),
                "vendorId": vendorId,
                "error_code": 3
            });
        } else if (!(vendorResponse[0].availability.length)) {
            /* sendEmailForManager(totalCartIds,function(){

             });*/
            return res.send({
                "success": false,
                "message": (utility.errorMessages["stylist not available at this moment"][languageCode] != undefined ? utility.errorMessages["stylist not available at this moment"][languageCode] : utility.errorMessages["stylist not available at this moment"]['en']),
                "vendorId": vendorId,
                "error_code": 2
            });
        } else {
            var netAmount = 0;
            var cartId = [];
            for (var c = 0; c < vendorCartItems.length; c++) {
                totalCartIds.push(vendorCartItems[c].cart_id);
                cartId.push(vendorCartItems[c].cart_id);
                var quantity = (vendorCartItems[c].quantity == undefined ? 1 : vendorCartItems[c].quantity);
                var price = (vendorCartItems[c].price == undefined ? 1 : vendorCartItems[c].price);
                var amount = price;
                netAmount += amount;

            }
            totalVendors.push(vendorId);
            var couponCodeDetails = cartItems[0].coupon_code_details;
            var stylistType = vendorResponse[0].type;
            var latitude = cartItems[0].latitude;
            var longitude = cartItems[0].longitude;
            var additionalDetails = cartItems[0].additional_details;


            var address = cartItems[0].address;
            var countryId = currency[0].country_id;
            var cityId = currency[0].city_id;
            var currencyCode = currency[0].currency_code;
            var currencySymbol = currency[0].currency_symbol;
            var dollarConvertionValue = currency[0].dollar_conversion_rate;

            var surgePriceResponse = await tables.surgePriceTable.checkSurgePriceWithPromises(latitude, longitude);
            var surge = 1.0;
            if (surgePriceResponse != undefined && surgePriceResponse.length != 0) {
                surge = surgePriceResponse[0].surge;
            }
            netAmount = parseFloat(netAmount);

            var amount = netAmount;
            if (dollarConvertionValue != undefined) {
                dollarConvertionValue = parseFloat(dollarConvertionValue);
                dollarConvertionValue = 1 / dollarConvertionValue,
                    amount = netAmount * dollarConvertionValue;
            }
            var paymentType = cartItems[0].payment_type;
            var booking = {
                "cart_id": cartId,
                "customer_id": userId,
                "vendor_id": vendorId,
                "net_amount": netAmount,
                "status": tables.bookingsTable.status["1"].status,
                "type": 1,
                "latitude": latitude,
                "longitude": longitude,
                "address": address,
                "surge": surge,
                'stylist_type': stylistType,
                "is_notified": 1,
                "net_amount_dollar": amount,
                "request_count": 1,
                "customer_country_details": {
                    country_id: countryId,
                    city_id: cityId,
                    currency_code: currencyCode,
                    currency_symbol: currencySymbol
                },
                'payment_type': paymentType,
                'admin_percentage': getbookingpercentage[0].booking_percentage
            };
            var card = {};
            if (paymentType == utility.PAYMENT_TYPE_CARD) {
                if (cardDetails && cardDetails[0]) {
                    card = cardDetails[0];
                    booking['payment_details'] = card;
                }


            }
            var bookingLocation = { "type": "Point", "coordinates": [longitude, latitude] };
            booking['location'] = bookingLocation;
            if (stylistType == utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {
                booking['salon_id'] = vendorResponse[0].salon_id;
                booking['salon_id'] = vendorResponse[0].salon_id;
                booking['employee_id'] = vendorResponse[0].employee_id;
                var bookingTime = await cartDuration(vendorCartItems);
                var dateFormat = 'YYYY-MM-DD';
                var timeFormat = 'HH:mm';
                var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": cityId }, { "time_zone": 1 });
                var timeZone = '';
                if (cityDetails != undefined && cityDetails.length != 0) {
                    timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
                }
                var startDate = moment.tz(timeZone);
                var date = startDate.format(dateFormat);
                var time = startDate.format(timeFormat);
                var endDateTime = moment(startDate).add(bookingTime, 'minutes');
                var endDate = endDateTime.format(dateFormat);
                var endTime = endDateTime.format(timeFormat);
                booking['date'] = date;
                booking['time'] = time;
                booking['end_date'] = endDate;
                booking['time_zone'] = timeZone;
                booking['end_time'] = endTime;
            }
            booking['additional_details'] = additionalDetails;


            if (req.body.schedule_id != undefined && req.body.schedule_id != "") {
                var scheduleId = req.body.schedule_id;
                booking["schedule_id"] = scheduleId;
            }

            if (couponCodeDetails != undefined && couponCodeDetails.coupon_code != '') {
                booking["coupon"] = couponCodeDetails.coupon_code;
                booking["coupon_amount"] = couponCodeDetails.coupon_amount;
                booking["up_to_amount"] = couponCodeDetails.up_to_amount;
                booking["coupon_amount_type"] = couponCodeDetails.type;
                booking["coupon_scope"] = couponCodeDetails.coupon_scope;
                var couponAmount = couponCodeDetails.coupon_amount;
                //cartItems  cartAmount
                if (cartAmount != undefined && cartAmount.length != 0 && cartAmount[0]['total_amount'] != undefined) {
                    var cartTotal = cartAmount[0]['total_amount'];
                    var couponDiscount = 0;
                    var percentage = 0;
                    netAmount = netAmount * surge;
                    cartTotal = cartTotal * surge;
                    if (couponCodeDetails.type == 1) {
                        percentage = netAmount / cartTotal;
                        percentage = percentage * 100;
                        couponDiscount = percentage * couponAmount / 100;
                    } else {
                        var couponPercentage = couponCodeDetails.coupon_amount;
                        var couponUpToAmount = couponCodeDetails.up_to_amount;
                        var discountAmount = (cartTotal / 100) * couponPercentage;
                        if (discountAmount > couponUpToAmount) {
                            couponAmount = couponUpToAmount;
                        } else {
                            couponAmount = discountAmount;
                        }
                        percentage = netAmount / cartTotal;
                        percentage = percentage * 100;
                        couponDiscount = percentage * couponAmount / 100;
                        couponDiscount = parseFloat(couponDiscount.toFixed(2))
                    }
                    booking['coupon_details'] = {
                        "coupon": couponCodeDetails.coupon_code, 'coupon_amount': couponDiscount,
                        "coupon_type": couponCodeDetails.type, "coupon_scope": couponCodeDetails.coupon_scope, "coupon_id": cartAmount[0]['coupon']['coupon_id']
                    };
                }
            }
            // totalBookingItems.push(booking);
            if (cartItems.length - 1 == cart_pos) {
                totalcartItems.push(booking);
                /* for(var t=0;t<totalcartItems.length;t++)
                 {

                 }*/

                //  return  res.send(totalcartItems);

                /* var checkStylistAvalibility=await tables.stylistTable.findFieldsWithPromises({"vendor_id":{"$all":totalVendors},"booking_status":1},{"_id":1});
                  if(checkStylistAvalibility==undefined || checkStylistAvalibility.length==0)
                  {
                      return res.send({
                          "success": false,
                          "message": (utility.errorMessages["stylist not available at this moment"][languageCode] != undefined ? utility.errorMessages["stylist not available at this moment"][languageCode] : utility.errorMessages["stylist not available at this moment"]['en']),
                          "vendorId": vendorId,
                          "error_code": 2
                      });
                  }*/
                tables.stylistTable.updateMany({ "booking_status": 2 }, { "vendor_id": { "$in": totalVendors } }, function (response) {
                    tables.bookingsTable.insertMany(totalcartItems, async function (bookingResponse) {
                        var bookingIds = [];
                        var bookingDetails = [];
                        var currency = bookingResponse[0].customer_country_details.currency_code;
                        var checkPreviousCancellationFee = await tables.customerTable.findFieldsWithPromises({
                            "cancellation_pay_status": 1,
                            "customer_id": 1
                        }, { "cancell_type_value": 1, "cancell_type": 1, "net_amount": 1 });
                        var cancellAmount = 0;
                        if (checkPreviousCancellationFee != undefined && checkPreviousCancellationFee.length != 0) {
                            var cancellationType = '';
                            var cancellationTypeValue = '';
                            var cancellationNetAmount = '';
                            for (var cf = 0; cf < checkPreviousCancellationFee.length; c++) {
                                if (cancellationType == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                    cancellAmount += cancellationTypeValue;
                                }
                                if (cancellationType == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                                    cancellAmount += (cancellationNetAmount / cancellationTypeValue);
                                }
                            }
                            if (cancellAmount != 0) {
                                var updateBooking = await tables.bookingsTable.updateWithPromises({ "previous_cancell_amount": cancellAmount }, { "_id": bookingResponse[0]._id })

                            }
                        }
                        let serveOutEmployeesalons = [];
                        for (var v = 0; v < bookingResponse.length; v++) {
                            bookingIds.push(bookingResponse[v]._id);
                            var bookingId = bookingResponse[v]._id;
                            var vendorId = bookingResponse[v].vendor_id;
                            var stylistType = bookingResponse[v].stylist_type;
                            var tmp = {};
                            var customerCountryId = bookingResponse[v].customer_country_details.country_id;
                            tmp['booking_id'] = bookingId;
                            tmp['stylist_type'] = stylistType;
                            tmp['country_id'] = customerCountryId;
                            if (stylistType == utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {
                                var salonId = bookingResponse[v].salon_id;
                                // var vendorDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
                                vendorId = salonId;
                                serveOutEmployeesalons.push(salonId);
                            }
                            tmp['vendor_id'] = vendorId;
                            tmp['serve_out_order_salons_list'] = serveOutEmployeesalons;
                            bookingDetails.push(tmp);
                        }
                        var latitude = cartItems[0].latitude;
                        var longitude = cartItems[0].longitude;
                        var address = cartItems[0].address;
                        var save = {
                            'customer_id': userId,
                            "booking_id": bookingIds,
                            "status": 1,
                            "address": address,
                            "latitude": latitude,
                            "longitude": longitude
                        };
                        if (couponCodeDetails != undefined) {
                            save["coupon"] = couponCodeDetails.coupon_code,
                                save["coupon_amount"] = couponCodeDetails.coupon_amount,
                                save["coupon_amount_type"] = couponCodeDetails.type,
                                save["up_to_amount"] = couponCodeDetails.up_to_amount;
                        }
                        tables.ordersTable.save(save, function (orderResponse) {
                            tables.cartTable.updateMany({ "status": parseInt(utility.CART_ITEM_BOOKED) },
                                { "_id": { "$in": totalCartIds } }, function (response) {
                                    tables.ordersTable.getBookingOrderDetails(orderResponse._id, userId, languageCode, async function (orderResponse) {
                                        var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                                            "first_name": 1,
                                            "last_name": 1
                                        });
                                        var customerName = '';
                                        if (customerResponse != undefined && customerResponse.length != 0) {
                                            customerName = customerResponse[0].first_name['tr'];
                                        }


                                        if (req.body.schedule_id != undefined && req.body.schedule_id != "") {
                                            var scheduleId = req.body.schedule_id;
                                            var updateSchdule = await tables.scheduleBookingTable.updateManyWithPromises({ "status": 3 }, { "_id": scheduleId });
                                        }
                                        for (var b = 0; b < bookingDetails.length; b++) {
                                            var bookingId = bookingDetails[b].booking_id;
                                            var vendorId = bookingDetails[b].vendor_id;


                                            var stylistType = bookingDetails[b].stylist_type;
                                            var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                                            var format = 'YYYY-MM-DD HH:mm:ss';

                                            var presentDateTime = moment().utc().format(format);

                                            var data =
                                            // {
                                            //     "title": "New Booking",
                                            //     "message": "You got a service request from " + customerName,
                                            //     "booking_id": bookingId,
                                            //     "stylist_type": stylistType,
                                            //     "request_time": presentDateTime,
                                            //     "type": stylistType
                                            // };
                                            {
                                                "title": "Rezervasyon Bilgilendirmesi",
                                                "message": `${customerName} tarafından rezervasyon talebi yapıldı.`,
                                                "booking_id": bookingId,
                                                "stylist_type": stylistType,
                                                "request_time": presentDateTime,
                                                "type": stylistType
                                            };


                                            data['country_id'] = countryId;
                                            data['city_id'] = cityId;
                                            data['customer_id'] = userId;
                                            data['vendor_id'] = vendorId;
                                            data['notification_type'] = 1;


                                            tables.notificationsTable.save(data, function (response) {
                                            });
                                            if (fcmResponse != undefined && fcmResponse.length != 0) {
                                                utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                                            }
                                            /*for(var i=0;i<sockets[vendorId].length;i++){
                                                if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined){

                                                    req.app.io.sockets.sockets[sockets[vendorId][i]].emit("order",{"booking_id":bookingId});
                                                }else{
                                                    sockets[vendorId].slice(i,1);
                                                }

                                            }*/

                                            req.app.io.sockets.in(vendorId).emit("order", {
                                                "booking_id": bookingId,
                                                "notification_data": data
                                            });

                                        }
                                        this.setTimeout(function () {
                                            timeOutStylist(bookingIds, req.app.io)
                                        }, 30000);

                                        res.send({
                                            "success": true,
                                            "order": orderResponse,
                                            "booking_ids": bookingIds

                                        });
                                        utility.currencyConvertor.stylistBookingConversionValues(bookingDetails);






                                    });

                                });
                        });
                    });
                });
            } else {
                cart_pos++;
                vendorId = cartItems[cart_pos]._id;
                totalcartItems.push(booking);
                checkVendor(vendorId, cartItems, cart_pos, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, cartAmount, cardDetails);
            }

        }
    });
}

function timeOutStylist(bookingId, io) {
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


                    io.sockets.in(vendor_id).emit("timeout", {
                        "booking_id": response[b]._id,
                        "user_id": user_id
                    });








                }
            }
        }
    });
}
router.get('/timeout-stylist', function (req, res) {

});
router.post('/stylist-booking', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var userId = req.body.user_id;

    var languageCode = req.body.language_code;
    var scheduleId = req.body.schedule_id;
    var type = req.body.type;
    if (type == 1) {
        tables.scheduleBookingTable.getCartDetails(scheduleId, async function (cartItems) {
            if (cartItems.length) {
                var totalcartItems = [];
                var totalCartIds = [];
                var totalVendors = [];
                var cityId = cartItems[0].city_id;
                var currency = await tables.citiesTable.getCurrency(cityId);
                var checkCouponAmount = await tables.scheduleBookingTable.checkScheduleBookingCouponCode(scheduleId);
                var paymentType = cartItems[0].payment_type;

                var cardDetails = {};
                if (paymentType == utility.PAYMENT_TYPE_CARD) {
                    var cardId = cartItems[0].card_id;
                    cardDetails = await tables.paymentcardTable.returnusercardsbyId(cardId);
                }

                checkVendor(vendorId, cartItems, 0, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, checkCouponAmount, cardDetails);
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                    "errocode": 4,

                });
            }

        })
    } else {
        tables.cartTable.updateMany({ "vendor_id": vendorId }, {
            "customer_id": userId,
            "cart_type": 1,
            "status": 1
        }, function (response) {
            tables.cartTable.checkCartItems(userId, async function (cartItems) {
                // vendorId = cartItems[0]._id;
                if (cartItems.length) {
                    var totalcartItems = [];
                    var totalCartIds = [];
                    var totalVendors = [];
                    var cityId = cartItems[0].city_id;
                    var currency = await tables.citiesTable.getCurrency(cityId);
                    var checkCouponAmount = await tables.cartTable.checkCouponCode(userId);
                    var paymentType = cartItems[0].payment_type;

                    var cardDetails = {};


                    if (paymentType == utility.PAYMENT_TYPE_CARD) {
                        var cardId = cartItems[0].card_id;
                        cardDetails = await tables.paymentcardTable.returnusercardsbyId(cardId);

                    }


                    checkVendor(vendorId, cartItems, 0, languageCode, userId, res, totalcartItems, totalVendors, totalCartIds, req, currency, checkCouponAmount, cardDetails);
                } else {
                    return res.send({
                        "success": false,
                        "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                        "errocode": 4
                    });
                }
            });
        });

    }

    /*
     tables.cartTable.getCartDetails(userId, function (response) {
     var cartId = [];
     for (var c = 0; c < response.length; c++) {


     cartId.push(response[c]._id);
     }
     tables.bookingsTable.save({
     "cart_id": cartId,
     "customer_id": userId,
     "vendor_id": vendorId,
     "status":tables.bookingsTable.status["1"].status
     }, function (response) {
     var bookingId = response._id;
     tables.ordersTable.save({'customer_id':userId,"booking_id":[bookingId],"status":1},function(response){


     tables.cartTable.updateMany({"status": parseInt(utility.CART_ITEM_BOOKED)}, {"_id": {"$in": cartId}}, function (response) {
     if (response != undefined) {
     tables.vendorLocationTable.getStylistLocation(vendorId, function (response) {
     return res.send({
     "success": true,
     "message": "booked successfully",
     "location": response[0],
     "booking_id": bookingId
     });

     });
     } else {
     return res.send({"success": false, "message": "try again"});
     }
     });
     });
     });
     });
     */
});
router.post('/orders', tokenValidations, function (req, res) {

    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.ordersTable.getCustomerBookingDetails(userId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            res.send({ "success": true, "data": response });
        } else {
            res.send({ "success": true, "data": [], "error_code": 1 });
        }
    });

    /*tables.ordersTable.getCustomerOrderDetails(userId, function (response) {
         if (response != undefined && response.length != 0) {
             res.send({"success": true, "data": response});
         } else {
             res.send({"success": true, "data": [], "error_code": 1});
         }
     });*/
});
router.post('/default-values', tokenValidations, async function (req, res) {
    var city = req.body.city;
    var startTime = utility.getTime;
    var country = req.body.country;
    var userId = req.body.user_id;
    var fcmId = req.body.fcm_id;
    var deviceId = req.body.device_id;
    var tmUserId = req.body.tm_user_id;
    var deviceType = req.body.device_type;
    var languageCode = req.body.language_code;


    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (country == '' || country == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (city == '' || city == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (tmUserId == undefined || tmUserId == '') {
        tmUserId = 0;
    }

    city = decodeURIComponent(city)


    var cityLan = await utility.translate(city);
    var countryLan = await utility.translate(country);



    city = cityLan.text;
    country = countryLan.text;


    tables.citiesTable.defaultValues(userId, city, country, languageCode, async function (response) {
        if (response != undefined && response.length != 0) {
            //var userId=result[0]._id;
            if (fcmId != '' && fcmId != undefined) {
                var fcmData = {};
                fcmData['fcm_id'] = fcmId;
                fcmData["device_id"] = deviceId;
                fcmData["device_type"] = deviceType;
                tmUserId = parseInt(tmUserId);
                tables.fcmTable.update(fcmData, { "customer_id": userId }, async function (response) {
                    if (response == null) {
                        var save = {};
                        save['fcm'] = [];
                        save['fcm'].push(fcmData);
                        save['customer_id'] = userId;
                        tables.fcmTable.save(save, async function (response) {
                        });
                    }
                    if (tmUserId != 0 && tmUserId != undefined) {
                        deviceType = parseInt(deviceType);
                        var result = await utility.updateFcm({
                            "fcm_token": fcmId,
                            "user_id": tmUserId,
                            "device_type": deviceType
                        }, utility.user_role_customer)
                    }
                });
            }



            var getcurrentbookings = await tables.bookingsTable.getcurrentbookings(userId);
            let timer = 0;
            if (getcurrentbookings && getcurrentbookings.length) {
                var currentbookings = 1;
            } else {
                var currentbookings = 0;
            }
            if (currentbookings) {
                var getorderdetails = await tables.bookingsTable.getorderdetails(getcurrentbookings[0]._id);

                if (getorderdetails && getorderdetails[0]) {
                    var booking_accepted = getcurrentbookings[0].booking_accepted;
                    var bookings = getorderdetails[0].booking_id.length;
                    const currentdate = new Date();
                    ts1 = booking_accepted.getTime();
                    ts2 = currentdate.getTime();
                    timeStampdiff = ((ts2 - ts1) / 1000);
                    timer = ((bookings * 2 * 60) - timeStampdiff) * 1000;

                    if (timer <= 0) {
                        timer = 0;
                    }
                }

            }
            if (getcurrentbookings && getcurrentbookings.length) {
                getcurrentbookings[0].timer = timer.toFixed(0)
            }
            var iscancellation = 0, cancellationamount = 0, iscardadded = 0;
            findcancellation_amount = await tables.bookingsTable.getcancellationamount(userId);
            if (findcancellation_amount && findcancellation_amount.length) {
                iscancellation = 1;
                // cancellationamount = findcancellation_amount.reduce((prev, next) => prev + next.cancellation_amount, 0);
                cancellationamount = findcancellation_amount[0].cancellation_amount.toFixed(2);

            }

            var useraddedcards = await tables.paymentcardTable.gatusercardsbyuserId(userId);

            if (useraddedcards && useraddedcards.length) {
                iscardadded = 1;
            }
            var obj = {};
            obj.iscancellation = iscancellation;
            obj.cancellationamount = cancellationamount;
            obj.iscardadded = iscardadded;
            if (iscancellation) {
                obj.booking_inc_id = findcancellation_amount[0].booking_inc_id;
                obj.bookingId = findcancellation_amount[0].bookingId;
                obj.vendor_id = findcancellation_amount[0].vendor_id;
                obj.vendor_id = findcancellation_amount[0].vendor_id;




            } else {
                obj.booking_inc_id = ""
            }



            res.send({ "success": true, "data": response[0], "currentbookings": currentbookings, "getcurrentbookings": getcurrentbookings, "canpolacydetails": obj });



            // let getpendingtransactions = await tables.paymentcardTable.getuserpendingtransactions(userId)
            // if (getpendingtransactions.length) {
            //     var pendingtnx = true;
            //     var bookingId = getpendingtransactions[0]._id;
            // } else {
            //     pendingtnx = false
            //     var bookingId = ""
            // }
            /*  var endTime=utility.getTime;
              var writeData={"start_time":startTime,"end_time":endTime,"data":{"success": true, "data": response[0]},
                  "request":req.body};
              utility.writeToFile.writeToFile(writeData);*/


        } else {
            /* var endTime=utility.getTime;
             var writeData={"start_time":startTime,"end_time":endTime,"data":{"success": true, "data": response[0]},
                 "request":req.body};
             utility.writeToFile.writeToFile(writeData);*/

            res.send({ "success": true, "data": {}, "error_code": 1 });
        }

    });
});
router.post('/city', tokenValidations, async function (req, res) {
    var city = req.body.city;
    var country = req.body.country;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (country == '' || country == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (city == '' || city == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var cityLan = await utility.translate(city);

    var countryLan = await utility.translate(country);




    city = cityLan.text;
    country = countryLan.text;



    tables.citiesTable.getCityId(city, country, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            res.send({ "success": true, "city_id": response[0].city_id });
        } else {
            res.send({ "success": false, "message": "service not available in this city" });
        }
    });
});
router.post('/check-near-vendor', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var cartId = req.body.cart_id;
    // sendEmailForManager([cartId])

    var languageCode = req.body.language_code;
    var filter = req.body.filter;
    if (filter == undefined || filter == '') {
        filter = {};
    }
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (cartId == '' || cartId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.cartTable.getSingleCartDetails(cartId, userId, async function (response) {
        if (response != undefined) {

            if (response.length != 0) {
                var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": response[0].city_id }, { "time_zone": 1 });
                var timeZone = '';
                if (cityDetails != undefined && cityDetails.length != 0) {
                    timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
                }
                tables.vendorLocationTable.getStylists(response, timeZone, filter, languageCode, function (result) {
                    if (result != undefined) {

                        if (result.length != 0) {
                            res.send({ "success": true, "stylist": result, "cart_id": cartId });
                        } else {
                            sendEmailForManager([cartId]);
                            return res.send({
                                "success": false,
                                "message": (utility.errorMessages["No stylist Found"][languageCode] != undefined ? utility.errorMessages["No stylist Found"][languageCode] : utility.errorMessages["No stylist Found"]['en'])
                            });
                        }

                    } else {

                        return res.send({
                            "success": false,
                            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                        });
                    }

                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Cart Item Already Booked"][languageCode] != undefined ? utility.errorMessages["Cart Item Already Booked"][languageCode] : utility.errorMessages["Cart Item Already Booked"]['en'])
                })
            }

        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }


    })
});
router.post('/assign-stylist', tokenValidations, function (req, res) {

    var userId = req.body.user_id;
    var cartId = req.body.cart_id;
    var vendorId = req.body.vendor_id;
    var languageCode = req.body.language_code;
    var type = req.body.type;
    var scheduleBookingId = req.body.schedule_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (cartId == '' || cartId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (vendorId == '' || vendorId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    async.parallel({
        stylistDetails: function (callback) {
            tables.vendorTable.getVendorServices(vendorId, languageCode, function (response) {
                callback(null, response);

            });
        },
        cartDetails: function (callback) {
            if (scheduleBookingId != '' && scheduleBookingId != undefined) {
                tables.scheduleBookingTable.getCartDetailsFindStylist(scheduleBookingId, function (response) {
                    callback(null, response)
                });
            } else {
                tables.cartTable.getCartDetails(userId, function (response) {
                    callback(null, response)
                });
            }

        }
    }, function (err, results) {

        var providingServices = [];
        if (results.stylistDetails != undefined) {
            var vendor = results.stylistDetails[0];
            var vendorServices = results.stylistDetails[0].services;
            var cartDetails = results.cartDetails;
            for (var v = 0; v < vendorServices.length; v++) {
                var vendorServiceId = vendorServices[v].service_id;
                var service = {};
                for (var c = 0; c < cartDetails.length; c++) {
                    var cartServiceId = cartDetails[c].service_id;
                    var serviceCartId = cartDetails[c]._id;
                    var vendor_id = cartDetails[c].vendor_id;
                    if (vendor_id == undefined || cartId == serviceCartId) {
                        if (cartServiceId.toString() == vendorServiceId.toString()) {
                            var serviceFor = parseInt(cartDetails[c].selected_for.toString());
                            var serviceLevel = parseInt(cartDetails[c].selected_service_level.toString());
                            if (vendorServices[v]['service_for'] == serviceFor) {
                                if (vendorServices[v]['service_levels'].indexOf(serviceLevel) != -1) {
                                    //service['cart_id']=cartId;
                                    //service['vendor_id']=vendorId;
                                    providingServices.push(serviceCartId);
                                }
                            }
                        }
                    }
                }
            }
            tables.cartTable.updateMany({ "vendor_id": vendorId }, { "_id": { "$in": providingServices } }, function (response) {
                res.send({ "success": true, "cartId": providingServices, "vendor": vendor });
            });

        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});
/*router.post('/booking-details', tokenValidations, function (req, res) {
    var orderId = req.body.order_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (orderId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.ordersTable.getOrderDetails(orderId, userId, function (response) {

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

});*/
router.post('/stylist-booking-details', tokenValidations, function (req, res) {
    var startTime = utility.getTime;
    var userId = req.body.user_id;
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.getCustomerBookingDetails(bookingId, userId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {
            var endTime = utility.getTime;
            var writeData = {
                "start_time": startTime,
                "end_time": endTime,
                "response": { "success": true, "booking_details": response[0] },
                "request_from": "customer",
                "request": req.body
            };
            //utility.writeToFile.writeToFile(writeData);
            return res.send({ "success": true, "booking_details": response[0] });
        } else {
            return res.send({ "success": false, "message": "try again" });
        }
    });
});
router.post('/stylist-order-details', tokenValidations, function (req, res) {
    var startTime = utility.getTime;
    var userId = req.body.user_id;
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.ordersTable.getCustomerSingleOrderDetails(bookingId, userId, languageCode, async function (response) {
        var getcurrentbookings = await tables.bookingsTable.getcurrentbookings(userId);
        let timer = 0;
        if (getcurrentbookings && getcurrentbookings.length) {
            var currentbookings = 1;
        } else {
            var currentbookings = 0;
        }
        if (currentbookings) {

            var booking_accepted = getcurrentbookings[0].booking_accepted;
            const currentdate = new Date();
            ts1 = booking_accepted.getTime();
            ts2 = currentdate.getTime();
            timeStampdiff = ((ts2 - ts1) / 1000);
            timer = ((getcurrentbookings.length * 5 * 60) - timeStampdiff) * 1000;
            if (timer < 0) {
                timer = 0;
            }
        }
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "booking_details": response, "timer": timer.toFixed(0) });
        } else {
            return res.send({ "success": false, "message": "try again" });
        }
    });
});
router.post('/salon-booking-details', tokenValidations, function (req, res) {
    var startTime = utility.getTime;
    var userId = req.body.user_id;
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.bookingsTable.getSalonBookingCustomerDetails(bookingId, languageCode, function (response) {
        if (response != undefined && response.length != 0) {

            return res.send({ "success": true, "booking_details": response[0] });
        } else {
            return res.send({ "success": false, "message": "try again" });
        }
    });
});
router.post('/clear-cart-items', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.cartTable.deleteTotallCart(userId, async function (response) {
        if (typeof response != "undefined" && response != null) {
            tables.salonFilteredItemsTable.deleteFilteredItems({ "customer_id": userId }, async function (response) {

            });
            var scheduleBooking = await tables.scheduleBookingTable.updateManyWithPromises({ "status": 4 }, {
                "customer_id": userId,
                "status": 1
            });
            return res.send({ "success": true, "message": "updated" });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});
router.post('/cancel-booking', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var value = 0;
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, {
        "status": 1,
        "net_amount": 1,
        "surge": 1,
        "vendor_id": 1
    });

    if (bookingDetails == undefined || bookingDetails.length == 0) {
        return res.send({ "success": false, "message": "Invalid booking" });
    }

    var bookingStatus = bookingDetails[0].status;
    var vendorId = bookingDetails[0].vendor_id;
    if (bookingStatus == tables.bookingsTable.status['5'].status) {
        return res.send({ 'success': false, "message": "Booking already cancelled by stylist" });
    }
    if (bookingStatus == tables.bookingsTable.status['4'].status) {
        return res.send({ 'success': true, "message": "Booking already cancelled" });
    }

    var response = await tables.bookingsTable.getStylistCancellationDetails(bookingId);
    if (response != undefined && response.length != 0) {
        var policyForAcceptance = response[0]['policy_for_acceptance'];
        var policyForArrival = response[0]['policy_for_arrival'];
        var cancellationTime = '';
        var cancellationTimeType = '';
        var cancellationType = '';
        var cancellationTypeValue = '';
        var text = '';
        var acceptanceTotalPolicy = [];
        var arrialTotalPolicy = [];
        var bookingTime = response[0].created;
        var now = new Date();
        bookingTime = new Date(bookingTime);
        var timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        var diffDays = Math.floor(timeDiff / 86400000); // days
        var diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        var diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        var near = response[0].is_notified;
        var type = '';
        var cancellValue = 0;

        if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) {
            if (policyForAcceptance['policy'].length != 0) {
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {

                    if (diffDays != 0) {

                        if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    else if (diffHrs != 0) {
                        if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
                        if (diffMins >= acceptancePolicy[ac].cancellation_time) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if (value != 0) {

                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type = utility.CANCELLATION_POLICY_TYPE_RATING;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type = utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            type = utility.CANCELLATION_POLICY_TYPE_FLAT;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        // acceptanceTotalPolicy.push(text);

                    }

                }
            }
        } else {
            if (policyForArrival['policy'].length != 0) {
                var arrivalPolicy = policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for (var ar = 0; ar < arrivalPolicy.length; ar++) {
                    text = '';
                    if (diffDays != 0) {
                        console.log("comming to if>>>>>>>>>>>>>>>>>>>111111111", diffDays)
                        if (diffMins >= arrivalPolicy[ar].cancellation_time) {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                value = arrivalPolicy[ar].cancellation_time;

                            }
                        }


                    }
                    else if (diffHrs != 0) {
                        console.log("comming to if>>>>>>>>>>>>>>>>>>>222222222222222", diffHrs)

                        if (diffHrs >= arrivalPolicy[ar].cancellation_time);
                        {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                value = arrivalPolicy[ar].cancellation_time;
                            }
                        }

                    }
                    else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
                        console.log("comming to if>>>>>>>>>>>>>>>>>>>33333333333333", diffMins)

                        if (diffMins >= arrivalPolicy[ar].cancellation_time);
                        {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                value = arrivalPolicy[ar].cancellation_time;
                            }
                        }
                    }
                    if (value != 0) {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type = arrivalPolicy[ar].cancellation_type;
                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type = arrivalPolicy[ar].cancellation_type;

                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            type = arrivalPolicy[ar].cancellation_type;
                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }

                    }
                }


            }
        }
    }
    var update = {};



    if (cancellValue != 0) {


        update['cancell_type'] = type;
        update['cancell_type_value'] = cancellValue;
        update['cancellation_pay_status'] = 1;
        var netAmount = bookingDetails[0]['net_amount'];
        var surge = bookingDetails[0]['surge'];
        if (surge != undefined) {
            netAmount = netAmount * surge;
        }
        var cancellationAmount = cancellValue;
        if (type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
            cancellationAmount = (netAmount / 100) * cancellValue;
        }
        if (type == utility.CANCELLATION_POLICY_TYPE_RATING) {
            var vendorId = bookingDetails[0]['vendor_id'];
            var save = {
                "booking_id": bookingId,
                "customer_id": userId,
                "vendor_id": vendorId,
                "rated_by": 2,
                "rating": cancellationAmount,
                "review": ''
            };
            var updateRating = await tables.ratingTable.save(save, function (response) {
            });
        }
        var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "payment_type": 1, "customer_country_details": 1 });
        if (bookingDetails && bookingDetails.length && (type != utility.CANCELLATION_POLICY_TYPE_RATING)) {
            var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "strip_id": 1 });
            // if (bookingDetails[0].payment_type == 2 && customerDetails) {
            //     var stripe = require('../utility/stripPayment');
            //     var stripId = customerDetails[0].strip_id;
            //     var currencyCode = bookingDetails[0].customer_country_details.currency_code;
            //     var paymentDetails = await stripe.chargeCustomer(cancellationAmount, currencyCode, stripId);
            //     update['payment_status'] = 2;
            // }
        }

        if (cancellationAmount < utility.minimumcancellationamount) {
            update['cancellation_amount'] = utility.minimumcancellationamount;
        } else {
            update['cancellation_amount'] = cancellationAmount;

        }


    }

    update['status'] = 4;
    tables.bookingsTable.update(update, { "_id": bookingId }, async function (bookingResponse) {
        if (bookingResponse != undefined && bookingResponse.length != 0) {

            if (bookingResponse.cancellation_amount != null) {

                await tables.bookingsTable.cancellationAmount(bookingResponse, cancellValue)
            }

            tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": bookingResponse.vendor_id }, async function (response) {
                if (response != undefined) {
                    res.send({ "success": true, "message": "booking canceled" });

                    var vendorId = response.vendor_id;
                    var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                        "first_name": 1,
                        "last_name": 1
                    });
                    var customerName = '';
                    if (customerResponse != undefined && customerResponse.length != 0) {
                        customerName = customerResponse[0].first_name['tr'];
                    }
                    var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);

                    // var data = {
                    //     "title": "Booking is cancelled",
                    //     "message": "Booking is cancelled  from " + customerName,
                    //     "booking_id": bookingId,
                    //     "type": 4
                    // };
                    var data = {
                        "title": "Rezervasyon Bilgilendirmesi",
                        "message": `Rezervasyon ${customerName} tarafından iptal edildi.`,
                        "booking_id": bookingId,
                        "type": 4
                    };
                    data['country_id'] = bookingResponse.customer_country_details.country_id;
                    data['city_id'] = bookingResponse.customer_country_details.city_id;
                    data['customer_id'] = userId;
                    data['vendor_id'] = bookingResponse.vendor_id;
                    tables.notificationsTable.save(data, function (response) {
                    });
                    if (fcmResponse != undefined && fcmResponse.length != 0) {

                        utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                    }
                    if (sockets[vendorId] != undefined) {

                        /*for(var i=0;i<sockets[vendorId].length;i++)
                        {

                            if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined)
                            {
                                req.app.io.sockets.sockets[sockets[vendorId][i]].emit("cancel_order_customer",{"booking_id":bookingId});
                            }else
                            {
                                sockets[vendorId].slice(i,1);
                            }
                        }*/

                        req.app.io.sockets.in(vendorId).emit("cancel_order_customer", { "booking_id": bookingId })
                    }
                }


            });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});

async function cancelbookingincron(obj) {
    console.log(">>>>>>>>>>>>>>>>>>>", obj)
    var bookingId = obj.booking_id;
    var userId = obj.user_id;
    var languageCode = obj.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return ({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var value = 0;
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, {
        "status": 1,
        "net_amount": 1,
        "surge": 1,
        "vendor_id": 1
    });

    if (bookingDetails == undefined || bookingDetails.length == 0) {
        return ({ "success": false, "message": "Invalid booking" });
    }

    var bookingStatus = bookingDetails[0].status;
    var vendorId = bookingDetails[0].vendor_id;
    if (bookingStatus == tables.bookingsTable.status['5'].status) {
        return ({ 'success': false, "message": "booking already cancelled by stylist" });
    }

    var response = await tables.bookingsTable.getStylistCancellationDetails(bookingId);
    if (response != undefined && response.length != 0) {
        var policyForAcceptance = response[0]['policy_for_acceptance'];
        var policyForArrival = response[0]['policy_for_arrival'];
        var cancellationTime = '';
        var cancellationTimeType = '';
        var cancellationType = '';
        var cancellationTypeValue = '';
        var text = '';
        var acceptanceTotalPolicy = [];
        var arrialTotalPolicy = [];
        var bookingTime = response[0].created;
        var now = new Date();
        bookingTime = new Date(bookingTime);
        var timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        var diffDays = Math.floor(timeDiff / 86400000); // days
        var diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        var diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        var near = response[0].is_notified;
        var type = '';
        var cancellValue = 0;

        if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) {
            if (policyForAcceptance['policy'].length != 0) {
                var acceptancePolicy = policyForAcceptance['policy'];
                acceptancePolicy = acceptancePolicy.sort(compareTime);
                for (var ac = 0; ac < acceptancePolicy.length; ac++) {

                    if (diffDays != 0) {

                        if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if (diffHrs != 0 && diffDays != 0) {
                        if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
                        if (diffMins >= acceptancePolicy[ac].cancellation_time) {
                            if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                value = acceptancePolicy[ac].cancellation_time;
                            }
                        }
                    }
                    if (value != 0) {

                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type = utility.CANCELLATION_POLICY_TYPE_RATING;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type = utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            type = utility.CANCELLATION_POLICY_TYPE_FLAT;
                            cancellValue = acceptancePolicy[ac].cancellation_type_value;
                            break;
                        }
                        // acceptanceTotalPolicy.push(text);

                    }

                }
            }
        } else {
            if (policyForArrival['policy'].length != 0) {
                var arrivalPolicy = policyForArrival['policy'];
                arrivalPolicy = arrivalPolicy.sort(compareTime);

                for (var ar = 0; ar < arrivalPolicy.length; ar++) {
                    text = '';
                    if (diffDays != 0) {
                        if (diffMins >= arrivalPolicy[ar].cancellation_time) {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                value = arrivalPolicy[ar].cancellation_time;

                            }
                        }


                    }
                    if (diffHrs != 0 && diffDays != 0) {
                        if (diffHrs >= arrivalPolicy[ar].cancellation_time);
                        {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                value = arrivalPolicy[ar].cancellation_time;
                            }
                        }

                    }
                    if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {

                        if (diffMins >= arrivalPolicy[ar].cancellation_time);
                        {
                            if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                value = arrivalPolicy[ar].cancellation_time;
                            }
                        }
                    }
                    if (value != 0) {
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                            type = arrivalPolicy[ar].cancellation_type;
                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                            type = arrivalPolicy[ar].cancellation_type;

                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }
                        if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                            type = arrivalPolicy[ar].cancellation_type;
                            cancellValue = arrivalPolicy[ar].cancellation_type_value;
                            break;
                        }

                    }
                }


            }
        }
    }
    var update = {};



    if (cancellValue != 0) {


        update['cancell_type'] = type;
        update['cancell_type_value'] = cancellValue;
        update['cancellation_pay_status'] = 1;
        var netAmount = bookingDetails[0]['net_amount'];
        var surge = bookingDetails[0]['surge'];
        if (surge != undefined) {
            netAmount = netAmount * surge;
        }
        var cancellationAmount = cancellValue;
        if (type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
            cancellationAmount = (netAmount / 100) * cancellValue;
        }
        if (type == utility.CANCELLATION_POLICY_TYPE_RATING) {
            var vendorId = bookingDetails[0]['vendor_id'];
            var save = {
                "booking_id": bookingId,
                "customer_id": userId,
                "vendor_id": vendorId,
                "rated_by": 2,
                "rating": cancellationAmount,
                "review": ''
            };
            var updateRating = await tables.ratingTable.save(save, function (response) {
            });
        }
        var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "payment_type": 1, "customer_country_details": 1 });
        if (bookingDetails && bookingDetails.length && (type != utility.CANCELLATION_POLICY_TYPE_RATING)) {
            var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "strip_id": 1 });
            // if (bookingDetails[0].payment_type == 2 && customerDetails) {
            //     var stripe = require('../utility/stripPayment');
            //     var stripId = customerDetails[0].strip_id;
            //     var currencyCode = bookingDetails[0].customer_country_details.currency_code;
            //     var paymentDetails = await stripe.chargeCustomer(cancellationAmount, currencyCode, stripId);
            //     update['payment_status'] = 2;
            // }
        }

        update['cancellation_amount'] = cancellationAmount;

    }

    update['status'] = 4;
    tables.bookingsTable.update(update, { "_id": bookingId }, function (bookingResponse) {
        if (bookingResponse != undefined && bookingResponse.length != 0) {
            tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": bookingResponse.vendor_id }, async function (response) {
                if (response != undefined) {
                    // res.send({ "success": true, "message": "booking canceled" });

                    var vendorId = response.vendor_id;
                    var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                        "first_name": 1,
                        "last_name": 1
                    });
                    var customerName = '';
                    if (customerResponse != undefined && customerResponse.length != 0) {
                        customerName = customerResponse[0].first_name['en'];
                    }
                    var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);

                    var data = {
                        "title": "Rezervasyon Bilgilendirmesi",
                        "message": `Rezervasyon ${customerName} tarafından iptal edildi.`,
                        "booking_id": bookingId,
                        "type": 4
                    };
                    data['country_id'] = bookingResponse.customer_country_details.country_id;
                    data['city_id'] = bookingResponse.customer_country_details.city_id;
                    data['customer_id'] = userId;
                    data['vendor_id'] = bookingResponse.vendor_id;
                    tables.notificationsTable.save(data, function (response) {
                    });
                    if (fcmResponse != undefined && fcmResponse.length != 0) {

                        utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                    }
                    if (sockets[vendorId] != undefined) {

                        /*for(var i=0;i<sockets[vendorId].length;i++)
                        {

                            if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined)
                            {
                                req.app.io.sockets.sockets[sockets[vendorId][i]].emit("cancel_order_customer",{"booking_id":bookingId});
                            }else
                            {
                                sockets[vendorId].slice(i,1);
                            }
                        }*/

                        req.app.io.sockets.in(vendorId).emit("cancel_order_customer", { "booking_id": bookingId })
                    }
                }


            });
        } else {
            return ({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
}


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

    if (type == 2) {
        response = await tables.bookingsTable.getSalonCancellationDetails(bookingId);
    } else {
        response = await tables.bookingsTable.getStylistCancellationDetails(bookingId);
    }

    if (response != undefined && response.length != 0 && (response[0]['policy_for_acceptance'] != undefined || response[0]['policy_for_arrival'] != undefined)) {
        if (type == 2) {
            /*response= await tables.bookingsTable.*/
            bookingTime = response[0].date + " " + response[0].time;
            now = new Date();
            var timezone = response[0].time_zone;
            bookingTime = moment(bookingTime).tz(timezone).utc().format();
            bookingTime = new Date(bookingTime);
            timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
            //var diffMs = (Christmas - today); // milliseconds between now & Christmas
            diffDays = Math.floor(timeDiff / 86400000); // days
            diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
            diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        } else {
            response = await tables.bookingsTable.getStylistCancellationDetails(bookingId);
            bookingTime = response[0].created;
            now = new Date();
            bookingTime = new Date(bookingTime);
            timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
            diffDays = Math.floor(timeDiff / 86400000); // days
            diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
            diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        }
        console.log("diffDays>>>>>", diffDays, "diffHrs>>>>>>", diffHrs, "diffMins>>>>>>>>>", diffMins)
        var policyForAcceptance = response[0]['policy_for_acceptance'];
        var policyForArrival = response[0]['policy_for_arrival'];
        var cancellationTime = '';
        var cancellationTimeType = '';
        var cancellationType = '';
        var cancellationTypeValue = '';
        var text = '';
        var acceptanceTotalPolicy = [];
        var arrialTotalPolicy = [];
        var cancel = '';
        if (policyForArrival == undefined || policyForArrival.length == 0) {
            policyForArrival = [];
            policyForArrival['policy'] = [];
        }
        var near = response[0].is_notified;
        if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0 && type != 2)) {

            if (policyForAcceptance['policy'] != undefined && policyForAcceptance['policy'].length != 0) {
                var acceptancePolicy = policyForAcceptance['policy'];
                if (type == 2) {
                    acceptancePolicy = acceptancePolicy.sort(compareTimeSalon);

                } else {
                    acceptancePolicy = acceptancePolicy.sort(compareTime);

                }

                for (var ac = 0; ac < acceptancePolicy.length; ac++) {
                    text = '';
                    if (type == 2) {
                        if (diffDays != 0) {
                            if ((diffDays <= acceptancePolicy[ac].cancellation_time)) {
                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " days of " + (type == 2 ? "salon" : 'stylist') + " before boooking time are subject to";
                                    text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} günü aştınız.`;

                                }
                            }
                        }
                        if (diffHrs != 0) {
                            if ((diffHrs <= acceptancePolicy[ac].cancellation_time)) {
                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " hours of " + (type == 2 ? "salon" : 'stylist') + " before boooking time are subject to";
                                    text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} saati aştınız.`;

                                }
                            }
                        }
                        if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {

                            if (diffMins <= acceptancePolicy[ac].cancellation_time) {

                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " mins of " + (type == 2 ? "salon" : 'stylist') + " before boooking time are subject to";
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
                                // text += " " + acceptancePolicy[ac].cancellation_type_value + " % of the service cost";
                                var flatamount = ((response.net_amount * response.surge) * acceptancePolicy[ac].cancellation_type_value) / 100;
                                if (flatamount < utility.minimumcancellationamount) {
                                    flatamount = utility.minimumcancellationamount;
                                }
                                text += ` İptal ederseniz ${flatamount} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                            }
                            if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                // text += " levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
                                text += ` İptal ederseniz ${acceptancePolicy[ac].cancellation_type_value} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                            }
                            acceptanceTotalPolicy.push(text);

                        }
                    } else {
                        if (diffDays != 0) {
                            if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " days of " + (type == 2 ? "salon" : 'stylist') + " acceptance are subject to";
                                    text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} günü aştınız.`;

                                }
                            }
                        }

                        else if (diffHrs != 0) {
                            if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " hours of " + (type == 2 ? "salon" : 'stylist') + " acceptance are subject to";
                                    text += `Ücretsiz iptal süreniz olan ${acceptancePolicy[ac].cancellation_time} saati aştınız.`;

                                }
                            }
                        }

                        else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {


                            if (diffMins >= acceptancePolicy[ac].cancellation_time) {
                                if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {

                                    // text += "Appointments cancelled " + acceptancePolicy[ac].cancellation_time + " mins of " + (type == 2 ? "salon" : 'stylist') + " acceptance are subject to";
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
                                // text += " " + acceptancePolicy[ac].cancellation_type_value + " % of the service cost";
                                var flatamount = ((response[0].net_amount * response[0].surge) * acceptancePolicy[ac].cancellation_type_value) / 100;
                                if (flatamount < utility.minimumcancellationamount) {
                                    flatamount = utility.minimumcancellationamount;
                                }
                                text += ` İptal ederseniz ${flatamount} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                            }
                            if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                // text += " levy a charge of flat " + acceptancePolicy[ac].cancellation_type_value
                                text += ` İptal ederseniz ${acceptancePolicy[ac].cancellation_type_value} TRY iptal ücreti tarafınıza yansıtılacaktır.`;

                            }

                            acceptanceTotalPolicy.push(text);
                        }
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
                    else if (diffHrs != 0 && diffDays == 0) {
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
                            // text += '  ' + arrivalPolicy[ar].cancellation_type_value + " % of the service cost";
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

        if (near == 1 && acceptanceTotalPolicy.length != 0 || ((policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) && type != 2) {

            cancel = acceptanceTotalPolicy[0];
        } else if (arrialTotalPolicy.length != 0) {
            cancel = arrialTotalPolicy[0];
        }

        if (cancel == '' || cancel == undefined) {
            cancel = (utility.errorMessages["no cancellation policy"][languageCode] != undefined ? utility.errorMessages["no cancellation policy"][languageCode] : utility.errorMessages["no cancellation policy"]['en']);
        }

        return res.send({ "success": true, "text": cancel })
    } else {
        if (response != undefined) {
            return res.send({
                "success": true,
                "text": (utility.errorMessages["no cancellation policy"][languageCode] != undefined ? utility.errorMessages["no cancellation policy"][languageCode] : utility.errorMessages["no cancellation policy"]['en'])

            });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
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
function compareTimeSalon(a, b) {
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
    if (min.a > min.b) {
        return 1
    }
    if (min.a < b.cancellation_time_type) {
        return -1;
    }
}
router.post('/create-schedule', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    var type = req.body.type;
    var slotType = req.body.slot_type;
    var date = req.body.date;
    var timezone = req.body.timezone;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (type == '' || type == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1

        });
    }
    if (date == '' || date == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 2

        });
    }
    if (timezone == '' || timezone == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 3
        });
    }

    var save = {};
    save['customer_id'] = userId;
    save['type'] = type;
    save['date'] = date;
    save['timezone'] = timezone;


    if (type == tables.scheduleBookingTable.type['1'].type) {
        var timebetween = req.body.timebetween;

        if (timebetween == '' || timebetween == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        save["slot_type"] = slotType;

        save['timebetween'] = timebetween;
        var time = timebetween.split('-');
        save['time'] = time[0];
    } else if (type == tables.scheduleBookingTable.type['2'].type) {
        var time = req.body.time;
        if (time == '' || time == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        save['time'] = time;
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });

    }
    save['status'] = 1;
    tables.scheduleBookingTable.save(save, function (response) {

        res.send({ "success": true, "message": "success", "schedule_id": response._id });

    });

});
router.post('/assign-schedule', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    var scheduleId = req.body.schedule_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (scheduleId == '' || scheduleId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    tables.cartTable.getCartDetails(userId, function (response) {
        if (response != undefined && response.length) {
            var cartId = [];
            for (var i = 0; i < response.length; i++) {
                var customerCartId = response[i]._id;
                cartId.push(customerCartId);
            }
            tables.cartTable.updateMany({
                'status': 3,
                "schedule_id": scheduleId
            }, { "_id": { "$in": cartId } }, function (response) {
                tables.scheduleBookingTable.update({
                    "cart_id": cartId,
                    "status": 2
                }, { "_id": scheduleId }, function (response) {
                    setTimeout(function () {
                        utility.curl.curl('schedule-booking-cron/' + scheduleId, function (response) {

                        });

                    }, 1000);
                    return res.send({ "success": true, "message": "schedule success" });
                });
            });
        }
    });
});
router.post('/location-update', function (req, res) {
    var vendor_id = req.body.vendor_id;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var data = {};

    data['location'] = { "type": "Point", "coordinates": [parseFloat(longitude), parseFloat(latitude)] };
    tables.vendorLocationTable.find({ "vendor_id": vendor_id }, function (response) {
        if (!response && response.length != 0) {
            tables.vendorLocationTable.update(data, { 'vendor_id': data }, function (response) {

                return res.send({ "success": true, "message": "success" })
            });
        } else {

            data['vendor_id'] = vendor_id;
            tables.vendorLocationTable.save(data, function (response) {
                return res.send({ "success": true, "message": "success" });
            });
        }

    });
});


router.post('/salon-details', async function (req, res) {
    var salonId = req.body.salon_id;
    var userId = req.body.user_id;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var languageCode = req.body.language_code;


    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (latitude == '' || latitude == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (longitude == '' || longitude == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var salonCondition = await tables.cartTable.findFieldsWithPromises({
        "customer_id": userId,
        "status": 1,
        "unfiltered_service": 1
    });
    if (salonCondition != undefined && salonCondition.length != 0) {

        if (salonCondition[0].salon_id != salonId) {
            return res.send({
                "success": false,
                "message": "cart items from another salon do u want to clear the cart or move to that salon?",
                "errorcode": 1,
                "clear_cart": 1,
                "salon_id": salonCondition[0].salon_id
            });
        }

    } else {

        var checkAllreadyadded = await tables.cartTable.findFieldsWithPromises({
            "customer_id": userId,
            "status": 1,
            "salon_id": salonId
        });
        if (checkAllreadyadded != undefined && checkAllreadyadded.length == 0) {
            var deleteCart = await tables.cartTable.updateCartWithPromises({ "status": 3 }, {
                "customer_id": userId,
                "cart_type": 2,
                "status": 1
            });
            var filteredItems = await tables.salonFilteredItemsTable.findFieldsWithPromises({ "customer_id": userId });
            if (filteredItems != undefined && filteredItems.length != 0) {
                var services = filteredItems[0].services;
                var serviceResponse = await tables.salonServicesTable.getPricesForTheSalon(salonId, services);
                var totall = [];
                for (var s = 0; s < serviceResponse.length; s++) {
                    var saveValues = {};
                    var serviceId = serviceResponse[s].service_id;
                    var categoryId = serviceResponse[s].category_id;
                    var serviceFor = serviceResponse[s].service_for;
                    var price = serviceResponse[s].service_cost;
                    var duration = serviceResponse[s].service_time;
                    var cityId = filteredItems[0].city_id;
                    var timeType = filteredItems[0].time_type;
                    var timeZone = filteredItems[0].timezone;
                    var time = '';
                    if (filteredItems[0].time == undefined || filteredItems[0].time == '') {
                        time = filteredItems[0].timebetween;
                    } else {
                        time = filteredItems[0].time;
                    }

                    saveValues['time_type'] = timeType;
                    duration = parseInt(duration);
                    var date = filteredItems[0].date;
                    saveValues["quantity"] = 1;
                    saveValues["duration"] = duration;
                    saveValues["customer_id"] = userId;
                    saveValues["service_id"] = serviceId;
                    saveValues["salon_id"] = salonId;
                    saveValues['type'] = 1;
                    saveValues['time'] = time;
                    saveValues['date'] = date;
                    saveValues['selected_time'] = time;
                    saveValues['selected_date'] = date;
                    saveValues['city_id'] = cityId;
                    saveValues["selected_for"] = serviceFor;
                    saveValues["category_id"] = categoryId;
                    saveValues["price"] = price;
                    saveValues["status"] = utility.CART_ITEM_ADDEED;
                    saveValues["cart_type"] = 2;
                    saveValues["filtered_service"] = 1;
                    saveValues["timezone"] = timeZone;
                    totall.push(saveValues);
                }
                var cartResponse = await tables.cartTable.insertManyWithPromises(totall);
            }
        }
    }
    tables.salonTable.getCustomerSalonDetails(salonId, userId, latitude, longitude, languageCode, function (response) {
        var salonViews = 0;
        if (response != undefined && response.length != 0) {
            if (req.app.io.sockets.available_rooms['views_' + salonId] == undefined) {
                req.app.io.sockets.available_rooms['views_' + salonId] = [];
            }
            salonViews = req.app.io.sockets.available_rooms['views_' + salonId].length;
            response[0].view = salonViews;


            return res.send({ "success": true, "details": response[0] });
        } else {
            return res.send({ "success": true, "details": {} });
        }

    });
});
router.post('/salon-staff', tokenValidations, function (req, res) {
    var salonId = req.body.salon_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.salonEmployeesTable.getSalonStaff(salonId, languageCode, function (response) {
        if (response != undefined) {
            return res.send({ "success": true, "details": response });

        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }
    });
});
router.post('/salon-staff-booking', tokenValidations, function (req, res) {
    var salonId = req.body.salon_id;
    var employeeId = req.body.employee_id;
    var cartId = req.body.cart_id;
    var languageCode = req.body.language_code;
    var time = req.body.time;
    var date = req.body.date;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (employeeId == '' || employeeId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (cartId == '' || cartId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    /* tables.cartTable.getServiceEndTime(cartId,function(response)
     {*/
    var update = {};
    update["employee_id"] = employeeId;


    if (time != '' && time != undefined) {
        update["time"] = time;
        update["date"] = date;

        if (time.indexOf('-') == -1) {
            update['time_type'] = 1;
        } else {
            update['time_type'] = 2;
        }
    } else {
    }
    tables.cartTable.update(update, { "_id": cartId }, function (response) {
        return res.send({ "success": true, "message": "employee assigned" });
    });
    /*  }); */


});

router.post('/salon-services', tokenValidations, function (req, res) {
    var salonId = req.body.salon_id;
    var cityId = req.body.city_id;
    var languageCode = req.body.language_code;
    var userId = req.body.user_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (cityId == '' || cityId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }


    tables.salonServicesTable.getSalonServices(salonId, cityId, userId, function (response) {
        //   return res.send(response);
        var data = {};
        if (response != undefined) {
            data['women'] = {};
            data['girl'] = {};

            data['men'] = {};
            data['boy'] = {};
            data['others'] = {};

            var servicesData = response[0];
            var womenCategoryOrder = 1;
            for (var w = 0; w < servicesData["women"].length; w++) {
                var women = servicesData['women'][w];
                var categoryName = women['category'].category_name["en"];
                var displayCategoryName = women['category'].category_name["en"];
                var categoryId = women['category'].category_id;
                var url = women['category'].url;
                var categoryVideoUrl = '';
                if (women['category'].video_url != undefined) {
                    categoryVideoUrl = women['category'].video_url[1];
                }
                var womenCategoryQuatity = 0;
                if (women['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = women['category'].category_name[languageCode];
                }
                if (data['women']['cat'] == undefined) {
                    data['women']['cat'] = {};
                }

                if (data['women']['cat'][categoryName] == undefined) {
                    data['women']['cat'][categoryName] = {};
                }
                data['women']['cat'][categoryName]['id'] = categoryId;
                data['women']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['women']['cat'][categoryName]['order'] = womenCategoryOrder;
                womenCategoryOrder++;
                data['women']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                data['women']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);
                var womenServicesOrder = 1;
                for (var s = 0; s < women['services'].length; s++) {
                    var womenServices = women['services'][s];
                    var serviceName = womenServices.service_name["en"];
                    var displayServiceName = womenServices.service_name["en"];
                    var serviceId = womenServices.service_id;
                    var serviceUrl = womenServices.url;

                    var duration = (womenServices.duration == undefined ? 0 : womenServices.duration);
                    var cartValues = womenServices.cartValue;
                    var cartId = 0;
                    var serviceQuantity = 0;
                    var selectedServiceLevel = 0;
                    if (cartValues.length != 0) {
                        cartId = (womenServices.cartValue[0]._id == undefined ? 0 : womenServices.cartValue[0]._id);
                        // var selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        serviceQuantity = (cartValues.length == undefined ? 0 : cartValues.length);
                    }
                    var servicePrice = womenServices.service_prices;
                    var vendorServiceLevels = womenServices.levels;
                    /*   for (var keys in servicePrice)
                       {

                           if (vendorServiceLevels.indexOf(keys))
                           {
                               delete servicePrice[keys];
                           }
                       }*/
                    womenCategoryQuatity = parseInt(womenCategoryQuatity) + parseInt(serviceQuantity);
                    if (data['women']['cat'][categoryName]['ser'] == undefined) {
                        data['women']['cat'][categoryName]['ser'] = {};
                    }
                    if (womenServices.service_name[languageCode] != undefined) {
                        displayServiceName = womenServices.service_name[languageCode];
                    }
                    var services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    services['price'] = servicePrice;
                    services['selected_service_quatity'] = serviceQuantity;
                    services['order'] = womenServicesOrder;
                    womenServicesOrder++;
                    services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['duration'] = duration;
                    services['cart_id'] = cartId;

                    data['women']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['women']['cat'][categoryName]['count'] = womenCategoryQuatity;


            }
            var girlCategoryOrder = 1;
            for (var g = 0; g < servicesData["girl"].length; g++) {
                var girl = servicesData['girl'][g];
                var categoryName = girl['category'].category_name["en"];
                var displayCategoryName = girl['category'].category_name["en"];
                var categoryId = girl['category'].category_id;
                var url = girl['category'].url;
                var girlCategoryQuatity = 0;
                var categoryVideoUrl = '';
                if (girl['category'].video_url != undefined) {
                    categoryVideoUrl = girl['category'].video_url[2];
                }
                // var categoryFor=response[i].cat.category_for;
                if (girl['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = girl['category'].category_name[languageCode];
                }
                if (data['girl']['cat'] == undefined) {
                    data['girl']['cat'] = {};
                }

                if (data['girl']['cat'][categoryName] == undefined) {
                    data['girl']['cat'][categoryName] = {};
                }
                data['girl']['cat'][categoryName]['id'] = categoryId;
                data['girl']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['girl']['cat'][categoryName]['order'] = girlCategoryOrder;
                girlCategoryOrder++;
                data['girl']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);

                data['girl']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                var girlServiceOrder = 1;
                for (var s = 0; s < girl['services'].length; s++) {
                    var girlServices = girl['services'][s];
                    var serviceName = girlServices.service_name["en"];
                    var displayServiceName = girlServices.service_name["en"];
                    var serviceId = girlServices.service_id;
                    var serviceUrl = girlServices.url;
                    var duration = (girlServices.duration == undefined ? 0 : girlServices.duration);

                    var cartValues = girlServices.cartValue;
                    var cartId = 0;
                    var serviceQuantity = 0;
                    var selectedServiceLevel = 0;
                    if (cartValues.length != 0) {
                        cartId = (girlServices.cartValue[0]._id == undefined ? 0 : girlServices.cartValue[0]._id);
                        // selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        serviceQuantity = (cartValues.length == undefined ? 0 : cartValues.length);

                    }
                    var vendorServiceLevels = girlServices.levels;

                    if (data['girl']['cat'][categoryName]['ser'] == undefined) {
                        data['girl']['cat'][categoryName]['ser'] = {};
                    }
                    if (girlServices.service_name[languageCode] != undefined) {
                        displayServiceName = girlServices.service_name[languageCode];
                    }
                    girlCategoryQuatity = parseInt(girlCategoryQuatity) + parseInt(serviceQuantity);
                    var services = {};
                    var servicePrice = girlServices.service_prices;

                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    services['price'] = servicePrice;
                    services['service_id'] = girlServices.service_id;
                    services['selected_service_quatity'] = serviceQuantity;

                    services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['duration'] = duration;
                    services['order'] = girlServiceOrder;
                    girlServiceOrder++;
                    services['cart_id'] = cartId;
                    data['girl']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['girl']['cat'][categoryName]['count'] = girlCategoryQuatity;
            }
            var menCategoryOrder = 1;
            for (var m = 0; m < servicesData["men"].length; m++) {
                var men = servicesData['men'][m];
                var categoryName = men['category'].category_name["en"];
                var displayCategoryName = men['category'].category_name["en"];
                var categoryId = men['category'].category_id;
                var url = men['category'].url;
                var menCategoryQuatity = 0;
                var categoryVideoUrl = '';
                if (men['category'].video_url != undefined) {
                    categoryVideoUrl = men['category'].video_url[3];
                }
                // var categoryFor=response[i].cat.category_for;
                if (men['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = men['category'].category_name[languageCode];
                }
                if (data['men']['cat'] == undefined) {
                    data['men']['cat'] = {};
                }

                if (data['men']['cat'][categoryName] == undefined) {
                    data['men']['cat'][categoryName] = {};
                }
                data['men']['cat'][categoryName]['id'] = categoryId;
                data['men']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['men']['cat'][categoryName]['order'] = menCategoryOrder;
                menCategoryOrder++;
                data['men']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);

                data['men']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                var menServiceOrder = 1;
                for (var s = 0; s < men['services'].length; s++) {
                    var menServices = men['services'][s];
                    var serviceName = menServices.service_name["en"];
                    var displayServiceName = menServices.service_name["en"];
                    var serviceId = menServices.service_id;
                    var serviceUrl = menServices.url;
                    var duration = (menServices.duration == undefined ? 0 : menServices.duration);
                    var cartValues = menServices.cartValue;
                    var cartId = 0;
                    var serviceQuantity = 0;
                    var selectedServiceLevel = 0;
                    if (cartValues.length != 0) {
                        cartId = (menServices.cartValue[0]._id == undefined ? 0 : menServices.cartValue[0]._id);
                        // selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        serviceQuantity = (cartValues.length == undefined ? 0 : cartValues.length);

                    }
                    var vendorServiceLevels = menServices.levels;
                    /*    for (var keys in servicePrice)
                        {

                            if (vendorServiceLevels.indexOf(keys))
                            {

                                delete servicePrice[keys];
                            }
                        }*/
                    var servicePrice = menServices.service_prices;

                    menCategoryQuatity = parseInt(menCategoryQuatity) + parseInt(serviceQuantity);

                    if (data['men']['cat'][categoryName]['ser'] == undefined) {
                        data['men']['cat'][categoryName]['ser'] = {};
                    }
                    if (menServices.service_name[languageCode] != undefined) {
                        displayServiceName = menServices.service_name[languageCode];
                    }
                    var services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    services['price'] = servicePrice;
                    services['service_id'] = menServices.service_id;
                    services['selected_service_quatity'] = serviceQuantity;

                    services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['order'] = menServiceOrder;
                    menServiceOrder++;
                    services['duration'] = duration;
                    services['cart_id'] = cartId;
                    data['men']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['men']['cat'][categoryName]['count'] = menCategoryQuatity;
            }
            var boyCategoryOrder = 1;
            for (var b = 0; b < servicesData["boy"].length; b++) {
                var boy = servicesData['boy'][b];
                var categoryName = boy['category'].category_name["en"];
                var displayCategoryName = boy['category'].category_name["en"];
                var categoryId = boy['category'].category_id;
                var url = boy['category'].url;
                var boyCategoryQuatity = 0;
                var categoryVideoUrl = '';
                if (boy['category'].video_url != undefined) {
                    categoryVideoUrl = boy['category'].video_url[4];
                }
                // var categoryFor=response[i].cat.category_for;
                if (boy['category'].category_name[languageCode] != undefined) {
                    displayCategoryName = boy['category'].category_name[languageCode];
                }
                if (data['boy']['cat'] == undefined) {
                    data['boy']['cat'] = {};
                }

                if (data['boy']['cat'][categoryName] == undefined) {
                    data['boy']['cat'][categoryName] = {};
                }
                data['boy']['cat'][categoryName]['id'] = categoryId;
                data['boy']['cat'][categoryName]['display_name'] = displayCategoryName;
                data['boy']['cat'][categoryName]['order'] = boyCategoryOrder;
                boyCategoryOrder++;
                data['boy']['cat'][categoryName]['video'] = ((categoryVideoUrl == undefined) ? '' : categoryVideoUrl);

                data['boy']['cat'][categoryName]['url'] = ((url == undefined) ? '' : url);
                var boyServiceOrder = 1;
                for (var s = 0; s < boy['services'].length; s++) {
                    var boyServices = boy['services'][s];
                    var serviceName = boyServices.service_name["en"];
                    var displayServiceName = boyServices.service_name["en"];
                    var serviceId = boyServices.service_id;
                    var cartValues = boyServices.cartValue;
                    var cartId = 0;
                    var serviceQuantity = 0;
                    var selectedServiceLevel = 0;
                    if (cartValues.length != 0) {
                        cartId = (boyServices.cartValue[0]._id == undefined ? 0 : boyServices.cartValue[0]._id);
                        // selectedServiceLevel = (womenServices.cartValue.selected_service_level == undefined ? 0 : womenServices.cartValue.selected_service_level);
                        serviceQuantity = (cartValues.length == undefined ? 0 : cartValues.length);
                    }
                    var servicePrice = boyServices.service_prices;
                    var vendorServiceLevels = boyServices.levels;
                    var duration = (boyServices.duration == undefined ? 0 : boyServices.duration);
                    /*    for (var keys in servicePrice) {

                            if (vendorServiceLevels.indexOf(keys)) {
                                delete servicePrice[keys];
                            }
                        }*/
                    var serviceUrl = boyServices.url;
                    if (data['boy']['cat'][categoryName]['ser'] == undefined) {
                        data['boy']['cat'][categoryName]['ser'] = {};
                    }
                    if (boyServices.service_name[languageCode] != undefined) {
                        displayServiceName = boyServices.service_name[languageCode];
                    }
                    boyCategoryQuatity = parseInt(boyCategoryQuatity) + parseInt(serviceQuantity);

                    var services = {};
                    services['display_name'] = displayServiceName;
                    services['url'] = ((serviceUrl == undefined) ? '' : serviceUrl);
                    services['price'] = servicePrice;
                    services['service_id'] = boyServices.service_id;
                    services['selected_service_quatity'] = serviceQuantity;

                    services['selected_service_level'] = selectedServiceLevel;
                    services['service_id'] = serviceId;
                    services['duration'] = duration;
                    services['order'] = boyServiceOrder;
                    boyServiceOrder++;
                    services['cart_id'] = cartId;
                    data['boy']['cat'][categoryName]['ser'][serviceName] = services;
                    //    data['women']['cat'][categoryName]['sub'][subCategoryName]=subCategory;
                }
                data['boy']['cat'][categoryName]['count'] = boyCategoryQuatity;
            }
            var currency_type = '';
            var currency_code = '';

            if (servicesData['country'].length != 0) {
                currency_type = (servicesData['country'][0]['currency'] == undefined ? '' : servicesData['country'][0]['currency']);
                currency_code = (servicesData['country'][0]['currency_code'] == undefined ? '' : servicesData['country'][0]['currency']);
            }
            return res.send({
                "success": true,
                "category_data": data,
                "currency_type": currency_type,
                "currency_code": currency_code
            });
        } else {
            return res.send({
                "success": false,
                "message":
                    (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            });
        }

    });
});
router.post('/suggest-stylist', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var type = req.body.type;
    if (type == 1) {
        var scheduleId = req.body.schedule_id;
        tables.scheduleBookingTable.getScheduleCartDetails(scheduleId, function (cartResponse) {
            if (cartResponse != undefined && cartResponse.length != 0) {


                var latitude = cartResponse[0].latitude;
                var longitude = cartResponse[0].longitude;
                tables.vendorLocationTable.getAvaliableStylists(latitude, longitude, languageCode, function (vendorResponse) {

                    var providingServices = [];
                    var assignedList = [];
                    var unassignedCat = [];
                    for (var i = 0; i < vendorResponse.length; i++) {
                        var vendorServices = vendorResponse[i].services;
                        var vendorId = vendorResponse[i].vendor_id;
                        var cartDetails = cartResponse;
                        for (var v = 0; v < vendorServices.length; v++) {
                            var vendorServiceId = vendorServices[v].service_id;
                            var service = {};

                            for (var c = 0; c < cartDetails.length; c++) {
                                var vendor = {};

                                var cartServiceId = cartDetails[c].service_id;
                                var serviceCartId = cartDetails[c]._id;

                                var cartVendorId = cartDetails[c].vendor_id;
                                if (cartVendorId == undefined || cartVendorId == '') {

                                    if (cartServiceId.toString() == vendorServiceId.toString()) {
                                        var serviceFor = parseInt(cartDetails[c].selected_for.toString());
                                        var serviceLevel = parseInt(cartDetails[c].selected_service_level.toString());

                                        if (vendorServices[v]['service_for'] == serviceFor) {
                                            if (vendorServices[v]['service_levels'].indexOf(serviceLevel) != -1) {
                                                //service['cart_id']=cartId;
                                                //service['vendor_id']=vendorId;
                                                cartResponse[c].vendor_id = vendorId;
                                                vendor['vendor_id'] = vendorId;
                                                vendor['cart_id'] = serviceCartId;
                                                vendor['profile_pic'] = vendorResponse[i].profile_pic;
                                                vendor['name'] = vendorResponse[i].name;
                                                vendor['latitude'] = vendorResponse[i].latitude;
                                                vendor['nationality'] = vendorResponse[i].nationality;
                                                vendor['longitude'] = vendorResponse[i].longitude;
                                                assignedList.push(vendor);
                                                providingServices.push(serviceCartId);
                                                var index = unassignedCat.indexOf(serviceCartId);
                                                if (index > -1) {
                                                    unassignedCat.splice(index, 1);
                                                }
                                            } else {
                                                var index = unassignedCat.indexOf(serviceCartId);
                                                if (index == -1) {
                                                    unassignedCat.push(serviceCartId);
                                                }
                                            }
                                        } else {
                                            var index = unassignedCat.indexOf(serviceCartId);
                                            if (index == -1) {
                                                unassignedCat.push(serviceCartId);
                                            }
                                        }
                                    } else {
                                        var index = unassignedCat.indexOf(serviceCartId);
                                        if (index == -1) {
                                            unassignedCat.push(serviceCartId);
                                        }

                                    }

                                }
                            }
                        }

                        //res.send(assignedList);

                        /* tables.cartTable.updateMany({"vendor_id": vendorId}, {"_id": {"$in": providingServices}}, function (response) {
                         res.send({"success": true, "cartId": providingServices, "vendor": vendor});
                         });   */
                    }
                    if (unassignedCat.length != 0 && assignedList.length == 0) {
                        return res.send({ "success": true, "assigned_list": [], "unassigned_list": unassignedCat })
                    } else if (unassignedCat.length == 0 && assignedList.length == 0) {
                        return res.send({ "success": false, "message": utility.errorMessages["No stylist Found"][languageCode] })
                    } else {
                        suggestStylist(assignedList, 0, res, unassignedCat);
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                    "errocode": 4
                });
            }
        });
    } else {
        tables.cartTable.getCartDetails(userId, function (cartResponse) {
            if (cartResponse != undefined && cartResponse.length != 0) {
                var latitude = cartResponse[0].latitude;
                var longitude = cartResponse[0].longitude;
                tables.vendorLocationTable.getAvaliableStylists(latitude, longitude, languageCode, function (vendorResponse) {
                    var providingServices = [];
                    var assignedList = [];
                    var unassignedCat = [];
                    for (var i = 0; i < vendorResponse.length; i++) {
                        var vendorServices = vendorResponse[i].services;
                        var vendorId = vendorResponse[i].vendor_id;
                        var cartDetails = cartResponse;
                        for (var v = 0; v < vendorServices.length; v++) {
                            var vendorServiceId = vendorServices[v].service_id;
                            var service = {};

                            for (var c = 0; c < cartDetails.length; c++) {
                                var vendor = {};

                                var cartServiceId = cartDetails[c].service_id;
                                var serviceCartId = cartDetails[c]._id;

                                var cartVendorId = cartDetails[c].vendor_id;
                                if (cartVendorId == undefined || cartVendorId == '') {

                                    if (cartServiceId.toString() == vendorServiceId.toString()) {
                                        var serviceFor = parseInt(cartDetails[c].selected_for.toString());
                                        var serviceLevel = parseInt(cartDetails[c].selected_service_level.toString());

                                        if (vendorServices[v]['service_for'] == serviceFor) {
                                            if (vendorServices[v]['service_levels'].indexOf(serviceLevel) != -1) {
                                                //service['cart_id']=cartId;
                                                //service['vendor_id']=vendorId;
                                                cartResponse[c].vendor_id = vendorId;
                                                vendor['vendor_id'] = vendorId;
                                                vendor['cart_id'] = serviceCartId;
                                                vendor['profile_pic'] = vendorResponse[i].profile_pic;
                                                vendor['name'] = vendorResponse[i].name;
                                                vendor['latitude'] = vendorResponse[i].latitude;
                                                vendor['nationality'] = vendorResponse[i].nationality;
                                                vendor['longitude'] = vendorResponse[i].longitude;
                                                assignedList.push(vendor);
                                                providingServices.push(serviceCartId);
                                                var index = unassignedCat.indexOf(serviceCartId);
                                                if (index > -1) {
                                                    unassignedCat.splice(index, 1);
                                                }
                                            } else {
                                                var index = unassignedCat.indexOf(serviceCartId);
                                                if (index == -1) {
                                                    unassignedCat.push(serviceCartId);
                                                }
                                            }
                                        } else {
                                            var index = unassignedCat.indexOf(serviceCartId);
                                            if (index == -1) {
                                                unassignedCat.push(serviceCartId);
                                            }
                                        }
                                    } else {
                                        var index = unassignedCat.indexOf(serviceCartId);
                                        if (index == -1) {
                                            unassignedCat.push(serviceCartId);
                                        }

                                    }

                                }
                            }
                        }

                        //res.send(assignedList);

                        /* tables.cartTable.updateMany({"vendor_id": vendorId}, {"_id": {"$in": providingServices}}, function (response) {
                         res.send({"success": true, "cartId": providingServices, "vendor": vendor});
                         });   */
                    }
                    if (unassignedCat.length != 0 && assignedList.length == 0) {
                        return res.send({ "success": true, "assigned_list": [], "unassigned_list": unassignedCat })
                    } else if (unassignedCat.length == 0 && assignedList.length == 0) {
                        return res.send({ "success": false, "message": utility.errorMessages["No stylist Found"][languageCode] })
                    } else {
                        suggestStylist(assignedList, 0, res, unassignedCat);
                    }
                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please select cart items"][languageCode] != undefined ? utility.errorMessages["Please select cart items"][languageCode] : utility.errorMessages["Please select cart items"]['en']),
                    "errocode": 4
                });
            }
        });
    }
});
router.post('/choose-stylist', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var languageCode = req.body.language_code;
    var bookingId = req.body.booking_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.getBookingCartDetails(bookingId, async function (response) {
        if (response != undefined && response.length != 0) {
            var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": response[0].cart[0].city_id }, { "time_zone": 1 });
            var timeZone = '';
            if (cityDetails != undefined && cityDetails.length != 0) {
                timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
            }
            var rejectVendors = [];
            tables.vendorLocationTable.getStylistForBooking(response, timeZone, rejectVendors, languageCode, function (result) {

                if (result != undefined && result.length != 0) {
                    return res.send({ "success": true, "stylist": result });

                } else {
                    return res.send({ "success": true, "stylist": [] });
                }

            });
        } else {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});
router.post('/booking-suggest-stylist', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var languageCode = req.body.language_code;
    var bookingId = req.body.booking_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.getBookingCartDetails(bookingId, async function (response) {
        if (response != undefined) {
            var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "reject_vendors": 1 });
            var rejectVendors = [];
            if (bookingDetails != undefined && bookingDetails.length != 0 && bookingDetails[0]['reject_vendors'].length != 0) {
                rejectVendors = bookingDetails[0]['reject_vendors']
            }
            var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": response[0].cart[0].city_id }, { "time_zone": 1 });
            var timeZone = '';
            if (cityDetails != undefined && cityDetails.length != 0) {
                timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
            }
            tables.vendorLocationTable.getStylistForBooking(response, timeZone, rejectVendors, languageCode, function (result) {
                if (result != undefined && result.length != 0) {

                    var vendorId = result[0].vendor_id;

                    tables.bookingsTable.update({
                        "vendor_id": vendorId,
                        "booking_requested": new Date()
                    }, { "_id": bookingId }, async function (bookingDetails) {
                        if (bookingDetails != undefined && bookingDetails.length != 0) {
                            var vendorId = bookingDetails.vendor_id;
                            var userId = bookingDetails.customer_id;
                            var update = await tables.stylistTable.updateWithPromises({ "booking_status": 1 }, { "vendor_id": vendorId });
                            var bookingUpdateResponse = await tables.bookingsTable.updateWithPromises({ "status": 1 }, { "_id": bookingId });
                            var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                                "first_name": 1,
                                "last_name": 1
                            });

                            var salonDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, {
                                "salon_id": 1,
                                "type": 1
                            });
                            var stylistType = salonDetails[0].type;
                            if (stylistType == utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {


                                var salonId = salonDetails[0].salon_id;
                                // var vendorDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
                                vendorId = salonId;
                            }
                            var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                            var customerName = 'customer';
                            if (customerResponse != undefined && customerResponse.length != 0) {
                                customerName = customerResponse[0].first_name['tr'];
                            }
                            var format = 'YYYY-MM-DD HH:mm:ss';

                            var presentDateTime = moment().utc().format(format);
                            // var data = {
                            //     "title": "new Booking",
                            //     "message": "There  is booking  from " + customerName,
                            //     "booking_id": bookingId,
                            //     "type": stylistType,
                            //     "request_time": presentDateTime,
                            //     "stylist_type": stylistType
                            // };
                            var data = {
                                "title": "Rezervasyon Bilgilendirmesi",
                                "message": `${customerName} tarafından rezervasyon talebi yapıldı.`,
                                "booking_id": bookingId,
                                "type": stylistType,
                                "request_time": presentDateTime,
                                "stylist_type": stylistType
                            };

                            data['country_id'] = bookingDetails.customer_country_details.country_id;
                            data['city_id'] = bookingDetails.customer_country_details.city_id;
                            data['customer_id'] = userId;
                            data['vendor_id'] = vendorId;
                            tables.notificationsTable.save(data, function (response) {

                            });
                            if (fcmResponse != undefined && fcmResponse.length != 0) {
                                if (fcmResponse[0].fcm_id != undefined) {

                                    utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                                }
                            }
                            res.send({ "success": true, "stylist": result[0], "created_at": presentDateTime });

                            /*if(sockets[vendorId]!=undefined)
                            {*/
                            /*for(var i=0;i<sockets[vendorId].length;i++)
                            {

                                if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined){
                                    req.app.io.sockets.sockets[sockets[vendorId][i]].emit("order",{"booking_id":bookingId});
                                }else
                                {
                                    sockets[vendorId].slice(i,1);
                                }
                            }*/

                            req.app.io.sockets.in(vendorId).emit("order", {
                                "booking_id": bookingId,
                                "notification_data": data
                            });

                            /*}*/

                            setTimeout(function () {
                                timeOutStylist(bookingId, req.app.io)
                            }, 30000);
                        } else {
                            return res.send({
                                "success": false,
                                "message": utility.errorMessages["stylist not avalible"][languageCode]
                            });
                        }


                    });
                } else {
                    return res.send({ "success": false, "stylist": {}, "message": "no stylist found" });
                }
            });
        } else {
            res.send({
                "success": false,
                "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
            })
        }
    });
});

router.post('/salon-cart-update', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    var saveValues = {};

    var type = req.body.type;
    var salonId = req.body.salon_id;
    if (type == 1) {
        var quantity = req.body.quantity;
        var price = req.body.price;
        var serviceFor = req.body.service_for;
        var serviceId = req.body.service_id;
        var categoryId = req.body.category_id;
        var vendorId = req.body.vendor_id;
        var cityId = req.body.city_id;


        if (salonId == '' || salonId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (price == '' || price == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (serviceFor == '' || serviceFor == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (serviceId == '' || serviceId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (categoryId == '' || categoryId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        if (cityId == '' || cityId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }

        var checkSalonPackage = await tables.cartTable.findFieldsWithPromises({
            "customer_id": userId,
            "status": 1,
            'is_package': 1
        }, { "_id": 1 });


        if (checkSalonPackage != undefined && checkSalonPackage.length != 0) {
            return res.send({ "success": false, "message": "Please delete the salon package for booking of services" });
        }

        tables.salonFilteredItemsTable.find({ "customer_id": userId }, async function (response) {
            if (response != undefined && response.length != 0) {
                var time = response[0].time;
                var timebetween = response[0].timebetween;
                var date = response[0].date;
                var timezone = response[0].timezone;
                if (time != '' && time != undefined) {
                    time = time.split(":");
                    time = time[0] + ":" + time[1];
                    saveValues['time_type'] = 1;
                }
                saveValues['timezone'] = timezone;
            } else {
                var end = new Date();
                var date = end.getFullYear() + "-" + ("0" + (end.getMonth() + 1)).slice(-2) + "-" + ("0" + end.getDate()).slice(-2);
                var salonDetails = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "city_id": 1 });
                var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": salonDetails[0].city_id }, { "time_zone": 1 });
                var timezone = cityDetails[0].time_zone;
                // var timezone='Asia/Dubai';
                var time = moment().tz(timezone).format();
                var dateTimeString = moment(time, "YYYY-MM-DD HH:mm:ss").add(2, 'h');
                var date = dateTimeString.format("YYYY-MM-DD");
                var timeString = dateTimeString.format('HH:mm');
                //time=new Date(time);
                //  var time =new Date();
                //  var endTime=time.setHours(new Date().getHours()+2);
                //  var  timeString=time.toLocaleTimeString();

                timeString = timeString.split(":");
                timeString = ((timeString[0].length < 2) ? '0' + timeString[0] : timeString[0]) + ":" + ((timeString[1].length < 2) ? '0' + timeString[1] : timeString[1]);
                time = timeString;
                saveValues['time_type'] = 1;
                saveValues['timezone'] = timezone;
            }
            if (time == undefined || time == '') {
                saveValues['time_type'] = 2;
                time = timebetween;
            }
            var selectedServiceTimeResponse = await tables.salonServicesTable.findFieldsWithPromises({
                "salon_id": salonId,
                "service_id": serviceId, "service_for": serviceFor, "status": { "$eq": 1 }
            }, { "service_time": 1, "service_cost": 1 });
            price = selectedServiceTimeResponse[0]['service_cost'];
            tables.cartTable.find({
                "customer_id": userId,
                "cart_type": 2,
                "status": utility.CART_ITEM_ADDEED
            }, function (response) {
                saveValues['duration'] = selectedServiceTimeResponse[0].service_time;
                saveValues["quantity"] = 1;
                saveValues["customer_id"] = userId;
                saveValues["service_id"] = serviceId;
                saveValues["salon_id"] = salonId;
                saveValues['type'] = 1;
                saveValues['time'] = time;
                saveValues['date'] = date;
                saveValues['city_id'] = cityId;
                saveValues["selected_for"] = serviceFor;
                saveValues["category_id"] = categoryId;
                saveValues["price"] = price;
                saveValues["status"] = utility.CART_ITEM_ADDEED;
                saveValues["cart_type"] = 2;
                saveValues['selected_time'] = time;
                saveValues['selected_date'] = date;
                if (response != undefined && response.length != 0) {
                    // check  which salon is added

                    if (response[0].filtered_service != undefined) {
                        saveValues['unfiltered_service'] = 1;
                    }
                    saveValues["payment_type"] = response[0]['payment_type'];
                    if (response[0]['payment_type'] == utility.PAYMENT_TYPE_CARD) {
                        saveValues["card_id"] = response[0]['card_id'];
                    }

                    if (response[0].salon_id != salonId) {
                        tables.cartTable.updateMany({ "status": 3 }, {
                            "salon_id": salonId,
                            "status": utility.CART_ITEM_ADDEED,
                            "customer_id": userId
                        }, function (response) {

                            tables.cartTable.save(saveValues, function (response) {

                                tables.cartTable.salonCartCount(userId, function (cartResponse) {

                                    if (cartResponse == undefined) {
                                        return res.send({
                                            "success": true,
                                            "message": "updated",
                                            "cart_id": response._id,
                                            "cart_details": []
                                        });
                                    } else {
                                        return res.send({
                                            "success": true,
                                            "message": "updated",
                                            "cart_id": response._id,
                                            "cart_details": cartResponse[0]
                                        });
                                    }

                                });


                            });
                        });
                    } else {
                        tables.cartTable.save(saveValues, function (response) {

                            tables.cartTable.salonCartCount(userId, function (cartResponse) {
                                if (cartResponse == undefined) {
                                    return res.send({
                                        "success": true,
                                        "message": "updated",
                                        "cart_id": response._id,
                                        "cart_details": []
                                    });
                                } else {
                                    return res.send({
                                        "success": true,
                                        "message": "updated",
                                        "cart_id": response._id,
                                        "cart_details": cartResponse[0]
                                    });
                                }

                            });


                        });
                    }
                } else {
                    saveValues['unfiltered_service'] = 1;

                    tables.cartTable.save(saveValues, function (response) {
                        tables.cartTable.salonCartCount(userId, function (cartResponse) {
                            if (cartResponse == undefined) {
                                return res.send({
                                    "success": true,
                                    "message": "updated",
                                    "cart_id": response._id,
                                    "cart_details": []
                                });
                            } else {
                                return res.send({
                                    "success": true,
                                    "message": "updated",
                                    "cart_id": response._id,
                                    "cart_details": cartResponse[0]
                                });
                            }

                        });


                    });
                }
            });
        });
        ////  salon cart add  backup  start
        /* tables.cartTable.find({
             "customer_id": userId,
             "service_id": serviceId,
             "salon_id": salonId,
             "selected_for": serviceFor,
             "status": {"$eq": utility.CART_ITEM_ADDEED},
             "cart_type": 2
         },function(response){
             if (response != undefined && response.length == 0) {
                 saveValues["quantity"] = 1;
                 saveValues["customer_id"] = userId;
                 saveValues["service_id"] = serviceId;
                 saveValues["salon_id"] = salonId;
                 saveValues['type'] = 1;

                 saveValues['city_id'] = cityId;
                 saveValues["selected_for"] = serviceFor;
                 saveValues["category_id"] = categoryId;
                 saveValues["price"] = price;
                 saveValues["status"] = utility.CART_ITEM_ADDEED;
                 saveValues["cart_type"] = 2;
                 tables.cartTable.save(saveValues, function (response) {

                    tables.cartTable.salonCartCount(userId,function(cartResponse){
                        if(cartResponse == undefined) {
                            return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":[]});
                        }else {
                            return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":cartResponse[0]});
                        }

                    });


                 });
             } else if (response != undefined){
                /!* var cartId = response[0]._id;

                 saveValues["quantity"] = quantity;
                 saveValues["price"] = price;
                 saveValues["salon_id"] = salonId;

                 tables.cartTable.update(saveValues, {"_id": cartId}, function (updateResponse) {

                     tables.cartTable.salonCartCount(userId,function(cartResponse){

                         return res.send({"success": true, "message": "updated",  "cart_id": updateResponse._id,"cart_details":cartResponse[0]});
                     });

                    // return res.send({"success": true, "message": "updated", "cart_id": updateResponse._id});
                 });
 *!/
                 saveValues["quantity"] = 1;
                 saveValues["customer_id"] = userId;
                 saveValues["service_id"] = serviceId;
                 saveValues["salon_id"] = salonId;
                 saveValues['type'] = 1;

                 saveValues['city_id'] = cityId;
                 saveValues["selected_for"] = serviceFor;
                 saveValues["category_id"] = categoryId;
                 saveValues["price"] = price;
                 saveValues["status"] = utility.CART_ITEM_ADDEED;
                 saveValues["cart_type"] = 2;
                 tables.cartTable.save(saveValues, function (response) {


                     tables.cartTable.salonCartCount(userId,function(cartResponse){
                         if(cartResponse == undefined) {
                             return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":[]});
                         }else {
                             return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":cartResponse[0]});
                         }
                     });


                 });

             } else {
                 res.send(response);
             }
         });*/
        ////  salon cart add  backup  end
    } else if (type == 2) {

        var quantity = req.body.quantity;
        var packageId = req.body.package_id;
        var price = req.body.price;
        var cityId = req.body.city_id;
        if (salonId == '' || salonId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (quantity == '' || quantity == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (packageId == '' || packageId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        if (cityId == '' || cityId == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            });
        }
        tables.cartTable.find({
            "customer_id": userId,
            "package_id": packageId,
            "salon_id": salonId,
            "status": {
                "$eq": utility.CART_ITEM_ADDEED
            }
        }, async function (response) {
            if (response != undefined) {
                var salonFilteredResponse = await tables.salonFilteredItemsTable.findFieldsWithPromises({ "customer_id": userId }, {
                    "time": 1,
                    "timebetween": 1,
                    "date": 1,
                    "timezone": 1
                });
                var timeType = 1;
                if (salonFilteredResponse != undefined && salonFilteredResponse.length != 0) {
                    var time = salonFilteredResponse[0].time;
                    var timebetween = salonFilteredResponse[0].timebetween;
                    var date = salonFilteredResponse[0].date;
                    var timezone = salonFilteredResponse[0].timezone;
                    if (time != '' && time != undefined) {
                        time = time.split(":");
                        time = time[0] + ":" + time[1];
                    }
                    timeType = 1;
                } else {
                    var end = new Date();
                    var date = end.getFullYear() + "-" + ("0" + (end.getMonth() + 1)).slice(-2) + "-" + ("0" + end.getDate()).slice(-2);
                    var salonDetails = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "city_id": 1 });
                    var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": salonDetails[0].city_id }, { "time_zone": 1 });
                    var timezone = cityDetails[0].time_zone;
                    // var timezone='Asia/Dubai';
                    var time = moment().tz(timezone).format();
                    var dateTimeString = moment(time, "YYYY-MM-DD HH:mm:ss").add(2, 'h');
                    var date = dateTimeString.format("YYYY-MM-DD");
                    var timeString = dateTimeString.format('HH:mm');
                    //time=new Date(time);
                    //  var time =new Date();
                    //  var endTime=time.setHours(new Date().getHours()+2);
                    //  var  timeString=time.toLocaleTimeString();

                    timeString = timeString.split(":");
                    timeString = ((timeString[0].length < 2) ? '0' + timeString[0] : timeString[0]) + ":" + ((timeString[1].length < 2) ? '0' + timeString[1] : timeString[1]);
                    time = timeString;
                    //  var timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
                    timeType = 1;
                }
                if (time == undefined || time == '') {
                    timeType = 2;
                    time = timebetween;
                }

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
                        saveValues['time_type'] = timeType;
                        saveValues['quantity'] = 1;
                        saveValues["price"] = price;
                        saveValues["status"] = utility.CART_ITEM_ADDEED;
                        saveValues["package_amount"] = packageDetails[0].package_amount;
                        saveValues["package_id"] = packageId;
                        saveValues["cart_type"] = 2;
                        saveValues['selected_time'] = time;
                        saveValues['selected_date'] = date;
                        save.push(saveValues);
                    }
                }
                var updateCart = await tables.cartTable.updateManyWithPromises({ "status": 2 }, { "customer_id": userId, "status": 1, "cart_type": 2 })
                var response = await tables.cartTable.insertManyWithPromises(save);

                tables.cartTable.salonCartCount(userId, function (cartResponse) {
                    return res.send({
                        "success": true,
                        "message": "add cart updated ",
                        "cart_id": packageId,
                        "cart_details": cartResponse[0]
                    });
                });
            } else if (response != undefined && response.length != 0) {
                var cartId = response[0]._id;
                var salveVales = {};
                saveValues['salon_id'] = salonId;

                saveValues["quantity"] = quantity;
                saveValues["price"] = price;
                tables.cartTable.update(saveValues, { "_id": cartId }, function (updateResponse) {

                    tables.cartTable.salonCartCount(userId, function (cartResponse) {
                        return res.send({
                            "success": true,
                            "message": "package updated",
                            "cart_id": updateResponse._id,
                            "cart_details": cartResponse[0]
                        });
                    });


                    // return res.send({"success": true, "message": "updated", "cart_id": response._id});
                });
            } else {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languagesCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
            }
        });
    } else if (type == 3) {
        var cartId = req.body.cart_id;
        var serviceFor = req.body.service_for;
        var serviceId = req.body.service_id;
        /* if(quantity == '' || quantity == undefined){
             return res.send({
                 "success": false,
                 "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
             });
         }*/
        /* if (price == '' || price == undefined){
             return res.send({
                 "success": false,
                 "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
             });
         }*/
        saveValues['status'] = 4;
        tables.cartTable.update(saveValues, {
            "customer_id": userId, "cart_type": 2, "status": 1,
            "service_id": serviceId,
            "selected_for": serviceFor
        }, function (response) {
            tables.cartTable.salonCartCount(userId, function (cartResponse) {
                if (cartResponse.length != 0) {
                    return res.send({
                        "success": true,
                        "message": "updated",
                        "cart_id": response._id,
                        "cart_details": cartResponse[0]
                    });
                } else {
                    return res.send({ "success": true, "message": "updated", "cart_id": 0 });
                }
            });
            // return res.send({"success": true, "message": "updated", "cart_id": 0});
        });
        //old cart itmes
        /*  if (quantity != 0) {
              saveValues["quantity"] = 1;
              saveValues["customer_id"] = userId;
              saveValues["service_id"] = serviceId;
              saveValues["salon_id"] = salonId;
              saveValues['type'] = 1;

              saveValues['city_id'] = cityId;
              saveValues["selected_for"] = serviceFor;
              saveValues["category_id"] = categoryId;
              saveValues["price"] = price;
              saveValues["status"] = utility.CART_ITEM_ADDEED;
              saveValues["cart_type"] = 2;
  /!*
              tables.cartTable.update(saveValues, {"_id": cartId}, function (response) {
                  tables.cartTable.salonCartCount(userId,function(cartResponse){
                      if(cartResponse == undefined) {
                          return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":[]});
                      }else {
                          return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":cartResponse[0]});
                      }

                  });

                //  return res.send({"success": true, "message": "updated", "cart_id": response._id});
              });*!/
              tables.cartTable.save(saveValues, function (response) {

                  tables.cartTable.salonCartCount(userId,function(cartResponse){
                      if(cartResponse == undefined) {
                          return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":[]});
                      }else {
                          return res.send({"success": true, "message": "updated", "cart_id": response._id,"cart_details":cartResponse[0]});
                      }

                  });


              });
          } else {
              saveValues['status'] = 4;
              tables.cartTable.update(saveValues, {"_id": cartId}, function (response) {
                  tables.cartTable.salonCartCount(userId,function(cartResponse){

                      if(cartResponse.length!=0)
                      {
                          return res.send({"success": true, "message": "updated", "cart_id": 0,"cart_details":cartResponse[0]});
                      }else
                      {
                          return res.send({"success": true, "message": "updated", "cart_id": 0});

                      }
                  });

                  // return res.send({"success": true, "message": "updated", "cart_id": 0});
              });
          }*/
    } else if (type == 4) {
        var paymentType = req.body.payment_type;
        if (paymentType == '' || paymentType == undefined) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
                ,
                "error_code": 2
            })
        }
        paymentType = parseInt(paymentType);

        if (!utility.isValidPayment(paymentType)) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "error_code": 3
            });
        }

        if (paymentType === utility.PAYMENT_TYPE_CARD) {
            var customerDetails = await tables.customerTable.getPaymentDefaultCard(userId);

            if (!customerDetails || !customerDetails[0] || !customerDetails[0]['payment']) {
                return res.send({
                    "success": false,
                    "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
                    "error_code": 4,
                    "card_details": {}
                });
            }

            var cardId = '';

            if (customerDetails && customerDetails[0]['payment']) {
                cardId = customerDetails[0]['payment']['_id']
            }
            var updateCartResponse = await tables.cartTable.updateManyWithPromises({ "card_id": cardId, "payment_type": paymentType }, { "customer_id": userId, "status": 1 });
            return res.send({
                "success": true,
                "message": "Updated",
                "card_details": customerDetails[0]['payment']
            });
        } else {

            var updateCartResponse = await tables.cartTable.updateManyWithPromises({ "payment_type": paymentType }, { "customer_id": userId, "status": 1 });
            return res.send({
                "success": true,
                "message": "Updated",
                "card_details": {}
            });
        }
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
});
router.post('/salon-cart', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.cartTable.salonCartItems(userId, languageCode, async function (response) {

        if (response != undefined && response.length != 0) {
            if (response[0].payment_type == utility.PAYMENT_TYPE_CARD) {

                var customerDetails = await tables.customerTable.getPaymentDefaultCard(userId);
                if (customerDetails) {
                    response[0]['card_details'] = customerDetails[0]['payment'];
                }
            }
            res.send({ "success": true, "cart_details": response[0] })
        } else {
            res.send({ "success": true, "cart_details": {} })
        }
    });
});
router.post('/booking-salon', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.cartTable.getSalonCartDetails(userId, async function (response) {
        if (response != undefined && response.length != 0) {

            var is_package = 0;
            var totalBookings = [];
            var booking = {};
            var cartId = '';
            var timezone = '';
            var netAmount = 0;
            var salonId = response[0].salon_id;
            var salonDetails = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, {
                'latitude': 1,
                "longitude": 1,
                "location": 1,
                "city_id": 1
            });
            var salonLatitude = 0;
            var salonLongitude = 0;
            var paymentType = 1;
            if (salonDetails != undefined && salonDetails.length != 0) {
                salonLatitude = salonDetails[0].latitude;
                salonLongitude = salonDetails[0].longitude;
            }

            var location = '';
            var checkSalonCouponCode = await tables.cartTable.checkSalonCouponCode(userId);
            var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": salonDetails[0].city_id }, { "time_zone": 1 });

            timezone = (cityDetails[0]['time_zone'] != undefined ? cityDetails[0]['time_zone'] : 'Asia/Kolkata');
            var card = {};

            if (response[0]['payment_type'] == utility.PAYMENT_TYPE_CARD) {
                card = await tables.customerTable.getPaymentCardDetails(userId, response[0]['card_id']);

                card = card[0];
            }

            for (var c = 0; c < response.length; c++) {
                booking = {};
                cartId = response[c]._id;
                salonId = response[c].salon_id;
                paymentType = response[c].payment_type;
                //  timezone=response[c].timezone;
                userId = response[c].customer_id;
                if (response[c].date != undefined) {
                    var date = response[c].date;
                    //booking['date']=date;
                }
                netAmount = 0;
                if (response[c].price != undefined) {
                    netAmount = response[c].price;
                }

                booking['cart_id'] = cartId;
                booking['payment_type'] = paymentType;
                booking['net_amount'] = netAmount;
                booking['customer_id'] = userId;
                booking['type'] = 2;
                booking['salon_id'] = salonId;
                booking['status'] = 1;
                booking['time_zone'] = timezone;
                booking['latitude'] = salonLatitude;
                booking['longitude'] = salonLongitude;
                booking['is_customer_rated'] = 0;
                location = { "type": "Point", "coordinates": [salonLongitude, salonLatitude] };
                booking['location'] = location;
                booking['payment_details'] = card;

                if (response[c].is_package != undefined && response[c].is_package == 1) {
                    is_package = 1;
                    booking['is_package'] = 1;
                } else {
                    booking['is_package'] = 0
                }

                var coupon = response[c].coupon;
                if (coupon != undefined && coupon != '') {
                    booking["coupon"] = response[c].coupon,
                        booking["coupon_amount"] = response[c].coupon_amount,
                        booking["coupon_amount_type"] = response[c].coupon_amount_type,
                        booking["up_to_amount"] = response[c].up_to_amount;

                    if (checkSalonCouponCode != undefined && checkSalonCouponCode.length != 0) {
                        var percentage = 0;
                        var couponDiscount = 0;
                        var cartTotal = checkSalonCouponCode[0]['total_amount'];


                        var couponAmount = response[c].coupon_amount;
                        var type = response[c].coupon_type;
                        var couponId = response[c].coupon_id;


                        if (is_package == 1) {
                            netAmount = response[c].package_amount;
                            cartTotal = response[c].package_amount;
                        }
                        if (response[c].coupon_amount_type == 1) {

                            percentage = netAmount / cartTotal;
                            percentage = percentage * 100;
                            couponDiscount = percentage * couponAmount / 100;
                        } else {
                            var couponPercentage = response[c].coupon_amount;
                            var couponUpToAmount = response[c].up_to_amount;
                            var discountAmount = (cartTotal / 100) * couponPercentage;
                            if (discountAmount > couponUpToAmount) {
                                couponAmount = couponUpToAmount;
                            } else {
                                couponAmount = discountAmount;
                            }
                            percentage = netAmount / cartTotal;
                            percentage = percentage * 100;
                            couponDiscount = percentage * couponAmount / 100;
                            couponDiscount = parseFloat(couponDiscount.toFixed(2))
                        }
                        booking['coupon_details'] = {
                            "coupon": coupon,
                            'coupon_amount': couponDiscount,
                            "coupon_type": type,
                            "coupon_id": couponId
                        };

                    }
                }
                var currency = await tables.salonTable.getCurrency(salonId);
                var countryId = currency[0].country_id;
                var cityId = currency[0].city_id;
                var currencyCode = currency[0].currency_code;
                var currencySymbol = currency[0].currency_symbol;
                var dollarConvertionValue = currency[0].dollar_conversion_rate;
                booking["customer_country_details"] = {
                    country_id: countryId,
                    city_id: cityId,
                    currency_code: currencyCode,
                    currency_symbol: currencySymbol
                };
                var amount = netAmount;
                if (dollarConvertionValue != undefined) {
                    dollarConvertionValue = parseFloat(dollarConvertionValue);
                    dollarConversionRate = 1 / dollarConvertionValue,
                        amount = netAmount * dollarConversionRate;
                }
                booking['net_amount_dollar'] = amount;
                totalBookings.push(booking);
            }

            var salonStatus = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, {
                "active_status": 1,
                "booking_status": 1,
                "is_locked": 1
            });
            if (salonStatus != undefined && salonStatus.length != 0) {
                var activeStatus = salonStatus[0].active_status;
                var bookingStatus = salonStatus[0].booking_status;
                var isLocked = salonStatus[0].is_locked;
                if (activeStatus == 2 || isLocked == 2) {
                    return res.send({ "success": false, "message": "salon is inactive book another salon" });
                }
                if (bookingStatus == 2) {
                    return res.send({ "success": false, "message": "salon  is not accepting  bookings" });
                }
            }

            tables.bookingsTable.insertMany(totalBookings, function (bookingResponse) {
                var bookingIds = [];
                var salonId = '';
                for (var v = 0; v < bookingResponse.length; v++) {
                    bookingIds.push(bookingResponse[v]._id);
                    // salonId=bookingResponse[v].salon_id;
                    salonId = bookingResponse[v].salon_id;
                }

                var save = {};
                save['customer_id'] = userId;
                save['booking_id'] = bookingIds;
                save['salon_id'] = salonId;
                tables.ordersTable.save(save, function (orderResponse) {
                    var orderId = orderResponse._id;

                    tables.cartTable.updateMany({ "status": 2 }, {
                        "customer_id": userId,
                        "status": 1
                    }, function (response) {
                        tables.salonTable.find({ "_id": salonId }, async function (response) {
                            var orderId = orderResponse._id;
                            if (response != undefined && response.length != 0) {
                                var vendorId = response[0].vendor_id;

                                setTimeout(function () {
                                    timeOutSalon(orderId, req.app.io)
                                }, 200000);

                                var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                                    "first_name": 1,
                                    "last_name": 1
                                });
                                var fcmResponse = await tables.fcmTable.getFcmIds(salonId);
                                var customerName = 'customer';
                                if (customerResponse != undefined && customerResponse.length != 0) {
                                    customerName = customerResponse[0].first_name['tr'];
                                }
                                var data = {
                                    "title": "Rezervasyon Bilgilendirmesi",
                                    "message": `${customerName} tarafından rezervasyon talebi yapıldı.`,
                                    "order_id": orderId,
                                    "type": 1
                                };
                                data['country_id'] = countryId;
                                data['city_id'] = cityId;
                                data['customer_id'] = userId;
                                data['vendor_id'] = salonId;
                                data['notification_type'] = 1;

                                tables.notificationsTable.save(data, function (response) {

                                });
                                if (fcmResponse != undefined && fcmResponse.length != 0) {
                                    utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                                }
                                /*  tables.notificationsTable.save(data,function(resposnse){

                                  });*/
                                /*for(var i=0;i<sockets[vendorId].length;i++)
                                {

                                    if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined)
                                    {

                                        req.app.io.sockets.sockets[sockets[vendorId][i]].emit('salon_booking',{"order_id":orderId,"type":is_package});
                                    }else
                                    {
                                        sockets[vendorId].slice(i,1);
                                    }

                                }*/
                                req.app.io.sockets.in(salonId).emit('salon_booking', {
                                    "order_id": orderId,
                                    "type": is_package,
                                    "notification_data": data
                                });

                                utility.currencyConvertor.updateSalonbookingConversionValues(bookingIds);
                            }

                        });


                        /*
                                             req.app.io.sockets.emit('salon_booking',{"order_id":orderResponse._id});
                        */

                        return res.send({ "success": true, "message": "Booked", "order_id": orderId });
                    });
                });
            });
        } else {
            return res.send({ "success": false, "message": "Services already booked" });

        }
    });

    /* tables.cartTable.update({"status": 2},{"customer_id": userId,"status": 1},function(response){

                return res.send({"success":true,"message":"Booked"});
     });*/
});

function timeOutSalon(orderId, io) {
    tables.ordersTable.find({ "_id": orderId }, function (response) {
        tables.bookingsTable.updateMany({ "status": 3 }, {
            "_id": { "$in": response[0].booking_id },
            "status": 1
        }, async function (bookingResponse) {
            if (response != undefined && response.length != 0) {
                var salon_id = response[0].salon_id;
                var user_id = response[0].customer_id;
                var salonResponse = await tables.salonTable.findFieldsWithPromises({ "_id": salon_id }, { "vendor_id": 1 });
                var vendor_id = salonResponse[0].vendor_id;

                if (sockets[vendor_id] != undefined) {
                    for (var i = 0; i < sockets[vendor_id].length; i++) {
                        if (io.sockets.sockets[sockets[vendor_id][i]] != undefined) {
                            io.sockets.sockets[sockets[vendor_id][i]].emit("salon_timeout", {
                                "order_id": orderId,
                                "user_id": user_id
                            });

                        } else {

                            sockets[vendor_id].slice(i, 1);

                        }

                    }
                }


            }
        });
    });


}

router.post('/get-employee-availability', tokenValidations, function (req, res) {
    var date = req.body.date;
    var employeeId = req.body.employee_id;
    var cartId = req.body.cart_id;

    tables.salonEmployeesTable.getEmployeesTime(employeeId, async function (response) {
        var start = new Date();
        var hours = response[0].working_hours;
        var availableDates = [];
        var end = new Date();
        var day = end.getDay();
        if (day == 0) {
            day = 7;
        }
        var cartDate = await tables.cartTable.findFieldsWithPromises({ "_id": { "$in": cartId } }, {
            "date": 1,
            "time": 1,
            "time_type": 1,
            "selected_for": 1,
            "service_id": 1,
            "salon_id": 1,
            "timezone": 1
        });
        var selectedServiceFor = cartDate[0].selected_for;
        var selectedTimeZone = cartDate[0].timezone;
        var selectedService = cartDate[0].service_id;
        var selectedSalon = cartDate[0].salon_id;

        var selectedServiceTimeResponse = await tables.salonServicesTable.findFieldsWithPromises({
            "salon_id": selectedSalon,
            "service_id": selectedService, "service_for": selectedServiceFor
        }, { "service_time": 1 });



        var serviceTime = selectedServiceTimeResponse[0].service_time;

        for (var i = 1; i < 9; i++) {
            var days = {};
            var days = {};
            var assignDate = end.getFullYear() + "-" + ("0" + (end.getMonth() + 1)).slice(-2) + "-" + ("0" + end.getDate()).slice(-2);



            if (hours[day] != undefined && hours[day].length != 0) {

                assignDate = end.getFullYear() + "-" + ("0" + (end.getMonth() + 1)).slice(-2) + "-" + ("0" + end.getDate()).slice(-2);
                var availableHoursSlots = [];


                var timeSolts = await dateforEmployees(hours[day], employeeId, assignDate, day, serviceTime, selectedTimeZone);

                if (timeSolts != undefined && timeSolts.length != 0) {
                    days['date'] = assignDate;
                    days["time_slots"] = timeSolts;
                    availableDates.push(days);
                }


            }
            end.setDate(end.getDate() + 1);
            day = end.getDay();
        }
        return res.send({ "success": true, "avaliable_dates": availableDates });

    });

});

function toTimeZone(time, zone) {
    var format = 'YYYY-MM-DD HH:mm:ss';
    return moment(time, format).tz(zone).format(format);
}

function dateforEmployees(hours, employeeId, assignDate, day, serviceTime, timezone) {
    return new Promise(async function (resolve) {
        var availableHoursSlots = [];
        for (var h = 0; h < hours.length; h++) {
            var startTimeSlot = hours[h].start;
            var endTimeSlot = hours[h].end;
            startTimeSlot = startTimeSlot.split(":");
            endTimeSlot = endTimeSlot.split(":");

            //Input
            //  var startTime = new Date(0, 0, 0, startTimeSlot[0], startTimeSlot[1], 0);
            //  var endTime = new Date(0, 0, 0, startTimeSlot[0], startTimeSlot[1], 0);

            //Parse In
            var parseIn = function (hours, min) {
                var d = new Date();
                d.setHours(hours);
                d.setMinutes(min);
                return d;
            };


            //make list
            var startTime = parseIn(startTimeSlot[0], startTimeSlot[1]);
            var endTime = parseIn(endTimeSlot[0], endTimeSlot[1]);

            var assignTime = startTime.getHours() + ":" + startTime.getMinutes();

            // currentTime=utility.formatDateTime(currentTime);


            var intervals = await timeIntervel(startTime, endTime, employeeId, assignDate, day, serviceTime, timezone);
            availableHoursSlots = availableHoursSlots.concat(intervals);

            if (h < hours.length) {

                return resolve(availableHoursSlots);
            }

        }


    });

}

function suggestStylist(assignedList, updateIndex, res, unassignedCatList) {

    var vendorId = assignedList[updateIndex].vendor_id;
    var cartid = assignedList[updateIndex].cart_id;
    tables.cartTable.update({ "vendor_id": vendorId }, { "_id": cartid }, function (response) {
        if (assignedList.length - 1 == updateIndex) {
            return res.send({ "success": true, "assigned_list": assignedList, "unassigned_list": unassignedCatList })
        } else {
            updateIndex++;
            suggestStylist(assignedList, updateIndex, res, unassignedCatList);
        }
    });
}

router.post('/get-salon-packages', tokenValidations, function (req, res) {
    var salonId = req.body.salon_id;
    var userId = req.body.user_id;
    var cityId = req.body.city_id;

    tables.salonTable.getSalonPackages(salonId, userId, function (response) {
        var response = response.length ? response[0] : [];
        return res.send({ "success": true, "packages": response });
    });
});
router.post('/schedule-cart', tokenValidations, function (req, res) {
    var scheduleId = req.body.schedule_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (scheduleId == '' || scheduleId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.scheduleBookingTable.scheduleCart(scheduleId, languageCode, async function (response) {


        if (response != undefined && response.length != 0) {
            var address = response[0].address;
            var latitude = address.latitude;
            var longitude = address.longitude;

            var checkSurgePrice = await tables.surgePriceTable.checkSurgePriceWithPromises(latitude, longitude);
            var surgePrice = 1.0;
            if (checkSurgePrice != undefined && checkSurgePrice.length != 0) {
                surgePrice = (checkSurgePrice[0].surge != undefined ? checkSurgePrice[0].surge : 1.0);
                if (surgePrice == undefined || surgePrice == null || surgePrice == 1.0 || !surgePrice) {
                    surgePrice = 1.0;
                }
            }
            if (response[0].payment_type == utility.PAYMENT_TYPE_CARD) {
                var customerDetails = await tables.customerTable.getPaymentCardDetails(userId, response[0]['card_id']);
                console.log(customerDetails, response[0]['card_id']);
                if (customerDetails.length) {
                    response[0]['card_details'] = customerDetails[0]['payment'];
                }
            }
            return res.send({ "success": true, "schedule_cart": response[0], "surge": surgePrice })
        } else {
            return res.send({ "success": true, "schedule_cart": {} })
        }
    });
});
router.post('/clear-schedule-cart', tokenValidations, async function (req, res) {
    var scheduleId = req.body.schedule_id;
    var cartId = req.body.cart_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (scheduleId == '' || scheduleId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var updateSchedule = await tables.scheduleBookingTable.removeCartItemsWithPromises({ "cart_id": cartId }, { "_id": scheduleId });

    return res.send({ "success": true, "message": utility.errorMessages["Successfully Cart Item Deleted From Schedule Booking"][languageCode] })

});
router.post('/schedule-cart-update', tokenValidations, async function (req, res) {
    var paymentType = req.body.payment_type;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    var scheduleId = req.body.schedule_id;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    if (paymentType == '' || paymentType == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            ,
            "error_code": 2
        })
    }

    if (scheduleId == '' || scheduleId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    paymentType = parseInt(paymentType);

    if (!utility.isValidPayment(paymentType)) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "error_code": 3
        });
    }

    var scheduleCartDetails = await tables.scheduleBookingTable.findFieldsWithPromises({ "_id": scheduleId }, { "cart_id": 1 });

    if (scheduleCartDetails.length == 0) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    var cartIds = scheduleCartDetails[0]['cart_id'];
    if (paymentType === utility.PAYMENT_TYPE_CARD) {
        var customerDetails = await tables.customerTable.getPaymentDefaultCard(userId);

        if (!customerDetails || !customerDetails[0] || !customerDetails[0]['payment']) {
            return res.send({
                "success": false,
                "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
                "error_code": 4,
                "card_details": {}
            });
        }
        var cardId = '';

        if (customerDetails && customerDetails[0]['payment']) {
            cardId = customerDetails[0]['payment']['_id']
        }
        var updateCartResponse = await tables.cartTable.updateWithPromises({ "card_id": cardId, "payment_type": paymentType }, { "_id": { "$in": cartIds } });
        return res.send({
            "success": true,
            "message": "Updated",
            "card_details": customerDetails[0]['payment']
        });
    } else {
        var updateCartResponse = await tables.cartTable.updateWithPromises({ "payment_type": paymentType }, { "_id": { "$in": cartIds } });
        return res.send({
            "success": true,
            "message": "Updated",
            "card_details": {}
        });
    }
});
function timeIntervel(time1, time2, employeeId, assignDate, day, serviceTime, timezone) {
    return new Promise(async function (resolve) {
        var arr = [];
        while (time1 < time2) {
            time1 = new Date(time1);
            time2 = new Date(time2);
            var time = time1.toTimeString().substring(0, 5);
            time = time.split(":");


            var startTime = parseIn(time[0], time[1]);
            var endTime = parseIn(time[0], time[1]);
            endTime.setMinutes(startTime.getMinutes() + parseInt(serviceTime));

            startTime = startTime.toTimeString().substring(0, 5);
            endTime = endTime.toTimeString().substring(0, 5);
            if (day == undefined) {
                day = 1
            }

            var employeeTime = await tables.salonEmployeesTable.checkEmployeeAvaliablity(employeeId, startTime, day);

            if (employeeTime != undefined && employeeTime.length != 0) {
                var now = moment();
                var format = 'YYYY-MM-DD HH:mm';
                var currentTime = now.tz(timezone).format(format);

                var assignDateTime = new Date(assignDate + " " + startTime);
                var assignEndTime = new Date(assignDate + " " + endTime);
                assignDateTime = moment(assignDateTime).format(format);
                assignEndTime = moment(assignEndTime).format(format);
                var assignUtcDateTime = moment.tz(assignDate + " " + startTime, format, timezone).utc().format(format);

                // var assignUtcEndTime=new Date(assignDate+" "+endTime);
                //  assignUtcDateTime.setTimezone(timezone);

                // assignUtcEndTime.setTimezone(timezone);

                var assignUtcEndTime = moment.tz(assignDate + " " + endTime, format, timezone).utc().format(format);
                //   assignUtcDateTime=utility.formatUtcTimaAndDate(assignUtcDateTime);
                // assignUtcEndTime=utility.formatUtcTimaAndDate(assignUtcEndTime);

                var assignConditon = await tables.salonEmployeesTable.checkEmployeeTime(employeeId, assignUtcDateTime, assignUtcEndTime, assignDate);


                if (assignConditon != undefined && assignConditon.length == 0) {
                    if (assignDateTime > currentTime) {

                        arr.push(startTime);

                    }
                }
            }
            time1.setMinutes(time1.getMinutes() + 30);
        }
        return resolve(arr);
    });
}

router.post('/get-salon-employees', tokenValidations, async function (req, res) {
    var cartId = req.body.cart_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (cartId == '' || cartId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var cartDate = await tables.cartTable.findFieldsWithPromises({ "_id": cartId }, {
        "date": 1,
        "time": 1,
        "selected_date": 1,
        "selected_time": 1,
        "timezone": 1,
        "time_type": 1,
        "selected_for": 1,
        "service_id": 1,
        "salon_id": 1
    });


    var selectedServiceFor = cartDate[0].selected_for;
    var timeType = cartDate[0].time_type;
    var serviceStartDate = '';
    var serviceEndDate = '';
    var selectedService = cartDate[0].service_id;
    var selectedSalon = cartDate[0].salon_id;
    var selectedServiceTimeResponse = await tables.salonServicesTable.findFieldsWithPromises({
        "salon_id": selectedSalon,
        "service_id": selectedService, "service_for": selectedServiceFor
    }, { "service_time": 1 });
    var serviceTime = selectedServiceTimeResponse[0].service_time;

    if (timeType == 1) {
        var format = 'YYYY-MM-DD HH:mm';
        var timeSlots = [];
        var preferredTime = cartDate[0].selected_time;
        var timezone = cartDate[0].timezone;
        var preferredDate = cartDate[0].selected_date;
        var time = preferredTime.split(":");
        var startTime = parseIn(time[0], time[1]);
        var endTime = parseIn(time[0], time[1]);
        endTime.setMinutes(startTime.getMinutes() + parseInt(serviceTime));
        startTime = startTime.toTimeString().substring(0, 5);
        endTime = endTime.toTimeString().substring(0, 5);

        serviceStartDate = moment.tz(preferredDate + " " + startTime, format, timezone).utc().format(format);
        // var assignUtcEndTime=new Date(assignDate+" "+endTime);
        //  assignUtcDateTime.setTimezone(timezone);
        // assignUtcEndTime.setTimezone(timezone);
        serviceEndDate = moment.tz(preferredDate + " " + endTime, format, timezone).utc().format(format);
        // serviceStartDate=utility.formatUtcTimaAndDate(serviceStartDate);
        // serviceEndDate=utility.formatUtcTimaAndDate(serviceEndDate);
    }

    tables.salonEmployeesTable.checkSalonEmployees(cartId, serviceStartDate, serviceEndDate, languageCode, async function (response) {
        if (response != undefined) {
            if (response.length != 0) {

                if (timeType != 1) {


                    var timeSlots = [];
                    var preferredTime = cartDate[0].selected_time;
                    var preferredDate = cartDate[0].selected_date;
                    var timezone = cartDate[0].timezone;
                    var preferredTimeBetween = preferredTime.split("-");
                    var preferredTimeStart = preferredTimeBetween[0];

                    preferredTimeStart = preferredTimeStart.split(":");

                    var preferredTimeEnd = preferredTimeBetween[1];
                    preferredTimeEnd = preferredTimeEnd.split(":");


                    var preferredStartString = parseIn(preferredTimeStart[0], preferredTimeStart[1]);


                    preferredStartString = toTimeZone(preferredStartString, timezone);


                    var preferredEndString = parseIn(preferredTimeEnd[0], preferredTimeEnd[1]);


                    preferredEndString = toTimeZone(preferredEndString, timezone);

                    var end = new Date(preferredDate);

                    var day = end.getDay();

                    if (day == 0) {
                        day = 7;
                    }
                    for (var e = 0; e < response.length; e++) {
                        var preferredEmployee = response[e].employee_id;

                        timeSlots = await timeIntervel(preferredStartString, preferredEndString, preferredEmployee, preferredDate, day, serviceTime, timezone);

                        if (timeSlots.length != 0) {
                            response[e].status = 1;
                        } else {
                            response[e].status = 0;
                        }


                    }
                }

                res.send({ "success": true, "employees": response });


            } else {
                res.send({ "success": true, "employees": [] });
            }

        } else {
            return res.send(
                {
                    "success": false,
                    "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
                });
        }
    });

});
router.post('/assign-stylist-booking', tokenValidations, function (req, res) {
    var vendorId = req.body.vendor_id;
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
    var userId = req.body.user_id;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }

    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    tables.bookingsTable.checkVendorStatus(vendorId, async function (vedorDetails) {

        if (vedorDetails != undefined && vedorDetails.length != 0) {
            tables.bookingsTable.update({
                "vendor_id": vendorId,
                "booking_requested": new Date(),
                "status": 1
            }, { "_id": bookingId }, async function (bookingDetails) {
                if (bookingDetails != undefined && bookingDetails.length != 0) {
                    userId = bookingDetails.customer_id;
                    var update = await tables.stylistTable.updateWithPromises({ "booking_status": 2 }, { "vendor_id": vendorId });
                    var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                        "first_name": 1,
                        "last_name": 1
                    });
                    var salonDetails = await tables.vendorTable.findFieldsWithPromises({ "_id": vendorId }, {
                        "salon_id": 1,
                        "type": 1
                    });
                    var stylistType = salonDetails[0].type;

                    if (stylistType == utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {
                        var salonId = salonDetails[0].salon_id;
                        // var vendorDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
                        vendorId = salonId;
                    }

                    var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                    var customerName = 'customer';
                    if (customerResponse != undefined && customerResponse.length != 0) {
                        customerName = customerResponse[0].first_name['tr'];
                    }
                    var format = 'YYYY-MM-DD HH:mm:ss';

                    var presentDateTime = moment().utc().format(format);
                    var data = {
                        "title": "Rezervasyon Bilgilendirmesi",
                        "message": `${customerName} tarafından rezervasyon talebi yapıldı.`,
                        "booking_id": bookingId,
                        "type": stylistType,
                        "request_time": presentDateTime,
                        'stylist_type': stylistType
                    };
                    tables.notificationsTable.save(data, function (response) {
                    });
                    data['country_id'] = bookingDetails.customer_country_details.country_id;
                    data['city_id'] = bookingDetails.customer_country_details.city_id;
                    data['customer_id'] = userId;
                    data['vendor_id'] = vendorId;
                    data['notification_type'] = 1;
                    tables.notificationsTable.save(data, function (response) {

                    });
                    if (fcmResponse != undefined && fcmResponse.length != 0 && fcmResponse[0].fcm_id != undefined) {

                        utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                    }
                    req.app.io.sockets.in(vendorId).emit("order", { "booking_id": bookingId, "notification_data": data });
                    setTimeout(function () {
                        timeOutStylist(bookingId, req.app.io)
                    }, 30000);
                    return res.send({ "success": true, "message": "stylist requesting", "created_at": presentDateTime });
                } else {
                    return res.send({ "success": false, "message": "stylist not avalible" });
                }
            });
        } else {
            return res.send({ "success": false, "message": "stylist not avalible", "error_code": 1 });
        }
    });
});

function emailCheck(email, next) {
    tables.customerTable.find({ "email": email }, function (response) {
        if (response.length != 0) {
            return next(true);
        } else {
            return next(null);
        }
    });
}

function parseIn(hours, min) {
    var d = new Date();
    d.setHours(hours);
    d.setMinutes(min);
    return d;
}
router.post('/deletedata', function (req, res) {
    tables.citiesTable.deleteall(function (response) {
        return res.send({ "success": true });
    });
});
router.post('/rating-submit', tokenValidations, async function (req, res) {
    var customerId = req.body.user_id;
    var bookingId = req.body.booking_id;

    var languageCode = req.body.language_code;
    var rating = req.body.rating;
    var review = req.body.comment;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "vendor_id": 1 });
    var vendorId = bookingDetails[0].vendor_id;
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 3
        });
    }
    tables.ratingTable.save({
        "booking_id": bookingId,
        "customer_id": customerId,
        "vendor_id": vendorId,
        "rated_by": 1,
        "rating": rating,
        "review": review
    },
        function (response) {
            tables.bookingsTable.update({ "is_customer_rated": 1 }, { "_id": bookingId }, function (response) {

            });
            return res.send({ "success": true, "message": "successfully" });
        });

});
router.post('/salon-rating-submit', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var bookingId = req.body.booking_id;
    var salonId = req.body.salon_id;
    var employeeId = req.body.employee_id;
    var languageCode = req.body.language_code;
    var salonRating = req.body.salon_rating;
    var employeeRating = req.body.employee_rating;
    var review = req.body.comment;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (salonId == '' || salonId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 3
        });
    }
    if (employeeId == '' || employeeId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 3
        });
    }
    tables.ratingTable.save({
        "booking_id": bookingId,
        "customer_id": customerId,
        "salon_id": salonId,
        "rated_by": 1,
        "rating": salonRating,
        "employee_rating": employeeRating,
        "employee_id": employeeId,
        "review": review
    }, function (response) {

        tables.bookingsTable.update({ "is_customer_rated": 1 }, { "_id": bookingId }, function (response) {

        });
        return res.send({ "success": true, "message": "successfully" });
    });

});
router.post('/schedule-list', tokenValidations, function (req, res) {
    var customerId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (customerId == '' || customerId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 3
        });
    }
    tables.scheduleBookingTable.scheduleList(customerId, function (response) {
        if (response != undefined && response.length != 0) {
            return res.send({ "success": true, "schedule": response });
        } else {
            return res.send({ "success": true, "schedule": [] });
        }
    });
});

router.post('/saveCurrency', function (req, res) {
    var currency = [{
        "USD": {
            "symbol": "$",
            "name": "US Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "USD",
            "name_plural": "US dollars"
        },
        "CAD": {
            "symbol": "CA$",
            "name": "Canadian Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "CAD",
            "name_plural": "Canadian dollars"
        },
        "EUR": {
            "symbol": "€",
            "name": "Euro",
            "symbol_native": "€",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "EUR",
            "name_plural": "euros"
        },
        "AED": {
            "symbol": "AED",
            "name": "United Arab Emirates Dirham",
            "symbol_native": "د.إ.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "AED",
            "name_plural": "UAE dirhams"
        },
        "AFN": {
            "symbol": "Af",
            "name": "Afghan Afghani",
            "symbol_native": "؋",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "AFN",
            "name_plural": "Afghan Afghanis"
        },
        "ALL": {
            "symbol": "ALL",
            "name": "Albanian Lek",
            "symbol_native": "Lek",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "ALL",
            "name_plural": "Albanian lekë"
        },
        "AMD": {
            "symbol": "AMD",
            "name": "Armenian Dram",
            "symbol_native": "դր.",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "AMD",
            "name_plural": "Armenian drams"
        },
        "ANG": {
            "symbol": "ƒ",
            "name": "Netherlands Antillean guilder",
            "symbol_native": "ƒ",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "ANG",
            "name_plural": "Netherlands Antillean guilder"
        },
        "AOA": {
            "symbol": "Kz",
            "name": "Angolan Kwanza",
            "symbol_native": "Kz",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "AOA",
            "name_plural": "Angolan Kwanzas"
        },
        "ARS": {
            "symbol": "AR$",
            "name": "Argentine Peso",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "ARS",
            "name_plural": "Argentine pesos"
        },
        "AUD": {
            "symbol": "AU$",
            "name": "Australian Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "AUD",
            "name_plural": "Australian dollars"
        },
        "AZN": {
            "symbol": "man.",
            "name": "Azerbaijani Manat",
            "symbol_native": "ман.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "AZN",
            "name_plural": "Azerbaijani manats"
        },
        "BAM": {
            "symbol": "KM",
            "name": "Bosnia-Herzegovina Convertible Mark",
            "symbol_native": "KM",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BAM",
            "name_plural": "Bosnia-Herzegovina convertible marks"
        },
        "BDT": {
            "symbol": "Tk",
            "name": "Bangladeshi Taka",
            "symbol_native": "৳",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BDT",
            "name_plural": "Bangladeshi takas"
        },
        "BGN": {
            "symbol": "BGN",
            "name": "Bulgarian Lev",
            "symbol_native": "лв.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BGN",
            "name_plural": "Bulgarian leva"
        },
        "BHD": {
            "symbol": "BD",
            "name": "Bahraini Dinar",
            "symbol_native": "د.ب.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "BHD",
            "name_plural": "Bahraini dinars"
        },
        "BIF": {
            "symbol": "FBu",
            "name": "Burundian Franc",
            "symbol_native": "FBu",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "BIF",
            "name_plural": "Burundian francs"
        },
        "BND": {
            "symbol": "BN$",
            "name": "Brunei Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BND",
            "name_plural": "Brunei dollars"
        },
        "BMD": {
            "symbol": "$",
            "name": "Bermudian Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BMD",
            "name_plural": "Bermudian Dollar"
        },
        "BOB": {
            "symbol": "Bs",
            "name": "Bolivian Boliviano",
            "symbol_native": "Bs",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BOB",
            "name_plural": "Bolivian bolivianos"
        },
        "BRL": {
            "symbol": "R$",
            "name": "Brazilian Real",
            "symbol_native": "R$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BRL",
            "name_plural": "Brazilian reals"
        },
        "BTN": {
            "symbol": "Nu.",
            "name": "Bhutanese Ngultrum",
            "symbol_native": "Nu.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BTN",
            "name_plural": "Bhutanese Ngultrum"
        },
        "BWP": {
            "symbol": "BWP",
            "name": "Botswanan Pula",
            "symbol_native": "P",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BWP",
            "name_plural": "Botswanan pulas"
        },
        "BYR": {
            "symbol": "BYR",
            "name": "Belarusian Ruble",
            "symbol_native": "BYR",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "BYR",
            "name_plural": "Belarusian rubles"
        },
        "BZD": {
            "symbol": "BZ$",
            "name": "Belize Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "BZD",
            "name_plural": "Belize dollars"
        },
        "CDF": {
            "symbol": "CDF",
            "name": "Congolese Franc",
            "symbol_native": "FrCD",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "CDF",
            "name_plural": "Congolese francs"
        },
        "CHF": {
            "symbol": "CHF",
            "name": "Swiss Franc",
            "symbol_native": "CHF",
            "decimal_digits": 2,
            "rounding": 0.05,
            "code": "CHF",
            "name_plural": "Swiss francs"
        },
        "CLP": {
            "symbol": "CL$",
            "name": "Chilean Peso",
            "symbol_native": "$",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "CLP",
            "name_plural": "Chilean pesos"
        },
        "CNY": {
            "symbol": "CN¥",
            "name": "Chinese Yuan",
            "symbol_native": "CN¥",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "CNY",
            "name_plural": "Chinese yuan"
        },
        "COP": {
            "symbol": "CO$",
            "name": "Colombian Peso",
            "symbol_native": "$",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "COP",
            "name_plural": "Colombian pesos"
        },
        "CRC": {
            "symbol": "₡",
            "name": "Costa Rican Colón",
            "symbol_native": "₡",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "CRC",
            "name_plural": "Costa Rican colóns"
        },
        "CVE": {
            "symbol": "CV$",
            "name": "Cape Verdean Escudo",
            "symbol_native": "CV$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "CVE",
            "name_plural": "Cape Verdean escudos"
        },
        "CZK": {
            "symbol": "Kč",
            "name": "Czech Republic Koruna",
            "symbol_native": "Kč",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "CZK",
            "name_plural": "Czech Republic korunas"
        },
        "DJF": {
            "symbol": "Fdj",
            "name": "Djiboutian Franc",
            "symbol_native": "Fdj",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "DJF",
            "name_plural": "Djiboutian francs"
        },
        "DKK": {
            "symbol": "Dkr",
            "name": "Danish Krone",
            "symbol_native": "kr",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "DKK",
            "name_plural": "Danish kroner"
        },
        "DOP": {
            "symbol": "RD$",
            "name": "Dominican Peso",
            "symbol_native": "RD$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "DOP",
            "name_plural": "Dominican pesos"
        },
        "DZD": {
            "symbol": "DA",
            "name": "Algerian Dinar",
            "symbol_native": "د.ج.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "DZD",
            "name_plural": "Algerian dinars"
        },
        "EEK": {
            "symbol": "Ekr",
            "name": "Estonian Kroon",
            "symbol_native": "kr",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "EEK",
            "name_plural": "Estonian kroons"
        },
        "EGP": {
            "symbol": "EGP",
            "name": "Egyptian Pound",
            "symbol_native": "ج.م.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "EGP",
            "name_plural": "Egyptian pounds"
        },
        "ERN": {
            "symbol": "Nfk",
            "name": "Eritrean Nakfa",
            "symbol_native": "Nfk",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "ERN",
            "name_plural": "Eritrean nakfas"
        },
        "ETB": {
            "symbol": "Br",
            "name": "Ethiopian Birr",
            "symbol_native": "Br",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "ETB",
            "name_plural": "Ethiopian birrs"
        },
        "FKP": {
            "symbol": "£",
            "name": "Falkland Island Pound",
            "symbol_native": "£",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "FKP",
            "name_plural": "Falkland Island Pounds"
        },
        "GBP": {
            "symbol": "£",
            "name": "British Pound Sterling",
            "symbol_native": "£",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "GBP",
            "name_plural": "British pounds sterling"
        },
        "GEL": {
            "symbol": "GEL",
            "name": "Georgian Lari",
            "symbol_native": "GEL",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "GEL",
            "name_plural": "Georgian laris"
        },
        "GHS": {
            "symbol": "GH₵",
            "name": "Ghanaian Cedi",
            "symbol_native": "GH₵",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "GHS",
            "name_plural": "Ghanaian cedis"
        },
        "GIP": {
            "symbol": "£",
            "name": "Gibraltar Pound",
            "symbol_native": "£",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "GHS",
            "name_plural": "Gibraltar pound"
        },
        "GNF": {
            "symbol": "FG",
            "name": "Guinean Franc",
            "symbol_native": "FG",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "GNF",
            "name_plural": "Guinean francs"
        },
        "GTQ": {
            "symbol": "GTQ",
            "name": "Guatemalan Quetzal",
            "symbol_native": "Q",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "GTQ",
            "name_plural": "Guatemalan quetzals"
        },
        "HKD": {
            "symbol": "HK$",
            "name": "Hong Kong Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "HKD",
            "name_plural": "Hong Kong dollars"
        },
        "HNL": {
            "symbol": "HNL",
            "name": "Honduran Lempira",
            "symbol_native": "L",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "HNL",
            "name_plural": "Honduran lempiras"
        },
        "HRK": {
            "symbol": "kn",
            "name": "Croatian Kuna",
            "symbol_native": "kn",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "HRK",
            "name_plural": "Croatian kunas"
        },
        "HUF": {
            "symbol": "Ft",
            "name": "Hungarian Forint",
            "symbol_native": "Ft",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "HUF",
            "name_plural": "Hungarian forints"
        },
        "IDR": {
            "symbol": "Rp",
            "name": "Indonesian Rupiah",
            "symbol_native": "Rp",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "IDR",
            "name_plural": "Indonesian rupiahs"
        },
        "ILS": {
            "symbol": "₪",
            "name": "Israeli New Sheqel",
            "symbol_native": "₪",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "ILS",
            "name_plural": "Israeli new sheqels"
        },
        "INR": {
            "symbol": "₹",
            "name": "Indian Rupee",
            "symbol_native": "টকা",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "INR",
            "name_plural": "Indian rupees"
        },
        "IQD": {
            "symbol": "IQD",
            "name": "Iraqi Dinar",
            "symbol_native": "د.ع.‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "IQD",
            "name_plural": "Iraqi dinars"
        },
        "IRR": {
            "symbol": "IRR",
            "name": "Iranian Rial",
            "symbol_native": "﷼",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "IRR",
            "name_plural": "Iranian rials"
        },
        "ISK": {
            "symbol": "Ikr",
            "name": "Icelandic Króna",
            "symbol_native": "kr",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "ISK",
            "name_plural": "Icelandic krónur"
        },
        "JMD": {
            "symbol": "J$",
            "name": "Jamaican Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "JMD",
            "name_plural": "Jamaican dollars"
        },
        "JOD": {
            "symbol": "JD",
            "name": "Jordanian Dinar",
            "symbol_native": "د.أ.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "JOD",
            "name_plural": "Jordanian dinars"
        },
        "JPY": {
            "symbol": "¥",
            "name": "Japanese Yen",
            "symbol_native": "￥",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "JPY",
            "name_plural": "Japanese yen"
        },
        "KES": {
            "symbol": "с",
            "name": "Kyrgyzstani som",
            "symbol_native": "с",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "KES",
            "name_plural": "Kyrgyzstani som"
        },
        "KGS": {
            "symbol": "Ksh",
            "name": "Kyrgyzstani Som",
            "symbol_native": "Ksh",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "KES",
            "name_plural": "Kenyan shillings"
        },
        "KHR": {
            "symbol": "KHR",
            "name": "Cambodian Riel",
            "symbol_native": "៛",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "KHR",
            "name_plural": "Cambodian riels"
        },
        "KMF": {
            "symbol": "CF",
            "name": "Comorian Franc",
            "symbol_native": "FC",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "KMF",
            "name_plural": "Comorian francs"
        },
        "KRW": {
            "symbol": "₩",
            "name": "South Korean Won",
            "symbol_native": "₩",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "KRW",
            "name_plural": "South Korean won"
        },
        "KWD": {
            "symbol": "KD",
            "name": "Kuwaiti Dinar",
            "symbol_native": "د.ك.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "KWD",
            "name_plural": "Kuwaiti dinars"
        },
        "KYD": {
            "symbol": "$",
            "name": "Cayman Islands dollar",
            "symbol_native": "$‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "KYD",
            "name_plural": "Cayman Islands dollarS"
        },
        "KZT": {
            "symbol": "KZT",
            "name": "Kazakhstani Tenge",
            "symbol_native": "тңг.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "KZT",
            "name_plural": "Kazakhstani tenges"
        },
        "LAK": {
            "symbol": "₭",
            "name": "Lao kip",
            "symbol_native": "₭‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "LAK",
            "name_plural": "Lao kip"
        },
        "LBP": {
            "symbol": "LB£",
            "name": "Lebanese Pound",
            "symbol_native": "ل.ل.‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "LBP",
            "name_plural": "Lebanese pounds"
        },
        "LKR": {
            "symbol": "SLRs",
            "name": "Sri Lankan Rupee",
            "symbol_native": "SL Re",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "LKR",
            "name_plural": "Sri Lankan rupees"
        },
        "LRD": {
            "symbol": "$",
            "name": "Liberian Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "LRD",
            "name_plural": "Liberian Dollars"
        },
        "LTL": {
            "symbol": "Lt",
            "name": "Lithuanian Litas",
            "symbol_native": "Lt",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "LTL",
            "name_plural": "Lithuanian litai"
        },
        "LVL": {
            "symbol": "Ls",
            "name": "Latvian Lats",
            "symbol_native": "Ls",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "LVL",
            "name_plural": "Latvian lati"
        },
        "LYD": {
            "symbol": "LD",
            "name": "Libyan Dinar",
            "symbol_native": "د.ل.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "LYD",
            "name_plural": "Libyan dinars"
        },
        "MAD": {
            "symbol": "MAD",
            "name": "Moroccan Dirham",
            "symbol_native": "د.م.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MAD",
            "name_plural": "Moroccan dirhams"
        },
        "MDL": {
            "symbol": "MDL",
            "name": "Moldovan Leu",
            "symbol_native": "MDL",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MDL",
            "name_plural": "Moldovan lei"
        },
        "MGA": {
            "symbol": "MGA",
            "name": "Malagasy Ariary",
            "symbol_native": "MGA",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "MGA",
            "name_plural": "Malagasy Ariaries"
        },
        "MKD": {
            "symbol": "MKD",
            "name": "Macedonian Denar",
            "symbol_native": "MKD",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MKD",
            "name_plural": "Macedonian denari"
        },
        "MMK": {
            "symbol": "MMK",
            "name": "Myanma Kyat",
            "symbol_native": "K",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "MMK",
            "name_plural": "Myanma kyats"
        },
        "MOP": {
            "symbol": "MOP$",
            "name": "Macanese Pataca",
            "symbol_native": "MOP$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MOP",
            "name_plural": "Macanese patacas"
        },
        "MUR": {
            "symbol": "MURs",
            "name": "Mauritian Rupee",
            "symbol_native": "MURs",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "MUR",
            "name_plural": "Mauritian rupees"
        },
        "MWK": {
            "symbol": "MK",
            "name": "Malawian Kwacha",
            "symbol_native": "MK",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MWK",
            "name_plural": "Malawian Kwacha"
        },
        "MXN": {
            "symbol": "MX$",
            "name": "Mexican Peso",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MXN",
            "name_plural": "Mexican pesos"
        },
        "MYR": {
            "symbol": "RM",
            "name": "Malaysian Ringgit",
            "symbol_native": "RM",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MYR",
            "name_plural": "Malaysian ringgits"
        },
        "MZN": {
            "symbol": "MTn",
            "name": "Mozambican Metical",
            "symbol_native": "MTn",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "MZN",
            "name_plural": "Mozambican meticals"
        },
        "NAD": {
            "symbol": "N$",
            "name": "Namibian Dollar",
            "symbol_native": "N$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NAD",
            "name_plural": "Namibian dollars"
        },
        "NGN": {
            "symbol": "₦",
            "name": "Nigerian Naira",
            "symbol_native": "₦",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NGN",
            "name_plural": "Nigerian nairas"
        },
        "NIO": {
            "symbol": "C$",
            "name": "Nicaraguan Córdoba",
            "symbol_native": "C$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NIO",
            "name_plural": "Nicaraguan córdobas"
        },
        "NOK": {
            "symbol": "Nkr",
            "name": "Norwegian Krone",
            "symbol_native": "kr",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NOK",
            "name_plural": "Norwegian kroner"
        },
        "NPR": {
            "symbol": "NPRs",
            "name": "Nepalese Rupee",
            "symbol_native": "नेरू",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NPR",
            "name_plural": "Nepalese rupees"
        },
        "NZD": {
            "symbol": "NZ$",
            "name": "New Zealand Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "NZD",
            "name_plural": "New Zealand dollars"
        },
        "OMR": {
            "symbol": "OMR",
            "name": "Omani Rial",
            "symbol_native": "ر.ع.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "OMR",
            "name_plural": "Omani rials"
        },
        "PAB": {
            "symbol": "B/.",
            "name": "Panamanian Balboa",
            "symbol_native": "B/.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "PAB",
            "name_plural": "Panamanian balboas"
        },
        "PEN": {
            "symbol": "S/.",
            "name": "Peruvian Nuevo Sol",
            "symbol_native": "S/.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "PEN",
            "name_plural": "Peruvian nuevos soles"
        },
        "PHP": {
            "symbol": "₱",
            "name": "Philippine Peso",
            "symbol_native": "₱",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "PHP",
            "name_plural": "Philippine pesos"
        },
        "PKR": {
            "symbol": "PKRs",
            "name": "Pakistani Rupee",
            "symbol_native": "₨",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "PKR",
            "name_plural": "Pakistani rupees"
        },
        "PLN": {
            "symbol": "zł",
            "name": "Polish Zloty",
            "symbol_native": "zł",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "PLN",
            "name_plural": "Polish zlotys"
        },
        "PYG": {
            "symbol": "₲",
            "name": "Paraguayan Guarani",
            "symbol_native": "₲",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "PYG",
            "name_plural": "Paraguayan guaranis"
        },
        "QAR": {
            "symbol": "QR",
            "name": "Qatari Rial",
            "symbol_native": "ر.ق.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "QAR",
            "name_plural": "Qatari rials"
        },
        "RON": {
            "symbol": "RON",
            "name": "Romanian Leu",
            "symbol_native": "RON",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "RON",
            "name_plural": "Romanian lei"
        },
        "RSD": {
            "symbol": "din.",
            "name": "Serbian Dinar",
            "symbol_native": "дин.",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "RSD",
            "name_plural": "Serbian dinars"
        },
        "RUB": {
            "symbol": "RUB",
            "name": "Russian Ruble",
            "symbol_native": "руб.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "RUB",
            "name_plural": "Russian rubles"
        },
        "RWF": {
            "symbol": "RWF",
            "name": "Rwandan Franc",
            "symbol_native": "FR",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "RWF",
            "name_plural": "Rwandan francs"
        },
        "SAR": {
            "symbol": "SR",
            "name": "Saudi Riyal",
            "symbol_native": "ر.س.‏",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SAR",
            "name_plural": "Saudi riyals"
        },
        "SBD": {
            "symbol": "$",
            "name": "Solomon Islander Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SBD",
            "name_plural": "Solomon Islander Dollars"
        },
        "SDG": {
            "symbol": "SDG",
            "name": "Sudanese Pound",
            "symbol_native": "SDG",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SDG",
            "name_plural": "Sudanese pounds"
        },
        "SEK": {
            "symbol": "Skr",
            "name": "Swedish Krona",
            "symbol_native": "kr",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SEK",
            "name_plural": "Swedish kronor"
        },
        "SGD": {
            "symbol": "S$",
            "name": "Singapore Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SGD",
            "name_plural": "Singapore dollars"
        },
        "SLL": {
            "symbol": "Le",
            "name": "Sierra Leonean Leone",
            "symbol_native": "Le",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SLL",
            "name_plural": "Sierra Leonean Leone"
        },
        "SOS": {
            "symbol": "Ssh",
            "name": "Somali Shilling",
            "symbol_native": "Ssh",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "SOS",
            "name_plural": "Somali shillings"
        },
        "SSP": {
            "symbol": "£",
            "name": "South Sudanese pound",
            "symbol_native": "£",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "SSP",
            "name_plural": "South Sudanese pound"
        },
        "STD": {
            "symbol": "Db",
            "name": "Sao Tomean Dobra",
            "symbol_native": "Db",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "STD",
            "name_plural": "Sao Tomean Dobra"
        },
        "STN": {
            "symbol": "Db",
            "name": "Sao Tomean Dobra",
            "symbol_native": "Db",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "STN",
            "name_plural": "Sao Tomean Dobra"
        },
        "SYP": {
            "symbol": "SY£",
            "name": "Syrian Pound",
            "symbol_native": "ل.س.‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "SYP",
            "name_plural": "Syrian pounds"
        },
        "SZL": {
            "symbol": "L",
            "name": "Swazi Lilangeni",
            "symbol_native": "L‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "SZL",
            "name_plural": "Swazi Lilangeni"
        },
        "THB": {
            "symbol": "฿",
            "name": "Thai Baht",
            "symbol_native": "฿",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "THB",
            "name_plural": "Thai baht"
        },
        "TJS": {
            "symbol": "ЅМ",
            "name": "Tajikistani Somoni",
            "symbol_native": "ЅМ",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "THB",
            "name_plural": "Tajikistani Somoni"
        },
        "TND": {
            "symbol": "DT",
            "name": "Tunisian Dinar",
            "symbol_native": "د.ت.‏",
            "decimal_digits": 3,
            "rounding": 0,
            "code": "TND",
            "name_plural": "Tunisian dinars"
        },
        "TOP": {
            "symbol": "T$",
            "name": "Tongan Paʻanga",
            "symbol_native": "T$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "TOP",
            "name_plural": "Tongan paʻanga"
        },
        "TRY": {
            "symbol": "TL",
            "name": "Turkish Lira",
            "symbol_native": "TL",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "TRY",
            "name_plural": "Turkish Lira"
        },
        "TTD": {
            "symbol": "TT$",
            "name": "Trinidad and Tobago Dollar",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "TTD",
            "name_plural": "Trinidad and Tobago dollars"
        },
        "TWD": {
            "symbol": "NT$",
            "name": "New Taiwan Dollar",
            "symbol_native": "NT$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "TWD",
            "name_plural": "New Taiwan dollars"
        },
        "TZS": {
            "symbol": "TSh",
            "name": "Tanzanian Shilling",
            "symbol_native": "TSh",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "TZS",
            "name_plural": "Tanzanian shillings"
        },
        "UAH": {
            "symbol": "₴",
            "name": "Ukrainian Hryvnia",
            "symbol_native": "₴",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "UAH",
            "name_plural": "Ukrainian hryvnias"
        },
        "UGX": {
            "symbol": "USh",
            "name": "Ugandan Shilling",
            "symbol_native": "USh",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "UGX",
            "name_plural": "Ugandan shillings"
        },
        "UYU": {
            "symbol": "$U",
            "name": "Uruguayan Peso",
            "symbol_native": "$",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "UYU",
            "name_plural": "Uruguayan pesos"
        },
        "UZS": {
            "symbol": "UZS",
            "name": "Uzbekistan Som",
            "symbol_native": "UZS",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "UZS",
            "name_plural": "Uzbekistan som"
        },
        "VEF": {
            "symbol": "Bs.F.",
            "name": "Venezuelan Bolívar",
            "symbol_native": "Bs.F.",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "VEF",
            "name_plural": "Venezuelan bolívars"
        },
        "VND": {
            "symbol": "₫",
            "name": "Vietnamese Dong",
            "symbol_native": "₫",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "VND",
            "name_plural": "Vietnamese dong"
        },
        "VUV": {
            "symbol": "Vt",
            "name": "Ni-Vanuatu Vatu",
            "symbol_native": "Vt",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "VUV",
            "name_plural": "Ni-Vanuatu Vatu"
        },
        "XAF": {
            "symbol": "FCFA",
            "name": "CFA Franc BEAC",
            "symbol_native": "FCFA",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "XAF",
            "name_plural": "CFA francs BEAC"
        },
        "XCD": {
            "symbol": "$",
            "name": "East Caribbean Dollar",
            "symbol_native": "$",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "XCD",
            "name_plural": "East Caribbean Dollars"
        },
        "XOF": {
            "symbol": "CFA",
            "name": "CFA Franc BCEAO",
            "symbol_native": "CFA",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "XOF",
            "name_plural": "CFA francs BCEAO"
        },
        "XPF": {
            "symbol": "Fr",
            "name": "CFP franc",
            "symbol_native": "Fr",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "XPF",
            "name_plural": "CFP franc"
        },
        "YER": {
            "symbol": "YR",
            "name": "Yemeni Rial",
            "symbol_native": "ر.ي.‏",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "YER",
            "name_plural": "Yemeni rials"
        },
        "ZAR": {
            "symbol": "R",
            "name": "South African Rand",
            "symbol_native": "R",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "ZAR",
            "name_plural": "South African rand"
        },
        "ZMK": {
            "symbol": "ZK",
            "name": "Zambian Kwacha",
            "symbol_native": "ZK",
            "decimal_digits": 0,
            "rounding": 0,
            "code": "ZMK",
            "name_plural": "Zambian kwachas"
        }
    }];
    tables.addressTable.deleteCurrency(function (response) {
        tables.addressTable.saveCurrency(currency, function (response) {
            res.send(response);
        })
    });

});
router.post('/request-again', function (req, res) {
    var bookingId = req.body.booking_id;
    var userId = req.body.customer_id;

    tables.bookingsTable.checkBookingVendorStatus(bookingId, async function (bookingDetails) {
        if (bookingDetails != undefined && bookingDetails.length != 0) {
            var bookingCount = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "request_count": 1, "customer_country_details": 1 });

            if (bookingCount[0].request_count < 2) {
                var vendorId = bookingDetails[0].vendor_id;
                userId = bookingDetails[0].customer_id;
                var update = await tables.stylistTable.updateWithPromises({ "booking_status": 1 }, { "vendor_id": vendorId });
                var bookingUpdateResponse = await tables.bookingsTable.updateWithPromises({
                    "status": 1,
                    "booking_requested": new Date()
                }, { "_id": bookingId });
                var bookingUpdatBookingResponse = await tables.bookingsTable.updateWithPromisesBooking({ "request_count": 1 }, { "_id": bookingId });
                var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                    "first_name": 1,
                    "last_name": 1
                });
                var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                var stylistType = bookingDetails[0].stylist_type;
                if (stylistType == utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {
                    var salonId = bookingDetails[0]['vendorDetails'].salon_id;

                    //var vendorDetails=await tables.salonTable.findFieldsWithPromises({"_id":salonId},{"vendor_id":1});
                    vendorId = salonId;
                }
                var customerName = 'customer';
                if (customerResponse != undefined && customerResponse.length != 0) {
                    customerName = customerResponse[0].first_name['en'];
                }
                var format = 'YYYY-MM-DD HH:mm:ss';

                var presentDateTime = moment().utc().format(format);
                var data =
                // {
                //     "title": "new Booking",
                //     "message": "There  is request again  from " + customerName,
                //     "booking_id": bookingId,
                //     "type": 1,
                //     "request_time": presentDateTime,
                //     'stylist_type': stylistType
                // };

                {
                    "title": "Yeni Rezervasyon",
                    "message": `${customerName} rezervasyon talebi.`,
                    "booking_id": bookingId,
                    "type": 1,
                    "request_time": presentDateTime,
                    'stylist_type': stylistType
                };


                data['country_id'] = bookingCount[0].customer_country_details.country_id;
                data['city_id'] = bookingCount[0].customer_country_details.city_id;
                data['customer_id'] = userId;
                data['vendor_id'] = vendorId;
                data['notification_type'] = 1;


                tables.notificationsTable.save(data, function (response) {

                });

                if (fcmResponse != undefined && fcmResponse.length != 0) {
                    if (fcmResponse[0].fcm_id != undefined) {

                        utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                    }
                }


                req.app.io.sockets.in(vendorId).emit("order", {
                    "booking_id": bookingId,
                    "type": 2,
                    "notification_data": data
                });

                /* for(var i=0;i<sockets[vendorId].length;i++)
                 {


                 if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined){

                 req.app.io.sockets.in(vendorId).emit("order",{"booking_id":bookingId});
                 }else
                 {
                 sockets[vendorId].slice(i,1);
                 }
                 }*/

                setTimeout(function () {
                    timeOutStylist(bookingId, req.app.io)
                }, 30000);
                return res.send({ "success": true, "message": "stylist requesting", "created_at": presentDateTime });
            } else {
                return res.send({ "success": false, "message": "can't request to stylist", "error_code": 2 });
            }

        } else {
            return res.send({ "success": false, "message": "stylist not avalible", "error_code": 1 });
            return res.send({ "success": false, "message": "stylist not avalible", "error_code": 1 });
        }


    });

});
router.post('/update-fcm', tokenValidations, async function (req, res) {
    var deviceId = req.body.device_id;
    var userId = req.body.user_id;
    var fcmId = req.body.fcm_id;
    var deviceType = req.body.device_type;
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": "Invalid Request",
            "error_code": 1
        });
    }
    if (fcmId == '' || fcmId == undefined) {
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
    fcmData["device_type"] = deviceType;
    var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "tm_user_id": 1 });
    if (customerDetails == undefined || customerDetails.length == 0) {
        return res.send({ "success": false, "message": "Invalid User" });

    }
    var tmUserId = customerDetails[0].tm_user_id;
    tables.fcmTable.update(fcmData, { "customer_id": userId }, async function (response) {
        if (response == null) {


            var save = {};
            save['fcm'] = [];
            save['fcm'].push(fcmData);
            save['customer_id'] = userId;
            tables.fcmTable.save(save, function (response) {

            });
        }
        var fcmUpdate = await utility.updateFcm({
            "fcm_token": fcmId,
            "user_id": tmUserId,
            "device_type": deviceType
        }, utility.user_role_customer);


    });
    return res.send({ "success": true });
});
router.get('/update-timezone', function (req, res) {
    tables.bookingsTable.updateMany({ "time_zone": "Asia/Kolkata" }, {}, function (response) {
        res.send({ "success": true, "response": response });
    });
});
router.post('/delete-surge', function (req, res) {
    tables.surgePriceTable.deleteAllSurgePrices(function (response) {
        res.send({ "success": true, "res": response });
    });
});
router.post('/cancel-salon-order', tokenValidations, function (req, res) {
    var orderId = req.order_id;
    var languageCode = req.body.language_code;

    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (orderId == '' || orderId == undefined) {
        return res.send
            ({
                "success": false,
                "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
                "errorcode": 3
            });
    }
    tables.ordersTable.find({ "_id": orderId }, function (response) {


        tables.bookingsTable.updateMany({ "status": 9 }, {
            "_id": response[0].booking_id,
            "status": 1
        }, async function (response) {

            if (response != undefined) {

                var userId = response[0].customer_id;
                var salonId = response[0].salon_id;
                var salonResponse = await tables.salonTable.findFieldsWithPromises({ "_id": salonId }, { "vendor_id": 1 });
                var vendorId = salonResponse[0].vendor_id;
                var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                    "first_name": 1,
                    "last_name": 1
                });
                var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                var customerName = 'customer';
                if (customerResponse != undefined && customerResponse.length != 0) {
                    customerName = customerResponse[0].first_name;
                }
                // var data = {
                //     "title": "Booking cancelled",
                //     "message": "booking   request cancelled from " + customerName,
                //     "order_id": orderId,
                //     "type": 2
                // };
                var data = {
                    "title": "Rezervasyon Bilgilendirmesi",
                    "message": `Rezervasyon ${customerName} tarafından iptal edildi.`,
                    "order_id": orderId,
                    "type": 2
                };

                data['country_id'] = response[0].customer_country_details.country_id;
                data['city_id'] = response[0].customer_country_details.city_id;
                data['customer_id'] = userId;
                data['vendor_id'] = vendorId;
                data['notification_type'] = 1;
                tables.notificationsTable.save(data, function (response) {
                });
                if (fcmResponse != undefined && fcmResponse.length != 0) {
                    utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                }
                req.app.io.sockets.in(vendorId).emit('salon_request_cancel', { "order_id": orderId })
                /*for(var i=0;i<sockets[vendorId].length;i++)
                    {

                        if(req.app.io.sockets.sockets[sockets[vendorId][i]]!=undefined){
                            req.app.io.sockets.sockets[sockets[vendorId][i]].emit('salon_request_cancel',{"order_id":orderId});
                        }else
                        {
                            sockets[vendorId].slice(i,1);
                        }

                    }*/

            } else {
                return res.send({ "success": false, "message": "try again" });

            }
        });
    });
});
router.post('/cancel-salon-booking', tokenValidations, async function (req, res) {
    var bookingId = req.body.booking_id;
    var languageCode = req.body.language_code;
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
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, {
        "status": 1,
        "net_amount": 1,
        "surge": 1
    });
    if (bookingDetails == undefined || bookingDetails.length == 0) {
        return res.send({ "success": false, "message": "Invalid booking" });
    }

    var bookingStatus = bookingDetails[0].status;
    if (bookingStatus == tables.bookingsTable.status['5'].status) {
        return res.send({ 'success': false, "message": "booking already cancelled by salon" });
    }
    var response = await tables.bookingsTable.getSalonCancellationDetails(bookingId);

    if (response != undefined && response.length != 0) {
        var policyForAcceptance = response[0]['policy_for_acceptance'];
        var policyForArrival = response[0]['policy_for_arrival'];

        var cancellationTime = '';
        var cancellationTimeType = '';
        var cancellationType = '';
        var cancellationTypeValue = '';
        var text = '';
        var acceptanceTotalPolicy = [];
        var arrialTotalPolicy = [];
        var bookingTime = response[0].date + " " + response[0].time;
        var now = new Date();
        var timezone = response[0].time_zone;
        bookingTime = moment(bookingTime).tz(timezone).utc().format();
        bookingTime = new Date(bookingTime);
        var timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
        //var diffMs = (Christmas - today); // milliseconds between now & Christmas
        var diffDays = Math.floor(timeDiff / 86400000); // days
        var diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
        var diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
        var near = response[0].is_notified;
        var type = '';
        var cancellValue = 0;
        var value = 0;


        if (policyForAcceptance != undefined && policyForAcceptance['policy'].length != 0) {
            var arrivalPolicy = policyForAcceptance['policy'];

            arrivalPolicy = arrivalPolicy.sort(compareTimeSalon);

            for (var ar = 0; ar < arrivalPolicy.length; ar++) {
                text = '';
                if (diffDays != 0) {
                    if (diffDays <= arrivalPolicy[ar].cancellation_time);
                    {
                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                            value = arrivalPolicy[ar].cancellation_time;

                        }
                    }


                }
                if (diffHrs != 0) {
                    if (diffHrs <= arrivalPolicy[ar].cancellation_time);
                    {
                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                            value = arrivalPolicy[ar].cancellation_time;
                        }
                    }


                }
                if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {

                    if (diffMins <= arrivalPolicy[ar].cancellation_time);
                    {
                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                            value = arrivalPolicy[ar].cancellation_time;
                        }
                    }
                }

                if (value != 0) {
                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                        type = utility.CANCELLATION_POLICY_TYPE_RATING;
                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                        break;
                    }
                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                        type = utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                        break;
                    }
                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                        type = utility.CANCELLATION_POLICY_TYPE_FLAT;
                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                        break;
                    }

                }

            }
        }
    }

    var update = {};
    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "surge": 1, "net_amount": 1, "vendor_id": 1, "customer_id": 1, "salon_id": 1 });

    if (cancellValue != 0) {



        var netAmount = bookingDetails[0]['net_amount'];
        var surge = bookingDetails[0]['surge'];
        if (surge != undefined) {
            netAmount = netAmount * surge;
        }

        var cancellationAmount = cancellValue;
        if (type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
            cancellationAmount = (netAmount / 100) * cancellValue;
        }
        if (type == utility.CANCELLATION_POLICY_TYPE_RATING) {
            var salonId = bookingDetails[0]['salon_id'];

            var customerId = bookingDetails[0]['customer_id'];
            var save = { "booking_id": bookingId, "customer_id": customerId, "salon_id": salonId, "rated_by": 2, "rating": cancellationAmount, "review": '' };
            var updateRating = await tables.ratingTable.save(save, function (response) {

            });
        }
        var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "payment_type": 1, "customer_country_details": 1 });
        if (bookingDetails && bookingDetails.length && (type != utility.CANCELLATION_POLICY_TYPE_RATING)) {
            var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "strip_id": 1 });
            if (bookingDetails[0].payment_type == 2 && customerDetails) {
                var stripe = require('../utility/stripPayment');
                var stripId = customerDetails[0].strip_id;
                var currencyCode = bookingDetails[0].customer_country_details.currency_code;
                var paymentDetails = await stripe.chargeCustomer(cancellationAmount, currencyCode, stripId);
                update['cancellation_pay_status'] = 2;
                update['payment_status'] = 2;
            }
        } else {
            update['cancellation_pay_status'] = 1;
        }
        update['cancellation_amount'] = cancellationAmount;
        update['cancell_type'] = type;
        update['cancell_type_value'] = cancellValue;
    }
    update['status'] = 4;
    tables.bookingsTable.update(update, { "_id": bookingId, "status": 2 }, function (response) {
        if (response != undefined && response.length != 0) {
            var bookingDetails = response;
            var salonId = response.salon_id;
            var userId = response.customer_id;
            var orderId = response._id;
            res.send({ "success": true, "message": "cancelled successfully" });

            tables.salonTable.find({ "_id": salonId }, async function (response) {

                if (response != undefined && response.length != 0) {
                    var vendorId = response[0].vendor_id;

                    /*setTimeout(function(){
                     timeOutSalon(orderId,req.app.io)
                     },200000);*/

                    var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                        "first_name": 1,
                        "last_name": 1
                    });
                    var fcmResponse = await tables.fcmTable.getFcmIds(salonId);
                    var customerName = 'customer';
                    if (customerResponse != undefined && customerResponse.length != 0) {
                        customerName = customerResponse[0].first_name[languageCode];
                    }
                    var data = {
                        "title": "Rezervasyon Bilgilendirmesi",
                        "message": `Rezervasyon ${customerName} tarafından iptal edildi.`,
                        "order_id": orderId,
                        "type": 3
                    };
                    data['country_id'] = bookingDetails.customer_country_details.country_id;
                    data['city_id'] = bookingDetails.customer_country_details.city_id;
                    data['customer_id'] = userId;
                    data['vendor_id'] = salonId;
                    data['notification_type'] = 1;


                    tables.notificationsTable.save(data, function (response) {
                    });
                    if (fcmResponse != undefined && fcmResponse.length != 0) {

                        utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                    }

                    req.app.io.sockets.in(salonId).emit('salon_booking_cancel', { "booking_id": bookingId })

                    //utility.currencyConvertor.updateSalonbookingConversionValues(bookingIds);
                }

            });
        } else {
            return res.send({ "success": false, "message": "order is not accepted" });
        }
    });
});

router.post('/clear-salon-filter', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body, language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    tables.salonFilteredItemsTable.deleteFilteredItems({ "customer_id": userId }, function (response) {
        return res.send({ "success": true, "message": "updated" });
    });
});
router.post('/update-empolyee-services', function (req, res) {
    tables.salonEmployeesServicesTable.updateMany({ "status": 1 }, {}, function (response) {
        res.send(response);
    });
});
router.post('/cancel-schedule', tokenValidations, function (req, res) {
    var scheduleId = req.body.schedule_id;
    tables.scheduleBookingTable.update({ "status": 3 }, { "_id": scheduleId }, function (response) {
        return res.send({ "success": true, "message": "updated" });
    });
});
router.post('/logout', tokenValidations, async function (req, res) {
    var deviceId = req.body.device_id;
    var fcmId = req.body.fcm_id;
    var userId = req.body.user_id;
    var deviceType = req.body.device_type;
    var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
        "tm_user_id": 1,
        "access_token": 1
    });
    if (customerDetails == undefined || customerDetails.length == 0) {
        return res.send({ "success": true, "message": "Invalid User" });
    }
    var tmUserId = customerDetails[0].tm_user_id;
    deviceType = parseInt(deviceType);
    if (customerDetails[0]['access_token'] != '') {
        tables.activityTable.save({
            "action_id": userId,
            "activity_title": utility.user_logout_text,
            "device_type": deviceType
        },
            function () {
            });
    }
    tables.fcmTable.deleteFcmCusotmer(userId, { "fcm_id": fcmId, "device_id": deviceId }, async function (response) {

        var fcmUpdate = await utility.deleteFcm({
            "fcm_token": fcmId,
            "user_id": tmUserId,
            "device_type": deviceType
        }, utility.user_role_customer);
        if (customerDetails[0].access_token == req.body.access_token) {
            await tables.customerTable.updateWithPromises({ "access_token": '' }, { "_id": userId });
        }

        return res.send({ "success": true, "message": "updated" });
    });
    /*tables.fcmTable.delete*/
});
router.post('/redeem', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var redeemUserId = req.body.redeeem_user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    if (redeemUserId == '' || redeemUserId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    var checkDetails = await tables.customerTable.findFieldsWithPromises({
        "_id": userId,
        "invite.customer_id": redeemUserId
    });
    if (checkDetails == null || checkDetails == undefined || checkDetails.length == 0) {
        return res.send({ "success": false, "message": "invalid user" });
    }
    var updated = await tables.customerTable.updateWithPromises({ "invite.$.is_redeemed": 2 }, {
        "_id": userId,
        "invite.customer_id": redeemUserId
    });
    if (updated != null && updated != undefined && updated.length != 0) {
        return res.send({ "success": true, "message": "invite amount 10$ is added to the wallet" });

    } else {
        return res.send({ "success": false, "message": "amount already redeemed" });

    }
});
router.get('/update-currency', function (req, res) {

    tables.countryTable.update({ "currency_symbol": "د.إ." }, { "_id": "5b757ac8d7dd2a2dd78b4567" }, function (response) {
        res.send({ "success": response })
    });
});
router.get('/update-stylist-location', function (req, res) {
    var latitude = 0;
    var longitude = 0;
    tables.bookingsTable.updateLocation([[parseFloat(longitude), parseFloat(latitude)]], { "_id": '5b8e4c094f3ff622499c9769' });
});

router.post('/city-translate', async function (req, res) {
    var city = req.body.city;
    var cityLan = await utility.translate(city);
    city = cityLan.text;

    return res.send({ "success": true, "city": city })
});

router.post("/promotions", tokenValidations, function (req, res) {
    var city = req.body.city_id;
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (city == '' || city == undefined) {
        return res.send({ "success": false, "message": utility.errorMessages["no promotions"][languageCode] })

        /* return res.send({
             "success": false,
             "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
         });*/
    }
    var promoFor = req.body.promo_for;
    var format = 'YYYY-MM-DD HH:mm:ss';

    var presentDate = moment().utc().format(format);
    if (promoFor == undefined) {
        promoFor = '';
    }
    var salonId = req.body.salon_id;
    if (salonId == '' || salonId == undefined) {
        salonId = '';
    }
    tables.couponsTable.getCouponCodes(city, userId, presentDate, promoFor, salonId, languageCode, function (promoCodes) {
        if (promoCodes != undefined) {
            return res.send({ "success": true, "coupon_codes": promoCodes })
        } else {
            return res.send({
                "success": false,
                "message": "Something went wrong. Please try again after sometime"
            });
        }

    });
});
router.post('/category-urls', function (req, res) {
    tables.categoryTable.getCategoryUrls(function (response) {
        return res.send({ "success": true, "urls": response[0].url })
    });
});
router.post('/check-promo', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var couponCode = req.body.coupon_code;
    couponCode = couponCode.toLowerCase();
    var languageCode = req.body.language_code;
    var scheduleId = req.body.schedule_id;

    var bookingDetails = [];

    if (scheduleId == undefined || scheduleId == '') {
        bookingDetails = await tables.cartTable.checkPromoCartTotal(userId);
    } else {
        bookingDetails = await tables.scheduleBookingTable.checkSchedulePromoCartTotal(scheduleId);
    }

    if (bookingDetails == undefined || bookingDetails.length == 0) {
        return res.send({ "success": false, "message": utility.errorMessages["please select services"][languageCode] })
    }

    var couponDetails = await tables.couponsTable.checkPromoWithPromises(couponCode);

    if (couponDetails == undefined || couponDetails.length == 0) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["coupon code is not valid"][languageCode]
        });
    }

    if (bookingDetails[0]['cart_type'] == 1 && couponDetails[0]['coupon_type'] == 3) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["coupon code is not valid"][languageCode]
        });
    }
    if (couponDetails[0]['coupon_scope'] == utility.COUPON_SCOPE_PRIVATE) {
        var customers = couponDetails[0].customers;

        if (couponDetails[0]['coupon_type'] == utility.COUPON_TYPE_GIFT) {
            customers = [couponDetails[0]['customer_id']];
        }

        var customersDetails = [];


        for (var i = 0; i < customers.length; i++) {
            customersDetails.push(customers[i].toString());
        }
        var index = customersDetails.indexOf(userId);

        if (index === -1) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["coupon code is not valid"][languageCode]
            });
        }
    }
    var format = 'YYYY-MM-DD HH:mm';

    var presentDate = moment().utc().format(format);

    var validFrom = couponDetails[0]['valid_from'];
    var validUpto = couponDetails[0]['expiry_date'];





    if (validFrom != undefined && validFrom != null) {
        if (presentDate < validFrom) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["coupon code is not valid till"][languageCode]
            });
        }
    }

    if (validUpto != undefined && validUpto != null) {
        if (presentDate > validUpto) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["coupon code is expired"][languageCode]
            });
        }
    }


    if (bookingDetails[0]['is_package'] == 1 && (couponDetails[0]['coupon_type'] == utility.COUPON_TYPE_PROMOCODE || couponDetails[0]['coupon_type'] == utility.COUPON_TYPE_COUPON)) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["u can't apply coupon to packages"][languageCode]
        });
    }

    var totallPrice = bookingDetails[0].price;
    var couponType = bookingDetails[0].coupon_type;
    var cityId = couponDetails[0].city_id;

    if (bookingDetails[0].city_id != undefined) {
        var cartCityId = bookingDetails[0].city_id;

        var cities = [];
        for (var i = 0; i < cityId.length; i++) {
            cities.push(cityId[i].toString());
        }
        cartCityId = cartCityId.toString();
        var index = cities.indexOf(cartCityId);

        if (index === -1) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["coupon code is not valid"][languageCode]
            });
        }
    }

    var minAmount = 0;
    if (couponDetails[0].min_amount != undefined) {
        minAmount = couponDetails[0].min_amount;
        if (bookingDetails != undefined) {
            var latitude = bookingDetails[0].latitude;
            var longitude = bookingDetails[0].longitude;
            var checkSurgePrice = await tables.surgePriceTable.checkSurgePriceWithPromises(latitude, longitude);
            var surgePrice = 1.0;
            if (checkSurgePrice != undefined && checkSurgePrice.length != 0) {
                surgePrice = checkSurgePrice[0].surge;
            }
            totallPrice = totallPrice * surgePrice;
            if (totallPrice < minAmount) {
                return res.send({
                    "success": false,
                    "message": utility.errorMessages["cart amount should be minimum"][languageCode] + " " + minAmount
                })
            }
        }
    }
    var amountType = couponDetails[0].amount_type;

    var amount = couponDetails[0].amount;
    if (amountType == 1) {
        if (totallPrice < amount) {
            return res.send({
                "success": false,
                "message": utility.errorMessages["promo amount is higher than cart amount"][languageCode]
            });
        }
    }
    var uptoAmount = couponDetails[0].amount;
    if (couponDetails[0].up_to_amount != undefined) {
        uptoAmount = couponDetails[0].up_to_amount;
    }
    if (amountType == utility.PROMO_FOR_FLAT) {
        uptoAmount = couponDetails[0].min_amount;
    }
    var repeat = couponDetails[0].repeat;
    if (couponType == utility.COUPON_TYPE_GIFT) {
        repeat = 0;
    }
    var couponScope = couponDetails[0].coupon_scope;
    if (repeat != undefined) {
        var bookingDetails = await tables.bookingsTable.checkPromoForCustomer(userId, couponCode, couponScope);

        if (bookingDetails != undefined && bookingDetails.length != 0) {
            var bookingStatus = bookingDetails[0]['status'];

            if (repeat == 0 && (bookingStatus == 2 || bookingStatus == 1 || bookingStatus == 7 || bookingStatus == 8 || bookingStatus == 10)) {
                if (!(bookingStatus == 8 && couponDetails[0].coupon_scope == utility.COUPON_SCOPE_PRIVATE)) {
                    if (bookingDetails != undefined && bookingDetails.length != 0) {
                        return res.send({
                            "success": false,
                            "message": utility.errorMessages["coupon code already used"][languageCode]
                        });
                    }
                }
            } else {
                repeat = repeat + 1;
                if (bookingDetails.length == repeat + 1 && (bookingStatus == 2 || bookingStatus == 1 || bookingStatus == 7 || bookingStatus == 8 || bookingStatus == 10)) {
                    return res.send({
                        "success": false,
                        "message": utility.errorMessages["coupon code already used"][languageCode]
                    });
                }
            }
        }
    }
    if (amount == undefined) {
        amount = 0;
    }
    if (amountType == undefined) {
        amountType = 1;
    }
    uptoAmount = parseInt(uptoAmount);
    var couponId = couponDetails[0]._id;
    if (scheduleId == undefined || scheduleId == '') {
        var promo = await tables.cartTable.updateManyWithPromises({
            "coupon_amount": amount,
            "coupon": couponCode, "coupon_amount_type": amountType, 'min_amount': minAmount,
            'up_to_amount': parseInt(uptoAmount),
            "coupon_id": couponId,
            'coupon_type': couponDetails[0].coupon_type, 'coupon_scope': couponDetails[0].coupon_scope
        },
            { "customer_id": userId, "status": 1 });
    } else {
        var scheduleDetails = await tables.scheduleBookingTable.findFieldsWithPromises({ "_id": scheduleId }, { "cart_id": 1 });

        var promo = await tables.cartTable.updateManyWithPromises({
            "coupon_amount": amount,
            "coupon": couponCode, "coupon_amount_type": amountType, 'min_amount': minAmount,
            'up_to_amount': parseInt(uptoAmount),
            "coupon_id": couponId,
            'coupon_type': couponDetails[0].coupon_type, 'coupon_scope': couponDetails[0].coupon_scope
        },
            { "_id": { "$in": scheduleDetails[0].cart_id } });
    }

    return res.send({
        "success": true, "message": "coupon valid",
        "coupon_amount": amount,
        "coupon_amount_type": amountType,
        "coupon_type": couponType,
        "up_to_amount": uptoAmount
    });
});
router.post('/invite-code', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;
    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Invalid request"][languageCode] });
    }
    tables.customerTable.inviteCodeDetails(userId, languageCode, async function (response) {
        if (response[0].invite_code == undefined) {
            var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                "first_name": 1,
                "last_name": 1
            });

            if (customerDetails != undefined && customerDetails.length != 0) {
                var firstName = customerDetails[0].first_name;
            }

            var genreateInviteCode = await utility.generateInviteCodeCustomer(firstName);
            var update = await tables.customerTable.updateWithPromises({ "invite_code": genreateInviteCode }, { "_id": userId });
            response[0].invite_code = genreateInviteCode;
        }

        if (response[0].invited_users.length) {
            let inviteUsers = response[0].invited_users.filter(function (itm) {
                return itm.first_name != "";
            });
            response[0].invited_users = inviteUsers
        }
        response[0].has_invite_code = 0;

        if (response[0].referral_invite_code != undefined && response[0].referral_invite_code != '') {
            response[0].has_invite_code = 1;

        }
        return res.send({ "success": true, "details": response[0], "reach_amount": 200, "currency": "$" });
    });
});
/*router.post('/check',function(req,res){
    if(userId)
    {

    }
});*/
router.post('/update-profile-pic', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var profilePic = req.body.profile_pic;
    var languageCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Invalid request"][languageCode] });
    }
    if (profilePic == '' || profilePic == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Please Upload Profile pic"][languageCode] });
    }
    tables.customerTable.update({ "profile_pic": profilePic }, { "_id": userId }, function (response) {
        if (response != undefined) {
            return res.send({ "success": true, "message": "updated" });
        } else {
            return res.send({
                "success": false,
                "message": utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode]
            });

        }
    });
});
router.post('/profile-info', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var languageCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: utility.errorMessages["Invalid request"][languageCode] });
    }
    var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
        "first_name": 1,
        "mobile_country": 1,
        "last_name": 1,
        "profile_pic": 1,
        "gender": 1,
        "country": 1,
        "mobile": 1,
        "nationality": 1,
        "email": 1
    });
    if (customerDetails == undefined || customerDetails.length == 0) {
        return res.send({ success: false, message: utility.errorMessages["Invalid user"][languageCode] });
    }
    customerDetails[0]['first_name'] = customerDetails[0]['first_name'][languageCode];
    customerDetails[0]['last_name'] = customerDetails[0]['last_name'][languageCode];
    return res.send({ "success": true, "details": customerDetails[0] });
});
router.post('/remind-invite', function (req, res) {
    var userId = req.body.user_id;
    var inviteUserId = req.body.invite_user_id;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });

    }
    if (inviteUserId == '' || inviteUserId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });

    }
    tables.customerTable.update({ "invite.$.remind": 2 }, {
        "_id": userId,
        "invite.customer_id": inviteUserId
    }, async function (response) {
        var invteUserDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
            "_id": 1,
            "mobile": 1,
            "mobile_country": 1,
            "first_name": 1,
            "last_name": 1
        });
        var userDetails = await tables.customerTable.findFieldsWithPromises({ "_id": inviteUserId }, {
            "_id": 1,
            "mobile": 1,
            "mobile_country": 1,
            "first_name": 1,
            "last_name": 1
        });

        if (userDetails != undefined && userDetails.length != 0) {
            if (response != null) {
                var inviteUser = invteUserDetails[0].first_name + " " + invteUserDetails[0].last_name;
            }
            var mobile = userDetails[0].mobile;
            var mobile_country = userDetails[0].mobile_country;

            var name = userDetails[0].first_name + " " + userDetails[0].last_name;
            var content = 'Hey use mrms app for booking';
            utility.curl.sendingSms(mobile_country + mobile, content, function (response) {
            });
        }
        return res.send({ "success": true, "message": "remined" });
    });
});
router.post('/send-invite', async function (req, res) {
    var userId = req.body.user_id;
    var inviteMobile = req.body.invite_mobile;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });
    }
    if (inviteMobile == '' || inviteMobile == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en']),
            "errorcode": 1
        });

    }
    var userDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
        "_id": 1,
        "mobile": 1,
        "invite_code": 1,
        "first_name": 1,
        "last_name": 1
    });
    if (userDetails != undefined && userDetails.length != 0) {
        var mobile = userDetails[0].mobile;
        var name = userDetails[0].first_name + " " + userDetails[0].last_name;
        var invite_code = userDetails[0].invite_code;
    }
    if (inviteMobile.length != 0) {
        var content = 'Hey use my invite code ' + invite_code + ' for mr&ms app booking ';
        utility.curl.sendingSms(inviteMobile[0], content, function (response) {
        });
    }

    res.send({ "success": true, "message": "invite code Sended" });
});


router.post('/book-to-friend', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var friendDetails = req.body.friend_details;
    if (friendDetails == '' || friendDetails == undefined) {
        return res.send({ "success": false, "message": "Invalid Details" });
    }
    friendDetails = JSON.parse(friendDetails);
    var friendName = friendDetails.friend_name;
    var friendMobile = friendDetails.friend_mobile;
    var details = { "friend_name": friendName, "friend_mobile": friendMobile };
    tables.cartTable.updateMany({ "friend_details": details, "cart_for": 2 }, {
        "customer_id": userId,
        "status": 1
    }, function (response) {
        return res.send({ "success": true })
    });
});

router.post('/delete-city-services', tokenValidations, function (req, res) {
    var serviceId = req.body.service_id;
    var cityId = req.body.city_id;

    tables.cartTable.updateMany({ "status": 3 }, {
        "city_id": { "$in": cityId },
        'service_id': serviceId
    }, function (response) {

    });
    var salonIds = tables.salonTable.findsalonsWithCity(cityId);
    if (salonIds.length != 0) {
        var salons = salonIds[0].salons;
        tables.salonServicesTable.updateMany({ "status": 0 }, {
            "salon_id": { "$in": salons },
            "service_id": serviceId
        }, function (response) {
        });
        tables.salonEmployeesServicesTable.updateMany({ "status": 0 }, {
            "salon_id": { "$in": salons },
            "service_id": serviceId
        }, function (response) {
        })
    }
    var stylistIds = tables.salonTable.findsalonsWithCity(cityId);
    if (stylistIds.length != 0) {
        var stylist = stylistIds[0].stylist;
        tables.stylistServicesTable.updateMany({ "status": 0 }, {
            "salon_id": { "$in": stylist },
            "service_id": serviceId
        }, function (response) {

        });

    }
    return res.send({ "success": true });

});
router.post('/gift-cards', tokenValidations, function (req, res) {
    var city = req.body.city_id;
    var languageCode = req.body.language_code;


    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (city == '' || city == undefined) {
        return res.send({ "success": false, "message": utility.errorMessages["no gift cards"][languageCode] });
        /* return res.send({
         "success": false,
         "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
         });*/
    }

    tables.giftCardsTable.getGiftCards(city, function (response) {
        return res.send({ "success": true, "gifi_card": response });
    });


});
router.post('/remove-coupon-code', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var couponCode = req.body.coupon_code;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }

    if (couponCode == '' || couponCode == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    /* tables.cartTable.updateMany({"coupon":'',"coupon_amount":0,"coupon_amount_type":''},{"coupon":couponCode,"customer_id":userId,'status':1},function(response)
       {*/
    var cartUpdate = await tables.cartTable.removeCoupon({
        "coupon": 1,
        "coupon_amount": 1,
        "coupon_amount_type": 1,
        'up_to_amount': 1,
        'coupon_id': 1,
        'min_amount': 1
    }, { "customer_id": userId, 'status': 1 });

    return res.send({ "success": true, "message": "removed" });
    /* });*/

});

router.post('/buy-gift-card', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var city = req.body.city_id;
    var giftCard = req.body.card_id;
    var languageCode = req.body.language_code;
    var mobile = req.body.mobile;
    var mobileCountry = req.body.mobile_country;


    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    /* if (city == '' || city == undefined)
     {
         return res.send
         ({
             "success": false,
             "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
         });
     }*/
    if (giftCard == '' || giftCard == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
        });
    }
    var checkGiftCard = await tables.giftCardsTable.findFieldsWithPromises({ "_id": giftCard }, {
        "price": 1,
        "country_id": 1,
        "cities": 1,
        "validity": 1
    });
    if (checkGiftCard == undefined || checkGiftCard.length == 0) {
        return res.send({ "success": false, "message": "Invalid gift card" });
    }
    var countryId = checkGiftCard[0].country_id;
    var cities = checkGiftCard[0].cities;
    var price = checkGiftCard[0].price;
    var checkUser = await tables.customerTable.findFieldsWithPromises({
        "mobile": mobile,
        "mobile_country": mobileCountry
    }, { "_id": 1 });
    var gifitedToCustomerId = '';
    if (checkUser == undefined || checkUser.length == 0) {
        checkUser = await tables.customerTable.saveWithPromises({
            "mobile": mobile,
            "mobile_country": mobileCountry,
            "status": 1
        });
        gifitedToCustomerId = checkUser._id
    } else {
        gifitedToCustomerId = checkUser[0]._id;
    }
    var generateGiftCard = await utility.generateGiftCardCode();
    var insertedCouponCode = await tables.giftCardsTable.CreateGiftCardCouponCodeWithPromises({
        "code": generateGiftCard,
        "customer_id": gifitedToCustomerId,
        "gifted_by_customer_id": userId
    }, { "_id": giftCard });
    var id = '';
    for (var i = 0; i < insertedCouponCode['gift_card'].length; i++) {
        if (insertedCouponCode['gift_card'][i]['code'] == generateGiftCard) {
            id = insertedCouponCode['gift_card'][i]['_id'];
        }
    }
    var couponFor = 2;

    if (gifitedToCustomerId == userId) {
        couponFor = 1;
    }
    var giftCustomer = {
        "gift_card": {
            "code": generateGiftCard,
            "gifted_by_customer_id": userId,
            "generated_gift_id": id,
            "gift_id": giftCard,
            'gift_card_type': 1
        }
    };
    var giftByCustomer = {
        "gift_card": {
            "code": generateGiftCard,
            "gifited_to_customer_id": gifitedToCustomerId,
            "generated_gift_id": id,
            "gift_id": giftCard,
            'gift_card_type': 2
        }
    };
    var couponGift = {
        'city_id': cities,
        'coupon_scope': 2,
        'coupon_gift_for': couponFor,
        'coupon_type': utility.COUPON_TYPE_GIFT,
        "gift_id": giftCard,
        'country_id': countryId,
        'customer_id': gifitedToCustomerId,
        'gifted_by_customer_id': userId,
        'min_amount': price,
        'amount': price,
        "coupon_code": generateGiftCard,
        "amount_type": 1
    };


    if (checkGiftCard[0].validity != undefined) {
        var validity = checkGiftCard[0].validity;
        var validityType = validity.type;
        var validityValue = validity.value;
        var dateTimeFormat = 'YYYY-MM-DD';
        var startDateTime = moment.utc();
        var startDate = startDateTime.format(dateTimeFormat);
        var expiryDate = '';
        if (validityType == 1) {

            expiryDate = moment(startDateTime).add(validityValue, 'days');
            expiryDate = expiryDate.format(dateTimeFormat)
        } else if (validityType == 2) {
            expiryDate = moment(startDateTime).add(validityValue, 'months');
            expiryDate = expiryDate.format(dateTimeFormat)
        } else if (validityType == 4) {
            expiryDate = moment(startDateTime).add(validityValue, 'years');
            expiryDate = expiryDate.format(dateTimeFormat)
        }
        giftCustomer['gift_card']['expiry_date'] = expiryDate;
        giftByCustomer['gift_card']['expiry_date'] = expiryDate;
        couponGift['expiry_date'] = expiryDate;
    }
    var customer = await tables.customerTable.updateAddToSet(giftCustomer, { "_id": gifitedToCustomerId });
    var customerUpdate = await tables.customerTable.updateAddToSet(giftByCustomer, { "_id": userId });
    var updateCoupon = await tables.couponsTable.saveWithPromises(couponGift);

    return res.send({ "success": true, "gift_code": generateGiftCard });
});
router.post('/delete-address', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var addressId = req.body.address_id;
    tables.addressTable.deleteAddress({ "_id": addressId }, function (response) {
        return res.send({ "success": true, "message": 'updated' });
    });
});
router.post('/user-gift-cards', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    var type = req.body.type;
    var cityId = req.body.city_id;

    if (type != '' && type != undefined) {
        tables.giftCardsTable.unUseduserGiftCardList(userId, cityId, function (response) {
            if (response == undefined) {
                response = [];
            }
            return res.send({ "success": true, "gift_cards": response });

        });
    } else {
        tables.giftCardsTable.userGiftCardList(userId, function (response) {
            if (response == undefined) {
                response = [];
            }
            return res.send({ "success": true, "gift_cards": response });

        });
    }

});
router.post('/check-stylist-for-service', tokenValidations, async function (req, res) {
    var serviceId = req.body.service_id;
    var serviceFor = req.body.service_for;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var cityId = req.body.city_id;
    var duration = req.body.duration;
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (serviceId == '' || serviceId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 1
        });
    }
    if (serviceFor == '' || serviceFor == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 2
        });
    }
    if (latitude == '' || latitude == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 3
        });
    }
    if (longitude == '' || longitude == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 4
        });
    }
    var cityDetails = await tables.citiesTable.findFieldsWithPromises({ "_id": cityId }, { "time_zone": 1 });
    var timeZone = '';

    if (cityDetails != undefined && cityDetails.length != 0) {
        timeZone = (cityDetails[0].time_zone == undefined ? 'Asia/Kolkata' : cityDetails[0].time_zone);
    }

    serviceFor = parseInt(serviceFor);
    duration = 30;
    tables.vendorLocationTable.checkStylistsForServices(serviceId, serviceFor, duration, latitude, longitude, timeZone, cityId, function (response) {
        if (response != undefined && response.length != 0) {
            if (response[0].service_levels != undefined && response[0].service_levels.length != 0) {
                return res.send({ "success": true, "service_levels": response[0].service_levels });
            } else {
                return res.send({ "success": true, "service_levels": [] });
            }
        } else {
            return res.send({ "success": true, "service_levels": [] });

        }
    });
});
router.post('/update-password', tokenValidations, async function (req, res) {
    var oldPassword = req.body.old_password;
    var newPassword = req.body.new_password;
    var userId = req.body.user_id;
    var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
        "password": 1,
        "hash": 1
    });
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {

        languageCode = 'en';

    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid user"][languageCode] : utility.errorMessages["Invalid user"]['en'])
            , "error_code": 1
        });
    }
    if (customerDetails == undefined || customerDetails.length == 0) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid user"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "error_code": 2
        });
    }
    var decryptPassword = decrypt(customerDetails[0].password, customerDetails[0].hash);
    var update = {};
    if (decryptPassword == oldPassword) {
        if (newPassword.length < 5) {
            return res.send({
                "success": false,
                "message": "Password should contain minimum 6 characters"
            });
        }
        async.series([
            function (callback) {

                generateHash(function (hash) {

                    update["password"] = encrypt(newPassword, hash);
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
                tables.customerTable.update(update, { "_id": userId }, function (response) {
                    if (response != null && response.length != 0) {
                        return res.send({
                            "success": true,
                            "message": "update success"
                        });
                    } else {

                        return res.send({ "success": false, "message": "try Again", "error_code": 4 });

                    }
                });
            });
    } else {
        return res.send({
            "success": false,
            "message": "Invalid password"
            , "error_code": 3
        });
    }
});
router.post('/update-user-profile', tokenValidations, async function (req, res) {
    var firstName = req.body.first_name,
        lastName = req.body.last_name,
        email = req.body.email_id,
        nationality = req.body.nationality,
        nationalityShortCode = req.body.nationality_code,
        gender = parseInt(req.body.gender),
        userId = req.body.user_id,
        languageCode = req.body.language_code,
        preferredStyle = req.body.preferred_style,
        stylistGender = req.body.stylist_gender;
    var update = {};
    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: "Invalid  request" });
    }

    if (trim(firstName) === "") {
        return res.send({
            "success": false,
            "message": "Please provide your first name."
        });
    }

    /* if (!utility.isValidName(firstName)) {
     return res.send({
     "success": false,
     "message": "Please provide valid first name."
     });
     }*/

    update["first_name." + languageCode] = firstName;

    if (trim(lastName) === "") {
        return res.send({
            "success": false,
            "message": "Please provide your last name."
        });
    }

    /*if (!utility.isValidName(lastName)) {
     return res.send({
     "success": false,
     "message": "Please provide valid last name."
     });
     }*/

    update["last_name." + languageCode] = lastName;

    if (trim(nationality) == "") {
        return res.send({
            "success": false,
            "message": "Please provide your nationality."
        });
    }

    if (trim(nationalityShortCode) == "") {
        return res.send({
            "success": false,
            "message": "Nationality code is required."
        });
    }
    update["nationality"] = {
        "nationality": nationality,
        "shortCode": nationalityShortCode
    };
    if (gender === "") {
        return res.send({
            "success": false,
            "message": "Please provide your gender."
        });
    }
    if (!utility.isValidGender(gender)) {
        return res.send({
            "success": false,
            "message": "Please provide valid gender."
        });
    }

    update["gender"] = gender;

    if (preferredStyle != undefined && trim(preferredStyle) != "") {
        preferredStyle = preferredStyle.split(",");
        update["preferred_style"] = preferredStyle;
    }

    if (stylistGender != undefined && trim(stylistGender) != "") {
        stylistGender = stylistGender.split(",");
        var stylistGenderLength = stylistGender.length;
        var stylistGenderFlag = [];
        for (var g = 0; g < stylistGenderLength; g++) {
            if (!utility.isValidGender(parseInt(stylistGender[g]))) {
                stylistGenderFlag.push(0);
            }
        }
        if (stylistGenderFlag.indexOf(0) != -1) {
            return res.send({
                "success": false,
                "message": "Please provide valid stylist gender."
            });
        }
        update["stylist_gender"] = stylistGender;
    }


    if (email == '' || email == undefined) {
        return res.send({
            "success": false,
            "message": "Please enter email."
        });
    }
    update["updated"] = Date.now();
    email = email.toLowerCase();
    update['email'] = email;

    var checkEmail = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1 });
    if (checkEmail != undefined && checkEmail.length != 0 && checkEmail[0]['_id'] != userId) {

        return res.send({ "success": false, "message": "email already exists" });
    }
    tables.customerTable.find({ "_id": userId }, async function (response) {

        if (response != undefined) {
            var mobileCountry = response[0]['mobile_country'];
            var mobile = response[0]['mobile'];
            var tmUserId = response[0]['tm_user_id'];
            tables.customerTable.update(update, { "_id": userId }, async function (response) {

                if (response != null && response.length != 0) {
                    var update = await utility.updateTmProfile({
                        "name": firstName + ' ' + lastName,
                        'email': email,
                        "mobile": mobileCountry + '' + mobile,
                        'user_id': tmUserId
                    });

                    return res.send({ "success": true, "name": firstName + ' ' + lastName, "message": "success" });
                } else {
                    return res.send({
                        "success": false,
                        "status": 4,

                        "message": "something went wrong. Please try again after sometime.",
                        "name": firstName + ' ' + lastName
                    });
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
router.post('/languages', tokenValidations, function (req, res) {
    var languageCode = req.body.language_code;

    tables.languagesTable.aggregateFind(languageCode, function (response) {
        return res.send({ "success": true, "languages": response });
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
router.post('/save-social-login', tokenValidations, async function (req, res) {
    var firstName = req.body.first_name;
    var lastName = req.body.last_name;
    var mobile = req.body.mobile;
    var mobileCountry = req.body.mobile_country;
    var email = req.body.email;
    var nationality = req.body.nationality;
    var nationalityShortCode = req.body.nationality_code;


    if (nationality == "" || trim(nationality) == "") {
        return res.send({
            "success": false,
            "message": "Please provide your nationality."
        });
    }
    if (nationalityShortCode == "" || trim(nationalityShortCode) == "") {
        return res.send({
            "success": false,
            "message": "Nationality code is required."
        });
    }
    var languageCode = req.body.language_code;
    if (languageCode == '' || languageCode == undefined) {
        languageCode = 'en';
    }
    if (firstName == '' || firstName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid user"][languageCode] : utility.errorMessages["Invalid user"]['en'])
            , "error_code": 1
        });
    }
    if (lastName == '' || lastName == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid user"][languageCode] : utility.errorMessages["Invalid user"]['en'])
            , "error_code": 2
        });
    }
    if (mobile == '' || mobile == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid user"][languageCode] : utility.errorMessages["Invalid user"]['en'])
            , "error_code": 3
        });
    }
    if (mobileCountry == '' || mobileCountry == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid user"][languageCode] : utility.errorMessages["Invalid user"]['en'])
            , "error_code": 4
        });
    }
    var gender = req.body.gender;
    gender = parseInt(gender);
    var checkMobile = await tables.customerTable.findFieldsWithPromises({
        "mobile": mobile,
        "mobile_country": mobileCountry
    }, { "_id": 1, "status": 1, 'is_social_login': 1, "email": 1 });

    if (checkMobile != undefined && checkMobile.length != 0 && checkMobile[0]['status'] != 1 && checkMobile[0]['email'] != email) {
        return res.send({ "success": false, "message": utility.errorMessages["mobile number already exists"][languageCode] });
    }
    var customerDetails = [];
    var otp = utility.generateOtp();
    // var otp=1234;
    var message = '';
    message = 'your otp for registration into mr&ms is ' + otp;
    var encodeMessage = encodeURIComponent(message);
    utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

    });
    var userId = '';
    var firstNameTranslate = await utility.translateText(firstName, languageCode);
    firstNameTranslate[languageCode] = firstName;
    var lastNameTranslate = await utility.translateText(lastName, languageCode);
    lastNameTranslate[languageCode] = lastName;
    var checkEmail = await tables.customerTable.findFieldsWithPromises({ "email": email }, { "_id": 1 });
    if (checkEmail.length != 0) {
        userId = checkEmail[0]['_id'];
        customerDetails = await tables.customerTable.updateWithPromises({
            "mobile": mobile, "mobile_country": mobileCountry,
            'first_name': firstNameTranslate, "last_name": lastNameTranslate,
            'is_social_login': 1,
            'email': email,
            'gender': gender,
            'otp': otp,
            "nationality": {
                "nationality": nationality,
                "shortCode": nationalityShortCode
            }
        }, { "_id": userId });

    } else {
        customerDetails = await tables.customerTable.saveWithPromises({
            "mobile": mobile, "mobile_country": mobileCountry,
            'first_name': firstNameTranslate, "last_name": lastNameTranslate,
            'status': 1,
            'is_social_login': 1,
            'email': email,
            'gender': gender,
            'otp': otp,
            "nationality": {
                "nationality": nationality,
                "shortCode": nationalityShortCode
            }
        });
        userId = customerDetails._id;

    }

    return res.send({
        "success": true, "status": customerDetails.status,
        "message": "otp verification",
        "user_id": userId
    });
});

router.post('/change-profile-password', tokenValidations, async function (req, res) {
    var userId = req.body.user_id;
    var password = req.body.password;
    var oldPassword = req.body.old_password;
    var update = {};
    var languageCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({ success: false, message: "Invalid  request" });
    }

    if (password == '' || password == undefined) {
        return res.send({ "success": false, "message": "Please enter password" })
    } else if (password.length < 5) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Password should contain minimum 6 characters"][languageCode]
        });
    }

    if (oldPassword == '' || oldPassword == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Please enter old password"][languageCode]
        });
    }

    var result = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "password": 1, "hash": 1 });
    if (result == undefined || result.length == 0) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid user"][languageCode]
        });
    }
    if (decrypt(result[0].password, result[0].hash) != oldPassword) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Incorrect current password"][languageCode]
        });
    }
    async.series([
        function (callback) {
            /*  if (email != '' && email != undefined) {

             if (!utility.isValidEmail(email)) {
             return callback("invalid email");
             }

             customerTable.find({email: email}, function (response) {
             if (response.length == 0) {
             update['email'] = email;

             generateHash(function (hash) {
             var password = req.body.password;
             update["password"] = encrypt(password, hash);
             update['hash'] = hash;
             update['status']=3
             return callback(true);
             });
             } else {
             var err = null;
             return callback(err);
             }
             });
             } else {
             callback();
             }*/
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
            tables.customerTable.update(update, { "_id": userId }, function (response) {
                if (response != undefined) {
                    return res.send({
                        "success": true,
                        "status": 4,
                        "message": "update password",
                        "user_id": response._id
                    });
                } else {
                    return res.send({
                        "success": false,
                        "message": "Invalid user"
                    });
                }
            });
        });
});
router.post('/resend-otp', tokenValidations, function (req, res) {
    var otpType = req.body.otp_type;
    var languageCode = req.body.language_code;

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

                tables.customerTable.findFields({ _id: userId }, { "status": 1, "_id": 0 }, function (result) {
                    if (result != undefined && result.length) {
                        if (result[0].status > tables.customerTable.status[3].status) {
                            return callback({
                                success: false,
                                message: utility.errorMessages["Your accountant is already verified. Please login."][languageCode]
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

                /*tables.customerTable.find({_id: userId, otp: otp}, function (result){

                    if (otp == '' || otp == undefined)
                    {
                        return res.send({success: false, message: "Please enter otp"});
                    }

                    if (!result.length){
                        return res.send({
                            "success": false,
                            "message": "Invalid OTP"
                        });
                    }else{
                        tables.customerTable.update({"status": tables.customerTable.status[2].status},{
                            "_id": userId,
                            "otp": otp
                        }, function (response) {
                            if (response != null && response.length != 0) {
                                return res.send({
                                    "success": true,
                                    "status": 2,
                                    "message": "update your password",
                                    "user_id": response._id
                                });
                            } else {
                                return res.send({"success": false, "status": 1, "message": "Invalid otp"});
                            }
                        });
                    }
                });*/
                var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, {
                    "mobile": 1,
                    "mobile_country": 1
                });

                var mobile = customerDetails[0].mobile;
                var mobileCountry = customerDetails[0].mobile_country;
                var otp = utility.generateOtp();
                // var otp=1234;

                var message = 'your otp for registration into mr&ms is ' + otp;
                var encodeMessage = encodeURIComponent(message);
                utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

                });
                var updateReqponse = await tables.customerTable.updateWithPromises({ 'otp': otp }, { "_id": userId });
                return res.send({
                    "success": true,
                    "status": 1,
                    "message": "otp sent",
                    "otp": otp
                });
            });
    } else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_EMAIL) {

    } else if (otpType == utility.OTP_TYPE_FORGOT_PASSWORD_MOBILE) {


        tables.customerTable.findFields({ _id: userId }, { "mobile": 1, mobile_country: 1 }, function (response) {
            if (!response.length) {
                return res.send({
                    "success": false,
                    "message": "Mobile number is not registered."
                });
            } else {
                var mobile = response[0].mobile;
                var mobileCountry = response[0].mobile_country;
                var otp = utility.generateOtp();

                var message = 'your otp for reset password into mr&ms is ' + otp;
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
    } else {
        return res.send({ "success": false, "message": "Invalid request" });
    }

});
router.post('/send-otp-verify-device', tokenValidations, function (req, res) {
    var userId = req.body.user_id;
    /*tables*/
    var languageCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid Request"][languageCode]
        });
    }
    tables.customerTable.findFields({ _id: userId }, { "mobile": 1, mobile_country: 1 }, function (response) {
        if (!response.length) {
            return res.send({
                "success": false,
                "message": "Mobile number is not registered."
            });
        } else {
            var mobile = response[0].mobile;
            var mobileCountry = response[0].mobile_country;
            var otp = utility.generateOtp();
            var message = 'your otp for verify device into mr&ms is ' + otp;
            var encodeMessage = encodeURIComponent(message);
            utility.curl.sendingSms(mobileCountry + mobile, encodeMessage, function (response) {

            });
            tables.otpTable.find({
                data: mobile,
                otp_type: utility.OTP_TYPE_VERIFY_DEVICE,
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
                                "mobile": mobile,
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
                            "mobile": mobile,
                            "message": "OTP has been sent to " + mobile
                        });
                    });
                }
            });
        }
    });
});
router.get('/update-country', async function (req, res) {
    var cityDetails = await tables.countryTable.findFieldsWithPromises({}, { "country": 1, "_id": 1 });
    var cityName = '';
    var result = [];
    for (var c = 0; c < cityDetails.length; c++) {
        cityName = cityDetails[c]['country'];
        var cityId = cityDetails[c]['_id'];
        var update = await tables.countryTable.updateWithPromises({ "country": { "en": cityName } }, { "_id": cityId });
        result.push(update);
    }
    res.send(result);
});
router.get('/update-city', async function (req, res) {
    var cityDetails = await tables.citiesTable.findFieldsWithPromises({}, { "city_name": 1, "_id": 1 });
    var cityName = '';
    var result = [];
    for (var c = 0; c < cityDetails.length; c++) {
        cityName = cityDetails[c]['city_name'];
        var cityId = cityDetails[c]['_id'];
        var update = await tables.citiesTable.updateWithPromises({ "city_name": { "en": cityName } }, { "_id": cityId });
        result.push(update);
    }
    res.send(result);
});
router.post('/card-list', async function (req, res) {
    var userId = req.body.user_id;
    /*tables*/
    var languageCode = req.body.language_code;

    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": utility.errorMessages["Invalid Request"][languageCode]
        });
    }
    var cardDetails = await tables.customerTable.getPaymentCard(userId);
    if (cardDetails != undefined && cardDetails.length != 0 && cardDetails[0].payment != undefined) {
        cardDetails = cardDetails[0].payment
    }
    return res.send({ "success": true, "payment": cardDetails });

});
router.post('/delete-card', tokenValidations, async function (req, res) {
    let userId = req.body.user_id;
    let cardId = req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
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

    let updateBranch = await tables.customerTable.updateWithPromises({ "payment.$.status": 0 }, { "_id": userId, "payment._id": cardId });

    if (updateBranch) {
        return res.send({ "success": true, "message": "Deleted Successfully" });
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
});
router.post('/update-card', async function (req, res) {
    let userId = req.body.user_id;
    let cardId = req.body.card_id;
    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    if (userId == '' || userId == undefined) {
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
    var customerDetails = await tables.customerTable.getPaymentCardDetails(userId, cardId);
    if (!customerDetails) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });

    }

    var stripCardId = customerDetails[0]['payment']['id']; s
    var stripCustomerId = customerDetails[0]['strip_id'];
    var stripe = require("../utility/stripPayment");

    var paymentResponse = await stripe.updateCustomerCard(stripCardId, stripCustomerId);

    if (!paymentResponse) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
    let updateBranchCard = await tables.customerTable.updateWithPromises({ "payment.$.is_primary": 0 }, { "_id": userId, "payment.is_primary": 1 });
    let updateBranch = await tables.customerTable.updateWithPromises({ "payment.$.is_primary": 1 }, { "_id": userId, "payment._id": cardId });

    if (updateBranch) {
        var cardDetails = await tables.customerTable.getPaymentCardDetails(userId, cardId);
        return res.send({ "success": true, "message": "Updated Successfully", "card_details": cardDetails[0].payment });
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
        });
    }
});
// router.post('/update-booking-payment', async function (req, res) {
//     let userId = req.body.user_id;
//     let languageCode = req.body.language_code;
//     let paymentType = req.body.payment_type;
//     let bookingId = req.body.booking_id;
//     if (languageCode == undefined) {
//         languageCode = 'en';
//     }

//     if (userId == '' || userId == undefined) {
//         return res.send({
//             "success": false,
//             "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
//             , "errorcode": 1
//         });
//     } if (bookingId == '' || bookingId == undefined) {
//         return res.send({
//             "success": false,
//             "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
//             , "errorcode": 2
//         });
//     }

//     if (paymentType == utility.PAYMENT_TYPE_CARD) {

//         var customerDetails = await tables.customerTable.getPaymentDefaultCard(userId);

//         if (!customerDetails || !customerDetails[0] || !customerDetails[0]['payment']) {
//             return res.send({
//                 "success": false,
//                 "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
//                 "error_code": 4,
//                 "card_details": {}
//             });
//         }
//         var cardId = '';

//         if (customerDetails && customerDetails[0]['payment']) {
//             cardId = customerDetails[0]['payment']['_id']
//         }
//         var card = await tables.customerTable.getPaymentCardDetails(userId, cardId);

//         var updateCartResponse = await tables.bookingsTable.updateWithPromises({ "payment_details": card[0], "card_id": cardId, "payment_type": paymentType }, { "_id": bookingId });
//         return res.send({
//             "success": true,
//             "message": "Updated",
//             "card_details": customerDetails[0]['payment']
//         });
//     } else {
//         await tables.bookingsTable.updateWithPromises({ "payment_details": {}, "payment_type": paymentType }, { "_id": bookingId });
//         return res.send({ "success": true, "message": "Updated Successfully" });

//     }


//     return res.send({
//         "success": false,
//         "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
//     });

// });

router.post('/update-booking-payment', async function (req, res) {
    let userId = req.body.user_id;
    let languageCode = req.body.language_code;
    let paymentType = req.body.payment_type;
    let bookingId = req.body.booking_id;
    let cardId = req.body.cardId;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (bookingId == '' || bookingId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 2
        });
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    if (paymentType == utility.PAYMENT_TYPE_CARD) {
        // var getPaymentDefaultCarddetails = await tables.customerTable.getUserDefaultCardDetails(userId);
        // if (!getPaymentDefaultCarddetails || !getPaymentDefaultCarddetails[0]) {
        //     return res.send({
        //         "success": false,
        //         "message": (utility.errorMessages["Please Add Card To Proceed"][languageCode] != undefined ? utility.errorMessages["Please Add Card To Proceed"][languageCode] : utility.errorMessages["Please Add Card To Proceed"]['en']),
        //         "error_code": 4,
        //         "card_details": {}
        //     });
        // }
        // var cardId = '';

        // if (getPaymentDefaultCarddetails && getPaymentDefaultCarddetails[0]) {
        //     cardId = getPaymentDefaultCarddetails[0]['_id']
        // }
        // var card = await tables.customerTable.getPaymentCardDetails(userId, cardId);
        let card = {}
        let getcarddetails = await tables.paymentcardTable.returnusercardsbyId(req.body.cardId);

        if (getcarddetails && getcarddetails[0]) {
            card = getcarddetails[0]
        } else {
            return res.send({
                "success": false,
                "message": ("No card found")
                , "errorcode": 2
            });
        }


        var updateCartResponse = await tables.bookingsTable.updateWithPromises({ "payment_details": card, "card_id": cardId, "payment_type": paymentType }, { "_id": bookingId, "payment_status": 2 });
        return res.send({
            "success": true,
            "message": "Updated",
            "card_details": getcarddetails[0]
        });
    } else {
        await tables.bookingsTable.updateWithPromises({ "card": {}, "card_id": "", "payment_details": {}, "payment_type": paymentType }, { "_id": bookingId });
        return res.send({ "success": true, "message": "Updated Successfully" });

    }


    return res.send({
        "success": false,
        "message": (utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] != undefined ? utility.errorMessages["Something went wrong. Please try again after sometime"][languageCode] : utility.errorMessages["Something went wrong. Please try again after sometime"]['en'])
    });

});

router.post('/time-slots', function (req, res) {
    var cityId = req.body.city_id;
    if (cityId == '' || cityId == undefined) {
        return res.send({ "success": false, "message": "Invalid  request" });
    }
    tables.citiesTable.getTimeSlots(cityId, function (response) {
        return res.send({ "success": true, "data": response[0] });
    });
});

router.post('/time-out-stylist', function (req, res) {
    tables.bookingsTable.updateMany({ "status": 3 }, { "status": 1 }, function (response) {
        res.send({ "success": true, "message": response });
    });
});


//izyco payment gateway apis
router.post('/add-card-details', async function (req, res) {

    let languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (req.body.add_email == '' || req.body.add_email == undefined || req.body.add_card_nick_name == '' || req.body.add_card_nick_name == undefined || req.body.add_card_name == '' || req.body.add_card_name == undefined || req.body.add_card_number == '' || req.body.add_card_number == undefined || req.body.add_exp_month == '' || req.body.add_exp_month == undefined || req.body.add_exp_year == '' || req.body.add_exp_year == undefined || req.body.add_last_4digits == '' || req.body.add_last_4digits == undefined, req.body.UserId == '' || req.body.UserId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    var cardnumber = `${req.body.add_card_number.charAt(0)}***********${req.body.add_last_4digits}`;
    tables.paymentcardTable.save({
        "add_coversation_id": new Date().getTime(),
        "add_email": req.body.add_email,

        "add_card_nick_name": req.body.add_card_nick_name,
        "add_card_name": req.body.add_card_name,
        "add_card_number": cardnumber,
        "add_exp_month": req.body.add_exp_month,
        "add_exp_year": req.body.add_exp_year,
        "add_last_4digits": req.body.add_last_4digits,
        "CVV": req.body.CVV,
        "status": 0,
        "UserId": req.body.UserId





    }, async function (response) {
        if (response == "allready added") {
            return res.send({
                "success": false,

                // "message": "Duplicate card"
                "message": "Bu kart daha önceden eklenmiş"


            });
        } else {
            response.ExternalId = response._id;
            if (response != undefined) {


                req.body.add_external_id = response._id
                req.body.add_coversation_id = response.add_coversation_id;
                console.log(req.body)
                var finalobj = JSON.stringify(req.body);
                var encriptobj = Buffer.from(finalobj).toString('base64')

                var url = "";
                if (await publicIp.v4() == "3.212.189.52") {
                    url = `${utility.testurl}payment_sdk/samples/create_card.php?str=${encriptobj}`
                } else if (await publicIp.v4() == "35.169.9.99") {
                    url = `${utility.produrl}payment_sdk/samples/create_card.php?str=${encriptobj}`

                }

                return res.send({
                    "success": true,
                    "status": 1,
                    "url": url,
                    "response": response

                });
            }
        }



    });
});


//update card details
router.post('/update-card-details', async function (req, res) {
    console.log("req.body>>>>>>>>>", req.body)
    if (req.body.card_result) {
        req.body.card_result = JSON.parse(req.body.card_result)
    } if (req.body.payment_result) {
        req.body.payment_result = JSON.parse(req.body.payment_result)
    }



    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }


    tables.paymentcardTable.updatedocument(req, (response) => {

        if (response) {
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


router.post('/update-first-payment', async function (req, res) {

    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (req.body.card_result) {
        req.body.card_result = JSON.parse(req.body.card_result)
    } if (req.body.payment_result) {
        req.body.payment_result = JSON.parse(req.body.payment_result)
    }


    tables.paymentcardTable.updatedocument(req, (response) => {

        if (response.nModified == 1) {
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


//get user cards
router.post('/get-user-cards', async function (req, res) {

    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    tables.paymentcardTable.gatusercards(req, (response) => {

        if (response) {
            return res.send({
                "success": true,
                "message": "success",
                "response": response
            });
        } else {
            return res.send({
                "success": false,
                "message": "failed",
                "response": response
            });
        }

    })





});

//get card by id
router.post('/get-user-cards-byId', async function (req, res) {

    let languageCode = req.body.language_code;
    if (languageCode == undefined) {
        languageCode = 'en';
    }

    tables.paymentcardTable.gatusercardsbyId(req, (response) => {

        if (response) {
            return res.send({
                "success": true,
                "message": "success",
                "response": response[0]
            });
        } else {
            return res.send({
                "success": false,
                "message": "failed",
                "response": response[0]
            });
        }

    })





});


//online payment
router.post('/online-payment', async function (req, res) {
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
    } if (req.body.basketItems == '' || req.body.basketItems == undefined) {
        return res.send({
            "success": false,
            "message": "basketItems object required"
            , "errorcode": 1
        });
    } if (req.body.basketId == '' || req.body.basketId == undefined) {
        return res.send({
            "success": false,
            "message": "basketId object required"
            , "errorcode": 1
        });
    }



    req.body.status = "0"
    var total = 0;
    req.body.totalmarchantamount = 0;
    for (var i = 0; i < req.body.basketItems.length; i++) {
        var basketitemdata = await tables.customerTable.getbasketdata(req.body.basketItems[i].id)

        if (basketitemdata.vendorbankdetails[0].submarchantkey == null || basketitemdata.vendorbankdetails[0].submarchantkey == undefined || basketitemdata.vendorbankdetails[0].submarchantkey == "") {
            return res.send({
                "success": false,
                "message": "vendorbank details not found"
                , "errorcode": 1
            });
        } else if (basketitemdata.bookkingPercentage[0] == null || basketitemdata.bookkingPercentage[0] == undefined || basketitemdata.bookkingPercentage[0] == "") {
            return res.send({
                "success": false,
                "message": "bookkingPercentage not found"
                , "errorcode": 1
            });
        } else {

            req.body.vendorId = basketitemdata.vendorbankdetails[0].vendorId;
            req.body.paidPrice = Number(req.body.paidPrice);
            req.body.basketItems[i].submarchantkey = basketitemdata.vendorbankdetails[0].submarchantkey;
            // let basketmarchantamount = Number(req.body.basketItems[i].price) - ((((Number(req.body.basketItems[i].price)) * utility.iyzico_percentage) / 100) + Number(utility.iyzico_commission));
            let basketmarchantamount = Number(req.body.basketItems[i].price);

            req.body.basketItems[i].marchantamount = (((Number(basketmarchantamount) * (100 - Number(basketitemdata.bookkingPercentage[0].booking_percentage)))) / 100).toFixed(2);
            req.body.totalmarchantamount = Number(req.body.totalmarchantamount) + Number(req.body.basketItems[i].marchantamount);
            req.body.conversationId = new Date().getTime();


            if (i == req.body.basketItems.length - 1) {

                var updateddata = await tables.paymentcardTable.updatepaymentinbookings({ _id: req.body.basketId }, { totalmarchantamount: Number(req.body.totalmarchantamount) })

                tables.paymentcardTable.addpayment(req.body, async (response) => {

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
            }
        }

    }


});


//online payment
router.post('/online-payment-cancelamount', async function (req, res) {
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
    } if (req.body.basketItems == '' || req.body.basketItems == undefined) {
        return res.send({
            "success": false,
            "message": "basketItems object required"
            , "errorcode": 1
        });
    } if (req.body.basketId == '' || req.body.basketId == undefined) {
        return res.send({
            "success": false,
            "message": "basketId object required"
            , "errorcode": 1
        });
    }



    req.body.status = "0"
    var total = 0;
    req.body.totalmarchantamount = 0;
    for (var i = 0; i < req.body.basketItems.length; i++) {
        var basketitemdata = await tables.customerTable.getbasketdataforcancelamount(req.body.vendorId);

        if (basketitemdata.bookkingPercentage[0] == null || basketitemdata.bookkingPercentage[0] == undefined || basketitemdata.bookkingPercentage[0] == "") {
            return res.send({
                "success": false,
                "message": "bookkingPercentage not found"
                , "errorcode": 1
            });
        } else {

            req.body.vendorId = req.body.vendorId;
            req.body.paidPrice = Number(req.body.paidPrice);
            req.body.basketItems[i].submarchantkey = basketitemdata.vendorbankdetails[0].submarchantkey;

            let basketmarchantamount = Number(req.body.basketItems[i].price) - ((((Number(req.body.basketItems[i].price)) * utility.iyzico_percentage) / 100) + Number(utility.iyzico_commission));
            req.body.basketItems[i].marchantamount = (((Number(basketmarchantamount) * (100 - Number(basketitemdata.bookkingPercentage[0].booking_percentage)))) / 100).toFixed(2);
            req.body.totalmarchantamount = Number(req.body.totalmarchantamount) + Number(req.body.basketItems[i].marchantamount);
            req.body.conversationId = new Date().getTime();
            req.body.cancelby = 1;


            if (i == req.body.basketItems.length - 1) {

                var updateddata = await tables.paymentcardTable.updatepaymentinbookings({ _id: req.body.basketId }, { totalmarchantamount: Number(req.body.totalmarchantamount) })

                tables.paymentcardTable.addpayment(req.body, async (response) => {

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
                        console.log("url>>>>>>>>>>>>>>>>>....", url)
                        return res.send({
                            "success": true,
                            "status": 1,
                            "url": url,
                            "conversationId": response.conversationId
                        });
                    }

                })
            }
        }

    }


});


async function updatepaymentnotification(vendorId, paymentmode) {
    var fcmResponse = await tables.fcmTable.getFcmIds(vendorId);

    if (fcmResponse != undefined && fcmResponse.length != 0) {
        if (paymentmode == "cash") {
            // var data = {
            //     "title": `Payment Completed`,
            //     "message": "Customer selected cash payment."

            // };
            var data = {
                "title": `Ödeme Tipi Bilgilendirmesi`,
                "message": "Müşteri ödeme yöntemi olarak nakit seçti."

            };
        } else {
            var data = {
                "title": `Ödeme Tipi Bilgilendirmesi`,
                "message": "Müşteri ödeme yöntemi olarak online ödeme’yi seçti."

            };
        }


        utility.pushNotifications.sendPushpaymentcomplete(fcmResponse[0].fcm_id, data);
    }
}



router.post('/sendsamplepush', async function (req, res) {
    var vendordata = await tables.fcmTable.getvendordata(req);
    for (var i = 0; i < vendordata.length; i++) {
        var fcmResponse = await tables.fcmTable.multiplegetFcmIds(vendordata[i]._id);
        if (fcmResponse != undefined && fcmResponse.length != 0) {
            var data = {
                "title": req.body.title,
                "message": req.body.message

            };
        } else {
            var data = {
                "title": req.body.title,
                "message": req.body.message

            };
        }

        if (fcmResponse[0] && fcmResponse[0].fcm_id && fcmResponse[0].fcm_id[0].device_type == req.body.type) {

            utility.pushNotifications.sendPushpaymentcomplete(fcmResponse[0].fcm_id, data);
        }
        if (i == vendordata.length - 1) {
            res.send("success")
        }

    }

})











//update payment status (payment type card)
router.post('/update-online-payment', async function (req, res) {

    req.body.status = "1";
    if (req.body.payment_result) {
        req.body.payment_result = JSON.parse(req.body.payment_result)
    }


    tables.paymentcardTable.updateonilepayment(req, async (response, getbookingdetails) => {

        if (response.nModified == 1 || response) {
            await updatepaymentnotification(getbookingdetails[0].vendor_id, "card")
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


//update payment status(payment type cash)
router.post('/update-payment_status', async function (req, res) {
    if (req.body.bookingId == '' || req.body.bookingId == undefined) {
        return res.send({
            "success": false,
            "message": "bookingId is required"
            , "errorcode": 1
        });
    }
    if (req.body.payment_status == '' || req.body.payment_status == undefined) {
        return res.send({
            "success": false,
            "message": "payment_status is required"
            , "errorcode": 1
        });
    }
    tables.paymentcardTable.updatepaymentstatus(req, async (response) => {

        if (response) {

            await updatepaymentnotification(response.vendor_id, "cash")
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

//generate web url for delete card
router.post('/delete-card-details', async function (req, res) {
    let languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (req.body.UserId == '' || req.body.UserId == undefined) {
        return res.send({
            "success": false,
            "message": "UserId required"
            , "errorcode": 1
        });
    }
    if (req.body.add_coversation_id == '' || req.body.add_coversation_id == undefined) {
        return res.send({
            "success": false,
            "message": "add_coversation_id required"
            , "errorcode": 1
        });
    }


    tables.paymentcardTable.gatusercardsbyconversationId(req, async function (response) {

        if (response != undefined || !response[0] || !response[0].card_token || !response[0].card_user_key) {
            var obj = {};
            obj.conversationId = req.body.add_coversation_id;
            obj.card_token = response[0].card_token;
            obj.card_user_key = response[0].card_user_key;


            var finalobj = JSON.stringify(obj);
            var encriptobj = Buffer.from(finalobj).toString('base64')
            var url = "";
            if (await publicIp.v4() == "3.212.189.52") {
                url = `${utility.testurl}payment_sdk/samples/delete_card.php?str=${encriptobj}`
            } else if (await publicIp.v4() == "35.169.9.99") {
                url = `${utility.produrl}payment_sdk/samples/delete_card.php?str=${encriptobj}`

            }

            return res.send({
                "success": true,
                "status": 1,
                "url": url,
                "response": obj

            });
        } else {
            return res.send({
                "success": false,
                "status": 0,

            });
        }


    });
});


//delete card from web
router.post('/update-card-details-from-web', async function (req, res) {
    console.log("update-card-details-from-web", req.body)
    let languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }

    if (req.body.conversationId == '' || req.body.conversationId == undefined) {
        return res.send({
            "success": false,
            "message": "add_coversation_id required"
            , "errorcode": 1
        });
    }

    tables.paymentcardTable.deleteonilepaymentcard(req, (response) => {

        if (response) {
            return res.send({
                "success": true,
                "message": "deleted successfully"
            });
        } else {
            return res.send({
                "success": false,
                "message": "delete failed"
            });
        }

    })



});



//online payment if previous payment failed
router.post('/online-paymentbasedonbasketId', async function (req, res) {
    if (req.body.basketId == '' || req.body.basketId == undefined) {
        return res.send({
            "success": false,
            "message": "basketId required"
            , "errorcode": 1
        });
    }
    req.body.conversationId = new Date().getTime();
    var updateconversationid = await tables.paymentcardTable.updateconversationId(req)

    if (updateconversationid) {
        var finalobj = JSON.stringify(updateconversationid);
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

        });
    } else {
        return res.send({
            "success": true,
            "status": 0,


        });
    }


});


//update approve_status in basket items
router.post('/update-approve-ststus-inbasket', async function (req, res) {
    tables.paymentcardTable.updateapprovestatus(req, (response) => {

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



//payment error message to user
router.post('/errormessage', async function (req, res) {
    if (req.body.conversationId == '' || req.body.conversationId == undefined) {
        return res.send({
            "success": false,
            "message": "conversationId required"
            , "errorcode": 1
        });
    }
    if (req.body.type == '' || req.body.type == undefined) {
        return res.send({
            "success": false,
            "message": "type required"
            , "errorcode": 1
        });
    }
    var languageCode = req.body.language_code;
    if (req.body.type == 1) {
        var data = await tables.paymentcardTable.getuserpaymentmessage(req)
        if (data && data[0] && data[0].card_result && data[0].card_result.status == "success" && data[0].payment_result && data[0].payment_result.status == "success") {
            return res.send({
                "success": true,


                "data": (utility.errorMessages["Payment processed successfully"][languageCode] != undefined ? utility.errorMessages["Payment processed successfully"][languageCode] : utility.errorMessages["Payment processed successfully"]['en'])

            });
        }
        else if (data && data[0] && data[0].payment_result && data[0].payment_result.errorMessage) {
            return res.send({
                "success": false,
                "data": data[0].payment_result.errorMessage,

            });



        } else if (data && data[0] && data[0].card_result && data[0].card_result.errorMessage) {
            return res.send({
                "success": false,
                "data": data[0].card_result.errorMessage,

            });



        } else if (!data || !data[0] || !data[0].card_result || !data[0].card_result.errorMessage) {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] != undefined ? utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] : utility.errorMessages["something went wrong. Please try again after sometime."]['en'])


            });
        } else {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["Not yet completed."][languageCode] != undefined ? utility.errorMessages["Not yet completed."][languageCode] : utility.errorMessages["Not yet completed."]['en'])



            });

        }

    } else if (req.body.type == 2) {
        var data = await tables.paymentcardTable.getuserpaymentmessage(req)
        if (data && data[0] && data[0].payment_result && data[0].payment_result.errorMessage) {
            return res.send({
                "success": false,
                "data": data[0].payment_result.errorMessage,

            });

        } else if (data && data[0] && data[0].payment_result && data[0].payment_result.status == "success") {
            return res.send({
                "success": true,
                "data": (utility.errorMessages["Payment processed successfully"][languageCode] != undefined ? utility.errorMessages["Payment processed successfully"][languageCode] : utility.errorMessages["Payment processed successfully"]['en'])


            });

        } else {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["Not yet completed."][languageCode] != undefined ? utility.errorMessages["Not yet completed."][languageCode] : utility.errorMessages["Not yet completed."]['en'])

            });

        }
    } else if (req.body.type == 3) {
        var data = await tables.paymentcardTable.getuserpaymentmessage(req)
        if (data && data[0] && data[0].payment_result && data[0].payment_result.errorMessage) {
            return res.send({
                "success": false,
                "data": data[0].payment_result.errorMessage,

            });

        } else if (data && data[0] && data[0].payment_result && data[0].payment_result.status == "success") {
            return res.send({
                "success": true,
                "data": (utility.errorMessages["Payment processed successfully"][languageCode] != undefined ? utility.errorMessages["Payment processed successfully"][languageCode] : utility.errorMessages["Payment processed successfully"]['en'])

            });

        } else if (!data[0].payment_result) {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] != undefined ? utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] : utility.errorMessages["something went wrong. Please try again after sometime."]['en'])

            });

        } else {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["Not yet completed."][languageCode] != undefined ? utility.errorMessages["Not yet completed."][languageCode] : utility.errorMessages["Not yet completed."]['en'])
            });

        }
    } else if (req.body.type == 4) {
        var data = await tables.paymentcardTable.getuserpaymentmessage(req)
        if (data && data[0] && data[0].iban_result && data[0].iban_result.errorMessage) {
            return res.send({
                "success": false,
                "data": data[0].iban_result.errorMessage,

            });

        } else if (data && data[0] && data[0].iban_result && data[0].iban_result.status == "success") {
            return res.send({
                "success": true,
                "data": (utility.errorMessages["Payment processed successfully"][languageCode] != undefined ? utility.errorMessages["Payment processed successfully"][languageCode] : utility.errorMessages["Payment processed successfully"]['en'])

            });

        } else if (!data[0].iban_result) {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] != undefined ? utility.errorMessages["something went wrong. Please try again after sometime."][languageCode] : utility.errorMessages["something went wrong. Please try again after sometime."]['en'])

            });
        } else {
            return res.send({
                "success": false,
                "data": (utility.errorMessages["Not yet completed."][languageCode] != undefined ? utility.errorMessages["Not yet completed."][languageCode] : utility.errorMessages["Not yet completed."]['en'])


            });

        }
    } else {
        return res.send({
            "success": false,
            "message": "Please provide valid type"
        });
    }

});

//get otp for mobile number
router.post('/getotp', async function (req, res) {
    if (req.body.type == 1) {
        console.log("comming to if")
        tables.customerTable.getotp({ mobile: req.body.mobile, mobile_country: req.body.mobile_country }, function (response) {
            if (response && response[0]) {
                return res.send({
                    "success": true,
                    "message": response[0].otp
                });
            } else {
                return res.send({
                    "success": false,
                    "message": "no user found with this number"
                });
            }




        })

    } else if (req.body.type == 2) {
        console.log("comming to else if")
        tables.customerTable.getvendorotp({ mobile: req.body.mobile, mobile_country: req.body.mobile_country }, function (response) {
            if (response && response[0]) {
                return res.send({
                    "success": true,
                    "message": response[0].otp
                });
            } else {
                return res.send({
                    "success": false,
                    "message": "no user found with this number"
                });
            }




        })

    } else {
        console.log("comming to else")
        return res.send({
            "success": false,
            "message": "type is required"
        });

    }


});


//get otp for mobile number
router.post('/deleteuser', async function (req, res) {
    if (req.body.type == 1) {
        console.log("comming to if")
        tables.customerTable.deleteuser({ mobile: req.body.mobile, mobile_country: req.body.mobile_country }, function (response) {
            if (response == "nouser") {
                return res.send({
                    "success": false,
                    "message": "No user found"
                });
            } else if (response == "bookings") {
                return res.send({
                    "success": false,
                    "message": "User having bookings"
                });
            } else {
                return res.send({
                    "success": true,
                    "message": response
                });
            }




        })

    } else if (req.body.type == 2) {
        console.log("comming to else if")
        tables.customerTable.deletevendor({ mobile: req.body.mobile, mobile_country: req.body.mobile_country }, function (response) {
            if (response == "nouser") {
                return res.send({
                    "success": false,
                    "message": "No user found"
                });
            } else if (response == "bookings") {
                return res.send({
                    "success": false,
                    "message": "User having bookings"
                });
            } else {
                return res.send({
                    "success": true,
                    "message": response
                });
            }




        })

    } else {
        console.log("comming to else")
        return res.send({
            "success": true,
            "message": "type is required"
        });

    }


});


//get warrings 
router.post('/getwarnings', async function (req, res) {
    language_code = 'en';
    if (req.body.language_code) {
        language_code = req.body.language_code
    }
    var mobile_country = req.body.mobile_country;
    if (req.body.type == 1) {
        var warnings = await tables.countryTable.findrequiredfields({ "phone_code": mobile_country, owner_customer: 1 }, { warnings_customer: 1 })
        var data = "";

        if (warnings && warnings[0] && warnings[0].warnings_customer) {
            data = warnings[0].warnings_customer[language_code]
        }
        return res.send({
            "success": true,
            "data": data

        });
    } else if (req.body.type == 2) {
        var data = ""

        var warnings = await tables.countryTable.findrequiredfields({ "phone_code": mobile_country, owner_vendor: 1 }, { warnings_vendor: 1 })
        if (warnings && warnings[0] && warnings[0].warnings_vendor) {
            data = warnings[0].warnings_vendor[language_code]
        }
        return res.send({
            "success": true,
            "data": data
        });
    } else {
        return res.send({
            "success": true,
            "message": "type is required"
        });
    }


});



//send sample sms
router.post('/senssamplesms', async function (req, res) {
    var response = utility.curl.sendingSms(req.body.message, req.body.num)
    console.log("response>>>>>>>>>>>>>>>>>>?????????????????????????<<<<<<<<<<<<<<<", response)
    res.send(response)


});



//get user aggrement
router.post('/user-agreement', tokenValidations, async function (req, res) {
    var userId = req.body.userId;
    var languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (userId == '' || userId == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    var userResponse = await tables.customerTable.findFieldsWithPromises({ "_id": userId }, { "mobile_country": 1 });
    if (userResponse != undefined && userResponse.length != 0) {
        var country = userResponse[0].mobile_country;
    } else {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 2
        });
    }

    var countryResponse = await tables.countryTable.findFieldsWithPromises({ "phone_code": country }, { "stylist_agreement": 1 });
    var aggrements = '';
    if (countryResponse != undefined && countryResponse.length != 0 && countryResponse[0].stylist_agreement != undefined) {
        aggrements = (countryResponse[0].stylist_agreement[languageCode] != undefined) ? countryResponse[0].stylist_agreement[languageCode] : '';
    }
    return res.send({ "success": true, "aggrement": aggrements });
});


//get user aggrement
router.post('/mobilenumbervalidation', tokenValidations, async function (req, res) {
    var phone_code = req.body.phone_code;
    var languageCode = req.body.language_code;

    if (languageCode == undefined) {
        languageCode = 'en';
    }
    if (phone_code == "" || phone_code == undefined) {
        return res.send({
            "success": false,
            "message": (utility.errorMessages["Invalid request"][languageCode] != undefined ? utility.errorMessages["Invalid request"][languageCode] : utility.errorMessages["Invalid request"]['en'])
            , "errorcode": 1
        });
    }

    var countryResponse = await tables.countryTable.findFieldsWithPromises({ "phone_code": phone_code }, { "phone_code": 1, "phone_min_length": 1, "phone_max_length": 1 });
    
    if (countryResponse && countryResponse.length && countryResponse != undefined) {
console.log("comming to if>>>>>>>>>>>>>>>>>>>")
        var mobilevalidation = countryResponse[0];
        return res.send({ "success": true, "mobilevalidation": mobilevalidation });

    }else{
        console.log("comming to else>>>>>>>>>>>>>>>>>>>>")
        return res.send({ 
            "success": false,   
            "message": (utility.errorMessages["There is no service in your country!"][languageCode] != undefined ? utility.errorMessages["There is no service in your country!"][languageCode] : utility.errorMessages["There is no service in your country!"]['en'])
        
        });

    }
});














module.exports = router;



