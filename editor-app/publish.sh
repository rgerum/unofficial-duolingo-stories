
scp -r ../backend/editor carex@devico.uberspace.de:/home/carex/html/stories/backend/
npm run build
scp -r dist/. carex@devico.uberspace.de:/home/carex/html/stories/editor/
scp -r ../audio/story_to_audio_new.py carex@devico.uberspace.de:/home/carex/html/stories/audio/story_to_audio_new.py
scp -r ../audio/set_audio2.php carex@devico.uberspace.de:/home/carex/html/stories/audio/set_audio2.php
scp -r ../audio/tts/. carex@devico.uberspace.de:/home/carex/html/stories/audio/tts/
scp -r public/icons/. carex@devico.uberspace.de:/home/carex/html/stories/editor/icons/