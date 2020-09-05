var express = require('express');
var app = express();
var path = require('path');
//var body_parser=require('body-parser');
var routing = require('./routing');
var convertor = require('./utility/currencyConvertor');
var utility = require('./utility/utility');
var moment = require('moment-timezone');
/*var logFile=require('./log');*/
//app.use(body_parser.urlencoded({extended:true}));
const translate = require('google-translate-api');
var tables = require('./db_modules/baseTable');
var mongoose = require('mongoose')
// mongoose.set('debug', true);
//app.use(body_parser.json());
var sockets = require('./sockets').sockets;
var ip = require('ip')
var vendor = {};
var fs = require('fs');
var httpOptions = {
    key: fs.readFileSync('/home/ubuntu/private_keys/private.key', 'utf8'),
    cert: fs.readFileSync('/home/ubuntu/ssl_keys/ee8587942223dc11.crt', 'utf8'),
    ca: fs.readFileSync('/home/ubuntu/ssl_keys/gd_bundle-g2-g1.crt', 'utf8'),
    requestCert: false,
    rejectUnauthorized: false
};
var server = require('http').Server(app);
//var server = require('https').Server(httpOptions,app);
var io = require('socket.io')(server);
app.io = io;
var cors = require('cors');
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));
var write = require('./utility/writeToFile');
var socketsConnetion = require('./sockets').socketsConnection(io);

/*var time=require('time')(Date);*/
/*app.use(function(req, res, next) {
    req.io = io;
    next();
});*/
app.use(express.static(path.join(__dirname, 'log')));
app.use(express.static(path.join(__dirname, 'error_log')));

var MultiParser = require('./multiparser');

app.use(MultiParser());
var timeout = require('connect-timeout'); //express v4

app.use(timeout(100000));

/*
app.use(haltOnTimedout);
*/
process.on("exit", function () {
    console.log("dsdsdsdsd");
    app.io.sockets.emit("server_shutdown");
});
function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();

}
app.use('/api/customer', routing.customer);
app.use('/api/vendor', routing.vendor);
app.use('/api/stylist', routing.stylist);
app.use('/api/salon', routing.salon);
app.use('/api/admin', routing.admin);

app.use('/',(req,res) => {
   
    res.send({status : true})

})
console.log(">>>>>>>>>>>>>>>>>",ip.address())

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        console.log(err);
        // logFile.silly(err);
        res.status(200);

        write.writeError('req url' + req.originalUrl + ' error   ' + err + ' req data ' + JSON.stringify(req.body));
        return res.send({
            success: false,
            message: err.message,
            error: ''
        });
    });
}
else {
    app.use(function (err, req, res, next) {
        // logFile.silly(err);
        write.writeError('req ' + req + ' error   ' + err);
        console.log(err);

        res.status(err.status || 500);
        // console.log(err);
        return res.send({
            success: false,
            message: err,
            error: err
        });
    });
}
/*var access = fs.createWriteStream(__dirname + '/node.access.log', { flags: 'a' })
    , error = fs.createWriteStream(__dirname + '/node.error.log', { flags: 'a' });*/
process.on('uncaughtException', function (err) {
    console.log("caught exception : ", err);
    write.writeError(' error   ' + err);
});
/*
process.stdout.pipe(access);
process.stderr.pipe(error);
*/
//console.log(process.stdout);
process.setMaxListeners(0);
var crypto = require('crypto');
function encrypt(string, hash) {
    var iv = '1234567890123456';
    var cipher = crypto.createCipheriv('aes-128-cbc', hash, iv);
    var encrypted = cipher.update(string, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    var hexVal = new Buffer.from(encrypted, 'binary');
    var newEncrypted = hexVal.toString('hex');
    return newEncrypted;
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
var port = process.env.PORT || 3002;

/*after npm install have to change this line in  node_modules.google-translate-api
var data ={
    client: 't',   /// change to client:'gtx'
    sl: opts.from,
    tl: opts.to,
    hl: opts.to,
    dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
    ie: 'UTF-8',
    oe: 'UTF-8',
    otf: 1,
    ssel: 0,
    tsel: 0,
    kc: 7,
    q: text
};
after npm install have to change this line in  node_modules.google-translate-api  */
server.listen(port, async function () {
    /*try{
        console.log(await utility.translateText("bhanu prakash",'en'));
    }catch (e) {
         console.log(e);
    }*/
    // console.log(require('./addon.cc'));


    console.log("started on port Number ", port);
    //updateLang();
});


// event for notify of server stop

var exceptionOccured = false;

//  for all kill pid and on process killing
process.on('SIGTERM', function () {
    console.log("comes the pid id");
    server.close(function () {
        console.log("Finished all requests", arguments);
        // for process to exit
        let exitCode = 1;
        process.exit(exitCode)
    });
    exceptionOccured = true;
    console.log("Finished all requests outside", arguments);
});
async function exitHandler(options, exitCode) {
    //console.log("fires the event");
    var writeData = { "comes": true };
    // utility.writeToFile.writeToFile(writeData);
    var vendorTable = require('./db_modules/vendorTable');
    var response = await vendorTable.checkSession();

    if (response && response.length != 0) {
        var sessionId, deviceType, vendorId;
        for (var i = 0; i < response.length; i++) {
            sessionId = response[i]._id;
            deviceType = response[i].device_type;
            vendorId = response[i].vendor_id;
            await vendorTable.updateWithPromises({
                "sessions": {
                    "device_type": deviceType, 'session_id': sessionId,
                    "session_type": utility.session_type_disconnect
                }
            }, { "_id": vendorId })
        }
    }

    if (options.cleanup) {
        console.log('clean', options);
    }
    if (exitCode || exitCode === 0) {
        console.log("exitcode");
        process.exit(1)
    }
    if (options.exit) {
        console.log('exitevent');
    }
}
//do something when app is closing

process.on('exit', function (code) {
    if (exceptionOccured) console.log('Exception occured');
    else console.log('Kill signal received');
});

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));


// event for notify of server stop

