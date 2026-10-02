const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'sankhla-opticals.json');
const AUTH_SECRET = process.env.AUTH_SECRET || 'development-only-change-before-production';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sankhla-local-admin-change-before-production';
const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const FREE_SHIPPING_AT = 2500;
const SHIPPING_FEE = 79;
const MAX_BODY_BYTES = 100_000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const PUBLIC_FILES = new Set(['index.html', 'admin.html', 'styles.css', 'app.js', 'admin.js', 'sw.js', 'manifest.webmanifest', 'robots.txt', 'assets/sankhla-opticals.svg']);

const DEFAULT_PRODUCTS = [
  { id: 'sankhla-noor-01', name: 'Noor acetate frame', category: 'Optical Frames', price: 3490, oldPrice: 4290, tag: 'BESTSELLER', rating: 4.9, reviews: 38, image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=85', description: 'A softly squared acetate silhouette, finished by hand for a comfortable fit from your first coffee to your last call.', features: ['Lightweight premium acetate', 'Prescription ready', 'Complimentary fitting in store'], colors: ['#49372e', '#c89b6b', '#282724'], stock: 18 },
  { id: 'sankhla-meher-02', name: 'Meher everyday optical', category: 'Optical Frames', price: 2890, oldPrice: null, tag: 'EVERYDAY ICON', rating: 4.8, reviews: 24, image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=900&q=85', description: 'An easy, refined frame with slender temples and a shape that works across everyday occasions.', features: ['Featherlight metal finish', 'Adjustable nose pads', 'Single vision or progressive lenses'], colors: ['#a77946', '#6c7477'], stock: 14 },
  { id: 'sankhla-aviator-03', name: 'Aviator 70 sun', category: 'Sunglasses', price: 3990, oldPrice: 4890, tag: 'SUN EDIT', rating: 4.9, reviews: 31, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85', description: 'A modern aviator with richly tinted lenses and enough character to become your everyday favourite.', features: ['UV400 protection', 'Lightweight metal frame', 'Polarised lens option in store'], colors: ['#272625', '#b48a56'], stock: 11 },
  { id: 'sankhla-rang-04', name: 'Rang statement sunnies', category: 'Sunglasses', price: 2590, oldPrice: null, tag: 'A LITTLE BOLD', rating: 4.7, reviews: 18, image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85', description: 'Confident curves and a warm tortoiseshell finish. Your quick way to pull a whole look together.', features: ['UV400 tinted lenses', 'Comfort-fit nose bridge', 'Comes with a protective case'], colors: ['#5b3827', '#c58763'], stock: 9 },
  { id: 'sankhla-kavya-05', name: 'Kavya soft-square', category: 'Optical Frames', price: 3190, oldPrice: null, tag: 'STAFF PICK', rating: 4.9, reviews: 22, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=85', description: 'A softly structured everyday frame that feels polished without trying too hard.', features: ['Hypoallergenic nose pads', 'Prescription ready', 'Free adjustments at every store'], colors: ['#61483e', '#9d7654'], stock: 16 },
  { id: 'sankhla-jade-06', name: 'Jade acetate optical', category: 'Optical Frames', price: 4290, oldPrice: 4990, tag: 'NEW ARRIVAL', rating: 4.8, reviews: 12, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85', description: 'Rich colour, considered details and a flattering shape that brings a little joy to desk days.', features: ['Hand-finished acetate', 'Prescription ready', 'Includes soft case and cloth'], colors: ['#506257', '#a34f42'], stock: 7 },
  { id: 'sankhla-clear-day-07', name: 'Clear Day daily lenses', category: 'Contact Lenses', price: 1290, oldPrice: null, tag: 'DAILY COMFORT', rating: 4.8, reviews: 19, image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=85', description: 'Soft daily disposable lenses for clear, comfortable vision through long days. Please order the prescription that your eye-care professional recommends.', features: ['30 lens daily pack', 'Comfortable all-day wear', 'Prescription required before fulfilment'], colors: [], stock: 25 },
  { id: 'sankhla-reader-08', name: 'Sunday reading glasses', category: 'Reading Glasses', price: 1190, oldPrice: null, tag: 'EASY ON THE EYES', rating: 4.7, reviews: 16, image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=900&q=85', description: 'A tidy, lightweight pair for the bedside table, the bookshop and wherever you like to slow down.', features: ['Available strengths: +1.00 to +3.50', 'Lightweight frame', 'Protective pouch included'], colors: ['#4b4038', '#766f60'], stock: 20 },
  { id: 'sankhla-sun-case-09', name: 'Everywhere glasses case', category: 'Accessories', price: 590, oldPrice: null, tag: 'LITTLE ESSENTIAL', rating: 4.6, reviews: 27, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85', description: 'A sturdy, soft-lined case that keeps your favourite pair protected at home and on the move.', features: ['Soft microfibre lining', 'Slim easy-carry shape', 'Includes a lens cleaning cloth'], colors: ['#59665a', '#bd8067'], stock: 35 }
];

const DEFAULT_STORES = [
  { id: 'udaipur-city', name: 'City Centre', city: 'Udaipur', address: 'Main market district · Udaipur, Rajasthan', hours: 'Mon – Sat, 10:00 – 20:00', phone: '+91 98765 43210', lat: 24.5854, lng: 73.7125, active: true },
  { id: 'jaipur-pink-city', name: 'Pink City', city: 'Jaipur', address: 'Central Jaipur · Rajasthan', hours: 'Mon – Sat, 10:30 – 20:30', phone: '+91 98765 43211', lat: 26.9124, lng: 75.7873, active: true },
  { id: 'jodhpur-old-town', name: 'Old Town', city: 'Jodhpur', address: 'Clock Tower district · Rajasthan', hours: 'Mon – Sat, 10:00 – 20:00', phone: '+91 98765 43212', lat: 26.2389, lng: 73.0243, active: true }
];

const DEFAULT_SETTINGS = {
  brand: 'Sankhla Opticals', tagline: 'A CLEARER KIND OF EVERYDAY', announcement: 'Complimentary eye tests · Thoughtful frames · Good people, always',
  heroEyebrow: 'A FRESHER WAY TO SEE', heroTitle: 'See life in a', heroAccent: 'clearer light.',
  heroDescription: 'Good-looking frames, thoughtful eye care, and a real person to help you find the right fit.',
  heroImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1400&q=90',
  contactEmail: 'hello@sankhlaopticals.in', phone: '+91 98765 43210', freeEyeTest: true,
  accent: '#344a3f', freeShippingAt: 2500, shippingFee: 79
};

function defaultDb() {
  return { products: structuredClone(DEFAULT_PRODUCTS), users: [], orders: [], appointments: [], stores: structuredClone(DEFAULT_STORES), settings: structuredClone(DEFAULT_SETTINGS) };
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) return defaultDb();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      products: Array.isArray(data.products) && data.products.length ? data.products : structuredClone(DEFAULT_PRODUCTS),
      users: Array.isArray(data.users) ? data.users : [],
      orders: Array.isArray(data.orders) ? data.orders : [],
      appointments: Array.isArray(data.appointments) ? data.appointments : [],
      stores: (Array.isArray(data.stores) ? data.stores : structuredClone(DEFAULT_STORES)).map(store => {
        const seed = DEFAULT_STORES.find(branch => branch.id === store.id);
        const validLat = typeof store.lat === 'number' && Number.isFinite(store.lat) && store.lat >= -90 && store.lat <= 90;
        const validLng = typeof store.lng === 'number' && Number.isFinite(store.lng) && store.lng >= -180 && store.lng <= 180;
        return { ...store, lat: validLat ? store.lat : seed?.lat ?? null, lng: validLng ? store.lng : seed?.lng ?? null };
      }),
      settings: { ...structuredClone(DEFAULT_SETTINGS), ...(data.settings && typeof data.settings === 'object' ? data.settings : {}) }
    };
  } catch (error) {
    console.error(`Could not read the Sankhla Opticals database: ${error.message}`);
    throw new Error('The shop database could not be read. Please check data/sankhla-opticals.json.');
  }
}

function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, DB_FILE);
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}

function passwordData(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}

function passwordMatches(password, saved) {
  if (!saved || typeof saved.salt !== 'string' || typeof saved.hash !== 'string') return false;
  const candidate = passwordData(password, saved.salt).hash;
  const left = Buffer.from(candidate, 'hex');
  const right = Buffer.from(saved.hash, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + TOKEN_LIFETIME_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function signAdminToken() {
  const payload = Buffer.from(JSON.stringify({ admin: true, exp: Date.now() + TOKEN_LIFETIME_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function safeSecretMatch(value) {
  const expected = Buffer.from(ADMIN_SECRET);
  const provided = Buffer.from(typeof value === 'string' ? value : '');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

function isAdmin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const separator = token.lastIndexOf('.');
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const wanted = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest();
  let provided;
  try { provided = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (provided.length !== wanted.length || !crypto.timingSafeEqual(provided, wanted)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.admin === true && Number.isFinite(decoded.exp) && decoded.exp > Date.now();
  } catch { return false; }
}

function userFrom(req, db) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const wanted = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest();
  let provided;
  try { provided = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (provided.length !== wanted.length || !crypto.timingSafeEqual(provided, wanted)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.sub || !Number.isFinite(decoded.exp) || decoded.exp <= Date.now()) return null;
    return db.users.find(user => user.id === decoded.sub) || null;
  } catch { return null; }
}

function publicUser(user) { return { id: user.id, name: user.name, email: user.email }; }
function clean(value, max = 120) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        tooLarge = true;
        raw = '';
        reject(Object.assign(new Error('That request is too large.'), { status: 413 }));
        req.resume();
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reject(Object.assign(new Error('Please send a JSON object.'), { status: 400 }));
        resolve(parsed);
      }
      catch { reject(Object.assign(new Error('Please send valid JSON.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function orderNumber() {
  return `SO-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function safeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    store: order.store || null,
    address: order.address,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt
  };
}

function adminProductInput(input, existing = {}) {
  const name = clean(input.name ?? existing.name, 100);
  const category = clean(input.category ?? existing.category, 30);
  const price = Number(input.price ?? existing.price);
  const oldPriceInput = input.oldPrice === undefined ? existing.oldPrice : input.oldPrice;
  const oldPrice = oldPriceInput === '' || oldPriceInput === null || oldPriceInput === undefined ? null : Number(oldPriceInput);
  const stock = Number(input.stock ?? existing.stock);
  const image = clean(input.image ?? existing.image, 1000);
  const description = clean(input.description ?? existing.description, 500);
  const tag = clean(input.tag ?? existing.tag ?? '', 40);
  const active = input.active === undefined ? existing.active !== false : input.active === true;
  if (name.length < 2 || !['Optical Frames', 'Sunglasses', 'Contact Lenses', 'Reading Glasses', 'Accessories'].includes(category) || !Number.isSafeInteger(price) || price < 1 || price > 10000000 || (oldPrice !== null && (!Number.isSafeInteger(oldPrice) || oldPrice <= price || oldPrice > 10000000)) || !Number.isInteger(stock) || stock < 0 || stock > 100000 || image.length < 10 || description.length < 10) return null;
  try {
    const imageUrl = new URL(image);
    if (!['http:', 'https:'].includes(imageUrl.protocol)) return null;
  } catch { return null; }
  const colors = Array.isArray(input.colors) ? input.colors.map(color => clean(color, 24)).filter(Boolean).slice(0, 6) : (existing.colors || []);
  const features = Array.isArray(input.features) ? input.features.map(feature => clean(feature, 90)).filter(Boolean).slice(0, 8) : (existing.features || []);
  return { name, category, price, oldPrice, stock, image, description, tag, active, colors, features };
}

function cleanStore(input, existing = {}) {
  const coordinate = (value, fallback, min, max) => {
    const raw = value === undefined ? fallback : value;
    if (raw === null || raw === '') return null;
    const number = Number(raw);
    return Number.isFinite(number) && number >= min && number <= max ? number : NaN;
  };
  const store = {
    name: clean(input.name ?? existing.name, 60), city: clean(input.city ?? existing.city, 60),
    address: clean(input.address ?? existing.address, 160), hours: clean(input.hours ?? existing.hours, 100),
    phone: clean(input.phone ?? existing.phone, 24),
    lat: coordinate(input.lat, existing.lat ?? null, -90, 90), lng: coordinate(input.lng, existing.lng ?? null, -180, 180),
    active: input.active === undefined ? existing.active !== false : input.active === true
  };
  const validCoordinates = Number.isNaN(store.lat) === false && Number.isNaN(store.lng) === false && (store.lat === null) === (store.lng === null);
  return store.name.length >= 2 && store.city.length >= 2 && store.address.length >= 5 && store.hours.length >= 3 && store.phone.length >= 7 && validCoordinates ? store : null;
}

function safeAppointment(appointment) {
  return { id: appointment.id, reference: appointment.reference, name: appointment.name, email: appointment.email,
    phone: appointment.phone, store: appointment.store, date: appointment.date, time: appointment.time,
    reason: appointment.reason, status: appointment.status, createdAt: appointment.createdAt };
}

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });

  if (req.method === 'GET' && url.pathname === '/api/products') {
    const db = readDb();
    const category = clean(url.searchParams.get('category') || '', 30);
    const query = clean(url.searchParams.get('q') || '', 80).toLowerCase();
    const result = db.products.filter(product => product.active !== false && (!category || product.category === category) && (!query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)));
    return json(res, 200, { products: result.map(({ rating, reviews, ...product }) => product),
      settings: db.settings, stores: db.stores.filter(store => store.active !== false) });
  }

  if (req.method === 'POST' && url.pathname === '/api/appointments') {
    const db = readDb();
    if (!db.settings.freeEyeTest) return json(res, 403, { error: 'Online eye-test bookings are temporarily unavailable. Please call a store.' });
    const input = await readBody(req);
    const name = clean(input.name, 80);
    const email = clean(input.email, 120).toLowerCase();
    const phone = clean(input.phone, 24);
    const store = db.stores.find(entry => entry.id === input.storeId && entry.active !== false);
    const date = clean(input.date, 10);
    const time = clean(input.time, 8);
    const reason = clean(input.reason || 'General eye check', 180);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const nowDay = new Date(); nowDay.setUTCHours(0, 0, 0, 0);
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^[+0-9 ()-]{10,24}$/.test(phone) || !store || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dayStart.valueOf()) || dayStart <= nowDay || dayStart > new Date(Date.now() + 90 * 86400000) || !['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'].includes(time) || reason.length < 3) {
      return json(res, 400, { error: 'Please check your details, shop, date and available appointment time.' });
    }
    const appointment = {
      id: crypto.randomUUID(), reference: `SO-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      userId: userFrom(req, db)?.id || null, name, email, phone,
      store: { id: store.id, name: store.name, city: store.city, address: store.address }, date, time, reason,
      status: 'Requested', createdAt: new Date().toISOString()
    };
    db.appointments.push(appointment);
    writeDb(db);
    return json(res, 201, { appointment: safeAppointment(appointment) });
  }

  if ((req.method === 'POST') && (url.pathname === '/api/auth/register' || url.pathname === '/api/auth/login')) {
    const input = await readBody(req);
    const email = clean(input.email, 120).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 200) {
      return json(res, 400, { error: 'Enter a valid email and a password of at least 8 characters.' });
    }
    const db = readDb();
    if (url.pathname === '/api/auth/register') {
      const name = clean(input.name, 80);
      if (name.length < 2) return json(res, 400, { error: 'Please enter your name to create an account.' });
      if (db.users.some(user => user.email === email)) return json(res, 409, { error: 'That email already has an account. Sign in instead.' });
      const user = { id: crypto.randomUUID(), name, email, passwordData: passwordData(password), createdAt: new Date().toISOString() };
      db.users.push(user);
      writeDb(db);
      return json(res, 201, { token: signToken(user), user: publicUser(user) });
    }
    const user = db.users.find(entry => entry.email === email);
    if (!user || !passwordMatches(password, user.passwordData)) return json(res, 401, { error: 'The email and password don’t match. Please try again.' });
    return json(res, 200, { token: signToken(user), user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    const input = await readBody(req);
    if (!safeSecretMatch(input.secret)) return json(res, 401, { error: 'That owner key doesn’t match. Please try again.' });
    return json(res, 200, { token: signAdminToken() });
  }

  if (url.pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(res, 401, { error: 'Enter the owner key to manage your shop.' });
    const db = readDb();
    if (req.method === 'GET' && url.pathname === '/api/admin/overview') {
      const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(safeOrder);
      const appointments = [...db.appointments].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).map(safeAppointment);
      return json(res, 200, { products: db.products, orders, appointments, stores: db.stores, settings: db.settings, stats: { products: db.products.filter(product => product.active !== false).length, orders: orders.length, revenue: orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0), awaiting: orders.filter(order => ['Placed', 'Processing'].includes(order.status)).length, appointments: appointments.filter(appointment => appointment.status === 'Requested').length, outOfStock: db.products.filter(product => product.active !== false && product.stock < 1).length } });
    }
    if (req.method === 'PATCH' && url.pathname === '/api/admin/settings') {
      const input = await readBody(req);
      const next = { ...db.settings };
      for (const field of ['brand', 'tagline', 'announcement', 'heroEyebrow', 'heroTitle', 'heroAccent', 'heroDescription', 'heroImage', 'contactEmail', 'phone']) {
        if (input[field] !== undefined) next[field] = clean(input[field], field === 'heroImage' ? 1000 : field === 'heroDescription' ? 240 : 120);
      }
      if (input.freeEyeTest !== undefined) next.freeEyeTest = input.freeEyeTest === true;
      if (input.accent !== undefined) next.accent = /^#[0-9a-f]{6}$/i.test(input.accent) ? input.accent : '';
      if (input.freeShippingAt !== undefined) next.freeShippingAt = Number(input.freeShippingAt);
      if (input.shippingFee !== undefined) next.shippingFee = Number(input.shippingFee);
      if (next.brand.length < 2 || next.tagline.length < 3 || next.announcement.length < 4 || next.heroTitle.length < 3 || next.heroAccent.length < 2 || next.heroDescription.length < 10 || !/^\S+@\S+\.\S+$/.test(next.contactEmail) || next.phone.length < 7 || !/^#[0-9a-f]{6}$/i.test(next.accent) || !Number.isSafeInteger(next.freeShippingAt) || next.freeShippingAt < 0 || next.freeShippingAt > 1000000 || !Number.isSafeInteger(next.shippingFee) || next.shippingFee < 0 || next.shippingFee > 100000) {
        return json(res, 400, { error: 'Please check the shop name, storefront copy, contact details, accent colour and delivery amounts.' });
      }
      try { const image = new URL(next.heroImage); if (!['http:', 'https:'].includes(image.protocol)) throw new Error(); }
      catch { return json(res, 400, { error: 'Please enter a full HTTPS or HTTP hero image URL.' }); }
      db.settings = next;
      writeDb(db);
      return json(res, 200, { settings: db.settings });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/stores') {
      const input = await readBody(req);
      const values = cleanStore(input);
      if (!values || values.lat === null || values.lng === null) return json(res, 400, { error: 'Add the shop name, city, address, hours, phone, and valid latitude and longitude.' });
      let id = `${values.city}-${values.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || crypto.randomBytes(5).toString('hex');
      if (db.stores.some(store => store.id === id)) id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
      const store = { id, ...values };
      db.stores.push(store);
      writeDb(db);
      return json(res, 201, { store });
    }
    const storeMatch = url.pathname.match(/^\/api\/admin\/stores\/([^/]+)$/);
    if ((req.method === 'PATCH' || req.method === 'DELETE') && storeMatch) {
      let storeId;
      try { storeId = decodeURIComponent(storeMatch[1]); } catch { return json(res, 400, { error: 'That shop reference is not valid.' }); }
      const store = db.stores.find(entry => entry.id === storeId);
      if (!store) return json(res, 404, { error: 'That shop could not be found.' });
      if (req.method === 'DELETE') {
        if (db.stores.filter(entry => entry.active !== false).length < 2 && store.active !== false) return json(res, 409, { error: 'Keep at least one shop open.' });
        store.active = false;
        writeDb(db);
        return json(res, 200, { store });
      }
      const input = await readBody(req);
      const values = cleanStore(input, store);
      if (!values) return json(res, 400, { error: 'Check the shop name, city, full address, hours and phone.' });
      if (values.active === false && store.active !== false && db.stores.filter(entry => entry.active !== false).length < 2) return json(res, 409, { error: 'Keep at least one shop open.' });
      Object.assign(store, values);
      writeDb(db);
      return json(res, 200, { store });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/products') {
      const input = await readBody(req);
      const values = adminProductInput(input, { stock: 0, colors: [], features: [] });
      if (!values) return json(res, 400, { error: 'Check the product name, eyewear category, price, sale price, stock, image link and description.' });
      let id = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || crypto.randomBytes(5).toString('hex');
      if (db.products.some(product => product.id === id)) id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
      const product = { id, rating: 5, reviews: 0, ...values };
      db.products.push(product);
      writeDb(db);
      return json(res, 201, { product });
    }
    const productMatch = url.pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
    if (req.method === 'PATCH' && productMatch) {
      let productId;
      try { productId = decodeURIComponent(productMatch[1]); } catch { return json(res, 400, { error: 'That product reference is not valid.' }); }
      const product = db.products.find(entry => entry.id === productId);
      if (!product) return json(res, 404, { error: 'That product is not in the catalogue.' });
      const input = await readBody(req);
      const values = adminProductInput(input, product);
      if (!values) return json(res, 400, { error: 'Check the product name, eyewear category, price, sale price, stock, image link and description.' });
      Object.assign(product, values);
      writeDb(db);
      return json(res, 200, { product });
    }
    const orderMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (req.method === 'PATCH' && orderMatch) {
      let orderId;
      try { orderId = decodeURIComponent(orderMatch[1]); } catch { return json(res, 400, { error: 'That order reference is not valid.' }); }
      const order = db.orders.find(entry => entry.id === orderId);
      if (!order) return json(res, 404, { error: 'That order could not be found.' });
      const input = await readBody(req);
      if (!['Placed', 'Processing', 'Shipped', 'Delivered'].includes(input.status)) return json(res, 400, { error: 'Choose Placed, Processing, Shipped or Delivered as the order status.' });
      order.status = input.status;
      order.updatedAt = new Date().toISOString();
      writeDb(db);
      return json(res, 200, { order: safeOrder(order) });
    }
    const appointmentMatch = url.pathname.match(/^\/api\/admin\/appointments\/([^/]+)$/);
    if (req.method === 'PATCH' && appointmentMatch) {
      let appointmentId;
      try { appointmentId = decodeURIComponent(appointmentMatch[1]); } catch { return json(res, 400, { error: 'That appointment reference is not valid.' }); }
      const appointment = db.appointments.find(entry => entry.id === appointmentId);
      if (!appointment) return json(res, 404, { error: 'That appointment could not be found.' });
      const input = await readBody(req);
      if (!['Requested', 'Confirmed', 'Completed', 'Cancelled'].includes(input.status)) return json(res, 400, { error: 'Choose Requested, Confirmed, Completed or Cancelled as the appointment status.' });
      appointment.status = input.status;
      appointment.updatedAt = new Date().toISOString();
      writeDb(db);
      return json(res, 200, { appointment: safeAppointment(appointment) });
    }
    return json(res, 404, { error: 'That owner tool was not found.' });
  }

  const protectedRoute = url.pathname === '/api/me' || url.pathname === '/api/orders';
  if (!protectedRoute) return json(res, 404, { error: 'That shop page was not found.' });
  const db = readDb();
  const user = userFrom(req, db);
  if (!user) return json(res, 401, { error: 'Please sign in to continue.' });

  if (req.method === 'GET' && url.pathname === '/api/me') return json(res, 200, { user: publicUser(user) });

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    const orders = db.orders.filter(order => order.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(safeOrder);
    return json(res, 200, { orders });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const input = await readBody(req);
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) return json(res, 400, { error: 'Add at least one item to your bag before checking out.' });
    if (input.paymentMethod !== 'cod') return json(res, 400, { error: 'Cash on delivery is the payment method available right now.' });
    const addressInput = input.address || {};
    const address = {
      fullName: clean(addressInput.fullName, 80),
      phone: clean(addressInput.phone, 20),
      email: clean(addressInput.email, 120).toLowerCase(),
      address: clean(addressInput.address, 180),
      city: clean(addressInput.city, 70),
      state: clean(addressInput.state, 70),
      pincode: clean(addressInput.pincode, 6)
    };
    const digits = address.phone.replace(/\D/g, '');
    if (address.fullName.length < 2 || digits.length < 10 || digits.length > 13 || !/^\S+@\S+\.\S+$/.test(address.email) || address.address.length < 4 || address.city.length < 2 || address.state.length < 2 || !/^\d{6}$/.test(address.pincode)) {
      return json(res, 400, { error: 'Please check your name, contact number, delivery address and 6-digit PIN code.' });
    }
    const requested = new Map();
    for (const rawItem of input.items) {
      const productId = clean(rawItem?.productId, 80);
      const quantity = Number(rawItem?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return json(res, 400, { error: 'One of the bag quantities is not valid. Please adjust your bag.' });
      requested.set(productId, (requested.get(productId) || 0) + quantity);
    }
    if ([...requested.values()].some(quantity => quantity > 20)) return json(res, 400, { error: 'Please keep each item quantity to 20 or fewer.' });

    const orderItems = [];
    let orderSubtotal = 0;
    for (const [productId, quantity] of requested.entries()) {
      const product = db.products.find(entry => entry.id === productId && entry.active !== false);
      if (!product) return json(res, 400, { error: 'One item in your bag is no longer available. Please refresh and try again.' });
      if (quantity > product.stock) return json(res, 409, { error: `We only have ${product.stock} ${product.name} in stock. Please update your bag.` });
      const lineTotal = product.price * quantity;
      if (!Number.isSafeInteger(lineTotal)) return json(res, 400, { error: 'One item in your bag has an invalid price.' });
      orderSubtotal += lineTotal;
      orderItems.push({ productId: product.id, name: product.name, category: product.category, image: product.image, quantity, unitPrice: product.price, lineTotal });
    }
    if (!Number.isSafeInteger(orderSubtotal) || orderSubtotal <= 0) return json(res, 400, { error: 'That order total doesn’t look right. Please review your bag.' });
    const store = db.stores.find(entry => entry.id === input.storeId && entry.active !== false);
    if (!store) return json(res, 400, { error: 'Choose one of our open shops for this order.' });
    const freeShippingAt = Number.isFinite(Number(db.settings.freeShippingAt)) ? Number(db.settings.freeShippingAt) : FREE_SHIPPING_AT;
    const shipping = orderSubtotal >= freeShippingAt ? 0 : Number(db.settings.shippingFee ?? SHIPPING_FEE);
    const order = {
      id: crypto.randomUUID(),
      orderNumber: orderNumber(),
      userId: user.id,
      store: { id: store.id, name: store.name, city: store.city },
      items: orderItems,
      address,
      subtotal: orderSubtotal,
      shipping,
      total: orderSubtotal + shipping,
      paymentMethod: 'Cash on delivery',
      status: 'Placed',
      createdAt: new Date().toISOString()
    };
    for (const item of orderItems) db.products.find(product => product.id === item.productId).stock -= item.quantity;
    db.orders.push(order);
    writeDb(db);
    return json(res, 201, { order: safeOrder(order) });
  }

  return json(res, 405, { error: 'That shop action is not available.' });
}

function serveFile(req, res, url) {
  let relative;
  try { relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname === '/admin' ? '/admin.html' : url.pathname); }
  catch { return json(res, 400, { error: 'Invalid URL.' }); }
  const publicPath = relative.replace(/^[\\/]+/, '').replace(/\\/g, '/');
  if (!PUBLIC_FILES.has(publicPath)) return json(res, 404, { error: 'That shop page was not found.' });
  const file = path.resolve(ROOT, `.${relative}`);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) return json(res, 403, { error: 'Forbidden.' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res, 404, { error: 'That shop page was not found.' });
  const headers = { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
  if (path.extname(file) === '.html') headers['Cache-Control'] = 'no-cache';
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost';
  let url;
  try { url = new URL(req.url, `http://${host}`); }
  catch { return json(res, 400, { error: 'Invalid URL.' }); }
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'That shop action is not available.' });
    return serveFile(req, res, url);
  } catch (error) {
    console.error(error);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
  }
});

function start(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Sankhla Opticals is running at http://localhost:${port}`);
    if (AUTH_SECRET === 'development-only-change-before-production') console.warn('Set AUTH_SECRET to a long random value before deploying this shop publicly.');
    if (ADMIN_SECRET === 'sankhla-local-admin-change-before-production') console.warn('Set ADMIN_SECRET to a private owner key before deploying this shop publicly.');
  });
}

server.once('error', error => {
  if (error.code === 'EADDRINUSE' && PORT === 8080) {
    console.warn('Port 8080 is busy; starting Sankhla Opticals at http://localhost:3000 instead.');
    start(3000);
  } else {
    console.error(`Could not start Sankhla Opticals: ${error.message}`);
    process.exitCode = 1;
  }
});

start(PORT);

