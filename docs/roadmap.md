# FutureFund Classroom Roadmap

Future-state goals. These are directions to evaluate, not committed work. When
an item is picked up, it gets a plan (with draft patch notes) and a version
like any other change.

## Goal: Teacher "wrenches" — life events that test portfolio management

**Added:** 2026-11-12 · **Status:** to evaluate

Make the simulation engine more dynamic for teachers **without overwhelming
them with options**. Beyond market-wide moves, teachers should be able to throw
wrenches into a student's *personal* finances, testing whether their portfolio
is strong and flexible enough to absorb real-life shocks.

### What teachers can do today

From `lib/server/market-engine.ts` and the teacher Market page:

- Pick one of four class-wide market scenarios: baseline, broad market drop,
  growth rally, interest-rate shock.
- Set the simulation mode (shared provider, teacher scenario, frozen),
  volatility multiplier, starting cash, allowed asset types, and allowed
  symbols.
- Raise or lower individual prices.
- Trigger the Strait of Hormuz oil-shock scenario on chosen symbols.

**Gap:** everything acts on the *market*. Nothing acts on the *student*. There
is no income, no recurring bills, and no unexpected expenses, so a portfolio
never has to cover a real-life need, and holding zero cash has no downside.

### Ideas to evaluate

**1. Life event cards (the core idea).** One-click events that hit a student's
cash, not the market:

| Type | Examples |
|---|---|
| Unexpected expense | Car repair, phone replacement, medical bill, vet bill |
| Income shock | Hours cut, job loss for N weeks, missed paycheck |
| Windfall | Bonus, tax refund, birthday money, small inheritance |
| Cost-of-living change | Rent increase, insurance premium up |

If a student can't cover the cost from cash, they have to **sell holdings**,
possibly at a loss during a downturn, or (for older grades) **borrow** at
credit-card interest. That's the lesson: emergency funds, liquidity, and not
being forced to sell at the bottom.

**2. Who it hits.** Apply an event to the whole class, a random handful of
students, or one student. "Random handful" mirrors real life and makes for a
good class discussion ("why did Jordan cope and Maya didn't?").

**3. Cash flow (optional, older grades).** A simple recurring paycheck and
recurring expenses, so students budget and decide how much to invest versus
keep in cash.

**4. More market templates.** Generalize the Hormuz shock into a small set of
reusable templates: sector shock, recession, inflation spike, single-company
scandal, rate cut.

**5. Combo events.** Pair a market event with a life event (a recession *and*
hours cut) for the hardest test.

**6. Debrief.** After an event, show the teacher how each student fared: who
had a cash buffer, who sold at a loss, who borrowed. Optionally add a
reflection prompt for students.

### Keeping it simple for teachers

- **A deck, not a form.** Teachers pick from a short list of pre-built event
  cards with sensible amounts already filled in, instead of building events
  from scratch.
- **Difficulty presets** (gentle / realistic / tough) that scale amounts to the
  class's starting cash and grade level.
- **"Surprise me"** button that draws a random card from the deck.
- **Advanced options hidden** behind a "Customize" toggle (exact amount,
  targeting, timing).
- **Preview before applying** ("this will cost each student $300; 6 students
  don't have enough cash"), plus **undo**.
- **Schedule ahead** ("apply this on Friday") so teachers can plan a lesson.

### Open questions

- Should life events be per-student (each student's own finances) or
  class-wide? Per-student is more realistic but adds data and UI.
- Can students go into debt, and at what grade level? Is debt hidden for grades
  6–8?
- How should event amounts scale: fixed dollars, or a percentage of starting
  cash?
- Do events affect grades or scores, and how is "portfolio resilience"
  measured (cash buffer, drawdown, diversification)?
- Should students get advance warning ("hurricane season is coming") so
  preparing is part of the skill?
- The Hormuz scenario and price raise/lower currently live in the browser
  (`app/page.tsx`). Do new events need to move into the server-side engine so
  they persist and apply to every student?
