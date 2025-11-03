import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const thisDir = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(thisDir, "../docs/openapi.json");

describe("OpenAPI specification", () => {
  it("defines the core API endpoints", async () => {
    const raw = await readFile(specPath, "utf8");
    const spec = JSON.parse(raw);

    assert.equal(spec.info.title, "Steam API");
    assert.ok(spec.paths["/health"], "health path missing");
    assert.ok(spec.paths["/api/games"], "games path missing");
    assert.ok(
      spec.paths["/api/games"]?.get && spec.paths["/api/games"]?.post,
      "games endpoint missing methods",
    );
    assert.ok(
      spec.paths["/api/users/{id}/games"]?.get &&
        spec.paths["/api/users/{id}/games"]?.post,
      "user library path missing",
    );
    assert.ok(
      spec.paths["/api/users/{id}/games/{gameId}"]?.delete,
      "user library delete path missing",
    );
    assert.ok(spec.paths["/api/users/{id}/role"], "role update path missing");
    assert.ok(
      spec.paths["/api/users/{id}"]?.delete,
      "user delete path missing",
    );
    assert.ok(spec.components?.securitySchemes?.bearerAuth, "bearer auth missing");
  });
});
