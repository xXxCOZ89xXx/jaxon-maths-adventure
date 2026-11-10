# Ingredient-art audit and proposed refresh

Status: **owner review required for art only; no replacement images have been created or integrated.** The existing game artwork remains in use. Proposed paths below are a delivery specification, not committed image files.

[Complete current-image inventory](current-ingredient-art.json) · [Machine-readable proposed manifest](ingredient-art-manifest.json)

## Current rendering and reuse

The audit executes the current presentation chain (`art.js`, `asset-checkpoint.js`, `avatar-art.js`) to resolve each actual ingredient/pack label, rather than guessing from its name. The three renderer source files are unchanged. Forty-six old/new label variants are listed below, including retained original journeys and deliberately unneeded supermarket extras. Recipe cards and carried inventory currently use text; they do not have separate food photographs.

Countable pictures appear in cupboard/fridge stock, the product list, supermarket shelves and baskets. They share the same product renderer with other Town shopping, employment and mission flows. Chocolate/fizzy-drink extras appear on supermarket shelves and only enter a basket if selected; the correct recipe basket excludes them. Background food is scenery and must never be counted as stock.

| Item label | Current file | Atlas background position | Cooking use |
| --- | --- | --- | --- |
| Pasta · 100 g pack | v3/assets/checkpoint/pasta.webp | standalone image | retained cook-pasta |
| Tomatoes · tin | v3/assets/checkpoint/tomato.webp | standalone image | retained cook-pasta |
| Cheese · 50 g pack | v3/assets/rollout/products-food.webp | 33.333333333333336% 0% | retained cook-pasta |
| Chickpeas · tin | v3/assets/rollout/products-food.webp | 100% 33.333333333333336% | retained cook-curry |
| Coconut milk · 200 ml carton | v3/assets/rollout/products-food.webp | 0% 66.66666666666667% | retained cook-curry |
| Rice · 100 g pack | v3/assets/rollout/products-food.webp | 33.333333333333336% 33.333333333333336% | retained cook-curry |
| Pizza base | v3/assets/rollout/products-supplies.webp | 33.333333333333336% 0% | retained cook-pizza |
| Passata · 100 ml carton | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | retained cook-pizza |
| Peppers · pair | v3/assets/rollout/products-food.webp | 33.333333333333336% 66.66666666666667% | retained cook-pizza |
| Carrots · 200 g bag | v3/assets/rollout/products-food.webp | 66.66666666666667% 66.66666666666667% | retained cook-soup |
| Lentils · 100 g pack | v3/assets/rollout/products-food.webp | 100% 66.66666666666667% | retained cook-soup; retained Bolognese/lentil journey |
| Stock · cube | v3/assets/rollout/products-supplies.webp | 33.333333333333336% 33.333333333333336% | retained cook-soup |
| Flour · 100 g pack | v3/assets/rollout/products-food.webp | 66.66666666666667% 33.333333333333336% | retained cook-pancakes |
| Milk · 100 ml carton | v3/assets/rollout/products-food.webp | 0% 0% | retained cook-pancakes |
| Bananas | v3/assets/rollout/products-food.webp | 0% 100% | retained cook-pancakes |
| Pasta · 500 g usable per pack | v3/assets/checkpoint/pasta.webp | standalone image | new cook-pasta |
| Ripe tomatoes · 300 g usable per pack | v3/assets/checkpoint/tomato.webp | standalone image | new cook-pasta |
| Basil · 15 g usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pasta |
| Olive oil · 250 ml usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pasta; new cook-soup |
| Chickpeas, drained · 400 g tin / 240 g drained usable | v3/assets/rollout/products-food.webp | 100% 33.333333333333336% | new cook-curry |
| Chopped tomatoes · 400 g usable per pack | v3/assets/checkpoint/tomato.webp | standalone image | new cook-curry |
| Coconut milk · 400 ml usable per pack | v3/assets/rollout/products-food.webp | 0% 66.66666666666667% | new cook-curry |
| Dry basmati rice · 500 g usable per pack | v3/assets/rollout/products-food.webp | 33.333333333333336% 33.333333333333336% | new cook-curry |
| Ground cumin · 20 teaspoons usable per pack | v3/assets/rollout/products-supplies.webp | 100% 100% | new cook-curry |
| Turmeric · 20 teaspoons usable per pack | v3/assets/rollout/products-supplies.webp | 100% 100% | new cook-curry |
| Flatbreads · 4 items usable per pack | v3/assets/rollout/products-food.webp | 100% 0% | new cook-pizza |
| Passata · 500 g usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pizza |
| Spinach, thawed and drained · 250 g usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pizza |
| Pepper · 160 g usable per pack | v3/assets/rollout/products-food.webp | 33.333333333333336% 66.66666666666667% | new cook-pizza |
| Mozzarella · 125 g usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pizza |
| Carrots · 500 g usable per pack | v3/assets/rollout/products-food.webp | 66.66666666666667% 66.66666666666667% | new cook-soup |
| Red lentils · 500 g usable per pack | v3/assets/rollout/products-food.webp | 100% 66.66666666666667% | new cook-soup |
| Onion · 200 g usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-soup |
| Garlic · 6 cloves usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-soup |
| Vegetable stock cubes · 6 items usable per pack | v3/assets/rollout/products-supplies.webp | 33.333333333333336% 33.333333333333336% | new cook-soup |
| Rolled oats · 500 g usable per pack | v3/assets/rollout/products-food.webp | 0% 33.333333333333336% | new cook-pancakes |
| Oat milk · 1000 ml usable per pack | v3/assets/rollout/products-food.webp | 0% 0% | new cook-pancakes |
| Eggs · 6 items usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pancakes |
| Bananas · 3 items usable per pack | v3/assets/rollout/products-food.webp | 0% 100% | new cook-pancakes |
| Baking powder · 20 teaspoons usable per pack | v3/assets/rollout/products-supplies.webp | 100% 100% | new cook-pancakes |
| Cooking oil · 250 ml usable per pack | v3/assets/rollout/products-supplies.webp | 66.66666666666667% 100% | new cook-pancakes |
| Spaghetti · 100 g pack | v3/assets/checkpoint/pasta.webp | standalone image | retained Bolognese/lentil journey |
| Chopped tomatoes · 400 g tin | v3/assets/checkpoint/tomato.webp | standalone image | retained Bolognese/lentil journey |
| Mince · 100 g pack | v3/assets/checkpoint/mince.webp | standalone image | retained Bolognese/lentil journey |
| Chocolate bar | v3/assets/rollout/products-food.webp | 66.66666666666667% 100% | unneeded supermarket extras |
| Fizzy drink | v3/assets/rollout/products-food.webp | 100% 100% | unneeded supermarket extras |

