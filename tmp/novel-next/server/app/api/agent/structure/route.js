"use strict";(()=>{var e={};e.id=700,e.ids=[700],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},5218:e=>{e.exports=require("node:child_process")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},3977:e=>{e.exports=require("node:fs/promises")},9411:e=>{e.exports=require("node:path")},1747:e=>{e.exports=require("node:readline")},4492:e=>{e.exports=require("node:stream")},6402:e=>{e.exports=require("node:stream/promises")},7261:e=>{e.exports=require("node:util")},1095:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>m,routeModule:()=>d,serverHooks:()=>_,staticGenerationAsyncStorage:()=>h});var n={};r.r(n),r.d(n,{POST:()=>l});var s=r(9303),a=r(8716),i=r(670),o=r(8152),p=r(903),u=r(1689),c=r(400);async function l(e){let t=await (0,o.I8)();if(!t?.user?.id)return Response.json({error:"認証が必要です"},{status:401});let{projectId:r}=await e.json(),n=await u._.project.findUnique({where:{id:r},include:{foreshadowing:!0}});if(!n?.plotOutline)return Response.json({error:"プロットが未生成です"},{status:400});let s=(0,c.r)(n.genre,n.media),a=n.tempoPlan??[],i=n.plotOutline,l=new p.ZP,d=(await l.messages.create({model:"claude-sonnet-4-5",max_tokens:4096,system:`あなたは章構成の専門家です。プロット概要から各章の詳細な構成概要を作成します。

ジャンル: ${s.label}
章末ルール: ${s.chapter_ending_rules.join(" / ")}
視点ルール: デフォルト=${s.pov_rules.default}

JSONのみで返してください（配列形式）:
[
  {
    "chapterNumber": 章番号,
    "title": "章タイトル",
    "targetWords": 目標文字数（整数）,
    "targetMin": 最小文字数,
    "targetMax": 最大文字数,
    "sceneType": "シーンタイプ",
    "tempoRole": "tension|release|neutral",
    "chapterEndingRule": "適用する章末ルール",
    "scenes": [
      {
        "index": 0,
        "summary": "シーンの概要",
        "povCharacter": "視点人物名"
      }
    ],
    "foreshadowingIds": []
  }
]`,messages:[{role:"user",content:`プロット概要:
${JSON.stringify(i.chapters,null,2)}

テンポ計画:
${JSON.stringify(a,null,2)}`}]})).content[0];if(d?.type!=="text")return Response.json({error:"AI応答エラー"},{status:500});try{let e=JSON.parse(d.text),t=await Promise.all(e.map(e=>{let t=(0,c._)(n.genre,n.media,e.sceneType);return u._.chapterOutline.create({data:{projectId:r,chapterNumber:e.chapterNumber,title:e.title,targetWords:e.targetWords,targetMin:t.min,targetMax:t.max,sceneType:e.sceneType,tempoRole:e.tempoRole,chapterEndingRule:e.chapterEndingRule,scenes:e.scenes,foreshadowingIds:[]}})}));return await u._.project.update({where:{id:r},data:{status:"step_7"}}),Response.json({chapterOutlines:t})}catch{return Response.json({raw:d.text})}}let d=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/agent/structure/route",pathname:"/api/agent/structure",filename:"route",bundlePath:"app/api/agent/structure/route"},resolvedPagePath:"/c/Users/ochar/ClaudeCode/novel_master/app/api/agent/structure/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:_}=d,g="/api/agent/structure/route";function x(){return(0,i.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:h})}},400:(e,t,r)=>{r.d(t,{_:()=>i,r:()=>a});var n=r(9314),s=r(3319);function a(e,t){let r=n.L[e];if(!r)throw Error(`Unknown genre: ${e}`);return{label:r.label,core_principle:r.core_principle,parts:r.parts.book,total_words:r.total_words[t],chapter_words:r.chapter_words[t],chapter_ending_rules:r.chapter_ending_rules,pov_rules:r.pov_rules,tempo_rules:r.tempo_rules?.[t]??null,review_rubric:[...s.h.writing_rubric,...r.review_extra],specific:Object.fromEntries(Object.entries(r).filter(([e])=>e.endsWith("_specific")))}}function i(e,t,r){let s=n.L[e]?.chapter_words?.[t];if(!s)return{min:2e3,max:5e3};let a=s[r];if(a&&"object"==typeof a&&"min"in a)return a;let i=s.standard;return i&&"object"==typeof i&&"min"in i?i:{min:2e3,max:5e3}}},3319:(e,t,r)=>{r.d(t,{h:()=>n});let n={writing_rubric:[{rule:"show_not_tell",weight:25,pass:"感情直説が全文の20%以下",hint:"「彼は怒った」→「彼の顎が強張った」"},{rule:"pov_consistency",weight:20,pass:"1シーン内で視点人物の切り替えゼロ",hint:"視点ブレ箇所をハイライト"},{rule:"sentence_rhythm",weight:20,pass:"60字超の文が連続3文以下",hint:"長文が続く箇所を短文で切る"},{rule:"character_arc",weight:20,pass:"キャラのarc方向と行動が矛盾しない",hint:"キャラシートとの差異を指摘"},{rule:"foreshadowing",weight:15,pass:"今章配置予定の伏線が含まれている",hint:"未配置の伏線リストをリマインド"}],scene_break:{symbol:"◆◆◆",time_jump_prefix:"翌日——",max_scenes_per_chapter:3},scene_types:["battle","romance","investigation","emotional_peak","daily","climax","horror_peak","tech_explain","worldbuild","slow_burn","action_escape"]}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[948,872,956,452],()=>r(1095));module.exports=n})();