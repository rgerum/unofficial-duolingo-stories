
scp -r ../backend/editor carex@devico.uberspace.de:/home/carex/html/stories/backend/
npm run build
scp -r dist/. carex@devico.uberspace.de:/home/carex/html/stories/editor/
scp -r public/icons/. carex@devico.uberspace.de:/home/carex/html/stories/editor/icons/