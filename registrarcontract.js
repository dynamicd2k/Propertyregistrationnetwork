'use strict';

const {Contract} = require('fabric-contract-api');

class RegistrarContract extends Contract{

    constructor(){
        super('org.property-registration-network.regnet-registrar')
        global.registrarOrg = 'registrar.property-registration-network.com'
    }
    
    async instantiate(ctx){
        console.log('Registrar regnet smart contract instantaited');
    }

    async approveNewUser(ctx, name , adhaarNumber){

        const initiatorID = ctx.clientIdentity.getX509Certificate();
        if(initiatorID.issuer.organizationName.trim() !== registrarOrg){
            throw new Error('This function can be called only by an authorized registrar');
        }

        const requestKey= ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);
        const userKey= ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);


        let requestBuffer = await ctx.stub
            .getState(userRequestKey)
            .catch(err=> console.log(err));

        const request= JSON.parse(requestBuffer.toString());

        if(request.length === 0 || request.adhaarNumber != adhaarNumber){
            throw new Error('Either request does not exist on the ledger or adhaarNumber is incorrect');
        }
        else{
            let UserObject ={
                requestID: requestKey,
                name: name,
                email: request.email,
                phoneNumber: request.phoneNumber,
                adhaarNumber: adhaarNumber,
                upgradCoins: 0,
                createdAt: new Date(),
            }

            let dataBuffer = Buffer.from(JSON.stringify(UserObject));

            await ctx.stub.putState(userKey, dataBuffer);
            return UserObject;
        }
    }

    async viewUser(ctx, name, adhaarNumber){

        const userKey1 = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.users',[name,adhaarNumber]);

        let userBuffer1 = await ctx.stub
            .getState(userKey1)
            .catch(err=>console.log(err));

            const userObject1 = JSON.parse(userBuffer1.toString());

        return userObject1;
    }

    async approvePropertyRegistration(ctx, propertyId){
        const initiatorID = ctx.clientIdentity.getX509Certificate();
        if(initiatorID.issuer.organizationName.trim() !== registrarOrg){

            throw new Error('This function can be called only by an authorized registrar')
        }

        const propertyRequestKey = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.property.requests',[propertyId]);
        const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.com.property',[propertyId]);
        let requestBuffer = await ctx.stub
            .getState(propertyRequestKey)
            .catch(err=>console.log(err));

        let propertyRequest= JSON.parse(requestBuffer.toString());
        

        if(propertyRequest.length ===0){
            throw new Error('Property request for property' + propertyId+'does not exist.');
        }
        else{
            let newPropertyObject={
                propertyId: propertyRequestKey,
                owner: propertyRequestObject.owner,
                price: propertyRequestObject.price,
                status: 'registered',
            }

            let dataBuffer = Buffer.from(JSON.stringify(newPropertyObject));

            await ctx.stub.putState(propertyKey, dataBuffer);

            return newPropertyObject;
        }
    }

    async viewProperty(ctx, propertyId){
        const propertyKey1 = ctx.stub.createCompositeKey('org.property-registration-network.com.regnet.property',[propertyId]);

        let propertyBuffer = await ctx.stub
            .getState(propertyKey1)
            .catch(err=> console.log(err));

        let propertyObject = JSON.parse(propertyBuffer.toString());

        if(propertyObject.length === 0){
            throw new Error('Property does not exist on the ledger');
        }
        else{
            return propertyObject;
        }

    }
}

module.exports = RegistrarContract;