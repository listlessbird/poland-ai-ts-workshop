# Human in the Loop: A Powerful AI Pattern

## The Power-Risk Tradeoff with LLMs

In the next few exercises, we're going to explore one of my favorite patterns when working with AI: human in the loop.

Giving power to an LLM is a double-edged sword. The less power you give to an LLM, the less useful it is, the less it can actually do in the world. But then the more power that you give it, the more risk that you incur.

You may want an LLM to help you draft some emails. Drafting the email is perfectly fine, but do we want to be able to allow the LLM to send the email too?

Ideally, we want to hand over quite a lot of power to the LLM to make it more useful. But we also want to be allowed to check the LLM's work before it goes off and does crazy things.

That's what human in the loop does. It adds human checks into the loop to make sure that the LLM is always on task.

## Actions

We're going to be building a human in the loop system with the AI SDK's custom data parts.

And conceptually, these data parts are going to represent an 'action' in several stages.

- `data-action-start`: Signals when the LLM wants to begin an action - i.e. it's requesting to send an email.
- `data-action-decision`: Captures the user's approval or rejection of the proposed action - i.e. whether to send the email or not.
- `data-action-end`: Confirms when the action has been completed (only after approval) - i.e. the email has been sent successfully.

## The Flow

These will be used like so:

1. **LLM Initiates Action**: When the LLM decides to perform an action (like sending an email), it 'starts' the action.
2. **Human Review**: The system pauses execution and presents the proposed action to the user for review
3. **User Decision**: The user can either approve or reject the action, which creates a `data-action-decision` event. Note that if they reject it, they provide a reason why - which helps the LLM improve its future actions.
4. **Action Execution**: Only after approval does the system proceed with `data-action-end` and actually execute the action.

In the next few exercises, we're going to be building this.