Scene/container files retained: `v3/assets/checkpoint/kitchen.webp`, `v3/assets/checkpoint/market.webp`, `v3/assets/checkpoint/pantry.webp`, `v3/assets/checkpoint/fridge.webp`, `v3/assets/checkpoint/pantry-empty.webp`, `v3/assets/checkpoint/fridge-empty.webp`, `v3/assets/checkpoint/basket-empty.webp`. The kitchen and supermarket backgrounds are opaque 1536 × 1024 scene art. Pasta, tomato and mince have independent transparent images. Most other products are CSS windows into 4 × 4 food/supplies atlases; their cells are reused elsewhere, so replacing a whole atlas would affect unrelated activities.

## Comparison with approved art

Inspected references: the Practical Maths Town guide portrait, kitchen scene, independent pasta pack and both complete product sheets. The guide has smooth painted skin, detailed hair/fabric and controlled soft highlights. The kitchen has coherent warm light, block-built furniture, material texture and a stable three-quarter scene perspective.

The food sheets vary in framing, object scale, edge softness and contrast: the cheese is a bright stylised wedge, vegetables use chunky forms, and pasta is a much taller, independently cropped pack. Several supply cells have visible grey/blue matte remnants despite an alpha channel. Fractional cell sizes in the 1295 × 1214 food atlas make consistent cropping difficult; adjacent content and uneven padding can become visible at small sizes. The props do not all share the guide portrait’s painted finish or the kitchen’s lighting.

There are concrete semantic mismatches too. Flatbread labels match the bread-loaf cell. Mozzarella, onion, garlic and some herbs fall back to a cardboard-box cell. Labels containing “teaspoons” can match the tea/cup cell, so cumin, turmeric and baking powder can show a cup. Chopped tinned tomatoes resolve to the same fresh-tomato picture. These are recorded gaps for the art refresh, not newly created replacement pictures. Text labels and pack quantities remain authoritative.

## Coordinated delivery specification

Use individually named original game props, with a painted finish compatible with the approved portraits and restrained block geometry compatible with the scenes. Use the same soft warm light from upper left, a consistent three-quarter viewing angle and clean transparent edges. Keep the whole silhouette within roughly 80% of a square canvas, with enough padding for tall cartons and jars. Avoid hard black outlines, embedded checker/matte backgrounds, publisher photographs and brands. No emoji, rough CSS/SVG substitutes or generated placeholders are requested.

Supply 1024 × 1024 transparent PNG masters; proposed runtime exports are 512 × 512 transparent WebP. Preserve object proportions. Counts, pack contents, prices, ingredient names and units stay in accessible HTML, not baked into the art. One pack picture must consistently mean one labelled pack, not an unspecified number of individual vegetables. Required ingredients should reuse the same approved file across fridge/cupboard, shopping list, shelf, basket and recipe. Optional additions are identified below for future recipe imagery; they do not enter the required shopping calculation.

