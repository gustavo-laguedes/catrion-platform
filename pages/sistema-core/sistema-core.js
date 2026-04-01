(function () {
  const { DevRouter, DevAPI } = window;

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Core</h1>
            <p class="page-subtitle">Gestão do sistema Core, papéis e permissões.</p>
          </div>

          <div class="page-actions">
            <button class="btn-ghost" type="button" data-route="sistemas">
              Voltar para sistemas
            </button>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando permissões do Core...</div>
          </div>
        </div>
      </section>
    `;
  }

  function getModuleMeta() {
    return [
      {
        key: 'home',
        label: 'Home',
        subtitle: 'Painel principal do sistema',
        actions: []
      },
      {
        key: 'venda',
        label: 'Venda',
        subtitle: 'Operação de vendas e atendimento',
        actions: [
          { key: 'aplicar_desconto', label: 'Aplicar desconto manual' },
          { key: 'cancelar_venda', label: 'Cancelar venda' }
        ]
      },
      {
        key: 'produtos',
        label: 'Produtos',
        subtitle: 'Cadastro, estoque e consulta',
        actions: [
          { key: 'criar_produto', label: 'Criar produto' },
          { key: 'editar_produto', label: 'Editar produto' },
          { key: 'excluir_produto', label: 'Excluir produto' },
          { key: 'ajuste_estoque', label: 'Ajustar estoque manualmente' },
          { key: 'ver_custo', label: 'Ver custo do produto' }
        ]
      },
      {
        key: 'caixa',
        label: 'Caixa',
        subtitle: 'Abertura, fechamento e movimentações',
        actions: [
          { key: 'abrir_caixa', label: 'Abrir caixa' },
          { key: 'sangria', label: 'Fazer sangria' },
          { key: 'suprimento', label: 'Fazer suprimento' },
          { key: 'fechar_caixa', label: 'Fechar caixa' },
          { key: 'ver_lucro', label: 'Ver lucro do caixa' },
          { key: 'ver_custo', label: 'Ver custo do caixa' }
        ]
      },
      {
        key: 'relatorios',
        label: 'Relatórios',
        subtitle: 'Leitura gerencial e acompanhamento',
        actions: [
          { key: 'ver_relatorios', label: 'Ver relatórios gerais' },
          { key: 'ver_financeiro', label: 'Ver relatórios financeiros' },
          { key: 'exportar', label: 'Exportar relatórios' }
        ]
      }
    ];
  }

  function getSelectedRoleFromHash() {
    const hash = window.location.hash || '';
    const parts = hash.split('?role=');
    if (parts.length < 2) return '';
    return decodeURIComponent(parts[1] || '');
  }

  function buildRoleConfig(role, moduleMeta) {
    const permissionSet = new Set(role.permissions || []);

    return {
      ...role,
      modules: moduleMeta.map((module) => {
        const accessKey = `core.${module.key}.access`;
        const enabled = permissionSet.has(accessKey);

        return {
          ...module,
          enabled,
          actions: module.actions.map((action) => ({
            ...action,
            permissionKey: `core.${module.key}.${action.key}`,
            checked: permissionSet.has(`core.${module.key}.${action.key}`)
          }))
        };
      })
    };
  }

  function renderRoleTabs(roles, selectedRoleKey) {
    return `
      <div class="role-tabs">
        ${roles.map((role) => `
          <button
            class="role-tab-btn ${role.key === selectedRoleKey ? 'active' : ''}"
            type="button"
            data-role-tab="${role.key}"
          >
            ${role.name}
          </button>
        `).join('')}

        <button
          class="btn-primary btn-sm"
          type="button"
          id="btnNovoPapelCore"
        >
          + Novo papel
        </button>
      </div>
    `;
  }

  function renderPermissionTree(selectedRole) {
    return `
      <div class="permission-tree">
        ${selectedRole.modules.map((module) => `
          <article class="panel permission-module-card ${module.enabled ? 'is-enabled' : 'is-disabled'}">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">${module.label}</h2>
                <p class="panel-subtitle">${module.subtitle}</p>
              </div>

              <label class="permission-toggle">
                <input
                  type="checkbox"
                  ${module.enabled ? 'checked' : ''}
                  data-module-toggle="${module.key}"
                />
                <span>Habilitado</span>
              </label>
            </div>

            ${
              module.actions.length
                ? `
                  <div class="panel-body permission-children ${module.enabled ? '' : 'is-hidden'}" data-module-children="${module.key}">
                    <div class="checkbox-grid">
                      ${module.actions.map((action) => `
                        <label class="check-item ${module.enabled ? '' : 'is-disabled'}">
                          <input
                            type="checkbox"
                            ${action.checked ? 'checked' : ''}
                            ${module.enabled ? '' : 'disabled'}
                            data-action-key="${action.permissionKey}"
                          />
                          <span>${action.label}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                `
                : `
                  <div class="panel-body permission-children-empty">
                    <div class="empty-inline">Esse módulo não possui ações detalhadas nesta etapa.</div>
                  </div>
                `
            }
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPage(coreModule, roles, selectedRoleKey) {
    const moduleMeta = getModuleMeta();
    const selectedRole =
      roles.find((role) => role.key === selectedRoleKey) ||
      roles[0];

    const selectedRoleConfig = selectedRole
      ? buildRoleConfig(selectedRole, moduleMeta)
      : null;

    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Core</h1>
            <p class="page-subtitle">Gestão do sistema Core, papéis e permissões.</p>
          </div>

          <div class="page-actions">
            <button class="btn-ghost" type="button" data-route="sistemas">
              Voltar para sistemas
            </button>
          </div>
        </header>

        <section class="grid-kpis">
          <article class="kpi-card">
            <div class="kpi-label">Sistema</div>
            <div class="kpi-value small">${coreModule.nome}</div>
            <div class="kpi-meta">${coreModule.domain}</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Empresas usando</div>
            <div class="kpi-value small">${coreModule.tenants}</div>
            <div class="kpi-meta">Tenants cadastrados no Core</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Tenants ativos</div>
            <div class="kpi-value small">${coreModule.ativos}</div>
            <div class="kpi-meta">Empresas com uso ativo</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Saúde</div>
            <div class="kpi-value small">${coreModule.ativos > 0 ? 'saudável' : 'atenção'}</div>
            <div class="kpi-meta">Visão administrativa atual</div>
          </article>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Papéis e permissões do Core</h2>
              <p class="panel-subtitle">Selecione um papel e configure os módulos e ações disponíveis.</p>
            </div>
          </div>

          <div class="panel-body core-role-config">
            ${renderRoleTabs(roles, selectedRole?.key || '')}

            ${
              selectedRoleConfig
                ? `
                  <div class="role-selected-summary">
                    <div class="role-selected-title">${selectedRoleConfig.name}</div>
                    <div class="role-selected-subtitle">Papel carregado do banco para o sistema Core.</div>
                  </div>

                  ${renderPermissionTree(selectedRoleConfig)}

                  <div class="field-actions">
                    <button class="btn-primary" type="button" id="btnSalvarPermissoesCore">
                      Salvar permissões
                    </button>
                  </div>

                  <div class="form-feedback" id="feedbackPermissoesCore"></div>
                `
                : `
                  <div class="empty-inline">Nenhum papel do Core encontrado.</div>
                `
            }
          </div>
        </section>
      </section>
    `;
  }

  async function saveCurrentRole(roleKey) {
    const feedback = document.getElementById('feedbackPermissoesCore');
    if (feedback) {
      feedback.textContent = 'Salvando permissões...';
      feedback.className = 'form-feedback pending';
    }

    try {
      const allowedPermissionKeys = [];

      document.querySelectorAll('[data-module-toggle]').forEach((input) => {
        const moduleKey = input.getAttribute('data-module-toggle');
        const enabled = input.checked;

        if (enabled) {
          allowedPermissionKeys.push(`core.${moduleKey}.access`);
        }

        const container = document.querySelector(`[data-module-children="${moduleKey}"]`);
        if (!container || !enabled) return;

        container.querySelectorAll('[data-action-key]').forEach((actionInput) => {
          if (actionInput.checked) {
            allowedPermissionKeys.push(actionInput.getAttribute('data-action-key'));
          }
        });
      });

      await DevAPI.saveSystemRolePermissions('core', roleKey, allowedPermissionKeys);

      if (feedback) {
        feedback.textContent = 'Permissões salvas com sucesso.';
        feedback.className = 'form-feedback success';
      }
    } catch (error) {
      console.error(error);
      if (feedback) {
        feedback.textContent = error.message || 'Erro ao salvar permissões.';
        feedback.className = 'form-feedback error';
      }
    }
  }

  function bindRoleTree() {
    document.querySelectorAll('[data-role-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const roleKey = button.getAttribute('data-role-tab');
        window.location.hash = `#sistema-core?role=${encodeURIComponent(roleKey)}`;
      });
    });

    document.querySelectorAll('[data-module-toggle]').forEach((input) => {
      input.addEventListener('change', () => {
        const moduleKey = input.getAttribute('data-module-toggle');
        const children = document.querySelector(`[data-module-children="${moduleKey}"]`);
        if (!children) return;

        children.classList.toggle('is-hidden', !input.checked);

        children.querySelectorAll('input[type="checkbox"]').forEach((childInput) => {
          childInput.disabled = !input.checked;
        });

        children.querySelectorAll('.check-item').forEach((item) => {
          item.classList.toggle('is-disabled', !input.checked);
        });
      });
    });

    const newRoleBtn = document.getElementById('btnNovoPapelCore');
    if (newRoleBtn) {
      newRoleBtn.addEventListener('click', async () => {
        const roleName = prompt('Digite o nome do novo papel do Core:');
        if (!roleName) return;

        try {
          const created = await DevAPI.createSystemRole('core', roleName);
          window.location.hash = `#sistema-core?role=${encodeURIComponent(created.role_key)}`;
        } catch (error) {
          console.error(error);
          alert(error.message || 'Erro ao criar novo papel.');
        }
      });
    }

    const saveButton = document.getElementById('btnSalvarPermissoesCore');
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        const roleKey = getSelectedRoleFromHash();
        if (!roleKey) return;
        await saveCurrentRole(roleKey);
      });
    }
  }

  async function hydrate() {
    const mount = document.getElementById('sistemaCoreMount');
    if (!mount) return;

    try {
      const [modules, matrix] = await Promise.all([
        DevAPI.getModulesCatalog(),
        DevAPI.getSystemRoleMatrix('core')
      ]);

      const coreModule = modules.find((item) => item.key === 'core');
      const selectedRoleKey = getSelectedRoleFromHash() || matrix.roles?.[0]?.key || '';

      if (!coreModule) {
        mount.innerHTML = `
          <section class="app-page">
            <div class="empty-card">
              <div class="empty-title">Core não encontrado</div>
              <div class="empty-text">O módulo Core não foi encontrado no catálogo.</div>
            </div>
          </section>
        `;
        return;
      }

      mount.innerHTML = renderPage(coreModule, matrix.roles || [], selectedRoleKey);
      bindRoleTree();
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar Core</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="sistemaCoreMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('sistema-core', page);
})();