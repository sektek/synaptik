# CLAUDE.md — @sektek/synaptik

Core event-driven messaging library. Provides the `Event` type, channels, routers, request/reply, and HTTP pipeline integration. All other `synaptik-*` packages depend on this.

## Commands

```bash
npm run build        # Compile (tsc -p tsconfig.build.json)
npm test             # Run all tests (mocha + tsx/esm)
npm run test:cover   # Coverage via c8

# Single test file:
npx mocha --import tsx/esm src/path/to/file.spec.ts
```

## Source layout

```
src/
  types/                          # All TypeScript interfaces
  util/                           # getEventHandlerComponent helper
  handlers/                       # NullHandler, TaskExecutionHandler, MutatorHandler
  channels/                       # All channel implementations
  event-router/                   # EventRouter, RouteStore, execution strategies
    types/                        # ExecutionStrategy, RouteProvider, RouteDecider
    execution-strategies/         # Serial, Parallel, RoundRobin
  request-reply-processor/        # RequestReplyProcessor, ReplyRouteProvider
  error-handlers/                 # CompositeEventErrorHandler
  http/                           # HttpChannel, HttpProcessor (NOT Express middleware)
  flow-builder/                   # FlowBuilder (top-down fluent pipeline DSL)
    types/                        # ChannelBuilder, FlowChain, FlowProvider, OutputOfComponent
    builders/                     # FilterChannelBuilder, ProcessingChannelBuilder, etc.
    flow-builder.ts               # FlowBuilder class (implements FlowChain)
  abstract-event-service.ts       # Base class for all services
  abstract-event-handling-service.ts
  event-builder.ts
  index.ts                        # Public API barrel
```

## Core types (`src/types/`)

### Event

```ts
type Event<T = Record<string, unknown>> = {
  id: string;          // UUID, auto-generated
  parentId?: string;   // Set when cloning via EventBuilder.from()
  replyTo?: string[];  // Reply address(es) for request/reply
  type: string;        // Event type identifier
  data: T;
};

const EmptyEvent: Event  // { id: '', type: 'Event', data: {} }
```

### Key interfaces

| Interface | Method(s) | Purpose |
|-----------|-----------|---------|
| `EventHandler<T>` | `handle(event): Promise<void>` | Consumes events |
| `EventChannel<T>` | `send(event): Promise<void>` | Delivers events |
| `EventProcessor<T, R>` | `process(event): Promise<R>` | Transforms T → R |
| `EventEndpoint<T>` | union of above | Anything that accepts an event |
| `EventPredicateFn<T>` | `(event) => boolean` | Filter predicate |
| `EventSplitterFn<T, R>` | `(event) => Iterable<R>` | Fan-out splitter |
| `EventBasedProviderFn<R, T>` | `(event) => R` | Event-driven provider |
| `EventErrorHandlerFn<T>` | `(error, event) => void` | Error handler |

### Standard events emitted by all services

| Event name | When |
|------------|------|
| `event:received` | Event accepted by `send`/`handle` |
| `event:processed` | Processing complete |
| `event:delivered` | Passed to downstream handler |
| `event:error` | Error during processing |

Channels also emit `event:accepted` / `event:rejected` (FilterChannel), `event:batch:received` / `event:batch:delivered` (SplitterChannel), `channel:stateChange` (PromiseChannel).

## Abstract base classes

**`AbstractEventService`** — extends `EventEmitter`, implements `EventService`. Auto-generates a unique name (`ClassName#N`); accepts optional `name` in constructor opts.

**`AbstractEventHandlingService<T>`** — extends `AbstractEventService`; resolves a handler from `EventEndpointComponent` via `getEventHandlerComponent()`. All handler-aware classes extend this.

## EventBuilder (`src/event-builder.ts`)

Fluent DSL for constructing events. Backed by utility-belt `ObjectBuilder`.

```ts
// Static helpers
EventBuilder.create(opts?)               // new event with uuid id
EventBuilder.clone(event)               // new id, preserves parentId chain
EventBuilder.from(event)                // copy data/headers; sets parentId
EventBuilder.with(opts)                 // new builder with defaults

// Instance (chainable)
builder.with(defaults)                  // merge data defaults
builder.withHeaders(headers)            // merge header defaults
builder.from(event)                     // copy from event (sets parentId)
builder.create(opts?)                   // build the event
```

Key rule: `from()` sets `parentId` to the source event's `id`, enabling lineage tracking.

## Handlers (`src/handlers/`)

| Class | Purpose |
|-------|---------|
| `NullHandler` | Null Object — no-op default for optional handler slots (e.g. `rejectionHandler`). Also exports `NullHandlerFn`. |
| `TaskExecutionHandler` | Executes a utility-belt `Command` in response to events. Task and context can each be static or via a provider. |
| `MutatorHandler` | Calls `Mutator.set(key, value)` on events. Key/value extracted via pluggable providers (defaults: `event.id` / event itself). |

