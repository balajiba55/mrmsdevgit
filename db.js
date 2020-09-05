var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*mongoose.connect('mongodb://localhost:27017/mr_miss',{ useNewUrlParser: true },function (err) {*/
// mongoose.connect('mongodb://localhost:27017/mr_mrs_production', { "user": "mrmrsadmin", "pass": "R@ndom@1201@", useNewUrlParser: true, useFindAndModify: false }, function (err) {
    // mongoose.connect('mongodb://localhost:27017/mr_mrs_production_25-06', { useNewUrlParser: true, useFindAndModify: false }, function (err) {
    mongoose.connect('mongodb://localhost:27017/mr_mrs_development', { useNewUrlParser: true, useFindAndModify: false }, function (err) {

    if (err) throw err;
    console.log('mongodb Successfully connected');
});
var sequenceSchema = new Schema({
    _id: String,
    seq: Number,
    increment_id: String,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var counters = mongoose.model('sequence', sequenceSchema, "sequence");

var inviteCodesSchema = new Schema({

    customer_id: Schema.Types.ObjectId,

    amount: { type: Number, default: 0 },

    created_at: {
        type: Date,
        default: Date.now
    },

    remind: { type: Number, default: 1 },
    is_redeemed: { type: Number, default: 1 }

});
var customerGiftCardSchema = new Schema({
    gift_id: Schema.Types.ObjectId,
    gifted_by_customer_id: Schema.Types.ObjectId,
    generated_gift_id: Schema.Types.ObjectId,
    gift_card_type: Number,
    expiry_date: Date,
    code: String,
    created: {
        type: Date,
        default: Date.now
    }
});
var guestUsersSchema = new Schema({
    mobile: String,
    mobile_country: String,
    gift_card: [customerGiftCardSchema],
    created: {
        type: Date,
        default: Date.now
    }
});
var constantsSchema = new Schema({
    constant_type: Number,
    booking_type: Number,
    booking_percentage: Number,
    created: {
        type: Date,
        default: Date.now
    }
});
var paymentCardSchema = new Schema({

    add_coversation_id: String,
    add_email: String,
    add_external_id: String,
    add_card_nick_name: String,
    add_card_name: String,
    add_card_number: String,
    // add_exp_month: String,
    // add_exp_year: String,
    add_last_4digits: String,
    // CVV: String,
    UserId: { type: Schema.Types.ObjectId },
    card_user_key: String,
    card_token: String,
    car_nick_name: String,
    card_bin_number: String,
    card_type: String,
    card_association: String,
    card_family: String,
    card_bank_code: String,
    card_bank_name: String,
    payment_status: String,
    status: Number,
    is_primary: Number,
    error_message: {
        type: String
    },
    card_result: {
        type: Object
    },
    payment_result: {
        type: Object

    }

});

var onlinepaymentSchema = new Schema({

    locale: String,
    conversationId: String,
    price: Number,
    paidPrice: Number,
    currency: String,
    totalmarchantamount: Number,
    basketId: {
        type: Schema.Types.ObjectId
    },
    vendorId: {
        type: Schema.Types.ObjectId
    },
    order_approve_status: {
        type: Number,
        default: 0
    },
    paymentGroup: String,

    enabledInstallments: Array,
    token: String,
    paymentstatus: String,
    paymentstatus: String,
    paymentId: String,
    buyer: {
        id: { type: String },
        name: { type: String },
        surname: { type: String },
        gsmNumber: { type: String },
        email: { type: String },
        identityNumber: { type: String },
        lastLoginDate: { type: String },
        registrationDate: { type: String },
        registrationAddress: { type: String },
        ip: { type: String },
        city: { type: String },
        country: { type: String },
        zipCode: { type: String }
    },
    shippingAddress: {
        contactName: { type: String },
        city: { type: String },
        country: { type: String },
        address: { type: String },
        zipCode: { type: String }
    },
    billingAddress: {
        contactName: { type: String },
        city: { type: String },
        country: { type: String },
        address: { type: String },
        zipCode: { type: String }
    },
    basketItems: [
        {
            id: { type: String },
            name: { type: String },
            category1: { type: String },
            category2: { type: String },

            price: { type: Number },
            submarchantkey: { type: String },
            marchantamount: { type: Number },
            quantity: { type: Number },
            duration: { type: Number },
            paymentTransactionId: { type: String },
            cancelamount: { type: Number },
            refundamount: { type: Number },


            approve_status: {
                type: Number,
                default: 0
            }

        }

    ],
    error_message: {
        type: String
    },
    payment_result: {
        type: Object
    }, cancelby: {
        type: String,
        default: 0
    }

});
var sessionsSchema = new Schema({
    session_id: String,
    device_type: Number,
    session_type: Number,
    device_modal: String,
    device_name: String,
    created_at: {
        type: Date,
        default: Date.now
    }
}, { strict: false });

var customersSchema = new Schema({
    full_name: Object,
    first_name: Object,
    tm_user_id: { type: Number, default: 0 },
    last_name: Object,
    email: String,
    mobile: { type: String },
    password: String,
    hash: String,
    gender: String,
    city: String,
    state: String,
    country: String,
    nationality: {
        shortCode: String,
        nationality: String
    },
    otp: String,
    referral_code_id: String,
    role: Number,
    status: Number,
    display_name: String,
    preferred_style: Array,
    stylist_gender: Array,
    payment_mode: Number,
    device_id: String,
    created: {
        type: Date,
        default: Date.now
    },
    profile_pic: String,
    updated: {
        type: Date,
        default: Date.now
    },
    invite: [inviteCodesSchema],
    invite_code: String,
    customer_inc_id: { "type": Number },
    referral_invite_code: String,
    gift_card: [customerGiftCardSchema],
    referral_customer_id: Schema.Types.ObjectId,
    referral_amount: Number,
    mobile_country: String,
    payment: [paymentCardSchema],
    sessions: [sessionsSchema],
    access_token: String,
    is_locked: { "type": Number, 'default': 1 },
    strip_id: String,
    is_social_login: { "type": Number, 'default': 0 },
    last_seen: Date
}, { strict: false }, { versionKey: false });
var stylesSchema = new Schema({
    style: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var languagesSchema = new Schema({
    language: Object,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var fcmIdsSchems = new Schema({
    fcm_id: String,
    device_id: String,
    device_type: Number
}, { _id: false });
var fcmSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    vendor_id: Schema.Types.ObjectId,
    fcm: [fcmIdsSchems],

    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var stylistSerives = new Schema({
    "service_id": Schema.Types.ObjectId,
    '1': { type: Array, default: undefined },
    '2': { type: Array, default: undefined },
    '3': { type: Array, default: undefined },
    '4': { type: Array, default: undefined }
},
    { _id: false });
var vendorInvitCodesSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    amount: { type: Number, default: 0 },
    created_at: {
        type: Date,
        default: Date.now
    },
    remind: { type: Number, default: 1 },
    is_redeemed: { type: Number, default: 1 }
});
var paymentStatusSchema = new Schema({
    created_at: {
        type: Date,
        default: Date.now
    }, amount: Number, request_from: { type: Number, default: 4 }, status: Number, "transfer": Object
});

var vendorSchema = new Schema({
    mobile: String,
    email: String,
    tm_user_id: { type: Number, default: 0 },
    password: String,
    hash: String,
    type: Number,
    dob: String,
    first_name: Object,
    last_name: Object,
    gender: Number,
    status: Number,
    is_verified: String,
    profile_pic: String,
    services: [stylistSerives],
    language: [Schema.Types.ObjectId],
    country: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    employee_id: Schema.Types.ObjectId,
    stylist_type: Number,
    otp_for: { type: Array, default: undefined },
    mobile_country: String,
    subscribe_for: { type: Array, default: undefined },
    branches: { type: Array, default: [] },
    salon_name: String,
    otp: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    device_id: String,
    device_name: String,
    register_type: Number,
    register_by: Number,
    invite_code: String,
    vendor_inc_id: { "type": Number },
    invite: [vendorInvitCodesSchema],
    customer_inc_id: { "type": Number },
    payment_status: [paymentStatusSchema],
    payment: [paymentCardSchema],
    referral_invite_code: String,
    referral_amount: Number,
    access_token: String,
    last_seen: Date,
    name: Object,
    strip_account_id: String,
    referral_vendor_id: Schema.Types.ObjectId,
    sessions: [sessionsSchema],
}, { versionKey: false });
/*var stylistExperience=new Schema({
      vendor_id: Schema.Types.ObjectId,
    service_id:Schema.Types.ObjectId,
    experience:String,
    from:String,
    to:String,
    experience_as:Number

});*/
var stylistSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    profile_pic: String,
    gender: Number,
    dob: String,
    city_id: Schema.Types.ObjectId,
    country: Schema.Types.ObjectId,
    country_code: String,
    languages_speak: [{ type: Schema.Types.ObjectId }],
    styles: [{ type: Schema.Types.ObjectId }],
    nationality: String,
    intro: Object,
    invite_code: String,
    expertise: [{ type: Schema.Types.ObjectId }],
    total_experience: Object,
    employee_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    agent_status: { "type": Number, "default": 0 },
    manager_status: { "type": Number, "default": 0 },
    iban_status: { "type": Number, "default": 0 },
    booking_status: { "type": Number, "default": 1 },
    available_status: Number,
    active_status: Number,
    opt_for: [],
    subscribe_for: [],
    levels: { "type": [Number], "default": [1] },
    created: {
        type: Date,
        default: Date.now
    },
    type: Number,
    lock: Number,
    updated: {
        type: Date,
        default: Date.now
    },
    is_locked: { "type": Number, "default": 1 }
}, { versionKey: false });
var portfolioSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    file_path: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

var subCitiesSchema = new Schema({ sub_city_name: Object });
var citiesSchema = new Schema({
    country_id: Schema.Types.ObjectId,
    city_name: Object,
    time_zone: String,
    file_path: String,
    sub_city_names: [subCitiesSchema],
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var salonPicturesSchema = new Schema({
    salon_id: Schema.Types.ObjectId,
    file_path: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var stylistExperienceSchema = new Schema({
    service_id: Schema.Types.ObjectId,
    experience: String,
    vendor_id: Schema.Types.ObjectId,
    from: String,
    to: String,
    experience_as: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var surgePriceSchema = new Schema({
    city_id: Schema.Types.ObjectId,
    time: Object,
    expiry_at: Date,
    start: Date,
    surge: Number,
    title: String,
    area: Object,
    area_name: String,

    created_by: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    surge_banner: Number,
}, { versionKey: false });
var salonEmployeesSchema = new Schema({
    salon_id: Schema.Types.ObjectId,
    employee_name: Object,
    employee_first_name: Object,
    employee_last_name: Object,
    employee_email: String,
    nationality: String,
    employee_mobile: String,
    mobile_country: String,
    expertise: [{ type: mongoose.Schema.Types.ObjectId }],
    employee_designation: String,
    gender: Number,
    dob: String,
    serve_out: Number,
    about: String,
    language: [{ type: mongoose.Schema.Types.ObjectId }],
    start_date: String,
    end_date: String,
    contractor: Number,
    styles: [{ type: mongoose.Schema.Types.ObjectId }],
    profile_pic: String,
    working_time: Object,
    booking_status: Number,
    active_status: Number,
    status: Number,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

var salonDocumentsSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    document_reference_id: Schema.Types.ObjectId,
    document_name: String,
    expiry_date: Date,
    is_expiry_date: Number,
    path: String,
    type: Number,
    static_document: Number,
    agent_status: { "type": Number, "default": 0 },
    manager_status: { "type": Number, "default": 0 },
    admin_status: Number,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

var stylistDocumentsSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    document_reference_id: Schema.Types.ObjectId,
    document_name: Object,
    expiry_date: Date,
    is_expiry_date: Number,
    path: String,
    type: Number,
    static_document: Number,
    agent_status: { "type": Number, "default": 0 },
    manager_status: { "type": Number, "default": 0 },
    admin_status: Number,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { strict: false }, { versionKey: false });

var vendorLocationSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    address: String,
    type: Number,
    location: {
        type: { type: String },
        coordinates: [Number]
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
}, { versionKey: false });

var salonSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    country_id: Schema.Types.ObjectId,
    city_id: Schema.Types.ObjectId,
    phone: String,
    mobile_country: String,
    intro: Object,
    alias_name: Object,
    email: String,
    working_hours: Object,
    working_genders: Array,
    wifi_available: Number,
    wifi_cost: Number,
    parking_available: Number,
    parking_cost: Number,
    kids_friendly: Number,
    pets: Number,
    handicap: Number,
    salon_email: String,
    special_instructions: Object,
    salon_mobile: String,
    salon_name: Object,
    street_name: String,
    building_name: String,
    full_address: String,
    location: String,
    longitude: Number,
    latitude: Number,
    floor: String,
    zip_code: String,
    country: String,
    city: String,
    levels: Number,
    status: Number,
    address: String,
    cancellation_policy: {},
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },

    tm_user_id: { "type": Number, "default": 0 },
    is_locked: { "type": Number, "default": 0 },
    agent_status: Number,
    manager_status: Number,
    admin_status: Number,
    booking_status: Number,
    active_status: Number,
    salon_inc_id: Number,
    access_token: String,
    strip_account_id: String,
    payment: [paymentCardSchema],
    payment_status: [paymentStatusSchema],
    last_seen: Date,
    sessions: [sessionsSchema]
}, { versionKey: false });

var cancellationPolicySchema = new Schema({
    city_id: Schema.Types.ObjectId,
    country_id: Schema.Types.ObjectId,
    cancellation_policy: []
}, { versionKey: false });


var salonServicesSchema = new Schema({
    salon_id: Schema.Types.ObjectId,
    service_for: Number,
    service_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    service_time: Number,
    service_cost: Number,
    vendor_id: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    }, updated: {
        type: Date,
        default: Date.now
    },
    status: { 'type': Number, "default": 1 }
}, { versionKey: false });
var salonEmployeeServicesSchems = new Schema({
    employee_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    service_for: Number,
    service_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    status: { 'type': Number, "default": 1 }
}, { versionKey: false });

var addressSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    label: String,
    latitude: String,
    longitude: String,
    landmark: String,
    address: String,
    buliding: String,
    flat_no: String,
    type: Number,
    city: String,
    country: String,
    recent_address: [{}],
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var servicesSchema = new Schema({
    service_name: Object,
    sub_category_id: Schema.Types.ObjectId,
    service_pic: String,
    service_for: String,
    service_type: Number,
    category_id: Schema.Types.ObjectId,
    status: Number,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var requestedServicesSchema = new Schema({
    sub_category_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    category_name: String,
    vendor_id: Schema.Types.ObjectId,
    service_name: String,
    service_for: Number,
    duration: Number,
    description: String,
    currency: String,
    price: Number,
    requested_by: Number,
    status: String,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var stylistServicesSchema = new Schema({
    service_id: Schema.Types.ObjectId,
    vendor_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    service_levels: [{ type: Number }],
    service_for: Number,
    salon_id: Schema.Types.ObjectId,
    employee_id: Schema.Types.ObjectId,
    status: Number,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var cartSchema =
    new Schema({
        customer_id: Schema.Types.ObjectId,
        created: {
            type: Date,
            default: Date.now
        },
        service_id: Schema.Types.ObjectId,
        category_id: Schema.Types.ObjectId,
        sub_category_id: Schema.Types.ObjectId,
        schedule_id: Schema.Types.ObjectId,
        quantity: Number,
        price_currency: String,
        price: Number,
        selected_service_level: Number,
        selected_for: Number,
        vendor_id: Schema.Types.ObjectId,
        employee_id: Schema.Types.ObjectId,
        cart_type: Number,
        address: String,
        city_id: Schema.Types.ObjectId,
        salon_id: Schema.Types.ObjectId,
        package_id: Schema.Types.ObjectId,

        time: String,
        end_time: String,
        date: String,
        type: Number,
        latitude: Number,
        longitude: Number,
        status: Number,
        duration: Number,
        filtered_service: Number,
        unfiltered_service: Number,
        time_type: Number,
        up_to_amount: Number,
        timezone: String,
        cart_for: { "type": Number, default: 1 },
        friend_details: {},
        coupon_amount_type: Number,
        coupon_amount: Number,
        coupon: String,
        coupon_id: Schema.Types.ObjectId,
        coupon_type: Number,
        min_amount: Number,
        is_package: { type: Number, default: 0 },
        selected_date: String,
        selected_time: String,
        coupon_scope: Number,
        package_amount: Number,
        payment_type: { "type": Number, "default": 1 },
        card_id: Schema.Types.ObjectId,
        additional_details: { "type": Object, default: {} }
    }, { versionKey: false });
var countrySchema = new Schema({
    country: Object,
    created: {
        type: Date,
        default: Date.now
    },
    stylist_agreement: Object,
    salon_agreement: Object,
    currency_symbol: String,
    updated: {
        type: Date,
        default: Date.now
    },
    dollar_conversion_rate: Number
}, { versionKey: false });


var categorySchema = new Schema({
    category_name: Object,
    category_pic: String,
    category_for: [],
    service_type: Number,
    created_by: Schema.Types.ObjectId,
    video: Object,
    status: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var bookingsSchema = new Schema
    ({
        vendor_id: Schema.Types.ObjectId,
        address: String,
        cart_id: [{ type: Schema.Types.ObjectId }],
        card: {

            _id: Schema.Types.ObjectId,
            add_coversation_id: { type: String },
            add_email: { type: String },
            add_card_nick_name: { type: String },
            add_card_name: { type: String },
            add_card_number: { type: String },
            add_exp_month: { type: String },
            add_exp_year: { type: String },
            add_last_4digits: { type: String },
            card_token: { type: String },
            card_user_key: { type: String },

        },
        customer_id: Schema.Types.ObjectId,
        salon_id: Schema.Types.ObjectId,
        employee_id: Schema.Types.ObjectId,
        status: Number,
        date: String,
        time_zone: String,
        created: {
            type: Date,
            default: Date.now
        },
        type: Number,
        updated: {
            type: Date,
            default: Date.now
        },
        strip_charge_id: String,
        schedule_id: Schema.Types.ObjectId,
        stylist_type: Number,
        net_amount: Number,
        is_notified: { "type": Number, "default": 1 },
        net_amount_admin: Number,
        customer_country_details:
        {
            country_id: Schema.Types.ObjectId,
            city_id: Schema.Types.ObjectId,
            currency_code: String,
            currency_symbol: String
        },
        price_converted: Number,
        converted_currency: String,
        converted_currency_symbol: String,
        price_converted_admin: Number,
        surge_price_converted: Number,
        surge_price_converted_admin: Number,
        surge: Number,
        time: String,
        latitude: Number,
        end_time: String,
        longitude: Number,
        booking_accepted: Date,
        booking_rejetted: Date,
        booking_started: Date,
        booking_ended: Date,
        traveled_location: [],
        service_time: Number,
        is_customer_rated: { type: Number, default: 0 },
        vendor_payment_status: { type: Number, default: 0 },
        payment_status: { 'type': Number, default: 2 },
        cancell_type: Number,
        cancell_type_value: Number,
        booking_inc_id: { type: Number },
        coupon_amount_type: Number,
        coupon_amount: Number,
        up_to_amount: Number,
        coupon: String,
        admin_percentage: String,

        booking_requested: {
            "type": Date,
            default: Date.now
        },
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        net_amount_dollar: Number,
        is_package: { "type": Number, "default": 0 },
        reject_vendors: { "type": [Schema.Types.ObjectId], "default": [] },
        coupon_details: { "coupon": String, "coupon_amount": Number, coupon_id: Schema.Types.ObjectId, 'coupon_type': Number, 'coupon_scope': Number },
        request_count: { "type": Number, "default": 1 },
        previous_cancell_amount: Number,
        cancellation_pay_status: Number,
        cancellation_amount: Number,
        additional_details: { "type": Object, default: {} },
        booking_percentage: Number,
        payment_type: Number,
        payment_details: Object,
        online_payment_status: {
            type: Boolean,
            default: 0
        },
        cancell_reason: {
            type: String
        },
        totalmarchantamount: { type: Number, default: 0 }
    }, { versionKey: false });
var salonFilteredItems = new Schema({
    customer_id: Schema.Types.ObjectId,
    type: Number,
    date: String,
    timezone: String,
    time: String,
    city_id: Schema.Types.ObjectId,
    timebetween: String,
    services: [],
    latitude: Number,
    longitude: Number,
    time_type: Number
}, { versionKey: false });
var notificationsSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    title: Object,
    message: Object,
    booking_id: Schema.Types.ObjectId,
    stylist_type: Number,
    request_time: Date,
    type: Number,
    order_id: Schema.Types.ObjectId,
    vendor_id: Schema.Types.ObjectId,
    country_id: Schema.Types.ObjectId,
    city_id: Schema.Types.ObjectId,
    created: { type: Date, default: Date.now }
}, { versionKey: false });
var stylistAvailabilitySchema = new Schema
    ({
        vendor_id: Schema.Types.ObjectId,
        status: Number,
        created: {
            type: Date,
            default: Date.now
        },
        updated: {
            type: Date,
            default: Date.now
        },
        available_status: Number,
        latitude: Number,
        longitude: Number
    }, { versionKey: false });
var scheduleBookingSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    time: String,
    cart_id: [{ type: Schema.Types.ObjectId }],
    type: Number,
    slot_type: Number,
    date: String,
    timezone: String,
    status: { "type": Number, "default": 1 },
    timebetween: String,
    created: {
        type: Date,
        default: Date.now
    },
    schedule_inc_id: Number,
    updated:
    {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var ordersSchema = new Schema({
    customer_id: Schema.Types.ObjectId,
    booking_id: [{ type: Schema.Types.ObjectId }],
    type: Number,
    address: String,
    latitude: Number,
    longitude: Number,
    salon_id: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    stylist_type: Number,
    up_to_amount: Number,
    coupon_amount_type: Number,
    coupon_amount: Number,
    coupon: String,
    order_inc_id: { "type": Number },
    serve_out_order_salons_list: [Schema.Types.ObjectId]
}, { versionKey: false });
var documentSchema = new Schema({
    user_id: Object,
    document_data: String,
    is_verified: String,
    status: String,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

var otp = new Schema({
    user_id: Schema.Types.ObjectId,
    otp_type: Number,
    type_id: String,
    data: String,
    otp: String,
    is_verified: Boolean,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var promotionsSchema = new Schema({

    title: Object,
    target_amount: Number,
    valid_from: Date,
    valid_up_to: Date,
    promotion_image: String,
    promotion_type: Object,
    promotion_value: Date,
    city_id: Schema.Types.ObjectId,
    country_id: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    }
});
var ratingSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    vendor_id: Schema.Types.ObjectId,
    salon_id: Schema.Types.ObjectId,
    employee_id: Schema.Types.ObjectId,
    booking_id: Schema.Types.ObjectId,
    customer_id: Schema.Types.ObjectId,
    employee_rating: Number,

    rated_by: Number,
    rating: Number,
    review: String,
    created: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

var referralCodeSchema = new Schema({
    user_id: Object,
    code: String,
    valid_till: Date,
    referral_type: String,
    max_referrals: String,
    created: {
        type: Date,
        default: Date.now
    }
});



var salonFacilitySchema = new Schema({
    salon_id: Object,
    facility_name: String,
    status: String,
    created: {
        type: Date,
        default: Date.now
    }
});


var subCategorySchema = new Schema({
    sub_category_name: Object,
    category_id: Object,
    service_id: Object,
    sub_category_pic: String,
    created_by: Object,
    status: String,
    created: {
        type: Date,
        default: Date.now
    }
});
var userTokenSchema = new Schema({
    token: String,
    user_id: String,
    created: {
        type: Date,
        default: Date.now
    }
});
var documents = new Schema({
    document_name: Object,
    is_expiry_date: Number,
    created: {
        type: Date,
        default: Date.now
    }
}); var currency = new Schema({

}, { strict: false }, { versionKey: false });
var providerStatusSchema = new Schema({
    expire_at: Date,
    created: {
        type: Date,
        default: Date.now
    },
    vendor_id: Schema.Types.ObjectId
}, { versionKey: false });

/*var countrySchema=new Schema({
    country:String,
    country_code:String,
    time_zone:String,
    currency:String
});*/
var salonPackagesSchema = new Schema({
    "package_name": String,
    "salon_id": Schema.Types.ObjectId,
    "services": [
        {
            "service_for": Number, "service_id": Schema.Types.ObjectId,
            "category_id": Schema.Types.ObjectId
        }
    ],
    "package_amount": Number,
    "package_duration": Number,
    "package_for": Number,
    'discount_amount': Number,
    "status": Number,
    "created": {
        type: Date,
        default: Date.now
    },
    "updated": {
        type: Date,
        default: Date.now
    },
    "valid_till": {
        type: Date,
        default: Date.now
    }
});
vendorLocationSchema.index({ "location": "2dsphere" });
surgePriceSchema.index({ "area": "2dsphere" });
bookingsSchema.index({ "location": "2dsphere" });

stylistServicesSchema.index({ service_id: 1, vendor_id: 1, service_for: 1, status: 1 }, { unique: true });
providerStatusSchema.index({ "expire_at": 1 }, { expireAfterSeconds: 0 });



/*mongoose.set('debug', true);*/


/*bookingsSchema.post('insertMany', function(err, res, next) {
    console.log('post.insertMany:error', err.name);
next();
});*/
customersSchema.pre('save', function (next) {
    var doc = this;
    counters.findOneAndUpdate({ 'increment_id': 'customer_inc_id' }, {
        $inc: { seq: 1 }
    }, { new: true }, function (error, counter) {
        if (error)
            return next(error);


        if (counter != null) {
            doc.customer_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'customer_inc_id', "seq": 1 });
            newCounter.save(function (req, response) {
                doc.customer_inc_id = 1;
                next();
            });

        }
    });
});
scheduleBookingSchema.pre('save', function (next) {
    var doc = this;
    counters.findOneAndUpdate({ 'increment_id': 'schedule_inc_id' }, {
        $inc: { seq: 1 }
    }, { new: true }, function (error, counter) {
        if (error)
            return next(error);

        // console.log(counter);
        if (counter != null) {
            doc.schedule_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'schedule_inc_id', "seq": 1 });
            newCounter.save(function (req, response) {
                doc.schedule_inc_id = 1;
                next();
            });

        }

    });
});
vendorSchema.pre('save', function (next) {
    var doc = this;
    counters.findOneAndUpdate({ 'increment_id': 'vendor_inc_id' }, { $inc: { seq: 1 } }, { new: true }, function (error, counter) {
        if (error)
            return next(error);


        if (counter != null) {
            doc.vendor_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'vendor_inc_id', "seq": 1 });

            newCounter.save(function (req, response) {
                doc.vendor_inc_id = 1;
                next();
            });

        }

    });
});
salonSchema.pre('save', function (next) {
    var doc = this;
    counters.findOneAndUpdate({ 'increment_id': 'salon_inc_id' }, { $inc: { seq: 1 } }, { new: true }, function (error, counter) {
        if (error)
            return next(error);


        if (counter != null) {
            doc.vendor_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'salon_inc_id', "seq": 1 });

            newCounter.save(function (req, response) {
                doc.vendor_inc_id = 1;
                next();
            });

        }

    });
});
bookingsSchema.pre('validate', function (next) {
    var doc = this;

    counters.findOneAndUpdate({ 'increment_id': 'booking_inc_id' }, { $inc: { seq: 1 } }, { new: true }, function (error, counter) {


        if (error)
            return next(error);
        if (counter != undefined && counters.length != 0) {

            doc.booking_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'booking_inc_id', "seq": 1 });

            newCounter.save(function (err, response) {

                doc.booking_inc_id = 1;
                next();
            });

        }
    });
});
ordersSchema.pre('validate', function (next) {
    var doc = this;

    counters.findOneAndUpdate({ 'increment_id': 'order_inc_id' }, { $inc: { seq: 1 } }, { new: true }, function (error, counter) {


        if (error)
            return next(error);
        if (counter != undefined && counters.length != 0) {

            doc.order_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'order_inc_id', "seq": 1 });

            newCounter.save(function (err, response) {

                doc.order_inc_id = 1;
                next();
            });

        }
    });
});
var promoCodeSchema = new Schema({
    title: String,
    amount: Number,
    amount_type: Number,
    promo_for: Number,
    promo_code: String,
    first_booking: Number,
    repeat: Number,
    image: String,
    country: Schema.Types.ObjectId,
    min_amount: Number,
    city: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });
var couponsSchema = new Schema
    ({
        title: Object,
        amount: Number,
        amount_type: Number,
        coupon_for: Number,
        coupon_type: Number,
        coupon_code: String,
        first_booking: Number,
        description: Object,
        repeat: { type: Number, default: 0 },
        coupon_image: String,
        expiry_date: Date,
        valid_from: Date,
        country_id: Schema.Types.ObjectId,
        min_amount: Number,
        up_to_amount: Number,
        customer_id: Schema.Types.ObjectId,
        coupon_scope: Number,
        city_id: [Schema.Types.ObjectId],
        customers: [Schema.Types.ObjectId],
        salon_id: Schema.Types.ObjectId,
        status: Number,
        gift_id: Schema.Types.ObjectId,
        coupon_gift_for: Number,
        gifted_by_customer_id: Schema.Types.ObjectId,
        used_customers: Array,
        created: {
            type: Date,
            default: Date.now
        },
        updated: {
            type: Date,
            default: Date.now
        }
    }, { versionKey: false });
var autoGeneratedGiftCardSchema = new Schema({
    code: String,
    customer_id: Schema.Types.ObjectId,
    gifted_by_customer_id: Schema.Types.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }

});
var giftCardsSchema = new Schema({
    "title": Object,
    "description": Object,
    "country_id": Schema.Types.ObjectId,
    "cities": [Schema.Types.ObjectId],
    "price": Number,
    "status": Number,
    "city_data": [Schema.Types.ObjectId],
    "validity": Object,
    "gift_card": [autoGeneratedGiftCardSchema]
});
var activitySchema = new Schema({
    action_id: Schema.Types.ObjectId,
    activity_title: String,
    user_id: Schema.Types.ObjectId,
    created: {
        "type": Date, "default": Date.now
    }
});
var documentsSchema = new Schema({
    document_name: Object,
    is_expiry_date: Number,
    status: Number,
    created: {
        "type": Date, "default": Date.now
    },
    updated: {
        "type": Date, "default": Date.now
    }
});

var vendorbankdetailsSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId
    },
    setConversationId: {
        type: String
    },
    setSubMerchantExternalId: {
        type: String
    },
    setAddress: {
        type: String
    },
    setContactName: {
        type: String
    },
    setContactSurname: {
        type: String
    },
    setEmail: {
        type: String
    },
    setGsmNumber: {
        type: String

    },

    setName: {
        type: String
    },
    ibanname: {
        type: String
    },
    ifsc: {
        type: String
    },
    taxNumber: {
        type: String
    },
    setIban: {
        type: String
    },

    setIdentityNumber: {
        type: String
    }, submarchantkey: {
        type: String
    }, status: {
        type: Boolean,
        default: 0
    },
    error_message: {
        type: String
    }, iban_result: {
        type: Object
    }

});

