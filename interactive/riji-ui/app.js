const ASSET = './assets/';
const rain = `${ASSET}family-rainy-day.webp`;
const product = `${ASSET}product-hero.webp`;
const nfcProduct = `${ASSET}product-nfc.webp`;

const shareOptions = [
  {id:'rain',title:'雨天放学',date:'8月8日',time:'18:20',sender:'小雨',message:'姥爷，今天学校下雨了。您晚上出去散步记得带伞，路上慢一点。',imageKind:'rain'},
  {id:'cake',title:'第一次做蛋糕',date:'8月8日',time:'14:05',sender:'小雨',message:'姥爷，今天第一次自己做蛋糕，虽然有点歪，但是很好吃。',imageKind:'family'},
  {id:'flower',title:'院子里的花',date:'8月8日',time:'09:30',sender:'舅舅',message:'爸，您以前种的花今年也开了，等天气好拍给您看。',imageKind:'bike'},
  {id:'dinner',title:'晚饭吃面',date:'8月7日',time:'19:10',sender:'妈妈',message:'爸，今天家里吃面，又想起您做的炸酱面了。',imageKind:'family'},
  {id:'cloud',title:'给您看朵云',date:'8月7日',time:'08:40',sender:'小雨',message:'姥爷，放学路上看到一朵像小狗的云，拍给您看看。',imageKind:'bike'},
  {id:'cat',title:'家里的猫',date:'8月6日',time:'17:25',sender:'小雨',message:'姥爷，小猫今天又睡在窗边，醒来以后一直找您。',imageKind:'rain'}
];

const mobileRoutes = [
  ['初次设置','welcome','欢迎使用日迹','了解产品并开始建立家庭空间。','先讲价值，不先讲技术。'],
  ['初次设置','create-family','建立家庭空间','创建一个以姥爷为中心的家庭空间。','一次只做一件事。'],
  ['初次设置','elder-name','老人信息','确认老人称呼和家庭关系。','使用熟悉的家庭称谓。'],
  ['初次设置','bind-device','绑定老人终端','扫码绑定家中的日迹终端。','技术步骤集中在家人端。'],
  ['初次设置','invite-family','邀请家人','邀请其他家人一起分享。','共同参与，不增加老人负担。'],
  ['初次设置','permissions','权限设置','开启照片、麦克风和通知权限。','说明用途后再请求权限。'],
  ['初次设置','first-share','第一次分享','完成第一次家庭日常分享。','用真实任务完成教学。'],
  ['家庭日历','mobile-home','家庭日历','查看今天家人分享的内容。','日期优先，内容直接可见。'],
  ['家庭日历','mobile-calendar','按日期查看','在日历中找到有分享的日子。','内容状态一眼可见。'],
  ['家庭日历','mobile-day','8月7日','查看某一天的全部分享。','同一天内容集中呈现。'],
  ['家庭日历','mobile-detail','雨天放学','查看照片、留言、语音和打印状态。','照片优先，信息不分散。'],
  ['家庭日历','mobile-filter','筛选记录','按家人或内容类型筛选。','筛选可撤销，结果可预期。'],
  ['家庭日历','mobile-empty','这一天还没有分享','理解空白日期并快速发一条。','空状态给出下一步。'],
  ['发送分享','send-pick','选择照片','从相册选择一张日常照片。','主任务突出，选择状态明确。'],
  ['发送分享','send-crop','调整照片','确认照片展示范围。','仅保留必要编辑。'],
  ['发送分享','send-message','写句话','写一段老人容易读懂的短留言。','文字简短、称呼自然。'],
  ['发送分享','send-voice','录一段声音','录制家人的原声。','操作明确，时长可见。'],
  ['发送分享','send-preview','发送前确认','确认照片、文字、声音和接收者。','发送结果可预期。'],
  ['发送分享','send-progress','正在发送','等待内容到达老人终端。','过程有反馈，不制造焦虑。'],
  ['发送分享','send-success','已经送到姥爷家','确认终端已接收内容。','表达真实到达，而非技术成功。'],
  ['发送分享','send-failed','暂时没有送达','处理网络中断并保留内容。','错误可恢复，内容不丢失。'],
  ['家庭与设备','family-members','家庭成员','管理共同分享的家庭成员。','角色清晰，无社交排行。'],
  ['家庭与设备','family-invite','邀请家人','生成邀请方式。','降低加入家庭空间的门槛。'],
  ['家庭与设备','elder-profile','姥爷的信息','查看老人称呼与终端状态。','老人是家庭空间的中心。'],
  ['家庭与设备','device-home','老人终端','查看连接、相纸和存储情况。','远程处理技术问题。'],
  ['家庭与设备','print-settings','照片打印','设置谁可以指定打印。','默认克制，不打印所有内容。'],
  ['家庭与设备','device-alert','终端提醒','处理相纸不足。','明确原因与解决步骤。'],
  ['家庭与设备','app-settings','设置','管理通知、隐私和家庭空间。','低频设置集中放置。']
].map(([group,id,title,task,principle])=>({group,id,title,task,principle}));

