var errorMessages=require('./errorMessages');
var curl=require('../curl');
var pushNotifications=require('../pushNotifications');
var currencyConvertor=require('./currencyConvertor');
var writeToFile=require('./writeToFile');
const translate = require('../translate/translate');
const tmToken='YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo';
var languages=['en','ar','tr','de'];
var accessTokens={};
var nameRegex = /^([a-zA-Z]+\s)*[a-zA-Z]+$/;
var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var dateRegex=/^\d\d\d\d-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])$/;
var GENDER_MALE = 0,
    GENDER_FEMALE = 1,
    GENDER_OTHER = 2;

var SERVICE_FOR_WOMEN=1,
    SERVICE_FOR_GIRL=2,
    SERVICE_FOR_MEN=3,
    SERVICE_FOR_BOY=4;

var VALID_GENDER = [GENDER_MALE,GENDER_FEMALE,GENDER_OTHER];
var VALID_SERVICE_FOR = [SERVICE_FOR_WOMEN,SERVICE_FOR_GIRL,SERVICE_FOR_MEN,SERVICE_FOR_BOY];
var FORGOT_PASSWORD_REQUEST_TYPE_EMAIL = 1;
var FORGOT_PASSWORD_REQUEST_TYPE_MOBILE = 2;
var FORGOT_PASSWORD_REQUEST_TYPE = [FORGOT_PASSWORD_REQUEST_TYPE_EMAIL,FORGOT_PASSWORD_REQUEST_TYPE_MOBILE];
var OTP_TYPE_CUSTOMER_SIGN_UP = 1;
var OTP_TYPE_FORGOT_PASSWORD_EMAIL = 2;
var OTP_TYPE_FORGOT_PASSWORD_MOBILE = 3;
var OTP_TYPE_VERIFY_DEVICE = 4;

var OTP_TYPE =
    [
        OTP_TYPE_CUSTOMER_SIGN_UP,
        OTP_TYPE_FORGOT_PASSWORD_EMAIL,
        OTP_TYPE_FORGOT_PASSWORD_MOBILE,
        OTP_TYPE_VERIFY_DEVICE,
    ];
var WORKING_DAY_SUNDAY=1;
var WORKING_DAY_MONDAY=2;
var WORKING_DAY_TUESDAY=3;
var WORKING_DAY_WEDNESDAY=4;
var WORKING_DAY_THURSDAY=5;
var WORKING_DAY_FRIDAY=6;
var WORKING_DAY_SATURDAY=7;


var WORKING_GENDER_WOMEN=1;
var WORKING_GENDER_GIRL=2;
var WORKING_GENDER_MEN=3;
var WORKING_GENDER_BOY=4;
var WORKING_GENDER_OTHERS=5;


var WORKING_GENDER=[WORKING_GENDER_WOMEN,WORKING_GENDER_GIRL,WORKING_GENDER_MEN,WORKING_GENDER_BOY,WORKING_GENDER_OTHERS];
var WORKING_DAY_TYPE=[WORKING_DAY_SUNDAY,WORKING_DAY_MONDAY,WORKING_DAY_TUESDAY,WORKING_DAY_WEDNESDAY,WORKING_DAY_THURSDAY,WORKING_DAY_FRIDAY,WORKING_DAY_SATURDAY];

var ADDRESS_TYPE_HOME=1;
var ADDRESS_TYPE_OFFICE=2;
var ADDRESS_TYPE_SAVED=3;
var ADDRESS_TYPE_RECENT=4;



var CART_UPDATE_TYPE_DELETE=1;
var CART_UPDATE_TYPE_SERVICE_QTY_UPDATE=2;
var CART_ADD=3;
var CART_UPDATE_TYPE_SERVICE_LEVEL_CHANGE=4;
var CART_UPDATE_TYPE_SERVICE_FOR_CHANGE=5;
var CART_PAYMENT_UPDATE=6;
var CART_ITEM_BOOKED=2;
var CART_ITEM_ADDEED=1;