promoCodeSchema.pre('validate', function (next) {
    var doc = this;
    counters.findOneAndUpdate({ 'increment_id': 'promotion_inc_id' }, { $inc: { seq: 1 } }, { new: true }, function (error, counter) {
        if (error)
            return next(error);
        if (counter != null) {
            doc.booking_inc_id = counter.seq;
            next();

        } else {
            var id = mongoose.Types.ObjectId();
            var newCounter = new counters({ "_id": id, "increment_id": 'promotion_inc_id', "seq": 1 });
            newCounter.save(function (req, response) {
                doc.booking_inc_id = 1;
                next();
            });
        }

    });
});

var vendoronlinepaymentSchema = new Schema({

    locale: String,
    conversationId: String,
    price: Number,
    paidPrice: Number,
    currency: String,
    VendorId: {
        type: Schema.Types.ObjectId
    },
    paymentGroup: String,

    enabledInstallments: Array,
    token: String,
    paymentstatus: String,
    paymentstatus: String,
    paymentId: String,
    card_number: { type: String },
    cardId: Schema.Types.ObjectId,

    buyer: {
        id: { type: String },
        name: { type: String },
        surname: { type: String },
        gsmNumber: { type: String },
        email: { type: String },
        identityNumber: { type: String },
        lastLoginDate: { type: String },
        registrationDate: { type: String },
        registrationAddress: { type: String },
        ip: { type: String },
        city: { type: String },
        country: { type: String },
        zipCode: { type: String }
    },
    shippingAddress: {
        contactName: { type: String },
        city: { type: String },
        country: { type: String },
        address: { type: String },
        zipCode: { type: String }
    },
    billingAddress: {
        contactName: { type: String },
        city: { type: String },
        country: { type: String },
        address: { type: String },
        zipCode: { type: String }
    },
    basketItems: [
        {
            id: { type: String },
            name: { type: String },
            category1: { type: String },
            category2: { type: String },

            price: { type: Number },
            submarchantkey: { type: String },
            marchantamount: { type: Number },
            quantity: { type: Number },
            duration: { type: Number },
            paymentTransactionId: { type: String },
            approve_status: {
                type: Number,
                default: 0
            }

        }

    ],
    error_message: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    payment_result: {
        type: Object

    }

});

