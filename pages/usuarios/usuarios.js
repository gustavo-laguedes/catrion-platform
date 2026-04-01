(function () {
  const { DevRouter, DevAPI, DevState } = window;

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Usuários</h1>
            <p class="page-subtitle">Gestão global de usuários, vínculos e acessos.</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando usuários...</div>
          </div>
        </div>
      </section>
    `;
  }

  function getFriendlyRoleLabel(roleKey, roleName) {
    if (roleKey === 'core_admin') return 'Administrador';
    if (roleKey === 'core_operador') return 'Operador';
    if (roleKey === 'core_visualizador') return 'Visualizador';
    return roleName || roleKey || '-';
  }

  function renderCompanyLinks(tenants, roles) {
    const coreRoles = (roles || []).filter((role) =>
      ['core_admin', 'core_operador', 'core_visualizador'].includes(role.role_key)
    );

    return tenants.map((tenant) => `
      <div class="user-company-block">
        <label class="check-item">
          <input type="checkbox" data-company-toggle="${tenant.tenantId}" />
          <span>${tenant.nome}</span>
        </label>

        <div class="user-company-config hidden" data-company-config="${tenant.tenantId}">
          <div class="field">
            <label class="field-label">Módulo</label>
            <select class="field-input field-select" data-company-module="${tenant.tenantId}">
              <option value="core">Core</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label">Papel no Core</label>
            <select class="field-input field-select" data-company-role="${tenant.tenantId}">
              <option value="">Selecione</option>
              ${coreRoles.map((role) => `
                <option value="${role.role_key}">${getFriendlyRoleLabel(role.role_key, role.role_name)}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderCreateModal(tenants, roles) {
    return `
      <div class="modal-overlay hidden" id="modalNovoUsuarioGlobal">
        <div class="modal-card modal-card-lg">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Novo usuário</h2>
              <p class="panel-subtitle">Cadastro global do usuário da plataforma</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalNovoUsuarioGlobal">✕</button>
          </div>

          <div class="panel-body">
            <form id="formNovoUsuarioGlobal" class="form-grid">
              <div class="field">
                <label class="field-label">Nome completo</label>
                <input class="field-input" name="fullName" placeholder="Pode ser preenchido depois pelo usuário" />
              </div>

              <div class="field">
                <label class="field-label">E-mail</label>
                <input class="field-input" name="email" type="email" required />
              </div>

              <div class="field">
                <label class="field-label">Status</label>
                <select class="field-input field-select" name="status">
                  <option value="ativo">ativo</option>
                  <option value="inativo">inativo</option>
                  <option value="bloqueado">bloqueado</option>
                </select>
              </div>

              <div class="field field-full">
                <label class="field-label">Empresas e acessos</label>
                <div class="user-company-list">
                  ${renderCompanyLinks(tenants, roles)}
                </div>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarNovoUsuarioGlobal">Cancelar</button>
                <button class="btn-primary" type="submit">Salvar usuário</button>
              </div>

              <div class="form-feedback field-full" id="feedbackNovoUsuarioGlobal"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

    function renderRows(users) {
    if (!users.length) {
      return `
        <tr>
          <td colspan="8">
            <div class="empty-inline">Nenhum usuário cadastrado ainda.</div>
          </td>
        </tr>
      `;
    }

    return users.map((user) => `
      <tr>
        <td class="col-avatar">
          <div class="user-table-avatar">
            ${user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="avatar de ${user.nome || 'usuário'}" />`
              : `<span>${(user.nome || 'U')[0]}</span>`
            }
          </div>
        </td>

        <td>
          <div class="table-main">${user.nome || '-'}</div>
          <div class="table-sub">${user.email || '-'}</div>
        </td>

        <td>
          <span class="status-badge status-${user.status || 'ativo'}">${user.status || '-'}</span>
        </td>

        <td>${user.tenantCount}</td>
        <td>${user.moduleCount}</td>
        <td>${user.isPlatformAdmin ? 'sim' : 'não'}</td>
        <td>${user.memberships.map((item) => item.tenantName).join(', ') || '-'}</td>

        <td class="table-actions">
          <button
            class="btn-ghost btn-sm"
            type="button"
            data-route="usuario"
            data-id="${user.id}"
          >
            Abrir
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderPage(users, tenants, roles, searchTerm = '') {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Usuários</h1>
            <p class="page-subtitle">Gestão global de usuários, vínculos e acessos.</p>
          </div>

          <div class="page-actions">
            <button class="btn-danger" type="button" id="btnAbrirModalExcluirUsuario">Excluir usuário</button>
            <button class="btn-primary" type="button" id="btnAbrirModalNovoUsuarioGlobal">+ Novo usuário</button>
          </div>
        </header>

        <article class="table-card">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Usuários cadastrados</h2>
              <p class="panel-subtitle">Base global de acesso da plataforma</p>
            </div>

            <div class="table-toolbar">
              <input
                class="table-search-input"
                id="usuariosSearchInput"
                type="search"
                placeholder="Buscar usuário, e-mail, empresa"
                value="${searchTerm}"
              />
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
      <th class="col-avatar"></th>
                  <th>Usuário</th>
                  <th>Status</th>
                  <th>Empresas</th>
                  <th>Módulos</th>
                  <th>Admin</th>
                  <th>Vínculos</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                ${renderRows(users)}
              </tbody>
            </table>
          </div>
        </article>

        ${renderCreateModal(tenants, roles)}

        <div class="modal-overlay hidden" id="modalExcluirUsuario">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2 class="panel-title">Excluir usuário</h2>
                <p class="panel-subtitle">Remover usuário global da plataforma</p>
              </div>

              <button class="modal-close" type="button" id="btnFecharModalExcluirUsuario">✕</button>
            </div>

            <div class="panel-body">
              <form id="formExcluirUsuario" class="form-grid">
                <div class="field field-full">
                  <label class="field-label">Selecione o usuário</label>
                  <select class="field-input field-select" name="userId" required>
                    <option value="">Selecione</option>
                    ${users.map((user) => `
                      <option value="${user.id}">
                        ${(user.nome || 'Usuário')} — ${user.email || '-'}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="field field-full">
                  <div class="danger-box">
                    Esta ação remove o perfil global do usuário e também seus vínculos com empresas e módulos.
                  </div>
                </div>

                <div class="field-actions field-full">
                  <button class="btn-ghost" type="button" id="btnCancelarExcluirUsuario">Cancelar</button>
                  <button class="btn-danger" type="submit">Excluir usuário</button>
                </div>

                <div class="form-feedback field-full" id="feedbackExcluirUsuario"></div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
  }

  function bindCompanyToggles() {
    document.querySelectorAll('[data-company-toggle]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const tenantId = checkbox.getAttribute('data-company-toggle');
        const box = document.querySelector(`[data-company-config="${tenantId}"]`);
        if (!box) return;
        box.classList.toggle('hidden', !checkbox.checked);
      });
    });
  }

  function bindModalNovoUsuario() {
    const btnOpen = document.getElementById('btnAbrirModalNovoUsuarioGlobal');
    const btnClose = document.getElementById('btnFecharModalNovoUsuarioGlobal');
    const btnCancel = document.getElementById('btnCancelarNovoUsuarioGlobal');
    const modal = document.getElementById('modalNovoUsuarioGlobal');

    if (btnOpen) btnOpen.addEventListener('click', () => openModal('modalNovoUsuarioGlobal'));
    if (btnClose) btnClose.addEventListener('click', () => closeModal('modalNovoUsuarioGlobal'));
    if (btnCancel) btnCancel.addEventListener('click', () => closeModal('modalNovoUsuarioGlobal'));

    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal('modalNovoUsuarioGlobal');
        }
      });
    }
  }

  function bindModalExcluirUsuario() {
    const btnOpen = document.getElementById('btnAbrirModalExcluirUsuario');
    const btnClose = document.getElementById('btnFecharModalExcluirUsuario');
    const btnCancel = document.getElementById('btnCancelarExcluirUsuario');
    const modal = document.getElementById('modalExcluirUsuario');

    if (btnOpen) btnOpen.addEventListener('click', () => openModal('modalExcluirUsuario'));
    if (btnClose) btnClose.addEventListener('click', () => closeModal('modalExcluirUsuario'));
    if (btnCancel) btnCancel.addEventListener('click', () => closeModal('modalExcluirUsuario'));

    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal('modalExcluirUsuario');
        }
      });
    }
  }

  async function bindCreateForm() {
    const form = document.getElementById('formNovoUsuarioGlobal');
    const feedback = document.getElementById('feedbackNovoUsuarioGlobal');

    if (!form || !feedback) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      feedback.textContent = 'Salvando usuário...';
      feedback.className = 'form-feedback pending';

      const formData = new FormData(form);
      const tenants = DevState.get('globalTenants') || [];

      const companyLinks = tenants.map((tenant) => {
        const enabled = document.querySelector(`[data-company-toggle="${tenant.tenantId}"]`)?.checked === true;
        const roleKey = document.querySelector(`[data-company-role="${tenant.tenantId}"]`)?.value || '';
        const moduleKey = document.querySelector(`[data-company-module="${tenant.tenantId}"]`)?.value || '';

        return {
          enabled,
          tenantId: tenant.tenantId,
          roleKey,
          moduleKey
        };
      });

      try {
        await DevAPI.createGlobalUser({
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          status: formData.get('status'),
          companyLinks
        });

        feedback.textContent = 'Usuário criado com sucesso.';
        feedback.className = 'form-feedback success';
        closeModal('modalNovoUsuarioGlobal');
        hydrate();
      } catch (error) {
        console.error(error);
        feedback.textContent = error.message || 'Erro ao criar usuário.';
        feedback.className = 'form-feedback error';
      }
    });
  }

  async function bindDeleteForm() {
    const form = document.getElementById('formExcluirUsuario');
    const feedback = document.getElementById('feedbackExcluirUsuario');

    if (!form || !feedback) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      feedback.textContent = 'Excluindo usuário...';
      feedback.className = 'form-feedback pending';

      const formData = new FormData(form);
      const userId = formData.get('userId');

      try {
        await DevAPI.deleteGlobalUser(userId);
        feedback.textContent = 'Usuário excluído com sucesso.';
        feedback.className = 'form-feedback success';
        closeModal('modalExcluirUsuario');
        hydrate();
      } catch (error) {
        console.error(error);
        feedback.textContent = error.message || 'Erro ao excluir usuário.';
        feedback.className = 'form-feedback error';
      }
    });
  }

  function bindSearch(allUsers, tenants, roles) {
    const input = document.getElementById('usuariosSearchInput');
    if (!input) return;

    input.addEventListener('input', () => {
      const term = String(input.value || '').trim().toLowerCase();

      const filtered = allUsers.filter((user) => {
        const haystack = [
          user.nome,
          user.email,
          user.status,
          user.isPlatformAdmin ? 'sim' : 'não',
          ...(user.memberships || []).map((item) => item.tenantName),
          ...(user.memberships || []).map((item) => item.roleName),
          ...(user.memberships || []).flatMap((item) => (item.modules || []).map((m) => m.nome))
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      });

      const mount = document.getElementById('usuariosMount');
      if (!mount) return;

      mount.innerHTML = renderPage(filtered, tenants, roles, input.value);
      bindModalNovoUsuario();
      bindModalExcluirUsuario();
      bindCompanyToggles();
      bindCreateForm();
      bindDeleteForm();
      bindSearch(allUsers, tenants, roles);
    });
  }

  async function hydrate() {
    const mount = document.getElementById('usuariosMount');
    if (!mount) return;

    try {
      const [users, tenants, roles] = await Promise.all([
        DevAPI.getGlobalUsers(),
        DevAPI.getTenants(),
        DevAPI.getSystemRoles('core')
      ]);

      DevState.set('globalUsers', users);
      DevState.set('globalTenants', tenants);
      DevState.set('globalCoreRoles', roles);

      mount.innerHTML = renderPage(users, tenants, roles);
      bindModalNovoUsuario();
      bindModalExcluirUsuario();
      bindCompanyToggles();
      bindCreateForm();
      bindDeleteForm();
      bindSearch(users, tenants, roles);
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar usuários</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="usuariosMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('usuarios', page);
})();