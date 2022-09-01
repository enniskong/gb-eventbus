import EventEmitter from "./EventEmitter";


async function main() {

  const ee = await EventEmitter.getEventEmitter()

  ee.on('development-register', (args) => {
    console.log(args)
  })
  ee.on('development-register', (args) => {
    console.log(args)
  })
}

main();