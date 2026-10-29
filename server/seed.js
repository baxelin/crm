const { db, insert, transaction } = require('./db');
const { daysFromToday, paymentStatus } = require('./utils');

const TABLES = ['payments', 'services', 'interactions', 'tasks', 'contacts'];

const contacts = [
  {
    key: 'ana',
    name: 'Ana Beatriz Souza',
    phone: '11900000001',
    email: 'ana@example.com',
    address: 'Av. Paulista, 1000, São Paulo, SP',
    website: 'ana-fotografia.example.com',
    status: 'cliente',
    origin: 'Indicação',
    first_contact_date: daysFromToday(-90),
    last_contact_date: daysFromToday(-3),
    notes: 'Fotógrafa, precisa de manutenção mensal do site e social media.',
  },
  {
    key: 'cafe',
    name: 'Café Raiz',
    phone: '11900000002',
    email: 'contato@cafe-raiz.example.com',
    address: 'Rua Augusta, 500, São Paulo, SP',
    website: 'cafe-raiz.example.com',
    status: 'cliente',
    origin: 'Instagram',
    first_contact_date: daysFromToday(-60),
    last_contact_date: daysFromToday(-1),
    notes: 'Cafeteria local, site institucional + social media semanal.',
  },
  {
    key: 'advocacia',
    name: 'Marcos Vinícius Advocacia',
    phone: '11900000003',
    email: 'marcos@advocacia.example.com',
    address: 'Alameda Santos, 200, São Paulo, SP',
    website: null,
    status: 'lead',
    origin: 'Site',
    first_contact_date: daysFromToday(-10),
    last_contact_date: daysFromToday(-5),
    notes: 'Interessado em site institucional. Aguardando retorno da proposta.',
  },
  {
    key: 'pilates',
    name: 'Studio Pilates Move',
    phone: '11900000004',
    email: 'contato@pilates.example.com',
    address: 'Rua Oscar Freire, 800, São Paulo, SP',
    website: null,
    status: 'lead',
    origin: 'Indicação',
    first_contact_date: daysFromToday(-4),
    last_contact_date: daysFromToday(-4),
    notes: 'Quer social media 3x por semana. Primeira reunião marcada.',
  },
  {
    key: 'loja',
    name: 'Loja Verde Vida',
    phone: '11900000005',
    email: 'contato@verdevida.example.com',
    address: 'Rua Harmonia, 45, São Paulo, SP',
    website: 'verdevida.example.com',
    status: 'inativo',
    origin: 'Google',
    first_contact_date: daysFromToday(-200),
    last_contact_date: daysFromToday(-120),
    notes: 'Contrato encerrado, cliente pausou operações.',
  },
];

const interactions = [
  ['ana', -90, 'Primeiro contato via indicação de cliente antigo.'],
  ['ana', -80, 'Reunião de briefing e fechamento do escopo do site.'],
  ['ana', -3, 'Enviado calendário de posts do mês.'],
  ['cafe', -60, 'Contato inicial pelo Instagram.'],
  ['cafe', -1, 'Aprovação das artes da semana.'],
  ['advocacia', -10, 'Preencheu formulário do site pedindo orçamento.'],
  ['advocacia', -5, 'Enviada proposta comercial por e-mail.'],
  ['pilates', -4, 'Indicação da Ana Beatriz. Primeira conversa por telefone.'],
  ['loja', -120, 'Cliente avisou que vai pausar as operações da loja.'],
];

const services = [
  { key: 'anaSite', contact: 'ana', type: 'site', description: 'Site portfólio fotográfico', status: 'encerrado', startedIn: -85 },
  { key: 'anaMaintenance', contact: 'ana', type: 'manutencao_site', description: 'Manutenção mensal do site', status: 'ativo', startedIn: -60 },
  { key: 'anaSocial', contact: 'ana', type: 'social_media', description: 'Social media, 3 posts por semana', status: 'ativo', startedIn: -60 },
  { key: 'cafeSite', contact: 'cafe', type: 'site', description: 'Site institucional com cardápio', status: 'encerrado', startedIn: -55 },
  { key: 'cafeSocial', contact: 'cafe', type: 'social_media', description: 'Social media semanal', status: 'ativo', startedIn: -50 },
];

