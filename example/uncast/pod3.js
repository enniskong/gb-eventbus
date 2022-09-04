/**
 * 单播场景
 */
 const { EventEmitter } = require('../../lib');

 const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1'
 
 async function main() {
   const ee = await EventEmitter.getEventEmitter(RabbitMQ_URL);
   ee.addEventListener('google.search.index', (v) => {
     console.log(v)
   })
 }
 
 main();