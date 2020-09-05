var CronJob = require('cron').CronJob;
var job={};

function createJobS(jobName,time,data,timezone)
{
    // console.log("out side the job name",jobName);
    job[jobName]=new CronJob({
        cronTime: time,
        onTick: function()
        {
         //   console.log("job name ",jobName);
             delete job[jobName];

            var data= fs.readFileSync('tmp/test.json', 'utf8');
            var j={};
            if(data!='')
            {
                // console.log(data,"first Job");
                data=JSON.parse(data);
                for(var k in data)
                {
                    if(k!=jobName)
                    {
                        var time=data[k]['time'];
                        var zone=data[k]['zone'];
                        j[k]={};
                        j[k]['time']=time;
                        j[k]['zone']=zone;
                        j[k]['data']='';

                    }
                    //   console.log(k,"k value");
                }
                j=JSON.stringify(j);
                writetoTheFile(j);
                // return callback(false)

            }

            this.stop();
        },
        start: true,

        timeZone: timezone
    });
}
function FirstchecktheJob(callback)
{
    fs.readFile('tmp/test.json', 'utf8', function (err, data) {
        var j={};
        if(data!='') {
            // console.log(data,"first Job");
            data=JSON.parse(data);
            for(var k in data) {

                var time=data[k]['time'];
                var zone=data[k]['zone'];
                j[k]={};
                j[k]['time']=time;
                j[k]['zone']=zone;
                j[k]['data']='http://192.168.2.33:8000/api/customer/call';
                createJobS(data[k],time,data[k]['data'],data[k]['zone'],function(reponse){

                });

                //   console.log(k,"k value");
            }
            j=JSON.stringify(j);
            writetoTheFile(j);
            return callback(false)

        }

    });
}
function writetoTheFile(j) {
    fs.writeFileSync('tmp/test.json',j,'utf8');
}
