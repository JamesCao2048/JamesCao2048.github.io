---
title: DeepPerf — Understanding Performance Problems in Deep Learning Systems
description: Studying real performance problems, building a reproducible benchmark, and developing a static checker that found 488 new issues in open-source repositories.
slug: deepperf
role: First author
scope: Research · ESEC/FSE 2022
featured: true
order: 4
lang: en
draft: false
evidenceLinks:
  - label: Project and artifacts
    url: https://dlperf.github.io/
  - label: Published paper
    url: https://doi.org/10.1145/3540250.3549123
  - label: Keras contribution
    url: https://github.com/keras-team/keras/pull/15295
  - label: TensorFlow Agents contribution
    url: https://github.com/tensorflow/agents/pull/650
---

A deep-learning program can produce the right answer while wasting time or memory. DeepPerf connects a study of real performance problems with reproducible examples and checks that developers can use on their own code.

I am the **first author** of the ESEC/FSE 2022 paper. I studied **224 performance problems**, built a **58-case reproducible benchmark**, and developed DeepPerf, a rule-based static checker.

## From reported problems to usable checks

The empirical study examined how performance problems arise and the patterns behind them. The benchmark turns a subset of those reports into runnable examples, making the problems easier to investigate and compare.

DeepPerf examines source code without running the program. Its rules target recurring performance problems in TensorFlow and Keras code, including inefficient data processing. This makes the checker useful for finding specific known patterns while keeping its coverage explicit.

## Findings and fixes

Evaluation on **1,108 open-source repositories** identified **488 new issues**, of which **27 were fixed**. The [paper](https://doi.org/10.1145/3540250.3549123) and [project artifacts](https://dlperf.github.io/) describe the study, benchmark, and checker.

I also contributed data-pipeline parallelisation fixes derived from the findings. These were merged into [Keras #15295](https://github.com/keras-team/keras/pull/15295) and [TensorFlow Agents #650](https://github.com/tensorflow/agents/pull/650), connecting the research to changes adopted by open-source maintainers.
