For Tailwind:

Run once in terminal:

npm install -D tailwindcss @tailwindcss/cli daisyui

Add to package.json:

"scripts": {
  "build:css": "tailwindcss -i ./public/css/input.css -o ./public/css/tailwind.css --minify",
  "watch:css": "tailwindcss -i ./public/css/input.css -o ./public/css/tailwind.css --watch"
}

Run in one terminal during dev:

npm run watch:css

And in another:

node server.js
