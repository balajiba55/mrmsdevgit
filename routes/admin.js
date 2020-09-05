var express = require('express');
var router = express.Router();
var async = require('async');
var tables = require('../db_modules/baseTable');
var token = "bXImbXJzYXBpdG9rZW4";
var trim = require('trim');
var utility = require('../utility/utility');
var tmToken=utility.tmToken;
function tokenValidations(req, res, next){

    var startTime=utility.getTime;
    var endTime=utility.getTime;
    var writeData={"start_time":startTime,"end_time":endTime,"request_from":"customer","path":req.originalUrl,"request":req.body};
    utility.writeToFile.writeToFile(writeData);
    if (req.body.token == token)
    {
        return next();
    }else{
        return   res.json({success: false, message: "Invalid  token"});
    }
}
router.get('/t',async function(req,res)
{
    await updateLang();
    console.log("write");
});

async function updateLang()
{
    var lang={
        "admin_panel": {
            "en": "admin panel",
            "ar": "لوحة المشرف"
        },
        "manager_panel": {
            "en": "manager panel",
            "ar": "لوحة المدير"
        },
        "agent_panel": {
            "en": "agent panel",
            "ar": "لوحة الوكيل"
        },
        "members": {
            "en": "members",
            "ar": "أفراد"
        },
        "customers": {
            "en": "customers",
            "ar": "الزبائن"
        },
        "list": {
            "en": "list",
            "ar": "قائمة"
        },
        "stylist": {
            "en": "stylist",
            "ar": "مصفف"
        },
        "stylist_list": {
            "en": "stylist list",
            "ar": "قائمة المصمم"
        },
        "add_stylist": {
            "en": "add stylist",
            "ar": "إضافة المصفف"
        },
        "add_new": {
            "en": "add new",
            "ar": "اضف جديد"
        },
        "booking_history": {
            "en": "booking history",
            "ar": "حجز الحجز"
        },
        "requests": {
            "en": "requests",
            "ar": "طلبات"
        },
        "service_requests": {
            "en": "service requests",
            "ar": "طلبات الخدمة"
        },
        "scheduled_stylist": {
            "en": "scheduled stylist",
            "ar": "مصفف مجدول"
        },
        "scheduled_salon": {
            "en": "scheduled salon",
            "ar": "صالون مجدول"
        },
        "general": {
            "en": "general",
            "ar": "عام"
        },
        "settings": {
            "en": "settings",
            "ar": "الإعدادات"
        },
        "styles_list": {
            "en": "styles list",
            "ar": "قائمة التصاميم"
        },
        "countries_list": {
            "en": "countries list",
            "ar": "قائمة الدول"
        },
        "add_country": {
            "en": "add country",
            "ar": "أضف دولة"
        },
        "cities_list": {
            "en": "cities list",
            "ar": "قائمة المدن"
        },
        "add_city": {
            "en": "add city",
            "ar": "أضف مدينة"
        },
        "surge_list": {
            "en": "surge list",
            "ar": "قائمة أوقات الطفرة"
        },
        "languages": {
            "en": "languages",
            "ar": "اللغات"
        },
        "cancellation_policy": {
            "en": "cancellation policy",
            "ar": "سياسة الإلغاء"
        },
        "categories": {
            "en": "categories",
            "ar": "الاقسام"
        },
        "category_list_stylist": {
            "en": "category list stylist",
            "ar": "قائمة الأقسام للمصفف"
        },
        "category_list_salon": {
            "en": "category list salon",
            "ar": "قائمة الأقسام للمصفف"
        },
        "add_category_stylist": {
            "en": "add category stylist",
            "ar": "إضافة قسم للمصفف"
        },
        "add_category_salon": {
            "en": "add category salon",
            "ar": "إضافة قسم للصالون"
        },
        "add_sub_category_stylist": {
            "en": "add sub category stylist",
            "ar": "إضافة قسم فرعي للمصفف"
        },
        "add_sub_category_salon": {
            "en": "add sub category salon",
            "ar": "إضافة قسم فرعي للصالون"
        },
        "services": {
            "en": "services",
            "ar": "خدمات"
        },
        "add_service_stylist": {
            "en": "add service stylist",
            "ar": "إضافة خدمةللمصفف "
        },
        "add_service_salon": {
            "en": "add service salon",
            "ar": "إضافة خدمة للصالون "
        },
        "add_service_price": {
            "en": "add service price",
            "ar": "إضافة سعر الخدمة"
        },
        "service_list_stylist": {
            "en": "service list stylist",
            "ar": " قائمة الخدماتللمصفف "
        },
        "service_list_salon": {
            "en": "service list salon",
            "ar": "قائمة الخدمات للصالون"
        },
        "service_pricing_list": {
            "en": "service pricing list",
            "ar": "قائمة أسعار الخدمات"
        },
        "documents": {
            "en": "documents",
            "ar": "مستندات"
        },
        "promotions": {
            "en": "promotions",
            "ar": "الترويجات"
        },
        "gift_cards": {
            "en": "gift cards",
            "ar": "بطاقات الهدايا"
        },
        "coupon_codes": {
            "en": "coupon codes",
            "ar": "رموز الكوبون"
        },
        "salon": {
            "en": "salon",
            "ar": "صالون"
        },
        "bookings": {
            "en": "bookings",
            "ar": "الحجوزات"
        },
        "users_listing": {
            "en": "users listing",
            "ar": "قائمة المستخدمين"
        },
        "01_customers_info": {
            "en": "01 customers info",
            "ar": "معلومات الزبائن 01"
        },
        "02_incomplete_customers": {
            "en": "02 incomplete customers",
            "ar": "02 زبائن غير مكتملين"
        },
        "id": {
            "en": "id",
            "ar": "هوية شخصية"
        },
        "full_name": {
            "en": "full name",
            "ar": "الاسم الكامل"
        },
        "nationality": {
            "en": "nationality",
            "ar": "الجنسيةا"
        },
        "completed": {
            "en": "completed",
            "ar": "مكتمل"
        },
        "cancelled": {
            "en": "cancelled",
            "ar": "ملغي"
        },
        "wallet": {
            "en": "wallet",
            "ar": "المحفظة "
        },
        "gift_bal": {
            "en": "gift bal",
            "ar": "رصيد الهدية"
        },
        "installed_on": {
            "en": "installed on",
            "ar": "مثبت على"
        },
        "status": {
            "en": "status",
            "ar": "الحالة"
        },
        "order_value": {
            "en": "order value",
            "ar": "قيمة الطلب"
        },
        "assign": {
            "en": "assign",
            "ar": "تعيين"
        },
        "mobile": {
            "en": "mobile",
            "ar": "الهاتف المتحرك"
        },
        "first": {
            "en": "first",
            "ar": "أول"
        },
        "last": {
            "en": "last",
            "ar": "الاخير"
        },
        "manager_list": {
            "en": "manager list",
            "ar": "قائمة المدير"
        },
        "add_manager": {
            "en": "add manager",
            "ar": "اضف مدير"
        },
        "s_no": {
            "en": "s.no",
            "ar": "ر"
        },
        "name": {
            "en": "name",
            "ar": "الاسم"
        },
        "mobile_number": {
            "en": "mobile number",
            "ar": "رقم الهاتف المتحرك"
        },
        "country": {
            "en": "country",
            "ar": "الدولة"
        },
        "city": {
            "en": "city",
            "ar": "المدينة"
        },
        "email": {
            "en": "email",
            "ar": "البريد الإلكتروني"
        },
        "agent_list": {
            "en": "agent list",
            "ar": "قائمة الوكلاء"
        },
        "admin_list": {
            "en": "admin list",
            "ar": "قائمة المشرف"
        },
        "add_agent": {
            "en": "add agent",
            "ar": "إضافة وكيل"
        },
        "action": {
            "en": "action",
            "ar": "عمل"
        },
        "filters": {
            "en": "filters",
            "ar": "تصفيات"
        },
        "csv": {
            "en": "csv",
            "ar": "CSV"
        },
        "pdf": {
            "en": "pdf",
            "ar": "pdf"
        },
        "print": {
            "en": "print",
            "ar": "طباعة"
        },
        "01_stylist_info": {
            "en": "01 stylist info",
            "ar": "01 معلومات مصفف"
        },
        "02_new_app_request": {
            "en": "02 new app request",
            "ar": "02 طلب تطبيق جديد"
        },
        "03_pending_request": {
            "en": "03 pending request",
            "ar": "03 في انتظار الطلب"
        },
        "04_rejected_request": {
            "en": "04 rejected request",
            "ar": "04 رفض الطلب"
        },
        "05_incomplete": {
            "en": "05 incomplete",
            "ar": "05 غير مكتمل"
        },
        "+_add_new_stylist": {
            "en": "+ add new stylist",
            "ar": "+ إضافة مصفف شعر جديد"
        },
        "rating": {
            "en": "rating",
            "ar": "تقييم"
        },
        "location": {
            "en": "location",
            "ar": "الموقع"
        },
        "request": {
            "en": "request",
            "ar": "طلب"
        },
        "total_earn": {
            "en": "total earn",
            "ar": "الكسب الكلي"
        },
        "to_admin": {
            "en": "to admin",
            "ar": "للمشرف"
        },
        "from_admin": {
            "en": "from admin",
            "ar": "من المشرف"
        },
        "last_transaction_date": {
            "en": "last transaction date",
            "ar": "تاريخ المعاملة الأخيرة"
        },
        "document": {
            "en": "document",
            "ar": "مستند"
        },
        "account_status": {
            "en": "account status",
            "ar": "حالة الحساب"
        },
        "history": {
            "en": "history",
            "ar": "التاريخ"
        },
        "statement": {
            "en": "statement",
            "ar": "بيان"
        },
        "view": {
            "en": "view",
            "ar": "عرض"
        },
        "edit": {
            "en": "edit",
            "ar": "تعديل"
        },
        "delete": {
            "en": "delete",
            "ar": "حذف"
        },
        "requested_services": {
            "en": "requested services",
            "ar": "الخدمات المطلوبة"
        },
        "certified": {
            "en": "certified",
            "ar": "معتمد"
        },
        "referral_code": {
            "en": "referral code",
            "ar": "رمز الترشيح"
        },
        "registration_date": {
            "en": "registration date",
            "ar": "تاريخ التسجيل"
        },
        "agent": {
            "en": "agent",
            "ar": "وكيل"
        },
        "manager": {
            "en": "manager",
            "ar": "مدير"
        },
        "01_basic_info": {
            "en": "01 basic info",
            "ar": "01 المعلومات الأساسية"
        },
        "02_about": {
            "en": "02 about",
            "ar": "02 حول"
        },
        "03_service": {
            "en": "03 service",
            "ar": "03 خدمة"
        },
        "04_portfolio": {
            "en": "04 portfolio",
            "ar": "04 صور"
        },
        "05_work_experience": {
            "en": "05 work experience",
            "ar": "05 خبرة العمل"
        },
        "06_documents": {
            "en": "06 documents",
            "ar": "06 وثائق"
        },
        "07_payment": {
            "en": "07 payment",
            "ar": "07 الدفع"
        },
        "card_holders_name": {
            "en": "card holder's name",
            "ar": "اسم حامل البطاقة"
        },
        "card_name": {
            "en": "card name",
            "ar": "اسم البطاقة"
        },
        "choose_card_type": {
            "en": "choose card type",
            "ar": "اختر نوع البطاقة"
        },
        "--select_card_type--": {
            "en": "-- select card type --",
            "ar": "- اختر نوع البطاقة -"
        },
        "expiration_date": {
            "en": "expiration date",
            "ar": "تاريخ انتهاء الصلاحية"
        },
        "cvv": {
            "en": "cvv",
            "ar": "CVV"
        },
        "submit": {
            "en": "submit",
            "ar": "إرسال"
        },
        "first_name": {
            "en": "first name",
            "ar": "الاسم الاول"
        },
        "last_name": {
            "en": "last name",
            "ar": "الاسم الاخير"
        },
        "email_address": {
            "en": "email address",
            "ar": "عنوان بريد الكتروني"
        },
        "enter_your_mobile_number": {
            "en": "enter your mobile number",
            "ar": "أدخل رقم هاتفك المتحرك"
        },
        "gender": {
            "en": "gender",
            "ar": "الجنس"
        },
        "male": {
            "en": "male",
            "ar": "الذكر"
        },
        "female": {
            "en": "female",
            "ar": "انثى"
        },
        "date_of_birth": {
            "en": "date of birth",
            "ar": "تاريخ الولادة"
        },
        "--select_nationality--": {
            "en": "-- select nationality --",
            "ar": "- اختر الجنسية -"
        },
        "--select_booking_type--": {
            "en": "-- select booking type --",
            "ar": "- اختر نوع الحجز -"
        },
        "--select_country--": {
            "en": "-- select country --",
            "ar": "-- حدد الدولة --"
        },
        "--select_city--": {
            "en": "-- select city --",
            "ar": "-- اختر مدينة --"
        },
        "language_speak": {
            "en": "language speak",
            "ar": " اللغات المتحدثة"
        },
        "invite_code": {
            "en": "invite code",
            "ar": "رقم الدعوة"
        },
        "login_password": {
            "en": "login password",
            "ar": "كلمة السر للدخول"
        },
        "opt_for": {
            "en": "opt for",
            "ar": "اختيار ل"
        },
        "sms": {
            "en": "sms",
            "ar": "رسالة قصيرة"
        },
        "notification": {
            "en": "notification",
            "ar": "إشعار"
        },
        "subscribe_for": {
            "en": "subscribe for",
            "ar": "الاشتراك في"
        },
        "news_letters": {
            "en": "news letters",
            "ar": "النشرات الإخبارية"
        },
        "offers&promotions": {
            "en": "offers & promotions",
            "ar": "العروض والترويجي"
        },
        "updates": {
            "en": "updates",
            "ar": "التحديثات"
        },
        "save&next": {
            "en": "save & next",
            "ar": "حفظ. التالي"
        },
        "intro": {
            "en": "intro",
            "ar": "مقدمة"
        },
        "stylist_levels": {
            "en": "stylist levels",
            "ar": "مستويات المصفف"
        },
        "levels": {
            "en": "levels",
            "ar": "levels"
        },
        "economy": {
            "en": "economy",
            "ar": "اقتصادي"
        },
        "premium": {
            "en": "premium",
            "ar": "متميز"
        },
        "vip": {
            "en": "vip",
            "ar": "VIP"
        },
        "expertise_(max_5)": {
            "en": "expertise (max 5)",
            "ar": "الخبرات (الحد الأقصى 5)"
        },
        "expertise": {
            "en": "expertise",
            "ar": "الخبرات"
        },
        "styles": {
            "en": "styles",
            "ar": "التصاميم"
        },
        "for_whom": {
            "en": "for whom",
            "ar": "لمن"
        },
        "--for_whom--": {
            "en": "-- for whom --",
            "ar": "-- لمن --"
        },
        "women": {
            "en": "women",
            "ar": "نساء"
        },
        "girl": {
            "en": "girl",
            "ar": "طفلة"
        },
        "men": {
            "en": "men",
            "ar": "رجال"
        },
        "boy": {
            "en": "boy",
            "ar": "طفل"
        },
        "select_category": {
            "en": "select category",
            "ar": "اختر القسم"
        },
        "--service_category--": {
            "en": "-- service category --",
            "ar": "-- قسم الخدمة --"
        },
        "service_name": {
            "en": "service name",
            "ar": "اسم الخدمة"
        },
        "--service_name--": {
            "en": "-- service name --",
            "ar": "-- اسم الخدمة --"
        },
        "level": {
            "en": "level",
            "ar": "المستوى"
        },
        "--level_name--": {
            "en": "level name",
            "ar": "اسم المستوى"
        },
        "service_category": {
            "en": "service category",
            "ar": "قسم الخدمة"
        },
        "select_files": {
            "en": "select files",
            "ar": "اختر الملفات"
        },
        "select_only_jpg,png,jpeg": {
            "en": "select only jpg, png, jpeg",
            "ar": "حدد jpg, png, jpeg فقط"
        },
        "service": {
            "en": "service",
            "ar": "الخدمة"
        },
        "--service--": {
            "en": "-- service --",
            "ar": "-- الخدمة --"
        },
        "from": {
            "en": "from",
            "ar": "من "
        },
        "to": {
            "en": "to",
            "ar": "إلى"
        },
        "experience": {
            "en": "experience",
            "ar": "الخبرة"
        },
        "freelancer": {
            "en": "freelancer",
            "ar": "مصفف مستقل"
        },
        "salon_professional": {
            "en": "salon professional",
            "ar": "صالون محترف"
        },
        "salon_name": {
            "en": "salon name",
            "ar": "اسم صالون"
        },
        "as": {
            "en": "as",
            "ar": "مثل"
        },
        "personal_documents": {
            "en": "personal documents",
            "ar": "مستندات شخصية"
        },
        "upload_file": {
            "en": "upload file",
            "ar": "تحميل ملف"
        },
        "resume": {
            "en": "resume",
            "ar": "سيرة ذاتية"
        },
        "certificates": {
            "en": "certificates",
            "ar": "شهادات"
        },
        "select_only_docx_doc_pdf_jpeg_jpg_png": {
            "en": "select only docx, doc, pdf_jpeg,jpg,png",
            "ar": "اخترdocx، doc، pdf فقط "
        },
        "payment_mode": {
            "en": "payment mode",
            "ar": "طريقة الدفع"
        },
        "personal": {
            "en": "personal",
            "ar": "شخصي"
        },
        "save": {
            "en": "save",
            "ar": "حفظ"
        },
        "01_salon_info": {
            "en": "01 salon info",
            "ar": "01 معلومات صالون"
        },
        "+_add_new_salon": {
            "en": "+ add new salon",
            "ar": "+ إضافة صالون جديد"
        },
        "contact_admin": {
            "en": "contact admin",
            "ar": "اتصل بالمشرف"
        },
        "alias_name": {
            "en": "alias name",
            "ar": "الاسم المستعار"
        },
        "vendor_name": {
            "en": "vendor name",
            "ar": "اسم البائع"
        },
        "total_services": {
            "en": "total services",
            "ar": "مجموع الخدمات"
        },
        "account": {
            "en": "account",
            "ar": "الحساب"
        },
        "recvd:": {
            "en": "recvd:",
            "ar": "تم الاستلام:"
        },
        "accepted:": {
            "en": "accepted:",
            "ar": "تمت الموافقة:"
        },
        "rejected:": {
            "en": "rejected:",
            "ar": "تم الرفض:"
        },
        "timeout:": {
            "en": "timeout:",
            "ar": "نفذ الوقت:"
        },
        "requesting:": {
            "en": "requesting:",
            "ar": "جاري الطلب:"
        },
        "total:": {
            "en": "total:",
            "ar": "المجموع:"
        },
        "compl:": {
            "en": "compl:",
            "ar": "مكتمل:"
        },
        "total_cancelled:": {
            "en": "total cancelled:",
            "ar": "مجموع الملغي:"
        },
        "cancel_by_user:": {
            "en": "cancelByUser",
            "ar": "تم الإلغاء بواسطة المستخدم"
        },
        "cancel_by_stylist:": {
            "en": "cancelByStylist:",
            "ar": "إلغاء بواسطة المصفف"
        },
        "active": {
            "en": "active",
            "ar": "نشط"
        },
        "block": {
            "en": "block",
            "ar": "حظر"
        },
        "removed": {
            "en": "removed",
            "ar": "تمت الإزالة"
        },
        "approved": {
            "en": "approved",
            "ar": "تمت الموافقة"
        },
        "rejected": {
            "en": "rejected",
            "ar": "تم الرفض"
        },
        "remarks": {
            "en": "remarks",
            "ar": "ملاحظات"
        },
        "pending": {
            "en": "pending",
            "ar": "قيد الانتظار"
        },
        "view_details": {
            "en": "view details",
            "ar": "عرض التفاصيل"
        },
        "add_salon": {
            "en": "add salon",
            "ar": "اضف صالون"
        },
        "02_locations": {
            "en": "02 locations",
            "ar": "02 مواقع"
        },
        "03_services": {
            "en": "03 services",
            "ar": "03 خدمات"
        },
        "04_salon_pics": {
            "en": "04 salon pics",
            "ar": "04 صور الصالون"
        },
        "05_portfolio": {
            "en": "05 portfolio",
            "ar": "05 الصور"
        },
        "06_staff": {
            "en": "06 staff",
            "ar": "06 العمال"
        },
        "07_working_hours": {
            "en": "07 working hours",
            "ar": "07 ساعات العمل"
        },
        "08_cancellation_policy": {
            "en": "08 cancellation policy",
            "ar": "08 سياسة الإلغاء"
        },
        "return_to_salon_list": {
            "en": "return to salon list",
            "ar": "العودة إلى قائمة الصالون"
        },
        "enter_login_password": {
            "en": "enter login password",
            "ar": "أدخل كلمة مرور تسجيل الدخول"
        },
        "select_gender": {
            "en": "select gender",
            "ar": "حدد الجنس"
        },
        "select_country": {
            "en": "select country",
            "ar": "حدد الدولة"
        },
        "display_name": {
            "en": "display name",
            "ar": "اسم العرض"
        },
        "next": {
            "en": "next",
            "ar": "التالى"
        },
        "delete_confirmation": {
            "en": "delete confirmation",
            "ar": "تأكيد الحذف"
        },
        "are_you_sure_you_want_to_delete?": {
            "en": "are you sure you want to delete ?",
            "ar": "هل أنت متأكد أنك تريد الحذف ؟"
        },
        "yes": {
            "en": "yes",
            "ar": "نعم"
        },
        "no": {
            "en": "no",
            "ar": "لا"
        },
        "add_salon_branch_details": {
            "en": "add salon branch details",
            "ar": "إضافة تفاصيل فرع الصالون"
        },
        "add_branch_location": {
            "en": "add branch location",
            "ar": "إضافة موقع الفرع"
        },
        "add_branch_timings": {
            "en": "add branch timings",
            "ar": "إضافة توقيت الفرع"
        },
        "add_branch_documents": {
            "en": "add branch documents",
            "ar": "إضافة مستندات الفرع"
        },
        "branch_name": {
            "en": "branch name",
            "ar": "اسم الفرع"
        },
        "internet": {
            "en": "internet",
            "ar": "الإنترنت"
        },
        "is_there_wifi_available_for_guests?": {
            "en": "is there wiFi available for guests?",
            "ar": "هل هناك wiFi متاح للضيوف؟"
        },
        "free": {
            "en": "free",
            "ar": "مجاني"
        },
        "paid": {
            "en": "paid",
            "ar": "مدفوع"
        },
        "parking": {
            "en": "parking",
            "ar": "موقف سيارات"
        },
        "is_parking_available_to_guests?": {
            "en": "is parking available to guests?",
            "ar": "هو موقف السارات متاح للضيوف؟"
        },
        "kids_friendly": {
            "en": "kids friendly",
            "ar": "ملائم للاطفال"
        },
        "handicap_access": {
            "en": "handicap access",
            "ar": "أصحاب الهمم"
        },
        "do_you_allow_pets?": {
            "en": "do you allow pets?",
            "ar": "الحيوانات الأليفة"
        },
        "drag_&_drop_the_map_marker_as_needed": {
            "en": "drag & drop the map marker as needed",
            "ar": "حرّكالعلامة وقم بإسقاطها حسب الحاجة"
        },
        "street_name": {
            "en": "street name",
            "ar": "اسم الشارع"
        },
        "building_name": {
            "en": "building name",
            "ar": "اسم المبنى"
        },
        "unit_number/floor": {
            "en": "unit number/floor",
            "ar": "رقم الوحدة / الطابق"
        },
        "city_name": {
            "en": "city name",
            "ar": "اسم المدينة"
        },
        "select_city": {
            "en": "select city",
            "ar": "اختر مدينة"
        },
        "P.O.Box/Zip_code": {
            "en": "P.O.Box/Zip code",
            "ar": "ص ب: / الرمز البريدي"
        },
        "special_instructions": {
            "en": "special instructions",
            "ar": "تعليمات خاصة"
        },
        "day": {
            "en": "day",
            "ar": "يوم"
        },
        "from_time": {
            "en": "from time",
            "ar": "من (الوقت)"
        },
        "to_time": {
            "en": "to time",
            "ar": "الى (الوقت)"
        },
        "monday": {
            "en": "monday",
            "ar": "الإثنين"
        },
        "tuesday": {
            "en": "tuesday",
            "ar": "الثلاثاء"
        },
        "wednesday": {
            "en": "wednesday",
            "ar": "الأربعاء"
        },
        "thursday": {
            "en": "thursday",
            "ar": "الخميس"
        },
        "friday": {
            "en": "friday",
            "ar": "الجمعة"
        },
        "saturday": {
            "en": "saturday",
            "ar": "السبت"
        },
        "sunday": {
            "en": "sunday",
            "ar": "الأحد"
        },
        "cancel": {
            "en": "cancel",
            "ar": "إلغاء"
        },
        "enter_branch_name": {
            "en": "enter branch name",
            "ar": "أدخل اسم الفرع"
        },
        "enter_alias_name": {
            "en": "enter alias name",
            "ar": "أدخل الاسم المستعار"
        },
        "enter_mobile_number": {
            "en": "enter mobile number",
            "ar": "أدخل رقم الجوال"
        },
        "enter_email_id": {
            "en": "enter email id",
            "ar": "أدخل البريد الإلكتروني"
        },
        "enter_introduction": {
            "en": "enter introduction",
            "ar": "ادخل المقدمة"
        },
        "search_location": {
            "en": "search location",
            "ar": "موقع البحث"
        },
        "enter_street_name": {
            "en": "enter street name",
            "ar": "أدخل اسم الشارع"
        },
        "enter_building_name": {
            "en": "enter building name",
            "ar": "ادخل اسم المبنى"
        },
        "enter_unit_number/floor": {
            "en": "enter unit number/floor",
            "ar": "أدخل رقم الوحدة / الطابق"
        },
        "enter_zipcode": {
            "en": "enter zipcode",
            "ar": "أدخل الرمز البريدي"
        },
        "enter_special_instructions": {
            "en": "enter special instructions",
            "ar": "أدخل تعليمات خاصة"
        },
        "select_for_whom": {
            "en": "select for whom",
            "ar": "اختر لمن"
        },
        "category": {
            "en": "category",
            "ar": "القسم"
        },
        "select_service": {
            "en": "select service",
            "ar": "اختر الخدمة"
        },
        "duration": {
            "en": "duration",
            "ar": "الفترة"
        },
        "(minutes)": {
            "en": "(minutes)",
            "ar": "(الدقائق)"
        },
        "price": {
            "en": "price",
            "ar": "السعر"
        },
        "enter_price": {
            "en": "enter price",
            "ar": "أدخل السعر"
        },
        "no_services": {
            "en": "no services",
            "ar": "لا توجد خدمات"
        },
        "designation": {
            "en": "designation",
            "ar": "المنصب"
        },
        "dob": {
            "en": "dob",
            "ar": "تاريخ الولادة"
        },
        "start_date": {
            "en": "start date",
            "ar": "تاريخ البدء"
        },
        "end_date": {
            "en": "end date",
            "ar": "تاريخ الانتهاء"
        },
        "add_staff": {
            "en": "add staff",
            "ar": "إضافة عمال"
        },
        "02_staff_services": {
            "en": "02 staff services",
            "ar": "02 خدمات العمال"
        },
        "select_language": {
            "en": "select language",
            "ar": "اختر اللغة"
        },
        "employment_start_date": {
            "en": "employment start date",
            "ar": "تاريخ بدء التوظيف"
        },
        "select_expertise": {
            "en": "select expertise",
            "ar": "اختيار الخبرات"
        },
        "contract": {
            "en": "contract",
            "ar": "عقد"
        },
        "employment_end_date": {
            "en": "employment end date",
            "ar": "تاريخ انتهاء التوظيف"
        },
        "about": {
            "en": "about",
            "ar": "حول"
        },
        "Please_select_work_location": {
            "en": "Please select work location",
            "ar": "يرجى تحديد موقع العمل"
        },
        "others": {
            "en": "others",
            "ar": "أخرى"
        },
        "passport": {
            "en": "passport",
            "ar": "جواز سفر"
        },
        "enter_passport_number": {
            "en": "enter passport number",
            "ar": "أدخل رقم جواز السفر"
        },
        "enter_expiry_date": {
            "en": "enter expiry date",
            "ar": "أدخل تاريخ انتهاء الصلاحية"
        },
        "change_staff": {
            "en": "change staff",
            "ar": "تغيير العامل"
        },
        "closed": {
            "en": "closed",
            "ar": "مغلق"
        },
        "flat": {
            "en": "flat",
            "ar": "فقط"
        },
        "%": {
            "en": "%",
            "ar": "٪"
        },
        "enter_value": {
            "en": "enter value",
            "ar": "أدخل القيمة"
        },
        "days": {
            "en": "days",
            "ar": "أيام"
        },
        "hours": {
            "en": "hours",
            "ar": "ساعات"
        },
        "minutes": {
            "en": "minutes",
            "ar": "دقائق"
        },
        "finish": {
            "en": "finish",
            "ar": "إنتهاء"
        },
        "invoice_ID": {
            "en": "invoice ID",
            "ar": "رقم الفاتورة"
        },
        "order_ID": {
            "en": "order ID",
            "ar": "رقم الطلب"
        },
        "provider_name": {
            "en": "provider name",
            "ar": "اسم المزود"
        },
        "provider_type": {
            "en": "provider type",
            "ar": "نوع مزود"
        },
        "surge": {
            "en": "surge",
            "ar": "ارتفاع الاسعار"
        },
        "coupon_/_gift_voucher": {
            "en": "coupon / gift voucher",
            "ar": "كوبون / بطاقةالهدية"
        },
        "net_amount": {
            "en": "net amount",
            "ar": "المبلغ الكلي"
        },
        "customer": {
            "en": "customer",
            "ar": "زبون"
        },
        "date": {
            "en": "date",
            "ar": "تاريخ"
        },
        "Request Stylist": {
            "en": "request stylist",
            "ar": "طلب المصفف"
        },
        "Booking confirmed": {
            "en": "booking confirmed",
            "ar": "تأكيد الحجز"
        },
        "Request timeout": {
            "en": "request timeout",
            "ar": "انتهاء فترة الطلب"
        },
        "Booking cancelled by customer": {
            "en": "booking cancelled by customer",
            "ar": "تم الغاء الحجز من قبل العميل"
        },
        "Booking cancelled by stylist": {
            "en": "booking cancelled by stylist",
            "ar": "تم الغاء الحجز من قبل المصفف"
        },
        "Request rejected": {
            "en": "request rejected",
            "ar": "تم رفض الطلب"
        },
        "Booking started": {
            "en": "booking started",
            "ar": "تم بدء الحجز"
        },
        "Booking completed": {
            "en": "booking completed",
            "ar": "تم اكتمال الحجز"
        },
        "Customer reached the salon": {
            "en": "customer reached the salon",
            "ar": "وصل الزبون إلى الصالون"
        },
        "booking_details": {
            "en": "booking details",
            "ar": "تفاصيل الحجز"
        },
        "service_provider_details:": {
            "en": "service provider details:",
            "ar": "تفاصيل مقدم الخدمة:"
        },
        "service_location:": {
            "en": "service location:",
            "ar": "موقع الخدمة:"
        },
        "service_timings:": {
            "en": "service timings:",
            "ar": "أوقات الخدمة:"
        },
        "summary:": {
            "en": "summary:",
            "ar": "الملخص"
        },
        "earnings": {
            "en": "earnings",
            "ar": "أرباح"
        },
        "provider_earnings": {
            "en": "provider earnings",
            "ar": "أرباح المزود"
        },
        "admin_earnings": {
            "en": "admin earnings",
            "ar": "أرباح المشرف"
        },
        "customer_rating": {
            "en": "customer rating",
            "ar": "تقييم الزبون"
        },
        "provider_rating": {
            "en": "provider rating",
            "ar": "تقييم المزود"
        },
        "quantity": {
            "en": "quantity",
            "ar": "الكمية"
        },
        "cost": {
            "en": "cost",
            "ar": "التكلفة"
        },
        "sub_total": {
            "en": "sub total",
            "ar": "المجموع الكلي"
        },
        "promo_code": {
            "en": "promo code",
            "ar": "رمز ترويجي"
        },
        "gift_voucher": {
            "en": "gift voucher",
            "ar": "كوبون الهدية"
        },
        "tax": {
            "en": "tax",
            "ar": "الضريبة"
        },
        "customer_details:": {
            "en": "customer details:",
            "ar": "تفاصيل الزبون:"
        },
        "-Verified": {
            "en": "-Verified",
            "ar": "مؤكد"
        },
        "route_map:": {
            "en": "route map:",
            "ar": "خريطة الطريق:"
        },
        "+_add_styles": {
            "en": "+ add styles",
            "ar": "+ إضافة التصاميم"
        },
        "add_style": {
            "en": "add style",
            "ar": "أضف تصميم"
        },
        "enter_style_name": {
            "en": "enter style name",
            "ar": "أدخل اسم التصميم"
        },
        "deactivate_style": {
            "en": "deactivate style",
            "ar": "إلغاء تنشيط التصميم"
        },
        "do_you_want_to_deactivate": {
            "en": "do you want to deactivate",
            "ar": "هل تريد إلغاءالتنشيط"
        },
        "style?": {
            "en": "style?",
            "ar": "تصميم؟؟"
        },
        "activate_style": {
            "en": "activate style",
            "ar": "تفعيل التصميم"
        },
        "do_you_want_to_activate": {
            "en": "do you want to activate",
            "ar": "هل تريد التنشيط"
        },
        "style": {
            "en": "style",
            "ar": "تصميم"
        },
        "on": {
            "en": "on",
            "ar": "on"
        },
        "off": {
            "en": "off",
            "ar": "off"
        },
        "service_category_list_salon": {
            "en": "service category list salon",
            "ar": "قائمة أقسام الخدمات صالون"
        },
        "service_category_list_stylist": {
            "en": "service category list stylist",
            "ar": "قائمة أقسام الخدمات مصفف"
        },
        "Add_a_category": {
            "en": "Add a category",
            "ar": "أضف قسم"
        },
        "sort_category": {
            "en": "sort category",
            "ar": "تصنيف القسم"
        },
        "delete_category": {
            "en": "delete category",
            "ar": "حذف القسم"
        },
        "Do_you_really_want_to_delete": {
            "en": "Do you really want to delete",
            "ar": "هل تريد حقا أن تحذف"
        },
        "?": {
            "en": "?",
            "ar": "؟"
        },
        "service_icon": {
            "en": "service icon",
            "ar": "رمز الخدمة"
        },
        "service_video_for_Girl": {
            "en": "service video for girl",
            "ar": " خدمة فيديو لطفلة"
        },
        "service_video_for_Women": {
            "en": "service video for women",
            "ar": "فيديو خدمة للنساء"
        },
        "service_video_for_Men": {
            "en": "service video for men",
            "ar": "فيديو خدمة للرجال"
        },
        "service_video_for_Boy": {
            "en": "service video for boy",
            "ar": "خدمة الفيديو لطفل"
        },
        "add_admin": {
            "en": "add admin",
            "ar": "إضافة المشرف"
        },
        "service_category_salon": {
            "en": "service category salon",
            "ar": "قسم الخدمة صالون "
        },
        "service_category_stylist": {
            "en": "service category stylist",
            "ar": "قسم الخدمةمصفف "
        },
        "add_service_category_salon": {
            "en": "add service category salon",
            "ar": "إضافة قسم الخدمةصالون "
        },
        "add_service_category_stylist": {
            "en": "add service category stylist",
            "ar": "إضافة قسم الخدمةمصفف "
        },
        "category_icon": {
            "en": "category icon",
            "ar": "رمز القسم"
        },
        "upload_image": {
            "en": "upload image",
            "ar": "تحميل صورة"
        },
        "max_image_size_:": {
            "en": "max image size :",
            "ar": "أقصى حجم للصورة:"
        },
        "select_service_type": {
            "en": "select service type",
            "ar": "اختر نوع الخدمة"
        },
        "upload_video": {
            "en": "upload video",
            "ar": "تحميل فيديو"
        },
        "max_video_size_:": {
            "en": "max video size :",
            "ar": "أقصى حجم الفيديو:"
        },
        "3_mb": {
            "en": "3mb",
            "ar": "3 ميغابايت"
        },
        "64x64": {
            "en": "64x64",
            "ar": "64 × 64"
        },
        "sub_category_salon": {
            "en": "sub category salon",
            "ar": "قسم فرعيصالون "
        },
        "sub_category_stylist": {
            "en": "sub category stylist",
            "ar": "قسم فرعي مصفف"
        },
        "+_add_sub_category_salon": {
            "en": "+ add sub category salon",
            "ar": "+ إضافة قسم فرعي صالون"
        },
        "+_add_sub_category_stylist": {
            "en": "+ add sub category stylist",
            "ar": "+ إضافة قسم فرعي مصفف"
        },
        "add_sub_category": {
            "en": "add sub category",
            "ar": "إضافة قسم فرعي"
        },
        "enter_sub_category_name": {
            "en": "enter sub category name",
            "ar": "أدخل اسم القسم الفرعي"
        },
        "category_name": {
            "en": "category name",
            "ar": "اسم القسم"
        },
        "sub_category_name": {
            "en": "sub category name",
            "ar": "اسم القسم الفرعي"
        },
        "service_description": {
            "en": "service description",
            "ar": "وصف الخدمة"
        },
        "select_service_category": {
            "en": "select service category",
            "ar": "اختر قسم الخدمة"
        },
        "select_sub_category": {
            "en": "select sub category",
            "ar": "اختر القسم الفرعي"
        },
        "sub_category": {
            "en": "sub category",
            "ar": "قسم فرعي"
        },
        "cities": {
            "en": "cities",
            "ar": "مدن"
        },
        "add_service_pricing_&_duration": {
            "en": "add service pricing & duration",
            "ar": "أضف أسعار الخدمة وفترتهاا"
        },
        "service_sub_category": {
            "en": "service sub category",
            "ar": "قسم الخدمة الفرعي"
        },
        "select_service_sub_category": {
            "en": "select service sub category",
            "ar": "اختر قسم الخدمة الفرعي"
        },
        "list_of_services": {
            "en": "list of services",
            "ar": "قائمة الخدمات"
        },
        "services_list": {
            "en": "services list",
            "ar": "قائمة الخدمات"
        },
        "apply": {
            "en": "apply",
            "ar": "تطبيق"
        },
        "service_for": {
            "en": "service for",
            "ar": "خدمة ل"
        },
        "document_list": {
            "en": "document list",
            "ar": "قائمة المستندات"
        },
        "+_add_document": {
            "en": "+ add document",
            "ar": "+ إضافة مستند"
        },
        "add_document": {
            "en": "add document",
            "ar": "إضافة مستند"
        },
        "document_name": {
            "en": "document name",
            "ar": "اسم المستند"
        },
        "expired": {
            "en": "expired",
            "ar": "منتهية الصلاحية"
        },
        "expiry_date": {
            "en": "expiry date",
            "ar": "تاريخ الانتهاء"
        },
        "inactive": {
            "en": "inactive",
            "ar": "غير نشط"
        },
        "list_of_gift_cards": {
            "en": "list of gift cards",
            "ar": "قائمة بطاقات الهدايا"
        },
        "gift_cards_list": {
            "en": "gift cards list",
            "ar": "قائمة بطاقات الهدايا"
        },
        "delete_gift_card": {
            "en": "delete gift card",
            "ar": "احذف بطاقة الهدايا"
        },
        "title": {
            "en": "title",
            "ar": "عنوان"
        },
        "description": {
            "en": "description",
            "ar": "الوصف"
        },
        "validity": {
            "en": "validity",
            "ar": "الصلاحية"
        },
        "add_gift_card": {
            "en": "add gift card",
            "ar": "إضافة بطاقة هدية"
        },
        "gift_vouchers": {
            "en": "gift vouchers",
            "ar": "قسائم الهدايا"
        },
        "Day(s)": {
            "en": "Day(s)",
            "ar": "أيام"
        },
        "Month(s)": {
            "en": "Month(s)",
            "ar": "شهور"
        },
        "Year(s)": {
            "en": "Year(s)",
            "ar": "سنوات"
        },
        "Lifetime": {
            "en": "Lifetime",
            "ar": "مدى الحياة"
        },
        "list_of_coupon_codes": {
            "en": "list of coupon codes",
            "ar": "قائمة رموز الكوبونات"
        },
        "add_coupon": {
            "en": "add coupon",
            "ar": "أضف كوبون"
        },
        "delete_coupon": {
            "en": "delete coupon",
            "ar": "حذف الكوبون"
        },
        "coupon_code": {
            "en": "coupon code",
            "ar": "رمز الكوبون"
        },
        "coupons_list": {
            "en": "coupons list",
            "ar": "قائمة الكوبونات"
        },
        "Please enter first name": {
            "en": "Please enter first name",
            "ar": "يرجى إدخال الاسم الأول"
        },
        "Please enter last name": {
            "en": "Please enter last name",
            "ar": "يرجى إدخال الاسم الأخير"
        },
        "Please enter mobile number": {
            "en": "Please enter mobile number",
            "ar": "يرجى إدخال رقم الجوال"
        },
        "Please enter valid Mobile Number": {
            "en": "Please enter valid Mobile Number",
            "ar": "الرجاء إدخال رقم هاتف صحيح"
        },
        "Please enter email": {
            "en": "Please enter email",
            "ar": "يرجى إدخال البريد الإلكتروني"
        },
        "Please Enter valid Email": {
            "en": "Please Enter valid Email",
            "ar": "الرجاء إدخال بريد إلكتروني صحيح"
        },
        "Please select country": {
            "en": "Please select country",
            "ar": "يرجى اختيار الدولة"
        },
        "admin added": {
            "en": "admin added",
            "ar": "تمت إضافة المشرف"
        },
        "Please wait": {
            "en": "Please wait",
            "ar": "الرجاء الانتظار"
        },
        "mobile number is required": {
            "en": "mobile number is required",
            "ar": "رقم الجوال مطلوب"
        },
        "email already exists": {
            "en": "email already exists",
            "ar": "البريد الالكتروني موجود مسبقاً"
        },
        "enter mobile": {
            "en": "enter mobile",
            "ar": "أدخل رقم الجوال"
        },
        "mobile already exists": {
            "en": "mobile already exists",
            "ar": "المحمول موجود مسبقاً"
        },
        "Unable to add Admin. Please try again later": {
            "en": "Unable to add Admin. Please try again later",
            "ar": "غير قادر على إضافة المسؤول. الرجاء المحاولة لاحقاً"
        },
        "Cities not available": {
            "en": "Cities not available",
            "ar": "مدن غير متوفرة"
        },
        "Please select city": {
            "en": "Please select city",
            "ar": "يرجى اختيار المدينة"
        },
        "manager added": {
            "en": "manager added",
            "ar": "تمت إضافة المدير"
        },
        "Unable to add manager. Please try again later": {
            "en": "Unable to add manager. Please try again later",
            "ar": "غير قادر على إضافة المدير. الرجاء معاودة المحاولة لاحقاً"
        },
        "Manager added successfully": {
            "en": "Manager added successfully",
            "ar": "تمت إضافة المدير بنجاح"
        },
        "agent added": {
            "en": "agent added",
            "ar": "تمت إضافةالوكيل"
        },
        "Agent added successfully": {
            "en": "Agent added successfully",
            "ar": "تمت إضافة الوكيل بنجاح"
        },
        "Unable to add Agent. Please try again later": {
            "en": "Unable to add Agent. Please try again later",
            "ar": "غير قادر على إضافة العامل. الرجاء معاودة المحاولة لاحقاً"
        },
        "coupons assigned": {
            "en": "coupons assigned",
            "ar": "الكوبونات المخصصة"
        },
        "please select coupons": {
            "en": "please select coupons",
            "ar": "يرجى اختيار كوبونات"
        },
        "please select users": {
            "en": "please select users",
            "ar": "يرجى اختيار المستخدمين"
        },
        "something went wrong. Please try again after sometime.": {
            "en": "Something went wrong. Please try again after sometime.",
            "ar": "هناك خطأ ما. من فضلك حاول مرة أخرى لاحقاً."
        },
        "Assigned successfully": {
            "en": "Assigned successfully",
            "ar": "تم التعيين بنجاح"
        },
        "registration_code": {
            "en": "registration code",
            "ar": "رمز التسجيل"
        },
        "Please Enter valid first name": {
            "en": "Please Enter valid first name",
            "ar": "الرجاء إدخال اسم أول صحيح"
        },
        "Please Enter valid last name": {
            "en": "Please Enter valid last name",
            "ar": "يرجى إدخال اسم عائلةلصحيح"
        },
        "Please enter Mobile Number": {
            "en": "Please enter Mobile Number",
            "ar": "يرجى إدخال رقم الجوال"
        },
        "Password atleast 6 characters required": {
            "en": "Password atleast 6 characters required",
            "ar": "كلمة السر على الأقل 6 أحرف المطلوبة"
        },
        "Please select  Date of birth": {
            "en": "Please select  Date of birth",
            "ar": "يرجى تحديد تاريخ الميلاد"
        },
        "Please select nationality": {
            "en": "Please select nationality",
            "ar": "يرجى تحديد الجنسية"
        },
        "Please select languages": {
            "en": "Please select languages",
            "ar": "يرجى اختيار اللغات"
        },
        "Please upload profile pic": {
            "en": "Please upload profile pic",
            "ar": "يرجى تحميل صورة الملف الشخصي"
        },
        "Please enter Password": {
            "en": "Please enter Password",
            "ar": "يرجى إدخال كلمة المرور"
        },
        "Please enter introduction": {
            "en": "Please enter introduction",
            "ar": "يرجى إدخال مقدمة"
        },
        "Please select the expertise": {
            "en": "Please select the expertise",
            "ar": "يرجى اختيار الخبرات"
        },
        "Please select the styles": {
            "en": "Please select the styles",
            "ar": "يرجى تحديد التصاميم"
        },
        "Please select stylist levels": {
            "en": "Please select stylist levels",
            "ar": "يرجى تحديد مستويات المصفف"
        },
        "Please upload images": {
            "en": "Please upload images",
            "ar": "يرجى تحميل الصور"
        },
        "Please Select For Whom": {
            "en": "Please Select For Whom",
            "ar": "يرجى الاختيار لمن"
        },
        "Please Select Category": {
            "en": "Please Select Category",
            "ar": "يرجى اختيار القسم"
        },
        "Please Select services": {
            "en": "Please Select services",
            "ar": "يرجى اختيار الخدمات"
        },
        "Please Select level": {
            "en": "Please Select level",
            "ar": "يرجى اختيار المستوى"
        },
        "Service already exists": {
            "en": "Service already exists",
            "ar": "الخدمة موجودة بالفعل"
        },
        "Invalid File": {
            "en": "Invalid File",
            "ar": "ملف غير صالح"
        },
        "Please Select Another Level for same service and gender": {
            "en": "Please Select Another Level for same service and gender",
            "ar": "يرجى تحديد مستوى آخر لنفس الخدمة والجنس"
        },
        "Please Select Certificate File": {
            "en": "Please Select Certificate File",
            "ar": "يرجى اختيار ملف الشهادة"
        },
        "Please Enter Certificate Name": {
            "en": "Please Enter Certificate Name",
            "ar": "يرجى إدخال اسم الشهادة"
        },
        "Please upload passport": {
            "en": "Please upload passport",
            "ar": "يرجى تحميل جواز السفر"
        },
        "Please upload  emirates id file": {
            "en": "Please upload  emirates id file",
            "ar": "يرجى تحميل ملف بطاقة الهوية الاماراتية "
        },
        "Please upload  driving licence file": {
            "en": "Please upload  driving licence file",
            "ar": "يرجى تحميل ملف رخصة القيادة"
        },
        "Please upload resume": {
            "en": "Please upload resume",
            "ar": "يرجى تحميل السيرة الذاتية"
        },
        "Please enter document name": {
            "en": "Please enter document name",
            "ar": "يرجى إدخال اسم المستند"
        },
        "Please select expiry date": {
            "en": "Please select expiry date",
            "ar": "يرجى تحديد تاريخ انتهاء الصلاحية"
        },
        "Please upload resume file": {
            "en": "Please upload resume file",
            "ar": "يرجى تحميل ملف السيرة الذاتية"
        },
        "Please upload Certificate File": {
            "en": "Please upload Certificate File",
            "ar": "يرجى تحميل ملف الشهادة"
        },
        "enter the card holder name": {
            "en": "enter the card holder name",
            "ar": "أدخل اسم حامل البطاقة"
        },
        "Please select gender": {
            "en": "Please select gender",
            "ar": "يرجى تحديد الجنس"
        },
        "enter the card number": {
            "en": "enter the card number",
            "ar": "أدخل رقم البطاقة"
        },
        "select the card type": {
            "en": "select the card type",
            "ar": "اختر نوع البطاقة"
        },
        "enter the card expiry": {
            "en": "enter the card expiry",
            "ar": "أدخل تاريخ انتهاء صلاحية البطاقة"
        },
        "maximum limit is 10 in portfolio": {
            "en": "maximum limit is 10 in portfolio",
            "ar": "الحد الأقصى هو 10 في المحفظة"
        },
        "Please select service": {
            "en": "Please select service",
            "ar": "يرجى اختيار الخدمة"
        },
        "Please valid to date": {
            "en": "Please valid to date",
            "ar": "يرجى ادخال تاريخ انتهاء صحيح"
        },
        "Experience already added": {
            "en": "Experience already added",
            "ar": "الخبرة مضافة مسبقاً"
        },
        "Edit service details not valid": {
            "en": "Edit service details not valid",
            "ar": "تعديل تفاصيل الخدمة غير صالح"
        },
        "Please select from date": {
            "en": "Please select from date",
            "ar": "يرجى اختيار تاريخ البدء"
        },
        "Please select to date": {
            "en": "Please select to date",
            "ar": "يرجى اختيار تاريخ الانتهاء"
        },
        "Please select valid to date": {
            "en": "Please select valid to date",
            "ar": "يرجى اختيار تاريخ انتهاء صحيح"
        },
        "Please select experience": {
            "en": "Please select experience",
            "ar": "يرجى اختيار الخبرة"
        },
        "Please select experience as": {
            "en": "Please select experience as",
            "ar": "يرجى اختيار الخبرة كَ"
        },
        "Please Select service experience": {
            "en": "Please Select service experience",
            "ar": "يرجى اختيار خبرة الخدمة"
        },
        "--Select level--": {
            "en": "--Select level--",
            "ar": "--اختر مستوى--"
        },
        "Select expertise": {
            "en": "Select expertise",
            "ar": "اختر الخبرات"
        },
        "Select Styles": {
            "en": "Select Styles",
            "ar": "اختر التصاميم"
        },
        "certificate name": {
            "en": "certificate name",
            "ar": "اسم الشهادة"
        },
        "--select services--": {
            "en": "--select services--",
            "ar": "--اختر الخدمات--"
        },
        "for_freelancer": {
            "en": "for freelancer",
            "ar": "للمصفف الحر"
        },
        "for_customer_(stylist)": {
            "en": "for customer (stylist)",
            "ar": "للزبائن (مصفف)"
        },
        "for_salon": {
            "en": "for salon",
            "ar": "للصالون"
        },
        "copy_to": {
            "en": "copy to",
            "ar": "نسخ الى"
        },
        "add_promotions": {
            "en": "add promotions",
            "ar": "إضافة الترقيات"
        },
        "accountant_panel": {
            "en": "accountant panel",
            "ar": "لوحة محاسب"
        },
        "target_amount": {
            "en": "target amount",
            "ar": "المبلغ المستهدف"
        },
        "promotion_type": {
            "en": "promotion type",
            "ar": "نوع الترويج"
        },
        "promotion_value": {
            "en": "promotion value",
            "ar": "قيمة الترويج"
        },
        "valid_upto": {
            "en": "valid upto",
            "ar": "صالح حتى"
        },
        "valid_from": {
            "en": "valid from",
            "ar": "صالح من تاريخ"
        },
        "percentage": {
            "en": "percentage",
            "ar": "النسبة المئوية"
        },
        "--select_promotion_type--": {
            "en": "select promotion type",
            "ar": "اختر نوع الترويج"
        },
        "please_enter_title": {
            "en": "Please Enter Title",
            "ar": "يرجى إدخال العنوان"
        },
        "please_enter_target_amount": {
            "en": "Please Enter Target Amount",
            "ar": " يرجى إدخال المبلغالمستهدف "
        },
        "please select valid from": {
            "en": "Please select valid from",
            "ar": "يرجى تحديد صالح من"
        },
        "please select valid upto": {
            "en": "please select valid upto",
            "ar": "يرجى تحديد صالح إلى"
        },
        "please select promotion type": {
            "en": "please select promotion type",
            "ar": "يرجى اختيار نوع الترويج"
        },
        "please enter promotion value": {
            "en": "please enter promotion value",
            "ar": "يرجى اختيار قيمة الترويج"
        },
        "Please upload promotion image": {
            "en": "Please upload promotion image",
            "ar": "يرجى تحميل صورة ترويجية"
        },
        "upto_amount": {
            "en": "upto amount",
            "ar": "إلى مبلغ"
        },
        "please_wait": {
            "en": "Please Wait..",
            "ar": "الرجاء الانتظار.."
        },
        "promotion_deleted_successfully": {
            "en": "promotion deleted successfully",
            "ar": "تم حذف الترويج بنجاح"
        },
        "unable_to_delete_promotion": {
            "en": "unable to delete promotion",
            "ar": "غير قادر على حذف الترويج"
        },
        "unable_to_add_promotion_please_try_again_later": {
            "en": "Unable to add promotion. Please try again later",
            "ar": "غير قادر على إضافة ترويج. الرجاء معاودة المحاولة لاحقاًاً"
        },
        "promotion_added_successfully": {
            "en": "Promotion added successfully",
            "ar": "تمت إضافة العرض الترويجي بنجاح"
        },
        "add_accountant": {
            "en": "add accountant",
            "ar": "إضافة حساب"
        },
        "account_panel": {
            "en": "account panel",
            "ar": "لوحة الحساب"
        },
        "account_list": {
            "en": "account list",
            "ar": "قائمة الحسابات"
        },
        "account added": {
            "en": "account added",
            "ar": "تمت إضافة الحساب"
        },
        "add_customer_faqs": {
            "en": "add customer faqs",
            "ar": "أسئلة شائعة  الزبائن"
        },
        "customer_faqs": {
            "en": "customer Faqs",
            "ar": "أسئلة شائعة الزبائن"
        },
        "add_surge": {
            "en": "add surge",
            "ar": "أضف زيادة السعر"
        },
        "accountant_list": {
            "en": "accountant list",
            "ar": "قائمة المحاسبين"
        },
        "net_total": {
            "en": "net total",
            "ar": "صافي المجموع"
        },
        "Stylists_map_page": {
            "en": "Stylists Map Page",
            "ar": "صفحة خريطة المصفف"
        },
        "no_data_found": {
            "en": "no data found",
            "ar": "لاتوجد بيانات"
        },
        "enter the minimum value for total earnings": {
            "en": "enter the minimum value for total earnings",
            "ar": "enter the minimum value for total earnings"
        },
        "enter the maximum value for total earnings": {
            "en": "enter the maximum value for total earnings",
            "ar": "enter the maximum value for total earnings"
        },
        "enter valid range for total earnings": {
            "en": "enter valid range for total earnings",
            "ar": "enter valid range for total earnings"
        },
        "enter min value for From Admin": {
            "en": "enter min value for From Admin",
            "ar": "enter min value for From Admin"
        },
        "enter max value for From Admin": {
            "en": "enter max value for From Admin",
            "ar": "enter max value for From Admin"
        },
        "enter valid range for From admin": {
            "en": "Please enter valid range for From admin",
            "ar": "Please enter valid range for From admin"
        },
        "to_claim_the_reward_need_to_earn": {
            "en": "To Claim the reward need to earn",
            "ar": "للمطالبة مكافأة تحتاج إلى كسب"
        },
        "accountant_added": {
            "en": "accountant added",
            "ar": "وأضاف المحاسب"
        },
        "surge_map_list": {
            "en": "surge map list",
            "ar": "قائمة خريطة الارتفاع"
        },
        "booking_percentage": {
            "en": "booking percentage",
            "ar": "نسبة الحجز"
        },
        "booking_type": {
            "en": "booking type",
            "ar": "نوع الحجز"
        },
        "booking_percentage_should_less_than_100%": {
            "en": "booking percentage should less than 100%",
            "ar": "نسبة الحجز يجب أن تقل عن 100٪"
        },
        "please_enter_booking_percentage": {
            "en": "please enter booking percentage",
            "ar": "يرجى إدخال نسبة الحجز"
        },
        "please_select_booking_type": {
            "en": "please select booking type",
            "ar": "يرجى تحديد نوع الحجز"
        },
        "in_app_messages": {
            "en": "In app messages",
            "ar": "في رسائل التطبيق"
        },
        "sessions": {
            "en": "sessions",
            "ar": "جلسات"
        },
        "user_info": {
            "en": "user info",
            "ar": "معلومات المستخدم"
        },
        "device_info": {
            "en": "device info",
            "ar": "معلومات الجهاز"
        },
        "activity": {
            "en": "activity",
            "ar": "نشاط"
        },
        "get_messages": {
            "en": "get messages",
            "ar": "الحصول على الرسائل"
        },
        "messages_from": {
            "en": "messages from",
            "ar": "messages from"
        },
        "total_messages_sent": {
            "en": "total messages sent",
            "ar": "total messages sent"
        },
        "total_messages_dilivered": {
            "en": "total messages dilivered",
            "ar": "total_messages_dilivered"
        },
        "total_messages_read": {
            "en": "total messages read",
            "ar": "total messages read"
        },
        "please_enter_document_name": {
            "en": "please enter document name",
            "ar": "please enter document name ar"
        },
        "document_name_already_exists": {
            "en": "document name already exists",
            "ar": "document name already exists ar"
        },
        "document_added_successfully": {
            "en": "Document added successfully",
            "ar": "Document added successfully ar"
        },
        "document_updated_successfully": {
            "en": "Document updated successfully",
            "ar": "Document updated successfully ar"
        },
        "unable_to_add_document": {
            "en": "Unable to add document",
            "ar": "Unable to add document ar"
        },
        "inactive_document": {
            "en": "Inactive document",
            "ar": "Inactive document ar"
        },
        "are_you_sure_to_inactive_the_document.?": {
            "en": "Are You sure to Inactive the document.?",
            "ar": "Are You sure to Inactive the document ar.? "
        },
        "country_name": {
            "en": "country name",
            "ar": "country name ar"
        },
        "country_code": {
            "en": "country code",
            "ar": "country code ar"
        },
        "time_zone": {
            "en": "time zone",
            "ar": "time zone ar"
        },
        "currency_code": {
            "en": "currency code",
            "ar": "currency code ar"
        },
        "select_currency_code": {
            "en": "select currency code",
            "ar": "select currency code ar"
        },
        "currency_name": {
            "en": "currency name",
            "ar": "currency name ar"
        },
        "currency_symbol": {
            "en": "currency symbol",
            "ar": "currency symbol ar"
        },
        "dollar_conversion_rate": {
            "en": "dollar conversion rate",
            "ar": "dollar conversion rate ar"
        },
        "salon_agreements": {
            "en": "salon agreements",
            "ar": "salon agreements ar"
        },
        "stylist_agreements": {
            "en": "stylist agreements",
            "ar": "atylist agreements ar"
        },
        "documents_for_stylist": {
            "en": "documents for stylist",
            "ar": "documents for stylist ar"
        },
        "documents_for_salon": {
            "en": "documents for salon",
            "ar": "documents for salon ar"
        },
        "select_documents": {
            "en": "select documents",
            "ar": "select documents ar"
        },
        "add_row": {
            "en": "add row",
            "ar": "add row ar"
        },
        "upload_flag": {
            "en": "upload flag",
            "ar": "upload flag ar"
        },
        "phone_min_length": {
            "en": "phone min length",
            "ar": "phone min length ar"
        },
        "phone_max_length": {
            "en": "phone max length",
            "ar": "phone max length ar"
        },
        "please_select_currency_code": {
            "en": "Please select currency code",
            "ar": "Please select currency code ar"
        },
        "please_enter_dollar_conversion_rate": {
            "en": "please enter dollar conversion rate",
            "ar": "please enter dollar conversion rate ar"
        },
        "please_enter_currency": {
            "en": "please enter currency",
            "ar": "please enter currency ar"
        },
        "please_enter_currency_symbol": {
            "en": "please enter currency symbol",
            "ar": "please enter currency symbol ar"
        },
        "please_enter_phone_code": {
            "en": "please enter phone code",
            "ar": "please enter phone code ar"
        },
        "phone_code": {
            "en": "phone code",
            "ar": "phone code ar"
        },
        "please_enter_phone_number_min_length": {
            "en": "please enter phone number min length",
            "ar": "please enter phone number min length ar"
        },
        "please_enter_phone_number_max_length": {
            "en": "please enter phone number max length",
            "ar": "please enter phone number max length ar"
        },
        "phone_max_length_is_smaller_than_min_length": {
            "en": "phone max length is smaller than min length",
            "ar": "phone max length is smaller than min length ar"
        },
        "please_upload_flag!": {
            "en": "please upload flag!",
            "ar": "please upload flag ar!"
        },
        "please_enter_salon_agreement": {
            "en": "Please enter salon agreement",
            "ar": "Please enter salon agreement ar"
        },
        "please_enter_stylist_agreement": {
            "en": "Please enter stylist agreement",
            "ar": "Please enter stylist agreement"
        },
        "please_select_salon_document": {
            "en": "Please select salon document",
            "ar": "Please select salon document ar"
        },
        "add": {
            "en": "add",
            "ar": "add ar"
        },
        "please select stylist document": {
            "en": "please select stylist document",
            "ar": "please select stylist document ar"
        },
        "created_successfully": {
            "en": "created successfully",
            "ar": "created successfully ar"
        },
        "countries": {
            "en": "countries",
            "ar": "countries ar"
        },
        "loading..": {
            "en": "loading..",
            "ar": "loading ar..."
        },
        "updated_successfully": {
            "en": "updated successfully",
            "ar": "updated successfully ar"
        },
        "--select_time_zone--": {
            "en": "-- select time zone--",
            "ar": "-- select_time_zone ar--"
        },
        "city_already_exists": {
            "en": "City already exists",
            "ar": "City already exists ar"
        },
        "please_select_country": {
            "en": "please select country",
            "ar": "please select country ar"
        },
        "please_enter_city_name": {
            "en": "please enter city name",
            "ar": "please enter city name ar"
        },
        "please_enter_city_latitude": {
            "en": "Please enter city latitude",
            "ar": "Please enter city latitude ar"
        },
        "please_enter_city_longitude": {
            "en": "Please enter city longitude",
            "ar": "Please enter city longitude ar"
        },
        "please_select_time_zone": {
            "en": "please select time zone",
            "ar": "please select time zone ar"
        },
        "city_added_successfully": {
            "en": "City added successfully",
            "ar": "City added successfully ar"
        },
        "unable_to_store_city_please_try_again_later": {
            "en": "Unable to store city please try again later",
            "ar": "Unable to store city please try again later ar"
        },
        "update_city": {
            "en": "update city",
            "ar": "update city ar"
        },
        "edit_city": {
            "en": "Edit city",
            "ar": "edit city ar"
        },
        "city_latitude_city_longitude": {
            "en": "city latitude city longitude ",
            "ar": "city latitude city longitude ar"
        },
        "please_enter_category_name": {
            "en": "Please enter category name",
            "ar": "Please enter category name ar"
        },
        "category_already_exists": {
            "en": "Category already exists",
            "ar": "Category already exists ar"
        },
        "please_upload_category_icon": {
            "en": "Please upload category icon",
            "ar": "Please upload category icon ar"
        },
        "unable_to_upload_category_icon": {
            "en": "Unable to upload category icon",
            "ar": "Unable to upload category icon ar"
        },
        "file_format_is_not_supported": {
            "en": "file format is not supported !",
            "ar": "file format is not supported  ar!"
        },
        "unable_to_upload_video": {
            "en": "Unable to upload video",
            "ar": "Unable to upload video ar"
        },
        "edit_service_category": {
            "en": "edit service category",
            "ar": " edit service category ar"
        },
        "attachment_preview": {
            "en": "attachment preview",
            "ar": "attachment preview ar"
        },
        "service_video": {
            "en": "service video",
            "ar": "service video ar"
        },
        "please_login": {
            "en": "please login",
            "ar": "please login ar"
        },
        "sub_category_already_exists": {
            "en": "Sub category already exists",
            "ar": "Sub category already exists ar"
        },
        "successfully_added": {
            "en": "successfully added",
            "ar": "successfully added ar"
        },
        "unable_to_add_sub_category": {
            "en": "unable to add sub category",
            "ar": "unable to add sub category"
        },
        "please_enter_service_name": {
            "en": "Please enter service name",
            "ar": "Please enter service name ar"
        },
        "please_select_service_category": {
            "en": "Please select service category",
            "ar": "Please select service category ar"
        },
        "please_select_service_sub_category": {
            "en": "Please select service sub category",
            "ar": "Please select service sub category ar"
        },
        "please_enter_service_description": {
            "en": "Please enter service description",
            "ar": "Please enter service description ar"
        },
        "please_select_atleast_one_service_type": {
            "en": "Please select atleast one service type",
            "ar": "Please select atleast one service type ar"
        },
        "service_name_already_exists": {
            "en": "Service name already exists..!",
            "ar": "Service name already exists ar..!"
        },
        "service_added_successfully": {
            "en": "service added successfully",
            "ar": "service added successfully ar"
        },
        "unable_to_add_service_please_try_again": {
            "en": "Unable to add service please try again",
            "ar": "Unable to add service please try again ar"
        },
        "updated!.": {
            "en": "updated!.",
            "ar": "updated ar!."
        },
        "edit_service": {
            "en": "edit service",
            "ar": "edit service ar"
        },
        "edit_service_price_duration": {
            "en": "Edit Service Price & Duration",
            "ar": "Edit Service Price & Duration ar"
        },
        "service_price_duration": {
            "en": "Service Price & Duration",
            "ar": "Service Price & Duration ar"
        },
        "please_enter_style_name": {
            "en": "Please enter style name",
            "ar": "Please enter style name ar"
        },
        "style_already_exists": {
            "en": "Style already exists..!",
            "ar": "Style already exists..!"
        },
        "style_added_successfully": {
            "en": "Style added successfully",
            "ar": "Style added successfully ar"
        },
        "style_updated_successfully": {
            "en": "Style updated successfully",
            "ar": "Style updated successfully ar"
        },
        "language_updated_successfully": {
            "en": "language updated successfully",
            "ar": "language updated successfully ar"
        },
        "unable_to_add_style": {
            "en": "Unable to add style",
            "ar": "Unable to add style ar"
        },
        "please_enter_country": {
            "en": "please enter country",
            "ar": "please enter country ar"
        },
        "edit_document": {
            "en": "edit document",
            "ar": "edit document ar"
        },
        "please_enter_language": {
            "en": "Please Enter Language",
            "ar": "Please Enter Language ar"
        },
        "language_already_exists": {
            "en": "Language already exists",
            "ar": "Language already exists ar"
        },
        "language_added_successfully": {
            "en": "Language added successfully ",
            "ar": "Language added successfully ar"
        },
        "unable_to_add_language": {
            "en": "Unable to add language",
            "ar": "Unable to add language ar"
        },
        "Please select register date": {
            "en": "Please select register date",
            "ar": "Please select register date"
        },
        "language_name": {
            "en": "language name",
            "ar": "language name ar"
        },
        "add_language": {
            "en": "add language",
            "ar": "add language ar"
        },
        "edit_language": {
            "en": "edit language",
            "ar": "edit language ar"
        },
        "enter_language_name": {
            "en": "enter language name",
            "ar": "enter language name"
        },
        "invite_code_not_exists": {
            "en": "invite code not exists",
            "ar": "invite code not exists ar"
        },
        "profile_created_successfully": {
            "en": "Profile created successfully",
            "ar": "Profile created successfully ar"
        },
        "updated_about_page_successfully": {
            "en": "Updated About page successfully",
            "ar": "تم التحديث حول الصفحة بنجاح"
        },
        "member_since": {
            "en": "member since",
            "ar": "عضو منذ"
        },
        "payment": {
            "en": "payment",
            "ar": "دفع"
        },
        "portfolio": {
            "en": "portfolio",
            "ar": "محفظة"
        },
        "info": {
            "en": "info",
            "ar": "معلومات"
        },
        "basic_info": {
            "en": "basic info",
            "ar": "معلومات أساسية"
        },
        "password": {
            "en": "password",
            "ar": "كلمه الس "
        },
        "ratings": {
            "en": "ratings",
            "ar": "تصنيفات"
        },
        "invites": {
            "en": "invites",
            "ar": "تدعو"
        },
        "edit_stylist": {
            "en": "edit stylist",
            "ar": "تحرير المصمم"
        },
        "reset_link": {
            "en": "reset link",
            "ar": "reset link ar"
        },
        "experience_unavailable": {
            "en": "Experience unavailable",
            "ar": "تجربة غير متوفرة"
        },
        "booking_chat": {
            "en": "booking chat",
            "ar": "booking chat ar"
        },
        "send_email": {
            "en": "send email",
            "ar": "send email ar"
        },
        "booking_time": {
            "en": "booking time",
            "ar": "booking time ar"
        },
        "service_start": {
            "en": "service start",
            "ar": "service start ar"
        },
        "service_end": {
            "en": "service end",
            "ar": "service end ar"
        },
        "total_duration": {
            "en": "total duration",
            "ar": "total duration ar"
        },
        "you_rated": {
            "en": "you rated",
            "ar": "you rated ar"
        },
        "comment": {
            "en": "comment",
            "ar": "comment ar"
        },
        "client": {
            "en": "client",
            "ar": "client ar"
        },
        "address": {
            "en": "address",
            "ar": "address ar"
        },
        "note": {
            "en": "note",
            "ar": "note ar"
        },
        "payment_status": {
            "en": "payment status",
            "ar": "payment status ar"
        },
        "customer_rated": {
            "en": "customer rated",
            "ar": "customer rated ar"
        },
        "promo_gift_code": {
            "en": "promo gift code ",
            "ar": "promo gift code ar"
        },
        "not_applied": {
            "en": "no applied",
            "ar": "not applied"
        },
        "total_amount": {
            "en": "total amount",
            "ar": "total amount ar"
        },
        "booking_status": {
            "en": "booking status",
            "ar": "booking status"
        },
        "earings_from": {
            "en": "earings from",
            "ar": "earings from ar"
        },
        "tickets": {
            "en": "tickets",
            "ar": "tickets"
        },
        "branch_info": {
            "en": "branch info",
            "ar": "branch info ar"
        },
        "admin_info": {
            "en": "admin info",
            "ar": "admin info ar"
        },
        "picture": {
            "en": "picture",
            "ar": "picture"
        },
        "staff": {
            "en": "staff",
            "ar": "staff"
        },
        "working": {
            "en": "working",
            "ar": "working"
        },
        "cancellation": {
            "en": "cancellation",
            "ar": "cancellation"
        },
        "kibs_friendly": {
            "en": "kibs friendly",
            "ar": "kibs friendly"
        },
        "allow_pets": {
            "en": "allow pets",
            "ar": "allow pets ar"
        },
        "admin_name": {
            "en": "admin name",
            "ar": "admin name"
        },
        "register_date": {
            "en": "register date",
            "ar": "register date"
        },
        "service_cost": {
            "en": "service cost",
            "ar": "تكلفة الخدمة"
        },
        "edit_agent": {
            "en": "edit agent",
            "ar": "edit agent ar"
        },
        "area": {
            "en": "area",
            "ar": "area"
        },
        "surge_title": {
            "en": "surge title",
            "ar": "surge title"
        },
        "surge_x_times": {
            "en": "surge x times",
            "ar": "surge x times"
        },
        "surge_banner": {
            "en": "surge banner",
            "ar": "surge banner"
        },
        "area_name": {
            "en": "area name",
            "ar": "area name"
        },
        "get_bookings": {
            "en": "get bookings",
            "ar": "get bookings"
        },
        "user": {
            "en": "user",
            "ar": "user ar"
        },
        "coupons_info": {
            "en": "coupon info",
            "ar": "coupon info ar"
        },
        "customer_name": {
            "en": "customer name",
            "ar": "customer name ar"
        },
        "date_of_purchase": {
            "en": "date of purchase",
            "ar": "date of purchase ar"
        },
        "gift_card_for": {
            "en": "gift card for",
            "ar": "gift card for"
        },
        "booking_help": {
            "en": "booking help",
            "ar": "booking help"
        },
        "bank_charges": {
            "en": "bank charges",
            "ar": "bank charges"
        },
        "actions": {
            "en": "actions",
            "ar": "actions"
        },
        "notify_account": {
            "en": "notify account",
            "ar": "notify acoount"
        },
        "Salon details updated successfully": {
            "en": "Salon details updated successfully",
            "ar": "Salon details updated successfully ar"
        },
        "Please enter special instrucation": {
            "en": "Please enter special instrucation",
            "ar": "Please enter special instrucation"
        },
        "Please enter Location name": {
            "en": "Please enter Location name",
            "ar": "Please enter Location name"
        },
        "Please enter Location alias name": {
            "en": "Please enter Location alias name",
            "ar": "Please enter Location alias name"
        },
        "Please enter Instructions": {
            "en": "Please enter Instructions",
            "ar": "Please enter Instructions"
        },
        "Please select wifi availability": {
            "en": "Please select wifi availability",
            "ar": "Please select wifi availability"
        },
        "Please select wifi cost": {
            "en": "Please select wifi cost",
            "ar": "Please select wifi cost"
        },
        "Please select parking availability": {
            "en": "Please select parking availability",
            "ar": "Please select parking availability"
        },
        "Please select parking cost": {
            "en": "Please select parking cost",
            "ar": "Please select parking cost"
        },
        "Please select kids friendly": {
            "en": "Please select kids friendly",
            "ar": "Please select kids friendly"
        },
        "Please select handicap": {
            "en": "Please select handicap",
            "ar": "Please select handicap"
        },
        "Please select pets": {
            "en": "Please select pets",
            "ar": "Please select pets"
        },
        "Please enter street name": {
            "en": "Please enter street name",
            "ar": "Please enter street name"
        },
        "approve": {
            "en": "approve",
            "ar": "تمت الموافقة"
        },
        "reject": {"en": "reject","ar": "reject ar"},
        "Please enter building name":{"en": "Please enter building name","ar": "Please enter building name"},
        "Please enter floor number": {"en": "Please enter floor number","ar": "Please enter floor number"},
        "Please enter country name": {"en": "Please enter country name","ar": "Please enter country name"},
        "Please enter city name": {"en": "Please enter city name","ar": "Please enter city name"},
        "Please enter zip code": {"en": "Please enter zip code","ar": "Please enter zip code"},
        "Please select map position": {"en": "Please select map position","ar": "Please select map position"},
        "No documents available": {"en": "No documents available","ar": "No documents available ar"},
        "service_provider_details": {"en": "Service provider details","ar": "Service provider details"},
        "service_location": {"en": "Service location","ar": "Service location"},
        "service_timings": {"en": "Service timings","ar": " Service timings"},
        "order_id": {"en": "order id","ar": "order id"},
        "earings": {"en": "earings","ar": "earings"},
        "Please enter branch name": {"en": "Please enter branch name","ar": "Please enter branch name"},
        "Please enter alias name": {"en": "Please enter alias name","ar": "Please enter alias name"},
        "no amount to transfer":{"en":"no amount to transfer","ar":"no amount to transfer ar"},
        "amount transfered":{"en":"amount transfered","ar":"amount transfered ar"},
        "Please enter phone number":{"en":"Please enter phone number","ar":"Please enter phone number ar"},
        "Please enter valid Phone Number!":{"en":"Please enter valid Phone Number!","ar":"Please enter valid Phone Number ar!"},
        "Please enter Intro": {"en": "Please enter Intro","ar": "Please enter Intro ar"},
        "Please enter special Instruction": {"en": "Please enter special Instruction","ar": "Please enter special Instruction ar"},
        "value/amount": {"en": "value/amount","ar": "value/amount"},
        "offer on percentage": {"en": "offer on percentage","ar": "offer on percentage"},
        "min_amount": {"en": "min amount","ar": "min amount ar"},
        "coupon_type": {"en": "coupon type","ar": "coupon type"},
        "--no_repeat--": {"en": "--no repeat--","ar": "--no repeat--"},
        "customer_details": {"en": "customer details","ar": "customer details"},
        "date_of_used": {"en": "date of used","ar": "date of used"},
        "amount_type": {"en": "amount type","ar": "amount type ar"},
        "amount": {"en": "amount","ar": "amount"},
        "offer_type": {"en": "offer type","ar": "offer type ar"},
        "offer": {"en": "offer","ar": "offer ar"},
        "last_order_date_from": {"en": "last Order Date From","ar": "last Order Date From ar"},
        "last_order_date_to": {"en": "last Order Date To","ar": "last Order Date To ar"},
        "reset": {"en": "reset","ar": "reset ar"},
        "order_date_from": {"en": "order date from","ar": "order date from ar"},
        "order_date_to": {"en": "order date to","ar": "order date to ar"},
        "map_view": {"en": "map view","ar": "map view"},
        "select_gift_card_for": {"en": "select gift card for","ar": "select gift card for"},
        "self": {"en": "self","ar": "self ar"},
        "open": {"en": "open","ar": "ar"},
        "customer_analytics": {"en": "Customer Analytics","ar": "Customer Analytics"},
        "customers_list": {"en": "customers list","ar": "customers list"},
        "from_date": {"en": "from date","ar": "from date ar"},
        "to_date": {"en": "to date","ar": "to date ar"},
        "shared_user_mobile_number": {"en": "shared user mobile number" ,"ar": "shared user mobile number ar"},
        "notifications": {"en": "notifications","ar": "notifications"},
        "message": {"en": "message","ar": "message"},
        "notifications_list": {"en": "notifications list","ar": "notifications list ar"},
        "notifications_from": {"en": "notifications from" ,"ar": "notifications from"},
        "notifications_to": {"en": "notifications to" ,"ar": "notifications to"},
        "search": {"en": "search","ar": "search"},
        "language_layout": {"en": "language layout","ar": "language layout"},
        "salon_rated": {"en": "salon rated","ar": "salon rated"},
        "stylist_rated": {"en": "stylist rated","ar": "stylist rated"},
        "Invalid token": {
            "en": "Invalid token",
            "ar": "رمز غير صالح"
        },
        "Invalid user": {
            "en": "Invalid User",
            "ar": "مستخدم غير صالح"
        },
        "Invalid request": {
            "en": "Invalid Request",
            "ar": "طلب غير صالح"
        },
        "please enter employee name": {
            "en": "please enter employee name"
        },
        "please enter employee mobile": {
            "en": "please enter employee mobile",
            "ar": "يرجى إدخال الموظف المحمول"
        },
        "please enter employee nationality": {
            "en": "please enter employee nationality",
            "ar": ""
        },
        "please select employee expertise": {
            "en": "please select employee expertise",
            "ar": "يرجى اختيار خبرة الموظف"
        },
        "please enter employee expertise": {
            "en": "please enter employee expertise",
            "ar": "الرجاء إدخال خبرة الموظف"
        },
        "please select employee profile picture": {
            "en": "please select employee profile picture",
            "ar": "الرجاء اختيار صورة الملف الشخصي للموظف"
        },
        "please enter employee timeings": {
            "en": "please enter employee timeings",
            "ar": "يرجى إدخال وقت الموظف"
        },
        "mobile number already exists": {
            "en": "mobile number already exists",
            "ar": "رقم الهاتف المحمول موجود بالفعل"
        },
        "employee added successfully": {
            "en": "employee added successfully",
            "ar": "موظف إضافة بنجاح"
        },
        "employee updated successfully": {
            "en": "employee updated successfully",
            "ar": "موظف تحديث بنجاح"
        },
        "Something went wrong. Please try again after sometime": {
            "en": "Something went wrong. Please try again after sometime",
            "ar": "هناك خطأ ما. من فضلك حاول مرة أخرى بعد بعض من الوقت"
        },
        "Cart Item Already Booked": {
            "en": "Cart Item Already Booked",
            "ar": "البند السلة حجز بالفعل"
        },
        "No stylist Found": {
            "en": "No stylist Found",
            "ar": "لا مصفف وجدت"
        },
        "stylist is for missing for some cart items please choose": {
            "en": "stylist is for missing for some cart items please choose",
            "ar": "المصمم هو في عداد المفقودين لبعض البنود عربة الرجاء اختيار"
        },
        "stylist not available at this moment": {
            "en": "stylist not available at this moment",
            "ar": "المصمم غير متوفر في هذه اللحظة"
        },
        "Please select cart items": {
            "en": "Please select cart items",
            "ar": "يرجى تحديد البنود عربة"
        },
        "stylist services not available at this moment": {
            "en": "stylist services not available at this moment",
            "ar": "خدمات المصمم غير متوفرة في هذه اللحظة"
        },
        "please select languages": {
            "en": "please select languages",
            "ar": "يرجى اختيار اللغات"
        },
        "please select end date": {
            "en": "please select end date",
            "ar": "يرجى تحديد تاريخ الانتهاء"
        },
        "please select start date": {
            "en": "please select start date",
            "ar": "يرجى تحديد تاريخ البدء"
        },
        "No cancellation policy found": {
            "en": "No cancellation policy found",
            "ar": "لم يتم العثور على سياسة الإلغاء"
        },
        "Invalid otp": {
            "en": "Invalid otp",
            "ar": "otp غير صالح"
        },
        "Please provide mobile number": {
            "en": "Please provide mobile number",
            "ar": "Please provide mobile number"
        },
        "salon registration is not complted": {
            "en": "salon registration is not complted",
            "ar": "salon registration is not complted"
        },
        "Registered As Serve out Stylist": {
            "en": "Registered As Serve out Stylist",
            "ar": "Registered As Serve out Stylist"
        },
        "Registered As Stylist": {
            "en": "Registered As Stylist",
            "ar": "Registered As Stylist"
        },
        "Registered As Salon": {
            "en": "Registered As Salon",
            "ar": "Registered As Salon"
        },
        "Please complete your profile from agent or manager": {
            "en": "Please complete your profile from agent or manager",
            "ar": "Please complete your profile from agent or manager"
        },
        "Please enter otp": {
            "en": "Please enter otp",
            "ar": "Please enter otp"
        },
        "Mobile Number Verified Please Register": {
            "en": "Mobile Number Verified Please Register",
            "ar": "Mobile Number Verified Please Register ar"
        },
        "email required": {
            "en": "email required",
            "ar": "email required"
        },
        "First Name is required!": {
            "en": "First Name is required!",
            "ar": "First Name is required!"
        },
        "city services not available": {
            "en": "city services not available",
            "ar": "city services not available ar"
        },

        "u can't use your own invite code": {
            "en": "u can't use your own invite code",
            "ar": "u can't use your own invite code ar"
        },
        "invite Code is invalid": {
            "en": "invite Code is invalid",
            "ar": "invite Code is invalid ar"
        },
        "Please provide your country.": {
            "en": "Please provide your country.",
            "ar": "Please provide your country."
        },
        "Please provide your email.": {
            "en": "Please provide your email.",
            "ar": "Please provide your email."
        },
        "country Not available": {
            "en": "country Not available",
            "ar": "country Not available"
        },
        "Mobile number is required!": {
            "en": "Mobile number is required!",
            "ar": "Mobile number is required!"
        },
        "salon is not registered": {
            "en": "salon is not registered",
            "ar": "salon is not registered"
        },
        "salon name is required.": {
            "en": "salon name is required.",
            "ar": "salon name is required."
        },
        "salon mobile is required.": {
            "en": "salon mobile is required.",
            "ar": "salon mobile is required."
        },
        "salon  email is required.": {
            "en": "salon  email is required.",
            "ar": "salon  email is required."
        },
        "Please provide working hours": {
            "en": "Please provide working hours",
            "ar": "Please provide working hours"
        },
        "Please provide valid working day": {
            "en": "Please provide valid working day",
            "ar": "Please provide valid working day"
        },
        "Please provide street name": {
            "en": "Please provide street name",
            "ar": "Please provide street name"
        },
        "Please provide buliding name": {
            "en": "Please provide buliding name",
            "ar": "Please provide buliding name"
        },
        "Please provide location": {
            "en": "Please provide location",
            "ar": "Please provide location"
        },
        "Please provide country": {
            "en": "Please provide country",
            "ar": "Please provide country"
        },
        "city Not available": {
            "en": "city Not available",
            "ar": "city Not available"
        },
        "Please provide your first name.": {
            "en": "Please provide your first name.",
            "ar": "Please provide your first name."
        },
        "Please provide your last name.": {
            "en": "Please provide your last name.",
            "ar": "Please provide your last name."
        },
        "Please provide your gender.": {
            "en": "Please provide your gender.",
            "ar": "Please provide your gender."
        },
        "Please provide valid gender.": {
            "en": "Please provide valid gender.",
            "ar": "Please provide valid gender."
        },
        "Please provide your nationality.": {
            "en": "Please provide your nationality.",
            "ar": "Please provide your nationality."
        },
        "Please provide valid stylist gender.": {
            "en": "Please provide valid stylist gender.",
            "ar": "Please provide valid stylist gender."
        },
        "Invalid payment mode provided.": {
            "en": "Invalid payment mode provided.",
            "ar": "Invalid payment mode provided."
        },
        "not a valid user": {
            "en": "not a valid user",
            "ar": "not a valid user"
        },
        "Services are not available, please select different country": {
            "en": "Services are not available, please select different country",
            "ar": "Services are not available, please select different country ar"
        },
        "Please provide valid email": {
            "en": "Please provide valid email",
            "ar": "Please provide valid email ar"
        },
        "country Not avalible": {
            "en": "country Not avalible",
            "ar": "country Not avalible ar"
        },
        "please select city": {
            "en": "please select city",
            "ar": "please select city ar"
        },
        "coupon code is not valid": {
            "en": "coupon code is not valid",
            "ar": "coupon code is not valid ar"
        },
        "coupon code is not valid till": {
            "en": "coupon code is not valid till",
            "ar": "coupon code is not valid till ar"
        },
        "coupon code is not valid valid upto": {
            "en": "coupon code is not valid valid upto",
            "ar": "coupon code is not valid valid upto ar"
        },
        "cart amount should be minimum": {
            "en": "cart amount should be minimum ",
            "ar": "cart amount should be minimum ar"
        },
        "promo amount is higher than cart amount": {
            "en": "promo amount is higher than cart amount",
            "ar": "promo amount is higher than cart amount ar"
        },
        "coupon code already used": {
            "en": "coupon code already used",
            "ar": "coupon code already used ar"
        },
        "u can't apply coupon to packages": {
            "en": "u can't apply coupon to packages",
            "ar": "u can't apply coupon to packages ar"
        },
        "please select services": {
            "en": "please select services",
            "ar": "please select services ar"
        },
        "Invalid credentials": {
            "en": "Invalid credentials",
            "ar": "Invalid credentials ar"
        },
        "Mobile is not registered.": {
            "en": "Mobile is not registered.",
            "ar": "Mobile is not registered ar."
        },
        "Password is required!": {
            "en": "Password is required!",
            "ar": "Password is required!"
        },
        "Incorrect current password": {
            "en": "Incorrect current password",
            "ar": "Incorrect current password ar"
        },
        "Password should contain minimum 6 characters": {
            "en": "Password should contain minimum 6 characters",
            "ar": "Password should contain minimum 6 characters"
        },
        "Please enter old password": {
            "en": "Please enter old password",
            "ar": "Please enter old password ar"
        },
        "Please Upload Profile pic": {
            "en": "Please Upload Profile pic",
            "ar": "Please Upload Profile pic ar"
        },
        "new Service requested successfully": {
            "en": "new Service requested successfully",
            "ar": "new Service requested successfully ar"
        },
        "Account is locked please concat admin": {
            "en": "Account is locked please concat admin",
            "ar": "Account is locked please concat admin ar"
        },
        "stylist not avalible": {
            "en": "stylist not avalible",
            "ar": "stylist not avalible"
        },
        "employee add successfully": {
            "en": "employee add successfully",
            "ar": "employee add successfully ar"
        },
        "Your accountant is already verified. Please login.": {
            "en": "Your accountant is already verified. Please login.",
            "ar": "Your accountant is already verified. Please login."
        },
        "coupon code is expired": {
            "en": "coupon code is expired",
            "ar": "coupon code is expired"
        },
        "document reference id missing": {
            "en": "document reference id missing",
            "ar": "document reference id missing"
        },
        "This salon is blocked please contact admin": {
            "en": "This salon is blocked please contact admin",
            "ar": "This salon is blocked please contact admin ar"
        },
        "you are blocked by admin please contact admin": {
            "en": "You are blocked by admin please contact admin",
            "ar": "Hesabınız Mr&Ms Beauty tarafından donduruldu. Detaylı bilgi için iletişime geçin."
        },
        "Successfully Cart Item Deleted From Schedule Booking": {
            "en": "Successfully Cart Item Deleted From Schedule Booking",
            "ar": "Successfully Cart Item Deleted From Schedule Booking"
        },
        "your logged in another device do u want to login?": {
            "en": "your logged in another device do u want to login?",
            "ar": "your logged in another device do u want to login?"
        },
        "Your serveOut is off please contact salon admin":{
            "en": "Your serveOut is off please contact salon admin",
            "ar": "Your serveOut is off please contact salon admin",
            "de": "",
            "tr": ""
        }
    };
        lang=JSON.parse(JSON.stringify(lang));
    for(var l in lang)
    {
        console.log(lang[l]['en']);
        var en=lang[l]["en"];


        delete lang[l]['gr'];
    }
    console.log(lang);
    var  json = JSON.stringify(lang); //convert it back to json
    fs.writeFile('./language_resource.json', json, 'utf8', function(){});
}
router.post("/surge-coordinates", function(req , res){
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var fromDate=req.body.from_date;
    var toDate=req.body.to_date;
    var data={latitude:latitude,longitude:longitude};
    var moment=require('moment-timezone');
    var dateFormat="YYYY-MM-DD HH:mm:ss";
    if(fromDate!=undefined && fromDate!=''){
        var startDate=moment(fromDate);
        var date=startDate.format(dateFormat);
        data['from_date']=date;
    }
    if(toDate!=undefined && toDate!=''){
        var endDate=moment(toDate);
        var date=endDate.format(dateFormat);
        data['to_date']=toDate;
    }
    tables.surgePriceTable.getNearSurges(data,function(response){
        var result=[];
        if(response!=undefined && response.length!=0)
        {
            var tmp={};
            for(var s=0;s<response.length;s++)
            {
                tmp={};
                tmp['coordinates']=response[s].area.coordinates[0];
                tmp['title']=response[s].title;
                tmp['surge']=response[s].surge;
                tmp['_id']=response[s]._id;
                result.push(tmp);
            }
        }
             console.log(result,"result frormrfrfrfrfrfrfrf+++++++++++++++++++++++++");
        return   res.send({success : true,"surge":result});
    });

});
router.get('/update-category',async function(req,res){
    var categoryData=[{
        "_id": "5bd2b33deb77942e5887e66e",
        "video": {
            "1": "data/attachments/zJLxGZIEP9_1552984747_1552984747.mp4",
            "2": "data/attachments/IqAUQtivv9_1552984751_1552984751.mp4"
        }
    },
        {
            "_id": "5bd2b3eceb7794d37787e667",
            "video": {
                "1": "data/attachments/ZigwAEbq7M_1552985297_1552985297.mp4",
                "2": "data/attachments/jmEW0R0Bh9_1552984556_1552984556.mp4",
                "3": "data/attachments/QK7xkq2EV2_1552984565_1552984565.mp4",
                "4": "data/attachments/QG4HLpD0gc_1552984577_1552984577.mp4"
            }
        },
        {
            "_id": "5bd2b94eeb7794697587e66b",
            "video": {
                "1": "data/attachments/QG63wO5joO_1552984303_1552984303.mp4",
                "2": "data/attachments/aykYaraRgp_1552984315_1552984315.mp4"
            }
        },
        {
            "_id": "5bd2ba91eb7794997c87e666",
            "video": {
                "1": "data/attachments/xjjPcYVL5J_1552984142_1552984142.mp4",
                "3": "data/attachments/QgkAkSxNN8_1552982649_1552982649.mp4"
            }
        },
        {
            "_id": "5bd2bac8eb7794697587e66c",
            "video": {
                "1": "data/attachments/SSPrD5Dhrn_1552984051_1552984051.mp4"
            }
        },
        {
            "_id": "5bd2bb24eb77945f0287e666",
            "video": {
                "1": "data/attachments/hJUUj4QO4t_1543919390_1543919390.mp4",
                "3": "data/attachments/Cl6x2M4YWd_1552983954_1552983954.mp4"
            }
        },
        {
            "_id":"5bd2bb7ceb7794600287e666",
            "video": {
                "1": "data/attachments/oPcr09IPa2_1552983756_1552983756.mp4"
            }
        },
        {
            "_id": "5bd2bc05eb7794997c87e667",
            "video": {
                "1": "data/attachments/cLvACBOIFF_1552979595_1552979595.mp4",
                "3": "data/attachments/Z5JJ4iRKNe_1552978982_1552978982.mp4"
            }
        },
        {
            "_id": "5bd2bcd4eb7794c30987e666",
            "video": {
                "2": "data/attachments/hKIdF0A2V6_1552979870_1552979870.mp4",
                "4": "data/attachments/KfbDlKZjfc_1552983605_1552983605.mp4"
            }
        },
        {
            "_id":"5bd2bd04eb7794d10a87e666",
            "video": {
                "3": "data/attachments/hP1jyA4nXT_1552983495_1552983495.mp4"
            }
        },
        {
            "_id":"5bf8e68100d44f6e070feb65",
            "video": {
                "1": "data/attachments/vB3g5ILGXZ_1552984734_1552984734.mp4",
                "2": "data/attachments/ZoggguLYqL_1552984738_1552984738.mp4"
            }
        },
        {
            "_id":"5bf8e75000d44f4f0e0feb65",
            "video": {
                "1": "data/attachments/DDkpJ4C6WB_1552984324_1552984324.mp4",
                "2": "data/attachments/YjIM2ItwzN_1552984336_1552984336.mp4"
            }
        },
        {
            "_id": "5bf8e7b800d44f6f070feb65",
            "video": {
                "1": "data/attachments/wQqS39axBd_1543038904_1543038904.mp4",
                "2": "data/attachments/mIrwhFkURv_1543038919_1543038919.mp4",
                "3": "data/attachments/hS5CugtcBK_1543038932_1543038932.mp4",
                "4": "data/attachments/V8Bl0Evac6_1543038976_1543038976.mp4"
            }
        },
        {
            "_id":"5bf8e86c00d44f3a270feb65",
            "video": {
                "1": "data/attachments/5H2m8qDT36_1552984155_1552984155.mp4",
                "3": "data/attachments/cMyBkjscQH_1552984167_1552984167.mp4"
            }
        },
        {
            "_id": "5bf8e8f300d44f7b090feb65",
            "video": {
                "1": "data/attachments/xfwQXxEPeg_1552984060_1552984060.mp4"
            }
        },
        {
            "_id": "5bf8e96e00d44f4f0e0feb66",
            "video": {
                "1": "data/attachments/T8Fp5d4l4r_1543039342_1543039342.mp4",
                "3": "data/attachments/LQuv663bPe_1552983964_1552983964.mp4"
            }
        },
        {
            "_id": "5bf8ec4e00d44f7b090feb66",
            "video": {
                "1": "data/attachments/ORHBZdBdHV_1552983777_1552983777.mp4"
            }
        },
        {
            "_id":"5bf8ecd500d44f50260feb65",
            "video": {
                "1": "data/attachments/MNFutlsUGG_1552983681_1552983681.mp4",
                "3": "data/attachments/xW99b1Ch6K_1552983691_1552983691.mp4"
            }
        },
        {
            "_id": "5bf8ed4c00d44f510e0feb65",
            "video": {
                "2": "data/attachments/rrrvf6i5qG_1543040333_1543040333.mp4",
                "4": "data/attachments/Zdtk8w0TjR_1552983614_1552983614.mp4"
            }
        },
        {
            "_id": "5bf8ed8f00d44f4f0e0feb67",
            "video": {
                "3": "data/attachments/lXvceQMyIk_1552983508_1552983508.mp4"
            }
        }
    ];
    var video='';
    var categoryId='';
    var updateResult=[];
    for(var i=0;i<categoryData.length;i++)
    {
        video=categoryData[i].video;
        categoryId=categoryData[i]._id;
        updateResult.push(await tables.categoryTable.updateWithPromises({"video":video},{"_id":categoryId}));
    }
    res.send(updateResult);
});
router.get('/update-stylist',async function(req,res)
{
    var vendors= await tables.vendorTable.findFieldsWithPromises({},{"first_name":1,"last_name":1,"_id":1});
    var vendorUpdate=[];
    var vendorId='';
    var name={};
    var firstName='';
    var lastName='';
    for(var i=0;i<vendors.length;i++)
    {
        vendorId=vendors[i]['_id'];

        if(vendors[i].first_name!=undefined)
        {
            name={};
            for(var l in vendors[i].first_name)
            {
               if(l!="undefined")
               {
                   name[l]=vendors[i].first_name[l]+' '+vendors[i].last_name[l];
               }
            }

            await  tables.vendorTable.updateWithPromises({"name":name},{_id:vendorId});
            vendorUpdate.push({"name":name,"vendor_id":vendorId});
        }

    }

    res.send(vendorUpdate);
});
router.get('/update-city',function(req,res){

    var subCities=  [
        {
            "sub_city_name" : {
                "ar" : "دورال",
                "de" : "Doral",
                "tr" : "Doral",
                "en" : "Doral"
            },
            "status" : 1

        },
        {
            "sub_city_name" : {
                "ar" : "هياليه",
                "de" : "Hialeah",
                "tr" : "Hialeah",
                "en" : "Hialeah"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "كنوها]",
                "de" : "Kanawha",
                "tr" : "Kanawha",
                "en" : "Kanawha"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "منزل",
                "de" : "Heimstätte",
                "tr" : "toprak parçası",
                "en" : "Homestead"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "أوبا لوكا",
                "de" : "Opa-locka",
                "tr" : "Opa-Locka",
                "en" : "Opa-locka"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "شاطئ ميامي",
                "de" : "Miami Beach",
                "tr" : "Miami sahili",
                "en" : "Miami Beach"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "مفتاح بيسكاين",
                "de" : "Key Biscayne",
                "tr" : "Anahtar Biscayne",
                "en" : "Key Biscayne"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "شمال ميامي",
                "de" : "North Miami",
                "tr" : "Kuzey miami",
                "en" : "North Miami"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "شمال ميامي بيتش",
                "de" : "North Miami Beach",
                "tr" : "Kuzey Miami Sahili",
                "en" : "North Miami Beach"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "Ochopee",
                "de" : "Ochopee",
                "tr" : "Ochopee",
                "en" : "Ochopee"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "ماء حلو",
                "de" : "Süßwasser",
                "tr" : "Tatlı su",
                "en" : "Sweetwater"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "مزيج",
                "de" : "Medley",
                "tr" : "Karışık",
                "en" : "Medley"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "فونتينبلو",
                "de" : "Fontainebleau",
                "tr" : "Fontainebleau",
                "en" : "Fontainebleau"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "وستشستر",
                "de" : "Westchester",
                "tr" : "Westchester",
                "en" : "Westchester"
            },
            "status" : 1
        },
        {
            "sub_city_name" : {
                "ar" : "ميامي سبرينغز",
                "de" : "Miami Springs",
                "tr" : "Miami Springs",
                "en" : "Miami Springs"
            },
            "status" : 1
        }
    ];
    tables.citiesTable.updateWithPromises({"sub_city_names":subCities},{"_id":"5d1f56452f434a3b4d28eed0"});
    tables.citiesTable.deleteCity("5d202bf72f434a3b4d28eed1");

    res.send({"succees":true});
});
   router.get('/update-service-category',async function(req,res){
          var serviceDetails=await tables.servicesTable.findFieldsWithPromises({},{"_id":1,"category_id":1});
          var categoryId='';
          var categoryType='';
       var serviceUpdate='';
       var serviceId='';
          console.log(serviceDetails);
          for(var s=0;s<serviceDetails.length;s++)
          {
              categoryId=serviceDetails[s]['category_id'];
              serviceId=serviceDetails[s]['_id'];
              var categoryDetails=await tables.categoryTable.findFieldsWithPromises({"_id":categoryId},{"service_type":1});
                 console.log(categoryDetails,categoryId);
              categoryType=categoryDetails[0]['service_type'];
              serviceUpdate=await tables.servicesTable.updateWithPromises({"service_type":categoryType},{"_id":serviceId});
          }
            res.end("updated");
   });
module.exports = router;