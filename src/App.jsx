import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Package, ArrowLeftRight, Barcode, Camera, 
  Search, Plus, Trash2, Edit, Check, AlertTriangle, RefreshCw, 
  DollarSign, FileText, Users, Shield, Printer, Download, X,
  Layers, ChevronDown, CheckCircle, Volume2, Sparkles
} from 'lucide-react';

// --- INITIAL MOCK DATA ---
const INITIAL_CURRENCY = 'ج.س';

const INITIAL_SUPPLIERS = [
  { id: 'SUP-101', name: 'شركة البركة للمواد الغذائية', phone: '0912345678', address: 'الخرطوم - السوق المحلي', balance: 125000 },
  { id: 'SUP-102', name: 'مؤسسة النيل للمشروبات', phone: '0987654321', address: 'أم درمان - المنطقة الصناعية', balance: 45000 },
];

const INITIAL_PRODUCTS = [
  {
    id: 'P-101',
    name: 'سكر كنانه 1 كجم',
    category: 'مواد غذائية',
    brand: 'كنانة',
    barcode: 'GROC-100001',
    purchasePrice: 1800,
    salePrice: 2200,
    stock: 45,
    minStock: 10,
    unit: 'كيس',
    sellType: 'piece',
    status: 'active',
    supplierId: 'SUP-101',
    image: null
  },
  {
    id: 'P-102',
    name: 'سكر بالجملة (شوال)',
    category: 'جملة وتعبئة',
    brand: 'كنانة',
    barcode: 'GROC-100002',
    purchasePrice: 85000,
    salePrice: 95000,
    stock: 8,
    minStock: 2,
    unit: 'كجم',
    sellType: 'weight',
    status: 'active',
    supplierId: 'SUP-101',
    image: null
  },
  {
    id: 'P-103',
    name: 'زيت صباح 1 لتر',
    category: 'زيوت وطعام',
    brand: 'صافولا',
    barcode: '628100700001',
    purchasePrice: 3200,
    salePrice: 3800,
    stock: 4,
    minStock: 5,
    unit: 'عبوة',
    sellType: 'piece',
    status: 'active',
    supplierId: 'SUP-102',
    image: null
  }
];

