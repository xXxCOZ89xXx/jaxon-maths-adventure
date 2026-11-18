// Lazy/deferred panels intentionally have no decoded images while closed.
// Visible images must still load successfully before a gameplay assertion or screenshot.
module.exports=async page=>page.waitForFunction(()=>[...document.images].filter(image=>{
 const r=image.getBoundingClientRect(),style=getComputedStyle(image);
 return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&style.visibility!=='hidden';
}).every(image=>image.complete&&image.naturalWidth>0));
