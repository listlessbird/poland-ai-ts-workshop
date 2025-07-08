OK, now we've got the setup for our loop working. We now want to optimize our system more.

If we get a really good draft straight out of the gate, we probably don't want to generate any more drafts.

This means we need to change our evaluator from simply providing feedback to a logic gate that decides whether to stop the loop.

To do this, we're going to need to extract a boolean from the evaluator as well as the feedback.

We'll have to change our evaluator to a stream object setup - That will allow us to stream the feedback to the frontend as well as collecting the Boolean from a Zod schema at the end.
