import { Router } from 'express';
import dotenv from 'dotenv';
dotenv.config();
const router = Router();
router.get('/ice', (req, res) => {
    const iceServer = process.env.STUN_URL;
    res.json({ url: [iceServer] });
});
export default router;
//# sourceMappingURL=ice.js.map