const pool = require('../../config/db');

exports.handleServicesRequest = async (req, res) => {
    const method = req.method;

    try {
        switch (method) {
            case 'GET':
                await getServices(req, res);
                break;
            case 'POST':
                await createService(req, res);
                break;
            case 'PUT':
                await updateService(req, res);
                break;
            case 'DELETE':
                await deleteService(req, res);
                break;
            default:
                res.status(405).json({ status: 'error', message: 'Method not allowed' });
        }
    } catch (error) {
        console.error("Services Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const mapTrack = (track) => {
    if (!track) return null;
    return {
        id: track.id,
        name: track.name,
        buttonLabel: track.button_label,
        icon: track.icon,
        themeColor: track.theme_color,
        fields: typeof track.fields === 'string' ? JSON.parse(track.fields) : track.fields,
        pricing: typeof track.pricing === 'string' ? JSON.parse(track.pricing) : track.pricing,
        scheduling: typeof track.scheduling === 'string' ? JSON.parse(track.scheduling) : track.scheduling,
        permissions: typeof track.permissions === 'string' ? JSON.parse(track.permissions) : track.permissions,
        isActive: Boolean(track.is_active)
    };
};

async function getServices(req, res) {
    const id = req.query.id;
    if (id) {
        const [rows] = await pool.query("SELECT * FROM service_tracks WHERE id = ?", [id]);
        if (rows.length > 0) {
            res.json({ status: 'success', data: mapTrack(rows[0]) });
        } else {
            res.status(404).json({ status: 'error', message: 'Track not found' });
        }
    } else {
        const [rows] = await pool.query("SELECT * FROM service_tracks ORDER BY id DESC");
        const mappedTracks = rows.map(mapTrack);
        res.json({ status: 'success', data: mappedTracks });
    }
}

async function createService(req, res) {
    const input = req.body;

    // JSON strings for JSON columns
    const fields = JSON.stringify(input.fields);
    const pricing = JSON.stringify(input.pricing);
    const scheduling = JSON.stringify(input.scheduling);
    const permissions = JSON.stringify(input.permissions);
    const isActive = input.isActive ? 1 : 0;

    const [result] = await pool.query(
        "INSERT INTO service_tracks (name, button_label, icon, theme_color, fields, pricing, scheduling, permissions, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [input.name, input.buttonLabel, input.icon, input.themeColor, fields, pricing, scheduling, permissions, isActive]
    );

    res.json({ status: 'success', message: 'Track created', id: result.insertId });
}

async function updateService(req, res) {
    const input = req.body;
    if (!input || !input.id) {
        return res.status(400).json({ status: 'error', message: 'Invalid input or missing ID' });
    }

    const fields = JSON.stringify(input.fields);
    const pricing = JSON.stringify(input.pricing);
    const scheduling = JSON.stringify(input.scheduling);
    const permissions = JSON.stringify(input.permissions);
    const isActive = input.isActive ? 1 : 0;

    await pool.query(
        "UPDATE service_tracks SET name = ?, button_label = ?, icon = ?, theme_color = ?, fields = ?, pricing = ?, scheduling = ?, permissions = ?, is_active = ? WHERE id = ?",
        [input.name, input.buttonLabel, input.icon, input.themeColor, fields, pricing, scheduling, permissions, isActive, input.id]
    );

    res.json({ status: 'success', message: 'Track updated' });
}

async function deleteService(req, res) {
    const id = req.query.id;
    if (!id) {
        // Try getting id from body if not in query (for delete method often used with params but sometimes body)
        // Express standard 'DELETE' requests usually have params.
        return res.status(400).json({ status: 'error', message: 'Missing ID' });
    }

    await pool.query("DELETE FROM service_tracks WHERE id = ?", [id]);
    res.json({ status: 'success', message: 'Track deleted' });
}
