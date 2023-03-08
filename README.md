# Unofficial Duolingo Stories
[![Cypress Test](https://github.com/rgerum/unofficial-duolingo-stories/actions/workflows/cypress.yml/badge.svg)](https://github.com/rgerum/unofficial-duolingo-stories/actions/workflows/cypress.yml)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![chat](https://img.shields.io/discord/726701782075572277)](https://discord.com/invite/4NGVScARR3)


This project brings the official Duolingo Stories to new languages, translated by a community effort.

It is *not* an official product of Duolingo, nor is there any plan to integrate it into their platform or app.

It is hosted at www.duostories.org and reproduces the story experience from the official Duolingo stories.

The project consists basically of three front end apps, the stories-app, the editor-app and the admin-app. 
The stories-app is the part that the learners will see (hosted on www.duostories.org) and the editor-app is the part
that the contributors will see to translate and review stories.
The apps are based on React and are bundled with vite. These are all stored in `packages/client`. 

The backend is based on express.js which connects to a mysql database, found in `packages/server`.

## How to run locally
This repository contains multiple packages that are managed with [Lerna](https://lerna.js.org/).

To set it up, call (will install lerna and bootstrap it)
```
npm run initialize
```

To develop you can then run
```
npm run dev
```
   
## How to contribute
To contribute to the project you should open an issue to discuss your proposed change. You can assign the issue to yourself to show that you want to work on that. If there is a consensus that this bug should be fixed or this feature should be implemented, then follow the following steps:

  - create a fork of the repository
  - clone it to your computer
  - create a branch for your feature
  - make the changes to the code
  - commit and push the changes to github
  - create a pull request
  
Please make sure to only commit changes to files that are necessary to the issue. Try to not commit accidentally other changes, e.g. package-lock.json files. This makes it harder to review and merge the pull request.  
  
If everything is fine, I will accept the pull request and  I will soon upload it to the website.
