Convex Workflow Component – Comprehensive Reference
Overview
Convex Workflows provide a powerful method to run sequences of functions, (queries, mutations, actions, and nested workflows) that are durable, observable, and configurable for reliability and reactivity. They enable developers to orchestrate asynchronous steps, schedule delays, add retry logic, and manage workflows that may span anything from seconds to months. This makes them ideal for long-running data processes, multi-stage onboarding, user notification flows, AI agent chains, and integrations involving complex orchestration.​

Key Features
Durable and Reactive: Workflows survive server restarts and maintain progress/state.

Flexible Orchestration: Mix queries, mutations, actions; run steps in sequence or parallel.

Delays and Scheduling: Use built-in methods to schedule steps and handle asynchronous events.

Retry Policies: Configure retry logic per step or workflow to increase robustness.

Status Tracking: Query workflow statuses, hold/process events, and handle cleanups.

Type Safety: Use powerful validators (from v object) for arguments and return values.

Observability: Monitor workflow status reactively, integrate with logging, and error boundaries.​

Version Management: Changes to workflow definitions are detected and versioning best practices are critical.

Core Concepts
WorkflowManager: The entry point for defining and managing workflows.

Step Context: Each workflow step can call other Convex functions using transactional context (step.runQuery, step.runMutation, step.runAction, step.runWorkflow).

Event-Driven Logic: Steps can wait for named events (step.awaitEvent) before progressing.

Parallel and Sequential Steps: Enable concurrency with batching and parallelism configuration.

Handlers & Validators: Handlers encapsulate workflow logic; validators ensure types at every boundary.

Status, Cleanup, Cancellation: Manage lifecycles with status checks, cleanup calls, and cancellation logic.

Installation & Setup
Installation
Begin by installing the workflow component:

bash
npm install @convex-dev/workflow
Add it to your Convex project configuration:

typescript
// convex/convex.config.ts
import workflow from "@convex-dev/workflow/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(workflow);
export default app;
Set up the workflow manager in your project:

typescript
// convex/index.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow);
Defining Workflows
Use workflow.define to create a workflow:

typescript
export const exampleWorkflow = workflow.define({
  args: { name: v.string() },
  handler: async (step, args): Promise<string> => {
    const queryResult = await step.runQuery(internal.example.exampleQuery, args);
    const actionResult = await step.runAction(internal.example.exampleAction, { queryResult });
    return actionResult;
  },
  returns: v.string(), // Optional: Runtime validation for return value
});
Key Points:

Annotate handler return types to avoid TypeScript cycles.

Arguments and returns can use validators from the v object.

Handler contains all workflow step logic, usually calling other functions for determinism.
​

Determinism Requirements
Workflow steps are expected to be deterministic and rely on internal functions for side effects (such as fetch). Changing the workflow logic while instances are running triggers determinism validation to avoid corrupted state and requires thoughtful versioning strategies.
​

Step Methods Reference
step.runQuery(ref, args): Calls a query function.

step.runMutation(ref, args): Calls a mutation for database changes.

step.runAction(ref, args): Runs actions for side effects or external APIs.

step.runWorkflow(ref, args): Invokes another workflow as a step (for composition).

step.awaitEvent({ name }): Pauses workflow until the specified event is emitted.
Methods accept additional options for scheduling, retries, and naming for observability.
​

Workflow Execution
Starting Workflows
Start workflows from mutations or actions:

typescript
const workflowId = await workflow.start(ctx, internal.example.exampleWorkflow, { name: "James" });
onComplete Callback
Handle success/error/cancel outcome and clean up resources:

typescript
export const handleOnComplete = mutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(),
  },
  handler: async (ctx, args) => {
    // Handle success, error, or cancellation
  },
});
Context Parameter
Pass context to workflows for custom post-processing.

Parallel Execution
Run step actions concurrently with Promise.all inside the handler:

typescript
const [res1, res2] = await Promise.all([
  step.runAction(internal.example.myAction, args),
  step.runAction(internal.example.myAction, args),
]);
Configure parallelism using maxParallelism in manager options.
​

