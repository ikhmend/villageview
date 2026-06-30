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
test("inviteAdminSchema rejects an empty name", () => {
  const result = inviteAdminSchema.safeParse({
    name: "",
    email: "admin@example.com",
  });
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path[0] === "name"),
  );
});
test("inviteAdminSchema rejects a whitespace-only name", () => {
  const result = inviteAdminSchema.safeParse({
    name: "     ",
    email: "admin@example.com",
  });
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path[0] === "name"),
  );
});
test("inviteAdminSchema rejects a missing email", () => {
  const result = inviteAdminSchema.safeParse({
    name: "Бат Эрдэнэ",
  });
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path[0] === "email"),
  );
});
test("inviteAdminSchema rejects a missing name", () => {
  const result = inviteAdminSchema.safeParse({
    email: "admin@example.com",
  });
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path[0] === "name"),
  );
});
test("inviteAdminSchema rejects an empty payload", () => {
  const result = inviteAdminSchema.safeParse({});
  assert.equal(result.success, false);
  const paths = result.error.issues
    .map((issue) => issue.path[0])
    .sort();
  assert.deepEqual(paths, ["email", "name"]);
});
test("inviteAdminSchema rejects invalid field types", () => {
  const result = inviteAdminSchema.safeParse({
    name: 123,
    email: true,
  });
  assert.equal(result.success, false);
  const paths = result.error.issues
    .map((issue) => issue.path[0])
    .sort();
  assert.deepEqual(paths, ["email", "name"]);
});
test("inviteAdminSchema null утга шалгана", ()=> {
  const result= inviteAdminSchema.safeParse({
    name: null,
    email: null,
  });
  assert.equal(result.success, false);
});
test("inviteAdminSchema хэт богино нэрийг reject-лэнэ.", ()=>{
  const result= inviteAdminSchema.safeParse({
    name: "A",
    email: "test@example.com"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue)=> issue.path[0]==="name",),);
});
