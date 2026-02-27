const pool = require('../../config/db');

exports.getNotes = async (req, res) => {
    try {
        const branchId = req.query.branch_id || req.user.branch_id;
        const employeeId = req.user.employee_id;
        const type = req.query.type || 'public'; // 'public' or 'private'
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        if (!branchId) {
            return res.status(400).json({ success: false, message: "Branch ID required" });
        }

        let query = `
            SELECT n.*, (e.first_name || ' ' || COALESCE(e.last_name, '')) as author_name 
            FROM reception_notes n
            JOIN employees e ON n.employee_id = e.employee_id
            WHERE n.branch_id = ? AND n.type = ?
        `;
        let params = [branchId, type];

        if (type === 'private') {
            query += " AND n.employee_id = ?";
            params.push(employeeId);
        }

        query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const [notes] = await pool.query(query, params);

        res.json({ success: true, notes, hasMore: notes.length === limit });
    } catch (error) {
        console.error("Fetch Notes Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addNote = async (req, res) => {
    try {
        const { branch_id, employee_id, content, type = 'public', mentions } = req.body;
        const file = req.file;

        if (!branch_id || !employee_id || (!content && !file)) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let attachment_path = null;
        let attachment_type = null;

        if (file) {
            // Store relative path for frontend
            attachment_path = 'uploads/note_attachments/' + file.filename;
            const mime = file.mimetype;
            if (mime.startsWith('image/')) attachment_type = 'image';
            else if (mime === 'application/pdf') attachment_type = 'pdf';
            else attachment_type = 'doc';
        }

        const [result] = await pool.query(`
            INSERT INTO reception_notes (branch_id, employee_id, content, type, attachment_path, attachment_type, mentions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [branch_id, employee_id, content || '', type, attachment_path, attachment_type, mentions || null]);

        res.json({
            success: true,
            message: "Note saved successfully",
            note_id: result.insertId
        });
    } catch (error) {
        console.error("Save Note Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user.employee_id;

        // Security: Can only delete own notes or if admin? For now, let's keep it simple but check ownership for private ones
        const [note] = await pool.query("SELECT * FROM reception_notes WHERE id = ?", [id]);

        if (note.length === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        if (note[0].employee_id !== employeeId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this note" });
        }

        await pool.query("DELETE FROM reception_notes WHERE id = ?", [id]);

        res.json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete Note Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBranchUsers = async (req, res) => {
    try {
        const branchId = req.query.branch_id || req.user.branch_id;
        if (!branchId) {
            return res.status(400).json({ success: false, message: "Branch ID required" });
        }

        const [users] = await pool.query(`
            SELECT 
                employee_id as id, 
                (first_name || ' ' || COALESCE(last_name, '')) as full_name,
                first_name as username,
                r.role_name as role
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
            WHERE e.branch_id = ? AND e.is_active = 1
            ORDER BY e.first_name ASC
        `, [branchId]);

        res.json({ success: true, users });
    } catch (error) {
        console.error("Fetch Branch Users Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
