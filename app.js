(function () {
  const { DevRouter, DevAuth, DevConfig, DevSession } = window;

  (async function () {
  const { DevRouter, DevAuth, DevConfig, DevSession } = window;

  const session = await DevAuth.requireAccess();
  if (!session) return;

  const helloUser = document.getElementById('helloUser');
  const environmentChip = document.getElementById('environmentChip');
  const btnGoDashboard = document.getElementById('btnGoDashboard');
  const btnLogout = document.getElementById('btnLogout');

  if (helloUser) {
    helloUser.textContent = `Olá, ${session.user.name}`;
  }

  if (environmentChip) {
    environmentChip.textContent = `Ambiente: ${DevConfig.environmentName}`;
  }

  if (btnGoDashboard) {
    btnGoDashboard.addEventListener('click', () => {
      DevRouter.navigate('dashboard');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await DevAuth.logout();
    });
  }

  DevRouter.bindNav();
  window.addEventListener('hashchange', DevRouter.render);

  if (!window.location.hash) {
    DevRouter.navigate('dashboard');
  } else {
    DevRouter.render();
  }

  window.__DEVPANEL__ = {
    session,
    refreshSession() {
      return DevSession.getSession();
    }
  };
})();

  const helloUser = document.getElementById('helloUser');
  const environmentChip = document.getElementById('environmentChip');
  const btnGoDashboard = document.getElementById('btnGoDashboard');
  const btnLogout = document.getElementById('btnLogout');

  helloUser.textContent = `Olá, ${session.user.name}`;
  environmentChip.textContent = `Ambiente: ${DevConfig.environmentName}`;

  btnGoDashboard.addEventListener('click', () => {
    DevRouter.navigate('dashboard');
  });

  btnLogout.addEventListener('click', () => {
    DevAuth.logout();
  });

  DevRouter.bindNav();
  window.addEventListener('hashchange', DevRouter.render);

  if (!window.location.hash) {
    DevRouter.navigate('dashboard');
  } else {
    DevRouter.render();
  }

  window.__DEVPANEL__ = {
    session,
    refreshSession() {
      return DevSession.getSession();
    }
  };
})();