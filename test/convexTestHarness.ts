/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

export function createConvexTest() {
  const t = convexTest(schema, modules);
  registerAggregate(t, "storyReadsByCourse");
  registerAggregate(t, "readersByCourse");
  return t;
}
