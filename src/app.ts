import express from 'express';
import { setupSwagger } from './swagger';
import { webhookController } from './controllers/WebhookController';
import { AppDataSource } from './data-source';
import { monitoringService } from './services/monitoringService';

const app = express();
app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Routes
app.use('/api', webhookController);

// Connect to database and start monitoring
AppDataSource.initialize().then(() => {
    console.log('Database connected');
    monitoringService; // Ensure monitoring service is initialized

    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
}).catch(error => console.log('Database connection error:', error));
