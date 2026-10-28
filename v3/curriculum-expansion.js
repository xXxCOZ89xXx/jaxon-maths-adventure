/* Years 6–9 content v1. Pure definitions; no accounts, clock, storage or rewards.
 * KS3 year labels are this game's proposed sequence, not statutory year lists.
 * New IDs and snapshots are additive. Never regenerate a saved task on loading.
 */
(function(root){
'use strict';
const packs=[];
const pack=(id,name,world,year,prerequisites,lesson,build)=>packs.push({id,name,world,year,prerequisites,lesson,build});
const num=(prompt,answer,worked,unit='')=>({prompt,answer,worked,unit});
const order=(prompt,items,answer,worked)=>({prompt,answer,worked,activity:{kind:'order',items}});
const match=(prompt,items,labels,answer,worked)=>({prompt,answer,worked,activity:{kind:'match',items,labels}});
const plot=(prompt,answer,worked)=>({prompt,answer,worked,activity:{kind:'coordinate',minCoord:-5,maxCoord:5}});
const choose=(prompt,labels,answer,worked)=>({prompt,answer,worked,activity:{kind:'choice',labels}});
const fmt=n=>String(Number(n.toFixed(6)));
pack('written_methods','Written methods and remainders','number',6,['multiply','place'],'Partition the multiplier into tens and ones. In long division, divide, multiply, subtract and bring down the next digit. Decide what a remainder means before rounding.',(a,b)=>[
 num(`Work out ${1000+a*10+b} × 12 using tens and ones.`,(1000+a*10+b)*12,`Multiply by 10 and by 2, then add: ${(1000+a*10+b)*10} + ${(1000+a*10+b)*2}.`),
 num(`${12*a+5} ÷ 12: how many complete groups?`,a,`${12*a+5} = 12 × ${a} + 5. Only complete groups count.`),
 num(`${12*a+5} passengers need 12-seat minibuses. Minimum buses?`,a+1,`There are ${a} full buses and 5 passengers left. One more bus is needed.`),
 num(`Divide ${25*a+5} by 25. Give the exact decimal.`,a+.2,`The remainder 5 is 5/25 = 0.2, so the quotient is ${a}.2.`),
 order('Arrange the long-division cycle.', ['Subtract the product','Bring down the next digit','Divide the current part','Multiply the quotient digit by the divisor'],[2,3,0,1],'Divide, multiply, subtract, bring down; repeat for each place.'),
 match('Match each calculation with its inverse check.', ['72 ÷ 12 = 6','125 − 47 = 78','24 × 13 = 312'],['312 ÷ 13 = 24','6 × 12 = 72','78 + 47 = 125'],[1,2,0],'Undo division by multiplying, subtraction by adding, and multiplication by dividing.')]);
pack('number_accuracy','Rounding, estimates and error intervals','number',8,['place','decimal_place'],'Choose a useful accuracy before calculating. Rounded measurements stand for intervals: to the nearest unit, the true value is at least half a unit below and less than half a unit above.',(a,b)=>[
 num(`Round ${a*10000+4567} to the nearest 10,000.`,a*10000,'The thousands digit is 4: keep the ten-thousands digit.'),
 num(`A length rounds to ${a} cm, nearest cm. Lower bound in cm?`,a-.5,`The interval starts at ${a-.5} cm inclusive.`),
 num(`A length rounds to ${a} cm, nearest cm. Upper bound in cm?`,a+.5,`Values must be less than ${a+.5} cm; that endpoint rounds up.`),
 num(`Estimate ${a*10+1} × 19 by rounding each factor to 1 significant figure.`,Number((a*10+1).toPrecision(1))*20,'Round both factors first, then multiply the rounded values.'),
 choose(`Which interval rounds to ${a}, nearest integer?`,[`${a-.5} ≤ x < ${a+.5}`,`${a-.5} < x ≤ ${a+.5}`,`${a} ≤ x < ${a+1}`],0,'The lower endpoint is included; the upper endpoint is excluded.'),
 order('Arrange an estimate-and-check plan.', ['Interpret the answer in context','Round to convenient values','Compare the exact result with the estimate','Calculate the rounded estimate'],[1,3,2,0],'Choose convenient values, estimate, compare and interpret.')]);
pack('number_standard','Powers, roots and standard form','number',8,['powers','priority'],'Standard form is A × 10ⁿ with 1 ≤ A < 10. A negative exponent divides by a power of ten. Roots undo powers; keep exact roots when a decimal would only be an approximation.',(a,b)=>[
 num(`Write ${1+(a%90)/10} × 10⁴ as an ordinary number.`,(1+(a%90)/10)*10000,'Multiply the coefficient by 10,000.'),
 num(`Write ${1+(a%90)/10} × 10⁻² as a decimal.`,(1+(a%90)/10)/100,'Divide the coefficient by 100.'),
 num(`2³ × 2⁴ = 2ⁿ. Find n.`,7,'Multiplying powers of the same base adds exponents: 3 + 4 = 7.'),
 num(`What is the fourth root of ${b**4}?`,b,`${b} multiplied by itself four times gives ${b**4}.`),
 match('Match the powers with their values.', ['10⁻²','3³','√49'],['7','0.01','27'],[1,2,0],'A negative exponent is a reciprocal; cube uses three factors; square root undoes square.'),
 choose('Which statement about √2 is accurate?', ['√2 is exact; 1.414 is an approximation','√2 equals 1.414 exactly','√2 is a rational number'],0,'No terminating decimal equals √2 exactly.')]);
pack('number_sets','Number sets, primes and counterexamples','number',7,['factors','fraction_compare'],'An integer has no fractional part. A rational number is a ratio of integers with non-zero denominator. There is always another integer and another rational between two different rationals. One counterexample disproves an always claim.',(a,b)=>[
 num(`How many factors of 2 occur in the prime factorisation of ${8*b}? (First factorise ${b} too.)`,3+(()=>{let n=b,k=0;while(n%2===0){k++;n/=2;}return k;})(),'Repeatedly divide by 2 until the remaining factor is odd.'),
 num(`Find a rational number halfway between ${a}/10 and ${a+1}/10.`,(2*a+1)/20,'Add the endpoints and divide by 2. This can be repeated without running out of rationals.'),
 num(`What is the reciprocal of ${b}? Give a decimal or fraction.`,1/b,`The reciprocal is 1/${b}, because the product is 1.`),
 num(`Find the highest common factor of ${6*b} and ${9*b}.`,3*b,`6 and 9 have HCF 3; the common multiplier gives ${3*b}.`),
 match('Match each number to the smallest listed set containing it.', ['−4','3/8','√2'],['Rational, not integer','Real, not rational','Integer'],[2,0,1],'Every integer is rational, but the smallest listed set for −4 is integers. √2 is irrational.'),
 choose('Which example disproves “all prime numbers are odd”?', ['2','9','1'],0,'2 has exactly two positive factors and is even. One counterexample is enough.')]);
pack('fraction_reasoning','Signed fractions and mixed-number reasoning','fractions',7,['fraction_operations','fraction_mixed','fraction_mult'],'Use a common denominator before adding fractions. Convert mixed numbers to improper fractions for multiplication. Division by a fraction multiplies by its reciprocal. A recurring decimal represents an exact fraction even though it has no last digit.',(a,b)=>[
 num(`${a} 1/2 + 2/3 = ? Give a fraction or decimal.`,a+7/6,`Use sixths: ${6*a+3}/6 + 4/6 = ${6*a+7}/6.`),
 num(`−${a}/4 + ${a}/2 = ?`,a/4,`Rewrite halves as quarters: −${a}/4 + ${2*a}/4 = ${a}/4.`),
 num(`${a}/3 ÷ 2/3 = ?`,a/2,`Multiply by 3/2: (${a}/3) × (3/2) = ${a}/2.`),
 num(`Multiply ${a} 1/2 by 2/5.`,(2*a+1)/5,`Convert to ${2*a+1}/2 then multiply by 2/5.`),
 match('Match exact equivalents.', ['0.375','1.25','0.333… recurring'],['1/3','3/8','5/4'],[1,2,0],'Divide numerator by denominator. The dots in 0.333… mean the threes continue forever.'),
 order('Order from least to greatest.', ['−1/2','3/2','−3/4','0.25'],[2,0,3,1],'On the number line −3/4 is left of −1/2; 0.25 is less than 1.5.')]);
pack('algebra_rules','Notation, factorising and binomials','algebra',8,['algebra_brackets','algebra_expressions'],'Like terms have identical variable parts. Distribute multiplication over every term. Factorising reverses expansion. In two brackets, every term in one bracket multiplies every term in the other.',(a,b)=>[
 num(`Simplify ${a}x + ${b}x. What is the coefficient of x?`,a+b,'The variable part is the same, so add coefficients.'),
 num(`Expand ${b}(x + ${a}). What is the constant term?`,a*b,'Multiply both x and the constant by the outside factor.'),
 num(`Expand (x + ${a})(x + ${b}). What is the coefficient of x?`,a+b,`x² + ${b}x + ${a}x + ${a*b}; combine the two x terms.`),
 num(`Expand (x + ${a})(x + ${b}). What is the constant term?`,a*b,'The constant term comes from multiplying both constants.'),
 match('Match equivalent expressions.', ['a × b','3y','6x + 9'],['3(2x + 3)','ab','y + y + y'],[1,2,0],'Juxtaposition denotes multiplication; a common factor of 6 and 9 is 3.'),
 choose('Which is an equation?', ['3x + 2 = 11','3x + 2','3x + 2 < 11'],0,'An equation asserts equality. An expression has no relation sign; an inequality compares sizes.')]);
pack('algebra_equations','Equations and pairs of unknowns','algebra',7,['algebra_missing','algebra_brackets'],'Keep both sides equal by applying the same operation to both. Collect variable terms on one side, then constants on the other. Check by substituting. For two unknowns, enumerate pairs systematically.',(a,b)=>[
 num(`${b}x + ${a} = ${b*(a+2)+a}. Find x.`,a+2,`Subtract ${a}, then divide by ${b}.`),
 num(`${b+1}x + ${a} = x + ${a+b*3}. Find x.`,3,`Subtract x and ${a} from both sides: ${b}x = ${b*3}.`),
 num(`x/${b} − ${a} = 2. Find x.`,b*(a+2),`Add ${a}, then multiply by ${b}.`),
 num(`For x + y = ${a}, with x,y non-negative integers, how many ordered pairs exist?`,a+1,`Let x run from 0 to ${a}. Each choice fixes y.`),
 order('Solve 3x + 5 = 20: arrange the steps.', ['x = 5','3x = 15','3x + 5 = 20'],[2,1,0],'Subtract 5 from both sides, then divide both sides by 3.'),
 match('For x + y = 7, match x to y.', ['0','2','7'],['5','0','7'],[2,0,1],'Subtract each x from 7. Ordered pairs keep x and y in their own positions.')]);
pack('algebra_formulae','Formulae, substitution and rearrangement','algebra',8,['algebra_equations','priority'],'A formula links quantities. Substitute with brackets, keep units, and apply inverse operations to change the subject. For v = u + at, subtract u then divide by a to isolate t.',(a,b)=>[
 num(`Use v = u + at, u = ${a}, a = ${b}, t = 3. Find v.`,a+3*b,'Multiply acceleration by time, then add the starting velocity.'),
 num(`Use C = 2πr. C = ${2*b}π cm. Find r in cm.`,b,'Divide both sides by 2π; the π factors cancel.'),
 num(`A = bh/2. A = ${a*b} cm² and b = ${b} cm. Find h in cm.`,2*a,'Multiply area by 2, then divide by the base.'),
 num(`A taxi model is C = ${b}d + ${a}. If d = 4 km, what is C in pounds?`,4*b+a,'Use the variable cost and the fixed starting charge.'),
 match('Match each formula to its rearrangement.', ['v = d/t, make t the subject','A = lw, make w the subject','y = mx + c, make x the subject'],['x = (y − c)/m','t = d/v','w = A/l'],[1,2,0],'Undo addition/subtraction before multiplication/division; assume the divisor is non-zero.'),
 choose('Which expression models 3 metres plus n equal lengths of 2 metres?', ['3 + 2n','(3 + 2)n','3n + 2'],0,'The fixed 3 is added once, while 2 is repeated n times.')]);
pack('algebra_inequalities','Inequalities and solution sets','algebra',8,['negative','algebra_equations'],'An inequality describes a range of values. Open endpoints exclude the boundary; closed endpoints include it. Multiplying or dividing an inequality by a negative reverses its direction.',(a,b)=>[
 num(`x + ${b} < ${a+b}. What is the boundary value for x?`,a,`Subtract ${b}: x < ${a}. The boundary itself is excluded.`),
 num(`x is an integer, 0 ≤ x < ${b}. How many values are possible?`,b,`The integers are 0 through ${b-1}.`),
 num(`−2x < −${2*a}. What is the boundary value?`,a,`Divide by −2 and reverse the sign: x > ${a}.`),
 num(`x ≥ ${a}, x integer. What is the least possible x?`,a,'The closed inequality includes the boundary.'),
 choose('Which describes a closed dot at 3 with an arrow to the right?', ['x ≥ 3','x > 3','x ≤ 3'],0,'The closed dot includes 3; the right arrow means larger values.'),
 order('Order these numbers on a number line.', ['−2','1/2','0','−3'],[3,0,2,1],'Numbers increase from left to right, crossing zero between negatives and positives.')]);
pack('algebra_nth','Linear and geometric sequences','algebra',8,['algebra_patterns','algebra_expressions'],'An arithmetic sequence has a constant difference. Its nth term is dn + c: multiply the position by the difference, then adjust. A geometric sequence has a constant multiplier.',(a,b)=>[
 num(`Sequence ${b+a}, ${2*b+a}, ${3*b+a}. Find the 10th term.`,10*b+a,`The rule is ${b}n + ${a}. Substitute n = 10.`),
 num(`For uₙ = ${b}n − ${a}, find u₄.`,4*b-a,'Substitute 4 for n; multiply before subtracting.'),
 num(`Sequence 3, 6, 12, 24. Next term?`,48,'Multiply by 2; adding the same amount would not fit every gap.'),
 num(`A sequence begins ${a}, ${a+b} and adds ${b} each time. Which position contains ${a+5*b}?`,6,'The first term uses zero additions; five additions reach the sixth term.'),
 match('Match each sequence to its rule.', ['2, 5, 8, 11','2, 4, 8, 16','1, 4, 9, 16'],['Square the position','Add 3','Multiply by 2'],[1,2,0],'Compare consecutive differences and ratios; square numbers follow n².'),
 choose('Which proves that two consecutive integers always have an odd sum?', ['n + (n + 1) = 2n + 1','2 + 3 = 5, so it always works','The first number is odd'],0,'2n + 1 is one more than an even number for every integer n.')]);
pack('algebra_graphs','Linear, quadratic and other graphs','algebra',9,['algebra_coordinates','algebra_formulae'],'Read x horizontally and y vertically. A linear graph y = mx + c has gradient m and y-intercept c. Quadratic graphs curve. Intersections give shared solutions. Compare tables and graphs, including inverse and exponential relationships.',(a,b)=>[
 num(`For y = ${b}x + ${a}, find y when x = −2.`,a-2*b,'Substitute −2 in brackets, multiply, then add the intercept.'),
 num(`A line passes through (0, ${a}) and (2, ${a+2*b}). Gradient?`,b,`Rise ${2*b} divided by run 2 gives ${b}.`),
 num(`For y = x² − ${a}, find y when x = −3.`,9-a,'(−3)² = 9; subtract the constant after squaring.'),
 num(`At the intersection of y = 2x + ${a} and y = x + ${a+b}, find x.`,b,'Set both y values equal and subtract x and the common constant.'),
 plot('Plot the point on y = 2x + 1 where x = −2.',[-2,-3],'2 × (−2) + 1 = −3. Move left two and down three.'),
 match('Match each table of y values at x = 1, 2, 3 to its model.', ['2, 4, 6','2, 4, 8','6, 3, 2'],['y = 6/x','y = 2x','y = 2ˣ'],[1,2,0],'Linear values add equal amounts; exponential values multiply; reciprocal values have constant xy.')]);
pack('geometry_construction','Drawing, constructions and shortest paths','geometry',8,['geometry_shapes','geometry_angles'],'Use ruler and compass relationships: equal-radius arcs from both ends locate points equally distant from the ends. Joining their intersections gives a perpendicular bisector. An angle bisector splits the angle equally. The shortest point-to-line distance is perpendicular.',(a,b)=>[
 num(`A ${2*a} cm segment is bisected. Length of each half?`,a,'Bisect means divide into two equal parts.'),
 num(`Bisect an angle of ${2*b*5}°. Each new angle?`,b*5,'Keep the compass radius fixed for the two equal arcs.'),
 num(`A perpendicular meets a straight line. Angle in degrees?`,90,'Perpendicular lines meet at a right angle.'),
 num(`A drawing uses 1 cm for 2 m. Draw a ${2*b} m side: length in cm?`,b,'Divide the real length by metres per drawing centimetre.'),
 order('Construct a perpendicular bisector: arrange the steps.', ['Join the arc intersections','Draw equal-radius arcs from the other endpoint','Set a compass radius greater than half the segment','Draw arcs from one endpoint above and below the segment'],[2,3,1,0],'Use the same radius from both endpoints; both intersections are equally distant from the endpoints.'),
 choose('Which route from point P to a straight wall is shortest?', ['The segment perpendicular to the wall','Any sloping segment','A path along the wall first'],0,'A sloping route forms a right triangle whose hypotenuse is longer than its perpendicular leg.')]);
pack('geometry_similarity','Congruence, similarity and enlargement','geometry',8,['ratio_basics','geometry_triangles','algebra_coordinates'],'Congruent shapes have equal corresponding sides and angles. Similar shapes have equal angles and proportional corresponding lengths. Enlargement multiplies displacement from the centre by the scale factor. SSS, SAS, ASA and RHS can establish triangle congruence; AAA establishes similarity only.',(a,b)=>[
 num(`A similar triangle has corresponding sides ${a} cm and ${3*a} cm. Scale factor?`,3,'Divide image length by original length.'),
 num(`Enlarge a ${b} cm side by factor 3. New length?`,3*b,'Multiply corresponding lengths by the scale factor.'),
 num(`Enlarge by factor 2. A shape has area ${a} cm². New area?`,4*a,'Area scales in two dimensions: factor 2² = 4.'),
 num(`Two congruent triangles have corresponding side ${b} cm and x cm. Find x.`,b,'Congruence preserves all corresponding lengths.'),
 plot('Enlarge (−2, 1) by factor 2 about the origin. Plot the image.',[-4,2],'Multiply both coordinates by 2 because the origin is the centre.'),
 match('Match each description with its conclusion.', ['Three corresponding sides equal','Three corresponding angles equal','Two sides and the included angle equal'],['SAS congruence','SSS congruence','Similarity; congruence not guaranteed'],[1,2,0],'AAA does not fix scale. The angle in SAS must be between the two known sides.')]);
pack('geometry_parallel','Angle reasoning and simple proofs','geometry',7,['geometry_angles','geometry_triangles'],'Corresponding and alternate angles are equal on parallel lines. Interior angles on the same side sum to 180°. Splitting an n-sided polygon into n − 2 triangles gives its angle sum. State a reason for each step.',(a,b)=>[
 num(`Parallel lines have an alternate angle of ${a}°. Missing alternate angle?`,a,'Alternate angles are equal because the lines are parallel.'),
 num(`Same-side interior angles on parallel lines: one is ${a}°. Other angle?`,180-a,'Same-side interior angles sum to 180°.'),
 num(`Interior angle sum of a ${b+3}-sided polygon in degrees?`,(b+1)*180,`Draw diagonals from one vertex to make ${b+1} triangles.`),
 num(`A regular hexagon has six equal exterior angles. Each in degrees?`,60,'Exterior angles sum to 360°; divide by 6.'),
 match('Match each angle fact with its reason.', ['Opposite angles at crossed lines are equal','Triangle angles sum to 180°','Alternate angles are equal'],['Use a parallel line through a vertex','Vertically opposite angles','Requires parallel lines'],[1,0,2],'A proof needs conditions as well as a numerical answer.'),
 choose('A quadrilateral has four equal sides. Must it have four right angles?', ['No: a non-square rhombus is a counterexample','Yes: all equal-sided shapes are squares','Yes: it has four sides'],0,'Equal sides alone do not force right angles. A square is a special rhombus.')]);
pack('geometry_pythagoras','Pythagoras and geometric proof','geometry',9,['powers','geometry_area'],'In a right triangle, the squares on the shorter sides sum to the square on the hypotenuse: a² + b² = c². Identify the side opposite the right angle first. The theorem does not apply to every triangle.',(a,b)=>[
 num(`Right triangle legs ${3*b} cm and ${4*b} cm. Hypotenuse in cm?`,5*b,`Squares: ${9*b*b} + ${16*b*b} = ${25*b*b}; take the positive square root.`),
 num(`Hypotenuse ${5*b} cm, one leg ${3*b} cm. Other leg in cm?`,4*b,'Subtract the known leg square from the hypotenuse square, then square-root.'),
 num(`A rectangle is 6 m by 8 m. Diagonal in m?`,10,'The diagonal is the hypotenuse: √(36 + 64) = 10.'),
 num(`A right triangle has square areas ${a} and ${b} on its legs. Hypotenuse square area?`,a+b,'Add the two square areas; do not take a root when asked for area.'),
 order('Order a Pythagoras solution for legs 3 and 4.', ['c = 5','c² = 3² + 4²','c² = 25','Identify the hypotenuse opposite the right angle'],[3,1,2,0],'Identify the side, form the equation, calculate squares, then take a positive root.'),
 choose('Why does the square-rearrangement proof establish a² + b² = c²?', ['Removing the same four congruent triangles leaves equal areas','The drawing looks almost square','It was true for 3, 4 and 5'],0,'Area is preserved by rearrangement; an example alone is not a general proof.')]);
pack('geometry_trig','Right-triangle trigonometry','geometry',9,['geometry_similarity','geometry_pythagoras'],'Relative to the chosen angle: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Similar right triangles preserve these ratios. Use degree mode and interpret an approximate calculator result in context.',(a,b)=>[
 num(`A right triangle has opposite ${3*b}, hypotenuse ${5*b}. Find sin θ.`,.6,'Divide opposite by hypotenuse: 3/5 = 0.6.'),
 num(`Adjacent ${4*b}, hypotenuse ${5*b}. Find cos θ.`,.8,'Divide adjacent by hypotenuse: 4/5 = 0.8.'),
 num(`Opposite ${3*b}, adjacent ${4*b}. Find tan θ.`,.75,'Divide opposite by adjacent: 3/4 = 0.75.'),
 num(`A 30° right triangle has hypotenuse ${2*a} m. Use sin 30° = 0.5. Opposite length?`,a,'Opposite = hypotenuse × sine of the angle.'),
 match('Match the side pair to the trigonometric ratio.', ['Opposite / hypotenuse','Adjacent / hypotenuse','Opposite / adjacent'],['tan','sin','cos'],[1,2,0],'Name sides relative to the marked angle, not the orientation of the page.'),
 choose('A calculator gives sin 30 = −0.988… for a 30° problem. What should you check?', ['Degree mode','Whether all lengths are negative','Whether every triangle is equilateral'],0,'In degree mode sin 30° = 0.5. A negative ratio is inconsistent with positive side lengths in this acute right triangle.')]);
pack('geometry_solids','Nets, faces and solid properties','geometry',6,['geometry_shapes','measure_volume'],'A net unfolds a surface without changing face sizes. Cuboids have six rectangular faces, twelve edges and eight vertices. Prisms repeat a constant cross-section; pyramids narrow to a vertex. Cylinders and cones have curved surfaces.',(a,b)=>[
 num(`A prism has a ${b+1}-sided polygon as each end. Total flat faces?`,b+3,'There is one rectangular side face for each polygon edge, plus two end faces.'),
 num(`How many vertices does a prism with ${b+1}-sided ends have?`,2*(b+1),'There are two copies of the end polygon, so double its vertex count.'),
 num(`A pyramid has a ${b+1}-sided base. How many edges?`,2*(b+1),'Each base edge has a matching edge from a base vertex to the apex.'),
 num(`A cuboid has dimensions ${a}, ${b}, 2 cm. Area of its two a-by-b faces in cm²?`,2*a*b,'Two opposite faces each have area a × b.'),
 match('Match each solid with its surface description.', ['Cylinder','Cone','Sphere'],['One curved surface, no flat faces','Two circular ends and a curved surface','One circular base and a curved surface'],[1,2,0],'Distinguish flat faces from curved surfaces.'),
 choose('Which face arrangement can fold into a cube?', ['Four squares in a row, with one above and one below the second square','Six squares in a straight row','A 2 by 3 rectangle of squares'],0,'The cross arrangement gives four side faces and two opposite ends without overlap.')]);
pack('ratio_inverse','Direct and inverse proportion','ratio',8,['ratio_proportion','algebra_formulae'],'Direct proportion keeps y/x constant and has y = kx. Inverse proportion keeps xy constant and has y = k/x. Check the model assumptions: more equal workers shorten a fixed job only if each works at the same rate.',(a,b)=>[
 num(`y is directly proportional to x. At x = 2, y = ${2*b}. Find y at x = 5.`,5*b,`The constant y/x is ${b}; multiply 5 by ${b}.`),
 num(`${b} equal pumps empty a tank in ${a} hours. How many hours for ${2*b} pumps at the same rate?`,a/2,'Doubling the pumps halves the time for the fixed tank.'),
 num(`xy = ${a*b}. Find y when x = ${b}.`,a,'Divide the constant product by x.'),
 num(`At £${b} per kg, how many pounds for ${a} kg?`,a*b,'Constant unit price is a direct proportion.'),
 match('Match the relationship to its model.', ['Constant price per item','Fixed job shared by equal workers','£4 entry plus £2 per item'],['Inverse proportion','Neither direct nor inverse','Direct proportion'],[2,0,1],'A fixed entry cost prevents a constant cost/items ratio.'),
 choose('Which graph represents direct proportion?', ['A straight line through the origin','Any straight line','A decreasing reciprocal curve'],0,'A zero input has zero output and the ratio remains constant.')]);
pack('ratio_scale','Scale diagrams and part-whole ratios','ratio',7,['ratio_basics','measure_units'],'Write a ratio in common units before simplifying. A part:part ratio compares separate parts; part:whole includes their sum. A scale diagram multiplies every length by the same factor.',(a,b)=>[
 num(`Map scale 1 cm : 200 m. A route is ${b} cm on the map. Real distance in m?`,b*200,'Multiply the map length by metres per centimetre.'),
 num(`A 1:100 drawing shows ${b} cm. Real length in metres?`,b,'100 real centimetres equal 1 metre for each drawing centimetre.'),
 num(`Red:blue = 2:3. There are ${5*a} counters. How many red?`,2*a,`There are 5 parts. Each part is ${a}. Red gets 2 parts.`),
 num(`There are ${3*b} red and ${2*b} blue counters. Red as a fraction of all counters?`,.6,'Red is 3 of the 5 equal parts: 3/5.'),
 match('Match equivalent ratios.', ['2:3','1:4','3:2'],['6:4','4:6','3:12'],[1,2,0],'Multiply both parts by the same positive factor.'),
 plot('A scale diagram doubles displacement from the origin. Plot the image of (2, −1).',[4,-2],'Both coordinates double, preserving the shape and direction.')]);
pack('ratio_percentages','Percentages, original values and interest','ratio',8,['percent_change','decimals'],'A percentage is a multiplier per hundred. Increase by 20% means multiply by 1.2; undo it by dividing by 1.2. Percentages over 100% can describe more than a whole. Simple interest adds the same amount each year.',(a,b)=>[
 num(`After a 20% increase a price is £${12*a}. Original price in pounds?`,10*a,'Divide by 1.2, rather than subtracting 20% of the new price.'),
 num(`Find 150% of ${2*a}.`,3*a,'150% = 1.5; this is one and a half times the amount.'),
 num(`£${100*a} earns 3% simple interest for ${b} years. Interest in pounds?`,3*a*b,'Principal × rate/100 × years; do not compound.'),
 num(`${a} is what percentage of ${4*a}?`,25,'Part ÷ comparison whole × 100 = 25%.'),
 match('Match each change to its multiplier.', ['Increase 25%','Decrease 25%','Take 200%'],['2','1.25','0.75'],[1,2,0],'The original whole is 100%; add or remove the stated percentage.'),
 choose('A price rises 10% then falls 10%. What happens?', ['It finishes at 99% of the starting price','It returns to the starting price','It finishes at 100.1%'],0,'1.1 × 0.9 = 0.99. The second percentage uses a different whole.')]);
pack('statistics_distributions','Grouped data, spread and outliers','statistics',8,['stats_averages','stats_tables'],'Compare typical values and spread, not just a single maximum. A mean uses every value; a median uses the middle position. Grouped data gives intervals, so midpoint calculations estimate rather than recover the exact original mean.',(a,b)=>[
 num(`Data: ${a}, ${a+2}, ${a+4}, ${a+6}. Mean?`,a+3,'The sum is four times the midpoint a + 3; divide by four.'),
 num(`Data: ${b}, ${b+1}, ${b+2}, 100. Range?`,100-b,'Maximum minus minimum measures the full spread.'),
 num(`Data: 2, 3, 4, ${a+100}. Median?`,3.5,'There are four values; average the two middle values 3 and 4.'),
 num('Grouped data: 0–10 has frequency 2; 10–20 has frequency 4. Estimated total using midpoints?',70,'Use midpoints 5 and 15: 2 × 5 + 4 × 15 = 70.'),
 match('Match each data situation to a useful measure.', ['Typical pay with one very high outlier','Most popular shoe size','Consistency of repeated lengths'],['Range','Median','Mode'],[1,2,0],'Median resists outliers, mode finds popularity, range describes spread.'),
 choose('Two groups have equal mean, but ranges 2 and 20. What can you conclude?', ['The second has a greater overall spread','Their distributions are identical','Every value in the second is larger'],0,'Mean alone does not describe a distribution.')]);
pack('statistics_scatter','Scatter graphs and cautious inference','statistics',9,['algebra_coordinates','stats_tables'],'Each point pairs two measurements. A trend can be positive, negative or absent. Correlation alone does not prove causation. Predictions within the observed range are generally more defensible than extrapolations.',(a,b)=>[
 num(`A trend line is y = 2x + ${b}. Estimate y at x = ${a}.`,2*a+b,'Substitute into the trend model; this is a prediction, not a guaranteed individual result.'),
 num(`Observed pairs: (1, ${b}), (2, ${2*b}), (3, ${3*b}). Increase in y per unit x?`,b,'Compare the change in y with the change in x between adjacent points.'),
 num(`Grouped frequencies are ${a}, ${b} and ${a+1}. Total observations?`,2*a+b+1,'Add frequencies, not the group labels.'),
 num(`A chart key is 1 symbol = ${b} responses. ${a} symbols represent how many?`,a*b,'Multiply by the key before comparing quantities.'),
 plot('A survey records (hours outdoors, plant growth) = (2, 4). Plot this pair.',[2,4],'Each point contains both measurements from one observation.'),
 choose('Ice cream sales and sunburn are correlated. What is justified?', ['Hot weather may influence both; sales alone do not establish a cause','Buying ice cream causes sunburn','Correlation proves causation'],0,'A third variable can explain an association. Observational data alone cannot prove cause.')]);
pack('statistics_graphs','Constructing and interpreting charts','statistics',6,['stats_scale','stats_pie'],'Choose a display suited to the variable. Bar charts compare categories; line graphs show change in an ordered variable such as time; pie charts show shares of a whole. Read scales and label both axes.',(a,b)=>[
 num(`A pie category contains ${a} of ${4*a} responses. Angle in degrees?`,90,'The share is 1/4; multiply by 360°.'),
 num(`A line graph rises from ${a} to ${a+b} litres. Increase in litres?`,b,'Subtract the starting reading from the ending reading.'),
 num('A group has values 2, 4, 6 with frequencies 1, 2, 1. Mean?',4,'Weighted sum is 16 over 4 observations.'),
 num(`A chart axis increases by ${b} every interval. Four intervals represent?`,4*b,'Count intervals, then multiply by the scale.'),
 match('Choose a useful display.', ['Favourite transport category','Water temperature each minute','Share of a fixed budget'],['Pie chart','Bar chart','Line graph'],[1,2,0],'Categories use bars, continuous change over time uses lines, and parts of a whole can use a pie.'),
 order('Arrange a chart-building plan.', ['Draw values using the scale','Choose a suitable representation','Label axes and units','Choose an even scale'],[1,3,2,0],'Select the representation and scale, label the axes, then draw accurately.')]);
pack('probability_sets','Sets and combined sample spaces','probability',8,['prob_events','fraction_mult'],'List outcomes systematically so none are missing or counted twice. A union means in either set; an intersection means in both. For equally likely combined outcomes, favourable outcomes divided by all outcomes gives probability.',(a,b)=>[
 num(`A café offers ${b} drinks and ${a} snacks. How many drink-snack pairs?`,a*b,'Pair each drink with every snack; use a two-way grid.'),
 num(`A fair ${b}-section spinner and a fair ${a}-section spinner are spun. Probability of both landing on their single star sections?`,1/(a*b),`There are ${a*b} equally likely pairs, and only one pair contains both stars.`),
 num(`Set A has ${a} members, B has ${b} members and 2 are in both. Size of A union B?`,a+b-2,'Add both sizes and subtract the overlap counted twice.'),
 num(`A bag has ${a} plain and ${b} striped counters. A striped counter is drawn and replaced. Probability the next counter is striped?`,b/(a+b),'Replacement restores the original proportions; use striped divided by all counters.'),
 match('Match the set description to its elements in {1,2,3,4,5,6}.', ['Even AND greater than 3','Even OR greater than 3','Neither even nor greater than 3'],['1, 3','4, 6','2, 4, 5, 6'],[1,2,0],'AND selects the intersection; OR takes the union once per element; neither is outside both.'),
 order('Arrange a sample-space method.', ['Count favourable equally likely outcomes','List every first event outcome','Pair each with every second outcome','Divide by total equally likely outcomes'],[1,2,0,3],'Build the complete grid before counting favourable cells.')]);
pack('probability_experiments','Experimental probability and fairness','probability',7,['prob_chance','decimals'],'Relative frequency is successes divided by trials. It estimates a probability; it does not guarantee future outcomes. Unequal sectors or outcome weights require their actual shares. Mutually exclusive exhaustive outcomes have probabilities summing to 1.',(a,b)=>[
 num(`${a} successes in ${4*a} trials. Relative frequency?`,.25,'Divide successes by the total trials: 1/4.'),
 num('A spinner has red area 1/2, blue 1/3 and green the rest. Probability of green?',1/6,'Subtract 1/2 + 1/3 = 5/6 from 1.'),
 num(`An estimated probability is 0.3. Expected successes in ${10*a} similar trials?`,3*a,'Multiply estimated probability by trial count; this is an expectation, not a promise.'),
 num(`A bag has ${3*b} red and ${b} blue identical counters. Probability of red?`,.75,'There are 4 equal parts in all, of which 3 are red.'),
 match('Match each statement with its interpretation.', ['Probability 0','Probability 1','Probability 1/2'],['Certain','Equally likely to happen or not happen','Impossible'],[2,0,1],'The probability scale runs from impossible at zero to certain at one.'),
 choose('A fair coin lands heads five times. What is the next-head probability?', ['1/2: previous tosses do not change this fair independent toss','0: tails is due','1: heads is on a streak'],0,'Independent tosses have the same probability regardless of the earlier run.')]);
pack('measure_composite','Composite areas, prisms and cylinders','measure',8,['geometry_area','measure_volume','geometry_circle'],'A composite area can be split into non-overlapping simple shapes. A prism has volume cross-section area × length. A cylinder is a circular prism, with volume πr²h. Surface area counts every exposed face exactly once.',(a,b)=>[
 num(`A trapezium has parallel sides ${a} and ${a+4} cm, height ${b} cm. Area?`,(a+2)*b,'Average the parallel sides and multiply by perpendicular height.'),
 num(`A prism has cross-section ${a} cm² and length ${b} cm. Volume?`,a*b,'Repeat the cross-section along the length.'),
 num(`Cylinder radius 2 cm, height ${b} cm. Use π = 3.14. Volume to 2 dp?`,Number((12.56*b).toFixed(2)),'π × 2² × height = 12.56 × height.'),
 num(`An L-shape is a ${a+2} by ${b+2} rectangle with a 2 by 2 corner removed. Area?`,(a+2)*(b+2)-4,'Subtract the missing corner from the full surrounding rectangle.'),
 match('Match the measurement to its formula.', ['Parallelogram area','Cylinder volume','Circle circumference'],['2πr','base × perpendicular height','πr²h'],[1,2,0],'Distinguish lengths, square units and cubic units.'),
 choose('Two rectangles both have area 12 cm². Must they have equal perimeters?', ['No: 3×4 has perimeter 14; 2×6 has perimeter 16','Yes: equal areas force equal perimeters','Only squares have perimeters'],0,'Area counts covering; perimeter counts boundary. They are different measures.')]);
pack('measure_compound','Compound units and conversions','measure',8,['measure_speed','measure_units','ratio_rates'],'Write units as well as numbers. Speed is distance/time; density is mass/volume; unit price is cost/quantity. Square conversion factors for areas and cube them for volumes. For approximate conversions use the stated factor.',(a,b)=>[
 num(`A ${a*100} g block occupies ${a*20} cm³. Density in g/cm³?`,5,'Mass divided by volume: 100/20 = 5.'),
 num(`${b} m² is how many cm²?`,b*10000,'1 m = 100 cm, so 1 m² = 100² cm².'),
 num(`${b} m³ is how many cm³?`,b*1000000,'Cube the length factor: 100³ = 1,000,000.'),
 num(`Use 5 miles ≈ 8 km. ${5*b} miles is approximately how many km?`,8*b,'Scale both quantities by the same factor.'),
 match('Match the rate to its unit.', ['Speed','Density','Unit price'],['£/kg','km/h','g/cm³'],[1,2,0],'The denominator tells you “per” which quantity.'),
 choose('A cyclist travels 12 km in 30 minutes. Speed?', ['24 km/h','0.4 km/h','6 km/h'],0,'30 minutes = 0.5 hours; 12 ÷ 0.5 = 24 km/h.')]);
pack('town_planning','Plan, compare and explain a Town day','town',7,['town_totals','town_timetable','ratio_proportion'],'Begin a home journey as a customer: check stock, list what is missing, allow travel time, compare suitable offers, pay, return and scale a recipe. A direct business entrance can instead start a worker day. All prices and budgets are fictional.',(a,b)=>[
 num(`A recipe needs ${a+3} portions; the cupboard has ${a}. Portions to buy?`,3,'Subtract existing stock before shopping.'),
 num(`Need ${b+1} items sold only in packs of ${b}. Minimum whole packs?`,2,'One pack is short; round up to cover the actual need.'),
 num(`A bus takes ${a} minutes, then a walk takes ${b}. Total minutes?`,a+b,'Include every stage of the journey.'),
 num(`A ${b}-portion recipe needs ${100*b} g flour. Flour for ${a} portions?`,100*a,'Find grams per portion, then scale to the required portions.'),
 order('Arrange a customer cooking journey.', ['Shop and pay','Check cupboards','Return home','Make a shopping list','Make the recipe','Take the bus to the shops'],[1,3,5,0,2,4],'Use existing stock first; the list guides shopping; bring ingredients home before cooking.'),
 choose('You need 3 items. Singles cost 80p; a 4-pack costs £2.80. Which meets the need for less?', ['Three singles for £2.40','The pack because each item is cheaper','Neither offer meets the need'],0,'A lower unit price need not give the lowest total spend for the quantity you need.')]);

pack('number_precision','Large numbers, decimals and written calculations','number',6,['written_methods','number_accuracy'],'Read place values from millions through thousandths. Formal decimal multiplication first multiplies whole-number digits, then accounts for the total decimal places. For decimal division, scale dividend and divisor by the same power of ten. Rounding to significant figures starts at the first non-zero digit.',(a,b)=>[
 {...num(b%7===0?'Build 10,000,000 using the place-value columns.':`In ${2+b%7},${String(a).padStart(3,'0')},456, build the value of the millions digit.`,b%7===0?10000000:(2+b%7)*1000000,'The millions digit is multiplied by one million. Ten one-million blocks make one ten-million block, 10,000,000.'),activity:{kind:'place',weights:[10000000,1000000,100000,10000,1000,100,10,1],labels:['Ten millions','Millions','Hundred thousands','Ten thousands','Thousands','Hundreds','Tens','Ones']}},
 num(`Use written multiplication: ${(a/100).toFixed(2)} × ${b}.`,a*b/100,`Multiply the whole-number digits ${a} × ${b} = ${a*b}, then restore the two decimal places.`),
 num(`Use written division: ${(a*8/100).toFixed(2)} ÷ 8.`,a/100,`Divide place by place, keeping the decimal point aligned: ${a*8/100} ÷ 8 = ${a/100}.`),
 num(`Convert ${(a/1000).toFixed(3)} kg to grams.`,a,'One thousandth of a kilogram is one gram; multiply by 1,000.'),
 order('Arrange a formal calculation for 12.35 × 0.6.', ['7.410 = 7.41','There are three decimal places in the two factors altogether','1235 × 6 = 7410','Ignore the decimal points while multiplying the whole-number digits'],[3,2,1,0],'Multiply whole digits first, then restore all three decimal places. The zero at the end may be omitted.'),
 match('Match a rounding or exact-value statement.', ['0.004876 to 3 significant figures','18.376 to 1 decimal place','√2 compared with 1.414'],['√2 is exact; 1.414 approximates it','0.00488','18.4'],[1,2,0],'The first significant figure is the first non-zero digit. Decimal places count from the decimal point.')]);
pack('algebra_symbolic','Fractional coefficients and complete expansions','algebra',9,['algebra_rules','algebra_formulae'],'Fractional coefficients multiply in the same way as whole coefficients. To expand two brackets, form every pairwise product and collect like terms. For more brackets, expand a pair first and distribute the next factor over the entire resulting expression. A linear equation ax + by = c can be rearranged by isolating y.',(a,b)=>[
 num(`Evaluate (1/2)x + ${b} when x = ${2*a}.`,a+b,'Half the supplied x, then add the constant.'),
 num(`Expand (x + ${a})(x + ${b}). Coefficient of x?`,a+b,`The full expansion is x² + ${a+b}x + ${a*b}.`),
 num(`Rearrange y + ${b}x = ${a}. What is the gradient when written y = mx + c?`,-b,`Subtract ${b}x: y = −${b}x + ${a}.`),
 num(`Expand (x + ${a})(x + ${b})(x + 1). What is the constant term?`,a*b,'The constant uses the three constants: a × b × 1. All other products include x.'),
 match('Match each full expansion or factorisation.', ['(x + 2)(x + 3)','(x + 1)(x + 2)(x + 3)','(1/2)(4x + 6)'],['2x + 3','x² + 5x + 6','x³ + 6x² + 11x + 6'],[1,2,0],'Distribute every term. For three brackets, first obtain x² + 3x + 2, then multiply each term by x and by 3.'),
 order('Expand (x + 2)(x − 3): arrange the steps.', ['Combine like terms: x² − x − 6','Multiply x by both terms: x² − 3x','Multiply 2 by both terms: 2x − 6','Add the four products: x² − 3x + 2x − 6'],[1,2,3,0],'There are four products. Keep the minus sign on −3 throughout, then combine −3x and 2x.')]);
pack('ratio_models','Ratios above one and inverse graphs','ratio',9,['ratio_inverse','ratio_scale'],'A quantity can be more than the comparison whole: 6 compared with 4 is 6/4 = 1.5. In inverse proportion xy is constant, so doubling x halves y. Its graph curves; connected samples are an approximation, not a straight-line proportional model.',(a,b)=>[
 num(`${3*a} is what fraction of ${2*a}? Give a decimal or fraction.`,1.5,'Divide the first quantity by the comparison quantity: 3/2. A fraction may exceed one.'),
 num(`A mixture has ${3*b} ml concentrate and ${2*b} ml water. Concentrate as a percentage of water?`,150,'The comparison whole is water, not the mixture total: 3/2 × 100 = 150%.'),
 num(`For y = ${a*b}/x, find y when x = ${b}.`,a,'Multiply x and y to check that their product is the stated constant.'),
 num(`For y = ${a*b}/x, find x when y = ${a}.`,b,'The same constant product lets you solve in either direction.'),
 {prompt:'Produce samples of the inverse graph y = 4/x at x = 1, 2 and 4.',answer:[[1,4],[2,2],[4,1]],worked:'The pairs are (1,4), (2,2), (4,1). The product is 4 each time. The joining segments approximate the decreasing curve.',activity:{kind:'plotset',labels:['x = 1','x = 2','x = 4'],join:true}},
 choose('For the inverse graph y = 4/x with positive x, which inference is justified?', ['Halving x doubles y; the curve does not pass through the origin','Adding one to x always adds one to y','The graph is a straight line through the origin'],0,'The product remains 4; y is undefined at x = 0. Ratios and additive differences do not stay constant.')]);
pack('geometry_design','Measured figures and congruent triangles','geometry',8,['geometry_construction','geometry_similarity'],'Construct figures from conditions, rather than judging their appearance. Mark equal lengths and right angles explicitly. In triangle ABC the side opposite A is a. SSS, SAS, ASA and RHS determine congruence when their stated conditions hold. A scale bar or ruler supplies lengths even without a coordinate grid.',(a,b)=>[
 num(`A drawing at 1:50 has a side ${b} cm long. Real length in centimetres?`,50*b,'Multiply drawing length by the scale denominator, keeping units consistent.'),
 {...num(`Draw an angle of ${15+a%150}° using the protractor.`,15+a%150,'Begin at the 0° ray pointing right. Read the scale from that ray and move the second ray to the requested number of degrees.'),activity:{kind:'angle',min:0,max:180}},
 num(`A regular ${b+3}-sided polygon has how many lines of reflection symmetry?`,b+3,'Each line passes through the centre and a vertex or side midpoint. The rotational symmetry order is also the side count.'),
 num(`A ${b+3}-sided pyramid has how many vertices?`,b+4,'There are n base vertices plus one apex.'),
 {prompt:'Draw a rectangle of width 4 units and height 2 units. Start A at (−2, −1), then place B, C and D around the boundary.',answer:[[-2,-1],[2,-1],[2,1],[-2,1]],worked:'Use four horizontal units and two vertical units. Mark all four right angles; opposite sides are equal and parallel.',activity:{kind:'plotset',labels:['A','B','C','D'],join:true,closed:true}},
 match('Match each triangle construction to the condition guaranteeing congruence.', ['All three corresponding sides equal','Two sides and their included angle equal','Right angle, hypotenuse and one other side equal'],['RHS','SSS','SAS'],[1,2,0],'The angle in SAS lies between the two known sides. RHS requires the hypotenuse and another side, not any two angles.')]);
pack('geometry_derivations','Derive formulae and use right-triangle ratios','geometry',9,['measure_composite','geometry_trig','geometry_pythagoras'],'Derive area by cutting, rearranging or doubling known shapes. Two identical triangles form a parallelogram, giving A = bh/2. A prism repeats its cross-section, giving V = Al; a cylinder uses a circular cross-section. For a right triangle, inverse sine finds an acute angle from opposite/hypotenuse. Use degrees and round only the final result.',(a,b)=>[
 num(`A triangular cross-section has base ${2*a} cm, height ${b} cm. A prism of this cross-section is 3 cm long. Volume?`,3*a*b,'Cross-section area is (2a × b)/2 = ab. Multiply by prism length 3.'),
 num(`A cylinder has radius 3 cm and height ${b} cm. Use π = 3.14. Volume in cm³?`,28.26*b,'πr²h = 3.14 × 9 × height.'),
 num('A right triangle has opposite/hypotenuse = 0.5. Use sin⁻¹ in degree mode. Angle in degrees?',30,'sin⁻¹(0.5) = 30°. Inverse sine undoes the ratio for an acute angle.'),
 num(`A right triangle has opposite ${a} cm and adjacent ${b} cm. Use the degree-mode calculator to find the angle to 1 decimal place.`,Number((Math.atan(a/b)*180/Math.PI).toFixed(1)),`Divide opposite by adjacent: ${a}/${b}. The angle is tan⁻¹(${a}/${b}) ≈ ${Number((Math.atan(a/b)*180/Math.PI).toFixed(1))}°. Round only the final result.`),
 order('Derive the trapezium area formula.', ['Area of one trapezium is (a + b)h/2','Duplicate the trapezium','Join the two copies into a parallelogram','The parallelogram has base a + b and height h'],[1,2,3,0],'Two equal copies form a parallelogram of area (a+b)h. Halve that area for one trapezium.'),
 order('Arrange a Pythagoras area proof.', ['Subtract the same four triangle areas from both equal outer squares','In the other arrangement the remaining areas are a² and b²','Conclude c² = a² + b²','Place four congruent right triangles in two equal (a+b)-sided squares','In one arrangement the remaining area is c²'],[3,4,1,0,2],'Both outer squares have equal area and contain the same four congruent triangles. Equal remainders give the theorem for every right triangle, not just one example.')]);

// Higher-band tasks change representation and reasoning, rather than only magnitudes.
function advanced(id,base,a,b,seed){
 const task=(prompt,answer,worked,activity)=>({...num(prompt,answer,worked),activity});
 const graph=(prompt,answer,worked,series,description)=>task(prompt,answer,worked,{kind:'readgraph',series,description});
 const points=(prompt,answer,worked,labels,extra={})=>task(prompt,answer,worked,{kind:'plotset',labels,join:true,...extra});
 const chart=(prompt,answer,worked,labels,display='bar',max=20,unit='frequency')=>task(prompt,answer,worked,{kind:'chart',labels,display,max,unit});
 if(id==='number_precision'){
  base[1]=num(`Round ${(a+.456)/100000} to 3 significant figures.`,Number(((a+.456)/100000).toPrecision(3)),'Begin at the first non-zero digit. Keep three significant digits, inspect the next digit, and round.');
  base[0]={...num(`Build ${(a/1000).toFixed(3)} using decimal place values.`,a/1000,'The first, second and third places after the point are tenths, hundredths and thousandths.'),activity:{kind:'place',weights:[1,.1,.01,.001],labels:['Ones','Tenths','Hundredths','Thousandths']}};
  base[2]={...num('Place √2 on the real-number line, rounded to 2 decimal places.',1.41,'√2 is irrational. Since 1.41² is about 1.9881 and 1.42² is 2.0164, √2 is between these; to two decimal places it is 1.41.'),activity:{kind:'numberline',min:0,max:2,step:.01}};
  base[3]=num(`Use a formal fraction method to divide −${a} 1/2 by ${b} 1/2. Give a fraction or decimal.`,-(2*a+1)/(2*b+1),`Convert to improper fractions: −${2*a+1}/2 ÷ ${2*b+1}/2. Multiply by the reciprocal 2/${2*b+1}. Cancel the two factors of 2, leaving −${2*a+1}/${2*b+1}.`);
  base[4]=order('Arrange the written division of 12.48 by 0.8.', ['The quotient is 15.6','Scale both numbers: 124.8 ÷ 8','Subtract 8 from 12; bring down 4 to make 44','5 eights make 40; subtract and bring down 8 to make 48 tenths','1 eight fits into 12; write 1 in the tens position','6 eights make 48; write 6 in tenths'],[1,4,2,3,5,0],'Scale both values equally, divide each place, subtract the product and bring down the next digit. Keep the decimal point aligned.');
 }
 if(id==='number_sets')base[4]=match('Match each prime product to its value.', ['2² × 3','2 × 3²','2³ × 5'],['18','40','12'],[2,0,1],'Prime factorisation uses only prime factors, including repeated factors. Uniqueness means every prime factorisation of the same integer has the same prime factors with the same multiplicities, in any order.');
 if(id==='geometry_design'){
  const criteria=['SSS: AB = 4 cm, AC = 3 cm, BC = 5 cm','SAS: AB = 4 cm, AC = 3 cm, angle A = 90°','RHS: angle A = 90°, hypotenuse BC = 5 cm, AB = 4 cm'][seed%3];
  base[4]={prompt:`Construct triangle ABC above AB using a ruler model. ${criteria}. A is at the centre; B is directly right of A. The scale divisions are 1 cm.`,answer:[[0,0],[4,0],[0,3]],worked:'From A place B four 1 cm steps right. Place C three 1 cm steps up. Joining B to C gives length 5 cm by Pythagoras. Corresponding a is BC, opposite A.',activity:{kind:'plotset',labels:['A','B','C'],join:true,closed:true,offgrid:true,notation:'AB = 4 cm; AC = 3 cm; BC = 5 cm. ∠A = 90°. Side a is BC.'}};
  if(seed%6===5)base[4]={prompt:'Draw an enlargement of a right triangle whose perpendicular legs are 2 cm and 1 cm. Use factor 2. Put A at the centre, B to its right and C above A. Use the scale bar.',answer:[[0,0],[4,0],[0,2]],worked:'Multiply both original legs by 2, giving 4 cm and 2 cm. Corresponding angles stay equal; the image is similar to the original.',activity:{kind:'plotset',labels:['A','B','C'],join:true,closed:true,offgrid:true,notation:'The image has twice each original length and the same angles.'}};
  if(seed%4===0)base[4]={prompt:`Construct triangle ABC using ASA: AB = 4 cm, angle A = ${40+seed%6*5}°, angle B = 60°. Set the side and the two rays.`,answer:[4,40+seed%6*5,60],worked:'Fix the base first. Draw a ray from each end at the specified angle. Their intersection determines the third vertex, so ASA determines a congruent triangle.',activity:{kind:'triangle',labels:['AB length (cm)','Angle A (degrees)','Angle B (degrees)']}};
  base[5]={prompt:'Use conventional arrow markings to show the parallel side pairs of rectangle ABCD.',answer:[1,2,1,2],worked:'AB is parallel to CD; BC is parallel to AD. Give one opposite pair a single arrow each and the other opposite pair a double arrow each. The right-angle box marks ∠A = 90°.',activity:{kind:'markings',labels:['AB','BC','CD','DA']}};
 }
 if(id==='fraction_reasoning'){
  base[4]={prompt:'Use a six-part bar to show a fraction equivalent to one half. Shade the equal parts.',answer:[0,1,2],worked:'Split each half into three equal parts: one half is 3/6. Multiplying numerator and denominator by 3 keeps the share unchanged.',activity:{kind:'cells',columns:6,rows:1,countOnly:true,count:3}};
  base[5]={prompt:'Build 1/2 + 1/3 by shading a six-part bar.',answer:[0,1,2,3,4],worked:'Use the common multiple 6: 1/2 = 3/6 and 1/3 = 2/6, so the result is 5/6. The parts must all have the same size.',activity:{kind:'cells',columns:6,rows:1,countOnly:true,count:5}};
 }
 if(id==='algebra_graphs')return [
  graph(`The graph shows distance from home. Estimate y when x = ${seed%7-3}.`,4-Math.abs(seed%7-3),'Read the height of the drawn segment above this x. The two straight sections meet at (0,4).',[[[-4,0],[0,4],[4,0]]],'Piecewise linear distance model, with vertices (−4,0), (0,4), (4,0).'),
  graph(`The reciprocal model y = ${2+seed%3}/x is sampled at x = 1, 2, 4. Using the drawn segment, estimate y at x = ${1.5+seed%5*.5}.`,(1.5+seed%5*.5)<=2?(2+seed%3)*(1-(.5+seed%5*.5)/2):(2+seed%3)*(.5-(-.5+seed%5*.5)/8),'Interpolate along the drawn segment. The straight segment only approximates the reciprocal curve.',[[[1,2+seed%3],[2,(2+seed%3)/2],[4,(2+seed%3)/4]]],'Connected samples of the reciprocal formula printed in the question; straight segments approximate the curve.'),
  graph(`The graph joins samples of y = 2ˣ. Using a drawn segment, estimate x where y = ${1.5+seed%5*.5}.`,Math.log2(1.5+seed%5*.5)===1?1:(1.5+seed%5*.5)<=2?(.5+seed%5*.5):1+(-.5+seed%5*.5)/2,'Interpolate along the drawn segment, rather than treating it as the exact curved exponential graph.',[[[-2,.25],[-1,.5],[0,1],[1,2],[2,4]]],'Connected samples of y = 2 to the power x.'),
  graph(`Find the x coordinate where y = x + ${2-(seed%5-2)} and y = −x + ${2+(seed%5-2)} intersect.`,seed%5-2,'Read the shared point. Both line equations have the same x and y there.',[[[seed%5-4,0],[seed%5-2,2],[seed%5,4]],[[seed%5-4,4],[seed%5-2,2],[seed%5,0]]],'The two straight lines have the equations printed in the question.'),
  points('Produce the graph y = x² at x = −2, −1, 0, 1, 2. Plot the five samples in that order.',[[-2,4],[-1,1],[0,0],[1,1],[2,4]],'Square each x. The symmetric samples trace a quadratic, not a straight line. The connected segments approximate the curve.',['A','B','C','D','E']),
  points('Plot the line 2y = 2x + 2 at x = −2, 0, 2. First rearrange to y = x + 1.',[[-2,-1],[0,1],[2,3]],'Divide every term by 2. The gradient is 1 and the intercept is 1.',['A','B','C'])
 ];
 if(id==='geometry_construction'){
  base[4]=points('Draw rectangle ABCD with A = (−2, −1), width 4, height 2, sides parallel to the axes. Name corners clockwise starting along the bottom edge.',[[-2,-1],[2,-1],[2,1],[-2,1]],'Move 4 units right, 2 up, 4 left. Horizontal and vertical sides meet at right angles.',['A','B','C','D'],{closed:true});
  base[5]=seed%3===0 ? points('Construct a perpendicular from P(0,3) to the horizontal line y = 0. Equal-radius circles from (−4,0) and (4,0) are drawn. Join their lower and upper intersections.',[[0,-3],[0,3]],'Both arc intersections are equally distant from the two line points. Their joining line x = 0 crosses the horizontal line at a right angle, giving the shortest path from P.',['Lower','P'],{circles:[[-4,0,5],[4,0,5]]}) : seed%3===1 ? points('Bisect the right angle at the origin between the positive axes. Equal-radius arcs centred at (4,0) and (0,4) are drawn. Plot the origin, then their other intersection.',[[0,0],[4,4]],'The ray through the equal-arc intersection has equal distance from both arms and splits the 90° angle into two 45° angles.',['Origin','Other intersection'],{circles:[[4,0,4],[0,4,4]]}) : points('Construct the perpendicular bisector of the segment from (−4, 0) to (4, 0). The equal-radius compass circles are drawn. Plot their lower intersection, then their upper intersection to join them.',[[0,-3],[0,3]],'Both circles have radius 5. Their intersection points are equally distant from the ends. Joining them gives x = 0, perpendicular to and halfway along the segment.',['Lower intersection','Upper intersection'],{circles:[[-4,0,5],[4,0,5]]});
 }
 if(id==='geometry_similarity'){
  base[4]=points('Enlarge triangle A(−1, −1), B(1, −1), C(0, 1) by factor 2 about the origin. Plot the three image vertices.',[[-2,-2],[2,-2],[0,2]],'Multiply each displacement from the origin by 2; corresponding angles stay equal.',['A′','B′','C′'],{closed:true});
  base[5]=seed%3===0 ? points('Translate triangle A(−3, 1), B(−1, 1), C(−2, 3) by (3, −2). Plot the image vertices.',[[0,-1],[2,-1],[1,1]],'Add 3 to each x and subtract 2 from each y. Corresponding lengths and angles stay equal.',['A′','B′','C′'],{closed:true}) : seed%3===1 ? points('Rotate triangle A(1, 1), B(3, 1), C(2, 3) by 90° anticlockwise about the origin.',[[-1,1],[-1,3],[-3,2]],'The rule is (x,y) → (−y,x). Rotate every vertex about the same centre.',['A′','B′','C′'],{closed:true}) : points('Reflect triangle A(−3, 1), B(−1, 1), C(−2, 3) in the y axis. Plot the image vertices.',[[3,1],[1,1],[2,3]],'Reflection in the y axis changes each x sign and keeps y. Lengths and angles are preserved.',['A′','B′','C′'],{closed:true});
 }
 if(id==='geometry_solids'){
  base[4]=task('Build any six-square net that folds into a cube. Squares must join edge to edge; no two faces may overlap when folded.',[2,7,11,12,13,17],'One possible net is a vertical strip of four squares, with one square on each side of its third square. Other valid cube nets are accepted.',{kind:'cells',columns:5,rows:5,cube:true,count:6});
  base[5]=chart('A cuboid has dimensions 2 cm, 3 cm, 4 cm. Record the combined areas of each opposite face pair.',[12,16,24],'Two 2×3 faces total 12; two 2×4 total 16; two 3×4 total 24. Surface area is their sum.',['2 by 3 pair','2 by 4 pair','3 by 4 pair'],'bar',30,'cm²');
 }
 if(id==='statistics_graphs'){
  base[4]=chart('Construct a pie chart for counts Walk 2, Bus 3, Cycle 5. Enter each sector angle in degrees.',[72,108,180],'There are 10 responses, so each response is 36°. Angles total 360°.',['Walk','Bus','Cycle'],'pie',360,'degrees');
  base[5]=chart('Construct the line graph: time 0 minutes → 2 L; time 1 → 5 L; time 2 → 7 L.',[2,5,7],'Put time on the horizontal axis, volume on the vertical axis, and join the ordered readings.',['0 min','1 min','2 min'],'line',8,'litres');
 }
 if(id==='statistics_distributions'){
  base[4]=chart('Group the data 1, 3, 3, 5, 8 into 0 ≤ x < 5 and 5 ≤ x < 10. Build the frequency chart.',[3,2],'1,3,3 lie in the first interval; 5 and 8 lie in the second. Boundary 5 belongs to the second interval.',['0 ≤ x < 5','5 ≤ x < 10'],'bar',5);
  base[5]=chart('Groups A and B both have mean 4. A has values 3,4,5; B has 0,4,8. Plot each range to compare spread.',[2,8],'A range = 5−3 = 2; B range = 8−0 = 8. Equal means do not imply equal consistency.',['A','B'],'bar',8,'range');
 }
 if(id==='statistics_scatter')base[4]=points('Construct a scatter graph for the paired measurements (−2,−1), (−1,1), (1,2), (3,4). Plot one point for each pair.',[[-2,-1],[-1,1],[1,2],[3,4]],'The general trend is positive. Each point pairs measurements; do not join observations into a time series.',['A','B','C','D'],{join:false});
 if(id==='probability_sets')base[4]=task('Place the numbers 1 to 6 in the Venn diagram. A contains even numbers; B contains numbers greater than 3.',[3,0,3,2,1,2],'A only: 2. B only: 5. Both: 4,6. Neither: 1,3. The union contains 2,4,5,6.',{kind:'venn',items:['1','2','3','4','5','6'],setA:'even numbers',setB:'greater than 3'});
 if(id==='probability_experiments'){
  let n=seed*977+37;const outcomes=Array.from({length:20},()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296<.5?'H':'T';});
  base[4]=task('Run 20 simulated fair-coin trials, then record the heads and tails frequencies.',[outcomes.filter(x=>x==='H').length,outcomes.filter(x=>x==='T').length],'Add the two recorded counts to check that they total 20. Relative frequency is the heads count divided by 20; a short experiment need not produce exactly half heads.',{kind:'experiment',outcomes,labels:['Heads','Tails'],max:20});
 }
 return base;
}

function shuffleRows(rows,seed){
 return rows.map((row,family)=>{const r={...row},a=r.activity;if(!a||!['order','match','choice'].includes(a.kind))return r;
  let n=(seed*977+family*31+17)>>>0;const labels=a.kind==='order'?a.items:a.labels,permutation=labels.map((_,i)=>i);
  for(let i=permutation.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[permutation[i],permutation[j]]=[permutation[j],permutation[i]];}
  r.activity={...a,[a.kind==='order'?'items':'labels']:permutation.map(i=>labels[i])};r.answer=a.kind==='choice'?permutation.indexOf(r.answer):r.answer.map(i=>permutation.indexOf(i));return r;
 });
}
function rows(id,band=7,seed=1,calibration=false){
 const p=packs.find(p=>p.id===id);if(!p)throw Error('Unknown curriculum pack '+id);
 // Parameters alter quantities; authored families alter mathematical structure.
 const a=10+((seed*7+band*3)%300),b=2+((seed*3+band)%17);
 const authored=p.build(a,b);
 return shuffleRows(band>=8&&!calibration?advanced(id,authored,a,b,seed):authored,seed).map((r,i)=>{
  const answer=Array.isArray(r.answer)?JSON.stringify(r.answer):typeof r.answer==='number'?fmt(r.answer):String(r.answer);
  let options=[];
  if(r.activity?.kind==='choice')options=r.activity.labels.map((_,j)=>String(j));
  else if(!r.activity){const v=Number(answer);options=[answer,...[1,-1,2].map(d=>fmt(v+d))];}
  const meta={contentVersion:8,id:`${id}:v1:b${band}:s${seed}:f${i}`,family:`${id}:${i}`,band,unit:r.unit||'',activity:r.activity||null,allowCalculator:['geometry_trig','geometry_derivations'].includes(id),misconception:r.worked};
  return [r.prompt,answer,options,p.lesson,r.worked,meta];
 });
}
function create(id,band,round,{exclude=new Set()}={}){
 const result=[];const seen=new Set(exclude);
 for(let family=0;family<6;family++){
  let chosen;
  for(let attempt=0;attempt<100;attempt++){
   const row=rows(id,band,round+attempt*31)[family];
   if(!seen.has(row[0])){chosen=row;break;}
  }
  // Fixed reasoning tasks are deliberately finite: do not invent fresh mastery
  // by treating wording-only changes as a new independent assessment.
  if(chosen){result.push(chosen);seen.add(chosen[0]);}
 }
 // Numerical transfer families provide genuinely fresh checks after fixed tasks.
 if(result.length<6)for(let s=round+1;s<round+200&&result.length<6;s++)for(const row of rows(id,band,s).slice(0,4))if(result.length<6&&!seen.has(row[0])){result.push(row);seen.add(row[0]);}
 if(result.length<6)throw Error('Duplicate questions in review: curriculum pool exhausted for '+id);
 return result;
}
const guides={number:'Rowan',fractions:'Saff',algebra:'Finn',geometry:'Kit',ratio:'Marin',statistics:'Ada',probability:'Nova',measure:'Flint',town:'Ellis'};
function routes(world){return packs.filter(p=>p.world===world).map(p=>({id:'curr-'+p.id,name:p.name,guide:guides[world],story:p.lesson,artefact:p.name+' field notes',skills:[p.id],contentVersion:8}));}
function task(id,band,seed,stage){
 const p=packs.find(p=>p.id===id),row=rows(id,band,seed)[stage%6],m=row[5],example=rows(id,Math.max(5,band-1),seed+1001)[(stage+1)%4];
 return {...(p.world==='town'?{venue:['home','shops','station','home','home','shops'][stage%6],title:p.name+' · step '+(stage%6+1)}:{}),kind:'curriculum',skill:id,questionId:m.id,contentVersion:8,prompt:row[0],answer:row[1],responseOptions:row[2],activity:m.activity,allowCalculator:m.allowCalculator,teach:p.lesson,example:example[4],examplePrompt:example[0],hint:p.lesson,worked:row[4],band};
}
function install(C,B,ED){
 if(C.skills.some(k=>k.id===packs[0].id))return B;
 for(const p of packs){
  C.skills.push({id:p.id,name:p.name,world:p.world,year:`Proposed Year ${p.year}`,description:p.lesson,lesson:p.lesson,qs:rows(p.id,6,1).slice(0,4),curriculum:{source:ED.source,objective:p.name,status:'implemented',prerequisites:p.prerequisites,contentVersion:8}});
  ED.prerequisites[p.id]=p.prerequisites;
  ED.enhanced.push(p.id);
  C.discovery[p.id]={};
  for(let band=5;band<=9;band++)C.discovery[p.id][band]=rows(p.id,band,band+901,true).slice(0,4).map(q=>[0,q[0],Number(q[1]),q[3],q[4]]);
 }
 const prior=ED.example;ED.example=(id,qs,band,round)=>packs.some(p=>p.id===id)?rows(id,band,round+17).find(q=>!qs.some(x=>x[0]===q[0]||x[1]===q[1]))||null:prior(id,qs,band,round);
 return {...B,supportedSkills:[...B.supportedSkills,...packs.map(p=>p.id)],create:(id,band,round,options)=>packs.some(p=>p.id===id)?create(id,band,round,options):B.create(id,band,round,options)};
}
const api={version:8,packs,rows,create,routes,task,install};
root.V8Curriculum=api;
if(typeof module!=='undefined')module.exports={V8Curriculum:api};
if(root.V3Curriculum&&root.JaxonFreshReview)root.JaxonFreshReview=install(root.V3Curriculum,root.JaxonFreshReview,root.V6Education);
})(typeof window==='undefined'?globalThis:window);
