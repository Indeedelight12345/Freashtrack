import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Leaf,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
}

const CATEGORIES = ['Dairy', 'Veggies', 'Pantry', 'Meat', 'Fruit', 'Bakery', 'Other'];

export default function App() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'soon'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Veggies',
    expiryDate: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.expiryDate) return;

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const item = await res.json();
        setItems(prev => [...prev, item]);
        setNewItem({ name: '', category: 'Veggies', expiryDate: '' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return 'bg-stone-200 text-stone-500 border-stone-300';
    if (days <= 3) return 'bg-red-50 text-red-700 border-red-200';
    if (days <= 7) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const filteredItems = useMemo(() => {
    let sorted = [...items].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    if (filter === 'soon') {
      return sorted.filter(item => getDaysRemaining(item.expiryDate) <= 7);
    }
    return sorted;
  }, [items, filter]);

  const stats = useMemo(() => {
    const soon = items.filter(item => {
      const days = getDaysRemaining(item.expiryDate);
      return days >= 0 && days <= 7;
    }).length;
    const expired = items.filter(item => getDaysRemaining(item.expiryDate) < 0).length;
    return { soon, expired, total: items.length };
  }, [items]);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">FreshTrack</h1>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-500 mb-1">Soon</p>
            <p className="text-2xl font-bold text-stone-800">{stats.soon}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-red-500 mb-1">Expired</p>
            <p className="text-2xl font-bold text-stone-800">{stats.expired}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-stone-800 text-white' 
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('soon')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              filter === 'soon' 
                ? 'bg-amber-500 text-white' 
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Expiring Soon
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-stone-400">Loading your pantry...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="text-stone-300 w-8 h-8" />
              </div>
              <p className="text-stone-500 font-medium">No items found</p>
              <p className="text-stone-400 text-sm">Try adding something new or changing filters</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const days = getDaysRemaining(item.expiryDate);
                const statusClass = getStatusColor(days);
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between group hover:border-emerald-200 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusClass} border`}>
                        {days < 0 ? <AlertCircle className="w-6 h-6" /> : 
                         days <= 3 ? <Clock className="w-6 h-6" /> : 
                         <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-800">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">{item.category}</span>
                          <span className={`text-xs font-medium ${
                            days < 0 ? 'text-red-500' : 
                            days <= 3 ? 'text-red-600' : 
                            days <= 7 ? 'text-amber-600' : 
                            'text-emerald-600'
                          }`}>
                            {days < 0 ? 'Expired' : 
                             days === 0 ? 'Expires today' : 
                             days === 1 ? 'Expires tomorrow' : 
                             `Expires in ${days} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-6 shadow-2xl max-w-2xl mx-auto"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-stone-800 mb-6">Add New Item</h2>
              
              <form onSubmit={addItem} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Item Name</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="e.g. Milk, Spinach, Eggs"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewItem({...newItem, category: cat})}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          newItem.category === cat 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                            : 'bg-stone-50 text-stone-600 border border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Expiration Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input 
                      type="date"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={newItem.expiryDate}
                      onChange={e => setNewItem({...newItem, expiryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-stone-100 text-stone-600 font-bold py-4 rounded-2xl hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Add to Pantry
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
