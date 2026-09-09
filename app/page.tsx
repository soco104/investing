"use client";

import {
  Banknote,
  BookOpenCheck,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
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
  Send,
  Target,
  TrendingUp,
  TriangleAlert,
  Trash2,
  Upload,
  UserCog,
  UsersRound,
  WalletCards,
  Wrench,
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

type AdminPage =
  | "overview"
  | "schools"
  | "integrations"
  | "privacy"
  | "users"
  | "permissions"
  | "support"
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

type SupportCase = {
  id: string;
  summary: string;
  requester: string;
  category: string;
  status: "Pending support" | "Pending user";
  createdAt: string;
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
    title: "Market APIs",
    detail: "Connect data providers, test quote health, and set classroom-safe feeds.",
    status: "Mock live",
    icon: PlugZap,
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
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("student");
  const [activeStudentPage, setActiveStudentPage] = useState<
    "dashboard" | "portfolio" | "profile"
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
  const [portfolioAdjustment, setPortfolioAdjustment] = useState("25");
  const [portfolioCorrectionReason, setPortfolioCorrectionReason] = useState(
    "Teacher-approved correction"
  );
  const [portfolioCorrectionNotice, setPortfolioCorrectionNotice] = useState("");
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
  const [activeAdminPage, setActiveAdminPage] =
    useState<AdminPage>("overview");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [userClassFilter, setUserClassFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userImportNotice, setUserImportNotice] = useState("");
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
  const [privacyPosture, setPrivacyPosture] = useState("standard");
  const [privacyContact, setPrivacyContact] = useState(
    "privacy@lincolnusd.edu"
  );

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
  const activeRole =
    roleOptions.find((role) => role.value === activeTab) ?? roleOptions[0];
  const inboxUnread = inboxConversations.reduce(
    (total, conversation) => total + conversation.unread,
    0
  );
  const discussionUnread = discussionRooms.reduce(
    (total, room) => total + room.unread,
    0
  );
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

  function updateUserAlias(userId: string, alias: string) {
    setAdminUsers((users) =>
      users.map((user) => (user.id === userId ? { ...user, alias } : user))
    );
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

    const title = `${user.firstName} ${user.lastName}`;
    const existingConversation = inboxConversations.find(
      (conversation) => conversation.title === title
    );

    if (existingConversation) {
      setSelectedInboxId(existingConversation.id);
    } else {
      const conversationId = `conversation-${Date.now()}`;

      setInboxConversations((currentConversations) => [
        {
          id: conversationId,
          title,
          participants: `Avery and ${user.alias}`,
          kind: user.role === "Teacher" ? "Teacher" : "Classmate",
          unread: 0,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: "System",
              role: "Teacher",
              body: `New text-only message thread opened with ${user.alias}.`,
              sentAt: "Just now",
            },
          ],
        },
        ...currentConversations,
      ]);
      setSelectedInboxId(conversationId);
    }

    setActiveTab("inbox");
    setActiveStudentPage("dashboard");
  }

  function exportLearningQuests() {
    setQuestTransferText(JSON.stringify(teacherQuests, null, 2));
    setQuestTransferNotice("Learning quests exported as JSON.");
  }

  function importLearningQuests() {
    try {
      const parsed = JSON.parse(questTransferText) as TeacherQuest | TeacherQuest[];
      const importedQuests = Array.isArray(parsed) ? parsed : [parsed];
      const normalizedQuests = importedQuests.map((quest) => ({
        ...quest,
        id: `${quest.id || "quest"}-${Date.now()}`,
        status: "Draft" as const,
      }));

      setTeacherQuests((quests) => [...normalizedQuests, ...quests]);
      setQuestTransferNotice(`${normalizedQuests.length} learning quest imported.`);
    } catch {
      setQuestTransferNotice("Import failed. Paste valid learning quest JSON.");
    }
  }

  function toggleUserEnabled(userId: string, enabled: boolean) {
    setAdminUsers((users) =>
      users.map((user) => (user.id === userId ? { ...user, enabled } : user))
    );
  }

  function updateUserPermission(
    userId: string,
    permission: keyof AdminUser["permissions"],
    enabled: boolean
  ) {
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

  function importUsersFromCsv(csvText: string) {
    const importedUsers = parseUsersCsv(csvText);

    if (!importedUsers.length) {
      setUserImportNotice(
        "No users imported. Check that the CSV includes at least an email column."
      );
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

  function createSupportCase() {
    const trimmedSummary = supportSummary.trim();

    if (!trimmedSummary) {
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

  function triggerPasswordReset() {
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      setResetNotice("Enter a user email to trigger a reset.");
      return;
    }

    setResetNotice(`Password reset sent to ${trimmedEmail}. SSO comes later.`);
    setResetEmail("");
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

  function addSchool() {
    const trimmedName = schoolName.trim();
    const trimmedDistrict = schoolDistrict.trim();
    const parsedClasses = Number.parseInt(schoolClassCount, 10);
    const parsedStudents = Number.parseInt(schoolStudentCount, 10);

    if (!trimmedName || !trimmedDistrict) {
      return;
    }

    setSchools((currentSchools) => [
      ...currentSchools,
      {
        id: `school-${Date.now()}`,
        name: trimmedName,
        district: trimmedDistrict,
        state: schoolState.trim() || "CA",
        classes: Number.isNaN(parsedClasses) ? 0 : Math.max(0, parsedClasses),
        students: Number.isNaN(parsedStudents) ? 0 : Math.max(0, parsedStudents),
        status: "Setup",
      },
    ]);
    setSchoolName("");
    setSchoolClassCount("0");
    setSchoolStudentCount("0");
  }

  function deleteSchool(schoolId: string) {
    setSchools((currentSchools) =>
      currentSchools.filter((school) => school.id !== schoolId)
    );
  }

  function addMarketIntegration() {
    const trimmedProvider = integrationProvider.trim();
    const trimmedEndpoint = integrationEndpoint.trim();
    const trimmedSymbols = integrationSymbols.trim();

    if (!trimmedProvider || !trimmedEndpoint) {
      return;
    }

    setMarketIntegrations((currentIntegrations) => [
      ...currentIntegrations,
      {
        id: `integration-${Date.now()}`,
        provider: trimmedProvider,
        endpoint: trimmedEndpoint,
        tokenRequired: integrationTokenRequired,
        token: integrationToken.trim(),
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
      },
    ]);
    setIntegrationProvider("");
    setIntegrationEndpoint("/api/market");
    setIntegrationToken("");
    setIntegrationTokenRequired(false);
    setIntegrationPollingFrequency("15 minutes");
    setIntegrationTargetClass(classOptions[0]);
    setIntegrationSymbols("");
  }

  function toggleMarketIntegration(integrationId: string, enabled: boolean) {
    setMarketIntegrations((currentIntegrations) =>
      currentIntegrations.map((integration) =>
        integration.id === integrationId
          ? { ...integration, enabled, status: enabled ? "Connected" : "Needs key" }
          : integration
      )
    );
  }

  function deleteMarketIntegration(integrationId: string) {
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

  function updateAllocationTarget(name: string, value: number) {
    setAllocationTargets((currentTargets) =>
      currentTargets.map((target) =>
        target.name === name ? { ...target, value } : target
      )
    );
  }

  function saveAllocationChange() {
    setPortfolioActivity((currentActivity) => [
      {
        id: `activity-${Date.now()}`,
        date: "Today",
        action: "Allocation",
        vehicle: "Portfolio",
        amount: `${allocationTotal}%`,
        note:
          allocationTotal === 100
            ? "Saved a balanced target mix"
            : "Saved draft targets for teacher review",
      },
      ...currentActivity,
    ]);
  }

  function applyPortfolioCorrection() {
    const adjustment = Number.parseFloat(portfolioAdjustment);

    if (Number.isNaN(adjustment) || !portfolioCorrectionReason.trim()) {
      setPortfolioCorrectionNotice("Enter an adjustment and audit reason.");
      return;
    }

    setGoalBoost((value) => Math.max(0, value + Math.round(adjustment / 5)));
    setPortfolioActivity((currentActivity) => [
      {
        id: `correction-${Date.now()}`,
        date: "Today",
        action: "Correction",
        vehicle: "Portfolio",
        amount: `${adjustment >= 0 ? "+" : "-"}$${Math.abs(adjustment).toFixed(2)}`,
        note: portfolioCorrectionReason.trim(),
      },
      ...currentActivity,
    ]);
    setPortfolioCorrectionNotice("Portfolio correction applied and logged.");
  }

  function openAdminModule(title: string) {
    const targets: Record<string, AdminPage> = {
      Users: "users",
      Permissions: "permissions",
      Support: "support",
      "Market APIs": "integrations",
      "Portfolio corrections": "portfolio-corrections",
    };

    const target = targets[title];

    if (target) {
      setActiveAdminPage(target);
    }
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
                School platform MVP
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
                <TabsTrigger value="student" className="min-h-9 px-3">
                  Home
                </TabsTrigger>
                <TabsTrigger value="inbox" className="min-h-9 px-3">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="discussion" className="min-h-9 px-3">
                  Discussion
                </TabsTrigger>
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
                  {roleOptions.map((role) => (
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
                    onSaveAllocation={saveAllocationChange}
                    onUpdateAllocation={updateAllocationTarget}
                    portfolio={portfolio}
                    totalGrowth={totalGrowth}
                  />
                ) : activeStudentPage === "profile" ? (
                  <UserProfilePage
                    activity={portfolioActivity}
                    allocationTargets={allocationTargets}
                    inboxConversations={inboxConversations}
                    latestValue={latestValue}
                    onBack={() => setActiveStudentPage("dashboard")}
                    onMessage={messageUser}
                    portfolio={portfolio}
                    quests={teacherQuests}
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
                )}
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

          <TabsContent value="admin" className="mt-6 space-y-6">
            {activeTab === "admin" ? (
              <>
                {activeAdminPage !== "overview" ? (
                  <AdminDrilldown
                    activePage={activeAdminPage}
                    adminUsers={adminUsers}
                    filteredAdminUsers={filteredAdminUsers}
                    integrationEndpoint={integrationEndpoint}
                    integrationProvider={integrationProvider}
                    integrationPollingFrequency={integrationPollingFrequency}
                    integrationSymbols={integrationSymbols}
                    integrationTargetClass={integrationTargetClass}
                    integrationToken={integrationToken}
                    integrationTokenRequired={integrationTokenRequired}
                    marketIntegrations={marketIntegrations}
                    onApplyPortfolioCorrection={applyPortfolioCorrection}
                    onAddIntegration={addMarketIntegration}
                    onAddSchool={addSchool}
                    onBack={() => setActiveAdminPage("overview")}
                    onCreateSupportCase={createSupportCase}
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
                    onPrivacyContactChange={setPrivacyContact}
                    onPrivacyPostureChange={setPrivacyPosture}
                    onPortfolioAdjustmentChange={setPortfolioAdjustment}
                    onPortfolioCorrectionReasonChange={
                      setPortfolioCorrectionReason
                    }
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
                    onTestIntegration={testMarketIntegration}
                    onToggleIntegration={toggleMarketIntegration}
                    onToggleUserEnabled={toggleUserEnabled}
                    privacyContact={privacyContact}
                    privacyPosture={privacyPosture}
                    portfolioAdjustment={portfolioAdjustment}
                    portfolioCorrectionNotice={portfolioCorrectionNotice}
                    portfolioCorrectionReason={portfolioCorrectionReason}
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
                  module.title === "Password resets" ? (
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
                            Trigger a reset email for a user. SSO reset routing
                            will be added later.
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
}: {
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
              Simulated holdings, recent changes, and allocation targets for
              Avery Johnson.
            </p>
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
              onClick={onSaveAllocation}
              className="bg-[#28666e] text-white hover:bg-[#22565d]"
            >
              <Save className="size-4" aria-hidden="true" />
              Save allocation
            </Button>
          </div>
        </div>
      </section>
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
  inboxConversations,
  latestValue,
  totalGrowth,
  quests,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  portfolio: typeof basePortfolio;
  allocationTargets: typeof allocation;
  activity: PortfolioActivity[];
  inboxConversations: Conversation[];
  latestValue: number;
  totalGrowth: number;
  quests: TeacherQuest[];
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  if (user.role === "Teacher") {
    return (
      <TeacherProfilePage
        onBack={onBack}
        inboxConversations={inboxConversations}
        onMessage={onMessage}
        quests={quests}
        user={user}
      />
    );
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
  inboxConversations,
  onBack,
  onMessage,
}: {
  user: AdminUser;
  quests: TeacherQuest[];
  inboxConversations: Conversation[];
  onBack: () => void;
  onMessage: (userId: string) => void;
}) {
  const teacherInbox = inboxConversations.filter(
    (conversation) =>
      conversation.kind === "Teacher" ||
      conversation.participants.toLowerCase().includes(user.alias.toLowerCase()) ||
      conversation.title.toLowerCase().includes(user.lastName.toLowerCase())
  );

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

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Inbox</h3>
            <p className="text-sm text-muted-foreground">
              Recent text-only conversations connected to this teacher.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-md bg-background">
            {teacherInbox.reduce(
              (total, conversation) => total + conversation.unread,
              0
            )} unread
          </Badge>
        </div>
        <div className="grid gap-3">
          {teacherInbox.map((conversation) => {
            const latestMessage =
              conversation.messages[conversation.messages.length - 1];

            return (
              <div
                key={conversation.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{conversation.title}</p>
                    <Badge variant="outline" className="rounded-md bg-card">
                      {conversation.unread} unread
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {conversation.participants}
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {latestMessage?.body ?? "No messages yet."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onMessage(user.id)}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Message
                </Button>
              </div>
            );
          })}
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
  filteredAdminUsers,
  schools,
  schoolName,
  schoolDistrict,
  schoolState,
  schoolClassCount,
  schoolStudentCount,
  marketIntegrations,
  integrationProvider,
  integrationEndpoint,
  integrationTokenRequired,
  integrationToken,
  integrationPollingFrequency,
  integrationTargetClass,
  integrationSymbols,
  privacyPosture,
  selectedPrivacyPosture,
  privacyContact,
  selectedPermissionUser,
  supportCases,
  supportSummary,
  supportCategory,
  portfolioAdjustment,
  portfolioCorrectionReason,
  portfolioCorrectionNotice,
  questTransferText,
  questTransferNotice,
  userClassFilter,
  userImportNotice,
  userRoleFilter,
  onBack,
  onAddSchool,
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
  onIntegrationProviderChange,
  onIntegrationEndpointChange,
  onIntegrationTokenRequiredChange,
  onIntegrationTokenChange,
  onIntegrationPollingFrequencyChange,
  onIntegrationTargetClassChange,
  onIntegrationSymbolsChange,
  onImportUsers,
  onPrivacyPostureChange,
  onPrivacyContactChange,
  onSelectedPermissionUserChange,
  onToggleUserEnabled,
  onUpdateUserPermission,
  onUserClassFilterChange,
  onUserRoleFilterChange,
  onCreateSupportCase,
  onSupportSummaryChange,
  onSupportCategoryChange,
  onApplyPortfolioCorrection,
  onPortfolioAdjustmentChange,
  onPortfolioCorrectionReasonChange,
  onOpenUserProfile,
  onQuestExport,
  onQuestImport,
  onQuestTransferTextChange,
}: {
  activePage: AdminPage;
  adminUsers: AdminUser[];
  filteredAdminUsers: AdminUser[];
  schools: SchoolRecord[];
  schoolName: string;
  schoolDistrict: string;
  schoolState: string;
  schoolClassCount: string;
  schoolStudentCount: string;
  marketIntegrations: MarketIntegration[];
  integrationProvider: string;
  integrationEndpoint: string;
  integrationTokenRequired: boolean;
  integrationToken: string;
  integrationPollingFrequency: string;
  integrationTargetClass: string;
  integrationSymbols: string;
  privacyPosture: string;
  selectedPrivacyPosture: (typeof privacyPostures)[number];
  privacyContact: string;
  selectedPermissionUser: AdminUser;
  supportCases: SupportCase[];
  supportSummary: string;
  supportCategory: string;
  portfolioAdjustment: string;
  portfolioCorrectionReason: string;
  portfolioCorrectionNotice: string;
  questTransferText: string;
  questTransferNotice: string;
  userClassFilter: string;
  userImportNotice: string;
  userRoleFilter: string;
  onBack: () => void;
  onAddSchool: () => void;
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
  onIntegrationProviderChange: (provider: string) => void;
  onIntegrationEndpointChange: (endpoint: string) => void;
  onIntegrationTokenRequiredChange: (required: boolean) => void;
  onIntegrationTokenChange: (token: string) => void;
  onIntegrationPollingFrequencyChange: (frequency: string) => void;
  onIntegrationTargetClassChange: (className: string) => void;
  onIntegrationSymbolsChange: (symbols: string) => void;
  onImportUsers: (csvText: string) => void;
  onPrivacyPostureChange: (posture: string) => void;
  onPrivacyContactChange: (contact: string) => void;
  onSelectedPermissionUserChange: (userId: string) => void;
  onToggleUserEnabled: (userId: string, enabled: boolean) => void;
  onUpdateUserPermission: (
    userId: string,
    permission: keyof AdminUser["permissions"],
    enabled: boolean
  ) => void;
  onUserClassFilterChange: (className: string) => void;
  onUserRoleFilterChange: (role: string) => void;
  onCreateSupportCase: () => void;
  onSupportSummaryChange: (summary: string) => void;
  onSupportCategoryChange: (category: string) => void;
  onApplyPortfolioCorrection: () => void;
  onPortfolioAdjustmentChange: (amount: string) => void;
  onPortfolioCorrectionReasonChange: (reason: string) => void;
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
        : activePage === "privacy"
          ? "Privacy posture"
          : activePage === "users"
            ? "Users"
            : activePage === "permissions"
              ? "Permissions"
              : activePage === "support"
                ? "Support"
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

      {activePage === "privacy" ? (
        <PrivacyPostureAdminPage
          onPrivacyContactChange={onPrivacyContactChange}
          onPrivacyPostureChange={onPrivacyPostureChange}
          privacyContact={privacyContact}
          privacyPosture={privacyPosture}
          selectedPrivacyPosture={selectedPrivacyPosture}
        />
      ) : null}

      {activePage === "users" ? (
        <UsersAdminPage
          filteredUsers={filteredAdminUsers}
          importNotice={userImportNotice}
          onClassFilterChange={onUserClassFilterChange}
          onImportUsers={onImportUsers}
          onOpenProfile={onOpenUserProfile}
          onRoleFilterChange={onUserRoleFilterChange}
          onToggleUserEnabled={onToggleUserEnabled}
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
        <PortfolioCorrectionsAdminPage
          adjustment={portfolioAdjustment}
          notice={portfolioCorrectionNotice}
          onAdjustmentChange={onPortfolioAdjustmentChange}
          onApplyCorrection={onApplyPortfolioCorrection}
          onReasonChange={onPortfolioCorrectionReasonChange}
          reason={portfolioCorrectionReason}
        />
      ) : null}

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

function PrivacyPostureAdminPage({
  privacyPosture,
  selectedPrivacyPosture,
  privacyContact,
  onPrivacyPostureChange,
  onPrivacyContactChange,
}: {
  privacyPosture: string;
  selectedPrivacyPosture: (typeof privacyPostures)[number];
  privacyContact: string;
  onPrivacyPostureChange: (posture: string) => void;
  onPrivacyContactChange: (contact: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="space-y-2">
          <Label>Required privacy posture</Label>
          <Select value={privacyPosture} onValueChange={onPrivacyPostureChange}>
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
          <h4 className="font-semibold">{selectedPrivacyPosture.label}</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {selectedPrivacyPosture.description}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="privacy-contact">Privacy contact</Label>
          <Input
            id="privacy-contact"
            value={privacyContact}
            onChange={(event) => onPrivacyContactChange(event.target.value)}
          />
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
            enabled={privacyPosture !== "standard"}
            title="Enhanced audit"
          />
        </div>
      </div>
    </div>
  );
}

function UsersAdminPage({
  filteredUsers,
  selectedClass,
  selectedRole,
  importNotice,
  onClassFilterChange,
  onImportUsers,
  onOpenProfile,
  onRoleFilterChange,
  onToggleUserEnabled,
}: {
  filteredUsers: AdminUser[];
  selectedClass: string;
  selectedRole: string;
  importNotice: string;
  onClassFilterChange: (className: string) => void;
  onImportUsers: (csvText: string) => void;
  onOpenProfile: (userId: string) => void;
  onRoleFilterChange: (role: string) => void;
  onToggleUserEnabled: (userId: string, enabled: boolean) => void;
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
      <div className="grid gap-4 rounded-lg border border-border bg-background p-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div>
          <h4 className="font-semibold">Import users</h4>
          <p className="mt-1 text-sm text-muted-foreground">
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
          {importNotice ? (
            <p className="mt-2 text-sm text-muted-foreground">{importNotice}</p>
          ) : null}
        </div>
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

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[900px]">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
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

function PortfolioCorrectionsAdminPage({
  adjustment,
  reason,
  notice,
  onAdjustmentChange,
  onReasonChange,
  onApplyCorrection,
}: {
  adjustment: string;
  reason: string;
  notice: string;
  onAdjustmentChange: (amount: string) => void;
  onReasonChange: (reason: string) => void;
  onApplyCorrection: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Student</Label>
            <Input value="Avery Johnson" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correction-amount">Increase/decrease value</Label>
            <Input
              id="correction-amount"
              type="number"
              value={adjustment}
              onChange={(event) => onAdjustmentChange(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="correction-reason">Audit reason</Label>
          <Textarea
            id="correction-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={onApplyCorrection}
          className="mt-4 bg-[#28666e] text-white hover:bg-[#22565d]"
        >
          <WalletCards className="size-4" aria-hidden="true" />
          Apply correction
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-semibold">Correction guardrails</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Corrections affect simulated value only and should carry an audit
          reason before they are applied to the student portfolio history.
        </p>
        {notice ? (
          <p className="mt-4 rounded-md bg-[#e8f0ed] p-3 text-sm text-[#24493f]">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
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
