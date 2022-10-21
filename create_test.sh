# update the repository
git pull
# install the npm packages
lerna bootstrap
# build the story-component
cd packages/story-component
npm run build
cd ../..
# build the stories-app
cd packages/stories-app
npm run build
cd ../..

# empty the test environment
rm -r ../test_environment/
mkdir ../test_environment

# copy the stores-app
cp -r packages/stories-app/build/ ../test_environment/stories-app/

# copy the express backend
cp -r backend_node ../test_environment/
cd ../test_environment/backend_node
# install its packages
npm install
# and restart the server
supervisorctl restart express_test

