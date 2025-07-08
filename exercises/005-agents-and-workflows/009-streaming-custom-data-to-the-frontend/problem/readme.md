Our setup is pretty nice, but it has some big issues.

Specifically, the user doesn't see anything until the final draft is being streamed in.

It would be great if the user could see the reasoning that our LLM is doing as it's generating the draft.

To do that, we're going to change our generate text calls into stream text calls and write them to the stream as custom data parts.

This is going to take a little bit of setup, but once it's done, our user is going to have an absolutely transformed experience.
