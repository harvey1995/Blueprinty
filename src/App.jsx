import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, Download, Plus, CheckCircle, Trash2, Pencil, X,
  ChevronRight, RefreshCw, ChevronDown, Lock, Unlock,
  Undo2, Redo2, Moon, SunMedium, Type, AlertTriangle, 
  Search, Info, Settings, PlusCircle, ExternalLink,
  Monitor, Smartphone
} from 'lucide-react';

// --- 预设数据与联动逻辑 ---
const CATEGORY_MAP = {
  '空调': ['挂机式', '柜机式', '中央空调'],
  '电视': ['液晶式', '激光式'],
  '洗衣机': ['波轮式', '滚筒式'],
  '油烟机': ['侧吸式', '顶吸式', '集成灶式'],
  '煤气灶': ['嵌入式', '集成灶式'],
  '加湿器': ['无雾纯净式', '超声波式'],
  '热水器': ['燃气热水器', '电热水器']
};

// 1. 把品牌根据大类进行拆分
const BRAND_MAP = {
  '空调': ['格力', '美的', '大金', '海信', 'TCL', '卡萨帝', '米家'],
  '电视': ['索尼', 'TCL', '海信', '创维', '华为', '三星', '米家'],
  '洗衣机': ['海尔', '小天鹅', '西门子', '松下', '卡萨帝', '美的', '米家'],
  '油烟机': ['方太', '老板', '美大', '火星人', '海尔', '美的', '华帝'],
  '煤气灶': ['方太', '老板', '美大', '火星人', '华帝', '苏泊尔'],
  '加湿器': ['秒新', '舒乐氏', '米家', '戴森', '霍尼韦尔', '亚都'],
  '热水器': ['林内', '万和', '海尔', '美的', '西门子', '能率', '史密斯']
};

const AI_RECOMMENDATIONS = {
  '空调': `**中央空调 vs 分体空调**\n\n**对比：**\n中央：美观，温控均匀。但您的层高仅 2.7米，做完吊顶后局部可能降至 2.4-2.5米，会略显压抑。\n分体：经济、好维修。但客厅放柜机会占 0.2㎡ 面积。\n\n**推荐：**分体空调（挂机+柜机）。\n**理由：**2.7米层高不建议全屋吊顶装一拖多中央空调，费用高且压抑。\n**规格：**客厅 3 匹柜机，南卧室 1.5 匹挂机，书房 1 匹挂机。\n**品牌：**格力 (Gree)、美的 (Midea)、大金。`,
  '电视': `**液晶电视 vs 激光电视**\n\n**推荐：**75英寸-85英寸 4K 液晶电视。\n**理由：**南面和西面都有窗，采光好，液晶电视的亮度和抗光性远好于激光电视或投影仪。\n**品牌：**索尼 (Sony)、TCL、海信。`,
  '洗衣机': `**滚筒 vs 波轮**\n\n**对比：**\n滚筒：省水、护衣、可嵌入阳台柜，能加热洗。\n波轮：洗得快、便宜、不用弯腰，但伤衣物且占地不能做柜子。\n\n**推荐：**滚筒洗衣机（洗烘一体或洗烘套装）。\n**理由：**滚筒上方可做收纳，由于您只有1个卫生间，阳台空间利用至关重要，但滚筒可能不容易洗干净，需要进一步了解。\n**品牌：**海尔 (Haier)、小天鹅、西门子。`,
  '油烟机': `**主要看烟机形态。**顶吸（大气但易碰头）、侧吸（离油烟近，不碰头）、集成灶（节省上方橱柜，排烟强）。\n\n**推荐：**侧吸式油烟机 + 嵌入式煤气灶 或 集成灶。\n鉴于 100 平米厨房通常不大，集成灶 能腾出一组吊柜空间。\n**品牌：**方太 (Fotile)、老板 (Robam)；集成灶选美大、火星人。`,
  '煤气灶': `**主要看烟机形态。**顶吸（大气但易碰头）、侧吸（离油烟近，不碰头）、集成灶（节省上方橱柜，排烟强）。\n\n**推荐：**侧吸式油烟机 + 嵌入式煤气灶 或 集成灶。\n鉴于 100 平米厨房通常不大，集成灶 能腾出一组吊柜空间。\n**品牌：**方太 (Fotile)、老板 (Robam)；集成灶选美大、火星人。`,
  '加湿器': `**超声波（有白粉，要求水质高）vs 无雾纯净式（健康，不挑水质）**\n\n**推荐：**无雾纯净式加湿器。\n**理由：**西晒和空调房容易干燥，无雾型更健康，适合有呼吸道敏感人群。\n**品牌：**秒新 (AIRMX)、舒乐氏 (Soleusa)、米家。`,
  '热水器': `**燃气热水器 vs 电热水器**\n\n**对比：**\n燃气：即开即用，体积小，不占空间；适合多口人连续洗澡。\n电热：受储水箱限制，人多需等待加热；体积大，挂在卫生间显压抑。\n\n**推荐：**燃气热水器。100平米户型通常追求空间利用，且您有天然气接口。\n**规格：**选择 13L 或 16L 恒温款（强排式）。\n**品牌：**林内 (Rinnai)、万和、海尔。`
};

