# Understanding event processing in Synaptik

Synaptik connects event handlers, channels, and processors to build event-processing flows. Each has a different responsibility, but all can be used as endpoints that receive events. This lets a flow combine filtering, transformation, and delivery without requiring each component to know how the next one is implemented.

This page explains how those pieces fit together. For constructors, configuration, and usage examples, see the [README](../../README.md).

## Events and endpoints

An [`Event`](../../src/types/event.ts) carries an identifier, type, data, and optional headers for lineage and replies. It does not specify where it should go.

Synaptik defines three kinds of event-processing components:

- An **event handler** performs an action in response to an event through `handle`.
- An **event channel** carries an event onward through `send`. Channels can also filter, process, or otherwise control delivery.
- An **event processor** returns an event through `process`, usually after transforming or enriching the input.

Each contract also accepts a compatible function in place of a component object. When a channel is configured with a downstream `handler`, that option identifies the **recipient** of the event; it does not necessarily refer to an object implementing `EventHandler`.

The receiving component must still accept the event type being sent. Interchangeable endpoints do not mean that unrelated event types can be connected arbitrarily.

## Connecting processing stages

Consider an order event that must pass a minimum-value check before being enriched and delivered:

```text
order event
    |
    v
FilterChannel
    |
    | accepted
    v
ProcessingChannel
    |
    | processed event
    v
destination
```

The filter applies its predicate and forwards accepted events. The processing channel invokes its processor and forwards the returned event. The destination receives that event and performs its own work.

The filter only needs a compatible downstream endpoint. It could forward to the processing channel shown here, a different channel, or a handler function. Changing that destination does not require changing how the filter evaluates events.

A processor's return value matters when a component explicitly uses it, as `ProcessingChannel` does. When a processor is used merely as a downstream destination, its returned event is not automatically forwarded to another stage. This distinction separates **processing an event** from **delivering an event to an endpoint**.

## Routing events to multiple destinations

Processing changes the event that subsequent stages receive. Routing selects which destinations receive an event.

An [`EventRouter`](../../src/event-router/event-router.ts) obtains destinations from a routes provider and invokes them using an execution strategy. For example, an enriched order could be sent to both fulfillment and audit handlers. The processor does not need to know which destinations are selected, and the router does not need to know how the event was enriched.

Routing and filtering serve different purposes: a filter controls whether an event continues along a path; a router selects recipients. A filter may also send rejected events to a separate endpoint, but that does not make it responsible for general route selection.

## Assembling a flow

Endpoints can be connected directly. [`FlowBuilder`](../../src/flow-builder/flow-builder.ts) offers a declarative way to compose the same kinds of components: describe processing stages and a terminal destination, then resolve the declaration into an endpoint that accepts events.

The builder assembles the flow; it does not introduce a separate event-processing mechanism. Once assembled, the constituent components still receive events, perform their responsibilities, and pass events to compatible endpoints.

## Reading a flow

To understand an unfamiliar flow, trace the event through its stages:

1. **Input:** What event type does each stage receive?
2. **Behavior:** Does it filter, transform, select destinations, or handle the event?
3. **Handoff:** Which endpoint receives the event next, and is it receiving the original event or a processor's result?

These distinctions help explain how a flow behaves without needing to inspect every component's implementation. For detailed configuration and lifecycle behavior, consult the [README](../../README.md) and public API declarations.
