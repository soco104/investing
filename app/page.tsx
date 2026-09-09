"use client";

import {
  Banknote,
  BookOpenCheck,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  ChevronRight,
  Eye,
  EyeOff,
  FilePenLine,
  Gauge,
  GraduationCap,
  Landmark,
  LineChart,
  LockKeyhole,
  Mail,
  Medal,
  MessageCircle,
  PiggyBank,
  Play,
  Plus,
  Save,
  School,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Send,
  Target,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";

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

const allocation = [
  { name: "Index stocks", value: 44, color: "#28666e" },
  { name: "Roth IRA", value: 24, color: "#f2a541" },
  { name: "Retirement", value: 20, color: "#7c9885" },
  { name: "IPO lab", value: 6, color: "#c44536" },
  { name: "Cash buffer", value: 6, color: "#5c677d" },
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

type StudentQuest = {
  title: string;
  concept: string;
  points: number;
  progress: number;
  status: string;
  objective: string;
  scenario: string;
  marketSetup?: string;
  portfolioTask: string;
  steps: string[];
  visibleScoring: Array<{ label: string; points: number }>;
  deliverable: string;
};

const missions: StudentQuest[] = [
  {
    title: "Build a first budget",
    concept: "Needs, wants, savings",
    points: 140,
    progress: 90,
    status: "Ready to submit",
    objective:
      "Create a simple monthly plan that covers needs first, sets aside savings, and leaves room for one want.",
    scenario:
      "You earned $120 from weekend work and need to plan how it moves through your wallet before investing anything.",
    portfolioTask:
      "Move money into cash buffer, savings goal, and long-term investing buckets.",
    steps: [
      "Sort the expenses into needs, wants, and savings.",
      "Keep at least 20% in savings before choosing investments.",
      "Explain one tradeoff you made and why it fits your goal.",
    ],
    visibleScoring: [
      { label: "Budget covers required expenses", points: 45 },
      { label: "Savings choice supports the goal", points: 45 },
      { label: "Reflection explains the tradeoff", points: 50 },
    ],
    deliverable: "Submit your budget split and one short reflection.",
  },
  {
    title: "Ride out a market drop",
    concept: "Risk and diversification",
    points: 210,
    progress: 68,
    status: "In progress",
    objective:
      "Use diversification to respond to market volatility without chasing short-term panic decisions.",
    scenario:
      "Growth stocks fell this week, but bonds and cash stayed steadier. Your goal is still five years away.",
    marketSetup:
      "Watchlist: SPY, QQQ, BND. Scenario window: 10 trading days after a broad market dip.",
    portfolioTask:
      "Rebalance the simulated portfolio while keeping risk aligned with the goal timeline.",
    steps: [
      "Review how each asset moved during the market day.",
      "Choose whether to rebalance, hold, or move more into cash.",
      "Explain how diversification changed the portfolio outcome.",
    ],
    visibleScoring: [
      { label: "Identifies which assets changed risk", points: 60 },
      { label: "Decision fits the five-year goal", points: 70 },
      { label: "Reflection uses portfolio evidence", points: 80 },
    ],
    deliverable: "Submit your portfolio choice and risk explanation.",
  },
  {
    title: "Open the Roth IRA lab",
    concept: "Earned income and tax growth",
    points: 180,
    progress: 42,
    status: "Next lesson",
    objective:
      "Compare a regular investing account with a Roth IRA simulation and explain why eligibility matters.",
    scenario:
      "You earned summer income and can choose how much to place in a retirement lab for long-term growth.",
    marketSetup:
      "Watchlist: VTI, VXUS, BND. Time horizon: one school quarter projected into retirement.",
    portfolioTask:
      "Allocate simulated earned income between spending, savings, and the Roth IRA lab.",
    steps: [
      "Confirm the money came from earned income in the scenario.",
      "Choose a contribution amount that still leaves short-term savings.",
      "Compare taxable growth with Roth IRA qualified growth.",
    ],
    visibleScoring: [
      { label: "Understands earned income eligibility", points: 50 },
      { label: "Contribution choice keeps a balanced plan", points: 55 },
      { label: "Explains long-term tax-free growth", points: 75 },
    ],
    deliverable: "Submit your Roth IRA lab contribution and comparison.",
  },
];

const marketWatch = [
  { ticker: "SPY", label: "S&P 500 ETF", move: "+0.7%", tone: "up" },
  { ticker: "QQQ", label: "Growth ETF", move: "-0.4%", tone: "down" },
  { ticker: "BND", label: "Bond ETF", move: "+0.2%", tone: "up" },
  { ticker: "IPO", label: "IPO basket", move: "+1.9%", tone: "up" },
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
};

type ConversationMessage = {
  id: string;
  sender: string;
  role: "Student" | "Teacher";
  body: string;
  sentAt: string;
  flagged?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  participants: string;
  kind: "Teacher" | "Classmate" | "Discussion";
  unread: number;
  messages: ConversationMessage[];
};

const initialTeacherQuests: TeacherQuest[] = [
  {
    id: "quest-diversification-drop",
    title: "Ride out a market drop",
    objective:
      "Students rebalance a simulated portfolio after a broad market dip and explain how diversification changes risk.",
    marketMode: "scenario",
    marketSymbols: "SPY, QQQ, BND",
    marketWindow: "10 trading days",
    requireReflection: true,
    scoreVisibility: "summary",
    criteria: [
      {
        id: "risk-explanation",
        label: "Explains risk tradeoffs using evidence",
        points: 40,
        visibleToStudents: true,
      },
      {
        id: "rebalance-choice",
        label: "Maintains diversified allocation after volatility",
        points: 35,
        visibleToStudents: false,
      },
      {
        id: "reflection-quality",
        label: "Connects decision to long-term goal",
        points: 25,
        visibleToStudents: true,
      },
    ],
    status: "Assigned",
    assigned: 31,
    submitted: 22,
    avgScore: 84,
    flagged: 3,
  },
  {
    id: "quest-roth-lab",
    title: "Open the Roth IRA lab",
    objective:
      "Students compare taxable investing with a Roth IRA simulation after earning summer income.",
    marketMode: "watchlist",
    marketSymbols: "VTI, VXUS, BND",
    marketWindow: "1 school quarter",
    requireReflection: true,
    scoreVisibility: "hidden",
    criteria: [
      {
        id: "eligibility",
        label: "Identifies earned income eligibility",
        points: 30,
        visibleToStudents: false,
      },
      {
        id: "compound-growth",
        label: "Models compound growth over time",
        points: 45,
        visibleToStudents: true,
      },
      {
        id: "tax-advantage",
        label: "Describes tax-free qualified growth",
        points: 25,
        visibleToStudents: false,
      },
    ],
    status: "Draft",
    assigned: 0,
    submitted: 0,
    avgScore: 0,
    flagged: 0,
  },
];

const initialInboxConversations: Conversation[] = [
  {
    id: "teacher-risk-feedback",
    title: "Ms. Rivera",
    participants: "Avery and Ms. Rivera",
    kind: "Teacher",
    unread: 1,
    messages: [
      {
        id: "msg-1",
        sender: "Ms. Rivera",
        role: "Teacher",
        body: "Your market-drop reflection is on the right track. Add one sentence about why bonds moved less than growth stocks.",
        sentAt: "9:12 AM",
      },
      {
        id: "msg-2",
        sender: "Avery",
        role: "Student",
        body: "Got it. I can add that before I submit the quest.",
        sentAt: "9:18 AM",
      },
    ],
  },
  {
    id: "teacher-roth-lab",
    title: "Roth IRA Lab Help",
    participants: "Avery and Mr. Chen",
    kind: "Teacher",
    unread: 0,
    messages: [
      {
        id: "msg-5",
        sender: "Mr. Chen",
        role: "Teacher",
        body: "Remember that the Roth IRA lab uses earned income from the scenario. The app is not opening a real account.",
        sentAt: "Mon",
      },
    ],
  },
];

const initialDiscussionRooms: Conversation[] = [
  {
    id: "class-budget-team",
    title: "Budget Quest Team",
    participants: "Avery, Jordan, Maya",
    kind: "Discussion",
    unread: 0,
    messages: [
      {
        id: "msg-3",
        sender: "Maya",
        role: "Student",
        body: "I put 20% in savings first, then split the rest between food and the concert goal.",
        sentAt: "Yesterday",
      },
      {
        id: "msg-4",
        sender: "Jordan",
        role: "Student",
        body: "That helped me see why the emergency fund comes before extra investing.",
        sentAt: "Yesterday",
      },
    ],
  },
  {
    id: "market-drop-room",
    title: "Market Drop Discussion",
    participants: "Grade 7 Finance",
    kind: "Discussion",
    unread: 2,
    messages: [
      {
        id: "msg-6",
        sender: "Ms. Rivera",
        role: "Teacher",
        body: "What did you notice about the portfolio that held bonds during the market drop?",
        sentAt: "8:55 AM",
      },
      {
        id: "msg-7",
        sender: "Leo",
        role: "Student",
        body: "It did not grow as fast before, but it lost less when growth stocks dropped.",
        sentAt: "9:03 AM",
      },
    ],
  },
];

const blockedTerms = [
  "asshole",
  "bitch",
  "crap",
  "damn",
  "fuck",
  "hell",
  "shit",
];

function containsProfanity(message: string) {
  const normalized = message.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  return blockedTerms.some((term) =>
    new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
      normalized
    )
  );
}

const implementation = [
  "Single student profile across web, iOS, and Android",
  "Teacher roster, assignments, and concept mastery reports",
  "District privacy controls aligned to FERPA and COPPA workflows",
  "Market data provider layer for delayed or classroom-safe quotes",
  "Simulated portfolios with no real-money transactions",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("student");
  const [scenarioDay, setScenarioDay] = useState(0);
  const [goalBoost, setGoalBoost] = useState(0);
  const [teacherQuests, setTeacherQuests] =
    useState<TeacherQuest[]>(initialTeacherQuests);
  const [selectedQuestId, setSelectedQuestId] = useState(
    initialTeacherQuests[0].id
  );
  const [draftQuest, setDraftQuest] = useState<TeacherQuest>(
    initialTeacherQuests[0]
  );
  const [inboxConversations, setInboxConversations] = useState<Conversation[]>(
    initialInboxConversations
  );
  const [discussionRooms, setDiscussionRooms] = useState<Conversation[]>(
    initialDiscussionRooms
  );
  const [selectedInboxId, setSelectedInboxId] = useState(
    initialInboxConversations[0].id
  );
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(
    initialDiscussionRooms[0].id
  );
  const [inboxDraft, setInboxDraft] = useState("");
  const [discussionDraft, setDiscussionDraft] = useState("");
  const [inboxWarning, setInboxWarning] = useState("");
  const [discussionWarning, setDiscussionWarning] = useState("");

  const portfolio = useMemo(
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

  const latestValue = portfolio[portfolio.length - 1].value;
  const totalGrowth = Math.round(
    ((latestValue - portfolio[0].value) / portfolio[0].value) * 100
  );
  const readinessScore = Math.min(98, 71 + scenarioDay * 3 + goalBoost);
  const selectedQuest =
    teacherQuests.find((quest) => quest.id === selectedQuestId) ??
    teacherQuests[0];
  const hiddenRuleCount = draftQuest.criteria.filter(
    (criterion) => !criterion.visibleToStudents
  ).length;
  const draftPoints = draftQuest.criteria.reduce(
    (total, criterion) => total + criterion.points,
    0
  );
  const selectedInboxConversation =
    inboxConversations.find((conversation) => conversation.id === selectedInboxId) ??
    inboxConversations[0];
  const selectedDiscussionRoom =
    discussionRooms.find((room) => room.id === selectedDiscussionId) ??
    discussionRooms[0];

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
  }

  function createBlankQuest() {
    const nextQuest: TeacherQuest = {
      id: `quest-${Date.now()}`,
      title: "New learning quest",
      objective:
        "Students will make a simulated financial decision and justify it with evidence.",
      marketMode: "none",
      marketSymbols: "",
      marketWindow: "No market window",
      requireReflection: true,
      scoreVisibility: "hidden",
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
    };

    setSelectedQuestId(nextQuest.id);
    setDraftQuest(nextQuest);
  }

  function saveDraftQuest() {
    setTeacherQuests((quests) => {
      const exists = quests.some((quest) => quest.id === draftQuest.id);

      if (exists) {
        return quests.map((quest) =>
          quest.id === draftQuest.id ? draftQuest : quest
        );
      }

      return [draftQuest, ...quests];
    });
    setSelectedQuestId(draftQuest.id);
  }

  function sendInboxMessage() {
    const trimmedMessage = inboxDraft.trim();

    if (!trimmedMessage) {
      return;
    }

    if (containsProfanity(trimmedMessage)) {
      setInboxWarning(
        "Message blocked. Rewrite it using respectful classroom language."
      );
      return;
    }

    setInboxConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === selectedInboxId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: "Avery",
                  role: "Student",
                  body: trimmedMessage,
                  sentAt: "Just now",
                },
              ],
            }
          : conversation
      )
    );
    setInboxDraft("");
    setInboxWarning("");
  }

  function sendDiscussionMessage() {
    const trimmedMessage = discussionDraft.trim();

    if (!trimmedMessage) {
      return;
    }

    if (containsProfanity(trimmedMessage)) {
      setDiscussionWarning(
        "Message blocked. Rewrite it using respectful classroom language."
      );
      return;
    }

    setDiscussionRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === selectedDiscussionId
          ? {
              ...room,
              messages: [
                ...room.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: "Avery",
                  role: "Student",
                  body: trimmedMessage,
                  sentAt: "Just now",
                },
              ],
            }
          : room
      )
    );
    setDiscussionDraft("");
    setDiscussionWarning("");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                District MVP
              </p>
              <h1 className="text-xl font-semibold tracking-normal">
                FutureFund Classroom
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-[#e8f0ed] px-3 py-1 text-[#24493f] hover:bg-[#e8f0ed]">
              Grade 7 pilot
            </Badge>
            <Badge className="rounded-md bg-[#fff3da] px-3 py-1 text-[#7a4b00] hover:bg-[#fff3da]">
              Simulated money
            </Badge>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#fff3da] text-[#7a4b00]">
              <GraduationCap className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Avery Johnson</p>
              <p className="text-sm text-muted-foreground">
                Lincoln Middle School
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <Metric label="Financial readiness" value={`${readinessScore}%`} />
            <Metric label="Learning streak" value="12 days" />
            <Metric label="Teacher assigned quests" value="3 active" />
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/45 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Profile sync</span>
              <LockKeyhole className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              One student record stores portfolio progress, lesson evidence,
              classroom assignments, and device sessions.
            </p>
          </div>
        </aside>

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
            <TabsList className="h-auto flex-wrap justify-start rounded-lg bg-muted p-1">
              <TabsTrigger value="student" className="min-h-9 px-3">
                Student
              </TabsTrigger>
              <TabsTrigger value="inbox" className="min-h-9 px-3">
                Inbox
              </TabsTrigger>
              <TabsTrigger value="discussion" className="min-h-9 px-3">
                Discussion
              </TabsTrigger>
              <TabsTrigger value="teacher" className="min-h-9 px-3">
                Teacher
              </TabsTrigger>
              <TabsTrigger value="district" className="min-h-9 px-3">
                District
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="student" className="mt-6 space-y-6">
            {activeTab === "student" ? (
              <>
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<WalletCards className="size-5" />}
                label="Portfolio value"
                value={`$${latestValue.toLocaleString()}`}
                detail={`${totalGrowth}% total growth`}
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
                  <AllocationDonut />
                </div>
                <div className="grid gap-2">
                  {allocation.map((item) => (
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
                <div className="space-y-4">
                  {missions.map((mission) => (
                    <Dialog key={mission.title}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-border bg-background p-4 text-left transition hover:border-[#28666e] hover:bg-[#f7fbf9] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{mission.title}</h4>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {mission.concept}
                              </p>
                            </div>
                            <Badge variant="outline" className="rounded-md">
                              {mission.points} pts
                            </Badge>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex justify-between text-sm">
                              <span>{mission.status}</span>
                              <span>{mission.progress}%</span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2 bg-[#e8f0ed]"
                            />
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#28666e]">
                            Open quest
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </div>
                        </button>
                      </DialogTrigger>
                      <StudentQuestDialog mission={mission} />
                    </Dialog>
                  ))}
                </div>
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
                  <div className="flex items-center gap-2 font-medium text-[#5b3f0b]">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Student-safe market feed
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
            ) : null}
          </TabsContent>

          <TabsContent value="inbox" className="mt-6 space-y-6">
            {activeTab === "inbox" ? (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  <SummaryCard
                    icon={<Mail className="size-5" />}
                    label="Inbox"
                    value={`${inboxConversations.reduce(
                      (total, conversation) => total + conversation.unread,
                      0
                    )} unread`}
                    detail="Messages for Avery Johnson"
                  />
                  <SummaryCard
                    icon={<ShieldCheck className="size-5" />}
                    label="Safety filter"
                    value="On"
                    detail="Text-only messages"
                  />
                  <SummaryCard
                    icon={<MessageCircle className="size-5" />}
                    label="Direct threads"
                    value={`${inboxConversations.length}`}
                    detail="Teacher and approved peer chats"
                  />
                </section>

                <MessageWorkspace
                  conversations={inboxConversations}
                  draft={inboxDraft}
                  listDescription="Direct messages tied to this user profile."
                  listTitle="Profile inbox"
                  onClearWarning={() => setInboxWarning("")}
                  onDraftChange={setInboxDraft}
                  onSelectConversation={setSelectedInboxId}
                  onSend={sendInboxMessage}
                  selectedConversation={selectedInboxConversation}
                  selectedConversationId={selectedInboxId}
                  threadBadge="User profile"
                  warning={inboxWarning}
                />
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="discussion" className="mt-6 space-y-6">
            {activeTab === "discussion" ? (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  <SummaryCard
                    icon={<UsersRound className="size-5" />}
                    label="Discussion board"
                    value={`${discussionRooms.length} rooms`}
                    detail="Shared classroom spaces"
                  />
                  <SummaryCard
                    icon={<Mail className="size-5" />}
                    label="New posts"
                    value={`${discussionRooms.reduce(
                      (total, room) => total + room.unread,
                      0
                    )} unread`}
                    detail="Across Avery's classes"
                  />
                  <SummaryCard
                    icon={<ShieldCheck className="size-5" />}
                    label="Safety filter"
                    value="On"
                    detail="Text-only posts"
                  />
                </section>

                <MessageWorkspace
                  conversations={discussionRooms}
                  draft={discussionDraft}
                  listDescription="Shared classroom rooms for quest discussion."
                  listTitle="Discussion rooms"
                  onClearWarning={() => setDiscussionWarning("")}
                  onDraftChange={setDiscussionDraft}
                  onSelectConversation={setSelectedDiscussionId}
                  onSend={sendDiscussionMessage}
                  selectedConversation={selectedDiscussionRoom}
                  selectedConversationId={selectedDiscussionId}
                  threadBadge="Classroom room"
                  warning={discussionWarning}
                />
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="teacher" className="mt-6 space-y-6">
            {activeTab === "teacher" ? (
              <>
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<UsersRound className="size-5" />}
                label="Active students"
                value="128"
                detail="6 classes synced"
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
                value="74%"
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
                      onClick={saveDraftQuest}
                      className="bg-[#28666e] text-white hover:bg-[#22565d]"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Save draft
                    </Button>
                  </div>
                </div>

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
                      Track completion and review hidden scoring signals.
                    </p>
                  </div>
                  <Gauge className="size-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  {teacherQuests.map((quest) => (
                    <button
                      key={quest.id}
                      type="button"
                      onClick={() => loadQuest(quest)}
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
                        <QuestMonitorMetric label="Avg" value={`${quest.avgScore}%`} />
                        <QuestMonitorMetric
                          label="Hidden"
                          value={
                            quest.criteria.filter(
                              (criterion) => !criterion.visibleToStudents
                            ).length
                          }
                        />
                        <QuestMonitorMetric label="Review" value={quest.flagged} />
                      </div>
                    </button>
                  ))}
                </div>

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
                  <Button className="bg-[#28666e] text-white hover:bg-[#22565d]">
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
            ) : null}
          </TabsContent>

          <TabsContent value="district" className="mt-6 space-y-6">
            {activeTab === "district" ? (
              <>
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<School className="size-5" />}
                label="School rollout"
                value="3 schools"
                detail="Pilot-ready structure"
              />
              <SummaryCard
                icon={<ShieldCheck className="size-5" />}
                label="Privacy posture"
                value="FERPA"
                detail="COPPA-aware student flows"
              />
              <SummaryCard
                icon={<Building2 className="size-5" />}
                label="Integrations"
                value="API layer"
                detail="Market data and SSO ready"
              />
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
                      Admins manage district templates and review how teachers
                      use hidden scoring.
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
                    {teacherQuests.map((quest) => (
                      <TableRow key={quest.id}>
                        <TableCell className="font-medium">{quest.title}</TableCell>
                        <TableCell>Grade 7 Finance</TableCell>
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
            ) : null}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function StudentQuestDialog({ mission }: { mission: StudentQuest }) {
  return (
    <DialogContent className="max-h-[min(88vh,760px)] overflow-y-auto sm:max-w-3xl">
      <DialogHeader className="pr-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-md bg-[#e8f0ed] text-[#24493f] hover:bg-[#e8f0ed]">
            {mission.concept}
          </Badge>
          <Badge variant="outline" className="rounded-md">
            {mission.points} pts
          </Badge>
          <Badge variant="outline" className="rounded-md">
            {mission.status}
          </Badge>
        </div>
        <DialogTitle className="text-2xl leading-tight">
          {mission.title}
        </DialogTitle>
        <DialogDescription className="text-base leading-7">
          {mission.objective}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">Scenario</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {mission.scenario}
            </p>
          </div>

          {mission.marketSetup ? (
            <div className="rounded-lg border border-border bg-[#f7f2e8] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#5b3f0b]">
                <LineChart className="size-5" />
                <h3 className="font-semibold">Market setup</h3>
              </div>
              <p className="text-sm leading-6 text-[#6c5524]">
                {mission.marketSetup}
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <WalletCards className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">Portfolio task</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {mission.portfolioTask}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">Steps</h3>
            </div>
            <ol className="space-y-3">
              {mission.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#e8f0ed] text-xs font-semibold text-[#24493f]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">Progress</h3>
              <span className="text-sm font-medium">{mission.progress}%</span>
            </div>
            <Progress value={mission.progress} className="h-2 bg-[#e8f0ed]" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Medal className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">How you earn points</h3>
            </div>
            <div className="space-y-3">
              {mission.visibleScoring.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-start justify-between gap-3 rounded-md bg-muted/55 p-3 text-sm"
                >
                  <span className="leading-5">{rule.label}</span>
                  <span className="shrink-0 font-semibold">{rule.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <FilePenLine className="size-5 text-[#28666e]" />
              <h3 className="font-semibold">Turn in</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {mission.deliverable}
            </p>
          </div>
        </aside>
      </div>

      <DialogFooter showCloseButton>
        <Button className="bg-[#28666e] text-white hover:bg-[#22565d]">
          {mission.progress > 0 ? "Continue quest" : "Start quest"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function MessageWorkspace({
  conversations,
  selectedConversation,
  selectedConversationId,
  listTitle,
  listDescription,
  threadBadge,
  draft,
  warning,
  onSelectConversation,
  onDraftChange,
  onClearWarning,
  onSend,
}: {
  conversations: Conversation[];
  selectedConversation: Conversation;
  selectedConversationId: string;
  listTitle: string;
  listDescription: string;
  threadBadge: string;
  draft: string;
  warning: string;
  onSelectConversation: (conversationId: string) => void;
  onDraftChange: (message: string) => void;
  onClearWarning: () => void;
  onSend: () => void;
}) {
  const composerId = `${selectedConversation.id}-message`;

  return (
    <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{listTitle}</h3>
            <p className="text-sm text-muted-foreground">{listDescription}</p>
          </div>
          <MessageCircle className="size-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                onSelectConversation(conversation.id);
                onClearWarning();
              }}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedConversationId === conversation.id
                  ? "border-[#28666e] bg-[#e8f0ed]"
                  : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{conversation.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {conversation.participants}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-md bg-card">
                  {conversation.kind}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {conversation.messages.at(-1)?.sentAt}
                </span>
                {conversation.unread > 0 ? (
                  <span className="rounded-md bg-[#28666e] px-2 py-1 text-xs font-semibold text-white">
                    {conversation.unread} new
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-[#28666e]" />
                <h3 className="text-lg font-semibold">
                  {selectedConversation.title}
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedConversation.participants}
              </p>
            </div>
            <Badge className="rounded-md bg-[#fff3da] text-[#7a4b00] hover:bg-[#fff3da]">
              {threadBadge}
            </Badge>
          </div>
        </div>

        <div className="max-h-[430px] space-y-4 overflow-y-auto p-4 sm:p-5">
          {selectedConversation.messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[82%] rounded-lg border p-4 ${
                message.sender === "Avery"
                  ? "ml-auto border-[#28666e]/20 bg-[#e8f0ed]"
                  : "border-border bg-background"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold">{message.sender}</span>
                <Badge variant="outline" className="rounded-md bg-card">
                  {message.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {message.sentAt}
                </span>
              </div>
              <p className="text-sm leading-6">{message.body}</p>
            </article>
          ))}
        </div>

        <div className="border-t border-border p-4 sm:p-5">
          {warning ? (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#c44536]/30 bg-[#fff0ed] p-3 text-sm text-[#8a3025]">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{warning}</span>
            </div>
          ) : null}

          <Label htmlFor={composerId}>Message</Label>
          <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Textarea
              id={composerId}
              value={draft}
              onChange={(event) => {
                onDraftChange(event.target.value);
                if (warning) {
                  onClearWarning();
                }
              }}
              placeholder="Write a respectful classroom message..."
              className="min-h-20 resize-none"
            />
            <Button
              type="button"
              onClick={onSend}
              className="h-full min-h-11 bg-[#28666e] text-white hover:bg-[#22565d]"
            >
              <Send className="size-4" aria-hidden="true" />
              Send
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Messages are limited to text and checked before sending.
          </div>
        </div>
      </div>
    </section>
  );
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

function AllocationDonut() {
  const stops = allocation
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
          <span className="text-2xl font-semibold">5</span>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
