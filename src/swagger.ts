import { Application } from 'express';
const swaggerJsdoc = require('swagger-jsdoc'); // Use require for swagger-jsdoc
const swaggerUi = require('swagger-ui-express');


export function setupSwagger(app: Application) {
    const swaggerSpec = swaggerJsdoc({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'GitHub Commit Processor',
                version: '1.0.0',
                description: 'API documentation for GitHub Commit Processor',
            },
        },
        apis: ['./src/controllers/*.ts'],
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
