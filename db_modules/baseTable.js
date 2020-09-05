var customerTable = require('../db_modules/customerTable');
var styleTable = require('../db_modules/stylesTable');
var languagesTable = require('../db_modules/languagesTable');
var categoryTable = require('../db_modules/categoryTable');
var otpTable = require('../db_modules/otpTable');
var vendorTable = require('../db_modules/vendorTable');
var vendorLocationTable = require('../db_modules/vendorLocationTable');
var salonTable = require('../db_modules/salonTable');
var addressTable = require('../db_modules/addressTable');
var portfolioTable = require('../db_modules/portfolioTable');
var salonPicturesTable = require('../db_modules/salonPicturesTable');
var salonDocumentsTable = require('../db_modules/salonDocumentsTable');
var servicesTable = require('../db_modules/servicesTable');
var salonEmployeesTable = require('../db_modules/salonEmployeesTable');
var salonEmployeesServicesTable = require('../db_modules/salonEmployeeServicesTable');
var cartTable = require('../db_modules/cartTables');
var surgePriceTable = require('../db_modules/surgePriceTable');
var ratingTable = require('../db_modules/ratingTable');
var bookingsTable = require('../db_modules/bookingsTable');
var scheduleBookingTable = require('../db_modules/scheduleBookingTable');
var ordersTable = require('../db_modules/ordersTable');
var citiesTable = require('../db_modules/citiesTable');
var salonServicesTable = require('../db_modules/salonServicesTable');
var stylistServicesTable=require('../db_modules/stylistServicesTable');
var stylistExperienceTable=require('../db_modules/stylistExperienceTable');
var stylistTable=require('../db_modules/stylistTable');
var countryTable=require('../db_modules/countryTable');
var stylistDocumentsTable=require('../db_modules/stylistDocumentsTable');
var fcmTable=require('../db_modules/fcmTable');
var salonFilteredItemsTable=require('../db_modules/salonFilteredItemsTable');
var requestedServicesTable=require('../db_modules/requestedServicesTable');
var cancellationPolicyTable=require('../db_modules/cancellationPolicyTable');
var providerStatusTable=require('../db_modules/providerStatusTable');
var couponsTable=require('../db_modules/couponsTable');
var giftCardsTable=require('../db_modules/giftCardsTable');
var salonPackagesTable=require('../db_modules/salonPackagesTable');
var promotionsTable=require('../db_modules/promotionsTable');
var promoCodeTable=require('../db_modules/promoCodeTable');
var constantsTable=require('../db_modules/constantsTable');
var activityTable=require('../db_modules/activityTable');
var documentsTable=require('../db_modules/documentsTable');
var notificationsTable=require('../db_modules/notificationsTable');
var paymentcardTable=require('../db_modules/paymentcardTable');



module.exports = {
        customerTable: customerTable,
        styleTable: styleTable,
        languagesTable: languagesTable,
        categoryTable: categoryTable,
        otpTable: otpTable,
        vendorTable: vendorTable,
        vendorLocationTable: vendorLocationTable,
        salonTable: salonTable,
        addressTable: addressTable,
        portfolioTable: portfolioTable,
        salonPicturesTable: salonPicturesTable,
        salonDocuments: salonDocumentsTable,
        servicesTable: servicesTable,
        salonEmployeesTable: salonEmployeesTable,
        salonEmployeesServicesTable: salonEmployeesServicesTable,
        cartTable: cartTable,
        surgePriceTable: surgePriceTable,
        ratingTable: ratingTable,
        bookingsTable: bookingsTable,
        scheduleBookingTable: scheduleBookingTable,
        ordersTable: ordersTable,
        citiesTable: citiesTable,
        salonServicesTable: salonServicesTable,
        stylistServicesTable: stylistServicesTable,
        stylistExperienceTable: stylistExperienceTable,
        stylistTable: stylistTable,
        stylistDocumentsTable: stylistDocumentsTable,
        fcmTable:fcmTable,
        countryTable: countryTable,
        salonFilteredItemsTable: salonFilteredItemsTable,
        requestedServicesTable:requestedServicesTable,
        promoCodeTable : promoCodeTable,
        cancellationPolicyTable:cancellationPolicyTable,
        providerStatusTable:providerStatusTable,
        couponsTable:couponsTable,
        giftCardsTable:giftCardsTable,
    salonPackagesTable:salonPackagesTable,
    promotionsTable:promotionsTable,
    constantsTable:constantsTable,
    activityTable:activityTable,
        documentsTable:documentsTable,
        notificationsTable:notificationsTable,
        paymentcardTable:paymentcardTable
    };