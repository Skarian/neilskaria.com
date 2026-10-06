# Orchestrator guide

This guide explains how work on this repository is shared among several AI agents. It is written for the user and for any agent acting as orchestrator, including one taking over partway through. It first introduces who is involved, then follows a piece of work from the user's request to a pushed result.

## Who is involved

**The user** owns the project and makes the decisions. They usually start by talking to the orchestrator, but they can also open any worker's thread and work there directly.

**The orchestrator** is the agent that oversees the whole effort. It plans the work, hands it out, keeps track of every thread, checks results, raises problems with the user, and coordinates when one agent's change affects another's. It does not do the hands-on work itself.

**Workers** are the agents that do the hands-on work: editing files, running commands, testing, and using Git. A worker runs in one of two forms:

- A **subagent** handles one bounded task delegated by the orchestrator.
- A **dedicated thread** is a separate conversation for ongoing work, or for work the user wants to take part in. Workers in these threads may ask the user questions directly.

Workers of either kind are not asked to message or call the orchestrator back. Instead, each worker leaves its progress, questions, decisions, completion details, and verification evidence in its own conversation, where the orchestrator reads them. Because the user can talk to workers directly, decisions often get made inside worker threads too. The orchestrator picks those up itself, so the user never has to relay context from one agent to another.

## What the orchestrator does and doesn't do

The orchestrator researches, reads files, plans, writes briefs, delegates, inspects evidence, and communicates. It never executes anything: no shell commands (not even read-only ones), no edits to the repository, no Git, no builds or tests, and no deployments. Anything that needs executing goes to a worker.

The orchestrator's thread runs with Full access because the T3 orchestration tools need it. That access is for coordinating, not for doing work.

Workers run in **Auto-review** mode by default. If a tool has been shown to fail under Auto-review, as with the Git problem the user reported, the worker on that task may get temporary Full access. The orchestrator tells the user why and what the access covers, and Auto-review is restored once the task is done. The orchestrator's tools can't change an existing thread's mode; the user does that in the app. A worker never gets Full access just to contact the orchestrator.

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

The orchestrator breaks the user's request into tasks and decides who does each. A bounded task with a clear end goes to a subagent. Ongoing work, or work the user wants to join, gets a dedicated thread. There is no fixed limit on how many workers run at once; it depends on how many tasks are truly independent.

Before naming a new thread, the orchestrator lists the project's open threads and picks a descriptive name that can't be confused with the others.

### 2. Write the brief

A worker hasn't seen the conversation, so its brief has to stand on its own. It says what to do and why, which files the worker owns and which it must leave alone, what the task depends on, which branch to start from, what counts as done, and which checks to run.

### 3. Set up the workspace

If several workers will edit at the same time, each gets its own **worktree** (a separate checkout) on its own task branch, so they can't overwrite each other. Tasks that run one after another can share a checkout.

Shared files, such as dependency lists or configuration, have one owner at a time. For example, if a homepage redesign and a form fix both need a new package, only one of those workers adds it.

Workers make focused commits on their own branches. Nobody rewrites history, force-pushes, or changes another worker's branch without authorization.

`AGENTS.md` and this guide are versioned policy. Any changes to them are committed before creating task worktrees that need to inherit them.

### 4. Keep the record

The orchestrator keeps a short task record in one file: `.agents/coordination.md` in the project's **main checkout** (the original clone, not a linked worktree). The link [coordination.md](coordination.md) only reaches that record when this guide is read from the main checkout. Each worktree has its own copy of the files, so nobody creates or maintains a separate record inside a worktree. The record is local operational state, excluded from Git; it is never committed or merged between branches.

For each active task the record lists where to find the worker or task, the scope, the worker's actual worktree path and branch, the status, the evidence so far, and the next step. It also notes the dedicated-thread monitoring schedule described below, if one exists, and whether it is on. Actual branch and checkout names belong in the record, not in this guide.

The orchestrator decides what the record should say, and a record worker it assigns makes the edit, using the record's full path in the main checkout. Feature workers get everything they need in their brief and don't edit the record.

The orchestrator may itself be running in a linked worktree, so it doesn't assume its current checkout is the main one. It finds the main checkout from T3's project or workspace metadata, or from a Git worktree list run by a worker.

### 5. Follow the work

How the orchestrator follows a worker depends on its form.

**Subagents** don't need scheduled polling. T3 notifies the orchestrator when a subagent finishes, and the orchestrator checks the task or its thread directly whenever it needs to, including explicit checks on any follow-up run it sends. A subagent never causes the schedule below to start or stay on.

**Dedicated threads** are monitored with one recurring T3 schedule, bound to the orchestrator's own thread, that checks in every 15 minutes. Once dedicated-thread work is actually underway, the orchestrator turns the schedule on as a matter of routine, without waiting for the user to ask or approve it. If a schedule already exists, it reuses it rather than creating another; there is never one timer per thread. The schedule's ID and the dedicated threads it tracks go in the task record.

At each check, the orchestrator reads what's new in each tracked thread: the actual tool results, completion evidence, errors or blockers, and any decisions the user made there. It reviews that in proportion to the task, as described in the next step, and tells the user about meaningful changes or problems. It doesn't send a message just to say nothing has changed.

When every tracked dedicated thread's assignment is complete and its results have been checked, or the work has been explicitly cancelled, the orchestrator turns the schedule off. A thread that has gone idle or stopped hasn't necessarily finished its assignment, so that alone doesn't count. When new dedicated-thread work starts, the schedule is turned back on.

This monitoring is the orchestrator using T3's scheduler. It isn't a shell loop or a long-running worker, and it covers only the dedicated threads assigned to the current work, not every past thread.

### 6. Check the result

A worker's summary of its own work isn't proof that the work is right. Since the orchestrator can't run commands, the worker leaves evidence in its conversation that the orchestrator can read: links to the changed files or diff, or the exact revision, plus the output of the checks it ran. The orchestrator then looks at what actually happened in the thread (messages, tool results, changes, and checks), including any errors, fallbacks, or workarounds, even if the task ended well.

How closely to look depends on the size and risk of the task. A small documentation change doesn't need an extra reviewer or repeated review rounds. If something is wrong or unverified, the orchestrator either sends follow-up work or tells the user plainly what's still uncertain. Once the orchestrator is satisfied, the work is **accepted**.

### 7. Combine, test, and push

One Codex worker (GPT-6.1 Sol) is assigned to combine the accepted work. It merges the accepted task branches into the integration branch chosen for the work, resolves any conflicts, runs the relevant checks, and pushes.

Before pushing, it checks what the push will deploy. If the push would change the live site and that release hasn't been authorized, the worker stops and explains why in its thread instead of pushing. Changes to `main`, the live deployment, domains, or the Vercel Git connection all need release authorization from the user. Once the user has authorized a release, nobody asks again.

### 8. Close out

The combining worker records the final revision and the check results in its thread. The orchestrator reviews that evidence, has the task record updated, turns off the monitoring schedule if no other dedicated-thread work is still running, and tells the user what landed and what's still left.

## Taking over as orchestrator

A new orchestrator first finds the main checkout as described in step 4 and starts with the task record there, then checks it against what's really there: the state of each worker thread, decisions the user made in those threads, whether the monitoring schedule is on, and the repository and worktrees, which a worker inspects on its behalf.
