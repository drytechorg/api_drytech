import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "DryTech IoT API",
      version: "1.0.0",
      description:
        "API REST para gestão de secadoras IoT, ciclos de secagem, telemetria e alertas. A interface interativa está disponível em /api/docs.",
    },
    servers: [{ url: "/", description: "Servidor atual" }],
    tags: [
      { name: "Health", description: "Disponibilidade da API" },
      { name: "IoT", description: "Rotas autenticadas dos dispositivos" },
      { name: "Dispositivos", description: "Gestão administrativa de dispositivos" },
      { name: "Telemetria", description: "Consulta de leituras registradas" },
      { name: "Alertas", description: "Consulta e reconhecimento de alertas" },
      { name: "Ciclos", description: "Gestão dos ciclos de secagem" },
    ],
    components: {
      parameters: {
        Id: { name: "id", in: "path", required: true, description: "ID CUID do recurso.", schema: { type: "string" } },
        DeviceId: { name: "deviceId", in: "path", required: true, description: "ID CUID do dispositivo.", schema: { type: "string" } },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT administrativo no cabeçalho Authorization.",
        },
        deviceApiKey: {
          type: "apiKey",
          in: "header",
          name: "x-device-api-key",
          description: "Chave de API cadastrada para o dispositivo.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Validation error" },
            details: { type: "object", description: "Detalhes de validação Zod (presente em erros 400)." },
          },
          required: ["error"],
        },
        TelemetryInput: {
          type: "object",
          required: ["temperature", "humidity", "weight", "doorOpen", "motorOn", "heaterOn", "fanOn", "current", "voltage", "energyConsumption", "timestamp"],
          properties: {
            temperature: { type: "number", minimum: -40, maximum: 150, example: 52.4 },
            humidity: { type: "number", minimum: 0, maximum: 100, example: 31.8 },
            weight: { type: "number", minimum: 0, maximum: 100, example: 2.4 },
            doorOpen: { type: "boolean", example: false },
            motorOn: { type: "boolean", example: true },
            heaterOn: { type: "boolean", example: true },
            fanOn: { type: "boolean", example: true },
            current: { type: "number", minimum: 0, maximum: 100, example: 4.2 },
            voltage: { type: "number", minimum: 0, maximum: 500, example: 220 },
            energyConsumption: { type: "number", minimum: 0, maximum: 10000, example: 1.25 },
            cycleId: { type: "string", description: "ID CUID de um ciclo pertencente ao dispositivo." },
            timestamp: { type: "string", format: "date-time", example: "2026-11-25T12:00:00.000Z" },
          },
        },
        Telemetry: {
          allOf: [
            { $ref: "#/components/schemas/TelemetryInput" },
            { type: "object", properties: { id: { type: "string" }, deviceId: { type: "string" }, createdAt: { type: "string", format: "date-time" } } },
          ],
        },
        TelemetryResult: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            device: { type: "object", properties: { id: { type: "string" } } },
            cycle: { nullable: true, type: "object", properties: { id: { type: "string" }, status: { $ref: "#/components/schemas/CycleStatus" } } },
            commands: { type: "object", properties: { heater: { type: "string", example: "ON" }, fan: { type: "string", example: "ON" }, motor: { type: "string", example: "ON" } } },
            safety: { type: "object", properties: { safe: { type: "boolean" }, emergencyStop: { type: "boolean" }, reason: { type: "string" } } },
            nextTelemetryIn: { type: "number", description: "Intervalo para a próxima leitura, em segundos." },
          },
        },
        DeviceInput: {
          type: "object", required: ["name", "serialNumber", "apiKey"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100, example: "Secadora 01" },
            serialNumber: { type: "string", minLength: 3, maxLength: 100, example: "DRY-0001" },
            apiKey: { type: "string", minLength: 24, writeOnly: true, example: "chave-secreta-com-ao-menos-24" },
            maxLoadKg: { type: "number", exclusiveMinimum: 0, maximum: 100 },
            maxCurrent: { type: "number", exclusiveMinimum: 0, maximum: 100 },
          },
        },
        Device: {
          type: "object", properties: {
            id: { type: "string" }, name: { type: "string" }, serialNumber: { type: "string" },
            status: { $ref: "#/components/schemas/DeviceStatus" }, lastSeen: { type: "string", format: "date-time", nullable: true },
            maxLoadKg: { type: "number", nullable: true }, maxCurrent: { type: "number", nullable: true },
            createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
          },
        },
        DeviceStatus: { type: "string", enum: ["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"] },
        CycleStatus: { type: "string", enum: ["IDLE", "PREPARING", "DRYING", "PAUSED", "COMPLETED", "CANCELLED", "ERROR"] },
        CycleInput: {
          type: "object", required: ["deviceId", "initialWeight"],
          properties: {
            deviceId: { type: "string", description: "ID CUID do dispositivo." },
            initialWeight: { type: "number", exclusiveMinimum: 0, example: 4.5 },
            targetHumidity: { type: "number", minimum: 0, maximum: 100, description: "Opcional; usa DRYER_TARGET_HUMIDITY se omitido." },
          },
        },
        Cycle: {
          type: "object", properties: {
            id: { type: "string" }, deviceId: { type: "string" }, status: { $ref: "#/components/schemas/CycleStatus" },
            startTime: { type: "string", format: "date-time" }, endTime: { type: "string", format: "date-time", nullable: true },
            initialWeight: { type: "number" }, finalWeight: { type: "number", nullable: true }, targetHumidity: { type: "number" },
            maximumTemperature: { type: "number" }, energyConsumed: { type: "number" }, lowHumidityReadings: { type: "integer" },
            createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
          },
        },
        Alert: {
          type: "object", properties: {
            id: { type: "string" }, deviceId: { type: "string" }, cycleId: { type: "string", nullable: true },
            type: { type: "string", enum: ["HIGH_TEMPERATURE", "LOW_TEMPERATURE", "HIGH_HUMIDITY", "DOOR_OPEN", "OVERCURRENT", "OVERWEIGHT", "SENSOR_FAILURE", "COMMUNICATION_FAILURE", "ABNORMAL_ENERGY", "DRYING_COMPLETE"] },
            severity: { type: "string", enum: ["INFO", "WARNING", "CRITICAL"] }, message: { type: "string" }, value: { type: "number", nullable: true },
            acknowledged: { type: "boolean" }, createdAt: { type: "string", format: "date-time" },
          },
        },
        Dashboard: {
          type: "object", properties: {
            device: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, status: { $ref: "#/components/schemas/DeviceStatus" }, lastSeen: { type: "string", format: "date-time", nullable: true } } },
            telemetry: { allOf: [{ $ref: "#/components/schemas/Telemetry" }], nullable: true },
            cycle: { allOf: [{ $ref: "#/components/schemas/Cycle" }], nullable: true, description: "Inclui durationSeconds e energyPerKg." },
            activeAlerts: { type: "array", items: { $ref: "#/components/schemas/Alert" } },
          },
        },
      },
      responses: {
        BadRequest: { description: "Payload ou parâmetros inválidos.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        Unauthorized: { description: "Credenciais ausentes ou inválidas.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        NotFound: { description: "Recurso não encontrado.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        Conflict: { description: "Transição de estado do ciclo não permitida.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      },
    },
    paths: {
      "/health": {
        get: { tags: ["Health"], summary: "Verifica a disponibilidade da API", responses: { "200": { description: "API disponível", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" } } } } } } },
      },
      "/api/iot/devices/{deviceId}/telemetry": {
        post: {
          tags: ["IoT"], summary: "Envia telemetria e recebe comandos e estado de segurança", security: [{ deviceApiKey: [] }],
          parameters: [{ $ref: "#/components/parameters/DeviceId" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TelemetryInput" } } } },
          responses: { "200": { description: "Telemetria processada", content: { "application/json": { schema: { $ref: "#/components/schemas/TelemetryResult" } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } },
        },
      },
      "/api/iot/devices/{deviceId}/heartbeat": {
        post: { tags: ["IoT"], summary: "Registra heartbeat do dispositivo", security: [{ deviceApiKey: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }], responses: { "200": { description: "Heartbeat registrado; informa intervalo de telemetria", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, nextTelemetryIn: { type: "number" } } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/iot/devices/{deviceId}/status": {
        get: { tags: ["IoT"], summary: "Consulta estado atual do dispositivo", security: [{ deviceApiKey: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }], responses: { "200": { description: "Dispositivo, última telemetria e ciclo ativo", content: { "application/json": { schema: { type: "object", properties: { device: { $ref: "#/components/schemas/Device" }, telemetry: { allOf: [{ $ref: "#/components/schemas/Telemetry" }], nullable: true }, cycle: { allOf: [{ $ref: "#/components/schemas/Cycle" }], nullable: true } } } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
      },
      "/api/devices": {
        get: { tags: ["Dispositivos"], summary: "Lista dispositivos (mais recentes primeiro)", security: [{ bearerAuth: [] }], responses: { "200": { description: "Lista de dispositivos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Device" } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
        post: { tags: ["Dispositivos"], summary: "Cadastra dispositivo", description: "A chave de API é armazenada como hash e não é retornada.", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceInput" } } } }, responses: { "201": { description: "Dispositivo criado", content: { "application/json": { schema: { $ref: "#/components/schemas/Device" } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/devices/{id}": {
        get: { tags: ["Dispositivos"], summary: "Busca dispositivo por ID", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Dispositivo", content: { "application/json": { schema: { $ref: "#/components/schemas/Device" } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
        patch: { tags: ["Dispositivos"], summary: "Atualiza dados do dispositivo", description: "Aceita os campos de cadastro exceto apiKey; todos são opcionais.", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string", minLength: 2, maxLength: 100 }, serialNumber: { type: "string", minLength: 3, maxLength: 100 }, maxLoadKg: { type: "number", exclusiveMinimum: 0, maximum: 100 }, maxCurrent: { type: "number", exclusiveMinimum: 0, maximum: 100 } } } } } }, responses: { "200": { description: "Dispositivo atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Device" } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
      },
      "/api/devices/{deviceId}/telemetry": {
        get: { tags: ["Telemetria"], summary: "Lista histórico de telemetria", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }, { name: "limit", in: "query", description: "Quantidade máxima (padrão 100; limite efetivo 500).", schema: { type: "integer", default: 100, example: 100 } }], responses: { "200": { description: "Leituras em ordem decrescente de timestamp", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Telemetry" } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/devices/{deviceId}/telemetry/latest": {
        get: { tags: ["Telemetria"], summary: "Consulta a telemetria mais recente", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }], responses: { "200": { description: "Leitura mais recente ou null se não houver leituras", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/Telemetry" }], nullable: true } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/devices/{deviceId}/alerts": {
        get: { tags: ["Alertas"], summary: "Lista alertas de um dispositivo", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }, { name: "active", in: "query", description: "Use true para retornar apenas alertas não reconhecidos.", schema: { type: "boolean", default: false } }], responses: { "200": { description: "Alertas em ordem decrescente de criação", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Alert" } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/devices/{deviceId}/dashboard": {
        get: { tags: ["Dispositivos"], summary: "Obtém resumo operacional do dispositivo", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/DeviceId" }], responses: { "200": { description: "Resumo com telemetria, ciclo ativo e alertas pendentes", content: { "application/json": { schema: { $ref: "#/components/schemas/Dashboard" } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
      },
      "/api/alerts/{id}/acknowledge": {
        patch: { tags: ["Alertas"], summary: "Reconhece um alerta", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Alerta reconhecido", content: { "application/json": { schema: { $ref: "#/components/schemas/Alert" } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
      },
      "/api/cycles": {
        get: { tags: ["Ciclos"], summary: "Lista ciclos", security: [{ bearerAuth: [] }], parameters: [{ name: "deviceId", in: "query", description: "Filtra pelo ID do dispositivo.", schema: { type: "string" } }], responses: { "200": { description: "Ciclos em ordem decrescente de criação", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Cycle" } } } }, "401": { $ref: "#/components/responses/Unauthorized" } } },
        post: { tags: ["Ciclos"], summary: "Inicia um ciclo de secagem", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CycleInput" } } } }, responses: { "201": { description: "Ciclo criado no estado PREPARING", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" } } },
      },
      "/api/cycles/{id}": {
        get: { tags: ["Ciclos"], summary: "Busca ciclo por ID", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Ciclo", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" } } },
      },
      "/api/cycles/{id}/status": {
        patch: { tags: ["Ciclos"], summary: "Atualiza estado do ciclo", description: "Transições permitidas: IDLE→PREPARING; PREPARING→DRYING|CANCELLED|ERROR; DRYING→PAUSED|COMPLETED|CANCELLED|ERROR; PAUSED→DRYING|CANCELLED|ERROR. Estados finais não permitem transição.", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { $ref: "#/components/schemas/CycleStatus" } } } } } }, responses: { "200": { description: "Ciclo atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" }, "409": { $ref: "#/components/responses/Conflict" } } },
      },
      "/api/cycles/{id}/cancel": {
        post: { tags: ["Ciclos"], summary: "Cancela ciclo", description: "O ciclo precisa permitir a transição para CANCELLED.", security: [{ bearerAuth: [] }], parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Ciclo cancelado", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } }, "401": { $ref: "#/components/responses/Unauthorized" }, "404": { $ref: "#/components/responses/NotFound" }, "409": { $ref: "#/components/responses/Conflict" } } },
      },
    },
  },
  apis: [],
});
