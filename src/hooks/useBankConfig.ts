'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BankConfig {
  bankName: string;
  accountType: string;
  accountNumber: string;
  rut: string;
  holderName: string;
  email: string;
}

const DEFAULT_BANK_CONFIG: BankConfig = {
  bankName: 'Banco de Chile',
  accountType: 'Cuenta Corriente',
  accountNumber: '123-456-789-01',
  rut: '12.345.678-9',
  holderName: 'Importadora FyD SpA',
  email: 'pagos@importadorafyd.cl'
};

export function useBankConfig() {
  const [bankConfig, setBankConfig] = useState<BankConfig>(DEFAULT_BANK_CONFIG);
  const [loading, setLoading] = useState(true);

  // Load bank configuration from Firebase
  useEffect(() => {
    const loadBankConfig = async () => {
      try {
        const docRef = doc(db, 'siteConfig', 'bank_details');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBankConfig({
            bankName: data.bankName || DEFAULT_BANK_CONFIG.bankName,
            accountType: data.accountType || DEFAULT_BANK_CONFIG.accountType,
            accountNumber: data.accountNumber || DEFAULT_BANK_CONFIG.accountNumber,
            rut: data.rut || DEFAULT_BANK_CONFIG.rut,
            holderName: data.holderName || DEFAULT_BANK_CONFIG.holderName,
            email: data.email || DEFAULT_BANK_CONFIG.email
          });
        } else {
          // Document doesn't exist, use defaults
          setBankConfig(DEFAULT_BANK_CONFIG);
        }
      } catch (error) {
        // Log only if it's not a permission error (permission errors are expected for non-admin users)
        const isPermissionError = error instanceof Error &&
          (error.message.includes('permission') || error.message.includes('insufficient'));

        if (!isPermissionError) {
          console.error('Error loading bank config:', error);
        }

        // If there's an error (like permissions), use default config
        setBankConfig(DEFAULT_BANK_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadBankConfig();
  }, []);

  // Update bank configuration
  const updateBankConfig = async (newConfig: BankConfig) => {
    try {
      const docRef = doc(db, 'siteConfig', 'bank_details');
      await setDoc(docRef, newConfig, { merge: true });
      setBankConfig(newConfig);
    } catch (error) {
      console.error('Error updating bank config:', error);
      throw error;
    }
  };

  return {
    bankConfig,
    loading,
    updateBankConfig
  };
}