export default function BaqalatiApp() {
  // --- STATE MANAGEMENT ---
  const [currency, setCurrency] = useState(() => localStorage.getItem('baqalati_curr') || INITIAL_CURRENCY);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('baqalati_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('baqalati_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [activeTab, setActiveTab] = useState('pos'); // pos, products, packaging, inventory, suppliers, reports
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Packaging State
  const [packagingData, setPackagingData] = useState({
    bulkProductId: '',
    retailProductId: '',
    unitsCount: 1,
    unitSize: 1,
    notes: ''
  });

  // Photo & AI Recognition State
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiDetectedData, setAiDetectedData] = useState(null);

  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'عام',
    brand: '',
    barcode: '',
    purchasePrice: '',
    salePrice: '',
    stock: '',
    minStock: 5,
    unit: 'قطعة',
    supplierId: '',
    sellType: 'piece',
    status: 'active',
    image: null
  });

  // New Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    address: '',
    balance: 0
  });

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('baqalati_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('baqalati_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('baqalati_curr', currency);
  }, [currency]);

  // --- HELPER FUNCTIONS ---
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio feedback not supported or blocked');
    }
  };

  const generateInternalBarcode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    return `GROC-${randomCode}`;
  };

  // --- PRODUCT ACTIONS ---
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...productForm, id: p.id } : p));
    } else {
      const newProduct = {
        ...productForm,
        id: `P-${Date.now()}`,
        barcode: productForm.barcode || generateInternalBarcode(),
        purchasePrice: Number(productForm.purchasePrice) || 0,
        salePrice: Number(productForm.salePrice) || 0,
        stock: Number(productForm.stock) || 0,
      };
      setProducts([newProduct, ...products]);
    }
    setShowProductModal(false);
    resetProductForm();
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج نهائياً؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', category: 'عام', brand: '', barcode: '',
      purchasePrice: '', salePrice: '', stock: '', minStock: 5,
      unit: 'قطعة', supplierId: '', sellType: 'piece', status: 'active', image: null
    });
  };

  // --- SUPPLIER ACTIONS ---
  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...supplierForm, id: s.id } : s));
    } else {
      const newSupplier = {
        ...supplierForm,
        id: `SUP-${Date.now()}`,
        balance: Number(supplierForm.balance) || 0
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setShowSupplierModal(false);
    setEditingSupplier(null);
    setSupplierForm({ name: '', phone: '', address: '', balance: 0 });
  };

  const handleDeleteSupplier = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  // --- POS / CART ACTIONS ---
  const addToCart = (product) => {
    playBeep();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateCartQty = (id, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty } : item));
    }
  };

  const checkoutCart = () => {
    if (cart.length === 0) return;
    // Deduct stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
      }
      return p;
    });
    setProducts(updatedProducts);
    setCart([]);
    alert('تم إتمام عملية البيع وخصم المخزون بنجاح!');
  };

  // --- PACKAGING & RETAIL LOGIC ---
  const handleExecutePackaging = (e) => {
    e.preventDefault();
    const bulkProd = products.find(p => p.id === packagingData.bulkProductId);
    const retailProd = products.find(p => p.id === packagingData.retailProductId);

    if (!bulkProd || !retailProd) {
      alert('رجاءً اختر المنتج بالجملة والمنتج المعبأ.');
      return;
    }

    const totalBulkNeeded = Number(packagingData.unitsCount) * Number(packagingData.unitSize);

    if (bulkProd.stock < totalBulkNeeded) {
      alert(`الكمية غير كافية في مخزون الجملة! المتوفر: ${bulkProd.stock} ${bulkProd.unit} المطلوبة: ${totalBulkNeeded} ${bulkProd.unit}`);
      return;
    }

    // Update stocks
    setProducts(products.map(p => {
      if (p.id === bulkProd.id) {
        return { ...p, stock: p.stock - totalBulkNeeded };
      }
      if (p.id === retailProd.id) {
        return { ...p, stock: p.stock + Number(packagingData.unitsCount) };
      }
      return p;
    }));

    alert(`تمت عملية التعبئة بنجاح! تم خصم ${totalBulkNeeded} ${bulkProd.unit} من [${bulkProd.name}] وإضافة ${packagingData.unitsCount} ${retailProd.unit} إلى [${retailProd.name}].`);
    setPackagingData({ bulkProductId: '', retailProductId: '', unitsCount: 1, unitSize: 1, notes: '' });
  };

  // --- SMART PHOTO & AI SIMULATION ---
  const handleSimulateCapture = () => {
    // Simulated camera capture sample
    const sampleImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60';
    setCapturedImage(sampleImage);
    setIsAnalyzingImage(true);

    // Simulate AI Identification delay
    setTimeout(() => {
      setIsAnalyzingImage(false);
      setAiDetectedData({
        suggestedName: 'عصير برتقال طبيعي 1 لتر',
        suggestedCategory: 'مشروبات وعصائر',
        suggestedUnit: 'عبوة',
        suggestedPrice: 1500,
        suggestedCost: 1200,
        confidence: '94%'
      });
    }, 1500);
  };

  const applyAiSuggestions = () => {
    if (!aiDetectedData) return;
    setProductForm({
      ...productForm,
      name: aiDetectedData.suggestedName,
      category: aiDetectedData.suggestedCategory,
      unit: aiDetectedData.suggestedUnit,
      purchasePrice: aiDetectedData.suggestedCost,
      salePrice: aiDetectedData.suggestedPrice,
      image: capturedImage
    });
    setShowPhotoModal(false);
    setShowProductModal(true);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.salePrice * item.qty), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans dir-rtl" dir="rtl">
      
      {/* HEADER NAVBAR */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-emerald-500 p-2 rounded-lg text-slate-900 font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-emerald-400">بقالتي</h1>
              <p className="text-xs text-slate-400">نظام إدارة البقالة والسوبرماركت الذكي</p>
            </div>
          </div>

          {/* CURRENCY & BARCODE QUICK SCANNER BUTTON */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
              <DollarSign className="w-4 h-4 text-emerald-400 ml-1" />
              <span className="text-xs text-slate-400 ml-2">العملة:</span>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
              >
                <option value="ج.س" className="bg-slate-800">جنيه سوداني (ج.س)</option>
                <option value="ر.س" className="bg-slate-800">ريال سعودي (ر.س)</option>
                <option value="ج.م" className="bg-slate-800">جنيه مصري (ج.م)</option>
                <option value="د.إ" className="bg-slate-800">درهم إماراتي (د.إ)</option>
                <option value="$" className="bg-slate-800">دولار ($)</option>
              </select>
            </div>

            <button 
              onClick={() => setShowScannerModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition"
            >
              <Camera className="w-4 h-4" />
              <span>مسح بالكاميرا</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="bg-slate-800 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('pos')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${activeTab === 'pos' ? 'border-emerald-400 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-300 hover:text-white'}`}
            >
              <ShoppingCart className="w-4 h-4" /> شاشة البيع (POS)
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${activeTab === 'products' ? 'border-emerald-400 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-300 hover:text-white'}`}
            >
              <Package className="w-4 h-4" /> المنتجات والمخزون
            </button>
            <button 
              onClick={() => setActiveTab('packaging')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${activeTab === 'packaging' ? 'border-emerald-400 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-300 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" /> التعبئة والتجزئة
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition ${activeTab === 'suppliers' ? 'border-emerald-400 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-300 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> الموردين
            </button>
          </div>
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ==================== 1. POINT OF SALE (POS) ==================== */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PRODUCT CATALOG & SEARCH */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute right-3 top-3 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ابحث باسم المنتج أو الباركود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button 
                  onClick={() => setShowPhotoModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
                  title="التقاط صورة للتعرف على المنتج"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تصوير التعرف الذكي</span>
                </button>
              </div>

              {/* PRODUCT GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {products
                  .filter(p => p.name.includes(searchTerm) || p.barcode.includes(searchTerm))
                  .map(product => (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-sm cursor-pointer transition hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                        ) : (
                          <div className="w-full h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-slate-500">{product.unit} | مخزون: {product.stock}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-black text-emerald-600 text-base">{product.salePrice} {currency}</span>
                        <button className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-200">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* CART SUMMARY */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-[calc(100vh-200px)] sticky top-28">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <span>فاتورة المبيعات</span>
                  </h2>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{cart.length} عناصر</span>
                </div>

                {/* CART ITEMS LIST */}
                <div className="overflow-y-auto max-h-[380px] my-3 space-y-2 divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>السلة فارغة. انقر على منتج لإضافته.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="pt-2 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-slate-800">{item.name}</h4>
                          <p className="text-xs text-slate-500">{item.salePrice} {currency} / {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartQty(item.id, item.qty - 1)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700"
                          >-</button>
                          <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, item.qty + 1)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700"
                          >+</button>
                        </div>
                        <div className="w-16 text-left font-bold text-sm text-slate-800">
                          {item.salePrice * item.qty}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CART TOTAL & CHECKOUT */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <div className="flex justify-between items-center text-lg font-black text-slate-900">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-emerald-600 text-2xl">{cartTotal} {currency}</span>
                </div>
                <button 
                  onClick={checkoutCart}
                  disabled={cart.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-base shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>تأكيد وطباعة الفاتورة</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 2. PRODUCTS & INVENTORY MANAGEMENT ==================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-5 h-5 absolute right-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => { resetProductForm(); setShowProductModal(true); }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>

            {/* PRODUCTS TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                    <th className="p-3">المنتج</th>
                    <th className="p-3">الباركود</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">سعر الشراء</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">المخزون</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products
                    .filter(p => p.name.includes(searchTerm) || p.barcode.includes(searchTerm))
                    .map(product => {
                      const supplier = suppliers.find(s => s.id === product.supplierId);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 flex items-center gap-3">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{product.name}</div>
                              <div className="text-xs text-slate-400">{product.unit}</div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-600">{product.barcode}</td>
                          <td className="p-3 text-slate-600">{product.category}</td>
                          <td className="p-3 font-semibold text-slate-700">{product.purchasePrice} {currency}</td>
                          <td className="p-3 font-bold text-emerald-600">{product.salePrice} {currency}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {product.stock} {product.unit}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-xs">{supplier ? supplier.name : '-'}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => openEditProduct(product)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="تعديل المنتج"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 3. PACKAGING & RETAIL SYSTEM (التعبئة والتجزئة) ==================== */}
        {activeTab === 'packaging' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>نظام التعبئة والتجزئة للمواد بالجملة</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                استخدم هذه الشاشة لفك شوال/كمية جملة إلى أكياس أو عبوات تجزئة صغيرة مع خصم المخزون وتحديثه تلقائياً.
              </p>
            </div>

            <form onSubmit={handleExecutePackaging} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة الكبيرة (بالجملة):</label>
                <select 
                  value={packagingData.bulkProductId}
                  onChange={(e) => setPackagingData({ ...packagingData, bulkProductId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="">اختر مادة الجملة...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (المتوفر: {p.stock} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المنتج المعبأ (التجزئة):</label>
                  <select 
                    value={packagingData.retailProductId}
                    onChange={(e) => setPackagingData({ ...packagingData, retailProductId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  >
                    <option value="">اختر المنتج الصغير...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد العبوات المعبأة:</label>
                  <input 
                    type="number"
                    min="1"
                    value={packagingData.unitsCount}
                    onChange={(e) => setPackagingData({ ...packagingData, unitsCount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وزن/حجم المادة الكبيرة في كل عبوة صغيرة:</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={packagingData.unitSize}
                  onChange={(e) => setPackagingData({ ...packagingData, unitSize: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                <strong>سيتم حساب العمل كالتالي:</strong> خصم ({Number(packagingData.unitsCount) * Number(packagingData.unitSize)}) من مخزون مادة الجملة، وإضافة ({packagingData.unitsCount}) إلى مخزون المنتج المعبأ.
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
              >
                تأكيد عملية التعبئة والتجزئة
              </button>
            </form>
          </div>
        )}

        {/* ==================== 4. SUPPLIERS MANAGEMENT ==================== */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <h2 className="font-bold text-lg text-slate-800">قائمة الموردين والشركات</h2>
              <button 
                onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', address: '', balance: 0 }); setShowSupplierModal(true); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مورد جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(sup => (
                <div key={sup.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">{sup.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">الهاتف: {sup.phone}</p>
                    <p className="text-xs text-slate-500">العنوان: {sup.address}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-500">الرصيد/المستحقات:</span>
                      <span className="font-bold text-slate-800">{sup.balance} {currency}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button 
                      onClick={() => { setEditingSupplier(sup); setSupplierForm(sup); setShowSupplierModal(true); }}
                      className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(sup.id)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ==================== MODAL 1: ADD / EDIT PRODUCT ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => setShowProductModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج:</label>
                <input 
                  type="text" 
                  value={productForm.name} 
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف:</label>
                  <input 
                    type="text" 
                    value={productForm.category} 
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الباركود:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={productForm.barcode} 
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                      placeholder="تلقائي أو أدخل الباركود"
                    />
                    <button 
                      type="button" 
                      onClick={() => setProductForm({ ...productForm, barcode: generateInternalBarcode() })}
                      className="bg-slate-200 px-3 rounded-lg text-xs font-bold text-slate-700"
                    >
                      توليد
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الشراء ({currency}):</label>
                  <input 
                    type="number" 
                    value={productForm.purchasePrice} 
                    onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع ({currency}):</label>
                  <input 
                    type="number" 
                    value={productForm.salePrice} 
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية الحالية:</label>
                  <input 
                    type="number" 
                    value={productForm.stock} 
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس:</label>
                  <select 
                    value={productForm.unit} 
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كجم">كجم</option>
                    <option value="جرام">جرام</option>
                    <option value="لتر">لتر</option>
                    <option value="عبوة">عبوة</option>
                    <option value="كيس">كيس</option>
                    <option value="صندوق">صندوق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد:</label>
                  <select 
                    value={productForm.supplierId} 
                    onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">اختر مورد...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg transition mt-4"
              >
                حفظ المنتج
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD / EDIT SUPPLIER ==================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
              <button onClick={() => setShowSupplierModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد / الشركة:</label>
                <input 
                  type="text" 
                  value={supplierForm.name} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input 
                  type="text" 
                  value={supplierForm.phone} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان:</label>
                <input 
                  type="text" 
                  value={supplierForm.address} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg transition mt-4"
              >
                حفظ بيانات المورد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: SMART CAMERA PHOTO RECOGNITION ==================== */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <span>التعرف الذكي على المنتج من الصورة</span>
              </h3>
              <button onClick={() => setShowPhotoModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 text-center space-y-4">
              {!capturedImage ? (
                <div className="border-2 border-dashed border-slate-300 p-8 rounded-xl bg-slate-50 flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 mb-4">وجه كاميرا الهاتف نحو غلاف أو شكل المنتج</p>
                  <button 
                    onClick={handleSimulateCapture}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm"
                  >
                    التقاط صورة الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <img src={capturedImage} alt="التقاط المنتج" className="w-full h-48 object-cover rounded-xl shadow" />

                  {isAnalyzingImage ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-600 py-4 font-bold">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>جاري تحليل الصورة والتعرف على المنتج...</span>
                    </div>
                  ) : (
                    aiDetectedData && (
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-right space-y-2 text-sm">
                        <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                          <span className="font-bold text-indigo-900">المنتج المقترح:</span>
                          <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">دقة {aiDetectedData.confidence}</span>
                        </div>
                        <p><strong>الاسم:</strong> {aiDetectedData.suggestedName}</p>
                        <p><strong>التصنيف:</strong> {aiDetectedData.suggestedCategory}</p>
                        <p><strong>السعر المقترح:</strong> {aiDetectedData.suggestedPrice} {currency}</p>

                        <button 
                          onClick={applyAiSuggestions}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg text-sm mt-3"
                        >
                          اعتماد المقترح وتعبئة نموذج المنتج
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: BARCODE CAMERA SCANNER ==================== */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 text-center space-y-4 text-white border border-slate-800">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">ماسح الباركود بالكاميرا</h3>
              <button onClick={() => setShowScannerModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="relative w-full h-56 bg-slate-950 rounded-xl border-2 border-emerald-500 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse"></div>
              <Barcode className="w-24 h-24 text-slate-700" />
              <span className="absolute bottom-3 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full">وجّه الباركود داخل الإطار</span>
            </div>

            <button 
              onClick={() => {
                setShowScannerModal(false);
                alert('تمت قراءة الباركود التجريبي: GROC-100001');
              }}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg"
            >
              محاكاة مسح باركود ناجح
            </button>
          </div>
        </div>
      )}

    </div>
  );
}