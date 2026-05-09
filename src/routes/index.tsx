import { createFileRoute } from "@tanstack/react-router";
import OverviewPage from "@/pages/index";

export const Route = createFileRoute("/")({ component: OverviewPage });
