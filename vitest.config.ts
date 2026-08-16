import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        // No TestBed and no zone: the service is a plain class and the provider factory is pure.
        environment: "node",
        include: ["test/**/*.test.ts"],
        clearMocks: true,
        restoreMocks: true
    }
})
