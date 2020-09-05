
var Formidable = require('formidable');

exports = module.exports = function bodyParser(opt){
    return function bodyParser(req, res, next){

        var parser = exports.parse[mime(req)];
        if (parser && !req.body)
        {
            parser(opt, req, res, next);
        }
        else
         {

            next();
         }
    };
};

function mime(req)
{
    var str = req.headers['content-type'] || '';
    return str.split(';')[0];
}
function parseMultipart(opt, req, res, next)
{
    var form = new Formidable.IncomingForm();
    form.multiples = true;
    form.parse(req, function(err, fields, files){
        if (err)
            next(err);
        else
     {
            req.body = extend(fields, files);
            next();
        }
    });
}

function extend(target)
{
    var key, obj;
    var  l = arguments.length;
    for (var i = 0;  i < l; i++)
    {

        if ((obj = arguments[i]))
        {
            for (key in obj)
                target[key] = obj[key];
        }
    }
    return target;
}

exports.parse = {
    'multipart/form-data': parseMultipart,
    'application/x-www-form-urlencoded':parseMultipart,
    'application/json':parseMultipart,
    'text/plain':parseMultipart,
};