const PRESET_CATEGORIES = Object.keys(CATEGORY_MAP);

// 5. 购买渠道顺序调整
const PRESET_CHANNELS = ['淘宝', '天猫', '京东', '苏宁', '拼多多', '线下门店'];

const generateId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const getTodayDate = () => new Date().toISOString().split('T')[0];

// 获取对应渠道的搜索URL
const getSearchUrl = (channel, keyword) => {
  const q = encodeURIComponent(keyword);
  switch(channel) {
     case '淘宝': return `https://s.taobao.com/search?q=${q}`;
     case '天猫': return `https://list.tmall.com/search_product.htm?q=${q}`;
     case '京东': return `https://search.jd.com/Search?keyword=${q}`;
     case '苏宁': return `https://search.suning.com/${q}/`;
     case '拼多多': return `https://mobile.yangkeduo.com/search_result.html?search_key=${q}`;
     default: return `https://www.bing.com/search?q=${q}`;
  }
};

const App = () => {
  // --- 数据与缓存引擎 ---
  const [appState, setAppState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('renovation_data_v1');
      if (saved) return JSON.parse(saved);
    }
    return {
      records: [],
      categories: PRESET_CATEGORIES,
      channels: PRESET_CHANNELS
    };
  });

  // 1. 「所有记录」改为「总览」
  const [activeTab, setActiveTab] = useState('总览');
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('renovation_theme_v1');
      return saved ? JSON.parse(saved) : true; 
  });
  const [viewMode, setViewMode] = useState('web');

  // --- 状态与提醒逻辑 ---
  useEffect(() => {
    localStorage.setItem('renovation_data_v1', JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    localStorage.setItem('renovation_theme_v1', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // 关闭网页提醒
  useEffect(() => {
    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '是否导出数据？';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- 撤销/重做引擎 ---
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const updateState = (newState) => {
    setPast(p => [...p, appState].slice(-20));
    setFuture([]);
    setAppState(newState);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(p => p.slice(0, -1));
    setFuture(f => [appState, ...f]);
    setAppState(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setPast(p => [...p, appState]);
    setAppState(next);
  };

  // --- UI 状态 ---
  const [isLargeFont, setIsLargeFont] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchModal, setSearchModal] = useState({ show: false, brand: '', model: '', channel: '淘宝' });
  const [showAiModal, setShowAiModal] = useState(false);

  const scrollRef = useRef({});

  const showMessage = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- 核心操作逻辑 ---
  const addRecord = () => {
    const targetCategory = activeTab === '总览' ? (appState.categories[0] || '未分类') : activeTab;
    const newRecord = {
      id: generateId(),
      category: targetCategory,
      subCategory: '',
      isSubCategoryLocked: false,
      brand: '',
      isBrandLocked: false,
      model: '',
      isModelLocked: false,
      prices: [{ id: generateId(), channel: '淘宝', price: '' }], // 默认一条淘宝
      note: ''
    };
    updateState({ ...appState, records: [newRecord, ...appState.records] });
    showMessage("已新增一条记录");
  };

  const updateRecord = (id, field, value) => {
    const updated = appState.records.map(r => r.id === id ? { ...r, [field]: value } : r);
    updateState({ ...appState, records: updated });
  };

  const deleteRecord = (id) => {
    const updated = appState.records.filter(r => r.id !== id);
    updateState({ ...appState, records: updated });
    showMessage("记录已删除", "error");
  };

  const addPriceChannel = (recordId) => {
    const updated = appState.records.map(r => {
      if (r.id === recordId) {
        return { ...r, prices: [...r.prices, { id: generateId(), channel: '', price: '' }] };
      }
      return r;
    });
    updateState({ ...appState, records: updated });
  };

  const updatePrice = (recordId, priceId, field, value) => {
    const updated = appState.records.map(r => {
      if (r.id === recordId) {
        const newPrices = r.prices.map(p => p.id === priceId ? { ...p, [field]: value } : p);
        return { ...r, prices: newPrices };
      }
      return r;
    });
    updateState({ ...appState, records: updated });
  };

  const removePrice = (recordId, priceId) => {
    const updated = appState.records.map(r => {
      if (r.id === recordId) {
        return { ...r, prices: r.prices.filter(p => p.id !== priceId) };
      }
      return r;
    });
    updateState({ ...appState, records: updated });
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;
    if (!appState.categories.includes(newCategoryName)) {
      updateState({ ...appState, categories: [...appState.categories, newCategoryName] });
      setActiveTab(newCategoryName);
      showMessage("分类添加成功");
    }
    setNewCategoryName('');
    setShowAddCategoryModal(false);
  };

  // 全网查低价弹窗逻辑
  const openSearchModal = (brand, model) => {
    if (!model) {
      showMessage("请先输入型号", "error");
      return;
    }
    setSearchModal({ show: true, brand: brand || '', model, channel: '淘宝' });
  };

  // 导出逻辑
  const handleExport = () => {
    const headers = ["产品类型", "产品小类", "品牌", "型号", "渠道价格", "备注"];
    const csvContent = [
      headers.join(','),
      ...appState.records.map(item => {
        const pricesStr = item.prices.map(p => `${p.channel}:${p.price}`).join('|');
        return [item.category, item.subCategory, item.brand, item.model, pricesStr, `"${item.note}"`].join(',');
      })
    ].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `装修导出_${getTodayDate()}.csv`;
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(event.target.result));
        showMessage("导入完成（简易示例）");
    };
    reader.readAsArrayBuffer(file);
  };

  // --- 渲染辅助 ---
  const displayedRecords = useMemo(() => {
    if (activeTab === '总览') return appState.records;
    return appState.records.filter(r => r.category === activeTab);
  }, [appState.records, activeTab]);

  const bgTheme = isDarkMode ? 'bg-[#1a1c20] text-gray-100' : 'bg-[#f4ebd9] text-[#332b21]';
  const cardBg = isDarkMode ? 'bg-[#24272d] border-gray-700' : 'bg-[#fffaf0] border-[#e8ddc5]';
  const inputBg = isDarkMode ? 'bg-[#1e2025] border-gray-600 text-white' : 'bg-white border-[#d4c8b0] text-black';
  const btnBgPrimary = isDarkMode ? 'bg-[#4361ee] text-white' : 'bg-[#3a5a40] text-white';
  const containerWidthClass = viewMode === 'mobile' ? 'max-w-[430px]' : 'w-full';
  
  const textBase = isLargeFont ? 'text-lg' : 'text-sm';
  const textTitle = isLargeFont ? 'text-2xl' : 'text-lg';
  const textSmall = isLargeFont ? 'text-base' : 'text-xs';
  const inputHeight = isLargeFont ? 'h-14' : 'h-10';
  const iconSize = isLargeFont ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-24 ${bgTheme}`}>
      
      {/* 预设渠道列表 */}
      <datalist id="channel-list">{PRESET_CHANNELS.map(c => <option key={c} value={c} />)}</datalist>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {toast.type === 'error' ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
          <span className={`font-bold ${textBase}`}>{toast.message}</span>
        </div>
      )}

      {/* 顶部功能区 */}
      <header className="px-4 py-4 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-90 transition-colors duration-300">
        <div className={`${containerWidthClass} mx-auto flex ${viewMode === 'mobile' ? 'flex-col items-start' : 'justify-between items-center'} gap-4 transition-all duration-300`}>
          <h1 className={`font-black tracking-wider ${textTitle}`}>🏡 Pintol装修小助手</h1>
          
          <div className={`flex ${viewMode === 'mobile' ? 'flex-wrap justify-start' : 'justify-end items-center'} gap-2 w-full`}>
            <div className="flex items-center gap-2">
              {/* 6. 上方按钮需要导入、导出，并且按钮上面有具体文字 */}
              <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer flex items-center gap-1 text-sm font-bold shadow-sm transition-all hover:opacity-90 shrink-0">
                <Upload size={18}/> 导入
                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </label>
              <button onClick={handleExport} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-1 text-sm font-bold shadow-sm transition-all hover:opacity-90 shrink-0">
                <Download size={18}/> 导出
              </button>
            </div>
            {viewMode === 'web' && <div className="w-px h-6 bg-gray-400 mx-1 shrink-0" />}
            <div className="flex items-center gap-2">
              <button onClick={handleUndo} disabled={past.length === 0} className="px-3 py-2 border rounded-lg flex items-center gap-1 text-sm font-bold transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed opacity-80 hover:opacity-100">
                <Undo2 size={18}/> 撤销
              </button>
              <button onClick={handleRedo} disabled={future.length === 0} className="px-3 py-2 border rounded-lg flex items-center gap-1 text-sm font-bold transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed opacity-80 hover:opacity-100">
                <Redo2 size={18}/> 重做
              </button>
            </div>
            {viewMode === 'web' && <div className="w-px h-6 bg-gray-400 mx-1 shrink-0" />}
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-gray-500/10 transition-all shrink-0">
                {isDarkMode ? <SunMedium size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-500" />}
              </button>
              <button onClick={() => setViewMode(viewMode === 'mobile' ? 'web' : 'mobile')} className="w-10 h-10 flex items-center justify-center rounded-lg border text-orange-500 hover:bg-gray-500/10 transition-all shrink-0">
                {viewMode === 'mobile' ? <Monitor size={20} /> : <Smartphone size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`${containerWidthClass} mx-auto mt-6 px-4 transition-all duration-300`}>
        
        {/* Tab 栏 */}
        <div className="flex items-center gap-3 flex-wrap pb-4">
          <button onClick={() => setActiveTab('总览')} className={`shrink-0 px-6 py-3 rounded-full font-black transition-all ${activeTab === '总览' ? btnBgPrimary : 'bg-gray-500/20'}`}>总览</button>
          {appState.categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`shrink-0 px-6 py-3 rounded-full font-black transition-all ${activeTab === cat ? btnBgPrimary : 'bg-gray-500/20'}`}>{cat}</button>
          ))}
          <button onClick={() => setShowAddCategoryModal(true)} className="shrink-0 px-5 py-3 rounded-full border-2 border-dashed flex items-center justify-center gap-1 font-bold transition-all hover:bg-gray-500/10">
            <Plus size={20} /> 新增产品类型
          </button>
        </div>

        {/* 记录内容区 */}
        <div className="mt-4 space-y-6">
          <button 
            onClick={() => setShowAiModal(true)} 
            className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-lg"
          >
            <Info size={24} /> 展示AI推荐
          </button>

          {activeTab === '总览' ? (
            appState.records.length === 0 ? (
                <div className="py-20 text-center font-bold opacity-60 flex flex-col items-center gap-4 animate-in fade-in">
                    <Info size={48} className="opacity-50" />
                    请打开具体产品页、新增记录
                </div>
            ) : (
                <div className={`rounded-2xl border overflow-x-auto transition-colors duration-300 ${cardBg}`}>
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="border-b border-gray-500/20 opacity-70">
                                <th className={`p-3 ${textSmall}`}>大类</th>
                                <th className={`p-3 ${textSmall}`}>小类</th>
                                <th className={`p-3 ${textSmall}`}>品牌型号</th>
                                <th className={`p-3 ${textSmall}`}>最低价</th>
                                <th className={`p-3 ${textSmall}`}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appState.records.map(r => (
                                <tr key={r.id} className="border-b border-gray-500/10 hover:bg-gray-500/5 transition-colors">
                                    <td className={`p-3 font-bold ${textSmall}`}>
                                        {r.category ? r.category : <span className="text-red-500">-</span>}
                                    </td>
                                    <td className={`p-3 font-bold ${textSmall}`}>
                                        {r.subCategory ? r.subCategory : <span className="text-red-500">-</span>}
                                    </td>
                                    <td className={`p-3 ${textSmall}`}>{r.brand} {r.model}</td>
                                    <td className={`p-3 text-red-500 font-black ${textSmall}`}>
                                        ￥{Math.min(...r.prices.map(p => parseFloat(p.price) || Infinity)).toString().replace('Infinity', '-')}
                                    </td>
                                    <td className="p-3">
                                        <button onClick={() => { setActiveTab(r.category); setTimeout(() => document.getElementById(r.id)?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-indigo-500 transition-transform hover:scale-105 flex items-center gap-1">
                                            <ExternalLink size={18}/>
                                            <span className="text-sm font-bold whitespace-nowrap">点击前往{r.category || '-'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
          ) : (
            displayedRecords.length === 0 ? (
                <div className="py-20 text-center font-bold opacity-60 flex flex-col items-center gap-4 animate-in fade-in">
                    <Info size={48} className="opacity-50" />
                    请新增记录👇或展示AI推荐👆
                </div>
            ) : (
              displayedRecords.map((record, index) => (
                <div key={record.id} id={record.id} className={`p-6 rounded-2xl border shadow-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${cardBg}`}>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className={`font-black ${textTitle} flex flex-wrap items-center gap-2`}>
                      {/* 11. 「细分类型 - 品牌&型号 - 最低价格」及判空标红逻辑 */}
                      {record.subCategory ? <span>{record.subCategory}</span> : <span className="text-red-500">请完善细分类型</span>}
                      <span className="opacity-50">-</span>
                      {record.brand ? <span>{record.brand}{record.model ? ` ${record.model}` : ''}</span> : <span className="text-red-500">请完善品牌</span>}
                      <span className="opacity-50">-</span>
                      {(() => {
                        const validPrices = record.prices.filter(p => p.price !== '').map(p => parseFloat(p.price));
                        if (validPrices.length === 0) return <span className="text-red-500">请完善价格</span>;
                        return <span className="text-green-600 dark:text-green-400">最低¥{Math.min(...validPrices)}</span>;
                      })()}
                    </h3>
                    <button onClick={() => deleteRecord(record.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 /></button>
                  </div>

                  {/* 4. 小类、品牌、型号拆分为三行 */}
                  <div className="grid grid-cols-1 gap-6">
                    
                    {/* 2 & 3. 细分类型(输入框与预设合并)及锁定状态 */}
                    <div className="space-y-2">
                      <label className={`block font-bold opacity-70 ${textSmall}`}>细分类型</label>
                      <div className="flex gap-2 items-center">
                          <input 
                              list={`sub-${record.id}`}
                              disabled={record.isSubCategoryLocked}
                              value={record.subCategory}
                              onChange={(e) => updateRecord(record.id, 'subCategory', e.target.value)}
                              placeholder="点击选择或手动输入"
                              className={`flex-1 px-4 rounded-lg border outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${inputHeight} ${textBase} ${inputBg} ${record.isSubCategoryLocked ? 'opacity-60' : ''}`}
                          />
                          <datalist id={`sub-${record.id}`}>
                              {(CATEGORY_MAP[record.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                          </datalist>
                          <button onClick={() => updateRecord(record.id, 'isSubCategoryLocked', !record.isSubCategoryLocked)} className="p-3 border rounded-lg shrink-0 transition-colors hover:bg-gray-500/10">
                              {record.isSubCategoryLocked ? <Lock className="text-green-500" /> : <Unlock />}
                          </button>
                          <span className={`font-bold shrink-0 w-24 text-center transition-colors ${textSmall} ${record.isSubCategoryLocked ? 'text-green-500' : 'text-orange-500'}`}>
                              {record.isSubCategoryLocked ? '👈已确定' : '👈确定了吗？'}
                          </span>
                      </div>
                    </div>

                    {/* 3. 品牌及锁定状态 */}
                    <div className="space-y-2">
                      <label className={`block font-bold opacity-70 ${textSmall}`}>品牌</label>
                      <div className="flex gap-2 items-center">
                          <input 
                              list={`brand-${record.id}`} 
                              disabled={record.isBrandLocked}
                              placeholder="点击选择或手动输入" 
                              value={record.brand} 
                              onChange={(e) => updateRecord(record.id, 'brand', e.target.value)} 
                              className={`flex-1 px-4 rounded-lg border outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${inputHeight} ${textBase} ${inputBg} ${record.isBrandLocked ? 'opacity-60' : ''}`} 
                          />
                          {/* 动态映射品牌 Datalist */}
                          <datalist id={`brand-${record.id}`}>
                              {(BRAND_MAP[record.category] || []).map(b => <option key={b} value={b}>{b}</option>)}
                          </datalist>
                          <button onClick={() => updateRecord(record.id, 'isBrandLocked', !record.isBrandLocked)} className="p-3 border rounded-lg shrink-0 transition-colors hover:bg-gray-500/10">
                              {record.isBrandLocked ? <Lock className="text-green-500" /> : <Unlock />}
                          </button>
                          <span className={`font-bold shrink-0 w-24 text-center transition-colors ${textSmall} ${record.isBrandLocked ? 'text-green-500' : 'text-orange-500'}`}>
                              {record.isBrandLocked ? '👈已确定' : '👈确定了吗？'}
                          </span>
                      </div>
                    </div>

                    {/* 型号 & 全网查价 & 锁定状态 (已仿照品牌新增锁定功能) */}
                    <div className="space-y-2">
                      <label className={`block font-bold opacity-70 ${textSmall}`}>型号</label>
                      <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                          <input 
                              disabled={record.isModelLocked}
                              value={record.model || ''} 
                              onChange={(e) => updateRecord(record.id, 'model', e.target.value)} 
                              placeholder="手动输入具体型号" 
                              className={`flex-1 min-w-[120px] px-4 rounded-lg border outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${inputHeight} ${textBase} ${inputBg} ${record.isModelLocked ? 'opacity-60' : ''}`} 
                          />
                          <button onClick={() => openSearchModal(record.brand, record.model)} className={`px-4 rounded-lg font-black shrink-0 transition-transform hover:scale-[1.02] active:scale-95 shadow-md ${inputHeight} bg-red-500 text-white`}>全网查低价</button>
                          <button onClick={() => updateRecord(record.id, 'isModelLocked', !record.isModelLocked)} className="p-3 border rounded-lg shrink-0 transition-colors hover:bg-gray-500/10">
                              {record.isModelLocked ? <Lock className="text-green-500" /> : <Unlock />}
                          </button>
                          <span className={`font-bold shrink-0 w-24 text-center transition-colors ${textSmall} ${record.isModelLocked ? 'text-green-500' : 'text-orange-500'}`}>
                              {record.isModelLocked ? '👈已确定' : '👈确定了吗？'}
                          </span>
                      </div>
                    </div>

                    {/* 渠道价格 */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                          <label className={`font-bold opacity-70 ${textSmall}`}>价格对比</label>
                          <button onClick={() => addPriceChannel(record.id)} className="text-indigo-500 flex items-center gap-1 font-bold transition-opacity hover:opacity-70"><PlusCircle size={18}/> 新增对比</button>
                      </div>
                      {record.prices.map((p, pIdx) => (
                          <div key={p.id} className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                              <select value={p.channel} onChange={(e) => updatePrice(record.id, p.id, 'channel', e.target.value)} className={`w-1/3 px-4 rounded-lg border outline-none transition-colors ${inputHeight} ${inputBg}`}>
                                  {PRESET_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <input type="number" value={p.price} onChange={(e) => updatePrice(record.id, p.id, 'price', e.target.value)} placeholder="价格" className={`flex-1 px-4 rounded-lg border outline-none font-bold transition-colors focus:ring-2 focus:ring-blue-500 ${inputHeight} ${inputBg}`} />
                              {record.prices.length > 1 && <button onClick={() => removePrice(record.id, p.id)} className="p-3 text-red-500 transition-transform hover:scale-110"><X /></button>}
                          </div>
                      ))}
                    </div>

                  </div>
                </div>
              ))
            )
          )}
        </div>
      </main>

      {/* 底部悬浮按钮 - 1. 「总览」中不能新增记录 */}
      {activeTab !== '总览' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button onClick={addRecord} className="flex items-center gap-2 px-10 py-5 rounded-full bg-red-500 text-white shadow-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all">
            <Plus size={32} strokeWidth={3} /> 新增记录
          </button>
        </div>
      )}

      {/* 展示AI推荐气泡 */}
      {showAiModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-[90%] h-[90%] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#1e2025]' : 'bg-white'}`}>
             <div className="p-6 flex justify-between items-center border-b border-gray-500/20 shrink-0">
                <h2 className="text-2xl font-black truncate max-w-[80%]">💡 AI推荐：{activeTab}</h2>
                <button onClick={() => setShowAiModal(false)} className="p-2 bg-gray-500/20 rounded-full shrink-0 transition-transform hover:scale-105"><X size={24}/></button>
             </div>
             <div className={`flex-1 p-6 overflow-y-auto ${textBase} leading-relaxed`}>
                {activeTab === '总览' ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <a href="https://my.feishu.cn/wiki/MZUYwJd8vi9Y8jkplQLcArlknng" target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold transition-opacity hover:opacity-80">请稍等，若无法正确显示，请点击此处在新窗口打开</a>
                        <iframe src="https://my.feishu.cn/wiki/MZUYwJd8vi9Y8jkplQLcArlknng" className="w-full flex-1 border border-gray-500/20 rounded-xl bg-white transition-all" title="飞书总览网页" />
                    </div>
                ) : (
                    <div dangerouslySetInnerHTML={{ 
                        __html: (AI_RECOMMENDATIONS[activeTab] || '暂无对应产品的AI推荐内容，请尝试切换至预设分类。')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-500">$1</strong>')
                            .replace(/\n/g, '<br/>') 
                    }} />
                )}
             </div>
          </div>
        </div>
      )}

      {/* 5. 全网查低价 - 查询前5个渠道的网页搜索方式，并根据输入的品牌和型号展示在预览气泡对应页签内 */}
      {searchModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-[95%] h-[90%] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#1e2025]' : 'bg-white'}`}>
             <div className="p-6 flex justify-between items-center border-b border-gray-500/20 shrink-0">
                <h2 className="text-2xl font-black truncate max-w-[80%]">🔍 搜价：{searchModal.brand} {searchModal.model}</h2>
                <button onClick={() => setSearchModal({ ...searchModal, show: false })} className="p-2 bg-gray-500/20 rounded-full shrink-0 transition-transform hover:scale-105"><X size={24}/></button>
             </div>
             {/* 中间预览区 iframe 嵌入真实搜索结果 */}
             <div className="flex-1 bg-white relative">
                <iframe 
                  src={getSearchUrl(searchModal.channel, `${searchModal.brand} ${searchModal.model}`.trim())}
                  className="w-full h-full border-0" 
                  title="search-preview" 
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
             </div>
             {/* 底部页签 - 前5个渠道 */}
             <div className="p-6 flex gap-4 overflow-x-auto border-t border-gray-500/20 shrink-0 no-scrollbar">
                {PRESET_CHANNELS.slice(0, 5).map(ch => (
                    <button 
                        key={ch}
                        onClick={() => setSearchModal({...searchModal, channel: ch})}
                        className={`px-8 py-5 rounded-2xl font-black text-xl shrink-0 transition-all ${searchModal.channel === ch ? 'bg-red-500 text-white scale-105 shadow-lg' : 'bg-gray-500/20 hover:bg-gray-500/30'}`}
                    >
                        {ch}
                    </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* 新增分类 Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-[2rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#1e2025]' : 'bg-white'}`}>
            <div className="p-6 flex justify-between items-center border-b border-gray-500/20 shrink-0">
              <h2 className="text-2xl font-black">新增产品类型</h2>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 bg-gray-500/20 rounded-full shrink-0 transition-transform hover:scale-105"><X size={24}/></button>
            </div>
            <div className="p-6">
              <input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="手动输入产品类型" className={`w-full px-4 mb-6 rounded-xl border outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${inputHeight} ${inputBg}`} />
              <div className="flex gap-4">
                <button onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-4 border rounded-xl font-bold transition-colors hover:bg-gray-500/10">取消</button>
                <button onClick={addNewCategory} className={`flex-1 py-4 rounded-xl font-bold transition-all hover:opacity-90 shadow-md ${btnBgPrimary}`}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { transition: background-color 0.3s; }
        table { border-spacing: 0; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default App;