# Changelog

## [0.3.2](https://github.com/sektek/synaptik/compare/v0.3.1...v0.3.2) (2026-04-19)

### Features

* replace Node events with eventemitter3 for browser compatibility ([#45](https://github.com/sektek/synaptik/issues/45)) ([7d619f4](https://github.com/sektek/synaptik/commit/7d619f428715902d8f5270117693a65a388349c6))

## [0.3.1](https://github.com/sektek/synaptik/compare/v0.3.0...v0.3.1) (2026-04-18)

### Features

* use utility-belt execution strategies in EventRouter ([#44](https://github.com/sektek/synaptik/issues/44)) ([b0f5ead](https://github.com/sektek/synaptik/commit/b0f5eadbfe6ad824b1422c007fcaf42982ba4729))

## [0.3.0](https://github.com/sektek/synaptik/compare/v0.2.3...v0.3.0) (2026-04-18)

### ⚠ BREAKING CHANGES

* This removes RouteStore and replaces it with a NamedRoutesProvider
* This removes SingleUseRouteStore and replaces it with SingleUseRoutesProvider
* This reworks the interface for the `EventRouter`

### Features

* rework EventRouter / RouteStore ([#43](https://github.com/sektek/synaptik/issues/43)) ([b3df870](https://github.com/sektek/synaptik/commit/b3df87044ddcafc90d664d3c083eb60110fce7ff))

## [0.2.3](https://github.com/sektek/synaptik/compare/v0.2.2...v0.2.3) (2026-04-18)

### Features

* FlowBuilder for composing event processing pipelines ([#42](https://github.com/sektek/synaptik/issues/42)) ([72edd76](https://github.com/sektek/synaptik/commit/72edd766b44abbdeb9f6dc08ba95111a39b1e323))

## [0.2.2](https://github.com/sektek/synaptik/compare/v0.2.1...v0.2.2) (2026-03-29)

### Features

* Add ProviderGateway ([#40](https://github.com/sektek/synaptik/issues/40)) ([964f56a](https://github.com/sektek/synaptik/commit/964f56ab1a7a7d35f2dbad9dae9839bd58ebd89d))

## [0.2.1](https://github.com/sektek/synaptik/compare/v0.2.0...v0.2.1) (2026-03-29)

## 0.2.0 (2026-03-21)

### ⚠ BREAKING CHANGES

* Refactor error handling to align with Utility Belt's error handler (#30)
* This allows provider functions to be async and as a result changes the `create` method to be async as well.

### Features

* Add export for processing-channel module ([34b242f](https://github.com/sektek/synaptik/commit/34b242f8b69c491bf6ef3be9a1c3fc9c8c1e95bd))
* Add static clone(), from(), with(), and create() methods to EventBuilder ([9002197](https://github.com/sektek/synaptik/commit/90021973f6063d1b627c58b5f88b1279f93075f1))
* added additional exports ([a2ee5df](https://github.com/sektek/synaptik/commit/a2ee5dfc91fc1a0b876f5afed07d7b317569a499))
* added additional utils ([837ba05](https://github.com/sektek/synaptik/commit/837ba05ad37fa8267430c47d556f548508c3f7fd))
* added base abstract event service ([190b733](https://github.com/sektek/synaptik/commit/190b73309b67850064f388d286d763c4f9f14890))
* added EventBuilder ([b8fb570](https://github.com/sektek/synaptik/commit/b8fb5701d42b250ab52d190c09affd38124463fb))
* Added EventEndpoint type. Refactored RouteStore to use new type ([#2](https://github.com/sektek/synaptik/issues/2)) ([f538d78](https://github.com/sektek/synaptik/commit/f538d787619b9c3f041390309da43d3202dd59f5))
* added EventRouter and supporting classes ([e77bddc](https://github.com/sektek/synaptik/commit/e77bddc2f6f259a7c1d6adc714a63c47efd7d229))
* added initial types ([4cb8ac3](https://github.com/sektek/synaptik/commit/4cb8ac32162452a99eb068d68918ad4e891aa93f))
* added initial utils ([82d950b](https://github.com/sektek/synaptik/commit/82d950b83df0c6a1879a9bd63a2a46d28f207087))
* added naming for abstract event services ([6921648](https://github.com/sektek/synaptik/commit/692164816c5a7bb6aae7728711bbde8a7261dbbb))
* added NullChannel and NullHandler ([9af171d](https://github.com/sektek/synaptik/commit/9af171d33237ed71030b5b0a1eeeadb5a708460c))
* added processing channel ([acba6a8](https://github.com/sektek/synaptik/commit/acba6a8c49495f9ee289925e632b781beca5d84d))
* Added PromiseChannel ([9e0705b](https://github.com/sektek/synaptik/commit/9e0705b202e4d447a7d8b4159e5832fc20cfa2f8))
* added types RouteDecider & RouteProvider ([9b5254c](https://github.com/sektek/synaptik/commit/9b5254cb5d8f4dbf74a714bd84ee0433804c0ceb))
* Adds AbstractEventHandlingService ([#7](https://github.com/sektek/synaptik/issues/7)) ([a515ec1](https://github.com/sektek/synaptik/commit/a515ec1a7b1961e64d312550de469416c699bea7))
* adds event:error emitter on errors in HttpEventService. Also corrects some type information ([#15](https://github.com/sektek/synaptik/issues/15)) ([d9ba49a](https://github.com/sektek/synaptik/commit/d9ba49ad4e5f142c0d3bae18b971b10667e6d37b))
* Adds fetch based http channels and processors ([#1](https://github.com/sektek/synaptik/issues/1)) ([e378a27](https://github.com/sektek/synaptik/commit/e378a27ae61e3cc64f86ef41a2c770562c975c77))
* CompositeEventErrorHandler ([99d6c36](https://github.com/sektek/synaptik/commit/99d6c36b881363247f91076570868612d28ebde1))
* Enhance EventChannelFn to include options parameter for event sending ([#34](https://github.com/sektek/synaptik/issues/34)) ([2db75fe](https://github.com/sektek/synaptik/commit/2db75fe47f4ec46f8699723145a2b3ef7693377e))
* enhance getEventHandlerComponent with support for return type ([#18](https://github.com/sektek/synaptik/issues/18)) ([8278be2](https://github.com/sektek/synaptik/commit/8278be2a275be521cda88c59434458cd348296d5))
* ErrorTrapChannel ([#24](https://github.com/sektek/synaptik/issues/24)) ([a524e3a](https://github.com/sektek/synaptik/commit/a524e3a8c5586b33fae9ff3b22952245821ffed3))
* event:processed now includes the original event ([6af4371](https://github.com/sektek/synaptik/commit/6af4371f46539a5541560aea09b7e8b265e11b41))
* EventBasedStringProvider ([#20](https://github.com/sektek/synaptik/issues/20)) ([ba4ea92](https://github.com/sektek/synaptik/commit/ba4ea92d0303c3686064e4225db06310ebfe3ba1))
* EventRouter Updates ([#6](https://github.com/sektek/synaptik/issues/6)) ([6e42b6c](https://github.com/sektek/synaptik/commit/6e42b6cbda9544b9564a248ae25dec1fb49a825a))
* EventRouter uses generic execution strategies from utility-belt ([ae06408](https://github.com/sektek/synaptik/commit/ae0640884e7a7addbfdaf88509ac24fb885a01bb))
* FilterChannel ([#13](https://github.com/sektek/synaptik/issues/13)) ([0963483](https://github.com/sektek/synaptik/commit/096348300515be71f2ff4c6c71a584cbb201fa9b))
* Implement CollectorChannel with event handling and tests ([#33](https://github.com/sektek/synaptik/issues/33)) ([146893b](https://github.com/sektek/synaptik/commit/146893ba297e398141489551d4ac819e2989a4fd))
* Implement StoreChannel for event storage and handling ([#32](https://github.com/sektek/synaptik/issues/32)) ([7265de8](https://github.com/sektek/synaptik/commit/7265de812c1cdde0b3c235e504688f40953f7954))
* Introduce RequestReplyProcessor ([#14](https://github.com/sektek/synaptik/issues/14)) ([be0c74f](https://github.com/sektek/synaptik/commit/be0c74f7dad629389cd25db80af030e215991254))
* moving to uuid package ([ab080af](https://github.com/sektek/synaptik/commit/ab080afd99c9f1a30c0d9575b95f305c080e7a0c))
* MutatorHandler ([#27](https://github.com/sektek/synaptik/issues/27)) ([89476c5](https://github.com/sektek/synaptik/commit/89476c5d4a41c127abf2170eaecf23ca403de822))
* PromiseChannel timeouts and state ([#12](https://github.com/sektek/synaptik/issues/12)) ([24fee1e](https://github.com/sektek/synaptik/commit/24fee1e9afd4cc9ca40bb68a1511438774adeaec))
* PromiseChannel updated to inherit from AbstractEventService ([#11](https://github.com/sektek/synaptik/issues/11)) ([267d66d](https://github.com/sektek/synaptik/commit/267d66dd0250c246761ef1aa34a0862507b39d00))
* Refactor error handling to align with Utility Belt's error handler ([#30](https://github.com/sektek/synaptik/issues/30)) ([b5e5b13](https://github.com/sektek/synaptik/commit/b5e5b13e27bb23bc0754dc725fcadc17d5eacfa6))
* Refactor EventBuilder ([#21](https://github.com/sektek/synaptik/issues/21)) ([7f40d65](https://github.com/sektek/synaptik/commit/7f40d65417bc757a95ac1d43f9be5a2e0e0cd2ba))
* Refactor HttpChannel and HttpProcessor to use HttpOperator ([#22](https://github.com/sektek/synaptik/issues/22)) ([0554355](https://github.com/sektek/synaptik/commit/0554355519c748ed2e0ac015ec3ba4a002953a91))
* SplitterChannel ([#23](https://github.com/sektek/synaptik/issues/23)) ([cf8ca1c](https://github.com/sektek/synaptik/commit/cf8ca1c2239bc61d2e94a8e2ec3dce3587d582c3))
* TapChannel ([#25](https://github.com/sektek/synaptik/issues/25)) ([4dea98b](https://github.com/sektek/synaptik/commit/4dea98ba9d760cd9793c4f583078a68efe863bd9))
* TaskExecutionHandler ([#29](https://github.com/sektek/synaptik/issues/29)) ([b74bcab](https://github.com/sektek/synaptik/commit/b74bcab95f340702d2571292be86d98183fd6614))
* update event-based provider types for consistency ([cac4ca0](https://github.com/sektek/synaptik/commit/cac4ca0d7a34e3b9ad8510663c85611d2e80df45))
* Update EventBuilder to use @sektek/utility-belt's builder functions ([#5](https://github.com/sektek/synaptik/issues/5)) ([8c6caf9](https://github.com/sektek/synaptik/commit/8c6caf99f92d20ca3b4443176cbb73540b028094))

### Bug Fixes

* add dependency for @sektek/utility-belt ([14bd510](https://github.com/sektek/synaptik/commit/14bd510eb19e30b6669ad0735b1a528037075572))
* added default types for generics to event handlers ([78c2052](https://github.com/sektek/synaptik/commit/78c20527dd97e8189584933fb3b3f2ee3ce2f007))
* added default types to generics ([eeaffe7](https://github.com/sektek/synaptik/commit/eeaffe7ce085c63ac3301eef12d1cf3b3e51c051))
* clone event before sending it to the processor in ProcessingChannel. Tests added. ([4cad519](https://github.com/sektek/synaptik/commit/4cad51933884be6b389b60f87bb65627f1283089))
* CompositeHeadersProvider requires name property ([#8](https://github.com/sektek/synaptik/issues/8)) ([173793c](https://github.com/sektek/synaptik/commit/173793cbfb8483eb83efd046ffeef3a17b86e7f0))
* default route handling and update process type in EventProcessorAsEndpoint ([#28](https://github.com/sektek/synaptik/issues/28)) ([ffca6ed](https://github.com/sektek/synaptik/commit/ffca6ede3fa6b5f8eea6e6ae63bfc635c3e31af5))
* from now clones data from event rather than a shallow copy ([a9f25ce](https://github.com/sektek/synaptik/commit/a9f25cefb9ec87164a3a78ed91fed47d5f4f8d0c))
* generic default for EventChannelFn ([9001c91](https://github.com/sektek/synaptik/commit/9001c91bc08bf80d7ca0288c722497e8088f2ceb))
* hopefully improved cross platform usage (server/browser) ([c13422f](https://github.com/sektek/synaptik/commit/c13422f1eaf503eb443f7c1eeae85edbb416a7b5))
* incorrect tests for NullChannel ([abe10a3](https://github.com/sektek/synaptik/commit/abe10a36aade39c6dee6431faa946c9979221385))
* made name an optional parameter ([d14e325](https://github.com/sektek/synaptik/commit/d14e325b9e0d67e724d70771365ffeb7ff59a1cc))
* make getEventHandlerComponent accept undefined and null ([bcb8875](https://github.com/sektek/synaptik/commit/bcb8875b8fec262b50518eee87c9424698643bb3))
* missed a couple files for the NullHandler move ([98aea43](https://github.com/sektek/synaptik/commit/98aea43e432248a1fb863ff5458bc0c8a9b834e7))
* provide default opts for AbstractEventService constructor ([#9](https://github.com/sektek/synaptik/issues/9)) ([4ee69b2](https://github.com/sektek/synaptik/commit/4ee69b2ad5097d58edea8865cdca488a3a041c3d))
* remove export from internal only EventEndpointComponent ([fc2539d](https://github.com/sektek/synaptik/commit/fc2539dca9786a31c8c08cfdd977914f16056ab6))
* resolve typing issues in event-serializer ([#19](https://github.com/sektek/synaptik/issues/19)) ([2f9de34](https://github.com/sektek/synaptik/commit/2f9de3491473a36e690ec17e2e0cf21b61f74ce4))
* Updated all calls to getComponent to use options instead of fallback value ([72c4b76](https://github.com/sektek/synaptik/commit/72c4b76be77903fa3cdf2664150e42e834f30478))
