# Agent-assisted X work, without handing over the account

Research date: 2026-10-06. Audience: people who build agents, harnesses, evals, and coding tools. This note covers agents that listen, turn a person's own work into drafts, suggest replies, and review what shipped. Another pass covers creator examples and content patterns. Nothing here was posted, and no X account was connected.

The cadence this serves is the one in [publishing-flow.html](publishing-flow.html): 1–2 blog posts a week on the site, each shared on X, with standalone posts making 3–5 X posts a week in total. Replies are optional and are not part of that count. One blog post a week is enough.

## How this was searched

Native X search in this session worked. Posts below came from keyword search, semantic search, and thread fetches on 2026-10-06. Official rules came from docs.x.com and the X Help Center. Product pages and one GitHub file were opened only to check whether a claim had a public artifact behind it. Videos attached to posts were not watched. Like and view counts are the counts at fetch time. They are reach of that post. They are not evidence that the workflow grew a following.

`.agents/models.md` assigns Grok 4.7 to X research. This note is that pass. No further agents were started.

## What is worth using

The pattern that shows up in the specific posts, and that fits the publishing rhythm, is a weekly draft desk:

- The agent reads git history, a short note of what was actually verified, and an optional pile of the author's own past sentences.
- It proposes a few story candidates, a blog outline, and standalone posts that can stand without a link.
- It may rank threads the person has already pasted, and draft a reply only when the draft adds a fact from that person's work.
- The person rewrites, posts by hand, and keeps a one-line log of what they actually published.
- The agent never posts, likes, follows, replies, or @mentions anyone.

Tools that connect an X account, post on a timer, or "listen to X 24/7" exist as products. They are optional later, and they are outside this workflow because this research assumes no access to Neil's X account.

## Rules that bound the workflow

Checked against X's own pages, not vendor summaries of those pages.

