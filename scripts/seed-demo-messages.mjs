import { pathToFileURL } from "node:url";

import postgres from "postgres";

/**
 * Demo messages (v0.2.14): every demo inbox has something in it, there is
 * a discussion room per class, and there are flagged messages to review.
 * Fixed ids with "on conflict do nothing": existing rows are never touched,
 * so replies, Keep ticks and resolved flags survive a redeploy, and messages
 * the 90-day cleanup removed come back fresh on the next deploy.
 *
 * Called by seed-demo-data.mjs; can also be run by itself (the browser tests
 * do this) once the demo users exist.
 */
const ADMIN = "user-sam-gordon";

export async function seedDemoMessages(sql, now = new Date()) {
  const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const A = "7th Grade Finance A";
  const B = "7th Grade Finance B";
  const LAB = "8th Grade Investing Lab";
  const demoConversations = [
    {
      id: "demo-conv-avery-elena",
      people: ["user-avery", "user-elena-rivera"],
      messages: [
        ["user-avery", 50, "Hi Ms. Rivera, is the Budget Basics quest due this Friday?"],
        ["user-elena-rivera", 49, "Yes, Friday at 3 PM. You can keep editing your submission until then."],
        ["user-avery", 48, "Thanks! I will finish my reflection tonight."],
      ],
    },
    {
      id: "demo-conv-avery-noah",
      people: ["user-avery", "user-noah"],
      messages: [
        ["user-noah", 30, "Did you buy any BND today?"],
        ["user-avery", 29, "Not yet. I want to see what the market does first."],
        ["user-noah", 28, "Text me later and we can compare portfolios. My number is 555-201-0142.", "phone"],
      ],
    },
    {
      id: "demo-conv-sofia-elena",
      people: ["user-sofia", "user-elena-rivera"],
      messages: [
        ["user-sofia", 26, "Ms. Rivera, what is the difference between a stock fund and a bond fund?"],
        ["user-elena-rivera", 25, "Great question. Click SPY and then BND on the Market page and compare the descriptions. We will talk about it in class."],
      ],
    },
    {
      id: "demo-conv-maya-elena",
      people: ["user-maya", "user-elena-rivera"],
      messages: [
        ["user-elena-rivera", 40, "Maya, nice work explaining diversification in your quest."],
        ["user-maya", 39, "Thank you! Can I add a chart to my answer?"],
      ],
    },
    {
      id: "demo-conv-liam-maya",
      people: ["user-liam", "user-maya"],
      messages: [
        ["user-maya", 22, "I think VTI is a safer pick than IPO-LAB for the long run."],
        ["user-liam", 21, "Nobody likes your picks. You should just quit the class.", "unkind"],
      ],
    },
    {
      id: "demo-conv-jordan-elena",
      people: ["user-jordan", "user-elena-rivera"],
      messages: [
        ["user-jordan", 18, "Will the market be paused during the quiz tomorrow?"],
        ["user-elena-rivera", 17, "Yes. I will pause it at the start of class and resume it after the quiz."],
      ],
    },
    {
      id: "demo-conv-zoe-jordan",
      people: ["user-zoe", "user-jordan"],
      messages: [
        ["user-zoe", 12, "Want to work on the allocation quest together at lunch?"],
        ["user-jordan", 11, "Sure. I still need to pick my bond fund."],
      ],
    },
    {
      id: "demo-conv-elena-sam",
      people: ["user-elena-rivera", ADMIN],
      messages: [
        ["user-elena-rivera", 36, "Sam, could you add our district domain to the allowed email domains? I may need to forward a flagged message to the counselor."],
        [ADMIN, 35, "Will do. I am also reviewing the flag you forwarded from 7th Grade Finance B."],
      ],
    },
    {
      id: "demo-conv-demo-sam",
      people: ["user-demo-super", ADMIN],
      messages: [
        [ADMIN, 60, "Welcome to the demo. Use Assume role to look at the Student, Teacher and Admin views."],
        ["user-demo-super", 59, "Thanks. I will start with the Market page."],
      ],
    },
    {
      id: "demo-conv-demo-elena",
      people: ["user-demo-super", "user-elena-rivera"],
      messages: [
        ["user-elena-rivera", 8, "The flagged messages on my Teacher dashboard are examples. Try Resolve or Forward on one."],
      ],
    },
    {
      id: "demo-room-a",
      room: { className: A, title: "Week 3: Stocks or bonds?" },
      people: [],
      messages: [
        ["user-elena-rivera", 45, "This week's question: when would you choose a bond fund over a stock fund? Give one reason."],
        ["user-avery", 44, "Bonds move less, so I would pick them if I needed the money soon."],
        ["user-noah", 43, "Stocks can grow more over a long time, so I would pick them for something far away like college."],
        ["user-sofia", 42, "I would own both so one bad day does not hurt as much."],
      ],
    },
    {
      id: "demo-room-b",
      room: { className: B, title: "Market check-in" },
      people: [],
      messages: [
        ["user-elena-rivera", 34, "Post one thing you noticed about prices today."],
        ["user-maya", 33, "QQQ moved a lot more than BND."],
      ],
    },
    {
      id: "demo-room-lab",
      room: { className: LAB, title: "Trading journal" },
      people: [],
      messages: [
        ["user-elena-rivera", 20, "Share one trade you made this week and why."],
        ["user-zoe", 19, "I bought VXUS to own companies outside the United States."],
      ],
    },
  ];

  await sql.begin(async (tx) => {
    for (const conversation of demoConversations) {
      const first = conversation.messages[0];

      await tx`
        insert into conversations (id, kind, title, class_name, created_by_user_id, created_at)
        values (
          ${conversation.id}, ${conversation.room ? "room" : "direct"}, ${conversation.room?.title ?? ""},
          ${conversation.room?.className ?? null}, ${first[0]}, ${hoursAgo(first[1])}
        )
        on conflict (id) do nothing
      `;

      for (const userId of conversation.people) {
        // Only the sender of the last message has read everything, so the
        // other person sees an unread count.
        const last = conversation.messages[conversation.messages.length - 1];

        await tx`
          insert into conversation_participants (conversation_id, user_id, last_read_at)
          values (${conversation.id}, ${userId}, ${userId === last[0] ? hoursAgo(last[1]) : null})
          on conflict (conversation_id, user_id) do nothing
        `;
      }

      for (const [index, [senderId, hours, body, flag]] of conversation.messages.entries()) {
        const messageId = `${conversation.id}-m${index + 1}`;

        await tx`
          insert into messages (id, conversation_id, sender_user_id, body, created_at)
          values (${messageId}, ${conversation.id}, ${senderId}, ${body}, ${hoursAgo(hours)})
          on conflict (id) do nothing
        `;

        if (flag === "phone") {
          // Flagged automatically (personal contact details): open, for the teacher.
          await tx`
            insert into message_flags (id, message_id, flagged_by_user_id, reason, status, created_at)
            values (${`demo-flag-${messageId}`}, ${messageId}, null, 'Possible phone number', 'open', ${hoursAgo(hours)})
            on conflict (id) do nothing
          `;
        }

        if (flag === "unkind") {
          // Flagged by the student who received it, then forwarded to the admins.
          await tx`
            insert into message_flags (id, message_id, flagged_by_user_id, reason, status, created_at)
            values (${`demo-flag-${messageId}`}, ${messageId}, 'user-maya', 'This was unkind.', 'forwarded', ${hoursAgo(hours - 0.5)})
            on conflict (id) do nothing
          `;
          await tx`
            insert into message_flag_forwards (
              id, flag_id, forwarded_to_kind, forwarded_to, forwarded_by_user_id, note, email_status, forwarded_at
            )
            values (
              ${`demo-forward-${messageId}`}, ${`demo-flag-${messageId}`}, 'admins', 'admins', 'user-elena-rivera',
              'Second time this week. Please advise.', 'demo', ${hoursAgo(hours - 1)}
            )
            on conflict (id) do nothing
          `;
        }
      }
    }
  });
}

// Run directly: node scripts/seed-demo-messages.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set; skipping demo messages.");
    process.exit(0);
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

  try {
    await seedDemoMessages(sql);
    console.log("Demo messages seeded.");
  } finally {
    await sql.end();
  }
}
