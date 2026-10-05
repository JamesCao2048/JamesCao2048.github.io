---
title: CodeMap — Human–AI Collaboration for Code Comprehension
description: Helping developers understand unfamiliar codebases through hierarchical visualisations and interactive navigation, informed by interviews with professional code auditors.
slug: codemap
role: Research co-author
scope: Research · ICPC 2026 · Distinguished Paper Award
featured: false
order: 5
lang: en
draft: false
evidenceLinks:
  - label: Project and demo
    url: https://gaojie058.github.io/code-map/
  - label: Published paper
    url: https://doi.org/10.1145/3794763.3794822
  - label: ICPC 2026 program
    url: https://conf.researchr.org/track/icpc-2026/icpc-2026-research
---

Understanding an unfamiliar repository starts with basic questions: what does it do, how do its parts connect, and where should I look next? CodeMap uses visual structure and AI assistance to help developers answer those questions without losing their place in the codebase.

I **co-authored** this study of how professional developers understand unfamiliar codebases. The research and system were collaborative work. The paper appeared at **ICPC 2026** and received an **ACM SIGSOFT Distinguished Paper Award**.

## Learning from professional practice

The study drew on interviews with **eight professional code auditors**. We translated the findings into CodeMap, a system powered by a large language model (LLM) that combines hierarchical codebase visualisations with interactive navigation.

A developer can move from a project overview to a component and then to specific implementation details. The map keeps the repository's structure visible while the developer explores explanations and asks follow-up questions.

## Evaluation result

Among experienced developers, **CodeMap reduced time spent reading LLM responses by 79%**.

The [published paper](https://doi.org/10.1145/3794763.3794822) describes the study and evaluation. The [team project page](https://gaojie058.github.io/code-map/) provides a demonstration of the interaction.
