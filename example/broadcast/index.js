/**
 * 广播场景
 */
const { EventEmitter } = require('../../lib');

const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1'

async function main() {
  const ee = await EventEmitter.getEventEmitter(RabbitMQ_URL);
  setTimeout(() => {
    ee.emit('google.search.index', "google.index", 'fanout')
  }, 2000)

  setTimeout(() => {
    ee.emit('crops.user.update', {
      oldObj: {
        nickname: 'tom',
      }, 
      newObj: {
        nickname: 'jack'
      }
    }, 'fanout')
  }, 1000)
}

main();