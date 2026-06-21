"use strict";(()=>{var e={};e.id=923,e.ids=[923],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},5218:e=>{e.exports=require("node:child_process")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},3977:e=>{e.exports=require("node:fs/promises")},9411:e=>{e.exports=require("node:path")},1747:e=>{e.exports=require("node:readline")},4492:e=>{e.exports=require("node:stream")},6402:e=>{e.exports=require("node:stream/promises")},7261:e=>{e.exports=require("node:util")},3544:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>w,patchFetch:()=>_,requestAsyncStorage:()=>h,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var s={};t.r(s),t.d(s,{POST:()=>c});var n=t(9303),a=t(8716),i=t(670),o=t(903),p=t(3319),u=t(1689),l=t(8152);async function c(e){let r=await (0,l.I8)();if(!r?.user?.id)return Response.json({error:"認証が必要です"},{status:401});let{projectId:t,chapterNumber:s,chapterContent:n}=await e.json();if(!n?.trim())return Response.json({error:"本文が空です"},{status:400});let a=await u._.project.findUnique({where:{id:t},include:{foreshadowing:!0}});if(!a||!a.genreRulesSnapshot)return Response.json({error:"プロジェクトが見つかりません"},{status:404});let i=await u._.chapterOutline.findFirst({where:{projectId:t,chapterNumber:s}}),c=function(e){let r=e.genreRulesSnapshot,t=[...p.h.writing_rubric,...r.review_extra].map(e=>`- ${"rule"in e?e.rule:e.item} [${e.weight}点]: ${e.pass}`).join("\n");return`あなたは「${r.label}」専門の文章添削エディターです。
以下のルーブリックで採点し、JSONのみで返してください。

## ルーブリック（合計100点）
${t}

## 伏線チェックリスト
配置すべき伏線: ${e.foreshadowingToPlant.map(e=>e.description).join(" / ")||"なし"}

## 章末チェック
適用すべき章末ルール:
${r.chapter_ending_rules.map(e=>`- ${e}`).join("\n")}

## 対象テキスト
${e.chapterContent}

## 出力JSON形式
{
  "total_score": 0から100の整数,
  "items": [
    {
      "rule": "ルール名",
      "score": 獲得点,
      "max": 最大点,
      "passed": true,
      "feedback": "具体的な改善提案"
    }
  ],
  "chapter_ending_check": {
    "passed": true,
    "current_ending": "章末の最後の文",
    "suggestion": "改善案"
  },
  "foreshadowing_check": {
    "planted": ["配置済みの伏線"],
    "missing": ["未配置の伏線"]
  },
  "overall_feedback": "総評（200字以内）"
}`}({genre:a.genre,media:a.media,chapterContent:n,genreRulesSnapshot:a.genreRulesSnapshot,foreshadowingToPlant:a.foreshadowing.filter(e=>(i?.foreshadowingIds??[]).includes(e.id))}),d=new o.ZP,h=await d.messages.create({model:"claude-sonnet-4-5",max_tokens:2048,system:c,messages:[{role:"user",content:"添削してください。"}]}),g=h.content[0];if(g?.type!=="text")return Response.json({error:"AI応答エラー"},{status:500});let m=g.text,w=m.match(/```(?:json)?\s*([\s\S]*?)```/)??[null,m],_=w[1]?.trim()??m.trim();try{let e=JSON.parse(_);return await u._.chapter.upsert({where:{projectId_number:{projectId:t,number:s}},update:{reviewReport:e},create:{projectId:t,number:s,content:n,actualWords:n.length,reviewReport:e,status:"writing"}}),u._.usageLog.create({data:{userId:r.user.id,tokens:h.usage.output_tokens,feature:"review"}}).catch(()=>{}),Response.json({review:e})}catch{return Response.json({raw:m})}}let d=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/agent/review/route",pathname:"/api/agent/review",filename:"route",bundlePath:"app/api/agent/review/route"},resolvedPagePath:"/c/Users/ochar/ClaudeCode/novel_master/app/api/agent/review/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:g,serverHooks:m}=d,w="/api/agent/review/route";function _(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},8152:(e,r,t)=>{t.d(r,{I8:()=>l,handlers:()=>u,zB:()=>c,w7:()=>d});var s=t(7671),n=t(7585),a=t(1689),i=t(8204),o=t(7703);let p={providers:[i.Z,o.Z],pages:{signIn:"/login"},callbacks:{authorized({auth:e,request:{nextUrl:r}}){let t=!!e?.user,{pathname:s}=r;if((s.startsWith("/projects")||s.startsWith("/editor")||s.startsWith("/settings"))&&!t){let e=new URL("/login",r.origin);return e.searchParams.set("callbackUrl",s),Response.redirect(e)}return"/login"!==s||!t||Response.redirect(new URL("/projects",r.origin))}}},{handlers:u,auth:l,signIn:c,signOut:d}=(0,s.ZP)({...p,adapter:(0,n.N)(a._),callbacks:{...p.callbacks,session:({session:e,user:r})=>(e.user.id=r.id,e.user.plan=r.plan??"FREE",e)}})},1689:(e,r,t)=>{t.d(r,{_:()=>n});var s=t(3524);let n=globalThis.prisma??new s.PrismaClient({log:["error"]})},3319:(e,r,t)=>{t.d(r,{h:()=>s});let s={writing_rubric:[{rule:"show_not_tell",weight:25,pass:"感情直説が全文の20%以下",hint:"「彼は怒った」→「彼の顎が強張った」"},{rule:"pov_consistency",weight:20,pass:"1シーン内で視点人物の切り替えゼロ",hint:"視点ブレ箇所をハイライト"},{rule:"sentence_rhythm",weight:20,pass:"60字超の文が連続3文以下",hint:"長文が続く箇所を短文で切る"},{rule:"character_arc",weight:20,pass:"キャラのarc方向と行動が矛盾しない",hint:"キャラシートとの差異を指摘"},{rule:"foreshadowing",weight:15,pass:"今章配置予定の伏線が含まれている",hint:"未配置の伏線リストをリマインド"}],scene_break:{symbol:"◆◆◆",time_jump_prefix:"翌日——",max_scenes_per_chapter:3},scene_types:["battle","romance","investigation","emotional_peak","daily","climax","horror_peak","tech_explain","worldbuild","slow_burn","action_escape"]}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[948,872,956],()=>t(3544));module.exports=s})();