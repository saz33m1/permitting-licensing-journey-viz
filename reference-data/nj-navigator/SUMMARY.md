# NJ Navigator Reference Data — Summary

Source repo: https://github.com/newjersey/navigator.business.nj.gov (branch: main)
Downloaded: 2026-04-20

---

## What This Is

NJ Navigator (business.nj.gov) is New Jersey's one-stop dashboard for starting and managing a
business. The application presents each user with a personalized **Roadmap** — an ordered checklist
of tasks grouped into Steps — based on their industry and business persona.

---

## Repository Layout (relevant to data structure)

```
content/src/roadmaps/          <- all task/roadmap DATA lives here
  steps.json                   <- ordered Step definitions (standard roadmap)
  steps-foreign.json           <- steps for foreign (out-of-state) entities
  steps-domestic-employer.json <- steps for domestic employer persona
  task-dependencies.json       <- THE DEPENDENCY GRAPH (see below)
  nonEssentialQuestions.json   <- optional add-on questions and their associated tasks
  tasks/                       <- ~119 Markdown files, one per task
  license-tasks/               <- license-specific task Markdown files
  municipal-tasks/             <- municipality-specific task Markdown files
  env-tasks/                   <- environmental task Markdown files
  raffle-bingo-steps/          <- raffle/bingo industry tasks
  industries/                  <- ~65 JSON files, one per industry roadmap
  add-ons/                     <- ~93 JSON files, modular task add-ons

shared/src/
  industry.ts                  <- Industry and AddOn TypeScript interfaces
  types/types.ts               <- Task, Roadmap, Step, TaskDependencies, TaskLink interfaces
  static/loadTasks.ts          <- server-side task loading + dependency resolution logic

web/src/lib/roadmap/
  roadmapBuilder.ts            <- client-side roadmap assembly (steps + tasks + add-ons)
web/src/lib/async-content-fetchers/
  fetchTaskByFilename.ts       <- resolves task + its unlockedBy links at runtime
```

---

## The Dependency / Ordering Model

### Layer 1 — Steps (phase ordering)

`steps.json` defines the top-level phases. Each Step has a `stepNumber` (1–4) and a `section`
("PLAN" or "START"). Tasks are always assigned to one step.

```json
// steps.json shape
{ "steps": [
    { "stepNumber": 1, "section": "PLAN",  "name": "Plan Your Business",           "timeEstimate": "30 Days" },
    { "stepNumber": 2, "section": "START", "name": "Register Your Business",        "timeEstimate": "1–5 Days" },
    { "stepNumber": 3, "section": "START", "name": "After Registering",             "timeEstimate": "30–60 Days" },
    { "stepNumber": 4, "section": "START", "name": "Before Opening Your Site",      "timeEstimate": "30–60 Days" }
]}
```

Three step-set variants exist: `steps.json` (standard), `steps-foreign.json` (foreign entity),
`steps-domestic-employer.json` (domestic employer). The roadmapBuilder selects the correct set
based on business persona.

### Layer 2 — Industry Roadmaps (task assignment + within-step ordering)

Each `industries/<id>.json` file lists all tasks for that industry via `roadmapSteps`. Each entry
specifies:
- `step` — which step number this task belongs to (1–4)
- `weight` — sort order within the step (lower = earlier)
- `task` OR `licenseTask` — filename of the task Markdown (without `.md`)
- `required` (optional boolean) — whether the task is mandatory

```json
// industries/restaurant.json (excerpt)
{ "roadmapSteps": [
    { "step": 1, "weight": 1,   "task": "business-plan" },
    { "step": 1, "weight": 50,  "task": "determine-naics-code",    "required": true },
    { "step": 1, "weight": 100, "task": "business-structure",       "required": true },
    { "step": 2, "weight": 20,  "task": "register-for-ein",         "required": true },
    { "step": 2, "weight": 25,  "task": "register-for-taxes",       "required": true },
    { "step": 4, "weight": 100, "licenseTask": "food-safety-course" }
]}
```

**Key point:** Step + weight together define sequencing. Step is a hard grouping; weight is a
sort key within a step. There is no explicit "must finish A before B can start" within a step
beyond the weight ordering — that concept lives in the dependency graph (Layer 3).

### Layer 3 — Task Dependencies (prerequisite graph)

`task-dependencies.json` is the central dependency file. It is an array of entries; each entry
declares what a task `unlockedBy` at runtime:

```json
// task-dependencies.json shape
{ "dependencies": [
    {
      "task": "register-for-ein",          // the dependent task (filename without .md)
      "taskDependencies": [                 // prerequisite tasks (any of these must be complete)
        "form-business-entity",
        "form-business-entity-nj",
        "form-business-entity-foreign",
        "form-business-entity-llc"
      ]
    },
    {
      "task": "register-for-taxes",
      "taskDependencies": [
        "form-business-entity", "form-business-entity-nj",
        "form-business-entity-foreign", "form-business-entity-llc",
        "register-for-ein", "determine-naics-code"
      ]
    },
    {
      "licenseTask": "conversion-license-cannabis",  // can refer to a licenseTask instead
      "taskDependencies": ["zoning-cannabis"],
      "licenseTaskDependencies": ["conditional-permit-cannabis"]
    }
]}
```

Fields:
- `task` / `licenseTask` — the task that has prerequisites (mutually exclusive)
- `taskDependencies` — list of regular task filenames that must be complete first
- `licenseTaskDependencies` — list of license-task filenames that must be complete first

