export type Media = 'book' | 'web';
export type SceneType =
  | 'battle' | 'romance' | 'investigation' | 'emotional_peak'
  | 'daily' | 'climax' | 'horror_peak' | 'tech_explain'
  | 'worldbuild' | 'slow_burn' | 'action_escape';

export interface WordRange   { min: number; max: number; }
export interface PartDef     { name: string; ratio: number; focus: string; }
export interface ReviewItem  { item: string; weight: number; pass: string; }

export interface GenreRule {
  label:                string;
  core_principle:       string;
  keywords:             string[];
  total_words:          { book: Record<string, [number,number]>; web: Record<string, [number,number]>; };
  parts:                { book: PartDef[] };
  chapter_words:        { book: Record<string, WordRange | number | string | Record<string,number[]>>; web: Record<string, WordRange | number | string | Record<string,number[]>>; };
  chapter_ending_rules: string[];
  pov_rules:            Record<string, string | boolean | string[]>;
  tempo_rules:          { book?: Record<string,unknown>; web?: Record<string,unknown> };
  review_extra:         ReviewItem[];
  [key: string]:        unknown;
}

export interface Character {
  name: string;
  role: string;
  lack?: string | null;
  want?: string | null;
  weakness?: string | null;
  arcStart?: string | null;
  arcEnd?: string | null;
  arcProgress: number;
}

export interface Foreshadowing {
  id: string;
  description: string;
  plantedChapter?: number | null;
  resolveChapter?: number | null;
}

export interface WorldSettings {
  [key: string]: unknown;
}

export interface Obstacle {
  description: string;
}

export interface TempoPlanItem {
  chapter: number;
  role: 'tension' | 'release' | 'neutral';
  sceneTypeHint: string;
  sweetSceneRequired?: boolean;
}

