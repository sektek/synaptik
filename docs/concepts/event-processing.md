# Understanding event processing in Synaptik

A Synaptik flow connects components that receive events, perform a particular operation, and optionally pass events onward. A channel might filter an incoming event, another might transform it, and a final destination might deliver it to a transport. The connections determine the path an event takes; the individual components supply the behavior at each stage.

This page explains how those responsibilities fit together. For configuration and code examples, see the [README](../../README.md).

## Follow the event, not the component names

Consider a flow that accepts orders above a minimum value, enriches them, then sends them for fulfillment:

```text
order event
    |
    v
FilterChannel -- rejected --> discard or alternate destination
    |
    | accepted order
    v
ProcessingChannel
    |
    | enriched order
    v
fulfillment destination
```

The filter evaluates the incoming order and passes accepted events to its downstream destination. The processing channel calls a processor and forwards the event it returns. Fulfillment receives the resulting event without needing to know which stages preceded it.

These are separate responsibilities. Replacing fulfillment with an HTTP-backed channel does not change the filter or processor. Replacing the processor may change the event type that fulfillment receives, so the downstream endpoint must still accept that type.

The distinction also matters when reading unfamiliar code: a **processor** returns an event, while a **channel** controls what happens to an event on its way to a destination. A processor used directly as a downstream endpoint does not automatically forward its return value. A component such as `ProcessingChannel` must explicitly use that result.

## What counts as a destination?

Synaptik has three related contracts: an [event handler](../../src/types/event-handler.ts) handles an event, an [event channel](../../src/types/event-channel.ts) sends an event, and an [event processor](../../src/types/event-processor.ts) processes an event and returns one. Their methods are named `handle`, `send`, and `process`, respectively.

Many downstream options accept any compatible endpoint, including a function. For example, a channel's `handler` option names the recipient of its output; it does not require an `EventHandler` instance. Synaptik adapts these endpoint forms to a callable function when connecting components.

This flexibility concerns *how* an event is received, not *which* events are valid. Type compatibility still applies across the connection, and the receiving endpoint's return value is not necessarily used.

## When one destination is not enough

A processing stage determines the event passed onward. Routing determines **where** an event is delivered.

An [`EventRouter`](../../src/event-router/event-router.ts) asks a routes provider for destinations and invokes the selected routes using an execution strategy. An enriched order might go to both fulfillment and audit, or to one destination selected from its contents. Neither the enrichment processor nor the selected destinations need to implement the routing logic.

A filter and a router can both affect delivery, but answer different questions: *should this event continue along this path?* versus *which destinations should receive it?*

## Building and reasoning about flows

Components can be connected directly. [`FlowBuilder`](../../src/flow-builder/flow-builder.ts) lets you describe a sequence of processing stages followed by a terminal destination in the order events will encounter them. It assembles the corresponding components into an endpoint; it does not change their event-processing contracts.

When reading or designing a flow, trace three things:

1. **Event shape:** What event does each stage accept, and does it forward the same event or a result?
2. **Destination:** Which endpoint receives the output, and can it accept that event type?
3. **Boundary:** Which stage filters, transforms, routes, or handles the event? Where would a failure affect downstream delivery?

The last question matters because composition does not imply uniform error handling. For example, [`FilterChannel`](../../src/channels/filter-channel.ts) emits an error when its predicate or destination fails but does not rethrow it, whereas [`ProcessingChannel`](../../src/channels/processing-channel.ts) rethrows processing errors. The position of a stage can therefore affect how failures propagate.

For specific channel behavior, routing configuration, and runnable examples, consult the [README](../../README.md).
