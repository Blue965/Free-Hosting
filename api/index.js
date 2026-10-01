const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Base de données SQLite (pour Vercel, utilisez /tmp)
const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite';
const db = new sqlite3.Database(dbPath);

// Initialiser la base de données
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        wispgg_api_key TEXT,
        discord_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        wispgg_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        ram INTEGER NOT NULL,
        disk INTEGER NOT NULL,
        cpu INTEGER NOT NULL,
        status TEXT DEFAULT 'offline',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token requis' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
            [email, username, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ message: 'Email déjà utilisé' });
                    }
                    return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
                }

                const token = jwt.sign(
                    { id: this.lastID, email, username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.status(201).json({
                    token,
                    user: { id: this.lastID, email, username }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur serveur' });
            }

            if (!user) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: { id: user.id, email: user.email, username: user.username }
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Routes utilisateur
app.get('/api/user', authenticateToken, (req, res) => {
    db.get('SELECT id, email, username, discord_id FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(user);
    });
});

app.put('/api/user/update', authenticateToken, async (req, res) => {
    const { email, username } = req.body;

    db.run(
        'UPDATE users SET email = ?, username = ? WHERE id = ?',
        [email, username, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
            }
            res.json({ message: 'Utilisateur mis à jour' });
        }
    );
});

app.put('/api/user/wispgg', authenticateToken, (req, res) => {
    const { wispggApiKey } = req.body;

    db.run(
        'UPDATE users SET wispgg_api_key = ? WHERE id = ?',
        [wispggApiKey, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la sauvegarde' });
            }
            res.json({ message: 'Configuration API sauvegardée' });
        }
    );
});

// Routes Wisp.gg
app.get('/api/servers', authenticateToken, async (req, res) => {
    try {
        const WISPGG_API_KEY = process.env.WISPGG_API_KEY;
        const WISPGG_API_URL = process.env.WISPGG_API_URL || 'https://api.wisp.gg';

        if (!WISPGG_API_KEY) {
            // Retourner les serveurs locaux si pas de config Wisp.gg
            db.all('SELECT * FROM servers WHERE user_id = ?', [req.user.id], (err, servers) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json(servers.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    limits: { memory: s.ram, disk: s.disk, cpu: s.cpu },
                    status: s.status
                })));
            });
            return;
        }

        // Récupérer les serveurs depuis Wisp.gg
        try {
            const response = await axios.get(`${WISPGG_API_URL}/servers`, {
                headers: {
                    'Authorization': `Bearer ${WISPGG_API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            const servers = response.data || [];
            res.json(servers.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type || 'discord-bot',
                limits: { memory: s.memory, disk: s.disk, cpu: s.cpu },
                status: s.status || 'offline'
            })));
        } catch (error) {
            console.error('Erreur Wisp.gg:', error.message);
            // Fallback to local servers
            db.all('SELECT * FROM servers WHERE user_id = ?', [req.user.id], (err, servers) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json(servers.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    limits: { memory: s.ram, disk: s.disk, cpu: s.cpu },
                    status: s.status
                })));
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.post('/api/servers', authenticateToken, async (req, res) => {
    try {
        const { name, type, ram, disk, cpu } = req.body;
        const WISPGG_API_KEY = process.env.WISPGG_API_KEY;
        const WISPGG_API_URL = process.env.WISPGG_API_URL || 'https://api.wisp.gg';

        // Créer le serveur localement
        db.run(
            'INSERT INTO servers (user_id, name, type, ram, disk, cpu, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, type, ram, disk, cpu || 100, 'offline'],
            function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Erreur lors de la création' });
                }

                // Si config Wisp.gg disponible, créer sur Wisp.gg aussi
                if (WISPGG_API_KEY) {
                    createWispServer({ name, type, ram, disk, cpu: cpu || 100 })
                        .then((wispServer) => {
                            // Update local server with Wisp.gg ID
                            db.run(
                                'UPDATE servers SET wispgg_id = ? WHERE id = ?',
                                [wispServer.id, this.lastID],
                                (err) => {
                                    if (err) console.error('Erreur update wispgg_id:', err);
                                }
                            );
                            res.json({ message: 'Serveur créé avec succès', id: this.lastID });
                        })
                        .catch(() => {
                            res.json({ message: 'Serveur créé localement', id: this.lastID });
                        });
                } else {
                    res.json({ message: 'Serveur créé localement', id: this.lastID });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

async function createWispServer(serverData) {
    const WISPGG_API_KEY = process.env.WISPGG_API_KEY;
    const WISPGG_API_URL = process.env.WISPGG_API_URL || 'https://api.wisp.gg';

    try {
        const response = await axios.post(`${WISPGG_API_URL}/servers`, {
            name: serverData.name,
            type: serverData.type || 'discord-bot',
            memory: serverData.ram,
            disk: serverData.disk,
            cpu: serverData.cpu
        }, {
            headers: {
                'Authorization': `Bearer ${WISPGG_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur création Wisp.gg:', error.message);
        throw error;
    }
}

app.post('/api/servers/:id/power', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const WISPGG_API_KEY = process.env.WISPGG_API_KEY;
        const WISPGG_API_URL = process.env.WISPGG_API_URL || 'https://api.wisp.gg';

        if (!WISPGG_API_KEY) {
            return res.status(400).json({ message: 'Configuration Wisp.gg requise' });
        }

        try {
            await axios.post(
                `${WISPGG_API_URL}/servers/${id}/power`,
                { action },
                {
                    headers: {
                        'Authorization': `Bearer ${WISPGG_API_KEY}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Mettre à jour le statut localement
            const statusMap = { start: 'running', stop: 'offline', restart: 'running', kill: 'offline' };
            db.run(
                'UPDATE servers SET status = ? WHERE id = ?',
                [statusMap[action] || 'offline', id],
                (err) => {
                    if (err) {
                        console.error('Erreur update statut:', err);
                    }
                }
            );

            res.json({ message: `Serveur ${action} avec succès` });
        } catch (error) {
            console.error('Erreur power action:', error.message);
            res.status(500).json({ message: 'Erreur lors de l\'action' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route OAuth Discord (placeholder)
app.get('/api/auth/discord', (req, res) => {
    // TODO: Implémenter l'OAuth Discord
    res.json({ message: 'OAuth Discord non implémenté encore' });
});

// Export pour Vercel
module.exports = app;