export const GENRE_RULES: Record<string, GenreRule> = {
  romance: {
    label: '恋愛・ロマンス',
    core_principle: '感情の起伏と関係性の変化が核。読者は「ふたりがどうなるか」に引き込まれる',
    keywords: ['感情描写が命', 'すれ違い構造', 'ハッピーエンド推奨', '内面描写多め'],
    total_words: {
      book: { short:[10000,30000], mid:[50000,80000], long:[100000,150000], epic:[150000,200000] },
      web:  { short:[3000,10000], mid:[30000,100000], serial:[300000,1000000] },
    },
    parts: {
      book: [
        { name:'第一部：出会い・設定',     ratio:0.20, focus:'主人公の日常・出会い・第一印象。心のざわめき' },
        { name:'第二部：接近・惹かれ合い', ratio:0.30, focus:'距離が縮まる連続イベント。甘さと緊張感の交互配置' },
        { name:'第三部：危機・すれ違い',   ratio:0.25, focus:'誤解・秘密・外部障害。最暗点で感情爆発' },
        { name:'第四部：和解・結末',       ratio:0.25, focus:'誤解解消・告白・ハッピーエンド・余韻エピローグ' },
      ],
    },
    chapter_words: {
      book: {
        standard:           { min:3000, max:5000 },
        emotional_peak:     { min:5000, max:8000 },
        tempo:              { min:1500, max:2500 },
        total_chapters:     { min:20,   max:30   },
        scenes_per_chapter: { min:1,    max:3    },
      },
      web: {
        standard:                   { min:1500, max:3000 },
        total_episodes_short:       { min:10, max:30 },
        serial_min:                 100,
      },
    },
    chapter_ending_rules: [
      '感情の余韻で終わる（ため息・心拍数・沈黙）',
      '次の章への疑問を残す',
      '告白・キス直前で切る（焦らし効果）',
      '急展開（新事実・予想外の登場）で引きを作る',
    ],
    pov_rules: {
      default:   'protagonist',
      switching: 'chapter_unit_only',
      dual_pov:  'chapter_title_required',
    },
    tempo_rules: {
      web: {
        sweet_scene_interval: 5,
        hook_by_episode:      1,
        early_attraction_by:  3,
      },
    },
    romance_specific: {
      scene_break: { symbol:'◆◆◆', time_jump_prefix:'翌日——', max_scenes:3 },
    },
    review_extra: [
      { item:'章末の引き',      weight:15, pass:'疑問・余韻・急展開のいずれかで終わっている' },
      { item:'甘さの周期(web)', weight:10, pass:'直近5話以内にromanceシーンがある（ウェブのみ）' },
      { item:'視点一貫性',      weight:20, pass:'1シーン内で視点人物の切り替えゼロ' },
    ],
  },

  mystery: {
    label: 'ミステリー・サスペンス',
    core_principle: '「謎→調査→解決」の論理構造が骨格。伏線の精度と情報開示タイミングが命',
    keywords: ['フェアプレイ原則', '伏線回収が必須', '犯人の意外性', 'テンポ管理'],
    total_words: {
      book: { short:[10000,30000], mid:[50000,80000], long:[100000,150000], epic:[200000,300000] },
      web:  { short:[20000,60000], long:[150000,450000] },
    },
    parts: {
      book: [
        { name:'序章：事件発生',    ratio:0.10, focus:'謎の提示。読者の疑問を最大化。探偵/主人公の登場' },
        { name:'第一部：調査開始',  ratio:0.25, focus:'現場検証・ヒアリング。伏線埋め込み。フェイク混在' },
        { name:'第二部：混迷・深化',ratio:0.30, focus:'第二の事件・新証拠。仮説が覆される。容疑者複雑化' },
        { name:'第三部：核心へ',    ratio:0.20, focus:'真相に迫る証拠集積。探偵が危機。緊張感最高潮' },
        { name:'終章：解決・真相',  ratio:0.15, focus:'論理的な推理披露。犯人の動機と感情。読後感' },
      ],
    },
    chapter_words: {
      book: {
        standard:       { min:3000, max:6000 },
        investigation:  { min:4000, max:5000 },
        climax_reveal:  { min:6000, max:10000 },
        total_chapters: { min:20,   max:35   },
      },
      web: {
        standard:                  { min:2000, max:4000 },
        total_episodes_short:      { min:10, max:20 },
        total_episodes_long:       { min:50, max:150 },
      },
    },
    chapter_ending_rules: [
      '新事実の発覚で引きを作る',
      '容疑者が増える/減る場面で切る',
      '「ページをめくる手が止まらない」緊張感の維持',
      'ウェブ版: 毎話末に「新事実発覚」か「危機」を必ず置く',
    ],
    pov_rules: {
      default:           'detective_or_protagonist',
      switching:         'prohibited_within_scene',
      multiple_allowed:  false,
    },
    tempo_rules: {
      book: { tension_release_cycle: '3_to_5_chapters' },
      web:  { hook_required_per_episode: true },
    },
    mystery_specific: {
      foreshadowing: {
        plant_by:      'first_third',
        mention_count: 1,
        fake_required: true,
      },
      resolution: {
        max_ratio:  0.15,
        method:     'logical_only',
        fairplay:   true,
      },
    },
    review_extra: [
      { item:'フェアプレイ遵守', weight:20, pass:'全手がかりを読者に提示済み' },
      { item:'解決編の長さ',     weight:15, pass:'解決編が全体の15%以下' },
      { item:'偶然解決禁止',     weight:15, pass:'解決に偶然・超能力なし' },
      { item:'伏線の事前設置',   weight:20, pass:'重要伏線が序盤1/3以内に設置済み' },
      { item:'章末の引き',       weight:15, pass:'新事実または危機で終わっている' },
    ],
  },

  fantasy: {
    label: 'ファンタジー・異世界',
    core_principle: '世界観の構築と冒険の旅程が骨格。「別世界に連れて行く」没入感が最重要',
    keywords: ['世界観設計が先', '旅の構造', '魔法・ルールの一貫性', '仲間との成長'],
    total_words: {
      book: { lightnovel:[60000,100000], literary:[150000,250000], epic:[300000,600000] },
      web:  { short:[60000,150000], serial:[600000,5000000] },
    },
    parts: {
      book: [
        { name:'第一部：日常と召喚',   ratio:0.15, focus:'元世界or異世界日常。転移きっかけ。世界観の自然開示' },
        { name:'第二部：旅立ち・修行', ratio:0.25, focus:'仲間出会い・スキル/魔法習得。小戦闘で成長提示' },
        { name:'第三部：中盤の試練',   ratio:0.30, focus:'強大な敵・裏切り・世界の真相断片。最暗点' },
        { name:'第四部：決戦準備',     ratio:0.15, focus:'仲間の結束・切り札習得。世界観全貌が明らかに' },
        { name:'終部：決戦・結末',     ratio:0.15, focus:'大決戦。犠牲・代償。世界の変化・エピローグ' },
      ],
    },
    chapter_words: {
      book: {
        lightnovel:         { min:3000, max:5000 },
        literary:           { min:5000, max:8000 },
        battle_scene:       { min:2000, max:4000 },
        total_chapters_ln:  { min:15, max:25 },
        total_chapters_lit: { min:25, max:40 },
      },
      web: {
        standard:                  { min:2000, max:4000 },
        battle:                    { min:1500, max:3000 },
        total_episodes_short:      { min:20,  max:50  },
        total_episodes_serial:     { min:200, max:500 },
      },
    },
    chapter_ending_rules: [
      '戦闘の決着または新たな敵の出現で切る',
      '仲間との感情的な場面で余韻を残す',
      'ウェブ版: 5〜10話に1回の「圧勝シーン」を配置',
    ],
    pov_rules: {
      default:   'protagonist',
      switching: 'part_unit_recommended',
    },
    tempo_rules: {
      book: { battle_interval: { min:5, max:7 } },
      web:  { power_scene_interval: { min:5, max:10 } },
    },
    fantasy_specific: {
      worldbuild: {
        opening_rule: '1章は見える範囲だけ描写。設定説明禁止',
        disclosure:   '主人公の疑問を通じた自然な開示',
        appendix_rule:'地図・用語集は巻末に回す',
      },
      battle: {
        prerequisite: '戦闘前に感情的な動機を必ず描く',
        growth_rule:  '毎回同じ戦い方をしない（成長を示す）',
      },
      web_specific: {
        cheat_timing:    '1話目内で転移・能力付与まで完了',
        power_reveal:    '少しずつ開示し期待感を維持',
        early_priority:  '序盤20話でブックマーク数獲得が最優先',
      },
    },
    review_extra: [
      { item:'世界観一貫性',      weight:20, pass:'魔法・ルールに矛盾なし' },
      { item:'戦闘の感情動機',    weight:15, pass:'戦闘前に主人公の感情的理由が描かれている' },
      { item:'設定説明の分散',    weight:15, pass:'設定説明のみの段落が連続3段落以下' },
      { item:'キャラ成長の可視化',weight:15, pass:'前章と比べた変化が1箇所以上描写されている' },
    ],
  },

  sf: {
    label: 'SF（サイエンス・フィクション）',
    core_principle: '科学・技術的アイデアを核に人間ドラマを展開。「もしも〜だったら」の思考実験が本質',
    keywords: ['アイデアの一貫性', '社会批評性', '科学的な整合性', '人間ドラマが柱'],
    total_words: {
      book: { short:[10000,20000], mid:[40000,80000], long:[120000,200000], epic:[250000,500000] },
      web:  { short:[45000,120000], long:[300000,1000000] },
    },
    parts: {
      book: [
        { name:'序部：世界提示',    ratio:0.15, focus:'SF設定を「当たり前の日常」として描写。主人公の立場提示' },
        { name:'第一部：問題発生',  ratio:0.25, focus:'SF的アイデアが引き起こす「異変」。仮説と検証の繰り返し' },
        { name:'第二部：拡大・深化',ratio:0.30, focus:'社会・個人両方への影響。倫理的ジレンマ。技術vs人間性' },
        { name:'第三部：決断・解決',ratio:0.20, focus:'主人公の選択が世界を変える。科学的ロジックによる解決' },
        { name:'終部：余波・問い',  ratio:0.10, focus:'解決後の世界。読者への問いかけ。余韻の思考実験' },
      ],
    },
    chapter_words: {
      book: {
        standard:       { min:4000, max:7000 },
        tech_explain:   { min:2000, max:3000 },
        action_escape:  { min:2000, max:3000 },
        total_chapters: { min:20, max:30 },
      },
      web: {
        standard:                  { min:2500, max:4000 },
        total_episodes_short:      { min:15, max:40 },
        total_episodes_long:       { min:80, max:120 },
      },
    },
    chapter_ending_rules: [
      '倫理的ジレンマや謎を残して切る',
      '技術・社会的な波及効果を予感させて終わる',
      '答えを出しすぎない（読者に思考を促す）',
    ],
    pov_rules: {
      default:          'protagonist',
      multiple_allowed: true,
      formats:          ['diary', 'report', 'retrospective'],
    },
    tempo_rules: {
      book: { tech_chapter_max_consecutive: 3 },
    },
    sf_specific: {
      tech_explanation: {
        max_paragraphs_per_scene: 3,
        method:       'character_dialogue',
        jargon_rule:  '専門用語には1文の説明を添える',
        balance_rule: '設定量 > ドラマ量になったら即修正',
      },
      theme: {
        balance:      '技術の「光」と「影」を両面描く',
        answer_style: '答えを出しすぎない。読者に考えさせる',
      },
    },
    review_extra: [
      { item:'科学的整合性',      weight:20, pass:'設定内部の矛盾なし' },
      { item:'技術説明の簡潔性',  weight:15, pass:'技術説明が1場面3段落以内' },
      { item:'倫理的ジレンマ',    weight:15, pass:'主人公が倫理的選択を迫られている' },
      { item:'人間ドラマの主軸',  weight:20, pass:'SF設定よりも人間関係が物語の中心' },
    ],
  },

  horror: {
    label: 'ホラー',
    core_principle: '恐怖の漸進的な積み上げが命。「見せすぎない」「間」「日常の歪み」が恐怖の源泉',
    keywords: ['恐怖の積み上げ', '日常との対比', '見せすぎない', '余韻が重要'],
    total_words: {
      book: { short:[5000,20000], mid:[40000,70000], long:[100000,150000], epic:[200000,300000] },
      web:  { short_series:[15000,90000], long:[120000,240000] },
    },
    parts: {
      book: [
        { name:'序部：正常な日常',     ratio:0.15, focus:'安心感を与える丁寧な日常描写。落差を作る基盤' },
        { name:'第一部：異変の兆し',   ratio:0.25, focus:'小さな違和感の積み重ね。説明できない出来事の連続' },
        { name:'第二部：恐怖の顕在化', ratio:0.30, focus:'正体が見え始める。逃げられない状況。孤立。見せすぎない' },
        { name:'第三部：最暗点・対峙', ratio:0.20, focus:'恐怖の核心との直面。クライマックスの緊張感' },
        { name:'終部：余韻・余白',     ratio:0.10, focus:'完全解決しない後味。「まだ続いている」型も有効' },
      ],
    },
    chapter_words: {
      book: {
        daily_scene:    { min:3000, max:5000 },
        horror_peak:    { min:2000, max:3000 },
        slow_burn:      { min:5000, max:7000 },
        total_chapters: { min:15,   max:25   },
      },
      web: {
        standard:                  { min:1500, max:3000 },
        total_episodes_short:      { min:10, max:30 },
        total_episodes_long:       { min:40, max:80 },
      },
    },
    chapter_ending_rules: [
      '「そこに、いた」等の短文で叩き切る',
      '何かが「いなくなっている」ことで恐怖',
      '主人公の疑念を募らせて終わる',
      '「何も起きなかった」章で逆に恐怖を積み上げる',
    ],
    pov_rules: {
      default:   'protagonist',
      switching: 'prohibited_within_scene',
      note:      '視点人物の知覚・感情に徹底的に寄り添う',
    },
    tempo_rules: {
      book: {
        safety_before_horror:   true,
        silent_chapter_allowed: true,
        reveal_timing:          'part_2_or_later',
      },
    },
    horror_specific: {
      fear_design: {
        setup_rule:       '恐怖の直前に必ず安心感を置く',
        sensory_order:    '音・臭い・触感で先行させ、視覚は後から',
        reveal_timing:    '正体を見せるのは第二部以降',
        overshow_warning: '見せすぎると恐怖が薄れる',
      },
      ending_options: [
        { type:'complete_resolution', effect:'スッキリ系' },
        { type:'survivor_trauma',     effect:'傷を残した解決' },
        { type:'bad_end',             effect:'恐怖の余韻最大' },
        { type:'its_not_over',        effect:'最高の後味の悪さ' },
      ],
    },
    review_extra: [
      { item:'恐怖前の安心感',   weight:20, pass:'恐怖シーン直前に1シーン以上の安心場面がある' },
      { item:'見せすぎていない', weight:20, pass:'正体・原因の直接描写が全文の20%以下' },
      { item:'章末の切り方',     weight:15, pass:'短文または「消えた/いなくなった」で終わっている' },
      { item:'五感描写の先行',   weight:15, pass:'視覚より先に音・臭い・触感の描写がある' },
    ],
  },
};
