const crypto = require('crypto');
const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Constants
const ENCRYPTION_METHOD = 'aes-256-cbc';
const ENCRYPTION_KEY = '2L92k78hExeiUiS1xQTBP8VQciGyLcAQkNPNWilGgC0'; // From legacy config.php

// Helper: Encrypt
function encryptMessage(plaintext, key) {
    if (!plaintext) return '';
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ENCRYPTION_METHOD, key.substring(0, 32), iv);
        let encrypted = cipher.update(plaintext);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Match PHP: base64_encode($iv) . ':' . base64_encode(base64_encode($raw_ciphertext)) ??
        // Actually PHP openssl_encrypt returns Base64 by default.
        // So PHP stores: Base64(IV) : Base64( Base64(RawCiphertext) )

        const b64Ciphertext = encrypted.toString('base64');
        return iv.toString('base64') + ':' + Buffer.from(b64Ciphertext).toString('base64');
    } catch (e) {
        console.error("Encryption Error:", e);
        return '';
    }
}

// Helper: Decrypt
function decryptMessage(payload, key) {
    if (!payload || !payload.includes(':')) return false;
    try {
        const parts = payload.split(':');
        const iv = Buffer.from(parts[0], 'base64');

        // PHP stored Base64( Base64(RawCiphertext) )
        // So first decode unwraps the outer Base64
        const innerBase64 = Buffer.from(parts[1], 'base64').toString('utf8');

        // Now we have the output of openssl_encrypt which is Base64 string
        const encryptedText = Buffer.from(innerBase64, 'base64');

        const decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, key.substring(0, 32), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption Error:", e);
        return false;
    }
}

// Controller Methods

// 1. GET USERS
exports.getUsers = async (req, res) => {
    const branchId = req.query.branch_id || (req.user ? req.user.branch_id : 0);
    const currentEmployeeId = req.query.employee_id || (req.user ? req.user.employee_id : 0);

    if (!branchId || !currentEmployeeId) {
        return res.json({ success: false, message: 'Missing branch_id or employee_id' });
    }

    try {
        const [users] = await pool.query(`
            SELECT 
                e.employee_id as id,
                e.first_name as username,
                e.first_name as full_name,
                r.role_name as role,
                (
                    SELECT COUNT(*) FROM chat_messages cm 
                    WHERE cm.sender_employee_id = e.employee_id 
                    AND cm.receiver_employee_id = ? 
                    AND cm.is_read = 0
                ) as unread_count
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
            WHERE e.branch_id = ? AND e.employee_id != ? AND e.is_active = 1
            ORDER BY e.first_name ASC
        `, [currentEmployeeId, branchId, currentEmployeeId]);

        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, message: 'Database error: ' + error.message });
    }
};

