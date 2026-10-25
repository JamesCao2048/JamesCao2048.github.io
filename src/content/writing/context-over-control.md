---
title: "Context Over Control: Rethinking What We Add to Agents"
description: "Why I retired my diagramming skill and uninstalled Superpowers: give agents clear goals, the context and tools they need, and explicit acceptance checks—then let them choose how to work."
slug: "context-over-control"
lang: en
draft: false
kind: article
publishedAt: "2026-10-25T00:00:00Z"
originalSources:
  - url: "https://mp.weixin.qq.com/s/bRAm1JZ-sHuueq7oYGtO9Q"
    title: "很多人找我要的 AI 画图 Skill，被资本做局干掉了"
    platform: "WeChat"
    publishedAt: "2026-05-06T22:13:00+08:00"
  - url: "https://mp.weixin.qq.com/s/1g3ox7BjIkHmwMf-Y9JUgw"
    title: "我的画图skill阵亡后，30万star的Superpowers也没能幸免"
    platform: "WeChat"
    publishedAt: "2026-10-14T11:45:00+08:00"
---

A diagramming skill I built for Claude Code lasted about three months. It helped me prepare technical presentations, spread among colleagues, and eventually became something I told people they no longer needed.

Later, I uninstalled Superpowers, a collection of skills that had made coding agents much more useful to me. The reasons were similar enough to make me reconsider the workflows I had built myself.

Both had solved real problems. As the underlying products improved, the extra steps became harder to justify. My working principle now is to **give the agent a clear goal, the information and tools it needs, and explicit acceptance criteria—then let it choose the steps.** Where those criteria can be checked in code, I want deterministic checks that I control. I increasingly leave the detailed route to the agent.

## The diagramming skill that became too much work

When I started using Gemini's Nano Banana to draw architecture diagrams, I kept running into two problems: text could be difficult to read, especially in Chinese, and the structure was hard to adjust without regenerating the image and possibly making it worse.

For an important presentation in January 2026, I built a Claude Code skill to help. A skill is a reusable package of instructions, sometimes accompanied by scripts or reference material, that an agent can load for a particular task.

Mine first had Claude Code examine the code or workflow and discuss the proposed diagram with me. We would agree on what to show and how much detail to include. It then produced a very specific drawing prompt, down to the text inside each node and the visual style. I copied that prompt into Gemini to generate the image.

This worked well. I could produce both high-level presentation diagrams and more detailed diagrams for understanding code. Colleagues asked how I made them, and I sent the skill around enough times that I eventually put it on GitHub.

Here is one of the presentation diagrams I made with that workflow, showing what the OpenClaw project's memory system keeps and discards:

<figure>
  <a href="/assets/blog/context-over-control/openclaw-memory-example.png" title="Open full-size original diagram" class="diagram-link"><img src="/assets/blog/context-over-control/openclaw-memory-example.png" width="1080" height="589" alt="An original presentation diagram from my Claude Code and Gemini workflow, organizing OpenClaw's memory system into incoming messages, active-session context, persistence paths, memory recall, and retained or discarded information." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 1. An original output from my Claude Code + Gemini workflow, reproduced from the May article as an example of the diagrams it produced. Open the full-size image to inspect the detail.</figcaption>
</figure>

Then I tried GPT Image 2. For the kinds of diagrams I often needed, a short description could produce a useful starting point. For one example, I asked it to show what a project's memory system kept or discarded and included the repository URL. The request still pointed to the relevant code. I could also ask for a change directly, without repeatedly rewriting the long prompt that connected the two tools.

<figure>
  <a href="/assets/blog/context-over-control/diagram-workflow.png" title="Open full-size illustration" class="diagram-link"><img src="/assets/blog/context-over-control/diagram-workflow.png" width="1448" height="1086" alt="Two hand-drawn strips compare my earlier diagram workflow, with code analysis and confirmation, a prompt drafted by the agent and copied by me, then image generation and revision, with a shorter interaction: describe the goal and provide a source reference, then generate and revise." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 2. A simplified comparison of the steps I had to manage. Claude Code drafted the detailed prompt; I copied it between tools. The shorter request still included a repository link. Neither strip depicts the products' internal reasoning.</figcaption>
