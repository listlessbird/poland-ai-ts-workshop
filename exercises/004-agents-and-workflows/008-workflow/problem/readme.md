The goal of this exercise is to show you what you can do with a workflow set up.

A workflow is a set of deterministic exercises that follow one after the other. This is different from the agent approach that we've seen so far because the agent uses the LLM to decide when to stop.

In this exercise, we're going to be using a generator-evaluator workflow. We're going to ask an LLM to create a Slack message. Then we'll get another LLM to evaluate it. Finally, we'll produce a final draft and stream that to the user.
