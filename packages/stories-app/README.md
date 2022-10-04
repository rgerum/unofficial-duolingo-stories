# Stories App

This is the main app that is mounted on www.duostories.org for the learners to interact with.
It displays the course list, the stories for each course and allows to read the stories.

---

## Windows

You might need to replace

```js
"start": "PORT=3006 react-scripts start",
```

with

```js
"start": "set PORT=3006 && react-scripts start",
```
in `packages/stories-app/package.json`