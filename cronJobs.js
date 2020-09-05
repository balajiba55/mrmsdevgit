var child_process=require('child_process');
async function doesJobExist(job)
{
    var jobs =await getJobs();
   // console.log(job);
   // console.log(jobs);
   // console.log("index == ",jobs.indexOf(job));
    if(jobs.indexOf(job) !== -1)
    {
        return true;
    } else
    {
        return false;
    }
}
function stringToArray(str)
{
   return  str.split('\n');
}
function arrayToString(str)
{

       console.log(arrayToString);
    if(str.constructor !== Array){
        return str;
    }

    if(str.length > 2){
        return str.join('\r');
    }else{
        return str.join(" ");
    }

}
function getJobs()
{
    return new Promise(function(resolve){
    child_process.exec('crontab -l',function(error, stdout, stderr){
        var output=[];

        if(stdout!='')
          {


              output =stringToArray((stdout).trim());
          }
        return resolve(output);

   });
    });

}
function saveJobs(jobs)
{

    //console.log("inserting.......");

    /*child_process.exec('( crontab -l ; echo "'+arrayToString(jobs)+'" ) | crontab -',function(error, stdout, stderr){
        console.log("in save job");
        return true;
    });*/
    return new Promise(function(resolve){
        /*child_process.exec('echo '+arrayToString(jobs)+' | crontab -',function(error, stdout, stderr){*/
        /*return resolve(true);*/
        child_process.exec('( crontab -l ; echo "'+arrayToString(jobs)+'" ) | crontab -',function(error, stdout, stderr){
           // console.log("in save job");
            return resolve(stdout);
        });
    });


}
module.exports=
    {
        saveCron:async function(job)
        {
            var isJobExists = await doesJobExist(job);
            if (isJobExists){

                return false;
            }else{
                var returnValue = await saveJobs(job);
                return returnValue;
            }
        },getJobs: getJobs
    };