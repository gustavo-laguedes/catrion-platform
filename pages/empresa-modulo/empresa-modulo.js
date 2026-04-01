(function () {
  const { DevRouter, DevAPI, DevState } = window;

  function loadingTemplate(tenantId, moduleKey) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Módulo</h1>
            <p class="page-subtitle">tenant_id: ${tenantId || '-'} • módulo: ${moduleKey || '-'}</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando detalhe do módulo...</div>
          </div>
        </div>
      </section>
    `;
  }

    function renderUsers(users, moduleKey) {
    const filtered = users.filter((user) =>
      Array.isArray(user.modules) && user.modules.includes(moduleKey)
    );

    if (!filtered.length) {
      return `<div class="empty-inline">Nenhum usuário vinculado a este módulo.</div>`;
    }

    return filtered.map((user) => {
      const isBlocked = user.status === 'bloqueado';

      return `
        <div class="list-row ${isBlocked ? 'membership-row-blocked' : ''}">
          <div>
            <div class="list-title">${user.nome}</div>
            <div class="list-subtitle">${user.email}</div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
            <span class="status-badge status-${user.status || 'ativo'}">${user.status || '-'}</span>
            <div class="list-meta">${user.roleName || user.role || '-'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderLogs(logs, moduleKey) {
    const filtered = logs.filter(
      (log) => (log.module || '').toLowerCase() === moduleKey.toLowerCase()
    );

    if (!filtered.length) {
      return `<div class="empty-inline">Nenhum log recente deste módulo.</div>`;
    }

    return filtered.map((log) => `
      <div class="list-row">
        <div>
          <div class="list-title">${log.action}</div>
          <div class="list-subtitle">${log.reason}</div>
        </div>
        <div class="list-meta">${log.date}</div>
      </div>
    `).join('');
  }

function renderEditStatusModal(moduleData) {
  return `
    <div class="modal-overlay hidden" id="modalEditarStatusModulo">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h2 class="panel-title">Editar status</h2>
            <p class="panel-subtitle">Atualize o status administrativo do módulo</p>
          </div>

          <button
            class="modal-close"
            type="button"
            id="btnFecharModalEditarStatusModulo"
          >
            ×
          </button>
        </div>

        <div class="panel-body">
          <form id="formEditarStatusModulo" class="form-grid">
            <div class="field field-full">
              <label class="field-label">Status</label>
              <select class="field-input field-select" name="status">
                <option value="ativo" ${moduleData.status === 'ativo' ? 'selected' : ''}>ativo</option>
                <option value="implantando" ${moduleData.status === 'implantando' ? 'selected' : ''}>implantando</option>
                <option value="suspenso" ${moduleData.status === 'suspenso' ? 'selected' : ''}>suspenso</option>
                <option value="inativo" ${moduleData.status === 'inativo' ? 'selected' : ''}>inativo</option>
              </select>
            </div>

            <div class="field-actions field-full">
              <button
                class="btn-ghost"
                type="button"
                id="btnCancelarModalEditarStatusModulo"
              >
                Cancelar
              </button>

              <button class="btn-primary" type="submit">
                Salvar status
              </button>
            </div>

            <div class="form-feedback field-full" id="feedbackEditarStatusModulo"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderEditEnvironmentModal(moduleData) {
  return `
    <div class="modal-overlay hidden" id="modalEditarAmbienteModulo">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h2 class="panel-title">Editar ambiente</h2>
            <p class="panel-subtitle">Atualize o ambiente administrativo do módulo</p>
          </div>

          <button
            class="modal-close"
            type="button"
            id="btnFecharModalEditarAmbienteModulo"
          >
            ×
          </button>
        </div>

        <div class="panel-body">
          <form id="formEditarAmbienteModulo" class="form-grid">
            <div class="field field-full">
              <label class="field-label">Ambiente</label>
              <select class="field-input field-select" name="environment">
                <option value="producao" ${moduleData.environment === 'producao' ? 'selected' : ''}>produção</option>
                <option value="homologacao" ${moduleData.environment === 'homologacao' ? 'selected' : ''}>homologação</option>
                <option value="desenvolvimento" ${moduleData.environment === 'desenvolvimento' ? 'selected' : ''}>desenvolvimento</option>
              </select>
            </div>

            <div class="field-actions field-full">
              <button
                class="btn-ghost"
                type="button"
                id="btnCancelarModalEditarAmbienteModulo"
              >
                Cancelar
              </button>

              <button class="btn-primary" type="submit">
                Salvar ambiente
              </button>
            </div>

            <div class="form-feedback field-full" id="feedbackEditarAmbienteModulo"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}


  function renderPage(tenant, moduleData, users, logs) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">${moduleData.nome}</h1>
            <p class="page-subtitle">Empresa: ${tenant.nome} • módulo: ${moduleData.key}</p>
          </div>

          <div class="page-actions">
  <button
    class="btn-ghost"
    type="button"
    onclick="window.DevRouter.navigate('empresa', { tenant: '${tenant.tenantId}' })"
  >
    Voltar para empresa
  </button>
</div>
        </header>

        <section class="grid-kpis module-kpis-compact">
  <button
    class="kpi-card kpi-card-button"
    type="button"
    id="btnAbrirModalEditarStatusModulo"
  >
    <div class="kpi-label">Status</div>
    <div class="kpi-value small">${moduleData.status}</div>
    <div class="kpi-meta">Clique para alterar o status</div>
  </button>

  <button
    class="kpi-card kpi-card-button"
    type="button"
    id="btnAbrirModalEditarAmbienteModulo"
  >
    <div class="kpi-label">Ambiente</div>
    <div class="kpi-value small">${moduleData.environment}</div>
    <div class="kpi-meta">Clique para alterar o ambiente</div>
  </button>
</section>


        <section class="module-bottom-grid">
  <div class="module-left-stack">
    <article class="panel module-actions-card">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Ações do módulo</h2>
          <p class="panel-subtitle">Operações administrativas</p>
        </div>
      </div>

      <div class="panel-body module-actions-inline">
        <button class="btn-warning" type="button">
          Gerar backup
        </button>

        <button class="btn-danger" type="button">
          Resetar módulo
        </button>
      </div>
    </article>

    <article class="panel module-users-card">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Usuários do módulo</h2>
          <p class="panel-subtitle">Usuários vinculados a este sistema nesta empresa</p>
        </div>
      </div>

      <div class="panel-body list-body">
  ${renderUsers(users, moduleData.key)}
</div>
    </article>
  </div>

  <article class="panel module-logs-tall">
    <div class="panel-head">
      <div>
        <h2 class="panel-title">Logs do módulo</h2>
        <p class="panel-subtitle">Histórico administrativo específico deste sistema</p>
      </div>
    </div>

    <div class="panel-body list-body">
      ${renderLogs(logs, moduleData.key)}
    </div>
  </article>
</section>
            ${renderEditStatusModal(moduleData)}
      ${renderEditEnvironmentModal(moduleData)}
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

function bindModuleModals() {
  const btnAbrirStatus = document.getElementById('btnAbrirModalEditarStatusModulo');
  const btnFecharStatus = document.getElementById('btnFecharModalEditarStatusModulo');
  const btnCancelarStatus = document.getElementById('btnCancelarModalEditarStatusModulo');
  const modalStatus = document.getElementById('modalEditarStatusModulo');

  if (btnAbrirStatus) {
    btnAbrirStatus.addEventListener('click', () => openModal('modalEditarStatusModulo'));
  }

  if (btnFecharStatus) {
    btnFecharStatus.addEventListener('click', () => closeModal('modalEditarStatusModulo'));
  }

  if (btnCancelarStatus) {
    btnCancelarStatus.addEventListener('click', () => closeModal('modalEditarStatusModulo'));
  }

  if (modalStatus) {
    modalStatus.addEventListener('click', (event) => {
      if (event.target === modalStatus) {
        closeModal('modalEditarStatusModulo');
      }
    });
  }

  const btnAbrirAmbiente = document.getElementById('btnAbrirModalEditarAmbienteModulo');
  const btnFecharAmbiente = document.getElementById('btnFecharModalEditarAmbienteModulo');
  const btnCancelarAmbiente = document.getElementById('btnCancelarModalEditarAmbienteModulo');
  const modalAmbiente = document.getElementById('modalEditarAmbienteModulo');

  if (btnAbrirAmbiente) {
    btnAbrirAmbiente.addEventListener('click', () => openModal('modalEditarAmbienteModulo'));
  }

  if (btnFecharAmbiente) {
    btnFecharAmbiente.addEventListener('click', () => closeModal('modalEditarAmbienteModulo'));
  }

  if (btnCancelarAmbiente) {
    btnCancelarAmbiente.addEventListener('click', () => closeModal('modalEditarAmbienteModulo'));
  }

  if (modalAmbiente) {
    modalAmbiente.addEventListener('click', (event) => {
      if (event.target === modalAmbiente) {
        closeModal('modalEditarAmbienteModulo');
      }
    });
  }

  const formStatus = document.getElementById('formEditarStatusModulo');
  const feedbackStatus = document.getElementById('feedbackEditarStatusModulo');

  if (formStatus && feedbackStatus) {
    formStatus.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedbackStatus.textContent = 'Edição de status preparada. O save real no backend vamos ligar na próxima etapa.';
      feedbackStatus.className = 'form-feedback pending';
    });
  }

  const formAmbiente = document.getElementById('formEditarAmbienteModulo');
  const feedbackAmbiente = document.getElementById('feedbackEditarAmbienteModulo');

  if (formAmbiente && feedbackAmbiente) {
    formAmbiente.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedbackAmbiente.textContent = 'Edição de ambiente preparada. O save real no backend vamos ligar na próxima etapa.';
      feedbackAmbiente.className = 'form-feedback pending';
    });
  }

}

  async function hydrate(tenantId, moduleKey) {
    const mount = document.getElementById('empresaModuloMount');
    if (!mount) return;

    try {
      const [tenant, users, logs] = await Promise.all([
        DevAPI.getTenantByTenantId(tenantId),
        DevAPI.getUsersByTenantId(tenantId),
        DevAPI.getLogsByTenantId(tenantId)
      ]);

      if (!tenant) {
        mount.innerHTML = `
          <section class="app-page">
            <div class="empty-card">
              <div class="empty-title">Empresa não encontrada</div>
              <div class="empty-text">Verifique o tenant informado.</div>
            </div>
          </section>
        `;
        return;
      }

      const moduleData = tenant.modules.find((m) => m.key === moduleKey);

      if (!moduleData) {
        mount.innerHTML = `
          <section class="app-page">
            <div class="empty-card">
              <div class="empty-title">Módulo não encontrado</div>
              <div class="empty-text">Este módulo não está vinculado a esta empresa.</div>
            </div>
          </section>
        `;
        return;
      }

      window.DevState?.set('tenantModuleUsers', users);
mount.innerHTML = renderPage(tenant, moduleData, users, logs);
bindModuleModals();
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar módulo</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page(params) {
    const tenantId = params.tenant || '';
    const moduleKey = params.module || '';
    setTimeout(() => hydrate(tenantId, moduleKey), 0);
    return `<div id="empresaModuloMount">${loadingTemplate(tenantId, moduleKey)}</div>`;
  }

  DevRouter.register('empresa-modulo', page);
})();