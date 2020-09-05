var tables = require('./db_modules/baseTable');
var utility = require('./utility/utility');
var stripe = require('./utility/stripPayment');
var sockets = {};
var requestedDeviceInfo = {};
function compareTime(a, b) {

    var min = { a: 0, b: 0 };
    if (a.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
        min.a = a.cancellation_time * 1440;
    } else if (a.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
        min.a = a.cancellation_time * 60;
    } else {
        min.a = a.cancellation_time;
    }
    if (b.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
        min.b = b.cancellation_time * 1440;
    } else if (b.cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
        min.b = b.cancellation_time * 60;
    } else {
        min.b = b.cancellation_time;
    }
    if (min.a < min.b) {
        return 1
    }
    if (min.a > b.cancellation_time_type) {
        return -1;
    }
}
function userConnection() {

}
module.exports = {
    sockets: sockets,
    socketsConnection: function (io) {
        io.sockets.available_rooms = {};
        io.on('connection', function (client) {
            var user_id = '';
            if (client.handshake.query.vendor_id != undefined) {
                var vendor_id = client.handshake.query.vendor_id;

                if (sockets[vendor_id] == undefined) {
                    sockets[vendor_id] = [];
                }
                var socket_id = client.id;

                sockets[vendor_id].push(client.id);
                // io.sockets.sockets[vendor_id]=vendor_id;
                /*client.room=vendor_id*/
                if (io.sockets.available_rooms[vendor_id] == undefined) {
                    io.sockets.available_rooms[vendor_id] = [];
                }
                io.sockets.available_rooms[vendor_id].push(socket_id);
                io.sockets.in('admins').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                io.sockets.in('agents').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                io.sockets.in('managers').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                client.join(vendor_id);

                var deviceType = client.handshake.query.device_type;

                if (deviceType != undefined) {
                    deviceType = parseInt(deviceType);
                    // var generatedSessionId=vendor_id+(new Date().getTime())+socket_id;
                    var generatedSessionId = client.handshake.query.session_token;
                    tables.vendorTable.updateArrays({
                        "sessions": {
                            "device_type": deviceType, 'session_id': generatedSessionId,
                            "session_type": utility.session_type_connect
                        }
                    }, { "_id": vendor_id });
                    client.handshake.query.vendor_session_id = generatedSessionId

                }
            }
            if (client.handshake.query.salon_id != undefined) {
                var vendor_id = client.handshake.query.salon_id;
                if (sockets[vendor_id] == undefined) {
                    sockets[vendor_id] = [];
                }
                var socket_id = client.id;
                sockets[vendor_id].push(client.id);
                // io.sockets.sockets[vendor_id]=vendor_id;
                /*client.room=vendor_id*/

                if (io.sockets.available_rooms[vendor_id] == undefined) {
                    io.sockets.available_rooms[vendor_id] = [];
                }
                io.sockets.available_rooms[vendor_id].push(socket_id);

                io.sockets.in('admins').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                io.sockets.in('agents').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                io.sockets.in('managers').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                client.join(vendor_id);

                var deviceType = client.handshake.query.device_type;
                if (deviceType != undefined) {
                    deviceType = parseInt(deviceType);
                    tables.salonTable.updateArrays({
                        "sessions": {
                            "device_type": deviceType, 'session_id': socket_id,
                            "session_type": utility.session_type_connect
                        }
                    }, { "_id": vendor_id });
                }
            }
            if (client.handshake.query.user_id != undefined) {
                user_id = client.handshake.query.user_id;
                if (user_id) {
                    if (sockets[user_id] == undefined) {
                        sockets[user_id] = [];
                    }
                    var socket_id = client.id;
                    sockets[user_id].push(socket_id);
                    client.join(user_id);
                    var deviceType = client.handshake.query.device_type;
                    var deviceName = client.handshake.query.device_name;
                    if (deviceType != undefined) {
                        deviceType = parseInt(deviceType);
                        tables.customerTable.updateArrays({
                            "sessions": {
                                "device_type": deviceType, 'session_id': socket_id,
                                "device_name": deviceName,
                                "session_type": utility.session_type_connect
                            }
                        }, { "_id": user_id });
                    }
                }
            }
            if (client.handshake.query.agents != undefined) {
                client.join('agents')
            }
            if (client.handshake.query.admins != undefined) {
                client.join('admins')
            }
            if (client.handshake.query.managers != undefined) {
                client.join('managers')
            }
            client.on('reconnect', function () {
                var user_id = '';
                if (client.handshake.query.vendor_id != undefined) {
                    var vendor_id = client.handshake.query.vendor_id;

                    if (sockets[vendor_id] == undefined) {
                        sockets[vendor_id] = [];
                    }
                    var socket_id = client.id;

                    sockets[vendor_id].push(client.id);
                    // io.sockets.sockets[vendor_id]=vendor_id;
                    /*client.room=vendor_id*/
                    if (io.sockets.available_rooms[vendor_id] == undefined) {
                        io.sockets.available_rooms[vendor_id] = [];
                    }
                    io.sockets.available_rooms[vendor_id].push(socket_id);
                    io.sockets.in('admins').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                    io.sockets.in('agents').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                    io.sockets.in('managers').emit('vendor_status', { 'vendor_id': vendor_id, "status": 1 });
                    client.join(vendor_id);

                    var deviceType = client.handshake.query.device_type;

                    if (deviceType != undefined) {
                        deviceType = parseInt(deviceType);
                        // var generatedSessionId=vendor_id+(new Date().getTime())+socket_id;
                        var generatedSessionId = client.handshake.query.session_token;

                        tables.vendorTable.updateArrays({
                            "sessions": {
                                "device_type": deviceType, 'session_id': generatedSessionId,
                                "session_type": utility.session_type_connect
                            }
                        }, { "_id": vendor_id });
                        client.handshake.query.vendor_session_id = generatedSessionId
                    }
                }
                if (client.handshake.query.salon_id != undefined) {
                    var vendor_id = client.handshake.query.salon_id;
                    if (sockets[vendor_id] == undefined) {
                        sockets[vendor_id] = [];
                    }
                    var socket_id = client.id;
                    sockets[vendor_id].push(client.id);
                    // io.sockets.sockets[vendor_id]=vendor_id;
                    /*client.room=vendor_id*/

                    if (io.sockets.available_rooms[vendor_id] == undefined) {
                        io.sockets.available_rooms[vendor_id] = [];
                    }
                    io.sockets.available_rooms[vendor_id].push(socket_id);

                    io.sockets.in('admins').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                    io.sockets.in('agents').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                    io.sockets.in('managers').emit('salon_status', { 'salon_id': vendor_id, "status": 1 });
                    client.join(vendor_id);

                    var deviceType = client.handshake.query.device_type;
                    if (deviceType != undefined) {
                        deviceType = parseInt(deviceType);
                        tables.salonTable.updateArrays({
                            "sessions": {
                                "device_type": deviceType, 'session_id': socket_id,
                                "session_type": utility.session_type_connect
                            }
                        }, { "_id": vendor_id });
                    }
                }
                if (client.handshake.query.user_id != undefined) {
                    user_id = client.handshake.query.user_id;
                    if (user_id) {
                        if (sockets[user_id] == undefined) {
                            sockets[user_id] = [];
                        }
                        var socket_id = client.id;
                        sockets[user_id].push(socket_id);
                        client.join(user_id);
                        var deviceType = client.handshake.query.device_type;
                        var deviceName = client.handshake.query.device_name;
                        if (deviceType != undefined) {
                            deviceType = parseInt(deviceType);
                            tables.customerTable.updateArrays({
                                "sessions": {
                                    "device_type": deviceType, 'session_id': socket_id,
                                    "device_name": deviceName,
                                    "session_type": utility.session_type_connect
                                }
                            }, { "_id": user_id });
                        }
                    }
                }
            });
            client.on("cancel_order_stylist", function (response, fn) {

                var bookingId = response.booking_id;
                var cancell_reason = response.cancell_reason;
                tables.bookingsTable.update({ "status": 5, cancell_reason: cancell_reason }, { "_id": bookingId }, async function (bookingResponse) {
                    if (bookingResponse != undefined) {
                        tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": bookingResponse.vendor_id }, async function (response) {
                            if (bookingResponse != undefined && bookingResponse.length != 0) {
                                var vendor_id = bookingResponse.vendor_id;
                                var user_id = bookingResponse.customer_id;
                                var countryId = bookingResponse.customer_country_details.country_id;
                                var cityId = bookingResponse.customer_country_details.city_id;
                                var stylistResponse = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "first_name": 1, "last_name": 1 });

                                var stylistName = 'stylist';
                                if (stylistResponse != undefined) {
                                    stylistName = stylistResponse[0].first_name['tr'];
                                }
                                var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);

                                // var data = {
                                //     "title": "Booking Cancelled",
                                //     "message": "Booking cancelled From " + stylistName,
                                //     "booking_id": bookingId,
                                //     "type": 5
                                // };
                                var data = {
                                    "title": "Rezervasyon Bilgilendirmesi",
                                    "message": `Rezervasyon ${stylistName} tarafından iptal edildi.`,
                                    "booking_id": bookingId,
                                    "type": 5
                                };
                                data['country_id'] = countryId;
                                data['city_id'] = cityId;
                                data['customer_id'] = user_id;
                                data['vendor_id'] = vendor_id;
                                data['notification_type'] = 5;

                                tables.notificationsTable.save(data, function (response) {

                                });

                                if (fcmResponse != undefined && fcmResponse.length != 0) {


                                    utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                                }

                                var response = await tables.bookingsTable.getCancellationPolicyStylit(bookingId);
                                if (response != undefined && response.length != 0) {
                                    var policyForAcceptance = response[0]['policy_for_acceptance'];
                                    var policyForArrival = response[0]['policy_for_arrival'];
                                    var cancellationTime = '';
                                    var cancellationTimeType = '';
                                    var cancellationType = '';
                                    var cancellationTypeValue = '';
                                    var text = '';
                                    var acceptanceTotalPolicy = [];
                                    var arrialTotalPolicy = [];
                                    var bookingTime = response[0].created;
                                    var now = new Date();
                                    bookingTime = new Date(bookingTime);
                                    var timeDiff = Math.abs(now.getTime() - bookingTime.getTime());
                                    //var diffMs = (Christmas - today); // milliseconds between now & Christmas
                                    var diffDays = Math.floor(timeDiff / 86400000); // days
                                    var diffHrs = Math.floor((timeDiff % 86400000) / 3600000); // hours
                                    var diffMins = Math.round(((timeDiff % 86400000) % 3600000) / 60000); // minutes
                                    var near = response[0].is_notified;

                                    var type = '';
                                    var cancellValue = 0;
                                    var value = 0;
                                    if (near == 1 || (policyForArrival['policy'] == undefined || policyForArrival['policy'].length == 0)) {
                                        if (policyForAcceptance['policy'].length != 0) {
                                            var acceptancePolicy = policyForAcceptance['policy'];
                                            acceptancePolicy = acceptancePolicy.sort(compareTime);
                                            for (var ac = 0; ac < acceptancePolicy.length; ac++) {

                                                if (diffDays != 0) {

                                                    if ((diffDays >= acceptancePolicy[ac].cancellation_time)) {
                                                        if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                                            value = acceptancePolicy[ac].cancellation_time;
                                                        }
                                                    }
                                                }
                                                else if (diffHrs != 0) {
                                                    if ((diffHrs >= acceptancePolicy[ac].cancellation_time)) {
                                                        if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                                            value = acceptancePolicy[ac].cancellation_time;
                                                        }
                                                    }
                                                }
                                                else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {
                                                    if (diffMins >= acceptancePolicy[ac].cancellation_time) {
                                                        if (acceptancePolicy[ac].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                                            value = acceptancePolicy[ac].cancellation_time;
                                                        }
                                                    }
                                                }
                                                if (value != 0) {


                                                    if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_RATING;
                                                        cancellValue = acceptancePolicy[ac].cancellation_type_value;
                                                        break;
                                                    }
                                                    if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                                                        cancellValue = acceptancePolicy[ac].cancellation_type_value;
                                                        break;
                                                    }
                                                    if (acceptancePolicy[ac].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_FLAT;
                                                        cancellValue = acceptancePolicy[ac].cancellation_type_value;
                                                        break;
                                                    }


                                                }

                                            }
                                        }
                                    } else {

                                        if (policyForArrival['policy'].length != 0) {
                                            var arrivalPolicy = policyForArrival['policy'];
                                            arrivalPolicy = arrivalPolicy.sort(compareTime);

                                            for (var ar = 0; ar < arrivalPolicy.length; ar++) {
                                                text = '';
                                                if (diffDays != 0) {
                                                    if (diffMins >= arrivalPolicy[ar].cancellation_time) {
                                                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_DAYS) {
                                                            value = arrivalPolicy[ar].cancellation_time;

                                                        }
                                                    }


                                                }
                                                else if (diffHrs != 0) {
                                                    if (diffHrs >= arrivalPolicy[ar].cancellation_time);
                                                    {
                                                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_HOURS) {
                                                            value = arrivalPolicy[ar].cancellation_time;
                                                        }
                                                    }

                                                }
                                                else if ((diffDays == 0) && (diffHrs == 0) && (diffMins != 0)) {

                                                    if (diffMins >= arrivalPolicy[ar].cancellation_time);
                                                    {
                                                        if (arrivalPolicy[ar].cancellation_time_type == utility.CANCELLATION_POLICY_TIME_TYPE_MINUTES) {
                                                            value = arrivalPolicy[ar].cancellation_time;
                                                        }
                                                    }
                                                }
                                                if (value != 0) {
                                                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_RATING;
                                                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                                                        break;
                                                    }
                                                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_PERCENTAGE;
                                                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                                                        break;
                                                    }
                                                    if (arrivalPolicy[ar].cancellation_type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                                        type = utility.CANCELLATION_POLICY_TYPE_FLAT;
                                                        cancellValue = arrivalPolicy[ar].cancellation_type_value;
                                                        break;
                                                    }

                                                }
                                            }


                                        }
                                    }
                                }

                                var update = {};

                                var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "surge": 1, "net_amount": 1, "vendor_id": 1, "customer_id": 1 });

                                if (cancellValue != 0) {


                                    if (type == utility.CANCELLATION_POLICY_TYPE_FLAT) {
                                        var amount = bookingDetails[0].net_amount;
                                        if (bookingDetails[0].surge != '' || bookingDetails[0].surge != undefined) {
                                            var surge = bookingDetails[0].surge;
                                        }
                                    }
                                    var netAmount = bookingDetails[0]['net_amount'];
                                    var surge = bookingDetails[0]['surge'];
                                    if (surge != undefined) {
                                        netAmount = netAmount * surge;
                                    }

                                    var cancellationAmount = cancellValue;
                                    if (type == utility.CANCELLATION_POLICY_TYPE_PERCENTAGE) {
                                        cancellationAmount = (netAmount / 100) * cancellValue;
                                    }
                                    if (type == utility.CANCELLATION_POLICY_TYPE_RATING) {
                                        var vendorId = bookingDetails[0]['vendor_id'];

                                        var customerId = bookingDetails[0]['customer_id'];
                                        var save = { "booking_id": bookingId, "customer_id": customerId, "vendor_id": vendorId, "rated_by": 1, "rating": cancellationAmount, "review": '' };
                                        var updateRating = await tables.ratingTable.save(save, function (response) {

                                        });
                                    }
                                    if (cancellationAmount < utility.minimumcancellationamount) {
                                        update['cancellation_amount'] = utility.minimumcancellationamount;
                                    } else {
                                        update['cancellation_amount'] = cancellationAmount;
                                    }

                                    update['cancell_type'] = type;
                                    update['cancell_type_value'] = cancellValue;
                                    update['cancellation_pay_status'] = 1;
                                }
                                tables.bookingsTable.update(update, { "_id": bookingId }, async function (response) {
                                    if (response.cancellation_amount != null) {
                                        await tables.bookingsTable.vendorcancellationamount(response)

                                    }

                                });



                                io.sockets.in(user_id).emit("cancel_order_stylist", { "booking_id": bookingId });
                                if (typeof fn == "function") {
                                    fn({ "success": true, "status": 5 });
                                }
                            }

                        });
                    } else {
                        if (typeof fn == "function") {
                            fn({ "success": false, "message": "invalid booking" });
                        }

                    }


                });
            });
            client.on("get_system_info", function (response) {
                if (response.user_id != undefined) {

                    var userId = response.user_id;

                    userId = userId.trim();
                    if (requestedDeviceInfo[userId] == undefined) {
                        requestedDeviceInfo[userId] = [];
                    }
                    requestedDeviceInfo[userId].push(client.id);

                    io.sockets.in(userId).emit('get_system_info', { 'user_id': userId });
                }
            });
            client.on("get_user_devices", function (response, fn) {
            });
            client.on("system_info", function (response) {

                if (client.handshake.query.user_id != undefined) {
                    var userId = client.handshake.query.user_id;
                    var requestedSockets = requestedDeviceInfo[userId];

                    for (let i = 0; i < requestedSockets.length; i++) {


                        if (io.sockets.sockets[requestedSockets[i]] != undefined) {
                            io.sockets.sockets[requestedSockets[i]].emit("device_info", response);
                            requestedDeviceInfo[userId].slice(i, 1);
                        } else {
                            requestedDeviceInfo[userId].slice(i, 1);
                        }
                    }
                }
            });
            client.on('vendor_accept', async function (response, fn) {

                var bookingId = response.booking_id;
                var bookingdata = await tables.bookingsTable.findbookingdetails({ "_id": bookingId })
                console.log("bookingdata && bookingdata.length.payment_type", bookingdata && bookingdata.length.payment_type, bookingdata)
                if (bookingdata && bookingdata.length && bookingdata[0].payment_type == 1) {
                    payment_status = 1
                } else {
                    payment_status = 2
                }
                stylistdetails = await tables.bookingsTable.findstylist({ vendor_id: response.vendor_id }, { booking_status: 1 });
                if (stylistdetails[0].booking_status) {
                    tables.bookingsTable.update({
                        "status": tables.bookingsTable.status[2].status,
                        "booking_accepted": new Date(),
                        "payment_status": payment_status
                    }, { "_id": bookingId }, async function (response) {
                        if (response != undefined) {
                            var vendor_id = response.vendor_id;
                            var user_id = response.customer_id;
                            var stylistType = response.stylist_type;
                            var countryId = response.customer_country_details.country_id;
                            var cityId = response.customer_country_details.city_id;

                            var stylistResponse = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "first_name": 1, "last_name": 1, "salon_id": 1 });
                            var getcurrentbookings = await tables.bookingsTable.getcurrentbookings(user_id);
                            let timer = 0;
                            if (getcurrentbookings && getcurrentbookings.length) {
                                var currentbookings = 1;
                            } else {
                                var currentbookings = 0;
                            }
                            if (currentbookings) {

                                var booking_accepted = getcurrentbookings[0].booking_accepted;
                                const currentdate = new Date();
                                ts1 = booking_accepted.getTime();
                                ts2 = currentdate.getTime();
                                timeStampdiff = ((ts2 - ts1) / 1000);
                                timer = ((getcurrentbookings.length * 2 * 60) - timeStampdiff) * 1000;
                                if (timer < 0) {
                                    timer = 0;
                                }
                            }

                            var stylistName = 'stylist';
                            if (stylistResponse != undefined) {
                                stylistName = stylistResponse[0].first_name['tr'];
                            }
                            var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);

                            // var data = {
                            //     "title": "Booking acceptance",
                            //     "message": "Booking Accepted From " + stylistName,
                            //     "booking_id": bookingId,
                            //     "type": 2
                            // };
                            var data = {
                                "title": "Rezervasyon Bilgilendirmesi",
                                "message": `Rezervasyon ${stylistName} tarafından kabul edildi.`,
                                "booking_id": bookingId,
                                "type": 2
                            };
                            data['country_id'] = countryId;
                            data['city_id'] = cityId;
                            data['customer_id'] = user_id;
                            data['vendor_id'] = vendor_id;
                            data['notification_type'] = 2;
                            data['timer'] = timer.toFixed(0);
                            tables.notificationsTable.save(data, function (response) {
                            });
                            if (fcmResponse != undefined && fcmResponse.length != 0) {
                                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                            }
                            if (stylistType === utility.BOOKING_STYLIST_TYPE_SERVEOUT_EMPLOYEE) {
                                var fcmResponseEmployee = await tables.fcmTable.getFcmIds(vendor_id);
                                var customerResponse = await tables.customerTable.findFieldsWithPromises({ "_id": user_id }, { "first_name": 1, "last_name": 1 });
                                var customerName = 'customer';
                                if (stylistResponse != undefined) {
                                    customerName = customerResponse[0].first_name['en'];
                                }
                                var bookingData = {
                                    "title": "Booking acceptance",
                                    "message": "Booking  From " + customerName,
                                    "booking_id": bookingId,
                                    "type": 2
                                };
                                bookingData['country_id'] = countryId;
                                bookingData['city_id'] = cityId;
                                bookingData['customer_id'] = user_id;
                                bookingData['vendor_id'] = vendor_id;
                                bookingData['notification_type'] = 2;
                                bookingData['timer'] = timer;
                                tables.notificationsTable.save(bookingData, function (response) {
                                });

                                if (fcmResponseEmployee != undefined && fcmResponseEmployee.length != 0) {

                                    utility.pushNotifications.sendPush(fcmResponseEmployee[0].fcm_id, bookingData);
                                }
                                var salonId = stylistResponse[0]['salon_id'];
                                io.sockets.in(vendor_id).emit("new_serve_out_booking", { "booking_id": bookingId, "booking_status": 2 });
                                io.sockets.in(salonId).emit("serve_out_booking_status", { "booking_id": bookingId, "booking_status": 2 });

                            }
                            io.sockets.in(user_id).emit("booking_status", { "booking_id": bookingId, "user_id": user_id, "booking_status": 2 });

                            if (typeof fn == "function") {
                                fn({ "success": true });
                            }
                        } else {
                            if (typeof fn == "function") {
                                fn({ "success": false })
                            }
                        }


                    });
                } else {
                    if (typeof fn == "function") {
                        fn({ "success": false })
                    }
                }
            });
            client.on('vendor_reject', async function (response, fn) {
                var bookingId = response.booking_id;
                tables.bookingsTable.update({ "status": tables.bookingsTable.status[6].status, "booking_rejeted": new Date() }, { "_id": bookingId }, async function (bookingResponse) {

                    if (bookingResponse != undefined) {
                        tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": bookingResponse.vendor_id }, async function (response) {

                            var user_id = bookingResponse.customer_id;
                            var vendor_id = bookingResponse.vendor_id;
                            var countryId = bookingResponse.customer_country_details.country_id;
                            var cityId = bookingResponse.customer_country_details.city_id;
                            var stylistResponse = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "first_name": 1, "last_name": 1, "type": 1, "salon_id": 1 });
                            var stylistName = 'stylist';
                            if (stylistResponse != undefined) {
                                stylistName = stylistResponse[0].first_name;
                            }

                            // var data = {
                            //     "title": "Booking Rejected",
                            //     "message": "Booking Rejected From " + stylistName['en'],
                            //     "booking_id": bookingId,
                            //     "type": 6
                            // };
                            var data = {
                                "title": "Rezervasyon Bilgilendirmesi",
                                "message": `Rezervasyon ${stylistName['tr']} tarafından reddedildi.`,
                                "booking_id": bookingId,
                                "type": 6
                            };


                            data['country_id'] = countryId;
                            data['city_id'] = cityId;
                            data['customer_id'] = user_id;
                            data['vendor_id'] = vendor_id;
                            data['notification_type'] = 6;

                            tables.notificationsTable.save(data, function (response) {

                            });

                            var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);
                            if (fcmResponse != undefined && fcmResponse.length != 0) {



                                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                            }

                            io.sockets.in(user_id).emit("booking_status", { "booking_id": bookingId, "user_id": user_id, "booking_status": 6 });

                            tables.bookingsTable.updateRejectVendors(vendor_id, { "_id": bookingId }, function (response) {

                            });
                            if (stylistResponse[0]['type'] == utility.VENDOR_TYPE_SERVEOUT_EMPLOYEE) {
                                var salonId = stylistResponse[0]['salon_id'];
                                io.sockets.in(salonId).emit("serve_out_booking_status", { "booking_id": bookingId, "booking_status": 6 });

                            }


                        });

                        if (typeof fn == "function") {
                            fn({ "success": true, "message": 'rejected' });
                        }
                    } else {
                        var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "vendor_id": 1 });
                        if (bookingDetails != undefined && bookingDetails.length != 0) {
                            var vendorId = bookingDetails[0]['vendor_id'];
                            tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": vendorId }, function (response) {
                            })
                        }

                        if (typeof fn == "function") {
                            fn({ "success": false });
                        }
                    }

                });

            });
            client.on("booking_start", function (response, fn) {
                var bookingId = response.booking_id;
                tables.bookingsTable.update({
                    "status": tables.bookingsTable.status[7].status, "booking_started": new Date()
                }, { "_id": bookingId }, async function (bookingResponse) {
                    if (bookingResponse != undefined && bookingResponse.length != 0) {
                        var user_id = bookingResponse.customer_id;
                        var vendor_id = bookingResponse.vendor_id;
                        var stylistResponse = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "first_name": 1, "last_name": 1 });
                        var countryId = bookingResponse.customer_country_details.country_id;
                        var cityId = bookingResponse.customer_country_details.city_id;
                        var stylistName = 'stylist';
                        if (stylistResponse != undefined && stylistResponse.length != 0) {
                            stylistName = stylistResponse[0].first_name['tr'];
                        }
                        var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);
                        // var data = {
                        //     "title": "Service Started",
                        //     "message": "Service Started From " + stylistName,
                        //     "booking_id": bookingId,
                        //     "type": 7
                        // };
                        var data = {
                            "title": "Servis Bilgilendirmesi ",
                            "message": `Servisiniz ${stylistName} tarafından başlatıldı.`,
                            "booking_id": bookingId,
                            "type": 7
                        };

                        data['country_id'] = countryId;
                        data['city_id'] = cityId;
                        data['customer_id'] = user_id;
                        data['vendor_id'] = vendor_id;
                        data['notification_type'] = 7;

                        tables.notificationsTable.save(data, function (response) {

                        });
                        if (fcmResponse != undefined && fcmResponse.length != 0) {

                            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                        }
                        io.sockets.in(user_id).emit("booking_start", { "booking_id": response.booking_id, "booking_status": 7 });
                        if (typeof fn == "function") {
                            fn({ "success": true, "message": "booking started", "status": 7 });
                        }
                    } else {
                        fn({ "success": false, "message": "booking  not started", "status": 2 });
                    }
                });
            });
            client.on("booking_complete", async function (response, fn) {
                var bookingId = response.booking_id;

                // client.broadcast.emit("booking_complete",{"booking_id":response.booking_id});
                var bookingPercentageResult = await tables.constantsTable.getBookingPercentage(1);
                var bookingPercentage = 0;
                if (bookingPercentageResult != undefined && bookingPercentageResult.length != 0 && bookingPercentageResult[0].booking_percentage != undefined) {
                    var bookingDetails = await tables.bookingsTable.findFieldsWithPromises({ "_id": bookingId }, { "net_amount": 1, "surge": 1 });
                    var netAmount = bookingDetails[0]['net_amount'];
                    var surge = (bookingDetails[0]['surge'] ? bookingDetails[0]['surge'] : 1);
                    netAmount = netAmount * surge;
                    bookingPercentage = bookingPercentageResult[0].booking_percentage;
                    var amount = (netAmount / 100) * bookingPercentage;
                    bookingPercentage = amount;
                    //{"$multiply":[{"$divide":["$net_amount",100]},utility.mr_miss_booking_fee]}
                }
                tables.bookingsTable.update({
                    "status": tables.bookingsTable.status[8].status, "booking_ended": new Date(),
                    'booking_percentage': bookingPercentage
                }, { "_id": bookingId }, function (bookingResponse) {
                    tables.stylistTable.update({ "booking_status": 1 }, { "vendor_id": bookingResponse.vendor_id }, async function (response) {
                        var user_id = bookingResponse.customer_id;
                        var vendor_id = bookingResponse.vendor_id;
                        var countryId = bookingResponse.customer_country_details.country_id;
                        var cityId = bookingResponse.customer_country_details.city_id;
                        var stylistResponse = await tables.vendorTable.findFieldsWithPromises({ "_id": vendor_id }, { "first_name": 1, "last_name": 1 });

                        var stylistName = 'stylist';
                        if (stylistResponse != undefined && stylistResponse.length != 0) {
                            stylistName = stylistResponse[0].first_name['tr'];
                        }
                        var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);
                        // var data = {
                        //     "title": "Booking Completed",
                        //     "message": "Booking Completed From " + stylistName,
                        //     "booking_id": bookingId,
                        //     "type": 8
                        // };
                        var data = {
                            "title": "Servis Bilgilendirmesi",
                            "message": `Servisiniz ${stylistName} tarafından tamamlandı.`,
                            "booking_id": bookingId,
                            "type": 8
                        };
                        data['country_id'] = countryId;
                        data['city_id'] = cityId;
                        data['customer_id'] = user_id;
                        data['vendor_id'] = vendor_id;
                        data['notification_type'] = 8;
                        tables.notificationsTable.save(data, function (response) {
                        });
                        if (fcmResponse != undefined && fcmResponse.length != 0) {
                            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                        }

                        io.sockets.in(user_id).emit("booking_complete", { "booking_id": bookingResponse._id });
                        var amount = bookingResponse.net_amount;
                        var country = bookingResponse.customer_country_details.country_id;
                        var currencyCode = bookingResponse.customer_country_details.currency_code;
                        if (bookingResponse.coupon_details != undefined && bookingResponse.coupon_details.coupon_scope == utility.COUPON_SCOPE_PRIVATE) {
                            var couponId = bookingResponse.coupon_details.coupon_id;
                            var couponResponse = await tables.couponsTable.updateUsersWithPromises({ "used_customers": { "customer_id": user_id, "booking_id": bookingId } }, { "_id": couponId });
                            var couponUpdate = await tables.couponsTable.pullWithPromises({ "customers": user_id }, { "_id": couponId });
                        }

                        // var customerDetails = await tables.customerTable.findFieldsWithPromises({ "_id": user_id }, { "strip_id": 1 });
                        // if (bookingResponse.payment_type == 2 && customerDetails) {
                        //     if (bookingResponse.surge) {
                        //         amount = amount * surge;
                        //     }
                        //     if (bookingResponse.coupon_details) {
                        //         var couponAmount = bookingResponse.coupon_details.coupon_amount;
                        //         if (couponAmount) {
                        //             amount = amount - couponAmount;
                        //         }
                        //     }
                        //     var stripId = customerDetails[0].strip_id;
                        //     var paymentDetails = await stripe.chargeCustomer(amount, currencyCode, stripId);
                        //     if (paymentDetails && paymentDetails.keys.length) {
                        //         var stripFee = paymentDetails.strip_fee;
                        //         var updateCustomer = await tables.bookingsTable.updateWithPromises({ "payment_status": 2, "strip_charge_id": paymentDetails.id, "strip_fee": stripFee }, { "_id": bookingResponse._id })
                        //     } else {

                        //     }
                        // } else {
                        //     var updateCustomer = await tables.bookingsTable.updateWithPromises({ "payment_status": 2 }, { "_id": bookingResponse._id })

                        // }


                        utility.updateInviteAmountCustomer(user_id, amount, country);
                        utility.updateInviteAmountVendor(vendor_id, amount, country);

                    });


                    if (typeof fn == "function") {
                        fn({ "success": true, "message": "booking completed", "status": 8 });
                    }


                });
            });
            client.on("location_update", function (response, fn) {
                var vendorId = response.vendor_id;
                var latitude = parseFloat(response.latitude);
                var longitude = parseFloat(response.longitude);
                var data = {};

                data['location'] = { "type": "Point", "coordinates": [longitude, latitude] };
                data['type'] = 1;
                tables.vendorLocationTable.update(data, { 'vendor_id': vendorId }, async function (response) {
                    if (response == null) {
                        data['vendor_id'] = vendorId;
                        tables.vendorLocationTable.save(data, function (response) {

                        });
                    }
                    tables.vendorLocationTable.updateLocationTime(new Date(), { "vendor_id": vendorId }, function (response) { })
                });
                tables.bookingsTable.find({ "vendor_id": vendorId, "status": 2 }, function (response) {

                    tables.surgePriceTable.checkSurgePrice(latitude, longitude, function (surgeResponse) {
                        if (surgeResponse != undefined && surgeResponse.length != 0) {
                            client.emit('surge_price', surgeResponse[0]);
                        }
                    });
                    if (response == undefined || response.length == 0) {
                        var dbDate = new Date();
                        var seconds = 180;
                        var parsedDate = new Date(Date.parse(dbDate));
                        var newDate = new Date(parsedDate.getTime() + (1000 * seconds));
                        tables.providerStatusTable.save({ "expire_at": utility.formatDateTime(newDate), "vendor_id": vendorId }, function (response) {

                        })

                    } else {
                        if (response != undefined && response.length != 0) {
                            var bookingId = response[0]._id;
                            var user_id = response[0].customer_id;
                            var customerLatitude = response[0].latitude;
                            var customerLongitude = response[0].longitude;
                            var countryId = response[0].customer_country_details.country_id;
                            var cityId = response[0].customer_country_details.city_id;

                            io.sockets.in(user_id).emit("stylist_location", { 'latitude': latitude, 'longitude': longitude, "vendor_id": vendorId });

                            var notifiy = response[0].is_notified;
                            if (notifiy != undefined && notifiy == 1) {

                                tables.vendorLocationTable.checkReachedLocation(vendorId, customerLatitude, customerLongitude, async function (response) {
                                    if (response != undefined && response.length != 0) {
                                        tables.bookingsTable.update({ "is_notified": 2 }, { "_id": bookingId }, function (response) {

                                        });
                                        var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);
                                        // var data = {
                                        //     "title": "Stylist Reached",
                                        //     "message": "Stylist Reached to your location",
                                        //     "booking_id": bookingId,
                                        //     "type": 8
                                        // };
                                        var data = {
                                            "title": "Stilist Takibi",
                                            "message": "Stilist belirttiğiniz lokasyona ulaştı.",
                                            "booking_id": bookingId,
                                            "type": 8
                                        };
                                        data['country_id'] = countryId;
                                        data['city_id'] = cityId;
                                        data['customer_id'] = user_id;
                                        data['vendor_id'] = vendorId;
                                        data['notification_type'] = 21;

                                        tables.notificationsTable.save(data, function (response) {

                                        });
                                        if (fcmResponse != undefined && fcmResponse.length != 0) {
                                            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                                        }
                                        fcmResponse = await tables.fcmTable.getFcmIds(vendorId);
                                        // data = {
                                        //     "title": "Reached Location",
                                        //     "message": "Reached to customer location",
                                        //     "booking_id": bookingId,
                                        //     "type": 8
                                        // };
                                        data = {
                                            "title": "Stilist Takibi",
                                            "message": "Stilist belirttiğiniz lokasyona ulaştı.",
                                            "booking_id": bookingId,
                                            "type": 8
                                        };
                                        data['country_id'] = countryId;
                                        data['city_id'] = cityId;
                                        data['customer_id'] = user_id;
                                        data['vendor_id'] = vendorId;
                                        data['notification_type'] = 22;
                                        tables.notificationsTable.save(data, function (response) {

                                        });
                                        if (fcmResponse != undefined && fcmResponse.length != 0) {


                                            utility.pushNotifications.sendPush(fcmResponse[0].fcm_id, data);
                                        }
                                    }

                                });
                            }
                            tables.bookingsTable.updateLocation([[parseFloat(latitude), parseFloat(longitude)]], { "_id": bookingId }, function (response) {

                            });
                        }
                    }
                });
                if (typeof fn == 'function') {
                    fn({ "success": true, "message": "location updated" });

                }

            });

            client.on("accept_salon_order", function (request) {
                var order_id = request.order_id;
                if (order_id != undefined) {
                    tables.ordersTable.update({ "status": 2 }, { _id: order_id }, async function (orderResponse) {
                        if (orderResponse != undefined && orderResponse.length != 0) {
                            var user_id = orderResponse.customer_id;
                            var salon_id = orderResponse.salon_id;
                            var salonResponse = await tables.salonTable.findFieldsWithPromises({ "_id": salon_id }, {
                                "salon_name": 1,
                                "country_id": 1, "city_id": 1
                            });

                            var salonName = 'salon';
                            if (salonResponse != undefined) {
                                salonName = salonResponse[0].salon_name;
                            }
                            var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);

                            if (fcmResponse != undefined && fcmResponse.length != 0) {

                                // var data = {
                                //     "title": "Booking acceptance",
                                //     "message": "Booking Accepted From salon",
                                //     "order_id": order_id,
                                //     "type": 2
                                // };
                                var data = {
                                    "title": "Booking acceptance",
                                    "message": "Booking Accepted From salon",
                                    "order_id": order_id,
                                    "type": 2
                                };
                                utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                            }
                            data['country_id'] = salonResponse[0].country_id;
                            data['city_id'] = salonResponse[0].city_id;
                            data['customer_id'] = user_id;
                            data['vendor_id'] = salon_id;
                            data['notification_type'] = 16;

                            tables.notificationsTable.save(data, function (response) {

                            });
                            io.sockets.in(user_id).emit("accept_salon_order", { "order_id": order_id });
                            io.sockets.in(salon_id).emit("order_status", { "order_id": order_id, "status": 2 });

                            /*  tables.bookingsTable.find({"_id":{"$in":orderResponse.booking_id}},function(response)
                              {
    
                              });*/
                            tables.bookingsTable.updateMany({ "status": 2 }, { "_id": { "$in": orderResponse.booking_id } }, function (response) {

                            });
                        }


                    });
                }

            });
            client.on("reject_salon_order", function (response, callback) {
                var order_id = response.booking_id;
                if (order_id == undefined) {
                    order_id = response.order_id;
                }
                tables.ordersTable.update({ "status": 5 }, { "_id": order_id }, async function (orderResponse) {
                    if (response != undefined) {
                        var user_id = orderResponse.customer_id;
                        var salon_id = orderResponse.salon_id;
                        var salonResponse = await tables.salonTable.findFieldsWithPromises({ "_id": salon_id }, { "salon_name": 1, "country_id": 1, 'city_id': 1 });

                        var salonName = 'salon';
                        if (salonResponse != undefined) {
                            salonName = salonResponse[0].salon_name['en'];
                        }
                        var fcmResponse = await tables.fcmTable.getFcmIdsCustomer(user_id);

                        // var data = {
                        //     "title": "Booking rejected",
                        //     "message": "Booking rejected From salon",
                        //     "order_id": order_id,
                        //     "type": 6
                        // };
                        var data = {
                            "title": "Booking rejected",
                            "message": "Booking rejected From salon",
                            "order_id": order_id,
                            "type": 6
                        };
                        data['country_id'] = salonResponse[0].country_id;
                        data['city_id'] = salonResponse[0].city_id;
                        data['customer_id'] = user_id;
                        data['vendor_id'] = salon_id;
                        data['notification_type'] = 16;

                        tables.notificationsTable.save(data, function (response) {

                        });
                        if (fcmResponse != undefined && fcmResponse.length != 0) {



                            utility.pushNotifications.sendPushCustomer(fcmResponse[0].fcm_id, data);
                        }
                        tables.bookingsTable.updateMany({ "status": 6 }, { "_id": { "$in": orderResponse.booking_id } }, function (response) {

                        });

                        io.sockets.in(user_id).emit("reject_salon_order", { "order_id": order_id });
                        io.sockets.in(salon_id).emit("order_status", { "order_id": order_id, "status": 6 });
                        if (typeof callback == 'function') {

                            callback({ "success": true });

                        }
                    } else {

                        if (typeof callback == 'function') {

                            callback({ "success": false });

                        }
                    }
                });
            });
            client.on("disconnect", function (response) {
                //io.sockets.disconnect();
                var deviceType = client.handshake.query.device_type;

                if (client.handshake.query.vendor_id != undefined && client.handshake.query.vendor_id != "") {



                    client.emit('socket_disconnect', { "vendor_id": client.handshake.query.vendor_id });

                }
                if (client.handshake.query == 'admins' || client.handshake.query == 'managers' || client.handshake.query == 'agents') {
                    client.leave(client.handshake.query);
                }
                if (client.handshake.query.user_id != undefined || client.handshake.query.vendor_id != undefined) {


                    var id = client.handshake.query.vendor_id;
                    if (id == undefined) {

                        id = client.handshake.query.user_id
                    }

                    var socketId = client.id;
                    if (io.sockets.available_rooms[vendor_id] != undefined) {

                        socketId = socketId.trim();
                        var roomId = io.sockets.available_rooms[vendor_id].indexOf(socketId);

                        if (roomId != -1 && roomId != undefined) {
                            io.sockets.available_rooms[vendor_id].splice(roomId, 1);

                        }
                    }
                    if (sockets[id] != undefined) {
                        var socketIndex = sockets[id].indexOf(socketId);
                        if (socketIndex != -1) {

                            client.leave(id);
                            sockets[id].splice(socketIndex, 1);

                        }
                    }
                    if (client.handshake.query.vendor_id != undefined) {
                        if (io.sockets.adapter.rooms[vendor_id] != undefined) {
                            var json = JSON.stringify(io.sockets.adapter.rooms[vendor_id]);
                            json = JSON.parse(json);
                            if (json['length'] == 0) {
                                io.sockets.in('admins').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                                io.sockets.in('agents').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                                io.sockets.in('managers').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                            }
                        }

                        if (deviceType != undefined) {
                            socket_id = client.id;
                            deviceType = parseInt(deviceType);
                            if (io.sockets.adapter.rooms[vendor_id] != undefined) {
                                var json = JSON.stringify(io.sockets.adapter.rooms[vendor_id]);
                                json = JSON.parse(json);
                                if (json['length'] == 0) {
                                    tables.vendorTable.update({ "last_seen": new Date() }, { "_id": vendor_id }, function (response) {

                                    });
                                }
                            }
                            tables.vendorTable.updateArrays({
                                "sessions": {
                                    "device_type": deviceType, 'session_id': client.handshake.query.session_token,
                                    "session_type": utility.session_type_disconnect
                                }
                            }, { "_id": vendor_id });
                        }
                    } else if (client.handshake.query.user_id != undefined) {
                        var user_id = client.handshake.query.user_id;
                        if (deviceType != undefined) {
                            socket_id = client.id;
                            deviceType = parseInt(deviceType);


                            if (io.sockets.adapter.rooms[user_id] != undefined) {
                                var json = JSON.stringify(io.sockets.adapter.rooms[user_id]);
                                json = JSON.parse(json);

                                if (json['length'] == 0) {

                                    tables.customerTable.update({ "last_seen": new Date() }, { "_id": user_id }, function (response) {

                                    });
                                }
                            } else {
                                tables.customerTable.update({ "last_seen": new Date() }, { "_id": user_id }, function (response) {

                                });
                            }
                            tables.customerTable.updateArrays({
                                "sessions": {
                                    "device_type": deviceType, 'session_id': socket_id,
                                    "session_type": utility.session_type_disconnect
                                }
                            }, { "_id": user_id });
                        }
                    }
                }




            });
            client.on('server_time', function (response, fn) {
                var moment = require('moment-timezone');
                var localDate = new Date();
                var format = 'YYYY-MM-DD HH:mm:ss';
                var utcTime = moment.utc(localDate).format(format);
                fn({ "date_time": utcTime });
            });
            client.on('socket_disconnect', function () {

                if (client.handshake.query.vendor_id != undefined) {

                    client.emit('socket_disconnect', { "vendor_id": client.handshake.query.vendor_id });
                }
                if (client.handshake.query == 'admins' || client.handshake.query == 'managers' || client.handshake.query == 'agents') {
                    client.leave(client.handshake.query);
                }
                if (client.handshake.query.user_id != undefined || client.handshake.query.vendor_id != undefined) {
                    var id = client.handshake.query.vendor_id;
                    if (id == undefined) {
                        id = client.handshake.query.user_id
                    }
                    var socketId = client.id;
                    if (io.sockets.available_rooms[vendor_id] != undefined) {

                        socketId = socketId.trim();
                        var roomId = io.sockets.available_rooms[vendor_id].indexOf(socketId);

                        if (roomId != -1 && roomId != undefined) {
                            io.sockets.available_rooms[vendor_id].splice(roomId, 1);

                        }
                    }
                    if (sockets[id] != undefined) {
                        var socketIndex = sockets[id].indexOf(socketId);
                        if (socketIndex != -1) {

                            client.leave(id);
                            sockets[id].splice(socketIndex, 1);
                        }
                    }

                    if (client.handshake.query.vendor_id != undefined) {

                        if (io.sockets.adapter.rooms[vendor_id] != undefined) {
                            var json = JSON.stringify(io.sockets.adapter.rooms[vendor_id]);
                            json = JSON.parse(json);
                            if (json['length'] != 0) {
                                io.sockets.in('admins').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                                io.sockets.in('agents').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                                io.sockets.in('managers').emit('vendor_status', { 'vendor_id': vendor_id, "status": 2 });
                            }
                        }



                    }

                }

            });
            client.on('active_view', function (response, fn) {
                // fn(true);

                var salonId = response.salon_id;
                var userId = response.user_id;

                fn(true);
                if (io.sockets.available_rooms['views_' + salonId] != undefined) {
                    io.sockets.available_rooms['views_' + salonId].push(userId);
                } else {
                    io.sockets.available_rooms['views_' + salonId] = [];
                    io.sockets.available_rooms['views_' + salonId].push(userId);
                }
            });
            client.on('remove_view', function (response) {
                var salonId = response.salon_id;
                var userId = response.user_id;
                var index = -1;
                if (io.sockets.available_rooms['views_' + salonId] != undefined) {
                    index = io.sockets.available_rooms['views_' + salonId].indexOf(userId);
                }
                if (index != -1) {
                    io.sockets.available_rooms['views_' + salonId].splice(index, 1);
                }

            });
            client.on('get_vendor_online', function (response, callback) {

                var vendorsList = response.vendor;

                var onlineUsers = [];
                for (var v = 0; v < vendorsList.length; v++) {
                    var vendorId = vendorsList[v].trim();
                    if (io.sockets.adapter.rooms[vendorId] != undefined) {
                        var json = JSON.stringify(io.sockets.adapter.rooms[vendorId]);
                        json = JSON.parse(json);
                        if (json['length'] != 0) {
                            onlineUsers.push(vendorId);
                        }
                    }

                }

                callback(onlineUsers);

            });

        });

    }
};
