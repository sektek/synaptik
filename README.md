# Synaptik

Event library for `@sektek` projects: a transport-neutral `Event` type plus
the channels, handlers, routers and pipeline builders used to move events
between components, and between systems.

## Installation

```sh
npm install @sektek/synaptik
```

The package is ESM only and everything is exported from the package root:

```ts
import { EventBuilder, FlowBuilder, FilterChannel } from '@sektek/synaptik';
```

Synaptik builds on [`@sektek/utility-belt`](https://github.com/sektek/utility-belt),
which supplies the component pattern, execution strategies, stores and
loggers used throughout.

## Contents

- [Core concepts](#core-concepts)
  - [Events and `EventBuilder`](#events-and-eventbuilder)
  - [Endpoints](#endpoints)
  - [Lifecycle events](#lifecycle-events)
- [Channels](#channels)
- [Handlers](#handlers)
- [Routing](#routing)
- [Request/reply](#requestreply)
- [Building pipelines with `FlowBuilder`](#building-pipelines-with-flowbuilder)
- [Pulling events with `ProviderGateway`](#pulling-events-with-providergateway)
- [Transports](#transports)
- [License](#license)

## Core concepts

### Events and `EventBuilder`

An `Event` is a plain object with a few headers and a typed `data` payload:

```ts
type Event<T = Record<string, unknown>> = {
  id: string; // UUID, generated for you
  parentId?: string; // the event this one was derived from
  replyTo?: string[]; // reply addresses for request/reply
  type: string;
  data: T;
};
```

`EventBuilder` creates events and derives new ones from existing ones. Every
builder method returns a new builder, so a configured builder can be shared.

```ts
import { Event, EventBuilder } from '@sektek/synaptik';

type OrderEvent = Event<{ orderId: string; total: number }>;

const orders = EventBuilder.with<OrderEvent>({
  type: 'order.created',
  defaults: { total: 0 },
});

const order = await orders.create({ orderId: 'A-1', total: 40 });
// { id: '52fe…', type: 'order.created', data: { orderId: 'A-1', total: 40 } }
```

Deriving events keeps their lineage: `parentId` is set to the source event's
`id` (or kept, if the source already has one).

```ts
// Same type, deep-copied data, new id, parentId = order.id
const copy = await EventBuilder.clone(order);

// Start from an existing event and change some data
const corrected = await EventBuilder.from(order).create({ total: 44 });

// Set headers
const request = await EventBuilder.with({ type: 'lookup' })
  .withHeaders({ replyTo: ['inbox'] })
  .create();
```

`EventBuilder.create(data?)` is shorthand for building a plain `'Event'`.

### Endpoints

Anything that accepts an event is an _endpoint_. There are three flavours,
distinguished only by the name of the method:

| Interface        | Method                     | Used for                                |
| ---------------- | -------------------------- | --------------------------------------- |
| `EventHandler`   | `handle(event)`            | Doing something in response to an event |
| `EventChannel`   | `send(event)`              | Carrying an event to the next component |
| `EventProcessor` | `process(event)` → `Event` | Transforming or enriching an event      |

Each also has a function form (`EventHandlerFn`, `EventChannelFn`,
`EventProcessorFn`) and a `*Component` type accepting either. Every option in
this library that takes an endpoint accepts both, so a plain function is
always enough:

```ts
const channel = new FilterChannel<OrderEvent>({
  filter: event => event.data.total > 10,
  handler: (event: OrderEvent) => save(event), // a function…
  rejectionHandler: otherChannel, // …or any channel, handler or processor
});
```

`getEventHandlerComponent` resolves any endpoint to a single callable
function, looking for `send`, then `process`, then `handle`. It's what the
library uses internally, and it's the easiest way to call a channel, a
processor or a flow result the same way:

```ts
import { getEventHandlerComponent } from '@sektek/synaptik';

const deliver = getEventHandlerComponent<OrderEvent>(channel);
await deliver(order);
```

When you pass a function where several endpoint kinds are accepted
(`handler`, `rejectionHandler`, the routes of a router), annotate its
parameter, as above: TypeScript can't infer it from the union.

The same event can therefore flow through a channel, a processor or a bare
function interchangeably. Return values from handlers are ignored when an
endpoint is used as a destination.

### Lifecycle events

Every component is an `EventEmitter` with a `name`. Most also take an
optional `loggerProvider` (both come from `AbstractComponent` in
utility-belt); the Null Objects, `NullHandler` and `NullChannel`, take no
options. Components report what they do through emitted events, so you can observe a
pipeline without changing it:

| Event             | Constant          | Emitted when                                     |
| ----------------- | ----------------- | ------------------------------------------------ |
| `event:received`  | `EVENT_RECEIVED`  | The component accepts an event                   |
| `event:processed` | `EVENT_PROCESSED` | A processor or handler finished its work         |
| `event:delivered` | `EVENT_DELIVERED` | The event was passed on to the next endpoint     |
| `event:error`     | `EVENT_ERROR`     | Something failed; listeners get `(error, event)` |

```ts
import { EVENT_ERROR, EVENT_DELIVERED } from '@sektek/synaptik';

channel.on(EVENT_DELIVERED, event => console.log('delivered', event.id));
channel.on(EVENT_ERROR, (error, event) => console.error(event?.id, error));
```

Most components emit `event:error` with `(error, event)`, but failures that
aren't tied to one event (a gateway's failed poll, a `PromiseChannel`
timing out) are emitted with the error alone, so treat `event` as optional in
listeners.

Use the exported constants rather than the raw strings. Some components emit
additional events; those are listed with each component below.

## Channels

A channel is an `EventChannel`: you `send` it an event. Most channels wrap a
downstream `handler` (any endpoint) and add one behaviour on the way.

| Channel             | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `FilterChannel`     | Passes events matching a `filter` to `handler`, others to `rejectionHandler` |
| `ProcessingChannel` | Runs an event through a `processor` and sends the result to `handler`        |
| `SplitterChannel`   | Splits one event into many with a `splitter` and sends each to `handler`     |
| `TapChannel`        | Runs a side-effect `tapHandler`, then passes the original event to `handler` |
| `ErrorTrapChannel`  | Catches errors thrown by `handler` and passes them to an `errorHandler`      |
| `CollectorChannel`  | Adds events to a utility-belt `Collector`                                    |
| `StoreChannel`      | Writes events to a utility-belt `Store`                                      |
| `PromiseChannel`    | Hands an event to whoever is waiting on `get()`                              |
| `NullChannel`       | Accepts events and does nothing                                              |

Options not shown below are inherited: `name` and `loggerProvider`.

```ts
import {
  ErrorTrapChannel,
  EventBuilder,
  FilterChannel,
  ProcessingChannel,
  TapChannel,
} from '@sektek/synaptik';

const filtered = new FilterChannel<OrderEvent>({
  filter: event => event.data.total > 10,
  handler: (event: OrderEvent) => fulfil(event),
  rejectionHandler: (event: OrderEvent) => discard(event), // optional, defaults to NullHandler
});

const doubled = new ProcessingChannel<OrderEvent>({
  processor: event =>
    EventBuilder.from(event).create({ total: event.data.total * 2 }),
  handler: (event: OrderEvent) => fulfil(event),
});

const audited = new TapChannel<OrderEvent>({
  tapHandler: event => audit(event),
  handler: (event: OrderEvent) => fulfil(event),
});

const safe = new ErrorTrapChannel<OrderEvent>({
  handler: (event: OrderEvent) => fulfil(event),
  errorHandler: (error, event) => report(error, event),
});
```

Behaviours worth knowing:

- **`FilterChannel`** emits `event:accepted` or `event:rejected`. Errors from
  either branch are emitted as `event:error` and **not** rethrown.
- **`ProcessingChannel`** clones the event before processing (so the
  processor can't mutate the caller's copy and the result carries a
  `parentId`, if the processor derives its output from that clone, as
  `EventBuilder.from` does). Supply `cloner` to change how. Errors from the
  processor are emitted and rethrown.
- **`TapChannel`** rethrows tap errors by default, so a failing audit stops
  delivery. Set `rethrow: false` to log and carry on.
- **`ErrorTrapChannel`** swallows errors by default (`rethrow: false`).
  Without an `errorHandler` it only emits `event:error`.
- **`SplitterChannel`** takes a `splitter` function (or an object with
  `split`) that returns an `Iterable` or `AsyncIterable` of events. Splits are
  collected into batches of `batchSize` (default `20`) and each batch is run
  with an `executionStrategy` (default: parallel). It emits
  `event:batch:received` and `event:batch:delivered`, and rethrows errors.
- **`StoreChannel`** keys by `event.id` unless you supply a `keyProvider`.
- **`PromiseChannel`** is single-use: see below.

```ts
const items = new SplitterChannel<
  Event<{ items: string[] }>,
  Event<{ item: string }>
>({
  splitter: async function* (event) {
    for (const item of event.data.items) {
      yield await EventBuilder.with<Event<{ item: string }>>({ type: 'item' })
        .from(event)
        .create({ item });
    }
  },
  handler: (event: Event<{ item: string }>) => process(event),
  batchSize: 2,
});
```

### `PromiseChannel`

`PromiseChannel` is a bridge for asynchronous hand-off. One side `await`s
`get()`; the other `send`s the event that completes it. Sending an `Error`
rejects the promise instead.

```ts
const channel = new PromiseChannel<OrderEvent>({ timeout: 5_000 });

const pending = channel.get(); // rejects with 'Promise timed out' 5 s from now
// … elsewhere …
await channel.send(order);

const received = await pending; // === order
```

A second `send` throws `Promise already resolved`. `timeout` is in
milliseconds and the clock starts when `get()` is called, not when the channel
is created; `0` (the default) waits forever. `channel.state` reports
`pending`, `fulfilled` or `rejected`.

## Handlers

A handler is an `EventHandler`: you call `handle`. For a plain callback you
don't need a class; a function is a handler. Two classes cover common cases:

- **`MutatorHandler`** writes each event into a utility-belt `Mutator`: an
  object with `set(key, value)` (such as a `Store` or a `Map`), or a plain
  `(key, value)` function. Extract the key and value with `keyExtractor` and
  `valueExtractor`; they default to the event's `id` and the event itself.
- **`NullHandler`** does nothing (but still emits `event:received`). It is the
  Null Object default for optional handler slots such as
  `FilterChannel.rejectionHandler`. `NullHandlerFn` is its function form.

```ts
const remember = new MutatorHandler<OrderEvent, string, number>({
  mutator: (orderId, total) => totals.set(orderId, total),
  keyExtractor: event => event.data.orderId,
  valueExtractor: event => event.data.total,
});
```

## Routing

`EventRouter` is a channel that sends each event to zero or more routes. It
asks a _routes provider_ for the routes that apply to the event, then runs
them with an `executionStrategy` (default: parallel). Strategies come from
utility-belt, so you can run routes serially, with bounded concurrency, or
round-robin.

```ts
import { EventRouter, StaticRoutesProvider } from '@sektek/synaptik';
import { serialExecutionStrategy } from '@sektek/utility-belt';

// Fan out to every route
const fanOut = new EventRouter<OrderEvent>({
  routesProvider: new StaticRoutesProvider({
    routes: [
      (event: OrderEvent) => bill(event),
      (event: OrderEvent) => ship(event),
    ],
  }),
});

// Or run them one after another
const inOrder = new EventRouter<OrderEvent>({
  routesProvider: new StaticRoutesProvider({ routes: [bill, ship] }),
  executionStrategy: serialExecutionStrategy,
});
```

The provided routes providers:

| Provider                       | Behaviour                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `StaticRoutesProvider`         | Always returns the same routes. Requires at least one.                                            |
| `NamedRoutesProvider`          | A `routeDecider` returns one or more route names; a `routeProvider` resolves each name to a route |
| `SingleUseNamedRoutesProvider` | Like `NamedRoutesProvider`, but looks routes up in a `Store` and deletes each after use           |

For named routes, an event whose names resolve to nothing goes to
`defaultRoute` (a `NullChannel` unless you set one), so unknown names are
dropped quietly rather than failing.

```ts
const routes = new Map([
  ['billing', (event: OrderEvent) => bill(event)],
  ['shipping', (event: OrderEvent) => ship(event)],
]);

const router = new EventRouter<OrderEvent>({
  routesProvider: new NamedRoutesProvider<OrderEvent>({
    routeDecider: async event => (event.data.total > 10 ? 'billing' : 'other'),
    routeProvider: async name => routes.get(name),
    defaultRoute: (event: OrderEvent) => log(event), // optional
  }),
});
```

`routeDecider` may return a single name or an array of names. Any object
with a `values(event)` method returning routes can act as a routes provider
too, which is how you build your own.

## Request/reply

`RequestReplyProcessor` turns an exchange of events into something you can
`await`. It is an `EventProcessor`: `process(request)` forwards the request to
its `handler` and resolves with the reply event.

```ts
import { RequestReplyProcessor } from '@sektek/synaptik';

const requests = new RequestReplyProcessor<OrderEvent, OrderEvent>({
  handler: outbound, // any endpoint that eventually gets a reply back to us
});

const reply = await requests.process(order);
```

Under the hood the processor pushes the request's `id` onto its `replyTo`
array (mutating the request you passed in) and waits. Whatever answers the
request must send its response back with the `replyTo` it received, through
the processor's `channel` property:

```ts
const respond = requests.channel; // a function: call it with the response

// in the code that handles the request:
await respond({ ...response, replyTo: request.replyTo });
```

The reply is matched to the waiting caller by popping the last entry from
`replyTo`, so the response must carry it back. A reply without a `replyTo`,
or with an unknown one, is rejected with an error. This is the in-process
half; a transport adapter typically carries the request out and the response
back in. There is no built-in timeout, so a request that is never answered
waits forever. Apply your own if that can happen.

## Building pipelines with `FlowBuilder`

Wiring channels by hand nests inside-out: the last step is constructed first.
`FlowBuilder` lets you declare a pipeline in the order events flow through it
instead, and builds the channels for you.

```ts
import { FlowBuilder, getEventHandlerComponent } from '@sektek/synaptik';

const flow = FlowBuilder.with<OrderEvent>({})
  .filter(event => event.data.total > 10)
  .tap(event => audit(event))
  .process(event =>
    EventBuilder.from(event).create({ total: event.data.total + 1 }),
  )
  .handle(event => fulfil(event))
  .create();

await getEventHandlerComponent<OrderEvent>(flow)(order);
```

A flow is a chain of **steps** that ends in exactly one **terminal**:

| Step                 | Builds                                        |
| -------------------- | --------------------------------------------- |
| `filter(predicate)`  | `FilterChannel`                               |
| `process(processor)` | `ProcessingChannel` (`transform` is an alias) |
| `split(splitter)`    | `SplitterChannel`                             |
| `tap(handler)`       | `TapChannel`                                  |
| `errorTrap(handler)` | `ErrorTrapChannel`                            |

| Terminal                     | Ends the flow with                                      |
| ---------------------------- | ------------------------------------------------------- |
| `handle(handler)`            | A handler                                               |
| `outbound(channel)`          | A channel, typically a transport                        |
| `dispatch([endpoints])`      | An `EventRouter` sending to every endpoint              |
| `route(options \| provider)` | An `EventRouter` over named routes or a routes provider |

Each step takes an optional second argument with that channel's own options
(for example `.tap(audit, { rethrow: false })`). The event type follows the
pipeline: after `process` or `split` the chain is typed with the processor's
or splitter's output event.

Things to know:

- Steps are lazy. Nothing is constructed until `get()` or `create()`, which
  fold the steps right-to-left around the terminal. Those methods exist only
  after a terminal, so an unfinished flow won't compile.
- `get()` and `create()` return an `EventHandlerComponent`; wrap it with
  `getEventHandlerComponent` to call it as a function.
- Every method returns a new builder, so `FlowBuilder.with(...)` makes a
  reusable factory and the flows hanging off it are independent.
- Order matters. Each step only sees what is downstream of it, so an
  `errorTrap` catches errors from the steps and terminal after it, not
  before. `filter` swallows errors from everything after it (see
  [Channels](#channels)), so place `errorTrap` after any `filter` you want
  covered:

  ```ts
  flow.filter(isValid).errorTrap(report).process(enrich).handle(fulfil);
  ```

- Shared config goes in `with`: a `loggerProvider`, and optionally a default
  `flowName`. When the factory has a `loggerProvider`,
  `create({ flowName })` scopes the logger of every channel in the flow to
  that name, overriding any `loggerProvider` set on an individual step.
  Without a `loggerProvider`, `flowName` has no effect.

```ts
const orders = FlowBuilder.with<OrderEvent>({ loggerProvider });

const intake = orders
  .filter(isValid)
  .handle(store)
  .create({ flowName: 'Intake' });
const broadcast = orders
  .dispatch([notify, index])
  .create({ flowName: 'Broadcast' });
```

## Pulling events with `ProviderGateway`

Most gateways receive events pushed from a transport. `ProviderGateway` is
the pull-based one: it polls a provider on an interval and sends whatever it
returns to a handler. It's a good fit for polling APIs, tables or files.

```ts
import { ProviderGateway } from '@sektek/synaptik';

const gateway = new ProviderGateway<OrderEvent>({
  provider: { values: () => fetchNewOrders() }, // or a plain function
  frequency: 10_000, // poll every 10 s
  concurrency: 4, // at most 4 handlers at once
  handler: (event: OrderEvent) => fulfil(event),
});

gateway.on('gateway:started', () => console.log('polling'));

await gateway.start();
// …
await gateway.stop(); // stops polling, finishes queued events
```

| Option              | Meaning                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `provider`          | Returns an `Iterable` or `AsyncIterable` of events each poll                  |
| `frequency`         | Milliseconds between polls (default `60000`)                                  |
| `intervalProvider`  | Returns the delay before each poll; wins over `frequency`                     |
| `concurrency`       | Maximum handlers in flight: `1` is serial, `Infinity` (the default) unbounded |
| `executionStrategy` | A custom strategy; wins over `concurrency`                                    |
| `queueOptions`      | Options for the internal utility-belt `Queue`                                 |

A failing handler or provider emits `event:error` and the gateway carries on.
`start()` is idempotent. The first poll happens after one full interval, not
immediately. `stop()` cancels the wait between polls, but it still waits for a
poll that is already running and for queued events to be handled before it
resolves. The gateway emits `gateway:started` and `gateway:stopped`.

## Transports

Synaptik itself has no transport. Adapter packages translate between a
transport and `Event`, then hand off to the pipelines described above:

| Package                    | Transport                           |
| -------------------------- | ----------------------------------- |
| `@sektek/synaptik-amqp`    | RabbitMQ                            |
| `@sektek/synaptik-bullmq`  | BullMQ                              |
| `@sektek/synaptik-express` | Express (HTTP gateway)              |
| `@sektek/synaptik-ws`      | WebSockets, in the browser and Node |

## License

MIT
