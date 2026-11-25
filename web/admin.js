const loginCard = document.querySelector('#loginCard');
      const dashboard = document.querySelector('#dashboard');
      const logoutButton = document.querySelector('#logout');
      const form = document.querySelector('#mockForm');
      const notice = document.querySelector('#notice');
      let latestData = null;
      let eventSource = null;
      const tokenKey = 'drytech_admin_token';
      const apiUrlKey = 'drytech_api_url';
      const apiUrlField = document.querySelector('#loginForm').elements.apiUrl;
      apiUrlField.value = localStorage.getItem(apiUrlKey) || '';
      const apiBase = () => (localStorage.getItem(apiUrlKey) || '').replace(/\/+$/, '');
      const token = () => sessionStorage.getItem(tokenKey);

      async function request(url, options = {}) {
        const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...options.headers };
        const response = await fetch(`${apiBase()}${url}`, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
        return data;
      }

      function render(data) {
        latestData = data;
        document.querySelector('#deviceName').textContent = data.device.name;
        document.querySelector('#deviceStatus').textContent = data.device.status;
        document.querySelector('#temperature').textContent = Number(data.telemetry.temperature).toFixed(1);
        document.querySelector('#humidity').textContent = Number(data.telemetry.humidity).toFixed(1);
        document.querySelector('#weight').textContent = Number(data.telemetry.weight).toFixed(1);
        document.querySelector('#energy').textContent = Number(data.telemetry.energyConsumption).toFixed(2);
        document.querySelector('#cycleStatus').textContent = data.cycle?.status || 'Sem ciclo ativo';
        document.querySelector('#doorState').textContent = data.telemetry.doorOpen ? 'Porta aberta' : 'Porta fechada';
        document.querySelector('#alertCount').textContent = `${data.activeAlerts.length} alertas ativos`;
        if (!form.elements.name.matches(':focus')) form.elements.name.value = data.device.name;
        if (!form.elements.deviceStatus.matches(':focus')) form.elements.deviceStatus.value = data.device.status;
        if (!form.elements.cycleStatus.matches(':focus')) form.elements.cycleStatus.value = data.cycle?.status || 'IDLE';
        for (const key of ['temperature', 'humidity', 'weight', 'energyConsumption']) {
          if (!form.elements[key].matches(':focus')) form.elements[key].value = data.telemetry[key];
        }
        for (const key of ['doorOpen', 'motorOn', 'heaterOn', 'fanOn']) {
          if (!form.elements[key].matches(':focus')) form.elements[key].checked = data.telemetry[key];
        }
      }

      function connect() {
        loginCard.classList.add('hidden');
        dashboard.classList.remove('hidden');
        logoutButton.classList.remove('hidden');
        request('/api/mock/data').then(render).catch(showError);
        eventSource?.close();
        eventSource = new EventSource(`${apiBase()}/api/mock/events`);
        eventSource.addEventListener('mock-data', event => {
          render(JSON.parse(event.data));
          notice.textContent = 'Conectado · alterações sincronizadas em tempo real';
          notice.classList.remove('error');
        });
        eventSource.onerror = () => { notice.textContent = 'Reconectando ao servidor…'; };
      }

      function showError(error) {
        notice.textContent = error.message;
        notice.classList.add('error');
      }

      document.querySelector('#loginForm').addEventListener('submit', async event => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        try {
          const configuredApiUrl = String(fields.get('apiUrl') || '').trim().replace(/\/+$/, '');
          if (!configuredApiUrl) throw new Error('Informe a URL pública da API.');
          localStorage.setItem(apiUrlKey, configuredApiUrl);
          const pastedToken = String(fields.get('token') || '').trim();
          if (pastedToken) {
            if (pastedToken.split('.').length !== 3) {
              throw new Error('Esse campo aceita um JWT emitido pelo login. JWT_SECRET é apenas a chave de assinatura; entre com usuário e senha.');
            }
            sessionStorage.setItem(tokenKey, pastedToken);
            await request('/api/auth/verify');
          } else {
            const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: fields.get('username'), password: fields.get('password') }) });
            sessionStorage.setItem(tokenKey, result.token);
          }
          connect();
        } catch (error) {
          sessionStorage.removeItem(tokenKey);
          document.querySelector('#loginNotice').textContent = error.message;
          document.querySelector('#loginNotice').classList.add('error');
        }
      });

      form.addEventListener('submit', async event => {
        event.preventDefault();
        const fields = new FormData(form);
        const number = key => Number(fields.get(key));
        try {
          await request('/api/mock/data', { method: 'PATCH', body: JSON.stringify({
            device: { name: fields.get('name'), status: fields.get('deviceStatus') },
            cycle: latestData?.cycle ? { status: fields.get('cycleStatus') } : null,
            telemetry: { temperature: number('temperature'), humidity: number('humidity'), weight: number('weight'), energyConsumption: number('energyConsumption'), doorOpen: fields.has('doorOpen'), motorOn: fields.has('motorOn'), heaterOn: fields.has('heaterOn'), fanOn: fields.has('fanOn'), timestamp: new Date().toISOString() },
          }) });
          notice.textContent = 'Atualizado. O aplicativo recebe a mudança em tempo real.';
          notice.classList.remove('error');
        } catch (error) { showError(error); }
      });

      document.querySelector('#reset').addEventListener('click', async () => {
        try {
          await request('/api/mock/reset', { method: 'POST' });
          notice.textContent = 'Dados iniciais restaurados.';
          notice.classList.remove('error');
        } catch (error) { showError(error); }
      });

      logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem(tokenKey);
        eventSource?.close();
        dashboard.classList.add('hidden');
        logoutButton.classList.add('hidden');
        loginCard.classList.remove('hidden');
      });

      if (token() && apiBase()) {
        request('/api/auth/verify').then(connect).catch(() => {
          sessionStorage.removeItem(tokenKey);
          document.querySelector('#loginNotice').textContent = 'Sua sessão expirou ou o token não é válido. Entre novamente com usuário e senha ou cole um JWT atualizado.';
          loginCard.classList.remove('hidden');
          dashboard.classList.add('hidden');
          logoutButton.classList.add('hidden');
        });
      }
