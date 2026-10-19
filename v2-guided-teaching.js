/* V2 guided teaching: opt-in, low-pressure tap practice. Scores are not assessment evidence. */
(function(root){
'use strict';
const CARDS={
place:[
['round','Rounding to the correct place','Find the place you are rounding to, then inspect the digit immediately to its right. Five or more rounds up.','Round 47 to the nearest 10.',['40','45','50','47'],'50','The ones digit is 7. Round 4 tens up to 5 tens.','place'],
['value|digit|column|times','The value of each digit','A digit is worth something different in each column. Start at ones and move left through tens, hundreds and thousands.','What is the value of 6 in 4,635?',['6','60','600','6000'],'600','The 6 is in the hundreds column, so it means 600.','place']],
operations:[
['subtract|−|minus|difference','Checking subtraction','Line up places. After subtracting, check by adding your answer to the number taken away.','What is 42 − 18?',['22','24','34','60'],'24','42 − 20 = 22, then add back 2: 24.','place'],
['add|plus|sum|total','Breaking addition into parts','Add tens and ones separately, or count up to an easy multiple of ten.','What is 28 + 15?',['33','43','53','45'],'43','28 + 10 = 38; 38 + 5 = 43.','place']],
negative:[
['compare|cold|temperature|smaller|larger','Ordering negative numbers','On a number line, the number further left is smaller, even when it has a larger digit.','Which is colder?',['−2°C','−7°C','0°C','2°C'],'−7°C','−7 is further left than −2.','negative'],
['.*','Crossing zero','Adding moves right on a number line. Subtracting moves left. Count through zero as a position.','Start at −3. Move 5 steps right. Where are you?',['−8','−2','2','8'],'2','From −3 go to −2, −1, 0, 1, 2.','negative']],
multiply:[
['divide|÷|split|share','Division is the inverse of multiplication','Ask which times-table fact makes the total.','36 ÷ 6 = ?',['5','6','7','9'],'6','6 × 6 = 36, so 36 ÷ 6 = 6.','blocks'],
['.*','Break multiplication into easier facts','Split a number into tens and ones, then add the products.','12 × 4 = ?',['16','44','48','52'],'48','10 × 4 = 40 and 2 × 4 = 8, so 48.','blocks']],
priority:[['.*','Which operation comes first?','Work through brackets first, then multiplication/division, and finally addition/subtraction from left to right at each level.','What is 3 + 2 × 4?',['20','11','14','9'],'11','2 × 4 = 8, then 3 + 8 = 11.','steps']],
fractions:[['.*','The denominator tells you the number of equal parts','Divide by the bottom number first, then multiply by the top number.','What is 3/4 of 20?',['5','10','15','18'],'15','20 ÷ 4 = 5 for one quarter; three quarters is 3 × 5 = 15.','fraction']],
fraction_compare:[
['equiv|same|equal','Making equivalent fractions','Multiply or divide the numerator and denominator by the same non-zero number.','Which equals 1/2?',['1/3','2/4','2/3','3/4'],'2/4','1 × 2 / (2 × 2) = 2/4.','fraction'],
['.*','Comparing equal-sized pieces','With the same denominator, the greater numerator gives a larger fraction.','Which is larger?',['2/5','3/5','1/5','1/10'],'3/5','Three fifths contains more equally sized pieces than two fifths.','fraction']],
fraction_operations:[
['subtract|−','Subtracting fractions with the same denominator','Subtract the top numbers. Keep the denominator unchanged when the pieces are the same size.','5/8 − 2/8 = ?',['3/8','3/16','7/8','1/8'],'3/8','5 eighths take away 2 eighths leaves 3 eighths.','fraction'],
['.*','Find equal-sized pieces before adding','Use a common denominator so fractions describe the same size pieces.','1/2 + 1/4 = ?',['2/6','2/4','3/4','1/6'],'3/4','Change 1/2 to 2/4; 2/4 + 1/4 = 3/4.','fraction']],
decimals:[['.*','Percent means out of one hundred','Multiply a decimal by 100 to express it as a percentage.','0.35 is which percentage?',['3.5%','35%','350%','0.35%'],'35%','0.35 × 100 = 35%.','fraction']],
percent_change:[
['discount|off|decrease|reduce','Taking a discount off the original','Find the discount amount first, then subtract it from the starting price.','20% off £50. Sale price?',['£10','£30','£40','£45'],'£40','20% of £50 is £10; £50 − £10 = £40.','money'],
['.*','Increasing by a percentage','Calculate the extra amount, then add it to the original.','Increase £40 by 25%.',['£45','£50','£60','£65'],'£50','25% is one quarter: £10 extra. £40 + £10 = £50.','money']],
algebra_patterns:[['.*','Follow the change between terms','Check what is added, subtracted or multiplied to get from one term to the next.','Find the next number: 4, 7, 10, ...',['11','12','13','14'],'13','Add 3 each time. 10 + 3 = 13.','steps']],
algebra_missing:[
['multip|divide|×|÷','Undo multiplication with division','To keep the equation balanced, divide both sides by the same non-zero number.','If 3x = 21, what is x?',['6','7','8','18'],'7','21 ÷ 3 = 7.','steps'],
['.*','Use the inverse operation','Undo addition with subtraction, and subtraction with addition.','x + 6 = 14. Find x.',['6','7','8','20'],'8','14 − 6 = 8.','steps']],
algebra_expressions:[['.*','Combine like terms','Only terms with the same letter and power can be combined. Add or subtract their coefficients.','What is 2x + 3x?',['5','5x','6x','x5'],'5x','Two x-parts plus three x-parts makes five x-parts.','blocks']],
geometry_angles:[['.*','Know your anchor angles','A right angle is 90°, a straight line is 180°, and a full turn is 360°.','A straight line has one angle of 120°. What is the other?',['40°','50°','60°','70°'],'60°','180° − 120° = 60°.','angle']],
geometry_triangles:[['.*','Triangles always total 180°','Add the known angles, then subtract from 180°.','A triangle has angles 50° and 60°. Third angle?',['60°','70°','80°','90°'],'70°','180° − 50° − 60° = 70°.','angle']],
geometry_area:[
['perimeter|around','Perimeter goes around the outside','Add all side lengths. For rectangles, add length and width and double it.','Rectangle 5 cm by 3 cm. Perimeter?',['8 cm','15 cm','16 cm','30 cm'],'16 cm','5 + 3 + 5 + 3 = 16 cm.','grid'],
['.*','Area measures the space inside','Rectangle area is length multiplied by width, measured in square units.','Rectangle 5 cm by 3 cm. Area?',['8 cm²','15 cm²','16 cm²','30 cm²'],'15 cm²','Five rows of three squares gives 15 squares.','grid']],
ratio_basics:[['.*','Simplify both sides together','Divide both quantities by the same common factor.','Simplify 4:6.',['1:3','2:3','3:2','4:3'],'2:3','Divide both sides by 2.','ratio']],
ratio_sharing:[['.*','Count the ratio shares first','Add the ratio parts to get total shares. Divide the amount by that total.','Share 20 in ratio 1:3. Smaller share?',['4','5','10','15'],'5','Four shares altogether. Each is 20 ÷ 4 = 5.','ratio']],
ratio_proportion:[['.*','Scale everything by the same factor','If you multiply the number of people, multiply the ingredient amounts by the same number.','2 people need 100g rice. For 6 people?',['150g','200g','300g','600g'],'300g','Six is three times two. 100 × 3 = 300g.','ratio']],
stats_averages:[
['median|middle','The median is the middle value','Put values in ascending order. If two values are in the middle, find their mean.','Median of 2, 5, 8?',['2','5','6','8'],'5','The numbers are already ordered. 5 is in the middle.','bars'],
['range|difference','Range measures spread','Subtract the smallest value from the largest.','Range of 3, 7, 10?',['3','4','7','10'],'7','10 − 3 = 7.','bars'],
['.*','Mean is a fair-share average','Add the values and divide by how many values there are.','Mean of 2, 4, 6?',['3','4','5','6'],'4','2 + 4 + 6 = 12; 12 ÷ 3 = 4.','bars']],
stats_tables:[['.*','Read the scale before comparing data','A bar or tally value may represent more than one item. Check the unit.','Each chart square represents 5 votes. What do 3 squares mean?',['3','8','15','30'],'15','3 × 5 votes = 15.','bars']],
stats_probability_data:[['.*','Part compared with the whole','Find the fraction of the total before converting to a percentage.','5 of 20 students cycle. What percentage?',['5%','20%','25%','50%'],'25%','5/20 = 1/4 = 25%.','bars']],
prob_chance:[['.*','Probability lies between 0 and 1','For equally likely events, divide favourable outcomes by total outcomes.','Chance of heads on a fair coin?',['0','1/4','1/2','1'],'1/2','There is one head outcome out of two possibilities.','ratio']],
prob_events:[['.*','Count favourable outcomes and total outcomes','A probability fraction is favourable outcomes divided by all equally likely outcomes.','Bag: 2 red and 3 blue. Chance of red?',['1/5','2/5','3/5','1/2'],'2/5','Two red counters out of five.','ratio']],
prob_compare:[['.*','Compare chances using the same scale','Convert to percentages or equivalent fractions before deciding which chance is larger.','Which chance is most likely?',['20%','1/4','0.6','1/2'],'0.6','The four chances are 20%, 25%, 60% and 50%.','ratio']],
measure_units:[['.*','Use the unit conversion relationship','Metric units change by factors of 10, 100 or 1000. Write the relationship before calculating.','How many centimetres in 3 metres?',['30','300','3000','3'],'300','1 metre is 100 cm, so 3 × 100 = 300 cm.','ruler']],
measure_volume:[['.*','Volume fills three dimensions','Multiply length × width × height for a cuboid.','Cuboid 2 cm × 3 cm × 4 cm. Volume?',['9 cm³','12 cm³','24 cm³','48 cm³'],'24 cm³','2 × 3 × 4 = 24 cubic centimetres.','grid']],
measure_speed:[['.*','Remember the distance triangle','Speed = distance ÷ time; distance = speed × time.','60 km in 2 hours. Speed?',['20 km/h','30 km/h','60 km/h','120 km/h'],'30 km/h','60 ÷ 2 = 30 km/h.','steps']],
factors:[['.*','A factor divides exactly','Try small divisors. A factor leaves no remainder.','Which is a factor of 18?',['4','5','6','7'],'6','18 ÷ 6 = 3 exactly.','blocks']],
powers:[['.*','Squaring multiplies a number by itself','Remember 4² is 4 × 4, not 4 × 2.','5 squared equals?',['10','15','25','125'],'25','5 × 5 = 25.','blocks']],
fraction_mixed:[['.*','Make whole groups of denominator parts','An improper fraction can be split into whole groups plus leftover parts.','7/3 equals which mixed number?',['1 1/3','2 1/3','2 2/3','3 1/3'],'2 1/3','Six thirds make 2 wholes, with 1 third left.','fraction']],
fraction_mult:[['.*','Multiply fractions or use the reciprocal when dividing','For multiplication multiply tops and bottoms. For division turn the second fraction upside down and multiply.','1/2 × 1/3 equals?',['1/5','1/6','2/3','1/3'],'1/6','1 × 1 over 2 × 3 gives 1/6.','fraction']],
algebra_brackets:[['.*','Multiply everything inside the bracket','The number outside must multiply each term inside.','Expand 2(x + 3).',['2x + 3','x + 6','2x + 6','2x + 5'],'2x + 6','2 × x + 2 × 3 = 2x + 6.','steps']],
algebra_coordinates:[['.*','Across first, then up or down','A coordinate (x, y) gives horizontal position first and vertical position second.','Point (3, 2): what is x?',['2','3','5','6'],'3','x is the first number in the pair.','grid']],
geometry_transforms:[['.*','Know which way the shape moves','Translation slides, reflection flips and rotation turns.','Which transformation is a slide?',['Reflection','Rotation','Translation','Enlargement'],'Translation','A translation moves every point by the same distance and direction.','grid']],
geometry_circle:[['.*','Diameter is twice radius','Circumference is distance around a circle. Use diameter × π.','Circle radius 4 cm. Diameter?',['2 cm','4 cm','8 cm','16 cm'],'8 cm','Double the radius: 4 × 2 = 8 cm.','angle']],
ratio_rates:[['.*','Divide to find the unit rate','Convert pack costs to one item or one litre before comparing.','4 bottles cost £8. Cost per bottle?',['£1','£2','£3','£4'],'£2','£8 ÷ 4 bottles = £2 each.','money']],
stats_pie:[['.*','A complete circle is 360 degrees','A quarter of the data is 90°, a half is 180°.','How many degrees is a quarter of a pie chart?',['45°','90°','180°','270°'],'90°','360 ÷ 4 = 90°.','bars']],
measure_time:[['.*','Count forward in manageable steps','Count to the next full hour, then on to the finish time.','09:35 to 10:20 lasts how long?',['35 min','40 min','45 min','55 min'],'45 min','25 minutes to 10:00, then 20 more = 45 minutes.','clock']]
};
const FOUNDATIONS=Object.freeze({
powers:'multiply',factors:'multiply',fraction_compare:'fractions',fraction_operations:'fraction_compare',
fraction_mixed:'fractions',fraction_mult:'fractions',percent_change:'decimals',decimals:'fractions',
algebra_missing:'operations',algebra_expressions:'algebra_missing',algebra_brackets:'algebra_expressions',
algebra_coordinates:'negative',geometry_area:'multiply',geometry_circle:'geometry_area',
geometry_transforms:'algebra_coordinates',ratio_sharing:'ratio_basics',ratio_proportion:'ratio_basics',
ratio_rates:'ratio_proportion',stats_averages:'operations',stats_pie:'decimals',
stats_probability_data:'decimals',prob_events:'prob_chance',prob_compare:'prob_events',
measure_volume:'multiply',measure_speed:'multiply',measure_time:'operations'
});
function foundationFor(skillId){return FOUNDATIONS[skillId]||null}
function plan(skillId,misses){
 const candidates=CARDS[skillId];if(!candidates)return null;
 const qs=(Array.isArray(misses)?misses:[]).map(m=>String(m&&((m.q||m.question)||'')||''));
 let chosen=candidates[0];
 outer:for(const question of qs.slice(-8).reverse()){for(const card of candidates){if(new RegExp(card[0],'i').test(question)){chosen=card;break outer}}}
 return {skillId:skillId,title:chosen[1],explain:chosen[2],question:chosen[3],choices:[...chosen[4]],answer:chosen[5],worked:chosen[6],visual:chosen[7],sourceQuestion:qs[qs.length-1]||null};
}
function validate(){
 const ids=Object.keys(CARDS),issues=[];
 for(const id of ids){for(const item of CARDS[id]){
  if(item.length!==8)issues.push(id+': bad structure');
  if(!item[4].includes(item[5])||new Set(item[4]).size!==4)issues.push(id+': invalid choices');
  if(!item[1]||!item[2]||!item[3]||!item[6])issues.push(id+': incomplete text');
  try{new RegExp(item[0],'i')}catch(e){issues.push(id+': invalid rule')}
 }}
 return {skillCount:ids.length,issues};
}
root.JaxonTutor=Object.freeze({plan:plan,foundationFor:foundationFor,validate:validate,supportedSkills:Object.freeze(Object.keys(CARDS))});
})(window);
