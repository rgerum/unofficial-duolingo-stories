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
cp -r packages/client/stories-app/dist/ ../test_environment/stories-app/
cp -r packages/client/editor-app/dist/ ../test_environment/editor-app/
cp -r packages/client/admin-app/dist/ ../test_environment/admin-app/

# copy the express backend
cp -r packages/server/database-interface ../test_environment/

# and restart the server
supervisorctl restart express_test
