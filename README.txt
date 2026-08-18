HOW TO APPLY THIS FIX TO YOUR CLONED REPO
==========================================

tailwind.config.js here is your own config (with the enterprise-*
colors, Inter font, and reports-scoped content paths) -- confirmed
working, all enterprise-* utility classes now compile correctly.

1. Copy tailwind.config.js and .postcssrc.json (both included in this
   zip) into the ROOT of your cloned repo -- the same folder that has
   your package.json and angular.json. NOT inside src/.

2. In that same root folder, run:
   npm install -D tailwindcss@^3.4.19 postcss@^8.5.20 autoprefixer@^10.5.4

3. Restart ng serve (kill it and re-run) so it picks up the new config.

Nothing inside src/ needs to change.
