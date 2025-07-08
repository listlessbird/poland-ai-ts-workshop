Now that we have some tools working on the backend, we now need to display them on the frontend.

This will give our user the most accurate possible picture of what is happening inside our application.

We're going to do this, of course, in a type-safe way. To do that, we're going to have to declare a custom message type which infers the shape of the tools we're using.

That way, our types in the front-end are going to be derived from the shape of the tool calls in the back-end.

This will mean changing our code is a lot easier.
