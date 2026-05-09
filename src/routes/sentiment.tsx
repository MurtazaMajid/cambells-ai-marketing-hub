import { createFileRoute } from "@tanstack/react-router";
import SentimentPage from "@/pages/sentiment";
export const Route = createFileRoute("/sentiment")({ component: SentimentPage });
