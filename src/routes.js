const express = require('express');
const controller = require('./controllers/controllerProd');

const router = express.Router();

router.get('/veiculos', controller.listar);
router.get('/veiculos/:id', controller.buscarPorId);
router.post('/veiculos', controller.criar);
router.put('/veiculos/:id', controller.atualizar);
router.delete('/veiculos/:id', controller.remover);

module.exports = router;
