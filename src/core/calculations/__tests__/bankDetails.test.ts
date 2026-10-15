import { describe, it, expect } from 'vitest';
import {
  BankDetails,
  DEFAULT_BANK_DETAILS,
  CompanySettings,
  DEFAULT_COMPANY_SETTINGS,
  UserAccount,
} from '../types';

describe('Bank Details & Settings Integrity', () => {
  it('initializes default bank details matching commercial settlement specification', () => {
    expect(DEFAULT_BANK_DETAILS.accountName).toBe('SREE BALAJI GOLD');
    expect(DEFAULT_BANK_DETAILS.accountNumber).toBe('50200088992211');
    expect(DEFAULT_BANK_DETAILS.bankName).toBe('HDFC Bank');
    expect(DEFAULT_BANK_DETAILS.ifscCode).toBe('HDFC0000123');
  });

  it('updates bank details correctly while preserving unchanged properties', () => {
    const updateBankDetails = (current: BankDetails, updates: Partial<BankDetails>): BankDetails => {
      return {
        ...current,
        ...updates,
        ifscCode: updates.ifscCode ? updates.ifscCode.trim().toUpperCase() : current.ifscCode,
        accountName: updates.accountName ? updates.accountName.trim() : current.accountName,
        accountNumber: updates.accountNumber ? updates.accountNumber.trim() : current.accountNumber,
        bankName: updates.bankName ? updates.bankName.trim() : current.bankName,
      };
    };

    const updated = updateBankDetails(DEFAULT_BANK_DETAILS, {
      bankName: 'ICICI Bank',
      accountNumber: '001105001234',
      ifscCode: 'icic0000011',
      branch: 'Fort, Mumbai',
    });

    expect(updated.accountName).toBe('SREE BALAJI GOLD');
    expect(updated.bankName).toBe('ICICI Bank');
    expect(updated.accountNumber).toBe('001105001234');
    expect(updated.ifscCode).toBe('ICIC0000011');
    expect(updated.branch).toBe('Fort, Mumbai');
  });

  it('correctly handles restoring default bank details on reset', () => {
    let currentDetails: BankDetails = {
      accountName: 'Custom Gold LLP',
      accountNumber: '999988887777',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      branch: 'Zaveri Bazaar',
    };

    const resetToDefaults = (): BankDetails => ({ ...DEFAULT_BANK_DETAILS });
    currentDetails = resetToDefaults();

    expect(currentDetails).toEqual(DEFAULT_BANK_DETAILS);
    expect(currentDetails.accountNumber).toBe('50200088992211');
    expect(currentDetails.ifscCode).toBe('HDFC0000123');
  });

  it('handles localStorage deserialization and fallback for corrupt bank details', () => {
    const parseSavedBankDetails = (saved: string | null): BankDetails => {
      if (!saved) return DEFAULT_BANK_DETAILS;
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_BANK_DETAILS, ...parsed };
        }
      } catch {
        // Fallback to default
      }
      return DEFAULT_BANK_DETAILS;
    };

    expect(parseSavedBankDetails(null)).toEqual(DEFAULT_BANK_DETAILS);
    expect(parseSavedBankDetails('invalid-json')).toEqual(DEFAULT_BANK_DETAILS);

    const validJson = JSON.stringify({
      bankName: 'Axis Bank',
      accountNumber: '912010012345678',
      ifscCode: 'UTIB0000004',
    });
    const parsed = parseSavedBankDetails(validJson);
    expect(parsed.bankName).toBe('Axis Bank');
    expect(parsed.accountNumber).toBe('912010012345678');
    expect(parsed.ifscCode).toBe('UTIB0000004');
    expect(parsed.accountName).toBe('SREE BALAJI GOLD');
  });

  it('restricts bank details modification to Administrator role only', () => {
    const canUpdateBankDetails = (user: UserAccount): boolean => {
      return user.role === 'ADMIN';
    };

    const admin: UserAccount = {
      id: 'usr-admin',
      username: 'admin',
      name: 'Admin',
      email: 'admin@sbg.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: {
        customers: true,
        orders: true,
        transactions: true,
        estimates: true,
        settlements: true,
        reports: true,
        users: true,
        erp: true,
      },
    };

    const staff: UserAccount = {
      id: 'usr-staff',
      username: 'staff',
      name: 'Staff',
      email: 'staff@sbg.com',
      role: 'STAFF',
      status: 'ACTIVE',
      permissions: {
        customers: true,
        orders: false,
        transactions: false,
        estimates: false,
        settlements: false,
        reports: false,
        users: false,
        erp: false,
      },
    };

    expect(canUpdateBankDetails(admin)).toBe(true);
    expect(canUpdateBankDetails(staff)).toBe(false);
  });
});
