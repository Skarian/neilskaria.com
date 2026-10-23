# People on X worth reading for agent and harness ideas

Research date: 2026-10-06. A reading list of 22 people who post about coding agents, harnesses, evals, or building with AI. Order inside each group is a suggested reading order. Follower counts are left out.

`.agents/models.md` assigns this kind of X research to Grok 4.7. The two notes from the same day stay in place: [how this audience posts](x-ai-dev-growth-research.md) and [a draft desk that does not post](x-agent-assisted-workflow-research.md). Those eight accounts are still the public center of the field, and this list does not re-profile them.

Already covered there, and still worth reading for the work itself: [@bcherny](https://x.com/bcherny), [@steipete](https://x.com/steipete), [@thorstenball](https://x.com/thorstenball), [@simonw](https://x.com/simonw), [@HamelHusain](https://x.com/HamelHusain), [@kieranklaassen](https://x.com/kieranklaassen), [@pauliusztin_](https://x.com/pauliusztin_), [@swyx](https://x.com/swyx).

## How a line is labeled

- **Bio** means the profile text returned with the account on this date.
- **Post** means a claim in a post linked below. Numbers in those posts (a cost cut, a score, a download count) are the author's report.
- **Inference** means a conclusion from the posts, and it is marked when it appears.

Videos attached to posts were not watched.

## Recommended first 8

### 1. Armin Ronacher — [@mitsuhiko](https://x.com/mitsuhiko)

**Bio:** creator of Flask, building at a linked site. **Post:** on 5 Sep 2026 he wrote that he had broken the `pi-coding-agent` package. On 4 Oct 2026 he wrote that a somewhat durable agent is easy, and an inherently durable harness took many iterations.

Study the durability problem: what has to survive a crash without the harness turning into a mess. He posts the hard part in a few lines, often next to a concrete setup.

[4 Oct 2026](https://x.com/mitsuhiko/status/2106772685665772001)

### 2. Kilian Lieret — [@KLieret](https://x.com/KLieret)

**Bio:** Meta Superintelligence, previously Princeton. The bio lists SWE-bench (multilingual and multimodal), SWE-agent, mini-swe-agent, SWE-smith, CodeClash, and ProgramBench.

Study the question in his 1 Oct post: can a model find and fix bugs if you do not tell it what went wrong? SWE-sweep, on his account, is 100 repos, 22 languages, and 4k real bugs, and he reports top models under 5%. On 30 Sep he posted a separate ranking of ProgramBench by tasks per dollar, and wrote that some model evals now cost more than $10k. The habit is one sharp question, the sample, and a second cut by cost.

[1 Oct 2026](https://x.com/KLieret/status/2105670833574465933) · [30 Sep, cost](https://x.com/KLieret/status/2105348153880789179)

### 3. Eno Reyes — [@EnoReyes](https://x.com/EnoReyes)

**Bio:** CTO at Factory.

Study the 1 Oct description of a morning automation: one skill starts a subagent per playbook, each subagent checks its own result before writing, a bad run keeps yesterday's page and logs why, and the lesson is written into the playbook instead of patched into code. Playbook changes go through PRs. He is showing one internal system in operating detail.

[1 Oct 2026](https://x.com/EnoReyes/status/2105794874402324692)

### 4. Geoffrey Huntley — [@GeoffreyHuntley](https://x.com/GeoffreyHuntley)

**Bio:** no employer. "does not sell llm tokens for a living."

Study the 5 Oct recording of a loop that is hooked to a Lisp REPL: the model adds functions while the application runs, and those functions persist across restarts. He sets that against the read-file, edit-file, compile loop. On 4 Oct he compared another pattern to "ralph," which is his name for an earlier loop. The habit is a short claim plus a recording of the loop actually running. The same day's other posts are jokes, so the feed takes some filtering.

[5 Oct 2026](https://x.com/GeoffreyHuntley/status/2107012238133391799)

### 5. Matt Pocock — [@mattpocockuk](https://x.com/mattpocockuk)

**Bio:** teaches developers. Author of Total TypeScript and AI Hero. Ex-Vercel.

Study the 3 Oct argument that tighter abstractions, plus harsh lint, shrink the decisions an agent is allowed to make, and that a bad abstraction is cheaper to unwind once agents can edit it. On 5 Oct he added `/retro` to his main skill flow: run it on a session that already succeeded and look for time lost searching the repo. He posts a named skill and a writeup, or one take with the constraint attached.

[3 Oct 2026](https://x.com/mattpocockuk/status/2106425743479546343) · [5 Oct, /retro](https://x.com/mattpocockuk/status/2107037429324513535)

### 6. David Fowler — [@davidfowl](https://x.com/davidfowl)

**Bio:** Distinguished Engineer at Microsoft. Creator of NuGet, SignalR, and Aspire.

Study the 8 Sep line that a hermetic test environment is the first thing to build if agents are going to run, debug, and test. On 26 Sep he wrote that Copilot across Microsoft had moved onto one harness, the GitHub Copilot SDK. On 6 Oct he posted that agents want a monorepo. Short principle, then a later post about what his org did with it.

[8 Sep 2026](https://x.com/davidfowl/status/2097133084231782823) · [6 Oct, monorepo](https://x.com/davidfowl/status/2107330502466343132)

### 7. Sydney Runkle — [@sydneyrunkle](https://x.com/sydneyrunkle)

**Bio:** product and open source at LangChain.

Study the harness-level model router. Her 6 Oct post says the router cut coding-agent cost by 64% at the same quality, and points at a walkthrough of how to build one. The 5 Oct reply adds the condition she considers necessary: evals, so a model change can be tested. A video plus a blog link, and the caveat is in her own reply. The video was not watched.

[6 Oct 2026](https://x.com/sydneyrunkle/status/2107516156328509503)

### 8. Steve Yegge — [@Steve_Yegge](https://x.com/Steve_Yegge)

**Bio:** a long industry career. He writes that he does not expect to hand-write code again.

Study two posts together. On 7 Oct (UTC; retrieved the night of 6 Oct) he pointed at Beads as the memory layer under his agent work, quoting a community account that claimed 1.5M downloads. On 16 Sep he described his own orchestrator as unable to finish: he said agents were filing about 0.4 new beads for every bead closed. Read him for a memory substrate and for a factory that creates more work than it drains. The posts are long, first person, and include the failure.

[7 Oct 2026, Beads](https://x.com/Steve_Yegge/status/2107654290944786683) · [16 Sep, backlog](https://x.com/Steve_Yegge/status/2100045738356945370)

## Also read these two the same way

**Beyang — [@beyang](https://x.com/beyang).** Display name on the account. **Bio:** Amp; previously founder of Sourcegraph. On 30 Sep he posted an interview question whose real subject is agent control: cut CI by 20% by deleting tests, keep the coverage that prevents regressions, and say how you would know the constraint held after the first turn. On 6 Oct he posted his own team's model mix and labeled it Amp core team, explicitly separate from all users. [30 Sep](https://x.com/beyang/status/2105143379600564439) · [6 Oct, scope note](https://x.com/beyang/status/2107468544996954139)

**Ankur Goyal — [@ankrgyl](https://x.com/ankrgyl).** **Bio:** "customer service @braintrust." That is the title on the profile. His 24 Sep post is a long account of rebuilding Braintrust's trace store: agent traces as fat rows on object storage, inverted-index search that has to short-circuit, and an execution engine he calls Nitro. Read it for the shape of the observability workload. A founder or executive title is not in the bio retrieved here. [24 Sep 2026](https://x.com/ankrgyl/status/2103170212917080315)

## Coding-agent and harness builders

**Mario Zechner — [@badlogicgames](https://x.com/badlogicgames).** **Bio:** "Armin's handler," and "old man yelling at Claudes." **Inference:** he is in the Pi codebase with Armin. The bio does not give him a title on Pi. On 6 Oct he was doing Pi issues from his phone, and in a reply the same hour he described durable, replay-safe primitives inside tool implementations. The public posts are a build log of one-liners and screenshots. Read him next to Armin. [6 Oct, tool primitives](https://x.com/badlogicgames/status/2107583625474822637)

**dax — [@thdxr](https://x.com/thdxr).** Display name on the account. **Bio:** building OpenCode at Anomaly, and he writes that he is not the CEO. On 6 Oct he said he has run OpenCode on an always-on server since the start of the year, and that this is a better experience than the common one. A separate post the same evening says other people can build agent front ends on the OpenCode server. The posts are one observation from how he runs it. [6 Oct 2026](https://x.com/thdxr/status/2107581841314365551)

**Saoud Rizwan — [@sdrzn](https://x.com/sdrzn).** **Bio:** founder of Cline. On 14 Sep he wrote that the new desktop app uses the same Cline SDK harness as the extension and the CLI. That is the idea worth keeping: one harness, several shells, including open-weights models. The latest non-reply retrieved was 14 Sep, so this is a thinner recent feed than the accounts above. [14 Sep 2026](https://x.com/sdrzn/status/2099540008847962567)

**Harrison Chase — [@hwchase17](https://x.com/hwchase17).** **Bio:** LangChain. The bio does not say a founder title. On 4 Oct he posted three moves on coding-agent cost: trace every harness into LangSmith, put per-user caps on a gateway, and do more of the work in OpenSWE, which he calls their open-source cloud agent harness, including model routing. On 5 Oct, under Cognition's memory announcement, he wrote that memory needs an offline cleanup loop and that inferred memories need a check before the agent uses them. Numbered steps, each with a link. [4 Oct](https://x.com/hwchase17/status/2106695651169800418) · [5 Oct, memory](https://x.com/hwchase17/status/2107206402078851519)

## How the work is structured

**lauren — [@poteto](https://x.com/poteto).** Display name on the account. Another post retrieved the same day addresses her as Lauren. **Bio:** Grok bot at SpaceXAI, React compiler core team, previously Cursor, Meta, and Netflix. On 10 Sep she described Cursor Projects as a folder of chats with a coordinator agent over the agents inside, and said finished chats are still useful context. On 30 Sep she described a bot that hands coding to cloud agents, each with its own machine, and keeps the bot as the manager. Her recent posts are product walkthroughs with a screenshot and a numbered list. Matt's "trust ladder" summary of a conversation with her is his post, so it is not listed as hers. [10 Sep 2026](https://x.com/poteto/status/2098186080839475568)

**David Cramer — [@zeeg](https://x.com/zeeg).** **Bio:** founder of Sentry. On 1 Oct he posted Sentry's toolkit repo and said they were about to change what a good MCP and agent toolchain looks like. On 25 Sep, under a "fix one standards violation" skill, he wrote that a make-it-better prompt will always find work, including work that should not be done. A repo link, and a one-line objection. [1 Oct, toolkit](https://x.com/zeeg/status/2105761715438969037) · [25 Sep](https://x.com/zeeg/status/2103587033814089835)

**Michael Ramos — [@backnotprop](https://x.com/backnotprop).** **Bio:** cofounder, AI at EQTY Lab; plannotator listed as a side project. Smaller feed, and the posts are about the surface around the agent. On 5 Oct he wrote that his day is decisions, prototype reviews, and output judgments, and that questions buried in a chat are the wrong place to answer them. On 6 Oct he argued for an input, an agent that manages agents, and a review surface, with transcripts mostly unread. On 7 Oct (UTC) he added that the memory he wants is a meta layer in the repo: docs, decisions, and references, messy at first. He argues from the shape of his own day. [5 Oct 2026](https://x.com/backnotprop/status/2106932402350174580)

## Evals, traces, and specifications

**John Yang — [@jyangballin](https://x.com/jyangballin).** **Bio:** CS PhD student at Stanford. Created SWE-bench, including multilingual and multimodal, plus SWE-agent, SWE-smith, InterCode, CodeClash, and ProgramBench. On 1 Oct he wrote that most SWE benchmarks tell the agent what to fix and where to look, and pointed at SWE-sweep, which he credited to Kilian. On 6 Oct he flagged a multimodal coding benchmark because it uses code to simulate a physical scene. He quote-posts other people's evals and says what the usual benchmark still fails to ask. [1 Oct 2026](https://x.com/jyangballin/status/2105694558751453686)

**Rohit Agarwal — [@Rohit_Writes](https://x.com/Rohit_Writes).** **Bio:** founder of usetokenless (YC S26), CS PhD candidate at Princeton. On 5 Oct he posted EnvCheck, a harness he says finds problems in RL and eval environments, and reported 110 novel reward hacks across DeepSWE, Terminal-Bench, and BFCL. Read him for the habit of testing the grader, not only the agent. The count is his claim. [5 Oct 2026](https://x.com/Rohit_Writes/status/2107161119064551924)

**Shreya Shankar — [@sh_reya](https://x.com/sh_reya).** **Bio:** incoming assistant professor at Carnegie Mellon, working on LLMs in databases and BI tools. Adjacent to coding agents, and worth it for the systems cut. On 24 Sep she posted Quail, an open-source AI-SQL engine with Modal, and described planning a query and the LLM calls together. On 1 Oct she followed with workload-aware inference: when the requests are known up front, reorder them, share KV cache, and run the selective filter first. A launch with a short demo, then a reply that states the systems idea. [24 Sep 2026](https://x.com/sh_reya/status/2103207153821688056)

**Omar Khattab — [@lateinteraction](https://x.com/lateinteraction).** **Bio:** assistant professor at MIT CSAIL. The bio names DSPy, GEPA, and RLMs. On 10 Sep he wrote that methods change and are dominated by scale, and that the time is better spent on a careful specification of the problem. On 25 Sep, under the DSPy 3.4 release, he wrote that the interface stays stable while the implementation changes. Short replies that restate that split. [10 Sep 2026](https://x.com/lateinteraction/status/2098114048281727434)

**Isaac Miller — [@isaacbmiller1](https://x.com/isaacbmiller1).** **Bio:** lead maintainer of DSPy. The smaller, shipping side of the same project. On 25 Sep he posted DSPy 3.4.0: Jev and System One models inside DSPy signatures, and an optimizer, ReAnchor, for calibrating outputs with confidence. Later posts that week are social. Read the release note. [25 Sep 2026](https://x.com/isaacbmiller1/status/2103470217670127720)

## Left out on purpose

Summary accounts that repost papers as threads, company accounts, and feeds that were active but not about this work. Examples seen on 6 Oct and dropped: paper-summary posters, a Cline launch thread of demo videos, and several founders whose retrieved posts were model commentary, office jokes, or replies with no technical post in the window. Paul Gauthier's account had no Aider posts in the 2026 search used here. Eugene Yan's bio says he is an Anthropic researcher; the posts retrieved since August were short agreements, so he is not listed as a current feed. Dan Luu and xjdr come up in older harness arguments; the posts retrieved this session were too thin or about something else.

## Method and limits

Native X search on 2026-10-06: `x_user_search` for handles and bios, `x_keyword_search` set to Latest for timelines, and `x_semantic_search` from 2026-07-01. Some discovery queries used `min_faves`, which hides quiet posts. Semantic search mostly returned summary threads; those accounts were dropped. No login, follow, like, reply, list, or post. No site code was changed.

Bios and posts are a snapshot. A few timestamps had already rolled to 7 Oct UTC. Search does not see protected accounts or a full archive, so a person who posts rarely, or only in replies, can be missing. Self-reported scores and cost figures were not re-run. Affiliation is taken from the bio or from the post, and the two are labeled separately above.
