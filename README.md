# @mfe-orchestrator/client-angular

Angular bindings for
[`@mfe-orchestrator/client`](https://github.com/mfe-orchestrator/client-core).

Ergonomics only. Every decision — which version is served, how the manifest is fetched, how the
identities are kept — lives in the core. This package is one provider function and one service.

## Install

```sh
pnpm add @mfe-orchestrator/client-angular
```

`@mfe-orchestrator/client` comes along as a dependency. `@angular/core` is a peer dependency
(16 or later).

## Usage

```ts
import { bootstrapApplication } from "@angular/platform-browser"
import { provideOrchestrator } from "@mfe-orchestrator/client-angular"
import { AppComponent } from "./app.component"

bootstrapApplication(AppComponent, {
    providers: [
        provideOrchestrator({
            backendUrl: environment.mfeBackendUrl,
            projectId: environment.mfeProjectId,
            environment: environment.mfeEnvironment
        })
    ]
})
```

`provideOrchestrator()` calls `configure()` immediately, while the providers are being built, not
when the service is first injected: a lazily loaded remote must find the client already configured.
`configure()` is idempotent, so calling it twice is harmless.

It stays a convenience. The recommended place is still the very top of `main.ts`, before
`bootstrapApplication`, because a bundler may import a remote before Angular boots:

```ts
import { configure } from "@mfe-orchestrator/client"

configure({ backendUrl: "…", projectId: "…", environment: "…" })
```

### `OrchestratorService`

```ts
import { Component, inject } from "@angular/core"
import { OrchestratorService } from "@mfe-orchestrator/client-angular"

@Component({ selector: "app-checkout", template: "<p>{{ url }}</p>" })
export class CheckoutComponent {
    private readonly orchestrator = inject(OrchestratorService)
    url = ""

    async ngOnInit() {
        this.url = await this.orchestrator.remoteUrl("checkout-new")
    }
}
```

```ts
class OrchestratorService {
    /** The ready to use, version pinned URL of a remote. */
    remoteUrl(slug: string): Promise<string>
    /** The whole manifest of the environment. */
    manifest(): Promise<Manifest>
    /** The global variables of the environment, as a plain object. */
    globalVariables(): Promise<Record<string, string>>
    /** The session and device ids of this page. */
    identities(): { sessionId: string; deviceId: string }
}
```

Every method forwards to the core, which owns the single memoized manifest request, so injecting the
service in ten components still costs one network call.

The URL comes back already pinned to the version the backend resolved. Use it verbatim: never rebuild
it and never strip the `_v/<version>/` segment.

`OrchestratorService` is registered by `provideOrchestrator()`. It is not `providedIn: "root"`, so
`provideOrchestrator()` must be in the application providers for `inject(OrchestratorService)` to
resolve.

### No Angular compiler

The service carries no Angular decorator on purpose: the package is plain TypeScript, registered
through an explicit factory provider. That keeps it out of `ng-packagr` and the Angular compiler, and
it is safe under AOT on every supported Angular version.

### With module federation

The service is for the app's own logic. The remote itself is wired in the bundler config, which talks
to the core directly — see the
[core README](https://github.com/mfe-orchestrator/client-core#bundler-configuration).

## Development

```sh
pnpm install
pnpm build       # tsup, ESM + CJS + types
pnpm typecheck
```

## License

MIT © Lorenzo De Francesco