const terminalRoutes = [
  ['日常查看','terminal-home','今天','查看今天家人发来的日常。','今天优先，三条内容即可理解。'],
  ['日常查看','terminal-new','刚刚收到','注意到新到达的一条分享。','温和提示，不要求立即回应。'],
  ['日常查看','terminal-yesterday','昨天','翻到昨天的家庭日常。','前后日期位置固定。'],
  ['日期回顾','terminal-calendar','选择日期','从月份中找到有记录的日子。','日期大、状态明确。'],
  ['日期回顾','terminal-day','8月7日','查看这一天的分享列表。','保持与首页相同结构。'],
  ['内容查看','terminal-detail','雨天放学','看照片和文字。','照片与原声在同一页。'],
  ['内容查看','terminal-audio','正在播放家人的声音','播放或暂停语音。','声音只服务家庭信息。'],
  ['照片打印','print-confirm','直接打印','点击后立即开始打印。','一个动作直接完成。'],
  ['照片打印','printing','照片正在出来','了解打印进度。','持续反馈，不重复操作。'],
  ['照片打印','print-complete','照片已经打印好','从侧面出口取走照片。','清楚告诉老人去哪里拿。'],
  ['留声照片','nfc-success','认出了这张照片','识别实体照片并调取记录。','识别自动完成。'],
  ['留声照片','nfc-play','毕业那天','重听照片关联的原声。','实体与数字内容一一对应。'],
  ['异常状态','terminal-offline','暂时没有连接网络','了解终端离线但内容会保留。','不显示技术错误码。'],
  ['异常状态','terminal-paper','相纸快用完了','通知家人补充相纸。','老人不承担维护责任。'],
  ['设置帮助','terminal-settings','简单设置','调节音量和屏幕亮度。','只开放高频必要设置。'],
  ['设置帮助','terminal-help','怎么使用日迹','查看四个核心动作。','用动作语言代替功能术语。']
].map(([group,id,title,task,principle])=>({group,id,title,task,principle}));

const standaloneSurface = document.body.dataset.standalone || '';
const isEmbedded = new URLSearchParams(location.search).has('embedded');
if(isEmbedded){
  document.body.classList.add('is-embedded');
  const fitEmbeddedDevice=()=>{
    const device=document.querySelector(standaloneSurface==='terminal'?'.standalone-terminal-device':'.standalone-mobile-device');
    if(!device)return;
    const baseWidth=standaloneSurface==='terminal'?920:390;
    const baseHeight=standaloneSurface==='terminal'?690:844;
    const scale=Math.min((innerWidth-20)/baseWidth,(innerHeight-20)/baseHeight,1);
    device.style.width=`${baseWidth}px`;
    device.style.height=`${baseHeight}px`;
    device.style.aspectRatio='auto';
    device.style.transform=`translate(-50%,-50%) scale(${scale})`;
  };
  addEventListener('resize',fitEmbeddedDevice);
  requestAnimationFrame(fitEmbeddedDevice);
}
const state = { surface:standaloneSurface || 'mobile', route:standaloneSurface==='terminal'?'terminal-home':'mobile-home', history:[] };
let elderMonthOffset = 0;
let selectedElderDate = '8月8日 18:20';
let selectedShare = shareOptions[0];
let voiceIncluded = true;
let incomingShare = null;
const $ = s => document.querySelector(s);
const media = (kind='family', alt='家庭日常照片') => `<div class="media media-${kind}"><img src="${kind==='rain'?rain:rain}" alt="${alt}"></div>`;
const wave = () => `<div class="wave" aria-hidden="true">${'<i></i>'.repeat(20)}</div>`;
const status = () => `<div class="mobile-status"><span>9:41</span><span>日迹 · 家庭空间</span></div>`;
const back = () => `<button class="back-button" data-back aria-label="返回上一页">‹ 返回</button>`;
const head = (title, sub='', right='') => `<header class="page-head"><div>${sub?`<p>${sub}</p>`:''}<h2 data-screen-title tabindex="-1">${title}</h2></div>${right}</header>`;
const tabs = active => `<nav class="bottom-tabs" aria-label="主要导航">
  <button class="tab-button ${active==='home'?'is-active':''}" data-route="mobile-home"><i>日</i>家庭日历</button>
  <button class="tab-button send ${active==='send'?'is-active':''}" data-route="send-pick"><i>＋</i>分享</button>
  <button class="tab-button ${active==='family'?'is-active':''}" data-route="family-members"><i>家</i>家庭</button>
</nav>`;
const page = (title,body,{sub='',right='',tab='',flush=false,center=false,backBtn=false}={}) => `<article class="screen-page">${status()}${head(title,sub,backBtn?back():right)}<div class="page-body ${flush?'flush':''} ${center?'center':''}">${body}</div>${tab?tabs(tab):''}</article>`;
const story = (title,text,time='18:20',route='mobile-detail',kind='family') => `<button class="story-row" data-route="${route}">${media(kind,title)}<span class="story-copy"><time>${time}</time><b>${title}</b><span>${text}</span><small class="status-line">老人终端已收到</small></span><span class="round-control" aria-hidden="true">›</span></button>`;

