import swaggerJSDoc from "swagger-jsdoc";

const ok = (description: string, schema?: object) => ({ description, ...(schema ? { content: { "application/json": { schema } } } : {}) });
const response = (name: string) => ({ $ref: `#/components/responses/${name}` });
const schema = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const param = (name: "Id" | "DeviceId") => ({ $ref: `#/components/parameters/${name}` });
const admin = [{ bearerAuth: [] }];
const device = [{ deviceApiKey: [] }];

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "DryTech IoT API", version: "1.0.0", description: "API REST para gestão de secadoras IoT, ciclos, telemetria e alertas." },
    servers: [{ url: "/", description: "Servidor atual" }],
    tags: ["Health", "Autenticação", "IoT", "Dispositivos", "Telemetria", "Alertas", "Ciclos", "Mock"].map((name) => ({ name })),
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        deviceApiKey: { type: "apiKey", in: "header", name: "x-device-api-key" },
      },
      parameters: {
        Id: { name: "id", in: "path", required: true, schema: { type: "string" } },
        DeviceId: { name: "deviceId", in: "path", required: true, schema: { type: "string" } },
      },
      schemas: {
        Error: { type: "object", required: ["error"], properties: { error: { type: "string" }, details: { type: "object" } } },
        LoginInput: { type: "object", required: ["username", "password"], properties: { username: { type: "string" }, password: { type: "string", format: "password" } } },
        LoginResult: { type: "object", required: ["token", "tokenType", "expiresIn"], properties: { token: { type: "string" }, tokenType: { type: "string", example: "Bearer" }, expiresIn: { type: "integer", example: 28800 } } },
        TelemetryInput: { type: "object", required: ["temperature", "humidity", "weight", "doorOpen", "motorOn", "heaterOn", "fanOn", "current", "voltage", "energyConsumption", "timestamp"], properties: {
          temperature: { type: "number", minimum: -40, maximum: 150 }, humidity: { type: "number", minimum: 0, maximum: 100 }, weight: { type: "number", minimum: 0, maximum: 100 }, doorOpen: { type: "boolean" }, motorOn: { type: "boolean" }, heaterOn: { type: "boolean" }, fanOn: { type: "boolean" }, current: { type: "number", minimum: 0, maximum: 100 }, voltage: { type: "number", minimum: 0, maximum: 500 }, energyConsumption: { type: "number", minimum: 0, maximum: 10000 }, cycleId: { type: "string" }, timestamp: { type: "string", format: "date-time" },
        } },
        Telemetry: { allOf: [schema("TelemetryInput"), { type: "object", properties: { id: { type: "string" }, deviceId: { type: "string" }, createdAt: { type: "string", format: "date-time" } } }] },
        TelemetryResult: { type: "object", properties: { success: { type: "boolean" }, device: { type: "object", properties: { id: { type: "string" } } }, cycle: { type: "object", nullable: true }, commands: { type: "object" }, safety: { type: "object" }, nextTelemetryIn: { type: "number" } } },
        DeviceInput: { type: "object", required: ["name", "serialNumber", "apiKey"], properties: { name: { type: "string", minLength: 2, maxLength: 100 }, serialNumber: { type: "string", minLength: 3, maxLength: 100 }, apiKey: { type: "string", minLength: 24, writeOnly: true }, maxLoadKg: { type: "number", exclusiveMinimum: 0, maximum: 100 }, maxCurrent: { type: "number", exclusiveMinimum: 0, maximum: 100 } } },
        Device: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, serialNumber: { type: "string" }, status: { type: "string", enum: ["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"] }, lastSeen: { type: "string", format: "date-time", nullable: true }, maxLoadKg: { type: "number", nullable: true }, maxCurrent: { type: "number", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
        CycleStatus: { type: "string", enum: ["IDLE", "PREPARING", "DRYING", "PAUSED", "COMPLETED", "CANCELLED", "ERROR"] },
        CycleInput: { type: "object", required: ["deviceId", "initialWeight"], properties: { deviceId: { type: "string" }, initialWeight: { type: "number", exclusiveMinimum: 0 }, targetHumidity: { type: "number", minimum: 0, maximum: 100 } } },
        MockCycleInput: { type: "object", required: ["foodName", "initialWeight", "targetTemperature", "plannedDurationSeconds"], properties: { foodName: { type: "string" }, initialWeight: { type: "number", exclusiveMinimum: 0 }, targetTemperature: { type: "number", minimum: 35, maximum: 80 }, plannedDurationSeconds: { type: "integer", minimum: 1, maximum: 86400 } } },
        MockCyclePatch: { type: "object", minProperties: 1, properties: { foodName: { type: "string" }, initialWeight: { type: "number", exclusiveMinimum: 0 }, targetTemperature: { type: "number", minimum: 35, maximum: 80 }, plannedDurationSeconds: { type: "integer", minimum: 1, maximum: 86400 }, status: { type: "string", enum: ["PREPARING", "DRYING", "PAUSED", "COMPLETED", "CANCELLED", "ERROR"] } } },
        Cycle: { type: "object", properties: { id: { type: "string" }, deviceId: { type: "string" }, status: schema("CycleStatus"), startTime: { type: "string", format: "date-time" }, endTime: { type: "string", format: "date-time", nullable: true }, initialWeight: { type: "number" }, finalWeight: { type: "number", nullable: true }, targetHumidity: { type: "number" }, maximumTemperature: { type: "number" }, energyConsumed: { type: "number" }, lowHumidityReadings: { type: "integer" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
        Alert: { type: "object", properties: { id: { type: "string" }, deviceId: { type: "string" }, cycleId: { type: "string", nullable: true }, type: { type: "string", enum: ["HIGH_TEMPERATURE", "LOW_TEMPERATURE", "HIGH_HUMIDITY", "DOOR_OPEN", "OVERCURRENT", "OVERWEIGHT", "SENSOR_FAILURE", "COMMUNICATION_FAILURE", "ABNORMAL_ENERGY", "DRYING_COMPLETE"] }, severity: { type: "string", enum: ["INFO", "WARNING", "CRITICAL"] }, message: { type: "string" }, value: { type: "number", nullable: true }, acknowledged: { type: "boolean" }, createdAt: { type: "string", format: "date-time" } } },
        Dashboard: { type: "object", properties: { device: { type: "object" }, telemetry: { allOf: [schema("Telemetry")], nullable: true }, cycle: { allOf: [schema("Cycle")], nullable: true, description: "Também inclui durationSeconds e energyPerKg." }, activeAlerts: { type: "array", items: schema("Alert") } } },
        MockCycle: { allOf: [schema("Cycle"), { type: "object", properties: { foodName: { type: "string" }, targetTemperature: { type: "number" }, plannedDurationSeconds: { type: "integer" }, durationSeconds: { type: "integer" }, energyPerKg: { type: "number", nullable: true } } }] },
        MockData: { type: "object", properties: { device: schema("Device"), telemetry: schema("Telemetry"), cycle: { allOf: [schema("MockCycle")], nullable: true }, activeAlerts: { type: "array", items: schema("Alert") } } },
        MockDataPatch: { type: "object", description: "Todos os campos são opcionais. Objetos internos são mesclados com o estado atual; activeAlerts substitui a lista atual.", properties: {
          device: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, status: { type: "string", enum: ["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"] }, lastSeen: { type: "string", nullable: true } } },
          telemetry: { type: "object", properties: { temperature: { type: "number" }, humidity: { type: "number" }, weight: { type: "number" }, doorOpen: { type: "boolean" }, motorOn: { type: "boolean" }, heaterOn: { type: "boolean" }, fanOn: { type: "boolean" }, current: { type: "number" }, voltage: { type: "number" }, energyConsumption: { type: "number" }, timestamp: { type: "string", format: "date-time" } } },
          cycle: { allOf: [schema("Cycle")], nullable: true },
          activeAlerts: { type: "array", items: schema("Alert") },
        } },
      },
      responses: {
        BadRequest: ok("Payload inválido", schema("Error")), Unauthorized: ok("Credenciais ausentes ou inválidas", schema("Error")), NotFound: ok("Recurso não encontrado", schema("Error")), Conflict: ok("Transição de ciclo inválida", schema("Error")),
      },
    },
    paths: {
      "/health": { get: { tags: ["Health"], summary: "Verifica disponibilidade", responses: { "200": ok("API disponível", { type: "object", properties: { status: { type: "string", example: "ok" } } }) } } },
      "/api/auth/login": { post: { tags: ["Autenticação"], summary: "Faz login administrativo e emite JWT válido por 8 horas", requestBody: { required: true, content: { "application/json": { schema: schema("LoginInput") } } }, responses: { "200": ok("Token JWT emitido", schema("LoginResult")), "400": response("BadRequest"), "401": response("Unauthorized"), "503": ok("Credenciais administrativas não configuradas", schema("Error")) } } },
      "/api/auth/verify": { get: { tags: ["Autenticação"], summary: "Valida o JWT administrativo atual", security: admin, responses: { "200": ok("Token válido", { type: "object", properties: { authenticated: { type: "boolean", example: true } } }), "401": response("Unauthorized") } } },
      "/api/mock/data": {
        get: { tags: ["Mock"], summary: "Obtém os dados de demonstração usados pelo app", description: "Disponível em desenvolvimento; os dados ficam em memória e voltam ao exemplo inicial ao reiniciar a API.", responses: { "200": ok("Estado mock atual", schema("MockData")) } },
        patch: { tags: ["Mock"], summary: "Altera os dados de demonstração", description: "Atualiza apenas os campos enviados. Objetos internos são mesclados para facilitar ajustes pontuais na apresentação.", security: admin, requestBody: { required: true, content: { "application/json": { schema: schema("MockDataPatch") } } }, responses: { "200": ok("Estado mock atualizado", schema("MockData")), "400": response("BadRequest"), "401": response("Unauthorized") } },
      },
      "/api/mock/cycle": {
        post: { tags: ["Mock"], summary: "Cria ciclo no ambiente de demonstração", description: "Atualiza o estado mock compartilhado pelo app. Requer JWT administrativo.", security: admin, requestBody: { required: true, content: { "application/json": { schema: schema("MockCycleInput") } } }, responses: { "201": ok("Ciclo criado no estado mock", schema("MockData")), "400": response("BadRequest"), "401": response("Unauthorized"), "409": response("Conflict") } },
        patch: { tags: ["Mock"], summary: "Edita ciclo mock", description: "Requer JWT administrativo e atualiza o estado que o app consome pela rota GET /api/mock/data.", security: admin, requestBody: { required: true, content: { "application/json": { schema: schema("MockCyclePatch") } } }, responses: { "200": ok("Ciclo mock atualizado", schema("MockData")), "400": response("BadRequest"), "401": response("Unauthorized"), "404": response("NotFound") } },
      },
      "/api/mock/events": { get: { tags: ["Mock"], summary: "Abre stream de eventos em tempo real", description: "Server-Sent Events. Envia o estado inicial e cada alteração do mock no evento mock-data.", responses: { "200": { description: "Stream de eventos text/event-stream", content: { "text/event-stream": { schema: { type: "string" } } } } } } },
      "/api/mock/reset": { post: { tags: ["Mock"], summary: "Restaura os dados de demonstração iniciais", security: admin, responses: { "200": ok("Dados de exemplo restaurados", schema("MockData")), "401": response("Unauthorized") } } },
      "/api/iot/devices/{deviceId}/telemetry": { post: { tags: ["IoT"], summary: "Envia telemetria e recebe comandos de segurança", security: device, parameters: [param("DeviceId")], requestBody: { required: true, content: { "application/json": { schema: schema("TelemetryInput") } } }, responses: { "200": ok("Telemetria processada", schema("TelemetryResult")), "400": response("BadRequest"), "401": response("Unauthorized"), "404": response("NotFound") } } },
      "/api/iot/devices/{deviceId}/heartbeat": { post: { tags: ["IoT"], summary: "Registra heartbeat", security: device, parameters: [param("DeviceId")], responses: { "200": ok("Heartbeat registrado", { type: "object", properties: { success: { type: "boolean" }, nextTelemetryIn: { type: "number" } } }), "401": response("Unauthorized") } } },
      "/api/iot/devices/{deviceId}/status": { get: { tags: ["IoT"], summary: "Consulta estado do dispositivo", security: device, parameters: [param("DeviceId")], responses: { "200": ok("Dispositivo, telemetria mais recente e ciclo ativo", { type: "object", properties: { device: schema("Device"), telemetry: { allOf: [schema("Telemetry")], nullable: true }, cycle: { allOf: [schema("Cycle")], nullable: true } } }), "401": response("Unauthorized"), "404": response("NotFound") } } },
      "/api/devices": {
        get: { tags: ["Dispositivos"], summary: "Lista dispositivos", security: admin, responses: { "200": ok("Dispositivos em ordem de criação", { type: "array", items: schema("Device") }), "401": response("Unauthorized") } },
        post: { tags: ["Dispositivos"], summary: "Cadastra dispositivo; a chave é armazenada como hash", security: admin, requestBody: { required: true, content: { "application/json": { schema: schema("DeviceInput") } } }, responses: { "201": ok("Dispositivo criado", schema("Device")), "400": response("BadRequest"), "401": response("Unauthorized") } },
      },
      "/api/devices/{id}": {
        get: { tags: ["Dispositivos"], summary: "Busca dispositivo", security: admin, parameters: [param("Id")], responses: { "200": ok("Dispositivo", schema("Device")), "401": response("Unauthorized"), "404": response("NotFound") } },
        patch: { tags: ["Dispositivos"], summary: "Atualiza dispositivo (exceto apiKey)", security: admin, parameters: [param("Id")], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string", minLength: 2, maxLength: 100 }, serialNumber: { type: "string", minLength: 3, maxLength: 100 }, maxLoadKg: { type: "number", exclusiveMinimum: 0, maximum: 100 }, maxCurrent: { type: "number", exclusiveMinimum: 0, maximum: 100 } } } } } }, responses: { "200": ok("Dispositivo atualizado", schema("Device")), "400": response("BadRequest"), "401": response("Unauthorized"), "404": response("NotFound") } },
      },
      "/api/devices/{deviceId}/telemetry": { get: { tags: ["Telemetria"], summary: "Lista histórico de telemetria", security: admin, parameters: [param("DeviceId"), { name: "limit", in: "query", description: "Padrão 100; máximo efetivo 500.", schema: { type: "integer", default: 100 } }], responses: { "200": ok("Leituras mais recentes primeiro", { type: "array", items: schema("Telemetry") }), "401": response("Unauthorized") } } },
      "/api/devices/{deviceId}/telemetry/latest": { get: { tags: ["Telemetria"], summary: "Consulta telemetria mais recente", security: admin, parameters: [param("DeviceId")], responses: { "200": ok("Leitura mais recente ou null", { allOf: [schema("Telemetry")], nullable: true }), "401": response("Unauthorized") } } },
      "/api/devices/{deviceId}/alerts": { get: { tags: ["Alertas"], summary: "Lista alertas do dispositivo", security: admin, parameters: [param("DeviceId"), { name: "active", in: "query", description: "true filtra alertas não reconhecidos.", schema: { type: "boolean" } }], responses: { "200": ok("Alertas mais recentes primeiro", { type: "array", items: schema("Alert") }), "401": response("Unauthorized") } } },
      "/api/devices/{deviceId}/dashboard": { get: { tags: ["Dispositivos"], summary: "Obtém resumo operacional do dispositivo", description: "Com MOCK_MODE ativo, retorna o estado de demonstração editável em /api/mock/data.", security: admin, parameters: [param("DeviceId")], responses: { "200": ok("Resumo real ou estado mock", schema("Dashboard")), "401": response("Unauthorized"), "404": response("NotFound") } } },
      "/api/alerts/{id}/acknowledge": { patch: { tags: ["Alertas"], summary: "Reconhece alerta", security: admin, parameters: [param("Id")], responses: { "200": ok("Alerta reconhecido", schema("Alert")), "401": response("Unauthorized"), "404": response("NotFound") } } },
      "/api/cycles": {
        get: { tags: ["Ciclos"], summary: "Lista ciclos", security: admin, parameters: [{ name: "deviceId", in: "query", schema: { type: "string" } }], responses: { "200": ok("Ciclos mais recentes primeiro", { type: "array", items: schema("Cycle") }), "401": response("Unauthorized") } },
        post: { tags: ["Ciclos"], summary: "Inicia ciclo de secagem", security: admin, requestBody: { required: true, content: { "application/json": { schema: schema("CycleInput") } } }, responses: { "201": ok("Ciclo criado no estado PREPARING", schema("Cycle")), "400": response("BadRequest"), "401": response("Unauthorized") } },
      },
      "/api/cycles/{id}": { get: { tags: ["Ciclos"], summary: "Busca ciclo", security: admin, parameters: [param("Id")], responses: { "200": ok("Ciclo", schema("Cycle")), "401": response("Unauthorized"), "404": response("NotFound") } } },
      "/api/cycles/{id}/status": { patch: { tags: ["Ciclos"], summary: "Atualiza estado do ciclo", description: "Transições: IDLE→PREPARING; PREPARING→DRYING|CANCELLED|ERROR; DRYING→PAUSED|COMPLETED|CANCELLED|ERROR; PAUSED→DRYING|CANCELLED|ERROR. Estados finais não permitem transições.", security: admin, parameters: [param("Id")], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: schema("CycleStatus") } } } } }, responses: { "200": ok("Ciclo atualizado", schema("Cycle")), "400": response("BadRequest"), "401": response("Unauthorized"), "404": response("NotFound"), "409": response("Conflict") } } },
      "/api/cycles/{id}/cancel": { post: { tags: ["Ciclos"], summary: "Cancela ciclo", security: admin, parameters: [param("Id")], responses: { "200": ok("Ciclo cancelado", schema("Cycle")), "401": response("Unauthorized"), "404": response("NotFound"), "409": response("Conflict") } } },
    },
  },
  apis: [],
});
