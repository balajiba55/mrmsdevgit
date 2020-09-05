var db = require('../db');
module.exports =
    {
        notification_type:{
            "1":{"notification_type":1,"notification_type_status":"Requesting Stylist"},
            "2":{"notification_type":2,"notification_type_status":"Booking confirmed"},
            "3":{"notification_type":3,"notification_type_status":"Requesting timeout"},
            "4":{"notification_type":4,"notification_type_status":"Booking cancelled by user"},
            "5":{"notification_type":5,"notification_type_status":"Booking cancelled by stylist"},
            "6":{"notification_type":6,"notification_type_status":"Requesting rejected"},
            "7":{"notification_type":7,"notification_type_status":"Booking started"},
            "8":{"notification_type":8,"notification_type_status":"Booking completed"},
            "9":{"notification_type":9,"notification_type_status":"Request cancelled by the User"},
            "10":{"notification_type":10,"notification_type_status":"User reached the salon"},
            "11":{"notification_type":11,"notification_type_status":"Requesting Salon"},
            "12":{"notification_type":12,"notification_type_status":"Booking confirmed from Salon"},
            "13":{"notification_type":13,"notification_type_status":"Requesting timeout from salon"},
            "14":{"notification_type":14,"notification_type_status":"Booking cancelled by user for salon"},
            "15":{"notification_type":15,"notification_type_status":"Booking cancelled by salon"},
            "16":{"notification_type":16,"notification_type_status":"Requesting rejected by salon"},
            "17":{"notification_type":17,"notification_type_status":"Booking started from the salon"},
            "18":{"notification_type":18,"notification_type_status":"Booking completed from the salon"},
            "19":{"notification_type":19,"notification_type_status":"Request cancelled by the User for salon"},
            "20":{"notification_type":20,"notification_type_status":"User reached the salon "} ,
            "21":{"notification_type":21,"notification_type_status":"Stylist reached location"},
            "22":{"notification_type":22,"notification_type_status":"reached to the customer location"}
        },
      save: function (values, callback) {


    var notifications = new db.notifications(values);

            notifications.save(function (err, response) {

        callback(response);
    });
}
    };