</figure>

My original workflow still felt more dependable for complicated code. Reading the repository and explicitly agreeing on the diagram's level of detail had value. But **most everyday diagrams did not justify that much interaction.** The simpler path was good enough, with fewer handoffs.

When another colleague asked for the skill, I recommended the image tool directly. The skill had done its job. Its remaining advantages no longer justified the effort for much of my daily work.

## Why I uninstalled Superpowers

I had a similar experience with [Superpowers](https://github.com/obra/superpowers), which adds a structured development process to coding agents.

Earlier, one of my biggest frustrations with Claude Code was that it would start implementing before it understood what I wanted. By the time I noticed the misunderstanding, there could be a substantial amount of code to undo.

Superpowers gave me a development process I could rely on:

1. **Clarify before implementing.** It asked questions and turned the answers into a specification I could review before code was written.
2. **Turn the requirements into a plan.** It worked through a design and broke implementation into concrete tasks.
3. **Delegate and check the work.** It supported subagents—additional agent sessions handling parts of a larger task—along with code review, testing, and acceptance checks.

That structure made a noticeable difference to my daily work.

After I started using GPT-6 Astra, I found myself needing less of it. In my everyday work, I could describe a task and the agent would usually understand it, ask about important ambiguities, and work out which parts could run in parallel. **Much of the behavior I had installed Superpowers to obtain was already available.**

Keeping the extra workflow meant loading more instructions and going through more prescribed interactions. The added structure increasingly felt redundant, so I removed it.

This was a judgment about my own workflow, not a controlled comparison. I did not measure a general performance difference, and other tasks or models may still benefit from the same skills. What changed was the value of that extra process in the work I was doing.

## Does the extra process still earn its cost?

The two examples illustrate slightly different changes. My diagramming skill retained an advantage on some difficult inputs, but the simpler alternative was sufficient for routine work. With Superpowers, I increasingly found that the agent already supplied the behavior I wanted.

In both cases, the extra layer had costs: instructions to load, questions to answer, steps to follow, and a workflow to maintain. **A custom solution can remain useful while becoming an inconvenient default.**

It also matters what we mean by an agent getting better. I use products such as Codex and Claude Code, not just a model in isolation. Improvements may come from the model, its tools, or the surrounding software that manages execution. From my side of the interface, all of those can reduce the amount of custom machinery I need to add.

Eric Provencher's September 2026 post on the OpenAI developer blog, [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), offers several practical recommendations:

1. **Make skill triggers precise.** Keep descriptions short and specific about when a skill applies, so related keywords do not pull in an unnecessary workflow.
2. **Load detail only when needed.** Keep the main skill document small and point to supporting material. The agent can read the relevant parts when the task calls for them.
3. **Revisit detailed recipes.** Instructions that helped an older model may constrain a more capable one. The same applies to repository rules that require reading a stack of documents before every small edit.
4. **Define completion and decision boundaries.** Say what finishing the task includes and where the agent should stop for review, so it can keep working within the intended scope.

That fits what I had been seeing. Instructions that once helped an agent use a capability could later make it invoke a workflow unnecessarily. A reliable trigger is useful only when it triggers something worth doing.

## What I still need to provide

I still use project-specific skills regularly. Some of my work involves submitting jobs to an internal compute platform, monitoring their progress, investigating failures, and calling internal APIs to debug problems.

A general-purpose agent cannot be expected to know how that platform works without being given access to the relevant information. It needs to know which interfaces exist, how to call them, and how our project uses them. These are details we maintain ourselves.

For a widely documented system such as Kubernetes, I often find that an agent can already handle many operations once the tools and access are available. Our internal platform has a different information gap. Better general reasoning does not supply a missing API description or make an unavailable tool callable.

This is the distinction I find useful when deciding what to add:

- **Project context:** the relevant code, conventions, documentation, and current state of the task.
- **Tools:** ways to act in the environment and observe what happened.
- **A goal and acceptance criteria:** what the result must accomplish and how we will check it.

These give the agent something to work with. A prescribed sequence of analysis, design, and implementation makes a different decision on its behalf: which route it should take through the problem.

<figure>
  <a href="/assets/blog/context-over-control/context-tools-feedback.png" title="Open full-size illustration" class="diagram-link"><img src="/assets/blog/context-over-control/context-tools-feedback.png" width="1448" height="1086" alt="A goal, project context, and tools support an agent exploring a solution. Its result is checked against acceptance criteria. Passing leads to acceptance; failure leads to revision or stopping." loading="lazy" decoding="async" /></a>
  <figcaption>Figure 3. A proposed division of work: provide the inputs and a way to check the result, while leaving room to choose a solution path. A failed check requires revision or a stop for review; passing establishes only what the check covers.</figcaption>
</figure>

That is what I mean here by **context over control**: supply the missing information and capabilities, define success, and leave more of the route open when the agent can handle it. It still needs useful feedback. If a result fails a check, the failure should inform a revision or a decision to stop and ask for help.

The distinction does not divide skills neatly into good and bad categories. One skill can contain both essential project facts and a procedure that has outlived its usefulness. The question is what each part contributes.

Nor does it make domain-specific skills permanent. If an agent can find the right internal documentation and tools directly, a skill that packages them may become unnecessary. **The information still matters; the best way to deliver it can change.** Loading every document up front would only recreate the context overhead I am trying to remove.

## An echo of The Bitter Lesson

These experiences remind me of Rich Sutton's [The Bitter Lesson](https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf). His argument concerns the long-term advantage of general methods that can use increasing computation, particularly search and learning, over approaches built around human knowledge of how to solve particular problems.

I see a smaller version of that tension in agent engineering. We encode a sensible way to solve a task, get useful results, and become attached to the process. As the general system improves, some of those decisions become better left to it.

This is an analogy, not evidence that these two experiences establish Sutton's argument. His essay concerns learning and search at scale; mine concerns the instructions and workflows around products I use. The connection helps me question a design habit: treating today's useful recipe as a lasting requirement. It does not imply that task facts, access to tools, or a definition of success become unnecessary.

## Rethinking my own harness

This question reaches beyond skills. I have also put substantial effort into an agent harness: the software around an agent that supplies context and tools, manages execution, and checks results. In my case, that work supported several kinds of accelerator-kernel development. A kernel here is code that performs a numerical operation on a GPU or similar processor.

In [Prompt Rules Need Runtime Enforcement](/writing/prompt-rules-runtime-enforcement/), I argued for moving enforceable rules out of prompts and into code. I also described an explicit outer workflow, with stages and checks controlling progress.

I am now simplifying some of the mechanisms I built. As agents have improved, parts of that engineering have become costly in instructions, runtime, and maintenance. My earlier argument about checking actual results still matters to me. But it leaves another question open: how much of the surrounding process needs to remain fixed?

A useful distinction is between **a condition the task must satisfy** and **a route I once chose to reach it**:

- Requiring a kernel's output to agree with a reference within the allowed numerical tolerance defines part of success. We can check that requirement in code using specified test inputs, a reference implementation, and agreed tolerances.
- Requiring every task to follow the same sequence of design and debugging steps prescribes a route. That sequence needs to justify its value for the task and agent in front of us.

I want to keep control of the acceptance criteria while giving the agent more room to find a solution. A passing check establishes only the behavior it covers; it does not prove that every possible input is correct.

I do not yet have a general rule for when to build these mechanisms or how much to invest in them. For now, I want to start with the current agent's capabilities, identify what is actually missing, and keep revisiting the extra process as those capabilities change.

The next time I upgrade an agent, I want to review the workflow alongside it: which instructions still supply something it needs, and which steps can I finally remove?

## References

1. Jesse Vincent, [Superpowers](https://github.com/obra/superpowers). The coding-agent skills and development workflow discussed above.
2. Eric Provencher, [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra). OpenAI developer blog, September 11, 2026.
3. Rich Sutton, [The Bitter Lesson](https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf). March 13, 2019; university-hosted copy.
4. Junming Cao, [Prompt Rules Need Runtime Enforcement](/writing/prompt-rules-runtime-enforcement/). My earlier post on checking agent work through the surrounding software.
