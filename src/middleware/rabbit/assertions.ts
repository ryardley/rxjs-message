// tslint:disable:no-console
import { Channel } from 'amqplib';

import {
  IRabbitBinding,
  IRabbitDeclarations,
  IRabbitExchange,
  IRabbitQueue,
  IRabbitQueueFull
} from './domain';

export function enrichQueue(queueOrString: IRabbitQueue): IRabbitQueueFull {
  return typeof queueOrString === 'string'
    ? {
        exclusive: true,
        name: queueOrString
      }
    : queueOrString;
}

function enrichBinding(binding: IRabbitBinding) {
  const {
    arguments: args,
    destination = '',
    pattern = '',
    source,
    type = 'queue'
  } = binding;
  return {
    arguments: args, // TODO fix this
    destination,
    pattern,
    source,
    type
  };
}

export function containsQueue(array: IRabbitQueue[] = [], queue: IRabbitQueue) {
  array.find(item => enrichQueue(item).name === enrichQueue(queue).name);
}

export async function assertQueue(channel: Channel, queue: IRabbitQueue) {
  const { name, ...opts } = enrichQueue(queue);
  return channel.assertQueue(name, opts);
}

export async function assertQueues(channel: Channel, queues: IRabbitQueue[]) {
  return Promise.all(queues.map(queue => assertQueue(channel, queue)));
}

export async function assertExchanges(
  channel: Channel,
  exchanges: IRabbitExchange[]
) {
  return Promise.all(
    exchanges.map(({ name, type, ...opts }) => {
      return channel.assertExchange(name, type, opts);
    })
  );
}

export async function assertIfAnonymousQueue(channel: Channel, queue: string) {
  if (queue !== '') {
    return queue; // assume this already exists
  }

  const serverResponse = await assertQueue(channel, queue);
  return serverResponse.queue;
}

export function assertBindings(
  channel: Channel,
  bindings: IRabbitBinding[],
  defaultQueue: string
) {
  return Promise.all(
    bindings
      .map(enrichBinding)
      .map(({ arguments: args, destination, pattern, source, type }) => {
        const dest = destination || defaultQueue;
        const func = {
          exchange: channel.bindExchange.bind(channel),
          queue: channel.bindQueue.bind(channel)
        }[type];
        return func(dest, source, pattern, args);
      })
  ).catch(e => {
    throw e;
  });
}

export async function assertDeclarations(
  channel: Channel,
  declarations: IRabbitDeclarations
) {
  const { queues = [], exchanges = [] } = declarations;
  return Promise.all([
    assertQueues(channel, queues),
    assertExchanges(channel, exchanges)
  ]);
}