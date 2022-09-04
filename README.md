## QuckStart

### 单播模式
```javascript

/**
 * 发送事件
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

// 接收事件
 const { EventEmitter } = require('../../lib');

 const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1'
 
 async function main() {
   const ee = await EventEmitter.getEventEmitter(RabbitMQ_URL);
   ee.addEventListener('google.search.index', (v) => {
     console.log(v)
   })
 }
 
 main();

```

### 广播模式
```javascript

// 发送事件
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

// 接收事件
const { EventEmitter } = require('../../lib');

const ee = await EventEmitter.getEventEmitter(RabbitMQ_URL);
  ee.addEventListener(
    "google.search.index",
    (v) => {
      console.log(v);
    },
    "fanout"
  );
    
  ee.on(
    "crops.user.update",
    (v) => {
      console.log(v);
    },
    "fanout"
  );

```