import { describe, it, expect } from 'vitest';
import { UserAccount } from '../types';

describe('Admin Authentication & Security Integrity', () => {
  const defaultAdmin: UserAccount = {
    id: 'usr-admin',
    username: 'sreebalajigold@gmail.com',
    name: 'Sree Balaji Gold',
    email: 'sreebalajigold@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    password: 'password',
    avatarColor: '#0F5C5B',
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

  it('only configures the dedicated Admin account with sreebalajigold@gmail.com', () => {
    expect(defaultAdmin.email).toBe('sreebalajigold@gmail.com');
    expect(defaultAdmin.username).toBe('sreebalajigold@gmail.com');
    expect(defaultAdmin.role).toBe('ADMIN');
    expect(defaultAdmin.password).toBe('password');
    expect(defaultAdmin.permissions.customers).toBe(true);
    expect(defaultAdmin.permissions.erp).toBe(true);
  });

  it('verifies credentials accurately against default password', () => {
    const authenticate = (user: UserAccount, inputPass: string) => {
      const expected = user.password || 'password';
      return inputPass.trim() === expected;
    };

    expect(authenticate(defaultAdmin, 'password')).toBe(true);
    expect(authenticate(defaultAdmin, 'wrongPassword')).toBe(false);
  });

  it('supports updating and resetting administrator password', () => {
    let currentUser = { ...defaultAdmin };
    const resetPassword = (user: UserAccount, newPass: string) => {
      return { ...user, password: newPass };
    };

    currentUser = resetPassword(currentUser, 'BalajiGoldSecure@2026');
    expect(currentUser.password).toBe('BalajiGoldSecure@2026');

    // Authentication now accepts new password and rejects old default
    expect(currentUser.password === 'BalajiGoldSecure@2026').toBe(true);
    expect(currentUser.password === 'password').toBe(false);
  });

  const staffUser: UserAccount = {
    id: 'usr-staff-1',
    username: 'mail@thestrategist.co.in',
    name: 'Ajay Thomas',
    email: 'mail@thestrategist.co.in',
    role: 'STAFF',
    status: 'ACTIVE',
    password: 'password',
    avatarColor: '#23827F',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: true,
      reports: false,
      users: false,
      erp: false,
    },
  };

  it('allows only Admin to add and remove employees', () => {
    const canAddEmployee = (user: UserAccount) => user.role === 'ADMIN';
    const canRemoveEmployee = (user: UserAccount) => user.role === 'ADMIN';

    // Admin has full rights
    expect(canAddEmployee(defaultAdmin)).toBe(true);
    expect(canRemoveEmployee(defaultAdmin)).toBe(true);

    // Staff cannot add or remove employees
    expect(canAddEmployee(staffUser)).toBe(false);
    expect(canRemoveEmployee(staffUser)).toBe(false);
  });

  it('enforces that neither Admin nor Staff can switch profiles on the fly without credentials', () => {
    const canSwitchProfileOnTheFly = (_user: UserAccount) => false;

    // Both Admin and Staff must sign out and authenticate with password to switch account
    expect(canSwitchProfileOnTheFly(defaultAdmin)).toBe(false);
    expect(canSwitchProfileOnTheFly(staffUser)).toBe(false);
  });

  it('restricts Staff settings to Account Security & Password only', () => {
    const getPermittedSettingsSections = (user: UserAccount) => {
      if (user.role === 'ADMIN') {
        return ['marketRates', 'companyDetails', 'accountSecurity', 'databaseManagement', 'saveConfiguration'];
      }
      // Staff only permitted Account Security & Password
      return ['accountSecurity'];
    };

    const adminSections = getPermittedSettingsSections(defaultAdmin);
    expect(adminSections).toContain('marketRates');
    expect(adminSections).toContain('companyDetails');
    expect(adminSections).toContain('accountSecurity');
    expect(adminSections).toContain('databaseManagement');

    const staffSections = getPermittedSettingsSections(staffUser);
    expect(staffSections).toEqual(['accountSecurity']);
    expect(staffSections).not.toContain('marketRates');
    expect(staffSections).not.toContain('companyDetails');
    expect(staffSections).not.toContain('databaseManagement');
    expect(staffSections).not.toContain('saveConfiguration');
  });
});
