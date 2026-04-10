import { setupServer } from "msw/node";
import { handlers } from "@/app/mock/handlers";

export const server = setupServer(...handlers);
