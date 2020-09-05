var fs = require('fs');



module.exports={
      writeToFile:function(writedata){
          var now = new Date();

          // var json = JSON.stringify(writedata);
          var logfile_name = '';
                  if(writedata.path!=undefined)
                  {
                      var path=writedata.path;
                        path=path.split('/');
                      var appendPath=path[path.length-1];
                      logfile_name = appendPath;
                  }
             var path=require('path');
          var logfile_name =path.resolve(__dirname,'./log/'+now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+logfile_name+'.json');
               
          fs.stat(logfile_name, function (err, stat){
              if (err == null){

                  //write the actual data and end with newline


                  fs.readFile(logfile_name, 'utf8', function readFileCallback(err, data){
                      if (err){
                      } else {
                         var obj = JSON.parse(data); //now it an object
                           obj.push(writedata); //add some data
                        var  json = JSON.stringify(obj); //convert it back to json
                          fs.writeFile(logfile_name, json, 'utf8', function(){}); // write it back
                      }});

              }
              else {
                  //write the headers and newline
                  var json = JSON.stringify([writedata]);
                  fs.writeFile(logfile_name, json, 'utf8', function(){}); // write it back

              }
          });
      },
      writeError:function(writeData)
      {
          var now = new Date();
          var path=require('path');
          var logfile_name =path.resolve(__dirname,'./error_log/response-data' + now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+'.txt');

          fs.stat(logfile_name, function (err, stat){
              if (err == null){

                  //write the actual data and end with newline


                  fs.readFile(logfile_name, 'utf8', function readFileCallback(err, data){
                      if (err){
                      } else {

                          fs.writeFile(logfile_name, writeData, 'utf8', function(){}); // write it back
                      }});

              }
              else {
                  //write the headers and newline

                  fs.writeFile(logfile_name, writeData, 'utf8', function(){}); // write it back

              }
          });
      }, writeLocation:function(writeData)
      {
          var now = new Date();
          var path=require('path');
          var logfile_name =path.resolve(__dirname, './location_data/response-data' + now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+'.txt');
          

          fs.stat(logfile_name, function (err, stat){
              if (err == null){

                  //write the actual data and end with newline


                  fs.readFile(logfile_name, 'utf8', function readFileCallback(err, data){
                      if (err){
                      } else {

                          fs.writeFile(logfile_name, writeData, 'utf8', function(){}); // write it back
                      }});

              }
              else {
                  //write the headers and newline

                  fs.writeFile(logfile_name, writeData, 'utf8', function(){}); // write it back

              }
          });
      }, writeAccessToken:function(writeData){

          var path=require('path');
        var logfile_name = path.resolve(__dirname,'../access_tokens/access_token.json');
          
        var exists=fs.existsSync(logfile_name);
        if (exists){
            //write the actual data and end with newline
            var data=fs.readFileSync(logfile_name, 'utf8');

                var accessTokens = '';

                if (data != '') {
                    var jsonData = JSON.parse(data);
                    accessTokens = Object.assign(jsonData, writeData);
                } else {

                    accessTokens = writeData;
                }
                accessTokens = JSON.stringify(accessTokens);
                fs.writeFileSync(logfile_name, accessTokens, 'utf8'); // write it back
            }else{
            //write the headers and newline
            writeData=JSON.stringify(writeData);
            fs.writeFileSync(logfile_name, writeData, 'utf8'); // write it back

        }
    }
    };

