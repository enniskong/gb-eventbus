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
const RabbitMQ_URL = 'amqp://guest:guest@127.0.0.1:5672';
const MASTER_EXCHANGE = 'amp.direct.eventbus';
const FANOUT_EXCHANGE = 'amp.fanout.eventbus';
class EventEmitter {
    constructor(channel) {
        this.channel = channel;
        this.ee = new events_1.EventEmitter();
    }
    static getEventEmitter() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._instance == null) {
                const connection = yield amqplib_1.default.connect(RabbitMQ_URL);
                const channel = yield connection.createChannel();
                yield channel.assertExchange(MASTER_EXCHANGE, 'direct');
                yield channel.assertExchange(FANOUT_EXCHANGE, 'fanout');
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
    on(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            let queue = '';
            if (typeof event === 'string') {
                this.ee.on(event, listener);
                queue = event;
            }
            else if (event instanceof EventEmitter) {
                this.ee.on(event.type, listener);
                queue = event.type;
            }
            else {
                throw new Error('Invalid Event name');
            }
            yield this.channel.assertQueue(queue);
            yield this.channel.bindQueue(queue, MASTER_EXCHANGE, queue);
            this.channel.consume(queue, msg => {
                if (msg != null) {
                    this.ee.emit(queue, msg.content.toString());
                    this.channel.ack(msg);
                }
            });
        });
    }
    emit(event, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof event === 'string') {
                yield this.channel.assertQueue(event);
                yield this.channel.bindQueue(event, MASTER_EXCHANGE, event);
                this.channel.publish(MASTER_EXCHANGE, event, Buffer.from(JSON.stringify(data)));
            }
        });
    }
}
exports.default = EventEmitter;
