"use strict";(()=>{var e={};e.id=217,e.ids=[217],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},5218:e=>{e.exports=require("node:child_process")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},3977:e=>{e.exports=require("node:fs/promises")},9411:e=>{e.exports=require("node:path")},1747:e=>{e.exports=require("node:readline")},4492:e=>{e.exports=require("node:stream")},6402:e=>{e.exports=require("node:stream/promises")},7261:e=>{e.exports=require("node:util")},2107:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>_,patchFetch:()=>w,requestAsyncStorage:()=>h,routeModule:()=>d,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var n={};t.r(n),t.d(n,{POST:()=>l});var a=t(9303),s=t(8716),o=t(670),i=t(903),p=t(400),c=t(1689),u=t(8152);async function l(e){let r=await (0,u.I8)();if(!r?.user?.id)return Response.json({error:"認証が必要です"},{status:401});let{projectId:t,chapterNumber:n,sceneIndex:a=0}=await e.json(),s=await c._.project.findUnique({where:{id:t},include:{characters:!0,foreshadowing:!0}});if(!s)return Response.json({error:"プロジェクトが見つかりません"},{status:404});if(!s.genreRulesSnapshot)return Response.json({error:"ジャンルルールが未設定です"},{status:400});let o=await c._.chapterOutline.findFirst({where:{projectId:t,chapterNumber:n}});if(!o)return Response.json({error:"章構成が見つかりません"},{status:404});let l=n>1?await c._.chapter.findUnique({where:{projectId_number:{projectId:t,number:n-1}}}):null,d=s.plotOutline,h=o.scenes,m=h?.[a],g=function(e){let r=(0,p._)(e.genre,e.media,e.sceneType),t=e.genreRulesSnapshot,n=t.chapter_ending_rules.map(e=>`- ${e}`).join("\n");return`あなたは「${t.label}」の執筆を支援するAIライターです。

## 現在の章情報
- 章番号: 第${e.chapterNumber}章 / 全${e.totalChapters}章
- シーンタイプ: ${e.sceneType}
- このシーンタイプの推奨文字数: ${r.min.toLocaleString()}〜${r.max.toLocaleString()}字
- 目標文字数: ${e.targetWords.toLocaleString()}字

## シーン概要
${e.sceneSummary}

## 視点ルール（絶対遵守）
- 視点人物: ${e.povCharacter}
- このシーン内で視点を切り替えない

## 章末の書き方（必須）
この章の末尾は以下のいずれかで終わること:
${n}

## キャラクターコンテキスト
${e.characters.map(e=>`${e.name}(${e.role}): arc進行度=${e.arcProgress}%`).join("\n")}

## 前章の要約
${e.prevChapterSummary??"（序章のため前章なし）"}

## 今章で配置すべき伏線
${e.foreshadowingToPlant.map(e=>`- ${e.description}`).join("\n")||"（なし）"}

## 執筆上の注意
- Show, Don't Tell: 感情を直接説明せず行動・表情・環境で表現
- 場面転換は「◆◆◆」で区切る
- 専門用語には1文の説明を添える（SF/ファンタジーの場合）`}({genre:s.genre,media:s.media,chapterNumber:n,totalChapters:d?.total_chapters??20,sceneType:o.sceneType??"daily",sceneSummary:m?.summary??o.title??`第${n}章`,povCharacter:m?.povCharacter??o.povCharacterId??"主人公",targetWords:o.targetWords??3e3,characters:s.characters,prevChapterSummary:l?.summary??void 0,foreshadowingToPlant:s.foreshadowing.filter(e=>(o.foreshadowingIds??[]).includes(e.id)),genreRulesSnapshot:s.genreRulesSnapshot}),_=new i.ZP,w=await _.messages.create({model:"claude-sonnet-4-5",max_tokens:4096,stream:!0,system:g,messages:[{role:"user",content:"執筆を開始してください。"}]}),x=r.user.id,f=new TextEncoder,y=0;return new Response(new ReadableStream({async start(e){for await(let r of w)"content_block_delta"===r.type&&"text_delta"===r.delta.type&&e.enqueue(f.encode(r.delta.text)),"message_delta"===r.type&&r.usage&&(y=r.usage.output_tokens);e.close(),c._.usageLog.create({data:{userId:x,tokens:y,feature:"writing"}}).catch(()=>{})}}),{headers:{"Content-Type":"text/plain; charset=utf-8","Transfer-Encoding":"chunked"}})}let d=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/agent/write/route",pathname:"/api/agent/write",filename:"route",bundlePath:"app/api/agent/write/route"},resolvedPagePath:"/c/Users/ochar/ClaudeCode/novel_master/app/api/agent/write/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:g}=d,_="/api/agent/write/route";function w(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},400:(e,r,t)=>{t.d(r,{_:()=>o,r:()=>s});var n=t(9314),a=t(3319);function s(e,r){let t=n.L[e];if(!t)throw Error(`Unknown genre: ${e}`);return{label:t.label,core_principle:t.core_principle,parts:t.parts.book,total_words:t.total_words[r],chapter_words:t.chapter_words[r],chapter_ending_rules:t.chapter_ending_rules,pov_rules:t.pov_rules,tempo_rules:t.tempo_rules?.[r]??null,review_rubric:[...a.h.writing_rubric,...t.review_extra],specific:Object.fromEntries(Object.entries(t).filter(([e])=>e.endsWith("_specific")))}}function o(e,r,t){let a=n.L[e]?.chapter_words?.[r];if(!a)return{min:2e3,max:5e3};let s=a[t];if(s&&"object"==typeof s&&"min"in s)return s;let o=a.standard;return o&&"object"==typeof o&&"min"in o?o:{min:2e3,max:5e3}}},3319:(e,r,t)=>{t.d(r,{h:()=>n});let n={writing_rubric:[{rule:"show_not_tell",weight:25,pass:"感情直説が全文の20%以下",hint:"「彼は怒った」→「彼の顎が強張った」"},{rule:"pov_consistency",weight:20,pass:"1シーン内で視点人物の切り替えゼロ",hint:"視点ブレ箇所をハイライト"},{rule:"sentence_rhythm",weight:20,pass:"60字超の文が連続3文以下",hint:"長文が続く箇所を短文で切る"},{rule:"character_arc",weight:20,pass:"キャラのarc方向と行動が矛盾しない",hint:"キャラシートとの差異を指摘"},{rule:"foreshadowing",weight:15,pass:"今章配置予定の伏線が含まれている",hint:"未配置の伏線リストをリマインド"}],scene_break:{symbol:"◆◆◆",time_jump_prefix:"翌日——",max_scenes_per_chapter:3},scene_types:["battle","romance","investigation","emotional_peak","daily","climax","horror_peak","tech_explain","worldbuild","slow_burn","action_escape"]}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),n=r.X(0,[948,872,956,452],()=>t(2107));module.exports=n})();