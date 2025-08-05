Probably the single most important thing you can do with any AI powered application in order to improve it is to observe it in production.

The more data you gather from your users actually using your application, understanding where they went wrong, understanding what was good, the more data you can take from that and put into your evaluation suite.

Not only that, but observability is absolutely key when we're relying so heavily on a paid service. We need to understand how much we're spending as well as look for ways to optimize our token use across prompts.

## LangFuse

There are many custom built tools for LLM observability, but the one I'm gonna show you how to use is LangFuse. LangFuse is really interesting because of course they have a cloud service, but they also allow you to run the entire thing locally on Docker.

For simplicity, I recommend that you sign up to their free trial on their cloud service. No credit card required or anything like that, so you're fine. And once you've done that, you'll need three environment variables in your .env file:

```
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

## The Setup

In this exercise, we're gonna be taking the Slack message system that we created before and instrumenting it, allowing us to observe what's happening with it in production.

Our first job is to go into the `langfuse.ts` file and do a little bit of admin. Inside the `otelSDK` variable, we're gonna be instantiating a `NodeSDK` class from the `@opentelemetry/sdk-node` package. We're then gonna pass it the `LangfuseExporter` instance from the `langfuse-vercel` package as the `traceExporter` property.

The `TODO` for `otelSDK` looks like this. We want to grab `NodeSDK` from `@opentelemetry/sdk-node` and `LangfuseExporter` from `langfuse-vercel`.

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseExporter } from 'langfuse-vercel';

// TODO: declare the otelSDK variable using the NodeSDK class
// from the @opentelemetry/sdk-node package,
// and pass it the LangfuseExporter instance
// from the langfuse-vercel package as the traceExporter
export const otelSDK = TODO;
```

Secondly, down the bottom, we're going to instantiate the `langfuse` variable using the `Langfuse` class from the `langfuse` package and pass it the following properties: `environment`, `publicKey`, `secretKey` and `baseUrl`.

```ts
import { Langfuse } from 'langfuse';

// TODO: declare the langfuse variable using the Langfuse class
// from the langfuse package, and pass it the following arguments:
// - environment: process.env.NODE_ENV
// - publicKey: process.env.LANGFUSE_PUBLIC_KEY
// - secretKey: process.env.LANGFUSE_SECRET_KEY
// - baseUrl: process.env.LANGFUSE_BASE_URL
export const langfuse = TODO;
```

## Instrumenting The Code

Once that's done, we can get into the interesting stuff of actually instrumenting our code. Our first job is inside the `POST` route in `chat.ts`. We're going to declare a trace using the `langfuse.trace` method.

```ts
// Replace this:
const trace = TODO;

// With something like:
const trace = langfuse.trace({
  sessionId: body.id,
});
```

LangFuse is based on OpenTelemetry, which means it works with traces and spans.

### Traces and Spans

You can think of a span as like a unit of work. So for instance, a single function call might be a span. In our case, our `streamText` calls are going to be our spans. Our first span is to essentially write the Slack message and the second one is to evaluate it.

But those spans without a trace at the top level would just be kind of free floating. So a trace is like a container for some spans. We can also pass this trace a `sessionId` coming from the `body.id`, which if you remember from the persistence section, we learned that the AISDK automatically sends up a `chatId`.

### Passing `telemetry` to the `streamText` call

Once the trace has been created, we can then go down into the first `streamText` call and look at the `experimental_telemetry` property. The AI SDK has built-in support for telemetry. And we just need to replace this `TODO` with an object that has an `isEnabled` property, a `functionId` property, and some metadata to link it to the `langfuse.trace.id`.

```ts
// Replace this:
experimental_telemetry: TODO,

// With something like:
experimental_telemetry: {
  isEnabled: true,
  functionId: 'your-name-here',
  metadata: {
    langfuseTraceId: trace.id,
  },
},
```

We need to do that for the generate call, but also for the evaluation call as well down the bottom.

```ts
// For the evaluation call, replace:
experimental_telemetry: TODO,

// With:
experimental_telemetry: {
  isEnabled: true,
  functionId: 'your-name-here',
  metadata: {
    langfuseTraceId: trace.id,
  },
},
```

### Flushing the traces

And once that's done, we can go right to the end of the code all the way down into `onFinish` here. And in `onFinish`, we need to flush the LangFuse traces using the `langfuse.flushAsync` method. And flush here just means send the traces off to LangFuse so that we can view them in its cloud viewer.

```ts
onFinish: async () => {
  // TODO: flush the langfuse traces using the langfuse.flushAsync method
  // and await the result
  TODO;
};
```

### Prettifying the LangFuse Traces

There's a little `TODO` just above this as well, which is right at the end of the stream, you can update the trace again with the following information:

```ts
// TODO: update the trace with the following information:
// - input: messages
// - output: mostRecentDraft
// - metadata: { feedback: mostRecentFeedback }
// - name: 'generate-slack-message'
TODO;
```

Without this, LangFuse has a habit of updating the parent trace with funny information. And so adding a final update, a kind of summary at the end will make our traces just look a little bit better.

### Testing

Once all of these to-dos are done, you can try testing out your application, making sure again that your environment variables are all set up correctly. And you can go into the traces section of the LangFuse dashboard and see your traces coming in.

You'll be able to see detailed information about your AI calls.

Good luck, and I'll see you in the solution.

## Steps To Complete

- Sign up for a free [LangFuse](https://langfuse.com) account to get your API keys
- Add three environment variables to your `.env` file:

  ```
  LANGFUSE_PUBLIC_KEY=your_public_key
  LANGFUSE_SECRET_KEY=your_secret_key
  LANGFUSE_BASE_URL=https://cloud.langfuse.com
  ```

- Implement the `otelSDK` in `langfuse.ts`
- Implement the `langfuse` instance in `langfuse.ts`
- In `chat.ts`, implement the trace variable:
- Add `experimental_telemetry` to the first `streamText` call
- Add similar `experimental_telemetry` to the `streamObject` call
- Implement trace update at the end of the stream
- Implement the `langfuse.flushAsync()` call in the `onFinish` handler
- Test your application by running the local dev server
- Check the LangFuse dashboard to see if traces are being recorded
- Try different prompts to see how they appear in the traces view
