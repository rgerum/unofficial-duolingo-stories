# update the repository
git pull
# install the npm packages
lerna bootstrap
# build
npm run build

# empty the test environment
rm -r ../test_environment/
mkdir ../test_environment

# copy the stores-app
rsync -r packages/client/stories-app/dist/* ../test_environment/stories-app
rsync -r packages/client/editor-app/dist/* ../test_environment/editor-app
rsync -r packages/client/admin-app/dist/* ../test_environment/admin-app

# copy the express backend
rsync -r packages/server/database-interface/* ../test_environment/database-interface

# and restart the server
supervisorctl restart express_test