## Channels (`src/channels/`)

All implement `EventChannel<T>`. Constructor option type follows `${ChannelName}Options`.

| Class | What it does |
|-------|-------------|
| `ProcessingChannel<T, R>` | Clones event → runs `EventProcessor<T,R>` → forwards result to handler |
| `FilterChannel<T>` | Tests predicate → routes to `handler` (pass) or `rejectionHandler` (fail, default: `NullHandler`) |
| `SplitterChannel<T, R>` | Splits one event into many via `EventSplitterFn`, batches them (default 20), executes batch with strategy, forwards each to handler |
| `TapChannel<T>` | Runs `tapHandler` as side-effect before main handler; `rethrow: true` by default |
| `CollectorChannel<T>` | Adds events into a utility-belt `Collector<T>` |
| `StoreChannel<T, K>` | Persists events to a `Store<T,K>` via configurable key provider (default: `event.id`) |
| `PromiseChannel<T>` | Bridges async handoff: one actor calls `send(event)` (reply arrives from an external source); another actor `await`s `get()` (waiting for that reply). Single-use. Optional `timeout` (ms). |
| `ErrorTrapChannel<T>` | Wraps handler; catches errors, invokes `errorHandler`, swallows by default (`rethrow: false`) |
| `NullChannel` | Null Object — no-op default for optional channel slots. Also exports static `NullChannel.send()`. |

## EventRouter (`src/event-router/`)

### Route resolution flow

```
event → RouteProvider.get(event) → handler(s) → ExecutionStrategy.execute(event, handlers)
```

### Classes

**`RouteStore<T>`** — maps route names → handlers. A `RouteDecider` (or fn) determines which name(s) apply to an event. Returns `defaultRoute` (default: `NullHandler`) when no match. Supports dynamic `add(name, route)` / `remove(names)`.

**`SingleUseRouteStore<T>`** — like `RouteStore` but deletes each route after first retrieval. Used by request/reply.

**`DispatchRouteProvider<T>`** — always returns the same static list of routes (fan-out; no routing logic).

**`EventRouter<T>`** — combines any `RouteProvider` with an `ExecutionStrategy`. Default strategy: parallel.

### Execution strategies

All take `(event, handlers[])`. Available as classes and re-exported from utility-belt:

| Class | Behaviour |
|-------|-----------|
| `SerialStrategy` | Sequential; awaits each handler |
| `ParallelStrategy` | `Promise.all()` |
| `RoundRobinStrategy` | One handler per event, cycling |

## Request/Reply (`src/request-reply-processor/`)

Implements synchronous-style request/reply over asynchronous events.

```
RequestReplyProcessor.process(event):
  1. Create PromiseChannel keyed on event.id
  2. Push event.id onto event.replyTo
  3. Forward event to handler
  4. Await PromiseChannel → returns reply event R
```

**`ReplyRouteProvider`** — maintains a map of `id → PromiseChannel`. Called by the router on the reply path to match replies to waiting callers.

## HTTP pipeline (`src/http/`)

These integrate HTTP calls into the event pipeline. They are **not** Express middleware — that lives in `@sektek/synaptik-express`.

| Class | Interface | What it does |
|-------|-----------|-------------|
| `HttpChannel<T>` | `EventChannel<T>` | Sends event via HTTP (no response consumed) |
| `HttpProcessor<T, R>` | `EventProcessor<T, R>` | Sends event via HTTP, deserializes response into R |

Both wrap utility-belt `HttpOperator` and emit the standard `request:*` / `response:*` HTTP events in addition to the standard event pipeline events.

## `getEventHandlerComponent` utility

```ts
getEventHandlerComponent(obj, opts?)
```

Resolves a callable handler from any `EventEndpoint` by checking methods in priority order: `send` → `process` → `handle`. Thin wrapper around utility-belt `getComponent`.

## Error handling

**`CompositeEventErrorHandler<T>`** — fans errors out to multiple `EventErrorHandlerComponent` instances using a configurable execution strategy (default: parallel).

## Testing conventions

- Tests in `*.spec.ts` co-located with source
- Mocha BDD (`describe`/`it`), Chai + `chai-as-promised`, Sinon (`fake()`, stubs)
- Sinon `fake()` used as stand-in handlers/channels in unit tests
- `NullHandler` / `NullChannel` are Null Object pattern defaults (e.g. `rejectionHandler` in `FilterChannel`) — do not use these in tests

## Reserved names

- `Flow` — reserved for a future `EventChannel` implementation that wraps an entire `FlowBuilder`-constructed pipeline and emits lifecycle events as events move through it. Do not use this name for any class or type.

## Key constraints

- No new dependencies without explicit approval
- ESM only; all imports use `.js` extensions
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Depends on `@sektek/utility-belt`, `lodash`, `uuid`
- Private fields use `#` prefix
- Event name constants (`EVENT_RECEIVED`, etc.) are exported strings — use them, don't hardcode strings
