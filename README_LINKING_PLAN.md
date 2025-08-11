# README Linking Plan

## Overview

This document outlines the plan to add inline links to relevant code files in all README files across the exercise directories. The goal is to link from README content directly to the specific code files being discussed, using the format: `our [\`api/chat\` route](./api/chat.ts)`.

## Scope

- **Total README files**: 52 (based on `find exercises -name "readme.md"`)
- **Sections**: 11 (01-basics through 10-subagents, plus 99-reference)
- **Types**: Problem READMEs and Explainer READMEs
- **Approach**: Inline links within the content, not as separate link sections

## Phase 1: Foundation Sections (Sections 01-04)

**Estimated time**: 2-3 days
**Sections**: 01-basics, 02-naive-agents, 03-persistence, 04-agents-and-workflows

### Section 01: Basics

- **01.1-choosing-a-model** - Link to `main.ts` when discussing model selection
- **01.2-stream-text-to-terminal** - Link to streaming implementation
- **01.3-ui-message-streams** - Link to UI message handling
- **01.4-stream-text-to-ui** - Link to frontend streaming
- **01.5-system-prompts** - Link to system prompt implementation

### Section 02: Naive Agents

- **02.1-tool-calling** - Link to `chat.ts`, `file-system-functionality.ts`, tool definitions
- **02.2-message-parts** - Link to message part handling
- **02.3-showing-tools-in-the-frontend** - Link to frontend tool display
- **02.4-mcp-via-stdio** - Link to MCP implementation
- **02.5-mcp-via-sse** - Link to SSE-based MCP

### Section 03: Persistence

- **03.1-on-finish** - Link to `onFinish` callback implementation
- **03.2-save-messages-to-database** - Link to database operations
- **03.3-load-messages-from-database** - Link to message loading
- **03.4-save-and-load-conversations** - Link to conversation management

### Section 04: Agents and Workflows

- **04.1-workflow** - Link to workflow implementation
- **04.2-streaming-custom-data-to-the-frontend** - Link to custom data streaming
- **04.3-creating-your-own-loop** - Link to custom loop implementation
- **04.4-breaking-the-loop-early** - Link to early termination logic

## Phase 2: Advanced Features (Sections 05-08)

**Estimated time**: 2-3 days
**Sections**: 05-evals, 06-observability, 07-human-in-the-loop, 08-retrieval

### Section 05: Evals

- **05.1-basic-evals** - Link to evaluation implementation
- **05.2-custom-eval-metrics** - Link to custom metrics
- **05.3-eval-datasets** - Link to dataset handling

### Section 06: Observability

- **06.1-logging** - Link to logging implementation
- **06.2-metrics** - Link to metrics collection
- **06.3-tracing** - Link to tracing setup

### Section 07: Human in the Loop

- **07.1-hitl-intro** - Link to HITL introduction (explainer)
- **07.2-initiating-hitl-requests** - Link to request initiation
- **07.3-approving-hitl-requests** - Link to approval workflow
- **07.4-passing-custom-message-history-to-the-llm** - Link to message history
- **07.5-processing-hitl-requests** - Link to request processing
- **07.6-executing-the-hitl-requests** - Link to request execution

### Section 08: Retrieval

- **08.1-retrieval-with-bm25** - Link to BM25 implementation
- **08.2-vector-search** - Link to vector search
- **08.3-hybrid-search** - Link to hybrid search
- **08.4-context-windows** - Link to context window handling

## Phase 3: Complex Systems (Sections 09-11)

**Estimated time**: 2-3 days
**Sections**: 09-memory, 10-subagents, 99-reference

### Section 09: Memory

- **09.1-basic-memory-with-mem0** - Link to basic memory implementation
- **09.2-memory-with-embeddings** - Link to embedding-based memory
- **09.3-updating-previous-memories** - Link to memory updates
- **09.4-semantic-recall-on-memories** - Link to semantic recall (explainer)

### Section 10: Subagents

- **10.1-subagents-intro** - Link to subagent introduction (explainer)
- **10.2-building-a-subagent-orchestrator** - Link to orchestrator
- **10.3-streaming-tasks-to-the-frontend** - Link to task streaming
- **10.4-running-our-subagents** - Link to subagent execution
- **10.5-summarizing-our-system-output** - Link to output summarization
- **10.6-isolating-subagent-context** - Link to context isolation
- **10.7-add-a-planner-to-our-orchestrator** - Link to planner integration

### Section 99: Reference

- **99.1-stream-object-partial-object-stream** - Link to streaming implementation (explainer)
- **99.2-custom-data-parts-streaming** - Link to custom data parts (explainer)
- **99.3-custom-data-parts-stream-to-frontend** - Link to frontend streaming (explainer)
- **99.4-custom-data-parts-id-reconciliation** - Link to ID reconciliation (explainer)
- **99.5-streaming-text-parts-by-hand** - Link to manual text parts (explainer)
- **99.6-ui-messages-vs-model-messages** - Link to message comparison (explainer)
- **99.7-defining-tools** - Link to tool definitions (explainer)

## Implementation Guidelines

### Link Format

Use the format: `our [\`filename\`](./filename.ts)`or`the [\`function name\`](./filename.ts#function-name)` when referring to specific functions.

### Common Patterns to Link

1. **File references**: When mentioning specific files like `main.ts`, `chat.ts`, etc.
2. **Function references**: When discussing specific functions like `generateText`, `streamText`, etc.
3. **API routes**: When mentioning API endpoints like `/api/chat`
4. **Configuration files**: When discussing setup files like `package.json`, `tsconfig.json`
5. **Import statements**: When showing import examples
6. **Code blocks**: When showing code examples that reference specific files

### Examples

- "I've given you a couple of to-dos inside the [`main.ts`](./main.ts) file"
- "We have here a [`streamText`](./chat.ts) call"
- "Your job is to investigate this [`file-system-functionality.ts`](./file-system-functionality.ts) file"
- "Check out the [`tool` function](./chat.ts#tool-definitions) from the AI SDK"

### Quality Assurance

- Verify all linked files exist
- Ensure links are relative to the README file location
- Test links work correctly in the final rendered markdown
- Maintain consistency in link formatting across all files

## Success Criteria

- [ ] All 52 README files have inline links to relevant code files
- [ ] Links are contextually appropriate and enhance understanding
- [ ] No broken links in the final implementation
- [ ] Consistent formatting across all sections
- [ ] Links are inline within the content, not as separate sections

## Notes

- Focus on linking to the most relevant files for each exercise
- Some exercises may have multiple files to link to
- Explainer READMEs may have fewer links but should still reference their main code files
- Consider the learning flow when deciding which files to link to