function calendar(big=false){
  const days=['一','二','三','四','五','六','日'];
  let html=days.map(d=>`<span class="weekday">${d}</span>`).join('');
  for(let i=0;i<35;i++){ const n=i<5?'':i-4; if(!n){html+='<span></span>';continue;} const cls=n===8?'today':([2,5,7,12,16,20,24,29].includes(n)?'has-content':''); html+=`<button class="${cls}" data-route="${big?'terminal-day':'mobile-day'}" aria-label="8月${n}日${cls?'，有家庭分享':''}">${n}</button>`; }
  return `<div class="${big?'terminal-calendar':'calendar-grid'}">${html}</div>`;
}

function homeBody(terminal=false){
  if(terminal) return `<div class="terminal-stories">${terminalStory('雨天放学','今天下雨啦，姥爷出门记得带伞。','18:20','terminal-detail','rain')}${terminalStory('第一次做蛋糕','虽然有点歪，但是很好吃。','14:05','terminal-detail','family')}${terminalStory('院子里的花','您以前种的花今年也开了。','09:30','terminal-detail','bike')}</div>`;
  return `<div class="date-hero"><span class="date-number">08</span><span class="date-meta"><b>星期六</b><span>2026年8月</span></span><span class="date-count">今天 3 条</span></div><div class="story-list">${story('雨天放学','今天下雨啦，姥爷出门记得带伞。','18:20','mobile-detail','rain')}${story('第一次做蛋糕','虽然有点歪，但是很好吃。','14:05','mobile-detail','family')}${story('院子里的花','您以前种的花今年也开了。','09:30','mobile-detail','bike')}</div>`;
}
function terminalStory(title,text,time,route,kind='family'){return `<button class="terminal-story" data-route="${route}">${media(kind,title)}<time>${time}</time><span><b>${title}</b><p>${text}</p></span><span class="terminal-control">›</span></button>`;}

