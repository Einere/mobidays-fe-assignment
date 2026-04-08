import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers/app-providers";
import { worker } from "@/shared/api/mock/browser";
import "./index.css";
import App from "./App.tsx";

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
	if (import.meta.env.DEV) {
		try {
			await worker.start({ onUnhandledRequest: "error" });
		} catch (error) {
			console.error("Failed to start MSW worker", error);
		}
	}

	mountApp();
}

void bootstrap().catch((error) => {
	console.error("Failed to bootstrap app", error);
});
