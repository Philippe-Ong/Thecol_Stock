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

  const filteredLots = lots.filter(lot => {
    if (filterArome && lot.arome !== filterArome) return false;
    if (filterFormat && lot.format.trim() !== filterFormat.trim()) return false;
    return true;
  });

  const totalBottles = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const expiredLots = lots.filter(l => getStatus(l) === 'expired').length;
  const warningLots = lots.filter(l => getStatus(l) === 'warning').length;
  const sellableBottles = lots.filter(l => isSellable(l)).reduce((sum, l) => sum + l.quantity, 0);

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

  const getStatusStyles = (status: 'ok' | 'warning' | 'expired') => {
    switch (status) {
      case 'ok': return 'bg-[#d4edda] text-[#3a6147] border-[#c3e6cb]';
      case 'warning': return 'bg-[#fff3cd] text-[#856404] border-[#ffeeba]';
      case 'expired': return 'bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CH');
  };

  return (
    <div className="min-h-screen bg-[#f5f8f5] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-[#2d3a2e]">Gestion du stock</h1>
        </header>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'stock' 
                ? 'bg-[#4a7c59] text-white' 
                : 'bg-white text-[#2d3a2e] hover:bg-[#e8f0e8]'
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-[#4a7c59] text-white' 
                : 'bg-white text-[#2d3a2e] hover:bg-[#e8f0e8]'
            }`}
          >
            Paramètres
          </button>
        </div>

        {activeTab === 'stock' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#4a7c59]">
                <p className="text-sm font-medium text-[#6b9e78] uppercase tracking-wide">Vendables (&lt; 1 mois)</p>
                <p className="text-4xl font-bold text-[#4a7c59] mt-1">{sellableBottles}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#4a7c59]">
                <p className="text-sm font-medium text-[#6b9e78] uppercase tracking-wide">Total bouteilles</p>
                <p className="text-4xl font-bold text-[#2d3a2e] mt-1">{totalBottles}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#c9a227]">
                <p className="text-sm font-medium text-[#a88620] uppercase tracking-wide">DLV passée</p>
                <p className="text-4xl font-bold text-[#c9a227] mt-1">{warningLots}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#c75050]">
                <p className="text-sm font-medium text-[#a84040] uppercase tracking-wide">Expirés (DLC)</p>
                <p className="text-4xl font-bold text-[#c75050] mt-1">{expiredLots}</p>
              </div>
            </div>

            {sellableSummary.length > 0 && (
          <div className="bg-white rounded-xl shadow-md mb-6 p-5">
            <h3 className="text-lg font-bold text-[#2d3a2e] mb-4">Stock vendable</h3>
            <div className="space-y-2">
              {sellableSummary.map(item => (
                <div key={item.arome} className="border border-[#e8f0e8] rounded-lg overflow-hidden">
                  <div className="bg-[#f5f8f5] px-4 py-3 flex justify-between items-center">
                    <span className="font-semibold text-[#2d3a2e]">{item.arome}</span>
                    <span className="bg-[#4a7c59] text-white px-3 py-1 rounded-full text-sm font-bold">
                      {item.total} bt
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-white">
                    <div className="flex flex-wrap gap-4">
                      {item.formats.map(f => (
                        <span key={f.format} className="text-[#2d3a2e]">
                          <span className="font-medium">{f.format}</span>
                          <span className="mx-2">:</span>
                          <span className="font-bold text-[#4a7c59]">{f.total}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md mb-6 p-5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-[#2d3a2e] font-medium hover:text-[#4a7c59] transition-colors"
          >
            <span className="text-xl">{showHistory ? '▼' : '▶'}</span>
            Historique de production
          </button>
          {showHistory && (
            <div className="mt-4 max-h-80 overflow-y-auto border border-[#e8f0e8] rounded-lg">
              <table className="w-full text-base">
                <thead className="bg-[#4a7c59] text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date prod.</th>
                    <th className="px-4 py-3 text-left font-semibold">Arôme</th>
                    <th className="px-4 py-3 text-left font-semibold">Format</th>
                    <th className="px-4 py-3 text-center font-semibold">Qté</th>
                    <th className="px-4 py-3 text-left font-semibold">Ajouté le</th>
                    <th className="px-4 py-3 text-center font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8f0e8] bg-white">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[#6b9e78] text-lg">
                        Aucun historique
                      </td>
                    </tr>
                  ) : (
                    history.map(record => (
                      <tr key={record.id} className="hover:bg-[#f5f8f5]">
                        <td className="px-4 py-3 text-[#2d3a2e]">{formatDate(record.productionDate)}</td>
                        <td className="px-4 py-3 text-[#2d3a2e] font-medium">{record.arome}</td>
                        <td className="px-4 py-3 text-[#2d3a2e]">{record.format}</td>
                        <td className="px-4 py-3 text-center font-bold text-[#4a7c59]">{record.quantity}</td>
                        <td className="px-4 py-3 text-[#6b9e78]">{new Date(record.dateAdded).toLocaleDateString('fr-CH')}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteHistoryRecord(record.id)}
                            className="text-[#c75050] hover:text-[#a84040] text-sm"
                            title="Supprimer"
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

        <div className="bg-white rounded-xl shadow-md mb-6 p-5">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent cursor-pointer"
                value={filterArome}
                onChange={(e) => setFilterAroma(e.target.value as Arome | '')}
              >
                <option value="">Tous les arômes</option>
                {aromas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select
                className="px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent cursor-pointer"
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value as Format | '')}
              >
                <option value="">Tous les formats</option>
                {formats.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#4a7c59] hover:bg-[#3a6147] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              + Nouveau lot
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md mb-6 p-6">
            <h2 className="text-xl font-semibold text-[#2d3a2e] mb-5">Ajouter un nouveau lot</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Arôme</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newLot.arome}
                  onChange={(e) => setNewLot({ ...newLot, arome: e.target.value as Arome })}
                >
                  {aromas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Format</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newLot.format}
                  onChange={(e) => setNewLot({ ...newLot, format: e.target.value as Format })}
                >
                  {formats.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Quantité</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newLot.quantity}
                  onChange={(e) => setNewLot({ ...newLot, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Date production</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newLot.productionDate}
                  onChange={(e) => setNewLot({ ...newLot, productionDate: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddLot}
                className="bg-[#4a7c59] hover:bg-[#3a6147] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-[#e8f0e8] hover:bg-[#d8e8d8] text-[#2d3a2e] px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#4a7c59] text-white">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">Lot</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold">Arôme</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold">Format</th>
                  <th className="px-5 py-4 text-center text-sm font-semibold">Qté</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold">Prod.</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold">DLV</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold">DLC</th>
                  <th className="px-5 py-4 text-center text-sm font-semibold">Statut</th>
                  <th className="px-5 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f0e8]">
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#6b9e78] text-lg">
                      Aucun lot en stock
                    </td>
                  </tr>
                ) : (
                  filteredLots.map((lot, index) => {
                    const status = getStatus(lot);
                    return (
                      <tr key={lot.id} className={`hover:bg-[#f5f8f5] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafefa]'}`}>
                        <td className="px-5 py-4 text-sm text-[#6b9e78] font-mono">#{lot.id.slice(-6)}</td>
                        <td className="px-5 py-4 font-medium text-[#2d3a2e]">{lot.arome}</td>
                        <td className="px-5 py-4 text-[#2d3a2e]">{lot.format}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-[#4a7c59] text-white font-bold rounded-full">
                            {lot.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#6b9e78] text-sm">{formatDate(lot.productionDate)}</td>
                        <td className="px-5 py-4 text-[#6b9e78] text-sm">{formatDate(lot.saleLimitDate)}</td>
                        <td className="px-5 py-4 text-[#6b9e78] text-sm">{formatDate(lot.consumptionLimitDate)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusStyles(status)}`}>
                            {status === 'ok' ? 'OK' : status === 'warning' ? 'DLV passée' : 'Expiré'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {showSellForm === lot.id ? (
                            <div className="flex items-center gap-2 justify-center">
                              <input
                                type="number"
                                min="1"
                                max={lot.quantity}
                                className="w-16 px-2 py-1.5 border border-[#e8f0e8] rounded-lg text-center text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                                value={sellQty}
                                onChange={(e) => setSellQty(parseInt(e.target.value) || 1)}
                              />
                              <button
                                onClick={() => handleSell(lot.id)}
                                className="text-[#4a7c59] hover:text-[#3a6147] font-bold px-2"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setShowSellForm(null)}
                                className="text-[#6b9e78] hover:text-[#2d3a2e] font-bold px-2"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => setShowSellForm(lot.id)}
                                className="text-[#4a7c59] hover:text-[#3a6147] font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-[#e8f0e8] transition-colors"
                              >
                                Vendre
                              </button>
                              <button
                                onClick={() => handleDeleteLot(lot.id)}
                                className="text-[#c75050] hover:text-[#a84040] font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-[#fce8e8] transition-colors"
                              >
                                Supprimer
                              </button>
                              <button
                                onClick={() => setEditingLot(lot)}
                                className="text-[#8b7355] hover:text-[#6b5335] font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                              >
                                Modifier
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

        {editingLot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-[#2d3a2e] mb-5">Modifier le lot #{editingLot.id}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                    value={editingLot.quantity}
                    onChange={(e) => setEditingLot({ ...editingLot, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2d3a2e] mb-2">Date production</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-[#f5f8f5] border border-[#e8f0e8] rounded-lg text-[#2d3a2e] focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                    value={editingLot.productionDate}
                    onChange={(e) => setEditingLot({ ...editingLot, productionDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleEditLot}
                  className="flex-1 bg-[#8b7355] hover:bg-[#6b5335] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingLot(null)}
                  className="flex-1 bg-[#e8f0e8] hover:bg-[#d8e8d8] text-[#2d3a2e] px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#2d3a2e] mb-4">Gestion des arômes</h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Nouvel arôme"
                  className="flex-1 px-4 py-2.5 border border-[#e8f0e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newArome}
                  onChange={(e) => setNewArome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddArome()}
                />
                <button
                  onClick={handleAddArome}
                  className="bg-[#4a7c59] hover:bg-[#3a6147] text-white px-4 py-2 rounded-lg font-medium"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {aromas.map(a => (
                  <div key={a} className="flex items-center gap-2 bg-[#f5f8f5] px-3 py-2 rounded-lg">
                    <span className="text-[#2d3a2e]">{a}</span>
                    <button
                      onClick={() => handleRemoveArome(a)}
                      className="text-[#c75050] hover:text-[#a84040]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#2d3a2e] mb-4">Gestion des formats</h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Nouveau format (ex: 0.33l)"
                  className="flex-1 px-4 py-2.5 border border-[#e8f0e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFormat()}
                />
                <button
                  onClick={handleAddFormat}
                  className="bg-[#4a7c59] hover:bg-[#3a6147] text-white px-4 py-2 rounded-lg font-medium"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formats.map(f => (
                  <div key={f} className="flex items-center gap-2 bg-[#f5f8f5] px-3 py-2 rounded-lg">
                    <span className="text-[#2d3a2e]">{f}</span>
                    <button
                      onClick={() => handleRemoveFormat(f)}
                      className="text-[#c75050] hover:text-[#a84040]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
