/* Teach It Back: Derivatives. Shared by /teach-it-back (students) and /teacher/teach-it-back (projector).
   Same engine as Teach It Back on the Accounting site; the content (skills, problems, Kahoot and Define It banks) is in the first half. */
/* ================= utilities ================= */
const $=s=>document.querySelector(s);
const app=$("#app");
const fmt=n=>Math.round(n).toLocaleString("en-US");
const money=n=>"$"+fmt(n);
const r4=x=>Math.round(x*10000)/10000;
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const between=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function shuffle(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const params=new URLSearchParams(location.search);
/* Review Edition (/teach-it-back-review): same engine, new problems, partners solve together, about 35 minutes. */
const REVIEW=!!window.TIB_REVIEW;
const TNAME=REVIEW?"Review":"Derivatives";
const TPATH=REVIEW?"/teach-it-back-review":"/teach-it-back";
const SALT=REVIEW?500009:0;
const HOST=params.has("host");
const NOCARD=params.has("nocard");
let FS=store.get("tibFS",1);
function setFS(v){FS=Math.max(.8,Math.min(1.6,v));document.documentElement.style.setProperty("--fs",FS);store.set("tibFS",FS)}
setFS(FS);
$("#aMinus").onclick=()=>setFS(FS-.1);$("#aPlus").onclick=()=>setFS(FS+.1);
if(NOCARD)$("#pvBtn").style.display="none";

/* ================= schedule ================= */
const ROUNDS={
 f1:{name:"Pick the Side",short:"Futures: Pick the Side",unit:"Futures"},
 f2:{name:"Futures Gain or Loss",short:"Futures: Gain or Loss",unit:"Futures"},
 o1:{name:"Calls and Puts",short:"Options: Calls and Puts",unit:"Options"},
 o2:{name:"Protect Your Shares",short:"Options: Protective Puts",unit:"Options"},
 s1:{name:"Pick the Swap",short:"Swaps: Pick the Swap",unit:"Swaps"},
 s2:{name:"Run the Swap",short:"Swaps: Run the Swap",unit:"Swaps"},
 full:{name:"Three Clients",short:"Three Clients (all three)",unit:"All three"}
};
const KNAME={1:"Futures",2:"Options",3:"Swaps"};
/* How "the teacher always learned it first" works.
   Skills come in pairs (X, Y). Each pair takes three rotations:
     1. LEARN:  odd stations learn X together, even stations learn Y together (both partners are learners).
     2. MOVER TEACHES: movers slide up one station, so every mover lands at a station that learned the OTHER skill,
        and teaches the skill they just learned.  (Odd stations now do Y, even stations do X.)
     3. STAYER TEACHES: movers slide again. Each stayer teaches the skill they learned in step 2 to a mover
        who hasn't had it yet.
   After three rotations everyone has learned both skills, taught one, and only ever taught something they learned first.
   ODD number of stations: the mover coming from the last station wraps to Station 1, which learned the same skill.
   So Station 1 learns the other skill together in step 2, and its stayer teaches the first skill in step 3.
   One pair per derivative: futures, then options, then swaps. A Kahoot break follows each pair.
   Then one Three Clients rotation mixes all three, with both partners learning it together.
   (The Define It engine is still here. To bring it back, push {type:"def",d:ix+1,...} after each Kahoot break.) */
const PAIRS=[["f1","f2"],["o1","o2"],["s1","s2"]];
const SCHED=[];
const addRot=o=>{const rot=SCHED.filter(b=>b.type==="rot").length+1;SCHED.push({type:"rot",rot,label:"Rotation "+rot,...o})};
if(REVIEW){
  /* Review Edition: every rotation both partners solve together (new partner each time), two skills per derivative,
     a Kahoot break after each derivative, then two Three Clients rotations. */
  PAIRS.forEach((pr,ix)=>{pr.forEach(rd=>addRot({round:rd,teach:"co"}));SCHED.push({type:"kahoot",k:ix+1,label:"Kahoot Break "+(ix+1)})});
  addRot({round:"full",teach:"co"});addRot({round:"full",teach:"co"});
}else{
PAIRS.forEach((pr,ix)=>{
  addRot({pair:pr,phase:"co",teach:"co"});addRot({pair:pr,phase:"mt",teach:"move"});addRot({pair:pr,phase:"st",teach:"stay"});
  SCHED.push({type:"kahoot",k:ix+1,label:"Kahoot Break "+(ix+1)});
});
addRot({round:"full",teach:"co"});
}
const ROT_TOTAL=SCHED.filter(b=>b.type==="rot").length;
function wrapFix(N,station){return N>2&&N%2===1&&station===1}
function roundAt(b,station,N){if(!b.pair)return b.round;const odd=station%2===1;if(b.phase==="st"&&wrapFix(N,station))return b.pair[0];return b.phase==="co"?(odd?b.pair[0]:b.pair[1]):(odd?b.pair[1]:b.pair[0])}
function teachAt(b,station,N){return b.pair&&b.phase==="mt"&&wrapFix(N,station)?"co":b.teach}
/* 50 minutes: 9 skill rotations (36), 3 Kahoot breaks (9), 1 Three Clients (5). */
/* Review Edition: 6 skill rotations (18), 3 Kahoot breaks (9), 2 Three Clients (8) = 35 minutes. */
const MINUTES=REVIEW?{rot:3,full:4,kahoot:3,def:3}:{rot:4,full:5,kahoot:3,def:3};
function blockMinutes(b){return b.type==="kahoot"?MINUTES.kahoot:b.type==="def"?MINUTES.def:(b.round==="full"?MINUTES.full:MINUTES.rot)}
const PHASE_NAME={co:"learn together",mt:"mover teaches",st:"stayer teaches"};
const SCHED_NO=x=>x.type==="kahoot"?"Quiz "+x.k:x.type==="def"?"Def "+x.d:"Rot "+x.rot;
const SCHED_NAME=x=>x.type==="kahoot"?"Kahoot Break: "+KNAME[x.k]:x.type==="def"?"Define It: "+KNAME[x.d]:x.pair?ROUNDS[x.pair[0]].unit+": "+ROUNDS[x.pair[0]].name+" / "+ROUNDS[x.pair[1]].name+" ("+PHASE_NAME[x.phase]+")":ROUNDS[x.round].name;

/* ================= Define It bank =================
   One prompt per derivative. The real answer is written the way a strong student would say it, so it doesn't stand out. */
const DEFS={
1:[{kind:"Define",term:"Futures contract",real:"a deal made today to buy or sell something later at a price you lock in now"}],
2:[{kind:"Define",term:"Put option",real:"the right, but not the obligation, to sell at a set price before a deadline"}],
3:[{kind:"Explain",term:"Why would a company swap its variable-rate loan payments for fixed ones?",real:"so rising interest rates can't push its payments up and it knows what it will pay"}]};
const DEF_RIGHT=50,DEF_FOOL=25;
function normDef(t){t=String(t||"").trim().replace(/\s+/g," ").replace(/[.!\s]+$/,"");return t?t.charAt(0).toUpperCase()+t.slice(1):""}
function defKey(b,p){return b+"_"+p}
function defEntries(recs,b,p,code,hide){
  const k=defKey(b,p),hid=(hide&&hide[k])||[];
  const list=Object.values(recs||{}).filter(r=>r&&r.def&&r.def[k]&&normDef(r.def[k].t)&&!hid.includes("s"+r.station)).map(r=>({id:"s"+r.station,station:r.station,text:normDef(r.def[k].t)}));
  list.push({id:"real",text:normDef(DEFS[SCHED[b].d][p].real)});
  return shuffle(rng((+code||1)*7+b*131+p*17),list.sort((a,c)=>a.id<c.id?-1:1))}
function defScores(recs,b,p,code,hide){
  const ents=defEntries(recs,b,p,code,hide),ids=ents.map(e=>e.id),pts={},votes={};ents.forEach(e=>votes[e.id]=0);
  Object.values(recs||{}).forEach(r=>{const d=r&&r.def&&r.def[defKey(b,p)];if(!d||!d.v||!ids.includes(d.v)||d.v==="s"+r.station)return;
    votes[d.v]++;if(d.v==="real")pts[r.station]=(pts[r.station]||0)+DEF_RIGHT;else{const st=+d.v.slice(1);pts[st]=(pts[st]||0)+DEF_FOOL}});
  return{pts,votes,ents}}

/* ================= answer checking ================= */
function num(v){if(v==null)return NaN;v=String(v).replace(/[−–—]/g,"-").replace(/[$,%\s]/g,"");if(v.startsWith("(")&&v.endsWith(")"))v="-"+v.slice(1,-1);return v===""?NaN:Number(v)}
function near(kind,val,ans){
  if(kind==="choice")return String(val||"").toLowerCase()===String(ans).toLowerCase();
  const x=num(val);if(isNaN(x))return false;
  if(kind==="int")return Math.round(x)===ans&&Math.abs(x-ans)<.01;
  if(kind==="rate")return Math.abs(x-ans)<=.011||Math.abs(x*100-ans)<=.011;
  if(kind==="cents")return Math.abs(x-ans)<=.011;
  return Math.abs(x-ans)<=1.01; // money and signed: the answers are whole dollars, allow a dollar of rounding
}
/* how an answer is written out on screen */
function ansText(f){return f.kind==="money"?money(f.ans):f.kind==="signed"?sgn(f.ans):f.kind==="cents"?cents(f.ans):f.kind==="rate"?f.ans+"%":f.kind==="int"?fmt(f.ans):f.ans}
function ansInput(f){return f.kind==="money"?fmt(f.ans):f.kind==="signed"?(f.ans<0?"-":"")+fmt(Math.abs(f.ans)):f.kind==="cents"?f.ans.toFixed(2):f.ans}

/* ================= problem generators =================
   Same math and wording as The Hedging Desk practice page. No "long" or "short": buy or sell futures.
   Bought futures: (Delivery price − Futures price) × Quantity.  Sold futures: (Futures price − Delivery price) × Quantity.
   Call payoff: max(Price − Strike, 0). Put payoff: max(Strike − Price, 0). One contract = 100 shares.
   Swap: Company A has a variable loan (Federal Funds Rate + spread), Company B a fixed loan. After the swap A pays fixed, B pays variable. */
const FUT=[
 {w:"Prairie Crunch Cereal",a:"buy",it:"wheat",u:"bushel",q:[10000,20000,50000],F:[6,6.5,7],mv:[.25,.5,1],sz:5000},
 {w:"Harvest Ridge Farm",a:"sell",it:"corn",u:"bushel",q:[20000,40000],F:[4,4.5,5],mv:[.25,.5],sz:5000},
 {w:"Lindqvist Family Farm",a:"sell",it:"soybeans",u:"bushel",q:[10000,20000],F:[10,11,12],mv:[.5,1,1.5],sz:5000},
 {w:"Route 53 Freight",a:"buy",it:"diesel",u:"gallon",q:[42000,84000],F:[3,3.2,3.5],mv:[.2,.3,.5],sz:42000},
 {w:"Northline Airlines",a:"buy",it:"jet fuel",u:"gallon",q:[84000,126000],F:[2.5,3],mv:[.2,.3,.4],sz:42000},
 {w:"Alto Verde Coffee",a:"sell",it:"coffee",u:"pound",q:[10000,20000,40000],F:[1.8,2,2.2],mv:[.1,.2,.3],sz:5000},
 {w:"Big Sky Ranch",a:"sell",it:"cattle",u:"pound",q:[40000,80000],F:[1.8,2,2.4],mv:[.1,.2,.3],sz:40000},
 {w:"Lakeshore Oil",a:"sell",it:"crude oil",u:"barrel",q:[5000,10000],F:[70,75,80],mv:[5,10],sz:1000},
 {w:"Fox River Burgers",a:"buy",it:"beef",u:"pound",q:[40000,80000],F:[2,2.5],mv:[.2,.3],sz:40000},
 {w:"Sweet Tooth Chocolate",a:"buy",it:"cocoa",u:"ton",q:[50,100,200],F:[8000,9000],mv:[500,1000],sz:10}];
const STOCKS=["HRSY","HRSY","HRSY","BISN","PRSL","NLAR","SMMT","FXRF"];
const SWCO=["Bison Logistics","Lakes Corp","Summit Solar","Harbor Point Hotels","Northgate Grocers","Ridgeview Medical","Great Lakes Ferry","Ironwood Builders","Kingsley Sports","Juniper Software","Maple Leaf Dairy","Crestview Health"];
const MONTHS=["March","May","June","September","October","December"];
const SIDE=["Buy futures","Sell futures"],GL=["Gain","Loss"],TOOLS=["Futures","Option","Swap"];
const r2=x=>Math.round(x*100)/100;
const cents=n=>(n<0?"−":"")+"$"+Math.abs(r2(n)).toFixed(2);
const px=n=>Math.abs(r2(n)%1)>1e-9||Math.abs(n)<10?cents(n):money(n);
/* futures prices: always show cents for commodities quoted under $20 (wheat $6.00, coffee $2.20), whole dollars above (oil $75, cocoa $8,000) */
const fp=(n,c)=>c.F[0]<20?cents(n):px(n);
const sgn=n=>(r2(n)<0?"−":r2(n)>0?"+":"")+money(Math.abs(n));
const futPnl=(side,F,S,q)=>r2((side==="buy"?(S-F):(F-S))*q);
const poss=n=>n.endsWith("s")?n+"’":n+"’s";
const pl=(c,q)=>q===1?c.u:c.u+"s";
/* gain: true forces a futures gain, false a loss, undefined either */
function futCase(r,c,gain){c=c||pick(r,FUT);const q=pick(r,c.q),F=pick(r,c.F),dir=gain===undefined?(r()<.5?-1:1):(gain===(c.a==="buy")?1:-1),S=r2(F+pick(r,c.mv)*dir);return{c,q,F,S,pnl:futPnl(c.a,F,S,q)}}
const sideWhy=c=>c.a==="buy"?`${c.w} buys ${c.it}, so rising prices hurt it. It buys futures, which gain when prices rise.`:`${c.w} sells ${c.it}, so falling prices hurt it. It sells futures, which gain when prices fall.`;
const futMath=({c,q,F,S,pnl})=>c.a==="buy"?`Bought futures: (${fp(S,c)} − ${fp(F,c)}) × ${fmt(q)} = ${sgn(pnl)}`:`Sold futures: (${fp(F,c)} − ${fp(S,c)}) × ${fmt(q)} = ${sgn(pnl)}`;
function optCase(r,type,otm){
  const call=type==="call",K=pick(r,[20,25,30,40,45,50,60]),p=pick(r,[1,1.5,2,2.5,3]),S0=call?K-pick(r,[1,2,3]):K+pick(r,[1,2,3]);
  const S=otm?(call?K-pick(r,[2,4]):K+pick(r,[2,4])):(call?K+pick(r,[1,2,3,4,6,8]):K-pick(r,[1,2,3,4,6,8]));
  const pay=Math.max(call?S-K:K-S,0)*100,prem=r2(p*100),net=r2(pay-prem),be=call?K+p:K-p;
  return{call,K,p,S0,S,pay,prem,net,be,tk:pick(r,STOCKS)}}
function protCase(r,falls,sh){
  sh=sh||100;const C=pick(r,[40,45,50,60,75]),K=C-pick(r,[2,4,5]),p=pick(r,[1,1.5,2,2.5]);
  const S=falls?K-pick(r,[3,5,8,10]):C+pick(r,[2,4,6,8]);
  const stock=(S-C)*sh,pay=Math.max(K-S,0)*sh,prem=r2(p*sh),net=r2(stock+pay-prem),floor=r2((K-C-p)*sh);
  return{C,K,p,S,sh,stock,pay,prem,net,floor,tk:pick(r,STOCKS)}}
function swapCase(r,aWins){
  const n=pick(r,[2,4,5,10,20])*1e6,ff=pick(r,[3,3.5,4,4.5,5,5.5]),sp=pick(r,[1,1.5,2,2.5]);
  const d=aWins===null?pick(r,[.5,1,1.5])*(r()<.5?-1:1):(aWins?1:-1)*pick(r,[.5,1,1.5]);
  const fx=r2(ff+sp-d),vr=r2(ff+sp),before=n*vr/100,after=n*fx/100,gap=Math.abs(before-after);
  const A=pick(r,SWCO);let B=pick(r,SWCO);while(B===A)B=pick(r,SWCO);
  const win=before>after?A:before<after?B:"Neither";
  return{n,ff,sp,fx,vr,before,after,gap,A,B,win}}
const swapText=s=>`<b>${s.A}</b> has a ${money(s.n)} loan at the <b>Federal Funds Rate + ${s.sp}%</b>. <b>${s.B}</b> has a ${money(s.n)} loan at a <b>fixed ${s.fx}%</b>. They swap payments: ${s.A} now pays the fixed rate and ${s.B} now pays the variable rate. The Federal Funds Rate is <b>${s.ff}%</b>.`;
const swapWhy=s=>`Variable: ${s.ff}% + ${s.sp}% = ${s.vr}%, so ${s.A} paid ${money(s.n)} × ${s.vr}% = ${money(s.before)}. After the swap ${s.A} pays the fixed ${s.fx}%: ${money(s.after)}. ${s.win==="Neither"?"The payments are equal, so neither comes out ahead.":s.win===s.A?`Variable costs more than fixed, so ${s.A} comes out ahead by ${money(s.gap)} a year.`:`Variable costs less than fixed, so ${s.B} comes out ahead by ${money(s.gap)} a year.`}`;
const TOOL_POOL=[
 ["An airline wants to lock in what it will pay for jet fuel next spring.","Futures"],
 ["An investor pays $2 a share for the right, but not the obligation, to buy HRSY at $50.","Option"],
 ["A company trades its variable loan payments for fixed payments.","Swap"],
 ["A farmer locks in today the price she will sell her wheat for at harvest.","Futures"],
 ["You own 100 shares and pay a premium so you can sell them at $45 if the stock crashes.","Option"],
 ["Two companies trade interest payments so one pays fixed and the other pays variable.","Swap"],
 ["A bakery agrees today to buy wheat in June at $6.50 a bushel.","Futures"],
 ["A fan pays $25 for the right to buy a concert ticket at face value next month, and can skip it.","Option"],
 ["A hospital's loan payment moves with the Federal Funds Rate, and it wants a payment that never changes.","Swap"],
 ["A coffee grower agrees now on the price for beans she will deliver in the fall.","Futures"]];
function toolItems(r,n){const items=[],why=[];shuffle(r,TOOL_POOL).slice(0,n).forEach(([t,a],k)=>{items.push({k:"t"+k,label:t,kind:"choice",opts:TOOLS,ans:a});
  why.push(`${k+1}. ${a==="Futures"?"A price locked today for a later trade: futures.":a==="Option"?"A right, not an obligation, bought with a premium: an option.":"Trading a changing payment for a fixed one: a swap."}`)});return{items,why:why.join("<br>")}}

const GEN={
 /* ---------- FUTURES ---------- */
 f1(r,bonus,which){
  if(bonus){const items=[],why=[];
    const gb=shuffle(r,[true,false]);shuffle(r,FUT).slice(0,2).forEach((c,k)=>{const x=futCase(r,c,gb[k]),g=x.pnl>0?"Gain":"Loss";
      items.push({k:"g"+k,label:`${c.w} ${c.a==="buy"?"bought":"sold"} ${c.it} futures at ${fp(x.F,c)}. At delivery ${c.it} is ${fp(x.S,c)}. The futures`,kind:"choice",opts:GL,ans:g},
        {k:"e"+k,label:`Price ${c.w} effectively ${c.a==="buy"?"pays":"gets"} per ${c.u}`,kind:"cents",ans:x.F});
      why.push(`${c.w}: ${futMath(x)}, a ${g.toLowerCase()}. The hedge locks in ${fp(x.F,c)} per ${c.u} either way.`)});
    return{title:"Where did the price land?",wide:true,text:"Did each futures position gain or lose? Then find the price each business really ends up with.",fields:items,why:why.join("<br>"),
      hints:["Bought futures gain when the price goes UP. Sold futures gain when the price goes DOWN.","A hedge locks in the futures price. The effective price is the futures price, no matter where the market ends up."]}}
  if(which===1){const items=[],why=[];
    const gw=shuffle(r,[true,true,false,false]);shuffle(r,FUT).slice(0,4).forEach((c,k)=>{const x=futCase(r,c,gw[k]),g=x.pnl>0?"Gain":"Loss";
      items.push({k:"h"+k,label:`${c.w} ${c.a==="buy"?"bought":"sold"} ${c.it} futures at ${fp(x.F,c)}. Delivery price: ${fp(x.S,c)}. The futures`,kind:"choice",opts:GL,ans:g});
      why.push(`${k+1}. ${c.a==="buy"?"Bought":"Sold"} futures and the price went ${x.S>x.F?"up":"down"}: ${g.toLowerCase()}.${g==="Loss"?` The cash market helped ${c.w} by the same amount.`:""}`)});
    return{title:"Gain or loss?",wide:true,text:"Each business already hedged. Did its futures position gain or lose money?",fields:items,why:why.join("<br>"),
      hints:["Bought futures: gain if the delivery price is ABOVE the futures price. Sold futures: gain if the delivery price is BELOW it.","When the cash market helps the business, the futures lose about the same amount. That's the hedge doing its job."]}}
  const buyers=shuffle(r,FUT.filter(c=>c.a==="buy")).slice(0,2),sellers=shuffle(r,FUT.filter(c=>c.a==="sell")).slice(0,2);
  const items=[],why=[];shuffle(r,buyers.concat(sellers)).forEach((c,k)=>{const q=pick(r,c.q);
    items.push({k:"s"+k,label:`${c.w} ${c.a==="buy"?"needs to buy":"will sell"} ${fmt(q)} ${pl(c,q)} of ${c.it} in ${pick(r,MONTHS)}. To hedge, it should`,kind:"choice",opts:SIDE,ans:c.a==="buy"?SIDE[0]:SIDE[1]});
    why.push(`${k+1}. ${sideWhy(c)}`)});
  return{title:"Pick the side",wide:true,text:"Each business wants to lock in a price. Should it buy futures or sell futures?",fields:items,why:why.join("<br>"),
    hints:["Ask: does this business BUY the item or SELL it? A buyer is hurt when prices rise. A seller is hurt when prices fall.","Buyers buy futures. Sellers sell futures."]}
 },
 f2(r,bonus,which){
  if(bonus){const c=pick(r,FUT),k=between(r,2,8),q=k*c.sz,F=pick(r,c.F),S=r2(F+pick(r,c.mv)*(r()<.5?-1:1)),pnl=futPnl(c.a,F,S,q);
    return{title:c.w+" (contracts)",text:`${c.w} ${c.a==="buy"?"needs to buy":"will sell"} <b>${fmt(q)} ${pl(c,q)}</b> of ${c.it}. One futures contract covers <b>${fmt(c.sz)} ${pl(c,c.sz)}</b>. It hedges at <b>${fp(F,c)}</b>, and at delivery ${c.it} is <b>${fp(S,c)}</b>.`,
     facts:[["Quantity",fmt(q)+" "+pl(c,q)],["Contract size",fmt(c.sz)+" "+pl(c,c.sz)],["Futures price",fp(F,c)],["Delivery price",fp(S,c)]],
     fields:[{k:"n",label:"Number of contracts",kind:"int",ans:k},{k:"side",label:"Buy or sell futures?",kind:"choice",opts:SIDE,ans:c.a==="buy"?SIDE[0]:SIDE[1]},{k:"pnl",label:"Futures gain or loss (− for a loss)",kind:"signed",ans:pnl}],
     hints:["Contracts = quantity ÷ contract size. Buyers buy futures, sellers sell futures.",`Then: ${c.a==="buy"?"(Delivery − Futures)":"(Futures − Delivery)"} × ${fmt(q)}.`],
     why:`${fmt(q)} ÷ ${fmt(c.sz)} = ${k} contracts. ${sideWhy(c)} ${futMath({c,q,F,S,pnl})}.`}}
  const c=pick(r,FUT.filter(x=>x.a===(which===1?"sell":"buy"))),x=futCase(r,c),{q,F,S,pnl}=x,buyer=c.a==="buy",cash=r2(S*q);
  return{title:c.w,text:`${c.w} ${buyer?"needs to buy":"will sell"} <b>${fmt(q)} ${pl(c,q)}</b> of ${c.it} in three months. To hedge, it locks in a futures price of <b>${fp(F,c)}</b> per ${c.u}. At delivery, ${c.it} trades at <b>${fp(S,c)}</b>.`,
   facts:[["Quantity",fmt(q)+" "+pl(c,q)],["Futures price",fp(F,c)+" per "+c.u],["Delivery price",fp(S,c)+" per "+c.u]],
   fields:[{k:"side",label:"Buy or sell futures?",kind:"choice",opts:SIDE,ans:buyer?SIDE[0]:SIDE[1]},
     {k:"cash",label:buyer?"Cost in the cash market":"Sales in the cash market",kind:"money",ans:cash},
     {k:"pnl",label:"Futures gain or loss (− for a loss)",kind:"signed",ans:pnl},
     {k:"eff",label:`Effective ${buyer?"cost":"price"} per ${c.u}`,kind:"cents",ans:F}],
   hints:["Buyers buy futures, sellers sell futures. Bought futures: (Delivery − Futures) × Quantity. Sold futures: (Futures − Delivery) × Quantity.",
     `Cash market = ${fmt(q)} × ${fp(S,c)}. ${buyer?"Effective cost = (cash cost − futures gain) ÷ quantity.":"Effective price = (cash sales + futures gain) ÷ quantity."} It should land on the futures price.`],
   why:`${sideWhy(c)} Cash market: ${fmt(q)} × ${fp(S,c)} = ${money(cash)}. ${futMath(x)}. Effective: ${money(cash)} ${buyer?"−":"+"} (${sgn(pnl)}) = ${money(buyer?cash-pnl:cash+pnl)}, which is ${fp(F,c)} per ${c.u}. The price was locked in.`}
 },
 /* ---------- OPTIONS ---------- */
 o1(r,bonus,which){
  if(bonus){const items=[],why=[];
    for(let k=0;k<4;k++){const call=r()<.5,K=pick(r,[25,30,40,45,50,60,75,80]),p=pick(r,[1,1.5,2,2.5,3,4]),be=call?K+p:K-p;
      items.push({k:"b"+k,label:`${call?"Call":"Put"}: ${px(K)} strike, ${px(p)} premium. Breakeven price`,kind:"cents",ans:be});
      why.push(`${k+1}. ${call?"Call":"Put"}: ${px(K)} ${call?"+":"−"} ${px(p)} = ${cents(be)}`)}
    return{title:"Rapid breakevens",wide:true,text:"Find the breakeven stock price for each option.",fields:items,why:why.join("<br>"),
      hints:["Call breakeven = strike + premium. The stock has to climb past the strike by enough to pay back the premium.","Put breakeven = strike − premium. The stock has to fall below the strike by enough to pay back the premium."]}}
  const o=optCase(r,which===1?"put":"call",r()<.25),t=o.call?"call":"put";
  return{title:`${o.tk} ${t}`,text:`${o.tk} trades at ${px(o.S0)}. You ${o.call?"think good news is coming":"expect bad news"}, so you buy <b>one ${t} contract</b> (100 shares) with a <b>${px(o.K)} strike</b> for a <b>${px(o.p)} premium</b> per share. At expiration, ${o.tk} is <b>${px(o.S)}</b>.`,
   facts:[["Option",o.call?"Call (right to buy)":"Put (right to sell)"],["Strike price",px(o.K)],["Premium",px(o.p)+" per share"],["Shares","100"],["Price at expiration",px(o.S)]],
   fields:[{k:"pay",label:"Option payoff (× 100 shares)",kind:"money",ans:o.pay},{k:"prem",label:"Premium paid",kind:"money",ans:o.prem},
     {k:"net",label:"Net profit or loss (− for a loss)",kind:"signed",ans:o.net},{k:"be",label:"Breakeven price",kind:"cents",ans:o.be}],
   hints:["Call payoff = max(Price − Strike, 0). Put payoff = max(Strike − Price, 0). Multiply by 100 shares, then subtract the premium you paid for all 100.",
     `${o.call?"Call":"Put"} breakeven = strike ${o.call?"+":"−"} premium: ${px(o.K)} ${o.call?"+":"−"} ${px(o.p)}.`],
   why:`Payoff: max(${o.call?px(o.S)+" − "+px(o.K):px(o.K)+" − "+px(o.S)}, 0) × 100 = ${money(o.pay)}. Premium: ${px(o.p)} × 100 = ${money(o.prem)}. Net: ${money(o.pay)} − ${money(o.prem)} = ${sgn(o.net)}.${o.pay===0?" The option expires worthless, so you lose only the premium.":""} Breakeven: ${px(o.K)} ${o.call?"+":"−"} ${px(o.p)} = ${cents(o.be)}.`}
 },
 o2(r,bonus,which){
  if(bonus){const x=protCase(r,true,pick(r,[200,300,500]));
    return{title:`Hedge ${fmt(x.sh)} shares of ${x.tk}`,text:`You own <b>${fmt(x.sh)} shares of ${x.tk}</b> bought at <b>${px(x.C)}</b>. You buy puts on every share: <b>${px(x.K)} strike</b>, <b>${px(x.p)} premium</b> per share.`,
     facts:[["Shares",fmt(x.sh)],["Bought at",px(x.C)],["Put strike",px(x.K)],["Premium",px(x.p)+" per share"]],
     fields:[{k:"cost",label:"Total cost to hedge",kind:"money",ans:x.prem},{k:"floor",label:"Worst-case net position, however far it falls (− for a loss)",kind:"signed",ans:x.floor}],
     hints:["You pay the premium on every share. The strike is not a cost.","Below the strike, every dollar the stock loses the put gains back. Worst case = (Strike − Cost − Premium) × shares."],
     why:`Cost: ${fmt(x.sh)} × ${px(x.p)} = ${money(x.prem)}. Worst case: (${px(x.K)} − ${px(x.C)} − ${px(x.p)}) × ${fmt(x.sh)} = ${sgn(x.floor)}. That's the floor, no matter how far ${x.tk} falls.`}}
  const x=protCase(r,which!==1);
  return{title:`Protect ${x.tk}`,text:`You bought <b>100 shares of ${x.tk} at ${px(x.C)}</b>. To limit your downside, you buy a <b>protective put</b> with a <b>${px(x.K)} strike</b> for a <b>${px(x.p)} premium</b> per share. ${x.tk} ${x.S<x.C?"falls":"rises"} to <b>${px(x.S)}</b>.`,
   facts:[["Bought at",px(x.C)],["Put strike",px(x.K)],["Premium",px(x.p)+" per share"],["Shares","100"],["Price now",px(x.S)]],
   fields:[{k:"stock",label:"Stock gain or loss (− for a loss)",kind:"signed",ans:x.stock},{k:"pay",label:"Put payoff",kind:"money",ans:x.pay},
     {k:"prem",label:"Premium paid",kind:"money",ans:x.prem},{k:"net",label:"Net position (− for a loss)",kind:"signed",ans:x.net}],
   hints:["Work it in three pieces: the stock gain or loss, the put payoff, then subtract the premium. Everything × 100 shares.",
     `Put payoff = max(Strike − Price, 0). ${x.S<x.K?"The price is below the strike, so the put pays.":"The price is above the strike, so the put pays $0."}`],
   why:`Stock: (${px(x.S)} − ${px(x.C)}) × 100 = ${sgn(x.stock)}. Put: max(${px(x.K)} − ${px(x.S)}, 0) × 100 = ${money(x.pay)}. Premium: ${money(x.prem)}. Net: ${sgn(x.stock)} + ${money(x.pay)} − ${money(x.prem)} = ${sgn(x.net)}.${x.S<x.K?` However far ${x.tk} falls, the worst case is ${sgn(x.floor)}.`:" The put expires worthless. You keep the stock gain minus what the insurance cost."}`}
 },
 /* ---------- SWAPS ---------- */
 s1(r,bonus,which){
  const SETUP="Company A has a variable loan at the Federal Funds Rate + a spread. Company B has a fixed-rate loan. They swap: A now pays B's fixed rate, and B now pays A's variable rate.";
  const numeric=n=>{const items=[],why=[];for(let k=0;k<n;k++){const s=swapCase(r,null),w=s.win===s.A?"Company A":s.win===s.B?"Company B":"Neither";
      items.push({k:"v"+k,label:`A: FF + ${s.sp}%. B: fixed ${s.fx}%. FF is ${s.ff}%. A's variable rate`,kind:"rate",ans:s.vr},
        {k:"w"+k,label:`Who comes out ahead after the swap?`,kind:"choice",opts:["Company A","Company B","Neither"],ans:w});
      why.push(`${k+1}. ${s.ff}% + ${s.sp}% = ${s.vr}% variable vs. ${s.fx}% fixed. ${s.vr>s.fx?"Variable costs more, so A (now paying fixed) comes out ahead.":"Variable costs less, so B (now paying variable) comes out ahead."}`)}
    return{items,why:why.join("<br>")}};
  if(bonus||which===1){const {items,why}=numeric(2);
    return{title:"Who comes out ahead?",wide:true,text:SETUP,fields:items,why,
      hints:["Variable rate = Federal Funds Rate + the spread.","After the swap, A pays fixed. If the variable rate is higher than the fixed rate, A comes out ahead. If it's lower, B does."]}}
  const T=[
   ()=>{const co=pick(r,SWCO);return{label:`${co} has a variable-rate loan and expects rates to rise. After a swap, it should`,opts:["Pay fixed","Pay variable"],ans:"Pay fixed",why:"Paying fixed locks in the payment, so rising rates can't hurt."}},
   ()=>{const co=pick(r,SWCO);return{label:`${co} has a fixed-rate loan at 7% and expects rates to fall. After a swap, it should`,opts:["Pay fixed","Pay variable"],ans:"Pay variable",why:"Paying variable lets its payment drop as rates fall."}},
   ()=>{const co=pick(r,SWCO);return{label:`${co}'s CFO wants a loan payment that never changes. Its loan is variable. After a swap, it should`,opts:["Pay fixed","Pay variable"],ans:"Pay fixed",why:"A fixed payment is predictable, whatever rates do."}},
   ()=>({label:"Rates rise quickly. In a fixed-for-variable swap, who comes out ahead?",opts:["The fixed-rate payer","The variable-rate payer"],ans:"The fixed-rate payer",why:"The fixed payment stays the same while the variable payment grows."}),
   ()=>({label:"Rates fall a lot. In a fixed-for-variable swap, who comes out ahead?",opts:["The fixed-rate payer","The variable-rate payer"],ans:"The variable-rate payer",why:"Variable payments shrink when rates fall. The fixed side keeps paying the same."}),
   ()=>({label:"The variable rate on these loans moves with the",opts:["Federal Funds Rate","Price of oil","Stock market"],ans:"Federal Funds Rate",why:"Variable loan rates are set as the Federal Funds Rate plus a spread."})];
  const items=[],why=[];shuffle(r,T).slice(0,4).forEach((t,k)=>{const x=t();items.push({k:"c"+k,label:x.label,kind:"choice",opts:x.opts,ans:x.ans});why.push(`${k+1}. ${x.ans}: ${x.why}`)});
  return{title:"Pick the swap",wide:true,text:"A swap trades a payment that changes for a payment that stays fixed. Which side should each company want?",fields:items,why:why.join("<br>"),
    hints:["Afraid rates will RISE? You want to pay FIXED. Hoping rates will FALL? You want to pay VARIABLE.","Whoever is paying fixed wins when rates go up. Whoever is paying variable wins when rates go down."]}
 },
 s2(r,bonus,which){
  if(bonus){const s=swapCase(r,null),up=pick(r,[1,1.5,2]),ff2=r2(s.ff+up),save=r2(s.n*(ff2+s.sp-s.fx)/100),be=r2(s.fx-s.sp);
    return{title:`${s.A} and ${s.B}: what if?`,text:swapText(s),facts:[["Loan",money(s.n)],["Variable",`FF + ${s.sp}%`],["Fixed",s.fx+"%"],["FF now",s.ff+"%"]],
     fields:[{k:"be",label:"Federal Funds Rate where neither comes out ahead (%)",kind:"rate",ans:be},
       {k:"sv",label:`If FF rises to ${ff2}%, how much does ${s.A} save that year? (− if it costs more)`,kind:"signed",ans:save}],
     hints:["Neither wins when the variable rate equals the fixed rate: FF + spread = fixed, so FF = fixed − spread.",`At ${ff2}%, the variable rate is ${ff2}% + ${s.sp}%. ${s.A} now pays fixed, so it saves the variable payment minus the fixed payment.`],
     why:`Even point: ${s.fx}% − ${s.sp}% = ${be}%. At ${ff2}%: variable = ${r2(ff2+s.sp)}%, so ${s.A} saves ${money(s.n)} × (${r2(ff2+s.sp)}% − ${s.fx}%) = ${sgn(save)}.`}}
  const s=swapCase(r,which!==1),opts=[s.A,s.B,"Neither"];
  return{title:`${s.A} and ${s.B}`,text:swapText(s),facts:[["Loan",money(s.n)],["Variable",`FF + ${s.sp}%`],["Fixed",s.fx+"%"],["Federal Funds Rate",s.ff+"%"]],
   fields:[{k:"bf",label:`${poss(s.A)} yearly interest before the swap`,kind:"money",ans:s.before},{k:"af",label:`${poss(s.A)} yearly interest after the swap`,kind:"money",ans:s.after},
     {k:"w",label:"Who comes out ahead?",kind:"choice",opts,ans:s.win},{k:"g",label:"By how much per year?",kind:"money",ans:s.gap}],
   hints:["Variable rate = Federal Funds Rate + the spread. Yearly interest = loan × rate.",`After the swap, ${s.A} pays the fixed ${s.fx}%. Whoever ends up paying LESS than before comes out ahead, by the difference.`],
   why:swapWhy(s)}
 },
 /* ---------- ALL THREE ---------- */
 full(r,bonus){
  if(bonus){const {items,why}=toolItems(r,4);
    return{title:"Name the tool",wide:true,text:"Futures, option or swap? Name the derivative in each deal.",fields:items,why,
      hints:["Locked-in price for a later trade, no way out: futures. A right you pay a premium for and can skip: option.","Trading a payment that changes for one that stays the same: swap."]}}
  const x=futCase(r),c=x.c,buyer=c.a==="buy";const o=protCase(r,true);const s=swapCase(r,null);const t=toolItems(r,3);
  return{title:"Three Clients",full:true,text:"Your desk has three clients today: a business, an investor and a company with a loan. Take each one all the way, then name the tool.",
   stages:[
    {name:"1. Futures",text:`<b>Client 1: ${c.w}</b> ${buyer?"needs to buy":"will sell"} <b>${fmt(x.q)} ${pl(c,x.q)}</b> of ${c.it}. It hedges at a futures price of <b>${fp(x.F,c)}</b>. At delivery, ${c.it} is <b>${fp(x.S,c)}</b>.`,
     facts:[["Quantity",fmt(x.q)+" "+pl(c,x.q)],["Futures price",fp(x.F,c)],["Delivery price",fp(x.S,c)]],
     fields:[{k:"side",label:"Buy or sell futures?",kind:"choice",opts:SIDE,ans:buyer?SIDE[0]:SIDE[1]},{k:"pnl",label:"Futures gain or loss (− for a loss)",kind:"signed",ans:x.pnl},{k:"eff",label:`Effective ${buyer?"cost":"price"} per ${c.u}`,kind:"cents",ans:x.F}],
     hints:["Buyers buy futures, sellers sell futures. Bought: (Delivery − Futures) × Quantity. Sold: (Futures − Delivery) × Quantity.","A hedge locks in the futures price."],
     why:`${sideWhy(c)} ${futMath(x)}. Effective ${buyer?"cost":"price"}: ${fp(x.F,c)} per ${c.u}, locked in.`},
    {name:"2. Options",text:`<b>Client 2</b> bought <b>100 shares of ${o.tk} at ${px(o.C)}</b> and a <b>protective put</b> with a <b>${px(o.K)} strike</b> for <b>${px(o.p)}</b> per share. ${o.tk} falls to <b>${px(o.S)}</b>.`,
     facts:[["Bought at",px(o.C)],["Put strike",px(o.K)],["Premium",px(o.p)+" per share"],["Price now",px(o.S)]],
     fields:[{k:"pay",label:"Put payoff",kind:"money",ans:o.pay},{k:"net",label:"Net position: stock + payoff − premium (− for a loss)",kind:"signed",ans:o.net}],
     hints:["Put payoff = max(Strike − Price, 0) × 100.","Net = stock gain or loss + put payoff − premium, all × 100 shares."],
     why:`Put: (${px(o.K)} − ${px(o.S)}) × 100 = ${money(o.pay)}. Stock: ${sgn(o.stock)}. Net: ${sgn(o.stock)} + ${money(o.pay)} − ${money(o.prem)} = ${sgn(o.net)}.`},
    {name:"3. Swaps",text:`<b>Client 3:</b> `+swapText(s),
     facts:[["Loan",money(s.n)],["Variable",`FF + ${s.sp}%`],["Fixed",s.fx+"%"],["Federal Funds Rate",s.ff+"%"]],
     fields:[{k:"w",label:"Who comes out ahead?",kind:"choice",opts:[s.A,s.B,"Neither"],ans:s.win},{k:"g",label:"By how much per year?",kind:"money",ans:s.gap}],
     hints:["Variable rate = FF + spread. Compare the variable payment to the fixed payment.","After the swap, the company now paying the cheaper rate comes out ahead, by the difference."],
     why:swapWhy(s)},
    {name:"4. Name the Tool",text:"Last one. Name the derivative in each deal.",fields:t.items,wide:true,
     hints:["Locked-in price, no way out: futures. A right you pay a premium for: option.","Trading a changing payment for a fixed one: swap."],why:t.why}
   ]}
 }
};
/* One main problem per rotation (half the stations get each version), then bonus problems until time. */
const MAIN_COUNT={f1:1,f2:1,o1:1,o2:1,s1:1,s2:1,full:1};
/* Problem k of a set: k=0 and k=1 are the two versions of the skill (call and put, buyer and seller, falls and rises...).
   Half the stations get them in the other order. */
function buildSet(station,bIdx,round){
  const r=rng(station*7919+bIdx*104729+13+SALT),flip=r()<.5?1:0,probs=[];
  for(let k=0;k<MAIN_COUNT[round];k++)probs.push(GEN[round](r,false,(k+flip)%2));
  return{probs,bonus:GEN[round](r,true)}
}
/* Bonus problems never run out: after the main problem, a new one appears every time until the teacher moves on.
   They are QUICK: one answer each, so pairs keep moving. */
const QUICK={
 f1(r){const c=pick(r,FUT);if(r()<.5){const q=pick(r,c.q);
    return{title:"Quick: pick the side",text:`${c.w} ${c.a==="buy"?"needs to buy":"will sell"} ${fmt(q)} ${pl(c,q)} of ${c.it} in ${pick(r,MONTHS)}.`,
     fields:[{k:"q",label:"To hedge, it should",kind:"choice",opts:SIDE,ans:c.a==="buy"?SIDE[0]:SIDE[1]}],why:sideWhy(c),
     hints:["Does it BUY the item or SELL it?","Buyers buy futures. Sellers sell futures."]}}
  const x=futCase(r,c,r()<.5),g=x.pnl>0?"Gain":"Loss";
  return{title:"Quick: gain or loss?",text:`${c.w} ${c.a==="buy"?"bought":"sold"} ${c.it} futures at ${fp(x.F,c)}. At delivery, ${c.it} is ${fp(x.S,c)}.`,
   fields:[{k:"q",label:"The futures position had a",kind:"choice",opts:GL,ans:g}],why:`${futMath(x)}: a ${g.toLowerCase()}.`,
   hints:["Bought futures gain when the price goes UP.","Sold futures gain when the price goes DOWN."]}},
 f2(r){const x=futCase(r),c=x.c;if(r()<.6)
    return{title:"Quick: futures gain or loss",text:`${c.w} ${c.a==="buy"?"bought":"sold"} <b>${fmt(x.q)} ${pl(c,x.q)}</b> of ${c.it} futures at <b>${fp(x.F,c)}</b>. At delivery, ${c.it} is <b>${fp(x.S,c)}</b>.`,
     fields:[{k:"q",label:"Futures gain or loss (− for a loss)",kind:"signed",ans:x.pnl}],why:futMath(x)+".",
     hints:["Bought: (Delivery − Futures) × Quantity. Sold: (Futures − Delivery) × Quantity.",`Start with the price difference: ${fp(x.S,c)} vs. ${fp(x.F,c)}.`]};
  return{title:"Quick: locked-in price",text:`${c.w} hedged ${c.it} with futures at <b>${fp(x.F,c)}</b>. At delivery, ${c.it} is <b>${fp(x.S,c)}</b>.`,
   fields:[{k:"q",label:`Effective ${c.a==="buy"?"cost":"price"} per ${c.u}`,kind:"cents",ans:x.F}],why:`The futures gain or loss makes up the difference, so ${c.w} ends up at the futures price: ${fp(x.F,c)}.`,
   hints:["A hedge locks in a price.","Which price did it lock in?"]}},
 o1(r){const call=r()<.5,K=pick(r,[25,30,40,45,50,60,75,80]),p=pick(r,[1,1.5,2,2.5,3,4]);
  if(r()<.5){const be=call?K+p:K-p;return{title:"Quick: breakeven",text:`A ${call?"call":"put"} with a <b>${px(K)} strike</b> costs a <b>${px(p)} premium</b>.`,
    fields:[{k:"q",label:"Breakeven price",kind:"cents",ans:be}],why:`${call?"Call":"Put"}: ${px(K)} ${call?"+":"−"} ${px(p)} = ${cents(be)}.`,
    hints:["Call breakeven = strike + premium.","Put breakeven = strike − premium."]}}
  const S=call?K+pick(r,[-3,2,4,6,8]):K-pick(r,[-3,2,4,6,8]),pay=Math.max(call?S-K:K-S,0)*100;
  return{title:"Quick: payoff",text:`You own one <b>${px(K)} ${call?"call":"put"}</b> contract (100 shares). At expiration the stock is <b>${px(S)}</b>.`,
   fields:[{k:"q",label:"Option payoff (before the premium)",kind:"money",ans:pay}],why:`max(${call?px(S)+" − "+px(K):px(K)+" − "+px(S)}, 0) × 100 = ${money(pay)}.`,
   hints:[call?"Call payoff = max(Price − Strike, 0).":"Put payoff = max(Strike − Price, 0).","Multiply by 100 shares. Out of the money pays $0."]}},
 o2(r){if(r()<.5){const sh=pick(r,[100,200,300,500,1000]),p=pick(r,[1,1.5,2,2.5,3]),K=pick(r,[40,45,50,60]);
    return{title:"Quick: cost to hedge",text:`You buy puts on <b>${fmt(sh)} shares</b>: <b>${px(K)} strike</b>, <b>${px(p)} premium</b> per share.`,
     fields:[{k:"q",label:"Total cost to hedge",kind:"money",ans:r2(sh*p)}],why:`${fmt(sh)} × ${px(p)} = ${money(sh*p)}. The strike is not a cost.`,
     hints:["You pay the premium on every share.","The strike price is not a cost."]}}
  const x=protCase(r,r()<.6);
  return{title:"Quick: put payoff",text:`You own 100 shares of ${x.tk} with a <b>${px(x.K)} protective put</b>. ${x.tk} is now <b>${px(x.S)}</b>.`,
   fields:[{k:"q",label:"Put payoff",kind:"money",ans:x.pay}],why:`max(${px(x.K)} − ${px(x.S)}, 0) × 100 = ${money(x.pay)}.`,
   hints:["Put payoff = max(Strike − Price, 0) × 100.","Above the strike, the put pays $0."]}},
 s1(r){const s=swapCase(r,null),w=s.win===s.A?"Company A":"Company B";
  return{title:"Quick: who comes out ahead?",text:`Company A pays <b>FF + ${s.sp}%</b>. Company B pays a <b>fixed ${s.fx}%</b>. They swap: A now pays fixed, B now pays variable. FF is <b>${s.ff}%</b>.`,
   fields:[{k:"q",label:"Who comes out ahead?",kind:"choice",opts:["Company A","Company B","Neither"],ans:w}],
   why:`Variable: ${s.ff}% + ${s.sp}% = ${s.vr}% vs. fixed ${s.fx}%. ${s.vr>s.fx?"Variable costs more, so A (now paying fixed) comes out ahead.":"Variable costs less, so B (now paying variable) comes out ahead."}`,
   hints:["Variable rate = FF + spread.","If variable is higher than fixed, the fixed payer wins."]}},
 s2(r){const s=swapCase(r,null);if(r()<.5)
    return{title:"Quick: variable interest",text:`A <b>${money(s.n)}</b> loan pays the <b>Federal Funds Rate + ${s.sp}%</b>. FF is <b>${s.ff}%</b>.`,
     fields:[{k:"q",label:"Yearly interest",kind:"money",ans:s.before}],why:`${money(s.n)} × (${s.ff}% + ${s.sp}%) = ${money(s.n)} × ${s.vr}% = ${money(s.before)}.`,
     hints:["Add the spread to the Federal Funds Rate first.",`Then: ${money(s.n)} × ${s.vr}%.`]};
  return{title:"Quick: how much ahead?",text:`On a <b>${money(s.n)}</b> loan, the variable rate is <b>${s.vr}%</b> and the fixed rate is <b>${s.fx}%</b>.`,
   fields:[{k:"q",label:"Difference in yearly interest",kind:"money",ans:s.gap}],why:`${money(s.n)} × ${s.vr}% = ${money(s.before)}; ${money(s.n)} × ${s.fx}% = ${money(s.after)}. Difference: ${money(s.gap)}.`,
   hints:["Find each yearly payment: loan × rate.","Or: loan × the difference in the rates."]}},
 full(r){if(r()<.4){const [t,a]=pick(r,TOOL_POOL);
    return{title:"Quick: name the tool",text:t,fields:[{k:"q",label:"Which derivative?",kind:"choice",opts:TOOLS,ans:a}],
     why:a==="Futures"?"A price locked today for a later trade: futures.":a==="Option"?"A right, not an obligation, bought with a premium: an option.":"Trading a changing payment for a fixed one: a swap.",
     hints:["Locked-in price, no way out: futures. A right you pay a premium for: option.","Trading a changing payment for a fixed one: swap."]}}
  return QUICK[pick(r,["f1","f2","o1","o2","s1","s2"])](r)}
};
function bonusAt(station,bIdx,round,k){
  return QUICK[round](rng(station*7919+bIdx*104729+977*(k+1)+31+SALT))}

/* ================= kahoot banks ================= */
const KAHOOT={
1:[
 ["A futures contract is:",["An agreement today to buy or sell later at a locked price","The right, but not the obligation, to buy","A trade of fixed and variable payments","Insurance against a default"],0,"It's about a price you lock in now for later."],
 ["A bakery will buy wheat in three months. To hedge, it should:",["Buy wheat futures","Sell wheat futures","Buy a put on wheat","Do nothing"],0,"Buyers are hurt when prices rise. Buyers buy futures."],
 ["A corn farmer will sell her crop at harvest. To hedge, she should:",["Buy corn futures","Sell corn futures","Swap to a fixed rate","Buy a call"],1,"Sellers are hurt when prices fall. Sellers sell futures."],
 ["A business that BUYS a commodity is hurt when its price:",["Rises","Falls","Stays flat","It doesn't matter"],0,"Would you rather pay more or less?"],
 ["An airline bought jet fuel futures. Then fuel prices fall. The futures:",["Lose money, but the airline pays less for fuel","Gain money","Are cancelled","Pay a dividend"],0,"Bought futures gain only when the price goes UP."],
 ["You BOUGHT futures at $6.00. At delivery the price is $6.50. Per unit, the futures:",["Gain $0.50","Lose $0.50","Gain $6.50","Break even"],0,"Bought futures: Delivery − Futures."],
 ["You SOLD futures at $4.50. At delivery the price is $4.00. Per unit, the futures:",["Gain $0.50","Lose $0.50","Lose $4.00","Break even"],0,"Sold futures: Futures − Delivery."],
 ["What does a good futures hedge give a business?",["A known price, wherever the market goes","A guaranteed profit","The lowest possible price","Free insurance"],0,"Hedging is about certainty, not profit."]],
2:[
 ["A call option is the right to:",["Buy at the strike price","Sell at the strike price","Swap payments","Collect a dividend"],0,"Call = buy."],
 ["A put option is the right to:",["Sell at the strike price","Buy at the strike price","Lock in a loan rate","Skip a payment"],0,"Put = sell."],
 ["The price you pay for an option is the:",["Premium","Strike price","Breakeven","Spread"],0,"It's like the $20 sneaker reservation."],
 ["The most an option BUYER can lose is:",["The premium","The strike price","Unlimited","Nothing"],0,"You can always let the option expire."],
 ["Call breakeven =",["Strike + premium","Strike − premium","Premium − strike","Strike × 100"],0,"The stock has to climb past the strike enough to pay back what you paid."],
 ["A $50 put costs $3. Its breakeven price is:",["$47","$53","$50","$3"],0,"Put breakeven = strike − premium."],
 ["You own shares and you're worried the price will drop. Which protects you?",["Buy a put","Buy a call","Buy futures","Pay variable in a swap"],0,"You want the right to SELL at a set price."],
 ["One stock option contract covers:",["100 shares","1 share","10 shares","1,000 shares"],0,"It's a round number. Multiply by it in every payoff."]],
3:[
 ["In an interest rate swap, two companies trade:",["Interest payments","Their loans","Shares of stock","Their credit ratings"],0,"Remember Maya and Jordan trading tips for a paycheck."],
 ["The variable rate on a loan usually moves with the:",["Federal Funds Rate","Stock market","Price of oil","Strike price"],0,"It's the rate the Fed targets."],
 ["A company with a variable loan fears rising rates. After a swap, it wants to pay:",["A fixed rate","A variable rate","Nothing","Twice as much"],0,"It wants a payment that can't go up."],
 ["Rates rise quickly. Who comes out ahead in a fixed-for-variable swap?",["The fixed-rate payer","The variable-rate payer","Both equally","Neither"],0,"Whose payment stays the same while the other grows?"],
 ["A $1,000,000 loan is at FF + 2%. FF is 4%. Yearly interest is:",["$60,000","$40,000","$20,000","$80,000"],0,"Add the rates first: 4% + 2%."],
 ["What's the main reason companies use swaps?",["To turn uncertain payments into predictable ones","To get rid of borrowing costs","To make rates fall","To raise their stock price"],0,"Think predictable payments."],
 ["Lock in the price of wheat you'll buy in May. Which tool?",["Futures","Option","Swap","A bond"],0,"A locked price for a later trade, no way out."],
 ["Pay a premium for the right, but not the obligation, to buy later. Which tool?",["Option","Futures","Swap","A loan"],0,"A right you pay a premium for."]]
};

/* Review Edition Kahoot breaks: new test-style questions. Right answer listed first (index 0); shuffled when shown. */
const KAHOOT_R={
1:[
 ["A cattle ranch will sell its herd in the fall. To hedge, it should:",["Sell cattle futures","Buy cattle futures","Buy a call","Swap to a fixed rate"],0,"Sellers are hurt when prices fall."],
 ["A pizza chain buys cheese every month. To hedge, it should:",["Buy cheese futures","Sell cheese futures","Buy a put","Do nothing"],0,"Buyers are hurt when prices rise."],
 ["You SOLD 10,000 bushels of corn futures at $4.80. At delivery corn is $4.30. The futures:",["Gain $5,000","Lose $5,000","Gain $500","Gain $43,000"],0,"Sold futures: (Futures − Delivery) × Quantity."],
 ["You BOUGHT 20,000 gallons of diesel futures at $3.50. At delivery diesel is $3.90. The futures:",["Gain $8,000","Lose $8,000","Gain $800","Lose $800"],0,"Bought futures: (Delivery − Futures) × Quantity."],
 ["A bakery bought wheat futures at $6.20 and pays $6.90 at the market. What did it really pay per bushel?",["$6.20","$6.90","$0.70","$7.60"],0,"The hedge lands on the locked price."],
 ["A trader with no oil buys oil futures, hoping prices jump. He is:",["Speculating","Hedging","Swapping","Insuring"],0,"No oil to protect."],
 ["If the buyer of a futures contract gains $20,000, the seller:",["Loses $20,000","Gains $20,000","Breaks even","Gets a refund"],0,"One side's gain is the other side's loss."],
 ["A farmer's futures lost money because corn prices rose. Was hedging a mistake?",["No. She sold her corn for more and still got her locked price","Yes. She lost money","Yes. She should have speculated","No. Futures can't lose"],0,"The goal is a known price."]],
2:[
 ["You buy 2 calls, $40 strike, $3 premium. Total cost:",["$600","$300","$6","$8,000"],0,"Premium × 100 × contracts."],
 ["A $45 call costs a $3 premium. Breakeven:",["$48","$42","$45","$300"],0,"Strike + premium."],
 ["An $80 put costs a $5 premium. Breakeven:",["$75","$85","$80","$500"],0,"Strike − premium."],
 ["1 call, $40 strike, $3 premium. The stock closes at $48. Profit:",["$500","$800","$300","$1,100"],0,"(Close − Strike − Premium) × 100."],
 ["1 call, $60 strike, $4 premium. The stock closes at $57. Result:",["Lose $400","Lose $300","Make $300","Lose $700"],0,"Below the strike, the call pays $0."],
 ["You own 100 shares bought at $60 and buy a $55 put for $2. The most you can lose:",["$700","$500","$200","$5,500"],0,"(Purchase − Strike + Premium) × 100."],
 ["Why can calls give a bigger percent return than shares?",["A small premium controls 100 shares","Calls never lose","Calls pay dividends","Shares can't rise"],0,"Leverage."],
 ["You spend all your money on calls and the stock doesn't move. You:",["Lose the entire premium","Break even","Double your money","Must buy the shares"],0,"Leverage cuts both ways."]],
3:[
 ["A $5,000,000 loan is swapped to a fixed 6%. Yearly payment:",["$300,000","$30,000","$600,000","$3,000,000"],0,"Loan × rate."],
 ["A $5,000,000 loan pays FF + 2%. FF is 3%. Yearly variable payment:",["$250,000","$150,000","$300,000","$100,000"],0,"Add the rates first: 3% + 2%."],
 ["Fixed is $300,000; variable would be $250,000. The swap:",["Hurt by $50,000","Helped by $50,000","Hurt by $250,000","Made no difference"],0,"Compare the two payments."],
 ["Fixed is $300,000; after a rate hike, variable would be $375,000. The swap:",["Helped by $75,000","Hurt by $75,000","Helped by $375,000","Made no difference"],0,"The fixed payment didn't move."],
 ["Rates FALL. Who comes out ahead in a fixed-for-variable swap?",["The variable-rate payer","The fixed-rate payer","Neither","Both"],0,"Variable payments shrink."],
 ["In a swap, the loan amounts themselves:",["Never change hands","Are traded every year","Are traded at the end","Double"],0,"Only interest payments are traded."],
 ["Lock in the price of diesel you'll buy in May, no way out. Which tool?",["Futures","Option","Swap","A bond"],0,"Locked price, both sides must follow through."],
 ["Protect shares you own from a drop but keep the upside. Which tool?",["A put option","Sell futures","A swap","A call option"],0,"The right to sell at the strike."]]
};
/* ================= formula card overlay ================= */
function formulaOverlay(){
  const o=document.createElement("div");o.className="ovl";
  const card=(h,lines)=>`<div class="fcard"><h3>${h}</h3>${lines.map(l=>`<div class="fl">${l}</div>`).join("")}</div>`;
  o.innerHTML=`<div class="box"><div class="row" style="justify-content:space-between"><h2>Formula Card</h2><button class="btn sec" id="xx">Close</button></div>
   <div class="fgrid">
   ${card("Futures",["<b>Buyers buy futures.</b> Sellers sell futures.","Bought futures: (Delivery price − Futures price) × Quantity","Sold futures: (Futures price − Delivery price) × Quantity","Effective price = the futures price. That's the lock-in.","Contracts = Quantity ÷ contract size"])}
   ${card("Options",["Call = right to <b>buy</b>. Put = right to <b>sell</b>.","Call payoff: max(Price − Strike, 0)","Put payoff: max(Strike − Price, 0)","Net = payoff − premium. One contract = 100 shares.","Call breakeven = Strike + premium","Put breakeven = Strike − premium","Protective put net = stock gain/loss + put payoff − premium"])}
   ${card("Swaps",["Variable rate = Federal Funds Rate + spread","Yearly interest = loan × rate","After the swap, A pays B's fixed rate and B pays A's variable rate.","Variable higher than fixed: the fixed payer comes out ahead.","Even when FF = fixed − spread"])}
   </div></div>`;
  o.querySelector("#xx").onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o);
}
$("#pvBtn").onclick=formulaOverlay;

