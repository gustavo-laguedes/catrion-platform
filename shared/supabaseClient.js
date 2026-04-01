window.DevSupabase = (() => {
  const { DevConfig, DevSession } = window;
  const URL_TOKEN_HANDOFF_KEY = "catrion.devpanel.urltokens";

  if (!window.supabase) {
    console.error("Supabase CDN não carregou.");
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
        detectSessionInUrl: false
      }
    }
  );

  function stripAuthTokensFromUrl() {
    const url = new URL(window.location.href);

    url.searchParams.delete("access_token");
    url.searchParams.delete("refresh_token");

    const next =
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
      (url.hash || "");

    window.history.replaceState({}, document.title, next);
  }

  function stashTokensFromUrlIfPresent() {
    const params = new URLSearchParams(window.location.search);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      return;
    }

    sessionStorage.setItem(
      URL_TOKEN_HANDOFF_KEY,
      JSON.stringify({ access_token, refresh_token })
    );

    stripAuthTokensFromUrl();
  }

  function consumeStashedUrlTokens() {
    const raw = sessionStorage.getItem(URL_TOKEN_HANDOFF_KEY);
    if (!raw) return null;

    sessionStorage.removeItem(URL_TOKEN_HANDOFF_KEY);

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token && parsed?.refresh_token) {
        return parsed;
      }
    } catch (error) {
      console.warn("Falha ao interpretar tokens temporários da URL.", error);
    }

    return null;
  }

  async function hasCurrentClientSession() {
    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        console.warn("Erro ao consultar sessão atual do client.", error);
        return false;
      }

      return !!data?.session?.access_token;
    } catch (error) {
      console.warn("Falha ao verificar sessão atual do client.", error);
      return false;
    }
  }

  async function applyTokens(tokens) {
    if (!tokens?.access_token || !tokens?.refresh_token) {
      return false;
    }

    try {
      const { data, error } = await client.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });

      if (error) {
        console.warn("Erro ao aplicar sessão vinda do portal.", error);
        return false;
      }

      return !!data?.session?.access_token;
    } catch (error) {
      console.warn("Falha ao aplicar sessão vinda do portal.", error);
      return false;
    }
  }

  async function restoreFromLocalDevSession() {
    try {
      const stored = DevSession?.getSession?.();

      const accessToken = stored?.session?.access_token || "";
      const refreshToken = stored?.session?.refresh_token || "";

      if (!accessToken || !refreshToken) {
        return false;
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
        console.warn("Não foi possível restaurar sessão do Supabase a partir da sessão salva.", error);
        return false;
      }

      return !!data?.session?.access_token;
    } catch (error) {
      console.warn("Falha ao restaurar sessão local do Dev Panel.", error);
      return false;
    }
  }

  async function bootstrapAuth() {
    try {
      stashTokensFromUrlIfPresent();

      const alreadyAuthenticated = await hasCurrentClientSession();
      if (alreadyAuthenticated) {
        return true;
      }

      const handoffTokens = consumeStashedUrlTokens();
      if (handoffTokens) {
        const applied = await applyTokens(handoffTokens);
        if (applied) {
          return true;
        }
      }

      const restored = await restoreFromLocalDevSession();
      if (restored) {
        return true;
      }

      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    } catch (error) {
      console.warn("Falha ao iniciar sessão auth do Supabase.", error);
      stripAuthTokensFromUrl();
      sessionStorage.removeItem(URL_TOKEN_HANDOFF_KEY);
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
      console.warn("Falha ao sincronizar sessão do Supabase com a sessão local.", error);
    }
  });

  return { client, authReady };
})();