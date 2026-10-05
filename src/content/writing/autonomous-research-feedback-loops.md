---
title: "Why Autonomous Research Loops Do Not Automatically Build Useful Apps"
description: "Research agents benefit from stable goals and fast, automatic feedback. Application development needs the same foundations, plus an explicit boundary around what tests cannot decide."
slug: "autonomous-research-feedback-loops"
lang: en
draft: false
kind: article
publishedAt: "2026-05-02T11:55:00+08:00"
originalSource:
  url: "https://mp.weixin.qq.com/s/P6SmJT-G_6__I4HpBNIpQQ"
  title: "为什么AutoResearch可以自动刷SOTA，却很难做 APP？"
  platform: "WeChat"
  publishedAt: "2026-05-02T11:55:00+08:00"
---

A coding agent can change a training program, run an experiment, inspect the result, and try again without asking a person to approve each attempt. That loop is compelling: leave a clearly defined optimization task running, then return to a record of what worked and what failed.

But “improve this model's validation score” and “build an app people want to use” are different kinds of instruction. The first can come with a fixed way to measure progress. The second leaves much more undecided: whose problem to solve, which behavior matters, and whether the result is useful.

My view is that longer autonomous runs will become an important part of software development. Getting there requires more than asking the agent to keep working. We need to define what it can change, how it will receive feedback, and which decisions still require a person.

## What makes an autonomous experiment loop work

Andrej Karpathy's [autoresearch](https://github.com/karpathy/autoresearch) provides a deliberately narrow example. The agent edits `train.py`, which contains the model and training procedure. It runs a short training experiment, compares the result with previous attempts, and keeps or discards the change.

