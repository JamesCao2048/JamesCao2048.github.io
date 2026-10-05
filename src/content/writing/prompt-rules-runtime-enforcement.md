---
title: "Prompt Rules Need Runtime Enforcement"
description: "A compute-kernel example of moving state, retries, and acceptance checks from prompt instructions into the software around a coding agent."
slug: "prompt-rules-runtime-enforcement"
lang: en
draft: false
kind: article
publishedAt: "2026-05-25T11:57:00+08:00"
originalSource:
  url: "https://mp.weixin.qq.com/s/Vp9US0qkZcVshi5DZQSxrQ"
  title: "为什么Prompt 文件里写了100个【绝对不要】，Agent还是不听话？"
  platform: "WeChat"
  publishedAt: "2026-05-25T11:57:00+08:00"
---

When I use a general-purpose coding agent for a specialist task, my first instinct is to write down everything I know: the standard process, useful tools, common mistakes, and things the agent must never do. Instruction files and skills make that knowledge easy to package and revise. For a prototype, they work well.

Consider developing a compute kernel: code that performs a numerical operation on an accelerator such as a GPU or neural processing unit (NPU). Here, “kernel” refers to that device code, not an operating-system kernel. A prompt can explain how to divide work across parallel threads, collect performance profiles, investigate numerical errors, and debug slowdowns. It lets a domain expert turn experience into an agent workflow quickly.

The difficulty comes when the same file also becomes responsible for tracking progress, enforcing constraints, deciding when to retry, and judging whether the task is complete. Those responsibilities accumulate as more failures appear. The file gets longer, but the process does not necessarily become more reliable.

My practical rule is to put domain knowledge and exploration guidance in prompts, and move enforceable execution rules into the surrounding software. A model can help decide how to solve a problem. It should not have to remember every condition that determines whether it may proceed.

## Where the prompt takes on too much

The example comes from the open-source [`ascendc-operator-dev` skill](https://gitcode.com/Ascend/agent-skills/blob/master/skills/ascendc-operator-dev/), as discussed in the original article. It targets kernels written in Ascend C for Ascend accelerators. Its process has eight stages, numbered 0 through 7: requirements, project initialization, design, test generation, implementation, interface documentation, numerical checks, and performance evaluation.

Numerical checks compare the kernel's outputs with a trusted reference implementation within the task's allowed error tolerance. This example requires at least 30 test cases and a report. Performance evaluation then uses `msprof`, an Ascend profiling tool, to collect execution measurements and produce a performance report. These are requirements of this example, rather than a general prescription for every kernel-development task.

<figure>
  <a href="/assets/blog/runtime-enforcement/prompt-responsibilities.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/runtime-enforcement/prompt-responsibilities.png" width="1448" height="1086" alt="One prompt asks a coding agent to solve the task, track stages and artifacts, enforce rules, and manage recovery and acceptance." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 1. The prompt asks one agent to handle both the development work and the rules governing its own progress. Calling scripts for individual steps does not by itself enforce the boundaries between them.</figcaption>
</figure>

The instructions include familiar prohibitions: do not skip design, do not skip test generation, and do not bypass numerical checks or performance evaluation. The constraints also concern the implementation itself. The requested computation must run in the new kernel. Calling existing PyTorch operations instead, or moving the core computation to the CPU that controls the accelerator, can produce the expected output while failing the requirement to implement an accelerator kernel.

In practice, I have seen agents take such shortcuts despite explicit instructions. Adding another prohibition is an easy response. Splitting a large prompt into smaller files loaded on demand can help organize the material, too. But neither change turns a written instruction into an execution constraint.

A large language model generates decisions probabilistically. It can follow detailed instructions, but a sentence saying “never skip this step” does not itself prevent a stage transition. The surrounding system must make that transition conditional on an actual check.

## Let the workflow manage execution

Anthropic draws a useful architectural distinction: workflows organize model and tool calls along predefined paths, while agents let the model decide more of the process as it runs. Its recommendation is to start with the simplest approach that fits the task; predictable workflows suit well-defined work, while agents are useful when the route requires flexible decisions. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).

For kernel development, I would keep the outer process explicit while letting the agent explore within particular stages. The workflow can track the current stage, decide which inputs are available, enforce a retry limit, and require evidence before advancing. The agent can concentrate on decisions such as choosing an implementation strategy or diagnosing an error. The design below is a conceptual reorganization of the example, not a report of a deployed system.

<figure>
  <a href="/assets/blog/runtime-enforcement/runtime-acceptance.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/runtime-enforcement/runtime-acceptance.png" width="1448" height="1086" alt="The runtime selects a stage and produces artifacts, then checks acceptance. A pass allows progress or completion. A failure leads to repair and another check while budget remains, or stops for review." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 2. A conceptual workflow: the runtime advances only after acceptance checks pass. Failed checks lead to bounded repair or review; the final stage must pass before the task is complete. The example allows three repair attempts.</figcaption>
</figure>

Three mechanisms make the division concrete.

### Move routine control into code

The workflow should own the parts of the process whose rules are already known: which stage comes next, which artifacts must exist, how many retries remain, and where execution resumes after an interruption. It should record the accepted artifacts and current stage so that a resumed run can identify unfinished work. A script can run a known evaluation procedure without asking the agent to reconstruct it from prose each time.