const CANCELLATION_POLICY_FOR_SALON_AMOUNT_TYPE_PERCENTAGE=1;
const CANCELLATION_POLICY_FOR_SALON_AMOUNT_TYPE_FLAT=2;
const CANCELLATION_POLICY_FOR_SALON_TIME_TYPE_DAYS=1;
const CANCELLATION_POLICY_FOR_SALON_TIME_TYPE_HOURS=2;

const CANCELLATION_POLICY_TYPE_FLAT=1;
const CANCELLATION_POLICY_TYPE_PERCENTAGE=2;
const CANCELLATION_POLICY_TYPE_RATING=3;
const CANCELLATION_POLICY_TIME_TYPE_DAYS=4;
const CANCELLATION_POLICY_TIME_TYPE_HOURS=5;
const CANCELLATION_POLICY_TIME_TYPE_MINUTES=6;
const AGENT=4;
const ADMIN=5;
const MANAGER=6;
const PROMO_FOR_SALON=3,
    PROMO_FOR_STYLIST=2,
    PROMO_FOR_CUSTOMER=1;
const PROMO_FOR_FLAT = 1,
    PROMO_FOR_PERCENTAGE= 2;
var vendor='AAAAwIZNc8U:APA91bFqwnbvvIDCcwVcxgUSc-IJItrMpfZrMtrFnV7hoUW8Fw3g11RYYfuUS8zavYgh9v0wLXcTMln37rHq1rq0xO4tWnfJpc1r3DE4bDVwSJEuJrSxGvQWHlTFmAKsBDIEgMAhWg_c';
var customer='AAAAK5EbNPY:APA91bG20VI0Z1GNb-WHYuV26BUZNhnzs5l5R0Ff9gsQ0eezhutORunzIGjgYS6-jK_QDix8PxkbDB2TZkApQgS82PYIPpvNjv_xf1e9N43w5M1r9fKKpjsAu4oENs9sZZeetIFk4uEh';
var user_role_customer=1,
    user_role_stylist=2,
    user_role_salon=3;


var COUPON_TYPE_COUPON=1;
var COUPON_TYPE_GIFT=2;
var COUPON_TYPE_PROMOCODE=3;


var COUPON_SCOPE_PRIVATE=2;
var COUPON_SCOPE_PUBLIC=1;


var PAYMENT_TYPE_CASH=1;
var PAYMENT_TYPE_CARD=2;