const ACCTS=[];
/* ================= live game ================= */
const ROLE=window.TIB_ROLE||"station";
const MOCK=/[?&]mock=1/.test(location.search);
const GAME=REVIEW?"teachback-deriv-review":"teachback-deriv";
const TEACH_X=3; // teachers earn triple

/* ---------- backend (same database as the other live games) ---------- */
function mockNet(){
  const KEY=REVIEW?"tibReviewMock":"tibLiveMock",bc=("BroadcastChannel" in window)?new BroadcastChannel(KEY):null,subs=[];
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return{}}};
  const write=t=>{localStorage.setItem(KEY,JSON.stringify(t));fire();if(bc)bc.postMessage(1)};
  const at=(t,p)=>p.split("/").filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],t);
  const put=(t,p,v)=>{const ks=p.split("/").filter(Boolean);let o=t;ks.slice(0,-1).forEach(k=>{if(typeof o[k]!=="object"||o[k]===null)o[k]={};o=o[k]});if(v===null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v};
  const fire=()=>{const t=read();subs.forEach(s=>{const v=JSON.stringify(at(t,s.p)??null);if(v!==s.last){s.last=v;s.cb(JSON.parse(v))}})};
  if(bc)bc.onmessage=fire;window.addEventListener("storage",e=>{if(e.key===KEY)fire()});
  return{kind:"mock",
    get:async p=>at(read(),p)??null,
    set:async(p,v)=>{const t=read();if(p.split("/").filter(Boolean).length===2&&at(t,p))throw new Error("Code in use");put(t,p,v);write(t)},
    update:async(p,o)=>{const t=read();Object.entries(o).forEach(([k,v])=>put(t,p+"/"+k,v));write(t)},
    remove:async p=>{const t=read();put(t,p,null);write(t)},
    on:(p,cb)=>{const s={p,cb,last:undefined};subs.push(s);setTimeout(fire,0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}}};
}
async function vercelNet(){
  const call=async(op,path,v)=>{const r=await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op,path,v})});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||r.status);return j};
  try{const p=await call("ping");if(!p.ok)return null}catch(e){return null}
  return{kind:"vercel",
    get:async p=>(await call("get",p)).v??null,
    set:(p,v)=>call("set",p,v),
    update:(p,o)=>call("update",p,o),
    remove:p=>call("remove",p),
    on:(p,cb)=>{let last,stop=false,t;
      const tick=async()=>{if(stop)return;
        if(!document.hidden){try{const v=(await call("get",p)).v??null,s=JSON.stringify(v);if(s!==last){last=s;cb(v)}}catch(e){}}
        if(!stop)t=setTimeout(tick,1500)};
      tick();return()=>{stop=true;clearTimeout(t)}}};
}
let NET=null;
async function net(){if(NET)return NET;NET=MOCK?mockNet():await vercelNet();return NET}
function needSetup(){app.innerHTML=`<div class="panel"><h2>${ROLE==="teacher"?"Class games need a one-time setup":"The game isn't open yet"}</h2><p>${ROLE==="teacher"?"This uses the same Upstash for Redis database as the other live games on this site. Connect it to the Vercel project, then reload.":"Ask your teacher to start the game, then reload this page."}</p><button class="btn" onclick="location.reload()">Reload</button></div>`}
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
function beep(f,d){try{const c=beep.c||(beep.c=new (window.AudioContext||window.webkitAudioContext)());const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(c.destination);const t=c.currentTime;g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}

/* ---------- who is where ---------- */
// Stayers never move. Movers slide up one station number every rotation (the last station wraps to Station 1).
// Kahoot breaks keep the pair from the rotation before.
function rotOf(bIdx){for(let i=bIdx;i>=0;i--)if(SCHED[i].type==="rot")return SCHED[i].rot;return 1}
function moverStartAt(station,rot,N){return((station-1-(rot-1))%N+N)%N+1}
function pairAt(recs,station,bIdx,N){
  const st=recs&&recs["s"+station];if(!st||!N)return null;
  const m=recs["s"+moverStartAt(station,rotOf(bIdx),N)];
  return{stay:[st.stay,st.stay2,st.stay3].filter(Boolean),move:m&&m.move?m.move:"(mover)"}}
function roster(recs){const n=[];Object.values(recs||{}).forEach(r=>{[r.stay,r.stay2,r.stay3,r.move].forEach(x=>{if(x&&!n.includes(x))n.push(x)})});return n}
function standings(recs,N){
  const tot={},tch={};roster(recs).forEach(n=>{tot[n]=0;tch[n]=0});
  const add=(n,p,t)=>{if(!(n in tot))return;tot[n]+=p;if(t)tch[n]+=p};
  Object.values(recs||{}).forEach(r=>{Object.entries(r.res||{}).forEach(([b,v])=>{b=+b;const blk=SCHED[b];const pts=(v&&v.pts)||0;if(!blk||!pts)return;
    const pr=pairAt(recs,r.station,b,N);if(!pr)return;
    if(blk.type==="kahoot"){pr.stay.forEach(n=>add(n,pts));add(pr.move,pts)}
    else if(blk.type==="rot"&&teachAt(blk,r.station,N)==="co"){pr.stay.forEach(n=>add(n,pts));add(pr.move,pts)}
    else if(blk.type==="rot"){const stayT=blk.teach==="stay";pr.stay.forEach(n=>add(n,stayT?pts*TEACH_X:pts,stayT));add(pr.move,stayT?pts:pts*TEACH_X,!stayT)}})});
  const G=(H&&H.state)||LIVE.state||{},GC=H?H.code:GCODE;
  (G.revealed||[]).forEach(k=>{const [b,p]=k.split("_").map(Number);if(!SCHED[b]||SCHED[b].type!=="def")return;
    const {pts}=defScores(recs,b,p,GC,G.hide);
    Object.entries(pts).forEach(([st,v])=>{const pr=pairAt(recs,+st,b,N);if(!pr)return;pr.stay.forEach(n=>add(n,v));add(pr.move,v)})});
  return{tot,tch}}
function ranks(val){const ids=Object.keys(val).sort((a,b)=>val[b]-val[a]);const r={};let k=0,prev=null;ids.forEach((id,i)=>{if(val[id]!==prev){k=i+1;prev=val[id]}r[id]=k});return r}

/* ============================================================ STATION (iPad) */
let ME=null; // {code,station}
let CUR=null; // {block} currently rendered
let LIVE={state:null,recs:{}};
let KTIMER=null;
const SKEY=REVIEW?"tibReviewPlayer":"tibPlayer";
function lkey(b){return `tib${REVIEW?"r":""}_${ME.code}_s${ME.station}_b${b}`}
let GCODE="";
function normName(n){return String(n||"").trim().replace(/\s+/g," ").toLowerCase()}
async function joinForm(err){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  CUR=null;
  const sess=store.get(SKEY,null)||{};const qc=params.get("code");
  const code0=qc&&/^\d{4}$/.test(qc)?qc:(sess.code||"");
  $("#ttl").innerHTML=`Teach It Back: <span>${TNAME}</span>`;
  app.innerHTML=`<div class="panel" style="max-width:640px;margin:0 auto"><h1 style="font-size:38px;margin-bottom:6px">Join Teach It Back</h1>
   <p class="muted">Type your name. Your teacher will put you at a station with a partner.</p>
   <div class="fld"><label>Game code</label><input id="jc" inputmode="numeric" maxlength="4" value="${esc(code0)}" style="text-align:center;letter-spacing:.2em"></div>
   <div class="fld"><label>Your name</label><input id="jn" style="text-align:left" placeholder="First name, last initial" value="${esc(sess.name||"")}" autocomplete="off"></div>
   <div id="jerr" style="color:var(--red);font-weight:700;margin-top:10px">${err||""}</div>
   <div class="acts"><button class="btn" id="jgo">Join</button></div></div>`;
  if(!code0)$("#jc").focus();else $("#jn").focus();
  $("#jn").onkeydown=e=>{if(e.key==="Enter")$("#jgo").click()};
  $("#jgo").onclick=async()=>{
    const code=$("#jc").value.trim(),name=$("#jn").value.trim().replace(/\s+/g," ");
    if(!/^\d{4}$/.test(code))return $("#jerr").textContent="Type the 4-digit code from the board.";
    if(name.length<2)return $("#jerr").textContent="Type your first name and last initial.";
    $("#jgo").disabled=true;
    try{const g=await N.get("games/"+code);if(!g||g.game!==GAME){$("#jgo").disabled=false;return $("#jerr").textContent="No Teach It Back game with that code."}
      const same=Object.values(g.players||{}).find(r=>r&&r.pid&&normName(r.name)===normName(name));
      const pid=same?same.pid:"p"+Math.floor(100000+Math.random()*900000);
      if(!same)await N.set(`games/${code}/players/${pid}`,{pid,name,t:Date.now()});
      const sess={code,pid,name:same?same.name:name};store.set(SKEY,sess);startDevice(sess)}
    catch(e){$("#jgo").disabled=false;$("#jerr").textContent="Couldn't reach the game. Check the Wi-Fi and try again."}};
}
let DEV=null; // {code,pid,name,off}
async function startDevice(s0){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  const s=s0||store.get(SKEY,null);if(!s||!s.code||!s.pid)return joinForm();
  if(DEV&&DEV.off)DEV.off();
  DEV={...s};GCODE=s.code;
  $("#homeBtn").textContent="↻ Rejoin";$("#homeBtn").style.display="";$("#homeBtn").onclick=()=>{if(DEV&&DEV.off)DEV.off();CUR=null;ME=null;joinForm()};
  try{LIVE.recs=(await N.get(`games/${s.code}/players`))||{}}catch(e){}
  DEV.off=N.on(`games/${s.code}/state`,st=>{LIVE.state=st;deviceRender()});
}
function deviceRender(){
  const st=LIVE.state;
  if(!st){CUR=null;app.innerHTML=`<div class="panel center"><h2>This game has ended or the code is wrong.</h2><div class="acts" style="justify-content:center"><button class="btn" id="rj">Join another game</button></div></div>`;$("#rj").onclick=()=>joinForm();return}
  const seat=st.assign&&st.assign.seats&&st.assign.seats[DEV.pid];
  if(!seat){CUR=null;ME=null;syncClock();
    $("#ttl").innerHTML=`${esc(DEV.name)} &nbsp;·&nbsp; <span>Teach It Back</span>`;
    app.innerHTML=`<div class="panel center"><h1 style="font-size:40px">You're in, ${esc(DEV.name)}!</h1><p style="font-size:1.2em">${st.phase==="lobby"?"Waiting for your teacher to set up the stations.":"Your teacher will add you to a station in a moment."}</p><p class="muted">Grab a whiteboard, a marker and a calculator.</p></div>`;return}
  if(seat.primary){
    if(!ME||ME.station!==seat.station){CUR=null;ME={code:DEV.code,station:seat.station}}
    $("#ttl").innerHTML=`Station ${ME.station} &nbsp;·&nbsp; <span>Teach It Back</span>`;
    return stationRender()}
  ME=null;CUR=null;companionRender(seat);
}
function seatNow(seat,bIdx,N){if(seat.role!=="move")return seat.station;return((seat.station-1)+(rotOf(bIdx)-1))%N+1}
function companionRender(seat){
  const st=LIVE.state;syncClock();
  const go=()=>net().then(N=>N.get(`games/${DEV.code}/players`)).then(r=>{LIVE.recs=r||LIVE.recs;draw()}).catch(draw);
  const draw=()=>{
    const recs=LIVE.recs,N=st.stations,home=recs["s"+seat.station]||{};
    $("#ttl").innerHTML=`${esc(DEV.name)} &nbsp;·&nbsp; <span>Teach It Back</span>`;
    if(st.phase==="lobby"){
      app.innerHTML=`<div class="panel center"><div class="muted" style="font-size:1.2em">You're a <b>${seat.role==="move"?"MOVER":"STAYER"}</b>. Start at</div><div class="osw" style="font-size:120px;line-height:1;color:var(--red)">Station ${seat.station}</div>
       <p style="font-size:1.2em">${seat.role==="move"?`You start with <b>${esc(home.stay)}</b>${home.stay2?" and <b>"+esc(home.stay2)+"</b>":""}. Every rotation you move up one station. This screen always tells you where to go.`:`You stay here all game with <b>${esc(home.stay)}</b>. Work on ${esc(home.stay)}'s iPad.`}</p>
       <p class="muted">Work on the station iPad (the stayer's). Keep this screen open to see where to go.</p></div>`;return}
    if(st.phase==="end"){app.innerHTML=`<div class="panel center"><h1 style="font-size:44px">That's the game!</h1><p style="font-size:1.2em">Eyes on the board for the final standings.</p></div>`;return}
    const b=SCHED[st.block],at=seatNow(seat,st.block,N),pr=pairAt(recs,at,st.block,N)||{stay:[],move:""},host=recs["s"+at]||{};
    const mates=[...pr.stay,pr.move].filter(n=>n&&normName(n)!==normName(DEV.name));
    let role="";
    if(b.type==="rot"&&teachAt(b,at,N)==="co")role=`<div style="border-radius:12px;padding:14px 18px;color:#fff;background:var(--k2);font-size:1.2em;margin-top:12px"><b class="osw" style="font-size:1.5em;display:block">${REVIEW?"Solve it together · both earn the points":"Learn it together · 1× points"}</b>${REVIEW?"Work every problem as a team. Next rotation you get a new partner.":"You're both learners. Next rotation, one of you teaches it."}</div>`;
    else if(b.type==="rot"){const teach=(b.teach==="move")===(seat.role==="move");
      role=`<div class="${teach?"te":"le"}" style="border-radius:12px;padding:14px 18px;color:#fff;background:${teach?"var(--ink)":"var(--red)"};font-size:1.2em;margin-top:12px"><b class="osw" style="font-size:1.5em;display:block">${teach?"You're the TEACHER · 3× points":"You're the LEARNER · 1× points"}</b>${teach?"Coach on the whiteboard. Don't touch the iPad.":"Work it out on the whiteboard, then type it in."}</div>`}
    else role=`<div style="border-radius:12px;padding:14px 18px;color:#fff;background:var(--k2);font-size:1.2em;margin-top:12px"><b class="osw" style="font-size:1.5em;display:block">${b.type==="kahoot"?"Kahoot Break":"Define It"}: you're teammates</b>You both get the points.</div>`;
    const {tot}=standings(recs,N),mine=tot[[home.stay,home.stay2,home.stay3,home.move].includes(DEV.name)?DEV.name:""];
    app.innerHTML=`<div class="panel center"><div class="muted" style="font-size:1.1em">${b.type==="rot"?b.label+": "+ROUNDS[roundAt(b,at,N)].name:b.label}</div>
      <div class="muted" style="font-size:1.3em;margin-top:10px">${seat.role==="move"&&b.type==="rot"?"Go to":"You're at"}</div><div class="osw" style="font-size:130px;line-height:1;color:var(--red)">Station ${at}</div>
      <p style="font-size:1.3em;margin:8px 0">Partner: <b>${mates.map(esc).join(" & ")||"your partner"}</b></p><p style="font-size:1.1em;margin:0" class="muted">Work on ${esc(host.stay||"the stayer")}'s iPad</p>${role}
      ${mine!=null?`<p style="font-size:1.15em;margin-top:14px">Your points so far: <b>${fmt(mine)}</b></p>`:""}</div>`;
  };
  go();
}
function stationRender(){
  const st=LIVE.state;
  syncClock();
  if(st.phase==="lobby"){CUR=null;const me=LIVE.recs["s"+ME.station]||{};
    app.innerHTML=`<div class="panel center"><div class="muted" style="font-size:1.2em">You're a <b>STAYER</b>. You sit at</div><div class="osw" style="font-size:120px;line-height:1;color:var(--red)">Station ${ME.station}</div><p style="font-size:1.2em">all game${me.stay2?" with <b>"+esc(me.stay2)+"</b>":""}. <b>Your iPad is the station iPad.</b> Leave it on this desk.</p><p style="font-size:1.1em">Your first partner: <b>${esc(me.move||"")}</b></p><p class="muted">Get a whiteboard, marker and calculator. The game starts from the board.</p></div>`;
    net().then(N=>N.get(`games/${ME.code}/players`)).then(r=>{LIVE.recs=r||LIVE.recs}).catch(()=>{});return}
  if(st.phase==="end"){CUR=null;clearInterval(KTIMER);app.innerHTML=`<div class="panel center"><h1 style="font-size:44px">That's the game!</h1><p style="font-size:1.2em">Eyes on the board for the final standings.</p></div>`;return}
  const isDef=SCHED[st.block].type==="def",key=isDef?`${st.block}|${st.dp||0}|${st.dph||"write"}|${JSON.stringify((st.hide||{})[defKey(st.block,st.dp||0)]||[])}`:String(st.block);
  if(CUR&&CUR.key===key)return; // already showing this
  clearInterval(KTIMER);CUR={block:st.block,key};
  net().then(N=>N.get(`games/${ME.code}/players`)).then(r=>{LIVE.recs=r||LIVE.recs;draw()}).catch(draw);
  function draw(){if(!CUR||CUR.key!==key)return;const t=SCHED[st.block].type;t==="kahoot"?kahoot(st.block):t==="def"?defBlock(st.block):rotation(st.block)}
}
let CLOCK=null;
function syncClock(){
  let el=$("#clk");if(!el){el=document.createElement("span");el.id="clk";el.className="tb osw";el.style.fontSize="20px";$(".top").insertBefore(el,$("#pvBtn"))}
  clearInterval(CLOCK);const st=LIVE.state||{};
  const paint=()=>{if(!st.timerEnd&&st.paused==null){el.style.display="none";return}el.style.display="";const ms=st.paused!=null?st.paused:st.timerEnd-Date.now();el.textContent="⏱ "+mmss(ms/1000);el.style.background=ms<60000?"var(--red)":"#2b2b2b"};
  paint();CLOCK=setInterval(paint,500);
}
function pushResult(bIdx,obj){net().then(N=>N.update(`games/${ME.code}/players/s${ME.station}`,{["res/"+bIdx]:obj})).catch(()=>{})}
function names(bIdx){const N=LIVE.state&&LIVE.state.stations;return pairAt(LIVE.recs,ME.station,bIdx,N)||{stay:["The stayer"],move:"The mover"}}

/* ---------- hints ---------- */
// Hint 1 cuts what the problem is worth in half. Hint 2 cuts it to a quarter.
const HINT_MULT=[1,.5,.25];
function hintsHTML(){return `<div class="hintbox" id="hb"></div>`}
function mountHints(hints,base,used,onUse){
  const box=$("#hb");if(!box||!hints||!hints.length)return;
  const draw=()=>{const now=Math.round(base*HINT_MULT[used]);
    box.innerHTML=`<div class="worth">Worth now: <b>${now}</b> pts${used?` <span class="muted">(hints used: ${used})</span>`:""}</div>`+
      hints.slice(0,used).map((h,i)=>`<div class="hint"><b>Hint ${i+1}:</b> ${h}</div>`).join("")+
      (used<hints.length?`<button class="btn hbtn" id="hbtn">💡 Hint ${used+1}: drops this to ${Math.round(base*HINT_MULT[used+1])} pts</button>`:"");
    const b=$("#hbtn");if(b)b.onclick=()=>{used++;onUse(used);draw()}};
  draw();
}
/* ---------- worked example (learn-together rotations) ---------- */
function exampleHTML(round,seed){
  const p=GEN[round](rng(seed),false,seed%2);
  const parts=p.stages?p.stages:[p];
  const body=parts.map(sg=>`${sg.name?`<div class="osw" style="margin-top:8px">${sg.name}</div>`:""}${p.stages&&sg.text?`<p style="margin:4px 0">${sg.text}</p>`:""}${(sg.fields||[]).map(f=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid #eee;padding:3px 0;flex-wrap:nowrap"><span>${f.label}</span><b style="white-space:nowrap">${ansText(f)}</b></div>`).join("")}
    <p class="muted" style="font-size:.9em">${sg.why}</p>`).join("");
  return `<div class="panel" style="border:3px solid var(--k2)"><div class="osw" style="color:var(--k2);font-size:1.1em;letter-spacing:.08em">WORKED EXAMPLE · FREE</div><div class="co" style="font-family:Oswald,'Arial Narrow',Arial,sans-serif;font-size:1.3em;color:var(--red)">${p.title}</div><p>${p.text}</p>${p.facts?`<dl class="facts">${p.facts.map(([a,c])=>`<dt>${a}</dt><dd>${c}</dd>`).join("")}</dl>`:""}<div style="margin-top:10px">${body}</div></div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#exBtn");if(!b)return;const box=$("#exBox");if(!box)return;
  if(box.innerHTML){box.innerHTML="";b.textContent="📖 Show a worked example"}else{const [rk,seed]=b.dataset.ex.split("|");box.innerHTML=exampleHTML(rk,+seed);b.textContent="📖 Hide the worked example"}});
/* ---------- rotation ---------- */
const MAIN_PTS=100,BONUS_PTS=20;
function rotation(bIdx){
  const SN=LIVE.state&&LIVE.state.stations,b=SCHED[bIdx],RK=roundAt(b,ME.station,SN),R=ROUNDS[RK];
  const set=buildSet(ME.station,bIdx,RK);
  let st=store.get(lkey(bIdx),null)||{pts:[],bonus:null,bonusPts:0,finished:false,idx:0,inBonus:false};
  const total=()=>st.pts.reduce((a,c)=>a+(c||0),0)+(st.bonusPts||0);
  if(st.finished&&!st.sub)st.sub=true; // older saves
  st.bk=st.bk||0;
  const save=()=>{if(st.idx>=set.probs.length)st.sub=true;store.set(lkey(bIdx),st);pushResult(bIdx,{pts:total(),done:!!st.sub,bon:st.bk})};
  const per=Math.round(MAIN_PTS/set.probs.length);
  const live=()=>CUR&&CUR.block===bIdx;
  $("#ttl").innerHTML=`Station ${ME.station} · ${b.label}: <span>${R.name}</span>`;
  const nm=names(bIdx),TT=teachAt(b,ME.station,SN),stay=TT==="stay",co=TT==="co";
  const tName=stay?nm.stay.join(" & "):nm.move,lName=stay?nm.move:nm.stay.join(" & ");
  const roleHTML=()=>co?`<div class="role"><div class="le" style="grid-column:span 2;background:var(--k2)"><small>${REVIEW?"SOLVE IT TOGETHER · both earn the points":"LEARN IT TOGETHER · both earn 1×"}</small><b>${esc([...nm.stay,nm.move].join(" & "))}</b><small>${REVIEW?`Review: work it out as a team and make sure you BOTH can explain the answer. New partner next rotation.`:`You're both learners this time. Next rotation one of you teaches ${esc(R.name)} to a new partner, so make sure you BOTH can do it.`} <button class="btn" id="exBtn" data-ex="${RK}|${ME.station*97+bIdx*13+5}" style="background:#fff;color:var(--k2);padding:6px 12px;margin-left:8px;font-size:.95em">📖 Show a worked example</button></small></div></div><div id="exBox"></div>`:`<div class="role"><div class="te"><small>TEACHER · earns ${TEACH_X}× points</small><b>${esc(tName)}</b><small>${stay?"Stays here":"Just moved here"}. Coach on the whiteboard. Don't touch the iPad.</small></div>
    <div class="le"><small>LEARNER · earns 1× points</small><b>${esc(lName)}</b><small>${stay?"Just moved here":"Stays here"}. Work it out on the whiteboard, then type it in.</small></div></div>`;
  function draw(){
    if(!live())return;
    if(st.idx>=set.probs.length){if(!st.sub)save();return problem(bonusAt(ME.station,bIdx,RK,st.bk),true)}
    problem(set.probs[st.idx],false);
  }
  function progress(){return `<div class="prog">${set.probs.map((p,k)=>{const v=st.pts[k];return `<i class="${v==null?(k===st.idx?"on":""):v>=per?"ok":v>0?"half":"miss"}"></i>`}).join("")}${st.sub?`<span class="tag" style="background:var(--ok);color:#fff;margin-left:4px">✓ Submitted</span><span class="tag">Bonus ${st.bk+1} · ${st.bonusPts||0} bonus pts</span>`:""}<span class="muted" style="margin-left:auto;font-size:.85em">So far: <b>${total()}</b> pts · teacher gets ${total()*TEACH_X}</span></div>`}
  function problem(p,isBonus){
    const worth=isBonus?BONUS_PTS:(st.idx===set.probs.length-1?MAIN_PTS-per*(set.probs.length-1):per);
    if(p.full)return fullProblem(p,worth);
    let tries=0;st.h=st.h||{};const hk=isBonus?"b"+st.bk:"p"+st.idx;let used=st.h[hk]||0;
    app.innerHTML=`${roleHTML()}<div class="panel">${progress()}
      <div class="work" style="${p.wide?"grid-template-columns:1fr":""}">
       <div class="prob">${isBonus&&st.bk===0?`<div class="fb ok" style="margin:0 0 12px"><b>Main problem submitted: ${total()} points.</b> Keep going! Quick bonus questions keep coming until your teacher moves on. Each one is worth up to ${BONUS_PTS} more points.</div>`:""}<div class="co">${isBonus?"BONUS "+(st.bk+1)+": ":""}${p.title}${isBonus?'<span class="tag">+'+BONUS_PTS+' bonus</span>':""}</div><p>${p.text}</p>${p.facts?`<dl class="facts">${p.facts.map(([a,c])=>`<dt>${a}</dt><dd>${c}</dd>`).join("")}</dl>`:""}${hintsHTML()}</div>
       <div>${fieldsHTML(p.fields,p.wide)}${p.je?jeHTML(p.je):""}
        <div id="fb"></div><div class="acts"><button class="btn" id="chk">Check</button><button class="btn sec" id="nx" style="display:none">Next</button></div></div>
      </div></div>`;
    mountHints(p.hints,worth,used,u=>{used=u;st.h[hk]=u;store.set(lkey(bIdx),st)});
    $("#chk").onclick=()=>{
      tries++;const r=grade(p.fields,p.je);
      if(r.ok){const w=Math.round(worth*HINT_MULT[used]);const got=tries===1?w:Math.round(w/2);$("#hbtn")&&$("#hbtn").remove();
        $("#fb").innerHTML=`<div class="fb ok"><b>Correct! +${got} points${tries>1?" (second try)":""}.</b><br>${p.why}</div>`;finish(got)}
      else if(tries<2){$("#fb").innerHTML=`<div class="fb no"><b>Not yet.</b> The red boxes are off. Teacher: find the mistake on the whiteboard, then try once more for half points.</div>`}
      else{$("#hbtn")&&$("#hbtn").remove();showAnswers(p.fields,p.je);$("#fb").innerHTML=`<div class="fb show"><b>Here's how it works.</b> Teacher: walk through it before moving on.<br>${p.why}</div>`;finish(0)}
    };
    function finish(got){
      $("#chk").style.display="none";$("#nx").style.display="";
      if(isBonus){st.bonusPts=(st.bonusPts||0)+got;st.bk++}else{st.pts[st.idx]=got;st.idx++}
      save();
      $("#nx").textContent=isBonus||st.idx>=set.probs.length?"Next bonus problem":"Next";
      $("#nx").onclick=()=>draw();
    }
  }
  function fullProblem(p,worth){
    const stageW=Math.round(worth/p.stages.length);
    let s=st.fullStage||0,earned=st.fullEarned||0;
    const one=()=>{
      if(!live())return;
      const sg=p.stages[s];let tries=0;st.h=st.h||{};const hk="f"+st.idx+"_"+s;let used=st.h[hk]||0;
      app.innerHTML=`${roleHTML()}<div class="panel">${progress()}<div class="steps">${p.stages.map((x,k)=>`<span class="${k<s?"ok":k===s?"on":""}">${x.name}</span>`).join("")}</div>
       <div class="work" style="${sg.wide?"grid-template-columns:1fr":""}"><div class="prob"><div class="co">${p.title}</div><p>${sg.text||p.text}</p>${(sg.facts||p.facts)?`<dl class="facts">${(sg.facts||p.facts).map(([a,c])=>`<dt>${a}</dt><dd>${c}</dd>`).join("")}</dl>`:""}${hintsHTML()}</div>
       <div>${fieldsHTML(sg.fields,sg.wide)}${sg.je?jeHTML(sg.je):""}<div id="fb"></div><div class="acts"><button class="btn" id="chk">Check</button><button class="btn sec" id="nx" style="display:none">Next step</button></div></div></div></div>`;
      mountHints(sg.hints,stageW,used,u=>{used=u;st.h[hk]=u;store.set(lkey(bIdx),st)});
      $("#chk").onclick=()=>{tries++;const r=grade(sg.fields,sg.je);
        if(r.ok){const w=Math.round(stageW*HINT_MULT[used]);const got=tries===1?w:Math.round(w/2);$("#hbtn")&&$("#hbtn").remove();earned+=got;$("#fb").innerHTML=`<div class="fb ok"><b>Correct! +${got}.</b><br>${sg.why}</div>`;fin()}
        else if(tries<2)$("#fb").innerHTML=`<div class="fb no"><b>Not yet.</b> Fix the red boxes for half points.</div>`;
        else{$("#hbtn")&&$("#hbtn").remove();showAnswers(sg.fields,sg.je);$("#fb").innerHTML=`<div class="fb show"><b>Here's how it works.</b> Use these numbers for the next step.<br>${sg.why}</div>`;fin()}};
      function fin(){$("#chk").style.display="none";$("#nx").style.display="";st.fullStage=s+1;st.fullEarned=earned;st.pts[st.idx]=earned;save();
        $("#nx").onclick=()=>{s++;if(s>=p.stages.length){st.pts[st.idx]=earned;st.idx++;st.fullStage=0;st.fullEarned=0;save();draw()}else one()}}
    };one();
  }
  function mainDone(){
    app.innerHTML=`${roleHTML()}<div class="panel center">${progress()}<h2 style="font-size:32px">Main problems done: ${total()} points</h2>
     <p>Still have time? Try the <b>bonus problem</b> for up to ${BONUS_PTS} more points. If time is called first, the iPad moves on by itself.</p>
     <div class="acts" style="justify-content:center"><button class="btn gold" id="bon">Bonus problem</button><button class="btn sec" id="fin">Finish without bonus</button></div></div>`;
    $("#bon").onclick=()=>{st.inBonus=true;save();draw()};
    $("#fin").onclick=()=>{st.finished=true;save();draw()};
  }
  function receipt(){
    const t=total();
    app.innerHTML=`${roleHTML()}<div class="panel center"><h2 style="font-size:30px">${b.label} complete</h2><p class="muted">${t-(st.bonusPts||0)} main + ${st.bonusPts||0} bonus</p>
     <div class="row" style="justify-content:center;gap:40px;margin:14px 0"><div><div class="muted">${esc(tName)} (teacher)</div><div class="big">+${t*TEACH_X}</div></div><div><div class="muted">${esc(lName)} (learner)</div><div class="big">+${t}</div></div></div>
     <p class="muted">Points are already on the class scoreboard. Wait for the signal to rotate.</p></div>`;
  }
  draw();
}