This also reduces the process bookkeeping competing for the agent's context. The prompt still explains the task and the domain, but it no longer has to serve as the only record of execution state.

### Use hooks to check actions during execution

A hook runs at a defined point in the agent's execution. For rules that can be checked in code, it gives the surrounding system a chance to inspect a proposed action before allowing it to continue.

Claude Code's `PreToolUse` event is one such integration point: a handler can inspect a proposed tool call and return a denial. The exact behavior depends on the event and handler configuration. [Claude Code hooks reference](https://code.claude.com/docs/en/hooks#pretooluse).

In this workflow, a programmatic check could reject a tool action that edits protected tests. The example also limits self-repair to three attempts; the runtime should count those attempts and stop starting new ones when that budget is exhausted. These are rules to implement and test, not protections obtained merely by naming a component “hook.”

Hooks are one enforcement mechanism, and their coverage matters. A check on one editing tool does not necessarily cover another way of writing the same file. They also do not replace a sandbox: Claude Code's command hooks run with the user's permissions. [Hook security considerations](https://code.claude.com/docs/en/hooks#security-considerations).

### Use gates to check the evidence for progress

A gate decides whether the conditions for entering or leaving a stage have been met. If an agent reports that a kernel is finished and its numerical tests passed, the next stage should depend on the test evidence rather than the report alone.

For example, the gate can inspect the recorded test results or independently run the acceptance tests. It then needs an explicit outcome:

- **Pass:** record the accepted evidence and advance to the next stage.
- **Fail, with repair attempts remaining:** keep the stage unaccepted, pass the failed checks to the repair step, and check the revised output again.
- **Fail, with the retry budget exhausted:** stop for review rather than advance with missing evidence.

The last stage needs acceptance checks too. Producing a performance report is not enough by itself; the report must meet the task's stated acceptance criteria before the workflow marks the task complete. If a repair changes an earlier output, any checks that depended on that output need to run again. Otherwise, a passing result may describe an older version of the code.

The distinction is between an agent's claim and an independently checked condition. A passing check still establishes only what that check covers. Tests can miss cases, validators can contain defects, and the task specification itself can be incomplete. Programmatic enforcement makes the acceptance process explicit; it does not prove that the entire program is correct.

## Keep room for exploration inside the process

A fixed outer workflow does not require prescribing every implementation decision. In the engineering tasks I work with, the broad sequence is often stable: understand the requirement, choose an approach, implement and verify it, then preserve the result. Much of the uncertainty lies inside those stages.

For a kernel, the agent may need to explore parallelization strategies, explain a numerical mismatch, or work out why a seemingly reasonable implementation is slow. For a GitHub issue, it may need to locate the responsible code and decide what change fits the existing design. Those choices are difficult to reduce to a predetermined sequence of edits.

The workflow can manage the boundaries around that exploration. It determines when the agent starts, what evidence it receives, and what must be checked before its output is accepted. The agent retains freedom over the solution within those boundaries.

## Develop the prompt and the workflow together

I would still start a new domain task with a prompt-based prototype. Natural language is quick to write, and a domain expert can review it without first understanding a workflow engine. At this stage, a detailed prompt is a useful way to discover the process.

As repeated runs reveal stable steps and recurring failures, extract the parts that can be enforced into code. A remembered instruction becomes a checked precondition. A recovery suggestion becomes a defined retry path. An informal completion claim becomes an acceptance check.

<figure>
  <a href="/assets/blog/runtime-enforcement/iterative-enforcement.png" title="Open full-size diagram" class="diagram-link"><img src="/assets/blog/runtime-enforcement/iterative-enforcement.png" width="1491" height="1055" alt="Two intertwined paths show prompt-based exploration and workflow consolidation: new requirements lead to prototypes, validation, and discovered pitfalls; stable rules become reusable workflows, hooks, and gates, while new problems feed back into exploration." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 3. An iterative development model: explore new requirements in prompts, turn stable rules into tested workflow components, and return to exploration when new problems appear.</figcaption>
</figure>

I think of these as two strands that develop together. The prompt helps discover what the system needs to do. The workflow captures the parts that are understood well enough to enforce. This resembles prototyping in a flexible language and then reimplementing a critical component once its requirements are clear. Here, the pressure to move from prose into code comes from the need for repeatable execution and explicit checks.

The first step remains defining the task and its acceptance criteria, a point I discussed in the [earlier article on autoresearch and application development](/writing/autonomous-research-feedback-loops/). Then map the working process and prepare the knowledge, environment, and tools it requires. A workflow cannot compensate for an unclear definition of success.

This takes cooperation between domain experts and the people building the agent system. Domain experts define requirements, acceptance criteria, and useful task knowledge. System builders turn those requirements into component boundaries, execution controls, observable state, and tests. Each needs feedback from the other.

An explicit workflow is also a practical starting point for an agent harness: the surrounding software that determines when an agent runs, what context and tools it receives, when it retries or stops, and how its results are accepted. You can begin with one recurring failure. Identify the rule the prompt keeps asking the agent to remember, implement a check at the relevant boundary, and make the workflow responsible for acting on the result.
