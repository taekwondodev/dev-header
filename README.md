<h1 align="center">dev-header</h1>

<p align="center">The dev logo as Pi's startup header, in plain <code>pi</code> and in dev.</p>

The header shows the logo four rows tall, with the name, the version and the essential key hints beside it. Inside dev it also shows the active profile. The logo needs a terminal with the Kitty image protocol; other terminals show the text alone. `quietStartup: true` in Pi's settings does not hide it.

## Install

Clone directly into Pi's global extension directory:

```sh
mkdir -p ~/.pi/agent/extensions
git clone https://github.com/taekwondodev/dev-header.git ~/.pi/agent/extensions/dev-header
```
