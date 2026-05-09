import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { storageGet, storageSet } from "./storage.js";

const INITIAL_PLAYERS = [
  { id:1, name:"Hieu Ta" }, { id:2, name:"Thanh" }, { id:3, name:"Thong Nguyen" },
  { id:4, name:"Tạ Quang Khánh" }, { id:5, name:"Nhat Nguyen" }, { id:6, name:"Đặng Anh Vũ" },
  { id:7, name:"Mạnh Tài" }, { id:8, name:"Thịnh" }, { id:9, name:"Mr Tài" }, { id:10, name:"Thành" },
];

const ITEMS = [
  { id:1, icon:"🎨", title:"Banner giải", desc:"Thiết kế · In ấn · Treo banner trên sân" },
  { id:2, icon:"🏆", title:"Cúp & Huy chương", desc:"4 cúp (nhất/nhì/đồng hạng 3) + huy chương kỷ niệm" },
  { id:3, icon:"🔊", title:"Loa + Mic", desc:"Cá nhân hoặc thuê" },
  { id:4, icon:"👨‍⚖️", title:"Trọng tài (x2)", desc:"Ưu tiên bạn bè có chuyên môn / coach phí thấp / miễn phí" },
  { id:5, icon:"📋", title:"Vận hành giải", desc:"Theo dõi tỉ số, gọi VĐV, sắp xếp sân xuyên suốt" },
  { id:6, icon:"🩺", title:"Y tế", desc:"Hỗ trợ chuột rút, căng cơ trong ngày thi đấu" },
  { id:7, icon:"📸", title:"Chụp hình", desc:"Ghi lại khoảnh khắc giải đấu" },
  { id:8, icon:"🎬", title:"Quay phim", desc:"Quay video trận đấu & lễ trao giải" },
  { id:9, icon:"🧃", title:"Hậu cần", desc:"Nước uống · Trái cây cho VĐV và BTC" },
  { id:10, icon:"🎁", title:"Quà lưu niệm / Tài trợ", desc:"Quà từ các nhà tài trợ" },
];

const emptyRegs = () => Object.fromEntries(ITEMS.map(it=>[it.id, []]));

const freshState = () => ({
  players: INITIAL_PLAYERS.map(p=>({...p})),
  matches: { 1:[], 2:[], 3:[] },
  semis: [], final: null, r1Set: false,
  r1Pairs: Array(5).fill(null).map(()=>({p1:"",p2:""})),
  regs: emptyRegs(),
});

const POS = {
  "1-0":{time:"7:00–7:30",court:1},"1-1":{time:"7:00–7:30",court:2},
  "1-2":{time:"7:30–8:00",court:1},"1-3":{time:"7:30–8:00",court:2},
  "1-4":{time:"8:00–8:30",court:1},"2-0":{time:"8:00–8:30",court:2},
  "2-1":{time:"8:30–9:00",court:1},"2-2":{time:"8:30–9:00",court:2},
  "2-3":{time:"9:00–9:30",court:1},"2-4":{time:"9:00–9:30",court:2},
  "3-0":{time:"9:30–10:00",court:1},"3-1":{time:"9:30–10:00",court:2},
  "3-2":{time:"10:00–10:30",court:1},"3-3":{time:"10:00–10:30",court:2},
  "3-4":{time:"10:30–11:00",court:1},
};
const ALL_TIMES=["7:00–7:30","7:30–8:00","8:00–8:30","8:30–9:00","9:00–9:30","9:30–10:00","10:00–10:30","10:30–11:00"];
const KEY="angels-tournament-v3";
const PASS="686969";


