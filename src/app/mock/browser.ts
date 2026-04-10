import { setupWorker } from "msw/browser";
import { handlers } from "@/app/mock/handlers";

export const worker = setupWorker(...handlers);