var CART_UPDATE_TYPE=[CART_UPDATE_TYPE_DELETE,CART_UPDATE_TYPE_SERVICE_QTY_UPDATE,CART_ADD,CART_UPDATE_TYPE_SERVICE_LEVEL_CHANGE,CART_UPDATE_TYPE_SERVICE_FOR_CHANGE,CART_PAYMENT_UPDATE];
var PAYMENT_TYPE=[PAYMENT_TYPE_CASH,PAYMENT_TYPE_CARD];
function formatDate(date)
{
    var d = new Date(date),
        month = '' + (d.getMonth()+1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}
function formatDateTime(date)
{
    return ('{0}-{1}-{3} {4}:{5}:{6}').replace('{0}', date.getFullYear()).replace('{1}', date.getMonth() + 1).replace('{3}', date.getDate()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes()).replace('{6}', date.getSeconds())
}
function languageCode(language)
{

     if(language!=undefined)
     {

         language=language.toLowerCase();

         if(language && languages.indexOf(language)!=-1)
         {

             return language;
         }else {
             return 'en';
         }
     }else{
         return 'en';
     }


}
function formatUtcTimeAndDate(date)
{
    var d = new Date(date),
        month = '' + (d.getUTCMonth() + 1),
        day = '' + d.getUTCDate(),
        year = d.getUTCFullYear(),
        minutes = ''+d.getUTCMinutes(),
        hours=''+d.getUTCHours();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (minutes.length< 2) minutes = '0'+minutes;
    if (hours.length < 2) hours = '0' + hours;
    return year+"-"+month+"-"+day+" "+hours+":"+minutes;
}
function diffMinutes(dt2, dt1)
{
    var diff =(dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
}

function generateOtp(x=0,y=4)
{
    var a = Math.floor(100000 + Math.random() * 900000);
    a = String(a);
    a = a.substring(x,y);
    return a;
}
function randomString(length=4) {
    var str = '';
    var chars ='0123456789abcdefghiklmnopqrstuvwxyz'.split('');
    var charsLen = chars.length;
    if (!length) {
        length = ~~(Math.random() * charsLen);
    }
    for (var i = 0; i < length; i++)
    {
        str += chars[~~(Math.random() * charsLen)];
    }
    return str;
}
function generateRandomString(length=4)
{
    return '123456';
    var str = '';
    var chars ='0123456789abcdefghiklmnopqrstuvwxyz'.split('');
    var charsLen = chars.length;
    if (!length) {
        length = ~~(Math.random() * charsLen);
    }
    for (var i = 0; i < length; i++)
    {
        str += chars[~~(Math.random() * charsLen)];
    }
    return str;
}
async function generateInviteCodeCustomer(name='ab')
{
    var tables='';
    if(tables=='')
    {
        tables = require('../db_modules/baseTable');
    }
    return new Promise(async function(resolve){
        var a=randomString();
        name=name.substring(0,2);
        a='cu'+name+a;
        // var customerDetails='';
        a=a.toLowerCase();
        var customerDetails=await tables.customerTable.findFieldsWithPromises({"invite_code":a},{"_id":1});
        if(customerDetails==undefined || customerDetails.length==0)
        {
            return resolve(a);
        }else{
            generateInviteCodeCustomer(name);
        }
    });
}
async function generateInviteCodeVendor(name='ab')
{
    var tables='';
    if(tables==''){
        tables = require('../db_modules/baseTable');
    }

    return new Promise(async function(resolve)
    {
        var a=randomString();
        name=name.substring(0,2);
        a='ve'+name+a;
        // var customerDetails='';
        a =a.toLowerCase();
        var customerDetails=await tables.vendorTable.findFieldsWithPromises({"invite_code":a},{"_id":1});

        if(customerDetails==undefined || customerDetails.length==0)
        {
            return resolve(a);
        }else
        {

            generateInviteCodeVendor(name);
        }
    });

}
async function getTmUserId(data)
{
    return new Promise(async function(resolve){

        data['token']=tmToken;
        var url='messenger/register';
        var tm= await curl.curlPostWithPromise(url,data);

        var tmUserId=0;
        if(tm!=null)
        {
            if(tm['success'])
            {
                tmUserId=tm['tm_user_id'];
            }
        }
        return resolve(tmUserId);
    });
}
async function generateGiftCardCode()
{
    var tables='';
    if(tables=='')
    {
        tables = require('../db_modules/baseTable');
    }
    return new Promise(async function(resolve){
        var a=randomString();
        a='gi'+a;
        // var customerDetails='';
        a=a.toLowerCase();
        var giftCardDetails=await tables.giftCardsTable.findFieldsWithPromises({"gift_card.code":a},{"_id":1});
        if(giftCardDetails==undefined || giftCardDetails.length==0)
        {
            return resolve(a);
        }else
        {
            generateGiftCardCode();
        }
    });

}
function getTime(){
    var now=new Date();
    return  now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds();
}
async function updateFcm(data,type)
{
    return new Promise(async function(resolve){
        data['token']=tmToken;
        var  url='messenger/update-fcm-token';
        if(type==1)
        {
            data['fcm_authorization_key']=customer
        }
        if(type==2)
        {
            data['fcm_authorization_key']=vendor;
        }
        if(type==3)
        {
            data['fcm_authorization_key']=vendor;
        }
           data['device_type']=(data['device_type']!=undefined&& data['device_type']==2?0:data['device_type']);


        var updateResponse= await curl.curlPostWithPromise(url,data);
        return resolve(updateResponse);
    });
}

async function deleteFcm(data,type)
{
    return new Promise(async function(resolve)
    {
        data['token']=tmToken;
        var  url='messenger/delete-fcm-token';
        if(type==1)
        {
            data['fcm_authorization_key']=customer
        }
        if(type==2)
        {
            data['fcm_authorization_key']=vendor;
        }
        if(type==3)
        {
            data['fcm_authorization_key']=vendor;
        }

        var updateResponse= await curl.curlPostWithPromise(url,data);
        return resolve(updateResponse);
    });

}
async function updateTmProfile(data)
{
    return new Promise(async function(resolve)
    {
        data['token']=tmToken;
        var  url='messenger/update-profile';

        var updateResponse= await curl.curlPostWithPromise(url,data);
        return resolve(updateResponse);
    });

}
async function updateInviteAmountCustomer(user_id,net_amount,countryId)
{
    var tables='';
    if(tables=='')
    {
        tables = require('../db_modules/baseTable');
    }
    var customerDetails=await tables.customerTable.findFieldsWithPromises({"_id":user_id},{"referral_invite_code":1,"referral_customer_id":1});

    if(customerDetails!=undefined && customerDetails.length!=0)
    {
        var referralCode=customerDetails[0].referral_invite_code;
        var referralUserId=customerDetails[0].referral_customer_id;


        if(referralCode!=undefined){
            var country=countryId;
            var countryDetails=await tables.countryTable.findFieldsWithPromises({"_id":country},{"dollar_conversion_rate":1});


            if(countryDetails!=undefined && countryDetails.length!=0)
            {
                var dollarConversionRate=countryDetails[0].dollar_conversion_rate;



                if(dollarConversionRate!=undefined)
                {
                    var netAmount=net_amount,
                        dollarConversionRate=1/dollarConversionRate,
                        amount=netAmount*dollarConversionRate;

                    var updateDetails=await tables.customerTable.updateReferAmountWithPromises({"invite.$.amount":amount},{"_id":referralUserId,"invite.customer_id":user_id})
                    var updateDetailsCustomer=await tables.customerTable.updateReferAmountWithPromises({"referral_amount":amount},{"_id":user_id})


                }
            }
        }
    }
}
async function updateInviteAmountVendor(user_id,net_amount,countryId)
{
    var tables='';
    if(tables=='')
    {
        tables = require('../db_modules/baseTable');
    }
    var vendorDetails=await tables.vendorTable.findFieldsWithPromises({"_id":user_id},{"referral_invite_code":1,"referral_vendor_id":1});
    if(vendorDetails!=undefined && vendorDetails.length!=0)
    {
        var referralCode=vendorDetails[0].referral_invite_code;
        var referralUserId=vendorDetails[0].referral_vendor_id;
        if(referralCode!=undefined)
        {
            var country=countryId;
            var countryDetails=await tables.countryTable.findFieldsWithPromises({"_id":country},{"dollar_conversion_rate":1});
            if(countryDetails!=undefined && countryDetails.length!=0)
            {
                var dollarConversionRate=countryDetails[0].dollar_conversion_rate;
                if(dollarConversionRate!=undefined)
                {
                    var netAmount=net_amount,
                        dollarConversionRate=1/dollarConversionRate,
                        amount=netAmount*dollarConversionRate;
                    var updateDetails=await tables.vendorTable.updateReferAmountWithPromises({"invite.$.amount":amount},{"_id":referralUserId,"invite.vendor_id":user_id})
                    var updateDetailsCustomer=await tables.vendorTable.updateReferAmountWithPromises({"referral_amount":amount},{"_id":user_id})
                }
            }
        }
    }
}
function sendServiceRequestMail(url,data)
{

}
function prependZero(string)
{
    if (string.length < 2) {
        return "0" + string;
    }
    return string;
}

module.exports = {
    CANCELLATION_POLICY_TIME_TYPE_MINUTES:CANCELLATION_POLICY_TIME_TYPE_MINUTES,
    CANCELLATION_POLICY_TIME_TYPE_HOURS:CANCELLATION_POLICY_TIME_TYPE_HOURS,
    CANCELLATION_POLICY_TIME_TYPE_DAYS:CANCELLATION_POLICY_TIME_TYPE_DAYS,
    CANCELLATION_POLICY_TYPE_RATING:CANCELLATION_POLICY_TYPE_RATING,
    CANCELLATION_POLICY_TYPE_PERCENTAGE:CANCELLATION_POLICY_TYPE_PERCENTAGE,
    CANCELLATION_POLICY_TYPE_FLAT:CANCELLATION_POLICY_TYPE_FLAT,
    COUPON_SCOPE_PRIVATE:COUPON_SCOPE_PRIVATE,
    COUPON_SCOPE_PUBLIC:COUPON_SCOPE_PUBLIC,
    CART_PAYMENT_UPDATE:CART_PAYMENT_UPDATE,
    PAYMENT_TYPE_CASH:PAYMENT_TYPE_CASH,
    PAYMENT_TYPE_CARD:PAYMENT_TYPE_CARD,
    isValidName : function(str)
    {
        return nameRegex.test(str);
    },
    isValidGender : function(gender)
    {
        return VALID_GENDER.indexOf(gender) != -1;
    },
    isValidEmail : function(email)
    {
        return emailRegex.test(email);
    },
    isValidDate:function(date)
    {
        return dateRegex.test(date);
    },
    CANCELLATION_POLICY:[],
    isValidForgotPasswordType : function(requestType)
    {
        return FORGOT_PASSWORD_REQUEST_TYPE.indexOf(requestType) != -1;
    },
    isValidOtpType : function(otpType)
    {
        return OTP_TYPE.indexOf(otpType) != -1;
    },
    isValidWorkingGender:function(gender)
    {
        return WORKING_GENDER.indexOf(gender) != -1;
    },
    isValidWorkingDAY:function (type)
    {
        return  WORKING_DAY_TYPE.indexOf(type) != -1;
    },
    isValidCartUpdate:function(type)
    {
        return  CART_UPDATE_TYPE.indexOf(type) != -1;

    }, isValidPayment:function(type)
    {
        return  PAYMENT_TYPE.indexOf(type) != -1;

    },
    isValidServiceFor : function(gender){
        return VALID_SERVICE_FOR.indexOf(gender) != -1;
    },
    FORGOT_PASSWORD_REQUEST_TYPE_EMAIL : FORGOT_PASSWORD_REQUEST_TYPE_EMAIL,
    FORGOT_PASSWORD_REQUEST_TYPE_MOBILE : FORGOT_PASSWORD_REQUEST_TYPE_MOBILE,
    OTP_TYPE_CUSTOMER_SIGN_UP : OTP_TYPE_CUSTOMER_SIGN_UP,
    OTP_TYPE_FORGOT_PASSWORD_EMAIL : OTP_TYPE_FORGOT_PASSWORD_EMAIL,
    OTP_TYPE_FORGOT_PASSWORD_MOBILE : OTP_TYPE_FORGOT_PASSWORD_MOBILE,
    OTP_TYPE_VERIFY_DEVICE : OTP_TYPE_VERIFY_DEVICE,
    ADDRESS_TYPE_HOME:ADDRESS_TYPE_HOME,
    ADDRESS_TYPE_OFFICE:ADDRESS_TYPE_OFFICE,
    ADDRESS_TYPE_SAVED:ADDRESS_TYPE_SAVED,
    ADDRESS_TYPE_RECENT:ADDRESS_TYPE_RECENT,
    CART_UPDATE_TYPE_DELETE:CART_UPDATE_TYPE_DELETE,
    CART_UPDATE_TYPE_SERVICE_QTY_UPDATE:CART_UPDATE_TYPE_SERVICE_QTY_UPDATE,
    CART_ADD:CART_ADD,
    CART_ITEM_BOOKED:CART_ITEM_BOOKED,
    CART_ITEM_ADDEED:CART_ITEM_ADDEED,
    CART_UPDATE_TYPE_SERVICE_LEVEL_CHANGE:CART_UPDATE_TYPE_SERVICE_LEVEL_CHANGE,
    CART_UPDATE_TYPE_SERVICE_FOR_CHANGE:CART_UPDATE_TYPE_SERVICE_FOR_CHANGE,
    errorMessages:errorMessages,
    curl:curl,
    PROMO_FOR_SALON:PROMO_FOR_SALON,
    PROMO_FOR_CUSTOMER:PROMO_FOR_CUSTOMER,
    PROMO_FOR_STYLIST:PROMO_FOR_STYLIST,
    PROMO_FOR_FLAT : PROMO_FOR_FLAT,
    PROMO_FOR_PERCENTAGE: PROMO_FOR_PERCENTAGE,
    formatDate:formatDate,
    currencyConvertor:currencyConvertor,
    pushNotifications:pushNotifications,
    diffMinutes:diffMinutes,
    generateOtp:generateOtp,
    formatUtcTimaAndDate:formatUtcTimeAndDate,
    generateRandomString:generateRandomString,
    translateText:async function(text,language)
    {
        var convertedLanguages=['en','ar','de','tr'];
        var tmp={};
        var path=require('path');
        var fs=require('fs');
        var logfile_name = path.resolve(__dirname,'../translate/translate.json');
        var index = convertedLanguages.indexOf(language);
        if (index > -1)
        {
            convertedLanguages.splice(index,1);
        }
        var exists=fs.existsSync(logfile_name);
        var data='';
        var json={};
        var writeText='';
        if(exists)
        {
            data=fs.readFileSync(logfile_name, 'utf8');
            if(data!='')
            {
                json=JSON.parse(data);

            }
        }

        for(var i=0;i<convertedLanguages.length;i++)
        {
            if(json[text]!=undefined && json[text][convertedLanguages[i]]!=undefined)
            {
                tmp[convertedLanguages[i]]=json[text][convertedLanguages[i]].text;
            } else{

                var en = await translate.translateText(text, {client:'gtx' ,from:language,to: convertedLanguages[i]});
                var writeData = {};
                writeData[text] = {};
                writeData[text][convertedLanguages[i]] = en;
                tmp[convertedLanguages[i]]=en.text;
                if (exists)
                {
                    //write the actual data and end with newline
                    if (data != '' || writeText!=''){

                        writeText = Object.assign(json, writeData);
                    }else {

                        writeText = writeData;
                    }
                }else{
                    //write the headers and newline
                    if (data != '' || writeText!='')
                    {
                        writeText = Object.assign(writeText, writeData);
                    }else
                    {

                        writeText = writeData;
                    }
                }
            }
        }
        if(writeText!=''){

            //write the headers and newline

              if(json!='' && json!=undefined)
              {
                  json=Object.assign(json,writeText);
              }
            writeData = JSON.stringify(writeText);
            fs.writeFileSync(logfile_name, writeData, 'utf8'); // write it back


        }
        return tmp;
    }
    ,
    translate:async function(text,from=''){
        console.log("text,from>>>>>>>>...",text,from)
        /* return new Promise(function(resolve) {
             translate(text,{to:'zh-cn'}).then(res=>{

             return 'Hyderabad';
         }).catch((error) => {
              /!*   assert.isNotOk(error,'Promise error');
             done();*!/

         });
         });*/
        var path=require('path');
        var fs=require('fs');
        var logfile_name = path.resolve(__dirname,'../translate/translate.json');
        console.log("logfile_name>>>>>>>...",logfile_name)
        var exists=fs.existsSync(logfile_name);

      /*  if (exists){
            var data=fs.readFileSync(logfile_name, 'utf8');
            if(data!=''){

                var json=JSON.parse(data);

                if(json[text]!=undefined)
                {

                    return json[text]['en'];
                }
            }
        }*/
      
        var ar=await   translate.translateText(text,{client:'gtx' ,from:from, to:'fi'});


        var en=await   translate.translateText(ar.text,{client:'gtx' , from:from,to:'en'});

        var writeData={};
        writeData[text]={"en":en,'fi':ar};
        if (exists)
        {
            //write the actual data and end with newline
            var data=fs.readFileSync(logfile_name, 'utf8');

            var accessTokens = '';
            if (data != ''){
                var jsonData = JSON.parse(data);
                accessTokens = Object.assign(jsonData, writeData);
            }else{

                accessTokens = writeData;
            }
            accessTokens = JSON.stringify(accessTokens);
            fs.writeFileSync(logfile_name, accessTokens, 'utf8'); // write it back
        }else
        {
            //write the headers and newline
            writeData=JSON.stringify(writeData);
            fs.writeFileSync(logfile_name, writeData, 'utf8'); // write it back
        }
        /* var en='';
         en.text=text;*/
        return en;
    },generateInviteCodeCustomer:generateInviteCodeCustomer,
    generateInviteCodeVendor:generateInviteCodeVendor,
    tmToken:tmToken,
    vendor:vendor,
    customer:customer,
    user_role_customer:user_role_customer,
    user_role_stylist:user_role_stylist,
    user_role_salon:user_role_salon,
    getTmUserId:getTmUserId,
    updateFcm:updateFcm,
    deleteFcm:deleteFcm,
    formatDateTime:formatDateTime,
    languageCode:languageCode,
    updateInviteAmountCustomer:updateInviteAmountCustomer,
    updateInviteAmountVendor:updateInviteAmountVendor,
    sendServiceRequestMail:sendServiceRequestMail,
    documentsExtensions:["docs","doc","pdf","docx","jpg","png","jpeg"],
    writeToFile:writeToFile,
    getTime:getTime(),
    parseDate : function(d,timeZone)
    {

        if (d === "0000-00-00 00:00"){
            return d;
        }

        d = new Date(d);
        // d.setTimezone(timeZone);
        var year = d.getFullYear().toString();
        var month = prependZero("" + (parseInt(d.getMonth().toString()) + 1));
        var day = prependZero(d.getDate().toString());
        var hours = prependZero(d.getHours().toString());
        var minutes = prependZero(d.getMinutes().toString());

        return year + "-" + month + "-" + day + " " + hours + ":" + minutes ;
    },
    generateGiftCardCode:generateGiftCardCode,
    serverRestart:function(){
        var fs=require('fs');
        var path=require('path');
        var logfile_name = path.resolve(__dirname,'../access_tokens/access_token.json');

        var exists=fs.existsSync(logfile_name);
        if (exists)
        {
            var data=fs.readFileSync(logfile_name, 'utf8');
            var json=JSON.parse(data);
            Object.size = function(obj) {
                var size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) size++;
                }
                return size;
            };

            accessTokens=json;
            var size = Object.size(accessTokens);

            //  console.log(accessTokens);
        }else{
            console.log("no file");
        }

    },
    COUPON_TYPE_COUPON:COUPON_TYPE_COUPON,
    COUPON_TYPE_GIFT:COUPON_TYPE_GIFT,
    COUPON_TYPE_PROMOCODE:COUPON_TYPE_PROMOCODE,
    BOOKING_STYLIST_TYPE_STYLIST:1,
    BOOKING_STYLIST_TYPE_SALON:2,
    BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE:3,
    serviceTypeStylist:1,
    serviceTypeSalon:2,
    SALON_EMPLOYEE_TYPE_ADMIN:1,
    SALON_EMPLOYEE_TYPE_STAFF:2,
    SALON_EMPLOYEE_TYPE_RECEPTION:3,
    VENDOR_TYPE_STYLIST:1,
    VENDOR_TYPE_SALON:2,
    VENDOR_TYPE_SERVEOUT_EMPLOYEE:3,
    VENDOR_TYPE_SALON_ADMIN:4,
    generateAccessToken: generateAccessToken,
    cron:require('../cronJobs'),
    mr_miss_booking_fee:1,
    device_type_ios:1,
    device_type_android:2,
    session_type_connect:1,
    session_type_disconnect:2,
    user_login_text:"user logged in ",
    user_logout_text:"user logged out ",
    user_online_text:"user online ",
    user_offline_text:"user offline ",
    cart_type_servive:1,
    cart_type_package:2,
    updateTmProfile:updateTmProfile,
    removeSpacesInBetween:function (string)
    {
        return string.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
    },
    iyzico_commission : 0.25,
    iyzico_percentage : 2.29,
    produrl : "http://mrmsbeauty.com/",
    testurl : "http://dev.mrmsbeauty.com/",
    minimumcancellationamount : 0.5
};
function generateAccessToken()
{
    var hashLength = 16;
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var hash = '';
    for (var i = 0; i < characters.length; i++) {
        hash = hash + characters.charAt(Math.random() * (hashLength - 0) + 0);
    }
    if(accessTokens[hash]===undefined)
    {
        accessTokens[hash]={};
        var writeToFileData=accessTokens[hash];
        writeToFileData[hash]={};
        writeToFile.writeAccessToken(accessTokens[hash]);
        return hash;
    }else{
        generateAccessToken();
    }
}