function mobileScreen(id){
  const simpleOnboard = {
    'welcome':['把家人的每一天，送到老人身边。','照片、短句和原声会按日期抵达家中终端。','开始建立家庭','create-family','01 / 07'],
    'create-family':['建立一个家庭空间','所有家人围绕同一位老人分享日常。','建立家庭空间','elder-name','02 / 07'],
    'elder-name':['这台日迹，是给谁使用？','请使用家里最熟悉的称呼。','继续','bind-device','03 / 07'],
    'bind-device':['绑定家里的日迹终端','扫描终端背面的绑定码，老人无需操作。','模拟扫码并绑定','invite-family','04 / 07'],
    'invite-family':['一起把日常分享给姥爷','你可以稍后继续邀请家人。','生成家庭邀请','permissions','05 / 07'],
    'permissions':['让分享更顺手','照片用于选择日常，麦克风用于保留家人原声。','允许并继续','first-share','06 / 07'],
    'first-share':['发一条日常给姥爷','不必是大事，一张照片、一句话就够了。','选择第一张照片','send-pick','07 / 07']
  };
  if(simpleOnboard[id]){
    const [title,copy,action,next,step]=simpleOnboard[id];
    let special=id==='bind-device'?'<div class="bind-code"><div class="code-grid" aria-label="终端绑定码示意"></div></div>':'<div class="onboarding-illustration" aria-hidden="true"></div>';
    if(id==='elder-name') special='<div class="field"><label for="elder">家中称呼</label><input id="elder" value="姥爷"></div><div class="choice-list"><button class="choice-button is-selected">祖父 / 外祖父 <span>已选择</span></button><button class="choice-button">父亲</button><button class="choice-button">其他长辈</button></div>';
    if(id==='permissions') special='<div class="permission-row"><span><b>照片</b>选择并分享家庭日常</span><button class="toggle on" aria-label="照片权限已开启"></button></div><div class="permission-row"><span><b>麦克风</b>录制家人的声音</span><button class="toggle on" aria-label="麦克风权限已开启"></button></div><div class="permission-row"><span><b>通知</b>了解内容是否抵达</span><button class="toggle on" aria-label="通知权限已开启"></button></div>';
    return page(title,`<span class="step-count">${step}</span>${special}<p class="lead">${copy}</p><button class="large-action" data-route="${next}">${action}</button>`,{backBtn:id!=='welcome'});
  }
  if(id==='mobile-home') return page('家庭日历',homeBody(),{sub:'姥爷的家庭空间',right:'<button class="text-button" data-route="mobile-calendar">选日期</button>',tab:'home',flush:true});
  if(id==='mobile-calendar') return page('按日期查看',`<div class="month-bar"><button class="back-button" aria-label="上个月">‹</button><h3>2026年8月</h3><button class="back-button" aria-label="下个月">›</button></div>${calendar()}<p>有小圆点的日期，家人留下过照片或声音。</p>`,{backBtn:true});
  if(id==='mobile-day') return page('8月7日',`<div class="date-hero"><span class="date-number">07</span><span class="date-meta"><b>星期五</b><span>一家人的三件小事</span></span><span class="date-count">3 条</span></div><div class="story-list">${story('雨天放学','今天雨好大，校门口全是伞。')}${story('晚饭吃面','想起您做的炸酱面了。','12:15')}${story('给您看朵云','像不像一只小狗？','08:40')}</div>`,{backBtn:true,flush:true});
  if(id==='mobile-detail') return detailMobile(false);
  if(id==='mobile-filter') return page('筛选记录',`<h3>按家人</h3><div class="choice-list"><button class="choice-button is-selected">全部家人 <span>12条</span></button><button class="choice-button">小雨 <span>5条</span></button><button class="choice-button">妈妈 <span>4条</span></button></div><h3 style="margin-top:28px">按内容</h3><div class="choice-list"><button class="choice-button is-selected">照片和声音</button><button class="choice-button">已打印</button></div>`,{backBtn:true});
  if(id==='mobile-empty') return page('8月3日',`<div class="empty-illustration">03</div><h3>这一天还没有分享</h3><p>日常不必特别。把今天看到的一件小事送给姥爷就好。</p><button class="primary-action" data-route="send-pick">分享今天</button>`,{backBtn:true,center:true});
  if(id.startsWith('send-')) return sendScreen(id);
  if(id==='family-members') return page('家庭',`<div class="device-hero"><small>家庭中心</small><h3>姥爷的日迹</h3><span>4 位家人正在分享</span></div>${member('小雨','外孙女 · 管理员')}${member('妈妈','女儿')}${member('舅舅','儿子')}${member('姥爷','老人终端 · 只接收')}</div><div class="action-stack"><button class="primary-action" data-route="family-invite">邀请家人加入</button><button class="ghost-action" data-route="device-home">查看老人终端</button>`,{tab:'family'});
  if(id==='family-invite') return page('邀请家人',`<div class="bind-code"><div class="code-grid"></div></div><h3>扫码加入“姥爷的日迹”</h3><p>新成员可以分享照片、短句和语音，也能查看家庭日期档案。</p><button class="large-action" data-toast="邀请链接已复制">复制邀请链接</button>`,{backBtn:true});
  if(id==='elder-profile') return page('姥爷的信息',`<div class="device-hero"><small>家庭空间中心</small><h3>姥爷</h3><span>日迹终端在线 · 今天收到3条</span></div><div class="setting-row"><span><b>家中称呼</b>姥爷</span><button class="text-button">修改</button></div><div class="setting-row"><span><b>所在时区</b>中国标准时间</span><span>GMT+8</span></div>`,{backBtn:true});
  if(id==='device-home') return page('老人终端',`<div class="device-hero"><small>在线 · 客厅</small><h3>姥爷的日迹终端</h3><span>最后同步：刚刚</span></div><div class="device-stats"><div><b>38 张</b><span>可用相纸</span></div><div><b>正常</b><span>网络连接</span></div><div><b>62%</b><span>照片储存空间</span></div><div><b>中等</b><span>播放音量</span></div></div><div class="action-stack"><button class="ghost-action" data-route="print-settings">照片打印设置</button><button class="ghost-action" data-route="device-alert">查看设备提醒</button></div>`,{backBtn:true});
  if(id==='print-settings') return page('照片打印',`<p>日迹不会自动打印所有内容。重要照片可由家人在手机端指定，或由老人在终端上确认。</p><div class="setting-row"><span><b>允许家人远程指定打印</b>管理员与直系家人</span><button class="toggle on" aria-label="允许远程打印"></button></div><div class="setting-row"><span><b>打印前在终端确认</b>避免误触与浪费</span><button class="toggle on" aria-label="需要终端确认"></button></div>`,{backBtn:true});
  if(id==='device-alert') return page('终端提醒',`<div class="alert-box"><b>相纸快用完了</b><p>预计还可以打印 6 张。姥爷无需处理，请家人补充相纸。</p></div><h3>处理步骤</h3><p>1. 准备日迹专用相纸<br>2. 从机身后部打开相纸仓<br>3. 放入相纸并合上仓盖</p><button class="primary-action" data-toast="已标记为正在处理">我来处理</button>`,{backBtn:true});
  return page('设置',`${setting('新分享通知','已开启')}${setting('送达与打印状态','已开启')}${setting('家庭隐私','仅家庭成员可见')}${setting('家庭空间','姥爷的日迹')}<button class="danger-action" style="margin-top:24px">退出家庭空间</button>`,{backBtn:true});
}

