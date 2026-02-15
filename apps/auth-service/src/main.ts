import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';

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

app.use(errorMiddleware);

const PORT = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(PORT, () => {
  console.log(`[ ready ] http://localhost:${PORT}/api`);
});
server.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

