import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.router';
import swaggerUi from 'swagger-ui-express'
const swaggerDocument = require('./swagger-output.json');
const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello Auth Service API' });
});

//setting up swagger ui
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//get the swagger document
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerDocument);
});

app.use("/api", authRouter);

app.use(errorMiddleware);

const PORT = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(PORT, () => {
  console.log(`[ ready ] http://localhost:${PORT}`);
  console.log(`[ swagger ] http://localhost:${PORT}/api-docs`);
});
server.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

