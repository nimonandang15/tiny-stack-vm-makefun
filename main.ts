// Tiny stack VM, ISA v1: runs /input/<id>/program.bin on /input/<id>/input.bin,
// writes /output/<id>/stdout.bin + exit.txt. 32-bit wrapping ints, 256 stack,
// 64 call stack, 256 words memory, 1e6 steps, 65536 output bytes, ten traps.
import{mkdirSync as m,readdirSync as d,readFileSync as r,writeFileSync as w}from"node:fs";
import{join as j}from"node:path";
const E=new TextEncoder;
function run(p,q){
const S=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
let s=0,c=0,l=0,i=0,pc=0,n=0;
const f=x=>({out:o.subarray(0,l),code:x});
for(;;){
if(n===1e6)return f(10);
if(pc<0||pc>=p.length)return f(9);
const op=p[pc],im=op===1?1:op===2?4:op>=48&&op<=51?2:0;
if(op!==0&&op!==1&&op!==2&&!(op>=3&&op<=7)&&!(op>=16&&op<=34&&op!==31)&&!(op>=48&&op<=52)&&!(op>=64&&op<=65)&&!(op>=80&&op<=83))return f(5);
if(pc+im>=p.length)return f(9);
n++;
const x=pc+1+im;
let a=0,b=0;
if(op===1||op===2||op===82)b=1;
else if(op===3||op===80||op===81||op===83)a=1;
else if(op===4){a=1;b=2}
else if(op===5){a=2;b=2}
else if(op===49||op===50)a=1;
else if(op===6){a=2;b=3}
else if(op===7){a=3;b=3}
else if(op>=16&&op<=34&&op!==23&&op!==27){a=2;b=1}
else if(op===23||op===27||op===64){a=1;b=1}
else if(op===65)a=2;
if(s<a)return f(2);
if(s-a+b>256)return f(3);
pc=x;
switch(op){
case 0:return f(0);
case 1:S[s++]=(p[x-1]<<24)>>24;break;
case 2:S[s++]=p[x-4]|p[x-3]<<8|p[x-2]<<16|p[x-1]<<24;break;
case 3:s--;break;
case 4:S[s]=S[s-1];s++;break;
case 5:{const t=S[s-1];S[s-1]=S[s-2];S[s-2]=t;break}
case 6:S[s]=S[s-2];s++;break;
case 7:{const t=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=t;break}
case 23:S[s-1]=-S[s-1]|0;break;
case 27:S[s-1]=~S[s-1];break;
case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
const B=S[s-1],A=S[s-2];let v=0;
if(op===16)v=A+B|0;
else if(op===17)v=A-B|0;
else if(op===18)v=Math.imul(A,B);
else if(op===19){if(!B)return f(4);v=A===-2147483648&&B===-1?A:A/B|0}
else if(op===20){if(!B)return f(4);v=B===-1?0:A%B|0}
else if(op===21){if(!B)return f(4);v=Math.floor((A>>>0)/(B>>>0))|0}
else if(op===22){if(!B)return f(4);v=(A>>>0)%(B>>>0)|0}
else if(op===24)v=A&B;
else if(op===25)v=A|B;
else if(op===26)v=A^B;
else if(op===28)v=A<<(B&31);
else if(op===29)v=A>>(B&31);
else if(op===30)v=(A>>>(B&31))|0;
else if(op===32)v=A===B?1:0;
else if(op===33)v=A<B?1:0;
else v=(A>>>0)<(B>>>0)?1:0;
s-=2;S[s++]=v;break}
case 48:case 49:case 50:{
const t=(p[x-2]|p[x-1]<<8)<<16>>16;let k=1;
if(op!==48){const v=S[--s];k=op===49?v===0:v!==0}
if(k)pc=x+t;break}
case 51:if(c===64)return f(7);C[c++]=x;pc=p[x-2]|p[x-1]<<8;break;
case 52:if(!c)return f(8);pc=C[--c];break;
case 64:{const A=S[s-1];if(A<0||A>255)return f(6);S[s-1]=M[A];break}
case 65:{const A=S[s-1],v=S[s-2];if(A<0||A>255)return f(6);s-=2;M[A]=v;break}
case 80:{const y=E.encode(String(S[s-1]));if(l+y.length>65536)return f(11);s--;o.set(y,l);l+=y.length;break}
case 81:if(l+1>65536)return f(11);o[l++]=S[--s]&255;break;
case 82:S[s++]=i<q.length?q[i++]:-1;break;
case 83:return f(S[--s]&255);
default:return f(5);
}
}
}
const I=process.env.MAKEFUN_INPUT_DIR??"/input",O=process.env.MAKEFUN_OUTPUT_DIR??"/output";
for(const id of d(I).sort()){let g;try{g=run(new Uint8Array(r(j(I,id,"program.bin"))),new Uint8Array(r(j(I,id,"input.bin"))))}catch{g={out:new Uint8Array(0),code:9}}m(j(O,id),{recursive:!0});w(j(O,id,"stdout.bin"),g.out);w(j(O,id,"exit.txt"),g.code+"\n")}
