# SystemIO
Monad implementation for handling side effects


Copied a lot from https://medium.com/@magnusjt/the-io-monad-in-javascript-how-does-it-compare-to-other-techniques-124ef8a35b63


## Get started
May your system has two side effects that you want to bring under control, 
``` typescript
fetch: <R>(url: string) => Promise<R>;
wait: (time: number) => Promise<void>;
```

The implementations would be:
``` typescript
const fetchEffect = <R>(url: string) => fetch(string).then(r => r.json() as R);
const waitEffect = (time: number) => new Promise(resolve => setTimeout(resolve, time));
```

Lets add them to the effects inventory:
``` typescript
const effects = {
    fetch: <R>(url: string) => fetch(string).then(r => r.json() as R),
    wait: (time: number) => new Promise(resolve => setTimeout(resolve, time)),
}
```

Lets create two simple abstractions that we will use in our code:
``` typescript
const fetch = (url: string) => new SystemIO(effects => effects.fetch(url));
const wait = (time: number) => new SystemIO(effects => effects.wait(time)),
```

Now we can run this effects:
``` typescript
wait(1000).eval(effects).then(() => console.log('done with waiting));
```

In the test system i can pass a fully different wait effect:
``` typescript
wait(1000).eval({ wait: () => Promise.resolve() }).then(() => console.log('done with waiting));
```
It will evaluate immediately.

i can combine those two effects:
``` typescript
const waitAndFetch = () => wait(1000).flatMap(fetch('example.com'))

// And evaluate:
waitAndFetch().eval(effects); // waits 1 sec and fetches.
```

Or work with the result:
``` typescript
fetch('example.com').map(exampleData => modifyData(exampleData)) // returns again a SystemIO
```

If we have multiple responses and need them alltogether it can get messy, so we can use generators:
``` typescript
const fetchWaitFetch = _do(function* (url: string) { // this is like we would write "async"
    const result1 = yield* ty(fetch(url)); // this is like we would write "await", it awaits another SystemIO
    yield* ty(wait(1000));
    const result2 = yield* ty(fetch(url));

    return result1.name + result1.name2; // this will return a new SystemIO<string>
});
```

## Add more Typescript safety
First define the Effects you want to use:

``` typescript
interface GlobalEffects {
    growBanana: (count: number) => Promise<Banana[]>;
    eatBanana: (banana: Banana) => Peel;
}
```

Just some random side effects you could have in a jungle.

Overwrite them for the System IO package, currently they are "any".
``` typescript

declare module 'system-io' {
  export default interface Effects extends GlobalEffects {}
}
```
