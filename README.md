# _Prtcl Holochain provider

Implementation of a [_Prtcl](https://uprtcl.io) provider for Holochain. 

This is a new version control protocol that aims to provide the same potential that Git provides for source code, but as a general purpose and multiplatform protocol for all kinds of objects and applications.

In the Holochain world, this project was previously known as Fractal Wiki.

## FAQ

 - What is the _Prtcl?
 - What is a _Prtcl provider?
 - Where is the frontend?
 - How can I build a Holochain application with the _Prtcl?

## Overview

This application is composed by these zomes. Whether this zomes should be organized in their own hApp will be made in the future, for now development is much easier in one repository.

- **uprtcl**: contains contexts, perspectives and commits and their relationships.
- **proxy**: contains proxy addresses to any entry, enabling linking to entries outside the hApp.
- **discover**: contains the known sources for any proxied entry, that is the application or platform where they are stored. This enables the consuming app to know where to ask for that entry.
- **documents**: contains simple text-node entries, documents that contain other subdocuments. 
- **folder**: contains simple folder entries, that contain other any kind of entry.

## Status

This project is in active development, and in its early stages. Its intention is to be tested and released once holochain gets to a stable release.

- [x] Implement basic _Prtcl functionality
- [x] Implement clone functionality
- [x] Implement demo content zomes compatible with the _Prtcl
- [x] Link to entries outside the hApp (other platforms as well)
- [x] Implement signatures inside the entry
- [x] Create clone tests
- [ ] Implement access control
- [ ] Implement merge requests
- [ ] Integrate did provider to get the creatorId

## Development setup

This project is to be used with [HoloNix](http://docs.holochain.love/). After cloning, run this in the project's root folder:

```bash
$ nix-shell
```

This will ensure you always have the appropriate version of `hc` installed.

### How to build

In the project's root folder, run:

```bash
[nix-shell:]$ hc run
```

The compiled binary will be on the `dist` folder.

### How to run the tests

In the project's root folder, run:

```bash
[nix-shell:]$ hc test
```

### How to run the project

In the project's root folder, run:

```bash
[nix-shell:]$ hc run
```
