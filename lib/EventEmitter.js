"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const events_1 = require("events");
const cloudevents_1 = require("cloudevents");
const EXCHANGE_NAME = 'direct.eventbus';
const FANOUT_ROUTE_KEY = '____fanout$$#__';
class EventEmitter {
    constructor(channel) {
        this.channel = channel;
        this.ee = new events_1.EventEmitter();
    }
    /**
     *
     * @param urlOrOption
     * @returns
     */
    static getEventEmitter(urlOrOption) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._instance == null) {
                const connection = yield amqplib_1.default.connect(urlOrOption);
                const channel = yield connection.createChannel();
                yield channel.assertExchange(EXCHANGE_NAME, 'direct', {
                    durable: true,
                    autoDelete: true
                });
                this._instance = new EventEmitter(channel);
            }
            return this._instance;
        });
    }
    /**
     *
     * @param event
     * @param listener
     */
    on(event, listener, exchangeType = "direct") {
        return __awaiter(this, void 0, void 0, function* () {
            let eventName = '';
            if (typeof event === 'string') {
                this.ee.on(event, listener);
                eventName = event;
            }
            else if (event instanceof EventEmitter) {
                this.ee.on(event.type, listener);
                eventName = event.type;
            }
            else {
                throw new Error('Invalid Event name');
            }
            if (exchangeType == 'direct') {
                // 单播
                yield this.channel.assertQueue(eventName, {
                    autoDelete: true
                });
                yield this.channel.bindQueue(eventName, EXCHANGE_NAME, eventName);
            }
            else if (exchangeType == 'fanout') {
                // 多播
                const { exchange } = yield this.channel.assertExchange(`fanout.eventbus.${eventName}`, 'fanout', {
                    durable: true,
                    autoDelete: true
                });
                // 随机生成队列名称
                const { queue: autoGenQueueName } = yield this.channel.assertQueue('', {
                    autoDelete: true
                });
                yield this.channel.bindQueue(autoGenQueueName, exchange, '');
                yield this.channel.bindExchange(exchange, EXCHANGE_NAME, FANOUT_ROUTE_KEY + "|" + eventName);
                eventName = autoGenQueueName;
                this.ee.on(eventName, listener);
                yield this.channel.bindQueue(eventName, exchange, eventName);
            }
            // 订阅
            this.channel.consume(eventName, msg => {
                if (msg != null) {
                    this.ee.emit(eventName, msg.content.toString());
                    this.channel.ack(msg);
                }
            });
        });
    }
    addEventListener(event, listener, exchangeType = "direct") {
        return __awaiter(this, void 0, void 0, function* () {
            this.on(event, listener, exchangeType);
        });
    }
    /**
     *
     * @param event
     * @param data
     * @param exchangeType
     */
    emit(event, data, exchangeType = "direct") {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof event === 'string') {
                // 单播可以防止丢数据
                if (exchangeType == 'direct') {
                    yield this.channel.assertQueue(event, {
                        autoDelete: true
                    });
                    yield this.channel.bindQueue(event, EXCHANGE_NAME, event);
                }
                if (exchangeType == 'direct') {
                    this.channel.publish(EXCHANGE_NAME, event, Buffer.from(JSON.stringify(this.packet(event, data))));
                }
                else if (exchangeType == 'fanout') {
                    this.channel.publish(EXCHANGE_NAME, FANOUT_ROUTE_KEY + "|" + event, Buffer.from(JSON.stringify(this.packet(event, data))));
                }
            }
        });
    }
    packet(event, data) {
        let e;
        if (typeof event === 'string') {
            e = new cloudevents_1.CloudEvent({
                type: event,
                source: 'unknown',
                data
            });
        }
        else {
            e = new cloudevents_1.CloudEvent(Object.assign(Object.assign({}, event), { data }));
        }
        return e;
    }
}
exports.default = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map