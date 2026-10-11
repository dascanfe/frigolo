import sharp from 'sharp'
const f=process.argv[2]; const {data,info}=await sharp(f).resize(390).raw().toBuffer({resolveWithObject:true})
const W=info.width,H=info.height,c=info.channels
const px=(x,y)=>{const i=(y*W+x)*c;return [data[i],data[i+1],data[i+2]]}
const tgt=process.argv[3]==='sage'?[139,155,143]:[196,98,44]
const m=new Uint8Array(W*H)
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=px(x,y);if(Math.hypot(p[0]-tgt[0],p[1]-tgt[1],p[2]-tgt[2])<22)m[y*W+x]=1}
const seen=new Uint8Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!m[y*W+x]||seen[y*W+x])continue;let st=[[x,y]],x0=x,x1=x,y0=y,y1=y,n=0;seen[y*W+x]=1;while(st.length){const[a,b]=st.pop();n++;x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const u=a+dx,v=b+dy;if(u>=0&&v>=0&&u<W&&v<H&&m[v*W+u]&&!seen[v*W+u]){seen[v*W+u]=1;st.push([u,v])}}}
if(n>1500)console.log(`x${x0} y${y0} w${x1-x0} h${y1-y0}`)}
