import assert from "node:assert/strict";
import test from "node:test";
import { inviteAdminSchema } from "../src/modules/auth/auth.validation.js";

test("inviteAdminSchema normalizes a valid invitation", () => {
  const result = inviteAdminSchema.safeParse({
    name: "  Бат Эрдэнэ  ",
    email: "  admin@example.com  ",
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    name: "Бат Эрдэнэ",
    email: "admin@example.com",
  });
});

test("inviteAdminSchema rejects an invalid invitation", () => {
  const result = inviteAdminSchema.safeParse({
    name: "A",
    email: "not-an-email",
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error.issues.map((issue) => issue.path[0]).sort(),
    ["email", "name"],
  );
});
