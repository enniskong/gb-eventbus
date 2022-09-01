import Koa from 'koa';
import EventEmitter from "./EventEmitter";

const App = new Koa(); 


App.use(async (ctx) => {
  const ee = await EventEmitter.getEventEmitter();
  const data = {
    nickname: 'google.developer'
  }
  await ee.emit('development-register', data)
})


export default App;