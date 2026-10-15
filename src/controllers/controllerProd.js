const db = require('../database/db');

const TABELA = 'veiculos';

const CAMPOS = [
  'modelo',
  'tipo_propulsao',
  'ano_modelo',
  'autonomia_km',
  'capacidade_bateria_kwh',
  'preco_base',
  'status_producao',
];

const OBRIGATORIOS = ['modelo', 'tipo_propulsao', 'ano_modelo', 'preco_base'];

// Mantém apenas os campos conhecidos do corpo da requisição
function filtrarCampos(body) {
  const dados = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) dados[campo] = body[campo];
  }
  return dados;
}

function isNumero(valor) {
  return valor !== null && valor !== '' && !Number.isNaN(Number(valor));
}

// Retorna uma lista de mensagens de erro (vazia se estiver tudo certo).
// Em PUT (completo = true) exige todos os campos obrigatórios.
function validar(dados, completo) {
  const erros = [];

  if (completo) {
    for (const campo of OBRIGATORIOS) {
      if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
        erros.push(`O campo '${campo}' é obrigatório`);
      }
    }
  }

  if (dados.modelo !== undefined && dados.modelo !== null) {
    if (typeof dados.modelo !== 'string' || dados.modelo.trim() === '') {
      erros.push("O campo 'modelo' deve ser um texto não vazio");
    } else if (dados.modelo.length > 100) {
      erros.push("O campo 'modelo' deve ter no máximo 100 caracteres");
    }
  }

  if (dados.ano_modelo !== undefined && dados.ano_modelo !== null) {
    if (!Number.isInteger(Number(dados.ano_modelo)) || !isNumero(dados.ano_modelo)) {
      erros.push("O campo 'ano_modelo' deve ser um número inteiro");
    }
  }

  if (dados.autonomia_km !== undefined && dados.autonomia_km !== null) {
    if (!Number.isInteger(Number(dados.autonomia_km)) || !isNumero(dados.autonomia_km) || Number(dados.autonomia_km) < 0) {
      erros.push("O campo 'autonomia_km' deve ser um inteiro maior ou igual a zero");
    }
  }

  if (dados.capacidade_bateria_kwh !== undefined && dados.capacidade_bateria_kwh !== null) {
    if (!isNumero(dados.capacidade_bateria_kwh) || Number(dados.capacidade_bateria_kwh) < 0) {
      erros.push("O campo 'capacidade_bateria_kwh' deve ser um número maior ou igual a zero");
    }
  }

  if (dados.preco_base !== undefined && dados.preco_base !== null) {
    if (!isNumero(dados.preco_base) || Number(dados.preco_base) < 0) {
      erros.push("O campo 'preco_base' deve ser um número maior ou igual a zero");
    }
  }

  return erros;
}

function idValido(id) {
  return /^\d+$/.test(id) && Number(id) > 0 && Number(id) <= 2147483647;
}

// Trata erros do banco (ex.: valor inválido para enum) como 400
function responderErroBanco(res, err) {
  // 22P02 = invalid_text_representation (ex.: valor fora do enum)
  // 22003 = numeric_value_out_of_range
  // 23502 = not_null_violation
  if (['22P02', '22003', '23502', '22001'].includes(err.code)) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhe: err.message });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

async function listar(req, res) {
  try {
    const veiculos = await db(TABELA).select('*').orderBy('id');
    return res.status(200).json(veiculos);
  } catch (err) {
    return responderErroBanco(res, err);
  }
}

async function buscarPorId(req, res) {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ erro: 'id inválido' });

  try {
    const veiculo = await db(TABELA).where({ id }).first();
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });
    return res.status(200).json(veiculo);
  } catch (err) {
    return responderErroBanco(res, err);
  }
}

async function criar(req, res) {
  const dados = filtrarCampos(req.body || {});
  const erros = validar(dados, true);
  if (erros.length) return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });

  // Se status_producao não vier, o DEFAULT 'em_producao' do banco prevalece
  if (dados.status_producao === null || dados.status_producao === '') {
    delete dados.status_producao;
  }

  try {
    const [veiculo] = await db(TABELA).insert(dados).returning('*');
    return res.status(201).json(veiculo);
  } catch (err) {
    return responderErroBanco(res, err);
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ erro: 'id inválido' });

  const dados = filtrarCampos(req.body || {});
  const erros = validar(dados, true);
  if (erros.length) return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });

  if (dados.status_producao === null || dados.status_producao === '') {
    delete dados.status_producao;
  }

  try {
    const [veiculo] = await db(TABELA).where({ id }).update(dados).returning('*');
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });
    return res.status(200).json(veiculo);
  } catch (err) {
    return responderErroBanco(res, err);
  }
}

async function remover(req, res) {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).json({ erro: 'id inválido' });

  try {
    const removidos = await db(TABELA).where({ id }).del();
    if (!removidos) return res.status(404).json({ erro: 'Veículo não encontrado' });
    return res.status(204).send();
  } catch (err) {
    return responderErroBanco(res, err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
