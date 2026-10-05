---
title: Agent Harness for Ascend NPU Kernel Engineering
description: Shared execution and verification infrastructure for coding agents that generate, debug, and migrate accelerator kernels.
slug: operator-migration
role: Architecture lead and core developer
scope: Engineering · Huawei · Feb 2026–present
featured: true
order: 2
lang: en
draft: false
evidenceLinks:
  - label: CannBench · Cannbot Lingxi-Evo
    url: https://cannbench.com/leaderboard
  - label: Kernel-migration plugin
    url: https://gitcode.com/cann/cannbot-skills/tree/master/plugins-community/ascendc-port-orchestrator
  - label: Orchestration contribution
    url: https://gitcode.com/cann/cannbot-skills/pull/609
  - label: Layered knowledge contribution
    url: https://gitcode.com/cann/cannbot-skills/pull/611
---

A kernel is the code that performs a computation on an accelerator. A coding agent can write that code, but a dependable engineering workflow also needs to control the steps, check numerical results, and decide when the work is complete.

I led the architecture and core development of a shared **agent harness**—the execution and verification infrastructure around existing coding agents—for three Ascend neural processing unit (NPU) workflows: kernel generation, numerical debugging, and cross-generation migration.

## Keeping long-running work on track

Long-running coding tasks can drift from the intended workflow, skip required steps, or stop before the result has been checked. I designed a state-machine orchestration engine with explicit stage transitions, retries, and termination conditions to make those decisions part of the system.

I also built a two-layer **Hook–Gate** mechanism. Hooks enforce workflow constraints during execution. Stage gates independently validate the resulting artifacts before allowing the workflow to advance. This separates an agent's report of success from the evidence required to accept its work.

The harness coordinates existing coding-agent runtimes, including Claude Code and OpenCode, through an outer workflow engine.

## Kernel migration as a representative application

The public `ascendc-port-orchestrator` plugin applies these ideas to migrating kernels from **Ascend 910B/C to 950**. Its workflow records progress, maintains a stable correctness reference, and checks build, numerical-correctness, and performance evidence before accepting a result.

As a committer in the **cannbot community**, I contributed the migration orchestration engine and layered knowledge management through merged contributions. See [PR #609](https://gitcode.com/cann/cannbot-skills/pull/609), [PR #611](https://gitcode.com/cann/cannbot-skills/pull/611), and the [public plugin](https://gitcode.com/cann/cannbot-skills/tree/master/plugins-community/ascendc-port-orchestrator).

## Team result

In **August–September 2026**, our team, **Cannbot Lingxi-Evo**, ranked **#1 on CannBench 910**, with a **98.2% correctness pass rate** and **1.15× mean speedup over expert-written kernels**. My harness work contributed to this team result. See the [CannBench leaderboard](https://cannbench.com/leaderboard).
