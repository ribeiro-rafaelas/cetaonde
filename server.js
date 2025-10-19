require('dotenv').config();

const express = require('express');
const path = require('path');
const routes = require('./src/routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use('/', routes);

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  } else {
    res.status(500).render('500');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
