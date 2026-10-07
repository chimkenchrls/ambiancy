# Ambiancy landing refinement

Preserve: Tuffy, night/plum/lavender palette, brand, original copy, local generated media, existing audio engine, sound previews, separate player tab, film, attribution and questions.

Audit: The hero already offers useful live product interaction. The existing landing repeats rounded cards and equal section spacing; headings are too similar in weight, the film occupies a large unstructured block, and the scene list resembles small player controls. The static lower page loses the hero's atmosphere. The mobile layout works but has a long, repetitive rhythm. Sticky navigation and keyboard focus are useful and should stay.

Direction: one continuous sound sculpture joins the sections. Canvas draws fine lavender spherical sound contours; a single GSAP ScrollTrigger timeline scrubs position, scale, rotation, waveform deformation and particle dispersion from measured section anchors. It reverses with scroll. No scroll hijacking. A native CSS-only timeline was considered, but section measurement and canvas morphing benefit from one explicit timeline; Framer Motion adds a second React animation model unnecessarily. GSAP supplies scrub smoothing, responsive contexts, lifecycle cleanup and refresh.

Palette: night #150e1a, ink #1f1527, plum #36213e, violet #6a4e98, lavender #c9b6e4, mist #f5f0fa. Tuffy remains the sole family. Large, balanced display headings; quieter body copy; generous outer intervals and compact functional groups.

Composition: left headline / right sculpture and player; split film introduction and preview; staggered photographic purpose panels; broad scene strip; sticky process title beside open numbered steps; staggered sound mosaic; split FAQ; quiet project story; centered final invitation with reassembled sculpture. Foreground content stays readable above the sculpture.

Performance: bounded canvas resolution and 30fps idle rendering, fewer contours on mobile, no scroll-driven React state, passive browser-managed scrolling. Pause/reduced motion renders a static hero sculpture. Hidden tabs and areas outside the landing stop rendering. Images remain lazy except the hero backdrop. Existing audio behavior and accessible native controls remain intact.

## Continuous content motion

The sculpture's GSAP context also owns the content choreography, so pause, responsive changes, reduced motion and route cleanup revert the entire experience together. Hero word masks lead the copy and controls; the film scales into focus; listening cards mask open with their own copy sequence; scene thumbnails settle before their descriptions; process text enters laterally; gallery photos retain small reversible parallax; FAQ rows and project copy enter quietly; the closing word reveal resolves into the final button.

Each card has its own scroll range, including in long mobile stacks. Reveals finish near the lower-middle of the viewport and maintain a visible initial opacity. Keyboard focus immediately completes the relevant sequence. Text remains real selectable text with natural word wrapping and no duplicated screen-reader content. No count-up statistics or testimonials were added because those are not part of Ambiancy's content.
