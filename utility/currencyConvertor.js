var appId='ee87eb267411415e86e9cccb5d1d9de1';
var baseUrl='https://openexchangerates.org/api/';
var request=require('request');
function getCurrencyValuesWithBaseCurrency(baseCurrency,convertCurrency)
{
    var url=baseUrl+'latest.json?app_id='+appId+'&base='+baseCurrency+'&symbols='+convertCurrency;

    return new Promise(function(resolve){
        request(url,function(error, response, body) {
            //console.log("geting response",response);
            if (!error && response.statusCode == 200)
            {

               return resolve(body);


            }else
            {
                return resolve(null);
                // console.log("called");
            }
        });
    });

}
async function convertCurrencyValues(baseCurrency,convertCurrencyValue)
{

      var baseCurrencyValues=await getCurrencyValuesWithBaseCurrency(baseCurrency,convertCurrencyValue);
      if(baseCurrencyValues!=null && baseCurrencyValues.length!=0)
      {
          var json=JSON.parse(baseCurrencyValues);
          json=json.rates;

          return json;
      }
}
async function cartConversionValues(cartIds,baseCurrency,convertCurrencyCodes)
{
    var tables = require('../db_modules/baseTable');

    var values=tables.cartTable.findFieldsWithPromises({"_id":{"$in":cartIds}},{"price":1,"_id":1});
           var updateCurrency=[];
        var currencyValues=await convertCurrencyValues(baseCurrency,convertCurrencyCodes);
          for(var v=0;v<values.length;v++)
          {
              var tmp={};
              var price=values[v].price;
              var convertPrice=price*currencyValues[convertCurrency];
              tmp['price_converted']=convertPrice;
              tables.cartTable.update(tmp,{"_id":values[v]._id},function(response){

              });
          }
}
async function bookingConversionValues(bookingIds){
    var tables = require('../db_modules/baseTable');

        var values=await tables.bookingsTable.findFieldsWithPromises({"_id":{"$in":bookingIds}},{"vendor_id":1,"net_amount":1,"_id":1});

           if(values!=undefined && values.length!=0 && values[0].vendor_id!=undefined)
            {
               var updateCurrency=[];

               var vendor=await tables.vendorTable.getCurrency(values[0].vendor_id);
               var baseCurrency=values[0].customer_country_details.currency_code;
               var convertCurrency=vendor.currency_code;
               var convertCurrencySymbol=vendor.currency_code;
               var currencyValues=await convertCurrency(baseCurrency,'USD');
               for(var v=0;v<values.length;v++)
               {
                   var tmp={};
                   var price=values[v].net_amount;
                   var surge=values[v].surge;
                   var convertPrice=price*currencyValues['USD'];
                   tmp['price_converted_admin']=convertPrice;
                   if(surge!=undefined)
                   {
                       var surgePrice=surge*price;
                       var surgePriceAmount=surgePrice-price;
                       var convertSurgePrice=surgePriceAmount*currencyValues['USD'];
                       tmp['surge_price_converted_admin']=convertSurgePrice;
                   }
                   tables.bookingsTable.update(tmp,{"_id":values[v]._id},function(response){
                       cartConversionValues(response[0].cart_id,baseCurrency,convertCurrencySymbol)

                   });
               }
           }

}
async function updateSalonbookingConversionValues(bookingIds)
{
    var tables = require('../db_modules/baseTable');

    var values=await tables.bookingsTable.findFieldsWithPromises({"_id":{"$in":bookingIds}},{"vendor_id":1,surge:1,"net_amount":1,"_id":1});
      var updateCurrency=[];
      var salons=await tables.salonTable.getAdminCurrency(values[0].salon_id);
      var baseCurrency=values[0].customer_country_details.currency_code;
      var convertCurrency=salons.currency_code;
      var convertCurrencySymbol=salons.currency_code;
      if(convertCurrency!='USD')
      {
          convertCurrency+=",USD";
      }
      var currencyValues=await convertCurrencyValues(baseCurrency,convertCurrency);
             convertCurrency=convertCurrency.split(',');
             if(convertCurrency!=undefined && convertCurrency.length!=0 )
             {
                 if(currencyValues!=undefined && currencyValues.length!=0)
                 {
                     for(var v=0;v<values.length;v++)
                     {
                         var tmp={};
                         var price=values[v].net_amount;
                         var surge=values[v].surge;
                         var convertPrice=price*currencyValues[convertCurrency[0]];
                         var convertPriceAdmin=price*currencyValues['USD'];

                         tmp['price_converted']=convertPrice;
                         tmp['converted_currency']=convertCurrency;
                         tmp['converted_currency_symbol']=convertCurrencySymbol;
                         tmp['price_converted_admin']=convertPriceAdmin;

                         if(surge!=undefined)
                         {
                             var surgePrice=surge*price;
                             var surgePriceAmount=surgePrice-price;
                             var convertSurgePrice=surgePriceAmount*currencyValues[convertCurrency[0]];
                             var convertSurgePriceAdmin=surgePriceAmount*currencyValues['USD'];
                             tmp['surge_price_converted']=convertSurgePrice;
                             tmp['surge_price_converted_admin']=convertSurgePriceAdmin;
                         }
                         tables.bookingsTable.update(tmp,{"_id":values[v]._id},function(response){
                             cartConversionValues(response[0].cart_id,baseCurrency,convertCurrencySymbol)
                         });
                     }
                 }

             }

}
module.exports=
    {
        getCurrencyValuesWithBaseCurrency:getCurrencyValuesWithBaseCurrency,
        convertCurrencyValues:convertCurrencyValues,
        cartConversionValues:cartConversionValues,
        stylistBookingConversionValues:bookingConversionValues,
        updateSalonbookingConversionValues:updateSalonbookingConversionValues
    };