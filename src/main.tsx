import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
	shouldStartMockApi,
	startMockApi,
} from "@/app/bootstrap/start-mock-api";
import { worker } from "@/app/mock/browser";
import { AppProviders } from "@/app/providers/app-providers";
import { applyBrowserDatasetAttribute } from "@/shared/lib/browser";
import "./index.css";
import App from "./App.tsx";

applyBrowserDatasetAttribute();

function mountApp() {
	const rootElement = document.getElementById("root");
	if (!rootElement) throw new Error("Root element not found");

	createRoot(rootElement).render(
		<StrictMode>
			<AppProviders>
				<App />
			</AppProviders>
		</StrictMode>,
	);
}

async function bootstrap() {
	if (shouldStartMockApi(import.meta.env.MODE, import.meta.env.VITE_USE_MSW)) {
		await startMockApi(worker);
	}

	mountApp();
}

void bootstrap().catch((error) => {
	console.error("Failed to bootstrap app", error);
});
