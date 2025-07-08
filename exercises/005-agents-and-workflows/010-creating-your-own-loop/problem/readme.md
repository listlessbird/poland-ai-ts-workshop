Our setup is looking a little bit more complete.

But I want to explore an alternative approach. Instead of doing a fixed workflow that always starts and ends at the same place, I want to create a loop.

This loop will run through the generate-evaluate process a deterministic number of times. Let's start with twice.

We can then return the most recently created Slack message back to the user.

To do that, we're going to have to maintain some state as our loop is running, specifically the most recent email created and the most recent feedback generated. We'll also have to store what step number we're on and remember to iterate it at the end of each loop.
