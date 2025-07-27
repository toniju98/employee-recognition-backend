import KeycloakConnect from 'keycloak-connect';
import session from 'express-session';

const memoryStore = new session.MemoryStore();

export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
});

const keycloakConfig = {
   realm: process.env.KEYCLOAK_REALM || 'employee-recognition',
  'auth-server-url': process.env.KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'employee-recognition-backend',
  'bearer-only': true,
  'confidential-port': 0,
  'use-resource-role-mappings': false
};

export const keycloak = new KeycloakConnect({ store: memoryStore }, keycloakConfig);