function detailMobile(play){const item=selectedShare;const audio=voiceIncluded?`<div class="audio-panel"><div class="audio-meta"><span>${item.sender}的原声</span><span>00:10</span></div>${wave()}<div class="audio-action"><span>${play?'正在播放':'点击听声音'}</span><button data-toast="${play?'已暂停':`正在播放${item.sender}的声音`}" aria-label="${play?'暂停':'播放'}">${play?'Ⅱ':'▶'}</button></div></div>`:'<div class="audio-panel no-audio" role="status"><b>这次没有添加声音</b><span>照片和留言已经送达</span></div>';return `<article class="screen-page">${status()}<div class="page-body flush"><button class="back-button" data-back style="position:absolute;z-index:3;background:#faf8f2;margin:12px" aria-label="返回">‹</button><div class="detail-image">${media(item.imageKind,`${item.title}的照片`)}</div><div class="detail-content"><span class="detail-date">${item.date} · ${item.time}</span><h2 data-screen-title tabindex="-1">${item.title}</h2><span class="detail-sender">${item.sender}分享给姥爷</span><p class="detail-message">${item.message}</p>${audio}<button class="print-link" data-toast="已向姥爷的终端发出打印建议">建议姥爷打印这张照片</button><p class="status-line">终端已收到 · 尚未打印</p></div></div></article>`;}
function member(name,role){return `<div class="member-row"><span><b>${name}</b>${role}</span><button class="text-button" aria-label="查看${name}">查看</button></div>`;}
function setting(name,value){return `<div class="setting-row"><span><b>${name}</b>${value}</span><button class="text-button" aria-label="设置${name}">›</button></div>`;}

function sendScreen(id){
  if(id==='send-pick') return page('选择一张照片',`<div class="photo-picker">${shareOptions.map(item=>`<button class="${item.id===selectedShare.id?'is-selected':''}" data-share-id="${item.id}" data-route="send-crop" aria-label="选择${item.title}">${media(item.imageKind,item.title)}<span class="photo-picker-label">${item.title}</span></button>`).join('')}</div><p class="helper">选择不同条目，老人终端会收到对应的标题、时间与留言。</p>`,{backBtn:true,flush:true});
  if(id==='send-crop') return page('调整照片',`<div class="crop-area"><div class="media media-${selectedShare.imageKind}">${media(selectedShare.imageKind,`调整中的${selectedShare.title}照片`)}<span class="crop-lines"></span></div></div><p>当前选择：${selectedShare.title}。拖动照片，保留最想让姥爷看到的部分。</p><button class="large-action" data-route="send-message">下一步</button>`,{backBtn:true,flush:true});
  if(id==='send-message') return page('写句话',`<div class="field"><label for="message">给姥爷的留言</label><textarea id="message">${selectedShare.message}</textarea><span class="helper">留言会与照片一起送到老人终端。</span></div><div class="choice-list"><button class="choice-button is-selected">${selectedShare.title}</button><button class="choice-button">问问姥爷的意见</button></div><button class="large-action" data-route="send-voice" style="margin-top:24px">继续录声音</button>`,{backBtn:true});
  if(id==='send-voice') return page('录一段声音',`<h3>让姥爷听见你的原声</h3><p>声音是可选的。也可以只把照片和留言送过去。</p><button class="record-button" data-toast="录音已完成" aria-label="按下开始录音"></button><div class="record-time">00:10</div>${wave()}<div class="action-stack"><button class="large-action" data-voice-included="true" data-route="send-preview">使用这段录音</button><button class="ghost-action" data-voice-included="false" data-route="send-preview">跳过录音，只发照片</button></div>`,{backBtn:true});
  if(id==='send-preview') return page('发送前确认',`<div class="preview-card">${media(selectedShare.imageKind,`即将发送的${selectedShare.title}照片`)}<h3>${selectedShare.title}</h3><p>${selectedShare.message}</p><div class="share-audio-status ${voiceIncluded?'has-audio':'no-audio'}"><b>${voiceIncluded?'已添加 10 秒声音':'本次未添加声音'}</b><span>${voiceIncluded?'照片、留言和声音将一起送达':'将只发送照片和留言'}</span></div><div class="audio-meta"><span>${selectedShare.date} ${selectedShare.time}</span><span>发送给：姥爷</span></div></div><button class="large-action rust" data-route="send-progress" style="margin-top:22px">发送到姥爷家</button>`,{backBtn:true});
  if(id==='send-progress') return page('正在送到姥爷家',`<img src="${product}" alt="日迹老人终端" style="width:240px;max-height:210px;object-fit:contain"><h3>正在传送${voiceIncluded?'照片和声音':'照片和留言'}</h3><div class="progress-track" role="progressbar" aria-label="发送进度" aria-valuenow="72"><i style="width:72%"></i></div><p>即使暂时退出，内容也不会丢失。</p><button class="primary-action" data-route="send-success">模拟发送完成</button>`,{center:true});
  if(id==='send-success') return page('已经送到姥爷家',`<div class="success-mark">✓</div><h3>“${selectedShare.title}”已经送达</h3><p>这条日常已归档到 ${selectedShare.date}。老人终端与产品屏幕已经同步显示。</p><div class="action-stack"><button class="large-action" data-route="mobile-home">回到家庭日历</button><button class="ghost-action" data-route="mobile-detail">查看这条分享</button></div>`,{center:true});
  return page('暂时没有送达',`<div class="error-mark">!</div><h3>内容已经替你保留</h3><p>可能是老人终端暂时离线。连接恢复后，日迹会自动继续发送。</p><div class="action-stack"><button class="large-action" data-route="send-progress">重新发送</button><button class="ghost-action" data-route="mobile-home">稍后再说</button></div>`,{center:true});
}

