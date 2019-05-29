# \_ptrcl holochain implementation

[![Project](https://img.shields.io/badge/project-uprtcl-blue.svg?style=flat-square)](https://www.collectiveone.org/#/app/inits/ac119496-5e3e-1db5-815e-3f192a890001/model/section/ac109cd2-6939-1811-8169-399a9fd20021/cards/ac137866-6949-1dbf-8169-49e695af0109)

The holochain implementation of the [\_protocol](www.uprtcl.io), a Git-like protocol, but for ideas and conversations.

This is a new version control protocol that aims to provide the same potential that Git provides for source code, but as a general purpose protocol for all kinds of objects and applications.

## Building

This assumes that Holochain's cli latest version is installed. To build the holochain DNA:

```bash
hc package
```

## Running tests

To run the tests:

```bash
hc test
```

## Running

To run the DNA, from the root directory (flag `--persist` is optional ):

```bash
hc run --persist
```
