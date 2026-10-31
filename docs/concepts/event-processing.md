# Understanding event processing in Synaptik

The key to composing a Synaptik flow is that **each component decides what to do locally, then hands events to another endpoint without depending on its concrete type**. Filtering, transforming, and choosing destinations can therefore be combined without building a component that knows the entire workflow.

This page explains that model. For concrete constructors, options, and usage examples, see the [README](../../README.md).

## Events and the components that receive them

An [`Event`](../../src/types/event.ts) is the information moving through a flow: an identifier, type, data, and optional headers for lineage or replies. The event itself does not select a processing path.

The receiving side has three related contracts:

- An **event handler** reacts to an event. Its result is not used when it serves as a downstream destination.
- An **event channel** accepts an event and may forward it, redirect it, or perform another delivery-related action.
- An **event processor** accepts an event and returns an event, typically transformed or enriched.

Although their methods differ (`handle`, `send`, and `process`), Synaptik lets a function or an appropriate component satisfy a downstream endpoint slot. A channel can therefore forward to another channel, a handler, or a processor without coupling itself to the receiver's implementation.

There is an important distinction between **calling a processor to obtain its output** and **using a processor as a destination**. A `ProcessingChannel` explicitly takes a processor's returned event and forwards that result. A processor used simply as a downstream endpoint does not automatically replace the event in the surrounding flow with its return value.

## Composition works through downstream handoff

Consider an order event that must pass a minimum-value check, be enriched, and then reach a destination:

```text
order event
    |
    v
FilterChannel -------- rejected ------> rejection destination
    |
  accepted
    v
ProcessingChannel
    |  (event returned by processor)
    v
downstream destination
```

Each stage needs to know only its own task and the endpoint to call next:

- The filter evaluates a predicate and forwards accepted events. Rejected events may go to a separate destination.
- The processing channel invokes a processor and forwards the returned event.
- The final destination reacts to or carries onward the event it receives.

Neither channel needs to know whether its next recipient is another channel, a handler object, or a compatible function. That is what makes these behaviors composable.

In channel configuration, `handler` commonly names the **downstream endpoint**, not the function that performs the channel's own work. The same word also appears in the general `EventHandler` contract; the role depends on context.

## Choosing where events go is a separate concern

A processing step determines **what event comes out**. A destination-selection step determines **who receives it**.

An [`EventRouter`](../../src/event-router/event-router.ts) asks a routes provider which destinations apply to an event. It then invokes those routes using an execution strategy. The routes provider owns selection; the router coordinates invocation. This allows one event to reach multiple destinations without making the preceding processing stages responsible for those choices.

For example, after an order has been enriched, routing might send it to both fulfillment and audit destinations. The enrichment step need not know that there are two recipients. Conversely, the routing step need not know how the order was enriched.

## Declaring a flow versus receiving events

You can connect endpoints directly, or use [`FlowBuilder`](../../src/flow-builder/flow-builder.ts) to describe a sequence of behaviors and its terminal destination.

The builder is a way to **assemble** the composition, not a different event-processing model. A declaration describes steps; resolving it produces an endpoint that can receive events. The resulting flow still consists of components performing local work and handing off to downstream endpoints.

This distinction is useful when deciding where to place behavior. Put a transformation in a processor, a conditional acceptance decision in a filter, and destination selection in a router. Use a builder when expressing their composition is clearer than wiring them individually.

## Reading a flow

When looking at an unfamiliar Synaptik flow, follow three questions:

1. **What event is entering this component?** A processor may produce a different event for subsequent stages.
2. **What decision or action belongs to this component?** Filtering, processing, routing, and final handling are different responsibilities.
3. **Which endpoint receives the event next?** The destination may itself be another composed component.

Those questions expose the flow's behavior without requiring knowledge of every concrete class involved. For component-specific behavior, configuration, event notifications, and failure handling, consult the [README](../../README.md) and the public API contracts.
