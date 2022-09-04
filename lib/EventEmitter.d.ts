import { Channel, Options } from 'amqplib';
interface Event {
    type: string;
    source: string;
    subject?: string;
}
declare type Options = string | Options.Connect;
declare class EventEmitter {
    private readonly channel;
    private readonly ee;
    private static _instance;
    constructor(channel: Channel);
    /**
     *
     * @param urlOrOption
     * @returns
     */
    static getEventEmitter(urlOrOption: Options): Promise<EventEmitter>;
    /**
     *
     * @param event
     * @param listener
     */
    on(event: string | Event, listener: (...args: any[]) => void, exchangeType?: string): Promise<void>;
    addEventListener(event: string | Event, listener: (...args: any[]) => void, exchangeType?: string): Promise<void>;
    /**
     *
     * @param event
     * @param data
     * @param exchangeType
     */
    emit<T>(event: string | Event, data: T, exchangeType?: string): Promise<void>;
    private packet;
}
export default EventEmitter;
export { Event, Options };
