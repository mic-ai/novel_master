"use strict";(()=>{var e={};e.id=122,e.ids=[122],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},5218:e=>{e.exports=require("node:child_process")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},3977:e=>{e.exports=require("node:fs/promises")},9411:e=>{e.exports=require("node:path")},1747:e=>{e.exports=require("node:readline")},4492:e=>{e.exports=require("node:stream")},6402:e=>{e.exports=require("node:stream/promises")},7261:e=>{e.exports=require("node:util")},117:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>q,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>x});var s={};r.r(s),r.d(s,{POST:()=>c});var n=r(9303),o=r(8716),a=r(670),i=r(8152),p=r(903),u=r(9314);async function c(e){let t=await (0,i.I8)();if(!t?.user?.id)return Response.json({error:"認証が必要です"},{status:401});let{projectId:r,goal:s,obstacleInput:n,genre:o}=await e.json(),a=u.L[o],c=a?.parts.book.map(e=>e.name).join("、")??"序章、第一部、第二部、終章",l=new p.ZP,d=(await l.messages.create({model:"claude-sonnet-4-5",max_tokens:1024,system:`あなたは小説のコンフリクト設計の専門家です。
ジャンル「${a?.label??o}」の主人公の目標と障害を三幕構成に分類します。

パート構成: ${c}

以下のJSONのみで返してください:
{
  "goal": "外的目標",
  "inner_goal": "内的目標（感情・成長面）",
  "obstacles": [
    {
      "description": "障害の説明",
      "part": "配置するパート名",
      "type": "external|internal|interpersonal",
      "intensity": 1から10の強度
    }
  ]
}`,messages:[{role:"user",content:`外的目標: ${s}
障害リスト: ${n}`}]})).content[0];if(d?.type!=="text")return Response.json({error:"AI応答エラー"},{status:500});try{let e=JSON.parse(d.text);return Response.json(e)}catch{return Response.json({raw:d.text})}}let l=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/agent/conflict/route",pathname:"/api/agent/conflict",filename:"route",bundlePath:"app/api/agent/conflict/route"},resolvedPagePath:"/c/Users/ochar/ClaudeCode/novel_master/app/api/agent/conflict/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:x,serverHooks:m}=l,g="/api/agent/conflict/route";function q(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:x})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[948,872,956,452],()=>r(117));module.exports=s})();