function terminalTop(title='日迹',date='8月8日 星期六'){return `<header class="terminal-topbar"><span class="terminal-brand" data-screen-title tabindex="-1">${title}</span><span class="terminal-date">${date}</span></header>`;}
function terminalCard({play=false,nfc=false,older=false,newer=false,picked=false}={}){
  const linked=(!nfc&&!older&&!picked&&incomingShare)?incomingShare:null;
  const hasVoice=linked?linked.voiceIncluded!==false:true;
  const title=linked?.title||(nfc?'毕业那天':older?'晚饭吃面':newer?'院子里的花':'雨天放学');
  const date=linked?`${linked.date} ${linked.time}`:(nfc?'2025年6月20日':older?'8月7日 19:10':newer?'8月8日 19:05':picked?selectedElderDate:'8月8日 18:20');
  const sender=linked?`${linked.sender}发给您`:(nfc?'小雨留给您的声音':older?'妈妈发给您':newer?'舅舅发给您':'小雨发给您');
  const copy=linked?.message||(nfc?'姥爷，这是我大学毕业那天拍的。':older?'爸，今天吃面，想起您做的炸酱了。':newer?'爸，您以前种的花今年也开了。':'姥爷，今天学校下雨了。晚上散步记得带伞。');
  const kind=linked?.imageKind||(older?'family':newer?'bike':'rain');
  return `<article class="elder-card-page">
    <header class="elder-card-head"><button data-route="terminal-calendar" aria-label="选择日期，当前${date}"><span data-screen-title tabindex="-1">${date}</span><i aria-hidden="true">⌄</i></button><b>${sender}</b></header>
    <main class="elder-card-main"><div class="elder-card-photo">${media(kind,`${title}的照片`)}</div><div class="elder-card-copy">${nfc?'<span class="elder-nfc-label">已认出这张照片</span>':''}<h1>${title}</h1><p>${copy}</p>${play&&hasVoice?`<div class="elder-playing"><span>正在播放</span>${wave()}</div>`:`<span class="elder-hint${hasVoice?'':' no-audio'}">${hasVoice?'照片和家人的声音在一起':'这张照片没有声音'}</span>`}</div></main>
    <nav class="elder-fixed-actions" aria-label="固定操作">
      <button data-route="terminal-yesterday"><span>‹</span><b>上一条</b></button>
      <button class="voice${hasVoice?'':' no-audio'}" ${hasVoice?`data-route="${play?'terminal-home':'terminal-audio'}"`:'disabled aria-label="这张照片没有声音"'}><span>${hasVoice?(play?'Ⅱ':'▶'):'—'}</span><b>${hasVoice?(play?'暂停':'听声音'):'没有声音'}</b></button>
      <button class="print" data-route="printing"><span>印</span><b>打印照片</b></button>
      <button data-route="terminal-new"><span>›</span><b>下一条</b></button>
    </nav>
  </article>`;
}

function elderCalendar(){
  const base=new Date(2026,7+elderMonthOffset,1);
  const year=base.getFullYear(), month=base.getMonth(), count=new Date(year,month+1,0).getDate();
  const lead=(base.getDay()+6)%7;
  const contentDays=elderMonthOffset===0?[2,5,7,8,12,16,20,24,29]:elderMonthOffset===-1?[3,14,28]:elderMonthOffset===1?[1,6,18]:[];
  let cells='<span class="weekday">一</span><span class="weekday">二</span><span class="weekday">三</span><span class="weekday">四</span><span class="weekday">五</span><span class="weekday">六</span><span class="weekday">日</span>';
  cells+='<span></span>'.repeat(lead);
  for(let day=1;day<=count;day++){
    const has=contentDays.includes(day), today=elderMonthOffset===0&&day===8;
    cells+=`<button class="${has?'has-content ':''}${today?'today':''}" data-route="terminal-day" data-chosen-date="${month+1}月${day}日" aria-label="${month+1}月${day}日${has?'，有家庭照片':''}">${day}</button>`;
  }
  return `<article class="elder-month-page"><header><button data-month-step="-1" aria-label="上个月">‹</button><h1 data-screen-title tabindex="-1">${year}年${month+1}月</h1><button data-month-step="1" aria-label="下个月">›</button></header><div class="elder-month-grid">${cells}</div><button class="elder-today-button" data-chosen-date="8月8日 18:20" data-route="terminal-home">回到今天</button></article>`;
}

