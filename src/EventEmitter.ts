import amqplib, { Channel, Connection } from 'amqplib';
import { EventEmitter as InternalEventEmitter } from 'events';

const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1:5672';
const MASTER_EXCHANGE = 'amp.direct.eventbus';
const FANOUT_EXCHANGE = 'amp.fanout.eventbus';


interface Event {
  type: string;
  source: string;
  subject?: string;
  data: any;
}

class EventEmitter {
  private readonly ee: InternalEventEmitter;
  private static _instance: EventEmitter | undefined;
  
  constructor(private readonly channel: Channel) {
    this.ee = new InternalEventEmitter();
  }
  
  public static async getEventEmitter(): Promise<EventEmitter> {
    if (this._instance == null) {
      const connection = await amqplib.connect(RabbitMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange(MASTER_EXCHANGE, 'direct');
      await channel.assertExchange(FANOUT_EXCHANGE, 'fanout');
      await channel.bindExchange(FANOUT_EXCHANGE, MASTER_EXCHANGE, '');                                                                                                                    
      this._instance = new EventEmitter(channel);
    }
    return this._instance;
  }

  /**
   * 
   * @param event 
   * @param listener 
   */
  public async on(event: string | Event, listener: (...args: any[]) => void, ) {
    let queue = '';

    if (typeof event === 'string') {
      this.ee.on(event, listener);
      queue = event;
    } else if (event instanceof EventEmitter) {
      this.ee.on(event.type, listener);
      queue = event.type
    } else {
      throw new Error('Invalid Event name')
    }


    await this.channel.assertQueue(queue);
    await this.channel.bindQueue(queue, MASTER_EXCHANGE, queue);

    this.channel.consume(queue, msg => {
      if (msg != null) {
        this.ee.emit(queue, msg.content.toString());
        this.channel.ack(msg);
      }
    });
  }

  public async emit(event: string | Event, data: any) {
    if (typeof event === 'string') {
      await this.channel.assertQueue(event);
      await this.channel.bindQueue(event, MASTER_EXCHANGE, event);
      this.channel.publish(MASTER_EXCHANGE, event, Buffer.from(JSON.stringify(data)))
    }
  }
}


export default EventEmitter;

export {
  Event
}