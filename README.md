# Synaptik

Synaptik is a composable, transport-independent event-processing library for TypeScript. Build flows that filter, transform, route, and deliver events without coupling application logic to a particular queue, HTTP server, or messaging transport.

## A first flow

An order-processing flow can reject irrelevant orders, enrich accepted ones, and pass them to a handler:

```ts
import { Event, EventBuilder, FlowBuilder, getEventHandlerComponent } from '@sektek/synaptik';

type Order = Event<{ orderId: string; total: number }>;

const flow = new FlowBuilder<Order>()
  .filter(event => event.data.total > 0)
  .process(event => EventBuilder.from(event).create({
    total: Math.round(event.data.total * 100) / 100,
  }))
  .handle(event => {
    console.log(`Accepted ${event.data.orderId}: ${event.data.total}`);
  })
  .create();

const order = await EventBuilder.with<Order>({ type: 'order.created' })
  .create({ orderId: 'A-1', total: 42.125 });

await getEventHandlerComponent<Order>(flow)(order);
```

The flow describes **what happens** to an event. The component that supplies events and the destination that receives them can change independently. See the [FlowBuilder reference](docs/reference.md#building-pipelines-with-flowbuilder) for steps, terminals, and error behavior.

## Installation

```sh
npm install @sektek/synaptik
```

Synaptik is ESM-only. The core package exposes event and flow components; it uses [Utility Belt](https://github.com/sektek/utility-belt) for shared component contracts and supporting utilities.

## How the pieces fit

- **Events** carry an identifier, type, headers, and typed data. `EventBuilder` creates and derives events.
- **Processors** transform an event; **handlers** perform work in response to it.
- **Channels** connect steps and can add filtering, splitting, processing, tapping, or error handling.
- **Flows** assemble channels in the order events pass through them.
- **Gateways and transport adapters** bring events into or out of those flows.

Most destinations accept a function or an object implementing the corresponding endpoint contract. This makes it possible to reuse processing logic with different implementations rather than building around one transport.

## Design philosophy

Synaptik favors small, independently understandable components with explicit contracts. Compose those components into a flow, and keep business processing separate from the mechanism used to deliver events. The abstractions are optional building blocks, not a requirement to adopt an entire application framework.

## Common tasks

| Task | Starting point |
| --- | --- |
| Filter or transform events | [Channels](docs/reference.md#channels) and [FlowBuilder](docs/reference.md#building-pipelines-with-flowbuilder) |
| Split one event into several | [SplitterChannel](docs/reference.md#channels) |
| Route to one or many destinations | [Routing](docs/reference.md#routing) |
| Handle downstream failures | [ErrorTrapChannel and error propagation](docs/reference.md#channels) |
| Wait for a reply | [Request/reply](docs/reference.md#requestreply) |
| Poll a source for new events | [ProviderGateway](docs/reference.md#pulling-events-with-providergateway) |

**Error boundaries matter:** a `FilterChannel` emits errors from either branch instead of rethrowing them. In a flow, an `errorTrap` catches downstream errors, not upstream ones; put it after a filter when it must catch errors from subsequent processing. See [channel behavior](docs/reference.md#channels) and [flow ordering](docs/reference.md#building-pipelines-with-flowbuilder) before relying on an error boundary.

## Transports

The core library does not require a transport. Adapter packages connect flows to specific systems:

| Package | Integration |
| --- | --- |
| [`@sektek/synaptik-amqp`](https://github.com/sektek/synaptik-amqp) | RabbitMQ / AMQP |
| [`@sektek/synaptik-bullmq`](https://github.com/sektek/synaptik-bullmq) | BullMQ |
| [`@sektek/synaptik-express`](https://github.com/sektek/synaptik-express) | Express / HTTP |
| [`@sektek/synaptik-ws`](https://github.com/sektek/synaptik-ws) | WebSockets |

Check the adapter package for its installation instructions and supported capabilities.

## Further documentation

The [component and API reference](docs/reference.md) preserves detailed behavior, lifecycle events, defaults, concurrency and batching, lineage, request/reply caveats, and additional examples.

## License

MIT