- The account holder is responsible for apps they authorize. The automation rules were marked updated April 2026. [X Help, Automation rules](https://help.x.com/en/rules-and-policies/x-automation)
- Automated replies and mentions need a prior opt-in. A follow is not consent. One automated reply per interaction. Replies fired from keyword search are not allowed. An AI reply bot needs prior written approval from X before it runs. [Same help page](https://help.x.com/en/rules-and-policies/x-automation), and the developer guidelines' "AI-Generated Content & Replies" section. [Developer guidelines](https://docs.x.com/developer-guidelines)
- Automated likes are not allowed. Automated hide-replies are not allowed. [Automation rules](https://help.x.com/en/rules-and-policies/x-automation)
- Scripting the X website, or any automation outside the official API, is prohibited and can permanently suspend the account. [Developer guidelines](https://docs.x.com/developer-guidelines)
- Using X content to train a foundation model is prohibited, with Grok excepted. Putting a handful of one's own posts into a prompt is a different act from training. This note does not recommend fine-tuning on X data. [Restricted uses](https://docs.x.com/developer-terms/restricted-use-cases)
- On 2026-02-23, self-serve `POST /2/tweets` replies were limited to cases where the original author has summoned the replier, by @mention or by quoting them. Enterprise access was not included in that change. [Changelog](https://docs.x.com/changelog), [developer community post](https://devcommunity.x.com/t/x-api-v2-update-addressing-llm-generated-spam/257909)
- From 2026-04-20, a normal API post is $0.015 and a post that contains a URL is $0.20. Summoned replies are $0.01. Reads of one's own tweets, mentions, likes, and follows are $0.001. Following, likes, and quote-posts were removed from self-serve API tiers. [Changelog, 2026-04-16](https://docs.x.com/changelog)
- Scheduled posting of one's own informational content is allowed when the other rules are met. The native place to do that without an app is the calendar in the x.com composer, or X Pro. That path does not need an API key.
- On 2026-07-24, Nikita Bier wrote that X had removed 42,000 accounts that were automating replies with chatbots, and that programmatic engagement without a person in the loop runs against the product. On 2026-07-25 he wrote that the bulk of those accounts were posting AI thought-leadership spam to grow accounts and to attract paid promotion. On 2026-08-14 he wrote that replies were dropped from the monetization impression count because they had been the main incentive to spam. [2026-07-24](https://x.com/nikitabier/status/2080747924380856519), [2026-07-25](https://x.com/nikitabier/status/2081111047340167485), [2026-08-14](https://x.com/nikitabier/status/2088292067189661733). His profile bio on 2026-10-06 says former head of product at X. The July posts speak as "we."

A person who reads a thread, rewrites a draft, and presses Post is not running an AI reply bot. An app or agent that sends the reply is. The workflow below stays on the first side of that line.

Several 2026 vendor guides publish daily like and reply quotas, or say browser automation is mostly safe. Those guides are not the rules above.

## Primary examples

Six posts from the last six months describe a concrete loop. Each one is labeled with what was actually checked.

### 1. Commits to a draft, then a person edits before anything is queued

Ruby (@imrubytang), 2026-09-29. [Post](https://x.com/imrubytang/status/2104974775839772805). 0 likes, 66 views. A 10-second video is attached and was not watched.

She describes a Claude Code task that drafts posts from her commits, sends them to her on Telegram because Claude is blocked where she is, takes edits such as extra talking points or "shorter," and only after she approves builds a carousel and a reel and queues them in Buffer.

Usable piece: the source is her own commits, the edit channel is a normal chat, and approval is a separate step from drafting. Unverified: that the task runs, what the drafts look like, and any result beyond this post. Buffer at the end requires an account connection, so that last step is out of the minimal workflow.

### 2. Daily drafts from commits, then one's own archive as a voice sample

Hikmet Melik (@bir_doksanbes), 2026-07-10. [Post](https://x.com/bir_doksanbes/status/2075501535568839026). 8 likes, 8,124 views. He says one Claude Code session set up a 07:41 job that drafts three posts from his real commits, that he approves every word, and that nothing auto-posts. Delivery is Telegram plus a self-hosted panel kept in git. He quoted a 2026-07-09 Turkish post by Yıldırım (@yildirimsertbas), [here](https://x.com/yildirimsertbas/status/2075203890308395138) (116 likes, 21,604 views, 289 bookmarks). That post tells people to download their X data, turn `tweet.js` into JSON as a tone corpus, have Claude Code build a panel for posts, replies, and trend analysis, and connect a tool called Xquik.

On 2026-07-11 Hikmet wrote that he had pulled 189 of his own posts that morning and that new drafts were written against them. He also wrote that question hooks won and bare announcements lost. [Follow-up](https://x.com/bir_doksanbes/status/2075871866393346409). 0 likes, 55 views. That claim is one day old in the post. It is a self-report, not an outcome study, and it does not say anything about followers.

Usable piece: drafts from one's own commits, a human approves every word, and a small set of one's own past posts can sit in the prompt as voice context. The quoted post's reply generator and trend scanner are the part to leave out. They sit next to the July removal of reply chatbots and the written-approval rule for AI reply bots. Three drafted posts every morning is also more volume than the 3–5 published posts a week already planned. Drafts can outnumber posts. A quota that must be filled will not.

### 3. A documented preview gate in front of publishing

tyagi (@vb_tyagi), 2026-09-22. [Post](https://x.com/vb_tyagi/status/2102270057971880396). 36 likes, 2,854 views. He announced capx-café, an open-source MCP server that turns commits, fixes, and releases into X posts from a coding agent: draft, preview, schedule, publish, with the X token kept on a server. The next post in the thread states the prompt as "read this week's commits, draft a build update in my voice, show me before publishing," and says it works with Claude Code, Cursor, Codex, and Windsurf. [Workflow post](https://x.com/vb_tyagi/status/2102270604741345558). A third post says the agent gets a short-lived session handle, every publish goes through server-side guardrails, and hosted use means trusting the operator. Self-hosting is offered. [Token post](https://x.com/vb_tyagi/status/2102271225645121652).

The public repo is [vb-tyagi/capx-cafe](https://github.com/vb-tyagi/capx-cafe). Its [compliance checklist](https://github.com/vb-tyagi/capx-cafe/blob/main/docs/X-COMPLIANCE.md), dated 2026-08-29, says the app posts only to the authorizing user's account, does not read other accounts, does not automate likes, follows, or replies to third parties, and does not itself generate the copy. Replies are limited to chains on the user's own posts. Third-party AI replies stay off until X gives written approval. The same file still has the use-case filing and X's acknowledgement as unchecked boxes. The README's own diagram also shows a queue posting about once a day with the laptop off once the queue is full. That is a real product shape, and it is a different risk from "show me before publishing."

Usable piece: a dry-run preview, an audit log, and a hard separation between the writing agent and the credential. This research did not find evidence that anyone besides the author runs it. Connecting an account is a later decision. It is not part of the workflow below.

### 4. A weekly changelog run that drafts the article and the social posts together

Colin Armstrong (@colinarms), 2026-10-06, the day of this research. [Post](https://x.com/colinarms/status/2107553326372147265). 11 likes, 650 views. A video is attached and was not watched. He announced Paragraph's Changelog Playbook: connect GitHub, and the agent drafts articles, social posts, and videos from what shipped.

The product post the same day says the agent drafts a customer-facing article, a week of X and LinkedIn posts, an optional long X Article, and images or video, then emails when drafts are ready. The person edits, picks the account, and approves the time. Nothing goes out without that approval. The run is weekly or on demand. [Introducing the Changelog Playbook](https://paragraph.com/@blog/introducing-the-changelog-playbook), 2026-10-06. Distribution docs say the same: drafts wait, and a thread is shown as one card per post against the 280-character limit. [Distribution](https://docs.paragraph.com/distribute)

On 2026-09-08 the same company described a social sub-agent that drafts, publishes approved posts, and "reads your timeline to see what landed." [Agent fleet](https://paragraph.com/@blog/meet-the-agent-fleet-behind-your-content-engine). That is a product claim. No method and no measured result were published with it.

Usable piece: one weekly pass from the repo produces the blog and a small set of different social drafts, and publishing is a separate approval. This is a vendor launch, not an independent user's result. The same shape can be done with local git and a markdown draft, without Paragraph and without connecting X.

### 5. A listening digest, with the access method unstated

Ishaan Sehgal (@ishaansehgal), 2026-08-25. [Post](https://x.com/ishaansehgal/status/2092069323171074141). 23 likes, 1,250 views, 8 bookmarks. He says an agent on Omnara listens to X continuously for a product or niche and sends a daily digest of high-signal threads, and he links a live demo. Replies under the post are short encouragement. None of them describe using it. The post does not say whether the listener uses the official API or reads the site.

signüll (@signulll), 2026-04-06, at the edge of the six-month window. [Post](https://x.com/signulll/status/2041273220280562050). 406 likes, 24,270 views, 226 bookmarks. He describes a morning summary of new followers worth knowing and threads he missed, plus follow-back recommendations, rendered as a page rather than a text dump. A reply asks him to open-source it. He does not say how the timeline is read.

Usable piece: the output shape. A short, ranked list of threads a person might have missed, for them to open and decide. The 406 likes show that builders want that list. They do not show that either agent works, and they do not show follower growth. A 24/7 listener that is not on the official API conflicts with the scraping rule. For a workflow with no X account and no API app, the honest version of listening is a tray the person fills while reading: URL, author, the sentence they might answer, and what they personally know.

### 6. A morning pass that also reports whether you are actually posting

Jordan Rejaud (@JordanRejaud), 2026-09-17. [Post](https://x.com/JordanRejaud/status/2100615300374999206). 1 like, 58 views. An 18-second video is attached and was not watched. He says a morning cron reads git across his repos, closed Linear tickets, and what people used, then drafts posts and leaves them unscheduled for him to approve. He says the post itself is one of those drafts, and that the agent told him he was posting once a week against a target of four.

Usable piece: the inputs are work records, drafts stay unscheduled, and the review includes a cadence check. "This tweet is one of them" cannot be checked from outside. His target of four is close to the 3–5 already in the publishing flow, with one difference: the flow counts published posts, and treats replies as optional. A target that the agent nags him to hit is how a quiet week becomes filler. The useful report is "you published two standalone posts and no blog," not "you are behind."

Alex (@alexfoundr), 2026-10-03, is the closest public statement of how a draft stays honest. [Post](https://x.com/alexfoundr/status/2106376222083109044). 3 likes, 40 views. He says a release note gets the issue, the diff, the commit, and a preview of that revision. The agent checks the change, walks a success path and a failure path, drafts only what it can show, flags the rest, and cannot mark the issue done or publish. Other posts on the account in the same week read like a timed advice series, so this is a standard to copy, not proof of a system. Applied here: a post about a behavior needs the commit, the check or the note of what was run, and a screenshot or command output the person supplies. If those are missing, the draft says it cannot verify the claim.

## Filtered out

- alex (@alextalksai), 2026-07-31 and again 2026-08-27, advertised agent-reach: one install so an agent can read X, Reddit, YouTube, and GitHub without API keys, by parsing the sites. The July post had about 300 likes and 166,510 views. He adds that it is for research and prototyping, not production scraping. [2026-07-31](https://x.com/alextalksai/status/2083267412821245953). High reach, and it is the path the developer guidelines say can permanently suspend an account. It is not a listening option.
- SandHive posts from 2026-10-02 and 2026-10-04 describe a tool that finds conversations and writes the reply. A handful of views. That is generic reply generation, which this workflow does not use.
- Thinner versions of the same claim, not used as evidence: a 2026-09-11 post about a git-to-queue bot that waits for approval (2 likes), a 2026-09-18 Claude Code "build in public" skill (2 likes), a 2026-07-27 ghostwriter skill (12 views), and a 2026-09-27 Cursor-plugin ad (21 views). Specific sentences, no artifact checked, no result a reader can inspect.
- PostEverywhere, capx's "let your AI run your X" headline, and Paragraph's timeline-reading claim are marketing. The underlying approval step is the part that matches the rules. The headline is not.

## A week of work, with no X login

This assumes the publishing flow already chosen: one or two blog posts, three to five X posts, replies extra and optional. The agent works from files. It does not have an X session, an API key, or a browser pointed at x.com.

### What the person brings

All of this can be a paste or a file in the repo.

1. Git since the last pass. Subjects and bodies for the two weeks, and the diff only for the story under consideration. Hashes included.
2. A work note of a few lines: what broke, what was run, what would be false if it were posted. The note is the source for anything the diff does not show.
3. The blog draft, if one exists. "No post this week" is a complete input.
4. A reply tray of at most ten posts he chose while reading. Each entry is the URL, the author, the sentence he might answer, and the fact from his own work that would make the reply worth sending. An empty tray is a normal week.
5. Voice context, optional. Eight to thirty of his own sentences, from memory or from an archive he downloaded himself. This is prompt context. It is not training data, and it is not other people's posts.
6. A log of what he published: date, URL, one line on the topic, and whether a draft was killed. Public reply or bookmark counts only if he copies them himself. Follower count is not an input.

### What the agent returns

1. Two or three story candidates. Each names the commits it depends on, and one sentence that would be false if he published it.
2. For the story he picks, a blog outline: the problem, what he tried, what the diff shows, what he verified, what is still open. Any claim with no line in the diff or the note is marked unverified.
3. Three standalone drafts that are not a blog chopped into posts. Each one carries a concrete detail from the diff or the note: a failure, a command, a number he recorded. In a week with a blog, one of the X posts can be the share, with the takeaway and the link, and the others still have to make sense alone. In a week without a blog, the standalone drafts are the whole X output.
4. From the tray only, at most two reply drafts. Each adds a fact from the repo or the note. No search of X, no @mentions added by the agent, no draft that only agrees. An empty tray produces no replies.
5. A review of the log: topics repeated, drafts he keeps killing, and whether this week has a demo he can show. The demo standard is the commit, the check, and an artifact he captured. The review does not say that a post gained followers.

### What the person does

- Picks the story, or skips the blog that week.
- Rewrites every sentence that will be public. The draft is disposable. Voice samples do not replace that pass.
- Publishes the blog on the site first when there is one, then posts on X himself. If he wants a time, he uses the composer calendar or X Pro after the words are his.
- Sends a reply only when he would say it to that person. Generic agreement gets deleted. Replies are not required to hit 3–5.
- Adds one log line per post he actually published.

A week with one blog looks like: the post, one X share of it, and two or three standalone posts from the same work, for a total around four. A week with no blog looks like two or three standalone posts, or none. Silence is a valid output. The agent should say "nothing here is worth a post" when the log is chores.

Substack stays where the publishing flow put it: a weekly copy of the blog posts that already shipped, done by the person. The agent can assemble that copy from the published markdown. It does not send the email.

### What to measure after a month

Worth keeping: how many blog posts shipped, how many X posts were standalone, which drafts were killed, and whether replies came from people who work on agents, harnesses, or evals. Those are descriptions of the work and of the conversation.

Not worth claiming: that a like count, an impression count, or a follower change was caused by the workflow. The primary posts above do not report follower counts at all. The largest numbers in this note, including the 42,000 removed accounts and signüll's 24,270 views, measure something else: enforcement, and interest in a digest. They are not a growth result for the method.

The failure mode visible in the July enforcement posts is a stream of AI thought-leadership whose job is to look active. A weekly pass grounded in commits, with the person rewriting and with permission to publish nothing, is the practical protection against that. An agent that posts while the laptop is closed, replies to strangers, or scrapes the timeline is the version that collides with the rules and with the audience this is for.

## Sources

X posts, fetched 2026-10-06:

- https://x.com/imrubytang/status/2104974775839772805 — 2026-09-29
- https://x.com/bir_doksanbes/status/2075501535568839026 — 2026-07-10
- https://x.com/bir_doksanbes/status/2075871866393346409 — 2026-07-11
- https://x.com/yildirimsertbas/status/2075203890308395138 — 2026-07-09
- https://x.com/vb_tyagi/status/2102270057971880396 — 2026-09-22
- https://x.com/vb_tyagi/status/2102270604741345558 — 2026-09-22
- https://x.com/vb_tyagi/status/2102271225645121652 — 2026-09-22
- https://x.com/colinarms/status/2107553326372147265 — 2026-10-06
- https://x.com/ishaansehgal/status/2092069323171074141 — 2026-08-25
- https://x.com/signulll/status/2041273220280562050 — 2026-04-06
- https://x.com/JordanRejaud/status/2100615300374999206 — 2026-09-17
- https://x.com/alexfoundr/status/2106376222083109044 — 2026-10-03
- https://x.com/alextalksai/status/2083267412821245953 — 2026-07-31
- https://x.com/nikitabier/status/2080747924380856519 — 2026-07-24
- https://x.com/nikitabier/status/2081111047340167485 — 2026-07-25
- https://x.com/nikitabier/status/2088292067189661733 — 2026-08-14

Official X:

- https://help.x.com/en/rules-and-policies/x-automation — updated April 2026
- https://docs.x.com/developer-guidelines
- https://docs.x.com/developer-terms/restricted-use-cases
- https://docs.x.com/changelog — 2026-02-23 reply restriction; 2026-04-16 pricing, effective 2026-04-20
- https://devcommunity.x.com/t/x-api-v2-update-addressing-llm-generated-spam/257909 — 2026-02-23

Checked artifacts behind the product posts:

- https://github.com/vb-tyagi/capx-cafe
- https://github.com/vb-tyagi/capx-cafe/blob/main/docs/X-COMPLIANCE.md — checklist dated 2026-08-29, filing boxes unchecked when read
- https://paragraph.com/@blog/introducing-the-changelog-playbook — 2026-10-06
- https://paragraph.com/@blog/meet-the-agent-fleet-behind-your-content-engine — 2026-09-08
- https://docs.paragraph.com/distribute

Local cadence this workflow is sized to: `.agents/artifacts/publishing-flow.html`.
