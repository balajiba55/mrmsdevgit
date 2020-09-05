 var stripe= require('stripe')('sk_test_Nsb9TURZzc8lXece9rzccnKa002YSAzi08');
module.exports=
    {
          getTheBalanceObject:function(chargeId)
          {
              return new Promise(function (resolve) {
                  stripe.charges.retrieve(
                  chargeId,
                      expand=['balance_transaction'],
                  function(err, balanceTransaction) {
                      // asynchronously called
                        return resolve(err);
                  }
              );
              });
          },
         chargeCustomer:function(amount,currency,customer){
            return new Promise(function (resolve) {

                        amount=amount*100;
                    
                stripe.charges.create({
                        amount: amount,
                        currency: currency,
                        customer:customer,
                    },
                  async  function(err, charge){
                                      return resolve(charge);
                    }
                );
            });

         },updateCustomerCard:function(cardId,customerId){
            return new Promise(function(resolve){
                stripe.customers.update(
                    customerId,
                    {default_source:cardId},
                    function(err, customer) {

                      return resolve(customer);
                    }
                );
            });
        },updateAccountCard:function(cardId,customerId)
        {
            return new Promise(function(resolve){
                stripe.customers.update(
                    customerId,
                    {default_source:cardId},
                    function(err, customer) {

                        return resolve(customer);
                    }
                );
            });
        },transferAmount:function(amount,currency,destination)
        {
            amount=amount*100;
            return new Promise(function(resolve){
            stripe.transfers.create({
                amount: amount,
                currency: currency,
                destination: destination,
            }, function(err, transfer) {

                return resolve(transfer);
            });
            });
        },deleteCard:function (accountId,cardId)
        {
            return new Promise(function(resolve){
            stripe.accounts.deleteExternalAccount(
                accountId,
                cardId,
                function(err, confirmation) {
                    // asynchronously called
                       console.log(err);
                    resolve(confirmation);
                }
            );
            });
        }
    };