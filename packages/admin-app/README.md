# Admin Panel App

This part is the admin interface to manage users and languages.

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
in `packages/admin-app/package.json`