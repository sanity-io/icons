---
'@sanity/icons': minor
---

Export `iconImports`, a map from each icon symbol to the function that loads that icon. `icons` is built from the same functions. Await `iconImports[symbol]()` before rendering `<Icon symbol="…" />` and the icon paints on the first pass, instead of the empty loading svg.
