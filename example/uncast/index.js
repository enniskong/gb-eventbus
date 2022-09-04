/**
 * 单播场景
 */
const { EventEmitter } = require('../../lib');

const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1'

async function main() {
  const ee = await EventEmitter.getEventEmitter(RabbitMQ_URL);
  setTimeout(() => {
    ee.emit('google.search.index', "goog.data")
  }, 2000)
}

main();