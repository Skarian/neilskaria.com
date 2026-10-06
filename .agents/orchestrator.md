# Orchestrator guide

This guide explains how work on this repository is shared among several AI agents. It is written for the user and for any agent acting as orchestrator, including one taking over partway through. It first introduces who is involved, then follows a piece of work from the user's request to a pushed result.

## Who is involved

**The user** owns the project and makes the decisions. They usually start by talking to the orchestrator, but they can also open any worker's thread and work there directly.

**The orchestrator** is the agent that oversees the whole effort. It plans the work, hands it out, keeps track of the tasks it assigns, checks results, raises problems with the user, and coordinates when one agent's change affects another's. It does not do the hands-on work itself.

**Workers** are the agents that do the hands-on work: editing files, running commands, testing, and using Git. A worker runs in one of two forms, and both are normal ways to get work done:

- A **subagent** handles one bounded task delegated by the orchestrator, within the orchestrator's conversation.
- A **dedicated thread** is a separate top-level conversation that the user owns. The user leads the work there, may answer the worker's questions directly, and can change the thread's access settings.

Workers are not asked to message or call the orchestrator back. Each worker leaves its progress, questions, decisions, completion details, and verification evidence in its own conversation. T3 notifies the orchestrator when a subagent finishes, and the orchestrator reads the result there. When the user asks for help with a dedicated thread, or that thread's work is part of a task the orchestrator is coordinating, the orchestrator reads it too and picks up any decisions made there, so the user doesn't have to relay context from one agent to another.

## What the orchestrator does and doesn't do

The orchestrator researches, reads files, plans, writes briefs, delegates, inspects evidence, and communicates. It never executes anything: no shell commands (not even read-only ones), no edits to the repository, no Git, no builds or tests, and no deployments. Anything that needs executing goes to a worker.

The orchestrator's thread runs with Full access because the T3 orchestration tools need it. That access is for coordinating, not for doing work.

Subagents run in **Auto-review** mode by default. If a tool has been shown to fail under Auto-review, as with the Git problem the user reported, the orchestrator may use the narrowly scoped Full access helper the user has already authorized, only for the troublesome commands, in the same existing checkout and branch, with competing edits paused. The orchestrator can't change or automatically restore an existing thread's access; the user manages access for their dedicated threads in the app.

## Choosing models

These are the user's preferences, confirmed in the live catalog on 2026-10-06. Check the catalog again at launch. If a preferred model isn't listed, tell the user instead of quietly substituting another.

| Model | ID | Use for |
| --- | --- | --- |
| GPT-6 Astra, extra-high reasoning | `gpt-6-astra` | Orchestration and planning |
| GPT-6.1 Sol, medium reasoning | `gpt-6.1-sol` | Coding, execution, and Git |
| Claude Opus 5.5 | `claude-opus-5-5` | Writing, UI, creative work, and motion. It runs on a limited $20 subscription, so give it focused assignments. |
| Grok 4.7 | `grok-4.7` | Mainly research on X |

## How a piece of work runs

### 1. Plan and assign

The orchestrator breaks the user's request into tasks and gives each one to a worker, either as a subagent or in a separate thread. If the user has already said which they want, the orchestrator follows that. If it's unclear, it asks a short question, such as "Would you like separate threads or subagents?", before creating either. There is no fixed limit on how many run at once; it depends on how many tasks are truly independent.

Before naming a new thread, the orchestrator lists the project's open threads and picks a descriptive name that can't be confused with the others.

### 2. Write the brief

A worker hasn't necessarily seen the conversation, so its brief has to stand on its own. For example:

> In the checkout at `<worktree path>`, on branch `task/contact-form-validation`, make the contact form show an inline error for an empty email instead of submitting. You own `app/contact/form.tsx` and its test file; leave everything else alone. Done means the error appears, valid input still submits, and lint and the form tests pass; include the check output in your result. You may make one focused commit on this branch. Don't push or deploy.

### 3. Set up the workspace

If several workers will edit at the same time, each gets its own **worktree** (a separate checkout) on its own task branch, so they can't overwrite each other. Tasks that run one after another can share a checkout.

Shared files, such as dependency lists or configuration, have one owner at a time. For example, if a homepage redesign and a form fix both need a new package, only one of those workers adds it.

Workers make focused commits on their own branches. Nobody rewrites history, force-pushes, or changes another worker's branch without authorization.

`AGENTS.md` and this guide are versioned policy. Any changes to them are committed before creating task worktrees that need to inherit them.

### 4. Keep the record

The orchestrator keeps a short task record in one file: `.agents/coordination.md` in the project's **main checkout** (the original clone, not a linked worktree). The link [coordination.md](coordination.md) only reaches that record when this guide is read from the main checkout. Each worktree has its own copy of the files, so nobody creates or maintains a separate record inside a worktree. The record is local operational state, excluded from Git; it is never committed or merged between branches.

For each active task the record lists where to find the worker or task, the scope, the worker's actual worktree path and branch, the status, the evidence so far, and the next step. It also notes any user-owned dedicated threads involved in the current work. Actual branch and checkout names belong in the record, not in this guide.

The orchestrator decides what the record should say, and a record worker it assigns makes the edit, using the record's full path in the main checkout. Feature workers get everything they need in their brief and don't edit the record.

The orchestrator may itself be running in a linked worktree, so it doesn't assume its current checkout is the main one. It finds the main checkout from T3's project or workspace metadata, or from a Git worktree list run by a worker.

### 5. Follow the work

The orchestrator doesn't set schedules or run polling loops. T3 notifies it automatically when a subagent finishes, and the orchestrator then reads the task result and the actual activity behind it.

Dedicated threads are led by the user. The orchestrator looks at one when the user asks, or when its work feeds into a task the orchestrator is coordinating, such as before integration. It then reconciles any decisions made there and reviews the results like any other work. It doesn't promise continuous oversight or timed check-ins.

### 6. Check the result

A worker's summary of its own work isn't proof that the work is right. Since the orchestrator can't run commands, the worker leaves evidence in its conversation that the orchestrator can read: links to the changed files or diff, or the exact revision, plus the output of the checks it ran. The orchestrator then looks at what actually happened in the thread (messages, tool results, changes, and checks), including any errors, fallbacks, or workarounds, even if the task ended well.

How closely to look depends on the size and risk of the task. A small documentation change doesn't need an extra reviewer or repeated review rounds. If something is wrong or unverified, the orchestrator either sends follow-up work or tells the user plainly what's still uncertain. Once the orchestrator is satisfied, the work is **accepted**.

### 7. Combine, test, and push

One Codex worker (GPT-6.1 Sol) is assigned to combine the accepted work. It merges the accepted task branches into the integration branch chosen for the work, resolves any conflicts, runs the relevant checks, and pushes.

Before pushing, it checks what the push will deploy. If the push would change the live site and that release hasn't been authorized, the worker stops and explains why in its thread instead of pushing. Changes to `main`, the live deployment, domains, or the Vercel Git connection all need release authorization from the user. Once the user has authorized a release, nobody asks again.

### 8. Close out

The combining worker records the final revision and the check results in its thread. The orchestrator reviews that evidence, has the task record updated, and tells the user what landed and what's still left.

## Taking over as orchestrator

A new orchestrator first finds the main checkout as described in step 4 and starts with the task record there, then checks it against what's really there: the state of each assigned task, any dedicated threads involved in the current work and decisions the user made in them, and the repository and worktrees, which a worker inspects on its behalf.
