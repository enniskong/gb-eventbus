import amqplib, { Channel, Options } from 'amqplib';
import { EventEmitter as InternalEventEmitter } from 'events';
import { CloudEventV1, CloudEvent } from 'cloudevents'

const EXCHANGE_NAME = 'direct.eventbus';
const FANOUT_ROUTE_KEY = '____fanout$$#__';

interface Event {
  type: string;
  source: string;
  subject?: string;
  data: any;
}

type Options = string | Options.Connect;

class EventEmitter {
  private readonly ee: InternalEventEmitter;
  private static _instance: EventEmitter | undefined;
  
  constructor(private readonly channel: Channel) {
    this.ee = new InternalEventEmitter();
  }
  
  /**
   * 
   * @param urlOrOption 
   * @returns 
   */
  public static async getEventEmitter(urlOrOption: Options): Promise<EventEmitter> {
    if (this._instance == null) {
      const connection = await amqplib.connect(urlOrOption);
      const channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, 'direct', {
        durable: true,
        autoDelete: true
      });
      this._instance = new EventEmitter(channel);
    }
    return this._instance;
  }

  /**
   * 
   * @param event 
   * @param listener 
   */
  public async on(event: string | Event, listener: (...args: any[]) => void, exchangeType = "direct") {
    let eventName = '';
    if (typeof event === 'string') {
      this.ee.on(event, listener);
      eventName = event;
    } else if (event instanceof EventEmitter) {
      this.ee.on(event.type, listener);
      eventName = event.type;
    } else {
      throw new Error('Invalid Event name');
    }

    if (exchangeType == 'direct') {
      // 单播
      await this.channel.assertQueue(eventName , {
        autoDelete: true
      });
      await this.channel.bindQueue(eventName, EXCHANGE_NAME, eventName);
    } else if (exchangeType == 'fanout') {
      // 多播
      const { exchange } = await this.channel.assertExchange(`fanout.eventbus.${eventName}`, 'fanout', {
        durable: true,
        autoDelete: true
      })
      // 随机生成队列名称
      const { queue: autoGenQueueName } = await this.channel.assertQueue('', {
        autoDelete: true
      });
      await this.channel.bindQueue(autoGenQueueName, exchange, '');
      await this.channel.bindExchange(exchange, EXCHANGE_NAME, FANOUT_ROUTE_KEY + "|" + eventName);
      eventName = autoGenQueueName;
      this.ee.on(eventName, listener);
      await this.channel.bindQueue(eventName, exchange, eventName);
    }

    // 订阅
    this.channel.consume(eventName, msg => {
      if (msg != null) {
        this.ee.emit(eventName, msg.content.toString());
        this.channel.ack(msg);
      }
    });
  }

  public async addEventListener(event: string | Event, listener: (...args: any[]) => void, exchangeType = "direct") {
    this.on(event, listener, exchangeType);
  }

  /**
   * 
   * @param event 
   * @param data 
   * @param exchangeType 
   */
  public async emit<T>(event: string | Event, data: T, exchangeType = "direct") {
    if (typeof event === 'string') {
      // 单播可以防止丢数据
      if (exchangeType == 'direct') {
        await this.channel.assertQueue(event , {
          autoDelete: true
        });
        await this.channel.bindQueue(event, EXCHANGE_NAME, event);
      }
      if (exchangeType == 'direct') {
        this.channel.publish( EXCHANGE_NAME, event, Buffer.from(JSON.stringify(this.packet(event, data))) )
      } else if (exchangeType == 'fanout') {
        this.channel.publish( EXCHANGE_NAME, FANOUT_ROUTE_KEY + "|" + event, Buffer.from(JSON.stringify(this.packet(event, data))) )
      }
    }
  }

  private packet<T>(event: string | Event, data: T): CloudEventV1<T> | null {
    let e:CloudEventV1<T>;
    if (typeof event === 'string') {
      e = new CloudEvent<T>({
        type: event, 
        source: 'unknown', 
        data
      })
    } else {
      e = new CloudEvent<T>({
        ...event, 
        data
      })
    }
    return e
  }
}


export default EventEmitter;

export {
  Event,
  Options
}