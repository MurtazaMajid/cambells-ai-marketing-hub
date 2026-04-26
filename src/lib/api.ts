export const API_BASE = "https://churn-prediction-production-a6ad.up.railway.app";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type Segment = "Regular" | "New" | "Occasional" | "Lost";
export type Risk = "Low" | "Medium" | "High";

export interface DashboardResponse {
  total_customers: number;
  segment_counts: Record<Segment, number>;
  risk_counts: Record<Risk, number>;
  churn_rate_pct: number;
  top_at_risk: Array<{
    segment: Segment;
    recency: number;
    frequency: number;
    monetary: number;
    churn_probability: number;
    risk_level: Risk;
    customer_id?: string;
    id?: string;
    tier?: string;
  }>;
  rfm_by_segment: Record<Segment, { recency: number; frequency: number; monetary: number }>;
  messages_sent: number;
  data_source: string;
}

export type SpendingTier = "Economy" | "Standard" | "Premium";
export type TimePreference = "Morning" | "Mid-day" | "Evening";
export type FoodPreference = "chicken" | "beef" | "fish" | "veggie" | "varied";
export type DrinkVsFood = "Drinks" | "Food" | "Mixed";

export interface Customer {
  id: string;
  segment: Segment;
  recency: number;
  frequency: number;
  monetary: number;
  unique_items?: number;
  avg_order_val?: number;
  avg_tip?: number;
  discount_used?: number;
  visits_nov?: number;
  visits_dec?: number;
  visits_jan?: number;
  days_since_first?: number;
  churn_probability: number;
  risk_level: Risk;
  discount_offered?: string;
  tier?: string;
  spending_tier?: SpendingTier | null;
  time_preference?: TimePreference | null;
  food_preference?: FoodPreference | null;
  drink_vs_food?: DrinkVsFood | null;
  favorite_modifier?: string | null;
  is_flight_lover?: boolean | null;
  favorite_items?: string | null;
}

export interface ProfilesResponse {
  spending_tier: Record<string, number>;
  time_preference: Record<string, number>;
  food_preference: Record<string, number>;
  drink_vs_food?: Record<string, number>;
  flight_lovers: { yes: number; no: number };
  total: number;
}

// Helper to parse "['Item1', 'Item2']" string into array
export function parseFavoriteItems(s?: string | null): string[] {
  if (!s) return [];
  if (Array.isArray(s)) return s as string[];
  try {
    const fixed = s.replace(/'/g, '"');
    const arr = JSON.parse(fixed);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return s.replace(/[[\]']/g, "").split(",").map((x) => x.trim()).filter(Boolean);
  }
}

export interface CustomersResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  customers: Customer[];
}

export interface PipelineResponse {
  segment: Segment;
  churn_probability: number;
  risk_level: Risk;
  tier: string;
  discount_offered: string;
  absa: {
    aspects: string[];
    sentiments: string[];
    opinions: string[];
    triplets: { aspect: string; opinion: string; sentiment: string }[];
  } | null;
  messages: {
    sms: string;
    email: { subject: string; body: string };
    app_notification: string;
  };
}

export interface MessagesLogResponse {
  count: number;
  messages: Array<{
    id: string | number;
    customer_id: string;
    segment: Segment;
    risk_level: Risk;
    discount_offered: string;
    sms: string;
    email_subject: string;
    email_body: string;
    app_notification: string;
    aspects?: string[] | string;
    sentiments?: string[] | string;
    created_at: string;
  }>;
}

export interface KpisResponse {
  total_customers: number;
  churn_rate_pct: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_spend: number;
  total_revenue: number;
  messages_sent: number;
  top_segment: string;
  avg_visits: number;
  urgent_reachout: number;
}

export interface RfmResponse {
  scatter_data: Array<{
    id: string; segment: Segment; recency: number; frequency: number;
    monetary: number; churn_probability: number; risk_level: Risk;
  }>;
  segment_averages: Record<string, { recency: number; frequency: number; monetary: number }>;
  total_points: number;
}

export interface ChurnDistributionResponse {
  histogram: Record<string, number>;
  churn_by_segment: Record<string, number>;
  risk_by_segment: Array<{ segment: Segment; risk_level: Risk; count: number }>;
  overall_avg_churn: number;
}

export interface MonthlyVisitsResponse {
  monthly_totals: Record<string, number>;
  monthly_by_segment: Record<string, Record<string, number>>;
  frequency_distribution: Record<string, number>;
}

export interface RevenueResponse {
  revenue_by_segment: Record<string, {
    total_revenue: number; avg_spend: number; avg_order_val: number;
    customer_count: number; avg_visits: number;
  }>;
  spend_distribution: Record<string, number>;
  top_spenders: Array<{ id: string; segment: Segment; monetary: number; frequency: number; risk_level: Risk }>;
  total_revenue: number;
  avg_spend: number;
  discount_users: number;
  non_discount_users: number;
}

export interface SentimentBreakdownResponse {
  aspect_frequency: Record<string, number>;
  sentiment_by_aspect: Record<string, Record<string, number>>;
  overall_sentiment: Record<string, number>;
  sample_reviews: Array<{ review: string; aspects: string | string[]; sentiment: string | string[] }>;
  total_reviews: number;
  total_aspect_mentions?: number;
}

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  kpis: () => request<KpisResponse>("/api/analysis/kpis"),
  rfm: () => request<RfmResponse>("/api/analysis/rfm"),
  churnDistribution: () => request<ChurnDistributionResponse>("/api/analysis/churn-distribution"),
  monthlyVisits: () => request<MonthlyVisitsResponse>("/api/analysis/monthly-visits"),
  revenue: () => request<RevenueResponse>("/api/analysis/revenue"),
  sentimentBreakdown: () => request<SentimentBreakdownResponse>("/api/analysis/sentiment-breakdown"),
  profiles: () => request<ProfilesResponse>("/api/analysis/profiles"),
  customerProfile: (id: string) => request<Customer>(`/api/customer-profile/${encodeURIComponent(id)}`),
  customers: (params: { segment?: string; risk_level?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "" && v !== "all") q.set(k, String(v)); });
    return request<CustomersResponse>(`/api/customers${q.toString() ? `?${q}` : ""}`);
  },
  fullPipeline: (body: Record<string, unknown>) =>
    request<PipelineResponse>("/api/full-pipeline", { method: "POST", body: JSON.stringify(body) }),
  messagesLog: (params: { limit?: number; segment?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
    return request<MessagesLogResponse>(`/api/messages-log${q.toString() ? `?${q}` : ""}`);
  },
  sentiment: (review: string) => request<{
    review: string; aspects: string[]; sentiments: string[]; opinions: string[];
    triplets: { aspect: string; opinion: string; sentiment: string }[];
  }>("/api/sentiment", { method: "POST", body: JSON.stringify({ review }) }),
};
