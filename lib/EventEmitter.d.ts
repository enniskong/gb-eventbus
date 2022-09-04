import { Channel, Options } from 'amqplib';
interface Event {
    type: string;
    source: string;
    subject?: string;
    data: any;
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
    on(event: string | Omit<Event, 'data'>, listener: (...args: any[]) => void, exchangeType?: string): Promise<void>;
    addEventListener(event: string | Omit<Event, 'data'>, listener: (...args: any[]) => void, exchangeType?: string): Promise<void>;
    /**
     *
     * @param event
     * @param data
     * @param exchangeType
     */
    emit<T>(event: string | Omit<Event, 'data'>, data: T, exchangeType?: string): Promise<void>;
    private packet;
}
export default EventEmitter;
export { Event, Options };
