# Bundled fonts

These font files are self-hosted so production builds do not depend on Google Fonts.

- `plus-jakarta-sans-latin-*.woff2` — Plus Jakarta Sans, Copyright 2020 The Plus Jakarta Sans Project Authors (https://github.com/tokotype/PlusJakartaSans)
- `inter-latin-*.woff2` — Inter, Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)

Both families are licensed under the SIL Open Font License 1.1.

The full license texts live in `public/fonts/licenses/` so they are served with the
app and travel inside the production image. The files here are compiled into
`.next/static/media` by `next/font/local`.