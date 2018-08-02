import { Observable, Observer } from 'rxjs';
import assertChannelStructure from './assertChannelStructure';
import createChannel from './createChannel';

import {
  IRabbitReturnMessage,
  RabbitConsumerMiddlewareCreator
} from './domain';

// TODO: use a real logger
const log = console.log.bind(console); // tslint:disable-line

// Recieve messages
const createReceiver: RabbitConsumerMiddlewareCreator = channelConfig => ({
  queue,
  ...consumeConfig
}) => () => {
  // TODO: need to carefully think about error handling scenarios
  return Observable.create((observer: Observer<IRabbitReturnMessage>) => {
    createChannel(channelConfig)
      .then(channel => {
        // fix up all this promise crap
        assertChannelStructure(channel, channelConfig.declarations).then(() => {
          channel.consume(
            queue,
            msg => {
              const content = JSON.parse(msg.content.toString());
              const ack = consumeConfig.noAck
                ? (): void => undefined
                : (allUpTo: boolean = false) => channel.ack(msg, allUpTo);
              observer.next({
                ack, // ack's must be called after the consumer has finished with the message
                content
                // TODO: send message metadata too
              });
            },
            consumeConfig
          );
        });
      })
      .catch(e => log(e));
  });
};

export default createReceiver;