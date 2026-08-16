import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core"
import * as orchestrator from "@mfe-orchestrator-hub/client"
import { configure, globalVariables, type Identities, identities, type Manifest, manifest, type OrchestratorConfig, remoteUrl } from "@mfe-orchestrator-hub/client"

export type { GlobalVariable, Identities, Manifest, Microfrontend, OrchestratorConfig } from "@mfe-orchestrator-hub/client"

/**
 * Tells the core that the host configures the client through this package, so a missing or invalid
 * `backendUrl` / `projectId` is reported with the `provideOrchestrator()` snippet instead of the bare
 * `configure()` one.
 *
 * Guarded and cast on purpose: older cores do not expose the hook, and a nicer error message is
 * never worth a crash. Called both at load, for a service injected without the provider, and inside
 * `provideOrchestrator()`, in case a bundler drops a top level call it believes to be side effect
 * free.
 */
const declareIntegration = (): void => {
    ;(orchestrator as unknown as { registerIntegration?: (integration: string) => void }).registerIntegration?.("angular")
}

declareIntegration()

/**
 * Injectable façade over `@mfe-orchestrator-hub/client`. Every method forwards to the core, which owns
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

    /**
     * Replaces the logged in user, so a *User* canary is decided on the new one from the next
     * resolution on. Pass `undefined` on logout. It drops the memoized manifest of the core, which a
     * second `configure()` deliberately does not.
     *
     * Remotes already imported keep the version drawn for the previous user: the federation runtime
     * holds the container it loaded. Load your remotes behind your own route guard, or reload after
     * the switch.
     *
     * Guarded like `registerIntegration`: a host still on a core that predates this call gets a
     * warning naming the upgrade, not a crash on a property that resolves to undefined.
     */
    setUserId(userId: OrchestratorConfig["userId"]): void {
        const call = (orchestrator as unknown as { setUserId?: (value: OrchestratorConfig["userId"]) => void }).setUserId
        if (!call) {
            console.warn(
                "[@mfe-orchestrator-hub/client-angular] setUserId() is not available in the installed @mfe-orchestrator-hub/client, so the user was not changed and the canary still sees the previous one. Upgrade that package."
            )
            return
        }
        call(userId)
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
 *     providers: [provideOrchestrator({ backendUrl: "…", projectId: "…" })]
 * })
 * ```
 *
 * `environment` is optional. Omit it and the backend resolves the environment from the domain the
 * page is served on; pass it whenever the app already knows which environment it belongs to, or when
 * one domain serves several of them.
 */
export const provideOrchestrator = (config: OrchestratorConfig): EnvironmentProviders => {
    declareIntegration()
    configure(config)
    return makeEnvironmentProviders([{ provide: OrchestratorService, useFactory: () => new OrchestratorService() }])
}
