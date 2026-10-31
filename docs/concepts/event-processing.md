# Understanding event processing in Synaptik

Synaptik treats event processing as a composition of small, independently useful endpoints. To understand a flow, it helps to separate three questions: **what information is moving**, **what happens to it at each step**, and **where it goes next**.

This explanation focuses on those relationships. For API signatures, available components, and usage examples, see the [README](../README.md).

## Events carry information; endpoints provide behavior

An [`Event`](../src/types/event.ts) carries an identifier, a type, and typed data. It can also carry lineage and reply-address headers. An event does not prescribe how it will be handled: different endpoints can receive the same event and perform different work.

An *endpoint* is something that can receive an event. Synaptik recognizes three related contracts:

- A **handler** reacts to an event through `handle`.
- A **channel** accepts an event through `send` and typically controls how it moves onward.
- A **processor** receives an event through `process` and returns a result, which can be another event.

These are distinct contracts, but they can occupy the same **destination role** in a flow. Synaptik accepts a function or an appropriate endpoint object in many destination slots. When used as a destination, the endpoint's return value is not treated as the next event in the flow.

This distinction matters: a processor's returned event is meaningful when a component explicitly uses it, as `ProcessingChannel` does. Merely placing a processor in a handler slot does not turn its return value into the next message.

## A channel owns one decision, then hands off

A channel generally adds one behavior between receiving an event and forwarding it. Consider a sequence that first filters orders and then enriches accepted orders:

```text
incoming order
     |
     v
FilterChannel -- rejected --> optional rejection destination
     |
  accepted
     v
ProcessingChannel -- processed event --> destination
```

The filter decides **whether an event proceeds on the accepted path**. It does not transform the event, and its optional rejection destination does not make it a general-purpose router.

The processing channel decides **how an accepted event changes**. It clones its input before invoking its processor and forwards the processor's result to its configured downstream destination. The filter and processing channel therefore have different responsibilities even though both accept events through `send`.

A `handler` option on a channel names that downstream recipient; it does **not** mean the recipient performs the channel's filtering or transformation. In Synaptik, “handler” can also mean the general `EventHandler` contract or an implementation of that contract. Context determines which meaning is intended.

## Routing is about choosing destinations

Filtering answers whether an event passes a predicate. **Routing** answers which destinations should receive an event.

An [`EventRouter`](../src/event-router/event-router.ts) obtains routes from a routes provider, then invokes those routes using an execution strategy. Depending on the provider, the set of destinations may be fixed or chosen for each event. A router can deliver to multiple destinations; its execution strategy determines how route invocations are scheduled.

This separates *destination selection* from *destination execution*. A routes provider determines where an event should go; the router coordinates delivery to those destinations. A filter with a rejection handler still has only a predicate and two outcomes, rather than an open-ended route-selection model.

## A flow is a composition, not a new processing primitive

[`FlowBuilder`](../src/flow-builder/flow-builder.ts) provides a way to declare a chain of behaviors without manually wiring each downstream endpoint. Its intermediate steps correspond to channel behaviors such as filtering, processing, splitting, and tapping. Terminal operations supply the eventual destination or routing behavior.

A flow declaration is distinct from a resolved flow. The builder accumulates descriptions of steps; resolving it constructs a connected endpoint chain, working backward from the terminal destination. The resulting endpoint can then receive events.

That separation makes the same composition model available whether you construct channels directly or use a builder: **each component owns its local behavior and forwards to the next recipient**.

## What this model helps you decide

When designing an event flow, first ask whether the requirement concerns the **event**, its **processing**, or its **destination**.

- If the event needs different data, use a processor in a context that forwards its result.
- If an event should continue only when a condition holds, use filtering.
- If destinations vary or an event must fan out, use routing.
- If the problem is how to assemble several such behaviors, consider a flow builder.

The point is not to prefer a particular class for every use case. It is to keep transformations, acceptance decisions, destination selection, and composition separate enough that each can be understood and changed independently.

For the concrete APIs and their edge cases—including event notifications, error propagation, and configuration—consult the [README](../README.md) and the corresponding public declarations.
