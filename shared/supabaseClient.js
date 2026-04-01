window.DevSupabase = (() => {
  const { DevConfig, DevSession } = window;

  if (!window.supabase) {
    console.error('Supabase CDN não carregou.');
    return {
      client: null,
      authReady: Promise.resolve(false)
    };
  }

  const client = window.supabase.createClient(
    DevConfig.supabaseUrl,
    DevConfig.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  function getTokensFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      return { access_token, refresh_token };
    }

    return null;
  }

  async function bootstrapAuth() {
    try {
      const tokensFromUrl = getTokensFromUrl();

      if (tokensFromUrl) {
        const { data, error } = await client.auth.setSession(tokensFromUrl);

        if (error) {
          console.warn('Erro ao aplicar sessão vinda da URL', error);
          return false;
        }

        console.log('Tokens recebidos via URL:', tokensFromUrl);

        window.history.replaceState({}, document.title, window.location.pathname);

        return !!data?.session?.access_token;
      }

      const stored = DevSession?.getSession?.();

      const accessToken = stored?.session?.access_token || '';
      const refreshToken = stored?.session?.refresh_token || '';

      if (!accessToken || !refreshToken) {
        const { data } = await client.auth.getSession();
        return !!data?.session?.access_token;
      }

      const { data: currentSession } = await client.auth.getSession();

      if (currentSession?.session?.access_token) {
        return true;
      }

      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.warn('Não foi possível restaurar sessão do Supabase a partir da sessão salva.', error);
        return false;
      }

      return !!data?.session?.access_token;
    } catch (error) {
      console.warn('Falha ao iniciar sessão auth do Supabase.', error);
      return false;
    }
  }

  const authReady = bootstrapAuth();

  client.auth.onAuthStateChange(async (_event, session) => {
    try {
      if (!session?.access_token || !session?.refresh_token) return;

      const stored = DevSession?.getSession?.();

      if (!stored) return;

      DevSession.persistSession({
        ...stored,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token
        }
      });
    } catch (error) {
      console.warn('Falha ao sincronizar sessão do Supabase com a sessão local.', error);
    }
  });

  return { client, authReady };
})();