function ConfirmModal({message,onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"16px"}}>
      <div style={{background:"#172a1d",border:"1px solid rgba(239,68,68,.35)",borderRadius:"12px",padding:"24px",maxWidth:"300px",width:"100%"}}>
        <div style={{fontSize:"22px",marginBottom:"10px",textAlign:"center"}}>⚠️</div>
        <div style={{fontSize:"13px",color:"rgba(200,220,200,.7)",lineHeight:1.6,textAlign:"center",marginBottom:"20px",whiteSpace:"pre-line"}}>{message}</div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:"7px",border:"1px solid #2c482e",background:"#091315",color:"#e8f0e8",cursor:"pointer",fontWeight:600,fontSize:"13px"}}>Hủy</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",borderRadius:"7px",border:"1px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.22)",color:"#f87171",cursor:"pointer",fontWeight:600,fontSize:"13px"}}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [state,setState]=useState(freshState);
  const [tab,setTab]=useState("schedule");
  const [isAdmin,setIsAdmin]=useState(false);
  const [codeInput,setCodeInput]=useState("");
  const [showLogin,setShowLogin]=useState(false);
  const [newPlayer,setNewPlayer]=useState("");
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState(null);
  const [showResetConfirm,setShowResetConfirm]=useState(false);

  // Registration form state
  const [activeReg,setActiveReg]=useState(null); // item id
  const [regName,setRegName]=useState("");
  const [regType,setRegType]=useState("responsible"); // sponsor100 | sponsorPct | responsible
  const [regPct,setRegPct]=useState("");
  const [regNote,setRegNote]=useState("");

  const saveTimer=useRef(null);
  const latestState=useRef(state);

  useEffect(()=>{
    const link=document.createElement("link");
    link.href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap";
    link.rel="stylesheet";
    document.head.appendChild(link);
    const style=document.createElement("style");
    style.textContent=`*{box-sizing:border-box;margin:0;padding:0}select option{background:#091315;color:#e8f0e8}input[type=number]::-webkit-inner-spin-button{opacity:.4}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#54734e;border-radius:2px}@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.fade{animation:fadeIn .25s ease}@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
    return()=>{try{document.head.removeChild(link);document.head.removeChild(style);}catch{}};
  },[]);

  const load=useCallback(async()=>{
    const data=await storageGet();
    if(data){
      // ensure regs field exists for old saved data
      if(!data.regs) data.regs=emptyRegs();
      setState(data);
    }
    setLastSync(new Date());
    setLoading(false);
  },[]);

  useEffect(()=>{load();const iv=setInterval(load,30000);return()=>clearInterval(iv);},[load]);

  const update=useCallback((updater)=>{
    setState(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      latestState.current=next;
      if(saveTimer.current)clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(async()=>{
        const ok=await storageSet(latestState.current);
        if(ok)setLastSync(new Date());
      },600);
      return next;
    });
  },[]);

  const doReset=useCallback(async()=>{
    const fresh=freshState();
    await storageSet(fresh);
    setState(fresh);
    latestState.current=fresh;
    setLastSync(new Date());
    setShowResetConfirm(false);
  },[]);

  const {players,matches,semis,final,r1Set,r1Pairs,regs}=state;
  const getName=id=>players.find(p=>p.id===id)?.name||"?";

  const allGroupMatches=useMemo(()=>[...(matches[1]||[]),...(matches[2]||[]),...(matches[3]||[])],[matches]);

  const standings=useMemo(()=>{
    const stats={};
    players.forEach(p=>{stats[p.id]={wins:0,losses:0,points:0,gamesWon:0,gamesLost:0,played:0};});
    allGroupMatches.forEach(m=>{
      if(!m.completed||!m.winner)return;
      const loser=m.winner===m.p1?m.p2:m.p1;
      stats[m.p1].played++;stats[m.p2].played++;
      stats[m.p1].gamesWon+=(m.s1??0);stats[m.p1].gamesLost+=(m.s2??0);
      stats[m.p2].gamesWon+=(m.s2??0);stats[m.p2].gamesLost+=(m.s1??0);
      stats[m.winner].wins++;stats[m.winner].points+=3;stats[loser].losses++;
    });
    return players.map(p=>({...p,...stats[p.id]})).sort((a,b)=>b.points-a.points||(b.gamesWon-b.gamesLost)-(a.gamesWon-a.gamesLost));
  },[players,allGroupMatches]);

  const isRoundDone=r=>{const rm=matches[r]||[];return rm.length===5&&rm.every(m=>m.completed);};

  const generateSwiss=r=>{
    const used=new Set(),pairs=[];
    for(const p of standings){if(used.has(p.id))continue;for(const q of standings){if(used.has(q.id)||q.id===p.id)continue;const played=allGroupMatches.some(m=>(m.p1===p.id&&m.p2===q.id)||(m.p1===q.id&&m.p2===p.id));if(!played){pairs.push({p1:p.id,p2:q.id,s1:null,s2:null,winner:null,completed:false,tiebreak:false});used.add(p.id);used.add(q.id);break;}}}
    update(prev=>({...prev,matches:{...prev.matches,[r]:pairs}}));
  };

  const confirmR1=()=>{
    const ids=new Set();
    for(const pair of r1Pairs){const p1=parseInt(pair.p1),p2=parseInt(pair.p2);if(!p1||!p2||p1===p2){alert("Cặp không hợp lệ!");return;}if(ids.has(p1)||ids.has(p2)){alert("Mỗi VĐV chỉ 1 trận/lượt!");return;}ids.add(p1);ids.add(p2);}
    if(ids.size!==players.length){alert(`Cần chọn đủ ${players.length} VĐV!`);return;}
    update(prev=>({...prev,r1Set:true,matches:{...prev.matches,1:prev.r1Pairs.map(pair=>({p1:parseInt(pair.p1),p2:parseInt(pair.p2),s1:null,s2:null,winner:null,completed:false,tiebreak:false}))}}));
  };

  const updateScore=(round,idx,field,val)=>update(prev=>{
    const arr=[...prev.matches[round]];
    const m={...arr[idx],[field]:val===""?null:parseInt(val),winner:null,completed:false,tiebreak:false};
    if(m.s1!==null&&m.s2!==null){if(m.s1!==m.s2){m.winner=m.s1>m.s2?m.p1:m.p2;m.completed=true;}else if(m.s1===4&&m.s2===4)m.tiebreak=true;}
    arr[idx]=m;return{...prev,matches:{...prev.matches,[round]:arr}};
  });

  const setTBWinner=(round,idx,wid)=>update(prev=>{const arr=[...prev.matches[round]];arr[idx]={...arr[idx],winner:wid,completed:true};return{...prev,matches:{...prev.matches,[round]:arr}};});
  const setupSemis=()=>{const t=standings.slice(0,4);update(prev=>({...prev,semis:[{id:0,label:"Bán kết 1",court:1,p1:t[0].id,p2:t[3].id,s1:null,s2:null,winner:null,completed:false},{id:1,label:"Bán kết 2",court:2,p1:t[1].id,p2:t[2].id,s1:null,s2:null,winner:null,completed:false}]}));};
  const updateSemi=(idx,field,val)=>update(prev=>{const arr=[...prev.semis];const sf={...arr[idx],[field]:val===""?null:parseInt(val)};if(sf.s1!==null&&sf.s2!==null&&sf.s1!==sf.s2){sf.winner=sf.s1>sf.s2?sf.p1:sf.p2;sf.completed=true;}arr[idx]=sf;return{...prev,semis:arr};});
  const createFinal=()=>{if(semis[0]?.winner&&semis[1]?.winner)update(prev=>({...prev,final:{p1:prev.semis[0].winner,p2:prev.semis[1].winner,s1:null,s2:null,winner:null,completed:false}}));};
  const updateFinal=(field,val)=>update(prev=>{const f={...prev.final,[field]:val===""?null:parseInt(val)};if(f.s1!==null&&f.s2!==null&&f.s1!==f.s2){f.winner=f.s1>f.s2?f.p1:f.p2;f.completed=true;}return{...prev,final:f};});
  const setR1Pair=(i,field,val)=>update(prev=>{const pairs=[...prev.r1Pairs];pairs[i]={...pairs[i],[field]:val};return{...prev,r1Pairs:pairs};});

  // Registration actions
  const submitReg=(itemId)=>{
    if(!regName.trim())return;
    const entry={name:regName.trim(),type:regType,pct:regType==="sponsorPct"?regPct:"",note:regNote.trim(),ts:Date.now()};
    update(prev=>{
      const newRegs={...prev.regs,[itemId]:[...(prev.regs[itemId]||[]),entry]};
      return{...prev,regs:newRegs};
    });
    setRegName("");setRegType("responsible");setRegPct("");setRegNote("");setActiveReg(null);
  };
  const deleteReg=(itemId,ts)=>update(prev=>({...prev,regs:{...prev.regs,[itemId]:(prev.regs[itemId]||[]).filter(r=>r.ts!==ts)}}));

  // ── Design tokens ──────────────────────────────────────────
  // Green palette: #091315 #172a1d #2c482e #54734e #8ba47d
  const G="#D4AF37",GR="#8ba47d",RE="#f87171",TX="#e8f0e8",DM="rgba(200,220,200,.4)";
  const BG0="#091315",BG1="#172a1d",BG2="#2c482e",MID="#54734e",LT="#8ba47d";
  const card={background:BG1,border:`1px solid ${BG2}`,borderRadius:"10px",padding:"14px",marginBottom:"10px"};
  const gcard={background:`linear-gradient(135deg,${BG1} 0%,${BG2} 100%)`,border:`1px solid ${MID}55`,borderRadius:"10px",padding:"14px",marginBottom:"10px"};
  const rcard={background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:"10px",padding:"16px"};
  const inp={background:BG0,border:`1px solid ${BG2}`,borderRadius:"6px",color:TX,padding:"7px 10px",fontSize:"13px",outline:"none",width:"100%"};
  const btn=(v="")=>({padding:v==="sm"?"5px 10px":v==="xs"?"3px 8px":"9px 18px",borderRadius:"7px",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:v==="sm"||v==="xs"?"11px":"13px",
    border:v==="danger"||v==="reset"?"1px solid rgba(239,68,68,.35)":v==="gold"?`1px solid ${G}44`:`1px solid ${BG2}`,
    background:v==="gold"?MID:v==="danger"?"rgba(239,68,68,.14)":v==="reset"?"rgba(239,68,68,.2)":v==="green"?`rgba(84,115,78,.3)`:BG2,
    color:v==="gold"?TX:v==="danger"||v==="reset"?RE:v==="green"?LT:TX});
  const badge=c=>({display:"inline-flex",alignItems:"center",padding:"2px 7px",borderRadius:"4px",fontSize:"9px",fontWeight:700,letterSpacing:".1em",
    background:c==="g"?`rgba(139,164,125,.15)`:c==="b"?"rgba(96,165,250,.11)":`rgba(84,115,78,.2)`,
    color:c==="g"?LT:c==="b"?"#60a5fa":LT,
    border:`1px solid ${c==="g"?LT+"44":c==="b"?"rgba(96,165,250,.22)":MID+"44"}`});
  const mc=done=>({background:done?`rgba(44,72,46,.35)`:`rgba(23,42,29,.6)`,border:`1px solid ${done?MID:BG2}`,borderRadius:"8px",padding:"10px",marginBottom:"8px"});
  const rh={fontFamily:"'Bebas Neue',sans-serif",fontSize:"17px",letterSpacing:".08em",color:LT,marginBottom:"10px"};
  const sf={fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:LT};
  const vs={fontSize:"9px",color:`rgba(139,164,125,.4)`,fontWeight:700,letterSpacing:".15em"};
  const lbl={fontSize:"9px",color:DM,letterSpacing:".12em",marginBottom:"3px"};

  const SI=({label,val,onChange})=>(<div style={{flex:1}}><div style={lbl}>{label}</div><input type="number" min="0" max="5" value={val??""} onChange={e=>onChange(e.target.value)} style={inp} placeholder="0–5"/></div>);

  const MatchRow=({m,court})=>(
    <div style={mc(m.completed)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={badge("")}>SÂN {court}</span><span style={{fontSize:"9px",color:DM}}>LƯỢT {m.round}</span>
        {m.completed&&<span style={badge("g")}>✓ XONG</span>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:"13px",fontWeight:500,color:m.winner===m.p1?G:TX}}>{m.winner===m.p1?"🏆 ":""}{getName(m.p1)}</div>
          <div style={{...vs,margin:"3px 0"}}>VS</div>
          <div style={{fontSize:"13px",fontWeight:500,color:m.winner===m.p2?G:TX}}>{m.winner===m.p2?"🏆 ":""}{getName(m.p2)}</div>
        </div>
        {m.completed&&<div style={{textAlign:"right"}}><div style={sf}>{m.s1} – {m.s2}</div>{m.tiebreak&&<div style={{fontSize:"8px",color:"rgba(139,164,125,.7)"}}>TIEBREAK</div>}</div>}
      </div>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────
  if(loading)return(
    <div style={{minHeight:"100vh",background:"#091315",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"36px",color:"#8ba47d",letterSpacing:".06em"}}>THE ANGELS</div>
      <div style={{fontSize:"10px",color:"rgba(139,164,125,.45)",letterSpacing:".2em",marginTop:"4px"}}>LOADING...</div>
      <div style={{marginTop:"20px",width:"22px",height:"22px",border:`2px solid rgba(44,72,46,.4)`,borderTopColor:"#54734e",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  // ── Registration Tab ───────────────────────────────────────
  const regTypeLabel=(type,pct)=>{
    if(type==="sponsor100")return{text:"Tài trợ 100%",c:"g"};
    if(type==="sponsorPct")return{text:`Tài trợ ${pct}%`,c:"b"};
    return{text:"Chịu trách nhiệm",c:""};
  };

  const regView=()=>(
    <div className="fade">
      <div style={gcard}>
        <div style={{fontSize:"9px",color:"rgba(139,164,125,.55)",letterSpacing:".35em"}}>PHÂN CÔNG & TÀI TRỢ</div>
        <div style={{fontSize:"12px",color:"rgba(200,220,200,.45)",marginTop:"3px"}}>Ai phụ trách hạng mục nào? Bấm đăng ký bên dưới 👇</div>
      </div>

      <div style={{...card,background:"rgba(44,72,46,.15)",border:"1px solid #2c482e",marginBottom:"14px",fontSize:"12px",color:"rgba(255,255,255,.5)",lineHeight:1.7}}>
        <div style={{fontWeight:600,color:G,marginBottom:"4px"}}>📌 Lưu ý</div>
        Mỗi người chịu trách nhiệm có thể chọn:<br/>
        <span style={{color:GR}}>● Tài trợ 100%</span> &nbsp;·&nbsp;
        <span style={{color:"#60a5fa"}}>● Tài trợ một phần (%)</span> &nbsp;·&nbsp;
        <span style={{color:G}}>● Chịu trách nhiệm + báo chi phí cho BTC</span>
      </div>

      {ITEMS.map(item=>{
        const itemRegs=(regs[item.id]||[]);
        const isOpen=activeReg===item.id;
        return(
          <div key={item.id} style={{...card,marginBottom:"10px"}}>
            {/* Item header */}
            <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:itemRegs.length>0||isOpen?"10px":"0"}}>
              <div style={{fontSize:"22px",lineHeight:1,marginTop:"1px"}}>{item.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:"14px",fontWeight:600}}>{item.title}</div>
                <div style={{fontSize:"11px",color:DM,marginTop:"2px"}}>{item.desc}</div>
              </div>
              <button style={{...btn(isOpen?"danger":"sm"),fontSize:"11px",whiteSpace:"nowrap"}} onClick={()=>{setActiveReg(isOpen?null:item.id);setRegName("");setRegType("responsible");setRegPct("");setRegNote("");}}>
                {isOpen?"✕ Đóng":"+ Đăng ký"}
              </button>
            </div>

            {/* Existing registrations */}
            {itemRegs.length>0&&(
              <div style={{marginBottom:isOpen?"10px":"0"}}>
                {itemRegs.map((r,i)=>{
                  const tl=regTypeLabel(r.type,r.pct);
                  return(
                    <div key={r.ts||i} style={{display:"flex",alignItems:"flex-start",gap:"8px",padding:"6px 8px",background:"rgba(9,19,21,.6)",borderRadius:"6px",marginBottom:"4px"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                          <span style={{fontSize:"13px",fontWeight:500}}>{r.name}</span>
                          <span style={badge(tl.c)}>{tl.text}</span>
                        </div>
                        {r.note&&<div style={{fontSize:"11px",color:"rgba(200,220,200,.5)",marginTop:"2px"}}>📝 {r.note}</div>}
                      </div>
                      <button onClick={()=>deleteReg(item.id,r.ts)} style={{...btn("xs"),background:"transparent",border:"none",color:"rgba(200,220,200,.3)",fontSize:"12px",padding:"2px 4px"}}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
            {itemRegs.length===0&&!isOpen&&(
              <div style={{fontSize:"11px",color:"rgba(200,220,200,.25)",marginTop:"6px"}}>Chưa có ai đăng ký</div>
            )}

            {/* Registration form */}
            {isOpen&&(
              <div style={{background:"rgba(44,72,46,.2)",border:"1px solid #54734e",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"11px",color:G,fontWeight:600,marginBottom:"10px",letterSpacing:".05em"}}>ĐĂNG KÝ PHỤ TRÁCH</div>

                {/* Name */}
                <div style={{marginBottom:"10px"}}>
                  <div style={lbl}>Tên của bạn *</div>
                  <input placeholder="Nhập tên..." value={regName} onChange={e=>setRegName(e.target.value)} style={inp}/>
                </div>

                {/* Type */}
                <div style={{marginBottom:"10px"}}>
                  <div style={lbl}>Hình thức</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"4px"}}>
                    {[
                      {v:"sponsor100",label:"🟢 Tài trợ 100%"},
                      {v:"sponsorPct",label:"🔵 Tài trợ một phần (%)"},
                      {v:"responsible",label:"🟡 Chịu trách nhiệm · báo chi phí cho BTC"},
                    ].map(opt=>(
                      <label key={opt.v} style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"12px",color:regType===opt.v?TX:DM}}>
                        <div style={{width:"14px",height:"14px",borderRadius:"50%",border:`2px solid ${regType===opt.v?G:"rgba(255,255,255,.2)"}`,background:regType===opt.v?G:"transparent",flexShrink:0,cursor:"pointer"}} onClick={()=>setRegType(opt.v)}/>
                        <span onClick={()=>setRegType(opt.v)}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {regType==="sponsorPct"&&(
                    <input type="number" min="1" max="100" placeholder="Nhập % tài trợ..." value={regPct} onChange={e=>setRegPct(e.target.value)} style={{...inp,marginTop:"8px"}}/>
                  )}
                </div>

                {/* Note */}
                <div style={{marginBottom:"12px"}}>
                  <div style={lbl}>Ghi chú (không bắt buộc)</div>
                  <input placeholder="Thêm ghi chú..." value={regNote} onChange={e=>setRegNote(e.target.value)} style={inp} onKeyDown={e=>{if(e.key==="Enter")submitReg(item.id);}}/>
                </div>

                <button style={{...btn("gold"),width:"100%"}} onClick={()=>submitReg(item.id)} disabled={!regName.trim()}>
                  ✅ Xác nhận đăng ký
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div style={card}>
        <div style={rh}>📊 TỔNG KẾT</div>
        {ITEMS.map(item=>{
          const itemRegs=(regs[item.id]||[]);
          const done=itemRegs.length>0;
          return(
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #2c482e"}}>
              <span style={{fontSize:"12px",color:done?TX:DM}}>{item.icon} {item.title}</span>
              {done?<span style={badge("g")}>{itemRegs.length} người</span>:<span style={{fontSize:"10px",color:"rgba(200,220,200,.25)"}}>Trống</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Schedule ───────────────────────────────────────────────
  const scheduleView=()=>{
    const slotMap={};
    [1,2,3].forEach(r=>(matches[r]||[]).forEach((m,i)=>{const pos=POS[`${r}-${i}`];if(!pos)return;if(!slotMap[pos.time])slotMap[pos.time]={};slotMap[pos.time][pos.court]={...m,round:r};}));
    return(
      <div className="fade">
        <div style={gcard}><div style={{fontSize:"9px",color:"rgba(139,164,125,.55)",letterSpacing:".35em"}}>LỊCH THI ĐẤU</div><div style={{fontSize:"12px",color:"rgba(200,220,200,.45)",marginTop:"3px"}}>Chủ nhật 7/6/2026 · 7:00 sáng · 2 sân</div></div>
        {matches[1].length===0&&<div style={{...card,textAlign:"center",padding:"36px",color:DM,fontSize:"13px"}}>⏳ BTC chưa nhập cặp đấu Lượt 1</div>}
        {ALL_TIMES.map(t=>{const slot=slotMap[t];if(!slot)return null;return<div key={t} style={card}><div style={{fontSize:"10px",color:"rgba(139,164,125,.85)",fontWeight:700,letterSpacing:".12em",marginBottom:"8px"}}>⏰ {t}</div>{[1,2].map(c=>slot[c]?<MatchRow key={c} m={slot[c]} court={c}/>:null)}</div>;})}
        {semis.length>0&&<div style={card}><div style={rh}>🏅 BÁN KẾT — 11:15</div>{semis.map((sf2,i)=>(<div key={i} style={mc(sf2.completed)}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={badge("")}>SÂN {sf2.court}</span><span style={{fontSize:"9px",color:DM}}>{sf2.label}</span>{sf2.completed&&<span style={badge("g")}>✓</span>}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"13px",color:sf2.winner===sf2.p1?G:TX}}>{sf2.winner===sf2.p1?"🏆 ":""}{getName(sf2.p1)}</div><div style={{...vs,margin:"3px 0"}}>VS</div><div style={{fontSize:"13px",color:sf2.winner===sf2.p2?G:TX}}>{sf2.winner===sf2.p2?"🏆 ":""}{getName(sf2.p2)}</div></div>{sf2.completed&&<div style={sf}>{sf2.s1}–{sf2.s2}</div>}</div></div>))}</div>}
        {final&&<div style={gcard}><div style={rh}>👑 CHUNG KẾT — 12:00</div><div style={mc(final.completed)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"15px",fontWeight:600,color:final.winner===final.p1?G:TX}}>{final.winner===final.p1?"👑 ":""}{getName(final.p1)}</div><div style={{...vs,margin:"4px 0"}}>VS</div><div style={{fontSize:"15px",fontWeight:600,color:final.winner===final.p2?G:TX}}>{final.winner===final.p2?"👑 ":""}{getName(final.p2)}</div></div>{final.completed&&<div style={{...sf,fontSize:"30px"}}>{final.s1}–{final.s2}</div>}</div>{final.completed&&<div style={{marginTop:"10px",textAlign:"center",padding:"10px",background:"rgba(44,72,46,.4)",borderRadius:"6px"}}><div style={{fontSize:"8px",color:"rgba(139,164,125,.7)",letterSpacing:".22em"}}>VÔ ĐỊCH GIẢI</div><div style={{fontSize:"18px",fontWeight:700,color:G,marginTop:"3px"}}>👑 {getName(final.winner)}</div></div>}</div></div>}
      </div>
    );
  };

  // ── Standings ──────────────────────────────────────────────
  const standingsView=()=>{
    const rc=["#D4AF37","#C0C0C0","#CD7F32","#8ba47d"];
    return(
      <div className="fade">
        <div style={gcard}><div style={{fontSize:"9px",color:"rgba(139,164,125,.55)",letterSpacing:".35em"}}>BẢNG XẾP HẠNG</div><div style={{fontSize:"12px",color:"rgba(200,220,200,.4)",marginTop:"3px"}}>Top 4 tiến vào bán kết</div></div>
        <div style={card}>
          <div style={{display:"grid",gridTemplateColumns:"28px 1fr 34px 34px 54px",gap:"6px",paddingBottom:"8px",borderBottom:"1px solid #2c482e",fontSize:"9px",color:DM,letterSpacing:".12em",fontWeight:700}}><span>#</span><span>VĐV</span><span style={{textAlign:"center"}}>T</span><span style={{textAlign:"center"}}>B</span><span style={{textAlign:"right"}}>ĐM</span></div>
          {standings.map((p,i)=>{const it=i<4;return(<div key={p.id} style={{display:"grid",gridTemplateColumns:"28px 1fr 34px 34px 54px",gap:"6px",padding:"9px 0",borderBottom:i<standings.length-1?"1px solid rgba(255,255,255,.03)":"none",alignItems:"center"}}><div style={{width:"22px",height:"22px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,background:it?`rgba(${i===0?"212,175,55":i===1?"192,192,192":i===2?"205,127,50":"74,222,128"},.11)`:"rgba(255,255,255,.04)",color:it?rc[i]:DM,border:`1px solid ${it?rc[i]+"33":"rgba(255,255,255,.04)"}`}}>{i===0?"👑":i+1}</div><div><div style={{fontSize:"13px",fontWeight:it?600:400}}>{p.name}</div><div style={{fontSize:"9px",color:DM,marginTop:"1px"}}>{p.played}T · {p.gamesWon}G/{p.gamesLost}G</div></div><div style={{textAlign:"center",fontSize:"13px",color:GR}}>{p.wins}</div><div style={{textAlign:"center",fontSize:"13px",color:"rgba(239,68,68,.6)"}}>{p.losses}</div><div style={{textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:it?G:"rgba(255,255,255,.3)"}}>{p.points}</div></div>);})}
        </div>
        {isRoundDone(3)&&<div style={{...card,background:"rgba(44,72,46,.25)",border:"1px solid #54734e",textAlign:"center",padding:"12px"}}><div style={{fontSize:"12px",color:LT}}>✅ Vòng bảng hoàn tất</div><div style={{fontSize:"10px",color:"rgba(200,220,200,.4)",marginTop:"3px"}}>Top 4: {standings.slice(0,4).map(p=>p.name).join(" · ")}</div></div>}
      </div>
    );
  };

  // ── Finals ─────────────────────────────────────────────────
  const finalsView=()=>{
    if(!isRoundDone(3))return<div className="fade" style={{...card,textAlign:"center",padding:"48px 16px",color:DM}}><div style={{fontSize:"32px",marginBottom:"12px"}}>⏳</div><div style={{fontSize:"13px"}}>Chờ vòng bảng kết thúc</div></div>;
    const top4=standings.slice(0,4);
    return(
      <div className="fade">
        <div style={gcard}><div style={{fontSize:"9px",color:"rgba(139,164,125,.55)",letterSpacing:".35em"}}>VÒNG CHUNG KẾT</div></div>
        <div style={card}><div style={{...lbl,marginBottom:"8px"}}>TOP 4</div>{top4.map((p,i)=><div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<3?"1px solid rgba(255,255,255,.04)":"none"}}><span style={{fontSize:"13px"}}>#{i+1} &nbsp;{p.name}</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",color:G}}>{p.points}pts</span></div>)}</div>
        <div style={card}>
          <div style={{...lbl,marginBottom:"8px"}}>BÁN KẾT</div>
          {semis.length===0?<div style={{fontSize:"12px",color:"rgba(200,220,200,.3)",marginBottom:"10px"}}>Chưa tạo</div>:semis.map((sf2,i)=>(<div key={i} style={{...mc(sf2.completed),marginBottom:"6px"}}><div style={{fontSize:"9px",color:"rgba(139,164,125,.6)",letterSpacing:".1em",marginBottom:"5px"}}>{sf2.label}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"13px",color:sf2.winner===sf2.p1?G:TX}}>{sf2.winner===sf2.p1?"→ ":""}{getName(sf2.p1)}</div><div style={{...vs,margin:"2px 0"}}>VS</div><div style={{fontSize:"13px",color:sf2.winner===sf2.p2?G:TX}}>{sf2.winner===sf2.p2?"→ ":""}{getName(sf2.p2)}</div></div>{sf2.completed&&<div style={sf}>{sf2.s1}–{sf2.s2}</div>}</div></div>))}
          <div style={{...lbl,margin:"10px 0 8px"}}>CHUNG KẾT</div>
          {final?<div style={{...mc(final.completed),background:final.completed?"rgba(44,72,46,.25)":undefined}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"14px",fontWeight:600,color:final.winner===final.p1?G:TX}}>{final.winner===final.p1?"👑 ":""}{getName(final.p1)}</div><div style={{...vs,margin:"3px 0"}}>VS</div><div style={{fontSize:"14px",fontWeight:600,color:final.winner===final.p2?G:TX}}>{final.winner===final.p2?"👑 ":""}{getName(final.p2)}</div></div>{final.completed&&<div style={{...sf,fontSize:"28px"}}>{final.s1}–{final.s2}</div>}</div>{final.completed&&<div style={{marginTop:"10px",textAlign:"center",padding:"8px",background:"rgba(44,72,46,.4)",borderRadius:"6px"}}><div style={{fontSize:"8px",color:"rgba(139,164,125,.7)",letterSpacing:".22em"}}>VÔ ĐỊCH</div><div style={{fontSize:"17px",fontWeight:700,color:G,marginTop:"2px"}}>👑 {getName(final.winner)}</div></div>}</div>:<div style={{fontSize:"12px",color:"rgba(200,220,200,.3)"}}>Chờ kết quả bán kết</div>}
          {semis.filter(sf2=>sf2.completed).length===2&&<><div style={{...lbl,margin:"10px 0 8px"}}>🥉 ĐỒNG HẠNG BA</div><div style={mc(true)}>{semis.map((sf2,i)=>{const loser=sf2.winner===sf2.p1?sf2.p2:sf2.p1;return<div key={i} style={{fontSize:"13px",padding:"2px 0"}}>🥉 {getName(loser)}</div>;})}<div style={{fontSize:"9px",color:"rgba(200,220,200,.3)",marginTop:"4px"}}>Không cần đấu thêm</div></div></>}
        </div>
      </div>
    );
  };

  // ── Rules ──────────────────────────────────────────────────
  const rulesView=()=>(
    <div className="fade">
      {/* Hero */}
      <div style={{...gcard,textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"28px",letterSpacing:".08em",color:G}}>THE ANGELS</div>
        <div style={{fontSize:"10px",color:"rgba(139,164,125,.5)",letterSpacing:".25em",marginTop:"2px"}}>TENNIS TOURNAMENT · 07.06.2026</div>
      </div>

      {/* I. Thông tin giải */}
      <div style={card}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid #2c482e"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"13px",color:G,background:"rgba(44,72,46,.5)",border:"1px solid #54734e",borderRadius:"4px",padding:"2px 8px",letterSpacing:".1em"}}>I</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",letterSpacing:".08em",color:G}}>THÔNG TIN GIẢI ĐẤU</div>
        </div>

        {/* Thời gian */}
        <div style={{marginBottom:"14px"}}>
          <div style={{fontSize:"10px",color:"rgba(139,164,125,.65)",letterSpacing:".15em",fontWeight:700,marginBottom:"8px"}}>🗓 THỜI GIAN</div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {[
              {label:"Tập trung",value:"06:30 · Chủ nhật 07/06/2026"},
              {label:"Thi đấu",value:"07:30 – 11:30"},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(9,19,21,.6)",borderRadius:"6px"}}>
                <span style={{fontSize:"12px",color:DM}}>{row.label}</span>
                <span style={{fontSize:"13px",fontWeight:500,color:TX}}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Địa điểm */}
        <div style={{marginBottom:"14px"}}>
          <div style={{fontSize:"10px",color:"rgba(139,164,125,.65)",letterSpacing:".15em",fontWeight:700,marginBottom:"8px"}}>📍 ĐỊA ĐIỂM</div>
          <div style={{padding:"10px 12px",background:"rgba(9,19,21,.6)",borderRadius:"6px"}}>
            <div style={{fontSize:"13px",fontWeight:600,color:TX}}>Sân Tennis ĐHCS</div>
            <div style={{fontSize:"12px",color:DM,marginTop:"2px"}}>Highfive Tennis Club · Quận 7, TP.HCM</div>
          </div>
        </div>

        {/* Giải thưởng */}
        <div>
          <div style={{fontSize:"10px",color:"rgba(139,164,125,.65)",letterSpacing:".15em",fontWeight:700,marginBottom:"8px"}}>🏆 GIẢI THƯỞNG</div>
          <div style={{display:"flex",gap:"8px"}}>
            {[
              {rank:"🥇",label:"Vô địch",color:"#D4AF37",bg:"rgba(212,175,55,.12)"},
              {rank:"🥈",label:"Á quân",color:"#C0C0C0",bg:"rgba(192,192,192,.08)"},
              {rank:"🥉",label:"Đồng hạng 3",color:"#CD7F32",bg:"rgba(205,127,50,.08)"},
            ].map(g=>(
              <div key={g.rank} style={{flex:1,textAlign:"center",padding:"10px 6px",background:g.bg,border:`1px solid ${g.color}33`,borderRadius:"8px"}}>
                <div style={{fontSize:"20px"}}>{g.rank}</div>
                <div style={{fontSize:"10px",color:g.color,fontWeight:600,marginTop:"4px",lineHeight:1.3}}>{g.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* II. Thể thức */}
      <div style={card}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid #2c482e"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"13px",color:G,background:"rgba(44,72,46,.5)",border:"1px solid #54734e",borderRadius:"4px",padding:"2px 8px",letterSpacing:".1em"}}>II</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",letterSpacing:".08em",color:G}}>THỂ THỨC THI ĐẤU</div>
        </div>

        {[
          {num:"1",title:"Swiss 3 Vòng",items:["Mỗi VĐV thi đấu tối thiểu 3 trận","Cặp đấu được ghép chéo sau mỗi vòng để hạn chế tái đấu"]},
          {num:"2",title:"Xếp hạng vào Top 4 Bán Kết",items:["Số trận thắng","Hiệu số game (Game thắng – Game thua)","Đối đầu trực tiếp / Tie-break playoff nếu cần"]},
          {num:"3",title:"Bán Kết & Chung Kết",items:["Top 4 vào bán kết theo thứ hạng","2 trận bán kết diễn ra song song","Thua bán kết → Đồng hạng Ba (không đấu thêm)"]},
        ].map(section=>(
          <div key={section.num} style={{marginBottom:"14px",paddingBottom:"14px",borderBottom:"1px solid #2c482e"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(44,72,46,.5)",border:"1px solid #54734e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,color:LT,flexShrink:0}}>{section.num}</div>
              <div style={{fontSize:"13px",fontWeight:600,color:TX}}>{section.title}</div>
            </div>
            <div style={{paddingLeft:"28px",display:"flex",flexDirection:"column",gap:"5px"}}>
              {section.items.map((item,i)=>(
                <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  <div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#54734e",marginTop:"6px",flexShrink:0}}/>
                  <span style={{fontSize:"12px",color:DM,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* III. Luật thi đấu */}
      <div style={card}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid #2c482e"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"13px",color:G,background:"rgba(44,72,46,.5)",border:"1px solid #54734e",borderRadius:"4px",padding:"2px 8px",letterSpacing:".1em"}}>III</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",letterSpacing:".08em",color:G}}>LUẬT THI ĐẤU</div>
        </div>

        {/* Vòng loại */}
        <div style={{marginBottom:"14px",paddingBottom:"14px",borderBottom:"1px solid #2c482e"}}>
          <div style={{fontSize:"12px",fontWeight:700,color:TX,marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px"}}>
            <span style={{background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.25)",borderRadius:"4px",padding:"1px 7px",fontSize:"10px",color:GR,fontWeight:700,letterSpacing:".05em"}}>VÒNG LOẠI</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {[
              {icon:"⏱",text:"Mỗi trận tối đa 30 phút"},
              {icon:"🎯",text:"Chạm 5 games thắng"},
              {icon:"🎾",text:"40-40 → Banh vàng · Người trả giao bóng chọn bên"},
              {icon:"⚡",text:"Tỉ số 4-4 → Tie-break chạm 7 điểm, hơn 2"},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 10px",background:"rgba(9,19,21,.6)",borderRadius:"6px"}}>
                <span style={{fontSize:"14px",flexShrink:0}}>{row.icon}</span>
                <span style={{fontSize:"12px",color:TX,lineHeight:1.5}}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bán kết & Chung kết */}
        <div>
          <div style={{fontSize:"12px",fontWeight:700,color:TX,marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px"}}>
            <span style={{background:"rgba(44,72,46,.3)",border:"1px solid #54734e",borderRadius:"4px",padding:"1px 7px",fontSize:"10px",color:G,fontWeight:700,letterSpacing:".05em"}}>BÁN KẾT & CHUNG KẾT</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {[
              {icon:"🎯",text:"Chạm 6 games thắng"},
              {icon:"⚡",text:"Tỉ số 5-5 → Tie-break chạm 7 điểm, hơn 2"},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 10px",background:"rgba(9,19,21,.6)",borderRadius:"6px"}}>
                <span style={{fontSize:"14px",flexShrink:0}}>{row.icon}</span>
                <span style={{fontSize:"12px",color:TX,lineHeight:1.5}}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"16px",color:"rgba(200,220,200,.25)",fontSize:"11px"}}>
        🎾 The Angels Tennis Tournament · 07.06.2026
      </div>
    </div>
  );

  // ── Admin ──────────────────────────────────────────────────
  const adminView=()=>{
    if(!isAdmin)return(
      <div className="fade" style={{...card,textAlign:"center",padding:"40px 16px"}}>
        <div style={{fontSize:"28px",marginBottom:"10px"}}>🔐</div>
        <div style={{fontSize:"14px",fontWeight:600,marginBottom:"14px"}}>Khu vực BTC</div>
        {showLogin?<div>
          <input type="password" placeholder="Nhập mã BTC..." value={codeInput} onChange={e=>setCodeInput(e.target.value)} style={{...inp,textAlign:"center",marginBottom:"10px",maxWidth:"200px"}} onKeyDown={e=>{if(e.key==="Enter"&&codeInput===PASS)setIsAdmin(true);}}/>
          <br/><button style={btn("gold")} onClick={()=>{if(codeInput===PASS)setIsAdmin(true);else setCodeInput("");}}>Đăng nhập</button>
        </div>:<button style={btn("gold")} onClick={()=>setShowLogin(true)}>Vào khu vực BTC</button>}
      </div>
    );
    return(
      <div className="fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <span style={{fontSize:"12px",color:GR}}>⚙️ Chế độ BTC</span>
          <div style={{display:"flex",gap:"8px"}}><button style={btn("sm")} onClick={load}>🔄 Refresh</button><button style={btn("danger")} onClick={()=>setIsAdmin(false)}>Thoát</button></div>
        </div>

        <div style={card}>
          <div style={rh}>👥 VĐV ({players.length})</div>
          {players.map(p=>(<div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #2c482e"}}><span style={{fontSize:"13px"}}>{p.id}. {p.name}</span><button style={btn("danger")} onClick={()=>{if(allGroupMatches.some(m=>m.p1===p.id||m.p2===p.id))return;update(prev=>({...prev,players:prev.players.filter(x=>x.id!==p.id)}));}}>✕</button></div>))}
          <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
            <input placeholder="Tên VĐV mới..." value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==="Enter"&&newPlayer.trim()){update(prev=>({...prev,players:[...prev.players,{id:Math.max(...prev.players.map(x=>x.id),0)+1,name:newPlayer.trim()}]}));setNewPlayer("");}}}/>
            <button style={btn("gold")} onClick={()=>{if(!newPlayer.trim())return;update(prev=>({...prev,players:[...prev.players,{id:Math.max(...prev.players.map(x=>x.id),0)+1,name:newPlayer.trim()}]}));setNewPlayer("");}}>+</button>
          </div>
        </div>

        {!r1Set&&<div style={card}><div style={rh}>🎲 LƯỢT 1 — NHẬP CẶP</div><div style={{fontSize:"11px",color:"rgba(200,220,200,.35)",marginBottom:"12px"}}>Nhập sau khi bốc thăm ngoài sân</div>{r1Pairs.map((pair,i)=>(<div key={i} style={{marginBottom:"10px"}}><div style={{...lbl,color:"rgba(139,164,125,.6)"}}>CẶP {i+1}</div><div style={{display:"flex",gap:"6px",alignItems:"center",marginTop:"3px"}}><select value={pair.p1} onChange={e=>setR1Pair(i,"p1",e.target.value)} style={{...inp,flex:1}}><option value="">Chọn VĐV...</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><span style={vs}>VS</span><select value={pair.p2} onChange={e=>setR1Pair(i,"p2",e.target.value)} style={{...inp,flex:1}}><option value="">Chọn VĐV...</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>))}<button style={{...btn("gold"),width:"100%",marginTop:"4px"}} onClick={confirmR1}>✅ Xác nhận Lượt 1</button></div>}

        {[1,2,3].map(r=>{const rm=matches[r]||[];if(!rm.length)return null;return(<div key={r} style={card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={rh}>📝 LƯỢT {r}</div>{isRoundDone(r)&&<span style={badge("g")}>✓ XONG</span>}</div>{rm.map((m,i)=>(<div key={i} style={mc(m.completed)}><div style={{fontSize:"10px",color:"rgba(139,164,125,.6)",marginBottom:"7px"}}>Trận {i+1}: {getName(m.p1)} vs {getName(m.p2)}</div><div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}><SI label={getName(m.p1)} val={m.s1} onChange={v=>updateScore(r,i,"s1",v)}/><span style={{...vs,paddingBottom:"8px"}}>:</span><SI label={getName(m.p2)} val={m.s2} onChange={v=>updateScore(r,i,"s2",v)}/></div>{m.tiebreak&&!m.completed&&<div style={{marginTop:"8px"}}><div style={{fontSize:"10px",color:"rgba(139,164,125,.85)",marginBottom:"5px"}}>🎾 Hòa 4–4 · Ai thắng tiebreak?</div><div style={{display:"flex",gap:"6px"}}><button style={{...btn(),flex:1,fontSize:"12px"}} onClick={()=>setTBWinner(r,i,m.p1)}>{getName(m.p1)}</button><button style={{...btn(),flex:1,fontSize:"12px"}} onClick={()=>setTBWinner(r,i,m.p2)}>{getName(m.p2)}</button></div></div>}{m.completed&&<div style={{marginTop:"6px"}}><span style={badge("g")}>✓ {getName(m.winner)} thắng{m.tiebreak?" (TB)":""}</span></div>}</div>))}{r<3&&isRoundDone(r)&&!(matches[r+1]||[]).length&&<button style={{...btn("gold"),width:"100%",marginTop:"8px"}} onClick={()=>generateSwiss(r+1)}>🎲 Tạo cặp Lượt {r+1} (Swiss)</button>}</div>);})}

        {isRoundDone(3)&&!semis.length&&<div style={card}><button style={{...btn("gold"),width:"100%"}} onClick={setupSemis}>🏅 Tạo bán kết Top 4</button></div>}
        {semis.length>0&&<div style={card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><div style={rh}>🏅 BÁN KẾT</div>{semis.every(sf2=>sf2.completed)&&<span style={badge("g")}>✓</span>}</div>{semis.map((sf2,i)=>(<div key={i} style={mc(sf2.completed)}><div style={{fontSize:"10px",color:"rgba(139,164,125,.6)",marginBottom:"7px"}}>{sf2.label}: {getName(sf2.p1)} vs {getName(sf2.p2)}</div><div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}><SI label={getName(sf2.p1)} val={sf2.s1} onChange={v=>updateSemi(i,"s1",v)}/><span style={{...vs,paddingBottom:"8px"}}>:</span><SI label={getName(sf2.p2)} val={sf2.s2} onChange={v=>updateSemi(i,"s2",v)}/></div>{sf2.completed&&<div style={{marginTop:"6px"}}><span style={badge("g")}>✓ {getName(sf2.winner)} thắng</span></div>}</div>))}{semis.every(sf2=>sf2.completed)&&!final&&<button style={{...btn("gold"),width:"100%",marginTop:"8px"}} onClick={createFinal}>🏆 Tạo Chung kết</button>}</div>}
        {final&&<div style={gcard}><div style={rh}>🏆 CHUNG KẾT</div><div style={{fontSize:"12px",color:"rgba(200,220,200,.4)",marginBottom:"10px"}}>{getName(final.p1)} vs {getName(final.p2)}</div><div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}><SI label={getName(final.p1)} val={final.s1} onChange={v=>updateFinal("s1",v)}/><span style={{...vs,paddingBottom:"8px"}}>:</span><SI label={getName(final.p2)} val={final.s2} onChange={v=>updateFinal("s2",v)}/></div>{final.completed&&<div style={{marginTop:"12px",textAlign:"center",padding:"12px",background:"rgba(44,72,46,.4)",borderRadius:"8px"}}><div style={{fontSize:"8px",color:"rgba(139,164,125,.7)",letterSpacing:".22em"}}>👑 VÔ ĐỊCH GIẢI</div><div style={{fontSize:"19px",fontWeight:700,color:G,marginTop:"4px"}}>{getName(final.winner)}</div></div>}</div>}

        <div style={{marginTop:"28px",paddingTop:"16px",borderTop:"1px solid rgba(239,68,68,.12)"}}>
          <div style={rcard}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",letterSpacing:".08em",color:RE,marginBottom:"8px"}}>⚠️ VÙNG NGUY HIỂM</div><div style={{fontSize:"12px",color:"rgba(200,220,200,.45)",marginBottom:"14px",lineHeight:1.6}}>Xoá toàn bộ trận đấu, kết quả, cặp đấu.<br/>Danh sách VĐV được giữ lại. Không thể hoàn tác.</div><button style={{...btn("reset"),width:"100%"}} onClick={()=>setShowResetConfirm(true)}>🔄 Reset toàn bộ giải đấu</button></div>
        </div>
      </div>
    );
  };

  const TABS=[{id:"schedule",l:"📅 Lịch đấu"},{id:"standings",l:"🏆 Xếp hạng"},{id:"finals",l:"🎯 Chung kết"},{id:"reg",l:"📋 Phân công"},{id:"rules",l:"📜 Điều lệ"},{id:"admin",l:"⚙️ BTC"}];

  return(
    <div style={{minHeight:"100vh",background:"#091315",fontFamily:"'Outfit',sans-serif",color:TX}}>
      {showResetConfirm&&<ConfirmModal message={"Reset toàn bộ dữ liệu giải đấu?\nTrận đấu & kết quả sẽ bị xoá.\nKhông thể hoàn tác!"} onConfirm={doReset} onCancel={()=>setShowResetConfirm(false)}/>}
      <div style={{padding:"20px 16px 12px",textAlign:"center",background:`linear-gradient(180deg,rgba(44,72,46,.5) 0%,rgba(9,19,21,.0) 100%)`,borderBottom:`1px solid ${BG2}`}}>
        <div style={{fontSize:"9px",color:"rgba(139,164,125,.6)",letterSpacing:".35em",marginBottom:"5px"}}>🎾 GIẢI TENNIS NỘI BỘ</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(30px,9vw,56px)",letterSpacing:".05em",color:LT,textShadow:`0 0 50px rgba(84,115,78,.5)`,lineHeight:1}}>THE ANGELS</h1>
        <div style={{fontSize:"10px",color:"rgba(139,164,125,.45)",letterSpacing:".22em",marginTop:"4px"}}>TENNIS TOURNAMENT · 07.06.2026</div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"4px 16px",background:`rgba(9,19,21,.8)`,borderBottom:`1px solid ${BG2}`,fontSize:"10px",color:"rgba(139,164,125,.4)"}}>
        <span>🌐 Dữ liệu dùng chung · Tự cập nhật mỗi 30s</span>
        {lastSync&&<span>· {lastSync.toLocaleTimeString("vi",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
      </div>
      <div style={{display:"flex",background:`rgba(9,19,21,.9)`,borderBottom:`1px solid ${BG2}`,overflowX:"auto"}}>
        {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"11px 14px",fontSize:"12px",fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",background:"none",border:"none",color:tab===t.id?LT:"rgba(139,164,125,.35)",borderBottom:tab===t.id?`2px solid ${LT}`:"2px solid transparent",transition:"color .2s"}}>{t.l}</button>))}
      </div>
      <div style={{padding:"14px",maxWidth:"600px",margin:"0 auto"}}>
        {tab==="schedule"&&scheduleView()}
        {tab==="standings"&&standingsView()}
        {tab==="finals"&&finalsView()}
        {tab==="reg"&&regView()}
        {tab==="rules"&&rulesView()}
        {tab==="admin"&&adminView()}
      </div>
    </div>
  );
}