Step Options
Retry Behavior: Default, per workflow, or per step. Controls attempts, backoff, and jitter.

Scheduling (runAfter): Specify delays (ms) between steps/events.

Custom Step Names: Add internal names for tracing/logging.

typescript
await step.runAction(internal.myAction, args, { name: "FOO" });
Workflow Management
Checking Status: workflow.status(ctx, workflowId) returns workflow progress.

Canceling Workflows: Immediately halts further execution – in-progress steps finish but no new steps start.

typescript
await workflow.cancel(ctx, workflowId);
Cleaning Up: After completion, remove workflow storage and state with workflow.cleanup(ctx, workflowId).

WorkflowId Type: Use vWorkflowId for workflow identifiers.
​

Configuration Options
WorkflowManager Options: Set default retry behavior, parallelism, timeouts.

Workpool Options: Tune load management across multiple workflows.

typescript
const workflow = new WorkflowManager(components.workflow, {
  defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 100, base: 2 },
  workpoolOptions: { maxParallelism: 10 },
});
Error Handling
Error Types: Application, developer, read/write limit, internal errors.

Retry Policies: Only internal errors auto-retry; actions need custom handling.

Failure Scenarios: Log with console, trigger onComplete with error, use exception reporting.

Result Validation: Use returns validator (returns: v.string(), v.object({...})) to catch type mismatches on workflow results.
​

Limitations & Constraints
Data Size Limits: Max 1 MiB per step result or value; use DB for larger data.

Determinism Restrictions: Workflow logic must not mutate during executions.

Version Management: Changing step order, count, or logic mid-run will trigger errors.

Transaction Limits: Limited documents per transaction, see Convex limits.
​

Advanced Patterns
Event-Driven Workflows: Use awaitEvent for pauses or multi-user interactions.

Nested Workflows: Invoke other workflows with step.runWorkflow.

Long-Running Workflows: Use delays (runAfter) for hours, days, or months.

Workflow Composition: Combine steps programmatically (loop, sequence, batch).
​

Best Practices
Type Safety: Use validators wherever possible.

Avoid Circular Dependencies: Explicitly annotate handler types, use helpers for internal functions.

Code Organization: Keep queries, mutations, actions, workflows, and schemas well-structured.

Testing: Write tests for workflow steps and logic. Use error boundaries in UI for robust error handling.
​

API Reference
WorkflowManager Class: Manage workflows, define, start, cancel, clean up.

Workflow Definition Options: Support for args, handler, returns (validator), workpoolOptions.

Step Context Methods: runQuery, runMutation, runAction, runWorkflow, awaitEvent.

Status Types: Pending, Running, Finished, Canceled, Error.

Validators: Use v.object, v.string, v.id, v.any, v.union, etc., from the Convex values library.
​

Examples
Basic Workflow
typescript
export const helloWorkflow = workflow.define({
  args: { name: v.string() },
  handler: async (step, args): Promise<string> => {
    return `Hello, ${args.name}!`;
  },
  returns: v.string(),
});
Multi-Step Workflow
typescript
export const onboardingWorkflow = workflow.define({
  args: { userId: v.id("users") },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(internal.emails.sendVerification, { userId: args.userId });
    await step.awaitEvent({ name: "verificationCompleted" });
    // Additional logic...
  },
});
Retry Configuration
typescript
await step.runAction(internal.api.externalCall, args, { retry: { maxAttempts: 2, initialBackoffMs: 100, base: 2 } });
Event-Driven Workflow
typescript
await step.awaitEvent({ name: "userApproved" });
Parallel Execution
typescript
const [result1, result2] = await Promise.all([
  step.runAction(internal.actions.a, args),
  step.runAction(internal.actions.b, args),
]);
This document is designed for programmers and AI developers seeking robust, configurable workflow orchestration in Convex. It consolidates installation, usage examples, API details, best practices, limitations, and advanced use cases for maximum productivity and reliability.

All workflow code samples and practices should reference the latest Convex documentation for new changes, improvements, or edge-case clarifications.