var cancelamountSchema = new Schema({
    vendor_id: Schema.Types.ObjectId,
    booking_id: Schema.Types.ObjectId,
    customer_id: Schema.Types.ObjectId,
    net_amount: Number,
    cancellation_pay_status: Number,
    cancellation_amount: Number,
    payment_type: Number,
    booking_inc_id: String,
    bookingId: Schema.Types.ObjectId,
    conversationId: String,
    surge: String,
    totalAmount: Number,
    izycocommision: Number,
    adminAmount: Number,
    vendorAmount: Number,
    status: {
        type: Number
    },
    paid_status: {
        type: Number,
        default: 0             //0-->notpaid 1-->paid
    },

    cancell_reason: {
        type: String
    }, created: {
        type: Date,
        default: Date.now
    }

})










module.exports = {

    customers: mongoose.model('customers', customersSchema, 'customers'),
    styles: mongoose.model('styles', stylesSchema),
    language: mongoose.model('languages', languagesSchema, "languages"),
    vendor: mongoose.model('vendor', vendorSchema, 'vendor'),
    stylist: mongoose.model('stylist', stylistSchema, 'stylist'),
    portfolio: mongoose.model('portfolio', portfolioSchema, "portfolio"),
    salonPictures: mongoose.model('salonPictures', salonPicturesSchema, "salonPictures"),
    stylistExperience: mongoose.model('stylistExperience', stylistExperienceSchema, 'stylistExperience'),
    stylistDocuments: mongoose.model('stylistDocuments', stylistDocumentsSchema, 'stylistDocuments'),
    salonDocuments: mongoose.model('salonDocuments', salonDocumentsSchema, 'salonDocuments'),
    vendorLocation: mongoose.model('vendorLocation', vendorLocationSchema, "vendorLocation"),
    salon: mongoose.model("salon", salonSchema, "salon"),
    salonServices: mongoose.model("salonServices", salonServicesSchema, "salonServices"),
    stylistServices: mongoose.model("stylistServices", stylistServicesSchema, "stylistServices"),
    salonEmployees: mongoose.model("salonEmployees", salonEmployeesSchema, "salonEmployees"),
    salonEmployeeServices: mongoose.model("salonEmployeeServices", salonEmployeeServicesSchems, "salonEmployeeServices"),
    services: mongoose.model("services", servicesSchema, "services"),
    requestedServices: mongoose.model("requestedServices", requestedServicesSchema, "requestedServices"),
    address: mongoose.model("address", addressSchema, "address"),
    cities: mongoose.model("cities", citiesSchema, "cities"),
    country: mongoose.model("country", countrySchema, "country"),
    surgePrice: mongoose.model("surgePrice", surgePriceSchema, "surgePrice"),
    scheduleBooking: mongoose.model("scheduleBooking", scheduleBookingSchema, "scheduleBooking"),
    orders: mongoose.model("orders", ordersSchema, "orders"),
    cart: mongoose.model("cart", cartSchema, "cart"),
    category: mongoose.model("category", categorySchema, 'category'),
    document: mongoose.model("document", documentSchema),
    bookings: mongoose.model("bookings", bookingsSchema, "bookings"),
    stylistAvailability: mongoose.model("stylistAvailability", stylistAvailabilitySchema, "stylistAvailability"),
    otp: mongoose.model('otp', otp, 'otp'),
    fcm: mongoose.model('fcm', fcmSchema, 'fcm'),
    promotions: mongoose.model("promotions", promotionsSchema, 'promotions'),
    rating: mongoose.model("rating", ratingSchema, "rating"),
    referralCode: mongoose.model("referral_code", referralCodeSchema),
    currency: mongoose.model("currency", currency, "currency"),
    salonFilteredItems: mongoose.model("salonFilteredItems", salonFilteredItems, "salonFilteredItems"),
    promoCode: mongoose.model("promoCode", promoCodeSchema, "promoCode"),
    coupons: mongoose.model("coupons", couponsSchema, "coupons"),
    cancellationPolicy: mongoose.model("cancellationPolicy", cancellationPolicySchema, "cancellationPolicy"),
    providerStatus: mongoose.model("providerStatus", providerStatusSchema, "providerStatus"),
    salonPackages: mongoose.model("salonPackages", salonPackagesSchema, "salonPackages"),
    giftCards: mongoose.model("giftCards", giftCardsSchema, "giftCards"),
    guestUsers: mongoose.model("guestUsers", guestUsersSchema, "guestUserSchema"),
    constants: mongoose.model("constants", constantsSchema, "constants"),
    activity: mongoose.model("activity", activitySchema, "activity"),
    notifications: mongoose.model("notifications", notificationsSchema, "notifications"),
    documents: mongoose.model("documents", documentsSchema, "documents"),
    paymentcard: mongoose.model("paymentcard", paymentCardSchema, "paymentcard"),
    onlinepayment: mongoose.model("onlinepayment", onlinepaymentSchema, "onlinepayment"),
    vendorbankdetails: mongoose.model("vendorbankdetails", vendorbankdetailsSchema, "vendorbankdetails"),
    vendoronlinepayment: mongoose.model("vendoronlinepayment", vendoronlinepaymentSchema, "vendoronlinepayment"),
    cancelamount: mongoose.model("cancelamount", cancelamountSchema, "cancelamount")

};
