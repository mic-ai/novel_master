export const COMMON_RULES = {
  writing_rubric: [
    { rule:'show_not_tell',   weight:25, pass:'感情直説が全文の20%以下',           hint:'「彼は怒った」→「彼の顎が強張った」' },
    { rule:'pov_consistency', weight:20, pass:'1シーン内で視点人物の切り替えゼロ', hint:'視点ブレ箇所をハイライト' },
    { rule:'sentence_rhythm', weight:20, pass:'60字超の文が連続3文以下',           hint:'長文が続く箇所を短文で切る' },
    { rule:'character_arc',   weight:20, pass:'キャラのarc方向と行動が矛盾しない', hint:'キャラシートとの差異を指摘' },
    { rule:'foreshadowing',   weight:15, pass:'今章配置予定の伏線が含まれている',  hint:'未配置の伏線リストをリマインド' },
  ],
  scene_break: {
    symbol:                '◆◆◆',
    time_jump_prefix:      '翌日——',
    max_scenes_per_chapter: 3,
  },
  scene_types: [
    'battle', 'romance', 'investigation', 'emotional_peak',
    'daily', 'climax', 'horror_peak', 'tech_explain',
    'worldbuild', 'slow_burn', 'action_escape',
  ] as const,
};
