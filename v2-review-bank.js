/* Jaxon's Maths Adventure V2: fresh, tap-first practice-check questions.
   Pure client-side question generation. Not a security boundary. */
(function(root){
'use strict';
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a||1}
function fraction(a,b){if(!b)throw Error('Zero denominator');const g=gcd(a,b);a/=g;b/=g;return b===1?String(a):a+'/'+b}
function fmt(value){return Number(value.toFixed(4)).toString()}
function N(prompt,answer,hint,worked,allowNegative){
 if(!Number.isFinite(answer))throw Error('Invalid numeric answer: '+prompt);
 const integer=Number.isInteger(answer),abs=Math.abs(answer);
 const step=integer?(abs>=1000?100:abs>=100?10:abs>=30?5:1):(abs>=10?.5:abs>=1?.25:.05);
 const choices=[answer];
 for(const d of [1,-1,2,-2,3,-3,4,-4,5,-5,6,-6]){
  const v=Number((answer+d*step).toFixed(4));
  if(!allowNegative&&v<0)continue;
  if(!choices.includes(v))choices.push(v);
  if(choices.length>=4)break;
 }
 return {prompt,answer:fmt(answer),choices:choices.map(fmt),hint,worked};
}
function C(prompt,answer,others,hint,worked){
 return {prompt,answer:String(answer),choices:[String(answer),...others.map(String)],hint,worked};
}
function F(prompt,a,b,hint,worked){
 const answer=fraction(a,b),choices=[answer];
 for(const [x,y] of [[a+1,b],[a+2,b],[a,b+1],[a+1,b+1],[a+3,b],[a,b+2]]){
  const v=fraction(x,y);if(!choices.includes(v))choices.push(v);if(choices.length===4)break;
 }
 return {prompt,answer,choices,hint,worked};
}
function pad(x){return String(x).padStart(2,'0')}
function time(m){m=(m+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)}
const generators={
place:[
 n=>{const x=2460+37*n;return N('Round '+x+' to the nearest 10.',Math.round(x/10)*10,'Look at the ones digit.','The ones digit decides whether the tens round up.')},
 n=>{const x=4300+73*n;return N('Round '+x+' to the nearest 100.',Math.round(x/100)*100,'Look at the tens digit.','The tens digit decides whether the hundreds round up.')},
 n=>{const d=n%8+1;return N('What is the value of the hundreds digit in '+(5000+d*100+42)+'?',100*d,'The hundreds digit is '+d+'.',d+' hundreds equals '+100*d+'.')}
],
operations:[
 n=>{const a=235+13*n,b=170+7*n;return N('Find '+a+' + '+b+'.',a+b,'Add hundreds, tens and ones.',a+' + '+b+' = '+(a+b)+'.')},
 n=>{const a=750+17*n,b=235+3*n;return N('Find '+a+' − '+b+'.',a-b,'Subtract by place value.',a+' − '+b+' = '+(a-b)+'.')},
 n=>{const a=120+12*n,b=55+9*n;return N('A shop receives '+a+' boxes and another '+b+'. How many boxes?',a+b,'Add the two deliveries.',a+' + '+b+' = '+(a+b)+'.')}
],
negative:[
 n=>{const a=n+2,b=n+7;return N('Start at −'+a+' and add '+b+'. Where do you land?',b-a,'Move right for adding.',(-a)+' + '+b+' = '+(b-a)+'.',true)},
 n=>{const a=n+3,b=n+8;return N('Calculate '+a+' − '+b+'.',a-b,'Subtracting moves left.',a+' − '+b+' = '+(a-b)+'.',true)},
 n=>{const a=n+6,b=n+1;return N('It is −'+a+'°C and warms by '+b+'°C. New temperature?',b-a,'Move right on the number line.',(-a)+' + '+b+' = '+(b-a)+'°C.',true)}
],
multiply:[
 n=>{const a=n+9,b=3+n%5;return N('Calculate '+a+' × '+b+'.',a*b,'Break the multiplication into tens and ones.',a+' × '+b+' = '+(a*b)+'.')},
 n=>{const a=n+6,b=4+n%5;return N('Calculate '+(a*b)+' ÷ '+b+'.',a,'Use the inverse times-table fact.',b+' × '+a+' = '+(a*b)+'.')},
 n=>{const a=n+4,b=7+n%4;return N('Each of '+a+' packs has '+b+' cards. Total cards?',a*b,'Multiply packs by cards per pack.',a+' × '+b+' = '+(a*b)+'.')}
],
priority:[
 n=>{const a=n+2,b=4,c=n%5+3;return N('Work out '+a+' + '+b+' × '+c+'.',a+b*c,'Multiply before adding.',b+' × '+c+' = '+b*c+'; add '+a+' to get '+(a+b*c)+'.')},
 n=>{const a=n%7+2,b=n+3,c=3;return N('Work out ('+a+' + '+b+') × '+c+'.',(a+b)*c,'Do the brackets first.','('+a+' + '+b+') × '+c+' = '+((a+b)*c)+'.')},
 n=>{const a=60+n*3,b=4,c=2;return N('Work out '+a+' − '+b+' × '+c+'.',a-b*c,'Multiply before subtracting.',a+' − 8 = '+(a-8)+'.')}
],
fractions:[
 n=>{const d=n%5+2,whole=d*(n+5);return N('What is one '+d+'th of '+whole+'?',whole/d,'Divide the amount by '+d+'.',whole+' ÷ '+d+' = '+(whole/d)+'.')},
 n=>{const d=n%4+3,whole=d*(n+4);return N('What is 2/'+d+' of '+whole+'?',2*whole/d,'Find one part and double.',whole+' ÷ '+d+' × 2 = '+(2*whole/d)+'.')},
 n=>{const d=n%5+4,whole=d*(n+3);return N('What is 3/'+d+' of '+whole+'?',3*whole/d,'Divide by the denominator, then multiply by 3.',whole+' ÷ '+d+' × 3 = '+(3*whole/d)+'.')}
],
fraction_compare:[
 n=>{const d=n%8+4;return C('Which is the largest unit fraction when denominators start at '+d+'?', '1/'+d,['1/'+(d+1),'1/'+(d+2),'1/'+(d+3)],'With a numerator of one, a smaller denominator means a larger piece.','1/'+d+' is the largest of these unit fractions.')},
 n=>{const d=n%7+6,a=2+n%3;return C('Which fraction has the greatest numerator when the denominator is '+d+'?',(a+2)+'/'+d,[a+'/'+d,(a+1)+'/'+d,(a-1)+'/'+d],'Compare the numerators.','With equal denominators, '+(a+2)+' parts is the most.')},
 n=>{const a=n%4+2,b=a+3,k=n%3+2;return C('Choose a fraction equal in value to '+a+'/'+b+'.',(a*k)+'/'+(b*k),[(a*k)+'/'+b,a+'/'+(b*k),(a+k)+'/'+(b+k)],'Multiply top and bottom by the same number.',a+'/'+b+' = '+(a*k)+'/'+(b*k)+'.')}
],
fraction_operations:[
 n=>{const d=n%7+6;return F('Add 1/'+d+' + 2/'+d+'.',3,d,'Add numerators when denominators match.','The answer is 3/'+d+'.')},
 n=>{const d=n%7+8;return F('Subtract 5/'+d+' − 2/'+d+'.',3,d,'Keep the common denominator.','Five parts minus two parts is three parts.')},
 n=>{const d=n%5+3;return F('Add 1/2 + 1/'+(2*d)+'.',d+1,2*d,'Change the half into '+d+'/'+(2*d)+'.','The answer is '+fraction(d+1,2*d)+'.')}
],
decimals:[
 n=>{const p=n%17+1;return N('Write '+fmt(p/20)+' as a percentage (number only).',p*5,'Multiply a decimal by 100.',fmt(p/20)+' × 100 = '+(p*5)+'%.')},
 n=>{const p=n%16+1;return N('Find '+(p*5)+'% of 200.',p*10,'Convert the percentage to a fraction of 100.',(p*5)+'% of 200 = '+(p*10)+'.')},
 n=>{const p=n%9+1;return N('Write '+fmt(p/8)+' as a percentage (number only).',p*12.5,'Multiply by 100.',fmt(p/8)+' × 100 = '+(p*12.5)+'%.')}
],
percent_change:[
 n=>{const price=60+10*n;return N('A £'+price+' item has 10% off. Sale price in pounds?',price*.9,'Find 10% and subtract it.','10% is £'+price/10+', leaving £'+(price*.9)+'.')},
 n=>{const price=40+4*n;return N('Increase £'+price+' by 25%. New price in pounds?',price*1.25,'25% is one quarter.',price+' + '+(price/4)+' = '+price*1.25+'.')},
 n=>{const price=50+5*n;return N('A £'+price+' item has 20% off. How much is the discount in pounds?',price/5,'Divide the price by five.','20% of '+price+' is '+price/5+'.')}
],
algebra_patterns:[
 n=>{const a=n+2,d=n%6+3;return N('Sequence '+a+', '+(a+d)+', '+(a+2*d)+', ... Next number?',a+3*d,'Find the difference between terms.','Add '+d+' each time; next is '+(a+3*d)+'.')},
 n=>{const a=n*8+35,d=n%5+4;return N('Sequence '+a+', '+(a-d)+', '+(a-2*d)+', ... Next number?',a-3*d,'This is a decreasing sequence.','Subtract '+d+' again to get '+(a-3*d)+'.',true)},
 n=>{const a=n+1,d=n%8+2;return N('Start at '+a+' and add '+d+' three times. Result?',a+3*d,'Count three equal jumps.',a+' + '+(3*d)+' = '+(a+3*d)+'.')}
],
algebra_missing:[
 n=>{const x=n+5,a=7+n%6;return N('Find x: x + '+a+' = '+(x+a)+'.',x,'Subtract '+a+' from both sides.',(x+a)+' − '+a+' = '+x+'.')},
 n=>{const x=n+3,a=2+n%4;return N('Find x: '+a+'x = '+a*x+'.',x,'Divide both sides by '+a+'.',a*x+' ÷ '+a+' = '+x+'.')},
 n=>{const x=n+8,a=5+n%5;return N('Find x: x − '+a+' = '+(x-a)+'.',x,'Add '+a+' to both sides.',(x-a)+' + '+a+' = '+x+'.')}
],
algebra_expressions:[
 n=>{const a=n%7+2,b=n%5+3;return N('What is the coefficient of x in '+a+'x + '+b+'x?',a+b,'Add the numbers before x.',a+'x + '+b+'x = '+(a+b)+'x.')},
 n=>{const a=n%6+4,b=n%3+1;return N('What is the coefficient of y in '+a+'y − '+b+'y?',a-b,'Subtract the coefficients.',a+' − '+b+' = '+(a-b)+'.')},
 n=>{const x=n%6+3;return N('If a = '+x+', find 4a + 3.',4*x+3,'Substitute '+x+' for a.','4 × '+x+' + 3 = '+(4*x+3)+'.')}
],
geometry_angles:[
 n=>{const a=35+n%70;return N('Two angles on a straight line: '+a+'° and x°. Find x.',180-a,'Angles on a straight line add to 180°.','180 − '+a+' = '+(180-a)+'°.')},
 n=>{const a=30+n%40,b=45+n%25;return N('Triangle angles '+a+'°, '+b+'°, x°. Find x.',180-a-b,'A triangle totals 180°.','180 − '+a+' − '+b+' = '+(180-a-b)+'°.')},
 n=>{const a=80+n%60,b=110+n%40;return N('Angles around a point: '+a+'°, '+b+'°, x°. Find x.',360-a-b,'A full turn is 360°.','360 − '+a+' − '+b+' = '+(360-a-b)+'°.')}
],
geometry_triangles:[
 n=>{const a=35+n%45,b=55+n%35;return N('In a triangle, two angles are '+a+'° and '+b+'°. Third angle?',180-a-b,'All three total 180°.','180 − '+a+' − '+b+' = '+(180-a-b)+'°.')},
 n=>{const a=75+n%25,b=80+n%20,d=65+n%15;return N('A quadrilateral has angles '+a+'°, '+b+'°, '+d+'°, and x°. Find x.',360-a-b-d,'Quadrilateral angles total 360°.','360 − ('+a+' + '+b+' + '+d+') = '+(360-a-b-d)+'°.')},
 n=>{const sides=n%5+5;return N('How many sides has a regular polygon with '+sides+' equal corners?',sides,'A polygon has the same number of sides and corners.',sides+' corners means '+sides+' sides.')}
],
geometry_area:[
 n=>{const a=n+5,b=n%8+4;return N('Rectangle '+a+' cm by '+b+' cm. Area in cm²?',a*b,'Multiply length by width.',a+' × '+b+' = '+a*b+' cm².')},
 n=>{const a=n+6,b=n%9+5;return N('Rectangle '+a+' cm by '+b+' cm. Perimeter in cm?',2*(a+b),'Add all four sides.','2 × ('+a+' + '+b+') = '+2*(a+b)+' cm.')},
 n=>{const base=2*(n%8+5),height=n%8+4;return N('Triangle base '+base+' cm, height '+height+' cm. Area in cm²?',base*height/2,'Halve base × height.','('+base+' × '+height+') ÷ 2 = '+base*height/2+' cm².')}
],
ratio_basics:[
 n=>{const k=n%8+2;return N('Simplify '+(3*k)+':'+(5*k)+'. First number of the simplest ratio?',3,'Divide both by '+k+'.','The ratio simplifies to 3:5.')},
 n=>{const k=n%7+3;return N('Simplify '+(2*k)+':'+(7*k)+'. Second number of simplest ratio?',7,'Divide both parts by '+k+'.','The ratio simplifies to 2:7.')},
 n=>{const k=n%5+2;return N('Which number multiplies 4:5 to get '+4*k+':'+5*k+'?',k,'Divide corresponding parts.',(4*k)+' ÷ 4 = '+k+'.')}
],
ratio_sharing:[
 n=>{const k=n%8+3,total=5*k;return N('Share £'+total+' in ratio 2:3. What is smaller share in pounds?',2*k,'There are 5 shares.','£'+total+' ÷ 5 × 2 = £'+2*k+'.')},
 n=>{const k=n%7+4,total=7*k;return N('Split '+total+' stickers in ratio 2:5. Larger share?',5*k,'Add ratio parts first.','Seven shares of '+k+'; the larger group has '+5*k+'.')},
 n=>{const k=n%6+5,total=4*k;return N('Share '+total+' points in ratio 1:3. Smaller share?',k,'There are four shares.','Each share is '+k+'.')}
],
ratio_proportion:[
 n=>{const k=n%7+3;return N('A recipe for 2 uses '+(3*k)+' g flour. How many grams for 6?',9*k,'Multiply by 3.','3 × '+(3*k)+' = '+9*k+' g.')},
 n=>{const k=n%9+4;return N('Five tickets cost £'+(5*k)+'. Cost of 8 tickets in pounds?',8*k,'Find one ticket first.','Each ticket is £'+k+'; eight cost £'+8*k+'.')},
 n=>{const k=n%5+3;return N('3 identical packs hold '+(3*k)+' cards. How many in 7 packs?',7*k,'Find cards per pack.','There are '+k+' in a pack, giving '+7*k+'.')}
],
stats_averages:[
 n=>{const a=n+2;return N('Mean of '+a+', '+(a+4)+', '+(a+8)+'?',a+4,'Add three values and divide by 3.','The middle value '+(a+4)+' is the mean of these equally spaced values.')},
 n=>{const a=n+3;return N('Range of '+(a-2)+', '+(a+3)+', '+(a+11)+'?',13,'Subtract minimum from maximum.',(a+11)+' − '+(a-2)+' = 13.')},
 n=>{const a=n+2;return N('Median of '+a+', '+(a+2)+', '+(a+8)+', '+(a+12)+'?',a+5,'Average the middle two values.','('+(a+2)+' + '+(a+8)+') ÷ 2 = '+(a+5)+'.')}
],
stats_tables:[
 n=>{const a=n+5,b=n+8,c=n+2;return N('A survey gets '+a+' red, '+b+' blue, '+c+' green votes. Total votes?',a+b+c,'Add the three frequencies.',a+' + '+b+' + '+c+' = '+(a+b+c)+'.')},
 n=>{const a=n+15,b=n+4;return N('One bar shows '+a+' votes and another '+b+'. Difference?',a-b,'Subtract the smaller frequency.',a+' − '+b+' = '+(a-b)+'.')},
 n=>{const size=n%5+3,units=n%6+4;return N('A bar chart uses '+size+' votes per square. '+units+' squares show how many votes?',size*units,'Multiply scale by squares.',size+' × '+units+' = '+size*units+'.')}
],
stats_probability_data:[
 n=>{const a=n%9+3;return N(a+' of '+(4*a)+' pupils walk to school. What percentage?',25,'Divide the part by the whole, then × 100.','One quarter is 25%.')},
 n=>{const a=50+4*n,b=10+n%5;return N('Sales grow from '+a+' to '+(a+b)+'. What is the numerical increase?',b,'Subtract the old value from the new.','('+(a+b)+') − '+a+' = '+b+'.')},
 n=>{const a=n%8+5,b=n%6+4;return N('Sales on Monday '+a+', Tuesday '+b+', Wednesday '+(a+2)+'. Total?',2*a+b+2,'Add each day.','Total '+(2*a+b+2)+'.')}
],
prob_chance:[
 n=>{const d=n%9+4;return F('One green section on a fair '+d+'-section spinner. Probability of green?',1,d,'Favourable outcomes over total outcomes.','One of '+d+' equal sections is green.')},
 n=>{const d=n%7+5;return F('In a bag of '+d+' equal-sized tokens, two are blue. Chance of blue?',2,d,'Count favourable and total tokens.','2/'+d+' are blue.')},
 n=>{const d=n%8+4;return F('A fair spinner has '+d+' sections, three marked star. Chance of a star?',3,d,'Three favourable sections.','Probability '+fraction(3,d)+'.')}
],
prob_events:[
 n=>{const red=n%6+2,blue=n%8+4;return F('A bag has '+red+' red and '+blue+' blue counters. Chance of red?',red,red+blue,'Red counters divided by all counters.','Chance '+fraction(red,red+blue)+'.')},
 n=>{const a=n%7+4,b=n%6+2;return F('Box contains '+a+' green and '+b+' yellow counters. Chance of yellow?',b,a+b,'Yellow outcomes over the total.','Chance '+fraction(b,a+b)+'.')},
 n=>{const a=n%4+3,b=n%6+5;return F('There are '+a+' winning and '+b+' losing tickets. Chance to win?',a,a+b,'Winners over all tickets.','Chance '+fraction(a,a+b)+'.')}
],
prob_compare:[
 n=>{const t=(n%8+2)*10;return N('A fair coin is flipped '+t+' times. Expected number of heads?',t/2,'Half the flips are expected to be heads.','Expected '+t+' ÷ 2 = '+t/2+'.')},
 n=>{const p=(n%7+2)*10,t=100;return N('Chance of success is '+p+'%. In 100 trials, expected successes?',p,'Find '+p+'% of 100.','Expected '+p+' successes.')},
 n=>{const red=n%8+3,blue=n%6+1;return F('Bag has '+red+' red and '+blue+' blue. Chance of red?',red,red+blue,'Red over total counters.','Chance '+fraction(red,red+blue)+'.')}
],
measure_units:[
 n=>{const m=n+2;return N(m+' metres equals how many centimetres?',m*100,'1 metre = 100 centimetres.',m+' × 100 = '+m*100+'.')},
 n=>{const kg=n+3;return N(kg+' kilograms equals how many grams?',kg*1000,'1 kilogram = 1000 grams.',kg+' × 1000 = '+kg*1000+'.')},
 n=>{const hours=n%5+2;return N('How many minutes are in '+hours+' hours?',hours*60,'One hour is 60 minutes.',hours+' × 60 = '+hours*60+'.')}
],
measure_volume:[
 n=>{const a=n%8+3,b=n%7+4,h=n%5+2;return N('Cuboid '+a+' cm × '+b+' cm × '+h+' cm. Volume in cm³?',a*b*h,'Multiply three dimensions.',a+' × '+b+' × '+h+' = '+a*b*h+'.')},
 n=>{const side=n%8+2;return N('A cube has side '+side+' cm. Volume in cm³?',side**3,'Cube the side length.',side+' × '+side+' × '+side+' = '+side**3+'.')},
 n=>{const litres=n%7+2;return N(litres+' litres equal how many millilitres?',litres*1000,'A litre holds 1000 millilitres.',litres+' × 1000 = '+litres*1000+'.')}
],
measure_speed:[
 n=>{const speed=10*(n%9+3),hours=n%4+2;return N('Travel '+speed*hours+' km in '+hours+' hours. Speed in km/h?',speed,'Divide distance by time.',(speed*hours)+' ÷ '+hours+' = '+speed+'.')},
 n=>{const speed=10*(n%7+3),hours=n%4+2;return N('A cyclist keeps a speed of '+speed+' km/h for '+hours+' hours. How far do they travel in kilometres?',speed*hours,'Multiply speed by time.',speed+' × '+hours+' = '+speed*hours+'.')},
 n=>{const speed=10*(n%8+4),hours=n%4+2;return N('Travel '+speed*hours+' km at '+speed+' km/h. Time in hours?',hours,'Divide distance by speed.',speed*hours+' ÷ '+speed+' = '+hours+'.')}
],
factors:[
 n=>{const m=n%6+3;return N('What is the greatest common factor of '+(6*m)+' and '+(9*m)+'?',3*m,'Find the largest shared factor.','The HCF is '+3*m+'.')},
 n=>{const m=n%5+2;return N('What is the lowest common multiple of '+(4*m)+' and '+(6*m)+'?',12*m,'Find the smallest common multiple.','The LCM is '+12*m+'.')},
 n=>{const m=n%7+3;return N('What is the smallest positive factor greater than 1 of '+(m*2)+'?',2,'An even number is divisible by 2.','The smallest prime factor is 2.')}
],
powers:[
 n=>{const a=n%10+4;return N('Calculate the square of '+a+'.',a*a,'Multiply by itself.',a+' × '+a+' = '+a*a+'.')},
 n=>{const a=n%6+2;return N('Calculate the cube of '+a+'.',a**3,'Multiply the number three times.',a+' × '+a+' × '+a+' = '+a**3+'.')},
 n=>{const a=n%11+5;return N('Find the positive number that squares to '+a*a+'.',a,'Find the number that squares to it.',a+' × '+a+' = '+a*a+'.')}
],
fraction_mixed:[
 n=>{const d=n%6+3,whole=n%4+2,rem=1;return N('Convert '+(whole*d+rem)+'/'+d+' to a mixed number. How many wholes?',whole,'Divide numerator by denominator.',(whole*d+rem)+' ÷ '+d+' gives '+whole+' wholes and 1/'+d+'.')},
 n=>{const d=n%6+3,whole=n%4+2,rem=2;return N('Convert '+whole+' and '+rem+'/'+d+' to an improper fraction. Numerator?',whole*d+rem,'Multiply wholes by denominator and add numerator.',whole+' × '+d+' + '+rem+' = '+(whole*d+rem)+'.')},
 n=>{const d=n%5+4,whole=n%5+2;return N('How many '+d+'ths are in '+whole+' whole units?',whole*d,'Every whole has '+d+' parts.',whole+' × '+d+' = '+whole*d+'.')}
],
fraction_mult:[
 n=>{const d=n%8+4;return F('Multiply 1/2 by 1/'+d+'.',1,2*d,'Multiply numerators and denominators.','Answer '+fraction(1,2*d)+'.')},
 n=>{const a=n%5+2,d=n%7+5;return F('Multiply '+a+'/'+d+' by 1/3.',a,3*d,'Multiply top by top and bottom by bottom.','Answer '+fraction(a,3*d)+'.')},
 n=>{const d=n%8+4;return F('Divide 1/2 by 1/'+d+'.',d,2,'Flip the divisor and multiply.','1/2 × '+d+' = '+fraction(d,2)+'.')}
],
algebra_brackets:[
 n=>{const a=n%6+3,b=n%5+2;return N('Expand '+a+'(x + '+b+'). What is the constant term?',a*b,'Multiply '+a+' by every term.',a+' × '+b+' = '+a*b+'.')},
 n=>{const a=n%5+2,b=n%7+3;return N('Expand '+a+'('+b+'y + 1). Coefficient of y?',a*b,'Multiply the two coefficients.',a+' × '+b+' = '+a*b+'.')},
 n=>{const a=n%8+3,b=n%6+2;return N('Expand '+a+'(z − '+b+'). What is the constant term?',-a*b,'Multiply both bracket terms.',a+' × (−'+b+') = −'+a*b+'.',true)}
],
algebra_coordinates:[
 n=>{const x=n%8+2,y=n%7+3;return N('Point ('+x+', '+y+'). Move 5 right. New x-coordinate?',x+5,'Moving right increases x.',x+' + 5 = '+(x+5)+'.')},
 n=>{const x=n%8+2,y=n%6+4;return N('Reflect ('+x+', '+y+') in the y-axis. New x-coordinate?',-x,'Reflection in the y-axis changes the sign of x.','New x-coordinate −'+x+'.',true)},
 n=>{const x=n%6+4,y=n%7+3;return N('Point ('+x+', '+y+'). Move 3 down. New y-coordinate?',y-3,'Moving down decreases y.',y+' − 3 = '+(y-3)+'.',true)}
],
geometry_transforms:[
 n=>{const x=n%7+3;return N('Reflect point ('+x+', 2) in the y-axis. New x-coordinate?',-x,'Change sign of x.',x+' becomes −'+x+'.',true)},
 n=>{const turns=n%3+1;return N('Rotate clockwise by '+turns+' quarter turns. Degrees turned?',90*turns,'One quarter turn equals 90°.','90 × '+turns+' = '+90*turns+'°.')},
 n=>{const x=n%8+2;return N('Translate ('+x+', 4) four steps left. New x-coordinate?',x-4,'Moving left subtracts 4 from x.',x+' − 4 = '+(x-4)+'.',true)}
],
geometry_circle:[
 n=>{const radius=n%10+3;return N('A circle radius is '+radius+' cm. Diameter in cm?',2*radius,'Diameter is twice the radius.',radius+' × 2 = '+(2*radius)+'.')},
 n=>{const radius=n%9+4;return N('Circle diameter '+2*radius+' cm. Radius in cm?',radius,'Halve the diameter.',2*radius+' ÷ 2 = '+radius+'.')},
 n=>{const diameter=2*(n%8+3);return N('Circle diameter '+diameter+' cm. Using π = 3.14, circumference in cm?',Number((diameter*3.14).toFixed(2)),'Circumference is π × diameter.',diameter+' × 3.14 = '+(diameter*3.14).toFixed(2)+' cm.')}
],
ratio_rates:[
 n=>{const count=n%6+3,cost=n%8+4;return N(count+' pencils cost £'+count*cost+'. Price per pencil in pounds?',cost,'Divide total price by count.',count*cost+' ÷ '+count+' = £'+cost+'.')},
 n=>{const litres=n%5+2,unit=n%6+3;return N(litres+' litres of juice cost £'+litres*unit+'. Cost per litre in pounds?',unit,'Divide price by litres.',litres*unit+' ÷ '+litres+' = £'+unit+'.')},
 n=>{const count=n%7+4,unit=n%4+2;return N('A pack of '+count+' batteries costs £'+count*unit+'. What is cost per battery in pounds?',unit,'Divide total by number of batteries.',count*unit+' ÷ '+count+' = £'+unit+'.')}
],
stats_pie:[
 n=>{const percent=10*(n%7+1);return N('A pie chart sector represents '+percent+'% of data. Angle in degrees?',3.6*percent,'Multiply percentage by 3.6.',percent+' × 3.6 = '+3.6*percent+'°.')},
 n=>{const angle=36*(n%8+1);return N('A pie chart sector has angle '+angle+'°. What percentage of the whole?',angle/3.6,'360 degrees is 100%.',angle+' ÷ 3.6 = '+angle/3.6+'%.')},
 n=>{const percent=5*(n%8+2);return N('A pie chart shows '+percent+'% of 200 responses. How many responses?',2*percent,'One percent is two responses.',percent+' × 2 = '+2*percent+'.')}
],
measure_time:[
 n=>{const depart=8*60+15+(n%6)*5,journey=20+(n%5)*10;return C('A bus leaves at '+time(depart)+'; trip takes '+journey+' minutes. Arrival?',time(depart+journey),[time(depart+journey+5),time(depart+journey-10),time(depart+journey+15)],'Add minutes, carrying over the hour if needed.','Arrival '+time(depart+journey)+'.')},
 n=>{const start=9*60+10+(n%6)*5,elapsed=35+(n%6)*5;return N('How many minutes from '+time(start)+' to '+time(start+elapsed)+'?',elapsed,'Count forward across the hour.','Elapsed time '+elapsed+' minutes.')},
 n=>{const hour=n%9+13,mins=[5,15,30,45][n%4];return C('Convert '+(hour-12)+':'+pad(mins)+' pm into 24-hour time.',pad(hour)+':'+pad(mins),[pad(hour-12)+':'+pad(mins),pad((hour+1)%24)+':'+pad(mins),pad(hour)+':'+pad((mins+10)%60)],'For an afternoon/evening pm time, add 12 to the hour.','The 24-hour time is '+pad(hour)+':'+pad(mins)+'.')}
]
};
function create(skillId,band,round){
 const fns=generators[skillId];if(!fns)throw Error('No fresh question bank for '+skillId);
 const r=Math.max(1,Math.floor(Number(round)||1)),year=Math.max(5,Math.min(9,Math.floor(Number(band)||7)));
 const n=r+year-3,questions=[];
 fns.forEach(function(fn,i){
  const item=fn(n+i*2);
  if(!item||!item.prompt||!item.hint||!item.worked)throw Error('Invalid review question for '+skillId+' '+i);
  const unique=[...new Set(item.choices)];
  if(unique.length!==4||!unique.includes(item.answer))throw Error('Bad multiple-choice options for '+skillId+' '+i);
  const distractors=unique.filter(x=>x!==item.answer);
  const slot=(r+year+i+skillId.length)%4;
  distractors.splice(slot,0,item.answer);
  questions.push([item.prompt,item.answer,distractors,item.hint,item.worked]);
 });
 if(new Set(questions.map(q=>q[0])).size!==3)throw Error('Duplicate questions in review for '+skillId);
 return questions;
}
root.JaxonFreshReview=Object.freeze({create:create,supportedSkills:Object.freeze(Object.keys(generators))});
})(window);