| Needed item | Proposed file | Size/background |
| --- | --- | --- |
| Pasta | v3/assets/ingredients/pasta.webp | 512 × 512, transparent |
| Spaghetti | v3/assets/ingredients/spaghetti.webp | 512 × 512, transparent |
| Fresh tomatoes | v3/assets/ingredients/fresh-tomatoes.webp | 512 × 512, transparent |
| Tinned chopped tomatoes | v3/assets/ingredients/tinned-chopped-tomatoes.webp | 512 × 512, transparent |
| Basil | v3/assets/ingredients/basil.webp | 512 × 512, transparent |
| Olive oil | v3/assets/ingredients/olive-oil.webp | 512 × 512, transparent |
| Chickpeas tin (400 g / 240 g drained) | v3/assets/ingredients/chickpeas-tin-400-g-240-g-drained.webp | 512 × 512, transparent |
| Coconut milk | v3/assets/ingredients/coconut-milk.webp | 512 × 512, transparent |
| Dry basmati rice | v3/assets/ingredients/dry-basmati-rice.webp | 512 × 512, transparent |
| Ground cumin | v3/assets/ingredients/ground-cumin.webp | 512 × 512, transparent |
| Turmeric | v3/assets/ingredients/turmeric.webp | 512 × 512, transparent |
| Flatbreads | v3/assets/ingredients/flatbreads.webp | 512 × 512, transparent |
| Passata | v3/assets/ingredients/passata.webp | 512 × 512, transparent |
| Thawed spinach | v3/assets/ingredients/thawed-spinach.webp | 512 × 512, transparent |
| Pepper | v3/assets/ingredients/pepper.webp | 512 × 512, transparent |
| Mozzarella | v3/assets/ingredients/mozzarella.webp | 512 × 512, transparent |
| Carrots | v3/assets/ingredients/carrots.webp | 512 × 512, transparent |
| Red lentils | v3/assets/ingredients/red-lentils.webp | 512 × 512, transparent |
| Onion | v3/assets/ingredients/onion.webp | 512 × 512, transparent |
| Garlic | v3/assets/ingredients/garlic.webp | 512 × 512, transparent |
| Vegetable stock cubes | v3/assets/ingredients/vegetable-stock-cubes.webp | 512 × 512, transparent |
| Rolled oats | v3/assets/ingredients/rolled-oats.webp | 512 × 512, transparent |
| Oat milk | v3/assets/ingredients/oat-milk.webp | 512 × 512, transparent |
| Eggs | v3/assets/ingredients/eggs.webp | 512 × 512, transparent |
| Bananas | v3/assets/ingredients/bananas.webp | 512 × 512, transparent |
| Baking powder | v3/assets/ingredients/baking-powder.webp | 512 × 512, transparent |
| Cooking oil | v3/assets/ingredients/cooking-oil.webp | 512 × 512, transparent |
| Cheddar or hard cheese | v3/assets/ingredients/cheddar-or-hard-cheese.webp | 512 × 512, transparent |
| Pitted olives | v3/assets/ingredients/pitted-olives.webp | 512 × 512, transparent |
| Optional chilli | v3/assets/ingredients/optional-chilli.webp | 512 × 512, transparent |
| Optional curry paste | v3/assets/ingredients/optional-curry-paste.webp | 512 × 512, transparent |
| Parsley | v3/assets/ingredients/parsley.webp | 512 × 512, transparent |
| Vanilla extract | v3/assets/ingredients/vanilla-extract.webp | 512 × 512, transparent |
| Yoghurt | v3/assets/ingredients/yoghurt.webp | 512 × 512, transparent |
| Fruit topping | v3/assets/ingredients/fruit-topping.webp | 512 × 512, transparent |
| Legacy wheat flour | v3/assets/ingredients/legacy-wheat-flour.webp | 512 × 512, transparent |
| Legacy dairy milk | v3/assets/ingredients/legacy-dairy-milk.webp | 512 × 512, transparent |
| Legacy mince | v3/assets/ingredients/legacy-mince.webp | 512 × 512, transparent |
| Legacy pizza base | v3/assets/ingredients/legacy-pizza-base.webp | 512 × 512, transparent |
| Chocolate bar | v3/assets/ingredients/chocolate-bar.webp | 512 × 512, transparent |
| Fizzy drink | v3/assets/ingredients/fizzy-drink.webp | 512 × 512, transparent |

The kitchen, shop, empty storage and basket artwork should remain unchanged during this ingredient refresh. A later authorised integration should map stable ingredient identities to approved files, test the shared contexts, verify no mathematical text is embedded and retain legacy save labels. This change only supplies the inventory, specification and before/after gameplay screenshots.
