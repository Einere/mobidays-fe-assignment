import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetMockDb } from "@/shared/api/mock/db";
import { server } from "@/shared/api/mock/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
	server.resetHandlers();
	resetMockDb();
});

afterAll(() => server.close());
