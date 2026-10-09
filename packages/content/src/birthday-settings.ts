/** A selected birthdate supplies the password; the countdown celebrates its next calendar occurrence. */
export function birthdayPassword(birthdate:string){const [year,month,day]=(birthdate||'2026-10-10').split('-');return day+month+year;}
export function birthdayInstant(birthdate:string,time='00:00',timezone='Asia/Kolkata',now=new Date()){
 const [birthYear,month,day]=(birthdate||'2026-10-10').split('-').map(Number);
 const local=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(key:string)=>Number(local.find(p=>p.type===key)?.value);
 let year=Math.max(birthYear,part('year'));if(year===part('year')&&part('month')*100+part('day')>month*100+day)year++;
 while(new Date(Date.UTC(year,month-1,day)).getUTCMonth()!==month-1)year++;
 const [hour,minute]=time.split(':').map(Number),wall=Date.UTC(year,month-1,day,hour,minute);
 let instant=wall;
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){const parts=formatter.formatToParts(new Date(instant)),get=(key:string)=>Number(parts.find(p=>p.type===key)?.value);const represented=Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));instant+=wall-represented;}
 return new Date(instant).toISOString();
}
