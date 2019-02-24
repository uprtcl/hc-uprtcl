# Holochain Version-Control

This assumes that Holochain's cli is installed.

To build the holochain DNA:

```bash
hc package
```

To run the tests:

```bash
cd test
npm install
npm run test
```

To run the DNA, from the root directory (flag `--persist` is optional ):

```bash
hc run --persist
```

To run the UI:
```bash
cd ui
npm install
npm run start:webpack
```

and go to http://localhost:8080