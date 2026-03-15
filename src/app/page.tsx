'use client';

import { useState, useEffect } from 'react';
import { Lot, Arome, Format, calculateDates, getStatus, isSellable, ProductionRecord, getAROMES, getFORMATS, addArome, removeArome, addFormat, removeFormat, saveAROMES, saveFORMATS } from '@/lib/types';
import { getLots, addOrUpdateLot, removeQuantity, deleteLot, getProductionHistory, updateLot, deleteProductionRecord } from '@/lib/storage';

export default function Home() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [aromas, setAromas] = useState<Arome[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'settings'>('stock');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [filterArome, setFilterAroma] = useState<Arome | ''>('');
  const [filterFormat, setFilterFormat] = useState<Format | ''>('');

  const [newLot, setNewLot] = useState({
    arome: 'hibiscus' as Arome,
    format: '0.5l' as Format,
    quantity: 1,
    productionDate: new Date().toISOString().split('T')[0],
  });

  const [sellQty, setSellQty] = useState(1);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [newArome, setNewArome] = useState('');
  const [newFormat, setNewFormat] = useState('');

  useEffect(() => {
    setLots(getLots());
    setHistory(getProductionHistory());
    setAromas(getAROMES());
    setFormats(getFORMATS());
  }, []);

  useEffect(() => {
    if (aromas.length > 0 && !aromas.includes(newLot.arome)) {
      setNewLot(prev => ({ ...prev, arome: aromas[0] }));
    }
  }, [aromas]);

  useEffect(() => {
    if (formats.length > 0 && !formats.includes(newLot.format)) {
      setNewLot(prev => ({ ...prev, format: formats[0] }));
    }
  }, [formats]);

  const handleAddArome = () => {
    if (newArome.trim()) {
      const updated = addArome(newArome.trim());
      setAromas(updated);
      setNewArome('');
    }
  };

  const handleRemoveArome = (arome: Arome) => {
    const updated = removeArome(arome);
    setAromas(updated);
  };

  const handleAddFormat = () => {
    if (newFormat.trim()) {
      const updated = addFormat(newFormat.trim());
      setFormats(updated);
      setNewFormat('');
    }
  };

  const handleRemoveFormat = (format: Format) => {
    const updated = removeFormat(format);
    setFormats(updated);
  };

  const handleAddLot = () => {
    const dates = calculateDates(newLot.productionDate);
    const updated = addOrUpdateLot(
      newLot.arome,
      newLot.format,
      newLot.quantity,
      newLot.productionDate,
      dates.saleLimitDate,
      dates.consumptionLimitDate
    );
    setLots(updated);
    setShowAddForm(false);
    setNewLot({
      arome: 'hibiscus',
      format: '0.5l',
      quantity: 1,
      productionDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSell = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (lot && sellQty <= lot.quantity) {
      const updated = removeQuantity(lotId, sellQty);
      setLots(updated);
      setShowSellForm(null);
      setSellQty(1);
    }
  };

  const handleDeleteLot = (lotId: string) => {
    const updated = deleteLot(lotId);
    setLots(updated);
  };

  const handleEditLot = () => {
    if (editingLot) {
      const updated = updateLot(
        editingLot.id,
        editingLot.quantity,
        editingLot.productionDate
      );
      setLots(updated);
      setEditingLot(null);
    }
  };

  const handleDeleteHistoryRecord = (recordId: string) => {
    const updated = deleteProductionRecord(recordId);
    setHistory(updated);
  };

  const uniqueFormats = [...new Set(lots.map(l => l.format.trim()))];
  const allFormats = formats.length > 0 ? formats : uniqueFormats;
  
  const sellableSummary = aromas.map(arome => {
    const formatData = allFormats.map(format => ({
      format,
      total: lots
        .filter(l => l.arome.trim() === arome.trim() && l.format.trim() === format.trim() && isSellable(l))
        .reduce((sum, l) => sum + l.quantity, 0)
    })).filter(f => f.total > 0);
    const totalArome = formatData.reduce((sum, f) => sum + f.total, 0);
    return { arome, formats: formatData, total: totalArome };
  }).filter(item => item.total > 0);

  const filteredLots = lots.filter(lot => {
    if (filterArome && lot.arome !== filterArome) return false;
    if (filterFormat && lot.format.trim() !== filterFormat.trim()) return false;
    return true;
  });

  const totalBottles = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const expiredLots = lots.filter(l => getStatus(l) === 'expired').length;
  const warningLots = lots.filter(l => getStatus(l) === 'warning').length;
  const sellableBottles = lots.filter(l => isSellable(l)).reduce((sum, l) => sum + l.quantity, 0);

  const getStatusStyles = (status: 'ok' | 'warning' | 'expired') => {
    switch (status) {
      case 'ok': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'expired': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getStatusBadgeStyles = (status: 'ok' | 'warning' | 'expired') => {
    switch (status) {
      case 'ok': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      case 'warning': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'expired': return 'bg-gradient-to-r from-rose-500 to-pink-500';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🧊 Gestion Stock Thé Froid</h1>
              <p className="text-blue-100 mt-1">Votre application de suivi de stock</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-xs text-blue-200 uppercase tracking-wider">Stock total</p>
                <p className="text-2xl font-bold">{totalBottles} bouteilles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 px-5 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'stock' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📦 Stock
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-5 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⚙️ Paramètres
          </button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Vendables</p>
                  <p className="text-4xl font-bold mt-1">{sellableBottles}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total</p>
                  <p className="text-4xl font-bold mt-1">{totalBottles}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">DLV passée</p>
                  <p className="text-4xl font-bold mt-1">{warningLots}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Expirés</p>
                  <p className="text-4xl font-bold mt-1">{expiredLots}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-2xl">🚫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Vendable */}
          {sellableSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Stock vendable
              </h3>
              <div className="space-y-3">
                {sellableSummary.map(item => (
                  <div key={item.arome} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-lg">{item.arome}</span>
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {item.total} bt
                      </span>
                    </div>
                    <div className="px-5 py-3 bg-white flex flex-wrap gap-4">
                      {item.formats.map(f => (
                        <span key={f.format} className="text-slate-600">
                          <span className="font-medium text-slate-800">{f.format}</span>
                          <span className="mx-2">:</span>
                          <span className="font-bold text-blue-600 text-lg">{f.total}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Toggle */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-3 text-slate-700 font-semibold hover:text-blue-600 transition-colors w-full"
            >
              <span className="text-xl">{showHistory ? '▼' : '▶'}</span>
              <span>📜 Historique de production</span>
            </button>
            {showHistory && (
              <div className="mt-4 max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date prod.</th>
                      <th className="px-4 py-3 text-left font-semibold">Arôme</th>
                      <th className="px-4 py-3 text-left font-semibold">Format</th>
                      <th className="px-4 py-3 text-center font-semibold">Qté</th>
                      <th className="px-4 py-3 text-left font-semibold">Ajouté le</th>
                      <th className="px-4 py-3 text-center font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500 text-lg">
                          Aucun historique
                        </td>
                      </tr>
                    ) : (
                      history.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-700 font-mono">{formatDate(record.productionDate)}</td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{record.arome}</td>
                          <td className="px-4 py-3 text-slate-700">{record.format}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{record.quantity}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{new Date(record.dateAdded).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteHistoryRecord(record.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  value={filterArome}
                  onChange={(e) => setFilterAroma(e.target.value as Arome | '')}
                >
                  <option value="">🔍 Tous les arômes</option>
                  {aromas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select
                  className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  value={filterFormat}
                  onChange={(e) => setFilterFormat(e.target.value as Format | '')}
                >
                  <option value="">📏 Tous les formats</option>
                  {formats.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                ➕ Nouveau lot
              </button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Ajouter un nouveau lot</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Arôme</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={newLot.arome}
                    onChange={(e) => setNewLot({ ...newLot, arome: e.target.value as Arome })}
                  >
                    {aromas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={newLot.format}
                    onChange={(e) => setNewLot({ ...newLot, format: e.target.value as Format })}
                  >
                    {formats.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={newLot.quantity}
                    onChange={(e) => setNewLot({ ...newLot, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date production</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={newLot.productionDate}
                    onChange={(e) => setNewLot({ ...newLot, productionDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAddLot}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Lots Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Lot</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Arôme</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Format</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Qté</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Prod.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">DLV</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">DLC</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Statut</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLots.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500 text-lg">
                        Aucun lot en stock
                      </td>
                    </tr>
                  ) : (
                    filteredLots.map((lot, index) => {
                      const status = getStatus(lot);
                      return (
                        <tr key={lot.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono font-semibold">#{lot.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{lot.arome}</td>
                          <td className="px-6 py-4 text-slate-700">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                              {lot.format}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-lg shadow-sm">
                              {lot.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(lot.productionDate)}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(lot.saleLimitDate)}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(lot.consumptionLimitDate)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyles(status)}`}>
                              {status === 'ok' ? '✅ OK' : status === 'warning' ? '⚠️ DLV' : '🚫 X'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {showSellForm === lot.id ? (
                              <div className="flex items-center gap-2 justify-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={lot.quantity}
                                  className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  value={sellQty}
                                  onChange={(e) => setSellQty(parseInt(e.target.value) || 1)}
                                />
                                <button
                                  onClick={() => handleSell(lot.id)}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-1.5 rounded-lg font-bold transition-all"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setShowSellForm(null)}
                                  className="text-slate-400 hover:text-slate-600 font-bold px-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => setShowSellForm(lot.id)}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                  Vendre
                                </button>
                                <button
                                  onClick={() => setEditingLot(lot)}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => handleDeleteLot(lot.id)}
                                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🌸</span>
              Gestion des arômes
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Nouvel arôme"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newArome}
                onChange={(e) => setNewArome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddArome()}
              />
              <button
                onClick={handleAddArome}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {aromas.map(a => (
                <div key={a} className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5 rounded-xl">
                  <span className="text-slate-700 font-medium">{a}</span>
                  <button
                    onClick={() => handleRemoveArome(a)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📏</span>
              Gestion des formats
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Nouveau format (ex: 0.33l)"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFormat()}
              />
              <button
                onClick={handleAddFormat}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formats.map(f => (
                <div key={f} className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5 rounded-xl">
                  <span className="text-slate-700 font-medium">{f}</span>
                  <button
                    onClick={() => handleRemoveFormat(f)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              Modifier le lot #{editingLot.id}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantité</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editingLot.quantity}
                  onChange={(e) => setEditingLot({ ...editingLot, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date production</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editingLot.productionDate}
                  onChange={(e) => setEditingLot({ ...editingLot, productionDate: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleEditLot}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setEditingLot(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
