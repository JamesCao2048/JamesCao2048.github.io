---
title: "When Coding Gets Cheaper, Choosing What to Build Matters More"
description: "How milestones, architecture decision records, and task specifications helped me keep fast-moving coding agents focused on the next release."
slug: "choosing-work-with-coding-agents"
lang: en
draft: false
kind: article
publishedAt: "2026-06-15T11:54:00+08:00"
originalSource:
  url: "https://mp.weixin.qq.com/s/BaWJPYWC_33rOffU9IvnKQ"
  title: "为什么Agent干活越来越快，我却做了更多没用的事情？"
  platform: "WeChat"
  publishedAt: "2026-06-15T11:54:00+08:00"
---

Coding agents made it much easier for me to implement a change. They also made it much easier to implement a change I did not need yet.

An unplanned feature or a refactor could take only a few minutes once I explained it to the agent. Testing it, reviewing the pull request, and maintaining the result still took time. Some changes would need to be reworked as the project evolved. Meanwhile, the work that mattered for the next release competed for my attention with everything that had suddenly become cheap to build.

I came to see a gap in a familiar assumption: better models produce code faster, so they must also help us deliver more value. **Agents lower the cost of implementation. They do not automatically improve our choice of tasks.** Work that used to be filtered out by its implementation cost can now enter the queue almost without friction. The rapid cycle of requests and results makes this feel productive, even when the queue is full of low-priority work.

In a recent project, I changed how I managed that queue. I used familiar tools—milestones, a roadmap, architecture decision records, task specifications, and issues—to make the project's priorities available to both me and the agents working in the repository.

<figure>
  <a href="/assets/blog/choosing-work/project-context.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/choosing-work/project-context.png" width="1672" height="941" alt="Task ideas, including unplanned requests, refactoring, low-priority work, and future possibilities, are filtered against the current goal. A milestone defines release scope, a roadmap orders the work, architecture decision records explain choices, specifications define requirements and acceptance criteria, and issues track tasks. The resulting work proceeds through agent execution, verification, pull requests, and delivery." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 1. Project decisions give coding agents a basis for choosing and constraining work. The documents remain in the repository so later sessions—and collaborators' agents—can recover the same context.</figcaption>
</figure>

With this change, I completed work in one week that I had expected to take three, and felt much more in control of the project. That was my experience on one project, comparing an estimate with the eventual completion time. The useful lesson was how the process helped me stay focused.

## A project with three competing priorities

The project brought agents maintained by several teams onto a shared product platform, with the aim of shipping a product that people could use end to end.

It began as exploratory work, maintained mostly by me. There was no clear process for managing requirements or releases. I tracked features in issues and labelled them `feature`, `bug`, or `design`.

After roughly three weeks, three demands arrived together:

1. My manager wanted a product release within another two to three weeks. The exploratory project now had a delivery deadline.
2. I had been using Claude Code heavily. Implementation moved quickly, but I was losing my grasp of the architecture and wanted to undertake a substantial cleanup.
3. Other teams found that some migrated agents were missing capabilities available in their original repositories. We needed to investigate those gaps and restore the expected behavior.

Shipping, refactoring, and restoring capabilities all seemed important. They had different dependencies and risks, however, and I had no clear way to order them. I spent two or three days moving between them without making the progress I needed.

That was when I brought back a basic project-management tool: a milestone.

## Give the release a boundary

With Claude Code's help, I reviewed the requirements from all three sources and defined a milestone for three weeks later. I linked the relevant existing issues to it. I also wrote down what the milestone would leave out.

Agreeing on that scope with my manager made the goal much clearer. It did not yet tell me how to reach it. Two problems remained.

First, the implementation order mattered. A poor sequence could force us to redo work that had just been completed.

Second, many architectural decisions were still ahead of us. Each new agent session needed a way to recover those decisions. Otherwise, it could implement a different interpretation or repeatedly ask to revisit a question I had already settled.

A roadmap and architecture decision records addressed those two problems.

## Preserve the order of work and the reasons behind it

I used the **roadmap** to describe what should happen first and what should follow. It answered a practical question: even if a task is worth doing, is this the right time to do it?

