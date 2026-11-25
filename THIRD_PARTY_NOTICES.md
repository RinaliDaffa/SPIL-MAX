# Third-Party Open-Source Notices

This project builds upon two open-source Apple TV–inspired UI and media player architectures:

1. **NovaStream (`why7726/NovaStream` — `src/v2/pure/` & `pure.css`)**
   - Repository: https://github.com/why7726/NovaStream
   - Copyright (c) 2026 why7726
   - License: MIT License
   - Usage: Adapted Apple TV+ "Pure" design system, Liquid Glass navigation bar, horizontal masked rails, Top 10 rank typography, responsive pickers/modals, and spatial keyboard/remote card navigation (`src/styles/apple-tv-pure.css` & `src/components/`).

2. **react-video-kit (`chaqchase/react-video` — `packages/core/src`)**
   - Repository: https://github.com/chaqchase/react-video
   - Copyright 2023 Mohamed Achaq
   - License: Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
   - Usage: Embedded in `src/vendor/react-video/` (with unused `ads`, `dash`, and `drm` plugins omitted, and Smart TV 4K responsive container scaling added in `src/styles/player-tv.css`) to provide the Apple TV / iOS Liquid Glass video player, episode drawer, info sheet, chapters, captions, and interactive transcript.
