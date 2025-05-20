// server.js (後端 API 範例 - Node.js/Express.js)
// 這個範例使用記憶體內儲存，實際應用中應使用資料庫。
// 並且需要更完善的錯誤處理和安全性。

const express = require('express');
const cors = require('cors'); // 用於處理跨來源資源共用
const bodyParser = require('body-parser'); // 用於解析請求主體
// const bcrypt = require('bcryptjs'); // 用於密碼加密 (實際應用中需要)
// const jwt = require('jsonwebtoken'); // 用於產生 JWT (實際應用中需要)

const app = express();
const PORT = process.env.PORT || 3000; // Render 會自動設定 PORT 環境變數

// --- 中介軟體 (Middleware) ---
app.use(cors()); // 允許所有來源的跨域請求 (開發時方便，生產環境應設定更嚴格的規則)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 模擬資料庫 (記憶體內儲存) ---
let users = [
    { id: 'user1', username: 'user1', password: 'password1', email: 'user1@example.com' },
    { id: 'user2', username: 'user2', password: 'password2', email: 'user2@example.com' },
    { id: 'test1', username: 'test1', password: 'test1', email: 'user3@example.com' },
];

let images = [
    { id: 'img001', url: 'https://placehold.co/600x450/a4a4a4/ffffff?text=圖片+A1', description: '風景圖 A1' },
    { id: 'img002', url: 'https://placehold.co/600x450/cccccc/ffffff?text=圖片+A2', description: '城市圖 A2' },
    { id: 'img003', url: 'https://placehold.co/600x450/999999/ffffff?text=圖片+A3', description: '動物圖 A3' },
    { id: 'img004', url: 'https://placehold.co/600x450/bbbbbb/ffffff?text=圖片+B1', description: '風景圖 B1' },
    { id: 'img005', url: 'https://placehold.co/600x450/dddddd/ffffff?text=圖片+B2', description: '城市圖 B2' },
];

let userImageAssignments = [
    { userId: 'user1', imageId: 'img001' },
    { userId: 'user1', imageId: 'img002' },
    { userId: 'user1', imageId: 'img003' },
    { userId: 'user2', imageId: 'img004' },
    { userId: 'user2', imageId: 'img005' },
];

let assessments = [];

// --- 模擬 JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-for-jwt-in-dev'; // 生產環境應使用環境變數

// --- 模擬中介軟體：驗證 JWT Token ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('Token not provided for request to:', req.path);
        return res.status(401).json({ message: '未提供認證 token' });
    }

    // 模擬 token 驗證 (非常不安全，僅為演示)
    if (token.startsWith('mock-token-for-')) {
        const userId = token.replace('mock-token-for-', '');
        const user = users.find(u => u.id === userId);
        if (user) {
            req.user = user;
            console.log(`User ${user.username} authenticated via mock token for request to: ${req.path}`);
            next();
        } else {
            console.log('Invalid mock token, user not found for request to:', req.path);
            return res.status(403).json({ message: '無效的 token 或使用者不存在' });
        }
    } else {
        console.log('Invalid token format for request to:', req.path);
        return res.status(403).json({ message: '無效的 token' });
    }
}

// --- API 路由 (Routes) ---
app.get('/api', (req, res) => {
    res.json({ message: '歡迎來到圖片評估系統 API！(後端運行中)' });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    if (!username || !password) {
        return res.status(400).json({ message: '請提供帳號和密碼' });
    }
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) { // 簡化密碼比較
        console.log(`Login failed for user: ${username}`);
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
    const mockToken = `mock-token-for-${user.id}`;
    console.log(`User ${username} logged in successfully. Token: ${mockToken}`);
    res.json({
        message: '登入成功',
        token: mockToken,
        user: { id: user.id, username: user.username, email: user.email }
    });
});

app.get('/api/images/my-images', authenticateToken, (req, res) => {
    const userId = req.user.id;
    console.log(`Fetching images for user: ${userId}`);
    const assignedImageIds = userImageAssignments
        .filter(assignment => assignment.userId === userId)
        .map(assignment => assignment.imageId);
    const userImages = images.filter(image => assignedImageIds.includes(image.id));
    console.log(`Found ${userImages.length} images for user ${userId}`);
    res.json(userImages);
});

app.post('/api/assessments', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { imageId, finalScale, finalTranslateX, finalTranslateY, responseText, timestamp } = req.body;
    console.log(`New assessment submission from user ${userId} for image ${imageId}`);
    if (!imageId || typeof finalScale === 'undefined' || typeof finalTranslateX === 'undefined' || typeof finalTranslateY === 'undefined' || !responseText) {
        return res.status(400).json({ message: '缺少必要的評估資料' });
    }
    const newAssessment = {
        assessmentId: `asm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        imageId,
        finalScale,
        finalTranslateX,
        finalTranslateY,
        responseText,
        submittedAt: timestamp || new Date().toISOString()
    };
    assessments.push(newAssessment);
    console.log('Assessment saved (in-memory):', newAssessment);
    res.status(201).json({ message: '評估已成功提交', assessment: newAssessment });
});

// --- 啟動伺服器 ---
app.listen(PORT, () => {
    console.log(`後端伺服器正在運行於 http://localhost:${PORT} 或 Render 指定的 port`);
    console.log('--- 模擬資料庫初始狀態 ---');
    console.log('Users:', users.map(u => ({id: u.id, username: u.username})));
    console.log('Images:', images.length);
    console.log('UserImageAssignments:', userImageAssignments.length);
    console.log('---------------------------');
});
