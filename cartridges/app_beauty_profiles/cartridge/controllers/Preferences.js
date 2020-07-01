'use strict';

var server = require('server');
function getModel(req) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var orderModel;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var customerNo = req.currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED
    );

    var order = customerOrders.first();

    if (order) {
        var currentLocale = Locale.getLocale(req.locale.id);

        var config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country });
    } else {
        orderModel = null;
    }

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}

server.get('Profile',
		function (req, res, next) {

    var preferenceForm = server.forms.getForm('preferences');
    preferenceForm.clear();
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer = CustomerMgr.getCustomerByLogin(req.currentCustomer.profile.email);
    preferenceForm.eyecolor.selectedOption = customer.profile.custom.eyeColor;
    preferenceForm.haircolor.selectedOption = customer.profile.custom.hairColor;
    preferenceForm.skintone.selectedOption = customer.profile.custom.skinTone;
    preferenceForm.skintype.selectedOption = customer.profile.custom.skinType;
    res.render('account/preferencesProfileForm',{
    	preferenceForm : preferenceForm
    });
    next();
});

server.post('EditPreferences'
		, function (req, res, next) {

    var preferenceForm = server.forms.getForm('preferences');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
    
    
    this.on('route:BeforeComplete', function (req, res) {
	    Transaction.wrap(function () {
	        // assign values to the profile
	        var customerProfile = customer.getProfile();
	        customerProfile.custom.eyeColor = preferenceForm.eyecolor.value;
	        customerProfile.custom.hairColor = preferenceForm.haircolor.value;
	        customerProfile.custom.skinType = preferenceForm.skintype.value;
	        customerProfile.custom.skinTone = preferenceForm.skintone.value;
	    });
    });
    res.json({
        success: true,
        redirectUrl: URLUtils.url('Account-Show').toString()
    });
    next();
});

module.exports = server.exports();