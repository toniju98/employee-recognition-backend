import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { connectDB } from './config/database';
import dotenv from 'dotenv';
import routes from './routes';
import { keycloak, sessionConfig } from './config/keycloak';
import { syncUserProfile } from './middleware/authMiddleware';
import cors from "cors";
import path from 'path';



dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(sessionConfig);
app.use(keycloak.middleware());


// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

//TODO: fix with keycloak.protect()
// In your Express app setup
app.use('/uploads',express.static(path.join(__dirname, '../uploads')));


// Routes with Keycloak protection and user profile sync
app.use('/api', keycloak.protect(), syncUserProfile, routes);

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

export default app;
