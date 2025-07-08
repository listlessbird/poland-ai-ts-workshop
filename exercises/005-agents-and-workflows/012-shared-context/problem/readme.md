All of these local variables can get pretty hardcore, so I wanted to show you a pattern that I really like when working with this kind of shared loop context.

I like to create a custom class called LoopContext which handles the state for my loop.
