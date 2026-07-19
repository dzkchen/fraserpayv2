import { readFileSync } from "node:fs";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  type Firestore,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PROJECT_ID = "demo-fraserpay";

const PATHS = {
  "users/*": "users/alice",
  "ledger/*": "ledger/entry-1",
  "booths/*": "booths/booth-1",
  "auditLog/*": "auditLog/event-1",
  "idempotency/*": "idempotency/alice_key-1",
} as const;

let testEnv: RulesTestEnvironment;

function db(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("deny-all Security Rules (NFR-6)", () => {
  const contexts = [
    ["unauthenticated", () => testEnv.unauthenticatedContext()],
    ["authenticated", () => testEnv.authenticatedContext("alice")],
  ] as const;

  for (const [contextName, makeContext] of contexts) {
    describe(`${contextName} client`, () => {
      for (const [label, path] of Object.entries(PATHS)) {
        const collectionPath = path.slice(0, path.lastIndexOf("/"));

        it(`is denied read on ${label}`, async () => {
          const store = db(makeContext());
          await assertFails(getDoc(doc(store, path)));
        });

        it(`is denied list on ${label}`, async () => {
          const store = db(makeContext());
          await assertFails(getDocs(collection(store, collectionPath)));
        });

        it(`is denied create on ${label}`, async () => {
          const store = db(makeContext());
          await assertFails(setDoc(doc(store, path), { hijacked: true }));
        });

        it(`is denied delete on ${label}`, async () => {
          const store = db(makeContext());
          await assertFails(deleteDoc(doc(store, path)));
        });
      }
    });
  }

  it("cannot be bypassed even with an admin-shaped token", async () => {
    const store = db(testEnv.authenticatedContext("root", { admin: true }));
    await assertFails(getDoc(doc(store, "users/alice")));
    await assertFails(setDoc(doc(store, "ledger/entry-1"), { amountCents: 1 }));
  });

  it("has no data left behind (writes never landed)", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const store = db(context);
      for (const path of Object.values(PATHS)) {
        const snap = await getDoc(doc(store, path));
        expect(snap.exists()).toBe(false);
      }
    });
  });
});
