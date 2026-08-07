(function () {
  "use strict";

  var stateIds = ["home", "fever-check", "risk-result", "recommendation", "payment", "pickup"];
  var app = document.getElementById("app");
  var model = {
    state: "home",
    temperature: "",
    duration: "今天",
    signals: [],
    risk: false,
    riskLevel: "selfcare",
    choice: "kit",
    recStep: "category",
    selectedProduct: null,
    condition: null,
    temperatureUnknown: false,
    woundState: "minor",
    generalType: "pain",
    riskReason: "",
    answers: {},
  };

  var STEP_LABELS = ["情况", "评估", "选择", "支付", "取物"];

  var SINGLE_PRODUCTS = [
    { id: "cooling-patch",    name: "退热贴",            spec: "6 片装",           price: "¥12",  desc: "物理降温，适合低热辅助护理" },
    { id: "thermometer",      name: "电子体温计",         spec: "腋下/口腔两用",      price: "¥35",  desc: "LCD 数显，60 秒快测" },
    { id: "electrolyte",      name: "电解质补充饮料",      spec: "500 ml",           price: "¥8",   desc: "快速补水，发热后恢复体力" },
    { id: "lozenge",          name: "舒缓润喉糖",         spec: "无糖配方",           price: "¥6",   desc: "缓解咽喉干燥不适" },
    { id: "tissue",           name: "柔软纸巾",           spec: "3 包装",            price: "¥5",   desc: "亲肤无香，日常护理备用" },
  ];

  var PRIVATE_PRODUCTS = [
    { id: "hygiene-kit",      name: "卫生护理套装",        spec: "日夜组合装",         price: "¥18",  desc: "基础生理期护理用品" },
    { id: "cleansing-wipes",  name: "私密清洁湿巾",        spec: "20 片装",           price: "¥10",  desc: "无酒精弱酸性配方" },
    { id: "disposable-under", name: "一次性内裤",          spec: "3 条装 / 均码",     price: "¥15",  desc: "纯棉舒适，独立包装" },
  ];

  var CONDITION_CONFIGS = {
    cold: {
      title: "确认呼吸道不适",
      copy: "选择最明显的表现和持续时间。",
      questions: [
        { key: "coldMain", label: "主要不适", options: [["cough", "咳嗽"], ["throat", "咽痛或吞咽不适"], ["nose", "鼻塞、流涕或打喷嚏"], ["mixed", "同时出现多项"]] },
        { key: "coldDuration", label: "持续时间", options: [["today", "今天开始"], ["short", "1–3 天"], ["long", "超过 3 天"]] },
        { label: "需要立即注意的情况", signals: ["呼吸困难或明显胸闷", "持续胸痛或胸部压迫感", "无法正常饮水", "好转后再次明显加重"] },
      ],
    },
    breathing: {
      title: "确认呼吸与胸部状态",
      copy: "呼吸和胸部异常需要更谨慎地判断。",
      questions: [
        { key: "breathingLevel", label: "当前最接近的状态", options: [["mild", "轻微气短，但能正常说话"], ["persistent", "持续胸闷或胸部压迫感"], ["speech", "呼吸费力，难以完整说话"], ["critical", "嘴唇发紫、意识模糊或接近晕厥"]] },
        { key: "breathingOnset", label: "出现方式", options: [["sudden", "突然出现"], ["gradual", "逐渐加重"], ["exercise", "活动后出现"], ["unclear", "无法判断"]] },
      ],
    },
    wound: {
      title: "确认受伤情况",
      copy: "根据受伤类型和当前状态选择。",
      questions: [
        { key: "injuryType", label: "受伤类型", options: [["cut", "割伤或擦伤"], ["sprain", "扭伤或撞伤"], ["burn", "烫伤或轻微烧伤"], ["other", "其他外伤"]] },
        { key: "woundState", label: "当前状态", options: [["minor", "表浅伤口，出血已经止住"], ["ongoing", "按压后仍持续出血"], ["deep", "伤口较深或有异物嵌入"], ["limited", "肿胀明显或无法正常活动"]] },
        { label: "需要立即注意的情况", signals: ["大量出血或伤口喷射性出血", "意识改变、皮肤苍白湿冷", "严重变形或完全无法承重"] },
      ],
    },
    pain: {
      title: "确认疼痛情况",
      copy: "先明确疼痛部位，再判断程度。",
      questions: [
        { key: "painLocation", label: "主要疼痛部位", options: [["head", "头部"], ["muscle", "肌肉或全身"], ["joint", "关节或四肢"], ["other", "其他部位"]] },
        { key: "painLevel", label: "疼痛程度", options: [["mild", "轻微，不影响活动"], ["moderate", "明显，影响学习或休息"], ["severe", "剧烈或持续加重"]] },
        { label: "需要立即注意的情况", signals: ["突然出现的剧烈头痛", "伴随肢体无力、麻木或说话困难", "外伤后出现头晕、呕吐或意识异常", "发热同时伴有颈部僵硬"] },
      ],
    },
    stomach: {
      title: "确认肠胃不适",
      copy: "选择主要表现，并确认能否正常补充水分。",
      questions: [
        { key: "stomachMain", label: "主要不适", options: [["pain", "腹痛或腹胀"], ["nausea", "恶心或呕吐"], ["diarrhea", "腹泻"], ["mixed", "同时出现多项"]] },
        { key: "hydration", label: "饮水情况", options: [["normal", "能够正常饮水"], ["limited", "饮水后容易恶心"], ["none", "无法饮水或持续呕吐"]] },
        { label: "需要立即注意的情况", signals: ["持续或突然出现的剧烈腹痛", "呕吐物或排泄物中有血", "长时间没有排尿或明显口干头晕", "意识模糊或接近晕厥"] },
      ],
    },
    allergy: {
      title: "确认皮肤与过敏状态",
      copy: "区分局部皮肤不适和可能的严重过敏反应。",
      questions: [
        { key: "allergyMain", label: "主要表现", options: [["itch", "局部瘙痒或红疹"], ["wide", "多处或大面积皮疹"], ["swelling", "局部肿胀"], ["unknown", "无法判断原因"]] },
        { key: "allergyOnset", label: "出现方式", options: [["sudden", "短时间内突然出现"], ["gradual", "逐渐出现"], ["contact", "接触某种物品后出现"], ["unclear", "无法判断"]] },
        { label: "需要立即注意的情况", signals: ["面部、嘴唇或舌头肿胀", "呼吸困难、喘鸣或喉咙发紧", "头晕、虚弱或接近晕厥"] },
      ],
    },
    eye: {
      title: "确认眼部或其他异常",
      copy: "眼部异常可能需要线下检查，无法判断时也可继续。",
      questions: [
        { key: "eyeMain", label: "当前最接近的情况", options: [["itch", "眼红、发痒或分泌物增多"], ["foreign", "异物感或轻微刺激"], ["pain", "明显眼痛或畏光"], ["unclear", "不是眼部问题，仍无法判断"]] },
        { key: "visionState", label: "视力是否变化", options: [["normal", "视力没有明显变化"], ["blur", "出现持续模糊"], ["sudden", "视力突然下降或部分看不见"], ["unknown", "无法判断"]] },
        { label: "需要立即注意的情况", signals: ["化学液体进入眼睛", "尖锐物刺入或眼部受到重击", "突然视力变化并伴随剧烈眼痛"] },
      ],
    },
  };

  var TAILORED_RECOMMENDATIONS = {
    temperature: [
      { id: "thermometer", name: "电子体温计", spec: "60 秒快测", price: "¥35", desc: "用于继续观察体温变化", delivery: "single" },
      { id: "cooling-patch", name: "退热贴", spec: "6 片装", price: "¥12", desc: "基础物理降温护理用品", delivery: "single" },
      { id: "electrolyte", name: "电解质补充饮料", spec: "500 ml", price: "¥8", desc: "补充水分与电解质", delivery: "single" },
      { id: "night-kit", name: "夜间护理包", spec: "预装场景包", price: "¥28", desc: "夜间基础护理组合", delivery: "kit" },
    ],
    cold: [
      { id: "lozenge", name: "舒缓润喉糖", spec: "无糖配方", price: "¥6", desc: "用于咽喉干燥和轻微不适", delivery: "single" },
      { id: "mask", name: "医用口罩", spec: "5 只装", price: "¥5", desc: "减少飞沫传播并保护周围同学", delivery: "single" },
      { id: "saline-spray", name: "生理盐水鼻腔喷雾", spec: "便携装", price: "¥16", desc: "用于鼻腔清洁和基础护理", delivery: "single" },
      { id: "night-kit", name: "夜间护理包", spec: "预装场景包", price: "¥28", desc: "夜间基础护理组合", delivery: "kit" },
    ],
    breathing: [
      { id: "mask", name: "医用口罩", spec: "5 只装", price: "¥5", desc: "仅作为基础防护用品", delivery: "single" },
      { id: "electrolyte", name: "电解质补充饮料", spec: "500 ml", price: "¥8", desc: "可在能够正常饮水时补充水分", delivery: "single" },
    ],
    wound: [
      { id: "first-aid-kit", name: "急救护理包", spec: "预装急救包", price: "¥35", desc: "包含基础清洁、包扎和防护用品", delivery: "kit" },
      { id: "bandage", name: "无菌创可贴", spec: "10 片装", price: "¥8", desc: "用于小面积表浅伤口覆盖", delivery: "single" },
      { id: "disinfectant", name: "消毒湿巾", spec: "独立包装", price: "¥6", desc: "用于伤口周边基础清洁", delivery: "single" },
      { id: "cold-pack", name: "即时冷敷袋", spec: "一次性", price: "¥12", desc: "用于轻微撞伤或扭伤冷敷", delivery: "single" },
    ],
    pain: [
      { id: "cold-hot-pack", name: "冷热敷袋", spec: "重复使用", price: "¥18", desc: "根据用品说明进行局部冷敷或热敷", delivery: "single" },
      { id: "pain-relief", name: "非处方止痛用品", spec: "按标签选购", price: "¥15", desc: "购买前请查看禁忌和用法", delivery: "single" },
      { id: "night-kit", name: "夜间护理包", spec: "预装场景包", price: "¥28", desc: "夜间基础护理组合", delivery: "kit" },
    ],
    stomach: [
      { id: "oral-rehydration", name: "口服补液盐", spec: "独立袋装", price: "¥12", desc: "按包装说明冲调使用", delivery: "single" },
      { id: "electrolyte", name: "电解质补充饮料", spec: "500 ml", price: "¥8", desc: "在能够饮水时补充水分", delivery: "single" },
      { id: "thermometer", name: "电子体温计", spec: "60 秒快测", price: "¥35", desc: "用于同步观察体温变化", delivery: "single" },
    ],
    allergy: [
      { id: "mask", name: "医用口罩", spec: "5 只装", price: "¥5", desc: "用于减少继续接触空气中的刺激物", delivery: "single" },
      { id: "cold-pack", name: "即时冷敷袋", spec: "一次性", price: "¥12", desc: "用于局部皮肤基础冷敷", delivery: "single" },
      { id: "allergy-care", name: "过敏基础护理包", spec: "组合装", price: "¥24", desc: "包含口罩、无香湿巾和冷敷用品", delivery: "kit" },
    ],
    eye: [
      { id: "eye-wash", name: "无菌洗眼液", spec: "单次装", price: "¥15", desc: "用于轻微异物感时的基础冲洗", delivery: "single" },
      { id: "sterile-gauze", name: "无菌纱布", spec: "独立包装", price: "¥6", desc: "用于眼周基础防护，不直接擦拭眼球", delivery: "single" },
    ],
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function timeString() {
    var now = new Date();
    return ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
  }

  function header() {
    return '<header class="screen-header"><span class="brand">NightCare</span><span class="device-status"><i></i>设备在线</span><span class="status-time">' + timeString() + '</span><button class="home-button" type="button" data-action="home" aria-label="返回首页" title="返回首页">⌂</button></header>';
  }

  function progress(step) {
    return '<div class="flow-progress" aria-label="流程进度">' + STEP_LABELS.map(function (label, i) {
      var state = i < step - 1 ? " is-complete" : (i === step - 1 ? " is-current" : "");
      return '<div class="step' + state + '"><div class="step-dot">' + (i + 1) + '</div><div class="step-bar"></div><span class="step-label">' + label + '</span></div>';
    }).join("") + "</div>";
  }

  function homeView() {
    return '<section class="view">' + header() +
      '<div class="view-body home-body"><div class="home-intro"><p class="eyebrow">24 小时服务可用</p><h1 data-view-title tabindex="-1">校园夜间健康支持</h1>' +
      '<p class="intro">购买非处方护理用品，或根据当前不适逐步查看可用支持。</p></div>' +
      '<div class="home-routes">' +
      '<button class="route-button route-purchase" type="button" data-action="purchase"><span class="route-index">01</span><span class="route-copy"><strong>直接购买</strong><small>已经明确所需用品时使用</small></span><b>→</b></button>' +
      '<button class="route-button route-help" type="button" data-action="help"><span class="route-index">02</span><span class="route-copy"><strong>病情筛查</strong><small>根据当前不适逐步选择</small></span><b>→</b></button>' +
      '</div><div class="terminal-boundary"><span>紧急情况请直接联系校园急救或 120</span><span>本终端不提供诊断</span></div></div></section>';
  }

  function conditionSelectView() {
    var conditions = [
      { id: "temperature", index: "01", title: "发热、发冷或乏力", detail: "体温异常、寒战、明显疲惫" },
      { id: "cold", index: "02", title: "咳嗽、咽痛或鼻塞", detail: "常见呼吸道不适" },
      { id: "breathing", index: "03", title: "呼吸困难或胸闷", detail: "气短、胸部压迫感" },
      { id: "wound", index: "04", title: "伤口、出血或扭伤", detail: "割伤、擦伤、撞伤" },
      { id: "pain", index: "05", title: "头痛或身体疼痛", detail: "头部、肌肉、关节疼痛" },
      { id: "stomach", index: "06", title: "腹痛、呕吐或腹泻", detail: "恶心、腹胀、肠胃异常" },
      { id: "allergy", index: "07", title: "皮疹、瘙痒或过敏", detail: "红疹、肿胀、过敏反应" },
      { id: "eye", index: "08", title: "眼部不适或无法判断", detail: "眼红、异物感、其他异常" },
    ];
    return '<section class="view">' + header() + '<div class="view-body condition-body">' + progress(1) +
      '<p class="screen-step">步骤 01 / 05</p><h2 data-view-title tabindex="-1">选择当前最明显的情况</h2>' +
      '<p class="supporting-text">只选择最接近的一项，后续问题会随选择变化。</p>' +
      '<div class="condition-list">' + conditions.map(function (item) {
        return '<button class="condition-button" type="button" data-condition="' + item.id + '"><span>' + item.index + '</span><span><strong>' + item.title + '</strong><small>' + item.detail + '</small></span><b>→</b></button>';
      }).join("") + '</div><p class="condition-boundary">呼吸困难、意识异常或大量出血时，请直接寻求紧急专业支持。</p></div></section>';
  }

  function branchHeader(title, copy) {
    return '<p class="product-back"><button class="back-link" type="button" data-action="back-to-conditions">‹ 重新选择情况</button></p>' +
      '<div class="screen-title-row"><div><p class="screen-step">步骤 01 / 05</p><h2 data-view-title tabindex="-1">' + title + '</h2></div><span class="time-estimate">约 1 分钟</span></div>' +
      '<p class="supporting-text">' + copy + '</p>';
  }

  function temperatureBranchView() {
    return '<section class="view">' + header() + '<div class="view-body screening-body">' + progress(1) +
      branchHeader("确认体温相关情况", "能测量时填写体温；没有体温计也可以继续。") +
      '<div class="form-stack"><div class="form-section temperature-section"><div class="section-label"><span>01</span><label class="field-label" for="temperature">当前体温</label></div>' +
      '<div class="temperature-row"><input class="temperature-input" id="temperature" type="number" min="30" max="45" step="0.1" inputmode="decimal" value="' + escapeHtml(model.temperature) + '" placeholder="38.5" aria-label="体温，摄氏度" ' + (model.temperatureUnknown ? "disabled" : "") + '/><span class="unit">°C</span><button class="unknown-button" type="button" data-temp-unknown aria-pressed="' + model.temperatureUnknown + '">尚未测量</button></div></div>' +
      '<div class="form-section"><div class="section-label"><span>02</span><span class="field-label">异常持续时间</span></div><div class="option-row" role="group" aria-label="异常持续时间">' +
      ["今天", "1-3 天", "超过 3 天"].map(function (label) { return '<button class="option-button" type="button" data-duration="' + label + '" aria-pressed="' + (model.duration === label) + '">' + label + '</button>'; }).join("") + '</div></div>' +
      '<div class="form-section danger-section"><div class="section-label"><span>03</span><span class="field-label">同时出现的危险信号</span></div><div class="signal-list">' +
      ["呼吸困难", "胸部或腹部持续疼痛 / 压迫感", "意识混乱或难以唤醒", "抽搐，或无法排尿"].map(function (label) {
        return '<button class="signal-button" type="button" data-signal="' + escapeHtml(label) + '" aria-pressed="' + model.signals.includes(label) + '"><i></i><span>' + label + '</span></button>';
      }).join("") + '</div></div></div><div class="actions"><button class="action-button" type="button" data-action="assess" ' + ((model.temperature || model.temperatureUnknown) ? "" : "disabled") + '>查看下一步</button></div></div></section>';
  }

  function answerQuestion(question, index) {
    var selected = model.answers[question.key] || "";
    if (question.signals) {
      return '<div class="form-section danger-section"><div class="section-label"><span>' + ("0" + index).slice(-2) + '</span><span class="field-label">' + question.label + '</span></div><div class="signal-list">' + question.signals.map(function (label) {
        return '<button class="signal-button" type="button" data-signal="' + escapeHtml(label) + '" aria-pressed="' + model.signals.includes(label) + '"><i></i><span>' + label + '</span></button>';
      }).join("") + '</div></div>';
    }
    return '<div class="form-section"><div class="section-label"><span>' + ("0" + index).slice(-2) + '</span><span class="field-label">' + question.label + '</span></div><div class="branch-options">' + question.options.map(function (option) {
      return '<button class="signal-button" type="button" data-answer-key="' + question.key + '" data-answer-value="' + option[0] + '" aria-pressed="' + (selected === option[0]) + '"><i></i><span>' + option[1] + '</span></button>';
    }).join("") + '</div></div>';
  }

  function branchReady(config) {
    return config.questions.filter(function (question) { return question.key; }).every(function (question) {
      return Boolean(model.answers[question.key]);
    });
  }

  function genericBranchView(conditionId) {
    var config = CONDITION_CONFIGS[conditionId];
    var ready = branchReady(config);
    return '<section class="view">' + header() + '<div class="view-body screening-body">' + progress(1) +
      branchHeader(config.title, config.copy) +
      '<div class="form-stack">' + config.questions.map(function (question, index) { return answerQuestion(question, index + 1); }).join("") + '</div>' +
      '<div class="actions"><button class="action-button" type="button" data-action="assess" ' + (ready ? "" : "disabled") + '>查看下一步</button></div></div></section>';
  }

  function feverCheckView() {
    if (!model.condition) { return conditionSelectView(); }
    if (model.condition === "temperature") { return temperatureBranchView(); }
    return genericBranchView(model.condition);
  }

  function riskResultView() {
    if (model.riskLevel === "urgent") {
      return '<section class="view">' + header() +
        '<div class="view-body risk-body risk-danger">' + progress(2) +
        '<div class="risk-status"><span class="risk-level">需要专业支持</span><div class="result-mark warning" aria-hidden="true">!</div><h2 class="result-title" data-view-title tabindex="-1">请停止自助购买</h2>' +
        '<p class="result-copy">' + escapeHtml(model.riskReason || "你选择了需要立即评估的危险信号。") + ' 系统不会继续提供商品推荐。</p></div>' +
        '<div class="notice"><strong>现在建议这样做</strong><span>联系校园紧急支持、当地紧急医疗服务或前往急诊；如身边有人，请其陪同。</span></div>' +
        '<button class="notice-action" type="button" data-action="restart">返回首页</button></div></section>';
    }
    if (model.riskLevel === "caution") {
      return '<section class="view">' + header() +
        '<div class="view-body risk-body risk-caution">' + progress(2) +
        '<div class="risk-status"><span class="risk-level">建议优先咨询</span><div class="result-mark caution" aria-hidden="true">i</div><h2 class="result-title" data-view-title tabindex="-1">可以继续查看基础用品</h2>' +
        '<p class="result-copy">' + escapeHtml(model.riskReason || "当前情况建议进一步咨询专业人员。") + ' 如情况加重，请停止使用终端并及时就医。</p></div>' +
        '<div class="risk-next"><strong>终端可以继续提供</strong><span>仅显示基础护理和非处方用品，不把商品推荐作为诊断或治疗建议。</span></div>' +
        '<div class="actions"><button class="action-button" type="button" data-action="recommend">查看基础护理用品</button><button class="action-button secondary" type="button" data-action="restart">返回首页</button></div></div></section>';
    }
    return '<section class="view">' + header() +
      '<div class="view-body risk-body risk-safe">' + progress(2) +
      '<div class="risk-status"><span class="risk-level">当前未发现危险信号</span><div class="result-mark" aria-hidden="true">✓</div><h2 class="result-title" data-view-title tabindex="-1">可先进行基础护理</h2>' +
      '<p class="result-copy">继续观察症状变化。这不是诊断结论，如情况加重请及时寻求专业支持。</p></div>' +
      '<div class="risk-next"><strong>下一步</strong><span>根据当前情况查看适合的非处方支持用品。</span></div>' +
      '<div class="actions"><button class="action-button" type="button" data-action="recommend">查看支持方案</button><button class="action-button secondary" type="button" data-action="restart">重新开始</button></div></div></section>';
  }

  function productCardHtml(product) {
    return '<button class="product-card" type="button" data-product-id="' + product.id + '" data-product-name="' + escapeHtml(product.name) + '" data-delivery="' + (product.delivery || model.choice) + '">' +
      '<span class="product-meta"><span class="product-name">' + product.name + '</span><span class="product-spec">' + product.spec + '</span></span>' +
      '<span class="product-price">' + product.price + '</span>' +
      '<span class="product-desc">' + product.desc + '</span>' +
      '<span class="product-arrow">›</span></button>';
  }

  function productListView() {
    var products = model.choice === "private" ? PRIVATE_PRODUCTS : SINGLE_PRODUCTS;
    var catLabel = model.choice === "private" ? "隐私护理用品" : "一般非处方用品";
    var catColor = model.choice === "private" ? "private" : "single";
    return '<section class="view">' + header() +
      '<div class="view-body">' + progress(3) +
      '<p class="product-back"><button class="back-link" type="button" data-action="back-to-category">‹ 返回选择</button></p>' +
      '<h2 data-view-title tabindex="-1">选择商品</h2>' +
      '<p class="category-badge badge-' + catColor + '">' + catLabel + '</p>' +
      '<div class="product-list">' + products.map(function (p) { return productCardHtml(p); }).join("") + '</div>' +
      '<p class="boundary-note">所有商品均为非处方用品；请按产品标签使用。</p></div></section>';
  }

  function tailoredRecommendationView() {
    var labels = {
      temperature: "发热与体温异常",
      cold: "咳嗽、咽痛或鼻塞",
      breathing: "轻度呼吸或胸部不适",
      wound: "表浅伤口或轻微扭伤",
      pain: "轻度头痛或身体疼痛",
      stomach: "轻度肠胃不适",
      allergy: "局部皮肤或过敏不适",
      eye: "轻微眼部不适",
    };
    var products = TAILORED_RECOMMENDATIONS[model.condition] || [];
    return '<section class="view">' + header() + '<div class="view-body tailored-body">' + progress(3) +
      '<p class="screen-step">根据筛查结果</p><h2 data-view-title tabindex="-1">对应用品与护理包</h2>' +
      '<p class="supporting-text">当前情况：' + escapeHtml(labels[model.condition] || "基础护理") + '。以下内容不代替诊断，请按商品标签使用。</p>' +
      '<div class="product-list tailored-list">' + products.map(function (product) { return productCardHtml(product); }).join("") + '</div>' +
      '<p class="boundary-note">情况加重或出现危险信号时，请停止购买并及时寻求专业支持。</p></div></section>';
  }

  function recommendationView() {
    if (model.recStep === "tailored" && model.condition) {
      return tailoredRecommendationView();
    }
    if (model.recStep === "products") {
      return productListView();
    }
    return '<section class="view">' + header() +
      '<div class="view-body">' + progress(3) +
      '<h2 data-view-title tabindex="-1">选择夜间支持用品</h2><p class="supporting-text">仅提供非处方用品；请按产品标签使用。</p>' +
      '<div class="choice-list">' +
      '<button class="choice-card" type="button" data-choice="single">' +
        '<span class="choice-card-icon icon-single"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg></span>' +
        '<span class="choice-card-text"><span class="choice-card-title">单品购买</span><span class="choice-card-detail">退热贴、体温计、电解质饮料等一般非处方用品</span></span>' +
      '</button>' +
      '<button class="choice-card" type="button" data-choice="private">' +
        '<span class="choice-card-icon icon-private"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/><circle cx="12" cy="16" r="1"/></svg></span>' +
        '<span class="choice-card-text"><span class="choice-card-title">隐私护理单品</span><span class="choice-card-detail">由 Private Pickup 私密区域交付</span></span>' +
      '</button>' +
      '<button class="choice-card" type="button" data-choice="kit">' +
        '<span class="choice-card-icon icon-kit"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16"/><line x1="9" y1="3" x2="9" y2="9"/><circle cx="12" cy="15" r="2.5"/></svg></span>' +
        '<span class="choice-card-text"><span class="choice-card-title">夜间护理包</span><span class="choice-card-detail">夜间基础护理预装场景包，含组合用品</span></span>' +
      '</button></div>' +
      '<p class="boundary-note">本原型不提供处方药，亦不承诺治疗结果。</p></div></section>';
  }

  function qrCells() {
    var cells = "";
    for (var index = 0; index < 225; index += 1) {
      var row = Math.floor(index / 15);
      var column = index % 15;
      var inCorner = (row < 4 && column < 4) || (row < 4 && column > 10) || (row > 10 && column < 4);
      var edge = inCorner && (row % 3 === 0 || column % 3 === 0 || row === 3 || column === 3 || row === 11 || column === 11);
      var fill = edge || (!inCorner && ((index * 17 + row * 11 + column * 7) % 5 < 2));
      cells += fill ? "<i></i>" : "<b></b>";
    }
    return cells;
  }

  function paymentView() {
    var productName = model.selectedProduct ? model.selectedProduct : "";
    return '<section class="view">' + header() +
      '<div class="view-body">' + progress(4) +
      '<h2 data-view-title tabindex="-1">完成付款</h2>' +
      (productName ? '<p class="supporting-text">已选：' + escapeHtml(productName) + '</p>' : '<p class="supporting-text">请扫描屏幕二维码付款。</p>') +
      '<div class="payment-layout"><div class="qr-frame" role="img" aria-label="二维码付款入口"><div class="qr">' + qrCells() + '</div></div>' +
      '<p class="payment-copy"><strong>二维码付款入口</strong></p>' +
      '<p class="nfc-hint">也可使用屏幕下方实体 NFC / 校园卡读卡器</p></div>' +
      '<div class="actions"><button class="action-button" type="button" data-action="paid">已完成付款</button></div></div></section>';
  }

  function pickupView() {
    var isKit = model.choice === "kit";
    var productName = model.selectedProduct || "";
    var pickupInfo = {
      single:   { zone: "private", title: "请从 Private Pickup 取物",   heading: productName || "单品",             copy: "请前往 Private Pickup 区，使用取物码领取商品。" },
      private:  { zone: "private", title: "请从 Private Pickup 取物",   heading: productName || "隐私护理单品",       copy: "请前往 Private Pickup 区，使用取物码私密领取商品。" },
      kit:      { zone: "kit",     title: "对应柜门已开启",              heading: productName || "夜间护理包",  copy: "请取走 " + (productName || "护理包") + "，并在取物后关闭柜门。" },
    }[model.choice];

    var graphic = "";
    if (isKit) {
      graphic = '<p class="pickup-zone-label">场景包柜门</p><div class="pickup-kit-door is-open">' + escapeHtml(productName || "护理包") + '<br>柜门已开启</div>';
    } else {
      graphic = '<p class="pickup-zone-label">Private Pickup</p><div class="pickup-lockers">' +
        Array.from({ length: 4 }, function (_, i) {
          return '<div class="pickup-locker' + (i === 1 ? ' is-open' : '') + '"></div>';
        }).join("") + "</div>";
    }

    return '<section class="view">' + header() +
      '<div class="view-body">' + progress(5) +
      '<div class="pickup-graphic" aria-hidden="true">' + graphic + '</div>' +
      '<p class="pickup-name">' + pickupInfo.title + '</p><h2 data-view-title tabindex="-1">' + pickupInfo.heading + '</h2><p class="result-copy">' + pickupInfo.copy + '</p>' +
      '<div class="actions restart"><button class="action-button" type="button" data-action="restart">返回首页</button></div></div></section>';
  }

  function focusAfterRender(focusRequest) {
    window.requestAnimationFrame(function () {
      var target;
      if (focusRequest && focusRequest.type === "duration") {
        target = Array.from(app.querySelectorAll("[data-duration]")).find(function (b) {
          return b.dataset.duration === focusRequest.value;
        });
      } else {
        target = app.querySelector("[data-view-title]");
      }
      if (target) { target.focus({ preventScroll: true }); }
    });
  }

  function render(focusRequest) {
    var views = { home: homeView, "fever-check": feverCheckView, "risk-result": riskResultView, recommendation: recommendationView, payment: paymentView, pickup: pickupView };
    app.innerHTML = views[model.state]();
    app.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () { handleAction(button.dataset.action); });
    });
    app.querySelectorAll("[data-duration]").forEach(function (button) {
      button.addEventListener("click", function () {
        model.duration = button.dataset.duration;
        render({ type: "duration", value: button.dataset.duration });
      });
    });
    app.querySelectorAll("[data-signal]").forEach(function (button) {
      button.addEventListener("click", function () {
        var signal = button.dataset.signal;
        if (model.signals.includes(signal)) {
          model.signals = model.signals.filter(function (item) { return item !== signal; });
        } else {
          model.signals = model.signals.concat(signal);
        }
        button.setAttribute("aria-pressed", model.signals.includes(signal));
      });
    });
    app.querySelectorAll("[data-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        model.choice = button.dataset.choice;
        if (model.choice === "kit") {
          model.selectedProduct = "夜间护理包";
          model.recStep = "category";
          goTo("payment");
        } else {
          model.recStep = "products";
          model.selectedProduct = null;
          render();
        }
      });
    });
    app.querySelectorAll("[data-condition]").forEach(function (button) {
      button.addEventListener("click", function () {
        model.condition = button.dataset.condition;
        model.signals = [];
        model.answers = {};
        render();
      });
    });
    app.querySelectorAll("[data-answer-key]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.dataset.answerKey;
        model.answers[key] = button.dataset.answerValue;
        app.querySelectorAll('[data-answer-key="' + key + '"]').forEach(function (item) {
          item.setAttribute("aria-pressed", item === button);
        });
        var assessButton = app.querySelector('[data-action="assess"]');
        if (assessButton && CONDITION_CONFIGS[model.condition]) {
          assessButton.disabled = !branchReady(CONDITION_CONFIGS[model.condition]);
        }
      });
    });
    var unknownButton = app.querySelector("[data-temp-unknown]");
    if (unknownButton) {
      unknownButton.addEventListener("click", function () {
        model.temperatureUnknown = !model.temperatureUnknown;
        if (model.temperatureUnknown) { model.temperature = ""; }
        render();
      });
    }
    app.querySelectorAll("[data-product-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        model.selectedProduct = button.dataset.productName;
        model.choice = button.dataset.delivery || model.choice;
        model.recStep = "category";
        goTo("payment");
      });
    });
    var temperature = app.querySelector("#temperature");
    if (temperature) {
      temperature.addEventListener("input", function () {
        model.temperature = temperature.value;
        var assessButton = app.querySelector('[data-action="assess"]');
        if (assessButton) { assessButton.disabled = !(model.temperature || model.temperatureUnknown); }
      });
    }
    focusAfterRender(focusRequest);
  }

  function assessCurrentCondition() {
    var answers = model.answers;
    model.riskLevel = model.signals.length > 0 ? "urgent" : "selfcare";
    model.riskReason = model.riskLevel === "urgent" ? "当前选择中包含需要尽快由专业人员评估的危险信号。" : "";
    if (model.riskLevel === "urgent") {
      model.risk = true;
      return;
    }

    if (model.condition === "breathing") {
      if (["persistent", "speech", "critical"].includes(answers.breathingLevel)) {
        model.riskLevel = "urgent";
        model.riskReason = "持续胸闷、胸部压迫感、呼吸费力或意识异常需要立即寻求专业支持。";
      } else {
        model.riskLevel = "caution";
        model.riskReason = "已经出现呼吸或胸部不适，建议尽快联系专业人员进一步评估。";
      }
    } else if (model.condition === "wound" && answers.woundState === "ongoing") {
      model.riskLevel = "urgent";
      model.riskReason = "按压后仍持续出血，需要尽快由专业人员处理。";
    } else if (model.condition === "wound" && ["deep", "limited"].includes(answers.woundState)) {
      model.riskLevel = "caution";
      model.riskReason = "较深伤口、异物嵌入或明显活动受限建议接受专业处理。";
    } else if (model.condition === "pain" && answers.painLevel === "severe") {
      model.riskLevel = "caution";
      model.riskReason = "剧烈或持续加重的疼痛建议尽快接受专业评估。";
    } else if (model.condition === "stomach" && answers.hydration === "none") {
      model.riskLevel = "caution";
      model.riskReason = "无法饮水或持续呕吐可能导致脱水，建议尽快寻求专业支持。";
    } else if (model.condition === "eye" && answers.visionState === "sudden") {
      model.riskLevel = "urgent";
      model.riskReason = "视力突然下降或部分看不见，需要立即进行专业眼科评估。";
    } else if (model.condition === "eye" && answers.visionState === "blur") {
      model.riskLevel = "caution";
      model.riskReason = "持续视物模糊建议尽快进行专业眼科评估。";
    }
    model.risk = model.riskLevel === "urgent";
  }

  function handleAction(action) {
    if (action === "home" || action === "restart") { reset(); return; }
    if (action === "help") { goTo("fever-check"); return; }
    if (action === "purchase") { model.choice = "single"; model.recStep = "products"; model.selectedProduct = null; goTo("recommendation"); return; }
    if (action === "assess") {
      assessCurrentCondition();
      goTo("risk-result"); return;
    }
    if (action === "recommend") { model.recStep = model.condition ? "tailored" : "category"; goTo("recommendation"); return; }
    if (action === "paid") {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: "nightcare:purchase-complete",
          productId: String(model.selectedProduct || "night-relief-kit").toLowerCase().replace(/\s+/g, "-"),
          productName: model.selectedProduct || "夜间护理包",
          delivery: model.choice || "kit"
        }, window.location.origin);
      }
      goTo("pickup");
    }
    if (action === "back-to-category") { model.recStep = "category"; render(); }
    if (action === "back-to-conditions") { model.condition = null; model.signals = []; model.answers = {}; render(); }
  }

  function goTo(stateId) {
    if (!stateIds.includes(stateId)) { throw new Error("Unknown NightCare state: " + stateId); }
    model.state = stateId;
    render();
  }

  function getState() { return model.state; }

  function reset() {
    model.state = "home";
    model.temperature = "";
    model.duration = "今天";
    model.signals = [];
    model.risk = false;
    model.riskLevel = "selfcare";
    model.choice = "kit";
    model.recStep = "category";
    model.selectedProduct = null;
    model.condition = null;
    model.temperatureUnknown = false;
    model.woundState = "minor";
    model.generalType = "pain";
    model.riskReason = "";
    model.answers = {};
    render();
  }

  window.NightCarePrototype = { goTo: goTo, getState: getState, reset: reset };
  var initialState = new URLSearchParams(window.location.search).get("state");
  if (stateIds.includes(initialState)) { model.state = initialState; }
  render();
}());
