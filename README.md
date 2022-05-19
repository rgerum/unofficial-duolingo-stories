# Unofficial Duolingo Stories
[![Build Status](https://app.travis-ci.com/rgerum/unofficial-duolingo-stories.svg?branch=master)](https://app.travis-ci.com/rgerum/unofficial-duolingo-stories)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This project brings the official Duolingo Stories to new languages, translated by a community effort.

It is *not* an official product of Duolingo, nor is there any plan to integrate it into their platform or app.

It is hosted at www.duostories.org and reproduces the story experience from the official Duolingo stories.

The project consists basically of two front end apps, the stories-app and the editor-app. The stories-app is the part that 
the learners will see (hosted on www.duostories.org) and the editor-app is the part that the contributors will see to 
translate and review stories.

## How to run locally
This repository contains multiple packages that are managed with [Lerna](https://lerna.js.org/).

To run it, you need to have Lerna installed:
```
npm install --global lerna
```
Lerna can then install the dependencies of all packages:
```
lerna bootstrap
```
And it can then run all packages simultaneously
```
lerna run --parallel --stream start
```
   
## How to contribute
To contribute to the project you should open an issue to discuss your proposed change. You can assign the issue to yourself to show that you want to work on that. If there is a consensus that this bug should be fixed or this feature should be implemented, then follow the following steps:

  - create a fork of the repository
  - clone it to your computer
  - create a branch for your feature
  - make the changes to the code
  - commit and push the changes to github
  - create a pull request
  
If everything is fine, I will accept the pull request and  I will soon upload it to the website.
