"use strict";(()=>{var e={};e.id=162,e.ids=[162],e.modules={3524:e=>{e.exports=require("@prisma/client")},2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},5218:e=>{e.exports=require("node:child_process")},6005:e=>{e.exports=require("node:crypto")},7561:e=>{e.exports=require("node:fs")},3977:e=>{e.exports=require("node:fs/promises")},9411:e=>{e.exports=require("node:path")},1747:e=>{e.exports=require("node:readline")},4492:e=>{e.exports=require("node:stream")},6402:e=>{e.exports=require("node:stream/promises")},7261:e=>{e.exports=require("node:util")},8251:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>w,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>g,staticGenerationAsyncStorage:()=>_});var n={};t.r(n),t.d(n,{POST:()=>d});var a=t(9303),s=t(8716),o=t(670),i=t(8152),l=t(903),p=t(1689),c=t(400),u=t(9314);async function d(e){let r=await (0,i.I8)();if(!r?.user?.id)return Response.json({error:"認証が必要です"},{status:401});let{projectId:t}=await e.json(),n=await p._.project.findUnique({where:{id:t},include:{characters:!0}});if(!n)return Response.json({error:"プロジェクトが見つかりません"},{status:404});let a=n.characters.map(e=>({name:e.name,role:e.role,lack:e.lack,want:e.want,weakness:e.weakness,arcStart:e.arcStart,arcEnd:e.arcEnd,arcProgress:e.arcProgress})),s=n.worldSettings??{},o=function(e){let r=(0,c.r)(e.genre,e.media),t=r.parts.map(r=>`${r.name}: ${(100*r.ratio).toFixed(0)}% = 約${1e3*Math.round(e.targetWords*r.ratio/1e3)}字 → ${r.focus}`).join("\n"),n=r.chapter_words,a=n.standard,s=n.total_chapters;return`あなたは「${r.label}」専門の小説構成エディターです。

## ジャンルの核心原則
${r.core_principle}

## パート配分ルール（必ず遵守）
${t}

## 文字数・章数の目安
- 媒体: ${"book"===e.media?"書籍":"ウェブ小説"}
- 目標総文字数: ${e.targetWords.toLocaleString()}字
- 通常1章の目安: ${a?`${a.min.toLocaleString()}〜${a.max.toLocaleString()}字`:"2000〜5000字"}
- 全体の章数目安: ${s?`${s.min}〜${s.max}章`:"15〜30章"}

## 章末ルール（各章に適用）
${r.chapter_ending_rules.map(e=>`- ${e}`).join("\n")}

## 視点ルール
- デフォルト視点: ${r.pov_rules.default}
- 切り替えルール: ${r.pov_rules.switching}

## キャラクター情報
${e.characters.map(e=>`- ${e.name}（${e.role}）: 欠乏=${e.lack??"なし"} / 欲求=${e.want??"なし"} / 弱点=${e.weakness??"なし"} / アーク=${e.arcStart??"—"}→${e.arcEnd??"—"}`).join("\n")}

## 世界設定
${JSON.stringify(e.worldSettings,null,2)}

## 主人公の目標と障害
- 外的目標: ${e.goal}
- 障害: ${e.obstacles.map(e=>e.description).join(" / ")}

## 出力形式（JSON厳守）
以下のJSONスキーマに従い、JSONのみを返してください。マークダウンのコードブロックは不要です。

{
  "total_chapters": 整数,
  "parts": [
    {
      "name": "パート名",
      "chapter_range": [開始章番号, 終了章番号],
      "focus": "このパートの焦点"
    }
  ],
  "chapters": [
    {
      "number": 章番号,
      "title": "章タイトル",
      "summary": "この章で起こること（200字以内）",
      "emotion_score": 0から10の感情スコア,
      "scene_type": "シーンタイプ",
      "tempo_role": "tension|release|neutral",
      "key_events": ["主要イベント1", "主要イベント2"],
      "foreshadowing": ["この章で埋める伏線（あれば）"]
    }
  ],
  "foreshadowing_list": [
    {
      "description": "伏線の説明",
      "plant_chapter": 埋める章番号,
      "resolve_chapter": 回収する章番号,
      "is_fake": false
    }
  ]
}`}({genre:n.genre,media:n.media,targetWords:n.targetWords,characters:a,worldSettings:s,goal:"主人公の目標",obstacles:[]}),d=new l.ZP,m=(await d.messages.create({model:"claude-sonnet-4-5",max_tokens:4096,system:o,messages:[{role:"user",content:"プロット概要を生成してください。"}]})).content[0];if(m?.type!=="text")return Response.json({error:"AI応答エラー"},{status:500});try{var h,_,g;let e=JSON.parse(m.text),r=e.total_chapters??20,a=(h=n.genre,_=n.media,g="number"==typeof r?r:20,Array.from({length:g},(e,r)=>{let t=r+1;if("fantasy"===h&&"book"===_){let e=t%6==0;return{chapter:t,role:e?"tension":t%6==1?"release":"neutral",sceneTypeHint:e?"battle":"daily"}}if("romance"===h&&"web"===_){let e=t%5==0;return{chapter:t,role:"neutral",sceneTypeHint:e?"romance":"daily",sweetSceneRequired:e}}if("horror"===h){let e=t%4==0;return{chapter:t,role:e?"tension":t%4==1?"release":"neutral",sceneTypeHint:e?"horror_peak":"daily"}}if("mystery"===h){let e=t%4==0;return{chapter:t,role:e?"tension":"neutral",sceneTypeHint:e?"investigation":"daily"}}return u.L[h],{chapter:t,role:"neutral",sceneTypeHint:"daily"}})),s=u.L[n.genre]??null;return await p._.project.update({where:{id:t},data:{plotOutline:e,tempoPlan:a,genreRulesSnapshot:s??null,status:"step_5"}}),Response.json({plotOutline:e,tempoPlan:a})}catch{return Response.json({raw:m.text})}}let m=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/agent/plot/route",pathname:"/api/agent/plot",filename:"route",bundlePath:"app/api/agent/plot/route"},resolvedPagePath:"/c/Users/ochar/ClaudeCode/novel_master/app/api/agent/plot/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:_,serverHooks:g}=m,w="/api/agent/plot/route";function x(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:_})}},400:(e,r,t)=>{t.d(r,{_:()=>o,r:()=>s});var n=t(9314),a=t(3319);function s(e,r){let t=n.L[e];if(!t)throw Error(`Unknown genre: ${e}`);return{label:t.label,core_principle:t.core_principle,parts:t.parts.book,total_words:t.total_words[r],chapter_words:t.chapter_words[r],chapter_ending_rules:t.chapter_ending_rules,pov_rules:t.pov_rules,tempo_rules:t.tempo_rules?.[r]??null,review_rubric:[...a.h.writing_rubric,...t.review_extra],specific:Object.fromEntries(Object.entries(t).filter(([e])=>e.endsWith("_specific")))}}function o(e,r,t){let a=n.L[e]?.chapter_words?.[r];if(!a)return{min:2e3,max:5e3};let s=a[t];if(s&&"object"==typeof s&&"min"in s)return s;let o=a.standard;return o&&"object"==typeof o&&"min"in o?o:{min:2e3,max:5e3}}},3319:(e,r,t)=>{t.d(r,{h:()=>n});let n={writing_rubric:[{rule:"show_not_tell",weight:25,pass:"感情直説が全文の20%以下",hint:"「彼は怒った」→「彼の顎が強張った」"},{rule:"pov_consistency",weight:20,pass:"1シーン内で視点人物の切り替えゼロ",hint:"視点ブレ箇所をハイライト"},{rule:"sentence_rhythm",weight:20,pass:"60字超の文が連続3文以下",hint:"長文が続く箇所を短文で切る"},{rule:"character_arc",weight:20,pass:"キャラのarc方向と行動が矛盾しない",hint:"キャラシートとの差異を指摘"},{rule:"foreshadowing",weight:15,pass:"今章配置予定の伏線が含まれている",hint:"未配置の伏線リストをリマインド"}],scene_break:{symbol:"◆◆◆",time_jump_prefix:"翌日——",max_scenes_per_chapter:3},scene_types:["battle","romance","investigation","emotional_peak","daily","climax","horror_peak","tech_explain","worldbuild","slow_burn","action_escape"]}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),n=r.X(0,[948,872,956,452],()=>t(8251));module.exports=n})();