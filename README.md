# Unofficial Duolingo Stories

[![Cypress Test](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/cvszgh/master&style=flat&logo=cypress)](https://cloud.cypress.io/projects/cvszgh/runs)
[![chat](https://img.shields.io/discord/726701782075572277)](https://discord.com/invite/4NGVScARR3)

This project brings the official Duolingo Stories to new languages, translated by a community effort.

It is _not_ an official product of Duolingo, nor is there any plan to integrate it into their platform or app.

It is hosted at https://duostories.org and reproduces the story experience from the official Duolingo stories.

The app is based on Next.js with React. It is currently in `next/next-all`.

## How to run locally

First you need to set up a PostgreSQL server.

If you are on Linux you can use the following commands to install Postgres:

Ubuntu:

```
sudo apt install postgresql
```

Fedora:

```
# Install and initialize PostgreSQL
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb --unit postgresql

# If you get ident errors when running the psql lines below, try switching to md5
# And don't forget to restart the service!
sudo sed -i -e 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf

# To start postgresql server by default when booting up
sudo systemctl enable postgresql
```

To set it up:

```
sudo systemctl restart postgresql.service
sudo -u postgres psql -c "ALTER USER postgres with encrypted password 'postgres';"
export PGPASSWORD=postgres
```

Then you need to initialize the database

```
sudo -u postgres psql -c "CREATE DATABASE duostories_test_db;"
psql -U postgres -h localhost -d duostories_test_db -f database/schema.sql
psql -U postgres -h localhost -d duostories_test_db -c \\dt
```

Now you need to create a file called `.env.local` in the base folder of the project and add the following 
environment variable containing the URL for the Postgres database:

```
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/duostories_test_db
```

Install the npm packages

```
npm install
```

Create fill the database with test data

```
npm run init
```

To develop you can then run and visit http://localhost:3000

```
npm run dev
```

The test database contains three uses to test the login process:

| Username | Password | Usage                                |
| -------- | -------- | ------------------------------------ |
| user     | test     | To test a normal user login          |
| editor   | test     | To test login to the editor          |
| admin    | test     | To test login to the admin interface |

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