Both `taskDependencies` and `licenseTaskDependencies` can appear together on the same entry
(see the cannabis example above).

At runtime, `loadTasks.ts` / `fetchTaskByFilename.ts` reads this file and attaches the
`unlockedBy: TaskLink[]` array to each `Task` object. The UI uses this to show locked/unlocked
state and to grey out tasks that have incomplete prerequisites.

### Layer 4 — Add-Ons (conditional task injection)

`add-ons/<id>.json` files follow the same `roadmapSteps` shape as industry files. They inject
additional tasks (or modifications) into the roadmap when a user answers certain onboarding
questions (e.g., "Do you have a boiler?"). The roadmapBuilder merges these into the task list
and deduplicates.

An add-on can also carry `modifications` (via `TaskModification`) to replace one task filename
with another, allowing context-specific task variants.

### Layer 5 — Non-Essential Questions

`nonEssentialQuestions.json` defines optional questions that, if answered affirmatively, trigger
add-ons to be applied. It is a separate mechanism from onboarding questions stored in industry
`industryOnboardingQuestions`.

---

## TypeScript Interfaces (key ones)

All canonical type definitions live in `shared/src/types/types.ts`:

```typescript
interface Roadmap {
  steps: Step[];
  tasks: Task[];
}

interface Step {
  stepNumber: number;
  name: string;
  timeEstimate: string;
  description: string;
  section: SectionType;  // "PLAN" | "START" | "OPERATE"
}

interface Task {
  id: string;
  filename: string;
  stepNumber?: number;
  name: string;
  urlSlug: string;
  callToActionLink: string;
  callToActionText: string;
  contentMd: string;
  summaryDescriptionMd: string;
  unlockedBy: TaskLink[];  // populated at runtime from task-dependencies.json
  required?: boolean;
  agencyId?: string;
}

interface TaskLink {
  name: string;
  id: string;
  urlSlug: string;
  filename: string;
}

type TaskDependencies = {
  task?: string;
  licenseTask?: string;
  taskDependencies?: string[];
  licenseTaskDependencies?: string[];
};
```

`shared/src/industry.ts` defines:

```typescript
interface Industry {
  id: string;
  roadmapSteps: AddOn[];    // tasks to include + their step/weight assignments
  modifications?: TaskModification[];
  // ...
}

interface AddOn {
  step: number;
  weight: number;
  task?: string;
  licenseTask?: string;
}

interface TaskModification {
  taskToReplaceFilename: string;
  replaceWithFilename: string;
}
```

---

## How the Roadmap Is Assembled (runtime flow)

1. `roadmapBuilder.ts` (`buildRoadmap`) selects the correct steps file (standard / foreign /
   domestic-employer) based on persona.
2. It loads `industries/<industryId>.json` and calls `addTasksFromAddOn` to populate the task
   builder list with `{ filename, step, weight, required }` tuples.
3. Add-ons passed in from user answers are merged in the same way.
4. Any `modifications` entries swap one task filename for another.
5. Duplicate tasks are removed (first occurrence wins).
6. Tasks are sorted by `(stepNumber, weight)`.
7. For each task, `fetchTaskByFilename` reads the Markdown file and also reads
   `task-dependencies.json` to build the `unlockedBy` array.
8. The final `Roadmap` object trims `unlockedBy` entries that do not exist in the user's roadmap
   (so you don't show a prerequisite they'll never see).

---

## Task File Format (Markdown with YAML frontmatter)

Each task is a `.md` file with a YAML front-matter block:

```markdown
---
id: form-business-entity
name: Authorize Your Business Entity
urlSlug: business-entity-auth
summaryDescriptionMd: "..."
callToActionLink: https://...
callToActionText: Authorize My Business
agencyId: nj-revenue-enterprise-services
---

## Application Requirements
- ...
```

The `id` matches the identifier used in `task-dependencies.json`. The `filename` (without `.md`)
is used as the cross-reference key everywhere else.

---

## Scale

- ~65 industry roadmaps
- ~119 tasks in `tasks/`, plus separate directories for license-tasks, municipal-tasks, env-tasks,
  raffle-bingo-steps
- ~93 add-ons
- ~30 dependency relationships in `task-dependencies.json`
- 4 numbered Steps per standard roadmap (2 sections: PLAN, START)

---

## Downloaded Files in This Directory

```
roadmaps/
  task-dependencies.json         <- THE primary dependency graph
  steps.json                     <- standard step definitions
  steps-foreign.json             <- foreign entity step definitions
  steps-domestic-employer.json   <- domestic employer step definitions
  nonEssentialQuestions.json     <- optional add-on question triggers
  industries/
    acupuncture.json, architecture.json, cannabis.json, cosmetology.json,
    food-truck.json, restaurant.json, retail.json
  tasks/
    business-plan.md, check-site-requirements.md, form-business-entity.md,
    form-business-entity-foreign.md, register-for-ein.md, register-for-taxes.md,
    search-licenses.md, site-inspection.md
  add-ons/
    amber-light.json, boiler.json

shared-types/
  types.ts               <- Task, Roadmap, Step, TaskDependencies, TaskLink interfaces
  industry.ts            <- Industry, AddOn, TaskModification interfaces
  loadTasks.ts           <- server-side task + dependency loading logic
  roadmapBuilder.ts      <- roadmap assembly algorithm
  fetchTaskByFilename.ts <- async task + dependency resolution
```
