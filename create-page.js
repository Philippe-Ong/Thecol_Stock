const fs = require('fs');
const content = `'use client';

import { useState, useEffect } from 'react';
import { Lot, Arome, Format, AROMES, FORMATS, calculateDates, getStatus } from '@/lib/types';
import { getLots, addLot, removeQuantity, deleteLot } from '@/lib/storage';

export default function Home() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState<string | null>(null);
  const [filterArome, setFilterArome] = useState<Arome | ''>('');
  const [filterFormat, setFilterFormat] = useState<Format | ''>('');
  
  const [newLot, setNewLot] = useState({
    arome: 'hibiscus' as Arome,
    format: '0.5l' as Format,
    quantity: 1,
    productionDate: new Date().toISOString().split('T')[0],
  });

  const [sellQty, setSellQty] = useState(1);

  useEffect(() => {
    setLots(getLots());
  }, []);

  const handleAddLot = () => {
    const dates = calculateDates(newLot.productionDate);
    const lot: Lot = {
      id: Date.now().toString(),
      ...newLot,
      ...dates,
    };
    const updated = addLot(lot);
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

  const filteredLots = lots.filter(lot => {
    if (filterArome && lot.arome !== filterArome) return false;
    if (filterFormat && lot.format !== filterFormat) return false;
    return true;
  });

  const totalBottles = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const expiredLots = lots.filter(l => getStatus(l) === 'expired').length;
  const warningLots = lots.filter(l => getStatus(l) === 'warning').length;

  const getStatusColor = (status: 'ok' | 'warning' | 'expired') => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      case 'expired': return 'bg-red-100 text-red-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CH');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestion Stock Thé Froid</h1>
          <p className="text-gray-600">5 arômes × 3 formats</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total bouteilles</p>
            <p className="text-3xl font-bold text-blue-600">{totalBottles}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Expirés (DLC)</p>
            <p className="text-3xl font-bold text-red-600">{expiredLots}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Proche DLV</p>
            <p className="text-3xl font-bold text-orange-600">{warningLots}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <select
                className="px-3 py-2 border rounded-lg"
                value={filterArome}
                onChange={(e) => setFilterArome(e.target.value as Arome | '')}
              >
                <option value="">Tous les arômes</option>
                {AROMES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border rounded-lg"
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value as Format | '')}
              >
                <option value="">Tous les formats</option>
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Nouveau lot
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Ajouter un nouveau lot</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Arôme</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newLot.arome}
                  onChange={(e) => setNewLot({ ...newLot, arome: e.target.value as Arome })}
                >
                  {AROMES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newLot.format}
                  onChange={(e) => setNewLot({ ...newLot, format: e.target.value as Format })}
                >
                  {FORMATS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newLot.quantity}
                  onChange={(e) => setNewLot({ ...newLot, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date production</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newLot.productionDate}
                  onChange={(e) => setNewLot({ ...newLot, productionDate: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddLot}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Lot</th>
                <th className="px-4 py-3 text-left">Arôme</th>
                <th className="px-4 py-3 text-left">Format</th>
                <th className="px-4 py-3 text-center">Qté</th>
                <th className="px-4 py-3 text-left">Prod.</th>
                <th className="px-4 py-3 text-left">DLV</th>
