window.DevAuth = (() => {
  function getConfig() {
    return window.DevConfig;
  }

  function getSessionStore() {
    return window.DevSession;
  }

  function getSupabase() {
    return window.DevSupabase;
  }

  function getRedirectTarget() {
    const current = window.location.href;
    return encodeURIComponent(current);
  }

  function buildPortalRedirectUrl() {
    const DevConfig = getConfig();
    return `${DevConfig.portalLoginUrl}?redirect=${getRedirectTarget()}`;
  }

  function isAuthenticated(session) {
    return !!(session && session.user && session.user.id);
  }

  function hasDevPanelAccess(session) {
    if (!session?.context) return false;

    const role = session.context.global_role;
    const allowedModules = session.context.allowed_modules || [];

    return role === "admin_catrion" && allowedModules.includes("devpanel");
  }

  async function ensureSupabaseAuthSession() {
    const DevSupabase = getSupabase();
    const client = DevSupabase?.client;

    if (!client) {
      console.warn("[DevAuth] DevSupabase.client indisponível.");
      return false;
    }

    try {
      if (DevSupabase?.authReady) {
        await DevSupabase.authReady;
      }
    } catch (error) {
      console.warn("[DevAuth] Erro aguardando authReady.", error);
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.warn("[DevAuth] Erro ao consultar sessão do Supabase Auth.", error);
      return false;
    }

    return !!data?.session?.access_token;
  }

  async function buildSessionFromSupabase() {
    const DevSupabase = getSupabase();
    const DevSession = getSessionStore();
    const client = DevSupabase?.client;

    if (!client) {
      console.warn("[DevAuth] Não foi possível montar sessão: client indisponível.");
      return null;
    }

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
            "Usuário",
          email: authUser.email || ""
        },
        session: {
          access_token: authSession.access_token || "",
          refresh_token: authSession.refresh_token || ""
        },
        context: {
          active_tenant_id: "catrion",
          allowed_modules: ["devpanel"],
          global_role: "admin_catrion"
        }
      };

      DevSession.persistSession(bootstrappedSession);
      return bootstrappedSession;
    } catch (error) {
      console.warn("[DevAuth] Erro ao montar sessão a partir do Supabase.", error);
      return null;
    }
  }

  async function requireAccess() {
    const DevSession = getSessionStore();

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    let session = DevSession.getSession();

    const isLoggingOut = sessionStorage.getItem("devpanel:logging_out") === "true";
    const urlParams = new URLSearchParams(window.location.search);
    const hasIncomingTokens =
      urlParams.has("access_token") || urlParams.has("refresh_token");

    if (isLoggingOut && !session && !hasIncomingTokens) {
      console.warn("[DevAuth] Logout em andamento, bloqueando revalidação.");
      return null;
    }

    if (isLocalhost) {
      console.warn("Dev Panel em localhost: bypass local ativo.");
      return (
        session || {
          user: {
            id: "debug-local",
            name: "Admin Local",
            email: "debug@local"
          },
          session: {
            access_token: "",
            refresh_token: ""
          },
          context: {
            active_tenant_id: "catrion",
            allowed_modules: ["devpanel"],
            global_role: "admin_catrion"
          }
        }
      );
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
      document.getElementById("app").innerHTML = `
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

    sessionStorage.removeItem("devpanel:logging_out");

    return session;
  }

  async function logout() {
    const DevSupabase = getSupabase();
    const DevSession = getSessionStore();

    sessionStorage.setItem("devpanel:logging_out", "true");

    try {
      await DevSupabase?.client?.auth?.signOut();
    } catch (error) {
      console.warn("[DevAuth] Erro ao encerrar sessão do Supabase.", error);
    }

    DevSession.clearSession();

    window.location.href = buildPortalRedirectUrl();
  }

  return {
    requireAccess,
    logout
  };
})();