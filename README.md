# Scramble Lab

A dependency-free 2x2 and 3x3 speedcubing practice app with:

- competition-length practice scramble sequences using standard WCA move notation
- a faithful cube-state engine and step-by-step scramble verification
- forward, backward, and slider-based move navigation
- a one-click final-state view for checking the completed scramble

Open `index.html` directly, or run a local server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

The checked-in `docs/` directory contains the final browser-ready build. In the
repository settings, enable GitHub Pages from the `main` branch and `/docs`
folder. The site will then be available at the repository's GitHub Pages URL.

Regenerate both the Sites worker and GitHub Pages output with:

```sh
npm run build
```

Official WCA competitions use random-state scrambles. Scramble Lab generates
constrained competition-practice move sequences and does not claim official
scramble certification.
