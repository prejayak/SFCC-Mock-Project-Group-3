/* eslint-disable linebreak-style */
'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.extend(module.superModule);

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
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

server.append('Show', cache.applyDefaultCache, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var accountModel = getModel(req);
    var customer = CustomerMgr.getCustomerByLogin(req.currentCustomer.profile.email);
    accountModel.profile.eyeColor = customer.profile.custom.eyeColor;
    accountModel.profile.hairColor = customer.profile.custom.hairColor;
    accountModel.profile.skinType = customer.profile.custom.skinType;
    accountModel.profile.skinTone = customer.profile.custom.skinTone;
    res.render('account/accountDashboard', {
        account: accountModel
    });
    next();
});

module.exports = server.exports();

