"use client";

import {
  Banknote,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Download,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FilePenLine,
  Gauge,
  GraduationCap,
  KeyRound,
  Landmark,
  LineChart,
  LogOut,
  Mail,
  Medal,
  MessageCircle,
  PiggyBank,
  Play,
  Plus,
  PlugZap,
  Save,
  School,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Trash2,
  Upload,
  UserCog,
  UserRoundSearch,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LifeEventsPanel, StudentLifeEvents, type StudentLifeEvent } from "./life-events-ui";
import { MarketHistoryDialog } from "./market-history-ui";
import { ClassGradeSummary, GradePanel, StatusBadge, StudentGradeReportCard, type TeacherGrade } from "./quest-grading-ui";
import { StockInfoDialog } from "./stock-info-ui";
import { defaultInfoLevel } from "@/lib/stock-info";
import { difficultyLabels, marketTemplates, type Difficulty } from "@/lib/market-templates";
import { maxWholeShares } from "@/lib/portfolio-rules";
import type { StudentGradeReport, StudentStatus } from "@/lib/quest-grading";
import { CLOCK_SPEEDS, tradingBlockedReason, type ClockView } from "@/lib/market-clock";
import { AdminMessagingPage, FlaggedMessagesPanel, MessagesPanel, ParentContactRequestPanel } from "./messages-ui";
import { APP_VERSION } from "@/lib/version";

const allocation = [
  { name: "Index stocks", value: 44, color: "#28666e" },
  { name: "Roth IRA", value: 24, color: "#f2a541" },
  { name: "Retirement", value: 20, color: "#7c9885" },
  { name: "IPO lab", value: 6, color: "#c44536" },
  { name: "Cash buffer", value: 6, color: "#5c677d" },
];

type PortfolioActivity = {
  id: string;
  date: string;
  action: string;
  vehicle: string;
  amount: string;
  note: string;
};

const initialPortfolioActivity: PortfolioActivity[] = [
  {
    id: "trade-5",
    date: "Mar 14",
    action: "Buy",
    vehicle: "Index stocks",
    amount: "$45",
    note: "Added weekly investing habit",
  },
  {
    id: "trade-4",
    date: "Mar 11",
    action: "Rebalance",
    vehicle: "Cash buffer",
    amount: "$20",
    note: "Protected short-term savings goal",
  },
  {
    id: "trade-3",
    date: "Mar 08",
    action: "Dividend",
    vehicle: "Retirement",
    amount: "$6",
    note: "Reinvested automatically",
  },
  {
    id: "trade-2",
    date: "Mar 04",
    action: "Buy",
    vehicle: "Roth IRA",
    amount: "$25",
    note: "Practiced tax-advantaged investing",
  },
  {
    id: "trade-1",
    date: "Mar 01",
    action: "Watchlist",
    vehicle: "IPO lab",
    amount: "$0",
    note: "Reviewed risk before allocating",
  },
];

const basePortfolio = [
  { month: "Sep", value: 1000 },
  { month: "Oct", value: 1055 },
  { month: "Nov", value: 1118 },
  { month: "Dec", value: 1092 },
  { month: "Jan", value: 1176 },
  { month: "Feb", value: 1248 },
  { month: "Mar", value: 1326 },
];

const marketWatch = [
  { ticker: "SPY", label: "S&P 500 ETF", move: "+0.7%", tone: "up" },
  { ticker: "QQQ", label: "Growth ETF", move: "-0.4%", tone: "down" },
  { ticker: "BND", label: "Bond ETF", move: "+0.2%", tone: "up" },
  { ticker: "IPO", label: "IPO basket", move: "+1.9%", tone: "up" },
];

const initialMarketQuotes: MarketQuote[] = [
  {
    changePercent: 0.74,
    dayHigh: 690.1,
    dayLow: 681.4,
    name: "S&P 500 ETF",
    news: "Broad indexes opened higher as earnings expectations improved.",
    price: 689.42,
    sector: "Index ETF",
    ticker: "SPY",
  },
  {
    changePercent: -0.41,
    dayHigh: 625.2,
    dayLow: 618.72,
    name: "Growth ETF",
    news: "Growth names slipped as rate-sensitive stocks cooled.",
    price: 621.15,
    sector: "Growth ETF",
    ticker: "QQQ",
  },
  {
    changePercent: 0.18,
    dayHigh: 74.36,
    dayLow: 73.98,
    name: "Bond ETF",
    news: "Bonds stayed steady while investors watched central bank signals.",
    price: 74.18,
    sector: "Bonds",
    ticker: "BND",
  },
  {
    changePercent: 1.88,
    dayHigh: 32.04,
    dayLow: 30.92,
    name: "Simulated IPO basket",
    news: "New listing demand rose after a strong classroom IPO auction.",
    price: 31.62,
    sector: "IPO Lab",
    ticker: "IPO",
  },
  {
    changePercent: 0.29,
    dayHigh: 331.9,
    dayLow: 328.4,
    name: "Total Stock Market ETF",
    news: "Diversified equity funds gained on stable consumer data.",
    price: 331.22,
    sector: "Broad Market",
    ticker: "VTI",
  },
  {
    changePercent: 0.35,
    dayHigh: 84.75,
    dayLow: 81.8,
    name: "Energy Select ETF",
    news: "Energy shares rose as traders weighed supply risk headlines.",
    price: 84.12,
    sector: "Energy",
    ticker: "XLE",
  },
  {
    changePercent: -0.22,
    dayHigh: 74.4,
    dayLow: 72.95,
    name: "Airline ETF",
    news: "Airline shares softened as fuel-cost expectations ticked up.",
    price: 73.28,
    sector: "Travel",
    ticker: "JETS",
  },
  {
    changePercent: 0.12,
    dayHigh: 78.1,
    dayLow: 76.6,
    name: "Oil Services ETF",
    news: "Oil service companies moved slightly higher before scenario events.",
    price: 77.35,
    sector: "Oil Services",
    ticker: "OIH",
  },
];

const initialStudentHoldings: StockHolding[] = [
  { averageCost: 674.25, name: "S&P 500 ETF", quantity: 1, ticker: "SPY" },
  { averageCost: 73.9, name: "Bond ETF", quantity: 3, ticker: "BND" },
];

const classRows = [
  {
    name: "Avery",
    level: 8,
    mastery: 86,
    portfolio: "$1,326",
    lastConcept: "Diversification",
  },
  {
    name: "Jordan",
    level: 7,
    mastery: 74,
    portfolio: "$1,214",
    lastConcept: "Budgeting",
  },
  {
    name: "Maya",
    level: 9,
    mastery: 91,
    portfolio: "$1,441",
    lastConcept: "Compound growth",
  },
  {
    name: "Leo",
    level: 6,
    mastery: 63,
    portfolio: "$1,097",
    lastConcept: "Risk",
  },
];

type TeacherClassAnalytics = {
  id: string;
  className: string;
  activeStudents: number;
  goalsOnTrack: number;
  questsComplete: number;
  questsNeedsReview: number;
  portfolioReturn: number;
  portfolioValue: string;
  allocation: Array<{ name: string; value: number; color: string }>;
  discussions: {
    posts: number;
    replies: number;
    flagged: number;
    participation: number;
  };
  students: TeacherStudentAnalytics[];
};

type TeacherStudentAnalytics = {
  name: string;
  alias: string;
  readiness: number;
  questProgress: number;
  portfolioReturn: number;
  portfolioValue: string;
  discussionPosts: number;
  flaggedPosts: number;
};

const teacherClassAnalytics: TeacherClassAnalytics[] = [
  {
    id: "finance-a",
    className: "7th Grade Finance A",
    activeStudents: 31,
    goalsOnTrack: 82,
    questsComplete: 74,
    questsNeedsReview: 5,
    portfolioReturn: 8.4,
    portfolioValue: "$40,906",
    allocation,
    discussions: {
      posts: 118,
      replies: 76,
      flagged: 2,
      participation: 91,
    },
    students: [
      {
        name: "Avery Johnson",
        alias: "ValueVoyager",
        readiness: 86,
        questProgress: 78,
        portfolioReturn: 9.8,
        portfolioValue: "$1,326",
        discussionPosts: 14,
        flaggedPosts: 0,
      },
      {
        name: "Jordan Lee",
        alias: "BudgetBuilder",
        readiness: 74,
        questProgress: 67,
        portfolioReturn: 6.5,
        portfolioValue: "$1,214",
        discussionPosts: 9,
        flaggedPosts: 1,
      },
      {
        name: "Leo Carter",
        alias: "RiskReady",
        readiness: 63,
        questProgress: 58,
        portfolioReturn: -1.7,
        portfolioValue: "$1,097",
        discussionPosts: 6,
        flaggedPosts: 0,
      },
    ],
  },
  {
    id: "finance-b",
    className: "7th Grade Finance B",
    activeStudents: 29,
    goalsOnTrack: 88,
    questsComplete: 81,
    questsNeedsReview: 3,
    portfolioReturn: 10.2,
    portfolioValue: "$39,482",
    allocation: [
      { name: "Index stocks", value: 49, color: "#28666e" },
      { name: "Roth IRA", value: 18, color: "#f2a541" },
      { name: "Retirement", value: 17, color: "#7c9885" },
      { name: "IPO lab", value: 8, color: "#c44536" },
      { name: "Cash buffer", value: 8, color: "#5c677d" },
    ],
    discussions: {
      posts: 104,
      replies: 69,
      flagged: 1,
      participation: 86,
    },
    students: [
      {
        name: "Maya Patel",
        alias: "CompoundMaya",
        readiness: 91,
        questProgress: 84,
        portfolioReturn: 12.3,
        portfolioValue: "$1,441",
        discussionPosts: 16,
        flaggedPosts: 0,
      },
      {
        name: "Nora Brooks",
        alias: "IndexNora",
        readiness: 79,
        questProgress: 76,
        portfolioReturn: 7.9,
        portfolioValue: "$1,285",
        discussionPosts: 11,
        flaggedPosts: 0,
      },
      {
        name: "Sam Kim",
        alias: "CashCoach",
        readiness: 68,
        questProgress: 64,
        portfolioReturn: 2.4,
        portfolioValue: "$1,148",
        discussionPosts: 8,
        flaggedPosts: 1,
      },
    ],
  },
  {
    id: "investing-lab",
    className: "8th Grade Investing Lab",
    activeStudents: 24,
    goalsOnTrack: 77,
    questsComplete: 69,
    questsNeedsReview: 4,
    portfolioReturn: 5.1,
    portfolioValue: "$31,664",
    allocation: [
      { name: "Index stocks", value: 39, color: "#28666e" },
      { name: "Roth IRA", value: 21, color: "#f2a541" },
      { name: "Retirement", value: 19, color: "#7c9885" },
      { name: "IPO lab", value: 11, color: "#c44536" },
      { name: "Cash buffer", value: 10, color: "#5c677d" },
    ],
    discussions: {
      posts: 87,
      replies: 55,
      flagged: 3,
      participation: 78,
    },
    students: [
      {
        name: "Chris Morgan",
        alias: "IPOScout",
        readiness: 72,
        questProgress: 70,
        portfolioReturn: 4.2,
        portfolioValue: "$1,202",
        discussionPosts: 7,
        flaggedPosts: 1,
      },
      {
        name: "Talia Chen",
        alias: "DiversifyT",
        readiness: 84,
        questProgress: 79,
        portfolioReturn: 8.6,
        portfolioValue: "$1,337",
        discussionPosts: 12,
        flaggedPosts: 0,
      },
      {
        name: "Miles Reed",
        alias: "LongGame",
        readiness: 66,
        questProgress: 61,
        portfolioReturn: -0.8,
        portfolioValue: "$1,118",
        discussionPosts: 5,
        flaggedPosts: 1,
      },
    ],
  },
  {
    id: "personal-finance",
    className: "High School Personal Finance",
    activeStudents: 44,
    goalsOnTrack: 73,
    questsComplete: 66,
    questsNeedsReview: 2,
    portfolioReturn: 6.9,
    portfolioValue: "$60,214",
    allocation: [
      { name: "Index stocks", value: 46, color: "#28666e" },
      { name: "Roth IRA", value: 26, color: "#f2a541" },
      { name: "Retirement", value: 14, color: "#7c9885" },
      { name: "IPO lab", value: 5, color: "#c44536" },
      { name: "Cash buffer", value: 9, color: "#5c677d" },
    ],
    discussions: {
      posts: 136,
      replies: 93,
      flagged: 2,
      participation: 81,
    },
    students: [
      {
        name: "Imani West",
        alias: "RothRunner",
        readiness: 80,
        questProgress: 71,
        portfolioReturn: 9.1,
        portfolioValue: "$1,498",
        discussionPosts: 13,
        flaggedPosts: 0,
      },
      {
        name: "Owen Price",
        alias: "BondBalance",
        readiness: 69,
        questProgress: 63,
        portfolioReturn: 3.8,
        portfolioValue: "$1,267",
        discussionPosts: 7,
        flaggedPosts: 1,
      },
      {
        name: "Selena Ortiz",
        alias: "GoalSetter",
        readiness: 76,
        questProgress: 68,
        portfolioReturn: 7.4,
        portfolioValue: "$1,354",
        discussionPosts: 10,
        flaggedPosts: 0,
      },
    ],
  },
];

const mastery = [
  { concept: "Budgeting", score: 82 },
  { concept: "Stocks", score: 76 },
  { concept: "Retirement", score: 61 },
  { concept: "Risk", score: 72 },
  { concept: "Taxes", score: 54 },
];

type ScoringRule = {
  id: string;
  label: string;
  points: number;
  visibleToStudents: boolean;
};

type TeacherQuest = {
  id: string;
  title: string;
  objective: string;
  marketMode: "none" | "watchlist" | "scenario";
  marketSymbols: string;
  marketWindow: string;
  requireReflection: boolean;
  scoreVisibility: "hidden" | "summary" | "full";
  criteria: ScoringRule[];
  status: "Draft" | "Assigned" | "Review";
  assigned: number;
  submitted: number;
  avgScore: number;
  flagged: number;
  // From the server (v0.2.9). A draft that was never saved has saved false.
  saved?: boolean;
  isMine?: boolean;
  ownerName?: string;
  assignments?: Array<{ className: string; dueAt: string | null; id: string }>;
};

// A saved quest from /api/quests (see lib/server/quests.ts).
type ServerQuest = Omit<TeacherQuest, "avgScore" | "flagged" | "saved"> & {
  isMine: boolean;
  ownerName: string;
  assignments: Array<{ className: string; dueAt: string | null; id: string }>;
};

function toTeacherQuest(quest: ServerQuest): TeacherQuest {
  return { ...quest, avgScore: 0, flagged: 0, saved: true };
}

function newQuestDraft(): TeacherQuest {
  return {
    id: `draft-${Date.now()}`,
    title: "New learning quest",
    objective:
      "Students will make a simulated financial decision and justify it with evidence.",
    marketMode: "none",
    marketSymbols: "",
    marketWindow: "No market window",
    requireReflection: true,
    scoreVisibility: "summary",
    criteria: [
      {
        id: "decision-quality",
        label: "Decision matches the learning objective",
        points: 40,
        visibleToStudents: true,
      },
      {
        id: "teacher-hidden-signal",
        label: "Teacher-only misconception check",
        points: 30,
        visibleToStudents: false,
      },
      {
        id: "reflection",
        label: "Reflection uses portfolio evidence",
        points: 30,
        visibleToStudents: true,
      },
    ],
    status: "Draft",
    assigned: 0,
    submitted: 0,
    avgScore: 0,
    flagged: 0,
    saved: false,
  };
}

async function fetchQuests(scope: "mine" | "library") {
  const response = await fetch(`/api/quests?scope=${scope}`, { credentials: "same-origin" });
  const result = (await response.json()) as { message?: string; quests?: ServerQuest[] };

  if (!response.ok || !result.quests) {
    throw new Error(result.message ?? "Quests couldn't be loaded.");
  }

  return result.quests.map(toTeacherQuest);
}

type MarketQuote = {
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  name: string;
  news: string;
  price: number;
  sector: string;
  ticker: string;
};

// How often the Market screen asks for new prices while it is open.
const LIVE_MARKET_REFRESH_MS = 5000;

type StockHolding = {
  averageCost: number;
  name: string;
  quantity: number;
  ticker: string;
};

// A saved portfolio from /api/portfolios (see lib/server/portfolios.ts).
type ServerPortfolio = {
  activity: Array<{
    amountCents: number | null;
    byOwner: boolean;
    cashAfterCents: number | null;
    createdAt: string;
    id: string;
    kind: string;
    note: string;
    priceCents: number | null;
    quantityUnits: number | null;
    ticker: string | null;
  }>;
  allocation: Array<{ name: string; value: number }>;
  allowFractional: boolean;
  cashCents: number;
  className: string;
  gradeLevel: number | null;
  history: Array<{ recordedAt: string; valueCents: number }>;
  holdings: Array<{
    averageCostCents: number;
    name: string;
    priceCents: number;
    quantityUnits: number;
    ticker: string;
    valueCents: number;
  }>;
  id: string;
  kind: "class" | "practice";
  // Life events (v0.2.17) that hit this portfolio.
  lifeEvents?: StudentLifeEvent[];
  market: {
    // The class's market clock (v0.2.12): speed, paused, open.
    clock?: ClockView;
    scenarioLabel: string;
    simulationMode: string;
    symbols: Array<{ changePercent: number; name: string; news?: string | null; priceCents: number; ticker: string }>;
  };
  readOnly: boolean;
  resetCount: number;
  schoolYear: string;
  startingCashCents: number;
  valueCents: number;
};

const activityLabels: Record<string, string> = {
  allocation: "Allocation",
  buy: "Buy",
  correction: "Correction",
  life_event: "Life event",
  life_event_undo: "Life event undone",
  opened: "Opened",
  reset: "Reset",
  sell: "Sell",
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatShares(units: number) {
  return (units / 10_000).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function portfolioLabel(portfolio: ServerPortfolio) {
  return portfolio.kind === "practice"
    ? `Practice portfolio · ${portfolio.schoolYear.replace("-", "–")}`
    : `${portfolio.className} · ${portfolio.schoolYear.replace("-", "–")}`;
}

/** Turns a saved portfolio into the shapes the existing screens use. */
/** Server prices, with descriptive text from the classroom sample feed. */
function marketSymbolsToQuotes(symbols: ServerPortfolio["market"]["symbols"]) {
  const sampleByTicker = new Map(initialMarketQuotes.map((quote) => [quote.ticker, quote]));

  return symbols.map((symbol): MarketQuote => {
    const sample = sampleByTicker.get(symbol.ticker);
    const price = symbol.priceCents / 100;

    return {
      changePercent: symbol.changePercent,
      dayHigh: roundMoney(Math.max(price, price * (1 + Math.abs(symbol.changePercent) / 200))),
      dayLow: roundMoney(Math.min(price, price * (1 - Math.abs(symbol.changePercent) / 200))),
      name: symbol.name,
      news: symbol.news ?? sample?.news ?? "Classroom simulation market input.",
      price,
      sector: sample?.sector ?? "Class market",
      ticker: symbol.ticker,
    };
  });
}

function portfolioToScreens(portfolio: ServerPortfolio) {

  return {
    activity: portfolio.activity.map(
      (item): PortfolioActivity => ({
        action: activityLabels[item.kind] ?? item.kind,
        amount:
          item.amountCents === null
            ? item.kind === "allocation"
              ? "Targets"
              : formatCurrency((item.cashAfterCents ?? 0) / 100)
            : `${item.amountCents < 0 ? "-" : ""}${formatCurrency(Math.abs(item.amountCents) / 100)}`,
        date: shortDate(item.createdAt),
        id: item.id,
        note: [
          item.ticker && item.quantityUnits !== null && item.priceCents !== null
            ? `${formatShares(item.quantityUnits)} ${item.ticker} at ${formatCurrency(item.priceCents / 100)}`
            : "",
          item.note,
        ]
          .filter(Boolean)
          .join(" · "),
        vehicle: item.ticker ?? "Portfolio",
      })
    ),
    allocation: allocation.map((category) => ({
      ...category,
      value:
        portfolio.allocation.find((target) => target.name === category.name)?.value ??
        category.value,
    })),
    cash: portfolio.cashCents / 100,
    // The chart: the last value of each day, starting from the opening cash.
    chart: (() => {
      const byDay = new Map<string, number>();
      for (const point of portfolio.history) {
        byDay.set(shortDate(point.recordedAt), point.valueCents / 100);
      }
      const points = [...byDay.entries()].map(([month, value]) => ({ month, value }));
      return points.length > 1
        ? points
        : [{ month: "Start", value: portfolio.startingCashCents / 100 }, ...points];
    })(),
    holdings: portfolio.holdings.map(
      (holding): StockHolding => ({
        averageCost: holding.averageCostCents / 100,
        name: holding.name,
        quantity: holding.quantityUnits / 10_000,
        ticker: holding.ticker,
      })
    ),
    // Server prices, with descriptive text from the classroom sample feed.
    quotes: marketSymbolsToQuotes(portfolio.market.symbols),
  };
}

type AdminPage =
  | "overview"
  | "schools"
  | "integrations"
  | "market-engine"
  | "credentials"
  | "privacy"
  | "users"
  | "permissions"
  | "support"
  | "monitoring"
  | "messaging"
  | "portfolio-corrections";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  alias: string;
  email: string;
  role: "Student" | "Teacher" | "Admin";
  className: string;
  classes: string[];
  profileNote: string;
  enabled: boolean;
  permissions: {
    studentProfile: boolean;
    teacherPortal: boolean;
    adminPortal: boolean;
    questImportExport: boolean;
    portfolioCorrections: boolean;
  };
};

type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  alias: string;
  role: AdminUser["role"];
  className: string;
  // Every class the user is assigned to (from the server).
  classNames?: string[];
  permissions: AdminUser["permissions"];
  // Set while an admin is viewing the app as this student.
  actingAdmin?: { email: string; firstName: string; lastName: string };
};

type SupportCase = {
  id: string;
  summary: string;
  requester: string;
  category: string;
  status: "Pending support" | "Pending user";
  createdAt: string;
};

type MonitoringEvent = {
  id: string;
  severity: "Info" | "Warn" | "Error";
  source: string;
  message: string;
  route: string;
  age: string;
  logs: LogEntry[];
  user: {
    name: string;
    email: string;
    role: AdminUser["role"];
    className: string;
  };
};

type PerformanceMetric = {
  id: string;
  route: string;
  operation: string;
  callType: "API" | "Page" | "Integration" | "Messaging";
  durationMs: number;
  duration: string;
  status: "OK" | "Slow" | "Failed";
  traceId: string;
  samples: number[];
};

type IntegrationHealthMetric = {
  id: string;
  connectionName: string;
  rttMs: number;
  errors: string;
  status: "Healthy" | "Degraded" | "Failed";
  samples: number[];
  logs: LogEntry[];
};

type LogEntry = {
  timestamp: string;
  message: string;
};

type SchoolRecord = {
  id: string;
  name: string;
  district: string;
  state: string;
  classes: number;
  students: number;
  status: "Active" | "Setup" | "Paused";
};

type MarketIntegration = {
  id: string;
  provider: string;
  status: "Connected" | "Needs key" | "Testing";
  endpoint: string;
  tokenRequired: boolean;
  token: string;
  pollingFrequency: string;
  targetClass: string;
  symbols: string;
  quoteDelay: string;
  importedSymbols: number;
  lastFetchStatus: string;
  enabled: boolean;
};

type ClassMarketConfig = {
  allowedAssetTypes: string[];
  allowedSymbols: string[];
  className: string;
  eventScenario: "baseline" | "market_drop" | "growth_rally" | "rate_shock";
  simulationMode: "shared_provider" | "teacher_scenario" | "frozen";
  startingCashCents: number;
  teacherControlsEnabled: boolean;
  volatilityMultiplier: number;
  // Set by admins; null = read from the class name. Grade 10+ can trade
  // fractional shares.
  gradeLevel?: number | null;
  // "basic" or "full"; null = follow the grade level (v0.2.11).
  stockInfoLevel?: "basic" | "full" | null;
};

type CredentialRecord = {
  id: string;
  label: string;
  providerName: string;
  credentialType: "api_token" | "username_password" | "oauth_client_secret";
  usernameHint: string;
  tokenPlacement: "bearer" | "query" | "x-api-key" | "basic" | "client-secret";
  scopeType: "district" | "school" | "class";
  scopeId: string;
  status: "active" | "disabled";
  lastRotatedAt: string;
  lastUsedAt: string;
};

const classOptions = [
  "7th Grade Finance A",
  "7th Grade Finance B",
  "8th Grade Investing Lab",
  "High School Personal Finance",
];

const initialAdminUsers: AdminUser[] = [
  {
    id: "user-avery",
    firstName: "Avery",
    lastName: "Johnson",
    alias: "ValueVoyager",
    email: "avery.johnson@student.lincolnusd.edu",
    role: "Student",
    className: "7th Grade Finance A",
    classes: ["7th Grade Finance A"],
    profileNote: "Practicing diversification, budgeting, and Roth IRA basics.",
    enabled: true,
    permissions: {
      studentProfile: true,
      teacherPortal: false,
      adminPortal: false,
      questImportExport: false,
      portfolioCorrections: false,
    },
  },
  {
    id: "user-maya",
    firstName: "Maya",
    lastName: "Patel",
    alias: "CompoundMaya",
    email: "maya.patel@student.lincolnusd.edu",
    role: "Student",
    className: "7th Grade Finance B",
    classes: ["7th Grade Finance B"],
    profileNote: "Working on emergency fund goals and index stock lessons.",
    enabled: true,
    permissions: {
      studentProfile: true,
      teacherPortal: false,
      adminPortal: false,
      questImportExport: false,
      portfolioCorrections: false,
    },
  },
  {
    id: "user-rivera",
    firstName: "Elena",
    lastName: "Rivera",
    alias: "MsRivera",
    email: "erivera@lincolnusd.edu",
    role: "Teacher",
    className: "7th Grade Finance A",
    classes: ["7th Grade Finance A", "7th Grade Finance B"],
    profileNote: "Runs the middle school finance pilot and quest studio.",
    enabled: true,
    permissions: {
      studentProfile: false,
      teacherPortal: true,
      adminPortal: false,
      questImportExport: true,
      portfolioCorrections: false,
    },
  },
  {
    id: "user-admin",
    firstName: "Sam",
    lastName: "Gordon",
    alias: "DistrictAdmin",
    email: "sgordon@lincolnusd.edu",
    role: "Admin",
    className: "District",
    classes: ["District"],
    profileNote: "Supports district rollout, integrations, and permissions.",
    enabled: true,
    permissions: {
      studentProfile: true,
      teacherPortal: true,
      adminPortal: true,
      questImportExport: true,
      portfolioCorrections: true,
    },
  },
];

const initialSupportCases: SupportCase[] = [
  {
    id: "SUP-1042",
    summary: "Teacher cannot see imported roster",
    requester: "Elena Rivera",
    category: "Roster",
    status: "Pending support",
    createdAt: "Today",
  },
  {
    id: "SUP-1038",
    summary: "Student password reset confirmation",
    requester: "Sam Gordon",
    category: "Account",
    status: "Pending user",
    createdAt: "Yesterday",
  },
  {
    id: "SUP-1031",
    summary: "Market feed returned delayed quotes",
    requester: "District admin",
    category: "Integration",
    status: "Pending support",
    createdAt: "Mar 12",
  },
];

const initialCredentials: CredentialRecord[] = [
  {
    id: "credential-market-sandbox",
    label: "FutureFund Sandbox Feed",
    providerName: "FutureFund Sandbox",
    credentialType: "api_token",
    usernameHint: "",
    tokenPlacement: "bearer",
    scopeType: "class",
    scopeId: "7th Grade Finance A",
    status: "active",
    lastRotatedAt: "Demo seed",
    lastUsedAt: "Demo seed",
  },
];

const monitoringEvents: MonitoringEvent[] = [
  {
    id: "err-1041",
    severity: "Warn",
    source: "Integration",
    message: "District Market Provider is missing an API token.",
    route: "/api/integration-test",
    age: "4 min ago",
    logs: [
      {
        timestamp: "2026-09-10 02:41:08 UTC",
        message: "POST /api/integration-test provider=District Market Provider",
      },
      {
        timestamp: "2026-09-10 02:41:08 UTC",
        message: "tokenRequired=true tokenPresent=false",
      },
      {
        timestamp: "2026-09-10 02:41:09 UTC",
        message: "status=Needs key importedSymbols=0",
      },
    ],
    user: {
      name: "Sam Gordon",
      email: "sgordon@lincolnusd.edu",
      role: "Admin",
      className: "District",
    },
  },
  {
    id: "err-1038",
    severity: "Info",
    source: "Messaging",
    message: "Blocked a message with disallowed classroom language.",
    route: "/inbox",
    age: "18 min ago",
    logs: [
      {
        timestamp: "2026-09-10 02:27:14 UTC",
        message: "POST /inbox conversation=teacher-risk-feedback",
      },
      {
        timestamp: "2026-09-10 02:27:14 UTC",
        message: "moderationStatus=blocked profanityDetected=true",
      },
      {
        timestamp: "2026-09-10 02:27:15 UTC",
        message: "message persisted=false",
      },
    ],
    user: {
      name: "Avery Johnson",
      email: "avery.johnson@student.lincolnusd.edu",
      role: "Student",
      className: "7th Grade Finance A",
    },
  },
  {
    id: "err-1032",
    severity: "Error",
    source: "Frontend",
    message: "Example UI crash logs through app/error.tsx.",
    route: "/",
    age: "1 day ago",
    logs: [
      {
        timestamp: "2026-09-09 14:12:30 UTC",
        message: "ErrorBoundary captured render failure",
      },
      {
        timestamp: "2026-09-09 14:12:30 UTC",
        message: "component=StudentPortfolioPage route=/",
      },
      {
        timestamp: "2026-09-09 14:12:31 UTC",
        message: "traceId=client-web-vitals",
      },
    ],
    user: {
      name: "Elena Rivera",
      email: "erivera@lincolnusd.edu",
      role: "Teacher",
      className: "7th Grade Finance A",
    },
  },
];

const performanceMetrics: PerformanceMetric[] = [
  {
    id: "perf-market",
    route: "/api/market",
    operation: "marketSnapshot",
    callType: "API",
    durationMs: 42,
    duration: "42 ms",
    status: "OK",
    traceId: "otel-ready",
    samples: [34, 41, 38, 45, 42, 39, 44],
  },
  {
    id: "perf-integration",
    route: "/api/integration-test",
    operation: "providerGet",
    callType: "Integration",
    durationMs: 812,
    duration: "812 ms",
    status: "Slow",
    traceId: "otel-ready",
    samples: [402, 520, 668, 812, 774, 690, 735],
  },
  {
    id: "perf-home",
    route: "/",
    operation: "navigation",
    callType: "Page",
    durationMs: 286,
    duration: "286 ms",
    status: "OK",
    traceId: "client-web-vitals",
    samples: [244, 260, 286, 270, 252, 248, 266],
  },
  {
    id: "perf-message",
    route: "/inbox",
    operation: "sendMessage",
    callType: "Messaging",
    durationMs: 178,
    duration: "178 ms",
    status: "OK",
    traceId: "client-message-flow",
    samples: [155, 166, 178, 171, 160, 164, 169],
  },
];

const integrationHealthMetrics: IntegrationHealthMetric[] = [
  {
    id: "health-sandbox",
    connectionName: "FutureFund Sandbox Feed",
    rttMs: 126,
    errors: "0",
    status: "Healthy",
    samples: [118, 122, 126, 124, 119, 121, 125],
    logs: [
      {
        timestamp: "2026-09-10 02:40:00 UTC",
        message: "GET /api/market status=200",
      },
      {
        timestamp: "2026-09-10 02:40:00 UTC",
        message: "importedSymbols=4",
      },
      {
        timestamp: "2026-09-10 02:40:01 UTC",
        message: "assignedClass=7th Grade Finance A",
      },
    ],
  },
  {
    id: "health-district",
    connectionName: "District Market Provider",
    rttMs: 812,
    errors: "Missing token",
    status: "Degraded",
    samples: [650, 702, 812, 790, 735, 760, 778],
    logs: [
      {
        timestamp: "2026-09-10 02:41:08 UTC",
        message: "GET https://district-provider.example/quotes status=401",
      },
      {
        timestamp: "2026-09-10 02:41:08 UTC",
        message: "tokenRequired=true tokenSecretRef=null",
      },
      {
        timestamp: "2026-09-10 02:41:09 UTC",
        message: "assignedClass=8th Grade Investing Lab",
      },
    ],
  },
  {
    id: "health-ipo",
    connectionName: "IPO Scenario Feed",
    rttMs: 344,
    errors: "1 timeout today",
    status: "Healthy",
    samples: [310, 328, 350, 344, 330, 338, 342],
    logs: [
      {
        timestamp: "2026-09-10 02:35:00 UTC",
        message: "GET https://sandbox.example/ipo status=200",
      },
      {
        timestamp: "2026-09-10 02:35:00 UTC",
        message: "timeoutCount24h=1",
      },
      {
        timestamp: "2026-09-10 02:35:01 UTC",
        message: "assignedClass=High School Personal Finance",
      },
    ],
  },
];