const payments = [
  { service: 'anaSite', type: 'unico', amount: 1800, dueIn: -85, paidIn: -84, notes: 'Pagamento à vista do site.' },
  { service: 'anaMaintenance', type: 'mensalidade', amount: 150, dueIn: -30, paidIn: -28, notes: 'Mensalidade do mês passado.' },
  { service: 'anaMaintenance', type: 'mensalidade', amount: 150, dueIn: 2, notes: 'Mensalidade deste mês.' },
  { service: 'anaSocial', type: 'mensalidade', amount: 400, dueIn: -2, notes: 'Social media em atraso.' },
  { service: 'cafeSite', type: 'parcela', amount: 900, dueIn: -55, paidIn: -55, notes: 'Parcela 1/2.' },
  { service: 'cafeSite', type: 'parcela', amount: 900, dueIn: 4, notes: 'Parcela 2/2.' },
  { service: 'cafeSocial', type: 'mensalidade', amount: 350, dueIn: 1, notes: 'Mensalidade de social media.' },
];

const tasks = [
  ['cafe', 0, 'manha', 'Social media', 'Gravar stories do dia'],
  ['ana', 0, 'tarde', 'Manutenção do site', 'Atualizar galeria de fotos'],
  [null, 0, 'dia_inteiro', 'Planejamento de conteúdo', 'Planejar posts da semana'],
  ['advocacia', 1, 'manha', 'Reunião', 'Apresentar proposta comercial'],
  ['pilates', 1, 'tarde', 'Reunião de briefing', 'Definir escopo do social media'],
  ['cafe', 2, 'dia_inteiro', 'Social media', 'Publicar posts da semana'],
  [null, 3, 'manha', 'Redes sociais da agência', 'Postar cases de clientes'],
  ['ana', 4, 'tarde', 'Cobrança mensal', 'Enviar cobrança da mensalidade'],
  ['pilates', 5, 'manha', 'Follow-up', 'Ligar para saber a decisão da proposta'],
  [null, 6, 'dia_inteiro', 'Planejamento mensal', 'Revisar métricas do mês'],
];

function clearDatabase() {
  for (const table of TABLES) db.exec(`DELETE FROM ${table}`);
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN (${TABLES.map((t) => `'${t}'`).join(', ')})`);
}

function seed() {
  clearDatabase();

  const contactIds = {};
  for (const { key, ...contact } of contacts) {
    contactIds[key] = insert('contacts', contact).id;
  }

  for (const [contact, daysAgo, note] of interactions) {
    insert('interactions', { contact_id: contactIds[contact], date: daysFromToday(daysAgo), note });
  }

  const serviceRows = {};
  for (const { key, contact, startedIn, ...service } of services) {
    serviceRows[key] = insert('services', {
      ...service,
      contact_id: contactIds[contact],
      started_at: daysFromToday(startedIn),
    });
  }

  for (const { service, dueIn, paidIn, ...payment } of payments) {
    const dates = {
      due_date: daysFromToday(dueIn),
      paid_date: paidIn === undefined ? null : daysFromToday(paidIn),
    };
    insert('payments', {
      ...payment,
      ...dates,
      contact_id: serviceRows[service].contact_id,
      service_id: serviceRows[service].id,
      status: paymentStatus(dates),
    });
  }

  for (const [contact, dayOffset, period, title, notes] of tasks) {
    insert('tasks', {
      contact_id: contact ? contactIds[contact] : null,
      date: daysFromToday(dayOffset),
      period,
      title,
      notes,
    });
  }
}

transaction(seed);
console.log('Banco populado com dados de exemplo.');
