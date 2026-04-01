window.DevAuth = (() => {
  const { DevConfig, DevSession, DevSupabase } = window;

  function getRedirectTarget() {
    const current = window.location.href;
    return encodeURIComponent(current);
  }

  function buildPortalRedirectUrl() {
    return `${DevConfig.portalLoginUrl}?redirect=${getRedirectTarget()}`;
  }

  function isAuthenticated(session) {
    return !!(session && session.user && session.user.id);
  }

  function hasDevPanelAccess(session) {
    if (!session?.context) return false;

    const role = session.context.global_role;
    const allowedModules = session.context.allowed_modules || [];

    return role === 'admin_catrion' && allowedModules.includes('devpanel');
  }

  async function ensureSupabaseAuthSession() {
    const client = DevSupabase?.client;
    if (!client) return false;

    try {
      if (DevSupabase?.authReady) {
        await DevSupabase.authReady;
      }
    } catch (error) {
      console.warn('Erro aguardando bootstrap da sessão auth.', error);
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.warn('Erro ao consultar sessão do Supabase Auth.', error);
      return false;
    }

    return !!data?.session?.access_token;
  }

  async function buildSessionFromSupabase() {
    const client = DevSupabase?.client;
    if (!client) return null;

    try {
      const [{ data: sessionData }, { data: userData }] = await Promise.all([
        client.auth.getSession(),
        client.auth.getUser()
      ]);

      const authSession = sessionData?.session;
      const authUser = userData?.user;

      if (!authSession || !authUser) {
        return null;
      }

      const bootstrappedSession = {
        user: {
          id: authUser.id,
          name:
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            authUser.email ||
            'Usuário',
          email: authUser.email || ''
        },
        session: {
          access_token: authSession.access_token || '',
          refresh_token: authSession.refresh_token || ''
        },
        context: {
          active_tenant_id: 'catrion',
          allowed_modules: ['devpanel'],
          global_role: 'admin_catrion'
        }
      };

      DevSession.persistSession(bootstrappedSession);
      return bootstrappedSession;
    } catch (error) {
      console.warn('Erro ao montar sessão do Dev Panel a partir do Supabase.', error);
      return null;
    }
  }

  async function requireAccess() {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    let session = DevSession.getSession();

    if (isLocalhost) {
      console.warn('Dev Panel em localhost: autenticação externa bloqueada temporariamente para desenvolvimento local.');

      return session || {
        user: {
          id: 'debug-local',
          name: 'Admin Local',
          email: 'debug@local'
        },
        session: {
          access_token: '',
          refresh_token: ''
        },
        context: {
          active_tenant_id: 'catrion',
          allowed_modules: ['devpanel'],
          global_role: 'admin_catrion'
        }
      };
    }

    const hasSupabaseSession = await ensureSupabaseAuthSession();

    if (!session && hasSupabaseSession) {
      session = await buildSessionFromSupabase();
    }

    if (!isAuthenticated(session)) {
      window.location.href = buildPortalRedirectUrl();
      return null;
    }

    if (!hasDevPanelAccess(session)) {
      document.getElementById('app').innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Acesso negado</div>
            <div class="empty-text">
              Seu usuário não possui permissão para acessar o Dev Panel.
            </div>
          </div>
        </section>
      `;
      return null;
    }

    if (!hasSupabaseSession) {
      window.location.href = buildPortalRedirectUrl();
      return null;
    }

    return session;
  }

  async function logout() {
    try {
      await DevSupabase?.client?.auth?.signOut();
    } catch (error) {
      console.warn('Erro ao encerrar sessão do Supabase.', error);
    }

    DevSession.clearSession();
    window.location.href = buildPortalRedirectUrl();
  }

  return {
    requireAccess,
    logout
  };
})();