/* ---------- answer forms ---------- */
function fieldsHTML(fields,wide){
  if(!fields||!fields.length)return "";
  return `<div style="${wide?"display:grid;grid-template-columns:1fr 1fr;column-gap:22px":""}">`+fields.map(f=>`<div class="fld"><label>${f.label}</label>${f.kind==="choice"
    ?`<select data-k="${f.k}"><option value="">Choose</option>${f.opts.map(o=>`<option>${o}</option>`).join("")}</select>`
    :`<input data-k="${f.k}" ${f.kind==="signed"?'inputmode="text" autocapitalize="off" spellcheck="false"':'inputmode="decimal"'} autocomplete="off" placeholder="${f.kind==="rate"?"%":f.kind==="int"?"#":f.kind==="cents"?"$0.00":f.kind==="signed"?"+ or − $":"$"}">`}</div>`).join("")+`</div>`;
}
function jeHTML(je){
  const rows=je.lines.length+(je.lines.length<3?1:0);
  let h=`<div class="jelbl">${je.label}</div><table class="je"><tr><th>Account</th><th>Debit</th><th>Credit</th></tr>`;
  for(let k=0;k<rows;k++)h+=`<tr data-r="${k}"><td><select><option value="">Account</option>${ACCTS.map(a=>`<option>${a}</option>`).join("")}</select></td><td class="a"><input inputmode="decimal" class="dr"></td><td class="a"><input inputmode="decimal" class="cr"></td></tr>`;
  return h+`</table><p class="muted" style="font-size:.8em;margin:4px 0 0">Leave a row blank if you don't need it.</p>`;
}
function grade(fields,je){
  let ok=true;
  (fields||[]).forEach(f=>{const el=app.querySelector(`[data-k="${f.k}"]`);const g=near(f.kind,el.value,f.ans);el.classList.toggle("good",g);el.classList.toggle("wrong",!g);if(!g)ok=false});
  if(je){
    const trs=[...app.querySelectorAll(".je tr[data-r]")];
    const rows=trs.map(tr=>({acct:tr.querySelector("select").value,dr:tr.querySelector(".dr").value,cr:tr.querySelector(".cr").value}));
    const r=checkJE(rows,je.lines);
    trs.forEach((tr,ix)=>{tr.querySelectorAll("select,input").forEach(e=>{e.classList.remove("good","wrong");if(r.res[ix]===true)e.classList.add("good");else if(r.res[ix]===false)e.classList.add("wrong")})});
    if(!r.ok)ok=false;
  }
  return{ok}
}
function showAnswers(fields,je){
  (fields||[]).forEach(f=>{const el=app.querySelector(`[data-k="${f.k}"]`);
    el.value=ansInput(f);el.classList.remove("wrong");el.classList.add("good");el.disabled=true});
  if(je){const trs=[...app.querySelectorAll(".je tr[data-r]")];trs.forEach((tr,ix)=>{const l=je.lines[ix];
    const s=tr.querySelector("select"),d=tr.querySelector(".dr"),c=tr.querySelector(".cr");
    s.value=l?l[0]:"";d.value=l&&l[1]==="Dr"?fmt(l[2]):"";c.value=l&&l[1]==="Cr"?fmt(l[2]):"";
    [s,d,c].forEach(e=>{e.classList.remove("wrong");if(l)e.classList.add("good");e.disabled=true})})}
}

/* ---------- Define It (station) ---------- */
function defBlock(bIdx){
  const st=LIVE.state,b=SCHED[bIdx],p=st.dp||0,ph=st.dph||"write",D=DEFS[b.d][p],k=defKey(bIdx,p);
  const nm=names(bIdx);const team=[...nm.stay,nm.move].map(esc).join(" & ");
  const mine=((LIVE.recs["s"+ME.station]||{}).def||{})[k]||{};
  const local=store.get(lkey(bIdx)+"_"+p,{})||{};
  $("#ttl").innerHTML=`Station ${ME.station} · <span>${b.label}</span>`;
  const head=`<div class="panel center" style="background:var(--ink);color:#fff"><div class="osw" style="font-size:20px;letter-spacing:.2em;color:#ff8a9c">${D.kind.toUpperCase()} IT · PROMPT ${p+1} OF ${DEFS[b.d].length}</div><div class="osw" style="font-size:44px;line-height:1.15;margin-top:4px">${esc(D.term)}</div><div style="opacity:.8;margin-top:6px">${team}, you're a team for this round.</div></div>`;
  const save=o=>{const cur={...local,...o};store.set(lkey(bIdx)+"_"+p,cur);net().then(N=>N.update(`games/${ME.code}/players/s${ME.station}`,Object.fromEntries(Object.entries(o).map(([a,v])=>[`def/${k}/${a}`,v])))).catch(()=>{})};
  if(ph==="write"){
    const val=local.t!=null?local.t:(mine.t||"");
    app.innerHTML=`${head}<div class="panel"><p style="font-size:1.1em;margin-top:0">Write the best ${D.kind==="Explain"?"explanation":"definition"} you can, in your own words. Next, everyone sees every answer plus the <b>real</b> one, mixed together, and votes for the one they think is real.</p>
      <p class="muted">+${DEF_RIGHT} if you pick the real one. +${DEF_FOOL} every time another team picks yours. Keep it to one sentence and make it sound real!</p>
      <textarea id="dt" maxlength="170" rows="3" style="width:100%;font:inherit;font-size:1.15em;padding:12px;border:2px solid var(--ln);border-radius:10px">${esc(val)}</textarea>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="muted" id="dc"></span><button class="btn" id="dsub">${mine.t?"Update answer":"Lock it in"}</button></div><div id="dmsg" style="font-weight:700;color:var(--ok);margin-top:8px">${mine.t?"✓ Saved. You can change it until voting starts.":""}</div></div>`;
    const ta=$("#dt"),cnt=()=>$("#dc").textContent=`${ta.value.length}/170`;cnt();ta.oninput=cnt;
    $("#dsub").onclick=()=>{const t=ta.value.trim();if(t.length<8){$("#dmsg").style.color="var(--red)";$("#dmsg").textContent="Write a full answer first.";return}
      save({t});$("#dmsg").style.color="var(--ok)";$("#dmsg").textContent="✓ Saved. You can change it until voting starts.";$("#dsub").textContent="Update answer"};
    return}
  const ents=defEntries(LIVE.recs,bIdx,p,ME.code,st.hide);
  if(ph==="vote"){
    let v=local.v||mine.v||"";
    const draw=()=>{app.innerHTML=`${head}<div class="panel"><p style="font-size:1.1em;margin-top:0">Which one is <b>REAL</b>? Tap your pick. You can change it until your teacher reveals the answer.</p>
      <div class="dvote">${ents.filter(e=>e.id!=="s"+ME.station).map((e,i)=>`<button class="dopt ${v===e.id?"on":""}" data-v="${e.id}"><span class="osw">${String.fromCharCode(65+ents.indexOf(e))}</span>${esc(e.text)}</button>`).join("")}</div>
      ${ents.some(e=>e.id==="s"+ME.station)?`<p class="muted" style="margin-top:10px">Your own answer is hidden from your list.</p>`:""}</div>`;
      app.querySelectorAll(".dopt").forEach(el=>el.onclick=()=>{v=el.dataset.v;save({v});draw()})};
    draw();return}
  // reveal
  const {votes}=defScores(LIVE.recs,bIdx,p,ME.code,st.hide);
  const myVote=local.v||mine.v,gotRight=myVote==="real",fooled=votes["s"+ME.station]||0;
  const tot=(gotRight?DEF_RIGHT:0)+fooled*DEF_FOOL;
  app.innerHTML=`${head}<div class="panel"><div class="osw muted" style="font-size:18px;letter-spacing:.1em">THE REAL ANSWER</div><div style="font-size:1.35em;font-weight:700;margin:6px 0 14px;padding:14px;background:#EFF8F2;border-left:6px solid var(--ok);border-radius:10px">${esc(normDef(D.real))}</div>
    <div class="row" style="justify-content:center;gap:40px;text-align:center"><div><div class="muted">${myVote?(gotRight?"You picked the real one":"You were fooled"):"You didn't vote"}</div><div class="big">+${gotRight?DEF_RIGHT:0}</div></div><div><div class="muted">Teams who picked yours</div><div class="big">${fooled} × ${DEF_FOOL}</div></div></div>
    <p class="center" style="font-size:1.2em;margin-top:12px"><b>${team}: +${tot} each</b></p></div>`;
}
/* ---------- kahoot ---------- */
const KSEC=15,KMAX=10,KBMAX=6; // bonus questions after the main 8 are worth up to 6
/* Endless bonus questions for each Kahoot break, made fresh each time: [question, options, index of the right one] */
function mc(r,q,right,wrongs,h){const o=[right];wrongs.forEach(w=>{if(o.length<4&&!o.includes(w))o.push(w)});
  ["None of these","It breaks even","Can't tell","$0"].forEach(w=>{if(o.length<4&&!o.includes(w))o.push(w)});const s=shuffle(r,o);return{q,o:s,a:s.indexOf(right),h}}
const KBONUS={
 1(r){const x=futCase(r,null,r()<.5),c=x.c,d=Math.abs(r2(x.S-x.F)),t=pick(r,[0,1,2]);
  if(t===0)return mc(r,`${c.w} ${c.a==="buy"?"needs to buy":"will sell"} ${c.it} later. To hedge, it should:`,c.a==="buy"?"Buy futures":"Sell futures",[c.a==="buy"?"Sell futures":"Buy futures","Buy a put","Pay fixed in a swap"],"Buyers buy futures. Sellers sell futures.");
  if(t===1)return mc(r,`You ${c.a==="buy"?"BOUGHT":"SOLD"} ${c.it} futures at ${fp(x.F,c)}. At delivery it's ${fp(x.S,c)}. Per ${c.u}, the futures:`,(x.pnl>0?"Gain ":"Lose ")+fp(d,c),[(x.pnl>0?"Lose ":"Gain ")+fp(d,c),"Break even",(x.pnl>0?"Gain ":"Lose ")+fp(x.S,c)],c.a==="buy"?"Bought futures gain when the price goes UP.":"Sold futures gain when the price goes DOWN.");
  return mc(r,`${c.w} hedged at ${fp(x.F,c)}. At delivery the price is ${fp(x.S,c)}. Its effective price per ${c.u}:`,fp(x.F,c),[fp(x.S,c),fp(r2(x.F+x.S),c),fp(d,c)],"A hedge locks in a price. Which one?")},
 2(r){const call=r()<.5,K=pick(r,[20,25,30,40,50,60,75]),p=pick(r,[1,1.5,2,2.5,3,4]),t=pick(r,[0,1,2]);
  if(t===0){const be=call?K+p:K-p;return mc(r,`A ${px(K)} ${call?"call":"put"} costs ${px(p)}. Breakeven:`,cents(be),[cents(call?K-p:K+p),cents(K),cents(p)],call?"Call breakeven = strike + premium.":"Put breakeven = strike − premium.")}
  if(t===1){const S=call?K+pick(r,[2,4,5,8]):K-pick(r,[2,4,5,8]),pay=Math.abs(S-K)*100;
    return mc(r,`One ${px(K)} ${call?"call":"put"} contract. The stock ends at ${px(S)}. Payoff before the premium:`,money(pay),[money(pay/100),money(0),money(pay+p*100)],"Price difference past the strike × 100 shares.")}
  const sh=pick(r,[100,200,300,500]);return mc(r,`Protective puts on ${fmt(sh)} shares, ${px(p)} premium each. Total cost:`,money(sh*p),[money(p*100),money(sh*K),money(sh*(K+p))],"Premium × every share. The strike isn't a cost.")},
 3(r){const s=swapCase(r,null),t=pick(r,[0,1,2]);
  if(t===0)return mc(r,`${money(s.n)} loan at FF + ${s.sp}%. FF is ${s.ff}%. Yearly interest:`,money(s.before),[money(s.n*s.ff/100),money(s.n*s.sp/100),money(s.n*(s.ff+s.sp)/1000)],`Add the rates first: ${s.ff}% + ${s.sp}%.`);
  if(t===1)return mc(r,`A pays FF + ${s.sp}%, B pays fixed ${s.fx}%. They swap. FF is ${s.ff}%. Who comes out ahead?`,s.vr>s.fx?"Company A (now paying fixed)":"Company B (now paying variable)",[s.vr>s.fx?"Company B (now paying variable)":"Company A (now paying fixed)","Both equally","Neither"],`Variable is ${s.vr}%. Is that more or less than ${s.fx}% fixed?`);
  const [tt,a]=pick(r,TOOL_POOL);return mc(r,tt+" Which tool?",a,TOOLS.filter(x=>x!==a).concat(["A bond"]),"Locked price: futures. A right with a premium: option. Trading payments: swap.")}
};
function kahoot(bIdx){
  const b=SCHED[bIdx];const live=()=>CUR&&CUR.block===bIdx;
  const nm=names(bIdx);const team=[...nm.stay,nm.move].map(esc).join(" & ");
  let st=store.get(lkey(bIdx),null);
  $("#ttl").innerHTML=`Station ${ME.station} · <span>${b.label}</span>`;
  const r=rng(ME.station*31+b.k*977);
  const qs=shuffle(r,(REVIEW?KAHOOT_R:KAHOOT)[b.k]).map(([q,o,a,h])=>{const idx=shuffle(r,[0,1,2,3]);return{q,o:idx.map(i=>o[i]),a:idx.indexOf(a),h}});
  const N=qs.length;
  let qi=(st&&st.qi)||0,total=(st&&st.total)||0,right=(st&&st.right)||0,bpts=(st&&st.bpts)||0;
  const save=()=>{store.set(lkey(bIdx),{qi,total,right,bpts});pushResult(bIdx,{pts:total,done:qi>=N,bon:Math.max(0,qi-N)})};
  const qAt=i=>i<N?qs[i]:KBONUS[b.k](rng(ME.station*31+b.k*977+i*101+7));
  app.innerHTML=`<div class="panel center"><h1 style="font-size:46px;color:var(--k2)">Kahoot Break ${b.k}</h1><p style="font-size:1.25em"><b>${team}</b>, you're teammates now.</p><p>${N} questions, ${KSEC} seconds each. Faster right answers earn more (up to ${KMAX} each), and you BOTH get the points. A hint cuts a question\'s points in half. Then bonus questions keep coming until your teacher moves on.</p>
   <div class="acts" style="justify-content:center"><button class="btn" id="go" style="background:var(--k2);font-size:1.3em;padding:16px 40px">${qi?"Keep going":"Start"}</button></div></div>`;
  $("#go").onclick=ask;
  const SH=["▲","◆","●","■"];
  function ask(){
    if(!live())return;
    const bonus=qi>=N,q=qAt(qi);let max=bonus?KBMAX:KMAX,left=KSEC*10,answered=false;
    app.innerHTML=`<div class="panel">${bonus&&qi===N?`<div class="fb ok" style="margin:0 0 12px;font-size:1.1em"><b>All ${N} done: ${right} right, ${total} points.</b> Bonus questions now, up to ${KBMAX} points each, until your teacher moves on.</div>`:""}<div class="kmeta"><span>${bonus?`<span style="color:var(--gold)">BONUS ${qi-N+1}</span>`:`Question ${qi+1} of ${N}`}</span><span id="tl">${KSEC}</span><span>${total} pts</span></div><div class="kbar"><i id="bar" style="width:100%"></i></div>
     <div class="kq">${q.q}</div>${q.h?`<div class="center" id="khb" style="margin:-6px 0 12px"><button class="btn hbtn" id="kh">💡 Hint: drops this to ${Math.round(max/2)} max</button></div>`:""}<div class="kopts">${q.o.map((o,k)=>`<button class="kopt" data-k="${k}"><span class="sh">${SH[k]}</span><span>${o}</span></button>`).join("")}</div><div id="kf"></div></div>`;
    clearInterval(KTIMER);
    KTIMER=setInterval(()=>{if(!live()){clearInterval(KTIMER);return}left--;$("#bar").style.width=(left/(KSEC*10)*100)+"%";$("#tl").textContent=Math.ceil(left/10);if(left<=0)answer(-1)},100);
    app.querySelectorAll(".kopt").forEach(el=>el.onclick=()=>answer(+el.dataset.k));
    if($("#kh"))$("#kh").onclick=()=>{max=max/2;$("#khb").innerHTML=`<div class="hint" style="display:inline-block;text-align:left;font-size:1.1em"><b>Hint:</b> ${q.h}</div>`};
    function answer(k){
      if(answered)return;answered=true;clearInterval(KTIMER);$("#khb")&&$("#khb").remove();
      const ok=k===q.a;const got=ok?Math.round(max/2+max/2*Math.max(0,left)/(KSEC*10)):0;
      if(ok){total+=got;if(bonus)bpts+=got;else right++}qi++;save();
      app.querySelectorAll(".kopt").forEach((el,ix)=>{if(ix===q.a)el.classList.add("right");else el.classList.add("dim")});
      $("#kf").innerHTML=`<div class="fb ${ok?"ok":"no"}" style="font-size:1.2em"><b>${ok?"Correct! +"+got:k<0?"Time's up!":"Not this time."}</b>${ok?"":" The answer was: "+q.o[q.a]}</div><div class="acts" style="justify-content:center"><button class="btn" id="nk" style="background:var(--k2)">${qi<N?"Next question":qi===N?"Bonus questions ▶":"Next bonus question"}</button></div>`;
      $("#nk").onclick=ask;
    }
  }
}

/* ============================================================ TEACHER (projector) */
let H=null; // {N,code,state,recs,off}
const HKEY=REVIEW?"tibReviewHostCode":"tibHostCode";
async function hostSetup(err){
  const N=await net().catch(()=>null);if(!N)return needSetup();
  stopFireworks();
  $("#ttl").innerHTML=`Teach It Back: <span>${TNAME}</span> &nbsp;·&nbsp; Teacher`;
  let last="";try{last=localStorage.getItem(HKEY)||""}catch(e){}
  app.innerHTML=`<div class="panel" style="max-width:820px;margin:20px auto"><h1 style="font-size:44px">Teach It Back: ${TNAME}</h1>
   <p style="font-size:1.1em">Pairs at stations, one iPad per station. Every rotation the pair gets a new partner, a new skill or a new problem, and the learner from the last rotation becomes the teacher. Teachers earn <b>${TEACH_X}× points</b>, learners 1×. ${REVIEW?"Review Edition: new problems, and partners solve every problem together (no teaching role, both earn points), with a new partner each rotation. Two 3-minute rotations per derivative (futures, then options, then swaps), each followed by a Kahoot break, then two Three Clients rotations that mix all three. About 35 minutes;":"One derivative at a time: futures, then options, then swaps. Each one gets three 4-minute rotations and a Kahoot break. Then one Three Clients rotation mixes all three. About 50 minutes;"} click any block in the schedule to skip ahead. If a tab closes, <b>Resume</b> picks the game back up for 4 hours.</p>
   <div class="acts"><button class="btn" id="go">Create game</button></div>
   <h3 style="margin-top:22px">Resume a game</h3><div class="row" style="margin-top:8px"><input id="rc" value="${esc(last)}" maxlength="4" inputmode="numeric" style="width:130px;padding:10px;font-size:22px;letter-spacing:.2em;text-align:center;border:2px solid var(--ln);border-radius:9px"><button class="btn sec" id="resume">Resume</button></div>
   <div id="rer" style="color:var(--red);font-weight:700;margin-top:8px">${err||""}</div></div>`;
  $("#resume").onclick=async()=>{const code=$("#rc").value.trim();if(!/^\d{4}$/.test(code))return $("#rer").textContent="Type the 4-digit code.";
    try{const g=await N.get("games/"+code);if(!g||g.game!==GAME)return $("#rer").textContent="No Teach It Back game with that code (games erase themselves after 4 hours).";hostOpen(N,code,g.state)}catch(e){$("#rer").textContent="Couldn't reach the game database."}};
  $("#go").onclick=async()=>{$("#go").disabled=true;
    for(let t=0;t<6;t++){const code=String(1000+Math.floor(Math.random()*9000));
      try{await N.set("games/"+code,{game:GAME,created:Date.now(),days:3,state:{phase:"lobby"}});return hostOpen(N,code,{phase:"lobby"})}catch(e){if(!/in use|409/i.test(String(e.message)))break}}
    $("#go").disabled=false;$("#rer").textContent="Couldn't create a game. Check the connection and try again."};
}
function hostOpen(N,code,state){
  try{localStorage.setItem(HKEY,code)}catch(e){}
  if(H&&H.off)H.off();
  H={N,code,state:state||{phase:"lobby"},recs:{}};
  H.off=N.on(`games/${code}/players`,v=>{H.recs=v||{};hostRender(false)});
  hostRender(true);
}
const setState=async patch=>{H.state={...H.state,...patch};hostRender(true);try{await H.N.set(`games/${H.code}/state`,H.state)}catch(e){}};
let HTICK=null;
function hostRender(fresh){
  const st=H.state;
  if(st.phase==="lobby")return hostLobby();
  if(st.phase==="end"){if(fresh)finale();return}
  if(st.phase==="standings"){return fullStandings()}
  if(fresh)hostPlay();else hostLiveBits();
}
function stationList(){return Object.values(H.recs).filter(r=>r&&r.station).sort((a,b)=>a.station-b.station)}
function hostPlayers(){return Object.values(H.recs||{}).filter(r=>r&&r.pid).sort((a,b)=>a.name.localeCompare(b.name))}
function unplaced(){const A=H.state.assign;return hostPlayers().filter(p=>!(A&&A.seats&&A.seats[p.pid]))}
async function assignStations(){
  const ps=shuffle(rng(Date.now()%2147483647),hostPlayers());if(ps.length<2)return;
  const used={},nameOf=p=>{let n=p.name,k=2;while(used[normName(n)])n=p.name+" ("+(k++)+")";used[normName(n)]=1;return n};
  const nm={};ps.forEach(p=>nm[p.pid]=nameOf(p));
  // Pairs everywhere. An odd class gets ONE group of 3 (a second stayer at one station).
  let N=Math.floor(ps.length/2);
  const seats={},recs={};
  for(let k=1;k<=N;k++){const s=ps[k-1],m=ps[N+k-1];recs[k]={station:k,stay:nm[s.pid],stay2:"",move:nm[m.pid],res:{}};
    seats[s.pid]={station:k,role:"stay",primary:true};seats[m.pid]={station:k,role:"move"}}
  const extra=ps.slice(2*N),spots=shuffle(rng(Date.now()%9973+1),[...Array(N).keys()].map(k=>k+1));
  extra.forEach((x,i)=>{const k=spots[i%N];if(recs[k].stay2)recs[k].stay3=nm[x.pid];else recs[k].stay2=nm[x.pid];seats[x.pid]={station:k,role:"stay",primary:false}});
  const old=stationList().map(r=>r.station).filter(k=>k>N);
  try{await Promise.all([...Object.values(recs).map(r=>H.N.set(`games/${H.code}/players/s${r.station}`,r)),...old.map(k=>H.N.set(`games/${H.code}/players/s${k}`,null))])}catch(e){alert("Couldn't save the stations. Try again.");return}
  setState({assign:{seats},stations:N});
}
async function placeLate(){
  const A=H.state.assign;if(!A)return;const seats={...A.seats};const late=unplaced();const full=[];
  for(const p of late){
    let open=stationList().filter(r=>!r.stay2),slot="stay2";
    if(!open.length){open=stationList().filter(r=>!r.stay3);slot="stay3"}
    if(!open.length){full.push(p.name);continue}
    const r=open[Math.floor(Math.random()*open.length)];
    try{await H.N.update(`games/${H.code}/players/s${r.station}`,{[slot]:p.name});r[slot]=p.name}catch(e){continue}
    seats[p.pid]={station:r.station,role:"stay",primary:false};
  }
  await setState({assign:{seats}});
  if(full.length)alert("Every station already has 4 people, so these students weren't placed: "+full.join(", "));
}
function hostLobby(){
  const ps=hostPlayers(),A=H.state.assign,list=stationList(),late=A?unplaced():[];
  const joinURL=location.origin+TPATH+"?code="+H.code;
  const url=location.host?location.host+TPATH:TPATH;
  $("#ttl").innerHTML=`Teach It Back: <span>${TNAME}</span> &nbsp;·&nbsp; Code ${H.code}`;
  const right=!A?`<h3 style="font-size:28px">Students joined: ${ps.length}</h3><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">${ps.map(p=>`<span style="background:var(--bg);border-radius:20px;padding:6px 14px;font-size:20px">${esc(p.name)}</span>`).join("")||`<p class="muted" style="font-size:20px">Waiting for students...</p>`}</div>`
    :`<h3 style="font-size:28px">${list.length} stations</h3><table class="pvt" style="font-size:19px;margin-top:10px"><tr><th>#</th><th style="text-align:left">Stayer (station iPad)</th><th style="text-align:left">Starting mover</th></tr>
      ${list.map(r=>`<tr><td>${r.station}</td><td style="text-align:left">${esc(r.stay)}${r.stay2?" & "+esc(r.stay2):""}${r.stay3?" & "+esc(r.stay3):""}</td><td style="text-align:left">${esc(r.move)}</td></tr>`).join("")}</table>
      ${late.length?`<p style="font-size:19px;margin-top:12px"><b style="color:var(--red)">Joined after you assigned:</b> ${late.map(p=>esc(p.name)).join(", ")} <button class="btn sec" id="late" style="margin-left:6px">Add them as extra stayers</button></p>`:""}`;
  app.innerHTML=`<div class="hostgrid"><div class="panel"><div class="muted" style="font-size:22px">Scan to join, or go to</div><div class="osw" style="font-size:36px">${esc(url)}</div>
    <div class="row" style="gap:28px;align-items:center;flex-wrap:nowrap;margin-top:10px"><div><div class="muted" style="font-size:22px">Game code</div><div class="osw" style="font-size:140px;line-height:1;letter-spacing:.08em;color:var(--red)">${H.code}</div></div><div id="qr" style="width:300px;height:300px;flex:none" title="Scan to join"></div></div>
    <p style="font-size:22px;margin-top:12px">Everyone joins on their own iPad and types <b>just their name</b>.</p>
    <p style="font-size:19px" class="muted">${A?"Each pair has a <b>stayer</b> and a <b>mover</b>. The stayer's iPad is the station iPad and stays on the desk. Movers slide up one station each rotation, and their own iPad shows where to go.":"When everyone is in, click <b>Assign stations</b>. Students are paired at random: one stayer and one mover per station. With an odd number of students, one station gets a group of 3 (a second stayer)."}</p>
    <div class="acts">${A?`<button class="btn" id="start">Start Rotation 1 with ${list.length} stations</button><button class="btn sec" id="assign">Reshuffle</button>`:`<button class="btn" id="assign" ${ps.length<2?"disabled":""}>Assign stations (${ps.length} students)</button>`}<button class="btn sec" id="erase">Erase game</button></div></div>
   <div class="panel">${right}</div></div>`;
  const qr=$("#qr");
  if(H.qrFor===joinURL&&H.qrSvg)qr.innerHTML=H.qrSvg;
  else import("/qr.js").then(m=>{H.qrSvg=m.qrSVG(joinURL,"#141414");H.qrFor=joinURL;const el=$("#qr");if(el)el.innerHTML=H.qrSvg}).catch(()=>{if($("#qr"))$("#qr").style.display="none"});
  $("#assign").onclick=()=>{if(A&&!confirm("Reshuffle every station?"))return;assignStations()};
  if($("#start"))$("#start").onclick=()=>{if(late.length&&!confirm(late.length+" student(s) aren't at a station yet. Start anyway?"))return;setState({phase:"play",block:0,timerEnd:0,paused:null,dp:0,dph:"write"})};
  if($("#late"))$("#late").onclick=placeLate;
  $("#erase").onclick=hostErase;
}
function hostPlay(){
  const st=H.state,b=SCHED[st.block];
  $("#ttl").innerHTML=`Teach It Back: <span>${TNAME}</span> &nbsp;·&nbsp; Code ${H.code}`;
  const what=b.type==="kahoot"?`<small>Kahoot Break ${b.k} of 3 · ${KNAME[b.k]}</small>Partners are teammates`:b.type==="def"?`<small>Define It ${b.d} of 3 · ${KNAME[b.d]}</small>Write it. Then spot the real one.`:(b.pair?`<small>${b.label} of ${ROT_TOTAL} · ${ROUNDS[b.pair[0]].unit} · ${PHASE_NAME[b.phase]}</small><span style="font-size:.8em">Odd stations: ${ROUNDS[roundAt(b,3,st.stations)].name}<br>Even stations: ${ROUNDS[roundAt(b,2,st.stations)].name}${wrapFix(st.stations,1)&&b.phase!=="co"?`<br>Station 1: ${ROUNDS[roundAt(b,1,st.stations)].name}${b.phase==="mt"?" (learn together)":""}`:""}</span>`:`<small>${b.label} of ${ROT_TOTAL}</small>${ROUNDS[b.round].name}`);
  const roles=b.type==="def"?"":b.type==="kahoot"?`<div class="whob"><div style="background:var(--k2);grid-column:span 2"><b>Stay with your partner</b>Answer together. You both get the points.</div></div>`
   :b.teach==="co"?`<div class="whob"><div style="background:var(--k2);grid-column:span 2"><b>${REVIEW?"SOLVE IT TOGETHER · both earn the points":"LEARN IT TOGETHER · 1× points"}</b>${REVIEW?"Partners work every problem as a team. New partner next rotation.":"Both partners are learners. Use the free worked example if you need it."}</div></div>`
   :`<div class="whob"><div style="background:var(--ink)"><b>TEACHER · ${TEACH_X}× points</b>${b.teach==="stay"?"The STAYER":"The MOVER"}</div><div style="background:var(--red)"><b>LEARNER · 1× points</b>${b.teach==="stay"?"The MOVER":"The STAYER"}</div></div>`;
  const move=b.type==="def"?"No moving. Same partner as the Kahoot break.":b.type==="kahoot"?"No moving. Same partner as the last rotation.":(b.rot===1?"Movers: start at your own station.":"MOVERS: slide up one station. The last station goes to Station 1.");
  const note=b.type==="rot"&&b.pair?(b.phase==="co"?"Two new skills: odd and even stations learn different ones. Next rotation, each mover teaches theirs to a partner who learned the other.":b.phase==="mt"?"Movers teach the skill they just learned. Stayers learn it.":"Stayers teach the skill they learned last rotation to a mover who hasn't had it."):b.type==="rot"?"Futures, options and swaps in one problem, then name the tool. Both partners work it together.":"";
  const last=st.block===SCHED.length-1;
  app.innerHTML=`<div class="hostgrid"><div><div class="panel"><div class="now">${what}</div>${roles}
    <p style="font-size:24px;margin:4px 0"><b>${move}</b></p><p style="font-size:20px" class="muted">${note}</p>
    ${b.type==="def"?`<div id="defLive" style="margin-top:10px"></div><div class="row" style="justify-content:center;margin-top:12px" id="defCtl"></div>`:""}
    <div class="timer" id="tm" style="${b.type==="def"?"font-size:72px;margin-top:14px":""}"></div>
    <div class="row" style="justify-content:center;margin-top:8px"><button class="btn" id="tgo">${st.timerEnd||st.paused!=null?"Restart timer":"Start timer ("+blockMinutes(b)+":00)"}</button><button class="btn sec" id="tpause">${st.paused!=null?"Resume":"Pause"}</button><button class="btn sec" id="tm1">−1 min</button><button class="btn sec" id="tp1">+1 min</button></div>
    ${b.type==="def"?"":`<div id="done" style="font-size:22px;text-align:center;margin-top:12px"></div>`}
    <div class="row" style="justify-content:space-between;margin-top:16px"><button class="btn sec" id="prev">◀ Back</button><button class="btn sec" id="stand">Standings</button><button class="btn sec" id="end">End game now</button><button class="btn" id="next">${last?"Final standings ▶":"Next block ▶"}</button></div></div></div>
   <div><div class="panel"><h3 style="font-size:26px">Top 8 right now</h3><div id="top8"></div><p class="muted" style="font-size:15px;margin-top:6px">Teachers earn ${TEACH_X}× the points their pair scores. Learners and Kahoot teammates earn 1×.</p></div>
    <div class="panel"><h3>Schedule</h3><ul class="sched">${SCHED.map((x,ix)=>`<li data-i="${ix}" class="${ix===st.block?"on":""} ${x.type!=="rot"?"kk":""}"><span class="no">${SCHED_NO(x)}</span><span>${SCHED_NAME(x)}</span><span class="muted" style="margin-left:auto;font-size:14px">${blockMinutes(x)}m</span></li>`).join("")}</ul></div></div></div>`;
  app.querySelectorAll("[data-i]").forEach(li=>li.onclick=()=>{if(+li.dataset.i!==st.block&&confirm("Jump to "+SCHED[+li.dataset.i].label+"? Every iPad will switch."))goBlock(+li.dataset.i)});
  $("#prev").onclick=()=>{if(st.block>0&&confirm("Go back a block? Every iPad will switch."))goBlock(st.block-1)};
  $("#next").onclick=()=>last?setState({phase:"end"}):goBlock(st.block+1);
  $("#end").onclick=()=>{if(confirm("End the game now and show the final standings?"))setState({phase:"end"})};
  $("#stand").onclick=()=>{H.back=st.phase;fullStandings()};
  $("#tgo").onclick=()=>setState({timerEnd:Date.now()+blockMinutes(b)*60000,paused:null});
  $("#tpause").onclick=()=>{if(H.state.paused!=null)setState({timerEnd:Date.now()+H.state.paused,paused:null});else if(H.state.timerEnd)setState({paused:Math.max(0,H.state.timerEnd-Date.now()),timerEnd:0})};
  $("#tm1").onclick=()=>{if(H.state.paused!=null)setState({paused:Math.max(0,H.state.paused-60000)});else if(H.state.timerEnd)setState({timerEnd:H.state.timerEnd-60000})};
  $("#tp1").onclick=()=>{if(H.state.paused!=null)setState({paused:H.state.paused+60000});else if(H.state.timerEnd)setState({timerEnd:H.state.timerEnd+60000})};
  hostLiveBits();
  clearInterval(HTICK);let beeped=false;
  const paint=()=>{const el=$("#tm");if(!el){clearInterval(HTICK);return}const s=H.state;const ms=s.paused!=null?s.paused:s.timerEnd?s.timerEnd-Date.now():blockMinutes(b)*60000;el.textContent=mmss(ms/1000);el.classList.toggle("low",ms<60000);
    if(s.timerEnd&&ms<=0&&!beeped){beeped=true;beep(880,.3);setTimeout(()=>beep(660,.4),320)}};
  paint();HTICK=setInterval(paint,250);
}
function goBlock(i){setState({block:i,timerEnd:0,paused:null,dp:0,dph:"write"})}
function hostLiveBits(){
  const st=H.state;if(st.phase!=="play")return;
  const N=st.stations,{tot}=standings(H.recs,N),rk=ranks(tot);
  const order=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]).slice(0,8);
  const t8=$("#top8");if(t8)t8.innerHTML=order.map(n=>`<div class="row" style="font-size:21px;padding:5px 0;border-bottom:1px solid #eee"><span class="osw" style="width:36px;color:var(--red)">${rk[n]}</span><span style="flex:1">${esc(n)}</span><b>${fmt(tot[n])}</b></div>`).join("")||`<p class="muted">No points yet.</p>`;
  const list=stationList(),R=r=>(r.res&&r.res[st.block])||{},dn=list.filter(r=>R(r).done).length,isRot=SCHED[st.block].type==="rot";
  const d=$("#done");if(d)d.innerHTML=`<div style="font-size:24px"><b>${dn}</b> of ${list.length} stations ${isRot?"submitted":"finished"}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:10px">${list.map(r=>{const v=R(r),ok=!!v.done;
      return `<div style="border-radius:10px;padding:8px 6px;text-align:center;border:2px solid ${ok?"var(--ok)":"var(--ln)"};background:${ok?"#EFF8F2":"#fff"}"><div class="osw" style="font-size:22px">Station ${r.station}</div><div style="font-size:16px;font-weight:700;color:${ok?"var(--ok)":"var(--mu)"}">${ok?(isRot?"✓ Submitted":"✓ Done"):"Working..."}</div>${ok&&v.bon?`<div style="font-size:14px" class="muted">${v.bon} bonus done</div>`:""}</div>`}).join("")}</div>`;
  if(SCHED[st.block].type==="def")hostDefBits();
  let warn=$("#latejoin");const late=unplaced();
  if(late.length){
    if(!warn){warn=document.createElement("div");warn.id="latejoin";warn.className="panel";warn.style.cssText="border:3px solid var(--red);font-size:19px";app.prepend(warn)}
    warn.innerHTML=`<b style="color:var(--red)">Joined late:</b> ${late.map(p=>esc(p.name)).join(", ")} <button class="btn" id="late" style="margin-left:10px">Add them as extra stayers</button> <span class="muted">Each joins a station that has 2 people. Their iPad shows where to sit.</span>`;
    $("#late").onclick=placeLate}
  else if(warn)warn.remove();
}
function hostDefBits(){
  const st=H.state,b=st.block,p=st.dp||0,ph=st.dph||"write",D=DEFS[SCHED[b].d][p],k=defKey(b,p),N=st.stations;
  const list=stationList(),box=$("#defLive"),ctl=$("#defCtl");if(!box)return;
  const head=`<div class="osw" style="font-size:20px;color:var(--red);letter-spacing:.15em">${D.kind.toUpperCase()} IT · PROMPT ${p+1} OF ${DEFS[SCHED[b].d].length}</div><div class="osw" style="font-size:52px;line-height:1.1;margin:4px 0 12px">${esc(D.term)}</div>`;
  if(ph==="write"){const n=list.filter(r=>r.def&&r.def[k]&&normDef(r.def[k].t)).length;
    box.innerHTML=head+`<p style="font-size:24px">Every team writes the best ${D.kind==="Explain"?"explanation":"definition"} they can. <b>${n}</b> of ${list.length} teams have locked in.</p><p class="muted" style="font-size:19px">Then everyone votes for the real one. +${DEF_RIGHT} for picking the real one, +${DEF_FOOL} for every team that picks yours.</p>`;
    if(!$("#dgo")){ctl.innerHTML=`<button class="btn" id="dgo">Start voting ▶</button>`;$("#dgo").onclick=()=>setState({dph:"vote"})}
    return}
  const ents=defEntries(H.recs,b,p,H.code,st.hide);
  const nm=e=>{if(e.id==="real")return "";const pr=pairAt(H.recs,e.station,b,N);return pr?[...pr.stay,pr.move].map(esc).join(" & "):"Station "+e.station};
  if(ph==="vote"){const nv=list.filter(r=>r.def&&r.def[k]&&r.def[k].v).length;
    box.innerHTML=head+`<div class="dlist">${ents.map((e,i)=>`<div class="dent"><span class="osw">${String.fromCharCode(65+i)}</span><span>${esc(e.text)}</span>${e.id!=="real"?`<button class="btn hd" data-hide="${e.id}" title="Hide this answer">Hide</button>`:`<span class="hd" style="visibility:hidden">Hide</span>`}</div>`).join("")}</div><p style="font-size:22px;margin-top:10px"><b>${nv}</b> of ${list.length} teams have voted.</p>`;
    box.querySelectorAll("[data-hide]").forEach(bt=>bt.onclick=()=>{if(!confirm("Hide this answer? Votes for it won't count."))return;const hide={...(st.hide||{})};hide[k]=[...(hide[k]||[]),bt.dataset.hide];setState({hide})});
    if(!$("#drev")){ctl.innerHTML=`<button class="btn" id="drev">Reveal the real one ▶</button>`;$("#drev").onclick=()=>setState({dph:"reveal",revealed:[...new Set([...(H.state.revealed||[]),k])]})}
    return}
  const {votes}=defScores(H.recs,b,p,H.code,st.hide);
  box.innerHTML=head+`<div class="dlist">${ents.map((e,i)=>`<div class="dent ${e.id==="real"?"real":""}"><span class="osw">${String.fromCharCode(65+i)}</span><span>${esc(e.text)}<div class="by">${e.id==="real"?"✓ THE REAL ANSWER":"Written by "+nm(e)}</div></span><span class="vc">${votes[e.id]||0} vote${votes[e.id]===1?"":"s"}</span></div>`).join("")}</div>`;
  const more=p<DEFS[SCHED[b].d].length-1;
  if(more&&!$("#dnx")){ctl.innerHTML=`<button class="btn" id="dnx">Next prompt ▶</button>`;$("#dnx").onclick=()=>setState({dp:p+1,dph:"write",timerEnd:0,paused:null})}
  if(!more)ctl.innerHTML=`<span class="muted" style="font-size:19px">Last prompt. Click <b>Next block</b> when you're ready.</span>`;
}
function fullStandings(){
  stopFireworks();
  const N=H.state.stations,{tot,tch}=standings(H.recs,N),rk=ranks(tot);
  const order=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]);
  const half=Math.ceil(order.length/2);
  const col=arr=>`<table class="pvt" style="font-size:20px"><tr><th>#</th><th style="text-align:left">Student</th><th>Total</th><th>From teaching</th></tr>${arr.map(n=>`<tr><td>${rk[n]}</td><td style="text-align:left">${esc(n)}</td><td><b>${fmt(tot[n])}</b></td><td>${fmt(tch[n])}</td></tr>`).join("")}</table>`;
  app.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h1 style="font-size:40px">Standings</h1><div class="row"><button class="btn sec" id="csv">Download scores</button><button class="btn" id="bk">Back</button></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px">${col(order.slice(0,half))}${col(order.slice(half))}</div></div>`;
  $("#bk").onclick=()=>{if(H.state.phase==="end")finale();else hostRender(true)};
  $("#csv").onclick=()=>{const rows=[["Rank","Student","Total","From teaching"],...order.map(n=>[rk[n],n,tot[n],tch[n]])];
    const blob=new Blob([rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`teach-it-back${REVIEW?"-review":""}-${H.code}.csv`;a.click()};
}
/* ---------- finale (5th to 1st, slow, with room for applause) ---------- */
function fanfare(){[[523,0],[659,.12],[784,.24],[1047,.4]].forEach(([f,t])=>setTimeout(()=>beep(f,.35),t*1000))}
let FW=null,FIN=[];
function stopFireworks(){FIN.forEach(clearTimeout);FIN=[];if(FW){cancelAnimationFrame(FW.raf);FW=null}document.body.classList.remove("finale-on")}
function startFireworks(on){
  const cv=$("#fw");if(!cv)return;const cx=cv.getContext("2d");if(FW)cancelAnimationFrame(FW.raf);
  const dpr=Math.min(2,devicePixelRatio||1);const size=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr};size();addEventListener("resize",size);
  const COLS=["#C1102F","#E8193C","#FFFFFF","#FFFFFF","#D9D9D9","#C1102F"];
  const rockets=[],parts=[];const t0=performance.now();
  const launch=()=>{const W=cv.width,Hh=cv.height;rockets.push({x:W*(.12+Math.random()*.76),y:Hh,vx:(Math.random()-.5)*1.2*dpr,vy:-(Hh*.0125+Math.random()*Hh*.004),ty:Hh*(.12+Math.random()*.35),c:COLS[Math.floor(Math.random()*COLS.length)]})};
  const burst=(r)=>{const n=70+Math.floor(Math.random()*40),sp=(2.2+Math.random()*2.2)*dpr,ring=Math.random()<.35;
    for(let k=0;k<n;k++){const a=Math.PI*2*k/n+Math.random()*.1,v=ring?sp:sp*(.35+Math.random()*.75);parts.push({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,d:.008+Math.random()*.01,c:Math.random()<.25?"#FFFFFF":r.c,s:(1.6+Math.random()*1.4)*dpr})}};
  FW={raf:0};
  const frame=(now)=>{if(!FW)return;const el=now-t0;
    const rate=el<7000?260:el<20000?900:1800;
    if(on&&now-(FW.lastL||0)>rate){FW.lastL=now;launch();if(el<7000&&Math.random()<.5)launch()}
    cx.globalCompositeOperation="destination-out";cx.fillStyle="rgba(0,0,0,.22)";cx.fillRect(0,0,cv.width,cv.height);cx.globalCompositeOperation="lighter";
    for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.x+=r.vx;r.y+=r.vy;r.vy+=.09*dpr;cx.fillStyle=r.c;cx.beginPath();cx.arc(r.x,r.y,2.2*dpr,0,7);cx.fill();if(r.y<=r.ty||r.vy>=0){burst(r);rockets.splice(i,1)}}
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy=p.vy*.985+.045*dpr;p.life-=p.d;if(p.life<=0){parts.splice(i,1);continue}
      cx.globalAlpha=Math.max(0,p.life);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s,0,7);cx.fill()}
    cx.globalAlpha=1;FW.raf=requestAnimationFrame(frame)};
  if(!on){[0,1,2].forEach(()=>{launch()});rockets.forEach(r=>{r.y=r.ty;burst(r)});rockets.length=0;parts.forEach(p=>{p.x+=p.vx*25;p.y+=p.vy*25});
    cx.globalCompositeOperation="lighter";parts.forEach(p=>{cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s,0,7);cx.fill()});return}
  FW.raf=requestAnimationFrame(frame);
}
function finale(){
  clearInterval(HTICK);
  const N=H.state.stations,{tot}=standings(H.recs,N),rk=ranks(tot);
  const order=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]),top=order.slice(0,5);
  const slot=(n,i,cls)=>n?`<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[n]}</div><div class="nm">${esc(n)}</div><div class="pts">${fmt(tot[n])} pts</div></div><div class="block"><span>${["1st","2nd","3rd"][i]}</span></div></div>`:`<div class="pod ${cls} empty"></div>`;
  const rows=top.slice(3).map((n,k)=>`<div class="row45" data-i="${k+3}"><span class="r">${rk[n]}</span><span class="n">${esc(n)}</span><span class="s">${fmt(tot[n])}</span></div>`).join("");
  document.body.classList.add("finale-on");
  app.innerHTML=`<div class="finale"><canvas id="fw"></canvas><div class="rays"></div>
    <div class="fhead"><img class="lg" src="/logo-214.png" alt="District 214"><div class="kick">Teach It Back · ${TNAME}</div><h2>Final standings</h2></div>
    <div class="podium">${slot(order[1],1,"p2")}${slot(order[0],0,"p1")}${slot(order[2],2,"p3")}</div><div class="rest">${rows}</div>
    <div class="fbar"><button class="btn" id="cr">All standings</button><button class="btn" id="again">Replay</button><button class="btn" id="resumeG">Back to the game</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#cr").onclick=()=>fullStandings();$("#again").onclick=()=>{stopFireworks();finale()};$("#erase").onclick=()=>{stopFireworks();hostErase()};
  $("#resumeG").onclick=()=>{stopFireworks();setState({phase:"play"})};
  const ord5=[4,3,2,1,0].filter(i=>order[i]),at=[2000,7000,12500,18000,24500];
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  FIN.forEach(clearTimeout);FIN=ord5.map((i,n)=>setTimeout(()=>{const el=app.querySelector(`.finale [data-i="${i}"]`);if(!el)return;el.classList.add("in");if(i===0){fanfare();startFireworks(!reduce)}else beep(i<3?660:520,.12)},at[n+(5-ord5.length)]||at[n]));
}
async function hostErase(){if(!confirm("Erase this game and all its scores?"))return;try{H.off&&H.off();await H.N.remove("games/"+H.code)}catch(e){}try{localStorage.removeItem(HKEY)}catch(e){}H=null;stopFireworks();hostSetup()}

/* ================= SOLO (play on your own) =================
   /teach-it-back-review with no class code: one student works through every skill alone.
   Each skill: one main problem (100 pts) and two quick problems (20 pts each). A 4-question Kahoot after each derivative (up to 50 each).
   Hints and second tries work like the class game. New numbers every play. */
const SOLO_PLAN=[{r:"f1"},{r:"f2"},{k:1},{r:"o1"},{r:"o2"},{k:2},{r:"s1"},{r:"s2"},{k:3},{r:"full"}];
const SOLO_QUICK=2,SOLO_KQ=4,SOLO_KMAX=50;
let SOLO=null;
function soloHome(){
  $("#ttl").innerHTML=`Teach It Back: <span>Review</span>`;$("#homeBtn").style.display="none";
  const best=store.get("tibSoloBest",0);
  app.innerHTML=`<div class="panel" style="max-width:720px;margin:20px auto"><h1 style="font-size:40px;margin-bottom:6px">Play on your own</h1>
   <p style="font-size:1.1em">Every skill from Teach It Back, with new numbers every time you play: futures (pick the side, gain or loss), options (calls and puts, protecting shares), swaps (pick the swap, run the swap), then Three Clients. Each skill has a main problem and two quick ones. A short Kahoot comes after each derivative.</p>
   <p class="muted">Have a calculator ready. A wrong answer gets one more try for half points. Hints help, but they cut the points. About 25 minutes. Tap <b>Formulas</b> at the top any time.${best?` Your best: <b>${fmt(best)}</b> points.`:""}</p>
   <div class="acts"><button class="btn" id="sgo" style="font-size:1.3em;padding:14px 36px">Start</button></div>
   <p class="muted" style="margin-top:18px;font-size:.9em">In class with a game code? <a href="#" id="sjoin">Join the class game</a></p></div>`;
  $("#sgo").onclick=()=>{SOLO={seed:Math.floor(Math.random()*1e9),step:0,pts:0,by:{}};soloStep()};
  $("#sjoin").onclick=e=>{e.preventDefault();joinForm()};
}
function soloHead(label){
  const S=SOLO;
  return `<div class="prog">${SOLO_PLAN.map((x,k)=>`<i class="${k<S.step?"ok":k===S.step?"on":""}" title="${x.k?"Kahoot "+x.k:ROUNDS[x.r].short}"></i>`).join("")}<span class="tag">${label}</span><span class="muted" style="margin-left:auto;font-size:.9em">Total: <b>${fmt(S.pts)}</b> pts</span></div>`;
}
function soloAdd(key,got,max){const b=SOLO.by[key]||(SOLO.by[key]={got:0,max:0});b.got+=got;b.max+=max;SOLO.pts+=got}
function soloStep(){
  const S=SOLO;if(S.step>=SOLO_PLAN.length)return soloEnd();
  const x=SOLO_PLAN[S.step],r=rng(S.seed+S.step*7919);
  window.scrollTo(0,0);
  if(x.k)return soloKahoot(x.k,r);
  const R=ROUNDS[x.r];$("#ttl").innerHTML=`On your own · <span>${R.short}</span>`;
  const probs=[{p:GEN[x.r](r,false,r()<.5?0:1),worth:MAIN_PTS,lab:"Main problem"}];
  for(let k=0;k<SOLO_QUICK;k++)probs.push({p:QUICK[x.r](r),worth:BONUS_PTS,lab:"Quick "+(k+1)});
  let i=0;
  const next=()=>{i++;if(i<probs.length)run();else{S.step++;soloStep()}};
  const run=()=>{const q=probs[i];soloProblem(q.p,q.worth,`${R.short} · ${q.lab}`,got=>{soloAdd(x.r,got,q.worth)},next)};
  run();
}
function soloProblem(p,worth,label,onScore,onNext){
  const stages=p.full?p.stages:[p],stageW=Math.round(worth/stages.length);let s=0;
  const one=()=>{
    const sg=stages[s];let tries=0,used=0;
    app.innerHTML=`<div class="panel">${soloHead(label)}${p.full?`<div class="steps">${stages.map((y,k)=>`<span class="${k<s?"ok":k===s?"on":""}">${y.name}</span>`).join("")}</div>`:""}
     <div class="work" style="${sg.wide?"grid-template-columns:1fr":""}"><div class="prob"><div class="co">${p.title}<span class="tag">up to ${stageW} pts</span></div><p>${sg.text||p.text}</p>${(sg.facts||p.facts)?`<dl class="facts">${(sg.facts||p.facts).map(([a,c])=>`<dt>${a}</dt><dd>${c}</dd>`).join("")}</dl>`:""}${hintsHTML()}</div>
     <div>${fieldsHTML(sg.fields,sg.wide)}${sg.je?jeHTML(sg.je):""}<div id="fb"></div><div class="acts"><button class="btn" id="chk">Check</button><button class="btn sec" id="nx" style="display:none">Next</button></div></div></div></div>`;
    mountHints(sg.hints,stageW,used,u=>{used=u});
    $("#chk").onclick=()=>{tries++;const res=grade(sg.fields,sg.je);
      if(res.ok){const w=Math.round(stageW*HINT_MULT[used]),got=tries===1?w:Math.round(w/2);$("#hbtn")&&$("#hbtn").remove();onScore(got);$("#fb").innerHTML=`<div class="fb ok"><b>Correct! +${got} points${tries>1?" (second try)":""}.</b><br>${sg.why}</div>`;fin()}
      else if(tries<2)$("#fb").innerHTML=`<div class="fb no"><b>Not yet.</b> The red boxes are off. Check your work and try once more for half points.</div>`;
      else{$("#hbtn")&&$("#hbtn").remove();onScore(0);showAnswers(sg.fields,sg.je);$("#fb").innerHTML=`<div class="fb show"><b>Here's how it works.</b>${p.full&&s<stages.length-1?" Use these numbers for the next step.":""}<br>${sg.why}</div>`;fin()}};
    function fin(){$("#chk").style.display="none";$("#nx").style.display="";$("#nx").focus();$("#nx").onclick=()=>{s++;s<stages.length?one():onNext()}}
  };
  one();
}
function soloKahoot(k,r){
  $("#ttl").innerHTML=`On your own · <span>Kahoot ${k}: ${KNAME[k]}</span>`;
  const bank=REVIEW?KAHOOT_R:KAHOOT;
  const qs=shuffle(r,bank[k]).slice(0,SOLO_KQ).map(([q,o,a,h])=>{const idx=shuffle(r,[0,1,2,3]);return{q,o:idx.map(i=>o[i]),a:idx.indexOf(a),h}});
  const SH=["▲","◆","●","■"];let qi=0;
  const ask=()=>{
    const q=qs[qi];let max=SOLO_KMAX,answered=false;
    app.innerHTML=`<div class="panel">${soloHead(`Kahoot ${k}: ${KNAME[k]} · Question ${qi+1} of ${qs.length}`)}
     <div class="kq">${q.q}</div>${q.h?`<div class="center" id="khb" style="margin:-6px 0 12px"><button class="btn hbtn" id="kh">💡 Hint: drops this to ${SOLO_KMAX/2}</button></div>`:""}
     <div class="kopts">${q.o.map((o,j)=>`<button class="kopt" data-k="${j}"><span class="sh">${SH[j]}</span><span>${o}</span></button>`).join("")}</div><div id="kf"></div></div>`;
    if($("#kh"))$("#kh").onclick=()=>{max=SOLO_KMAX/2;$("#khb").innerHTML=`<div class="hint" style="display:inline-block;text-align:left;font-size:1.1em"><b>Hint:</b> ${q.h}</div>`};
    app.querySelectorAll(".kopt").forEach(el=>el.onclick=()=>{
      if(answered)return;answered=true;const j=+el.dataset.k,ok=j===q.a,got=ok?max:0;soloAdd("k"+k,got,SOLO_KMAX);
      app.querySelectorAll(".kopt").forEach((e2,ix)=>e2.classList.add(ix===q.a?"right":"dim"));
      $("#khb")&&$("#khb").remove();
      $("#kf").innerHTML=`<div class="fb ${ok?"ok":"no"}" style="font-size:1.15em"><b>${ok?"Correct! +"+got:"Not this time."}</b>${ok?"":" The answer was: "+q.o[q.a]+"."}${q.h&&!ok?" "+q.h:""}</div><div class="acts" style="justify-content:center"><button class="btn" id="nk">${qi<qs.length-1?"Next question":"Keep going ▶"}</button></div>`;
      $("#nk").focus();$("#nk").onclick=()=>{qi++;if(qi<qs.length)ask();else{SOLO.step++;soloStep()}};
    });
  };
  ask();
}
function soloEnd(){
  const S=SOLO,best=store.get("tibSoloBest",0),isBest=S.pts>best;if(isBest)store.set("tibSoloBest",S.pts);
  $("#ttl").innerHTML=`On your own · <span>Results</span>`;
  const rows=SOLO_PLAN.map(x=>{const key=x.k?"k"+x.k:x.r,b=S.by[key]||{got:0,max:0},pc=b.max?b.got/b.max:0;
    return `<tr><td>${x.k?"Kahoot: "+KNAME[x.k]:ROUNDS[x.r].short}</td><td style="text-align:right"><b>${fmt(b.got)}</b> / ${fmt(b.max)}</td><td style="width:40%"><div style="height:12px;background:#eee;border-radius:9px;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(3,pc*100)}%;background:${pc>=.8?"var(--ok)":pc>=.5?"var(--gold)":"var(--red)"}"></i></div></td></tr>`}).join("");
  const weak=SOLO_PLAN.filter(x=>x.r).map(x=>({x,b:S.by[x.r]||{got:0,max:1}})).sort((a,b)=>a.b.got/a.b.max-b.b.got/b.b.max).slice(0,2);
  app.innerHTML=`<div class="panel" style="max-width:820px;margin:20px auto"><div class="muted">Teach It Back · Review · on your own</div><h1 style="font-size:46px;margin:4px 0">${fmt(S.pts)} points</h1>
   <p>${isBest?"That's your new best!":best?`Your best is ${fmt(best)}.`:""}</p>
   <table style="width:100%;border-collapse:collapse;margin:10px 0">${rows}</table>
   <p><b>Practice next:</b> ${weak.map(w=>ROUNDS[w.x.r].short).join(" and ")}. Play again for new numbers, or try <a href="/practice-hedging-desk">The Hedging Desk</a>.</p>
   <div class="acts"><button class="btn" id="sagain">Play again</button><button class="btn sec" id="shome">Back</button></div></div>`;
  $("#sagain").onclick=()=>{SOLO={seed:Math.floor(Math.random()*1e9),step:0,pts:0,by:{}};soloStep()};
  $("#shome").onclick=soloHome;
}
function mmss(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
/* ---------- start ---------- */
if(ROLE==="teacher"){$("#pvBtn").style.display="none";app.style.maxWidth="1700px";$("#homeBtn").style.display="none";hostSetup()}
else{const s=store.get(SKEY,null),qc=params.get("code");if(s&&s.code&&s.pid&&(!qc||qc===s.code))startDevice(s);else if(REVIEW&&!qc)soloHome();else joinForm()}