The boundaries matter. Data preparation and evaluation live in `prepare.py`, which the agent is instructed not to modify. Each experiment has a five-minute training budget, excluding startup and compilation. The objective is to reduce validation bits per byte, a measure of how well the model predicts held-out text; lower is better. The [experiment instructions](https://github.com/karpathy/autoresearch/blob/master/program.md) also define logging, failure handling, and the experiment loop.

The agent therefore has substantial freedom _inside_ a task that people have already specified. It does not have to decide what counts as a useful language model or invent a new evaluation procedure after every change.

<figure>
  <a href="/assets/blog/autonomous-feedback/experiment-loop.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/autonomous-feedback/experiment-loop.png" width="1447" height="1087" alt="People define the objective, evaluation, and execution environment before an agent repeats a cycle of reviewing past experiments, proposing a change, running it, evaluating it, and recording whether to keep a change, revert it, or record a failed run." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 1. A conceptual autonomous experiment loop. People prepare the task and evaluation; the harness supplies execution, checks, and records. Individual attempts can improve the result, make it worse, or fail.</figcaption>
</figure>

Here, a **harness** means the software around the agent: the tools, execution environment, state, and checks that let it act and receive feedback. A useful loop needs those components to work together. Generating another code change is only one step.

Other research systems use related approaches at larger scales. The March 2026 [AVO paper](https://arxiv.org/abs/2603.24517) reports seven days of autonomous search for attention kernels—GPU code implementing the attention operation used in transformer models. On NVIDIA B200 GPUs, its multi-head attention kernels exceeded FlashAttention-4's performance by up to 10.5% in the evaluated configurations. That is a result for specific workloads and hardware, not evidence of a universal speedup or the removal of human setup work.

[AutoSOTA](https://arxiv.org/abs/2604.05550), published in April 2026, describes a system that reproduces research code, runs experiments, and proposes further improvements. Its evaluation selects papers with available code and manageable execution costs. The [project repository](https://github.com/tsinghua-fib-lab/AutoSOTA) provides the resulting code and optimization records. These examples are useful because they expose the conditions that make repeated experimentation possible, not because every software task can immediately use the same loop.

## Difficulty depends on the feedback available

Optimizing a machine-learning model or a GPU kernel can require considerable mathematical and hardware expertise. Yet a well-defined instance of that problem may offer an agent a clearer path forward than an apparently simple business application.

If an experiment can run cheaply and return a trustworthy result, the agent can test an idea, inspect the failure, and revise it. Difficult implementation details remain difficult, but the loop has a way to make progress. Ambiguous requirements, incomplete evaluation, and expensive feedback create a different problem: the agent may keep producing changes without a dependable signal that they help.

I think of tasks as lying on a **spectrum**, rather than belonging to two fixed categories:

- At one end, requirements are relatively stable, results can be checked automatically, and attempts are inexpensive enough to repeat.
- At the other, requirements are still being discovered, evaluation depends on human judgment, and each attempt has a long or costly feedback cycle.

<figure>
  <a href="/assets/blog/autonomous-feedback/task-spectrum.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/autonomous-feedback/task-spectrum.png" width="1448" height="1086" alt="A conceptual spectrum runs from stable requirements, automatic checks, and fast feedback toward changing requirements, human judgment, and costly feedback. Clearer requirements and better tests can make a task more suitable for autonomous execution." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 2. A qualitative way to compare tasks, not a measured scale. A task's position can change as requirements become clearer, tests improve, or the problem itself changes.</figcaption>
</figure>

An app is not permanently stuck at the second end. A specific feature with agreed behavior and executable acceptance tests can support a substantial autonomous implementation loop. Conversely, a kernel task with an unclear correctness requirement or an unreliable benchmark may need frequent human intervention.

This is where ordinary software-engineering work becomes central to agent performance. Clear requirements, maintained tests, and reproducible environments give the agent better feedback. Poorly maintained versions of those same artifacts make an otherwise manageable task depend on repeated clarification.

## Three things to prepare before a long run

For engineers building these systems, I see three closely related responsibilities.

**Define the task in a form the agent can act on.** State the expected behavior, the scope of permitted changes, and the constraints. “Make the product better” leaves the agent to guess at the objective. A bounded feature or optimization goal gives it something it can work toward and you can assess.

**Turn the requirements into repeatable evaluation.** In research, this may be a benchmark: a fixed set of cases and a procedure for measuring the result. In application development, it may be an acceptance-test suite. The goal is to let the implementation loop check its own output without waiting for a person at every iteration.

**Provide an environment in which attempts are practical.** Prepare the relevant data, tools, dependencies, and execution resources. Make failures observable and experiments repeatable. A loop that spends most of its time waiting for access, reconstructing setup, or asking someone to interpret missing logs is not ready for a long autonomous run.

These are not independent checkboxes. The task determines what must be evaluated; evaluation determines which data and tools the environment needs. Designing them together requires understanding the actual business or research problem.

Consider this **illustrative** application task:

> Add CSV export to the existing expenses page. Export only the signed-in user's filtered records, preserve the documented column order, and handle an empty result. Keep authentication and the database schema unchanged.

Those conditions suggest concrete tests: filtered rows, column order, empty output, and access isolation. The agent can iterate against them. But the tests do not establish whether CSV export is the feature users need most, or whether the interface is understandable. Those questions require a different kind of evidence.

## Keep evaluation aligned with the requirement

Automatic checks help only to the extent that they reflect the task. If a test accepts the wrong behavior, a successful run may still produce the wrong product. Making the loop faster does not repair that mismatch.

For a bounded task, I want evaluation to cover enough of the requirement that a passing result is useful acceptance evidence. Where it cannot, the remaining human review should be explicit. That is more workable than discovering, after every supposedly complete run, that someone still needs to make an unspecified judgment.

Evaluation also needs maintenance. When the required behavior changes, the corresponding tests and acceptance criteria must change with it. Otherwise, the agent is optimizing toward an old specification. Keeping requirements and evaluation aligned is continuing engineering work, not setup that happens once.

## Move human attention to the decisions that need it

Reducing intervention during implementation does not mean eliminating people from software development. People still choose goals, resolve conflicting requirements, design evaluation, and decide whether the result is worth using. They also decide the run's budget and when to change or stop the work.

What I want to reduce is the need for someone to supervise every ordinary edit, experiment, and retry after those decisions are made. Human attention is limited. If every iteration needs an approval, adding more agents mostly creates a longer queue of decisions for the same person.

Before asking an agent to work for longer, choose one bounded task and examine its feedback path. Can it run the relevant checks? Do those checks represent the agreed requirement? Can it recover from an ordinary failed attempt? Is the point where it must return to you clear? Improving those conditions gives a longer run a purpose—and a way to tell whether it has made progress.
