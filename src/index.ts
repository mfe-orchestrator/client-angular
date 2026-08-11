import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core"
import { configure, globalVariables, type Identities, identities, type Manifest, manifest, type OrchestratorConfig, remoteUrl } from "@mfe-orchestrator/client"

export type { GlobalVariable, Identities, Manifest, Microfrontend, OrchestratorConfig } from "@mfe-orchestrator/client"

/**
 * Injectable façade over `@mfe-orchestrator/client`. Every method forwards to the core, which owns
 * the single memoized manifest request, so injecting the service in ten components still costs one
 * network call.
 *
 * Register it with `provideOrchestrator()`. The class carries no Angular decorator on purpose: the
 * package is plain TypeScript, which keeps it free of the Angular compiler and safe under AOT.
 */
export class OrchestratorService {
    /** The ready to use, version pinned URL of a remote. Use it verbatim. */
    remoteUrl(slug: string): Promise<string> {
        return remoteUrl(slug)
    }

    /** The whole manifest of the environment. */
    manifest(): Promise<Manifest> {
        return manifest()
    }

    /** The global variables of the environment, as a plain object. */
    globalVariables(): Promise<Record<string, string>> {
        return globalVariables()
    }

    /** The session and device ids of this page. */
    identities(): Identities {
        return identities()
    }
}

/**
 * Configures the client and registers `OrchestratorService`.
 *
 * `configure()` runs immediately, while the providers are being built, not when the service is first
 * injected: a lazily loaded remote must find the client already configured. It is idempotent, so
 * calling this twice is harmless.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *     providers: [provideOrchestrator({ backendUrl: "…", projectId: "…", environment: "…" })]
 * })
 * ```
 */
export const provideOrchestrator = (config: OrchestratorConfig): EnvironmentProviders => {
    configure(config)
    return makeEnvironmentProviders([{ provide: OrchestratorService, useFactory: () => new OrchestratorService() }])
}