function terminalScreen(id){
  if((id==='terminal-home'||id==='terminal-new')&&!incomingShare) return `<article class="elder-simple-message riji-waiting"><h1 data-screen-title tabindex="-1">等待家人分享</h1><p>手机发送照片后，会自动出现在这里</p><span>收到内容以前暂时不能打印</span></article>`;
  if(id==='terminal-home'||id==='terminal-detail') return terminalCard();
  if(id==='terminal-day') return terminalCard({picked:true});
  if(id==='terminal-new') return terminalCard({newer:true});
  if(id==='terminal-yesterday') return terminalCard({older:true});
  if(id==='terminal-audio') return terminalCard({play:true});
  if(id==='terminal-calendar') return elderCalendar();
  if(id==='print-confirm') return terminalScreen('printing');
  if(id==='printing') return `<article class="elder-print-state" role="status"><div class="elder-print-icon"><span></span></div><h1 data-screen-title tabindex="-1">照片正在出来</h1><p>请稍等</p></article>`;
  if(id==='print-complete') return `<article class="elder-print-state complete"><div class="elder-side-arrow">→</div><h1 data-screen-title tabindex="-1">照片出来了</h1><p>请从右侧拿走照片</p><button class="elder-home-button" data-photo-taken>取走照片</button></article>`;
  if(id==='nfc-success'||id==='nfc-play') return terminalCard({play:id==='nfc-play',nfc:true});
  if(id==='terminal-offline') return `<article class="elder-simple-message"><h1 data-screen-title tabindex="-1">现在没有网络</h1><p>以前的照片还能看</p><span>新照片以后会自己到达</span><button data-route="terminal-home">回到照片</button></article>`;
  if(id==='terminal-paper') return `<article class="elder-simple-message"><h1 data-screen-title tabindex="-1">相纸快用完了</h1><p>已经告诉家人</p><span>您不用处理</span><button data-route="terminal-home">回到照片</button></article>`;
  if(id==='terminal-settings') return `<article class="elder-simple-message"><h1 data-screen-title tabindex="-1">声音大小</h1><p>现在是中等</p><div class="elder-volume"><button aria-label="声音小一点">－</button><button aria-label="声音大一点">＋</button></div><button data-route="terminal-home">回到照片</button></article>`;
  return `<article class="elder-date-page"><h1 data-screen-title tabindex="-1">只要记住四个按钮</h1><div class="elder-help-actions"><span>‹<b>上一条</b></span><span>▶<b>听声音</b></span><span>印<b>打印照片</b></span><span>›<b>下一条</b></span></div><button class="elder-home-button" data-route="terminal-home">我知道了</button></article>`;
}
function dialog(title,copy,left,leftRoute,right,rightRoute){return `<article class="terminal-dialog-page"><div class="terminal-dialog"><h2 data-screen-title tabindex="-1">${title}</h2><p>${copy}</p><div class="button-row"><button class="ghost-action" data-route="${leftRoute}">${left}</button><button class="primary-action" data-route="${rightRoute}">${right}</button></div></div></article>`;}

