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
           logfile_name='./log/'+now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+logfile_name+'.json';
               // console.log(logfile_name);
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

          var logfile_name = './error_log/response-data' + now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+'.txt';

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

          var logfile_name = './location_data/response-data' + now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate()+'-'+now.getHours()+'-'+now.getMinutes()+'-'+now.getSeconds()+'-'+now.getMilliseconds()+'-'+'.txt';

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
      }
    };