// 2. SEND MESSAGE
exports.sendMessage = async (req, res) => {
    // Handling multipart form data for file uploads would require middleware like 'multer'.
    // Assuming for now simple JSON/Text or verifying if Multer is needed.
    // The PHP handled $_FILES. We need multer for file support.
    // For this step, I'll implement the logic assuming req.body and req.file are populated (by Multer).

    // We will need to configure router with multer for this endpoint.

    const senderId = req.body.sender_id || (req.user ? req.user.employee_id : 0);
    const receiverId = req.body.receiver_id;
    const branchId = req.body.branch_id || (req.user ? req.user.branch_id : 0);
    const senderName = req.body.sender_name || 'Unknown';
    const messageText = req.body.message_text;
    const file = req.file;

    if (!senderId || !receiverId) {
        return res.json({ success: false, message: 'Missing sender or receiver ID' });
    }

    let messageType = 'text';
    let messageContent = '';

    try {
        // --- Handle File Upload ---
        if (file) {
            // Validate size/type if not already done by multer (Multer filter is better)
            // Assuming authorized by middleware

            // Generate public relative path - Matches PHP path structure
            // PHP: admin/desktop/server/uploads/chat_uploads/filename
            // Node: We save to ../../uploads/chat_uploads relative to this file

            // Multer saves to disk; we just need to get the filename and construct path
            // Assuming Multer destination is set to project_root/uploads/chat_uploads
            const uniqueFilename = file.filename;
            messageContent = 'admin/desktop/server/uploads/chat_uploads/' + uniqueFilename;

            const mime = file.mimetype;
            if (mime.startsWith('image/')) messageType = 'image';
            else if (mime === 'application/pdf') messageType = 'pdf';
            else messageType = 'doc';

        } else if (messageText && messageText.trim() !== '') {
            messageType = 'text';
            messageContent = encryptMessage(messageText.trim(), ENCRYPTION_KEY);
        } else {
            return res.json({ success: false, message: 'Message cannot be empty.' });
        }

        const [result] = await pool.query(`
            INSERT INTO chat_messages (sender_employee_id, receiver_employee_id, message_type, message_text) 
            VALUES (?, ?, ?, ?)
        `, [senderId, receiverId, messageType, messageContent]);

        const messageId = result.insertId;

        // Notification
        const notificationMessage = (messageType === 'text')
            ? "New message from " + senderName
            : "Sent you a file (" + messageType + ")";
        const linkUrl = "chat_with_employee_id:" + senderId;

        await pool.query(`
            INSERT INTO notifications (employee_id, created_by_employee_id, branch_id, message, link_url) 
            VALUES (?, ?, ?, ?, ?)
        `, [receiverId, senderId, branchId, notificationMessage, linkUrl]);

        res.json({ success: true, message_id: messageId });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. FETCH MESSAGES
exports.fetchMessages = async (req, res) => {
    const currentEmployeeId = req.query.employee_id || (req.user ? req.user.employee_id : 0);
    const partnerId = req.query.partner_id;

    if (!currentEmployeeId || !partnerId) {
        return res.json({ success: false, message: 'Missing employee_id or partner_id' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [messages] = await connection.query(`
            SELECT message_id, sender_employee_id, message_type, message_text, created_at, is_read 
            FROM chat_messages
            WHERE (sender_employee_id = ? AND receiver_employee_id = ?)
               OR (sender_employee_id = ? AND receiver_employee_id = ?)
            ORDER BY created_at ASC
        `, [currentEmployeeId, partnerId, partnerId, currentEmployeeId]);

        // Decrypt
        const decryptedMessages = messages.map(msg => {
            if (msg.message_type === 'text') {
                const decrypted = decryptMessage(msg.message_text, ENCRYPTION_KEY);
                msg.message_text = decrypted !== false ? decrypted : '[Decryption failed]';
            }
            msg.is_sender = (msg.sender_employee_id == currentEmployeeId);
            // created_at is likely already a Date object from mysql2
            return msg;
        });

        // Mark as Read
        await connection.query(`
            UPDATE chat_messages SET is_read = 1 
            WHERE sender_employee_id = ? AND receiver_employee_id = ? AND is_read = 0
        `, [partnerId, currentEmployeeId]);

        await connection.query(`
            UPDATE notifications SET is_read = 1 
            WHERE employee_id = ? AND created_by_employee_id = ? AND is_read = 0
        `, [currentEmployeeId, partnerId]);

        await connection.commit();
        res.json({ success: true, messages: decryptedMessages });
    } catch (error) {
        await connection.rollback();
        console.error("Fetch Messages Error:", error);
        res.json({ success: false, message: 'Could not retrieve messages.' });
    } finally {
        connection.release();
    }
};

// 4. UNREAD COUNT
exports.unreadCount = async (req, res) => {
    const employeeId = req.query.employee_id || (req.user ? req.user.employee_id : 0);
    if (!employeeId) return res.json({ success: false, message: 'Missing employee_id' });

    try {
        const [rows] = await pool.query(`
            SELECT COUNT(*) as unread_count 
            FROM chat_messages 
            WHERE receiver_employee_id = ? AND is_read = 0
        `, [employeeId]);

        res.json({ success: true, unread_count: rows[0].unread_count });
    } catch (error) {
        res.json({ success: false, message: 'Database error' });
    }
};