function routes(){return state.surface==='mobile'?mobileRoutes:terminalRoutes;}
function renderStandalone(){
  const list=routes();
  if(!list.some(r=>r.id===state.route)) state.route=state.surface==='mobile'?'mobile-home':'terminal-home';
  const mobile=$('#mobile-screen'); const terminal=$('#terminal-screen');
  if(mobile) mobile.innerHTML=mobileScreen(state.route);
  if(terminal) terminal.innerHTML=terminalScreen(state.route);
  const url=new URL(location.href);url.searchParams.set('screen',state.route);history.replaceState(null,'',url);
  requestAnimationFrame(()=>document.querySelector('[data-screen-title]')?.focus({preventScroll:true}));
}
function renderNav(){
  const groups={}; routes().forEach((r,i)=>(groups[r.group]??=[]).push([r,i]));
  $('#screen-nav').innerHTML=Object.entries(groups).map(([g,list])=>`<section class="nav-group"><h2>${g}</h2>${list.map(([r,i])=>`<button class="screen-link ${r.id===state.route?'is-active':''}" data-route="${r.id}">${r.title}<small>${String(i+1).padStart(2,'0')}</small></button>`).join('')}</section>`).join('');
}
function render(push=true){
  const list=routes(); let route=list.find(r=>r.id===state.route);
  if(!route){state.route=list[0].id;route=list[0];}
  $('#device-wrap').className=`device-wrap ${state.surface}-mode`;
  $('#mobile-screen').innerHTML=state.surface==='mobile'?mobileScreen(state.route):'';
  $('#terminal-screen').innerHTML=state.surface==='terminal'?terminalScreen(state.route):'';
  $('#stage-section').textContent=state.surface==='mobile'?'家人手机端':'老人终端';
  $('#stage-title').textContent=route.title; $('#task-copy').textContent=route.task; $('#principle-copy').textContent=route.principle;
  $('#screen-count').textContent=`${String(list.indexOf(route)+1).padStart(2,'0')} / ${list.length}`;
  document.querySelectorAll('.surface-button').forEach(b=>{const on=b.dataset.surface===state.surface;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
  renderNav();
  const url=new URL(location.href);url.searchParams.set('surface',state.surface);url.searchParams.set('screen',state.route);history.replaceState(null,'',url);
  requestAnimationFrame(()=>document.querySelector('[data-screen-title]')?.focus({preventScroll:true}));
}
let automaticRouteTimer;
function renderCurrent(){
  clearTimeout(automaticRouteTimer);
  standaloneSurface?renderStandalone():render();
  if(state.surface==='terminal'&&state.route==='printing') automaticRouteTimer=setTimeout(()=>go('print-complete'),2200);
}
function notifyPortfolio(type,detail={}){
  if(window.parent!==window) window.parent.postMessage({type,...detail},window.location.origin);
}
function go(id){
  if(id===state.route)return;
  state.history.push({surface:state.surface,route:state.route});
  state.route=id;
  renderCurrent();
  if(state.surface==='mobile'&&id==='send-success') notifyPortfolio('riji:share-complete',{share:{...selectedShare,voiceIncluded}});
  if(state.surface==='terminal'&&id==='printing'&&incomingShare) notifyPortfolio('riji:print-start',{share:incomingShare});
}
function showToast(copy){const t=$('#toast');t.textContent=copy;t.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.hidden=true,2200);}
function renderOverview(){
  const all=[...mobileRoutes.map(r=>({...r,surface:'mobile'})),...terminalRoutes.map(r=>({...r,surface:'terminal'}))];
  $('#overview-grid').innerHTML=all.map(r=>`<button class="overview-card" data-overview-route="${r.id}" data-surface-target="${r.surface}"><h3>${r.title}</h3><div class="overview-thumb ${r.surface==='terminal'?'terminal-thumb':''}" data-label="${r.title}"></div><p>${r.surface==='mobile'?'家人手机端':'老人终端'} · ${r.group}</p></button>`).join('');
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-photo-taken]')){notifyPortfolio('riji:photo-taken');go('terminal-home');return;}
  const surface=e.target.closest('[data-surface]'); if(surface){state.surface=surface.dataset.surface;state.route=state.surface==='mobile'?'mobile-home':'terminal-home';state.history=[];renderCurrent();return;}
  const monthStep=e.target.closest('[data-month-step]');if(monthStep){elderMonthOffset+=Number(monthStep.dataset.monthStep);elderMonthOffset=Math.max(-6,Math.min(6,elderMonthOffset));renderCurrent();return;}
  const chosen=e.target.closest('[data-chosen-date]');if(chosen){selectedElderDate=chosen.dataset.chosenDate;}
  const selected=e.target.closest('[data-share-id]');if(selected){selectedShare=shareOptions.find(item=>item.id===selected.dataset.shareId)||shareOptions[0];voiceIncluded=true;}
  const voiceChoice=e.target.closest('[data-voice-included]');if(voiceChoice){voiceIncluded=voiceChoice.dataset.voiceIncluded==='true';}
  const route=e.target.closest('[data-route]');if(route){go(route.dataset.route);return;}
  if(e.target.closest('[data-back]')){const prev=state.history.pop();if(prev){state.surface=prev.surface;state.route=prev.route;renderCurrent();}else go(state.surface==='mobile'?'mobile-home':'terminal-home');return;}
  const toast=e.target.closest('[data-toast]');if(toast){showToast(toast.dataset.toast);return;}
  const over=e.target.closest('[data-overview-route]');if(over){state.surface=over.dataset.surfaceTarget;state.route=over.dataset.overviewRoute;$('#overview').hidden=true;$('.prototype-stage').hidden=false;render();}
});
window.addEventListener('message',e=>{
  if(e.origin!==window.location.origin||e.source!==window.parent)return;
  if(e.data?.type==='riji:incoming-photo'&&state.surface==='terminal'){
    incomingShare=e.data.share||null;
    state.history=[];
    state.route='terminal-new';
    renderCurrent();
  }
  if(e.data?.type==='riji:photo-taken'&&state.surface==='terminal'){
    state.route='terminal-home';
    renderCurrent();
  }
  if(e.data?.type==='riji:reset'){
    if(state.surface==='terminal')incomingShare=null;
    if(state.surface==='mobile'){selectedShare=shareOptions[0];voiceIncluded=true;}
    state.history=[];
    state.route=state.surface==='mobile'?'mobile-home':'terminal-home';
    renderCurrent();
  }
});
$('#overview-button')?.addEventListener('click',()=>{renderOverview();$('.prototype-stage').hidden=true;$('#overview').hidden=false;$('#overview-title').focus?.();});
$('#close-overview')?.addEventListener('click',()=>{$('#overview').hidden=true;$('.prototype-stage').hidden=false;render();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#overview')&&!$('#overview').hidden)$('#close-overview').click();});
const params=new URLSearchParams(location.search);if(!standaloneSurface&&params.get('surface'))state.surface=params.get('surface');if(params.get('screen'))state.route=params.get('screen');renderCurrent();
