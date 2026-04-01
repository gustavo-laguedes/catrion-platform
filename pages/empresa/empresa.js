(function () {
  const { DevRouter, DevAPI, DevState } = window;

    function getFriendlyRoleOptions(roles) {
    return (roles || []).map((role) => {
      const key = (role.role_key || '').toLowerCase();

      if (key === 'core_admin') {
        return {
          value: role.role_key,
          label: 'Administrador'
        };
      }

      if (key === 'core_operador') {
        return {
          value: role.role_key,
          label: 'Operador'
        };
      }

      if (key === 'core_visualizador') {
        return {
          value: role.role_key,
          label: 'Visualizador'
        };
      }

      return {
        value: role.role_key,
        label: role.role_name
      };
    });
  }

  function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

  function loadingTemplate(tenantId) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Empresa</h1>
            <p class="page-subtitle">tenant_id: ${tenantId || '-'}</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando detalhes da empresa...</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderModules(modules, tenantId) {
    if (!modules.length) {
      return `<div class="empty-inline">Nenhum módulo vinculado.</div>`;
    }

    return modules.map((module) => `
      <button
        class="info-card info-card-button"
        type="button"
        data-route="empresa-modulo"
        data-tenant="${tenantId}"
        data-module="${module.key}"
      >
        <div class="info-card-top">
          <div class="info-card-title">${module.nome}</div>
          <span class="status-badge status-${module.status}">${module.status}</span>
        </div>
        <div class="info-card-line">chave: ${module.key}</div>
        <div class="info-card-line">ambiente: ${module.environment}</div>
        <div class="info-card-line">clique para abrir o detalhe do módulo</div>
      </button>
    `).join('');
  }

  function renderUsers(users) {
  if (!users.length) {
    return `<div class="empty-inline">Nenhum usuário vinculado.</div>`;
  }

  return users.map((user) => {
    const isBlocked = user.status === 'bloqueado';

    return `
      <div class="list-row ${isBlocked ? 'membership-row-blocked' : ''}">
        <div>
          <div class="list-title">${user.nome}</div>
          <div class="list-subtitle">${user.email}</div>
          <div class="list-subtitle">módulos: ${user.modulesDetailed.map((m) => m.nome).join(', ') || '-'}</div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
          <span class="status-badge status-${user.status || 'ativo'}">${user.status || '-'}</span>
          <div class="list-meta">${user.roleName || user.role || '-'}</div>
        </div>
      </div>
    `;
  }).join('');
}

  function renderLogs(logs) {
    if (!logs.length) {
      return `<div class="empty-inline">Nenhum log recente.</div>`;
    }

    return logs.map((log) => `
      <div class="list-row">
        <div>
          <div class="list-title">${log.action}</div>
          <div class="list-subtitle">${log.reason}</div>
          <div class="list-subtitle">módulo: ${log.moduleName || '-'}</div>
        </div>
        <div class="list-meta">${log.date}</div>
      </div>
    `).join('');
  }

  function renderModuleForm(allModules) {
  const coreModules = allModules.filter((module) => module.module_key === 'core');

  return `
    <div class="modal-overlay hidden" id="modalVincularModulo">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h2 class="panel-title">Vincular módulo</h2>
            <p class="panel-subtitle">Adicionar sistema a esta empresa</p>
          </div>

          <button
            class="modal-close"
            type="button"
            id="btnFecharModalVincularModulo"
          >
            ×
          </button>
        </div>

        <div class="panel-body">
          <form id="formModuloEmpresa" class="form-grid">
            <div class="field field-full">
              <label class="field-label">Módulo</label>
              <select class="field-input field-select" name="moduleKey" required>
                <option value="">Selecione</option>
                ${coreModules.map((module) => `
                  <option value="${module.module_key}">${module.module_name}</option>
                `).join('')}
              </select>
            </div>

            <div class="field">
              <label class="field-label">Status</label>
              <select class="field-input field-select" name="status">
                <option value="ativo">ativo</option>
                <option value="implantando">implantando</option>
                <option value="suspenso">suspenso</option>
                <option value="inativo">inativo</option>
              </select>
            </div>

            <div class="field">
              <label class="field-label">Ambiente</label>
              <select class="field-input field-select" name="environment">
                <option value="producao">produção</option>
              </select>
            </div>

            <div class="field-actions field-full">
              <button
                class="btn-ghost"
                type="button"
                id="btnCancelarModalVincularModulo"
              >
                Cancelar
              </button>

              <button class="btn-primary" type="submit">
                Vincular módulo
              </button>
            </div>

            <div class="form-feedback field-full" id="feedbackModuloEmpresa"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}


function renderEditTenantForm(tenant) {
  return `
    <div class="modal-overlay hidden" id="modalEditarEmpresa">
      <div class="modal-card modal-card-lg">
        <div class="modal-head">
          <div>
            <h2 class="panel-title">Editar empresa</h2>
            <p class="panel-subtitle">Atualize os dados cadastrais da empresa</p>
          </div>

          <button
            class="modal-close"
            type="button"
            id="btnFecharModalEditarEmpresa"
          >
            ×
          </button>
        </div>

        <div class="panel-body">
          <form id="formEditarEmpresa" class="form-grid">
            <div class="field">
              <label class="field-label">Tenant ID</label>
              <input class="field-input" name="tenantId" value="${tenant.tenantId || ''}" required />
            </div>

            <div class="field">
              <label class="field-label">Razão social</label>
              <input class="field-input" name="legalName" value="${tenant.razaoSocial || ''}" required />
            </div>

            <div class="field">
              <label class="field-label">Nome fantasia</label>
              <input class="field-input" name="tradeName" value="${tenant.nome || ''}" required />
            </div>

            <div class="field">
              <label class="field-label">CNPJ</label>
              <input class="field-input" id="inputEditarCnpjEmpresa" name="cnpj" value="${tenant.cnpj || ''}" />
            </div>

            <div class="field">
              <label class="field-label">Responsável</label>
              <input class="field-input" name="contactName" value="${tenant.contactName || ''}" />
            </div>

            <div class="field">
              <label class="field-label">E-mail do responsável</label>
              <input class="field-input" name="contactEmail" type="email" value="${tenant.contactEmail || ''}" />
            </div>

            <div class="field">
              <label class="field-label">CPF do responsável</label>
              <input class="field-input" id="inputEditarCpfEmpresa" name="contactCpf" value="${tenant.contactCpf || ''}" />
            </div>

            <div class="field">
              <label class="field-label">Telefone</label>
              <input class="field-input" id="inputEditarTelefoneEmpresa" name="phone" value="${tenant.phone || ''}" />
            </div>

            <div class="field field-full">
              <label class="field-label">Endereço</label>
              <input class="field-input" name="address" value="${tenant.address || ''}" />
            </div>

            <div class="field">
              <label class="field-label">Onboarding</label>
              <select class="field-input field-select" name="onboardingStatus">
                <option value="implantando" ${tenant.onboarding === 'implantando' ? 'selected' : ''}>implantando</option>
                <option value="implantado" ${tenant.onboarding === 'implantado' ? 'selected' : ''}>implantado</option>
                <option value="pendente" ${tenant.onboarding === 'pendente' ? 'selected' : ''}>pendente</option>
              </select>
            </div>

            <div class="field">
              <label class="field-label">Dia do vencimento</label>
              <input class="field-input" name="dueDay" type="number" min="1" max="31" value="${tenant.dueDay || 1}" required />
            </div>

            <div class="field field-full">
              <label class="field-label">Logo da empresa</label>

              <input
                id="inputEditarLogoEmpresa"
                name="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                class="file-input-native"
              />

              <label for="inputEditarLogoEmpresa" class="file-upload-shell">
                <span class="file-upload-btn">Escolher arquivo</span>
                <span class="file-upload-name" id="fileUploadEditName">Nenhum arquivo escolhido</span>
              </label>

              <div class="file-help">Envie PNG, JPG, WEBP ou SVG.</div>
            </div>

            <div class="field field-full">
              <label class="field-label">Observações</label>
              <textarea class="field-input field-textarea" name="notes">${tenant.notes || ''}</textarea>
            </div>

            <div class="field-actions field-full">
              <button class="btn-ghost" type="button" id="btnCancelarModalEditarEmpresa">Cancelar</button>
              <button class="btn-primary" type="submit">Salvar alterações</button>
            </div>

            <div class="form-feedback field-full" id="feedbackEditarEmpresa"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

  function renderPage(tenant, users, logs, allModules) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">${tenant.nome}</h1>
            <p class="page-subtitle">tenant_id: ${tenant.tenantId}</p>
          </div>

          <div class="page-actions">
            <button class="btn-ghost" type="button" onclick="window.DevRouter.navigate('cadastros')">Voltar</button>
          </div>
        </header>

        <section class="grid-kpis">
          <article class="kpi-card">
            <div class="kpi-label">Status</div>
            <div class="kpi-value small">${tenant.status}</div>
            <div class="kpi-meta">Situação atual da empresa</div>
          </article>

          <article class="kpi-card">
  <div class="kpi-label">Valor mensal</div>
  <div class="kpi-value small">${formatCurrency(tenant.monthlyAmount)}</div>
  <div class="kpi-meta">Valor atual do contrato</div>
</article>

          <article class="kpi-card">
            <div class="kpi-label">Financeiro</div>
            <div class="kpi-value small">${tenant.adimplencia}</div>
            <div class="kpi-meta">Status financeiro</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Vencimento</div>
            <div class="kpi-value small">${tenant.vencimento}</div>
            <div class="kpi-meta">Fechamento do contrato</div>
          </article>
        </section>

        <section class="two-col-grid">
          <article class="panel">
  <div class="panel-head">
    <div>
      <h2 class="panel-title">Visão geral</h2>
      <p class="panel-subtitle">Dados completos da empresa</p>
    </div>

    <button
      class="btn-primary btn-sm"
      type="button"
      id="btnAbrirModalEditarEmpresa"
    >
      Editar
    </button>
  </div>

  <div class="panel-body company-overview-body">
  <div class="company-overview-main details-grid">
    <div class="detail-row"><strong>Nome fantasia:</strong> ${tenant.nome || '-'}</div>
    <div class="detail-row"><strong>Tenant ID:</strong> ${tenant.tenantId || '-'}</div>
    <div class="detail-row"><strong>Razão social:</strong> ${tenant.razaoSocial || '-'}</div>
    <div class="detail-row"><strong>CNPJ:</strong> ${tenant.cnpj || '-'}</div>
    <div class="detail-row"><strong>Status:</strong> ${tenant.status || '-'}</div>
    <div class="detail-row"><strong>Onboarding:</strong> ${tenant.onboarding || '-'}</div>
    <div class="detail-row"><strong>Responsável:</strong> ${tenant.contactName || '-'}</div>
    <div class="detail-row"><strong>E-mail:</strong> ${tenant.contactEmail || '-'}</div>
    <div class="detail-row"><strong>CPF:</strong> ${tenant.contactCpf || '-'}</div>
    <div class="detail-row"><strong>Telefone:</strong> ${tenant.phone || '-'}</div>
    <div class="detail-row full"><strong>Endereço:</strong> ${tenant.address || '-'}</div>
    <div class="detail-row"><strong>Financeiro:</strong> ${tenant.adimplencia || '-'}</div>
<div class="detail-row"><strong>Vencimento:</strong> ${tenant.vencimento || '-'}</div>
<div class="detail-row full"><strong>Observações:</strong> ${tenant.notes || '-'}</div>
  </div>

  <div class="company-overview-logo">
    ${
      tenant.logoUrl
        ? `<img src="${tenant.logoUrl}" alt="Logo ${tenant.nome}" class="company-overview-logo-image" />`
        : `<div class="company-overview-logo-fallback">${(tenant.nome || '?').charAt(0).toUpperCase()}</div>`
    }
  </div>
</div>
</article>

          <article class="panel">
  <div class="panel-head">
    <div>
      <h2 class="panel-title">Módulos</h2>
      <p class="panel-subtitle">Sistemas vinculados a esta empresa</p>
    </div>

    <button
      class="btn-primary btn-sm"
      type="button"
      id="btnAbrirModalVincularModulo"
    >
      Vincular módulo
    </button>
  </div>

  <div class="panel-body card-grid">
    ${renderModules(tenant.modules, tenant.tenantId)}
  </div>
</article>
        </section>


        <section class="two-col-grid">
<article class="panel">
  <div class="panel-head">
    <div>
      <h2 class="panel-title">Usuários e acessos</h2>
      <p class="panel-subtitle">Visualização dos usuários vinculados a esta empresa</p>
    </div>
  </div>

  <div class="panel-body list-body">
    ${renderUsers(users)}
  </div>
</article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Logs e ações administrativas</h2>
                <p class="panel-subtitle">Histórico do que foi feito nesta empresa</p>
              </div>
            </div>

            <div class="panel-body list-body">
              ${renderLogs(logs)}
            </div>
          </article>
        </section>
           ${renderModuleForm(allModules)}
${renderEditTenantForm(tenant)}
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

function bindModals() {
  const btnAbrirModulo = document.getElementById('btnAbrirModalVincularModulo');
  const btnFecharModulo = document.getElementById('btnFecharModalVincularModulo');
  const btnCancelarModulo = document.getElementById('btnCancelarModalVincularModulo');
  const modalModulo = document.getElementById('modalVincularModulo');

  if (btnAbrirModulo) {
    btnAbrirModulo.addEventListener('click', () => openModal('modalVincularModulo'));
  }

  if (btnFecharModulo) {
    btnFecharModulo.addEventListener('click', () => closeModal('modalVincularModulo'));
  }

  if (btnCancelarModulo) {
    btnCancelarModulo.addEventListener('click', () => closeModal('modalVincularModulo'));
  }

  if (modalModulo) {
    modalModulo.addEventListener('click', (event) => {
      if (event.target === modalModulo) {
        closeModal('modalVincularModulo');
      }
    });
  }


  const btnAbrirEditarEmpresa = document.getElementById('btnAbrirModalEditarEmpresa');
  const btnFecharEditarEmpresa = document.getElementById('btnFecharModalEditarEmpresa');
  const btnCancelarEditarEmpresa = document.getElementById('btnCancelarModalEditarEmpresa');
  const modalEditarEmpresa = document.getElementById('modalEditarEmpresa');

  if (btnAbrirEditarEmpresa) {
    btnAbrirEditarEmpresa.addEventListener('click', () => openModal('modalEditarEmpresa'));
  }

  if (btnFecharEditarEmpresa) {
    btnFecharEditarEmpresa.addEventListener('click', () => closeModal('modalEditarEmpresa'));
  }

  if (btnCancelarEditarEmpresa) {
    btnCancelarEditarEmpresa.addEventListener('click', () => closeModal('modalEditarEmpresa'));
  }

  if (modalEditarEmpresa) {
    modalEditarEmpresa.addEventListener('click', (event) => {
      if (event.target === modalEditarEmpresa) {
        closeModal('modalEditarEmpresa');
      }
    });
  }

}

function bindEditMasks() {
  const cnpjInput = document.getElementById('inputEditarCnpjEmpresa');
  const cpfInput = document.getElementById('inputEditarCpfEmpresa');
  const phoneInput = document.getElementById('inputEditarTelefoneEmpresa');

  function onlyDigits(value) {
    return (value || '').replace(/\D/g, '');
  }

  function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);

    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function formatCnpj(value) {
    const digits = onlyDigits(value).slice(0, 14);

    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  if (cnpjInput) {
    cnpjInput.addEventListener('input', () => {
      cnpjInput.value = formatCnpj(cnpjInput.value);
    });
  }

  if (cpfInput) {
    cpfInput.addEventListener('input', () => {
      cpfInput.value = formatCpf(cpfInput.value);
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
    });
  }
}

function bindEditFileInput() {
  const input = document.getElementById('inputEditarLogoEmpresa');
  const fileName = document.getElementById('fileUploadEditName');

  if (!input || !fileName) return;

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    fileName.textContent = file ? file.name : 'Nenhum arquivo escolhido';
  });
}

  async function bindForms(tenantId) {
    const formModulo = document.getElementById('formModuloEmpresa');
    const feedbackModulo = document.getElementById('feedbackModuloEmpresa');

    if (formModulo && feedbackModulo) {
      formModulo.addEventListener('submit', async (event) => {
        event.preventDefault();
        feedbackModulo.textContent = 'Vinculando módulo...';
        feedbackModulo.className = 'form-feedback pending';

        const data = Object.fromEntries(new FormData(formModulo).entries());

        try {
          await DevAPI.attachModuleToTenant(
            tenantId,
            data.moduleKey,
            data.status,
            data.environment
          );

          feedbackModulo.textContent = 'Módulo vinculado com sucesso.';
feedbackModulo.className = 'form-feedback success';
formModulo.reset();
closeModal('modalVincularModulo');
hydrate(tenantId);
        } catch (error) {
          console.error(error);
          feedbackModulo.textContent = error.message || 'Erro ao vincular módulo.';
          feedbackModulo.className = 'form-feedback error';
        }
      });
    }

    const formEdit = document.getElementById('formEditarEmpresa');
    const feedbackEdit = document.getElementById('feedbackEditarEmpresa');

    if (formEdit && feedbackEdit) {
      formEdit.addEventListener('submit', async (event) => {
        event.preventDefault();
        feedbackEdit.textContent = 'Salvando alterações...';
        feedbackEdit.className = 'form-feedback pending';

        const formData = new FormData(formEdit);

        const payload = {
          currentTenantId: tenantId,
          tenantId: formData.get('tenantId'),
          legalName: formData.get('legalName'),
          tradeName: formData.get('tradeName'),
          cnpj: formData.get('cnpj'),
          onboardingStatus: formData.get('onboardingStatus'),
          dueDay: formData.get('dueDay'),
          contactName: formData.get('contactName'),
          contactEmail: formData.get('contactEmail'),
          contactCpf: formData.get('contactCpf'),
          address: formData.get('address'),
          phone: formData.get('phone'),
          notes: formData.get('notes'),
          logoFile: formData.get('logoFile')
        };

        try {
          await DevAPI.updateTenant(payload);
          feedbackEdit.textContent = 'Empresa atualizada com sucesso.';
          feedbackEdit.className = 'form-feedback success';
          closeModal('modalEditarEmpresa');

          const nextTenantId = payload.tenantId || tenantId;
          if (nextTenantId !== tenantId) {
            window.DevRouter.navigate('empresa', { tenant: nextTenantId });
            return;
          }

          hydrate(nextTenantId);
        } catch (error) {
          console.error(error);
          feedbackEdit.textContent = error.message || 'Erro ao atualizar empresa.';
          feedbackEdit.className = 'form-feedback error';
        }
      });
    }
    
  }

  async function hydrate(tenantId) {
    const mount = document.getElementById('empresaMount');
    if (!mount) return;

    try {
            const [tenant, users, logs, modules] = await Promise.all([
  DevAPI.getTenantByTenantId(tenantId),
  DevAPI.getUsersByTenantId(tenantId),
  DevAPI.getLogsByTenantId(tenantId),
  DevAPI.getModules()
]);

      if (!tenant) {
        mount.innerHTML = `
          <section class="app-page">
            <div class="empty-card">
              <div class="empty-title">Empresa não encontrada</div>
              <div class="empty-text">Verifique o tenant_id informado.</div>
            </div>
          </section>
        `;
        return;
      }

      DevState.set('tenantDetail', tenant);
DevState.set('tenantUsers', users);
mount.innerHTML = renderPage(tenant, users, logs, modules);
bindModals();
bindEditMasks();
bindEditFileInput();
bindForms(tenantId);
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar empresa</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page(params) {
    const tenantId = params.tenant || '';
    setTimeout(() => hydrate(tenantId), 0);
    return `<div id="empresaMount">${loadingTemplate(tenantId)}</div>`;
  }

  DevRouter.register('empresa', page);
})();