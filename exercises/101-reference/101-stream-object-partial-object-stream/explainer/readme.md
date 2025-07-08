One important thing to note about stream objects is the way that it gives you partial objects the whole way through.

Each time the stream completes, it gives you the entire object it's created so far, not a delta.

In the example we have here, the stream will log a whole new object to the console each second. You'll notice that it's not logging deltas, it's logging the entire newly created object.
