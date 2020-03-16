'use strict';

const {Contract} = require('fabric-contract-api');

class UsersContract extends Contract{

    constructor(){
        super('org.property-registration-network.regnet-users');
        global.usersOrg = 'users.property-registration-network.com';
        
    }

    async instantiate(ctx){
    console.log('User regnet smart contract instantiated');
    }

    async requestNewUser(ctx, name, email, phoneNumber, adhaarNumber){
    let initiatorID = ctx.clientIdentity.getX509Certificate();
            if(initiatorID.issuer.organizationName.trim() !== usersOrg){
    
                throw new Error('This function can be called only by an authorized user')
            }
            //Create a composite key for the new request
            let requestKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
    
            let requestObject ={
                requestID: requestKey,
                name: name,
                email: email,
                phoneNumber: phoneNumber,
                adhaarNumber: adhaarNumber,
                createdAt: new Date(),
            }
    
            // Convert the JSON object to a buffer and store it on blockchain
            let dataBuffer = Buffer.from(JSON.stringify(requestObject));
            await ctx.stub.putState(requestKey, dataBuffer);
    
            return requestObject;
    }

    async viewUser(ctx, name, adhaarNumber){
    let userKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
    
            let userBuffer = await ctx.stub
                .getState(userKey)
                .catch(err=>console.log(err));
    
                const userObject = JSON.parse(userBuffer.toString());
    
            return userObject;
    }
    
    async rechargeAccount(ctx, name, adhaarNumber, bankTransactionID){

    let initiatorID = ctx.clientIdentity.getX509Certificate();
            if(initiatorID.issuer.organizationName.trim() !== usersOrg){
    
                throw new Error('This function can be called only by an authorized user')
            }
            let userKey1 = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
            
            let uC =0;
            if(bankTransactionID === "upg100")
                uC = 100;
            else if(bankTransactionID === 'upg500')
                uC = 500;
            else if(bankTransactionID === 'upg1000')
                uC = 1000;
            else
                throw new Error('Bank Transaction ID is invalid'+ bankTransactionID);
            
            let userBuffer1 = await ctx.stub
                .getState(userKey1)
                .catch(err=>console.log(err));
    
            let userObject1 = JSON.parse(userBuffer1.toString());
    
            if(userBuffer1.length === 0){
                throw new Error('User does not exist');
            }
            else{
                    userObject1.upgradCoins= userObject1.upgradCoins + uC;
                }
                let dataBuffer1 = Buffer.from(JSON.stringify(userObject1));
                await ctx.stub.putState(userKey1, dataBuffer1);

                return userObject1;
    }
    
    async propertyRegistrationRequest(ctx, name, adhaarNumber, propertyId, price){
    let initiatorID = ctx.clientIdentity.getX509Certificate();
    if(initiatorID.issuer.organizationName.trim() !== usersOrg){

        throw new Error('This function can be called only by an authorized user')
    }

    let userKey= ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
    let propertyRequestKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.property',[propertyId] );

    let userBuffer = await ctx.stub
    .getState(userKey)
    .catch(err=>console.log(err));

    if(userBuffer.length===0){
        throw new Error('Invalid user'+ name);
    }
    else{
        let propertyRequestObject ={
            propertyId: propertyRequestKey,
            owner: userKey,
            price: price,
            status: 'registered',
        }

        let dataBuffer= Buffer.from(JSON.stringify(propertyRequestObject));
        await ctx.stub.putState(propertyRequestKey, dataBuffer);

        return propertyRequestObject;
    }
    }
    
    async viewProperty(ctx, propertyId){
    let propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.property',[propertyId]);
    
    let propertyBuffer = await ctx.stub
        .getState(propertyKey)
        .catch(err=> console.log(err));

    let propertyObject = JSON.parse(propertyBuffer.toString());

    if(propertyObject.length === 0){
        throw new Error('Property does not exist on the ledger');
    }
    else{
        return propertyObject;
    }
    }

    async updateProperty(ctx, name, adhaarNumber, propertyId, status){
    let initiatorID = ctx.clientIdentity.getX509Certificate();
    if(initiatorID.issuer.organizationName.trim() !== usersOrg){

        throw new Error('This function can be called only by an authorized user')
    }
    let owner= ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
    let propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.property',[propertyId]);

    let propertyBuffer1 = await ctx.stub
        .getState(propertyKey)
        .catch(err=> console.log(err));

    let propertyObject = JSON.parse(propertyBuffer1.toString());

    if(propertyObject.owner !== owner){
        throw new Error('Invalid user:'+ name+'is not owner of the property');
    }
    else{
       propertyObject.status = status;
        }
    
    let propertyBuffer = Buffer.from(JSON.stringify(propertyObject));

    await ctx.stub.putState(propertyKey, propertyBuffer);

    return propertyObject;
    }

    async purchaseProperty(ctx, name, adhaarNumber, propertyId){
    let initiatorID = ctx.clientIdentity.getX509Certificate();
    if(initiatorID.issuer.organizationName.trim() !== usersOrg){

        throw new Error('This function can be called only by an authorized user')
    }
    let propertyKey1 = ctx.sub.createCompositeKey('org.property-registration-network.com.regnet.property',[propertyId]);
    let buyerKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);

    let propertyBuffer1 = await ctx.stub
        .getState(propertyKey1)
        .catch(err=>console.log(err));

    let propertyObject = JSON.parse(propertyBuffer1.toString());

    let sellerkey = propertyObject.owner;            
    
    let sellerBuffer = await ctx.stub
        .getState(sellerkey)
        .catch(err=>console.log);

    let sellerObject = JSON.parse(sellerBuffer.toString());

    let buyerBuffer = await ctx.stub 
        .getState(buyerKey)
        .catch(err=>console.log(err));

    let buyerObject = JSON.parse(userBuffer.toString());

    if(buyerBuffer.length===0){
        throw new Error('User'+ name+ 'with adhaar number'+ adhaarNumber+'not registere on the property registration network');
    }
    if(propertyObject.status === 'registered'){
        throw new Error('Property'+propertyId+'not for sale.Please contact owner');
    }
    if(buyerObject.upgradCoins < property.price){
        throw new Error('Either initiator has insufficient balance or property is not for sale.');
    }
    else{

       propertyObject.owner = buyerKey;
       propertyObject.status = 'registered';
       sellerObject.upgradCoins+=propertyObject.price;
       buyerObject.upgradCoins-=propertyObject.price;
    
    let propertyBuffer2 = Buffer.from(JSON.stringify(propertyObject));
    await ctx.stub.putState(propertyKey, propertyBuffer2);

    let sellerBuffer = Buffer.from(JSON.stringify(sellerObject));

    await ctx.stub.putState(sellerkey, sellerBuffer);
        
    let buyerBuffer = Buffer.from(JSON.stringify(buyerObject));

    await ctx.stub.putState(buyerKey, buyerBuffer);

    }
    }
}



module.exports= UsersContract;

