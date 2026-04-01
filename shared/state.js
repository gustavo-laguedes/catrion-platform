window.DevState = (() => {
  const state = {
    dashboard: null,
    tenants: [],
    tenantDetail: null,
    loading: false
  };

  function set(key, value) {
    state[key] = value;
  }

  function get(key) {
    return state[key];
  }

  return {
    set,
    get
  };
})();