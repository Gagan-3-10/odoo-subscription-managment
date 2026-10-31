import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Tag, DollarSign, Layers, Check, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { Product, ProductVariant } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('SERVICE');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Variant form
  const [variantName, setVariantName] = useState('');
  const [variantType, setVariantType] = useState('Brand');
  const [variantValue, setVariantValue] = useState('');
  const [additionalPrice, setAdditionalPrice] = useState('0');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: { search, type: typeFilter },
      });
      if (res.data?.success) {
        setProducts(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, typeFilter]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, {
          name,
          type,
          salesPrice,
          costPrice,
          description,
        });
      } else {
        await api.post('/products', {
          name,
          code,
          type,
          salesPrice,
          costPrice,
          description,
        });
      }
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error saving product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setFormLoading(true);
    try {
      await api.post(`/products/${selectedProduct.id}/variants`, {
        name: variantName,
        variantType,
        variantValue,
        additionalPrice: Number(additionalPrice),
      });
      setIsVariantModalOpen(false);
      setVariantName('');
      setAdditionalPrice('0');
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add variant');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setName(p.name);
    setCode(p.code);
    setType(p.type);
    setSalesPrice(String(p.salesPrice));
    setCostPrice(String(p.costPrice));
    setDescription(p.description || '');
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, code or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="SERVICE">Service</option>
            <option value="DIGITAL">Digital</option>
            <option value="PHYSICAL">Physical</option>
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setSelectedProduct(null);
              setName('');
              setCode('');
              setType('SERVICE');
              setSalesPrice('');
              setCostPrice('');
              setDescription('');
              setIsProductModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Product
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading product catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No products found matching filters.
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        {p.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h3>
                    </div>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </div>

                <p className="mt-3 text-xs text-slate-500 line-clamp-2">{p.description || 'No description provided.'}</p>

                {/* Pricing Box */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Base Sales Price</span>
                    <p className="font-extrabold text-base text-slate-900">₹{p.salesPrice.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                    {p.type}
                  </span>
                </div>

                {/* Variants List Section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Variants ({p.variants?.length || 0})
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setVariantName('');
                          setVariantValue('');
                          setAdditionalPrice('0');
                          setIsVariantModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        + Add Variant
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {p.variants?.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No variants configured.</p>
                    ) : (
                      p.variants?.map((v) => (
                        <div
                          key={v.id}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{v.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({v.variantType})</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 text-[11px]">
                            {v.additionalPrice > 0 ? `+ ₹${v.additionalPrice}` : 'Included'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              {isAdmin && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'Create New Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{errorMsg}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brightloop Analytics Suite"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code *</label>
              <input
                type="text"
                required
                disabled={!!selectedProduct}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRD-ANALYTICS"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                <option value="SERVICE">Service (SaaS Subscription)</option>
                <option value="DIGITAL">Digital (License / API / Cloud)</option>
                <option value="PHYSICAL">Physical (Hardware / Device)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                placeholder="2499.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="800.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of features, SLA and inclusions..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Add Variant to ${selectedProduct?.name}`}
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variant Name *</label>
              <input
                type="text"
                required
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. Odoo Brand Edition"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variant Type</label>
              <select
                value={variantType}
                onChange={(e) => setVariantType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Brand">Brand (e.g. Odoo, Salesforce)</option>
                <option value="Edition">Edition (e.g. Standard, Enterprise)</option>
                <option value="Category">Category</option>
                <option value="Capacity">Capacity / Quota</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variant Value *</label>
              <input
                type="text"
                required
                value={variantValue}
                onChange={(e) => setVariantValue(e.target.value)}
                placeholder="e.g. Odoo"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={additionalPrice}
                onChange={(e) => setAdditionalPrice(e.target.value)}
                placeholder="560.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calculated Final Price: ₹{((selectedProduct?.salesPrice || 0) + Number(additionalPrice || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVariantModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Adding...' : 'Add Variant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