The sequence reflected both dependencies and urgency. Decisions about foundational mechanisms, data structures, or product entry points could change the implementation of many later features. Deferring them risked forcing the agent to adapt large amounts of newly written code. Some work also needed to happen early because a collaborating team urgently depended on it, even if it was not foundational to the architecture.

An **architecture decision record (ADR)** explained a consequential choice and its rationale. In this project, an ADR might address the choice of a key data type, the boundary of a feature, or whether to unify an underlying mechanism in the current release. It also recorded why we had decided to defer something.

I worked through most of these decisions interactively with Claude Code, with multiple rounds of review by Codex. The resulting records gave later sessions a way to recover the reasoning without repeating the whole discussion.

The milestone, roadmap, and ADRs became persistent project context. They told the next agent what we were delivering, what could wait, and why the current design looked the way it did. The same information was available to collaborators and their agents.

## Separate decisions from execution

Those documents established direction. Individual tasks still needed enough detail for an agent to carry them out.

For important tasks on the roadmap, I used a specification: a written account of the goal, scope, design, and acceptance criteria, prepared before implementation. This let me separate work that needed my judgment from work an agent could advance autonomously.

During the **decision stage**, I worked with an agent to resolve tradeoffs—for example, writing an ADR and then a detailed design. This stage consumed my attention. I had to choose boundaries, compare options, and decide what belonged in the release.

During the **execution stage**, an agent could turn that design into an implementation plan, change the code, run end-to-end checks, and open a pull request. The goal and feedback were clearer, making it easier for the agent to keep progressing through implementation, verification, and corrections.

The two stages could move forward in parallel across different tasks. Findings from execution could also inform later decisions.

<figure>
  <a href="/assets/blog/choosing-work/decision-execution.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/choosing-work/decision-execution.png" alt="Tasks A, B, and C each pass through a human–agent decision stage containing architecture decisions, detailed design, specifications, and tradeoffs, followed by an agent execution stage containing implementation planning, code changes, end-to-end verification, and pull requests. Decision and execution cycles run in parallel, with execution feedback returning to later decisions. The illustrated arrangement limits active decision work to at most two or three sessions within four to five sessions overall and cautions against putting every session into execution or every session into design." width="1672" height="941" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 2. People spend attention on decisions while agents advance well-defined execution work. The illustrated arrangement has four to five sessions moving in parallel, with attention for at most two or three decision sessions at a time. These counts describe the workflow shown, rather than a prescribed team size or a measured optimum.</figcaption>
</figure>

This separation helped with two competing problems. If I sent every task directly to an agent, a stream of quick results could keep pulling my attention toward whatever was easiest to finish. If I spent all my time on design, decision fatigue would slow the project down. Moving decisions and execution forward together gave me a way to keep both progressing.

## A refactor I was glad to postpone

Once these records were in the repository, Claude Code could use the project's goals and prior decisions alongside the code. It began helping me schedule work, reduce scope, and assess unplanned tasks. It could also remind me when I was drifting beyond the milestone.

One example came up while I was investigating a bug. I needed to inspect the trajectories—the recorded steps and actions—of several migrated agents. Their original repositories stored these records differently. While dealing with that inconvenience, I decided I might as well standardize their storage format.

Claude Code pointed back to an earlier decision: we had chosen to retain the agents' separate observability mechanisms for the time being. Unifying them was outside the current milestone and would introduce substantial schedule risk.

A common format could be valuable later. For this release, changing it would affect the behavior, verification, and adaptation of several migrated agents. It was a much larger change than the bug investigation required.

The records helped the agent explain why I should defer the work. They also helped it constrain its own changes: it could leave code alone when changing it would not serve the current goal.

This was one of the most useful effects I noticed. I still had ideas for improvements and cleanup, but I no longer had to treat every cheap implementation as an opportunity to act immediately.

## Spend the saved time on judgment

My recommendation is to invest much of the time agents save in work that improves future decisions: planning, evaluating design options, and proposing and testing hypotheses. Capture the resulting choices in milestones, roadmaps, ADRs, specifications, and issues that later agents can read and use.

That gives an agent a basis for helping with a question beyond “Can we implement this?”: “Does implementing it now help us deliver what we agreed to build?”
