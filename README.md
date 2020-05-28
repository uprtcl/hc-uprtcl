# _Prtcl Holochain provider

Implementation of a [_Prtcl](https://uprtcl.io) provider for Holochain. 

This is a new version control protocol that aims to provide the same potential that Git provides for source code, but as a general purpose and multiplatform protocol for all kinds of objects and applications.

In the Holochain world, this project is a successor of the Fractal Wiki.

## FAQ

 - [What is the _Prtcl?](https://github.com/uprtcl/spec/wiki/What-is-the-_Prtcl%3F)
 - [What is a _Prtcl provider?](https://github.com/uprtcl/spec/wiki/What-is-a-_Prtcl-provider%3F)
 - [What is the _Prtcl technology stack?](https://github.com/uprtcl/spec/wiki/Technology-Stack)
 - [How can I integrate a Holochain application with the _Prtcl?](https://github.com/uprtcl/spec/wiki/How-can-I-integrate-the-_Prtcl-in-my-app%3F)

## Usage

This is a holochain zome. To include it in your DNA, add this repository as a submodule inside the `zomes` folder in your dna.

## Status

This project is in active development, and in its early stages. Its intention is to be tested and released once holochain gets to a stable release.

- [x] Implement basic _Prtcl functionality
- [x] Implement clone functionality
- [x] Implement demo content zomes compatible with the _Prtcl
- [x] Link to entries outside the hApp (other platforms as well)
- [x] Switch tests to try-o-rama
- [ ] Implement signatures inside the entries for external platforms validation
- [ ] Implement proposal mechanism
- [ ] Implement invite to collaborate
- [ ] Create clone tests

## Development setup

This project is to be used with [HoloNix](http://docs.holochain.love/). After cloning, run this in the project's root folder:

```bash
$ nix-shell
```

This will ensure you always have the appropriate version of `hc` installed.

### How to build the example-dna

In the `example-dna` folder, run:

```bash
[nix-shell:]$ hc run
```

The compiled binary will be on the `dist` folder.

### How to run the tests

In the `example-dna` folder, run:

```bash
[nix-shell:]$ hc test
```

### How to run the project

In the `example-dna` folder, run:

```bash
[nix-shell:]$ hc run
```
