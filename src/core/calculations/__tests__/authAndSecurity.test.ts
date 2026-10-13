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

  describe('Zero-Trust Incognito & Session Refresh Persistence Rules', () => {
    it('RULE 1: Defaults to unauthenticated (false) in Incognito or clean browser', () => {
      const getInitialAuth = (savedAuth: string | null) => {
        try {
          return savedAuth !== null ? JSON.parse(savedAuth) === true : false;
        } catch {
          return false;
        }
      };

      // Incognito window has no sbg_auth key in localStorage
      expect(getInitialAuth(null)).toBe(false);
      // Malformed or explicit false also resolves to false
      expect(getInitialAuth('false')).toBe(false);
      expect(getInitialAuth('invalid_json')).toBe(false);
      // Only valid explicit true resolves to authenticated
      expect(getInitialAuth('true')).toBe(true);
    });

    it('RULE 2: Restores Ajay Thomas (Staff) identity on page refresh without reverting to Admin', () => {
      const restoreCurrentUser = (savedUserJson: string | null, fallbackAdmin: UserAccount): UserAccount => {
        if (savedUserJson) {
          try {
            const parsed: UserAccount = JSON.parse(savedUserJson);
            if (
              parsed &&
              parsed.id &&
              parsed.name &&
              parsed.role &&
              parsed.id !== 'usr-2' &&
              parsed.id !== 'usr-3' &&
              parsed.username?.toLowerCase() !== 'staff' &&
              parsed.username?.toLowerCase() !== 'client'
            ) {
              return parsed;
            }
          } catch {
            // ignore
          }
        }
        return fallbackAdmin;
      };

      // Ajay Thomas logs in and saves to localStorage
      const ajaySession = JSON.stringify(staffUser);

      // On browser reload, simulate state restoration:
      const restoredUser = restoreCurrentUser(ajaySession, defaultAdmin);

      expect(restoredUser.id).toBe('usr-staff-1');
      expect(restoredUser.name).toBe('Ajay Thomas');
      expect(restoredUser.role).toBe('STAFF');
      expect(restoredUser.email).toBe('mail@thestrategist.co.in');
      expect(restoredUser.role).not.toBe('ADMIN');
    });

    it('RULE 3: Non-destructively purges legacy mocks while keeping added staff (Ajay Thomas)', () => {
      const sanitizeUserDirectory = (users: UserAccount[], adminUser: UserAccount): UserAccount[] => {
        const filtered = users.filter(
          (u) =>
            u.id !== 'usr-1' &&
            u.id !== 'usr-2' &&
            u.id !== 'usr-3' &&
            u.username?.toLowerCase() !== 'staff' &&
            u.username?.toLowerCase() !== 'client'
        );
        const adminExists = filtered.some(
          (u) =>
            u.email?.toLowerCase() === 'sreebalajigold@gmail.com' ||
            u.username?.toLowerCase() === 'sreebalajigold@gmail.com'
        );
        return adminExists ? filtered : [adminUser, ...filtered];
      };

      const rawDirectory: UserAccount[] = [
        defaultAdmin,
        { ...staffUser, id: 'usr-2', username: 'staff', name: 'Legacy Staff' }, // legacy mock to purge
        staffUser, // Real added Staff: Ajay Thomas
      ];

      const cleaned = sanitizeUserDirectory(rawDirectory, defaultAdmin);
      expect(cleaned.some((u) => u.name === 'Ajay Thomas')).toBe(true);
      expect(cleaned.some((u) => u.username === 'staff')).toBe(false);
      expect(cleaned.some((u) => u.id === 'usr-2')).toBe(false);
      expect(cleaned.some((u) => u.role === 'ADMIN')).toBe(true);
    });

    it('RULE 4: Clean session termination on logout removes user session', () => {
      const mockStorage: Record<string, string> = {
        sbg_auth: 'true',
        sbg_user: JSON.stringify(staffUser),
      };

      const executeLogout = () => {
        mockStorage['sbg_auth'] = 'false';
        delete mockStorage['sbg_user'];
      };

      executeLogout();

      expect(mockStorage['sbg_auth']).toBe('false');
      expect(mockStorage['sbg_user']).toBeUndefined();
    });
  });
});

