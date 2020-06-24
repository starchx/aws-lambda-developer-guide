const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

// Create client outside of handler to reuse
const lambda = new AWS.Lambda()

const dynamo = new AWS.DynamoDB.DocumentClient();

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = async (event) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const operation = event.operation;
    const payload = event.payload;

    if (event.tableName) {
        payload.TableName = event.tableName;
    }
    
    payload.Item.id = (+ new Date()).toString();

    const seg = AWSXRay.getSegment()
    const sub = seg.addNewSubsegment(`redis-new-subsegment`)
    sub.addAnnotation('cacheget', 'test') 

    switch (operation) {
        case 'create':
            await dynamo.put(payload).promise();
            sub.close();
            return;
        case 'read':
            await dynamo.get(payload).promise();
            sub.close();
            return;
        case 'update':
            await dynamo.update(payload).promise();
            sub.close();
            return;
        case 'delete':
            await dynamo.delete(payload).promise();
            sub.close();
            return;
        case 'list':
            await dynamo.scan(payload).promise();
            sub.close();
            return;
        case 'echo':
            return payload;
        case 'ping':
            return 'pong';
        default:
            throw new Error(`Unrecognized operation "${operation}"`);
    }
};


// // Handler
// exports.handler = async function(event, context) {
//   event.Records.forEach(record => {
//     console.log(record.body)
//   })
//   console.log('## ENVIRONMENT VARIABLES: ' + serialize(process.env))
//   console.log('## CONTEXT: ' + serialize(context))
//   console.log('## EVENT: ' + serialize(event))
  
//   return getAccountSettings()
// }

// // Use SDK client
// var getAccountSettings = function(){
//   return lambda.getAccountSettings().promise()
// }

// var serialize = function(object) {
//   return JSON.stringify(object, null, 2)
// }
