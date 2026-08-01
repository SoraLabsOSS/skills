# Credits

## Primary origin

- Thesis, four reduce strategies (+ live preference), and failure stories distilled from:
  [prefers-reduced-motion in React: 5 production patterns beyond duration: 0](https://ui.soralabs.io.vn/blog/prefers-reduced-motion-react) (Sora UI / SoraLabs).
- Companion craft for SVG icon hover vs icon-swap reduce paths:  
  `skills/animating-icons` in this repository (especially TECHNIQUE § Reduced motion).

## Cited patterns (not competing cores)

| Source                                                                                                                   | What we reuse                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [iart-ai/web-animation-skills@accessible-animation](https://skills.sh/iart-ai/web-animation-skills/accessible-animation) | `0.01ms` vs `0s`, live `matchMedia` change, positive `no-preference` opt-in, library gating notes |
| [ibelick/ui-skills@fixing-accessibility](https://skills.sh/ibelick/ui-skills/fixing-accessibility)                       | Audit report shape: quote → why → minimal fix; no drive-by rewrites                               |
| [vercel-labs/agent-skills@web-design-guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines)       | Terse `file:line` findings; compositor-friendly motion / no `transition: all` as companion checks |
| [dylantarre/animation-principles@accessible-motion](https://skills.sh/dylantarre/animation-principles/accessible-motion) | Optional pedagogy appendix only — not this skill’s decision tree                                  |

## Non-goals borrowed from the market gap

This skill does **not** replace general WCAG / ARIA / focus-trap skills (e.g. accessibility-compliance). Motion role → strategy → meaning under reduce is the product.