const initialSchools: SchoolRecord[] = [
  {
    id: "lincoln-middle",
    name: "Lincoln Middle School",
    district: "Lincoln USD",
    state: "CA",
    classes: 6,
    students: 128,
    status: "Active",
  },
  {
    id: "roosevelt-high",
    name: "Roosevelt High School",
    district: "Lincoln USD",
    state: "CA",
    classes: 4,
    students: 94,
    status: "Setup",
  },
  {
    id: "central-academy",
    name: "Central STEM Academy",
    district: "Lincoln USD",
    state: "CA",
    classes: 3,
    students: 71,
    status: "Active",
  },
];

const initialMarketIntegrations: MarketIntegration[] = [
  {
    id: "sandbox-market-feed",
    provider: "FutureFund Sandbox Feed",
    status: "Connected",
    endpoint: "/api/market",
    tokenRequired: false,
    token: "",
    pollingFrequency: "15 minutes",
    targetClass: "7th Grade Finance A",
    symbols: "SPY, QQQ, BND, VTI",
    quoteDelay: "15 minutes",
    importedSymbols: 4,
    lastFetchStatus: "Last GET succeeded",
    enabled: true,
  },
  {
    id: "district-provider",
    provider: "District Market Provider",
    status: "Needs key",
    endpoint: "https://district-provider.example/quotes",
    tokenRequired: true,
    token: "",
    pollingFrequency: "Manual",
    targetClass: "8th Grade Investing Lab",
    symbols: "Up to 200 symbols",
    quoteDelay: "Delayed",
    importedSymbols: 0,
    lastFetchStatus: "Waiting for API token",
    enabled: false,
  },
];

const initialClassMarketConfigs: ClassMarketConfig[] = [
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND", "IPO-LAB"],
    className: "7th Grade Finance A",
    eventScenario: "market_drop",
    simulationMode: "teacher_scenario",
    startingCashCents: 100000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.2,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND"],
    className: "7th Grade Finance B",
    eventScenario: "baseline",
    simulationMode: "shared_provider",
    startingCashCents: 100000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Roth IRA", "Cash"],
    allowedSymbols: ["VTI", "VXUS", "BND", "SPY"],
    className: "8th Grade Investing Lab",
    eventScenario: "growth_rally",
    simulationMode: "teacher_scenario",
    startingCashCents: 150000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.35,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Retirement", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND", "VTI"],
    className: "High School Personal Finance",
    eventScenario: "rate_shock",
    simulationMode: "teacher_scenario",
    startingCashCents: 200000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.1,
  },
];

const privacyPostures = [
  {
    value: "standard",
    label: "Standard school privacy",
    description:
      "FERPA/COPPA-aware defaults, simulated portfolios, text-only messaging, and district roster access.",
  },
  {
    value: "state-restricted",
    label: "State restricted",
    description:
      "Adds stricter message retention, limited profile fields, and admin approval for integrations.",
  },
  {
    value: "district-custom",
    label: "District custom",
    description:
      "Uses district-specific data retention, support routing, and privacy contact requirements.",
  },
];

const implementation = [
  "Single student profile across web, iOS, and Android",
  "Teacher roster, assignments, and concept mastery reports",
  "District privacy controls aligned to FERPA and COPPA workflows",
  "Market data provider layer for delayed or classroom-safe quotes",
  "Simulated portfolios with no real-money transactions",
];

const roleOptions = [
  {
    value: "student",
    label: "Student",
    description: "Learner dashboard",
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Classroom tools",
  },
  {
    value: "admin",
    label: "Admin",
    description: "System portal",
  },
] as const;

// These match the users in scripts/seed-demo-data.mjs (live database) and
// seedAuthUsers in lib/server/auth.ts (local development without a database).
const demoLoginAccounts = [
  {
    label: "Demo super user (all roles)",
    email: "demo-user@demo.edu",
    password: "demo-user",
  },
];

const adminModules = [
  {
    title: "Users",
    detail: "Create users, assign schools, disable accounts, and import rosters.",
    status: "128 active",
    icon: UserCog,
  },
  {
    title: "Permissions",
    detail: "Control messaging, quest authoring, template approval, and portfolio edits.",
    status: "3 roles",
    icon: ShieldCheck,
  },
  {
    title: "Support",
    detail: "Track login issues, blocked messages, sync errors, and support contact routing.",
    status: "4 open",
    icon: Wrench,
  },
  {
    title: "Monitoring",
    detail: "Review app errors, slow requests, integration health, and OTEL hooks.",
    status: "OTEL ready",
    icon: Gauge,
  },
  {
    title: "Market APIs",
    detail: "Connect data providers, test quote health, and set classroom-safe feeds.",
    status: "Mock live",
    icon: PlugZap,
  },
  {
    title: "Market Simulator",
    detail: "Manage the central simulator and class-specific market contexts.",
    status: "Class scoped",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Credential Vault",
    detail: "Store integration secrets in the backend vault and manage rotations.",
    status: "Secret-backed",
    icon: KeyRound,
  },
  {
    title: "View as student",
    detail: "Use the app as a specific student to troubleshoot an issue they reported.",
    status: "Audited",
    icon: UserRoundSearch,
  },
  {
    title: "School year",
    detail: "Set the first and last day of the school year for portfolio records.",
    status: "Aug 28 – Jun 1",
    icon: CalendarDays,
  },
  {
    title: "Email",
    detail: "Check email setup, send a test email, and review recent deliveries.",
    status: "Resend",
    icon: Mail,
  },
  {
    title: "Password resets",
    detail: "Reset credentials, review SSO status, and clear locked accounts.",
    status: "2 pending",
    icon: KeyRound,
  },
  {
    title: "Portfolio corrections",
    detail: "Adjust simulated balances or holdings with a required audit reason.",
    status: "Audit required",
    icon: WalletCards,
  },
  {
    title: "Messaging",
    detail: "Review flagged messages, set allowed email domains, and manage parent contacts.",
    status: "90-day cleanup",
    icon: MessageCircle,
  },
];

