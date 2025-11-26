import { Product, Theme, Review, Equipment } from './types';

export const THEMES: Theme[] = [
  {
    name: 'Fresh Nature',
    id: 'nature',
    colors: {
      primary: '#4ade80', 
      secondary: '#14532d', 
      accent: '#facc15', 
      bg: '#f8fafc', 
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#94a3b8',
    },
  },
  {
    name: 'Warm Earth',
    id: 'earth',
    colors: {
      primary: '#fb923c', 
      secondary: '#7c2d12', 
      accent: '#14b8a6', 
      bg: '#fff7ed', 
      surface: '#ffffff',
      text: '#431407',
      muted: '#a8a29e',
    },
  },
  {
    name: 'Cyber Grow',
    id: 'tech',
    colors: {
      primary: '#d946ef', 
      secondary: '#4c1d95', 
      accent: '#06b6d4', 
      bg: '#0f172a', 
      surface: '#1e293b', 
      text: '#e2e8f0',
      muted: '#64748b',
    },
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'kit-001',
    name: 'Стартовый набор "Витамин"',
    description: 'Идеальный выбор для новичков. Содержит всё необходимое для первого урожая.',
    details: 'Включает в себя: 2 многоразовых лотка, 4 льняных коврика, семена гороха, редиса, рукколы и подсолнечника. Инструкция по выращиванию включена. Горох богат протеином и витамином С, редис улучшает пищеварение, а подсолнечник содержит редкие аминокислоты. Урожай через 7 дней.',
    price: 1290,
    oldPrice: 1590,
    isHit: true,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Easy',
    growthTime: '7-10 дней',
    dimensions: '10 x 20 x 30 см',
    equipmentIds: [] 
  },
  {
    id: 'kit-002',
    name: 'Набор "Гурман Pro"',
    description: 'Для тех, кто хочет экспериментировать с редкими вкусами.',
    details: 'Продвинутый набор с кокосовым субстратом и фитолампой USB. Амарант — источник сквалена для иммунитета, красный базилик богат антоцианами (антиоксиданты), а горчица стимулирует обмен веществ. Идеально для сложных кулинарных экспериментов.',
    price: 2450,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Medium',
    growthTime: '10-14 дней',
    dimensions: '35 x 25 x 40 см',
    equipmentIds: ['eq-011', 'eq-008']
  },
  {
    id: 'kit-003',
    name: 'Детский садик',
    description: 'Веселый и познавательный набор для детей.',
    details: 'Яркие лотки, наклейки, дневник наблюдений. Самые быстрорастущие культуры: кресс-салат (готов за 5 дней, богат йодом) и редис (натуральный антисептик). Развивает у детей ответственность и интерес к здоровому питанию.',
    price: 990,
    isHit: true,
    image: 'https://images.unsplash.com/photo-1589606663939-51e8478c95f1?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Easy',
    growthTime: '5-7 дней',
    dimensions: '15 x 25 x 25 см',
    equipmentIds: []
  },
  {
    id: 'kit-004',
    name: 'Smart Garden: Бамбук',
    description: 'Премиальный набор с бамбуковой подставкой и автополивом.',
    details: 'Эстетика и технологии. Система фитильного автополива позволяет оставлять растения без присмотра на неделю. Красная капуста содержит в 40 раз больше витамина Е, чем взрослая, а базилик улучшает настроение и снимает стресс. Идеально вписывается в скандинавский интерьер.',
    price: 3890,
    oldPrice: 4500,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Medium',
    growthTime: '7-12 дней',
    dimensions: '45 x 30 x 50 см',
    equipmentIds: ['eq-004', 'eq-011', 'eq-009']
  },
  {
    id: 'kit-005',
    name: 'Шеф-Повар Box',
    description: 'Выбор профессионалов. Острые и пряные вкусы для высокой кухни.',
    details: 'Специальная подборка для украшения блюд. Редис Санго (фиолетовый) богат антоцианами. Бораго (вкус огурца) улучшает состояние кожи. Настурция — природный антибиотик. В комплекте профессиональные ножницы для срезки и пинцет.',
    price: 2100,
    image: 'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Hard',
    growthTime: '10-15 дней',
    dimensions: '20 x 30 x 40 см',
    equipmentIds: []
  },
  {
    id: 'kit-006',
    name: 'Здоровье Detox',
    description: 'Максимальная концентрация антиоксидантов и витаминов.',
    details: 'Набор для выращивания Витграсса и Брокколи. Витграсс на 70% состоит из хлорофилла — мощнейшего детоксиканта. Ростки брокколи содержат сульфорафан, защищающий клетки организма. В комплекте ручная шнековая соковыжималка для шотов.',
    price: 4500,
    isHit: true,
    image: 'https://images.unsplash.com/photo-1601643067407-178e0d157567?auto=format&fit=crop&q=80&w=800',
    category: 'kit',
    difficulty: 'Medium',
    growthTime: '7 дней',
    dimensions: '30 x 40 x 50 см',
    equipmentIds: ['eq-007']
  },
  {
    id: 'seed-001',
    name: 'Семена Гороха Мадрас',
    description: 'Сладкие, хрустящие ростки с легким ореховым вкусом.',
    details: 'Упаковка 50г. Высокая всхожесть. Микрозелень гороха богата растительным инсулином, витаминами группы B и С. Улучшает память и работоспособность.',
    price: 150,
    image: 'https://images.unsplash.com/photo-1627488193141-85d87f204c30?auto=format&fit=crop&q=80&w=800',
    category: 'seeds',
    variants: [
        { id: '50g', name: '50 г', price: 150 },
        { id: '100g', name: '100 г', price: 280 },
        { id: '500g', name: '500 г', price: 1200 }
    ]
  },
  {
    id: 'seed-002',
    name: 'Семена Рукколы Индау',
    description: 'Пряная, ореховая, невероятно полезная.',
    details: 'Руккола — королева микрозелени. Интенсивный орехово-горчичный вкус. Лидер по содержанию йода и железа, повышает гемоглобин и укрепляет стенки сосудов.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1536638317175-d20351222244?auto=format&fit=crop&q=80&w=800',
    category: 'seeds',
    variants: [
        { id: '25g', name: '25 г', price: 180 },
        { id: '50g', name: '50 г', price: 320 }
    ]
  },
  {
    id: 'seed-003',
    name: 'Семена Подсолнечника',
    description: 'Сочные, крупные ростки со вкусом семечек.',
    details: 'Самая популярная и сытная культура. Содержит полный набор незаменимых аминокислот, цинк и фолиевую кислоту. Идеально для кожи и волос. Требует замачивания перед посадкой.',
    price: 120,
    image: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?auto=format&fit=crop&q=80&w=800',
    category: 'seeds',
    variants: [
        { id: '50g', name: '50 г', price: 120 },
        { id: '150g', name: '150 г', price: 300 }
    ]
  },
  {
    id: 'seed-004',
    name: 'Микс "Салатный"',
    description: 'Сбалансированная смесь для идеального салата.',
    details: 'Состав: Капуста, Брокколи, Кольраби, Редис. Сбалансированный витаминный коктейль. Кольраби нормализует давление, а капуста выводит шлаки. Одновременная всхожесть для легкого сбора.',
    price: 200,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    category: 'seeds',
    variants: [
        { id: '30g', name: '30 г', price: 200 },
        { id: '60g', name: '60 г', price: 380 }
    ]
  },
  {
    id: 'acc-001',
    name: 'Льняные коврики (10 шт)',
    description: 'Экологически чистый субстрат для выращивания.',
    details: '100% натуральный лен. Антисептические свойства льна предотвращают плесень. Отлично удерживает влагу и позволяет корням дышать, обеспечивая быстрый рост без грязи. Размер 10х15 см.',
    price: 350,
    image: 'https://images.unsplash.com/photo-1596138252452-4500991e71d2?auto=format&fit=crop&q=80&w=800',
    category: 'accessories',
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-001',
    name: 'SmartGrow Controller V2',
    price: 2500,
    purpose: 'Автоматизация и управление',
    description: 'Центральный хаб управления фермой. Поддерживает Wi-Fi и USB. Управляет светом, поливом и вентиляцией по расписанию или датчикам.',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '2 Вт',
    powerRating: 'N/A'
  },
  {
    id: 'eq-002',
    name: 'Вентилятор AirFlow 120',
    price: 600,
    purpose: 'Вентиляция и циркуляция воздуха',
    description: 'Бесшумный вентилятор для предотвращения плесени и укрепления стеблей растений.',
    image: 'https://images.unsplash.com/photo-1575426193913-32d703e30321?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '1.5 Вт',
    powerRating: '1200 об/мин'
  },
  {
    id: 'eq-003',
    name: 'Music Box "Mozart"',
    price: 1800,
    purpose: 'Акустическая стимуляция',
    description: 'Модуль для проигрывания классической музыки и звуков природы. Способствует ускорению роста растений.',
    image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '3 Вт',
    powerRating: '5 Вт'
  },
  {
    id: 'eq-004',
    name: 'Система полива AquaPump',
    price: 800,
    purpose: 'Автоматический полив',
    description: 'Погружная помпа с системой трубок. Обеспечивает равномерный полив корневой зоны.',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '4 Вт',
    powerRating: '200 л/ч'
  },
  {
    id: 'eq-005',
    name: 'Термоковрик RootWarm',
    price: 900,
    purpose: 'Подогрев субстрата',
    description: 'Нагревательный мат для поддержания оптимальной температуры корневой системы. В комплекте термостат.',
    image: 'https://images.unsplash.com/photo-1519681393784-d8e5b5a4570e?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '10 Вт',
    powerRating: 'Макс 30°C'
  },
  {
    id: 'eq-006',
    name: 'Li-Ion Аккумулятор Pack',
    price: 1000,
    purpose: 'Автономное питание',
    description: 'Блок аккумуляторов для автономной работы фермы до 48 часов.',
    image: 'https://images.unsplash.com/photo-1619483878886-2f2e09f46d26?auto=format&fit=crop&q=80&w=800',
    powerConsumption: 'N/A',
    powerRating: '10000 mAh'
  },
  {
    id: 'eq-007',
    name: 'Блок питания PowerGrid',
    price: 500,
    purpose: 'Питание от сети',
    description: 'Надежный адаптер питания для подключения фермы к розетке 220В.',
    image: 'https://images.unsplash.com/photo-1561525140-c2a4cc68e4bd?auto=format&fit=crop&q=80&w=800',
    powerConsumption: 'N/A',
    powerRating: '12В 5А'
  },
  {
    id: 'eq-008',
    name: 'Датчик температуры (Внутр)',
    price: 300,
    purpose: 'Мониторинг климата',
    description: 'Высокоточный сенсор для измерения температуры воздуха внутри бокса.',
    image: 'https://images.unsplash.com/photo-1632053002928-4382b3a67e7e?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '0.1 Вт',
    powerRating: 'N/A'
  },
  {
    id: 'eq-009',
    name: 'Датчик влажности SoilSense',
    price: 350,
    purpose: 'Мониторинг влажности',
    description: 'Емкостной датчик влажности субстрата. Не подвержен коррозии.',
    image: 'https://images.unsplash.com/photo-1586289883499-f11d28f26141?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '0.1 Вт',
    powerRating: 'N/A'
  },
  {
    id: 'eq-010',
    name: 'Датчик освещения LuxMeter',
    price: 250,
    purpose: 'Контроль освещенности',
    description: 'Фоторезистор для автоматического включения досветки в темное время суток.',
    image: 'https://images.unsplash.com/photo-1584534456162-c66a3e856713?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '0.1 Вт',
    powerRating: 'N/A'
  },
  {
    id: 'eq-011',
    name: 'LED Фитолампа FullSpectrum',
    price: 1200,
    purpose: 'Освещение',
    description: 'Лампа полного спектра для активного фотосинтеза. Имитирует солнечный свет.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '15 Вт',
    powerRating: '1200 Люмен'
  },
  {
    id: 'eq-012',
    name: 'Таймер-Диммер EcoTime',
    price: 450,
    purpose: 'Автоматизация и управление',
    description: 'Простой таймер для управления светом без контроллера.',
    image: 'https://images.unsplash.com/photo-1522120691812-dcdfb625f397?auto=format&fit=crop&q=80&w=800',
    powerConsumption: '0.5 Вт',
    powerRating: '10А'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    userId: 'u-1',
    userName: 'Анна Петрова',
    rating: 5,
    comment: 'Потрясающий набор! Горошек вырос за 6 дней, дети в восторге.',
    date: '2023-10-15'
  },
  {
    id: 'rev-2',
    userId: 'u-2',
    userName: 'Дмитрий С.',
    rating: 4,
    comment: 'Качество хорошее, но доставка задержалась на день.',
    date: '2023-11-02'
  },
  {
    id: 'rev-3',
    userId: 'u-3',
    userName: 'Марина И.',
    rating: 5,
    comment: 'Давно хотела попробовать. Инструкция очень понятная, всё получилось с первого раза! Руккола просто огонь.',
    date: '2023-11-10'
  },
];

export const CONTACT_INFO = {
  phone: '+7 (999) 123-45-67',
  email: 'hello@microgreenlabs.ru',
  address: 'г. Москва, ул. Ботаническая, д. 10',
};