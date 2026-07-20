(function () {
  "use strict";

  var titleCandidates = [
    {
      id: "aurora-velocity-arc",
      name: "Aurora Velocity Arc",
      jaName: "オーロラ・ヴェロシティ・アーク",
      pitch: "空中都市の光脈を駆ける、近未来ファンタジーの高速アーケードレース。",
      selected: true
    },
    {
      id: "lumen-drift-orbit",
      name: "Lumen Drift Orbit",
      jaName: "ルーメン・ドリフト・オービット",
      pitch: "魔導工学リングを舞台に、光粒子と重力風を操るドリフト競技。",
      selected: false
    },
    {
      id: "skyforge-rush",
      name: "Skyforge Rush",
      jaName: "スカイフォージ・ラッシュ",
      pitch: "星晶炉で鍛えられたカートが、浮遊群島の競技路を駆け抜ける。",
      selected: false
    }
  ];

  var characters = [
    {
      id: "lyra-vale",
      name: "Lyra Vale",
      jaName: "リラ・ヴェイル",
      role: "Prism Cartographer",
      description: "光脈地図を読む若き測量士。コーナーの先にある風の流れを直感でつかむ。",
      colors: {
        primary: "#44D7FF",
        secondary: "#F8E88B",
        accent: "#143A5A"
      },
      stats: {
        speed: 7,
        accel: 8,
        handling: 9,
        weight: 4,
        boost: 7
      },
      presentation: {
        silhouette: "short-cape pilot with floating map shards",
        portraitMood: "bright, curious, focused",
        victoryLine: "光の流れ、読み切ったよ。",
        engineAura: "cyan ribbons and tiny golden star-map points"
      }
    },
    {
      id: "kael-obsidian",
      name: "Kael Obsidian",
      jaName: "カエル・オブシディアン",
      role: "Runic Mechanic",
      description: "古代炉をチューニングする整備士。重い車体でも押し切る直線加速が持ち味。",
      colors: {
        primary: "#2B2F3A",
        secondary: "#FF7A45",
        accent: "#B8F1FF"
      },
      stats: {
        speed: 8,
        accel: 6,
        handling: 5,
        weight: 9,
        boost: 8
      },
      presentation: {
        silhouette: "broad jacket, glowing tool bracer, heavy boots",
        portraitMood: "calm, sturdy, wry",
        victoryLine: "炉心は嘘をつかない。",
        engineAura: "ember sparks inside blue-white exhaust rings"
      }
    },
    {
      id: "seren-quill",
      name: "Seren Quill",
      jaName: "セレン・クイル",
      role: "Echo Bard Racer",
      description: "音律魔法で姿勢制御を整える巡演レーサー。リズムに乗るほどブーストが伸びる。",
      colors: {
        primary: "#9C6BFF",
        secondary: "#34F0B2",
        accent: "#FFF3F8"
      },
      stats: {
        speed: 6,
        accel: 9,
        handling: 8,
        weight: 3,
        boost: 9
      },
      presentation: {
        silhouette: "sleek performer coat and luminous sound baton",
        portraitMood: "playful, dramatic, razor-sharp",
        victoryLine: "今の走り、サビにしておくね。",
        engineAura: "green pulse waves and violet note-like glints"
      }
    },
    {
      id: "nox-emberlain",
      name: "Nox Emberlain",
      jaName: "ノクス・エンバーライン",
      role: "Night Gate Courier",
      description: "夜間ゲート便で鍛えた反射神経を持つ配達人。混戦をすり抜けるライン取りが得意。",
      colors: {
        primary: "#111827",
        secondary: "#FF4FD8",
        accent: "#7DF9FF"
      },
      stats: {
        speed: 9,
        accel: 7,
        handling: 7,
        weight: 5,
        boost: 6
      },
      presentation: {
        silhouette: "hooded courier, angular scarf, compact visor",
        portraitMood: "cool, alert, slightly mischievous",
        victoryLine: "定刻より、かなり早い。",
        engineAura: "magenta streaks with electric teal afterimages"
      }
    },
    {
      id: "mira-calcite",
      name: "Mira Calcite",
      jaName: "ミラ・カルサイト",
      role: "Crystal Grove Guardian",
      description: "結晶庭園を守る番人。安定した車体制御と防御寄りの走りで終盤に強い。",
      colors: {
        primary: "#E9FFF8",
        secondary: "#78D46A",
        accent: "#4C6BFF"
      },
      stats: {
        speed: 6,
        accel: 6,
        handling: 8,
        weight: 7,
        boost: 5
      },
      presentation: {
        silhouette: "layered guard robe, crystal shoulder fins, steady stance",
        portraitMood: "gentle, composed, unshakable",
        victoryLine: "この庭の風は、私の味方です。",
        engineAura: "soft green motes and faceted blue reflections"
      }
    }
  ];

  var karts = [
    {
      id: "prism-skipper",
      name: "Prism Skipper",
      jaName: "プリズム・スキッパー",
      description: "軽量な光帆フレーム。細かい切り返しと回復加速に優れる。",
      type: "Light",
      colors: {
        body: "#EAFBFF",
        trim: "#44D7FF",
        glow: "#F8E88B"
      },
      stats: {
        speed: 6,
        accel: 9,
        handling: 9,
        weight: 3,
        boost: 7
      },
      presentation: {
        chassisShape: "thin catamaran-like hover kart with folded light sails",
        wheelStyle: "four small magnetic rings",
        trail: "split cyan-and-gold ribbon"
      }
    },
    {
      id: "cinder-vault",
      name: "Cinder Vault",
      jaName: "シンダー・ヴォルト",
      description: "高密度炉を積んだ重量級マシン。接触に強く、長いブーストで直線を支配する。",
      type: "Heavy",
      colors: {
        body: "#2B2F3A",
        trim: "#FF7A45",
        glow: "#B8F1FF"
      },
      stats: {
        speed: 9,
        accel: 5,
        handling: 4,
        weight: 10,
        boost: 9
      },
      presentation: {
        chassisShape: "armored wedge with exposed rune furnace",
        wheelStyle: "wide grav-treads with orange inner heat",
        trail: "low ember wake with pale arc sparks"
      }
    },
    {
      id: "echo-lark",
      name: "Echo Lark",
      jaName: "エコー・ラーク",
      description: "音波スタビライザー搭載の技巧派カート。連続ドリフトで伸びる。",
      type: "Technique",
      colors: {
        body: "#31204F",
        trim: "#34F0B2",
        glow: "#9C6BFF"
      },
      stats: {
        speed: 7,
        accel: 8,
        handling: 8,
        weight: 4,
        boost: 9
      },
      presentation: {
        chassisShape: "compact coupe with resonator fins",
        wheelStyle: "transparent rings vibrating with waveform lines",
        trail: "stacked pulse bands that ripple outward"
      }
    },
    {
      id: "night-comet",
      name: "Night Comet",
      jaName: "ナイト・コメット",
      description: "薄い車高の高速便モデル。最高速が高く、ミスの少ない走行で真価を発揮する。",
      type: "Speed",
      colors: {
        body: "#111827",
        trim: "#FF4FD8",
        glow: "#7DF9FF"
      },
      stats: {
        speed: 10,
        accel: 6,
        handling: 6,
        weight: 5,
        boost: 7
      },
      presentation: {
        chassisShape: "low arrowhead frame with courier cargo ribs",
        wheelStyle: "thin neon discs",
        trail: "magenta comet line with teal flicker"
      }
    },
    {
      id: "verdant-anvil",
      name: "Verdant Anvil",
      jaName: "ヴァーダント・アンヴィル",
      description: "結晶樹脂で組んだ安定型。荒れた路面と接触に耐え、扱いやすい。",
      type: "Balanced",
      colors: {
        body: "#E9FFF8",
        trim: "#78D46A",
        glow: "#4C6BFF"
      },
      stats: {
        speed: 7,
        accel: 7,
        handling: 7,
        weight: 7,
        boost: 6
      },
      presentation: {
        chassisShape: "rounded crystal-resin body with protective side arcs",
        wheelStyle: "faceted mineral hoops",
        trail: "green dust motes and blue crystal shimmer"
      }
    },
    {
      id: "solar-mistral",
      name: "Solar Mistral",
      jaName: "ソーラー・ミストラル",
      description: "太陽風を受ける可変翼カート。中量級ながらブースト後の旋回が鋭い。",
      type: "Hybrid",
      colors: {
        body: "#FFF5D1",
        trim: "#FFB020",
        glow: "#2FE6DE"
      },
      stats: {
        speed: 8,
        accel: 7,
        handling: 8,
        weight: 5,
        boost: 8
      },
      presentation: {
        chassisShape: "streamlined frame with unfolding solar vanes",
        wheelStyle: "gold-edged hover rings",
        trail: "warm sunlit mist crossed by turquoise sparks"
      }
    }
  ];

  var items = [
    {
      id: "aether-fold",
      name: "Aether Fold",
      jaName: "エーテル・フォールド",
      category: "movement",
      description: "短い距離だけ前方の走行ラインへ折り畳むように移動する。壁抜けや順位確定ワープはしない。",
      colors: {
        primary: "#7DF9FF",
        secondary: "#FFFFFF",
        accent: "#445BFF"
      },
      stats: {
        power: 4,
        duration: 1.1,
        radius: 0,
        cooldown: 8,
        rarity: 3
      },
      presentation: {
        iconHint: "folded ribbon portal",
        pickupSfx: "soft glassy inhale",
        useVfx: "two translucent arc gates closing behind the kart"
      }
    },
    {
      id: "gale-thread",
      name: "Gale Thread",
      jaName: "ゲイル・スレッド",
      category: "boost",
      description: "風糸を後方へ伸ばし、数秒間だけ加速と旋回補助を得る。ドリフト中に使うと効果が安定する。",
      colors: {
        primary: "#34F0B2",
        secondary: "#DFFFF5",
        accent: "#186B5C"
      },
      stats: {
        power: 5,
        duration: 2.4,
        radius: 0,
        cooldown: 9,
        rarity: 2
      },
      presentation: {
        iconHint: "three twisting wind strands",
        pickupSfx: "quick cloth flutter",
        useVfx: "green streamers tying into the rear axle"
      }
    },
    {
      id: "mirror-mote",
      name: "Mirror Mote",
      jaName: "ミラー・モート",
      category: "defense",
      description: "小さな反射光をまとい、最初に受ける妨害効果を弱める。強い攻撃は完全無効ではなく減衰する。",
      colors: {
        primary: "#F8E88B",
        secondary: "#EAFBFF",
        accent: "#BFA44A"
      },
      stats: {
        power: 6,
        duration: 5,
        radius: 1.4,
        cooldown: 12,
        rarity: 3
      },
      presentation: {
        iconHint: "floating diamond mote",
        pickupSfx: "tiny chime cluster",
        useVfx: "faceted light shell orbiting close to the kart"
      }
    },
    {
      id: "gravity-loom",
      name: "Gravity Loom",
      jaName: "グラヴィティ・ルーム",
      category: "control",
      description: "前方に重力の織り目を置き、踏んだ相手のハンドリングを短時間だけ重くする。",
      colors: {
        primary: "#9C6BFF",
        secondary: "#251A3D",
        accent: "#FF4FD8"
      },
      stats: {
        power: 6,
        duration: 4,
        radius: 2.2,
        cooldown: 11,
        rarity: 4
      },
      presentation: {
        iconHint: "woven square of violet gravity lines",
        pickupSfx: "low reversed harp",
        useVfx: "flat violet lattice bending the track glow"
      }
    },
    {
      id: "chrono-pebble",
      name: "Chrono Pebble",
      jaName: "クロノ・ペブル",
      category: "tempo",
      description: "周囲の時間感覚を一瞬だけずらし、自車の復帰加速を上げつつ近距離の相手を軽く減速させる。",
      colors: {
        primary: "#FFB020",
        secondary: "#FFF5D1",
        accent: "#7DF9FF"
      },
      stats: {
        power: 5,
        duration: 1.8,
        radius: 3.5,
        cooldown: 13,
        rarity: 4
      },
      presentation: {
        iconHint: "small amber stone with clock-like rings",
        pickupSfx: "single warm tick",
        useVfx: "amber ripple rings expanding at wheel height"
      }
    },
    {
      id: "flare-bloom",
      name: "Flare Bloom",
      jaName: "フレア・ブルーム",
      category: "hazard",
      description: "路面に光花を咲かせる。接触した相手は視界端に強い発光ノイズを受け、少しだけ外へ押される。",
      colors: {
        primary: "#FF7A45",
        secondary: "#FFE2D4",
        accent: "#E12B6A"
      },
      stats: {
        power: 7,
        duration: 5,
        radius: 2,
        cooldown: 12,
        rarity: 3
      },
      presentation: {
        iconHint: "angular flower made of flame petals",
        pickupSfx: "spark pop with petal rustle",
        useVfx: "orange-pink crystal petals opening on the track"
      }
    },
    {
      id: "phase-anchor",
      name: "Phase Anchor",
      jaName: "フェイズ・アンカー",
      category: "counter",
      description: "急な押し出しやスピンを受けた瞬間の姿勢を固定し、短い復帰ブーストへ変換する。",
      colors: {
        primary: "#4C6BFF",
        secondary: "#B8F1FF",
        accent: "#111827"
      },
      stats: {
        power: 6,
        duration: 4.5,
        radius: 0,
        cooldown: 14,
        rarity: 4
      },
      presentation: {
        iconHint: "blue anchor made of offset frames",
        pickupSfx: "metallic phase click",
        useVfx: "stacked blue silhouettes snapping back into alignment"
      }
    },
    {
      id: "lumen-orchard",
      name: "Lumen Orchard",
      jaName: "ルーメン・オーチャード",
      category: "support",
      description: "自車の後ろに小さな光果を数個落とす。味方や自分が触れると微回復加速、相手は軽く弾かれる。",
      colors: {
        primary: "#78D46A",
        secondary: "#FFF3F8",
        accent: "#F8E88B"
      },
      stats: {
        power: 4,
        duration: 6,
        radius: 1,
        cooldown: 10,
        rarity: 2
      },
      presentation: {
        iconHint: "cluster of glowing fruit sparks",
        pickupSfx: "soft seed rattle",
        useVfx: "three green-gold motes bouncing gently on the road"
      }
    }
  ];

  var courses = [
    {
      id: "skyspire-prismway",
      name: "Skyspire Prismway",
      jaName: "スカイスパイア・プリズムウェイ",
      theme: "夜明けの空中都市、光脈水路、透明な高架路",
      difficulty: {
        id: "novice",
        label: "Novice",
        jaLabel: "初級",
        stars: 2,
        note: "広い道幅と読みやすいカーブで、ドリフトとアイテム使用の基本を見せる。"
      },
      lapCount: 3,
      routeMood: "爽快で明るい。最初の一周で世界観を見せ、二周目以降にショートカットを狙わせる。",
      waypointNotes: [
        {
          id: "start-terrace",
          order: 1,
          ambience: "浮遊駅の発着テラス。足元の透明路面に雲と都市光が反射する。",
          roadFeel: "wide straight",
          gameplayIntent: "スタート直後に隊列を作り、最初のアイテム列まで十分な余裕を置く。"
        },
        {
          id: "canal-arc",
          order: 2,
          ambience: "光脈水路に沿う大きな右カーブ。水ではなく発光粒子が流れる。",
          roadFeel: "gentle banked curve",
          gameplayIntent: "初心者が自然にドリフトを始められる半径。外側に安全帯を置く。"
        },
        {
          id: "bell-bridge",
          order: 3,
          ambience: "音叉のような橋梁。通過時に背景の塔が淡く共鳴する。",
          roadFeel: "narrow bridge with two lanes",
          gameplayIntent: "中央は速いが接触リスクがあり、左右にアイテム列を置いて選択を作る。"
        },
        {
          id: "garden-drop",
          order: 4,
          ambience: "結晶庭園へ下る緩い落下路。花弁状の足場が段差を作る。",
          roadFeel: "descending S curve",
          gameplayIntent: "ブースト後の旋回を試す区間。内側に小さなショートカットを置く。"
        },
        {
          id: "spire-return",
          order: 5,
          ambience: "塔の外壁を回り込み、ゴールゲートへ戻る螺旋路。",
          roadFeel: "long spiral turn into final straight",
          gameplayIntent: "順位変動のラストチャンス。最終直線の前にリスク高めのブーストパネルを置く。"
        }
      ],
      obstacles: [
        {
          id: "drifting-light-barge",
          name: "Drifting Light Barge",
          jaName: "漂光バージ",
          behavior: "低速で横切る発光貨物台。接触すると軽く押し戻される。",
          placement: "canal-arc outer edge and bell-bridge approach"
        },
        {
          id: "crystal-wind-chime",
          name: "Crystal Wind Chime",
          jaName: "結晶風鈴",
          behavior: "一定周期で揺れ、近くを通ると横風を発生させる。",
          placement: "garden-drop inside line"
        },
        {
          id: "maintenance-orb",
          name: "Maintenance Orb",
          jaName: "整備オーブ",
          behavior: "路面を清掃しながら周回する小型機。ぶつかると少し跳ねる。",
          placement: "start-terrace far lane"
        }
      ],
      boostPanels: [
        {
          id: "start-lane-boosts",
          placement: "スタート直線の左右端に二枚。中央混戦を避ける代替ライン。",
          strength: 1.1,
          risk: "low"
        },
        {
          id: "garden-cut-boost",
          placement: "garden-drop 内側ショートカットの出口。",
          strength: 1.3,
          risk: "medium"
        },
        {
          id: "final-spire-boost",
          placement: "spire-return の外側、落下防止柵ぎりぎり。",
          strength: 1.45,
          risk: "high"
        }
      ],
      itemBoxes: [
        {
          id: "first-canal-row",
          placement: "canal-arc 入口に横一列。",
          count: 6,
          respawnSeconds: 5,
          intent: "序盤の順位差が広がる前に全員へ選択肢を渡す。"
        },
        {
          id: "bridge-split-pair",
          placement: "bell-bridge の左右レーンに三個ずつ。",
          count: 6,
          respawnSeconds: 5,
          intent: "速い中央ラインとアイテム取得ラインの分岐を作る。"
        },
        {
          id: "spiral-catchup-row",
          placement: "spire-return 中腹の外側ライン。",
          count: 5,
          respawnSeconds: 4,
          intent: "後続が拾いやすい位置に置き、終盤の逆転機会を増やす。"
        }
      ],
      backgroundEffects: [
        "遠景の浮遊塔がラップごとに少しずつ点灯する。",
        "コース下の雲海に光脈の流れが映り、速度感に合わせて伸びる。",
        "最終ラップではゴールゲート上空に淡いオーロラ円環が開く。"
      ],
      presentation: {
        palette: ["#44D7FF", "#F8E88B", "#EAFBFF", "#143A5A", "#78D46A"],
        musicCue: "fast bell arpeggios, airy drums, bright synth choir",
        skybox: "sunrise clouds with floating city silhouettes"
      }
    },
    {
      id: "ember-archive-run",
      name: "Ember Archive Run",
      jaName: "エンバー・アーカイブ・ラン",
      theme: "古代記録炉、溶けた文字光、地下の魔導図書廊",
      difficulty: {
        id: "adept",
        label: "Adept",
        jaLabel: "中級",
        stars: 4,
        note: "狭い分岐と周期障害物で、ライン取りと妨害アイテムの判断を要求する。"
      },
      lapCount: 3,
      routeMood: "熱く重厚。路面の文字が流れ、プレイヤーの速度に合わせて壁の文様が開閉する。",
      waypointNotes: [
        {
          id: "archive-gate",
          order: 1,
          ambience: "巨大な石扉の下をくぐるスタート。炉の赤ではなく、記録光の橙が主役。",
          roadFeel: "short straight into split lanes",
          gameplayIntent: "左右分岐で混雑をばらし、重量級カートにも前へ出る余地を作る。"
        },
        {
          id: "glyph-stacks",
          order: 2,
          ambience: "浮いた石板が棚のように並び、古い文字が路面へ降ってくる。",
          roadFeel: "tight chicane",
          gameplayIntent: "ハンドリング性能を活かす区間。外側に回避用の広い逃げ道を用意する。"
        },
        {
          id: "furnace-vault",
          order: 3,
          ambience: "中央炉の周囲を回る円形ホール。熱波がレンズのように景色を歪ませる。",
          roadFeel: "wide circular drift zone",
          gameplayIntent: "長いドリフトとブースト連携を狙わせる。内外でアイテム配置を変える。"
        },
        {
          id: "index-drop",
          order: 4,
          ambience: "索引の階段が一瞬だけ橋になる落下セクション。",
          roadFeel: "timed ramps and landing lane",
          gameplayIntent: "ジャンプ後の復帰加速を見せる。無理なショートカットには着地リスクを残す。"
        }
      ],
      obstacles: [
        {
          id: "page-slab",
          name: "Page Slab",
          jaName: "ページ・スラブ",
          behavior: "石板が一定間隔で左右へスライドし、通路幅を変える。",
          placement: "glyph-stacks"
        },
        {
          id: "heat-lens",
          name: "Heat Lens",
          jaName: "ヒート・レンズ",
          behavior: "触れると視界が波打つ熱気の柱。速度は落とさず入力感だけ少し鈍る。",
          placement: "furnace-vault inner line"
        },
        {
          id: "index-step",
          name: "Index Step",
          jaName: "インデックス・ステップ",
          behavior: "短時間だけ出現する足場。タイミングがずれると遠回りルートへ落ちる。",
          placement: "index-drop"
        }
      ],
      boostPanels: [
        {
          id: "split-lane-kickers",
          placement: "archive-gate の左右分岐出口。",
          strength: 1.2,
          risk: "low"
        },
        {
          id: "furnace-inner-chain",
          placement: "furnace-vault の内側に三連続。",
          strength: 1.25,
          risk: "medium"
        },
        {
          id: "index-last-page",
          placement: "index-drop の一時足場終端。",
          strength: 1.5,
          risk: "high"
        }
      ],
      itemBoxes: [
        {
          id: "glyph-recovery-line",
          placement: "glyph-stacks 後の広い復帰路。",
          count: 5,
          respawnSeconds: 5,
          intent: "チカンで失速したプレイヤーへ立て直し手段を渡す。"
        },
        {
          id: "furnace-risk-ring",
          placement: "furnace-vault の内側リスクライン。",
          count: 4,
          respawnSeconds: 4,
          intent: "速い内側を選ぶ理由を増やす。"
        },
        {
          id: "outer-catchup-cache",
          placement: "furnace-vault の外側安全ライン。",
          count: 6,
          respawnSeconds: 5,
          intent: "後続や初心者が安定して拾える補助列。"
        }
      ],
      backgroundEffects: [
        "壁面の文字列が順位に反応して流速を変える。",
        "ジャンプ区間で下層の記録炉が巨大な円として見える。",
        "最終ラップは天井の石板が開き、星空と炉光が混ざる。"
      ],
      presentation: {
        palette: ["#FF7A45", "#2B2F3A", "#B8F1FF", "#FFF5D1", "#9C6BFF"],
        musicCue: "heavy drums, plucked low strings, glassy arpeggios",
        skybox: "subterranean archive vault with glowing script haze"
      }
    },
    {
      id: "moonwell-bazaar",
      name: "Moonwell Bazaar",
      jaName: "ムーンウェル・バザール",
      theme: "月光市場、反重力屋台、夜の水鏡路",
      difficulty: {
        id: "expert",
        label: "Expert",
        jaLabel: "上級",
        stars: 5,
        note: "視界演出と細い高速ラインが多く、リスク選択とアイテム温存が重要。"
      },
      lapCount: 3,
      routeMood: "賑やかで立体的。市場の上層、屋台の間、水鏡の低層を行き来する。",
      waypointNotes: [
        {
          id: "lantern-grid",
          order: 1,
          ambience: "吊り灯籠の格子を抜ける直線。ネオンではなく月光を含んだ柔らかい発光。",
          roadFeel: "fast straight with overhead occlusion",
          gameplayIntent: "速度を出させながら、視界を一瞬だけ隠す背景演出で緊張感を作る。"
        },
        {
          id: "vendor-switchbacks",
          order: 2,
          ambience: "反重力屋台の間を縫う連続ヘアピン。",
          roadFeel: "tight switchbacks",
          gameplayIntent: "上級者向けのドリフト連鎖区間。外側には救済アイテムを置く。"
        },
        {
          id: "moonwell-skim",
          order: 3,
          ambience: "浅い水鏡の上を滑る低層路。月が二重に映る。",
          roadFeel: "low-friction sweep",
          gameplayIntent: "ハンドリングの差を出す。水鏡に入るとわずかに横滑りする。"
        },
        {
          id: "awning-leap",
          order: 4,
          ambience: "布屋根を足場にしたジャンプ連続。着地ごとに色粉の光が舞う。",
          roadFeel: "jump chain",
          gameplayIntent: "ショートカットと落下リスクを明確にし、終盤の逆転ポイントにする。"
        }
      ],
      obstacles: [
        {
          id: "hover-stall",
          name: "Hover Stall",
          jaName: "ホバー屋台",
          behavior: "短い距離を往復する屋台。接触で速度が落ち、積荷の光粉が散る。",
          placement: "vendor-switchbacks"
        },
        {
          id: "moonwell-slipstream",
          name: "Moonwell Slipstream",
          jaName: "月井スリップ流",
          behavior: "水鏡路に走る横流れ。乗ると斜めに押されるが、うまく使うと内側へ入れる。",
          placement: "moonwell-skim"
        },
        {
          id: "folding-awning",
          name: "Folding Awning",
          jaName: "折り畳み布屋根",
          behavior: "周期的に開閉するジャンプ台。閉じた瞬間は通常路面になる。",
          placement: "awning-leap"
        }
      ],
      boostPanels: [
        {
          id: "lantern-grid-center",
          placement: "lantern-grid 中央の高速ライン。",
          strength: 1.3,
          risk: "medium"
        },
        {
          id: "moonwell-inner-skim",
          placement: "moonwell-skim の水鏡内側。",
          strength: 1.4,
          risk: "high"
        },
        {
          id: "awning-final-hop",
          placement: "awning-leap 最後の布屋根。",
          strength: 1.5,
          risk: "high"
        }
      ],
      itemBoxes: [
        {
          id: "vendor-outer-help",
          placement: "vendor-switchbacks 外側ライン。",
          count: 6,
          respawnSeconds: 4,
          intent: "低速で曲がるプレイヤーが次区間で追いつけるようにする。"
        },
        {
          id: "moonwell-risk-cache",
          placement: "moonwell-skim の中央横流れ上。",
          count: 4,
          respawnSeconds: 4,
          intent: "難しい水鏡ラインへ報酬を置く。"
        },
        {
          id: "awning-final-row",
          placement: "awning-leap 着地直後。",
          count: 5,
          respawnSeconds: 5,
          intent: "最終直線前の読み合いを作る。"
        }
      ],
      backgroundEffects: [
        "市場の観客が光布を振り、順位変動時に色が変わる。",
        "水鏡に自車のトレイルが遅れて映る。",
        "最終ラップでは巨大な月井が上空へ反転して、背景全体が明るくなる。"
      ],
      presentation: {
        palette: ["#111827", "#FF4FD8", "#7DF9FF", "#FFF3F8", "#FFB020"],
        musicCue: "quick hand percussion, bright mallets, nocturnal bass synth",
        skybox: "moonlit city market with floating cloth roofs"
      }
    }
  ];

  window.AURORA_GAME_DATA = {
    version: "0.8.4-steer-v51",
    selectedTitleId: "aurora-velocity-arc",
    selectedTitle: titleCandidates[0],
    titleCandidates: titleCandidates,
    world: {
      id: "luminara-arcology",
      name: "Luminara Arcology",
      jaName: "ルミナラ環空圏",
      genre: "near-future fantasy arcade kart racing",
      premise: "魔導工学で浮かぶ都市群では、古代の光脈を保守するための巡行技術が競技化された。レーサーたちは光脈カートに乗り、都市・炉・市場をつなぐ空中路で速度と技術を競う。",
      toneWords: ["bright", "kinetic", "mystic-tech", "competitive", "hopeful"],
      visualRules: [
        "既存の有名カート作品を連想させる固有名詞、果物皮、甲殻、星無敵などの定番意匠は使わない。",
        "アイテムは魔導工学の現象として表現し、動物・既存ファンタジー種族・既存IP風マスコットに寄せない。",
        "レース画面では空中路、光脈、結晶、文字光、月光市場を中心に見せる。"
      ],
      coreLoopNotes: [
        "ドリフトで小ブーストを貯め、コース上のブーストパネルとオリジナルアイテムで順位を動かす。",
        "アイテムは即時逆転よりも、ライン選択・防御・復帰加速を支える効果に寄せる。",
        "難易度が上がるほど、足場の周期、横風、低摩擦路面などの読み合いを増やす。"
      ]
    },
    statScale: {
      min: 1,
      max: 10,
      fields: {
        speed: "最高速",
        accel: "低速からの立ち上がり",
        handling: "旋回とドリフト制御",
        weight: "接触耐性と押し出し力",
        boost: "ブーストの伸びと持続"
      }
    },
    difficulties: [
      {
        id: "novice",
        label: "Novice",
        jaLabel: "初級",
        stars: 2,
        description: "広い道幅、見通しの良いカーブ、低リスクなブースト配置。"
      },
      {
        id: "adept",
        label: "Adept",
        jaLabel: "中級",
        stars: 4,
        description: "分岐、周期障害物、内外ラインの報酬差を増やす。"
      },
      {
        id: "expert",
        label: "Expert",
        jaLabel: "上級",
        stars: 5,
        description: "高速で狭い区間、視界演出、落下リスクのあるショートカットを含める。"
      }
    ],
    courseThemes: [
      {
        id: "sky-city",
        name: "Sky City Prism",
        jaName: "空中都市プリズム",
        keywords: ["transparent roads", "cloud reflections", "aether canals"]
      },
      {
        id: "ember-archive",
        name: "Ember Archive",
        jaName: "記録炉アーカイブ",
        keywords: ["rune furnace", "sliding stone pages", "orange script light"]
      },
      {
        id: "moon-bazaar",
        name: "Moon Bazaar",
        jaName: "月光バザール",
        keywords: ["hover stalls", "moonwell reflections", "cloth-roof jumps"]
      }
    ],
    characters: characters,
    karts: karts,
    items: items,
    courses: courses,
    defaults: {
      characterId: "lyra-vale",
      kartId: "prism-skipper",
      courseId: "skyspire-prismway",
      itemPool: items.map(function (item) {
        return item.id;
      })
    },
    uiCopy: {
      selectCharacter: "レーサー選択",
      selectKart: "カート選択",
      selectCourse: "コース選択",
      itemLabel: "光脈アイテム"
    }
  };
  window.AURORA_GAME_DATA.artDirection = {
    visualNorthStar: "premium near-future fantasy skyway racing",
    palette: {
      main: ["#07111D", "#111827", "#241632"],
      support: ["#44D7FF", "#7DF9FF", "#4C6BFF"],
      accents: ["#FF4FD8", "#FFB020", "#78D46A"]
    },
    materialLanguage: ["brushed dark metal", "cyan glass", "warm amber energy", "magenta holograms", "cloud haze"],
    qualityRules: [
      "Every racer must have a readable silhouette from the chase camera.",
      "Every kart should show nose, side pods, rear engine, spoiler, and glow lines.",
      "The course must read as a race venue, not a bare road: gates, city depth, cloud layer, panels, and spectators."
    ]
  };

  var visualTraits = {
    "lyra-vale": "pilot",
    "kael-obsidian": "robot",
    "seren-quill": "spirit",
    "nox-emberlain": "beast",
    "mira-calcite": "guardian"
  };
  characters.forEach(function (character) {
    character.modelTrait = visualTraits[character.id] || character.modelTrait || "pilot";
    character.visualUpgrade = {
      silhouetteGoal: character.modelTrait === "beast" ? "large ears, goggles, scarf, compact athletic posture" :
        character.modelTrait === "robot" ? "wide armored shoulders, glowing eyes, antenna, heavy mechanical arms" :
        character.modelTrait === "spirit" ? "translucent body, orbiting crystals, small wing fins, luminous tail" :
        character.modelTrait === "guardian" ? "crystal crest, calm plated suit, winglike facets" :
        character.modelTrait === "sprinter" ? "low swept visor, arrow fins, slim forward posture, long light scarf" :
        "helmet visor, racing jacket, shoulder pads, short cape",
      requiredParts: ["eyes", "visor or goggles", "torso suit", "shoulder detail", "asymmetric accessory", "glow accent"]
    };
  });

  karts.forEach(function (kart) {
    kart.visualUpgrade = {
      requiredParts: ["faceted chassis", "front nose", "side pods", "rear spoiler", "engine plumes", "hover or tire rings", "glow strips"],
      motionNotes: "suspension bob, high-speed pitch, drift roll, boost plume scaling, impact wobble"
    };
  });

  var spaceCharacters = [
    {
      id: "luna-mimi",
      name: "Luna Mimi",
      jaName: "ルナ・ミミ",
      role: "Moon Rabbit Racer",
      jaRole: "つきうさぎレーサー",
      machineId: "moon-skipper",
      specialty: "まがりやすさ",
      catchLine: "つきのカーブなら、まかせて！",
      description: "大きな耳と宇宙ゴーグルをつけた月うさぎレーサー。細かいカーブがとくい。",
      colors: { primary: "#EAF8FF", secondary: "#6EE7FF", accent: "#FFD166" },
      boostColor: "#FFD166",
      stats: { speed: 6, accel: 8, handling: 10, weight: 3, boost: 7 },
      modelTrait: "beast",
      presentation: {
        silhouette: "large moon-rabbit ears, round space goggles, crescent suit mark",
        portraitMood: "quick, cheerful, brave",
        victoryLine: "つきのライン、ぴったりだったね！",
        engineAura: "gold moon dust and cyan orbit rings"
      }
    },
    {
      id: "gamma-bolt",
      name: "Gamma Bolt",
      jaName: "ガンマ・ボルト",
      role: "Heavy Robot Racer",
      jaRole: "じゅうりょうロボットレーサー",
      machineId: "iron-bastion",
      specialty: "ぶつかりのつよさ",
      catchLine: "まっすぐいく。ゆずらない。",
      description: "太い腕と光る目をもつ宇宙作業ロボット。重いマシンでぶつかりに強い。",
      colors: { primary: "#A95027", secondary: "#29313D", accent: "#78E8F2" },
      boostColor: "#FF8A3D",
      stats: { speed: 8, accel: 5, handling: 4, weight: 10, boost: 8 },
      modelTrait: "robot",
      presentation: {
        silhouette: "huge arms, square helmet, glowing work lights",
        portraitMood: "solid, calm, unstoppable",
        victoryLine: "コースは、ぜんぶ計算ずみだ。",
        engineAura: "orange furnace sparks and blue plasma vents"
      }
    },
    {
      id: "nebi-mist",
      name: "Nebi Mist",
      jaName: "ネビィ・ミスト",
      role: "Nebula Spirit Racer",
      jaRole: "せいうんのせいれいレーサー",
      machineId: "nebula-float",
      specialty: "スタートのはやさ",
      catchLine: "星のしっぽで、すっと前へ。",
      description: "星雲から生まれたふわふわのレーサー。軽く浮かんで、スタートが速い。",
      colors: { primary: "#352D72", secondary: "#39C7D4", accent: "#B98CFF" },
      boostColor: "#A78BFA",
      stats: { speed: 7, accel: 10, handling: 8, weight: 2, boost: 9 },
      modelTrait: "spirit",
      presentation: {
        silhouette: "floating body, star tail, transparent nebula glow",
        portraitMood: "soft, fast, mysterious",
        victoryLine: "星くずの道、きれいだったね。",
        engineAura: "violet nebula mist and white star motes"
      }
    },
    {
      id: "sora-ranger",
      name: "Sora Ranger",
      jaName: "ソラ・レンジャー",
      role: "Space Explorer Racer",
      jaRole: "うちゅうたんけんレーサー",
      machineId: "star-ranger",
      specialty: "そうごうりょく",
      catchLine: "どんなコースでも、星をめざす！",
      description: "ヘルメットとマフラーの宇宙探検家。どのコースでも走りやすい。",
      colors: { primary: "#274C78", secondary: "#E89532", accent: "#79E7F2" },
      boostColor: "#4FC3FF",
      stats: { speed: 7, accel: 7, handling: 7, weight: 6, boost: 7 },
      modelTrait: "pilot",
      presentation: {
        silhouette: "space helmet, scarf, balanced racing suit",
        portraitMood: "focused, adventurous, friendly",
        victoryLine: "つぎの星まで、まだ走れるよ！",
        engineAura: "blue star trail with amber explorer lights"
      }
    },
    {
      id: "comet-rin",
      name: "Comet Rin",
      jaName: "コメット・リン",
      role: "Meteor Sprinter",
      jaRole: "りゅうせいスプリンター",
      machineId: "comet-spear",
      specialty: "はやさ",
      catchLine: "いっきに、星をぬけるよ！",
      description: "流星マークのスーツを着たスピードレーサー。まっすぐな道でとても速い。",
      colors: { primary: "#101827", secondary: "#FF4FD8", accent: "#7DF9FF" },
      boostColor: "#FF4FD8",
      stats: { speed: 10, accel: 7, handling: 6, weight: 4, boost: 8 },
      modelTrait: "sprinter",
      presentation: {
        silhouette: "sharp comet fins, low visor, long light scarf",
        portraitMood: "cool, quick, daring",
        victoryLine: "見えた？ いまの流星ライン！",
        engineAura: "magenta comet streaks and cyan sparks"
      }
    }
  ];

  var spaceMachines = [
    {
      id: "moon-skipper",
      name: "Moon Skipper",
      jaName: "ムーン・スキッパー",
      ownerId: "luna-mimi",
      description: "月の光で軽くはねる小型ホバーマシン。カーブでふわっと曲がる。",
      type: "Light",
      className: "Light",
      colors: { body: "#D7EDF2", trim: "#17425C", glow: "#E8C66A", primary: "#D7EDF2", secondary: "#17425C", accent: "#E8C66A" },
      boostColor: "#FFD166",
      signatureParts: ["crescent side wings", "moon orbit hover rings", "gold dust booster"],
      stats: { speed: 6, accel: 9, handling: 10, weight: 3, boost: 7 },
      presentation: { chassisShape: "crescent-wing light hover racer", wheelStyle: "small moon orbit rings", trail: "gold moon dust" }
    },
    {
      id: "iron-bastion",
      name: "Iron Bastion",
      jaName: "アイアン・バスティオン",
      ownerId: "gamma-bolt",
      description: "厚いそうこうの重装甲マシン。ぶつかっても走りがくずれにくい。",
      type: "Heavy",
      className: "Heavy",
      colors: { body: "#A95027", trim: "#29313D", glow: "#78E8F2", primary: "#A95027", secondary: "#29313D", accent: "#78E8F2" },
      boostColor: "#FF8A3D",
      signatureParts: ["front ram armor", "side armor blocks", "reactor exhaust stacks"],
      stats: { speed: 8, accel: 5, handling: 4, weight: 10, boost: 9 },
      presentation: { chassisShape: "wide armored space work racer", wheelStyle: "heavy grav treads", trail: "orange reactor sparks" }
    },
    {
      id: "nebula-float",
      name: "Nebula Float",
      jaName: "ネビュラ・フロート",
      ownerId: "nebi-mist",
      description: "星雲のガスで浮かぶマシン。スタートからすばやく前に出る。",
      type: "Light",
      className: "Light",
      colors: { body: "#352D72", trim: "#39C7D4", glow: "#B98CFF", primary: "#352D72", secondary: "#39C7D4", accent: "#B98CFF" },
      boostColor: "#A78BFA",
      signatureParts: ["transparent nebula body", "floating orbit rings", "star mote hover field"],
      stats: { speed: 7, accel: 10, handling: 8, weight: 2, boost: 9 },
      presentation: { chassisShape: "transparent floating nebula racer", wheelStyle: "no wheels, orbit fins", trail: "violet mist and star motes" }
    },
    {
      id: "star-ranger",
      name: "Star Ranger",
      jaName: "スター・レンジャー",
      ownerId: "sora-ranger",
      description: "探検用パーツを積んだバランス型マシン。どんな道でもあつかいやすい。",
      type: "Balanced",
      className: "Balanced",
      colors: { body: "#274C78", trim: "#E89532", glow: "#79E7F2", primary: "#274C78", secondary: "#E89532", accent: "#79E7F2" },
      boostColor: "#4FC3FF",
      signatureParts: ["explorer antenna", "side cargo pods", "amber route lamps"],
      stats: { speed: 7, accel: 7, handling: 7, weight: 6, boost: 7 },
      presentation: { chassisShape: "balanced explorer pod racer", wheelStyle: "four stable orbit wheels", trail: "blue star line" }
    },
    {
      id: "comet-spear",
      name: "Comet Spear",
      jaName: "コメット・スピア",
      ownerId: "comet-rin",
      description: "細い船体で流星のように走る高速マシン。直線のはやさが強い。",
      type: "Speed",
      className: "Speed",
      colors: { body: "#101827", trim: "#FF4FD8", glow: "#7DF9FF", primary: "#101827", secondary: "#FF4FD8", accent: "#7DF9FF" },
      boostColor: "#FF4FD8",
      signatureParts: ["needle spear nose", "long plasma rails", "swept comet fins"],
      stats: { speed: 10, accel: 7, handling: 6, weight: 4, boost: 8 },
      presentation: { chassisShape: "needle nose comet sprint machine", wheelStyle: "thin plasma rings", trail: "magenta comet tail" }
    }
  ];

  var lunarCourse = {
    id: "lunar-crater-run",
    name: "Moon Jump Crater",
    jaName: "つきのジャンプクレーター",
    kindLabel: "月面コース",
    icon: "月",
    shortCopy: "広いクレーターをまわる、やさしい立体コース",
    difficultyLabel: "やさしい",
    caution: "すこしすべる",
    theme: "月の平原、クレーター、月面基地を走る低重力グランプリコース",
    description: "灰色の月面、白い粉じん、大きなクレーター、遠くの地球を見ながら走る月のコース。ジャンプがふわっと長く、道の外は月の砂で少しすべる。",
    colors: { primary: "#EAF6FF", secondary: "#1A2230", accent: "#E8C66A" },
    palette: { road: "#465465", roadEmissive: "#0D141C", railLeft: "#EAF8FF", railRight: "#A9D7EA", centerLine: "#EAFBFF", shortcut: "#536173", dust: "#AAB3BF", warning: "#E8C66A", sky: "#02050D", fog: "#070A12", structure: "#7E8998", boost: "#DFF8FF" },
    surfaceType: "lunar-regolith-lane",
    backgroundType: "moon-surface",
    jumpStyle: "low-gravity",
    gripModifier: 0.93,
    visualSignature: "クレーター、月面基地、大きな地球、白い粉じん",
    courseIcon: "月",
    difficultyNote: "広いカーブと、ふわっと長いジャンプ",
    landmarks: ["大きな地球", "月面基地", "パラボラアンテナ", "着陸船", "月面ローバー"],
    background: { kind: "moon", sky: "black-space", horizon: "low-lunar-horizon" },
    hazards: ["月の岩", "小さなクレーター", "月の粉じん", "低い発光ビーコン"],
    gravityFeel: "low",
    boostStyle: "few-strong",
    roadFeel: "広いクレーター周回・ゆるい坂・低重力ジャンプ",
    features: ["低重力ジャンプ", "月面クレーター", "大きな地球", "月面基地", "パラボラアンテナ", "着陸船", "月面ローバー", "白い粉じん", "月の岩", "低い発光ポール"],
    lapCount: 3,
    curveTension: 0.56,
    topology: { route: "crater-loop", routeLabel: "クレーター周回", heightLabel: "高低差 ひくめ", cornerLabel: "カーブ ゆるい", bankStrength: 0.35, maxBank: 5, bankLookAhead: 12, climbEffect: 8 },
    sectors: [{ name: "地球のみえる丘", tip: "広い道でスピードをのせよう", challenge: "まんなかを走る" }, { name: "クレーター橋", tip: "ふわっと長いジャンプ", challenge: "まっすぐ着地" }, { name: "月面基地ストレート", tip: "白いラインをまっすぐ走ろう", challenge: "最高速をねらう" }],
    medalTime: 210,
    backgroundEffects: ["黒い宇宙空間", "低い月の水平線", "遠くに見える地球", "白い月の粉じん"]
  };

  var spaceCourse = {
    id: "starlight-orbit-ring",
    name: "Ring Planet Sprint",
    shortName: "Ring Planet",
    jaName: "わっかの星リング",
    kindLabel: "リング惑星コース",
    icon: "輪",
    courseIcon: "輪",
    shortCopy: "高いリングをかけぬける、高速コース",
    kidDescription: "大きな星のわっかを走る、ながい直線とジャンプのコース。",
    difficultyLabel: "ふつう",
    difficultyNote: "長い直線、急なのぼり、高速バンク",
    caution: "わっかのすきまを飛びこえよう",
    theme: "巨大なリング惑星の輪の上を走る高速グランプリコース",
    description: "白、金、うすい青の明るいリング路面を走るコース。下には巨大な惑星が見え、氷と岩の粒が流れるわっかのすきまをジャンプで越える。",
    colors: { primary: "#F8FDFF", secondary: "#2F4D79", accent: "#E8C66A" },
    palette: { road: "#75889F", roadEmissive: "#263B55", railLeft: "#DDF6FF", railRight: "#E8C66A", centerLine: "#EAFBFF", shortcut: "#58708C", dust: "#A9BED4", warning: "#E8C66A", sky: "#071326", fog: "#0A172B", structure: "#879AAF", boost: "#F5D77A" },
    surfaceType: "ring-ice-metal",
    backgroundType: "ring-planet",
    landmarks: ["巨大な惑星", "大きな輪", "氷と岩の粒", "リングジャンプ", "遠くの輪の層"],
    background: { kind: "ring-planet", sky: "deep-orbit", horizon: "giant-planet" },
    hazards: ["リングのすきま", "浮く氷の粒", "高速コーナー"],
    gravityFeel: "stable",
    boostStyle: "many-fast",
    jumpStyle: "ring-gap",
    gripModifier: 1.06,
    visualSignature: "巨大な惑星、わっか、氷と岩の粒、リングジャンプ",
    roadFeel: "長い高架直線・急上昇・高速バンク",
    features: ["巨大な惑星", "大きなわっか", "長い直線", "リングジャンプ", "氷と岩の粒", "白と金の路面", "発光ガード", "ブースト多め", "遠くの輪の層", "スピード重視"],
    lapCount: 3,
    curveTension: 0.38,
    topology: { route: "elevated-ring", routeLabel: "高架スピードリング", heightLabel: "高低差 大きい", cornerLabel: "高速バンク", bankStrength: 1.2, maxBank: 14, bankLookAhead: 10, climbEffect: 12 },
    sectors: [{ name: "惑星ビューストレート", tip: "ブーストをつないで加速", challenge: "ブーストをつなぐ" }, { name: "リングギャップ", tip: "わっかのすきまを飛びこえよう", challenge: "着地ダッシュ" }, { name: "ゴールドバンク", tip: "外へふくらまないように曲がろう", challenge: "ラインをキープ" }],
    medalTime: 185,
    backgroundEffects: ["巨大惑星の光", "遠くの輪の層", "流れる氷の粒", "明るい発光レール"]
  };
  var meteorCourse = {
    id: "meteor-mining-belt",
    name: "Mars Dust Canyon",
    shortName: "Mars Dust",
    jaName: "あかい星のすなあらし",
    kindLabel: "火星コース",
    icon: "赤",
    courseIcon: "赤",
    shortCopy: "渓谷を上り下りする、ヘアピンコース",
    kidDescription: "赤いすなと岩の星を走る、すなぼこりのコース。",
    difficultyLabel: "むずかしい",
    difficultyNote: "連続ヘアピンと急な坂がむずかしい",
    caution: "岩にぶつからないようにしよう",
    theme: "赤い火星の砂地、渓谷、岩山、火星基地を走るグランプリコース",
    description: "赤茶色の砂地、岩山、渓谷、火星基地のそばを走るコース。砂で少し滑り、すなぼこりと岩を避ける緊張感がある。",
    colors: { primary: "#E8753A", secondary: "#4A2318", accent: "#FFD08A" },
    palette: { road: "#A54E2B", roadEmissive: "#5E2818", railLeft: "#E8753A", railRight: "#FFD08A", centerLine: "#FFE0A8", shortcut: "#7A3620", dust: "#B76138", warning: "#FFD08A", sky: "#2A130D", fog: "#5A2415", structure: "#7D3A24", boost: "#FFB15C" },
    surfaceType: "mars-sand",
    backgroundType: "mars-canyon",
    landmarks: ["赤い岩山", "渓谷", "火星基地", "探査ローバー", "砂嵐"],
    background: { kind: "mars", sky: "orange-dust", horizon: "red-canyon" },
    hazards: ["赤い岩", "すなぼこり", "せまい渓谷", "火星ビーコン"],
    gravityFeel: "rough",
    boostStyle: "few-strong",
    jumpStyle: "canyon-hop",
    gripModifier: 0.86,
    visualSignature: "赤い砂、渓谷、赤い岩山、砂嵐、火星基地",
    roadFeel: "渓谷の上り下り・連続ヘアピン・砂ですべる",
    features: ["赤い砂", "赤い岩山", "渓谷", "砂嵐", "火星基地", "探査ローバー", "岩を避ける", "砂ぼこり", "オレンジの空", "せまい区間"],
    lapCount: 3,
    curveTension: 0.62,
    topology: { route: "canyon-switchback", routeLabel: "渓谷ヘアピン", heightLabel: "高低差 大きい", cornerLabel: "急カーブ 多い", bankStrength: 0.55, maxBank: 8, bankLookAhead: 8, climbEffect: 14 },
    sectors: [{ name: "赤い岩の入口", tip: "岩のあいだをまっすぐ走ろう", challenge: "岩にぶつからない" }, { name: "すなあらし渓谷", tip: "カーブ前に少しスピードを落とそう", challenge: "早めにブレーキ" }, { name: "火星基地ヘアピン", tip: "ドリフトをためてぬけよう", challenge: "ゴールドドリフト" }],
    medalTime: 225,
    backgroundEffects: ["オレンジの空", "遠くの巨大な山", "赤い砂ぼこり", "渓谷の影"]
  };
  var nebulaCourse = {
    id: "nebula-drift-stream",
    name: "Ice Comet Road",
    shortName: "Ice Comet",
    jaName: "こおりのすい星ロード",
    kindLabel: "氷コース",
    icon: "氷",
    courseIcon: "氷",
    shortCopy: "下り坂のS字をすべる、氷のコース",
    kidDescription: "青白い氷の上を走る、ドリフトが大事なコース。",
    difficultyLabel: "むずかしい",
    difficultyNote: "大きなS字と下り坂をドリフトで曲がる",
    caution: "曲がる時はドリフトを使おう",
    theme: "氷のすい星の上を走る、結晶と光の尾がきらめくドリフトコース",
    description: "青白い氷の路面、透明な結晶、すい星の尾の光をぬけるコース。よく滑るので、ドリフトを使うと気持ちよく曲がれる。",
    colors: { primary: "#BFF7FF", secondary: "#12375D", accent: "#7DF9FF" },
    palette: { road: "#CFF8FF", roadEmissive: "#8BDDF0", railLeft: "#BFF7FF", railRight: "#7DF9FF", centerLine: "#FFFFFF", shortcut: "#87CDE8", dust: "#B8F2FF", warning: "#EAFBFF", sky: "#06111F", fog: "#0A2038", structure: "#7ECBE5", boost: "#9EEBFF" },
    surfaceType: "comet-ice",
    backgroundType: "ice-comet",
    landmarks: ["氷の結晶", "氷のトンネル", "すい星の尾", "ひびわれた氷", "青白い柱"],
    background: { kind: "ice-comet", sky: "cold-space", horizon: "comet-tail" },
    hazards: ["すべる路面", "氷の柱", "ひびわれた氷", "結晶"],
    gravityFeel: "floaty",
    boostStyle: "few-technical",
    jumpStyle: "comet-tail",
    gripModifier: 0.68,
    visualSignature: "青白い氷、透明な結晶、すい星の尾、すべる道",
    roadFeel: "下り坂・大きなS字・よくすべるドリフト路面",
    features: ["青白い氷", "すべるカーブ", "透明な結晶", "氷のトンネル", "すい星の尾", "ひびわれた道", "ドリフト向き", "きらきら粒子", "ブースト少なめ", "氷の柱"],
    lapCount: 3,
    curveTension: 0.46,
    topology: { route: "comet-s-curves", routeLabel: "下りS字ドリフト", heightLabel: "高低差 とても大きい", cornerLabel: "すべる連続カーブ", bankStrength: 0.95, maxBank: 11, bankLookAhead: 9, climbEffect: 10 },
    sectors: [{ name: "青い氷の入口", tip: "早めに曲がってすべりをおさえよう", challenge: "すべりをおさえる" }, { name: "結晶S字", tip: "ドリフトを左右につなごう", challenge: "ドリフトをつなぐ" }, { name: "すい星テール", tip: "下り坂で最高速をねらおう", challenge: "最高速をキープ" }],
    medalTime: 205,
    backgroundEffects: ["青白いすい星の尾", "氷のきらめき", "透明な結晶", "冷たい光のトンネル"]
  };
  var spaceCourses = [lunarCourse, meteorCourse, spaceCourse, nebulaCourse];

  window.AURORA_GAME_DATA.version = "0.8.4-steer-v51";
  window.AURORA_GAME_DATA.difficulties = {
    Easy: { precision: 0.76, speed: 0.84, reaction: 0.8, maxSpeed: 0.86, acceleration: 0.84, cornerSpeed: 0.7, steeringSkill: 0.78, recoverySpeed: 0.9, boostUsageRate: 0.28, itemUsageSkill: 0.38, mistakeRate: 0.18, avoidanceStrength: 0.72, rubberBanding: 0.05 },
    Normal: { precision: 1.0, speed: 1.0, reaction: 1.0, maxSpeed: 1.02, acceleration: 1.02, cornerSpeed: 0.92, steeringSkill: 1.04, recoverySpeed: 1.14, boostUsageRate: 0.66, itemUsageSkill: 0.66, mistakeRate: 0.07, avoidanceStrength: 1.08, rubberBanding: 0.12 },
    Hard: { precision: 1.34, speed: 1.22, reaction: 1.34, maxSpeed: 1.3, acceleration: 1.28, cornerSpeed: 1.2, steeringSkill: 1.36, recoverySpeed: 1.65, boostUsageRate: 0.96, itemUsageSkill: 0.92, mistakeRate: 0.015, avoidanceStrength: 1.48, rubberBanding: 0.22 }
  };
  window.AURORA_GAME_DATA.selectedTitleId = "starlight-grand-prix";
  window.AURORA_GAME_DATA.selectedTitle = {
    id: "starlight-grand-prix",
    name: "Starlight Grand Prix",
    jaName: "スターライト・グランプリ",
    pitch: "星と惑星のあいだを走る、かっこいい宇宙レース。",
    selected: true
  };
  window.AURORA_GAME_DATA.titleCandidates = [window.AURORA_GAME_DATA.selectedTitle];
  window.AURORA_GAME_DATA.adoptedTitle = "スターライト・グランプリ";
  window.AURORA_GAME_DATA.tagline = "月面、火星、リング惑星、氷のすい星を走る、うちゅうグランプリ。";
  window.AURORA_GAME_DATA.world = {
    id: "starlight-grand-prix-world",
    name: "Starlight Grand Prix",
    jaName: "スターライト・グランプリ",
    genre: "space arcade racing",
    premise: "小型レーシングマシンに乗った宇宙レーサーたちが、惑星のまわりに作られた発光レールでグランプリを走る。",
    toneWords: ["space", "neon", "sharp", "readable", "premium"]
  };
  window.AURORA_GAME_DATA.characters = spaceCharacters;
  window.AURORA_GAME_DATA.karts = spaceMachines;
  window.AURORA_GAME_DATA.courses = spaceCourses;
  window.AURORA_GAME_DATA.course = lunarCourse;
  window.AURORA_GAME_DATA.artStyle = { id: "low-poly-stylized-space-race", shapeRule: "large silhouettes", paletteRule: "three colors per course", performanceRule: "few effects, shared low-poly materials" };
  window.AURORA_GAME_DATA.defaults = {
    characterId: "luna-mimi",
    kartId: "moon-skipper",
    courseId: "lunar-crater-run",
    itemPool: items.map(function (item) { return item.id; })
  };
  window.AURORA_GAME_DATA.uiCopy = {
    selectCharacter: "レーサー選択",
    selectKart: "マシン紹介",
    selectCourse: "コース選択",
    itemLabel: "うちゅうどうぐ"
  };
  window.AURORA_GAME_DATA.artDirection = {
    visualNorthStar: "cool elementary-readable space grand prix",
    palette: {
      main: ["#020512", "#08122A", "#15103A"],
      support: ["#6EE7FF", "#7DF9FF", "#A78BFA"],
      accents: ["#FFD166", "#FF4FD8", "#34F0B2"]
    },
    materialLanguage: ["dark spacecraft metal", "glass helmet", "neon rails", "star dust", "planet glow"],
    qualityRules: [
      "Every racer is paired with one signature space machine.",
      "Selection cards must show racer, machine, specialty, stats, and a short line together.",
      "The course must read as outer space: planet, station, meteors, stars, warp gates, and glowing rails."
    ]
  };

})();
