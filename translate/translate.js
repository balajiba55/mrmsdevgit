var request=require('request');

const url='https://translation.googleapis.com/language/translate/v2?key=AIzaSyANAcmRoYaTWS8vw3KhSl3dSsmskld7wGk';

function translateText(text,options)
{
    console.log("text>>>>>>>>>>>>>>>?????????????????????",text)
    
    var dataField={"q":text};

      if(options['from']!=undefined && options['from']!='')
      {
          dataField['source']=options['from'];
      }


    if(options['to']!=undefined)
    {
        dataField['target']=options['to'];
    }else{
          dataField['target']='en';
    }


    return new Promise(function(resolve){
        console.log("dataField>>>>>>>>>>>>>...",dataField)
            request({
                headers: {
                    'Content-Type': 'application/json'
                },
                uri:url,
                form: dataField,
                json:true,
                method: 'POST'
            },function(error, response, body){
                console.log("error>>>>>>>>>>>>>>.",error,response.statusCode,body)
                if(!error && response.statusCode == 200)
                {
                   return resolve(formateResponse(body));
                }else
                {
                    console.log("comming to else",error)
                     new Error(error);
                }
            });
    })
}
function formateResponse(response)
{
     var finallResponse={};

     if(response.data!=undefined && response.data.translations!=undefined)
     {

         finallResponse['text']=response.data.translations[0]['translatedText'];
         //finallResponse['detectedSourceLanguage']=response.body.transalations[0]['detectedSourceLanguage'];
     }else{
         finallResponse['text']='';
         finallResponse['detectedSourceLanguage']='';
     }
    return finallResponse
}

module.exports={translateText:translateText};