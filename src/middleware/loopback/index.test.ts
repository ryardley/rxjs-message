import loopbackMiddleware from '.';
import { createConsumer, createProducer } from '../../index';

describe('Using the loopback middleware synchronously', () => {
  const { receiver, sender } = loopbackMiddleware();

  it('should send and receive messages synchronously via a loopback middleware', () => {
    const log: any[] = [];
    const producer = createProducer(sender());
    const consumer = createConsumer(receiver());

    consumer.subscribe(msg => {
      log.push(msg);
    });

    producer.next({ content: 'One' });
    producer.next({ content: 'Two' });
    producer.next({ content: 'Three' });
    producer.next({ content: 'Four' });

    expect(log).toEqual([
      { content: 'One' },
      { content: 'Two' },
      { content: 'Three' },
      { content: 'Four' }
    ]);
  });
  it('should route over the loopback middleware', () => {
    const log: any[] = [];
    const log2: any[] = [];
    const producer = createProducer(sender());
    const consumer = createConsumer(receiver({ route: 'aaaa' }));

    consumer.subscribe(msg => {
      log.push(msg);
    });
    const consumer2 = createConsumer(receiver());

    consumer2.subscribe(msg => {
      log2.push(msg);
    });
    producer.next({ content: 'One', route: 'aaaa' });
    producer.next({ content: 'Two', route: 'aaaa' });
    producer.next({ content: 'Three' });
    producer.next({ content: 'Four' });

    expect(log).toEqual([
      { content: 'One', route: 'aaaa' },
      { content: 'Two', route: 'aaaa' }
    ]);

    expect(log2).toEqual([
      { content: 'One', route: 'aaaa' },
      { content: 'Two', route: 'aaaa' },
      { content: 'Three' },
      { content: 'Four' }
    ]);
  });
});

describe('Using the loopback middleware asynchronously', () => {
  const { receiver, sender } = loopbackMiddleware({
    delay: 300
  });

  it('should send and receive messages asynchronously via a loopback middleware', done => {
    const log: any[] = [];
    const producer = createProducer(sender());
    const consumer = createConsumer(receiver());

    consumer.subscribe(msg => {
      log.push(msg);
      if (log.length === 4) {
        expect(log).toEqual([
          { content: 'One' },
          { content: 'Two' },
          { content: 'Three' },
          { content: 'Four' }
        ]);
        done();
      }
    });

    producer.next({ content: 'One' });
    producer.next({ content: 'Two' });
    producer.next({ content: 'Three' });
    producer.next({ content: 'Four' });

    expect(log).toEqual([]);
  });
});