export default function Home() {
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(null);
  // false until we've asked the server whether a session cookie is still
  // valid, so a refresh doesn't flash the login page.
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState(demoLoginAccounts[0].email);
  const [loginPassword, setLoginPassword] = useState(
    demoLoginAccounts[0].password
  );
  const [loginNotice, setLoginNotice] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [loginChallengeQuestion, setLoginChallengeQuestion] = useState<
    string | null
  >(null);
  const [loginChallengeAnswer, setLoginChallengeAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("student");
  const [activeStudentPage, setActiveStudentPage] = useState<
    "dashboard" | "portfolio" | "profile"
  >("dashboard");
  const [activeTeacherPage, setActiveTeacherPage] = useState<
    "dashboard" | "students"
  >("dashboard");
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfileUserId, setSelectedProfileUserId] =
    useState("user-avery");
  const [scenarioDay, setScenarioDay] = useState(0);
  const [goalBoost, setGoalBoost] = useState(0);
  const [allocationTargets, setAllocationTargets] = useState(allocation);
  const [portfolioActivity, setPortfolioActivity] = useState(
    initialPortfolioActivity
  );
  const [studentCash, setStudentCash] = useState(525);
  const [studentHoldings, setStudentHoldings] = useState<StockHolding[]>(
    initialStudentHoldings
  );
  const [marketQuotes, setMarketQuotes] =
    useState<MarketQuote[]>(initialMarketQuotes);
  const [marketNotice, setMarketNotice] = useState("");
  // Saved portfolios (all classes, all school years) from /api/portfolios.
  const [profilePortfolios, setProfilePortfolios] = useState<ServerPortfolio[] | null>(null);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const [portfolioLoadError, setPortfolioLoadError] = useState("");
  const activePortfolio =
    profilePortfolios?.find((item) => item.id === activePortfolioId) ?? null;
  // Saved quests (v0.2.9): this teacher's own, and the shared library.
  const [teacherQuests, setTeacherQuests] = useState<TeacherQuest[]>([]);
  const [libraryQuests, setLibraryQuests] = useState<TeacherQuest[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [assignQuestOpen, setAssignQuestOpen] = useState(false);
  const [questNotice, setQuestNotice] = useState("");
  const [questsVersion, setQuestsVersion] = useState(0);
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedAdminLibraryQuest, setSelectedAdminLibraryQuest] =
    useState<TeacherQuest | null>(null);
  const [adminQuestDetailsOpen, setAdminQuestDetailsOpen] = useState(false);
  const [draftQuest, setDraftQuest] = useState<TeacherQuest>(newQuestDraft);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [discussionUnread, setDiscussionUnread] = useState(0);
  const [pendingMessageEmail, setPendingMessageEmail] = useState("");
  const [activeAdminPage, setActiveAdminPage] =
    useState<AdminPage>("overview");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [userClassFilter, setUserClassFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userImportNotice, setUserImportNotice] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserAlias, setNewUserAlias] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] =
    useState<AdminUser["role"]>("Student");
  const [newUserClassName, setNewUserClassName] = useState(classOptions[0]);
  const [newUserTemporaryPassword, setNewUserTemporaryPassword] = useState("");
  const [selectedPermissionUserId, setSelectedPermissionUserId] = useState(
    initialAdminUsers[0].id
  );
  const [supportCases, setSupportCases] =
    useState<SupportCase[]>(initialSupportCases);
  const [supportSummary, setSupportSummary] = useState("");
  const [supportCategory, setSupportCategory] = useState("Account");
  const [resetEmail, setResetEmail] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [questTransferText, setQuestTransferText] = useState("");
  const [questTransferNotice, setQuestTransferNotice] = useState("");
  const [schools, setSchools] = useState<SchoolRecord[]>(initialSchools);
  const [schoolName, setSchoolName] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("Lincoln USD");
  const [schoolState, setSchoolState] = useState("CA");
  const [schoolClassCount, setSchoolClassCount] = useState("0");
  const [schoolStudentCount, setSchoolStudentCount] = useState("0");
  const [marketIntegrations, setMarketIntegrations] = useState<
    MarketIntegration[]
  >(initialMarketIntegrations);
  const [classMarketConfigs, setClassMarketConfigs] = useState<ClassMarketConfig[]>(
    initialClassMarketConfigs
  );
  const [integrationProvider, setIntegrationProvider] = useState("");
  const [integrationEndpoint, setIntegrationEndpoint] = useState("/api/market");
  const [integrationTokenRequired, setIntegrationTokenRequired] =
    useState(false);
  const [integrationToken, setIntegrationToken] = useState("");
  const [integrationPollingFrequency, setIntegrationPollingFrequency] =
    useState("15 minutes");
  const [integrationTargetClass, setIntegrationTargetClass] = useState(
    classOptions[0]
  );
  const [integrationSymbols, setIntegrationSymbols] = useState("");
  const [credentials, setCredentials] =
    useState<CredentialRecord[]>(initialCredentials);
  const [credentialLabel, setCredentialLabel] = useState("");
  const [credentialProvider, setCredentialProvider] = useState("");
  const [credentialType, setCredentialType] =
    useState<CredentialRecord["credentialType"]>("api_token");
  const [credentialPlacement, setCredentialPlacement] =
    useState<CredentialRecord["tokenPlacement"]>("bearer");
  const [credentialScopeType, setCredentialScopeType] =
    useState<CredentialRecord["scopeType"]>("district");
  const [credentialScopeId, setCredentialScopeId] = useState("district-lincoln-usd");
  const [credentialUsername, setCredentialUsername] = useState("");
  const [credentialSecret, setCredentialSecret] = useState("");
  const [credentialNotice, setCredentialNotice] = useState("");
  const [privacyPosture, setPrivacyPosture] = useState("standard");
  const [privacyContact, setPrivacyContact] = useState(
    "privacy@lincolnusd.edu"
  );

  const savedChart = useMemo(
    () => (activePortfolio ? portfolioToScreens(activePortfolio).chart : null),
    [activePortfolio]
  );
  const samplePortfolio = useMemo(
    () =>
      basePortfolio.map((point, index) => ({
        ...point,
        value:
          point.value +
          Math.round(goalBoost * 5.8) +
          (index === basePortfolio.length - 1 ? scenarioDay * 31 : 0),
      })),
    [goalBoost, scenarioDay]
  );
  const portfolio = savedChart ?? samplePortfolio;

  const latestValue = portfolio[portfolio.length - 1].value;
  const totalGrowth = Math.round(
    ((latestValue - portfolio[0].value) / portfolio[0].value) * 100
  );
  const readinessScore = Math.min(98, 71 + scenarioDay * 3 + goalBoost);
  const allocationTotal = allocationTargets.reduce(
    (total, item) => total + item.value,
    0
  );
  const largestAllocation = allocationTargets.reduce(
    (largest, item) => Math.max(largest, item.value),
    0
  );
  const cashBuffer =
    allocationTargets.find((item) => item.name === "Cash buffer")?.value ?? 0;
  const stockHoldingsValue = studentHoldings.reduce((total, holding) => {
    const quote = marketQuotes.find((item) => item.ticker === holding.ticker);

    return total + holding.quantity * (quote?.price ?? holding.averageCost);
  }, 0);
  const selectedQuest =
    teacherQuests.find((quest) => quest.id === selectedQuestId) ?? draftQuest;
  const hiddenRuleCount = draftQuest.criteria.filter(
    (criterion) => !criterion.visibleToStudents
  ).length;
  const draftPoints = draftQuest.criteria.reduce(
    (total, criterion) => total + criterion.points,
    0
  );
  const availableRoleOptions = authenticatedUser
    ? roleOptions.filter((role) => canUseRole(role.value, authenticatedUser))
    : roleOptions;
  const activeRole =
    availableRoleOptions.find((role) => role.value === activeTab) ??
    availableRoleOptions[0] ??
    roleOptions[0];
  const selectedPrivacyPosture =
    privacyPostures.find((posture) => posture.value === privacyPosture) ??
    privacyPostures[0];
  const filteredAdminUsers = adminUsers.filter((user) => {
    const classMatches =
      userClassFilter === "all" || user.className === userClassFilter;
    const roleMatches = userRoleFilter === "all" || user.role === userRoleFilter;

    return classMatches && roleMatches;
  });
  const selectedPermissionUser =
    adminUsers.find((user) => user.id === selectedPermissionUserId) ??
    adminUsers[0];
  const currentStudentUser =
    adminUsers.find((user) => user.id === "user-avery") ?? adminUsers[0];
  const currentTeacherUser =
    adminUsers.find((user) => user.role === "Teacher") ?? currentStudentUser;
  const isTeacherRoleView = activeTab === "teacher";
  const isAdminRoleView = activeTab === "admin";
  const profileCellUser = isTeacherRoleView
    ? currentTeacherUser
    : currentStudentUser;
  const profileCellMetrics = isTeacherRoleView
    ? [
        { label: "Managed classes", value: `${currentTeacherUser.classes.length}` },
        { label: "Authored quests", value: `${teacherQuests.length}` },
        { label: "Inbox unread", value: `${inboxUnread}` },
      ]
    : [
        { label: "Financial readiness", value: `${readinessScore}%` },
        { label: "Learning streak", value: "12 days" },
        { label: "Teacher assigned quests", value: "3 active" },
      ];
  const selectedProfileUser =
    adminUsers.find((user) => user.id === selectedProfileUserId) ??
    currentStudentUser;
  const profileSearchResults = adminUsers
    .filter((user) => user.enabled)
    .filter((user) => {
      const query = profileSearch.trim().toLowerCase();

      if (!query) {
        return false;
      }

      return [
        user.firstName,
        user.lastName,
        user.alias,
        user.email,
        user.role,
        user.className,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .slice(0, 5);
  const teacherStudentsTotal = teacherClassAnalytics.reduce(
    (total, classroom) => total + classroom.activeStudents,
    0
  );
  const teacherClassCount = teacherClassAnalytics.length;
  const teacherAverageMastery = Math.round(
    teacherClassAnalytics.reduce(
      (total, classroom) => total + classroom.goalsOnTrack,
      0
    ) / teacherClassAnalytics.length
  );

  // On page load, restore the signed-in user from the session cookie, so
  // refreshing the page keeps the user signed in.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ user?: AuthenticatedUser | null }>)
          : { user: null }
      )
      .then((result) => {
        if (!cancelled && result.user) {
          setAuthenticatedUser(result.user);
          setActiveTab(roleToTab(result.user.role));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setSessionChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved quests for teachers and admins: their own and the library.
  // questsVersion is bumped after every save, copy, assign, or import.
  useEffect(() => {
    if (!authenticatedUser?.permissions.teacherPortal && authenticatedUser?.role !== "Admin") {
      return;
    }

    let cancelled = false;

    Promise.all([fetchQuests("mine"), fetchQuests("library")])
      .then(([mine, library]) => {
        if (cancelled) return;
        setTeacherQuests(mine);
        setLibraryQuests(library);
      })
      .catch((error: Error) => {
        if (!cancelled) setQuestNotice(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedUser, questsVersion]);

  // Load the signed-in user's saved portfolios. The active one is this
  // school year's first class portfolio (or the staff practice portfolio).
  useEffect(() => {
    if (!authenticatedUser) {
      return;
    }

    let cancelled = false;

    fetch("/api/portfolios", { credentials: "same-origin" })
      .then(async (response) => {
        const result = (await response.json()) as {
          message?: string;
          portfolios?: ServerPortfolio[];
        };

        if (cancelled) return;

        if (!response.ok || !result.portfolios) {
          setPortfolioLoadError(result.message ?? "Your portfolio couldn't be loaded.");
          return;
        }

        const current =
          result.portfolios.find((item) => !item.readOnly) ?? result.portfolios[0];

        setPortfolioLoadError("");
        setProfilePortfolios(result.portfolios);

        if (current) {
          const screens = portfolioToScreens(current);
          setActivePortfolioId(current.id);
          setStudentCash(screens.cash);
          setStudentHoldings(screens.holdings);
          setPortfolioActivity(screens.activity);
          setAllocationTargets(screens.allocation);
          setMarketQuotes(screens.quotes);
        }
      })
      .catch(() => {
        if (!cancelled) setPortfolioLoadError("Your portfolio couldn't be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedUser]);

  // Running market (v0.2.12): while the Market tab is open, fetch the
  // portfolio's current prices and clock every few seconds.
  const [liveMarketTick, setLiveMarketTick] = useState(0);
  const refreshLiveMarket = useCallback(() => setLiveMarketTick((tick) => tick + 1), []);

  useEffect(() => {
    if (!authenticatedUser || activeTab !== "market" || !activePortfolioId) {
      return;
    }

    let cancelled = false;
    const portfolioId = activePortfolioId;
    const load = () => {
      if (document.hidden) return;

      fetch(`/api/portfolios/live?portfolioId=${encodeURIComponent(portfolioId)}`, { credentials: "same-origin" })
        .then(async (response) => {
          const result = (await response.json()) as {
            market?: ServerPortfolio["market"] & { cashCents?: number; lifeEvents?: StudentLifeEvent[] };
          };

          if (cancelled || !response.ok || !result.market) return;

          const { cashCents, lifeEvents, ...market } = result.market;

          setProfilePortfolios(
            (current) =>
              current?.map((item) =>
                item.id === portfolioId
                  ? { ...item, cashCents: cashCents ?? item.cashCents, lifeEvents: lifeEvents ?? item.lifeEvents, market }
                  : item
              ) ?? current
          );
          setMarketQuotes(marketSymbolsToQuotes(market.symbols));
          if (typeof cashCents === "number") setStudentCash(cashCents / 100);
        })
        .catch(() => undefined);
    };

    load();
    const timer = window.setInterval(load, LIVE_MARKET_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activePortfolioId, activeTab, authenticatedUser, liveMarketTick]);

  useEffect(() => {
    if (authenticatedUser?.role !== "Admin") {
      return;
    }

    let cancelled = false;

    async function hydrateAdminState() {
      try {
        const response = await fetch("/api/admin/state", {
          credentials: "same-origin",
        });
        const result = (await response.json()) as {
          ok?: boolean;
          state?: {
            adminUsers?: Array<{
              alias: string;
              class_name: string | null;
              email: string;
              first_name: string;
              id: string;
              last_name: string;
              role: string | null;
              status: string;
            }>;
            credentials?: Array<{
              credential_type: CredentialRecord["credentialType"];
              id: string;
              label: string;
              last_rotated_at: string | null;
              last_used_at: string | null;
              provider_name: string;
              scope_id: string;
              scope_type: CredentialRecord["scopeType"];
              status: CredentialRecord["status"];
              token_placement: CredentialRecord["tokenPlacement"];
              username_hint: string | null;
            }>;
            marketIntegrations?: Array<{
              allowed_symbols_csv: string;
              credential_id?: string | null;
              endpoint_url: string;
              id: string;
              max_symbols: number;
              polling_frequency_minutes: number;
              provider_name: string;
              status: string;
              target_class?: string | null;
              token_placement?: string | null;
              token_required: boolean;
            }>;
            schools?: Array<{
              class_count: number;
              id: string;
              name: string;
              student_count: number;
            }>;
            supportCases?: Array<{
              category: string;
              created_at: string;
              id: string;
              status: string;
              summary: string;
            }>;
            privacyPosture?: {
              posture: string;
              privacy_contact_email: string;
            } | null;
            classMarketConfigs?: Array<{
              allowed_asset_types_json: string;
              allowed_symbols_csv: string;
              class_name: string;
              event_scenario: ClassMarketConfig["eventScenario"];
              simulation_mode: ClassMarketConfig["simulationMode"];
              starting_cash_cents: number;
              teacher_controls_enabled: boolean;
              grade_level?: number | null;
              stock_info_level?: string | null;
              volatility_multiplier: number;
            }>;
          };
        };

        if (cancelled || !result.ok || !result.state) {
          return;
        }

        if (result.state.adminUsers?.length) {
          setAdminUsers(
            result.state.adminUsers.map((user) => ({
              alias: user.alias,
              className: user.role === "Admin" ? "District" : user.class_name ?? "",
              classes: [user.role === "Admin" ? "District" : user.class_name ?? ""],
              email: user.email,
              enabled: user.status === "active",
              firstName: user.first_name,
              id: user.id,
              lastName: user.last_name,
              permissions: permissionsForRole(normalizeRole(user.role ?? "")),
              profileNote: "Loaded from production database.",
              role: normalizeRole(user.role ?? ""),
            }))
          );
        }

        if (result.state.schools?.length) {
          setSchools(
            result.state.schools.map((school) => ({
              classes: school.class_count,
              district: "Lincoln USD",
              id: school.id,
              name: school.name,
              state: "CA",
              status: "Active" as const,
              students: school.student_count,
            }))
          );
        }

        if (result.state.supportCases?.length) {
          setSupportCases(
            result.state.supportCases.map((item) => ({
              category: item.category,
              createdAt: new Date(item.created_at).toLocaleDateString(),
              id: item.id,
              requester: "District admin",
              status:
                item.status === "Pending user" ? "Pending user" : "Pending support",
              summary: item.summary,
            }))
          );
        }

        if (result.state.credentials?.length) {
          setCredentials(
            result.state.credentials.map((credential) => ({
              credentialType: credential.credential_type,
              id: credential.id,
              label: credential.label,
              lastRotatedAt: credential.last_rotated_at
                ? new Date(credential.last_rotated_at).toLocaleString()
                : "Never",
              lastUsedAt: credential.last_used_at
                ? new Date(credential.last_used_at).toLocaleString()
                : "Never",
              providerName: credential.provider_name,
              scopeId: credential.scope_id,
              scopeType: credential.scope_type,
              status: credential.status,
              tokenPlacement: credential.token_placement,
              usernameHint: credential.username_hint ?? "",
            }))
          );
        }

        if (result.state.marketIntegrations?.length) {
          setMarketIntegrations(
            result.state.marketIntegrations.map((integration) => ({
              enabled: integration.status !== "deleted",
              endpoint: integration.endpoint_url,
              id: integration.id,
              importedSymbols: integration.allowed_symbols_csv
                ? integration.allowed_symbols_csv.split(",").filter(Boolean).length
                : integration.max_symbols,
              lastFetchStatus: integration.status,
              pollingFrequency: `${integration.polling_frequency_minutes} minutes`,
              provider: integration.provider_name,
              quoteDelay: `${integration.polling_frequency_minutes} minutes`,
              status:
                integration.status === "Needs key"
                  ? ("Needs key" as const)
                  : ("Connected" as const),
              symbols: integration.allowed_symbols_csv || "Up to 200 symbols",
              targetClass: integration.target_class || classOptions[0],
              token: "",
              tokenRequired: integration.token_required,
            }))
          );
        }

        if (result.state.classMarketConfigs?.length) {
          setClassMarketConfigs(
            result.state.classMarketConfigs.map((config) => ({
              allowedAssetTypes: parseJsonList(config.allowed_asset_types_json),
              allowedSymbols: config.allowed_symbols_csv
                .split(",")
                .map((symbol) => symbol.trim().toUpperCase())
                .filter(Boolean),
              className: config.class_name,
              eventScenario: config.event_scenario,
              simulationMode: config.simulation_mode,
              startingCashCents: config.starting_cash_cents,
              teacherControlsEnabled: config.teacher_controls_enabled,
              volatilityMultiplier: Number(config.volatility_multiplier),
              gradeLevel: config.grade_level ?? null,
              stockInfoLevel:
                config.stock_info_level === "basic" || config.stock_info_level === "full"
                  ? config.stock_info_level
                  : null,
            }))
          );
        }

        const savedPrivacy = result.state.privacyPosture;

        if (
          savedPrivacy &&
          privacyPostures.some((option) => option.value === savedPrivacy.posture)
        ) {
          setPrivacyPosture(savedPrivacy.posture);
          setPrivacyContact(savedPrivacy.privacy_contact_email);
        }
      } catch {
        // The prototype seed data remains available when production state is unavailable.
      }
    }

    void hydrateAdminState();

    return () => {
      cancelled = true;
    };
  }, [authenticatedUser]);

  async function postAdminMutation<T>(
    path: string,
    body: Record<string, unknown>
  ) {
    const response = await fetch(path, {
      body: JSON.stringify(body),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as T & {
      message?: string;
      ok?: boolean;
    };

    if (!response.ok || result.ok === false) {
      throw new Error(result.message ?? "Admin action could not be saved.");
    }

    return result;
  }

  function updateCriterion(
    criterionId: string,
    updates: Partial<ScoringRule>
  ) {
    setDraftQuest((quest) => ({
      ...quest,
      criteria: quest.criteria.map((criterion) =>
        criterion.id === criterionId
          ? { ...criterion, ...updates }
          : criterion
      ),
    }));
  }

  function loadQuest(quest: TeacherQuest) {
    setSelectedQuestId(quest.id);
    setDraftQuest(quest);
    setQuestNotice("");
  }

  function openAdminQuestDetails(quest: TeacherQuest) {
    setSelectedAdminLibraryQuest(quest);
    setAdminQuestDetailsOpen(true);
  }

  function createBlankQuest() {
    const nextQuest = newQuestDraft();

    setSelectedQuestId(nextQuest.id);
    setDraftQuest(nextQuest);
    setQuestNotice("");
  }

  async function saveDraftQuest() {
    const isSaved = teacherQuests.some((quest) => quest.id === draftQuest.id);

    try {
      const result = await postAdminMutation<{ id: string }>("/api/quests", {
        action: "save",
        quest: draftQuest,
        questId: isSaved ? draftQuest.id : null,
      });
      const saved = { ...draftQuest, id: result.id, saved: true, isMine: true };

      setDraftQuest(saved);
      setSelectedQuestId(result.id);
      setQuestNotice(`Saved "${draftQuest.title}".`);
      setQuestsVersion((version) => version + 1);
    } catch (error) {
      setQuestNotice((error as Error).message);
    }
  }

  async function copyLibraryQuest(quest: TeacherQuest) {
    try {
      const result = await postAdminMutation<{ id: string }>("/api/quests", {
        action: "copy",
        questId: quest.id,
      });
      const copy = { ...quest, id: result.id, isMine: true, saved: true, assignments: [], assigned: 0, submitted: 0, status: "Draft" as const };

      setDraftQuest(copy);
      setSelectedQuestId(result.id);
      setQuestNotice(`Copied "${quest.title}" into your quests. Edit it and assign it when ready.`);
      setQuestsVersion((version) => version + 1);
    } catch (error) {
      setQuestNotice((error as Error).message);
    }
  }

  function onQuestAssigned(message: string) {
    setQuestNotice(message);
    setQuestsVersion((version) => version + 1);
  }

  function updateUserAlias(userId: string, alias: string) {
    setAdminUsers((users) =>
      users.map((user) => (user.id === userId ? { ...user, alias } : user))
    );
  }

  /** Shows a saved portfolio on every student screen. */
  function applyPortfolio(updated: ServerPortfolio) {
    const screens = portfolioToScreens(updated);

    setProfilePortfolios((current) =>
      current?.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [...(current ?? []), updated]
    );
    setActivePortfolioId(updated.id);
    setStudentCash(screens.cash);
    setStudentHoldings(screens.holdings);
    setPortfolioActivity(screens.activity);
    setAllocationTargets(screens.allocation);
    setMarketQuotes(screens.quotes);
  }

  function selectPortfolio(portfolioId: string) {
    const selected = profilePortfolios?.find((item) => item.id === portfolioId);

    if (selected) {
      applyPortfolio(selected);
    }
  }

  // Trades go to the server, which prices them from the class market and
  // checks cash, shares owned, whole vs fractional shares, and read-only years.
  // max = "Buy max": the server works out the most whole shares the cash covers.
  async function tradeStock(ticker: string, action: "buy" | "sell", shares = 1, max = false) {
    if (!activePortfolio) {
      setMarketNotice("Your portfolio isn't available right now.");
      return;
    }

    setMarketNotice("");

    try {
      const response = await fetch("/api/portfolios/trade", {
        body: JSON.stringify({
          max,
          portfolioId: activePortfolio.id,
          shares,
          side: action,
          ticker,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        portfolio?: ServerPortfolio;
      };

      if (!response.ok || !result.portfolio) {
        setMarketNotice(result.message ?? "The trade could not be completed.");
        return;
      }

      applyPortfolio(result.portfolio);
      // Prices keep moving (v0.2.12), so say which price the trade got.
      const filled = result.portfolio.activity
        .filter((item) => item.kind === action && item.ticker === ticker && item.priceCents !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      // Buy max: the server decided how many shares, so report what it bought.
      const filledShares = max && filled?.quantityUnits != null ? filled.quantityUnits / 10_000 : shares;
      const shareText = `${filledShares.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${
        filledShares === 1 ? "share" : "shares"
      }`;
      const priceText = filled?.priceCents != null ? ` Price: ${formatCurrency(filled.priceCents / 100)} a share.` : "";
      setMarketNotice(
        `${action === "buy" ? "Bought" : "Sold"} ${shareText} of ${ticker}.${priceText}`
      );
    } catch {
      setMarketNotice("The trade could not be completed. Try again in a moment.");
    }
  }

  function openUserProfile(userId: string) {
    setSelectedProfileUserId(userId);
    setActiveTab("student");
    setActiveStudentPage("profile");
  }

  function messageUser(userId: string) {
    const user = adminUsers.find((item) => item.id === userId);

    if (!user) {
      return;
    }

    // The Inbox starts (or reopens) the conversation; the server checks that
    // you're allowed to message this person.
    setPendingMessageEmail(user.email);
    setActiveTab("inbox");
    setActiveStudentPage("dashboard");
  }

  async function exportLearningQuests() {
    try {
      const result = await postAdminMutation<{ quests: unknown[] }>("/api/admin/quests/transfer", {
        action: "export",
        reason: "Learning quest template export",
      });
      setQuestTransferText(JSON.stringify(result.quests, null, 2));
      setQuestTransferNotice(
        `${result.quests.length} saved quest${result.quests.length === 1 ? "" : "s"} exported as JSON and audited.`
      );
    } catch (error) {
      setQuestTransferNotice((error as Error).message);
    }
  }

  async function importLearningQuests() {
    let parsed: unknown;

    try {
      parsed = JSON.parse(questTransferText);
    } catch {
      setQuestTransferNotice("Import failed. Paste valid learning quest JSON.");
      return;
    }

    try {
      const result = await postAdminMutation<{ count: number }>("/api/admin/quests/transfer", {
        action: "import",
        payload: parsed,
        reason: "Learning quest template import",
      });
      setQuestTransferNotice(
        `${result.count} learning quest${result.count === 1 ? "" : "s"} imported, saved to your quests, and audited.`
      );
      setQuestsVersion((version) => version + 1);
    } catch (error) {
      setQuestTransferNotice(`Import failed: ${(error as Error).message}`);
    }
  }

  async function toggleUserEnabled(userId: string, enabled: boolean) {
    try {
      await postAdminMutation("/api/admin/users", {
        action: enabled ? "enable" : "disable",
        reason: enabled ? "Admin enabled user" : "Admin disabled user",
        targetUserId: userId,
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return;
    }

    setAdminUsers((users) =>
      users.map((user) => (user.id === userId ? { ...user, enabled } : user))
    );
  }

  async function updateUserPermission(
    userId: string,
    permission: keyof AdminUser["permissions"],
    enabled: boolean
  ) {
    try {
      await postAdminMutation("/api/admin/permissions", {
        enabled,
        permission,
        reason: "Admin permission update",
        targetUserId: userId,
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return;
    }

    setAdminUsers((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [permission]: user.role === "Admin" ? true : enabled,
              },
            }
          : user
      )
    );
  }

  async function importUsersFromCsv(csvText: string) {
    const importedUsers = parseUsersCsv(csvText);

    if (!importedUsers.length) {
      setUserImportNotice(
        "No users imported. Check that the CSV includes at least an email column."
      );
      return;
    }

    try {
      await postAdminMutation("/api/admin/users", {
        action: "import",
        reason: "CSV roster import",
        users: importedUsers.map(({ email, role, className, firstName, lastName }) => ({
          className,
          email,
          firstName,
          lastName,
          role,
        })),
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return;
    }

    setAdminUsers((users) => {
      const existingEmails = new Set(users.map((user) => user.email.toLowerCase()));
      const newUsers = importedUsers.filter(
        (user) => !existingEmails.has(user.email.toLowerCase())
      );

      setUserImportNotice(
        `${newUsers.length} users imported. ${
          importedUsers.length - newUsers.length
        } duplicate emails skipped.`
      );

      return [...newUsers, ...users];
    });
  }

  async function createIndividualUser() {
    const firstName = newUserFirstName.trim();
    const lastName = newUserLastName.trim();
    const email = newUserEmail.trim().toLowerCase();
    const temporaryPassword = newUserTemporaryPassword.trim();

    if (!firstName || !lastName || !email) {
      setUserImportNotice("First name, last name, and email are required.");
      return;
    }

    if (adminUsers.some((user) => user.email.toLowerCase() === email)) {
      setUserImportNotice("A user with that email already exists.");
      return;
    }

    const className = newUserRole === "Admin" ? "District" : newUserClassName;
    const createdUser: AdminUser = {
      id: `user-${Date.now()}`,
      firstName,
      lastName,
      alias:
        newUserAlias.trim() ||
        `${firstName}${lastName}`.replace(/\s/g, ""),
      email,
      role: newUserRole,
      className,
      classes: [className],
      profileNote: "Created by district admin.",
      enabled: true,
      permissions: permissionsForRole(newUserRole),
    };

    try {
      await postAdminMutation("/api/admin/users", {
        action: "create",
        reason: "Individual admin user creation",
        targetUserId: createdUser.id,
        users: [
          {
            className: createdUser.className,
            email: createdUser.email,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            role: createdUser.role,
            temporaryPassword,
          },
        ],
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return;
    }

    setAdminUsers((users) => [createdUser, ...users]);
    setUserImportNotice(
      `${firstName} ${lastName} created. ${
        temporaryPassword
          ? "Temporary credential captured for first login workflow."
          : "Credential setup can be completed with password reset or SSO."
      }`
    );
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserAlias("");
    setNewUserEmail("");
    setNewUserRole("Student");
    setNewUserClassName(classOptions[0]);
    setNewUserTemporaryPassword("");
  }

  async function updateAdminUser(updatedUser: AdminUser) {
    const firstName = updatedUser.firstName.trim();
    const lastName = updatedUser.lastName.trim();
    const email = updatedUser.email.trim().toLowerCase();
    const alias = updatedUser.alias.trim() || `${firstName}${lastName}`;
    const className = updatedUser.role === "Admin" ? "District" : updatedUser.className;

    if (!firstName || !lastName || !email) {
      setUserImportNotice("First name, last name, and email are required.");
      return false;
    }

    if (
      adminUsers.some(
        (user) => user.id !== updatedUser.id && user.email.toLowerCase() === email
      )
    ) {
      setUserImportNotice("A different user already has that email.");
      return false;
    }

    const normalizedUser: AdminUser = {
      ...updatedUser,
      alias,
      className,
      classes: [className],
      email,
      firstName,
      lastName,
      permissions: permissionsForRole(updatedUser.role),
    };

    try {
      await postAdminMutation("/api/admin/users", {
        action: "update",
        reason: "Admin user profile modification",
        targetUserId: normalizedUser.id,
        users: [
          {
            alias: normalizedUser.alias,
            className: normalizedUser.className,
            email: normalizedUser.email,
            enabled: normalizedUser.enabled,
            firstName: normalizedUser.firstName,
            lastName: normalizedUser.lastName,
            role: normalizedUser.role,
          },
        ],
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return false;
    }

    setAdminUsers((users) =>
      users.map((user) => (user.id === normalizedUser.id ? normalizedUser : user))
    );
    setUserImportNotice(`${firstName} ${lastName} updated and audited.`);
    return true;
  }

  async function createSupportCase() {
    const trimmedSummary = supportSummary.trim();

    if (!trimmedSummary) {
      return;
    }

    try {
      await postAdminMutation("/api/admin/support", {
        category: supportCategory,
        summary: trimmedSummary,
      });
    } catch (error) {
      setUserImportNotice((error as Error).message);
      return;
    }

    setSupportCases((cases) => [
      {
        id: `SUP-${1043 + cases.length}`,
        summary: trimmedSummary,
        requester: "Sam Gordon",
        category: supportCategory,
        status: "Pending support",
        createdAt: "Today",
      },
      ...cases,
    ]);
    setSupportSummary("");
  }

  async function savePrivacyPosture(posture: string, contact: string) {
    await postAdminMutation("/api/admin/privacy", {
      posture,
      privacyContactEmail: contact.trim(),
      reason: "Admin privacy posture update",
    });
    setPrivacyPosture(posture);
    setPrivacyContact(contact.trim());
  }

  async function triggerPasswordReset() {
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      setResetNotice("Enter a user email to trigger a reset.");
      return;
    }

    try {
      const result = await postAdminMutation<{
        delivery?: "sent" | "failed" | "logged" | "not_configured";
        deliveryError?: string;
      }>("/api/admin/password-resets", {
        email: trimmedEmail,
        reason: "Admin password reset",
      });
      const deliveryNotices = {
        failed: `Reset created for ${trimmedEmail}, but the email could not be sent: ${
          result.deliveryError ?? "unknown error"
        }`,
        logged: `Reset created for ${trimmedEmail}. Email isn't set up, so the link was written to the server log (development only).`,
        not_configured: `Reset created for ${trimmedEmail}, but email isn't set up yet, so no email was sent. See Email settings.`,
        sent: `Password reset email sent to ${trimmedEmail}. The link works for 30 minutes.`,
      } as const;
      setResetNotice(
        result.delivery
          ? deliveryNotices[result.delivery]
          : `Password reset requested for ${trimmedEmail}.`
      );
      setResetEmail("");
    } catch (error) {
      setResetNotice((error as Error).message);
    }
  }

  async function addSchool() {
    const trimmedName = schoolName.trim();
    const trimmedDistrict = schoolDistrict.trim();
    const parsedClasses = Number.parseInt(schoolClassCount, 10);
    const parsedStudents = Number.parseInt(schoolStudentCount, 10);

    if (!trimmedName || !trimmedDistrict) {
      return;
    }

    const createdSchool = {
      id: `school-${Date.now()}`,
        name: trimmedName,
        district: trimmedDistrict,
        state: schoolState.trim() || "CA",
        classes: Number.isNaN(parsedClasses) ? 0 : Math.max(0, parsedClasses),
        students: Number.isNaN(parsedStudents) ? 0 : Math.max(0, parsedStudents),
        status: "Setup",
    };

    try {
      await postAdminMutation("/api/admin/schools", {
        action: "create",
        classCount: createdSchool.classes,
        district: createdSchool.district,
        name: createdSchool.name,
        reason: "Admin school setup",
        schoolId: createdSchool.id,
        state: createdSchool.state,
        studentCount: createdSchool.students,
      });
    } catch {
      return;
    }

    setSchools((currentSchools) => [...currentSchools, createdSchool]);
    setSchoolName("");
    setSchoolClassCount("0");
    setSchoolStudentCount("0");
  }

  async function deleteSchool(schoolId: string) {
    try {
      await postAdminMutation("/api/admin/schools", {
        action: "delete",
        reason: "Admin school removal",
        schoolId,
      });
    } catch {
      return;
    }

    setSchools((currentSchools) =>
      currentSchools.filter((school) => school.id !== schoolId)
    );
  }

  async function addMarketIntegration() {
    const trimmedProvider = integrationProvider.trim();
    const trimmedEndpoint = integrationEndpoint.trim();
    const trimmedSymbols = integrationSymbols.trim();
    const tokenPlacement = trimmedProvider.toLowerCase().includes("finnhub")
      ? "query"
      : "bearer";

    if (!trimmedProvider || !trimmedEndpoint) {
      return;
    }

    const createdIntegration = {
      id: `integration-${Date.now()}`,
        provider: trimmedProvider,
        endpoint: trimmedEndpoint,
        tokenRequired: integrationTokenRequired,
        token: "",
        pollingFrequency: integrationPollingFrequency,
        status: "Testing",
        targetClass: integrationTargetClass,
        symbols: trimmedSymbols || "Up to 200 symbols",
        quoteDelay: integrationPollingFrequency,
        importedSymbols: trimmedSymbols
          ? trimmedSymbols.split(",").filter(Boolean).slice(0, 200).length
          : 200,
        lastFetchStatus: "Ready for GET test",
        enabled: true,
    };

    try {
      await postAdminMutation("/api/admin/integrations", {
        action: "create",
        allowedSymbols: trimmedSymbols,
        endpoint: createdIntegration.endpoint,
        integrationId: createdIntegration.id,
        maxSymbols: createdIntegration.importedSymbols,
        provider: createdIntegration.provider,
        reason: "Admin market integration creation",
        targetClass: createdIntegration.targetClass,
        token: integrationTokenRequired ? integrationToken.trim() : "",
        tokenPlacement,
      });
    } catch {
      return;
    }

    setMarketIntegrations((currentIntegrations) => [
      ...currentIntegrations,
      createdIntegration,
    ]);
    if (integrationTokenRequired && integrationToken.trim()) {
      setCredentials((currentCredentials) => [
        {
          credentialType: "api_token",
          id: `market-${createdIntegration.id}`,
          label: `${createdIntegration.provider} market API`,
          lastRotatedAt: "Just now",
          lastUsedAt: "Never",
          providerName: createdIntegration.provider,
          scopeId: createdIntegration.targetClass,
          scopeType: "class",
          status: "active",
          tokenPlacement,
          usernameHint: "",
        },
        ...currentCredentials,
      ]);
    }
    setIntegrationProvider("");
    setIntegrationEndpoint("/api/market");
    setIntegrationToken("");
    setIntegrationTokenRequired(false);
    setIntegrationPollingFrequency("15 minutes");
    setIntegrationTargetClass(classOptions[0]);
    setIntegrationSymbols("");
  }

  async function toggleMarketIntegration(integrationId: string, enabled: boolean) {
    const integration = marketIntegrations.find((item) => item.id === integrationId);

    if (!integration) {
      return;
    }

    try {
      await postAdminMutation("/api/admin/integrations", {
        action: "update",
        endpoint: integration.endpoint,
        integrationId,
        provider: integration.provider,
        reason: enabled ? "Admin enabled integration" : "Admin disabled integration",
        targetClass: integration.targetClass,
      });
    } catch {
      return;
    }

    setMarketIntegrations((currentIntegrations) =>
      currentIntegrations.map((integration) =>
        integration.id === integrationId
          ? { ...integration, enabled, status: enabled ? "Connected" : "Needs key" }
          : integration
      )
    );
  }

  async function deleteMarketIntegration(integrationId: string) {
    const integration = marketIntegrations.find((item) => item.id === integrationId);

    if (!integration) {
      return;
    }

    try {
      await postAdminMutation("/api/admin/integrations", {
        action: "delete",
        endpoint: integration.endpoint,
        integrationId,
        provider: integration.provider,
        reason: "Admin deleted integration",
        targetClass: integration.targetClass,
      });
    } catch {
      return;
    }

    setMarketIntegrations((currentIntegrations) =>
      currentIntegrations.filter((integration) => integration.id !== integrationId)
    );
  }

  async function testMarketIntegration(integrationId: string) {
    const integration = marketIntegrations.find(
      (item) => item.id === integrationId
    );

    if (!integration) {
      return;
    }

    setMarketIntegrations((currentIntegrations) =>
      currentIntegrations.map((item) =>
        item.id === integrationId
          ? { ...item, status: "Testing", lastFetchStatus: "GET in progress" }
          : item
      )
    );

    try {
      const response = await fetch("/api/integration-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: integration.endpoint,
          maxSymbols: integration.symbols === "Up to 200 symbols" ? 200 : undefined,
          token: integration.tokenRequired ? integration.token : "",
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        importedSymbols?: number;
        message?: string;
      };

      setMarketIntegrations((currentIntegrations) =>
        currentIntegrations.map((item) =>
          item.id === integrationId
            ? {
                ...item,
                status: result.ok ? "Connected" : "Needs key",
                importedSymbols: result.importedSymbols ?? item.importedSymbols,
                lastFetchStatus:
                  result.message ?? (result.ok ? "GET succeeded" : "GET failed"),
              }
            : item
        )
      );
    } catch {
      setMarketIntegrations((currentIntegrations) =>
        currentIntegrations.map((item) =>
          item.id === integrationId
            ? {
                ...item,
                status: "Needs key",
                lastFetchStatus: "GET failed before data could be imported",
              }
            : item
        )
      );
    }
  }

  async function updateClassMarketConfig(
    className: string,
    updates: Partial<ClassMarketConfig>
  ) {
    const existing =
      classMarketConfigs.find((config) => config.className === className) ??
      initialClassMarketConfigs[0];
    const nextConfig = { ...existing, ...updates, className };

    try {
      await postAdminMutation("/api/admin/class-market", {
        ...nextConfig,
        reason: "Class market simulator configuration update",
      });
    } catch {
      return false;
    }

    setClassMarketConfigs((currentConfigs) => {
      const others = currentConfigs.filter(
        (config) => config.className !== className
      );

      return [...others, nextConfig].sort((a, b) =>
        a.className.localeCompare(b.className)
      );
    });

    return true;
  }

  async function saveCredential() {
    const label = credentialLabel.trim();
    const providerName = credentialProvider.trim();
    const secretValue = credentialSecret.trim();

    if (!label || !providerName || !secretValue) {
      setCredentialNotice("Credential label, provider, and secret are required.");
      return;
    }

    const credentialId = `credential-${Date.now()}`;

    try {
      await postAdminMutation("/api/admin/credentials", {
        action: "create",
        credentialId,
        credentialType,
        label,
        providerName,
        reason: "Admin credential vault setup",
        scopeId: credentialScopeId,
        scopeType: credentialScopeType,
        secretValue,
        tokenPlacement: credentialPlacement,
        username: credentialUsername,
      });
    } catch (error) {
      setCredentialNotice((error as Error).message);
      return;
    }

    setCredentials((currentCredentials) => [
      {
        credentialType,
        id: credentialId,
        label,
        lastRotatedAt: "Just now",
        lastUsedAt: "Never",
        providerName,
        scopeId: credentialScopeId,
        scopeType: credentialScopeType,
        status: "active",
        tokenPlacement: credentialPlacement,
        usernameHint: maskLocalUsername(credentialUsername),
      },
      ...currentCredentials,
    ]);
    setCredentialLabel("");
    setCredentialProvider("");
    setCredentialSecret("");
    setCredentialUsername("");
    setCredentialNotice("Credential stored in the backend vault.");
  }

  async function deleteCredential(credentialId: string) {
    try {
      await postAdminMutation("/api/admin/credentials", {
        action: "delete",
        credentialId,
        reason: "Admin credential removal",
      });
    } catch (error) {
      setCredentialNotice((error as Error).message);
      return;
    }

    setCredentials((currentCredentials) =>
      currentCredentials.filter((credential) => credential.id !== credentialId)
    );
    setCredentialNotice("Credential metadata disabled.");
  }

  function updateAllocationTarget(name: string, value: number) {
    setAllocationTargets((currentTargets) =>
      currentTargets.map((target) =>
        target.name === name ? { ...target, value } : target
      )
    );
  }

  async function saveAllocationChange() {
    if (!activePortfolio) {
      setMarketNotice("Your portfolio isn't available right now.");
      return;
    }

    try {
      const response = await fetch("/api/portfolios/allocation", {
        body: JSON.stringify({
          portfolioId: activePortfolio.id,
          targets: allocationTargets.map(({ name, value }) => ({ name, value })),
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        portfolio?: ServerPortfolio;
      };

      if (!response.ok || !result.portfolio) {
        setMarketNotice(result.message ?? "Allocation targets could not be saved.");
        return;
      }

      applyPortfolio(result.portfolio);
    } catch {
      setMarketNotice("Allocation targets could not be saved.");
    }
  }

  function openAdminModule(title: string) {
    const targets: Record<string, AdminPage> = {
      Users: "users",
      Permissions: "permissions",
      Support: "support",
      Monitoring: "monitoring",
      "Market APIs": "integrations",
      "Market Simulator": "market-engine",
      "Credential Vault": "credentials",
      "Portfolio corrections": "portfolio-corrections",
      Messaging: "messaging",
    };

    const target = targets[title];

    if (target) {
      setActiveAdminPage(target);
    }
  }

  async function submitLogin() {
    setLoginPending(true);
    setLoginNotice("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          provider: "password",
          ...(loginChallengeQuestion
            ? { securityAnswer: loginChallengeAnswer }
            : {}),
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: AuthenticatedUser;
        challenge?: { question: string };
      };

      if (!result.ok || !result.user) {
        if (result.challenge) {
          setLoginChallengeQuestion(result.challenge.question);
          setLoginChallengeAnswer("");
        }
        setLoginNotice(result.message ?? "Login failed.");
        return;
      }

      setLoginChallengeQuestion(null);
      setLoginChallengeAnswer("");

      enterApp(result.user);
      setLoginPassword("");
    } catch {
      setLoginNotice("Login service is unavailable. Try again in a moment.");
    } finally {
      setLoginPending(false);
    }
  }

  async function startSsoLogin() {
    setLoginPending(true);
    setLoginNotice("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "district-sso" }),
      });
      const result = (await response.json()) as { message?: string; redirectUrl?: string };

      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }

      setLoginNotice(
        result.message ??
          "District SSO is ready for configuration, but no provider is connected yet."
      );
    } catch {
      setLoginNotice("District SSO could not be reached.");
    } finally {
      setLoginPending(false);
    }
  }

  function enterApp(user: AuthenticatedUser) {
    setAuthenticatedUser(user);
    setActiveTab(roleToTab(user.role));
    setActiveStudentPage("dashboard");
    setActiveTeacherPage("dashboard");
    setActiveAdminPage("overview");
  }

  async function signOut() {
    try {
      // Ends the session on the server and clears the session cookie, so a
      // refresh after signing out doesn't sign the user back in.
      await fetch("/api/auth/logout", {
        credentials: "same-origin",
        method: "POST",
      });
    } catch {
      // Still sign out on this screen; the session expires on its own.
    }

    setAuthenticatedUser(null);
    setLoginEmail(demoLoginAccounts[0].email);
    setLoginPassword(demoLoginAccounts[0].password);
    setLoginChallengeQuestion(null);
    setLoginChallengeAnswer("");
    setActiveTab("student");
    setActiveStudentPage("dashboard");
    setActiveTeacherPage("dashboard");
    setActiveAdminPage("overview");
  }

  if (!sessionChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (!authenticatedUser) {
    return (
      <LoginPage
        email={loginEmail}
        notice={loginNotice}
        password={loginPassword}
        pending={loginPending}
        challengeQuestion={loginChallengeQuestion}
        challengeAnswer={loginChallengeAnswer}
        onChallengeAnswerChange={setLoginChallengeAnswer}
        onEmailChange={(value) => {
          setLoginEmail(value);
          setLoginChallengeQuestion(null);
          setLoginChallengeAnswer("");
        }}
        onPasswordChange={setLoginPassword}
        onSelectDemo={(account) => {
          setLoginEmail(account.email);
          setLoginPassword(account.password);
          setLoginChallengeQuestion(null);
          setLoginChallengeAnswer("");
          setLoginNotice("");
        }}
        onSsoLogin={startSsoLogin}
        onSubmit={submitLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        {authenticatedUser.actingAdmin ? (
          <ViewingAsBanner
            adminName={
              `${authenticatedUser.actingAdmin.firstName} ${authenticatedUser.actingAdmin.lastName}`.trim() ||
              authenticatedUser.actingAdmin.email
            }
            studentEmail={authenticatedUser.email}
            studentName={`${authenticatedUser.firstName} ${authenticatedUser.lastName}`.trim()}
          />
        ) : null}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                School platform MVP
              </p>
              <h1 className="text-xl font-semibold tracking-normal">
                FutureFund Classroom
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-md bg-card px-3 py-1">
              {authenticatedUser.firstName} {authenticatedUser.lastName}
            </Badge>
            <Badge className="rounded-md bg-[#e8f0ed] px-3 py-1 text-[#24493f] hover:bg-[#e8f0ed]">
              Grade 7 pilot
            </Badge>
            <Badge className="rounded-md bg-[#fff3da] px-3 py-1 text-[#7a4b00] hover:bg-[#fff3da]">
              Simulated money
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section
        className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 ${
          isAdminRoleView ? "lg:grid-cols-1" : "lg:grid-cols-[260px_minmax(0,1fr)]"
        }`}
      >
        {!isAdminRoleView ? (
          <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#fff3da] text-[#7a4b00]">
                <GraduationCap className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">
                  {profileCellUser.firstName} {profileCellUser.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{profileCellUser.alias}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="profile-alias">Alias</Label>
              <Input
                id="profile-alias"
                value={profileCellUser.alias}
                onChange={(event) =>
                  updateUserAlias(profileCellUser.id, event.target.value)
                }
              />
            </div>

            <div className="mt-5 space-y-5">
              {profileCellMetrics.map((metric) => (
                <Metric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/45 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Profile messages</span>
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("inbox")}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition hover:bg-background"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 text-[#28666e]" />
                    Inbox
                  </span>
                  <span className="font-semibold">{inboxUnread}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("discussion")}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition hover:bg-background"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="size-4 text-[#28666e]" />
                    Discussion
                  </span>
                  <span className="font-semibold">{discussionUnread}</span>
                </button>
              </div>
            </div>
          </aside>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="min-w-0"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Version 1 product surface
              </p>
              <h2 className="mt-1 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Financial literacy students can practice, and teachers can
                measure.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="h-auto flex-wrap justify-start rounded-lg bg-muted p-1">
                {authenticatedUser.permissions.studentProfile ? (
                  <TabsTrigger value="student" className="min-h-9 px-3">
                    Home
                  </TabsTrigger>
                ) : null}
                <TabsTrigger value="inbox" className="min-h-9 px-3">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="discussion" className="min-h-9 px-3">
                  Discussion
                </TabsTrigger>
                {authenticatedUser.permissions.studentProfile ||
                authenticatedUser.permissions.teacherPortal ? (
                  <TabsTrigger value="market" className="min-h-9 px-3">
                    Market
                  </TabsTrigger>
                ) : null}
              </TabsList>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    Assume role: {activeRole.label}
                    <ChevronRight className="size-4 rotate-90" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuLabel>Role view</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableRoleOptions.map((role) => (
                    <DropdownMenuItem
                      key={role.value}
                      onSelect={() => setActiveTab(role.value)}
                    >
                      <span className="grid gap-0.5">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="student" className="mt-6 space-y-6">
            {activeTab === "student" ? (
              <>
                {activeStudentPage === "portfolio" ? (
                  <StudentPortfolioPage
                    activity={portfolioActivity}
                    allocationTotal={allocationTotal}
                    allocationTargets={allocationTargets}
                    cashBuffer={cashBuffer}
                    latestValue={latestValue}
                    largestAllocation={largestAllocation}
                    onBack={() => setActiveStudentPage("dashboard")}
                    onSaveAllocation={() => void saveAllocationChange()}
                    activePortfolioId={activePortfolioId}
                    portfolioError={portfolioLoadError}
                    portfolios={profilePortfolios ?? []}
                    onSelectPortfolio={selectPortfolio}
                    onUpdateAllocation={updateAllocationTarget}
                    portfolio={portfolio}
                    totalGrowth={totalGrowth}
                  />
                ) : activeStudentPage === "profile" ? (
                  <UserProfilePage
                    activity={portfolioActivity}
                    allocationTargets={allocationTargets}
                    latestValue={latestValue}
                    marketQuotes={marketQuotes}
                    onBack={() => setActiveStudentPage("dashboard")}
                    onMessage={messageUser}
                    portfolio={portfolio}
                    quests={teacherQuests}
                    stockHoldings={studentHoldings}
                    totalGrowth={totalGrowth}
                    user={selectedProfileUser}
                  />
                ) : (
                  <>
                    <UserSearchPanel
                      onMessage={messageUser}
                      onOpenProfile={openUserProfile}
                      onSearchChange={setProfileSearch}
                      query={profileSearch}
                      results={profileSearchResults}
                    />
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<WalletCards className="size-5" />}
                label="Portfolio value"
                value={`$${latestValue.toLocaleString()}`}
                detail={`${totalGrowth}% total growth`}
                onClick={() => setActiveStudentPage("portfolio")}
              />
              <SummaryCard
                icon={<Medal className="size-5" />}
                label="Quest points"
                value={`${1280 + goalBoost * 12}`}
                detail="Level 8 investor"
              />
              <SummaryCard
                icon={<PiggyBank className="size-5" />}
                label="Emergency fund"
                value="$225"
                detail="75% of starter goal"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Simulated portfolio
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Real market context, classroom-safe decisions, no real
                      trades.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setScenarioDay((value) => value + 1)}
                    className="w-full bg-[#28666e] text-white hover:bg-[#22565d] sm:w-auto"
                  >
                    <Play className="size-4" aria-hidden="true" />
                    Run market day
                  </Button>
                </div>

                <div className="h-[280px] w-full">
                  <PortfolioChart data={portfolio} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Allocation lab</h3>
                    <p className="text-sm text-muted-foreground">
                      Students compare growth, taxes, access, and risk.
                    </p>
                  </div>
                  <ChartNoAxesCombined className="size-5 text-muted-foreground" />
                </div>
                <div className="h-[220px]">
                  <AllocationDonut items={allocationTargets} />
                </div>
                <div className="grid gap-2">
                  {allocationTargets.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Learning quests</h3>
                  <BookOpenCheck className="size-5 text-muted-foreground" />
                </div>
                <StudentAssignedQuests />
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Budget challenge</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a savings habit and see readiness change.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGoalBoost((value) => Math.min(20, value + 5))}
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    Add saving habit
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <DecisionTile
                    icon={<Banknote className="size-5" />}
                    title="$15 weekly"
                    detail="Moves cash buffer toward one month of expenses."
                  />
                  <DecisionTile
                    icon={<TrendingUp className="size-5" />}
                    title="Invest $25"
                    detail="Splits between index stocks and Roth IRA lab."
                  />
                  <DecisionTile
                    icon={<CalendarClock className="size-5" />}
                    title="Wait 30 days"
                    detail="Shows how time changes compound growth."
                  />
                </div>

                <div className="mt-5 rounded-lg bg-[#f7f2e8] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 font-medium text-[#5b3f0b]">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Student-safe market feed
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("market")}
                      className="w-full border-[#d9c99b] bg-white text-[#5b3f0b] hover:bg-[#fff8e8] sm:w-auto"
                    >
                      Open market
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {marketWatch.map((item) => (
                      <div
                        key={item.ticker}
                        className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                      >
                        <span>
                          <strong>{item.ticker}</strong>{" "}
                          <span className="text-muted-foreground">{item.label}</span>
                        </span>
                        <span
                          className={
                            item.tone === "up"
                              ? "font-semibold text-[#28666e]"
                              : "font-semibold text-[#a13d2e]"
                          }
                        >
                          {item.move}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
                  </>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="inbox" className="mt-6 space-y-6">
            {activeTab === "inbox" && authenticatedUser ? (
              <MessagesPanel
                classNames={authenticatedUser.classNames ?? []}
                kind="direct"
                onStartHandled={() => setPendingMessageEmail("")}
                onUnread={setInboxUnread}
                role={authenticatedUser.role}
                startWithEmail={pendingMessageEmail}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="discussion" className="mt-6 space-y-6">
            {activeTab === "discussion" && authenticatedUser ? (
              <MessagesPanel
                classNames={authenticatedUser.classNames ?? []}
                kind="room"
                onUnread={setDiscussionUnread}
                role={authenticatedUser.role}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="market" className="mt-6 space-y-6">
            {activeTab === "market" ? (
              <MarketPage
                cash={studentCash}
                holdings={studentHoldings}
                marketNotice={marketNotice}
                quotes={marketQuotes}
                role={authenticatedUser.role}
                stockHoldingsValue={stockHoldingsValue}
                onTrade={tradeStock}
                allowFractional={activePortfolio?.allowFractional ?? false}
                portfolioError={portfolioLoadError}
                portfolioTitle={activePortfolio ? portfolioLabel(activePortfolio) : null}
                readOnly={activePortfolio?.readOnly ?? false}
                infoClassName={activePortfolio?.kind === "class" ? activePortfolio.className : null}
                clock={activePortfolio?.market.clock ?? null}
                onMarketChanged={refreshLiveMarket}
                lifeEvents={activePortfolio?.lifeEvents ?? []}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="teacher" className="mt-6 space-y-6">
            {activeTab === "teacher" ? (
              <>
                {activeTeacherPage === "students" ? (
                  <TeacherActiveStudentsPage
                    classes={teacherClassAnalytics}
                    onBack={() => setActiveTeacherPage("dashboard")}
                  />
                ) : (
                  <>
                    <TeacherPortfolioResets />
                    <FlaggedMessagesPanel role="Teacher" />
                    <ParentContactRequestPanel />
                    <section className="grid gap-4 md:grid-cols-3">
                      <SummaryCard
                        icon={<UsersRound className="size-5" />}
                        label="Active students"
                        value={`${teacherStudentsTotal}`}
                        detail={`${teacherClassCount} classes synced`}
                        onClick={() => setActiveTeacherPage("students")}
                      />
                      <SummaryCard
                        icon={<BookOpenCheck className="size-5" />}
                        label="Assignments due"
                        value="14"
                        detail="2 need review"
                      />
                      <SummaryCard
                        icon={<LineChart className="size-5" />}
                        label="Class mastery"
                        value={`${teacherAverageMastery}%`}
                        detail="+9% this month"
                      />
                    </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-5 text-[#28666e]" />
                      <h3 className="text-lg font-semibold">Quest Studio</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create, modify, and score teacher-owned learning quests.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={createBlankQuest}>
                      <Plus className="size-4" aria-hidden="true" />
                      New quest
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      aria-expanded={libraryOpen}
                      onClick={() => setLibraryOpen((open) => !open)}
                    >
                      <BookOpenCheck className="size-4" aria-hidden="true" />
                      {libraryOpen ? "Hide library" : "See library"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!teacherQuests.some((quest) => quest.id === draftQuest.id)}
                      title="Save the quest first, then assign it"
                      onClick={() => setAssignQuestOpen(true)}
                    >
                      Assign
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void saveDraftQuest()}
                      className="bg-[#28666e] text-white hover:bg-[#22565d]"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Save quest
                    </Button>
                  </div>
                </div>

                {questNotice ? (
                  <p role="status" className="mb-4 rounded-md bg-accent px-3 py-2 text-sm">
                    {questNotice}
                  </p>
                ) : null}

                {libraryOpen ? (
                  <QuestLibraryList quests={libraryQuests} onCopy={(quest) => void copyLibraryQuest(quest)} />
                ) : null}

                <Dialog open={assignQuestOpen} onOpenChange={setAssignQuestOpen}>
                  {assignQuestOpen ? (
                    <AssignQuestDialog
                      classNames={
                        authenticatedUser.role === "Admin"
                          ? classOptions
                          : authenticatedUser.classNames ?? [authenticatedUser.className]
                      }
                      quest={draftQuest}
                      onAssigned={(message) => {
                        setAssignQuestOpen(false);
                        onQuestAssigned(message);
                      }}
                    />
                  ) : null}
                </Dialog>

                <LearningQuestTransferPanel
                  audience="Teacher"
                  notice={questTransferNotice}
                  onExport={exportLearningQuests}
                  onImport={importLearningQuests}
                  onTextChange={setQuestTransferText}
                  transferText={questTransferText}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quest-title">Quest title</Label>
                    <Input
                      id="quest-title"
                      value={draftQuest.title}
                      onChange={(event) =>
                        setDraftQuest((quest) => ({
                          ...quest,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Student score visibility</Label>
                    <Select
                      value={draftQuest.scoreVisibility}
                      onValueChange={(value) =>
                        setDraftQuest((quest) => ({
                          ...quest,
                          scoreVisibility: value as TeacherQuest["scoreVisibility"],
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hidden">Hide scoring rules</SelectItem>
                        <SelectItem value="summary">Show score summary</SelectItem>
                        <SelectItem value="full">Show full rubric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="quest-objective">Learning objective</Label>
                  <Textarea
                    id="quest-objective"
                    className="min-h-24"
                    value={draftQuest.objective}
                    onChange={(event) =>
                      setDraftQuest((quest) => ({
                        ...quest,
                        objective: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="size-5 text-[#28666e]" />
                    <h4 className="font-semibold">Optional market parameters</h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Market mode</Label>
                      <Select
                        value={draftQuest.marketMode}
                        onValueChange={(value) =>
                          setDraftQuest((quest) => ({
                            ...quest,
                            marketMode: value as TeacherQuest["marketMode"],
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No market data</SelectItem>
                          <SelectItem value="watchlist">Watchlist</SelectItem>
                          <SelectItem value="scenario">Scenario event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="market-symbols">Symbols</Label>
                      <Input
                        id="market-symbols"
                        placeholder="SPY, QQQ, BND"
                        value={draftQuest.marketSymbols}
                        onChange={(event) =>
                          setDraftQuest((quest) => ({
                            ...quest,
                            marketSymbols: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="market-window">Market window</Label>
                      <Input
                        id="market-window"
                        value={draftQuest.marketWindow}
                        onChange={(event) =>
                          setDraftQuest((quest) => ({
                            ...quest,
                            marketWindow: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 rounded-md bg-muted/60 p-3">
                    <div>
                      <Label htmlFor="reflection-required">
                        Require written reflection
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Used for teacher review and standards evidence.
                      </p>
                    </div>
                    <Switch
                      id="reflection-required"
                      checked={draftQuest.requireReflection}
                      onCheckedChange={(checked) =>
                        setDraftQuest((quest) => ({
                          ...quest,
                          requireReflection: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-[#28666e]" />
                      <h4 className="font-semibold">Scoring rules</h4>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {draftPoints} pts total
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {draftQuest.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_90px_170px]"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`${criterion.id}-label`}>
                            Objective signal
                          </Label>
                          <Input
                            id={`${criterion.id}-label`}
                            value={criterion.label}
                            onChange={(event) =>
                              updateCriterion(criterion.id, {
                                label: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${criterion.id}-points`}>Points</Label>
                          <Input
                            id={`${criterion.id}-points`}
                            min={0}
                            max={100}
                            type="number"
                            value={criterion.points}
                            onChange={(event) =>
                              updateCriterion(criterion.id, {
                                points: Number(event.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Label
                            htmlFor={`${criterion.id}-visibility`}
                            className="flex min-h-9 items-center gap-2 rounded-md border border-border px-3"
                          >
                            <Checkbox
                              id={`${criterion.id}-visibility`}
                              checked={criterion.visibleToStudents}
                              onCheckedChange={(checked) =>
                                updateCriterion(criterion.id, {
                                  visibleToStudents: checked === true,
                                })
                              }
                            />
                            Visible to students
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Monitor quests</h3>
                    <p className="text-sm text-muted-foreground">
                      Click a quest to open it in the editor and see its submissions and grades below.
                    </p>
                  </div>
                  <Gauge className="size-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  {teacherQuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You don&apos;t have any saved quests yet. Click Save quest, or copy one from the
                      library.
                    </p>
                  ) : null}
                  {teacherQuests.map((quest) => (
                    <button
                      key={quest.id}
                      type="button"
                      onClick={() => {
                        loadQuest(quest);
                        // Submissions load below the list; bring them into view (v0.2.16).
                        window.setTimeout(
                          () => document.getElementById("quest-submissions")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                          150
                        );
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        selectedQuestId === quest.id
                          ? "border-[#28666e] bg-[#e8f0ed]"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{quest.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {quest.assigned} assigned / {quest.submitted} submitted
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-md bg-card"
                        >
                          {quest.status}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <QuestMonitorMetric label="Classes" value={quest.assignments?.length ?? 0} />
                        <QuestMonitorMetric
                          label="Hidden"
                          value={
                            quest.criteria.filter(
                              (criterion) => !criterion.visibleToStudents
                            ).length
                          }
                        />
                        <QuestMonitorMetric label="Submitted" value={quest.submitted} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#28666e]">
                        {selectedQuestId === quest.id ? "Submissions and grades are below ↓" : "View submissions and grades ↓"}
                      </p>
                      {quest.assignments?.length ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {quest.assignments
                            .map((assignment) =>
                              assignment.dueAt
                                ? `${assignment.className} (due ${new Date(assignment.dueAt).toLocaleDateString()})`
                                : `${assignment.className} (no due date)`
                            )
                            .join(" · ")}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>

                {teacherQuests.some((quest) => quest.id === selectedQuestId) ? (
                  <div id="quest-submissions" className="scroll-mt-24">
                    <QuestSubmissionsPanel
                      key={`${selectedQuestId}-${questsVersion}`}
                      questId={selectedQuestId}
                    />
                  </div>
                ) : null}

                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2">
                    {selectedQuest.scoreVisibility === "hidden" ? (
                      <EyeOff className="size-4 text-[#a13d2e]" />
                    ) : (
                      <Eye className="size-4 text-[#28666e]" />
                    )}
                    <h4 className="font-semibold">Current draft policy</h4>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {hiddenRuleCount} scoring rule
                    {hiddenRuleCount === 1 ? " is" : "s are"} hidden from
                    students unless the teacher changes visibility.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Class roster</h3>
                    <p className="text-sm text-muted-foreground">
                      Teachers see mastery evidence instead of raw investing
                      wins.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-[#28666e] text-white hover:bg-[#22565d]"
                    onClick={() =>
                      teacherQuests.some((quest) => quest.id === draftQuest.id)
                        ? setAssignQuestOpen(true)
                        : setQuestNotice("Open or save a quest in Quest Studio first, then assign it.")
                    }
                  >
                    Assign quest
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                <Table className="min-w-[620px]">
                  <TableHeader>
                    <TableRow className="text-muted-foreground hover:bg-transparent">
                      <TableHead>Student</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Mastery</TableHead>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Latest concept</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classRows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.level}</TableCell>
                        <TableCell>
                          <div className="flex min-w-[150px] items-center gap-3">
                            <Progress value={row.mastery} className="h-2" />
                            <span className="w-9 text-right">{row.mastery}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{row.portfolio}</TableCell>
                        <TableCell>{row.lastConcept}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-semibold">Concept mastery</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  The district can map this to course standards.
                </p>
                <div className="h-[300px]">
                  <MasteryBars />
                </div>
              </div>
            </section>
                  </>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="admin" className="mt-6 space-y-6">
            {activeTab === "admin" ? (
              <>
                {activeAdminPage !== "overview" ? (
                  <AdminDrilldown
                    activePage={activeAdminPage}
                    adminUsers={adminUsers}
                    classMarketConfigs={classMarketConfigs}
                    credentialLabel={credentialLabel}
                    credentialNotice={credentialNotice}
                    credentialPlacement={credentialPlacement}
                    credentialProvider={credentialProvider}
                    credentials={credentials}
                    credentialScopeId={credentialScopeId}
                    credentialScopeType={credentialScopeType}
                    credentialSecret={credentialSecret}
                    credentialType={credentialType}
                    credentialUsername={credentialUsername}
                    filteredAdminUsers={filteredAdminUsers}
                    integrationEndpoint={integrationEndpoint}
                    integrationProvider={integrationProvider}
                    integrationPollingFrequency={integrationPollingFrequency}
                    integrationSymbols={integrationSymbols}
                    integrationTargetClass={integrationTargetClass}
                    integrationToken={integrationToken}
                    integrationTokenRequired={integrationTokenRequired}
                    marketIntegrations={marketIntegrations}
                    newUserAlias={newUserAlias}
                    newUserClassName={newUserClassName}
                    newUserEmail={newUserEmail}
                    newUserFirstName={newUserFirstName}
                    newUserLastName={newUserLastName}
                    newUserRole={newUserRole}
                    newUserTemporaryPassword={newUserTemporaryPassword}
                    onAddIntegration={addMarketIntegration}
                    onAddSchool={addSchool}
                    onCredentialLabelChange={setCredentialLabel}
                    onCredentialPlacementChange={setCredentialPlacement}
                    onCredentialProviderChange={setCredentialProvider}
                    onCredentialScopeIdChange={setCredentialScopeId}
                    onCredentialScopeTypeChange={setCredentialScopeType}
                    onCredentialSecretChange={setCredentialSecret}
                    onCredentialTypeChange={setCredentialType}
                    onCredentialUsernameChange={setCredentialUsername}
                    onBack={() => setActiveAdminPage("overview")}
                    onCreateIndividualUser={createIndividualUser}
                    onCreateSupportCase={createSupportCase}
                    onDeleteCredential={deleteCredential}
                    onDeleteIntegration={deleteMarketIntegration}
                    onDeleteSchool={deleteSchool}
                    onIntegrationEndpointChange={setIntegrationEndpoint}
                    onIntegrationPollingFrequencyChange={
                      setIntegrationPollingFrequency
                    }
                    onIntegrationProviderChange={setIntegrationProvider}
                    onIntegrationSymbolsChange={setIntegrationSymbols}
                    onIntegrationTargetClassChange={setIntegrationTargetClass}
                    onIntegrationTokenChange={setIntegrationToken}
                    onIntegrationTokenRequiredChange={
                      setIntegrationTokenRequired
                    }
                    onImportUsers={importUsersFromCsv}
                    onNewUserAliasChange={setNewUserAlias}
                    onNewUserClassNameChange={setNewUserClassName}
                    onNewUserEmailChange={setNewUserEmail}
                    onNewUserFirstNameChange={setNewUserFirstName}
                    onNewUserLastNameChange={setNewUserLastName}
                    onNewUserRoleChange={setNewUserRole}
                    onNewUserTemporaryPasswordChange={
                      setNewUserTemporaryPassword
                    }
                    onSavePrivacy={savePrivacyPosture}
                    onOpenUserProfile={openUserProfile}
                    onQuestExport={exportLearningQuests}
                    onQuestImport={importLearningQuests}
                    onQuestTransferTextChange={setQuestTransferText}
                    onSelectedPermissionUserChange={setSelectedPermissionUserId}
                    onSchoolClassCountChange={setSchoolClassCount}
                    onSchoolDistrictChange={setSchoolDistrict}
                    onSchoolNameChange={setSchoolName}
                    onSchoolStateChange={setSchoolState}
                    onSchoolStudentCountChange={setSchoolStudentCount}
                    onSupportCategoryChange={setSupportCategory}
                    onSupportSummaryChange={setSupportSummary}
                    onSaveCredential={saveCredential}
                    onTestIntegration={testMarketIntegration}
                    onToggleIntegration={toggleMarketIntegration}
                    onUpdateClassMarketConfig={updateClassMarketConfig}
                    onUpdateUser={updateAdminUser}
                    onToggleUserEnabled={toggleUserEnabled}
                    privacyContact={privacyContact}
                    privacyPosture={privacyPosture}
                    questTransferNotice={questTransferNotice}
                    questTransferText={questTransferText}
                    schoolClassCount={schoolClassCount}
                    schoolDistrict={schoolDistrict}
                    schoolName={schoolName}
                    schools={schools}
                    schoolState={schoolState}
                    schoolStudentCount={schoolStudentCount}
                    selectedPermissionUser={selectedPermissionUser}
                    supportCases={supportCases}
                    supportCategory={supportCategory}
                    supportSummary={supportSummary}
                    selectedPrivacyPosture={selectedPrivacyPosture}
                    userClassFilter={userClassFilter}
                    userImportNotice={userImportNotice}
                    userRoleFilter={userRoleFilter}
                    onUpdateUserPermission={updateUserPermission}
                    onUserClassFilterChange={setUserClassFilter}
                    onUserRoleFilterChange={setUserRoleFilter}
                  />
                ) : (
                  <>
                    <section className="grid gap-4 md:grid-cols-3">
                      <SummaryCard
                        icon={<School className="size-5" />}
                        label="School rollout"
                        value={`${schools.length} schools`}
                        detail="Manage school setup"
                        onClick={() => setActiveAdminPage("schools")}
                      />
                      <SummaryCard
                        icon={<ShieldCheck className="size-5" />}
                        label="Privacy posture"
                        value={selectedPrivacyPosture.label}
                        detail="Set district compliance mode"
                        onClick={() => setActiveAdminPage("privacy")}
                      />
                      <SummaryCard
                        icon={<Building2 className="size-5" />}
                        label="Integrations"
                        value={`${
                          marketIntegrations.filter((item) => item.enabled)
                            .length
                        } active`}
                        detail="Configure market feeds"
                        onClick={() => setActiveAdminPage("integrations")}
                      />
                    </section>

            <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-5 text-[#28666e]" />
                    <h3 className="text-lg font-semibold">Admin portal</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure users, data feeds, support workflows, account
                    recovery, and simulated portfolio corrections.
                  </p>
                </div>
                <Button type="button" className="bg-[#28666e] text-white hover:bg-[#22565d]">
                  <Wrench className="size-4" aria-hidden="true" />
                  Open support case
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {adminModules.map((module) => (
                  module.title === "View as student" ? (
                    <ViewAsStudentDialog
                      key={module.title}
                      trigger={
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <AdminModuleCardContent module={module} />
                        </button>
                      }
                    />
                  ) : module.title === "School year" ? (
                    <SchoolYearDialog
                      key={module.title}
                      trigger={
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <AdminModuleCardContent module={module} />
                        </button>
                      }
                    />
                  ) : module.title === "Email" ? (
                    <EmailSettingsDialog
                      key={module.title}
                      defaultRecipient={authenticatedUser.email}
                      trigger={
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <AdminModuleCardContent module={module} />
                        </button>
                      }
                    />
                  ) : module.title === "Password resets" ? (
                    <Dialog key={module.title}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <AdminModuleCardContent module={module} />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Password reset</DialogTitle>
                          <DialogDescription>
                            Email the user a link to set a new password. The
                            link works for 30 minutes. SSO reset routing will be
                            added later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">User email</Label>
                          <Input
                            id="reset-email"
                            placeholder="student@school.edu"
                            value={resetEmail}
                            onChange={(event) => setResetEmail(event.target.value)}
                          />
                          {resetNotice ? (
                            <p className="text-sm text-muted-foreground">
                              {resetNotice}
                            </p>
                          ) : null}
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            onClick={triggerPasswordReset}
                            className="bg-[#28666e] text-white hover:bg-[#22565d]"
                          >
                            <KeyRound className="size-4" aria-hidden="true" />
                            Send reset
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <button
                      key={module.title}
                      type="button"
                      onClick={() => openAdminModule(module.title)}
                      className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <AdminModuleCardContent module={module} />
                    </button>
                  )
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FilePenLine className="size-5 text-[#28666e]" />
                      <h3 className="text-lg font-semibold">
                        System quest library
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Admins manage users, permissions, templates, integrations,
                      and support operations.
                    </p>
                  </div>
                  <Button type="button" variant="outline">
                    <Settings2 className="size-4" aria-hidden="true" />
                    Standards map
                  </Button>
                </div>

                <Table className="min-w-[680px]">
                  <TableHeader>
                    <TableRow className="text-muted-foreground hover:bg-transparent">
                      <TableHead>Quest template</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Market mode</TableHead>
                      <TableHead>Student visibility</TableHead>
                      <TableHead>Use</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {libraryQuests.map((quest) => (
                      <TableRow
                        key={quest.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openAdminQuestDetails(quest)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openAdminQuestDetails(quest);
                          }
                        }}
                        className="cursor-pointer transition hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <TableCell className="font-medium">{quest.title}</TableCell>
                        <TableCell>{quest.ownerName ?? ""}</TableCell>
                        <TableCell className="capitalize">
                          {quest.marketMode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              quest.scoreVisibility === "hidden"
                                ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                                : "rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                            }
                          >
                            {quest.scoreVisibility}
                          </Badge>
                        </TableCell>
                        <TableCell>{quest.assigned} students</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Dialog
                  open={adminQuestDetailsOpen}
                  onOpenChange={setAdminQuestDetailsOpen}
                >
                  {selectedAdminLibraryQuest ? (
                    <AdminQuestDetailsDialog quest={selectedAdminLibraryQuest} />
                  ) : null}
                </Dialog>

                <LearningQuestTransferPanel
                  audience="Admin"
                  notice={questTransferNotice}
                  onExport={exportLearningQuests}
                  onImport={importLearningQuests}
                  onTextChange={setQuestTransferText}
                  transferText={questTransferText}
                />
              </div>

              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#28666e]" />
                  <h3 className="text-lg font-semibold">Admin controls</h3>
                </div>
                <div className="mt-4 space-y-4">
                  <AdminPolicy
                    title="Default hidden rubric"
                    detail="New teacher quests start with teacher-only scoring signals enabled."
                    enabled
                  />
                  <AdminPolicy
                    title="Market data disclosure"
                    detail="Student views label quotes as delayed, simulated, and not advice."
                    enabled
                  />
                  <AdminPolicy
                    title="Template approval"
                    detail="Teachers can draft locally; district templates require admin approval."
                    enabled={false}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-semibold">Version 1 platform map</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The first release focuses on proof of learning, not real-money
                  accounts.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {implementation.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
                    >
                      <ShieldCheck
                        className="mt-0.5 size-5 shrink-0 text-[#28666e]"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-6">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-[#1f363d] p-5 text-white shadow-sm">
                <h3 className="text-lg font-semibold">Backend direction</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Version 1 should persist schools, classes, students, simulated
                  portfolios, learning evidence, and assignment attempts.
                </p>
                <div className="mt-5 space-y-3">
                  <StackItem title="Identity" detail="Student, teacher, district roles" />
                  <StackItem title="Market data" detail="Provider adapter and caching" />
                  <StackItem title="Reports" detail="Mastery, usage, and outcomes" />
                  <StackItem title="Safety" detail="No trades, advice, or banking links" />
                </div>
              </div>
            </section>
                  </>
                )}
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </section>
      <AppVersion />
    </main>
  );
}

function AppVersion({ className }: { className?: string }) {
  return (
    <footer
      className={`py-3 text-center text-[11px] text-muted-foreground/60 ${className ?? ""}`}
    >
      v{APP_VERSION}
    </footer>
  );
}

function LoginPage({
  email,
  notice,
  password,
  pending,
  challengeQuestion,
  challengeAnswer,
  onChallengeAnswerChange,
  onEmailChange,
  onPasswordChange,
  onSelectDemo,
  onSsoLogin,
  onSubmit,
}: {
  email: string;
  notice: string;
  password: string;
  pending: boolean;
  challengeQuestion: string | null;
  challengeAnswer: string;
  onChallengeAnswerChange: (answer: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSelectDemo: (account: (typeof demoLoginAccounts)[number]) => void;
  onSsoLogin: () => void;
  onSubmit: () => void;
}) {
  const [demoAccountsAvailable, setDemoAccountsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/demo-logins")
      .then(
        (response) =>
          (response.ok ? response.json() : { enabled: false }) as Promise<{
            enabled?: boolean;
          }>
      )
      .then((body) => {
        if (!cancelled) {
          setDemoAccountsAvailable(Boolean(body.enabled));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                School platform MVP
              </p>
              <h1 className="text-2xl font-semibold tracking-normal">
                FutureFund Classroom
              </h1>
            </div>
          </div>

          <div>
            <Badge className="mb-4 rounded-md bg-[#e8f0ed] text-[#24493f] hover:bg-[#e8f0ed]">
              SSO-ready login
            </Badge>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-normal sm:text-5xl">
              Secure access for students, teachers, and district admins.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Users start with an account tied to their school role. District
              SSO can connect later through the same identity model.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StackItem title="Credentials" detail="Hashed password records" />
            <StackItem title="SSO" detail="Provider identity links" />
            <StackItem title="Sessions" detail="Auditable login metadata" />
          </div>
        </div>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-[#28666e]" />
              <h3 className="text-lg font-semibold">Sign in</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your district account or start the district SSO path.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Input
                  id="login-email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  className={demoAccountsAvailable ? "pr-11" : undefined}
                  onChange={(event) => onEmailChange(event.target.value)}
                />
                {demoAccountsAvailable ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Choose the demo login"
                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
                      >
                        <ChevronRight
                          className="size-4 rotate-90"
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-72">
                      <DropdownMenuLabel>Demo login</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {demoLoginAccounts.map((account) => (
                        <DropdownMenuItem
                          key={account.email}
                          onSelect={() => onSelectDemo(account)}
                          className="flex flex-col items-start gap-0.5"
                        >
                          <span className="font-medium">{account.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {account.email}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
              />
            </div>

            {challengeQuestion ? (
              <div className="space-y-2">
                <Label htmlFor="login-security-answer">{challengeQuestion}</Label>
                <Input
                  id="login-security-answer"
                  autoComplete="off"
                  autoFocus
                  value={challengeAnswer}
                  onChange={(event) =>
                    onChallengeAnswerChange(event.target.value)
                  }
                />
              </div>
            ) : null}

            {notice ? (
              <p className="rounded-md bg-[#fff3da] p-3 text-sm text-[#6d4a08]">
                {notice}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-[#28666e] text-white hover:bg-[#22565d]"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              {pending ? "Signing in" : "Sign in"}
            </Button>
          </form>

          <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border" />
            <span>or</span>
            <div className="h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onSsoLogin}
            className="w-full"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Continue with district SSO
          </Button>

        </section>
      </section>
      <AppVersion className="absolute inset-x-0 bottom-0" />
    </main>
  );
}

function MarketPage({
  clock,
  lifeEvents,
  onMarketChanged,
  infoClassName,
  allowFractional,
  portfolioError,
  portfolioTitle,
  readOnly,
  cash,
  holdings,
  marketNotice,
  quotes,
  role,
  stockHoldingsValue,
  onTrade,
}: {
  cash: number;
  holdings: StockHolding[];
  marketNotice: string;
  quotes: MarketQuote[];
  role: AdminUser["role"];
  stockHoldingsValue: number;
  onTrade: (ticker: string, action: "buy" | "sell", shares: number, max?: boolean) => Promise<void>;
  allowFractional: boolean;
  portfolioError: string;
  portfolioTitle: string | null;
  readOnly: boolean;
  // The class whose Stock info level applies (null for practice portfolios).
  infoClassName: string | null;
  // The market clock for the portfolio on screen (null until it has loaded).
  clock: ClockView | null;
  lifeEvents: StudentLifeEvent[];
  onMarketChanged: () => void;
}) {
  // Paused or closed: prices hold and trading is off (v0.2.12).
  const tradingBlocked = clock ? tradingBlockedReason(clock) : null;
  // The symbol whose stock info popup is open (v0.2.11).
  const [infoTicker, setInfoTicker] = useState<string | null>(null);
  // Teachers and admins get the saved market controls (v0.2.8).
  const isTeacher = role === "Teacher" || role === "Admin";
  // How many shares each row's Buy/Sell will trade (typed or set with −/+).
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [tradingTicker, setTradingTicker] = useState<string | null>(null);
  const amountFor = (ticker: string) => amounts[ticker] ?? "1";
  const step = (ticker: string, delta: number) => {
    const current = Number.parseFloat(amountFor(ticker));
    const next = Math.max(1, Math.floor(Number.isFinite(current) ? current : 1) + delta);
    setAmounts((all) => ({ ...all, [ticker]: String(next) }));
  };
  async function trade(ticker: string, action: "buy" | "sell") {
    const shares = Number.parseFloat(amountFor(ticker));

    setTradingTicker(ticker);
    try {
      await onTrade(ticker, action, shares);
    } finally {
      setTradingTicker(null);
    }
  }
  // Buy max (v0.2.14): spend the cash on as many whole shares as it covers.
  async function buyMax(ticker: string) {
    setTradingTicker(ticker);
    try {
      await onTrade(ticker, "buy", 0, true);
    } finally {
      setTradingTicker(null);
    }
  }
  const holdingsByTicker = new Map(
    holdings.map((holding) => [holding.ticker, holding])
  );
  const totalSharesHeld = holdings.reduce((total, holding) => total + holding.quantity, 0);

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {clock ? (
              <p
                data-testid="market-speed"
                className={`mb-2 inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold ${
                  clock.tradingAllowed ? "bg-[#e8f0ed] text-[#24493f]" : "bg-[#fff3da] text-[#7a4b00]"
                }`}
              >
                Market Speed: {clock.label}
              </p>
            ) : null}
            <p className="text-sm font-medium text-muted-foreground">
              Classroom market feed
            </p>
            <h3 className="text-2xl font-semibold tracking-normal">
              Live market data
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Simulated trading decisions use class-safe market data and are
              reflected in the student portfolio.
            </p>
          </div>
          <Badge className="w-fit rounded-md bg-[#07130d] px-3 py-1 text-[#8cffb0] hover:bg-[#07130d]">
            {portfolioTitle ?? "Market classroom"}
          </Badge>
        </div>
        {portfolioTitle ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {allowFractional
              ? "This class can trade fractional shares (up to 4 decimal places, e.g. 2.5)."
              : "This class trades whole shares. Use − and + or type a number."}
          </p>
        ) : null}
        {readOnly ? (
          <p className="mt-3 rounded-md bg-accent px-3 py-2 text-sm">
            This portfolio is from a school year that has ended. It&apos;s a read-only
            record, so trading is turned off.
          </p>
        ) : null}
        {portfolioError ? (
          <p className="mt-3 rounded-md bg-accent px-3 py-2 text-sm">{portfolioError}</p>
        ) : null}
        {!isTeacher ? <div className="mt-4"><StudentLifeEvents events={lifeEvents} /></div> : null}
        {tradingBlocked ? (
          <p
            role="status"
            data-testid="market-blocked"
            className="mt-3 rounded-md border border-[#e0a100]/40 bg-[#fff3da] px-3 py-2 text-sm font-medium text-[#7a4b00]"
          >
            {clock?.status === "paused" ? (isTeacher ? "Market paused. " : "Market paused by your teacher. ") : "Market closed. "}
            Prices are holding still and trading is off until it starts again.
          </p>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<CircleDollarSign className="size-5" />}
          label="Available cash"
          value={formatCurrency(cash)}
          detail="Portfolio cash for simulated trades"
        />
        <SummaryCard
          icon={<TrendingUp className="size-5" />}
          label="Stocks value"
          value={formatCurrency(stockHoldingsValue)}
          detail={`${totalSharesHeld.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${
            totalSharesHeld === 1 ? "share" : "shares"
          } in ${holdings.length} ${holdings.length === 1 ? "stock" : "stocks"}. Click to see them.`}
          onClick={() => document.getElementById("market-stocks")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <SummaryCard
          icon={<LineChart className="size-5" />}
          label="Market rows"
          value={`${quotes.length}`}
          detail="Quotes plus classroom news"
        />
      </section>

      {marketNotice ? (
        <p className="rounded-md border border-[#28666e]/20 bg-[#e8f0ed] px-3 py-2 text-sm text-[#24493f]">
          {marketNotice}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-lg border border-[#1f3a2c] bg-[#050806] p-3 shadow-sm">
        <Table className="min-w-[1060px] text-[#dbffe7]">
          <TableHeader>
            <TableRow className="border-[#1f3a2c] text-[#8cffb0] hover:bg-transparent">
              <TableHead className="text-[#8cffb0]">Symbol</TableHead>
              <TableHead className="text-[#8cffb0]">Name</TableHead>
              <TableHead className="text-right text-[#8cffb0]">Price</TableHead>
              <TableHead className="text-right text-[#8cffb0]">Move</TableHead>
              <TableHead className="text-[#8cffb0]">Trade</TableHead>
              <TableHead className="text-[#8cffb0]">Range</TableHead>
              <TableHead className="text-[#8cffb0]">Latest news</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => {
              const holding = holdingsByTicker.get(quote.ticker);
              const isUp = quote.changePercent >= 0;

              return (
                <TableRow
                  key={quote.ticker}
                  className="border-[#1f3a2c] hover:bg-[#0d1c13]"
                >
                  <TableCell className="font-semibold text-white">
                    <button
                      type="button"
                      className="rounded-sm underline decoration-dotted underline-offset-4 hover:text-[#8cffb0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8cffb0]"
                      aria-label={`Stock info for ${quote.ticker}`}
                      onClick={() => setInfoTicker(quote.ticker)}
                    >
                      {quote.ticker}
                    </button>
                    {holding ? (
                      <span className="ml-2 rounded-sm bg-[#102c1b] px-1.5 py-0.5 text-xs text-[#8cffb0]">
                        {holding.quantity} held
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="block text-white">{quote.name}</span>
                    <span className="text-xs text-[#93b59e]">{quote.sector}</span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      isUp ? "text-[#62f58e]" : "text-[#ff6b6b]"
                    }`}
                  >
                    {formatCurrency(quote.price)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      isUp ? "text-[#62f58e]" : "text-[#ff6b6b]"
                    }`}
                  >
                    {formatSignedPercent(quote.changePercent)}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`One fewer ${quote.ticker} share`}
                          disabled={readOnly}
                          onClick={() => step(quote.ticker, -1)}
                          className="h-8 w-8 border-[#1f3a2c] bg-transparent px-0 text-[#c7f7d7] hover:bg-[#102c1b]"
                        >
                          −
                        </Button>
                        <Input
                          aria-label={`Shares of ${quote.ticker}`}
                          inputMode="decimal"
                          type="number"
                          min={allowFractional ? 0.0001 : 1}
                          step={allowFractional ? 0.0001 : 1}
                          disabled={readOnly}
                          value={amountFor(quote.ticker)}
                          onChange={(event) =>
                            setAmounts((all) => ({ ...all, [quote.ticker]: event.target.value }))
                          }
                          className="h-8 w-24 border-[#1f3a2c] bg-[#0d1c13] text-right text-white"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`One more ${quote.ticker} share`}
                          disabled={readOnly}
                          onClick={() => step(quote.ticker, 1)}
                          className="h-8 w-8 border-[#1f3a2c] bg-transparent px-0 text-[#c7f7d7] hover:bg-[#102c1b]"
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={readOnly || tradingBlocked !== null || tradingTicker !== null}
                          onClick={() => void trade(quote.ticker, "buy")}
                          className="bg-[#0fa35a] text-white hover:bg-[#0c874b]"
                        >
                          Buy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={readOnly || tradingBlocked !== null || tradingTicker !== null}
                          onClick={() => void trade(quote.ticker, "sell")}
                          className="border-[#ff6b6b]/60 bg-transparent text-[#ffb0b0] hover:bg-[#351111]"
                        >
                          Sell
                        </Button>
                        {(() => {
                          const affordable = maxWholeShares(Math.round(cash * 100), Math.round(quote.price * 100));

                          return (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              aria-label={`Buy max ${quote.ticker}: ${affordable} whole ${affordable === 1 ? "share" : "shares"}`}
                              title={`Spend your cash on ${affordable} whole ${affordable === 1 ? "share" : "shares"} of ${quote.ticker}`}
                              disabled={readOnly || tradingBlocked !== null || tradingTicker !== null || affordable < 1}
                              onClick={() => void buyMax(quote.ticker)}
                              className="border-[#8cffb0]/60 bg-transparent text-[#8cffb0] hover:bg-[#102c1b]"
                            >
                              Buy max ({affordable.toLocaleString()})
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#c7f7d7]">
                    {formatCurrency(quote.dayLow)} - {formatCurrency(quote.dayHigh)}
                  </TableCell>
                  <TableCell className="max-w-[320px] text-sm text-[#c7f7d7]">
                    {quote.news}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <StockInfoDialog
        className={infoClassName}
        heldText={(() => {
          const held = infoTicker ? holdingsByTicker.get(infoTicker) : undefined;
          const price = quotes.find((quote) => quote.ticker === infoTicker)?.price ?? 0;

          return held
            ? `${held.quantity} ${held.quantity === 1 ? "share" : "shares"} worth ${formatCurrency(held.quantity * price)}`
            : null;
        })()}
        ticker={infoTicker}
        onClose={() => setInfoTicker(null)}
        onTrade={
          readOnly
            ? null
            : (symbol) => {
                // Jump to that row's share box, ready to buy or sell.
                window.setTimeout(() => {
                  const box = document.querySelector<HTMLInputElement>(`input[aria-label="Shares of ${symbol}"]`);
                  box?.scrollIntoView({ block: "center" });
                  box?.focus();
                  box?.select();
                }, 150);
              }
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div id="market-stocks" className="scroll-mt-24">
          <StocksInfoBox holdings={holdings} quotes={quotes} />
        </div>

        {isTeacher ? (
          <div className="space-y-6">
            <TeacherMarketControls onMarketChanged={onMarketChanged} />
            <LifeEventsPanel onChanged={onMarketChanged} />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold">Trading notes</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Buy and sell actions are simulated. They change your classroom
              portfolio cash, update your Stocks box, and add an entry to your
              portfolio history.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

type TeacherMarketChange = {
  appliesTo: string;
  createdAt: string;
  createdBy: string;
  eventId: string;
  id: string;
  label: string;
  percent: number;
  ticker: string;
};

type TeacherMarketView = {
  changes: TeacherMarketChange[];
  classes: string[];
  className: string | null;
  market: Array<{ changePercent: number; name: string; news?: string; price: number; ticker: string }>;
  students: Array<{ email: string; name: string }>;
  // Stock info level for the selected class (v0.2.11).
  infoLevel?: { gradeLevel: number | null; level: "basic" | "full"; setting: "basic" | "full" | null } | null;
  // The selected class's market clock (v0.2.12).
  clock?: ClockView | null;
};

type TeacherTargetType = "class" | "all_classes" | "students" | "student";

type TeacherMarketLoad = TeacherMarketView | { error: string };

async function fetchTeacherMarket(className: string | null): Promise<TeacherMarketLoad> {
  try {
    const query = className ? `?className=${encodeURIComponent(className)}` : "";
    const response = await fetch(`/api/teacher/market${query}`, { credentials: "same-origin" });
    const result = (await response.json()) as TeacherMarketView & { message?: string };

    return response.ok ? result : { error: result.message ?? "The class market couldn't be loaded." };
  } catch {
    return { error: "The class market couldn't be loaded." };
  }
}

const nativeSelectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs";

/**
 * Teacher market controls (v0.2.8). Changes are saved on the server and
 * apply to students' real prices: raise or lower a symbol, or trigger the
 * Strait of Hormuz scenario, for this class, all my classes, a group of
 * students, or one student. Every change can be undone; nothing is deleted.
 */
function TeacherMarketControls({ onMarketChanged }: { onMarketChanged: () => void }) {
  const [view, setView] = useState<TeacherMarketView | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<TeacherTargetType>("class");
  const [groupEmails, setGroupEmails] = useState<string[]>([]);
  const [oneStudent, setOneStudent] = useState("");
  const [hormuzSymbols, setHormuzSymbols] = useState("XLE,OIH,JETS");
  const [oilSpike, setOilSpike] = useState(18);
  // Market event templates (v0.2.19).
  const [templateId, setTemplateId] = useState(marketTemplates[0].id);
  const [templateDifficulty, setTemplateDifficulty] = useState<Difficulty>("realistic");
  const [scandalTicker, setScandalTicker] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  // Market rewind popup (v0.2.13).
  const [historyOpen, setHistoryOpen] = useState(false);
  const requestId = useRef(0);

  function applyLoaded(current: number, result: TeacherMarketLoad) {
    // Ignore a slower, older response (same guard as issue #19).
    if (current !== requestId.current) return;

    if ("error" in result) {
      setNotice(result.error);
      return;
    }

    setView(result);
    setClassName(result.className);
  }

  async function load(nextClass: string | null) {
    const current = ++requestId.current;
    applyLoaded(current, await fetchTeacherMarket(nextClass));
  }

  useEffect(() => {
    const current = ++requestId.current;
    void fetchTeacherMarket(null).then((result) => applyLoaded(current, result));
    // Runs once when the panel opens.
  }, []);

  function chooseClass(next: string) {
    setGroupEmails([]);
    setOneStudent("");
    setNotice("");
    void load(next);
  }

  function buildTarget() {
    if (!className) return null;
    if (targetType === "all_classes") return { type: "all_classes" };
    if (targetType === "class") return { className, type: "class" };

    const emails = targetType === "student" ? (oneStudent ? [oneStudent] : []) : groupEmails;
    return emails.length ? { className, studentEmails: emails, type: "students" } : null;
  }

  function targetDescription() {
    if (targetType === "all_classes") return "all your classes";
    if (targetType === "class") return className ?? "this class";
    if (targetType === "student") {
      return view?.students.find((s) => s.email === oneStudent)?.name ?? "one student";
    }
    return `${groupEmails.length} student${groupEmails.length === 1 ? "" : "s"}`;
  }

  async function send(body: Record<string, unknown>, success: (result: Record<string, unknown>) => string) {
    setPending(true);
    setNotice("");

    try {
      const response = await fetch("/api/teacher/market", {
        body: JSON.stringify(body),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as Record<string, unknown> & { message?: string };

      if (!response.ok) {
        setNotice(result.message ?? "That market change couldn't be saved.");
        return;
      }

      setNotice(success(result));
      await load(className);
      onMarketChanged();
    } catch {
      setNotice("That market change couldn't be saved. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  function makeChange(change: Record<string, unknown>, what: string) {
    const target = buildTarget();

    if (!target) {
      setNotice(targetType === "student" ? "Choose a student first." : "Tick at least one student first.");
      return;
    }

    const who = targetDescription();
    void send({ action: "change", change, target }, (result) => {
      const skipped = Array.isArray(result.skipped) && result.skipped.length
        ? ` Skipped: ${(result.skipped as string[]).join(", ")}.`
        : "";
      return `${what} for ${who}. Students see the new prices now.${skipped}`;
    });
  }

  if (!view) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold">Teacher market controls</h3>
        <p className="mt-2 text-sm text-muted-foreground">{notice || "Loading your class markets…"}</p>
      </div>
    );
  }

  if (!view.className) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold">Teacher market controls</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          None of your classes have teacher market controls turned on. An admin can turn them on
          in Market Engine.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Teacher market controls"
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            Teacher market controls
            <Badge variant="outline" className="rounded-md" data-testid="staff-only-badge">
              Teachers and admins only
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            Students never see this box, even when you use Assume role: Student.{" "}
            Changes are saved and apply to your students&apos; prices right away. They stay
            until you undo them or reset the market to normal.
          </p>
        </div>
        <TriangleAlert className="size-5 text-[#c44536]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="teacher-market-class">Class market</Label>
          <select
            id="teacher-market-class"
            className={nativeSelectClass}
            value={view.className}
            onChange={(event) => chooseClass(event.target.value)}
          >
            {view.classes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacher-market-target">Who it applies to</Label>
          <select
            id="teacher-market-target"
            className={nativeSelectClass}
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as TeacherTargetType)}
          >
            <option value="class">This class</option>
            <option value="all_classes">All my classes</option>
            <option value="students">A group of students</option>
            <option value="student">One student</option>
          </select>
        </div>
        {view.clock ? (
          <div className="space-y-3 rounded-md border border-border p-3 md:col-span-2" data-testid="market-clock-controls">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                Market clock for {view.className}:{" "}
                <span data-testid="class-clock-label">
                  {view.clock.label === "Paused" || view.clock.label === "Closed"
                    ? view.clock.label
                    : `Running at ${view.clock.label}`}
                </span>
              </p>
              {view.clock.status === "paused" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  className="bg-[#28666e] text-white hover:bg-[#22565d]"
                  onClick={() =>
                    void send({ action: "clock", className: view.className, op: "resume" }, () => `${view.className} market resumed. Students can trade again.`)
                  }
                >
                  Resume market
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    void send({ action: "clock", className: view.className, op: "pause" }, () => `${view.className} market paused. Prices are frozen and students can't trade.`)
                  }
                >
                  Pause market
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Market speed">
              <span className="text-sm text-muted-foreground">Speed</span>
              {CLOCK_SPEEDS.map((speed) => (
                <Button
                  key={speed}
                  type="button"
                  size="sm"
                  variant={view.clock?.speed === speed ? "default" : "outline"}
                  aria-pressed={view.clock?.speed === speed}
                  disabled={pending}
                  onClick={() =>
                    void send({ action: "clock", className: view.className, op: "speed", speed }, () => `${view.className} market speed set to ${speed}x. Students see the speed on their Market screen.`)
                  }
                >
                  {speed}x
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="teacher-market-hours">Market hours</Label>
              <select
                id="teacher-market-hours"
                className={nativeSelectClass}
                disabled={pending}
                value={view.clock.hours}
                onChange={(event) =>
                  void send({ action: "clock", className: view.className, hours: event.target.value, op: "hours" }, () => `Market hours saved for ${view.className}.`)
                }
              >
                <option value="always">Always open (24 hours)</option>
                <option value="us_market">U.S. market hours (9:30 AM to 4:00 PM Eastern, weekdays)</option>
              </select>
            </div>
            <div>
              <Button type="button" size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
                Market history
              </Button>
              {historyOpen ? (
                <MarketHistoryDialog
                  className={view.className ?? ""}
                  open
                  symbols={view.market.map((symbol) => ({ name: symbol.name, ticker: symbol.ticker }))}
                  onClose={() => setHistoryOpen(false)}
                />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              While the market is paused or closed, prices hold still and students can&apos;t trade. The clock applies
              to the whole class, whoever the price changes below apply to.
            </p>
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="teacher-info-level">Stock info level</Label>
          <select
            id="teacher-info-level"
            className={nativeSelectClass}
            disabled={pending}
            value={view.infoLevel?.setting ?? ""}
            onChange={(event) =>
              void send(
                { action: "infoLevel", className: view.className, level: event.target.value || null },
                () => `Stock info level saved for ${view.className}.`
              )
            }
          >
            <option value="">
              Default for the grade ({defaultInfoLevel(view.infoLevel?.gradeLevel) === "full" ? "Full" : "Basic"})
            </option>
            <option value="basic">Basic: price, simple chart, plain description</option>
            <option value="full">Full: adds key figures, sector, news, more chart ranges</option>
          </select>
          <p className="text-xs text-muted-foreground">
            What students in {view.className} see when they click a symbol. Teachers and admins always see Full.
          </p>
        </div>
      </div>

      {targetType === "students" ? (
        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Students in {view.className}</legend>
          {view.students.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {view.students.map((student) => (
                <label key={student.email} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    aria-label={student.name}
                    checked={groupEmails.includes(student.email)}
                    onCheckedChange={(checked) =>
                      setGroupEmails((all) =>
                        checked ? [...all, student.email] : all.filter((e) => e !== student.email)
                      )
                    }
                  />
                  {student.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No students in this class yet.</p>
          )}
        </fieldset>
      ) : null}

      {targetType === "student" ? (
        <div className="space-y-2">
          <Label htmlFor="teacher-market-student">Student</Label>
          <select
            id="teacher-market-student"
            className={nativeSelectClass}
            value={oneStudent}
            onChange={(event) => setOneStudent(event.target.value)}
          >
            <option value="">Choose a student…</option>
            {view.students.map((student) => (
              <option key={student.email} value={student.email}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Class price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>Move it {PRICE_STEP_LABEL}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.market.map((symbol) => (
              <TableRow key={symbol.ticker}>
                <TableCell>
                  <span className="font-semibold">{symbol.ticker}</span>
                  <span className="block text-xs text-muted-foreground">{symbol.name}</span>
                </TableCell>
                <TableCell className="text-right" data-testid={`class-price-${symbol.ticker}`}>
                  {formatCurrency(symbol.price)}
                </TableCell>
                <TableCell className="text-right">{formatSignedPercent(symbol.changePercent)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      aria-label={`Raise ${symbol.ticker}`}
                      onClick={() =>
                        makeChange({ direction: "raise", kind: "price", ticker: symbol.ticker }, `Raised ${symbol.ticker} 3%`)
                      }
                    >
                      Raise
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      aria-label={`Lower ${symbol.ticker}`}
                      onClick={() =>
                        makeChange({ direction: "lower", kind: "price", ticker: symbol.ticker }, `Lowered ${symbol.ticker} 3%`)
                      }
                    >
                      Lower
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">
          Class prices show what the whole class sees. Changes for a group or one student
          only change those students&apos; prices.
        </p>
      </div>

      <div className="rounded-md border border-border p-3" data-testid="market-events">
        <h4 className="font-semibold">Market events</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {marketTemplates.find((template) => template.id === templateId)?.description}
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="market-template">Event</Label>
            <select id="market-template" className={nativeSelectClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {marketTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="market-template-difficulty">Difficulty</Label>
            <select
              id="market-template-difficulty"
              className={nativeSelectClass}
              value={templateDifficulty}
              onChange={(event) => setTemplateDifficulty(event.target.value as Difficulty)}
            >
              {(Object.keys(difficultyLabels) as Difficulty[]).map((key) => (
                <option key={key} value={key}>
                  {difficultyLabels[key]}
                </option>
              ))}
            </select>
          </div>
          {marketTemplates.find((template) => template.id === templateId)?.needsTicker ? (
            <div className="space-y-2">
              <Label htmlFor="market-template-ticker">Company</Label>
              <select id="market-template-ticker" className={nativeSelectClass} value={scandalTicker} onChange={(event) => setScandalTicker(event.target.value)}>
                <option value="">Choose a symbol…</option>
                {view.market.map((symbol) => (
                  <option key={symbol.ticker} value={symbol.ticker}>
                    {symbol.ticker}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          disabled={pending}
          className="mt-3"
          onClick={() =>
            makeChange(
              { difficulty: templateDifficulty, kind: "template", templateId, ticker: scandalTicker || null },
              `${marketTemplates.find((template) => template.id === templateId)?.title ?? "Market event"} started`
            )
          }
        >
          Start market event
        </Button>
      </div>

      <div className="rounded-md border border-border p-3">
        <h4 className="font-semibold">Strait of Hormuz scenario</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          A major oil supply shock. Energy and oil-service symbols rise by the oil spike;
          travel symbols fall because fuel costs rise.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hormuz-symbols">Affected symbols</Label>
            <Input
              id="hormuz-symbols"
              value={hormuzSymbols}
              onChange={(event) => setHormuzSymbols(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oil-spike">Oil spike %</Label>
            <Input
              id="oil-spike"
              max={60}
              min={1}
              type="number"
              value={oilSpike}
              onChange={(event) => setOilSpike(Number(event.target.value))}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            makeChange(
              {
                kind: "hormuz",
                oilSpikePercent: oilSpike,
                tickers: hormuzSymbols.split(",").map((t) => t.trim()).filter(Boolean),
              },
              "Strait of Hormuz scenario started"
            )
          }
          className="mt-3 bg-[#c44536] text-white hover:bg-[#a9362a]"
        >
          <TriangleAlert className="size-4" aria-hidden="true" />
          Trigger scenario
        </Button>
      </div>

      {notice ? (
        <p role="status" className="rounded-md bg-accent px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}

      <div>
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold">Active changes in {view.className}</h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || view.changes.length === 0}
            onClick={() =>
              void send(
                { action: "reset", className: view.className },
                () => `${view.className} is back to normal prices.`
              )
            }
          >
            Reset to normal
          </Button>
        </div>
        {view.changes.length ? (
          <ul className="mt-2 grid gap-2" aria-label="Active changes">
            {view.changes.map((change) => (
              <li
                key={change.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <span>
                  <strong>{change.label}</strong> · {change.appliesTo}
                  <span className="block text-xs text-muted-foreground">
                    {change.createdBy} · {new Date(change.createdAt).toLocaleString()}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  aria-label={`Undo ${change.label}`}
                  onClick={() => void send({ action: "undo", changeId: change.id }, () => `Undid ${change.label}.`)}
                >
                  Undo
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No active changes. Students see the normal class market.
          </p>
        )}
      </div>
    </section>
  );
}

const PRICE_STEP_LABEL = "3%";

function StocksInfoBox({
  holdings,
  quotes,
}: {
  holdings: StockHolding[];
  quotes: MarketQuote[];
}) {
  const totalValue = holdings.reduce((total, holding) => {
    const quote = quotes.find((item) => item.ticker === holding.ticker);

    return total + holding.quantity * (quote?.price ?? holding.averageCost);
  }, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Stocks</h3>
          <p className="text-sm text-muted-foreground">
            Simulated shares currently held in the portfolio.
          </p>
        </div>
        <CircleDollarSign className="size-5 text-[#28666e]" />
      </div>
      <div className="mb-4 rounded-md bg-[#e8f0ed] px-3 py-2 text-sm text-[#24493f]">
        Total stock value: <strong>{formatCurrency(totalValue)}</strong>
      </div>
      <div className="grid gap-2">
        {holdings.length ? (
          holdings.map((holding) => {
            const quote = quotes.find((item) => item.ticker === holding.ticker);
            const marketValue =
              holding.quantity * (quote?.price ?? holding.averageCost);
            const gainLoss =
              quote && holding.averageCost > 0
                ? ((quote.price - holding.averageCost) / holding.averageCost) * 100
                : 0;

            return (
              <div
                key={holding.ticker}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{holding.ticker}</span>
                  <span>{formatCurrency(marketValue)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                  <span>
                    {holding.quantity} shares at {formatCurrency(quote?.price ?? holding.averageCost)}
                  </span>
                  <span
                    className={
                      gainLoss >= 0 ? "font-medium text-[#28666e]" : "font-medium text-[#c44536]"
                    }
                  >
                    {formatSignedPercent(gainLoss)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            No stock holdings yet. Buy a simulated share from the Market page.
          </p>
        )}
      </div>
    </div>
  );
}

function AdminQuestDetailsDialog({ quest }: { quest: TeacherQuest }) {
  const totalPoints = quest.criteria.reduce(
    (total, criterion) => total + criterion.points,
    0
  );
  const hiddenRules = quest.criteria.filter(
    (criterion) => !criterion.visibleToStudents
  ).length;
  const submittedPercent =
    quest.assigned > 0 ? Math.round((quest.submitted / quest.assigned) * 100) : 0;

  return (
    <DialogContent className="max-h-[min(88vh,760px)] overflow-y-auto sm:max-w-3xl">
      <DialogHeader className="pr-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-md bg-[#e8f0ed] text-[#24493f] hover:bg-[#e8f0ed]">
            {quest.status}
          </Badge>
          <Badge variant="outline" className="rounded-md capitalize">
            {quest.marketMode}
          </Badge>
          <Badge
            variant="outline"
            className={
              quest.scoreVisibility === "hidden"
                ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                : "rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
            }
          >
            {quest.scoreVisibility} scoring
          </Badge>
        </div>
        <DialogTitle className="text-2xl leading-tight">
          {quest.title}
        </DialogTitle>
        <DialogDescription className="text-base leading-7">
          {quest.objective}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <LineChart className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">Market parameters</h3>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="mt-1 font-medium capitalize">{quest.marketMode}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Window</dt>
                <dd className="mt-1 font-medium">{quest.marketWindow}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Symbols</dt>
                <dd className="mt-1 font-medium">
                  {quest.marketSymbols || "No symbols configured"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-[#28666e]" />
                <h3 className="font-semibold">Scoring rules</h3>
              </div>
              <Badge variant="outline" className="rounded-md">
                {totalPoints} pts
              </Badge>
            </div>
            <div className="space-y-3">
              {quest.criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_80px_130px]"
                >
                  <p className="text-sm font-medium leading-6">
                    {criterion.label}
                  </p>
                  <p className="text-sm font-semibold">{criterion.points} pts</p>
                  <Badge
                    variant="outline"
                    className={
                      criterion.visibleToStudents
                        ? "w-fit rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                        : "w-fit rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                    }
                  >
                    {criterion.visibleToStudents ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">Completion</h3>
              <span className="text-sm font-medium">{submittedPercent}%</span>
            </div>
            <Progress value={submittedPercent} className="h-2 bg-[#e8f0ed]" />
            <div className="mt-4 grid gap-3 text-sm">
              <QuestMonitorMetric label="Assigned" value={quest.assigned} />
              <QuestMonitorMetric label="Submitted" value={quest.submitted} />
              <QuestMonitorMetric label="Average" value={`${quest.avgScore}%`} />
              <QuestMonitorMetric label="Review flags" value={quest.flagged} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              {quest.scoreVisibility === "hidden" ? (
                <EyeOff className="size-5 text-[#a13d2e]" />
              ) : (
                <Eye className="size-5 text-[#28666e]" />
              )}
              <h3 className="font-semibold">Student visibility</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {hiddenRules} rubric signal{hiddenRules === 1 ? "" : "s"} hidden
              from students. Reflection is{" "}
              {quest.requireReflection ? "required" : "optional"} for this
              quest.
            </p>
          </div>
        </aside>
      </div>

      <DialogFooter showCloseButton />
    </DialogContent>
  );
}

function TeacherActiveStudentsPage({
  classes,
  onBack,
}: {
  classes: TeacherClassAnalytics[];
  onBack: () => void;
}) {
  const totalStudents = classes.reduce(
    (total, classroom) => total + classroom.activeStudents,
    0
  );
  const averageGoals = Math.round(
    classes.reduce((total, classroom) => total + classroom.goalsOnTrack, 0) /
      classes.length
  );
  const averageQuestCompletion = Math.round(
    classes.reduce((total, classroom) => total + classroom.questsComplete, 0) /
      classes.length
  );
  const totalDiscussionFlags = classes.reduce(
    (total, classroom) => total + classroom.discussions.flagged,
    0
  );

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <Button type="button" variant="ghost" onClick={onBack} className="mb-2 px-0">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Teacher dashboard
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-normal">
              Active Students
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Class-by-class view of quest progress, goal performance,
              simulated portfolio results, and discussion health.
            </p>
          </div>
          <Badge className="w-fit rounded-md bg-[#e8f0ed] text-[#24493f] hover:bg-[#e8f0ed]">
            Teacher view
          </Badge>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<UsersRound className="size-5" />}
          label="Active students"
          value={`${totalStudents}`}
          detail={`${classes.length} classes reporting`}
        />
        <SummaryCard
          icon={<Target className="size-5" />}
          label="Goals on track"
          value={`${averageGoals}%`}
          detail="Average across classes"
        />
        <SummaryCard
          icon={<BookOpenCheck className="size-5" />}
          label="Quest completion"
          value={`${averageQuestCompletion}%`}
          detail="Assigned quest progress"
        />
        <SummaryCard
          icon={<MessageCircle className="size-5" />}
          label="Discussion flags"
          value={`${totalDiscussionFlags}`}
          detail="Review queue items"
        />
      </section>

      <section className="grid gap-5">
        {classes.map((classroom) => (
          <article
            key={classroom.id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">{classroom.className}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {classroom.activeStudents} active students,{" "}
                      {classroom.questsNeedsReview} submissions need review.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`w-fit rounded-md ${
                      classroom.portfolioReturn >= 0
                        ? "border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                        : "border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                    }`}
                  >
                    {formatSignedPercent(classroom.portfolioReturn)} portfolio
                  </Badge>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  <QuestMonitorMetric
                    label="Goals"
                    value={`${classroom.goalsOnTrack}%`}
                  />
                  <QuestMonitorMetric
                    label="Quests"
                    value={`${classroom.questsComplete}%`}
                  />
                  <QuestMonitorMetric
                    label="Portfolio"
                    value={classroom.portfolioValue}
                  />
                  <QuestMonitorMetric
                    label="Participation"
                    value={`${classroom.discussions.participation}%`}
                  />
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[780px]">
                    <TableHeader>
                      <TableRow className="text-muted-foreground hover:bg-transparent">
                        <TableHead>Student</TableHead>
                        <TableHead>Readiness</TableHead>
                        <TableHead>Quest progress</TableHead>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>Discussions</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classroom.students.map((student) => (
                        <TableRow key={`${classroom.id}-${student.alias}`}>
                          <TableCell>
                            <div className="grid gap-0.5">
                              <span className="font-medium">{student.name}</span>
                              <span className="text-sm text-muted-foreground">
                                @{student.alias}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ProgressWithLabel value={student.readiness} />
                          </TableCell>
                          <TableCell>
                            <ProgressWithLabel value={student.questProgress} />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {student.portfolioValue}
                            </span>
                            <span
                              className={`ml-2 text-sm ${
                                student.portfolioReturn >= 0
                                  ? "text-[#28666e]"
                                  : "text-[#a13d2e]"
                              }`}
                            >
                              {formatSignedPercent(student.portfolioReturn)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StudentActivityDialog
                              className={classroom.className}
                              mode="discussions"
                              student={student}
                            />
                          </TableCell>
                          <TableCell>
                            <StudentActivityDialog
                              className={classroom.className}
                              mode="flags"
                              student={student}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <WalletCards className="size-5 text-[#28666e]" />
                    <h5 className="font-semibold">Portfolio distribution</h5>
                  </div>
                  <div className="space-y-3">
                    {classroom.allocation.map((bucket) => (
                      <div key={`${classroom.id}-${bucket.name}`} className="grid gap-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span>{bucket.name}</span>
                          <span className="font-medium">{bucket.value}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${bucket.value}%`,
                              backgroundColor: bucket.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="size-5 text-[#28666e]" />
                    <h5 className="font-semibold">Discussion stats</h5>
                  </div>
                  <div className="space-y-3">
                    <Metric label="Original posts" value={`${classroom.discussions.posts}`} />
                    <Metric label="Replies" value={`${classroom.discussions.replies}`} />
                    <Metric
                      label="Participation"
                      value={`${classroom.discussions.participation}%`}
                    />
                    <Metric
                      label="Flagged posts"
                      value={`${classroom.discussions.flagged}`}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function StudentActivityDialog({
  className,
  mode,
  student,
}: {
  className: string;
  mode: "discussions" | "flags";
  student: TeacherStudentAnalytics;
}) {
  const isFlagsMode = mode === "flags";
  const items = isFlagsMode
    ? buildStudentFlagItems(student, className)
    : buildStudentDiscussionItems(student, className);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-24 justify-between gap-2"
        >
          {isFlagsMode ? (
            <>
              <TriangleAlert className="size-4 text-[#a13d2e]" aria-hidden="true" />
              {student.flaggedPosts}
            </>
          ) : (
            <>
              <MessageCircle className="size-4 text-[#28666e]" aria-hidden="true" />
              {student.discussionPosts} posts
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(88vh,720px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-[#e8f0ed] text-[#24493f] hover:bg-[#e8f0ed]">
              {className}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              @{student.alias}
            </Badge>
          </div>
          <DialogTitle>
            {isFlagsMode ? "Flagged items" : "Discussion activity"}
          </DialogTitle>
          <DialogDescription>
            {student.name} has{" "}
            {isFlagsMode
              ? `${student.flaggedPosts} discussion flag${
                  student.flaggedPosts === 1 ? "" : "s"
                }`
              : `${student.discussionPosts} discussion post${
                  student.discussionPosts === 1 ? "" : "s"
                }`}{" "}
            in this class.
          </DialogDescription>
        </DialogHeader>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-md bg-background">
                      {item.room}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Needs review"
                          ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                          : "rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.when}</span>
                </div>
                <p className="text-sm leading-6">{item.body}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.context}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#28666e]" />
              <h4 className="font-semibold">No flagged discussions</h4>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              This student has no active discussion items waiting for teacher
              review in {className}.
            </p>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function StudentPortfolioPage({
  activity,
  allocationTargets,
  allocationTotal,
  cashBuffer,
  latestValue,
  largestAllocation,
  portfolio,
  totalGrowth,
  onBack,
  onSaveAllocation,
  onUpdateAllocation,
  activePortfolioId,
  portfolioError,
  portfolios,
  onSelectPortfolio,
}: {
  activePortfolioId: string | null;
  portfolioError: string;
  portfolios: ServerPortfolio[];
  onSelectPortfolio: (portfolioId: string) => void;
  activity: PortfolioActivity[];
  allocationTargets: typeof allocation;
  allocationTotal: number;
  cashBuffer: number;
  latestValue: number;
  largestAllocation: number;
  portfolio: typeof basePortfolio;
  totalGrowth: number;
  onBack: () => void;
  onSaveAllocation: () => void;
  onUpdateAllocation: (name: string, value: number) => void;
}) {
  const activePortfolio = portfolios.find((item) => item.id === activePortfolioId) ?? null;
  const allocationStatus =
    allocationTotal === 100
      ? "Ready to save"
      : allocationTotal > 100
        ? `${allocationTotal - 100}% over target`
        : `${100 - allocationTotal}% left to assign`;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <Button type="button" variant="ghost" onClick={onBack} className="mb-2 px-0">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Student home
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-normal">
              Portfolio
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {activePortfolio
                ? portfolioLabel(activePortfolio)
                : "Simulated holdings, recent changes, and allocation targets."}
            </p>
            {activePortfolio?.readOnly ? (
              <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm">
                Read-only record: this school year has ended.
              </p>
            ) : null}
            {portfolioError ? (
              <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm">{portfolioError}</p>
            ) : null}
          </div>
          <Badge className="w-fit rounded-md bg-[#fff3da] text-[#7a4b00] hover:bg-[#fff3da]">
            Simulated money only
          </Badge>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<WalletCards className="size-5" />}
          label="Portfolio value"
          value={`$${latestValue.toLocaleString()}`}
          detail={`${totalGrowth}% total growth`}
        />
        <SummaryCard
          icon={<Gauge className="size-5" />}
          label="Allocation total"
          value={`${allocationTotal}%`}
          detail={allocationStatus}
        />
        <SummaryCard
          icon={<PiggyBank className="size-5" />}
          label="Cash buffer"
          value={`${cashBuffer}%`}
          detail="Available for short-term goals"
        />
        <SummaryCard
          icon={<ShieldCheck className="size-5" />}
          label="Diversification"
          value={largestAllocation <= 50 ? "Balanced" : "Review"}
          detail={`Largest bucket is ${largestAllocation}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Portfolio overview</h3>
              <p className="text-sm text-muted-foreground">
                Value changes from simulated market days and learning choices.
              </p>
            </div>
            <LineChart className="size-5 text-muted-foreground" />
          </div>
          <div className="h-[280px] w-full">
            <PortfolioChart data={portfolio} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Current mix</h3>
              <p className="text-sm text-muted-foreground">
                Holdings by learning vehicle.
              </p>
            </div>
            <ChartNoAxesCombined className="size-5 text-muted-foreground" />
          </div>
          <div className="h-[210px]">
            <AllocationDonut items={allocationTargets} />
          </div>
          <div className="grid gap-2">
            {allocationTargets.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium">
                  ${Math.round((latestValue * item.value) / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Last 5 changes</h3>
              <p className="text-sm text-muted-foreground">
                Recent simulated trades, deposits, and portfolio updates.
              </p>
            </div>
            <ClipboardList className="size-5 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="text-muted-foreground hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Why it changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md bg-card">
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Change allocation</h3>
              <p className="text-sm text-muted-foreground">
                Adjust targets, then save the simulated portfolio change.
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                allocationTotal === 100
                  ? "w-fit rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                  : "w-fit rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
              }
            >
              {allocationStatus}
            </Badge>
          </div>

          <div className="space-y-5">
            {allocationTargets.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </Label>
                  <span className="text-sm font-semibold">{item.value}%</span>
                </div>
                <Slider
                  aria-label={`${item.name} allocation`}
                  max={80}
                  min={0}
                  step={1}
                  value={[item.value]}
                  onValueChange={(value) =>
                    onUpdateAllocation(item.name, value[0] ?? item.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg bg-[#f7f2e8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[#5b3f0b]">
              Targets can be saved even before they equal 100% so students can
              discuss drafts with a teacher.
            </p>
            <Button
              type="button"
              disabled={!activePortfolio || activePortfolio.readOnly}
              onClick={onSaveAllocation}
              className="bg-[#28666e] text-white hover:bg-[#22565d]"
            >
              <Save className="size-4" aria-hidden="true" />
              Save allocation
            </Button>
          </div>
        </div>
      </section>

      {portfolios.length > 0 ? (
        <PortfolioHistory
          activePortfolioId={activePortfolioId}
          portfolios={portfolios}
          onSelectPortfolio={onSelectPortfolio}
        />
      ) : null}
    </section>
  );
}

type ResetRequestRow = {
  className: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  id: string;
  reason: string;
  requesterEmail: string;
  requesterName: string;
  schoolYear: string;
  status: string;
  studentEmail: string;
  studentName: string;
};

const resetStatusLabels: Record<string, string> = {
  approved: "Approved",
  denied: "Denied",
  pending: "Waiting for admin",
};

/**
 * Teachers ask an admin to reset a student's portfolio to the class's
 * starting cash. The admin approves or denies it; the teacher is emailed.
 */
function TeacherPortfolioResets() {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<
    Array<{ className: string; email: string; name: string }>
  >([]);
  const [requests, setRequests] = useState<ResetRequestRow[]>([]);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/portfolios/reset-requests", {
        credentials: "same-origin",
      });
      const result = (await response.json()) as {
        message?: string;
        requests?: ResetRequestRow[];
        students?: Array<{ className: string; email: string; name: string }>;
      };

      if (response.ok) {
        setStudents(result.students ?? []);
        setRequests(result.requests ?? []);
      } else {
        setNotice(result.message ?? "Reset requests couldn't be loaded.");
      }
    } catch {
      setNotice("Reset requests couldn't be loaded.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    type Loaded = {
      requests?: ResetRequestRow[];
      students?: Array<{ className: string; email: string; name: string }>;
    };

    fetch("/api/portfolios/reset-requests", { credentials: "same-origin" })
      .then((response) => (response.ok ? (response.json() as Promise<Loaded>) : null))
      .then((result) => {
        if (!cancelled && result) {
          setStudents(result.students ?? []);
          setRequests(result.requests ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    const [studentEmail, className] = selected.split("|");

    if (!studentEmail || !reason.trim()) {
      setNotice("Choose a student and give a reason.");
      return;
    }

    setPending(true);
    setNotice("");

    try {
      const response = await fetch("/api/portfolios/reset-requests", {
        body: JSON.stringify({ className, reason, studentEmail }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setNotice(result.message ?? "The request couldn't be sent.");
        return;
      }

      setNotice("Request sent. An admin will approve or deny it, and you'll get an email.");
      setReason("");
      setSelected("");
      await load();
    } catch {
      setNotice("The request couldn't be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio resets</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask an admin to reset a student&apos;s portfolio to the class&apos;s
            starting cash. Its history is kept.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            setNotice("");
          }}
        >
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              Request portfolio reset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a portfolio reset</DialogTitle>
              <DialogDescription>
                An admin reviews every request. The student&apos;s current class
                portfolio goes back to the starting cash; past activity stays in
                its history.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-student">Student</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="reset-student" className="w-full">
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem
                        key={`${student.email}|${student.className}`}
                        value={`${student.email}|${student.className}`}
                      >
                        {student.name || student.email} · {student.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-reason">Reason</Label>
                <Textarea
                  id="reset-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. Student traded during the test window"
                />
              </div>
              {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                disabled={pending}
                onClick={() => void submit()}
                className="bg-[#28666e] text-white hover:bg-[#22565d]"
              >
                {pending ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {requests.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {requests.slice(0, 5).map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span>
                {request.studentName || request.studentEmail} · {request.className}
              </span>
              <span className="text-muted-foreground">
                {resetStatusLabels[request.status] ?? request.status}
                {request.decisionNote ? ` · ${request.decisionNote}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * Every portfolio on the student's profile, by school year: the multi-year
 * record students look back on.
 */
function PortfolioHistory({
  activePortfolioId,
  portfolios,
  onSelectPortfolio,
}: {
  activePortfolioId: string | null;
  portfolios: ServerPortfolio[];
  onSelectPortfolio: (portfolioId: string) => void;
}) {
  return (
    <section
      aria-labelledby="portfolio-history-heading"
      className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <h3 id="portfolio-history-heading" className="text-lg font-semibold">
        Your portfolios
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        One portfolio for each class, every school year. Past years are kept as
        read-only records you can review.
      </p>
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School year</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Gain / loss</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolios.map((item) => {
              const gain = item.valueCents - item.startingCashCents;
              const gainPercent = item.startingCashCents
                ? (gain / item.startingCashCents) * 100
                : 0;
              const trades = item.activity.filter(
                (entry) => entry.kind === "buy" || entry.kind === "sell"
              ).length;
              const isActive = item.id === activePortfolioId;

              return (
                <TableRow key={item.id}>
                  <TableCell>{item.schoolYear.replace("-", "–")}</TableCell>
                  <TableCell>
                    {item.kind === "practice" ? "Practice" : item.className}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.valueCents / 100)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${gain < 0 ? "text-[#c44536]" : "text-[#28666e]"}`}
                  >
                    {formatCurrency(gain / 100)} ({formatSignedPercent(gainPercent)})
                  </TableCell>
                  <TableCell className="text-right">{trades}</TableCell>
                  <TableCell>{item.readOnly ? "Read-only record" : "Current"}</TableCell>
                  <TableCell className="text-right">
                    {isActive ? (
                      <span className="text-sm text-muted-foreground">Viewing</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectPortfolio(item.id)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function UserSearchPanel({
  query,
  results,
  onSearchChange,
  onOpenProfile,
  onMessage,
}: {
  query: string;
  results: AdminUser[];
  onSearchChange: (query: string) => void;
  onOpenProfile: (userId: string) => void;
  onMessage: (userId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div>
          <h3 className="text-lg font-semibold">Find a user</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by alias, name, email, class, or role.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-search">Username search</Label>
          <Input
            id="profile-search"
            placeholder="Try ValueVoyager or MsRivera"
            value={query}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {query.trim() ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.length ? (
            results.map((user) => (
              <article
                key={user.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">@{user.alias}</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {user.role}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {user.className}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenProfile(user.id)}
                  >
                    Profile
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onMessage(user.id)}
                    className="bg-[#28666e] text-white hover:bg-[#22565d]"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Message
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No users found.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function UserProfilePage({
  user,
  portfolio,
  allocationTargets,
  activity,
  latestValue,
  marketQuotes,
  stockHoldings,
  totalGrowth,
  quests,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  portfolio: typeof basePortfolio;
  allocationTargets: typeof allocation;
  activity: PortfolioActivity[];
  latestValue: number;
  marketQuotes: MarketQuote[];
  stockHoldings: StockHolding[];
  totalGrowth: number;
  quests: TeacherQuest[];
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  if (user.role === "Teacher") {
    return (
      <TeacherProfilePage
        onBack={onBack}
        onMessage={onMessage}
        quests={quests}
        user={user}
      />
    );
  }

  if (user.role === "Admin") {
    return <AccountProfilePage onBack={onBack} onMessage={onMessage} user={user} />;
  }

  return (
    <section className="space-y-6">
      <ProfileHeader onBack={onBack} onMessage={onMessage} user={user} />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<WalletCards className="size-5" />}
          label="Portfolio value"
          value={`$${latestValue.toLocaleString()}`}
          detail={`${totalGrowth}% total growth`}
        />
        <SummaryCard
          icon={<Gauge className="size-5" />}
          label="Readiness"
          value="82%"
          detail="Public learning summary"
        />
        <SummaryCard
          icon={<BookOpenCheck className="size-5" />}
          label="Active quests"
          value="3"
          detail="Visible to classmates"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold">Portfolio overview</h3>
          <p className="text-sm text-muted-foreground">
            View-only simulated portfolio snapshot.
          </p>
          <div className="mt-4 h-[260px]">
            <PortfolioChart data={portfolio} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold">Current mix</h3>
          <div className="mt-3 h-[200px]">
            <AllocationDonut items={allocationTargets} />
          </div>
          <div className="grid gap-2">
            {allocationTargets.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <StocksInfoBox holdings={stockHoldings} quotes={marketQuotes} />
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold">Recent portfolio changes</h3>
        <div className="mt-4 grid gap-3">
          {activity.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium">{item.action}</span>
              <span className="text-sm text-muted-foreground">
                {item.vehicle} - {item.amount} - {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeacherProfilePage({
  user,
  quests,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  quests: TeacherQuest[];
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  return (
    <section className="space-y-6">
      <ProfileHeader onBack={onBack} onMessage={onMessage} user={user} />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<UsersRound className="size-5" />}
          label="Classes"
          value={`${user.classes.length}`}
          detail="Currently running"
        />
        <SummaryCard
          icon={<BookOpenCheck className="size-5" />}
          label="Authored quests"
          value={`${quests.length}`}
          detail="Classroom templates"
        />
        <SummaryCard
          icon={<ShieldCheck className="size-5" />}
          label="Portal rights"
          value={user.permissions.teacherPortal ? "Enabled" : "Off"}
          detail="Teacher workspace access"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold">Classes</h3>
          <div className="mt-4 grid gap-3">
            {user.classes.map((className) => (
              <div
                key={className}
                className="rounded-lg border border-border bg-background p-4"
              >
                <p className="font-medium">{className}</p>
                <p className="text-sm text-muted-foreground">
                  Active financial literacy section
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold">Authored quests</h3>
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="text-muted-foreground hover:bg-transparent">
                  <TableHead>Quest</TableHead>
                  <TableHead>Market mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quests.map((quest) => (
                  <TableRow key={quest.id}>
                    <TableCell className="font-medium">{quest.title}</TableCell>
                    <TableCell className="capitalize">{quest.marketMode}</TableCell>
                    <TableCell>{quest.status}</TableCell>
                    <TableCell>{quest.assigned}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

    </section>
  );
}

function AccountProfilePage({
  user,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  const enabledPermissions = Object.entries(user.permissions).filter(
    ([, enabled]) => enabled
  );

  return (
    <section className="space-y-6">
      <ProfileHeader onBack={onBack} onMessage={onMessage} user={user} />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<ShieldCheck className="size-5" />}
          label="Role"
          value={user.role}
          detail="Account permission scope"
        />
        <SummaryCard
          icon={<School className="size-5" />}
          label="Assignment"
          value={user.className}
          detail="District or class placement"
        />
        <SummaryCard
          icon={<KeyRound className="size-5" />}
          label="Account status"
          value={user.enabled ? "Enabled" : "Disabled"}
          detail="Managed by system admin"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserCog className="size-5 text-[#28666e]" />
            <h3 className="text-lg font-semibold">Account profile</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Metric label="Name" value={`${user.firstName} ${user.lastName}`} />
            <Metric label="Alias" value={`@${user.alias}`} />
            <Metric label="Email" value={user.email} />
            <Metric label="Primary scope" value={user.className} />
          </div>
          <p className="mt-4 rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            {user.profileNote}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#28666e]" />
            <h3 className="text-lg font-semibold">Permissions</h3>
          </div>
          <div className="space-y-3">
            {enabledPermissions.map(([permission]) => (
              <div
                key={permission}
                className="rounded-md border border-border bg-background p-3"
              >
                <p className="text-sm font-medium">
                  {permissionLabel(permission as keyof AdminUser["permissions"])}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {permissionDetail(permission as keyof AdminUser["permissions"])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function ProfileHeader({
  user,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <Button type="button" variant="ghost" onClick={onBack} className="mb-2 px-0">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold tracking-normal">
              @{user.alias}
            </h3>
            <Badge variant="outline" className="rounded-md bg-background">
              {user.role}
            </Badge>
          </div>
          <p className="mt-1 font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {user.profileNote}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => onMessage(user.id)}
          className="bg-[#28666e] text-white hover:bg-[#22565d]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Message
        </Button>
      </div>
    </div>
  );
}

function AdminDrilldown({
  activePage,
  adminUsers,
  credentials,
  credentialLabel,
  credentialProvider,
  credentialType,
  credentialPlacement,
  credentialScopeType,
  credentialScopeId,
  credentialUsername,
  credentialSecret,
  credentialNotice,
  filteredAdminUsers,
  schools,
  schoolName,
  schoolDistrict,
  schoolState,
  schoolClassCount,
  schoolStudentCount,
  marketIntegrations,
  classMarketConfigs,
  integrationProvider,
  integrationEndpoint,
  integrationTokenRequired,
  integrationToken,
  integrationPollingFrequency,
  integrationTargetClass,
  integrationSymbols,
  newUserFirstName,
  newUserLastName,
  newUserAlias,
  newUserEmail,
  newUserRole,
  newUserClassName,
  newUserTemporaryPassword,
  privacyPosture,
  selectedPrivacyPosture,
  privacyContact,
  selectedPermissionUser,
  supportCases,
  supportSummary,
  supportCategory,
  questTransferText,
  questTransferNotice,
  userClassFilter,
  userImportNotice,
  userRoleFilter,
  onBack,
  onAddSchool,
  onSaveCredential,
  onDeleteCredential,
  onCredentialLabelChange,
  onCredentialProviderChange,
  onCredentialTypeChange,
  onCredentialPlacementChange,
  onCredentialScopeTypeChange,
  onCredentialScopeIdChange,
  onCredentialUsernameChange,
  onCredentialSecretChange,
  onDeleteSchool,
  onSchoolNameChange,
  onSchoolDistrictChange,
  onSchoolStateChange,
  onSchoolClassCountChange,
  onSchoolStudentCountChange,
  onAddIntegration,
  onDeleteIntegration,
  onTestIntegration,
  onToggleIntegration,
  onUpdateClassMarketConfig,
  onIntegrationProviderChange,
  onIntegrationEndpointChange,
  onIntegrationTokenRequiredChange,
  onIntegrationTokenChange,
  onIntegrationPollingFrequencyChange,
  onIntegrationTargetClassChange,
  onIntegrationSymbolsChange,
  onImportUsers,
  onCreateIndividualUser,
  onNewUserFirstNameChange,
  onNewUserLastNameChange,
  onNewUserAliasChange,
  onNewUserEmailChange,
  onNewUserRoleChange,
  onNewUserClassNameChange,
  onNewUserTemporaryPasswordChange,
  onSavePrivacy,
  onSelectedPermissionUserChange,
  onToggleUserEnabled,
  onUpdateUserPermission,
  onUpdateUser,
  onUserClassFilterChange,
  onUserRoleFilterChange,
  onCreateSupportCase,
  onSupportSummaryChange,
  onSupportCategoryChange,
  onOpenUserProfile,
  onQuestExport,
  onQuestImport,
  onQuestTransferTextChange,
}: {
  activePage: AdminPage;
  adminUsers: AdminUser[];
  credentials: CredentialRecord[];
  credentialLabel: string;
  credentialProvider: string;
  credentialType: CredentialRecord["credentialType"];
  credentialPlacement: CredentialRecord["tokenPlacement"];
  credentialScopeType: CredentialRecord["scopeType"];
  credentialScopeId: string;
  credentialUsername: string;
  credentialSecret: string;
  credentialNotice: string;
  filteredAdminUsers: AdminUser[];
  schools: SchoolRecord[];
  schoolName: string;
  schoolDistrict: string;
  schoolState: string;
  schoolClassCount: string;
  schoolStudentCount: string;
  marketIntegrations: MarketIntegration[];
  classMarketConfigs: ClassMarketConfig[];
  integrationProvider: string;
  integrationEndpoint: string;
  integrationTokenRequired: boolean;
  integrationToken: string;
  integrationPollingFrequency: string;
  integrationTargetClass: string;
  integrationSymbols: string;
  newUserFirstName: string;
  newUserLastName: string;
  newUserAlias: string;
  newUserEmail: string;
  newUserRole: AdminUser["role"];
  newUserClassName: string;
  newUserTemporaryPassword: string;
  privacyPosture: string;
  selectedPrivacyPosture: (typeof privacyPostures)[number];
  privacyContact: string;
  selectedPermissionUser: AdminUser;
  supportCases: SupportCase[];
  supportSummary: string;
  supportCategory: string;
  questTransferText: string;
  questTransferNotice: string;
  userClassFilter: string;
  userImportNotice: string;
  userRoleFilter: string;
  onBack: () => void;
  onAddSchool: () => void;
  onSaveCredential: () => void;
  onDeleteCredential: (credentialId: string) => void;
  onCredentialLabelChange: (label: string) => void;
  onCredentialProviderChange: (provider: string) => void;
  onCredentialTypeChange: (type: CredentialRecord["credentialType"]) => void;
  onCredentialPlacementChange: (
    placement: CredentialRecord["tokenPlacement"]
  ) => void;
  onCredentialScopeTypeChange: (scopeType: CredentialRecord["scopeType"]) => void;
  onCredentialScopeIdChange: (scopeId: string) => void;
  onCredentialUsernameChange: (username: string) => void;
  onCredentialSecretChange: (secret: string) => void;
  onDeleteSchool: (schoolId: string) => void;
  onSchoolNameChange: (name: string) => void;
  onSchoolDistrictChange: (district: string) => void;
  onSchoolStateChange: (state: string) => void;
  onSchoolClassCountChange: (count: string) => void;
  onSchoolStudentCountChange: (count: string) => void;
  onAddIntegration: () => void;
  onDeleteIntegration: (integrationId: string) => void;
  onTestIntegration: (integrationId: string) => void;
  onToggleIntegration: (integrationId: string, enabled: boolean) => void;
  onUpdateClassMarketConfig: (
    className: string,
    updates: Partial<ClassMarketConfig>
  ) => Promise<boolean> | boolean;
  onIntegrationProviderChange: (provider: string) => void;
  onIntegrationEndpointChange: (endpoint: string) => void;
  onIntegrationTokenRequiredChange: (required: boolean) => void;
  onIntegrationTokenChange: (token: string) => void;
  onIntegrationPollingFrequencyChange: (frequency: string) => void;
  onIntegrationTargetClassChange: (className: string) => void;
  onIntegrationSymbolsChange: (symbols: string) => void;
  onImportUsers: (csvText: string) => void;
  onCreateIndividualUser: () => void;
  onNewUserFirstNameChange: (firstName: string) => void;
  onNewUserLastNameChange: (lastName: string) => void;
  onNewUserAliasChange: (alias: string) => void;
  onNewUserEmailChange: (email: string) => void;
  onNewUserRoleChange: (role: AdminUser["role"]) => void;
  onNewUserClassNameChange: (className: string) => void;
  onNewUserTemporaryPasswordChange: (password: string) => void;
  onSavePrivacy: (posture: string, contact: string) => Promise<void>;
  onSelectedPermissionUserChange: (userId: string) => void;
  onToggleUserEnabled: (userId: string, enabled: boolean) => void;
  onUpdateUserPermission: (
    userId: string,
    permission: keyof AdminUser["permissions"],
    enabled: boolean
  ) => void;
  onUpdateUser: (user: AdminUser) => Promise<boolean> | boolean;
  onUserClassFilterChange: (className: string) => void;
  onUserRoleFilterChange: (role: string) => void;
  onCreateSupportCase: () => void;
  onSupportSummaryChange: (summary: string) => void;
  onSupportCategoryChange: (category: string) => void;
  onOpenUserProfile: (userId: string) => void;
  onQuestExport: () => void;
  onQuestImport: () => void;
  onQuestTransferTextChange: (text: string) => void;
}) {
  const pageTitle =
    activePage === "schools"
      ? "Schools"
      : activePage === "integrations"
        ? "Integrations"
        : activePage === "market-engine"
          ? "Market simulator"
          : activePage === "credentials"
            ? "Credential vault"
            : activePage === "privacy"
              ? "Privacy posture"
              : activePage === "users"
                ? "Users"
                : activePage === "permissions"
                  ? "Permissions"
                  : activePage === "support"
                    ? "Support"
                    : activePage === "monitoring"
                      ? "Monitoring"
                      : activePage === "messaging"
                        ? "Messaging"
                        : "Portfolio corrections";

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button type="button" variant="ghost" onClick={onBack} className="mb-2 px-0">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Admin portal
          </Button>
          <h3 className="text-2xl font-semibold tracking-normal">{pageTitle}</h3>
        </div>
      </div>

      {activePage === "schools" ? (
        <SchoolsAdminPage
          onAddSchool={onAddSchool}
          onDeleteSchool={onDeleteSchool}
          onSchoolClassCountChange={onSchoolClassCountChange}
          onSchoolDistrictChange={onSchoolDistrictChange}
          onSchoolNameChange={onSchoolNameChange}
          onSchoolStateChange={onSchoolStateChange}
          onSchoolStudentCountChange={onSchoolStudentCountChange}
          schoolClassCount={schoolClassCount}
          schoolDistrict={schoolDistrict}
          schoolName={schoolName}
          schools={schools}
          schoolState={schoolState}
          schoolStudentCount={schoolStudentCount}
        />
      ) : null}

      {activePage === "integrations" ? (
        <IntegrationsAdminPage
          integrationEndpoint={integrationEndpoint}
          integrationProvider={integrationProvider}
          integrationPollingFrequency={integrationPollingFrequency}
          integrationSymbols={integrationSymbols}
          integrationTargetClass={integrationTargetClass}
          integrationToken={integrationToken}
          integrationTokenRequired={integrationTokenRequired}
          integrations={marketIntegrations}
          onAddIntegration={onAddIntegration}
          onDeleteIntegration={onDeleteIntegration}
          onIntegrationEndpointChange={onIntegrationEndpointChange}
          onIntegrationPollingFrequencyChange={onIntegrationPollingFrequencyChange}
          onIntegrationProviderChange={onIntegrationProviderChange}
          onIntegrationSymbolsChange={onIntegrationSymbolsChange}
          onIntegrationTargetClassChange={onIntegrationTargetClassChange}
          onIntegrationTokenChange={onIntegrationTokenChange}
          onIntegrationTokenRequiredChange={onIntegrationTokenRequiredChange}
          onTestIntegration={onTestIntegration}
          onToggleIntegration={onToggleIntegration}
        />
      ) : null}

      {activePage === "market-engine" ? (
        <MarketEngineAdminPage
          classMarketConfigs={classMarketConfigs}
          integrations={marketIntegrations}
          onUpdateClassMarketConfig={onUpdateClassMarketConfig}
        />
      ) : null}

      {activePage === "credentials" ? (
        <CredentialsAdminPage
          credentialLabel={credentialLabel}
          credentialNotice={credentialNotice}
          credentialPlacement={credentialPlacement}
          credentialProvider={credentialProvider}
          credentialScopeId={credentialScopeId}
          credentialScopeType={credentialScopeType}
          credentialSecret={credentialSecret}
          credentialType={credentialType}
          credentialUsername={credentialUsername}
          credentials={credentials}
          onCredentialLabelChange={onCredentialLabelChange}
          onCredentialPlacementChange={onCredentialPlacementChange}
          onCredentialProviderChange={onCredentialProviderChange}
          onCredentialScopeIdChange={onCredentialScopeIdChange}
          onCredentialScopeTypeChange={onCredentialScopeTypeChange}
          onCredentialSecretChange={onCredentialSecretChange}
          onCredentialTypeChange={onCredentialTypeChange}
          onCredentialUsernameChange={onCredentialUsernameChange}
          onDeleteCredential={onDeleteCredential}
          onSaveCredential={onSaveCredential}
        />
      ) : null}

      {activePage === "privacy" ? (
        <PrivacyPostureAdminPage
          onSavePrivacy={onSavePrivacy}
          privacyContact={privacyContact}
          privacyPosture={privacyPosture}
          selectedPrivacyPosture={selectedPrivacyPosture}
        />
      ) : null}

      {activePage === "users" ? (
        <UsersAdminPage
          filteredUsers={filteredAdminUsers}
          importNotice={userImportNotice}
          newUserAlias={newUserAlias}
          newUserClassName={newUserClassName}
          newUserEmail={newUserEmail}
          newUserFirstName={newUserFirstName}
          newUserLastName={newUserLastName}
          newUserRole={newUserRole}
          newUserTemporaryPassword={newUserTemporaryPassword}
          onClassFilterChange={onUserClassFilterChange}
          onCreateIndividualUser={onCreateIndividualUser}
          onImportUsers={onImportUsers}
          onNewUserAliasChange={onNewUserAliasChange}
          onNewUserClassNameChange={onNewUserClassNameChange}
          onNewUserEmailChange={onNewUserEmailChange}
          onNewUserFirstNameChange={onNewUserFirstNameChange}
          onNewUserLastNameChange={onNewUserLastNameChange}
          onNewUserRoleChange={onNewUserRoleChange}
          onNewUserTemporaryPasswordChange={onNewUserTemporaryPasswordChange}
          onOpenProfile={onOpenUserProfile}
          onRoleFilterChange={onUserRoleFilterChange}
          onToggleUserEnabled={onToggleUserEnabled}
          onUpdateUser={onUpdateUser}
          selectedClass={userClassFilter}
          selectedRole={userRoleFilter}
        />
      ) : null}

      {activePage === "permissions" ? (
        <PermissionsAdminPage
          onSelectedUserChange={onSelectedPermissionUserChange}
          onUpdateUserPermission={onUpdateUserPermission}
          selectedUser={selectedPermissionUser}
          users={adminUsers}
        />
      ) : null}

      {activePage === "support" ? (
        <SupportAdminPage
          cases={supportCases}
          category={supportCategory}
          onCategoryChange={onSupportCategoryChange}
          onCreateCase={onCreateSupportCase}
          onSummaryChange={onSupportSummaryChange}
          summary={supportSummary}
        />
      ) : null}

      {activePage === "portfolio-corrections" ? (
        <PortfolioCorrectionsAdminPage />
      ) : null}

      {activePage === "monitoring" ? <MonitoringAdminPage /> : null}

      {activePage === "messaging" ? <AdminMessagingPage /> : null}

      {activePage === "permissions" ? (
        <LearningQuestTransferPanel
          audience="Admin"
          notice={questTransferNotice}
          onExport={onQuestExport}
          onImport={onQuestImport}
          onTextChange={onQuestTransferTextChange}
          transferText={questTransferText}
        />
      ) : null}
    </section>
  );
}

function SchoolsAdminPage({
  schools,
  schoolName,
  schoolDistrict,
  schoolState,
  schoolClassCount,
  schoolStudentCount,
  onSchoolNameChange,
  onSchoolDistrictChange,
  onSchoolStateChange,
  onSchoolClassCountChange,
  onSchoolStudentCountChange,
  onAddSchool,
  onDeleteSchool,
}: {
  schools: SchoolRecord[];
  schoolName: string;
  schoolDistrict: string;
  schoolState: string;
  schoolClassCount: string;
  schoolStudentCount: string;
  onSchoolNameChange: (name: string) => void;
  onSchoolDistrictChange: (district: string) => void;
  onSchoolStateChange: (state: string) => void;
  onSchoolClassCountChange: (count: string) => void;
  onSchoolStudentCountChange: (count: string) => void;
  onAddSchool: () => void;
  onDeleteSchool: (schoolId: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_84px_110px_110px_auto]">
          <div className="space-y-2">
            <Label htmlFor="school-name">School name</Label>
            <Input
              id="school-name"
              placeholder="Add a school"
              value={schoolName}
              onChange={(event) => onSchoolNameChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-district">District</Label>
            <Input
              id="school-district"
              placeholder="School district"
              value={schoolDistrict}
              onChange={(event) => onSchoolDistrictChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-state">State</Label>
            <Input
              id="school-state"
              maxLength={2}
              value={schoolState}
              onChange={(event) =>
                onSchoolStateChange(event.target.value.toUpperCase())
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-class-count">Classes</Label>
            <Input
              id="school-class-count"
              min={0}
              type="number"
              value={schoolClassCount}
              onChange={(event) => onSchoolClassCountChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-student-count">Students</Label>
            <Input
              id="school-student-count"
              min={0}
              type="number"
              value={schoolStudentCount}
              onChange={(event) => onSchoolStudentCountChange(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={onAddSchool}
              className="w-full bg-[#28666e] text-white hover:bg-[#22565d] md:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add school
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>School</TableHead>
              <TableHead>District</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{school.district}</TableCell>
                <TableCell>{school.state}</TableCell>
                <TableCell>{school.classes}</TableCell>
                <TableCell>{school.students}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {school.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteSchool(school.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function IntegrationsAdminPage({
  integrations,
  integrationProvider,
  integrationEndpoint,
  integrationTokenRequired,
  integrationToken,
  integrationPollingFrequency,
  integrationTargetClass,
  integrationSymbols,
  onIntegrationProviderChange,
  onIntegrationEndpointChange,
  onIntegrationTokenRequiredChange,
  onIntegrationTokenChange,
  onIntegrationPollingFrequencyChange,
  onIntegrationTargetClassChange,
  onIntegrationSymbolsChange,
  onAddIntegration,
  onDeleteIntegration,
  onTestIntegration,
  onToggleIntegration,
}: {
  integrations: MarketIntegration[];
  integrationProvider: string;
  integrationEndpoint: string;
  integrationTokenRequired: boolean;
  integrationToken: string;
  integrationPollingFrequency: string;
  integrationTargetClass: string;
  integrationSymbols: string;
  onIntegrationProviderChange: (provider: string) => void;
  onIntegrationEndpointChange: (endpoint: string) => void;
  onIntegrationTokenRequiredChange: (required: boolean) => void;
  onIntegrationTokenChange: (token: string) => void;
  onIntegrationPollingFrequencyChange: (frequency: string) => void;
  onIntegrationTargetClassChange: (className: string) => void;
  onIntegrationSymbolsChange: (symbols: string) => void;
  onAddIntegration: () => void;
  onDeleteIntegration: (integrationId: string) => void;
  onTestIntegration: (integrationId: string) => void;
  onToggleIntegration: (integrationId: string, enabled: boolean) => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider-name">API provider</Label>
            <Input
              id="provider-name"
              placeholder="Example: Polygon, IEX Cloud, Alpaca"
              value={integrationProvider}
              onChange={(event) => onIntegrationProviderChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-endpoint">API endpoint</Label>
            <Input
              id="provider-endpoint"
              placeholder="https://provider.example/v1/quotes"
              value={integrationEndpoint}
              onChange={(event) => onIntegrationEndpointChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="polling-frequency">Polling frequency</Label>
            <Select
              value={integrationPollingFrequency}
              onValueChange={onIntegrationPollingFrequencyChange}
            >
              <SelectTrigger id="polling-frequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="5 minutes">Every 5 minutes</SelectItem>
                <SelectItem value="15 minutes">Every 15 minutes</SelectItem>
                <SelectItem value="30 minutes">Every 30 minutes</SelectItem>
                <SelectItem value="1 hour">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-class">Class receiving data</Label>
            <Select
              value={integrationTargetClass}
              onValueChange={onIntegrationTargetClassChange}
            >
              <SelectTrigger id="target-class" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed-symbols">Allowed symbols optional</Label>
            <Input
              id="allowed-symbols"
              placeholder="Leave blank to import up to 200 symbols"
              value={integrationSymbols}
              onChange={(event) => onIntegrationSymbolsChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Blank allows the backend GET import to accept up to 200 symbols.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-token">Token</Label>
            <Input
              id="api-token"
              placeholder="Only required for protected APIs"
              type="password"
              value={integrationToken}
              onChange={(event) => onIntegrationTokenChange(event.target.value)}
            />
            <Label className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
              <Checkbox
                checked={integrationTokenRequired}
                onCheckedChange={(checked) =>
                  onIntegrationTokenRequiredChange(checked === true)
                }
              />
              Token required
            </Label>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            API tokens are shown as setup fields in the MVP; production storage
            should move them to server-managed secrets.
          </p>
          <Button
            type="button"
            onClick={onAddIntegration}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <PlugZap className="size-4" aria-hidden="true" />
            Add API
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Class</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Polling</TableHead>
              <TableHead>Symbols</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell className="font-medium">
                  {integration.targetClass}
                </TableCell>
                <TableCell>{integration.provider}</TableCell>
                <TableCell className="max-w-[260px] truncate">
                  {integration.endpoint}
                </TableCell>
                <TableCell>{integration.pollingFrequency}</TableCell>
                <TableCell>
                  {integration.symbols}
                  <span className="block text-xs text-muted-foreground">
                    {integration.importedSymbols} imported
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {integration.status}
                  </Badge>
                  <span className="block text-xs text-muted-foreground">
                    {integration.lastFetchStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onTestIntegration(integration.id)}
                    >
                      <PlugZap className="size-4" aria-hidden="true" />
                      GET
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteIntegration(integration.id)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3">
        {integrations.map((integration) => (
          <article
            key={integration.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold">{integration.provider}</h4>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {integration.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Feeds {integration.targetClass} from {integration.endpoint}.
                  Symbols: {integration.symbols}. Polling:{" "}
                  {integration.pollingFrequency}.
                </p>
              </div>
              <Label className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                Enabled
                <Switch
                  checked={integration.enabled}
                  onCheckedChange={(checked) =>
                    onToggleIntegration(integration.id, checked)
                  }
                />
              </Label>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MarketEngineAdminPage({
  classMarketConfigs,
  integrations,
  onUpdateClassMarketConfig,
}: {
  classMarketConfigs: ClassMarketConfig[];
  integrations: MarketIntegration[];
  onUpdateClassMarketConfig: (
    className: string,
    updates: Partial<ClassMarketConfig>
  ) => Promise<boolean> | boolean;
}) {
  const [draftConfigOverrides, setDraftConfigOverrides] = useState<
    Record<string, ClassMarketConfig>
  >({});
  const activeIntegrations = integrations.filter((integration) => integration.enabled);
  const connectedClasses = new Set(
    activeIntegrations.map((integration) => integration.targetClass)
  );
  const persistedConfigsByClass = new Map(
    classMarketConfigs.map((config) => [config.className, config])
  );
  const displayedConfigs = classMarketConfigs.map(
    (config) => draftConfigOverrides[config.className] ?? config
  );

  function updateDraftConfig(
    className: string,
    updates: Partial<ClassMarketConfig>
  ) {
    const persisted = persistedConfigsByClass.get(className);

    if (!persisted) {
      return;
    }

    setDraftConfigOverrides((currentOverrides) => ({
      ...currentOverrides,
      [className]: {
        ...(currentOverrides[className] ?? persisted),
        ...updates,
      },
    }));
  }

  function hasDraftChanges(config: ClassMarketConfig) {
    const persisted = persistedConfigsByClass.get(config.className);

    return persisted ? JSON.stringify(persisted) !== JSON.stringify(config) : true;
  }

  async function saveDraftConfig(config: ClassMarketConfig) {
    const saved = await onUpdateClassMarketConfig(config.className, config);

    if (saved) {
      setDraftConfigOverrides((currentOverrides) => {
        const nextOverrides = { ...currentOverrides };
        delete nextOverrides[config.className];

        return nextOverrides;
      });
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          icon={<ChartNoAxesCombined className="size-5" />}
          label="Central simulator"
          value="Online"
          detail="One simulation service feeds class contexts"
        />
        <SummaryCard
          icon={<PlugZap className="size-5" />}
          label="Provider feeds"
          value={`${activeIntegrations.length} active`}
          detail="Market APIs normalize into shared cache"
        />
        <SummaryCard
          icon={<School className="size-5" />}
          label="Class contexts"
          value={`${classMarketConfigs.length} configured`}
          detail="Teachers administer their own class market"
        />
      </section>

      <section className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ed] text-[#28666e]">
            <LineChart className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="font-semibold">Market engine flow</h4>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Provider adapters pull market data into the central cache. The
              simulator applies class rules, then every student portfolio in
              that class reads the same classroom-safe market state.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            "Provider adapters",
            "Central quote cache",
            "Class simulation rules",
            "Student portfolios",
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-border bg-card p-3 text-sm"
            >
              <span className="mb-2 grid size-6 place-items-center rounded-md bg-[#e8f0ed] text-xs font-semibold text-[#24493f]">
                {index + 1}
              </span>
              <p className="font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[1040px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Class market</TableHead>
              <TableHead>Feed</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Scenario</TableHead>
              <TableHead>Volatility</TableHead>
              <TableHead>Starting cash</TableHead>
              <TableHead>Grade level</TableHead>
              <TableHead>Stock info level</TableHead>
              <TableHead>Teacher controls</TableHead>
              <TableHead>Symbols</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedConfigs.map((config) => (
              <TableRow key={config.className}>
                <TableCell className="font-medium">{config.className}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      connectedClasses.has(config.className)
                        ? "rounded-md border-[#28666e]/30 bg-[#e8f0ed] text-[#24493f]"
                        : "rounded-md bg-card"
                    }
                  >
                    {connectedClasses.has(config.className)
                      ? "Provider-backed"
                      : "Fallback simulation"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={config.simulationMode}
                    onValueChange={(value) =>
                      updateDraftConfig(config.className, {
                        simulationMode:
                          value as ClassMarketConfig["simulationMode"],
                      })
                    }
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared_provider">Shared provider</SelectItem>
                      <SelectItem value="teacher_scenario">Teacher scenario</SelectItem>
                      <SelectItem value="frozen">Frozen market</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={config.eventScenario}
                    onValueChange={(value) =>
                      updateDraftConfig(config.className, {
                        eventScenario:
                          value as ClassMarketConfig["eventScenario"],
                      })
                    }
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">Baseline</SelectItem>
                      <SelectItem value="market_drop">Market drop</SelectItem>
                      <SelectItem value="growth_rally">Growth rally</SelectItem>
                      <SelectItem value="rate_shock">Rate shock</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    min={0}
                    max={3}
                    step={0.05}
                    type="number"
                    value={config.volatilityMultiplier}
                    onChange={(event) =>
                      updateDraftConfig(config.className, {
                        volatilityMultiplier: Number(event.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-28"
                    min={0}
                    type="number"
                    value={Math.round(config.startingCashCents / 100)}
                    onChange={(event) =>
                      updateDraftConfig(config.className, {
                        startingCashCents: Number(event.target.value) * 100,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <select
                    aria-label={`Grade level for ${config.className}`}
                    className="h-9 w-28 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={config.gradeLevel == null ? "" : String(config.gradeLevel)}
                    onChange={(event) =>
                      updateDraftConfig(config.className, {
                        gradeLevel: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">From name</option>
                    {Array.from({ length: 7 }, (_, index) => index + 6).map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                        {grade >= 10 ? " (fractional)" : ""}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    aria-label={`Stock info level for ${config.className}`}
                    className="h-9 w-32 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={config.stockInfoLevel ?? ""}
                    onChange={(event) =>
                      updateDraftConfig(config.className, {
                        stockInfoLevel: (event.target.value || null) as "basic" | "full" | null,
                      })
                    }
                  >
                    <option value="">Grade default</option>
                    <option value="basic">Basic</option>
                    <option value="full">Full</option>
                  </select>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={config.teacherControlsEnabled}
                    onCheckedChange={(checked) =>
                      updateDraftConfig(config.className, {
                        teacherControlsEnabled: checked,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-56"
                    value={config.allowedSymbols.join(", ")}
                    onChange={(event) =>
                      updateDraftConfig(config.className, {
                        allowedSymbols: event.target.value
                          .split(",")
                          .map((symbol) => symbol.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Assets: {config.allowedAssetTypes.join(", ")}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!hasDraftChanges(config)}
                    onClick={() => void saveDraftConfig(config)}
                    className="bg-[#28666e] text-white hover:bg-[#22565d]"
                  >
                    <Save className="size-4" aria-hidden="true" />
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function CredentialsAdminPage({
  credentials,
  credentialLabel,
  credentialProvider,
  credentialType,
  credentialPlacement,
  credentialScopeType,
  credentialScopeId,
  credentialUsername,
  credentialSecret,
  credentialNotice,
  onCredentialLabelChange,
  onCredentialProviderChange,
  onCredentialTypeChange,
  onCredentialPlacementChange,
  onCredentialScopeTypeChange,
  onCredentialScopeIdChange,
  onCredentialUsernameChange,
  onCredentialSecretChange,
  onSaveCredential,
  onDeleteCredential,
}: {
  credentials: CredentialRecord[];
  credentialLabel: string;
  credentialProvider: string;
  credentialType: CredentialRecord["credentialType"];
  credentialPlacement: CredentialRecord["tokenPlacement"];
  credentialScopeType: CredentialRecord["scopeType"];
  credentialScopeId: string;
  credentialUsername: string;
  credentialSecret: string;
  credentialNotice: string;
  onCredentialLabelChange: (label: string) => void;
  onCredentialProviderChange: (provider: string) => void;
  onCredentialTypeChange: (type: CredentialRecord["credentialType"]) => void;
  onCredentialPlacementChange: (
    placement: CredentialRecord["tokenPlacement"]
  ) => void;
  onCredentialScopeTypeChange: (scopeType: CredentialRecord["scopeType"]) => void;
  onCredentialScopeIdChange: (scopeId: string) => void;
  onCredentialUsernameChange: (username: string) => void;
  onCredentialSecretChange: (secret: string) => void;
  onSaveCredential: () => void;
  onDeleteCredential: (credentialId: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credential-label">Credential label</Label>
            <Input
              id="credential-label"
              placeholder="Example: District market feed"
              value={credentialLabel}
              onChange={(event) => onCredentialLabelChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-provider">Provider</Label>
            <Input
              id="credential-provider"
              placeholder="Example: Polygon, Google, SendGrid"
              value={credentialProvider}
              onChange={(event) => onCredentialProviderChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Credential type</Label>
            <Select value={credentialType} onValueChange={onCredentialTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_token">API token</SelectItem>
                <SelectItem value="username_password">Username/password</SelectItem>
                <SelectItem value="oauth_client_secret">
                  OAuth client secret
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Token placement</Label>
            <Select
              value={credentialPlacement}
              onValueChange={onCredentialPlacementChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bearer">Bearer header</SelectItem>
                <SelectItem value="x-api-key">X-API-Key header</SelectItem>
                <SelectItem value="query">Query token</SelectItem>
                <SelectItem value="basic">Basic auth</SelectItem>
                <SelectItem value="client-secret">Client secret</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select
              value={credentialScopeType}
              onValueChange={onCredentialScopeTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="class">Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-scope-id">Scope ID</Label>
            <Input
              id="credential-scope-id"
              placeholder="District, school, or class identifier"
              value={credentialScopeId}
              onChange={(event) => onCredentialScopeIdChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-username">Username optional</Label>
            <Input
              id="credential-username"
              placeholder="Stored as a masked hint"
              value={credentialUsername}
              onChange={(event) => onCredentialUsernameChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-secret">Secret value</Label>
            <Input
              id="credential-secret"
              placeholder="Token, password, or client secret"
              type="password"
              value={credentialSecret}
              onChange={(event) => onCredentialSecretChange(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Secret values are written to backend vault storage and never returned
            by the app.
          </p>
          <Button
            type="button"
            onClick={onSaveCredential}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <KeyRound className="size-4" aria-hidden="true" />
            Store credential
          </Button>
        </div>
        {credentialNotice ? (
          <p className="mt-3 text-sm text-muted-foreground">{credentialNotice}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[940px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Credential</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Rotation</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.map((credential) => (
              <TableRow key={credential.id}>
                <TableCell>
                  <span className="font-medium">{credential.label}</span>
                  {credential.usernameHint ? (
                    <span className="block text-xs text-muted-foreground">
                      user {credential.usernameHint}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>{credential.providerName}</TableCell>
                <TableCell>{credentialTypeLabel(credential.credentialType)}</TableCell>
                <TableCell>{credentialPlacementLabel(credential.tokenPlacement)}</TableCell>
                <TableCell>
                  {credential.scopeType}: {credential.scopeId}
                </TableCell>
                <TableCell>{credential.lastRotatedAt}</TableCell>
                <TableCell>{credential.lastUsedAt}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {credential.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteCredential(credential.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PrivacyPostureAdminPage({
  privacyPosture,
  selectedPrivacyPosture,
  privacyContact,
  onSavePrivacy,
}: {
  privacyPosture: string;
  selectedPrivacyPosture: (typeof privacyPostures)[number];
  privacyContact: string;
  onSavePrivacy: (posture: string, contact: string) => Promise<void>;
}) {
  // Edits are a draft until Save is clicked, like the Market Simulator page.
  const [draftPosture, setDraftPosture] = useState<string | null>(null);
  const [draftContact, setDraftContact] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const posture = draftPosture ?? privacyPosture;
  const contact = draftContact ?? privacyContact;
  const shownPosture =
    privacyPostures.find((option) => option.value === posture) ??
    selectedPrivacyPosture;
  const hasChanges = posture !== privacyPosture || contact !== privacyContact;

  async function save() {
    setSaving(true);
    setNotice("");

    try {
      await onSavePrivacy(posture, contact);
      setDraftPosture(null);
      setDraftContact(null);
      setNotice("Saved. The change is recorded in the audit log.");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="space-y-2">
          <Label>Required privacy posture</Label>
          <Select
            value={posture}
            onValueChange={(value) => {
              setDraftPosture(value);
              setNotice("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {privacyPostures.map((posture) => (
                <SelectItem key={posture.value} value={posture.value}>
                  {posture.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h4 className="font-semibold">{shownPosture.label}</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {shownPosture.description}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="privacy-contact">Privacy contact</Label>
          <Input
            id="privacy-contact"
            type="email"
            value={contact}
            onChange={(event) => {
              setDraftContact(event.target.value);
              setNotice("");
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => void save()}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          {hasChanges && !saving ? (
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
          ) : null}
          {notice ? (
            <span className="text-sm text-muted-foreground">{notice}</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#28666e]" />
          <h4 className="font-semibold">Controls applied</h4>
        </div>
        <div className="mt-4 space-y-3">
          <AdminPolicy
            detail="Student portfolios remain simulated and cannot connect to banking or brokerage accounts."
            enabled
            title="Simulated money"
          />
          <AdminPolicy
            detail="Messages are text-only, profanity filtered, and stored with moderation status."
            enabled
            title="Messaging moderation"
          />
          <AdminPolicy
            detail="Exports, corrections, and role changes require admin audit events."
            enabled={posture !== "standard"}
            title="Enhanced audit"
          />
        </div>
      </div>
    </div>
  );
}

function MonitoringAdminPage() {
  const [activeMonitoringPage, setActiveMonitoringPage] = useState<
    "overview" | "errors" | "slow-calls" | "integration-health"
  >("overview");
  const [selectedErrorId, setSelectedErrorId] = useState(monitoringEvents[0].id);
  const [callTypeFilter, setCallTypeFilter] = useState("all");
  const selectedError =
    monitoringEvents.find((event) => event.id === selectedErrorId) ??
    monitoringEvents[0];
  const openErrorCount = monitoringEvents.filter(
    (event) => event.severity === "Error"
  ).length;
  const slowCallCount = performanceMetrics.filter(
    (metric) => metric.status === "Slow" || metric.durationMs > 750
  ).length;
  const healthyIntegrations = integrationHealthMetrics.filter(
    (metric) => metric.status === "Healthy"
  ).length;
  const filteredPerformanceMetrics =
    callTypeFilter === "all"
      ? performanceMetrics
      : performanceMetrics.filter((metric) => metric.callType === callTypeFilter);

  if (activeMonitoringPage === "errors") {
    return (
      <MonitoringErrorsPage
        events={monitoringEvents}
        onBack={() => setActiveMonitoringPage("overview")}
        onSelectError={setSelectedErrorId}
        selectedError={selectedError}
      />
    );
  }

  if (activeMonitoringPage === "slow-calls") {
    return (
      <SlowCallsMonitoringPage
        callTypeFilter={callTypeFilter}
        metrics={filteredPerformanceMetrics}
        onBack={() => setActiveMonitoringPage("overview")}
        onCallTypeFilterChange={setCallTypeFilter}
      />
    );
  }

  if (activeMonitoringPage === "integration-health") {
    return (
      <IntegrationHealthMonitoringPage
        integrations={integrationHealthMetrics}
        onBack={() => setActiveMonitoringPage("overview")}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<TriangleAlert className="size-5" />}
          label="Open errors"
          value={`${openErrorCount}`}
          detail="Critical or failed events"
          onClick={() => setActiveMonitoringPage("errors")}
        />
        <SummaryCard
          icon={<Gauge className="size-5" />}
          label="Slow calls"
          value={`${slowCallCount}`}
          detail="Over 750 ms"
          onClick={() => setActiveMonitoringPage("slow-calls")}
        />
        <SummaryCard
          icon={<PlugZap className="size-5" />}
          label="Integration health"
          value={`${healthyIntegrations} / ${integrationHealthMetrics.length}`}
          detail="Providers passing"
          onClick={() => setActiveMonitoringPage("integration-health")}
        />
        <SummaryCard
          icon={<LineChart className="size-5" />}
          label="OTEL hooks"
          value="Ready"
          detail="Tracer/exporter placeholder"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Recent errors</h3>
              <p className="text-sm text-muted-foreground">
                Frontend, backend, messaging, and integration events.
              </p>
            </div>
            <Badge variant="outline" className="rounded-md bg-background">
              /api/observability/errors
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="text-muted-foreground hover:bg-transparent">
                  <TableHead>Severity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoringEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          event.severity === "Error"
                            ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                            : "rounded-md bg-card"
                        }
                      >
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>{event.message}</TableCell>
                    <TableCell>{event.route}</TableCell>
                    <TableCell>{event.age}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold">OTEL future state</h3>
          <div className="mt-4 space-y-3">
            <AdminPolicy
              detail="Trace IDs are generated for backend API and frontend browser events."
              enabled
              title="Trace context"
            />
            <AdminPolicy
              detail="Span helper wraps operations and returns duration metadata."
              enabled
              title="Span hooks"
            />
            <AdminPolicy
              detail="Exporter endpoint is intentionally deferred until a vendor is selected."
              enabled={false}
              title="External exporter"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Performance events</h3>
            <p className="text-sm text-muted-foreground">
              Request timing, route status, and integration latency.
            </p>
          </div>
          <Badge variant="outline" className="rounded-md bg-background">
            /api/observability/performance
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="text-muted-foreground hover:bg-transparent">
                <TableHead>Route</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trace</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceMetrics.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="font-medium">{metric.route}</TableCell>
                  <TableCell>{metric.operation}</TableCell>
                  <TableCell>{metric.duration}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md bg-card">
                      {metric.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{metric.traceId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function MonitoringErrorsPage({
  events,
  selectedError,
  onBack,
  onSelectError,
}: {
  events: MonitoringEvent[];
  selectedError: MonitoringEvent;
  onBack: () => void;
  onSelectError: (errorId: string) => void;
}) {
  return (
    <section className="space-y-6">
      <MonitoringBackHeader
        description="Examine captured error messages, logs, affected route, and user context."
        onBack={onBack}
        title="Open Errors"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <h4 className="mb-4 font-semibold">Error queue</h4>
          <div className="space-y-3">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectError(event.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedError.id === event.id
                    ? "border-[#28666e] bg-[#e8f0ed]"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{event.message}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.source} on {event.route}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-md bg-card">
                    {event.severity}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold">{selectedError.id}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedError.age} from {selectedError.source}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                selectedError.severity === "Error"
                  ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                  : "rounded-md bg-background"
              }
            >
              {selectedError.severity}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Metric label="Route" value={selectedError.route} />
            <Metric label="User" value={selectedError.user.name} />
            <Metric label="Email" value={selectedError.user.email} />
            <Metric label="Role" value={selectedError.user.role} />
            <Metric label="Class" value={selectedError.user.className} />
            <Metric label="Source" value={selectedError.source} />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-background p-4">
            <h5 className="font-semibold">Message</h5>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {selectedError.message}
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-[#1f363d] p-4 text-white">
            <h5 className="font-semibold">Logs</h5>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-black/20 p-3 text-sm leading-6 text-white/85">
              {formatLogEntries(selectedError.logs)}
            </pre>
          </div>
        </div>
      </section>
    </section>
  );
}

function SlowCallsMonitoringPage({
  metrics,
  callTypeFilter,
  onBack,
  onCallTypeFilterChange,
}: {
  metrics: PerformanceMetric[];
  callTypeFilter: string;
  onBack: () => void;
  onCallTypeFilterChange: (callType: string) => void;
}) {
  const chartSeries = metrics.length
    ? metrics
    : [{ samples: [0, 0, 0, 0, 0, 0, 0] } as PerformanceMetric];

  return (
    <section className="space-y-6">
      <MonitoringBackHeader
        description="Review slow and normal request timings by call type."
        onBack={onBack}
        title="Slow Calls"
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold">Call latency</h4>
            <p className="text-sm text-muted-foreground">
              Recent timing samples for the selected call type.
            </p>
          </div>
          <div className="w-full space-y-2 sm:w-56">
            <Label>Call type</Label>
            <Select value={callTypeFilter} onValueChange={onCallTypeFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All call types</SelectItem>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="Page">Page</SelectItem>
                <SelectItem value="Integration">Integration</SelectItem>
                <SelectItem value="Messaging">Messaging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <LineGraph
          ariaLabel="Slow call latency line graph"
          series={chartSeries.map((metric) => ({
            label: metric.operation,
            points: metric.samples,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Call type</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell>{metric.callType}</TableCell>
                <TableCell className="font-medium">{metric.route}</TableCell>
                <TableCell>{metric.operation}</TableCell>
                <TableCell>{metric.duration}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      metric.status === "Slow"
                        ? "rounded-md border-[#c44536]/30 bg-[#fff0ed] text-[#8a3025]"
                        : "rounded-md bg-card"
                    }
                  >
                    {metric.status}
                  </Badge>
                </TableCell>
                <TableCell>{metric.traceId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function IntegrationHealthMonitoringPage({
  integrations,
  onBack,
}: {
  integrations: IntegrationHealthMetric[];
  onBack: () => void;
}) {
  return (
    <section className="space-y-6">
      <MonitoringBackHeader
        description="Track integration round trip time, current errors, and downloadable logs."
        onBack={onBack}
        title="Integration Health"
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h4 className="text-lg font-semibold">Average RTT</h4>
          <p className="text-sm text-muted-foreground">
            Round trip time in milliseconds across configured market feeds.
          </p>
        </div>
        <LineGraph
          ariaLabel="Integration average round trip time line graph"
          series={integrations.map((integration) => ({
            label: integration.connectionName,
            points: integration.samples,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Connection</TableHead>
              <TableHead>RTT ms</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell className="font-medium">
                  {integration.connectionName}
                </TableCell>
                <TableCell>{integration.rttMs}</TableCell>
                <TableCell>{integration.errors}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {integration.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadIntegrationLogsZip(integration)}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download ZIP
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function MonitoringBackHeader({
  description,
  onBack,
  title,
}: {
  description: string;
  onBack: () => void;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <Button type="button" variant="ghost" onClick={onBack} className="mb-2 px-0">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Monitoring
      </Button>
      <h3 className="text-2xl font-semibold tracking-normal">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UsersAdminPage({
  filteredUsers,
  selectedClass,
  selectedRole,
  importNotice,
  newUserFirstName,
  newUserLastName,
  newUserAlias,
  newUserEmail,
  newUserRole,
  newUserClassName,
  newUserTemporaryPassword,
  onClassFilterChange,
  onCreateIndividualUser,
  onImportUsers,
  onNewUserFirstNameChange,
  onNewUserLastNameChange,
  onNewUserAliasChange,
  onNewUserEmailChange,
  onNewUserRoleChange,
  onNewUserClassNameChange,
  onNewUserTemporaryPasswordChange,
  onOpenProfile,
  onRoleFilterChange,
  onToggleUserEnabled,
  onUpdateUser,
}: {
  filteredUsers: AdminUser[];
  selectedClass: string;
  selectedRole: string;
  importNotice: string;
  newUserFirstName: string;
  newUserLastName: string;
  newUserAlias: string;
  newUserEmail: string;
  newUserRole: AdminUser["role"];
  newUserClassName: string;
  newUserTemporaryPassword: string;
  onClassFilterChange: (className: string) => void;
  onCreateIndividualUser: () => void;
  onImportUsers: (csvText: string) => void;
  onNewUserFirstNameChange: (firstName: string) => void;
  onNewUserLastNameChange: (lastName: string) => void;
  onNewUserAliasChange: (alias: string) => void;
  onNewUserEmailChange: (email: string) => void;
  onNewUserRoleChange: (role: AdminUser["role"]) => void;
  onNewUserClassNameChange: (className: string) => void;
  onNewUserTemporaryPasswordChange: (password: string) => void;
  onOpenProfile: (userId: string) => void;
  onRoleFilterChange: (role: string) => void;
  onToggleUserEnabled: (userId: string, enabled: boolean) => void;
  onUpdateUser: (user: AdminUser) => Promise<boolean> | boolean;
}) {
  function handleCsvUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onImportUsers(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-border bg-background p-4">
          <div className="mb-4 flex items-center gap-2">
            <UserCog className="size-5 text-[#28666e]" aria-hidden="true" />
            <h4 className="font-semibold">Create user</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-first-name">First name</Label>
              <Input
                id="new-user-first-name"
                value={newUserFirstName}
                onChange={(event) => onNewUserFirstNameChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-last-name">Last name</Label>
              <Input
                id="new-user-last-name"
                value={newUserLastName}
                onChange={(event) => onNewUserLastNameChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(event) => onNewUserEmailChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-alias">Alias</Label>
              <Input
                id="new-user-alias"
                placeholder="Generated if blank"
                value={newUserAlias}
                onChange={(event) => onNewUserAliasChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) =>
                  onNewUserRoleChange(value as AdminUser["role"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                disabled={newUserRole === "Admin"}
                value={newUserRole === "Admin" ? "District" : newUserClassName}
                onValueChange={onNewUserClassNameChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                  <SelectItem value="District">District</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-user-temp-password">Temporary password</Label>
              <Input
                id="new-user-temp-password"
                placeholder="Optional for SSO or reset email"
                type="password"
                value={newUserTemporaryPassword}
                onChange={(event) =>
                  onNewUserTemporaryPasswordChange(event.target.value)
                }
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={onCreateIndividualUser}
            className="mt-4 bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create user
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-background p-4">
          <h4 className="font-semibold">Import and filter</h4>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Upload a CSV with firstName, lastName, email, role, class, and alias.
              </p>
              <Label
                htmlFor="user-csv-upload"
                className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-background"
              >
                <Upload className="size-4 text-[#28666e]" aria-hidden="true" />
                Upload CSV
              </Label>
              <Input
                id="user-csv-upload"
                accept=".csv,text/csv"
                className="sr-only"
                type="file"
                onChange={(event) => handleCsvUpload(event.target.files?.[0])}
              />
            </div>
            {importNotice ? (
              <p className="rounded-md bg-[#e8f0ed] p-3 text-sm text-[#24493f]">
                {importNotice}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={onClassFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classOptions.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                  <SelectItem value="District">District</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>@{user.alias}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.className}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenProfile(user.id)}
                  >
                    Profile
                  </Button>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.enabled}
                    onCheckedChange={(checked) =>
                      onToggleUserEnabled(user.id, checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  {permissionSummary(user.permissions)}
                </TableCell>
                <TableCell>
                  <UserEditDialog user={user} onUpdateUser={onUpdateUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UserEditDialog({
  user,
  onUpdateUser,
}: {
  user: AdminUser;
  onUpdateUser: (user: AdminUser) => Promise<boolean> | boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdminUser>(user);
  const [saving, setSaving] = useState(false);

  function updateOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(user);
    }
    setOpen(nextOpen);
  }

  async function saveUser() {
    setSaving(true);
    const saved = await onUpdateUser({
      ...draft,
      className: draft.role === "Admin" ? "District" : draft.className,
      classes: [draft.role === "Admin" ? "District" : draft.className],
    });
    setSaving(false);
    if (saved) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={updateOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FilePenLine className="size-4" aria-hidden="true" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update profile, role, class assignment, and account status.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`edit-first-name-${user.id}`}>First name</Label>
            <Input
              id={`edit-first-name-${user.id}`}
              value={draft.firstName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-last-name-${user.id}`}>Last name</Label>
            <Input
              id={`edit-last-name-${user.id}`}
              value={draft.lastName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
            <Input
              id={`edit-email-${user.id}`}
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-alias-${user.id}`}>Alias</Label>
            <Input
              id={`edit-alias-${user.id}`}
              value={draft.alias}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  alias: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={draft.role}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  role: value as AdminUser["role"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              disabled={draft.role === "Admin"}
              value={draft.role === "Admin" ? "District" : draft.className}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  className: value,
                  classes: [value],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
                <SelectItem value="District">District</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
              <span>Enabled</span>
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({ ...current, enabled: checked }))
                }
              />
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={saveUser}
            disabled={saving}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <Save className="size-4" aria-hidden="true" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsAdminPage({
  users,
  selectedUser,
  onSelectedUserChange,
  onUpdateUserPermission,
}: {
  users: AdminUser[];
  selectedUser: AdminUser;
  onSelectedUserChange: (userId: string) => void;
  onUpdateUserPermission: (
    userId: string,
    permission: keyof AdminUser["permissions"],
    enabled: boolean
  ) => void;
}) {
  const permissions = [
    ["studentProfile", "Student profile"],
    ["teacherPortal", "Teacher portal"],
    ["adminPortal", "Admin portal"],
    ["questImportExport", "Quest import/export"],
    ["portfolioCorrections", "Portfolio corrections"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-lg border border-border bg-background p-4">
        <Label>User</Label>
        <Select value={selectedUser.id} onValueChange={onSelectedUserChange}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} - {user.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-3 text-sm text-muted-foreground">
          Admin users keep all system rights by default.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-semibold">
          {selectedUser.firstName} {selectedUser.lastName}
        </h4>
        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
        <div className="mt-4 grid gap-3">
          {permissions.map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">
                  {permissionDetail(key)}
                </p>
              </div>
              <Switch
                checked={selectedUser.permissions[key]}
                disabled={selectedUser.role === "Admin"}
                onCheckedChange={(checked) =>
                  onUpdateUserPermission(selectedUser.id, key, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupportAdminPage({
  cases,
  summary,
  category,
  onSummaryChange,
  onCategoryChange,
  onCreateCase,
}: {
  cases: SupportCase[];
  summary: string;
  category: string;
  onSummaryChange: (summary: string) => void;
  onCategoryChange: (category: string) => void;
  onCreateCase: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <div className="space-y-2">
          <Label htmlFor="support-summary">New case</Label>
          <Input
            id="support-summary"
            placeholder="Describe the issue"
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Account">Account</SelectItem>
              <SelectItem value="Roster">Roster</SelectItem>
              <SelectItem value="Integration">Integration</SelectItem>
              <SelectItem value="Portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={onCreateCase}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create case
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="text-muted-foreground hover:bg-transparent">
              <TableHead>Case</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.summary}</TableCell>
                <TableCell>{item.requester}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md bg-card">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * Admin: apply an audited cash correction to a student's current class
 * portfolio, and approve or deny teachers' reset requests.
 */
function PortfolioCorrectionsAdminPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [className, setClassName] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function applyCorrection() {
    const amount = Number.parseFloat(adjustment);

    if (!studentEmail.trim() || !Number.isFinite(amount) || amount === 0 || !reason.trim()) {
      setNotice("Enter the student's email, a non-zero amount, and an audit reason.");
      return;
    }

    setPending(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/portfolio-corrections", {
        body: JSON.stringify({
          adjustmentCents: Math.round(amount * 100),
          className: className.trim() || undefined,
          reason: reason.trim(),
          studentEmail: studentEmail.trim(),
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        afterCents?: number;
        beforeCents?: number;
        message?: string;
      };

      if (!response.ok) {
        setNotice(result.message ?? "The correction couldn't be applied.");
        return;
      }

      setNotice(
        `Correction applied and audited. Cash went from ${formatCurrency(
          (result.beforeCents ?? 0) / 100
        )} to ${formatCurrency((result.afterCents ?? 0) / 100)}.`
      );
      setAdjustment("");
      setReason("");
    } catch {
      setNotice("The correction couldn't be applied.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="correction-student">Student email</Label>
              <Input
                id="correction-student"
                type="email"
                placeholder="student@school.edu"
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-class">Class (if the student has more than one)</Label>
              <Input
                id="correction-class"
                placeholder="e.g. 7th Grade Finance A"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-amount">Cash adjustment ($, use − to decrease)</Label>
              <Input
                id="correction-amount"
                type="number"
                step="0.01"
                placeholder="e.g. 25 or -10"
                value={adjustment}
                onChange={(event) => setAdjustment(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="correction-reason">Audit reason</Label>
            <Textarea
              id="correction-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void applyCorrection()}
            className="mt-4 bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <WalletCards className="size-4" aria-hidden="true" />
            {pending ? "Applying…" : "Apply correction"}
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="font-semibold">Correction guardrails</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Corrections change the cash in the student&apos;s current class
            portfolio. Each one needs an audit reason and is recorded in the
            portfolio&apos;s history and the audit log, with the before and after
            balance.
          </p>
          {notice ? (
            <p className="mt-4 rounded-md bg-[#e8f0ed] p-3 text-sm text-[#24493f]">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
      <PortfolioResetQueue />
    </div>
  );
}

/** Admin: teachers' portfolio reset requests, pending first. */
function PortfolioResetQueue() {
  const [requests, setRequests] = useState<ResetRequestRow[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/admin/portfolio-resets", {
        credentials: "same-origin",
      });
      const result = (await response.json()) as {
        message?: string;
        requests?: ResetRequestRow[];
      };

      if (response.ok) {
        setRequests(result.requests ?? []);
      } else {
        setNotice(result.message ?? "Reset requests couldn't be loaded.");
        setRequests([]);
      }
    } catch {
      setNotice("Reset requests couldn't be loaded.");
      setRequests([]);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/portfolio-resets", { credentials: "same-origin" })
      .then(
        (response) =>
          response.json() as Promise<{ message?: string; requests?: ResetRequestRow[] }>
      )
      .then((result) => {
        if (cancelled) return;
        setRequests(result.requests ?? []);
        if (result.message) setNotice(result.message);
      })
      .catch(() => {
        if (!cancelled) {
          setRequests([]);
          setNotice("Reset requests couldn't be loaded.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function decide(requestId: string, decision: "approve" | "deny") {
    setBusyId(requestId);
    setNotice("");

    try {
      const response = await fetch("/api/admin/portfolio-resets", {
        body: JSON.stringify({ decision, note: notes[requestId] ?? "", requestId }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { delivery?: string; message?: string };

      if (!response.ok) {
        setNotice(result.message ?? "The request couldn't be updated.");
        return;
      }

      setNotice(
        `${decision === "approve" ? "Approved: the portfolio was reset." : "Denied."} ${
          result.delivery === "sent"
            ? "The teacher was emailed."
            : "The teacher couldn't be emailed (email isn't set up)."
        }`
      );
      await load();
    } catch {
      setNotice("The request couldn't be updated.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = requests?.filter((request) => request.status === "pending").length ?? 0;

  return (
    <section
      aria-labelledby="reset-queue-heading"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 id="reset-queue-heading" className="font-semibold">
          Portfolio reset requests
        </h4>
        <Badge variant="outline" className="rounded-md">
          {pendingCount} pending
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Teachers request resets; approving one resets the student&apos;s current
        class portfolio to the class&apos;s starting cash and emails the teacher.
      </p>
      {notice ? (
        <p className="mt-3 rounded-md bg-[#e8f0ed] p-3 text-sm text-[#24493f]">{notice}</p>
      ) : null}
      {requests === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No reset requests yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {requests.map((request) => (
            <li key={request.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">
                  {request.studentName || request.studentEmail} · {request.className} ·{" "}
                  {request.schoolYear.replace("-", "–")}
                </span>
                <span className="text-muted-foreground">
                  {resetStatusLabels[request.status] ?? request.status}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Requested by {request.requesterName || request.requesterEmail} on{" "}
                {shortDate(request.createdAt)}: {request.reason}
              </p>
              {request.status === "pending" ? (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    aria-label="Note to the teacher (optional)"
                    placeholder="Note to the teacher (optional)"
                    value={notes[request.id] ?? ""}
                    onChange={(event) =>
                      setNotes((all) => ({ ...all, [request.id]: event.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void decide(request.id, "approve")}
                    className="bg-[#28666e] text-white hover:bg-[#22565d]"
                  >
                    Approve reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyId !== null}
                    onClick={() => void decide(request.id, "deny")}
                  >
                    Deny
                  </Button>
                </div>
              ) : request.decisionNote ? (
                <p className="mt-1 text-muted-foreground">Note: {request.decisionNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type EmailDelivery = {
  createdAt: string;
  error: string | null;
  id: string;
  kind: string;
  recipient: string;
  status: string;
  subject: string;
};

type EmailStatus = {
  configured: boolean;
  from: string | null;
  missing: string[];
  provider: "resend" | "log";
};

const emailKindLabels: Record<string, string> = {
  flagged_message_forward: "Flagged message",
  password_reset: "Password reset",
  test: "Test",
};

const emailStatusLabels: Record<string, string> = {
  failed: "Failed",
  logged: "Logged (not sent)",
  not_configured: "Not sent: email not set up",
  sent: "Sent",
};

/**
 * Admin: start viewing the app as a student (by email, with a reason). The
 * page reloads as that student; a banner offers Exit.
 */
function ViewAsStudentDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function start() {
    if (!email.trim() || !reason.trim()) {
      setNotice("Enter the student's email and a reason.");
      return;
    }

    setPending(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/view-as", {
        body: JSON.stringify({ reason: reason.trim(), studentEmail: email.trim() }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setNotice(result.message ?? "Couldn't start viewing as that student.");
        return;
      }

      // Reload so every screen loads as the student.
      window.location.assign("/");
    } catch {
      setNotice("Couldn't start viewing as that student.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setNotice("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>View as student</DialogTitle>
          <DialogDescription>
            Use the app as this student, with their full features, to
            troubleshoot. Anything you do (like a trade) is saved to their
            account and marked as done by you on their behalf. Starting,
            exiting, and every action are recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="view-as-email">Student email</Label>
            <Input
              id="view-as-email"
              type="email"
              placeholder="student@school.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="view-as-reason">Reason</Label>
            <Textarea
              id="view-as-reason"
              placeholder="e.g. Teacher reports the student's messages aren't sending"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void start()}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            {pending ? "Starting…" : "Start viewing as student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Shown on every screen while an admin is viewing as a student. */
function ViewingAsBanner({
  adminName,
  studentEmail,
  studentName,
}: {
  adminName: string;
  studentEmail: string;
  studentName: string;
}) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function exit() {
    setPending(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/view-as", {
        credentials: "same-origin",
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setNotice(result.message ?? "Couldn't exit. Try again.");
        return;
      }

      window.location.assign("/");
    } catch {
      setNotice("Couldn't exit. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="status"
      aria-label="Viewing as student"
      className="bg-[#7a3b00] text-white"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p>
          <span className="font-semibold">
            Viewing as {studentName || studentEmail}
          </span>{" "}
          ({studentEmail}) · admin: {adminName}. Actions you take are saved to this
          student&apos;s account and marked as yours.
        </p>
        <div className="flex items-center gap-3">
          {notice ? <span>{notice}</span> : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => void exit()}
            className="border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            {pending ? "Exiting…" : "Exit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MonthDayPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [month, day] = value.split("-");

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-month`}>{label}</Label>
      <div className="flex gap-2">
        <select
          id={`${id}-month`}
          aria-label={`${label} month`}
          value={month}
          onChange={(event) => onChange(`${event.target.value}-${day}`)}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {monthNames.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <select
          id={`${id}-day`}
          aria-label={`${label} day`}
          value={day}
          onChange={(event) => onChange(`${month}-${event.target.value}`)}
          className="h-9 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")).map(
            (value) => (
              <option key={value} value={value}>
                {Number(value)}
              </option>
            )
          )}
        </select>
      </div>
    </div>
  );
}

/** Admin: the district's school year dates (default Aug 28 – Jun 1). */
function SchoolYearDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("08-28");
  const [end, setEnd] = useState("06-01");
  const [current, setCurrent] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Regression: issue #19. A slow load must not overwrite newer data or the
  // admin's own changes: only the latest load counts, and only until the
  // admin edits a date.
  const loadSequence = useRef(0);
  const edited = useRef(false);

  async function load() {
    const sequence = ++loadSequence.current;
    edited.current = false;
    setLoaded(false);

    try {
      const response = await fetch("/api/admin/school-year", { credentials: "same-origin" });
      const result = (await response.json()) as {
        current?: string;
        message?: string;
        settings?: { end: string; start: string };
      };

      if (sequence !== loadSequence.current) return;

      if (response.ok && result.settings) {
        if (!edited.current) {
          setStart(result.settings.start);
          setEnd(result.settings.end);
        }
        setCurrent(result.current ?? "");
        setLoaded(true);
      } else {
        setNotice(result.message ?? "The school year couldn't be loaded.");
      }
    } catch {
      if (sequence === loadSequence.current) {
        setNotice("The school year couldn't be loaded.");
      }
    }
  }

  function editStart(value: string) {
    edited.current = true;
    setStart(value);
  }

  function editEnd(value: string) {
    edited.current = true;
    setEnd(value);
  }

  async function save() {
    setSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin/school-year", {
        body: JSON.stringify({ end, start }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { current?: string; message?: string };

      if (!response.ok) {
        setNotice(result.message ?? "The school year couldn't be saved.");
        return;
      }

      setCurrent(result.current ?? "");
      setNotice("Saved. The change is recorded in the audit log.");
    } catch {
      setNotice("The school year couldn't be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setNotice("");
          void load();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>School year</DialogTitle>
          <DialogDescription>
            Student portfolios are labeled by school year, and become read-only
            records after the last day. Summer counts toward the upcoming year.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <MonthDayPicker id="school-year-start" label="First day" value={start} onChange={editStart} />
          <MonthDayPicker id="school-year-end" label="Last day" value={end} onChange={editEnd} />
          {current ? (
            <p className="text-sm text-muted-foreground">
              Current school year: <span className="font-medium">{current.replace("-", "–")}</span>
            </p>
          ) : null}
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              editStart("08-28");
              editEnd("06-01");
            }}
          >
            Use default (Aug 28 – Jun 1)
          </Button>
          <Button
            type="button"
            disabled={saving || !loaded}
            onClick={() => void save()}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmailSettingsDialog({
  defaultRecipient,
  trigger,
}: {
  defaultRecipient: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
  const [loadError, setLoadError] = useState("");
  const [testRecipient, setTestRecipient] = useState(defaultRecipient);
  const [testNotice, setTestNotice] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoadError("");

    try {
      const response = await fetch("/api/admin/email", {
        credentials: "same-origin",
      });
      const result = (await response.json()) as {
        deliveries?: EmailDelivery[];
        message?: string;
        status?: EmailStatus;
      };

      if (!response.ok || !result.status) {
        setLoadError(result.message ?? "Email settings could not be loaded.");
        return;
      }

      setStatus(result.status);
      setDeliveries(result.deliveries ?? []);
    } catch {
      setLoadError("Email settings could not be loaded.");
    }
  }

  async function sendTest() {
    setSending(true);
    setTestNotice("");

    try {
      const response = await fetch("/api/admin/email", {
        body: JSON.stringify({ to: testRecipient }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        delivery?: string;
        deliveryError?: string;
        message?: string;
      };

      if (!response.ok) {
        setTestNotice(result.message ?? "The test email could not be sent.");
      } else if (result.delivery === "sent") {
        setTestNotice(`Test email sent to ${testRecipient.trim()}. Check that inbox.`);
      } else if (result.delivery === "logged") {
        setTestNotice(
          "Email isn't set up, so the test was written to the server log instead (development only)."
        );
      } else {
        setTestNotice(
          `The test email was not sent: ${result.deliveryError ?? "unknown error"}`
        );
      }

      await load();
    } catch {
      setTestNotice("The test email could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setTestNotice("");
          void load();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email</DialogTitle>
          <DialogDescription>
            FutureFund sends email through Resend. Message contents are never
            stored; the log below shows only who, what, and whether it was sent.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="rounded-md bg-accent p-3 text-sm">{loadError}</p>
        ) : !status ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-md border border-border p-3 text-sm">
              {status.configured ? (
                <p>
                  <span className="font-medium">Email is set up.</span> Sending
                  from <span className="font-mono">{status.from}</span>.
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">Email is not set up yet.</p>
                  <p className="text-muted-foreground">
                    Add these settings in DigitalOcean (App → Settings → web →
                    Environment Variables):{" "}
                    <span className="font-mono">{status.missing.join(", ")}</span>.
                    Until then, no emails are sent.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-test-recipient">Send a test email to</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="email-test-recipient"
                  type="email"
                  value={testRecipient}
                  onChange={(event) => setTestRecipient(event.target.value)}
                />
                <Button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendTest()}
                  className="bg-[#28666e] text-white hover:bg-[#22565d]"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {sending ? "Sending…" : "Send test"}
                </Button>
              </div>
              {testNotice ? (
                <p className="text-sm text-muted-foreground">{testNotice}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recent emails</h4>
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No emails yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(delivery.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{delivery.recipient}</TableCell>
                        <TableCell>
                          {emailKindLabels[delivery.kind] ?? delivery.kind}
                        </TableCell>
                        <TableCell title={delivery.error ?? undefined}>
                          {emailStatusLabels[delivery.status] ?? delivery.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdminModuleCardContent({
  module,
}: {
  module: (typeof adminModules)[number];
}) {
  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f0ed] text-[#28666e]">
          <module.icon className="size-5" aria-hidden="true" />
        </div>
        <Badge variant="outline" className="rounded-md bg-card">
          {module.status}
        </Badge>
      </div>
      <h4 className="font-semibold">{module.title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {module.detail}
      </p>
    </>
  );
}

function LearningQuestTransferPanel({
  audience,
  transferText,
  notice,
  onTextChange,
  onExport,
  onImport,
}: {
  audience: "Teacher" | "Admin";
  transferText: string;
  notice: string;
  onTextChange: (text: string) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div className="mt-5 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-semibold">Learning quest import/export</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {audience}s can move quest templates between classrooms or district
            libraries using JSON.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onExport}>
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
          <Button
            type="button"
            onClick={onImport}
            className="bg-[#28666e] text-white hover:bg-[#22565d]"
          >
            <Upload className="size-4" aria-hidden="true" />
            Import
          </Button>
        </div>
      </div>
      <Textarea
        className="mt-4 min-h-32 font-mono text-sm"
        placeholder="Paste exported learning quest JSON"
        value={transferText}
        onChange={(event) => onTextChange(event.target.value)}
      />
      {notice ? (
        <p className="mt-3 text-sm text-muted-foreground">{notice}</p>
      ) : null}
    </div>
  );
}

function permissionSummary(permissions: AdminUser["permissions"]) {
  const enabled = Object.values(permissions).filter(Boolean).length;

  return `${enabled} of ${Object.keys(permissions).length} enabled`;
}

function permissionDetail(permission: keyof AdminUser["permissions"]) {
  const details: Record<keyof AdminUser["permissions"], string> = {
    studentProfile: "Allows access to the student profile experience.",
    teacherPortal: "Allows access to classroom and teacher quest tools.",
    adminPortal: "Allows system-wide administration rights.",
    questImportExport: "Allows learning quest template import and export.",
    portfolioCorrections: "Allows audited simulated portfolio adjustments.",
  };

  return details[permission];
}

function permissionLabel(permission: keyof AdminUser["permissions"]) {
  const labels: Record<keyof AdminUser["permissions"], string> = {
    studentProfile: "Student profile",
    teacherPortal: "Teacher portal",
    adminPortal: "Admin portal",
    questImportExport: "Quest import/export",
    portfolioCorrections: "Portfolio corrections",
  };

  return labels[permission];
}

function credentialTypeLabel(type: CredentialRecord["credentialType"]) {
  const labels: Record<CredentialRecord["credentialType"], string> = {
    api_token: "API token",
    oauth_client_secret: "OAuth client secret",
    username_password: "Username/password",
  };

  return labels[type];
}

function credentialPlacementLabel(placement: CredentialRecord["tokenPlacement"]) {
  const labels: Record<CredentialRecord["tokenPlacement"], string> = {
    basic: "Basic auth",
    bearer: "Bearer header",
    "client-secret": "Client secret",
    query: "Query token",
    "x-api-key": "X-API-Key header",
  };

  return labels[placement];
}

function parseJsonList(value: string) {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function maskLocalUsername(username: string) {
  const trimmed = username.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= 3) {
    return "***";
  }

  return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
}

function parseUsersCsv(csvText: string): AdminUser[] {
  const rows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => cell.trim())
  );

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeCsvHeader);

  return rows
    .slice(1)
    .map((row, index) => {
      const record = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex]?.trim() ?? ""])
      );
      const email = record.email;

      if (!email) {
        return null;
      }

      const role = normalizeRole(record.role);
      const firstName = record.firstname || record.first || "Imported";
      const lastName = record.lastname || record.last || "User";
      const className =
        record.class || record.classname || record.classroom || "Unassigned";

      return {
        id: `imported-${Date.now()}-${index}`,
        firstName,
        lastName,
        alias:
          record.alias ||
          record.username ||
          `${firstName}${lastName}`.replace(/\s/g, ""),
        email,
        role,
        className,
        classes: [className],
        profileNote: "Imported from district CSV.",
        enabled: true,
        permissions: permissionsForRole(role),
      };
    })
    .filter((user): user is AdminUser => Boolean(user));
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function normalizeCsvHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeRole(role: string): AdminUser["role"] {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === "teacher") {
    return "Teacher";
  }

  if (normalizedRole === "admin") {
    return "Admin";
  }

  return "Student";
}

function permissionsForRole(role: AdminUser["role"]): AdminUser["permissions"] {
  if (role === "Admin") {
    return {
      studentProfile: true,
      teacherPortal: true,
      adminPortal: true,
      questImportExport: true,
      portfolioCorrections: true,
    };
  }

  if (role === "Teacher") {
    return {
      studentProfile: false,
      teacherPortal: true,
      adminPortal: false,
      questImportExport: true,
      portfolioCorrections: false,
    };
  }

  return {
    studentProfile: true,
    teacherPortal: false,
    adminPortal: false,
    questImportExport: false,
    portfolioCorrections: false,
  };
}

function PortfolioChart({
  data,
}: {
  data: Array<{ month: string; value: number }>;
}) {
  const min = Math.min(...data.map((point) => point.value)) - 40;
  const max = Math.max(...data.map((point) => point.value)) + 40;
  const width = 720;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 42, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * plotWidth;
    const y =
      padding.top + ((max - point.value) / (max - min)) * plotHeight;

    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    height - padding.bottom
  } L ${points[0].x} ${height - padding.bottom} Z`;
  const grid = [0, 1, 2, 3].map(
    (step) => padding.top + (step / 3) * plotHeight
  );

  return (
    <svg
      aria-label="Portfolio growth over time"
      className="h-full w-full"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="native-portfolio" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#28666e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#28666e" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {grid.map((y) => (
        <line
          key={y}
          stroke="#e3e0d7"
          strokeDasharray="5 5"
          x1={padding.left}
          x2={width - padding.right}
          y1={y}
          y2={y}
        />
      ))}
      <path d={areaPath} fill="url(#native-portfolio)" />
      <path
        d={linePath}
        fill="none"
        stroke="#28666e"
        strokeLinecap="round"
        strokeWidth="4"
      />
      {points.map((point) => (
        <g key={point.month}>
          <circle cx={point.x} cy={point.y} fill="#fbfaf6" r="6" />
          <circle cx={point.x} cy={point.y} fill="#28666e" r="3.5" />
          <text
            fill="#66706b"
            fontSize="13"
            textAnchor="middle"
            x={point.x}
            y={height - 14}
          >
            {point.month}
          </text>
        </g>
      ))}
      <text fill="#66706b" fontSize="13" x="4" y={padding.top + 5}>
        ${max}
      </text>
      <text fill="#66706b" fontSize="13" x="4" y={height - padding.bottom}>
        ${min}
      </text>
    </svg>
  );
}

function AllocationDonut({ items = allocation }: { items?: typeof allocation }) {
  const stops = items
    .reduce(
      (result, item) => {
        const next = result.cursor + item.value;

        return {
          cursor: next,
          segments: [
            ...result.segments,
            `${item.color} ${result.cursor}% ${next}%`,
          ],
        };
      },
      { cursor: 0, segments: [] as string[] }
    )
    .segments.join(", ");

  return (
    <div className="grid h-full place-items-center">
      <div
        aria-label="Portfolio allocation"
        className="relative size-44 rounded-full"
        role="img"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-12 grid place-items-center rounded-full bg-card text-center shadow-inner">
          <span className="text-2xl font-semibold">{items.length}</span>
          <span className="-mt-1 text-xs text-muted-foreground">vehicles</span>
        </div>
      </div>
    </div>
  );
}

function MasteryBars() {
  return (
    <div className="grid h-full content-center gap-5">
      {mastery.map((item) => (
        <div key={item.concept} className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{item.concept}</span>
            <span className="text-muted-foreground">{item.score}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#28666e]"
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f0ed] text-[#28666e]">
          {icon}
        </div>
        <Badge variant="outline" className="rounded-md">
          MVP
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {content}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ProgressWithLabel({ value }: { value: number }) {
  return (
    <div className="flex min-w-[150px] items-center gap-3">
      <Progress value={value} className="h-2" />
      <span className="w-9 text-right text-sm">{value}%</span>
    </div>
  );
}

function LineGraph({
  ariaLabel,
  series,
}: {
  ariaLabel: string;
  series: Array<{ label: string; points: number[] }>;
}) {
  const width = 760;
  const height = 220;
  const padding = 28;
  const colors = ["#28666e", "#f2a541", "#c44536", "#5c677d"];
  const allPoints = series.flatMap((item) => item.points);
  const max = Math.max(...allPoints, 1);
  const min = Math.min(...allPoints, 0);
  const range = Math.max(max - min, 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background p-4">
      <svg
        aria-label={ariaLabel}
        className="min-w-[620px]"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          stroke="#d8d5ce"
          strokeWidth="1"
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
        />
        <line
          stroke="#d8d5ce"
          strokeWidth="1"
          x1={padding}
          x2={padding}
          y1={padding}
          y2={height - padding}
        />
        {series.map((item, seriesIndex) => {
          const points = item.points.map((point, pointIndex) => {
            const x =
              padding +
              (pointIndex / Math.max(item.points.length - 1, 1)) *
                (width - padding * 2);
            const y =
              height -
              padding -
              ((point - min) / range) * (height - padding * 2);

            return `${x},${y}`;
          });

          return (
            <g key={item.label}>
              <polyline
                fill="none"
                points={points.join(" ")}
                stroke={colors[seriesIndex % colors.length]}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <text
                fill={colors[seriesIndex % colors.length]}
                fontSize="12"
                x={padding}
                y={18 + seriesIndex * 18}
              >
                {item.label}
              </text>
            </g>
          );
        })}
        <text fill="#6b7280" fontSize="12" x={padding} y={height - 6}>
          Recent samples
        </text>
        <text fill="#6b7280" fontSize="12" x={width - 74} y={height - 6}>
          Latest
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- quests (v0.2.9)

type QuestComment = {
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  id: string;
};

type QuestSubmission = {
  comments: QuestComment[];
  id: string;
  reflection: string;
  submittedAt: string;
  updatedAt: string;
};

async function postJson<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) throw new Error(result.message ?? "That couldn't be saved. Try again.");
  return result;
}

function formatDue(dueAt: string | null) {
  return dueAt
    ? `Due ${new Date(dueAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
    : "No due date";
}

/** The shared library: every teacher's quests, with Copy. */
function QuestLibraryList({
  onCopy,
  quests,
}: {
  onCopy: (quest: TeacherQuest) => void;
  quests: TeacherQuest[];
}) {
  return (
    <section aria-label="Quest library" className="mb-5 rounded-lg border border-border bg-background p-4">
      <h4 className="font-semibold">Quest library</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        Every teacher&apos;s saved quests. Copy one into your quests to edit and assign it.
      </p>
      {quests.length ? (
        <ul className="mt-3 grid gap-2">
          {quests.map((quest) => (
            <li
              key={quest.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span>
                <strong>{quest.title}</strong>
                <span className="block text-xs text-muted-foreground">
                  By {quest.isMine ? "you" : quest.ownerName} · {quest.criteria.length} scoring rules ·
                  {" "}{quest.marketMode === "none" ? "no market" : quest.marketMode}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Copy ${quest.title}`}
                onClick={() => onCopy(quest)}
              >
                Copy
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">The library is empty.</p>
      )}
    </section>
  );
}

/** Assign a saved quest to one or more classes, with an optional due date. */
function AssignQuestDialog({
  classNames,
  onAssigned,
  quest,
}: {
  classNames: string[];
  onAssigned: (message: string) => void;
  quest: TeacherQuest;
}) {
  const [chosen, setChosen] = useState<string[]>(
    () => quest.assignments?.map((assignment) => assignment.className) ?? []
  );
  const [dueDate, setDueDate] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function assign() {
    if (chosen.length === 0) {
      setNotice("Choose at least one class.");
      return;
    }

    setPending(true);
    try {
      await postJson("/api/quests", {
        action: "assign",
        classNames: chosen,
        dueDate: dueDate || null,
        questId: quest.id,
      });
      onAssigned(
        `Assigned "${quest.title}" to ${chosen.join(", ")}${dueDate ? `, due ${dueDate}` : ""}.`
      );
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Assign &ldquo;{quest.title}&rdquo;</DialogTitle>
        <DialogDescription>
          Students in the chosen classes see this quest on their dashboard. Assigning to a class
          again changes its due date.
        </DialogDescription>
      </DialogHeader>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Classes</legend>
        {classNames.map((className) => (
          <label key={className} className="flex items-center gap-2 text-sm">
            <Checkbox
              aria-label={className}
              checked={chosen.includes(className)}
              onCheckedChange={(checked) =>
                setChosen((all) =>
                  checked ? [...all, className] : all.filter((name) => name !== className)
                )
              }
            />
            {className}
          </label>
        ))}
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="quest-due-date">Due date (optional)</Label>
        <Input
          id="quest-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Students can edit their submission until the end of the due date. After that it&apos;s
          locked, and only comments can be added.
        </p>
      </div>
      {notice ? <p className="rounded-md bg-accent px-3 py-2 text-sm">{notice}</p> : null}
      <DialogFooter>
        <Button
          type="button"
          disabled={pending}
          onClick={() => void assign()}
          className="bg-[#28666e] text-white hover:bg-[#22565d]"
        >
          Assign quest
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/** Comments on a submission. Allowed before and after the due date. */
function SubmissionComments({
  comments,
  onAdded,
  submissionId,
}: {
  comments: QuestComment[];
  onAdded: () => void;
  submissionId: string;
}) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    setNotice("");
    try {
      await postJson("/api/quests/comments", { body: draft, submissionId });
      setDraft("");
      onAdded();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Comments" className="mt-3 rounded-md border border-border bg-background p-3">
      <h5 className="text-sm font-semibold">Comments</h5>
      {comments.length ? (
        <ul className="mt-2 grid gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="text-sm">
              <span className="font-medium">{comment.authorName}</span>
              {comment.authorRole ? (
                <span className="text-xs text-muted-foreground"> · {comment.authorRole}</span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {" "}· {new Date(comment.createdAt).toLocaleString()}
              </span>
              <p className="whitespace-pre-wrap">{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No comments yet.</p>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Add a comment"
          placeholder="Add a comment"
          value={draft}
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !draft.trim()}
          onClick={() => void add()}
        >
          Post comment
        </Button>
      </div>
      {notice ? <p className="mt-2 text-sm text-[#a13d2e]">{notice}</p> : null}
    </section>
  );
}

type SubmissionsView = {
  classes: Array<{
    assignmentId: string;
    averagePercent: number | null;
    beforeDue: boolean;
    className: string;
    draftCount: number;
    dueAt: string | null;
    students: Array<{
      email: string;
      grade: TeacherGrade | null;
      name: string;
      status: StudentStatus;
      submission: QuestSubmission | null;
    }>;
  }>;
  // The quest's scoring rules, for the grading form (v0.2.15).
  criteria: Array<{ id: string; label: string; points: number }>;
  title: string;
};

/** The teacher's view of one quest's submissions, with comments. */
function QuestSubmissionsPanel({ questId }: { questId: string }) {
  const [view, setView] = useState<SubmissionsView | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/quests/submissions?questId=${encodeURIComponent(questId)}`, {
      credentials: "same-origin",
    })
      .then(async (response) => {
        const result = (await response.json()) as SubmissionsView & { message?: string };
        if (cancelled) return;
        if (!response.ok) setError(result.message ?? "Submissions couldn't be loaded.");
        else setView(result);
      })
      .catch(() => {
        if (!cancelled) setError("Submissions couldn't be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [questId, version]);

  return (
    <section aria-label="Submissions" className="mt-5 rounded-lg border border-border bg-background p-4">
      <h4 className="font-semibold">Submissions</h4>
      {error ? <p className="mt-2 text-sm">{error}</p> : null}
      {view && view.classes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          This quest isn&apos;t assigned to any of your classes yet. Click Assign.
        </p>
      ) : null}
      {view?.classes.map((classroom) => (
        <div key={classroom.className} className="mt-3">
          <p className="text-sm font-medium">
            {classroom.className} · {formatDue(classroom.dueAt)} ·{" "}
            {classroom.students.filter((student) => student.submission).length} of{" "}
            {classroom.students.length} submitted
          </p>
          <ClassGradeSummary
            assignmentId={classroom.assignmentId}
            averagePercent={classroom.averagePercent}
            className={classroom.className}
            draftCount={classroom.draftCount}
            onChanged={() => setVersion((current) => current + 1)}
          />
          <ul className="mt-2 grid gap-2">
            {classroom.students.map((student) => (
              <li key={student.email} className="rounded-md border border-border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{student.name}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {student.submission && student.submission.updatedAt !== student.submission.submittedAt ? (
                      <Badge variant="outline" className="rounded-md">Edited</Badge>
                    ) : null}
                    <StatusBadge status={student.status} />
                  </div>
                </div>
                {student.submission ? (
                  <>
                    <p className="mt-2 whitespace-pre-wrap">{student.submission.reflection}</p>
                    <SubmissionComments
                      comments={student.submission.comments}
                      submissionId={student.submission.id}
                      onAdded={() => setVersion((current) => current + 1)}
                    />
                  </>
                ) : null}
                <GradePanel
                  assignmentId={classroom.assignmentId}
                  beforeDue={classroom.beforeDue}
                  criteria={view.criteria}
                  grade={student.grade}
                  hasSubmission={Boolean(student.submission)}
                  studentEmail={student.email}
                  studentName={student.name}
                  onChanged={() => setVersion((current) => current + 1)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

type AssignedQuest = {
  assignmentId: string;
  canEdit: boolean;
  className: string;
  criteria: Array<{ id: string; label: string; points: number }>;
  dueAt: string | null;
  // The student's grade report, once the teacher has released it (v0.2.15).
  grade: StudentGradeReport | null;
  marketMode: string;
  marketSymbols: string;
  marketWindow: string;
  objective: string;
  questId: string;
  requireReflection: boolean;
  submission: QuestSubmission | null;
  teacherName: string;
  title: string;
};

/** The student's assigned quests (replaces the built-in sample quests). */
function StudentAssignedQuests() {
  const [quests, setQuests] = useState<AssignedQuest[] | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/quests/student", { credentials: "same-origin" })
      .then(async (response) => {
        const result = (await response.json()) as { message?: string; quests?: AssignedQuest[] };
        if (cancelled) return;
        if (!response.ok || !result.quests) setError(result.message ?? "Quests couldn't be loaded.");
        else setQuests(result.quests);
      })
      .catch(() => {
        if (!cancelled) setError("Quests couldn't be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  if (error) return <p className="text-sm text-muted-foreground">{error}</p>;
  if (!quests) return <p className="text-sm text-muted-foreground">Loading your quests…</p>;
  if (quests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No quests assigned yet. Your teacher&apos;s quests will show up here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {quests.map((quest) => (
        <Dialog key={quest.assignmentId}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{quest.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quest.className} · {formatDue(quest.dueAt)}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-md">
                  {quest.grade
                    ? quest.grade.totalPoints !== null && quest.grade.maxPoints
                      ? `Graded · ${quest.grade.totalPoints} of ${quest.grade.maxPoints}`
                      : "Graded"
                    : quest.submission
                      ? quest.canEdit
                        ? "Submitted"
                        : "Submitted · locked"
                      : quest.canEdit
                        ? "To do"
                        : "Past due"}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#28666e]">
                Open quest
                <ChevronRight className="size-4" aria-hidden="true" />
              </div>
            </button>
          </DialogTrigger>
          <StudentAssignedQuestDialog quest={quest} onChanged={() => setVersion((v) => v + 1)} />
        </Dialog>
      ))}
    </div>
  );
}

function StudentAssignedQuestDialog({
  onChanged,
  quest,
}: {
  onChanged: () => void;
  quest: AssignedQuest;
}) {
  const [reflection, setReflection] = useState(quest.submission?.reflection ?? "");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const label = quest.requireReflection ? "Your reflection" : "Your response";

  async function submit() {
    setPending(true);
    setNotice("");
    try {
      const result = await postJson<{ edited: boolean }>("/api/quests/student", {
        assignmentId: quest.assignmentId,
        reflection,
      });
      setNotice(result.edited ? "Your changes are saved." : "Submitted! Your teacher can see it now.");
      onChanged();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{quest.title}</DialogTitle>
        <DialogDescription>
          {quest.className} · from {quest.teacherName} · {formatDue(quest.dueAt)}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <p className="leading-6">{quest.objective}</p>
        {quest.grade ? <StudentGradeReportCard report={quest.grade} /> : null}
        {quest.marketMode !== "none" ? (
          <p className="rounded-md bg-[#e8f0ed] px-3 py-2 text-[#24493f]">
            Market: {quest.marketSymbols || "class symbols"} · {quest.marketWindow}
          </p>
        ) : null}
        {quest.criteria.length ? (
          <div>
            <h4 className="font-semibold">How it&apos;s scored</h4>
            <ul className="mt-2 grid gap-1">
              {quest.criteria.map((rule) => (
                <li key={rule.id} className="flex justify-between gap-3">
                  <span>{rule.label}</span>
                  <span className="text-muted-foreground">{rule.points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`reflection-${quest.assignmentId}`}>{label}</Label>
          <Textarea
            id={`reflection-${quest.assignmentId}`}
            value={reflection}
            readOnly={!quest.canEdit}
            maxLength={5000}
            rows={6}
            onChange={(event) => setReflection(event.target.value)}
          />
          {quest.canEdit ? (
            <Button
              type="button"
              disabled={pending || !reflection.trim()}
              onClick={() => void submit()}
              className="bg-[#28666e] text-white hover:bg-[#22565d]"
            >
              {quest.submission ? "Save changes" : "Submit"}
            </Button>
          ) : (
            <p className="rounded-md bg-accent px-3 py-2">
              The due date has passed, so this submission is locked. You can still add comments.
            </p>
          )}
          {quest.submission && quest.canEdit && quest.dueAt ? (
            <p className="text-xs text-muted-foreground">
              You can edit your submission until the end of the due date.
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-md bg-accent px-3 py-2">
              {notice}
            </p>
          ) : null}
        </div>

        {quest.submission ? (
          <SubmissionComments
            comments={quest.submission.comments}
            submissionId={quest.submission.id}
            onAdded={onChanged}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Comments open once you submit.
          </p>
        )}
      </div>
    </DialogContent>
  );
}

function QuestMonitorMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md bg-card px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function downloadIntegrationLogsZip(integration: IntegrationHealthMetric) {
  const logText = JSON.stringify(
    {
      connectionName: integration.connectionName,
      rttMs: integration.rttMs,
      errors: integration.errors,
      status: integration.status,
      exportedAt: new Date().toISOString(),
      logs: integration.logs,
    },
    null,
    2
  );
  const filename = `${slugify(integration.connectionName)}-logs.json`;
  const zipBytes = createSingleFileZip(filename, logText);
  const blob = new Blob([zipBytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(integration.connectionName)}-logs.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatLogEntries(logs: LogEntry[]) {
  return logs.map((log) => `[${log.timestamp}] ${log.message}`).join("\n");
}

function createSingleFileZip(filename: string, content: string) {
  const encoder = new TextEncoder();
  const filenameBytes = encoder.encode(filename);
  const contentBytes = encoder.encode(content);
  const crc = crc32(contentBytes);
  const localHeaderLength = 30 + filenameBytes.length;
  const centralHeaderLength = 46 + filenameBytes.length;
  const endHeaderLength = 22;
  const totalLength =
    localHeaderLength + contentBytes.length + centralHeaderLength + endHeaderLength;
  const zip = new Uint8Array(totalLength);
  const view = new DataView(zip.buffer);
  let offset = 0;

  offset = writeZipHeader(view, zip, offset, filenameBytes, contentBytes, crc);
  zip.set(contentBytes, offset);
  offset += contentBytes.length;
  const centralDirectoryOffset = offset;
  offset = writeCentralDirectoryHeader(
    view,
    zip,
    offset,
    filenameBytes,
    contentBytes,
    crc
  );
  const centralDirectorySize = offset - centralDirectoryOffset;

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, 1, true);
  view.setUint16(offset + 10, 1, true);
  view.setUint32(offset + 12, centralDirectorySize, true);
  view.setUint32(offset + 16, centralDirectoryOffset, true);

  return zip;
}

function writeZipHeader(
  view: DataView,
  zip: Uint8Array,
  offset: number,
  filenameBytes: Uint8Array,
  contentBytes: Uint8Array,
  crc: number
) {
  view.setUint32(offset, 0x04034b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 8, 0, true);
  view.setUint32(offset + 14, crc, true);
  view.setUint32(offset + 18, contentBytes.length, true);
  view.setUint32(offset + 22, contentBytes.length, true);
  view.setUint16(offset + 26, filenameBytes.length, true);
  zip.set(filenameBytes, offset + 30);

  return offset + 30 + filenameBytes.length;
}

function writeCentralDirectoryHeader(
  view: DataView,
  zip: Uint8Array,
  offset: number,
  filenameBytes: Uint8Array,
  contentBytes: Uint8Array,
  crc: number
) {
  view.setUint32(offset, 0x02014b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 6, 20, true);
  view.setUint32(offset + 16, crc, true);
  view.setUint32(offset + 20, contentBytes.length, true);
  view.setUint32(offset + 24, contentBytes.length, true);
  view.setUint16(offset + 28, filenameBytes.length, true);
  zip.set(filenameBytes, offset + 46);

  return offset + 46 + filenameBytes.length;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function roleToTab(role: AdminUser["role"]) {
  if (role === "Teacher") {
    return "teacher";
  }

  if (role === "Admin") {
    return "admin";
  }

  return "student";
}

function canUseRole(role: (typeof roleOptions)[number]["value"], user: AuthenticatedUser) {
  if (role === "teacher") {
    return user.permissions.teacherPortal;
  }

  if (role === "admin") {
    return user.permissions.adminPortal;
  }

  return user.permissions.studentProfile;
}

function buildStudentDiscussionItems(
  student: TeacherStudentAnalytics,
  className: string
) {
  if (student.discussionPosts === 0) {
    return [];
  }

  return [
    {
      id: `${student.alias}-discussion-portfolio`,
      room: "Portfolio Lab",
      status: "On track",
      when: "Today",
      body: `${student.alias} explained how their latest allocation change affected risk and cash flexibility.`,
      context: `${Math.min(
        student.discussionPosts,
        8
      )} posts connected to portfolio and allocation conversations in ${className}.`,
    },
    {
      id: `${student.alias}-discussion-quest`,
      room: "Quest Reflection",
      status:
        student.questProgress >= 70 ? "On track" : "Teacher follow-up suggested",
      when: "This week",
      body: `${student.alias} responded to peer feedback on the current learning quest and cited their simulated portfolio results.`,
      context: `${Math.max(
        student.discussionPosts - 4,
        1
      )} posts connected to goals, quests, and reflection prompts.`,
    },
  ];
}

function buildStudentFlagItems(
  student: TeacherStudentAnalytics,
  className: string
) {
  if (student.flaggedPosts === 0) {
    return [];
  }

  return Array.from({ length: student.flaggedPosts }, (_, index) => ({
    id: `${student.alias}-flag-${index}`,
    room: index % 2 === 0 ? "Portfolio Lab" : "Market Moves",
    status: "Needs review",
    when: index === 0 ? "Today" : "This week",
    body:
      index % 2 === 0
        ? `${student.alias} used language that should be reviewed before the post remains visible to classmates.`
        : `${student.alias} made a peer reply that was automatically queued for teacher review.`,
    context: `Flagged item ${index + 1} of ${
      student.flaggedPosts
    } for ${className}.`,
  }));
}

function AdminPolicy({
  title,
  detail,
  enabled,
}: {
  title: string;
  detail: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      <Switch checked={enabled} aria-label={title} />
    </div>
  );
}

function DecisionTile({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#e8f0ed] text-[#28666e]">
        {icon}
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function StackItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/8 p-3">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-white/70">{detail}</p>
    </div>
  );
}
