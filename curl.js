var request = require('request');
const ejs = require('ejs');
const fs = require('fs');
const axios = require('axios');
/*var PHP_URl='http://tvishasystems.com/webdemo/mr_mrs_project/testing/public/';*/
//var PHP_URl='http://192.168.2.37/development/mr_miss/public/';
//var TMBASEURl='http://192.168.2.68:8080/api/';

var PHP_URl = 'https://admin.mrmsbeauty.com/';  //prod
//  var PHP_URl='http://dev.mrmsbeauty.com/';  //dev


var TMBASEURl = 'https://apis.troopmessenger.com/api/';
//var userName='Tvishatechnologies';
//var password='T918273645';
var api_key = 'Opkn4Pq3Wbu';

//sms gateway
const smsBaseUrl = 'http://api.santral365.com:8080/api';
const smsusername = 'mrmsbeauty';
const smspassword = 'c64e58ce8455011a500af34162c237f4';
const smsHeader = 'MRMSBEAUTY';


module.exports =
{
    curl: function (url, callback) {
        request(PHP_URl + url, function (error, response, body) {
            if (!error && response.statusCode == 200) {

            } else {
            }
        });
    }, curlPost: function (url, dataField) {
        request({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            uri: PHP_URl + url,
            form: dataField,
            json: true,
            method: 'POST'
        }, function (error, response, body) {

            if (!error && response.statusCode == 200) {

            } else {

            }

        });
    }, sendingSms: function (mobile, content, callback) {
        var smsUrl = "https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY=" + api_key + "&MobileNo=" + mobile + "&SenderID=GFCODE&ServiceName=INTERNATIONAL&Message=" + content;
        //var smsUrl='http://api.smscountry.com/SMSCwebservice_bulk.aspx?User='+userName+'&passwd='+password+'&mobilenumber='+mobile+'&message='+content+'&type=N&DR=Y';
        request(smsUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
            } else {

            }
        });

        // },sendingSms:function(message,nums)
        // {
        //     return new Promise((resolve, reject) => {
        //         try {
        //             var compiled = ejs.compile(fs.readFileSync(__dirname + '/templates/1_n_template.tp', 'utf8'));
        //             var compiledTemplate = compiled({ username: smsusername, password: smspassword, header: smsHeader, message : message, nums : nums });

        //             console.log("compiledTemplate>>>>>>>>>>>>>>",compiledTemplate)
        //             axios.post(`${smsBaseUrl}/smspost/v1`, compiledTemplate,
        //                   {
        //                     headers: { 'Content-Type': 'xml' }
        //                   })
        //                   .then(function (response) {
        //                       console.log("comming to then>>>>>>>>>>??????????????????",response)
        //                     resolve(response)
        //                   })
        //                   .catch(function (error) {
        //                       console.log("comming to error>>>>>>>>>>",error)
        //                     reject(error)
        //                   });
        //         } catch (error) {
        //             reject(error);
        //         }
        //     })
    }, curlPostWithPromise: function (url, dataField) {
        return new Promise(function (resolve) {

            request({
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: TMBASEURl + url,
                form: dataField,
                json: true,
                method: 'POST'
            }, function (err, response, body) {
                if (err)
                    resolve(null);
                return resolve(body);
            });

        });
    }
};
