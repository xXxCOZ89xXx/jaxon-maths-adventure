# iPad artwork delivery — M3

18 November 2026. Original approved images and their SHA-256 preservation manifests are unchanged. `scripts/prepare-ipad-art.py` (Pillow with WebP support) produces checked-in delivery derivatives and `v3/assets/delivery-manifest.json`, including hashes of both source and output.

The 27 ingredient PNGs total 27,873,049 bytes. Their 512-pixel transparent WebP derivatives total 740,368 bytes, a 97.3% reduction. Family/production/demo builds serve the derivatives and exclude original ingredient PNGs; originals remain in the repository for preservation checks. Offline standalone previews embed the small derivatives.

Twenty-seven landscape backgrounds have 1024-pixel delivery variants selected with responsive image sizes, retaining the original 1536-pixel artwork as the high-density fallback. Sprite atlases, wearables, portrait calibration and original hashes are unchanged.

Ingredient images use native lazy loading and dimensions. Closed Town close-ups have no image source until opened; opening restores sources before showing the content. This changes presentation only, never a saved recipe, question, plan, wallet or progress ID.

Validation: original RGBA/hash tests and derivative byte/hash/budget checks passed. 68 focused browser cases passed across desktop, iPad portrait/landscape and small touch, covering original-source preservation, WebP decoding/alpha, recipe/measuring images, closed-panel deferral and unchanged plan state. Family/production and isolated demo build checks passed. Full combined Phase 2 release checks are recorded in the PR. Physical iPad Safari remains untested.
