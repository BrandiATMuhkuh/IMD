# Imports Module Definition

![](http://xkcd.com/927/)

Because the world needs another module registry!

IMD is an implementation of the
[AMD specification](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) that
performs absolutely no loading. The primary goal of it is to play nice with
HTML Imports, but it should work well with any code loader that doesn't mandate
a particular module registry.


## How Do I?

You load your dependencies (or instruct your users to), and `define` them in
proper AMD fashion. That's it!

Public modules are defined by name

`squidbits.html`:
```html
<link rel="import" href="./tentacles.html">
<script src="ink.js"></script>

<script>
define('squidbits', ['./tentacles.html', 'ink'], function(tentacles, ink) {
  return {tentacles: tentacles, ink: ink, squidbits: true};
});
</script>
```

Private (relative) modules' names are inferred from the current import:

`tentacles.html`:
```html
<script>
define(function() {
  return {tentacly: true};
})
</script>
```


## That's Dumb!

Well, it's not supposed to be particularly pretty. It works. This should tide
us over until ES6 modules land (any year now).

Plus, if you ask really nicely - or send a pull request - we could implement
a few helpers to avoid the duplication of dependencies.
