interface MockWorker {
	start: (options: { onUnhandledRequest: "error" }) => Promise<unknown>;
}

export function shouldStartMockApi(mode: string, useMsw: string | undefined) {
	return mode !== "test" && useMsw !== "false";
}

export async function startMockApi(worker: MockWorker) {
	try {
		await worker.start({ onUnhandledRequest: "error" });
		return true;
	} catch (error) {
		console.error("Failed to start MSW worker", error);
		return false;
	}
}
