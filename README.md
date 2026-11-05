# Foodie Cafe — Frontend Deployment Project

A responsive cafe website built with plain HTML, CSS and JavaScript. It is intentionally framework-free, so it can be deployed to Vercel without a build step.

## Features
- Responsive layout for mobile, tablet and desktop
- Menu categories and live search
- Add-to-order cart with quantity controls and subtotal
- Demo checkout interaction
- Cafe story, opening hours and contact/location section

## Run locally
Open `index.html` in a browser. For a local server, use VS Code Live Server.

## Customize before submission
Edit `index.html` to replace:
- `Your cafe address, City, India`
- `+91 98765 43210`
- Opening hours and cafe story

Edit `script.js` to change menu items, descriptions, prices and food images.

## Deploy to Vercel
1. Create a public GitHub repository, for example `foodie-cafe-frontend`.
2. Upload `index.html`, `style.css`, `script.js` and this README to the repository root.
3. Sign in at https://vercel.com using GitHub.
4. Select **Add New → Project**, import the repository.
5. Framework Preset: **Other**.
6. Build Command: leave blank.
7. Output Directory: leave blank (or `.` if the form requires a value).
8. Click **Deploy**.
9. Open the generated `.vercel.app` URL and test the menu filters, search, cart and mobile layout.

No environment variables are required.
