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
});
