# Courier.js

A convenient wrapper for what persists you

## About

Courier is as thin a wrapper as possible around (by default in the browser) localStorage and sessionStorage. 
It can be extended to use whatever flavor of persistence you'd prefer by simply swapping out `Courier.Storage` and/or `Courier.EphemeralStorage` for an object that honors the same API as the localStorage object.

## Transformers

The real reason for Courier's existence, transformers are a convenience layer provided to manipulate data 
before storage and after retrieval, and are simply functions that take a single argument `data`, act on it
and return the altered data. 

This is necessary because `localStorage#setItem` calls any 
non-string argument's `toString()` method before persisting. If you're saving an object full of data, 
special care must be taken so that you don't get back a string that looks like `'[object Object]'` instead of your data.

A transformer for this use case (and in fact, Courier's built-in `object` transformer), might look like this:

```javascript
function (data) {
    if (typeof data === 'string') {
        return JSON.parse(data);
    } else if (typeof data === 'object') {
        return JSON.stringify(data);
    }

    return data;
}
```

If a transformer receives data that it doesn't know how to process, it should return that data unmodified.
One or more transformers can be provided to process the data in sequence.

## API

### `Courier#clear([ephemeral])`
Clears all keys from storage.

#### Arguments
ephemeral : **boolean** - whether to operate on `Courier.EphemeralStorage` (truthy) or `Courier.Storage` (falsy)

### `Courier#get(key[, options])`
Retrieves string stored at `key` from storage

#### Arguments
options : **object** -

* ephemeral : **boolean** - default `false`, whether to operate on `Courier.EphemeralStorage`
* transformers : **Array** - default `[]`, transformers to apply to data after retrieval
* bubbleErrors : **boolean** - default `false`, whether to re-throw errors that occur during data transform.
When false, any errors raised in transformers are caught and silently swallowed, with the data returning unmodified.

The `get` method tries to intelligently accept frequently-used arguments in place of an object literal, 
and will recognize a boolean `options` argument as the `ephemeral` option, or a function or array argument as the
`transformers` option, using the given defaults for the other options. For example:

```
Courier.get('foo', function (data) { return JSON.parse(data); });
```

is functionally equivalent to

```
Courier.get('foo', {
  transformers: function (data) { return JSON.parse(data); },
  ephemeral: false,
  bubbleErrors: false
});
```

### `Courier#length([ephemeral])`
Returns the number of keys in the given storage object. This is a method instead of a property to allow 
selecting from both ephemeral and permanent storage objects, and for compatibility in browsers that do not
support getters and setters on javascript objects.

### `Courier#remove(key[, ephemeral])`
Deletes a key from the storage object. Has no effect if the key is not set.

### `Courier#set(key, data[, options])`
Persists `data` as a string under `key` on the storage object. The options argument follows the same behavior 
as the `get` method.
