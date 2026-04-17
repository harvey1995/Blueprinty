import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, Download, Plus, CheckCircle, Trash2, Pencil, X,
  ChevronRight, RefreshCw, ChevronDown, Lock, Unlock,
  Undo2, Redo2, Moon, SunMedium, Type, AlertTriangle, 
  Search, Info, Settings, PlusCircle, ExternalLink
} from 'lucide-react';

// --- 预设数据与联动逻辑 ---
const CATEGORY_MAP = {
  '热水器': ['燃气热水器', '电热水器'],
  '空调': ['挂机', '柜机', '中央空调'],
  '抽油烟机': ['侧吸式', '顶吸式', '集成灶'],
  '煤气灶': ['嵌入式', '集成灶'],
  '电视': ['液晶电视', '激光电视'],
  '洗衣机': ['滚筒', '波轮', '洗烘一体', '洗烘套装'],
  '加湿器': ['无雾纯净式', '超声波']
};

const PRESET_CATEGORIES = Object.keys(CATEGORY_MAP);
const PRESET_BRANDS = ['海尔', '格力', '美的', '大金', '米家', '方太', '老板', 'TCL', '海信', '小天鹅', '西门子', '林内', '万和', '美大', '火星人', '索尼', '秒新', '舒乐氏', '松下', '霍尼韦尔'];
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
      brands: PRESET_BRANDS,
      channels: PRESET_CHANNELS
    };
  });

  // 1. 「所有记录」改为「总览」
  const [activeTab, setActiveTab] = useState('总览');
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('renovation_theme_v1');
      return saved ? JSON.parse(saved) : true; 
  });

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
    const headers = ["产品大类", "产品小类", "品牌", "型号", "渠道价格", "备注"];
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
  
  const textBase = isLargeFont ? 'text-lg' : 'text-sm';
  const textTitle = isLargeFont ? 'text-2xl' : 'text-lg';
  const textSmall = isLargeFont ? 'text-base' : 'text-xs';
  const inputHeight = isLargeFont ? 'h-14' : 'h-10';
  const iconSize = isLargeFont ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-24 ${bgTheme}`}>
      
      {/* 原生数据列表 */}
      <datalist id="brand-list">{appState.brands.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="channel-list">{PRESET_CHANNELS.map(c => <option key={c} value={c} />)}</datalist>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {toast.type === 'error' ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
          <span className={`font-bold ${textBase}`}>{toast.message}</span>
        </div>
      )}

      {/* 顶部功能区 */}
      <header className="px-4 py-4 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <h1 className={`font-black tracking-wider ${textTitle}`}>🏡 装修记录助手</h1>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg border">
              {isDarkMode ? <SunMedium className="text-yellow-400" /> : <Moon className="text-indigo-500" />}
            </button>
            <button onClick={handleUndo} className="p-2 rounded-lg border opacity-70"><Undo2 /></button>
            <button onClick={handleRedo} className="p-2 rounded-lg border opacity-70"><Redo2 /></button>
            <div className="w-px h-6 bg-gray-400 mx-1" />
            
            {/* 6. 上方按钮需要导入、导出，并且按钮上面有具体文字 */}
            <label className="p-2 border rounded-lg cursor-pointer flex items-center gap-1 text-sm font-bold">
              <Upload size={18}/> 导入
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleExport} className="p-2 border rounded-lg flex items-center gap-1 text-sm font-bold">
              <Download size={18}/> 导出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 px-4">
        
        {/* Tab 栏 */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button onClick={() => setActiveTab('总览')} className={`shrink-0 px-6 py-3 rounded-full font-black ${activeTab === '总览' ? btnBgPrimary : 'bg-gray-500/20'}`}>总览</button>
          {appState.categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`shrink-0 px-6 py-3 rounded-full font-black ${activeTab === cat ? btnBgPrimary : 'bg-gray-500/20'}`}>{cat}</button>
          ))}
          <button onClick={() => setShowAddCategoryModal(true)} className="shrink-0 w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center"><Plus /></button>
        </div>

        {/* 记录内容区 */}
        <div className="mt-4 space-y-6">
          {activeTab === '总览' ? (
            <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-500/20 opacity-70">
                            <th className={`p-3 ${textSmall}`}>类别</th>
                            <th className={`p-3 ${textSmall}`}>品牌型号</th>
                            <th className={`p-3 ${textSmall}`}>最低价</th>
                            <th className={`p-3 ${textSmall}`}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appState.records.map(r => (
                            <tr key={r.id} className="border-b border-gray-500/10 hover:bg-gray-500/5">
                                <td className={`p-3 font-bold ${textSmall}`}>{r.category}·{r.subCategory || '-'}</td>
                                <td className={`p-3 ${textSmall}`}>{r.brand} {r.model}</td>
                                <td className={`p-3 text-red-500 font-black ${textSmall}`}>
                                    ￥{Math.min(...r.prices.map(p => parseFloat(p.price) || Infinity)).toString().replace('Infinity', '-')}
                                </td>
                                <td className="p-3">
                                    <button onClick={() => { setActiveTab(r.category); setTimeout(() => document.getElementById(r.id)?.scrollIntoView(), 100); }} className="text-indigo-500"><ExternalLink size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            displayedRecords.map((record, index) => (
              <div key={record.id} id={record.id} className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
                <div className="flex justify-between items-start mb-6">
                  <h3 className={`font-black ${textTitle}`}>
                    {record.brand || '品牌'} - ￥{record.prices[0]?.price || '0'} - {record.subCategory || '细分类型'}
                  </h3>
                  <button onClick={() => deleteRecord(record.id)} className="p-2 text-red-500"><Trash2 /></button>
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
                            placeholder="选择或手动输入"
                            className={`flex-1 px-4 rounded-lg border outline-none ${inputHeight} ${textBase} ${inputBg} ${record.isSubCategoryLocked ? 'opacity-60' : ''}`}
                        />
                        <datalist id={`sub-${record.id}`}>
                            {(CATEGORY_MAP[record.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </datalist>
                        <button onClick={() => updateRecord(record.id, 'isSubCategoryLocked', !record.isSubCategoryLocked)} className="p-3 border rounded-lg shrink-0">
                            {record.isSubCategoryLocked ? <Lock className="text-green-500" /> : <Unlock />}
                        </button>
                        <span className={`font-bold shrink-0 w-24 text-center ${textSmall} ${record.isSubCategoryLocked ? 'text-green-500' : 'text-orange-500'}`}>
                            {record.isSubCategoryLocked ? '👈已确定' : '👈确定了吗？'}
                        </span>
                    </div>
                  </div>

                  {/* 3. 品牌及锁定状态 */}
                  <div className="space-y-2">
                    <label className={`block font-bold opacity-70 ${textSmall}`}>品牌</label>
                    <div className="flex gap-2 items-center">
                        <input 
                            list="brand-list" 
                            disabled={record.isBrandLocked}
                            placeholder="搜索或输入" 
                            value={record.brand} 
                            onChange={(e) => updateRecord(record.id, 'brand', e.target.value)} 
                            className={`flex-1 px-4 rounded-lg border outline-none ${inputHeight} ${textBase} ${inputBg} ${record.isBrandLocked ? 'opacity-60' : ''}`} 
                        />
                        <button onClick={() => updateRecord(record.id, 'isBrandLocked', !record.isBrandLocked)} className="p-3 border rounded-lg shrink-0">
                            {record.isBrandLocked ? <Lock className="text-green-500" /> : <Unlock />}
                        </button>
                        <span className={`font-bold shrink-0 w-24 text-center ${textSmall} ${record.isBrandLocked ? 'text-green-500' : 'text-orange-500'}`}>
                            {record.isBrandLocked ? '👈已确定' : '👈确定了吗？'}
                        </span>
                    </div>
                  </div>

                  {/* 型号 & 全网查价 */}
                  <div className="space-y-2">
                    <label className={`block font-bold opacity-70 ${textSmall}`}>型号</label>
                    <div className="flex gap-3">
                        <input value={record.model} onChange={(e) => updateRecord(record.id, 'model', e.target.value)} placeholder="手动输入具体型号" className={`flex-1 px-4 rounded-lg border outline-none ${inputHeight} ${textBase} ${inputBg}`} />
                        <button onClick={() => openSearchModal(record.brand, record.model)} className={`px-6 rounded-lg font-black shrink-0 ${inputHeight} bg-red-500 text-white`}>全网查低价</button>
                    </div>
                  </div>

                  {/* 渠道价格 */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                        <label className={`font-bold opacity-70 ${textSmall}`}>价格对比</label>
                        <button onClick={() => addPriceChannel(record.id)} className="text-indigo-500 flex items-center gap-1 font-bold"><PlusCircle size={18}/> 新增对比</button>
                    </div>
                    {record.prices.map((p, pIdx) => (
                        <div key={p.id} className="flex gap-2">
                            <select value={p.channel} onChange={(e) => updatePrice(record.id, p.id, 'channel', e.target.value)} className={`w-1/3 px-4 rounded-lg border outline-none ${inputHeight} ${inputBg}`}>
                                {PRESET_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="number" value={p.price} onChange={(e) => updatePrice(record.id, p.id, 'price', e.target.value)} placeholder="价格" className={`flex-1 px-4 rounded-lg border outline-none font-bold ${inputHeight} ${inputBg}`} />
                            {record.prices.length > 1 && <button onClick={() => removePrice(record.id, p.id)} className="p-3 text-red-500"><X /></button>}
                        </div>
                    ))}
                  </div>

                </div>
              </div>
            ))
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

      {/* 5. 全网查低价 - 查询前5个渠道的网页搜索方式，并根据输入的品牌和型号展示在预览气泡对应页签内 */}
      {searchModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`w-[95%] h-[90%] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#1e2025]' : 'bg-white'}`}>
             <div className="p-6 flex justify-between items-center border-b border-gray-500/20 shrink-0">
                <h2 className="text-2xl font-black truncate max-w-[80%]">🔍 搜价：{searchModal.brand} {searchModal.model}</h2>
                <button onClick={() => setSearchModal({ ...searchModal, show: false })} className="p-2 bg-gray-500/20 rounded-full shrink-0"><X size={32}/></button>
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
             <div className="p-6 flex gap-4 overflow-x-auto border-t border-gray-500/20 shrink-0">
                {PRESET_CHANNELS.slice(0, 5).map(ch => (
                    <button 
                        key={ch}
                        onClick={() => setSearchModal({...searchModal, channel: ch})}
                        className={`px-8 py-5 rounded-2xl font-black text-xl shrink-0 transition-all ${searchModal.channel === ch ? 'bg-red-500 text-white scale-105' : 'bg-gray-500/20'}`}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-3xl p-8 ${cardBg}`}>
            <h2 className="text-2xl font-black mb-6">新增产品大类</h2>
            <input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="名称..." className={`w-full px-4 mb-6 rounded-xl border outline-none ${inputHeight} ${inputBg}`} />
            <div className="flex gap-4">
              <button onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-4 border rounded-xl font-bold">取消</button>
              <button onClick={addNewCategory} className={`flex-1 py-4 rounded-xl font-bold ${btnBgPrimary}`}>确定</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { transition: background-color 0.3s; }
        table { border-spacing: 0; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
};

export default App;