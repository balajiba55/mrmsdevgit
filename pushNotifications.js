var request = require('request');

module.exports =
{
    sendPush: function (fcm, data) {

        var utility = require('./utility/utility');

        var vendor = utility.vendor;
        var androidFcm = fcm.filter(function (obj) {
            //check if object value contains value you are looking for
            if (obj.device_type === utility.device_type_android) {
                //add this object to the filtered array
                return obj;
            }
        });
        androidFcm = androidFcm.map(function (obj) {
            return obj.fcm;
        });
        var iosFcm = fcm.filter(function (obj) {
            //check if object value contains value you are looking for
            if (obj.device_type === utility.device_type_ios) {
                //add this object to the filtered array
                return obj.fcm;

            }
        });
        iosFcm = iosFcm.map(function (obj) {
            return obj.fcm;
        });
        if (fcm.length > 0) {
            if (androidFcm.length) {
                var dataField = {
                    registration_ids: androidFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },

                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + vendor
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {
                    //it works!
                    console.log(body, "fcm Notication");
                });
            }
            if (iosFcm.length) {
                var dataField = {
                    registration_ids: iosFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },
                    notification:
                    {
                        'sound': 'default',
                        'body': data['message'],
                        'title': 'mr&ms',
                        'badge': 1
                    }
                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + vendor
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {
                    //it works!

                });
            }
        }
    },
    sendPushCustomer: function (fcm, data) {
        var utility = require('./utility/utility');
        var customer = utility.customer;

        var androidFcm = fcm.map(function (obj) {
            if (obj.device_type == utility.device_type_android) {
                return obj.fcm;
            }
        });

        var iosFcm = fcm.map(function (obj) {
            if (obj.device_type == utility.device_type_ios) {
                return obj.fcm;
            }
        });
        if (fcm.length > 0) {

            if (androidFcm.length) {
                let dataField = {
                    registration_ids: androidFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },
                    /* notification:
                         {
                             'sound':'default',
                             'body':data['message'],
                             'title':'mr&ms',
                             'badge':1
                         }*/
                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + customer
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {

                    //it works!
                });
            }
            if (iosFcm.length) {
                let dataField = {
                    registration_ids: iosFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },
                    notification:
                    {
                        'sound': 'default',
                        'body': data['message'],
                        'title': 'mr&ms',
                        'badge': 1
                    }
                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + customer
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {

                    //it works!
                });
            }
        }
    },
    sendPushpaymentcomplete: function (fcm, data) {

        var utility = require('./utility/utility');

        var vendor = utility.vendor;
        var androidFcm = fcm.filter(function (obj) {
            //check if object value contains value you are looking for
            if (obj.device_type === utility.device_type_android) {
                //add this object to the filtered array
                return obj;
            }
        });
        androidFcm = androidFcm.map(function (obj) {
            return obj.fcm;
        });
        var iosFcm = fcm.filter(function (obj) {
            //check if object value contains value you are looking for
            if (obj.device_type === utility.device_type_ios) {
                //add this object to the filtered array
                return obj.fcm;

            }
        });
        iosFcm = iosFcm.map(function (obj) {
            return obj.fcm;
        });
        if (fcm.length > 0) {
            
            if (androidFcm.length) {
                
                var dataField = {
                    registration_ids: androidFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },

                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + vendor
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {
                    //it works!
                    console.log(body, "fcm Notication");
                });
            }
            if (iosFcm.length) {
                
                var dataField = {
                    registration_ids: iosFcm,
                    priority: "high",
                    data: data,
                    content_available: true,
                    alert: {
                        'body': data['message'],
                        'title': 'mr&ms'
                    },
                    notification:
                    {
                        'sound': 'default',
                        'body': data['message'],
                        'title': 'mr&ms',
                        'badge': 1
                    }
                };
                dataField = JSON.stringify(dataField);
                request({
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'key=' + vendor
                    },
                    uri: 'https://fcm.googleapis.com/fcm/send',
                    body: dataField,
                    method: 'POST'
                }, function (err, res, body) {
                    //it works!

                });
            }
        }
    }

}


function sendVoipNotification(deviceId, voipData) {

    for (var i = 0; i < deviceId.length; i++) {
        (function (j) {
            pushVoip(deviceId[j], voipData)
        })(i);
    }
}

function pushVoip(deviceVoipToken, voipData) {
    // Amazon SNS module
    AWS.config.update({
        accessKeyId: 'AKIAIJP5DMDWLU6TK46Q',
        secretAccessKey: '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',
        region: 'us-east-1'
    });
    var amazonSNS = new AWS.SNS();
    asyncWaterfall([
        function (callback) {
            amazonSNS.createPlatformEndpoint({
                // App in Sandboxmode (ie running on device directly from Xcode)
                /*PlatformApplicationArn: "arn:aws:sns:us-east-1:586748447215:app/APNS_VOIP_SANDBOX/TroopMessengerVoip",*/
                // App in Production mode (ie running on device after archiving and installed on device with a provisioning profile)
                //PlatformApplicationArn: "arn:aws:sns:us-west-2:xxxxxxxxxxxx:app/APNS_VOIP/CurieVoip",
                PlatformApplicationArn: "arn:aws:sns:us-east-1:586748447215:app/APNS_VOIP/TroopMessengerVoipProduction",
                Token: deviceVoipToken

            }, function (err, data) {
                if (err) {
                    return callback(err);
                }

                return callback(null, { endpointArn: data.EndpointArn });
            })
        },
        function (arg1, callback) {
            var endpointArn = arg1.endpointArn;
            var payload = {
                default: JSON.stringify(voipData)
            };
            // first have to stringify the inner APNS object...
            payload.APNS = JSON.stringify(payload.APNS);
            // then have to stringify the entire message payload
            payload = JSON.stringify(payload);
            amazonSNS.publish({
                MessageStructure: 'json',
                Message: payload,
                TargetArn: endpointArn
            }, function (err, data) {
                if (err) {
                    return callback(err);
                }
                return callback(null, { endpointArn: endpointArn });
            });

        },
        function (arg1, callback) {

            var endpointArn = arg1.endpointArn;

            var params = {
                EndpointArn: endpointArn /* required */
            };

            amazonSNS.deleteEndpoint(params, function (err, data) {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, "success");

                }
            });

        }
    ], function (err, result) {
        /*console.log("result ",result,err,deviceVoipToken);*/
        return !(err);
    });
}