# Unofficial Duolingo Stories
[![Cypress Test](https://github.com/rgerum/unofficial-duolingo-stories/actions/workflows/cypress.yml/badge.svg)](https://github.com/rgerum/unofficial-duolingo-stories/actions/workflows/cypress.yml)
[![chat](https://img.shields.io/discord/726701782075572277)](https://discord.com/invite/4NGVScARR3)


This project brings the official Duolingo Stories to new languages, translated by a community effort.

It is *not* an official product of Duolingo, nor is there any plan to integrate it into their platform or app.

It is hosted at www.duostories.org and reproduces the story experience from the official Duolingo stories.

The app is based on Next.js with React. It is currently in `next/next-all`.

## How to run locally
Got to the folder `next/next-all`.

Install the npm packages
```
npm install
```

Create a local sqlite database
```
npm run init
```

To develop you can then run
```
npm run dev
```

The test database contains three uses to test the login process:

| Username | Password | Usage                                |
|----------|----------|--------------------------------------|
| user     | test     | To test a normal user login          |
| editor   | test     | To test login to the editor          |
|  admin   | test     | To test login to the admin interface |
   
## How to contribute
To contribute to the project you should open an issue to discuss your proposed change. 
You can assign the issue to yourself to show that you want to work on that.
If there is a consensus that this bug should be fixed or this feature should be implemented, 
then follow the following steps:

  - create a fork of the repository
  - clone it to your computer
  - create a branch for your feature
  - make the changes to the code
  - commit and push the changes to GitHub
  - create a pull request
  
Please make sure to only commit changes to files that are necessary to the issue.
Try to not commit accidentally other changes, e.g. package-lock.json files. 
This makes it harder to review and merge the pull request.  
  
If everything is fine, I will accept the pull request and I will soon upload it to the website.
