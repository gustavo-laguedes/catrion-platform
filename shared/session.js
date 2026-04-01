window.DevSession = (() => {
  const { DevConfig } = window;

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function getPortalSession() {
    return safeParse(localStorage.getItem(DevConfig.sharedPortalSessionKey));
  }

  function getLocalSession() {
    return safeParse(localStorage.getItem(DevConfig.localSessionKey));
  }

  function normalizePortalSession(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const user = raw.user || {};
    const context = raw.context || {};
    const session = raw.session || {};

    return {
      user: {
        id: user.id || '',
        name: user.name || user.nome || 'Usuário',
        email: user.email || ''
      },
      session: {
        access_token: session.access_token || '',
        refresh_token: session.refresh_token || ''
      },
      context: {
        active_tenant_id: context.active_tenant_id || 'catrion',
        allowed_modules: Array.isArray(context.allowed_modules) ? context.allowed_modules : [],
        global_role: context.global_role || ''
      }
    };
  }

  function getSession() {
    const local = getLocalSession();
    if (local) return local;

    const portal = normalizePortalSession(getPortalSession());
    if (portal) {
      persistSession(portal);
      return portal;
    }

    if (DevConfig.useMockAuth) {
      const mock = buildMockSession();
      persistSession(mock);
      return mock;
    }

    return null;
  }

  function persistSession(data) {
    localStorage.setItem(DevConfig.localSessionKey, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(DevConfig.localSessionKey);
  }

  function buildMockSession() {
    return {
      user: {
        id: 'mock-admin-1',
        name: 'Gustavo Guedes',
        email: 'gustavo@catrion.com.br'
      },
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh'
      },
      context: {
        active_tenant_id: 'catrion',
        allowed_modules: ['devpanel', 'core', 'gate', 'line'],
        global_role: 'admin_catrion'
      }
    };
  }

  return {
    getSession,
    persistSession,
    clearSession
  };
})();